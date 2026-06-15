import { backendApi } from "@/shared/api/backendApi";

export interface VerifyDniPayload {
  dni: string;
  documentPath?: string;
  selfiePath?: string;
  consentimientoBio?: boolean;
}

export interface VerifyDniResponse {
  success: boolean;
  message: string;
  version?: "v1" | "v2";
  profile?: {
    dni_verificado: boolean;
    fecha_verificacion: string;
    trust_score: number;
    dni_verification_version?: string | null;
    dni_ai_confidence?: number | null;
    consentimiento_bio?: string | null;
  };
  error?: string;
}

export async function verifyDniIdentity(
  token: string,
  payload: VerifyDniPayload,
): Promise<VerifyDniResponse> {
  const res = await backendApi.profiles.verifyDni(token, payload);
  if (res.error) {
    throw new Error(res.error);
  }
  return res as VerifyDniResponse;
}
