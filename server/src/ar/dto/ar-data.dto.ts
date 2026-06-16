import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ArCourtModelDataDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  courtId: string;

  @ApiProperty({ example: "Cancha Sol de Lima" })
  courtName: string;

  @ApiProperty({ example: "Fútbol" })
  sport: string;

  @ApiProperty({ example: "https://models.example.com/cancha-futbol.glb" })
  arModelUrl: string | null;

  @ApiProperty({ example: 1.0 })
  arScale: number;

  @ApiProperty({ example: { x: 0, y: 0, z: 0 } })
  arRotation: { x: number; y: number; z: number } | null;

  @ApiProperty({ example: { length: 105, width: 68, unit: "m" } })
  courtDimensions: {
    length: number;
    width: number;
    unit: string;
  };

  @ApiProperty({ example: "#1a8a3f" })
  surfaceColor: string;

  @ApiProperty({ example: "#ffffff" })
  lineColor: string;

  @ApiProperty({ example: true })
  hasNet: boolean;

  @ApiProperty({ example: false })
  hasHoops: boolean;

  @ApiProperty({ example: true })
  hasGoals: boolean;

  @ApiPropertyOptional({ example: 2.43 })
  netHeight?: number;

  @ApiPropertyOptional({ example: 7.32 })
  goalWidth?: number;

  @ApiPropertyOptional({ example: 2.44 })
  goalHeight?: number;

  @ApiProperty({ example: 15 })
  ambientLightIntensity: number;

  @ApiProperty({ example: 2 })
  directionalLightIntensity: number;
}
