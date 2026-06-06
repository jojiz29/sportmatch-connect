import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get(':userId/balance')
  @ApiOperation({ summary: 'Get user balance' })
  async getBalance(@Param('userId') userId: string) {
    const balance = await this.walletService.getBalance(userId);
    return { fitcoins_balance: balance };
  }

  @Get(':userId/transactions')
  @ApiOperation({ summary: 'Get user transactions' })
  async getTransactions(@Param('userId') userId: string) {
    return this.walletService.getTransactions(userId);
  }

  @Post('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create transaction' })
  async createTransaction(@Body() data: {
    user_id: string;
    amount: number;
    description: string;
    type: 'EARN' | 'SPEND';
  }) {
    const { PrismaService } = await import('../prisma/prisma.service');
    const prisma = new PrismaService();
    return prisma.wallet_transactions.create({
      data: {
        user_id: data.user_id,
        amount: data.amount,
        description: data.description,
        type: data.type,
      },
    });
  }
}