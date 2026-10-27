# DBE Integrations

This is my product inventory API for WD2200. I can add, view, update, and delete products. It uses Express and TypeScript, PostgreSQL to save the products, Prisma to work with the database, and Redis to cache the GET requests. Zod checks the data before it gets saved.

## Run it locally

You need Node.js 20 or newer and Docker Desktop running. From this project folder:

```powershell
docker compose up -d --wait
cd code\start
npm ci
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

The API runs at **http://localhost:3002**. Leave that terminal open. The example settings are for the local Docker setup. Keep your `.env` file out of GitHub.

## Test it in Bruno

Open `Product API.code-workspace` in VS Code. Trust the workspace if VS Code asks, then click the Bruno sidebar icon. Open the collection folder `bruno\Product API` if it does not show up automatically, and select **Local**.

Run the 15 requests in number order. **Create product** saves the product ID for the other requests. Run each cache pair within 60 seconds: the response header `X-Cache: MISS` means it read from PostgreSQL, and `X-Cache: HIT` means it used Redis. Adding, updating, or deleting a product clears the affected cache so the next read gets fresh data.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get one product |
| POST | `/api/products` | Add a product |
| PUT | `/api/products/:id` | Update one or more fields |
| DELETE | `/api/products/:id` | Delete a product |

For a POST, use JSON like this:

```json
{ "name": "Demo Keyboard", "price": 49.99, "stock": 10, "category": "Electronics" }
```

The name cannot be blank, price cannot be negative, and stock must be a whole number of zero or more. Category is optional. Prisma returns the decimal price as a string, like `"49.99"`. A bad request gets `400`, a missing product gets `404`, and a successful delete gets `204` with no body.

## A few other commands

From `code\start`, run `npm test` while the API is running to check CRUD, caching, validation, and error responses. Run `npm run build` and then `npm start` to use the compiled app.

From the project folder, `docker compose stop` stops the database and Redis. Products stay saved in the PostgreSQL volume.

My [video walkthrough](docs/VIDEO-WALKTHROUGH.md) explains the files and the Bruno demo. There are also [screenshots](docs/screenshots/README.md) and [test results](docs/TESTING.md). The [original assignment](docs/ASSIGNMENT.md) is saved separately. The [Dev Container guide](README-devcontainer.md) is there if you want that setup instead.
