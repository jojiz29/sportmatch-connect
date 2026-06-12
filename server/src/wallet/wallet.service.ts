// ============================================================
// wallet.service.ts — Servicio de billetera
// Consulta de saldo FitCoins e historial de transacciones
// ============================================================

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: { id: userId },
      select: { fitcoins_balance: true },
    });
    return profile?.fitcoins_balance || 0;
  }

  async getTransactions(userId: string) {
    return this.prisma.wallet_transactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });
  }
}
