import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import Stripe from "stripe";

type StripeClient = ReturnType<typeof Stripe>;

interface StripeWebhookEvent {
  type: string;
  data: {
    object: unknown;
  };
}

interface StripeCheckoutSession {
  metadata?: {
    userId?: string;
  } | null;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
}

interface StripeSubscription {
  id: string;
  status?: string;
  current_period_end?: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: StripeClient | null = null;
  private readonly stripeWebhookSecret: string | null = null;

  constructor(private readonly prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secretKey) {
      this.stripe = Stripe(secretKey, {
        apiVersion: "2022-11-15",
      });
      this.stripeWebhookSecret = webhookSecret || null;
      this.logger.log("Stripe payment service initialized with API keys.");
    } else {
      this.logger.warn("Stripe secret key is not configured. Running in Mock/Demo Mode.");
    }
  }

  // Precios por tier en céntimos PEN
  private readonly TIER_PRICES: Record<
    string,
    { unit_amount: number; interval: "month" | "year"; name_suffix: string }
  > = {
    INICIAL: { unit_amount: 599, interval: "month", name_suffix: "Inicial (Mensual)" },
    PLATA: { unit_amount: 1999, interval: "month", name_suffix: "Plata (Semestral)" },
    ELITE: { unit_amount: 2499, interval: "year", name_suffix: "Elite (Anual)" },
  };

  async createCheckoutSession(
    userId: string,
    successUrl: string,
    cancelUrl: string,
    tier?: string,
  ): Promise<{ url: string; mock?: boolean }> {
    if (!this.stripe) {
      this.logger.log(`[Mock Payments] Creating mock checkout session for user: ${userId}`);
      const params = new URLSearchParams();
      params.set("mock_payment_success", "true");
      params.set("user_id", userId);
      if (tier) params.set("tier", tier);
      const url = `${successUrl}${successUrl.includes("?") ? "&" : "?"}${params.toString()}`;
      return { url, mock: true };
    }

    const priceConfig =
      tier && this.TIER_PRICES[tier] ? this.TIER_PRICES[tier] : this.TIER_PRICES.INICIAL;

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "pen",
              product_data: {
                name: `SportMatch Connect — Plan ${priceConfig.name_suffix}`,
                description:
                  "Acceso a Coach IA, nutrición inteligente, matchmaking premium y retos entre Squads.",
              },
              unit_amount: priceConfig.unit_amount,
              recurring: {
                interval: priceConfig.interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId,
          tier: tier || "INICIAL",
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

  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string; mock?: boolean }> {
    if (!this.stripe) {
      this.logger.log(`[Mock Payments] Creating mock billing portal for user: ${userId}`);
      return { url: returnUrl, mock: true };
    }

    try {
      const subscription = await this.prisma.subscriptions.findUnique({
        where: { user_id: userId },
      });

      if (!subscription || !subscription.stripe_customer_id) {
        throw new BadRequestException(
          "No se encontró una suscripción de Stripe activa para este usuario.",
        );
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

    let event: StripeWebhookEvent;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeWebhookSecret,
      ) as StripeWebhookEvent;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${errorMsg}`);
      throw new BadRequestException(`Webhook Error: ${errorMsg}`);
    }

    this.logger.log(`Received Stripe Webhook Event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as StripeCheckoutSession;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier || "INICIAL";
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const stripeSubscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (userId && stripeCustomerId && stripeSubscriptionId) {
          await this.upgradeUser(userId, stripeCustomerId, stripeSubscriptionId, tier, tier);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as StripeSubscription;
        const stripeSubscriptionId = subscription.id;

        // Find subscription by stripe_subscription_id
        const subRecord = await this.prisma.subscriptions.findFirst({
          where: { stripe_subscription_id: stripeSubscriptionId },
        });

        if (subRecord) {
          const status = subscription.status;
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const newTier =
            status === "active" ? (subRecord.tier !== "FREE" ? subRecord.tier : "INICIAL") : "FREE";

          await this.prisma.subscriptions.update({
            where: { id: subRecord.id },
            data: {
              status,
              current_period_end: currentPeriodEnd,
              tier: newTier,
            },
          });

          await this.prisma.profiles.update({
            where: { id: subRecord.user_id },
            data: {
              tier: newTier,
            },
          });

          this.logger.log(
            `Subscription updated for user ${subRecord.user_id} to status ${status}, tier ${newTier}`,
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as StripeSubscription;
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

  async upgradeUserMock(userId: string, tier: string = "INICIAL"): Promise<void> {
    this.logger.log(`[Mock Payments] Upgrading user ${userId} to ${tier} tier`);
    await this.upgradeUser(
      userId,
      "cus_mock_12345",
      "sub_mock_12345",
      `price_mock_${tier.toLowerCase()}`,
      tier,
    );
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
