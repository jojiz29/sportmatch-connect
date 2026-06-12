/**
 * ===================================================================
 * ARCHIVO: src/shared/hooks/useStrictForm.ts
 * PROPÓSITO: Hook de formulario estricto con validación defensiva.
 *            Protege contra espacios vacíos, leading spaces y
 *            maneja trimming profundo en todos los strings.
 * INCLUYE: Validación, trim automático en blur y submit,
 *          detección de espacios inválidos, toasts de feedback.
 * ===================================================================
 */

import { useState, ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";

interface UseStrictFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string> | null;
  onSubmit: (values: T) => void | Promise<void>;
  successMessage?: string;
}

/**
 * useStrictForm<T>(): Hook de formulario con validación defensiva
 * ------------------------------------------------------------------
 * Características de seguridad (SEC-03):
 *   - Detecta espacios vacíos puros (ej: "   ") y los rechaza
 *   - No permite espacios al inicio del valor
 *   - Hace trim profundo de todos los strings en submit
 *   - Si se recortaron espacios, muestra warning informativo
 *   - Manejo de errores con try/catch y toast
 *
 * @param initialValues   - Valores iniciales del formulario
 * @param validate        - Función de validación (retorna errores o null)
 * @param onSubmit        - Función a ejecutar en submit exitoso
 * @param successMessage  - Mensaje toast opcional en éxito
 */
export function useStrictForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
  successMessage,
}: UseStrictFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * handleChange(): Maneja cambios en inputs con validación defensiva
   * Rechaza valores que sean solo espacios o que empiecen con espacio.
   */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Detecta espacios vacíos puros
    if (value !== "" && value.trim() === "") {
      toast.error("Entrada inválida: No se permiten espacios vacíos");
      return;
    }

    // Detecta espacios al inicio
    if (value.startsWith(" ")) {
      toast.error("Entrada inválida: No se permiten espacios al inicio");
      return;
    }

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * handleBlur(): Hace trim automático al salir del campo
   * Si el valor cambió después del trim, actualiza el estado.
   */
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

  /**
   * handleSubmit(): Procesa el formulario
   * 1. Hace trim profundo de todos los strings
   * 2. Si se recortaron espacios, muestra warning
   * 3. Ejecuta validación si existe
   * 4. Si hay errores, muestra el primero en toast y aborta
   * 5. Ejecuta onSubmit()
   * 6. Muestra mensaje de éxito si está configurado
   */
  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsSubmitting(true);

    // Trim profundo de todos los valores string
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

    // Validación
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
