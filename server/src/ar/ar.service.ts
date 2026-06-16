import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ArCourtModelDataDto } from "./dto";

const SPORT_DIMENSIONS: Record<
  string,
  {
    length: number;
    width: number;
    surfaceColor: string;
    lineColor: string;
    hasNet: boolean;
    hasHoops: boolean;
    hasGoals: boolean;
    netHeight?: number;
    goalWidth?: number;
    goalHeight?: number;
  }
> = {
  "Fútbol": {
    length: 105,
    width: 68,
    surfaceColor: "#1a8a3f",
    lineColor: "#ffffff",
    hasNet: false,
    hasHoops: false,
    hasGoals: true,
    goalWidth: 7.32,
    goalHeight: 2.44,
  },
  "Fútbol 5": {
    length: 40,
    width: 20,
    surfaceColor: "#2d9e4b",
    lineColor: "#ffffff",
    hasNet: false,
    hasHoops: false,
    hasGoals: true,
    goalWidth: 3,
    goalHeight: 2,
  },
  "Fútbol 7": {
    length: 60,
    width: 35,
    surfaceColor: "#2d9e4b",
    lineColor: "#ffffff",
    hasNet: false,
    hasHoops: false,
    hasGoals: true,
    goalWidth: 5,
    goalHeight: 2,
  },
  "Básquet": {
    length: 28,
    width: 15,
    surfaceColor: "#c8864b",
    lineColor: "#ffffff",
    hasNet: false,
    hasHoops: true,
    hasGoals: false,
  },
  "Tenis": {
    length: 23.77,
    width: 10.97,
    surfaceColor: "#2e7d32",
    lineColor: "#ffffff",
    hasNet: true,
    hasHoops: false,
    hasGoals: false,
    netHeight: 0.914,
  },
  "Pádel": {
    length: 20,
    width: 10,
    surfaceColor: "#1b5e9e",
    lineColor: "#ffffff",
    hasNet: true,
    hasHoops: false,
    hasGoals: false,
    netHeight: 0.88,
  },
  "Vóley": {
    length: 18,
    width: 9,
    surfaceColor: "#d4a34a",
    lineColor: "#ffffff",
    hasNet: true,
    hasHoops: false,
    hasGoals: false,
    netHeight: 2.43,
  },
  "Running": {
    length: 400,
    width: 10,
    surfaceColor: "#b71c1c",
    lineColor: "#ffffff",
    hasNet: false,
    hasHoops: false,
    hasGoals: false,
  },
  "Tenis de Mesa": {
    length: 2.74,
    width: 1.525,
    surfaceColor: "#1565c0",
    lineColor: "#ffffff",
    hasNet: true,
    hasHoops: false,
    hasGoals: false,
    netHeight: 0.1525,
  },
};

const DEFAULT_DIMENSIONS = {
  length: 30,
  width: 20,
  surfaceColor: "#37474f",
  lineColor: "#ffffff",
  hasNet: false,
  hasHoops: false,
  hasGoals: false,
};

@Injectable()
export class ArService {
  constructor(private prisma: PrismaService) {}

  async getCourtModelData(courtId: string): Promise<ArCourtModelDataDto> {
    const court = await this.prisma.courts.findUnique({ where: { id: courtId } });
    if (!court) {
      throw new NotFoundException("Court not found");
    }

    const dimensions = SPORT_DIMENSIONS[court.sport] || DEFAULT_DIMENSIONS;

    return {
      courtId: court.id,
      courtName: court.name,
      sport: court.sport,
      arModelUrl: court.ar_model_url || null,
      arScale: court.ar_scale ?? 1.0,
      arRotation: court.ar_rotation as { x: number; y: number; z: number } | null,
      courtDimensions: {
        length: dimensions.length,
        width: dimensions.width,
        unit: "m",
      },
      surfaceColor: dimensions.surfaceColor,
      lineColor: dimensions.lineColor,
      hasNet: dimensions.hasNet,
      hasHoops: dimensions.hasHoops,
      hasGoals: dimensions.hasGoals,
      netHeight: dimensions.netHeight,
      goalWidth: dimensions.goalWidth,
      goalHeight: dimensions.goalHeight,
      ambientLightIntensity: 0.5,
      directionalLightIntensity: 1.0,
    };
  }
}
