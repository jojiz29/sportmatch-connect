// ============================================================
// useNSFWJS.test.ts — Tests del hook de moderación NSFW
// Verifica detección de contenido explícito en imágenes
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { useNSFWJS } from "../useNSFWJS";
import { vi, describe, it, expect, beforeEach, afterAll } from "vitest";

// Mock @tensorflow/tfjs
vi.mock("@tensorflow/tfjs", () => {
  return {
    ready: vi.fn().mockResolvedValue(true),
  };
});

// Mock nsfwjs
const mockClassify = vi.fn();
const mockLoad = vi.fn().mockResolvedValue({
  classify: mockClassify,
});

vi.mock("nsfwjs", () => {
  return {
    load: mockLoad,
  };
});

// Set up Mock Image class in JSDOM environment
let mockImageShouldFail = false;
const originalImage = global.Image;

class MockImage {
  _src = "";
  onload: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;

  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      if (mockImageShouldFail) {
        if (this.onerror) {
          this.onerror(new Error("Mock image load failed"));
        }
      } else {
        if (this.onload) {
          this.onload();
        }
      }
    }, 0);
  }

  get src() {
    return this._src;
  }
}

describe("useNSFWJS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImageShouldFail = false;
    global.Image = MockImage as any;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Reset default mock load implementation
    mockLoad.mockResolvedValue({
      classify: mockClassify,
    });

    // Mock window URL methods
    if (typeof window !== "undefined") {
      window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  afterAll(() => {
    global.Image = originalImage;
  });

  it("should initialize with loadingModel as false and modelLoaded as false", () => {
    const { result } = renderHook(() => useNSFWJS());
    expect(result.current.loadingModel).toBe(false);
    expect(result.current.modelLoaded).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should load the model when loadModel is explicitly called", async () => {
    const { result } = renderHook(() => useNSFWJS());

    let loadPromise: any;
    act(() => {
      loadPromise = result.current.loadModel();
    });

    expect(result.current.loadingModel).toBe(true);

    await act(async () => {
      await loadPromise;
    });

    expect(result.current.loadingModel).toBe(false);
    expect(result.current.modelLoaded).toBe(true);
  });

  it("should classify safe images successfully (Happy Path)", async () => {
    mockClassify.mockResolvedValue([
      { className: "Neutral", probability: 0.9 },
      { className: "Porn", probability: 0.05 },
      { className: "Sexy", probability: 0.05 },
    ]);

    const { result } = renderHook(() => useNSFWJS());

    // Load model explicitly
    await act(async () => {
      await result.current.loadModel();
    });

    expect(result.current.modelLoaded).toBe(true);

    const file = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    let isSafe = false;

    await act(async () => {
      isSafe = await result.current.analyzeImage(file);
    });

    expect(isSafe).toBe(true);
    expect(mockClassify).toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should block unsafe images (Violation Path)", async () => {
    mockClassify.mockResolvedValue([
      { className: "Neutral", probability: 0.2 },
      { className: "Porn", probability: 0.75 }, // Porn probability is 0.75 (> 0.60)
    ]);

    const { result } = renderHook(() => useNSFWJS());

    await act(async () => {
      await result.current.loadModel();
    });

    const file = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    let isSafe = true;

    await act(async () => {
      isSafe = await result.current.analyzeImage(file);
    });

    expect(isSafe).toBe(false);
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should default to safe (graceful fallback) if model loading fails", async () => {
    mockLoad.mockRejectedValue(new Error("CDN loading failed"));

    const { result } = renderHook(() => useNSFWJS());

    await act(async () => {
      await result.current.loadModel();
    });

    expect(result.current.modelLoaded).toBe(false);
    expect(result.current.error).toBe("Failed to load AI moderation model");

    const file = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    let isSafe = false;

    await act(async () => {
      isSafe = await result.current.analyzeImage(file);
    });

    // Fallback gracefully: permits uploads if model fails
    expect(isSafe).toBe(true);
  });

  it("should default to safe (graceful fallback) if image loading fails during analysis", async () => {
    mockImageShouldFail = true;
    mockClassify.mockResolvedValue([]);

    const { result } = renderHook(() => useNSFWJS());

    await act(async () => {
      await result.current.loadModel();
    });

    const file = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    let isSafe = false;

    await act(async () => {
      isSafe = await result.current.analyzeImage(file);
    });

    // Fallback gracefully
    expect(isSafe).toBe(true);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
