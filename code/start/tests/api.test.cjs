require('dotenv').config();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('redis');

// Run against the local API with PostgreSQL and Redis running.
const baseUrl = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 3002}`;
async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, cache: response.headers.get('x-cache'), body: text ? JSON.parse(text) : null };
}

test('Product API with real PostgreSQL and Redis', async (t) => {
  const cache = createClient({ url: process.env.REDIS_URL });
  cache.on('error', () => {});
  await cache.connect();
  const createdIds = new Set();
  let id;
  let firstRead;
  try {
    await t.test('server is running', async () => {
      assert.equal((await request('GET', '/health')).status, 200);
    });
    await t.test('create saves the product and clears the list cache', async () => {
      await request('GET', '/api/products');
      const result = await request('POST', '/api/products', { name: 'Test Keyboard', price: 49.99, stock: 10, category: 'Electronics' });
      if (result.body?.id) createdIds.add(result.body.id);
      assert.equal(result.status, 201);
      id = result.body.id;
      assert.equal(result.body.price, '49.99');
      assert.equal(await cache.exists('dbe:products'), 0);
    });
    await t.test('first list reads the database and sets a 60-second cache', async () => {
      const result = await request('GET', '/api/products');
      assert.equal(result.status, 200);
      assert.equal(result.cache, 'MISS');
      assert.ok(result.body.some((item) => item.id === id));
      const ttl = await cache.ttl('dbe:products');
      assert.ok(ttl > 0 && ttl <= 60);
    });
    await t.test('repeated list uses Redis', async () => {
      assert.equal((await request('GET', '/api/products')).cache, 'HIT');
    });
    await t.test('first product read misses cache', async () => {
      firstRead = await request('GET', `/api/products/${id}`);
      assert.equal(firstRead.status, 200);
      assert.equal(firstRead.cache, 'MISS');
    });
    await t.test('cached product matches the database response', async () => {
      const result = await request('GET', `/api/products/${id}`);
      assert.equal(result.cache, 'HIT');
      assert.deepEqual(result.body, firstRead.body);
    });
    await t.test('update clears both caches and the next read returns new data', async () => {
      const result = await request('PUT', `/api/products/${id}`, { price: 39.99, stock: 8 });
      assert.equal(result.status, 200);
      assert.equal(await cache.exists('dbe:products'), 0);
      assert.equal(await cache.exists(`dbe:product:${id}`), 0);
      const updated = await request('GET', `/api/products/${id}`);
      assert.equal(updated.cache, 'MISS');
      assert.equal(updated.body.price, '39.99');
      assert.equal(updated.body.stock, 8);
      await request('GET', '/api/products');
    });
    await t.test('invalid product bodies and empty updates return 400', async () => {
      for (const body of [
        { name: '', price: -1, stock: -2 },
        { name: 'Keyboard', price: '49.99', stock: 10 },
        { name: 'Keyboard', price: 49.99, stock: 1.5 },
        { name: 'Keyboard', price: 49.99, stock: 10, extra: true },
      ]) assert.equal((await request('POST', '/api/products', body)).status, 400);
      assert.equal((await request('PUT', `/api/products/${id}`, {})).status, 400);
    });
    await t.test('bad IDs return 400', async () => {
      for (const value of ['abc', '0', '-1', '1.5', '2147483648']) {
        assert.equal((await request('GET', `/api/products/${value}`)).status, 400);
      }
    });
    await t.test('malformed JSON returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error, 'Request body must be valid JSON.');
    });
    await t.test('delete clears caches and has an empty 204 response', async () => {
      const result = await request('DELETE', `/api/products/${id}`);
      assert.equal(result.status, 204);
      assert.equal(result.body, null);
      createdIds.delete(id);
      assert.equal(await cache.exists('dbe:products'), 0);
      assert.equal(await cache.exists(`dbe:product:${id}`), 0);
      const list = await request('GET', '/api/products');
      assert.ok(!list.body.some((item) => item.id === id));
    });
    await t.test('reading, updating, or deleting a missing product returns 404', async () => {
      assert.equal((await request('GET', `/api/products/${id}`)).status, 404);
      assert.equal((await request('PUT', `/api/products/${id}`, { stock: 2 })).status, 404);
      assert.equal((await request('DELETE', `/api/products/${id}`)).status, 404);
    });
    await t.test('category can be left out', async () => {
      const result = await request('POST', '/api/products', { name: 'No Category', price: 0, stock: 0 });
      if (result.body?.id) createdIds.add(result.body.id);
      assert.equal(result.status, 201);
      assert.equal(result.body.category, null);
    });
    await t.test('unknown routes return JSON 404', async () => {
      assert.deepEqual(await request('GET', '/missing-route'), { status: 404, cache: null, body: { error: 'Route not found.' } });
    });
  } finally {
    for (const productId of createdIds) await request('DELETE', `/api/products/${productId}`);
    await cache.quit();
  }
});
