/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Center } from "@react-three/drei";
import type { ArCourtModelData } from "../model/types";
import * as THREE from "three";

interface Court3DSceneProps {
  data: ArCourtModelData;
  autoRotate: boolean;
  showLabels: boolean;
}

function Court3DModel({ data, autoRotate, showLabels }: Court3DSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const {
    courtDimensions,
    surfaceColor,
    lineColor,
    hasNet,
    hasHoops,
    hasGoals,
    netHeight,
    goalWidth,
    goalHeight,
  } = data;

  const courtWidth = courtDimensions.width;
  const courtLength = courtDimensions.length;

  const fieldPoints = useMemo(() => {
    const halfW = courtWidth / 2;
    const halfL = courtLength / 2;
    const pts: [number, number, number][] = [
      [-halfW, 0.01, -halfL],
      [halfW, 0.01, -halfL],
      [halfW, 0.01, halfL],
      [-halfW, 0.01, halfL],
    ];
    return pts;
  }, [courtWidth, courtLength]);

  const centerLine = useMemo(() => {
    const halfW = courtWidth / 2;
    return [
      [-halfW, 0.02, 0] as [number, number, number],
      [halfW, 0.02, 0] as [number, number, number],
    ];
  }, [courtWidth]);

  const centerCircle = useMemo(() => {
    const segments = 32;
    const radius = Math.min(courtWidth, courtLength) * 0.08;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, 0.02, Math.sin(theta) * radius]);
    }
    return pts;
  }, [courtWidth, courtLength]);

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[courtWidth + 2, courtLength + 2]} />
        <meshStandardMaterial color={surfaceColor} />
      </mesh>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(fieldPoints.flat()), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} />
      </line>

      {hasNet && (
        <mesh position={[0, (netHeight ?? 1) / 2, 0]}>
          <boxGeometry args={[courtWidth, netHeight ?? 1, 0.05]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      )}

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(centerLine.flat()), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(centerCircle.flat()), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} />
      </line>

      {hasGoals && goalWidth && goalHeight && (
        <>
          <mesh position={[0, (goalHeight ?? 2) / 2, -courtLength / 2 - 0.5]}>
            <boxGeometry args={[goalWidth ?? 7, goalHeight ?? 2, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-(goalWidth ?? 7) / 2, (goalHeight ?? 2) / 2, -courtLength / 2 - 0.5]}>
            <boxGeometry args={[0.1, goalHeight ?? 2, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[(goalWidth ?? 7) / 2, (goalHeight ?? 2) / 2, -courtLength / 2 - 0.5]}>
            <boxGeometry args={[0.1, goalHeight ?? 2, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, goalHeight ?? 2, -courtLength / 2 - 0.5]}>
            <boxGeometry args={[goalWidth ?? 7, 0.05, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Second goal */}
          <mesh position={[0, (goalHeight ?? 2) / 2, courtLength / 2 + 0.5]}>
            <boxGeometry args={[goalWidth ?? 7, goalHeight ?? 2, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-(goalWidth ?? 7) / 2, (goalHeight ?? 2) / 2, courtLength / 2 + 0.5]}>
            <boxGeometry args={[0.1, goalHeight ?? 2, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[(goalWidth ?? 7) / 2, (goalHeight ?? 2) / 2, courtLength / 2 + 0.5]}>
            <boxGeometry args={[0.1, goalHeight ?? 2, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, goalHeight ?? 2, courtLength / 2 + 0.5]}>
            <boxGeometry args={[goalWidth ?? 7, 0.05, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </>
      )}

      {hasHoops && (
        <>
          {/* Basketball hoop at one end */}
          <group position={[0, 3.05, -courtLength / 2 - 1]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 3.05]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
            <mesh position={[0, 3.05, 0]}>
              <torusGeometry args={[0.45, 0.03, 8, 16]} />
              <meshStandardMaterial color="#ff4500" />
            </mesh>
            <mesh position={[0, 2.95, 0]}>
              <boxGeometry args={[0.9, 0.05, 0.01]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          </group>
          {/* Hoop at other end */}
          <group position={[0, 3.05, courtLength / 2 + 1]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 3.05]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
            <mesh position={[0, 3.05, 0]}>
              <torusGeometry args={[0.45, 0.03, 8, 16]} />
              <meshStandardMaterial color="#ff4500" />
            </mesh>
            <mesh position={[0, 2.95, 0]}>
              <boxGeometry args={[0.9, 0.05, 0.01]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          </group>
        </>
      )}

      {showLabels && (
        <Center position={[0, 2, 0]}>
          <Text fontSize={1.5} color={lineColor} anchorX="center" anchorY="middle">
            {data.sport}
          </Text>
        </Center>
      )}
    </group>
  );
}

export function Court3DScene({ data, autoRotate, showLabels }: Court3DSceneProps) {
  const maxDim = Math.max(data.courtDimensions.length, data.courtDimensions.width);

  return (
    <Canvas
      camera={{
        position: [maxDim * 0.6, maxDim * 0.4, maxDim * 0.6],
        fov: 45,
        near: 0.1,
        far: maxDim * 5,
      }}
      shadows
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[maxDim, maxDim, maxDim]} intensity={1} castShadow />
      <directionalLight position={[-maxDim, maxDim * 0.5, -maxDim]} intensity={0.3} />
      <Court3DModel data={data} autoRotate={autoRotate} showLabels={showLabels} />
      <Grid
        position={[0, -0.01, 0]}
        args={[maxDim * 3, maxDim * 3]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9e9e9e"
        fadeDistance={maxDim * 3}
        infiniteGrid
      />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={maxDim * 0.2}
        maxDistance={maxDim * 2}
      />
    </Canvas>
  );
}
