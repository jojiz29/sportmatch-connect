import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import Stripe from "stripe";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: any = null;
  private readonly stripeWebhookSecret: string | null = null;

  constructor(private readonly prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: "2022-11-15" as any,
      });
      this.stripeWebhookSecret = webhookSecret || null;
      this.logger.log("Stripe payment service initialized with API keys.");
    } else {
      this.logger.warn("Stripe secret key is not configured. Running in Mock/Demo Mode.");
    }
  }

  async createCheckoutSession(userId: string, successUrl: string, cancelUrl: string): Promise<{ url: string; mock?: boolean }> {
    if (!this.stripe) {
      this.logger.log(`[Mock Payments] Creating mock checkout session for user: ${userId}`);
      // Return a URL that redirects back to the app with a success query param
      const url = `${successUrl}${successUrl.includes("?") ? "&" : "?"}mock_payment_success=true&user_id=${userId}`;
      return { url, mock: true };
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "pen",
              product_data: {
                name: "SportMatch Connect Premium",
                description: "Acceso ilimitado a recomendaciones del Coach IA, nutrición inteligente y retos entre Squads.",
              },
              unit_amount: 5000, // S/ 50.00 PEN
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return { url: session.url || successUrl };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to create Stripe checkout session: ${errorMsg}`);
      throw new BadRequestException(`No se pudo crear la sesión de pago: ${errorMsg}`);
    }
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string; mock?: boolean }> {
    if (!this.stripe) {
      this.logger.log(`[Mock Payments] Creating mock billing portal for user: ${userId}`);
      return { url: returnUrl, mock: true };
    }

    try {
      const subscription = await this.prisma.subscriptions.findUnique({
        where: { user_id: userId },
      });

      if (!subscription || !subscription.stripe_customer_id) {
        throw new BadRequestException("No se encontró una suscripción de Stripe activa para este usuario.");
      }

      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: returnUrl,
      });

      return { url: portalSession.url };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to create billing portal: ${errorMsg}`);
      throw new BadRequestException(`No se pudo acceder al portal de Stripe: ${errorMsg}`);
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    if (!this.stripe || !this.stripeWebhookSecret) {
      this.logger.warn("Received webhook request but Stripe is not configured.");
      return { received: false };
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.stripeWebhookSecret);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${errorMsg}`);
      throw new BadRequestException(`Webhook Error: ${errorMsg}`);
    }

    this.logger.log(`Received Stripe Webhook Event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        if (userId) {
          await this.upgradeUser(userId, stripeCustomerId, stripeSubscriptionId, "Premium Month", "PREMIUM");
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const stripeCustomerId = subscription.customer as string;
        const stripeSubscriptionId = subscription.id;
        
        // Find subscription by stripe_subscription_id
        const subRecord = await this.prisma.subscriptions.findFirst({
          where: { stripe_subscription_id: stripeSubscriptionId },
        });

        if (subRecord) {
          const status = subscription.status;
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          await this.prisma.subscriptions.update({
            where: { id: subRecord.id },
            data: {
              status,
              current_period_end: currentPeriodEnd,
              tier: status === "active" ? "PREMIUM" : "FREE",
            },
          });

          await this.prisma.profiles.update({
            where: { id: subRecord.user_id },
            data: {
              tier: status === "active" ? "PREMIUM" : "FREE",
            },
          });
          
          this.logger.log(`Subscription updated for user ${subRecord.user_id} to status ${status}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const stripeSubscriptionId = subscription.id;

        const subRecord = await this.prisma.subscriptions.findFirst({
          where: { stripe_subscription_id: stripeSubscriptionId },
        });

        if (subRecord) {
          await this.prisma.subscriptions.update({
            where: { id: subRecord.id },
            data: {
              status: "canceled",
              tier: "FREE",
            },
          });

          await this.prisma.profiles.update({
            where: { id: subRecord.user_id },
            data: {
              tier: "FREE",
            },
          });

          this.logger.log(`Subscription canceled for user ${subRecord.user_id}`);
        }
        break;
      }
    }

    return { received: true };
  }

  async upgradeUserMock(userId: string): Promise<void> {
    this.logger.log(`[Mock Payments] Upgrading user ${userId} to PREMIUM tier`);
    await this.upgradeUser(userId, "cus_mock_12345", "sub_mock_12345", "price_mock_999", "PREMIUM");
  }

  async downgradeUserMock(userId: string): Promise<void> {
    this.logger.log(`[Mock Payments] Downgrading user ${userId} to FREE tier`);
    await this.prisma.profiles.update({
      where: { id: userId },
      data: { tier: "FREE" },
    });
    
    await this.prisma.subscriptions.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        status: "canceled",
        tier: "FREE",
      },
      update: {
        status: "canceled",
        tier: "FREE",
      },
    });
  }

  private async upgradeUser(
    userId: string,
    customerId: string,
    subscriptionId: string,
    priceId: string,
    tier: string,
  ): Promise<void> {
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

    await this.prisma.$transaction([
      this.prisma.profiles.update({
        where: { id: userId },
        data: {
          tier: tier,
        },
      }),
      this.prisma.subscriptions.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
          price_id: priceId,
          tier: tier,
          current_period_end: currentPeriodEnd,
        },
        update: {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
          price_id: priceId,
          tier: tier,
          current_period_end: currentPeriodEnd,
          updated_at: new Date(),
        },
      }),
    ]);

    this.logger.log(`User ${userId} successfully upgraded to ${tier} tier.`);
  }
}
