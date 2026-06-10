import { IsString, IsInt, IsOptional, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMatchDto {
  @ApiProperty({ example: "Futbol" })
  @IsString()
  sport: string;

  @ApiProperty({ example: "Partido de prueba" })
  @IsString()
  title: string;

  @ApiProperty({ example: "2026-06-15" })
  @IsString()
  date: string;

  @ApiProperty({ example: "10:00" })
  @IsString()
  time: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  max_players: number;

  @ApiProperty({ example: "Intermedio" })
  @IsString()
  required_level: string;

  @ApiPropertyOptional({ example: "court-uuid" })
  @IsString()
  @IsOptional()
  court_id?: string;
}

export class UpdateMatchDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  time?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  max_players?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  required_level?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
