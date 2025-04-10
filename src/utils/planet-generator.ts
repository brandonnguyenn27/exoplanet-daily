import { ExoplanetData, PlanetFeatures } from "@/types";
import { createNoise2D } from "simplex-noise";

export function generatePlanetFeatures(
  planetData: ExoplanetData
): PlanetFeatures {
  const seed = hashString(planetData.pl_name);
  const noise2D = createNoise2D(() => seed / Number.MAX_SAFE_INTEGER);

  const massRatio = planetData.pl_masse
    ? Math.min(planetData.pl_masse / 10, 1)
    : 0.5;
  const mountainousness = 1 - 0.7 * massRatio;

  const tempK = planetData.pl_eqt || Math.floor(Math.random() * 301);
  let baseColor, waterColor;
  if (tempK < 200) {
    // Cold planet - blues and whites
    baseColor = "#a3c7d6";
    waterColor = "#1e3b70";
  } else if (tempK < 350) {
    // Earth-like
    baseColor = "#4f7942";
    waterColor = "#0077be";
  } else {
    // Hot planet - reds and browns
    baseColor = "#8b4513";
    waterColor = "#d2691e";
  }
  const landMassPercentage =
    tempK > 373 ? 100 : Math.min(30 + (tempK - 260) / 2, 100);

  return {
    landMassPercentage,
    mountainousness,
    terrainRoughness: 0.5 + (noise2D(0, 0) * 0, 5),
    baseColor,
    landColor: shiftColor(baseColor, 20),
    waterColor,
    atmosphereColor: tempK < 300 ? "#a6c8ff" : "#ffec98",
    atmosphereDensity: 0.2 + noise2D(1, 1) * 0.8,
    hasRings: noise2D(2, 2) > 0.8,
    seed,
  };
}

function shiftColor(hex: string, percent: number): string {
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));

  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
