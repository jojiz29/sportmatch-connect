// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceRecorder } from "../useVoiceRecorder";

vi.mock("../../api/voiceApi", () => ({
  transcribeAudio: vi.fn(),
}));

class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: any = null;
  onerror: any = null;
  onend: any = null;
  start = vi.fn(function (this: any) {
    if (this.onresult) {
      this.onresult({
        resultIndex: 0,
        results: [[{ transcript: "hola mundo", confidence: 0.9 }]],
      });
    }
    if (this.onend) {
      this.onend();
    }
  });
  stop = vi.fn();
}

describe("useVoiceRecorder Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock permissions and mediaDevices
    Object.defineProperty(global.navigator, "permissions", {
      value: {
        query: vi.fn().mockResolvedValue({ state: "granted" }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    });

    // Mock AudioContext
    (global as any).AudioContext = class {
      createMediaStreamSource() {
        return { connect: vi.fn() };
      }
      createAnalyser() {
        return { fftSize: 0, frequencyBinCount: 256, getByteFrequencyData: vi.fn() };
      }
    };

    // Mock SpeechRecognition
    (global as any).window = global.window || {};
    (global as any).window.webkitSpeechRecognition = MockSpeechRecognition;
  });

  it("debe inicializar en estado idle y modo desconocido", () => {
    const { result } = renderHook(() => useVoiceRecorder());
    expect(result.current.state).toBe("idle");
    expect(result.current.mode).toBe("unknown");
    expect(result.current.transcript).toBe("");
  });

  it("debe iniciar reconocimiento Web Speech si está soportado y tiene permisos", async () => {
    const { result } = renderHook(() => useVoiceRecorder({ language: "es" }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.transcript).toBe("hola mundo");
    expect(result.current.mode).toBe("web-speech");
  });
});
