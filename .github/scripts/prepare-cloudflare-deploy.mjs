import { readFile, writeFile } from "node:fs/promises";

const configUrl = new URL("../../dist/server/wrangler.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));

// The production custom domain is already attached in Cloudflare. CI deploys
// the Worker code and assets only, so its token does not need zone-route write
// access. Keeping the route out of this generated config preserves that domain.
delete config.route;
delete config.routes;
config.workers_dev = false;

await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`);
