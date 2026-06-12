// ============================================================
// create-post.dto.ts — DTOs de publicaciones, comentarios y reacciones
// Incluye validaciones de contenido con límite de caracteres
// ============================================================

import { IsString, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePostDto {
  @ApiProperty({ example: "Busco jugadores para partido de futbol" })
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ example: "IMAGE" })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: "https://example.com/image.jpg" })
  @IsString()
  @IsOptional()
  media_url?: string;

  @ApiPropertyOptional({ example: "Futbol" })
  @IsString()
  @IsOptional()
  sport?: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: "Gran partido!" })
  @IsString()
  @MaxLength(500)
  content: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parent_id?: string;
}

export class CreateReactionDto {
  @ApiProperty({ example: "LIKE" })
  @IsString()
  reaction_type: string;
}
