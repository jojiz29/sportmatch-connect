/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
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

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post("checkout")
  async checkout(
    @Req() req: any,
    @Body("successUrl") successUrl: string,
    @Body("cancelUrl") cancelUrl: string,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException("successUrl y cancelUrl son requeridos");
    }

    return this.paymentsService.createCheckoutSession(userId, successUrl, cancelUrl);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("portal")
  async billingPortal(@Req() req: any, @Body("returnUrl") returnUrl: string) {
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
  async webhook(@Req() req: any, @Headers("stripe-signature") signature: string) {
    // stripe signature validation requires the raw body
    let rawBody = req.body;

    // In Express/NestJS, if body parser is already active, req.body is parsed as object.
    // We convert it back to buffer if it's an object/string, or use it directly if it is a Buffer.
    if (rawBody && !Buffer.isBuffer(rawBody)) {
      if (typeof rawBody === "object") {
        rawBody = Buffer.from(JSON.stringify(rawBody));
      } else {
        rawBody = Buffer.from(String(rawBody));
      }
    }

    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("mock-upgrade")
  async mockUpgrade(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    await this.paymentsService.upgradeUserMock(userId);
    return { success: true, message: "Usuario ascendido a PREMIUM exitosamente (modo demo)" };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("mock-downgrade")
  async mockDowngrade(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    await this.paymentsService.downgradeUserMock(userId);
    return { success: true, message: "Usuario descendido a FREE exitosamente (modo demo)" };
  }
}
