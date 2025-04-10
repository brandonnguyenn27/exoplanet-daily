import dotenv from "dotenv";

import type { Config } from "drizzle-kit";
dotenv.config({
  path: ".env",
});

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL! as string,
    authToken: process.env.TURSO_AUTH_TOKEN! as string,
  },
} satisfies Config;
