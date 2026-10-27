import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from './utils/prisma';
import { redis } from './utils/redis';
import productRoutes from './routes/productRoutes';
import { errorHandler } from './utils/errorHandler';

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
app.use('/api/products', productRoutes);
app.use((_req, res) => { res.status(404).json({ error: 'Route not found.' }); });
app.use(errorHandler);

async function start() {
  await prisma.$connect();
  await redis.connect();
  const server = app.listen(PORT, () => {
    console.log(`Product API running at http://localhost:${PORT}`);
    console.log('PostgreSQL and Redis connected.');
  });
  server.on('error', async (err) => {
    console.error('Server could not start:', err.message);
    await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
    process.exit(1);
  });
  const shutdown = () => {
    server.close(async () => {
      await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (err) => {
  console.error('Could not connect to PostgreSQL or Redis:', err.message);
  await Promise.allSettled([prisma.$disconnect(), redis.isOpen ? redis.quit() : Promise.resolve()]);
  process.exit(1);
});
