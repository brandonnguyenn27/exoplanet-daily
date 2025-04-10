import { ExoplanetData } from "@/types";
import { exoplanetLibrary } from "@/db/schema";
import { db } from "@/index";
import { count } from "drizzle-orm";
import { getDayOfYear } from "@/utils/helper";

export async function fetchRandomExoplanet(): Promise<ExoplanetData> {
  try {
    console.log("Fetching daily exoplanet...");
    const countResult = await db
      .select({ value: count() })
      .from(exoplanetLibrary);
    const totalPlanets = countResult[0].value ?? 0;
    if (totalPlanets === 0) {
      throw new Error("No exoplanets found in the database");
    }

    const today = new Date();
    const dayNumber = getDayOfYear(today);
    const planetIndex = (dayNumber - 1) % totalPlanets;
    console.log(
      `Planet index for today (${dayNumber}), Fetching index: ${planetIndex}`
    );

    const planetResult = await db
      .select()
      .from(exoplanetLibrary)
      .orderBy(exoplanetLibrary.id)
      .limit(1)
      .offset(planetIndex)
      .get();

    if (!planetResult) {
      throw new Error(`No exoplanet found for index ${planetIndex}`);
    }
    console.log(`Fetched exoplanet: ${planetResult.planetName}`);
    return planetResult.planetData;
  } catch (error) {
    console.error("Error fetching exoplanet data:", error);
    throw new Error("Failed to fetch exoplanet data");
  }
}
