/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { useStrictForm } from "../useStrictForm";
import { toast } from "sonner";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useStrictForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with initial values", () => {
    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: "John", bio: "" },
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.values).toEqual({ name: "John", bio: "" });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should handle change normally", () => {
    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: "" },
        onSubmit: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleChange({
        target: { name: "name", value: "Alice" },
      } as any);
    });

    expect(result.current.values.name).toBe("Alice");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should block changes with only empty spaces", () => {
    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: "" },
        onSubmit: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleChange({
        target: { name: "name", value: "   " },
      } as any);
    });

    expect(result.current.values.name).toBe("");
    expect(toast.error).toHaveBeenCalledWith("Entrada inválida: No se permiten espacios vacíos");
  });

  it("should block changes with leading spaces", () => {
    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: "" },
        onSubmit: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleChange({
        target: { name: "name", value: " Bob" },
      } as any);
    });

    expect(result.current.values.name).toBe("");
    expect(toast.error).toHaveBeenCalledWith("Entrada inválida: No se permiten espacios al inicio");
  });

  it("should trim values on blur", () => {
    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: "Charlie " },
        onSubmit: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleBlur({
        target: { name: "name", value: "Charlie " },
      } as any);
    });

    expect(result.current.values.name).toBe("Charlie");
  });

  it("should deep trim values and submit successfully", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: " Dave  " },
        onSubmit,
        successMessage: "Success!",
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.values.name).toBe("Dave");
    expect(toast.warning).toHaveBeenCalledWith("Aviso: Se han recortado los espacios innecesarios");
    expect(onSubmit).toHaveBeenCalledWith({ name: "Dave" });
    expect(toast.success).toHaveBeenCalledWith("Success!");
  });

  it("should show error on validation failure", async () => {
    const onSubmit = vi.fn();
    const validate = vi.fn((vals) => {
      if (!vals.name) {
        return { name: "Name is required" };
      }
      return null;
    });

    const { result } = renderHook(() =>
      useStrictForm({
        initialValues: { name: "" },
        validate,
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({ name: "Name is required" });
    expect(toast.error).toHaveBeenCalledWith("Error de validación: Name is required");
  });
});
