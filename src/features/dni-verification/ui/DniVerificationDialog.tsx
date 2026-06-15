import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, CheckCircle2, CreditCard, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { uploadIdentityImage } from "../lib/uploadIdentityImage";
import { verifyDniIdentity } from "../api/dniVerificationApi";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { useProfileStore } from "@/features/profile/useProfileStore";
import type { User } from "@/entities/types";

type WizardStep = "dni" | "document" | "selfie" | "review";

interface DniVerificationDialogProps {
  profile: User;
  attemptsLeft: number;
  triggerLabel?: string;
}

interface ImageCaptureProps {
  label: string;
  hint: string;
  previewUrl: string | null;
  captureMode: "environment" | "user";
  isUploading: boolean;
  onFileSelected: (file: File) => void;
}

function ImageCaptureSlot({
  label,
  hint,
  previewUrl,
  captureMode,
  isUploading,
  onFileSelected,
}: ImageCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }
    onFileSelected(file);
    if (e.target) e.target.value = "";
  };

  return (
    <div className="space-y-2 text-left">
      <label className="text-xs font-semibold text-muted-foreground block">{label}</label>
      <button
        type="button"
        onClick={() => !isUploading && inputRef.current?.click()}
        className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-background/40 overflow-hidden relative transition-colors"
      >
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wide">{hint}</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={captureMode}
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />
    </div>
  );
}

