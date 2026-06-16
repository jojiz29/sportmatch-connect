import React, { useState } from "react";
import { FakeProfileDetector } from "./FakeProfileDetector";
import { FormAnalyzer } from "./FormAnalyzer";
import { ShieldAlert, Sparkles, Activity } from "lucide-react";

type ActiveTab = "fake-profile" | "form-analysis";

export function AiVisionDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("fake-profile");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center md:justify-start gap-3">
          <Sparkles className="h-8 w-8 text-primary shrink-0" />
          AI Vision Hub
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Audita imágenes utilizando Vertex AI y modelos multimodales avanzados de Google Cloud.
          Valida fotos artificiales y analiza tu alineación corporal deportiva al instante.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/10 pb-1 gap-2">
        <button
          onClick={() => setActiveTab("fake-profile")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "fake-profile"
              ? "border-primary text-foreground bg-white/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <ShieldAlert className="h-4.5 w-4.5" />
          Fake Profile Detector
        </button>

        <button
          onClick={() => setActiveTab("form-analysis")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "form-analysis"
              ? "border-primary text-foreground bg-white/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Activity className="h-4.5 w-4.5" />
          Form Analyzer (MVP)
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="transition-all duration-300">
        {activeTab === "fake-profile" ? <FakeProfileDetector /> : <FormAnalyzer />}
      </div>
    </div>
  );
}
