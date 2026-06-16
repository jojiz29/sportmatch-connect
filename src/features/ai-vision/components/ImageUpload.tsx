import React, { useState, useRef, DragEvent } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  isProcessing: boolean;
  maxSizeMB?: number;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ImageUpload({ onUploadSuccess, isProcessing, maxSizeMB = 10 }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error("Formato no permitido. Utiliza JPG, JPEG, PNG o WEBP.");
      return false;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`La imagen supera el límite de ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading("Subiendo imagen temporal...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || "anonymous";

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      // Subir archivo al bucket 'ai-vision'
      const { error: uploadErr } = await supabase.storage
        .from("ai-vision")
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadErr) throw uploadErr;

      // Obtener URL pública
      const { data: urlData } = supabase.storage.from("ai-vision").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      setFilePreview(URL.createObjectURL(file));
      onUploadSuccess(publicUrl);
      toast.success("Imagen subida con éxito.", { id: toastId });
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir la imagen a Supabase.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      await uploadFile(file);
    }
  };

  const clearFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {filePreview ? (
        <div className="relative w-full aspect-[4/3] rounded-2xl border border-border/40 overflow-hidden group bg-background/20 backdrop-blur-sm">
          <img src={filePreview} alt="Previsualización" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={clearFile}
              disabled={isUploading || isProcessing}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full hover:scale-110 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="Eliminar imagen"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
          className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/40 bg-background/10 hover:border-primary/50 hover:bg-background/25"
          } ${isUploading || isProcessing ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading || isProcessing}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                Subiendo archivo...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-primary shadow-inner">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Arrastra tu imagen aquí o haz click para explorar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos permitidos: JPG, JPEG, PNG, WEBP (Máximo {maxSizeMB}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
