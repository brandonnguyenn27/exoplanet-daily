import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { ExoplanetData, PlanetFeatures } from "@/types";
export const planets = sqliteTable("planets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  planetName: text("planet_name").notNull(),
  planetData: text("planet_data", { mode: "json" })
    .$type<ExoplanetData>()
    .notNull(),
  generatedFeatures: text("generated_features", { mode: "json" })
    .$type<PlanetFeatures>()
    .notNull(),
});

export const exoplanetLibrary = sqliteTable("exoplanet_library", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planetName: text("planet_name").notNull().unique(),
  planetData: text("planet_data", { mode: "json" })
    .$type<ExoplanetData>()
    .notNull(),
});
