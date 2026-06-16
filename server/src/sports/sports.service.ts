// ============================================================
// sports.service.ts — Servicio de deportes
// Obtiene todos los deportes ordenados alfabéticamente
// ============================================================

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sports.findMany({
      orderBy: { name: "asc" },
    });
  }
}