export function DniVerificationDialog({
  profile,
  attemptsLeft,
  triggerLabel,
}: DniVerificationDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>("dni");
  const [dni, setDni] = useState("");
  const [dniError, setDniError] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetWizard = () => {
    setStep("dni");
    setDni("");
    setDniError("");
    setDocumentFile(null);
    setSelfieFile(null);
    setDocumentPreview(null);
    setSelfiePreview(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetWizard();
  };

  const handleVerifyDemo = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (dni === "99999999") {
        const nextIntentos = (profile.dni_intentos || 0) + 1;
        const updatedUser = { ...profile, dni_intentos: nextIntentos };
        useAuthStore.setState({ user: updatedUser });
        useProfileStore.setState({ profile: updatedUser });
        const left = 3 - nextIntentos;
        setDniError(
          t("dni_verification.name_mismatch", {
            suffix:
              left > 0
                ? t("dni_verification.attempts_left", { count: left })
                : t("dni_verification.blocked_support"),
          }),
        );
        toast.error(t("dni_verification.failed_toast"));
        return;
      }

      const updatedUser: User = {
        ...profile,
        dni_verificado: true,
        dni_hash: "mock_hash_sha256",
        dni_intentos: 0,
        fecha_verificacion: new Date().toISOString(),
        trust_score: Math.min(100, (profile.trust_score || 0) + 15),
        dni_verification_version: "v2",
        dni_ai_confidence: 0.95,
      };
      useAuthStore.setState({ user: updatedUser });
      useProfileStore.setState({ profile: updatedUser });
      toast.success(t("dni_verification.success_toast"));
      setOpen(false);
      resetWizard();
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!/^\d{8}$/.test(dni)) {
      setDniError(t("dni_verification.invalid_dni"));
      return;
    }
    if (!documentFile || !selfieFile) {
      toast.error(t("dni_verification.missing_images"));
      return;
    }

    if (useAuthStore.getState().isDemoMode) {
      handleVerifyDemo();
      return;
    }

    setIsSubmitting(true);
    setDniError("");

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error(t("dni_verification.no_session"));

      const [documentPath, selfiePath] = await Promise.all([
        uploadIdentityImage(profile.id, documentFile, "document"),
        uploadIdentityImage(profile.id, selfieFile, "selfie"),
      ]);

      await verifyDniIdentity(token, { dni, documentPath, selfiePath });

      const { data: updatedProfile, error: fetchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single();

      if (!fetchErr && updatedProfile) {
        useAuthStore.setState({ user: updatedProfile as User });
        useProfileStore.setState({ profile: updatedProfile as User });
      }

      toast.success(t("dni_verification.success_toast"));
      setOpen(false);
      resetWizard();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("dni_verification.generic_error");
      setDniError(message);
      toast.error(t("dni_verification.failed_toast"));

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("dni_intentos")
        .eq("id", profile.id)
        .single();

      if (currentProfile) {
        const updatedUser = { ...profile, dni_intentos: currentProfile.dni_intentos };
        useAuthStore.setState({ user: updatedUser });
        useProfileStore.setState({ profile: updatedUser });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle: Record<WizardStep, string> = {
    dni: t("dni_verification.step_dni_title"),
    document: t("dni_verification.step_document_title"),
    selfie: t("dni_verification.step_selfie_title"),
    review: t("dni_verification.step_review_title"),
  };

  const stepDescription: Record<WizardStep, string> = {
    dni: t("dni_verification.step_dni_desc"),
    document: t("dni_verification.step_document_desc"),
    selfie: t("dni_verification.step_selfie_desc"),
    review: t("dni_verification.step_review_desc"),
  };

  const canGoNext =
    step === "dni"
      ? dni.length === 8
      : step === "document"
        ? Boolean(documentFile)
        : step === "selfie"
          ? Boolean(selfieFile)
          : Boolean(documentFile && selfieFile);

  const goNext = () => {
    if (step === "dni") setStep("document");
    else if (step === "document") setStep("selfie");
    else if (step === "selfie") setStep("review");
  };

  const goBack = () => {
    if (step === "document") setStep("dni");
    else if (step === "selfie") setStep("document");
    else if (step === "review") setStep("selfie");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-3 w-full py-2 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow hover:scale-[1.02] transition-transform cursor-pointer border-0"
        >
          {triggerLabel ?? t("dni_verification.trigger")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-background/95 border-border shadow-2xl rounded-3xl p-6 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">{stepTitle[step]}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {stepDescription[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          {(["dni", "document", "selfie", "review"] as WizardStep[]).map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                (["dni", "document", "selfie", "review"] as WizardStep[]).indexOf(step) >= idx
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="py-2 space-y-4">
          {step === "dni" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                {t("dni_verification.dni_label")}
              </label>
              <input
                type="text"
                maxLength={8}
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value.replace(/\D/g, ""));
                  setDniError("");
                }}
                placeholder="70123456"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-center focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {step === "document" && (
            <ImageCaptureSlot
              label={t("dni_verification.document_label")}
              hint={t("dni_verification.document_hint")}
              previewUrl={documentPreview}
              captureMode="environment"
              isUploading={false}
              onFileSelected={(file) => {
                setDocumentFile(file);
                setDocumentPreview(URL.createObjectURL(file));
              }}
            />
          )}

          {step === "selfie" && (
            <ImageCaptureSlot
              label={t("dni_verification.selfie_label")}
              hint={t("dni_verification.selfie_hint")}
              previewUrl={selfiePreview}
              captureMode="user"
              isUploading={false}
              onFileSelected={(file) => {
                setSelfieFile(file);
                setSelfiePreview(URL.createObjectURL(file));
              }}
            />
          )}

          {step === "review" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>
                  {t("dni_verification.review_dni")}: <strong className="font-mono">{dni}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {documentPreview && (
                  <img
                    src={documentPreview}
                    alt="DNI"
                    className="rounded-xl border border-border aspect-[4/3] object-cover"
                  />
                )}
                {selfiePreview && (
                  <img
                    src={selfiePreview}
                    alt="Selfie"
                    className="rounded-xl border border-border aspect-[4/3] object-cover"
                  />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                {t("dni_verification.review_note")}
              </p>
            </div>
          )}

          {dniError && (
            <span className="text-[11px] text-destructive block text-center font-medium">
              {dniError}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground block text-center">
            {t("dni_verification.attempts_remaining", { count: attemptsLeft })}
          </span>
        </div>

        <DialogFooter className="flex justify-between gap-2 pt-4 border-t border-border">
          {step !== "dni" ? (
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 rounded-xl glass text-xs cursor-pointer"
              disabled={isSubmitting}
            >
              {t("dni_verification.back")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl glass text-xs cursor-pointer"
              disabled={isSubmitting}
            >
              {t("dni_verification.cancel")}
            </button>
          )}

          {step === "review" ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-gradient-neon text-neon-foreground text-xs font-bold cursor-pointer flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("dni_verification.submitting")}
                </>
              ) : (
                <>
                  <UserRound className="h-3.5 w-3.5" />
                  {t("dni_verification.submit")}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="px-4 py-2 rounded-xl bg-gradient-neon text-neon-foreground text-xs font-bold cursor-pointer"
              disabled={!canGoNext || isSubmitting}
            >
              {t("dni_verification.next")}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
