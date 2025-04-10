export interface ExoplanetData {
  pl_name: string; // Planet name (Usually non-null in pscomppars, but can be nullable for safety)
  hostname: string | null; // Host star name
  pl_letter: string | null; // Planet letter
  hd_name: string | null; // HD name (Often null)
  hip_name: string | null; // HIP name (Often null)
  tic_id: string | null; // TIC ID (Often null)
  gaia_id: string | null; // Gaia ID (Often null)
  discoverymethod: string | null; // Discovery method
  disc_year: number | null; // Discovery year
  disc_locale: string | null; // Discovery location (Can be null)
  disc_facility: string | null; // Discovery facility (Can be null)
  disc_telescope: string | null; // Discovery telescope (Can be null)
  disc_instrument: string | null; // Discovery instrument (Can be null)
  pl_masse: number | null; // Mass (Earth mass) - Your query filters non-null, but type allows null
  pl_eqt: number | null; // Equilibrium temperature (Kelvin) (Often null)
  pl_rade: number | null; // Radius (Earth radius) - Your query filters non-null, but type allows null
  pl_orbper: number | null; // Orbital period (days) (Can be null)
  pl_orbeccen: number | null; // Orbital eccentricity (Often null)
  st_spectype: string | null; // Host star spectral type (Can be null)
}

export interface PlanetFeatures {
  // Geography
  landMassPercentage: number; // Percentage of land mass (0-100)
  mountainousness: number; // Mountainousness (0-1)
  terrainRoughness: number; // Terrain roughness (0-1)

  // Appearance
  baseColor: string; // HEX
  landColor: string; // HEX
  waterColor: string; // HEX
  atmosphereColor: string; // HEX
  atmosphereDensity: number; // 0-1

  // Other features
  hasRings: boolean;
  seed: number; // For deterministic generation
}
