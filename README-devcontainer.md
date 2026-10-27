# Optional Dev Container setup

The regular local setup is in the main README. This option runs Node, PostgreSQL, and Redis through Docker in VS Code.

1. Start Docker Desktop. Install the Microsoft Dev Containers extension in VS Code if you do not have it.
2. Open the main `DBE Integrations` folder in VS Code.
3. Choose **Dev Containers: Reopen in Container** from the Command Palette.
4. Wait for the dependencies, Prisma client, and database migrations to finish.
5. In the container terminal, run:

```bash
cd code/start
npm run dev
```

VS Code forwards port 3002. Use the Bruno collection and Local environment as described in the main README. Keep the API running while you test.

Docker gives the container its database and Redis addresses through environment variables. Inside the container those are `postgres:5432` and `redis:6379`; the host's `.env.example` uses `localhost:5433` and `localhost:6380` instead.

The regular local setup has been tested. The optional Dev Container configuration has been checked with Docker Compose, but a full container rebuild has not been run.
