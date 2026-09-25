# Restoring the project

The GitHub repository contains the application source, lockfile, public policy
evidence, and submission documents that leave participant names unfilled.

Use Node.js 24 or later, then run:

```sh
npm ci
npm run lint
npm test
```

`npm test` builds the application and runs the rendered application and API
checks. It does not deploy the application.

Local environment files, private submission data, `docs/local/`, and local
Wrangler state are intentionally excluded from Git. Restore required private
files separately from your protected backup; do not commit them to this public
repository. Recreate dependencies and build output instead of archiving them.

The 2026-09-26 repository synchronization was validated locally and did not
request a production deployment. Its final commit uses `[skip ci]` to avoid
triggering the push-based deployment workflow during this synchronization.
This marker applies only to that push; the deployment workflow remains in place
for future authorized changes.
