import "dotenv/config";
import { db } from "@/index";
import { exoplanetLibrary } from "@/db/schema";
import { ExoplanetData } from "@/types";

async function fetchAllValidExoplanets(): Promise<ExoplanetData[]> {
  console.log("Fetching all valid exoplanets...");
  const query =
    "select pl_name,hostname,pl_letter,hd_name,hip_name,tic_id,gaia_id," +
    "discoverymethod,disc_year,disc_locale,disc_facility,disc_telescope," +
    "disc_instrument,pl_masse,pl_rade,pl_orbper,pl_eqt,pl_orbeccen,st_spectype " +
    "from pscomppars where pl_name is not null and pl_masse is not null " +
    "order by pl_name";
  const encodedQuery = encodeURIComponent(query);
  const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodedQuery}&format=json`;

  try {
    const repsonse = await fetch(url, { cache: "no-store" });
    if (!repsonse.ok) {
      throw new Error(`HTTP error! status: ${repsonse.status}`);
    }
    const data = await repsonse.json();
    if (!data || data.length === 0) {
      throw new Error("No data found");
    }
    console.log(`Fetched ${data.length} exoplanets`);
    return data;
  } catch (error) {
    console.error("Error fetching exoplanet data:", error);
    throw new Error("Failed to fetch exoplanet data");
  }
}

async function seedDatabase() {
  try {
    const allPlanets = await fetchAllValidExoplanets();
    if (!allPlanets || allPlanets.length === 0) {
      throw new Error("No valid exoplanets found to seed.");
    }
    console.log(`Preparing to seed ${allPlanets.length} exoplanets...`);

    const planetsToInsert = allPlanets.map((planet) => ({
      planetName: planet.pl_name,
      planetData: planet,
    }));

    const batchSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < planetsToInsert.length; i += batchSize) {
      const batch = planetsToInsert.slice(i, i + batchSize);
      try {
        await db.insert(exoplanetLibrary).values(batch).onConflictDoNothing();
        insertedCount += batch.length;
        console.log(
          `Inserted batch ${
            i / batchSize + 1
          }, total inserted: ${insertedCount}`
        );
      } catch (batchError) {
        console.error(
          `Error inserting batch starting at index ${i}:`,
          batchError
        );
      }
      console.log(`Seeding completed. Total inserted: ${insertedCount}`);
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
