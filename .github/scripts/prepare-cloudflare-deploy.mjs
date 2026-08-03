import { readFile, writeFile } from "node:fs/promises";

const configUrl = new URL("../../dist/server/wrangler.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));

// The production custom domain is attached once as Cloudflare infrastructure.
// CI uses a code-only token: it uploads and promotes a Worker version without
// changing zone routes or domains.
delete config.route;
delete config.routes;
config.workers_dev = false;

await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`);
