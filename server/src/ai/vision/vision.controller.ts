import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { VisionService } from "./vision.service";
import { MediaService } from "./media.service";
import {
  AnalyzeImageDto,
  AnalyzeImageResponseDto,
  AnalyzeVideoDto,
  AnalyzeVideoResponseDto,
  FormAnalyzeDto,
  FormAnalyzeResponseDto,
  FakeProfileResponseDto,
  DniVerifyResponseDto,
} from "./dto/vision.dto";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

@ApiTags("AI Vision")
@Controller("ai/vision")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class VisionController {
  constructor(
    private readonly visionService: VisionService,
    private readonly mediaService: MediaService,
  ) {}

  @Post("analyze")
  @ApiOperation({ summary: "Analiza una imagen usando Vertex AI (Gemini multimodal)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: { type: "string", format: "binary" },
        prompt: { type: "string" },
        language: { type: "string", enum: ["es", "en", "pt"] },
      },
    },
  })
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_SIZE } }))
  async analyzeImage(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
    @Body() dto: AnalyzeImageDto,
  ): Promise<AnalyzeImageResponseDto> {
    if (!file) throw new BadRequestException("No se proporcionó archivo de imagen");
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de imagen no soportado: ${file.mimetype}. Permitidos: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      );
    }
    return this.visionService.analyzeImage(file.buffer, file.mimetype, dto.prompt, dto.language);
  }

  @Post("analyze-video")
  @ApiOperation({ summary: "Analiza frames de video para evaluación deportiva" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        video: { type: "string", format: "binary" },
        prompt: { type: "string" },
        language: { type: "string", enum: ["es", "en", "pt"] },
        frameCount: { type: "string" },
      },
    },
  })
  @UseInterceptors(FilesInterceptor("video", 1, { limits: { fileSize: MAX_VIDEO_SIZE } }))
  async analyzeVideo(
    @UploadedFiles() files: Array<{ buffer: Buffer; mimetype: string; size: number }> | undefined,
    @Body() dto: AnalyzeVideoDto,
  ): Promise<AnalyzeVideoResponseDto> {
    const videoFile = files?.[0];
    if (!videoFile) throw new BadRequestException("No se proporcionó archivo de video");
    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.mimetype)) {
      throw new BadRequestException(
        `Tipo de video no soportado: ${videoFile.mimetype}. Permitidos: ${ALLOWED_VIDEO_TYPES.join(", ")}`,
      );
    }
    const frameCount = Math.min(Math.max(parseInt(dto.frameCount || "5", 10) || 5, 1), 15);
    const frames = await this.mediaService.extractFrames(videoFile.buffer, frameCount);
    return this.visionService.analyzeVideo(frames, "image/jpeg", dto.prompt, dto.language);
  }

  // ============================================================
  // #8 — FORM ANALYZER (postura deportiva)
  // ============================================================
  @Post("form-analyze")
  @ApiOperation({
    summary: "#8 — Analiza postura deportiva desde frames de video",
    description:
      "Recibe hasta 15 frames extraídos del video en el cliente. Devuelve score, análisis, recomendaciones y nivel detectado.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        frames: {
          type: "array",
          items: { type: "string", format: "binary" },
          description: "Frames del video (JPEG, hasta 15)",
        },
        sport: { type: "string", description: "Deporte a analizar (fútbol, tenis, etc.)" },
        prompt: { type: "string" },
        language: { type: "string", enum: ["es", "en", "pt"] },
      },
    },
  })
  @UseInterceptors(FilesInterceptor("frames", 15, { limits: { fileSize: MAX_IMAGE_SIZE } }))
  async formAnalyze(
    @UploadedFiles() files: Array<{ buffer: Buffer; mimetype: string; size: number }> | undefined,
    @Body() dto: FormAnalyzeDto,
  ): Promise<FormAnalyzeResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException("Debes proporcionar al menos 1 frame de video");
    }
    const invalidTypes = files.filter((f) => !ALLOWED_IMAGE_TYPES.includes(f.mimetype));
    if (invalidTypes.length > 0) {
      throw new BadRequestException(
        `Formato de frame no soportado: ${invalidTypes[0].mimetype}. Usa JPEG.`,
      );
    }
    return this.visionService.analyzeForm(
      files.map((f) => f.buffer),
      "image/jpeg",
      dto.sport,
      dto.prompt,
      dto.language,
    );
  }

  // ============================================================
  // #26 — FAKE PROFILE DETECTOR
  // ============================================================
  @Post("fake-profile")
  @ApiOperation({
    summary: "#26 — Verifica si una foto de perfil muestra una persona real",
    description:
      "Analiza la foto y devuelve porcentaje de veracidad de persona, explicación y señales detectadas.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: { type: "string", format: "binary" },
        language: { type: "string", enum: ["es", "en", "pt"] },
      },
    },
  })
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_SIZE } }))
  async fakeProfile(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
    @Body("language") language?: string,
  ): Promise<FakeProfileResponseDto> {
    if (!file) throw new BadRequestException("No se proporcionó foto de perfil");
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Formato de imagen no soportado. Usa JPG, PNG o WebP.");
    }
    const lang = (language === "pt" || language === "en" ? language : "es") as "es" | "en" | "pt";
    return this.visionService.detectFakeProfile(file.buffer, file.mimetype, lang);
  }

  // ============================================================
  // #32 — DNI VERIFICATION 2.0 (Selfie + DNI face match)
  // ============================================================
  @Post("dni-verify")
  @ApiOperation({
    summary: "#32 — Verifica identidad comparando selfie con foto del DNI",
    description: "Recibe dos imágenes: selfie y foto del DNI. Realiza face matching biométrico.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        selfie: { type: "string", format: "binary", description: "Selfie actual del usuario" },
        dniImage: {
          type: "string",
          format: "binary",
          description: "Foto del DNI (la que tiene la cara)",
        },
        language: { type: "string", enum: ["es", "en", "pt"] },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "selfie", maxCount: 1 },
        { name: "dni", maxCount: 1 },
      ],
      { limits: { fileSize: MAX_IMAGE_SIZE } },
    ),
  )
  async dniVerify(
    @UploadedFiles()
    files:
      | {
          selfie?: { buffer: Buffer; mimetype: string; size: number }[];
          dni?: { buffer: Buffer; mimetype: string; size: number }[];
        }
      | undefined,
    @Body("language") language?: string,
  ): Promise<DniVerifyResponseDto> {
    const selfie = files?.selfie?.[0];
    const dniFile = files?.dni?.[0];
    if (!selfie || !dniFile) {
      throw new BadRequestException("Debes proporcionar ambas imágenes: selfie y foto del DNI");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(selfie.mimetype)) {
      throw new BadRequestException("Formato de selfie no soportado. Usa JPG, PNG o WebP.");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(dniFile.mimetype)) {
      throw new BadRequestException("Formato de DNI no soportado. Usa JPG, PNG o WebP.");
    }
    const lang = (language === "pt" || language === "en" ? language : "es") as "es" | "en" | "pt";
    return this.visionService.verifyDniWithSelfie(
      selfie.buffer,
      selfie.mimetype,
      dniFile.buffer,
      dniFile.mimetype,
      lang,
    );
  }
}
