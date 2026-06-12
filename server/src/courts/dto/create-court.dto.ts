// ============================================================
// create-court.dto.ts — DTOs de cancha (creación y actualización)
// Validaciones completas con class-validator y documentación Swagger
// ============================================================

import {
  IsString,
  IsInt,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCourtDto {
  @ApiProperty({ example: "Cancha Sol de Lima" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Futbol" })
  @IsString()
  sport: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  price_per_hour: number;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  reviews_count: number;

  @ApiProperty({ example: -12.0464 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -77.0428 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({ example: "Av. Peru 123" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @IsOptional()
  max_players?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  operating_hours?: string[];

  @ApiPropertyOptional({ example: "Lince" })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_sponsored?: boolean;
}

export class UpdateCourtDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  price_per_hour?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}
