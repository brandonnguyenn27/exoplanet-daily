"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PlanetFeatures } from "@/types";
import * as THREE from "three";
import { createNoise2D, createNoise3D } from "simplex-noise";

interface PlanetProps {
  features: PlanetFeatures;
}

/**
 * Generates procedural textures for the planet based on its features.
 * Creates color, displacement, and normal maps.
 */
function createProceduralMaps(features: PlanetFeatures): {
  map: THREE.Texture;
  displacementMap: THREE.Texture;
  normalMap: THREE.Texture;
} {
  const width = 1024,
    height = 512;

  // Canvases
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorCtx = colorCanvas.getContext("2d")!;

  const displacementCanvas = document.createElement("canvas");
  displacementCanvas.width = width;
  displacementCanvas.height = height;
  const displacementCtx = displacementCanvas.getContext("2d", {
    willReadFrequently: true, // Optimization for reading pixel data
  })!;

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normalCtx = normalCanvas.getContext("2d")!;

  // Noise generators using the provided seed
  const terrainNoise = createNoise2D(
    () => features.seed / Number.MAX_SAFE_INTEGER
  );
  const heightNoise = createNoise2D(
    () => (features.seed + 1) / Number.MAX_SAFE_INTEGER
  );

  // Temporary storage for height data (0 to 1 range)
  const heightData = new Float32Array(width * height);

  // --- Pass 1: Generate Color and Height Data ---
  colorCtx.fillStyle = features.waterColor;
  colorCtx.fillRect(0, 0, width, height);
  colorCtx.fillStyle = features.landColor;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const index = y * width + x;

      // Terrain Noise (for land/water separation)
      // Multiple octaves for more detail
      const terrainFrequency = 1.5;
      let terrainValue =
        terrainNoise(u * terrainFrequency * 2, v * terrainFrequency * 2) * 0.6 +
        terrainNoise(u * terrainFrequency * 4, v * terrainFrequency * 4) * 0.3 +
        terrainNoise(u * terrainFrequency * 8, v * terrainFrequency * 8) * 0.1;

      // Map landMassPercentage (0-100) to a noise threshold (-1 to 1)
      const threshold = (features.landMassPercentage / 100.0) * 2.0 - 1.0;
      const isLand = terrainValue > threshold;

      if (isLand) {
        colorCtx.fillRect(x, y, 1, 1);
      }

      // Height Noise (for displacement and normals)
      // Multiple octaves, influenced by terrainRoughness
      const heightFrequency = 2 * features.terrainRoughness;
      let heightValue =
        (heightNoise(u * heightFrequency * 5, v * heightFrequency * 5) * 0.5 +
          heightNoise(u * heightFrequency * 10, v * heightFrequency * 10) *
            0.25 +
          heightNoise(u * heightFrequency * 20, v * heightFrequency * 20) *
            0.125) /
        0.875; // Normalize noise roughly to [-1, 1]

      // Store height data in the 0 to 1 range
      heightData[index] = heightValue * 0.5 + 0.5;

      // Draw displacement map (grayscale 0-255)
      const displacementColor = Math.floor(heightData[index] * 255);
      displacementCtx.fillStyle = `rgb(${displacementColor},${displacementColor},${displacementColor})`;
      displacementCtx.fillRect(x, y, 1, 1);
    }
  }

  // --- Pass 2: Generate Normal Map from Height Data ---
  const strength = 5.0; // Controls the intensity of the normal map effect

  function getHeight(x: number, y: number): number {
    // Clamp coordinates to texture bounds
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    return heightData[y * width + x];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Get heights of neighboring pixels
      const heightL = getHeight(x - 1, y); // Left
      const heightR = getHeight(x + 1, y); // Right
      const heightD = getHeight(x, y - 1); // Down (Top in texture space)
      const heightU = getHeight(x, y + 1); // Up (Bottom in texture space)

      // Calculate the normal vector using finite differences
      const n = new THREE.Vector3(
        (heightL - heightR) * strength, // X-component of normal
        (heightD - heightU) * strength, // Y-component of normal
        1.0 // Z-component (points "out" from the surface)
      ).normalize(); // Ensure the vector has length 1

      // Convert normal vector components [-1, 1] to RGB color values [0, 255]
      const r = Math.floor((n.x * 0.5 + 0.5) * 255);
      const g = Math.floor((n.y * 0.5 + 0.5) * 255);
      const b = Math.floor((n.z * 0.5 + 0.5) * 255); // Should be mostly blueish

      normalCtx.fillStyle = `rgb(${r},${g},${b})`;
      normalCtx.fillRect(x, y, 1, 1);
    }
  }

  // --- Create THREE.js Textures from Canvases ---
  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping; // How texture repeats horizontally
  map.wrapT = THREE.ClampToEdgeWrapping; // How texture repeats vertically

  const displacementMap = new THREE.CanvasTexture(displacementCanvas);
  displacementMap.wrapS = THREE.RepeatWrapping;
  displacementMap.wrapT = THREE.ClampToEdgeWrapping;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;

  // Mark textures for update if needed (usually handled by CanvasTexture)
  map.needsUpdate = true;
  displacementMap.needsUpdate = true;
  normalMap.needsUpdate = true;

  return { map, displacementMap, normalMap };
}

