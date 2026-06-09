import { useState, ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";

interface UseStrictFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string> | null;
  onSubmit: (values: T) => void | Promise<void>;
  successMessage?: string;
}

export function useStrictForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
  successMessage,
}: UseStrictFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Detect purely empty spaces or leading spaces to defend the backend
    if (value !== "" && value.trim() === "") {
      toast.error("Entrada inválida: No se permiten espacios vacíos");
      return;
    }

    if (value.startsWith(" ")) {
      toast.error("Entrada inválida: No se permiten espacios al inicio");
      return;
    }

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== value) {
        setValues((prev) => ({
          ...prev,
          [name]: trimmed,
        }));
      }
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsSubmitting(true);

    // Deep trim all string values on submit
    const trimmedValues = { ...values } as Record<string, unknown>;
    let hasInvalidSpaces = false;

    Object.keys(trimmedValues).forEach((key) => {
      const val = trimmedValues[key];
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (val !== trimmed) {
          hasInvalidSpaces = true;
        }
        trimmedValues[key] = trimmed;
      }
    });

    if (hasInvalidSpaces) {
      toast.warning("Aviso: Se han recortado los espacios innecesarios");
    }

    setValues(trimmedValues as T);

    // Validate
    if (validate) {
      const validationErrors = validate(trimmedValues as T);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        toast.error(`Error de validación: ${firstError}`);
        setIsSubmitting(false);
        return;
      }
    }

    setErrors({});

    try {
      await onSubmit(trimmedValues as T);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error: unknown) {
      console.error("Form submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    setValues,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
  };
}
