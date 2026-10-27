# Five-minute video walkthrough

Use this as a guide and say it in your own words. The talking parts plus clicking through the requests should take about five minutes. You do not need to read every line of code.

## Before recording

- Start Docker and the API using the README commands.
- Open `Product API.code-workspace` in VS Code. Use the Bruno extension and the **Local** environment.
- Expand the **DBE Product API** collection. Run requests in number order, starting with a new **Create product** each time you do the demo.
- Keep the file explorer handy. Show the code first, then switch to Bruno for the requests.
- Keep each pair of cache requests less than 60 seconds apart. Open the response **Headers** tab to show `X-Cache`.
- If **Headers** is hidden, click the double arrow beside **Response**. Open requests from **Bruno Collections** so they use the visual editor. If a file opens as YAML, click **Open with Bruno Editor** at the top right.
- There are extra error checks in the collection if you have time. The full run has 15 requests.

## 0:00–0:35 — What the project does

“This is my database integration project for WD2200. It's a product inventory API. I can add a product, look at the products, change one, and delete one. I'm using Express with TypeScript for the server. PostgreSQL saves the products, Prisma handles the database queries, and Redis keeps a temporary copy of the GET results. I'm using Bruno inside VS Code to test it.”

## 0:35–1:30 — Show how the files connect

Open `src/index.ts`, `routes/productRoutes.ts`, and `controllers/productController.ts` under `code/start`.

“The index file starts the app, connects to PostgreSQL and Redis, and sets up the middleware. It waits for both connections before the server starts taking requests. Morgan logs the requests, CORS lets browser apps call the API, and Express reads the JSON body.

“The routes file matches the request method and URL to the right controller. The controller is where the work happens. For example, creating a product checks the data, saves it through Prisma, clears the product list cache, and sends the saved product back.”

Briefly show `prisma/schema.prisma` and `validations/productValidation.ts`.

“The Prisma schema describes a product: ID, name, price, stock, category, and the dates it was created and updated. The migration files create that table and keep the database in sync. Zod checks incoming data, so a blank name, negative price, or invalid stock gets rejected. The error handler gives back a useful response when something is wrong.”

## 1:30–2:20 — Create and read in Bruno

Run **01 Server check**, **02 Create product**, and **03 List from database**. Show the JSON body before sending the create request.

“I'm sending a POST request with a keyboard's name, price, stock, and category. The response is 201, which means it was created. It gives me the new ID and the saved product. Bruno saves that ID so I don't have to copy it into every request. The GET request lists the products, and this keyboard is there.”

Point out that the returned price is a string because Prisma uses a Decimal for it.

## 2:20–3:00 — Show Redis caching

Run **04 List from Redis** right after 03. Show **Headers** on both responses. Then run **05 Get product from database** and **06 Get product from Redis** if time allows.

“On the first read, X-Cache says MISS. That means the controller got the products from PostgreSQL and put a copy in Redis for 60 seconds. On the next read, it says HIT, so the controller returned the cached copy without querying the product table again. PostgreSQL is still where the products are saved. Redis is just the temporary shortcut.”

Use the header as your evidence. Response times can vary, so a faster response by itself does not prove caching.

## 3:00–3:45 — Update and show fresh data

Run **07 Update product**, **08 Get updated product**, and **09 List after update**.

“Now I'm changing the price to 39.99 and the stock to eight. The PUT request returns 200 and the updated product. Updating clears both the cached product and the cached list. This next GET says MISS and shows the new values. That keeps the app from giving me the old information after a change.”

## 3:45–4:15 — Show validation

Run **10 Invalid product** and, if time permits, **11 Invalid ID**.

“Here I'm sending a blank name and negative numbers. The API returns 400 with validation details instead of saving it. A bad ID also gets a 400. Those errors go through the same error handler.”

## 4:15–5:00 — Delete and wrap up

Run **12 Delete product**, **13 Get deleted product**, and **15 List after delete**. Request 14 is an extra missing-product update check.

“The delete returns 204, which means it worked and there's no response body. When I try to get that same ID, I get 404 because it's gone. The product list also no longer includes it.

“So the connection is Bruno sends a request, Express picks the route, the controller validates the data and uses Prisma for PostgreSQL, and Redis handles the temporary GET cache. The response comes back to Bruno. I also have automated tests for the database operations, cache hits and clearing, invalid requests, and missing products.”

## File cheat sheet

| File or folder | What it is for |
| --- | --- |
| `code/start/src/index.ts` | Starts Express, connects services, registers middleware and routes, closes connections on shutdown. |
| `src/routes/productRoutes.ts` | Maps GET, POST, PUT, and DELETE URLs to controller functions. |
| `src/controllers/productController.ts` | Reads/writes products and manages the Redis cache. |
| `src/validations/productValidation.ts` | Zod rules for new products, updates, and IDs. |
| `src/utils/prisma.ts` | The shared Prisma database client. |
| `src/utils/redis.ts` | The shared Redis connection and connection error logging. |
| `src/utils/errorHandler.ts` | Converts validation and database errors into JSON responses. |
| `prisma/schema.prisma` | The PostgreSQL connection setting and Product model. |
| `prisma/migrations/` | The SQL history: create the table/index, then allow category to be empty. `migration_lock.toml` records PostgreSQL as the database type. |
| `.env.example` / `.env` | Example/local connection addresses and API port. The real `.env` stays out of Git. |
| `package.json` / `package-lock.json` | Dependencies, commands, and the exact installed versions. |
| `tsconfig.json` | TypeScript checks and build output settings. |
| `.gitignore` | Keeps dependencies, secrets, generated client, and compiled files out of Git. |
| `generated/prisma/` / `dist/` | The generated database client and compiled JavaScript. Commands recreate them. |
| `tests/api.test.cjs` | Automated tests against the running API, real PostgreSQL, and real Redis. It cleans up the products it creates. |
| `docker-compose.yml` | Starts the local PostgreSQL and Redis services. A Docker volume keeps the products saved. |
| `bruno/Product API/` | The 15 request files, collection settings, and Local environment. The create request saves `productId`. |
| `Product API.code-workspace` | Opens this repo as the VS Code workspace so Bruno can find the collection. |
| `.devcontainer/` / `README-devcontainer.md` | Optional way to run Node and the services through Docker in VS Code. |
| `README.md` / `docs/ASSIGNMENT.md` | Simple project setup and the original assignment requirements. |
| `code/start/dump.rdb` | A Redis snapshot included in the starter. This Docker setup does not use it. |

Paths starting with `src`, `prisma`, or `tests` in the table are inside `code/start`.

For the Bruno scripting methods used in the collection, see the [official scripting reference](https://github.com/usebruno/bruno-docs/blob/main/testing/script/javascript-reference.mdx).
