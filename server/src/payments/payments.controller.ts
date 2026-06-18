import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { PaymentsService } from "./payments.service";

interface PaymentRequest {
  user?: {
    userId?: string;
    sub?: string;
  };
  body?: Buffer | string | Record<string, unknown>;
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post("checkout")
  async checkout(
    @Req() req: PaymentRequest,
    @Body("successUrl") successUrl: string,
    @Body("cancelUrl") cancelUrl: string,
    @Body("tier") tier?: string,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException("successUrl y cancelUrl son requeridos");
    }

    return this.paymentsService.createCheckoutSession(userId, successUrl, cancelUrl, tier);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("portal")
  async billingPortal(@Req() req: PaymentRequest, @Body("returnUrl") returnUrl: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    if (!returnUrl) {
      throw new BadRequestException("returnUrl es requerido");
    }

    return this.paymentsService.createPortalSession(userId, returnUrl);
  }

  @Post("stripe-webhook")
  async webhook(@Req() req: PaymentRequest, @Headers("stripe-signature") signature: string) {
    // stripe signature validation requires the raw body
    const rawBody = req.body;
    if (!rawBody) {
      throw new BadRequestException("Webhook body es requerido");
    }

    // In Express/NestJS, if body parser is already active, req.body is parsed as object.
    // We convert it back to buffer if it's an object/string, or use it directly if it is a Buffer.
    const webhookBody = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === "object" ? JSON.stringify(rawBody) : String(rawBody));

    return this.paymentsService.handleWebhook(webhookBody, signature);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("mock-upgrade")
  async mockUpgrade(@Req() req: PaymentRequest, @Body("tier") tier?: string) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    const planTier = tier || "INICIAL";
    await this.paymentsService.upgradeUserMock(userId, planTier);
    return {
      success: true,
      message: `Usuario ascendido a ${planTier} exitosamente (modo demo)`,
      tier: planTier,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("mock-downgrade")
  async mockDowngrade(@Req() req: PaymentRequest) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    await this.paymentsService.downgradeUserMock(userId);
    return { success: true, message: "Usuario descendido a FREE exitosamente (modo demo)" };
  }
}
