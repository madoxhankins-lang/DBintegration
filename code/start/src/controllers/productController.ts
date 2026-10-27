import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { productIdSchema, productSchema, updateProductSchema } from '../validations/productValidation';

const LIST_KEY = 'dbe:products';
const CACHE_SECONDS = 60;
const productKey = (id: number) => `dbe:product:${id}`;

export async function listProducts(_req: Request, res: Response) {
  const cached = await redis.get(LIST_KEY);
  if (cached !== null) {
    res.set('X-Cache', 'HIT').json(JSON.parse(cached));
    return;
  }
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  await redis.setEx(LIST_KEY, CACHE_SECONDS, JSON.stringify(products));
  res.set('X-Cache', 'MISS').json(products);
}

export async function getProduct(req: Request, res: Response) {
  const id = productIdSchema.parse(req.params.id);
  const key = productKey(id);
  const cached = await redis.get(key);
  if (cached !== null) {
    res.set('X-Cache', 'HIT').json(JSON.parse(cached));
    return;
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  await redis.setEx(key, CACHE_SECONDS, JSON.stringify(product));
  res.set('X-Cache', 'MISS').json(product);
}

export async function createProduct(req: Request, res: Response) {
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({ data });
  await redis.del(LIST_KEY);
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const id = productIdSchema.parse(req.params.id);
  const data = updateProductSchema.parse(req.body);
  const product = await prisma.product.update({ where: { id }, data });
  await redis.del([LIST_KEY, productKey(id)]);
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  const id = productIdSchema.parse(req.params.id);
  await prisma.product.delete({ where: { id } });
  await redis.del([LIST_KEY, productKey(id)]);
  res.status(204).send();
}