/**
 * Renders the 3D planet mesh, atmosphere, and rings.
 */
function Planet({ features }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotate the planet slowly on its axis
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1; // Adjust rotation speed
    }
  });

  // Generate procedural textures only when features change
  const textures = useMemo(() => {
    return createProceduralMaps(features);
  }, [features]);

  return (
    <group>
      {/* Main Planet Mesh */}
      <mesh ref={meshRef}>
        {/* High-resolution sphere geometry */}
        <sphereGeometry args={[1, 128, 128]} />
        {/* Material using the generated textures */}
        <meshPhongMaterial
          // color={features.baseColor} // Base color can tint the texture
          map={textures.map} // Color texture
          displacementMap={textures.displacementMap} // Height map for bumps
          displacementScale={0.05 * features.mountainousness} // How much displacement affects geometry
          normalMap={textures.normalMap} // Texture faking surface bumps/details
          normalScale={new THREE.Vector2(0.8, 0.8)} // Strength of the normal map effect
          specularMap={textures.map} // Use color map to control shininess (e.g., water shinier than land)
          shininess={10} // Adjust shininess level
        />
      </mesh>

      {/* Atmosphere Layer (optional) */}
      {features.atmosphereDensity > 0.1 && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          {" "}
          {/* Slightly larger sphere */}
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhongMaterial
            color={features.atmosphereColor}
            transparent={true}
            opacity={0.3 * features.atmosphereDensity} // Control transparency
            side={THREE.BackSide} // Render the inside for a halo effect
            depthWrite={false} // Don't obscure objects behind it
          />
        </mesh>
      )}

      {/* Planetary Rings (optional) */}
      {features.hasRings && (
        <mesh rotation={[Math.PI / 6, 0, 0]}>
          {" "}
          {/* Tilt the rings */}
          <ringGeometry args={[1.4, 2.2, 64]} />{" "}
          {/* Inner radius, outer radius, segments */}
          <meshStandardMaterial
            color="#d3c3a1" // Ring color
            transparent={true}
            opacity={0.6}
            side={THREE.DoubleSide} // Visible from both sides
            roughness={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Main component setting up the Three.js canvas and controls.
 */
export default function PlanetViewer({ features }: PlanetProps) {
  return (
    <div className="w-full h-[400px] md:h-[500px] bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden border border-gray-700 shadow-lg">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={1.8} color="#fff7e8" />

        {/* Planet Component */}
        <Planet features={features} />

        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false} // Optional: disable panning
          minDistance={1.5} // Prevent zooming too close
          maxDistance={5} // Prevent zooming too far out
          autoRotate={false} // Optional: enable auto-rotation
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
