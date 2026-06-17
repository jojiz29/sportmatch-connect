import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdtemp = promisify(fs.mkdtemp);
const readFile = promisify(fs.readFile);

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private ffmpegAvailable: boolean | null = null;

  async extractFrames(
    videoBuffer: Buffer,
    frameCount: number,
    format: "jpeg" | "png" = "jpeg",
  ): Promise<Buffer[]> {
    const available = await this.isFfmpegAvailable();
    if (available) {
      return this.extractFramesFfmpeg(videoBuffer, frameCount, format);
    }
    this.logger.warn(
      "ffmpeg no detectado. Usando fallback: división de buffer (no extrae fotogramas reales).",
    );
    return this.extractFramesFallback(videoBuffer, frameCount);
  }

  private async isFfmpegAvailable(): Promise<boolean> {
    if (this.ffmpegAvailable !== null) return this.ffmpegAvailable;
    try {
      const { execSync } = await import("child_process");
      execSync("ffmpeg -version", { stdio: "ignore" });
      this.ffmpegAvailable = true;
    } catch {
      this.ffmpegAvailable = false;
    }
    return this.ffmpegAvailable;
  }

  private async extractFramesFfmpeg(
    videoBuffer: Buffer,
    frameCount: number,
    format: "jpeg" | "png",
  ): Promise<Buffer[]> {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "sportmatch-frames-"));
    const inputPath = path.join(tmpDir, "input.mp4");
    const outputPattern = path.join(tmpDir, "frame-%03d." + format);
    const frames: Buffer[] = [];

    try {
      await writeFile(inputPath, videoBuffer);

      const { execSync } = await import("child_process");
      const fps = Math.max(1, Math.ceil(frameCount / 10));
      execSync(
        `ffmpeg -i "${inputPath}" -vf "fps=${fps}" -frames:v ${frameCount} -q:v 2 "${outputPattern}" -y`,
        { stdio: "ignore", timeout: 30000 },
      );

      for (let i = 1; i <= frameCount; i++) {
        const framePath = path.join(tmpDir, `frame-${String(i).padStart(3, "0")}.${format}`);
        if (fs.existsSync(framePath)) {
          frames.push(await readFile(framePath));
        }
      }
    } catch (err) {
      this.logger.error("Error extrayendo frames con ffmpeg:", err);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    return frames.length > 0 ? frames : this.extractFramesFallback(videoBuffer, frameCount);
  }

  private extractFramesFallback(videoBuffer: Buffer, frameCount: number): Buffer[] {
    const frames: Buffer[] = [];
    const totalSize = videoBuffer.length;
    const chunkSize = Math.max(1, Math.floor(totalSize / frameCount));
    for (let i = 0; i < frameCount; i++) {
      const start = i * chunkSize;
      const end = i === frameCount - 1 ? totalSize : start + chunkSize;
      frames.push(Buffer.from(videoBuffer.subarray(start, end)));
    }
    return frames;
  }
}
