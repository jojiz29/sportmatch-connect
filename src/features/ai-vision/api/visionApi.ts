import { supabase } from "@/shared/api/supabase";
import type {
  AnalyzeImageRequest,
  AnalyzeImageResponse,
  AnalyzeVideoRequest,
  AnalyzeVideoResponse,
  FormAnalysisResult,
  FakeProfileResult,
  DniVerificationResult,
  SupportedLanguage,
} from "../model/types";

const BACKEND_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const VISION_BASE = `${BACKEND_URL}/api/v1/ai/vision`;

const ALLOWED_HOSTS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https?:\/\/[a-z0-9-]+\.render\.com$/,
  /^https?:\/\/[a-z0-9-]+\.fly\.dev$/,
  /^https?:\/\/[a-z0-9-]+\.railway\.app$/,
  /^https?:\/\/api\.[a-z0-9-]+\.(com|dev|app)$/,
];

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
}

function validateApiHost(): void {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const parsed = new URL(apiBaseUrl);
    const valid = ALLOWED_HOSTS.some((p) => p.test(parsed.origin));
    if (!valid) {
      throw new Error(
        `Configuración inválida: VITE_API_URL="${apiBaseUrl}" no apunta a un backend válido. Verifica tu .env.`,
      );
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`VITE_API_URL no es una URL válida: ${apiBaseUrl}`);
    }
    throw err;
  }
}

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  return token;
}

async function postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  validateApiHost();
  const token = await getAuthToken();
  const response = await fetch(`${VISION_BASE}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("No autorizado. Inicia sesión de nuevo.");
    if (response.status === 413) throw new Error("El archivo es demasiado grande.");
    if (response.status === 429) throw new Error("Demasiadas solicitudes. Espera un momento.");
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(err.message || `Error (HTTP ${response.status})`);
  }
  return response.json() as Promise<T>;
}

// ==============================================================
// ANALYZE IMAGE (Día 1-2)
// ==============================================================
export async function analyzeImage(request: AnalyzeImageRequest): Promise<AnalyzeImageResponse> {
  const formData = new FormData();
  formData.append("image", request.image, "image.jpg");
  if (request.prompt) formData.append("prompt", request.prompt);
  if (request.language) formData.append("language", request.language);
  return postFormData<AnalyzeImageResponse>("/analyze", formData);
}

// ==============================================================
// ANALYZE VIDEO (Día 1-2)
// ==============================================================
export async function analyzeVideo(request: AnalyzeVideoRequest): Promise<AnalyzeVideoResponse> {
  const formData = new FormData();
  formData.append("video", request.video, "video.mp4");
  if (request.prompt) formData.append("prompt", request.prompt);
  if (request.language) formData.append("language", request.language);
  if (request.frameCount) formData.append("frameCount", String(request.frameCount));
  return postFormData<AnalyzeVideoResponse>("/analyze-video", formData);
}

// ==============================================================
// #8 — FORM ANALYZER
// ==============================================================
export async function analyzeForm(
  frames: Blob[],
  sport: string,
  prompt?: string,
  language?: SupportedLanguage,
): Promise<FormAnalysisResult> {
  const formData = new FormData();
  frames.forEach((frame, i) => {
    formData.append("frames", frame, `frame-${i}.jpg`);
  });
  formData.append("sport", sport);
  if (prompt) formData.append("prompt", prompt);
  if (language) formData.append("language", language);
  return postFormData<FormAnalysisResult>("/form-analyze", formData);
}

// ==============================================================
// #26 — FAKE PROFILE DETECTOR
// ==============================================================
export async function detectFakeProfile(
  image: Blob,
  language?: SupportedLanguage,
): Promise<FakeProfileResult> {
  const formData = new FormData();
  formData.append("image", image, "profile.jpg");
  if (language) formData.append("language", language);
  return postFormData<FakeProfileResult>("/fake-profile", formData);
}

// ==============================================================
// #32 — DNI VERIFICATION 2.0
// ==============================================================
export async function verifyDniWithSelfie(
  selfie: Blob,
  dniImage: Blob,
  language?: SupportedLanguage,
): Promise<DniVerificationResult> {
  const formData = new FormData();
  formData.append("selfie", selfie, "selfie.jpg");
  formData.append("dni", dniImage, "dni.jpg");
  if (language) formData.append("language", language);
  return postFormData<DniVerificationResult>("/dni-verify", formData);
}
