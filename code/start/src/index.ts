import express from 'express';
import { PrismaClient } from '../generated/prisma'
import { redis } from './utils/redis';
import productRoutes from './routes/productRoutes';
import { errorHandler } from './utils/errorHandler';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  await redis.connect();
  console.log(`Server running on port ${PORT}`);
});
