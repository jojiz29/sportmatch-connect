import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://images.unsplash.com/...",
  id,
}: ImageUploadFieldProps) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limitamos el archivo antes de prepararlo para su posterior subida a Storage.
    if (file.size > 2.5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande. El límite es de 2.5MB.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      setLoading(false);
      toast.success("Imagen procesada localmente con éxito.");
    };
    reader.onerror = () => {
      setLoading(false);
      toast.error("Error al leer el archivo de imagen.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2 text-left w-full">
      {label && <label className="text-xs font-semibold block text-foreground">{label}</label>}

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-accent/20 aspect-video max-h-36 flex items-center justify-center group w-full">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1554068865-24cecd4e34b8";
            }}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all border-0 cursor-pointer shadow-md"
              title="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {/* Option A: URL */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-xs text-foreground placeholder:text-muted-foreground/50"
            placeholder={placeholder}
            id={id}
          />
          <div className="text-center text-[9px] text-muted-foreground/60 uppercase font-bold tracking-widest my-0.5">
            ó subir archivo local
          </div>
          {/* Option B: Local file selection */}
          <label className="flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all duration-200 group">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
              {loading ? "Procesando imagen..." : "Seleccionar imagen (.jpg, .png)"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
