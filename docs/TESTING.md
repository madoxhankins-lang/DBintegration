# Test results

Checked on October 26, 2026, using Node.js 24, PostgreSQL 16, and Redis 7.

- TypeScript build: passed (`npm run build`).
- Both Prisma migrations: applied successfully to the local Docker database.
- API integration tests: 15 passed, 0 failed (`npm test` with the API running).
- Bruno collection: 15 requests passed and 15 tests passed, using Bruno CLI 4.3.0.
- VS Code Bruno extension: server check, product creation, and the MISS/HIT cache pair verified in the visual request editor. Screenshots are saved in `screenshots/`.
- Optional Dev Container: combined Docker Compose configuration validated. A full Dev Container rebuild was not tested.

The API tests check saved products, optional categories, matching database/cached responses, cache expiry settings, clearing the right cache keys after writes, invalid inputs and IDs, malformed JSON, missing products, and unknown routes. They create and clean up their own test products.

To repeat the API tests, start the API, then in another terminal:

```powershell
cd code\start
npm test
```

For the Bruno extension, run the collection's 15 requests in number order. Start with a new create request. Send each cache pair within 60 seconds.

The collection can also be checked from its folder with the CLI:

```powershell
cd "bruno\Product API"
npx --yes @usebruno/cli@4.3.0 run --env Local
```

The `X-Cache` header and Redis key checks prove whether caching was used; response timing by itself does not.
