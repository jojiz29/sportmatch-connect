// ==============================================================
// types.ts — AR Court Preview type definitions
// ==============================================================

export interface ArCourtModelData {
  courtId: string;
  courtName: string;
  sport: string;
  arModelUrl: string | null;
  arScale: number;
  arRotation: { x: number; y: number; z: number } | null;
  courtDimensions: {
    length: number;
    width: number;
    unit: string;
  };
  surfaceColor: string;
  lineColor: string;
  hasNet: boolean;
  hasHoops: boolean;
  hasGoals: boolean;
  netHeight?: number;
  goalWidth?: number;
  goalHeight?: number;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
}

export interface ArCourtPreviewState {
  loading: boolean;
  data: ArCourtModelData | null;
  error: string | null;
  isFullscreen: boolean;
  showLabels: boolean;
  autoRotate: boolean;
}
