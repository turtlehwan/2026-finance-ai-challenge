import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  // D1 is intentionally not bound in the public MVP. Keep this optional
  // access explicit so a future feature cannot silently assume persistence.
  const database = (env as typeof env & { DB?: D1Database }).DB
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Add a `d1_databases` binding named `DB` to wrangler.jsonc before using the database."
    );
  }

  return drizzle(database, { schema });
}
