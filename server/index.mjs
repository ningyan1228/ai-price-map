/**
 * 轻量公开数据代理：仅代理合法公开汇率与本站已审核的 JSON 数据。
 * 不处理用户文件，不代理登录/付费内容，不保存个人信息。
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8787);
const origins = (process.env.ALLOWED_ORIGIN || 'http://localhost:4321').split(',').map(v => v.trim());
const root = resolve(import.meta.dirname, '..');
const cache = new Map();

await app.register(cors, { origin: (origin, cb) => cb(null, !origin || origins.includes(origin)), methods: ['GET'] });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute', hook: 'onRequest' });

app.get('/health', async () => ({ ok: true, service: 'ai-price-map-api', time: new Date().toISOString() }));

app.get('/v1/data/:name', async (request, reply) => {
  const { name } = request.params;
  if (!['prices', 'price-history', 'news', 'tools', 'sources'].includes(name)) return reply.code(404).send({ error: '未知数据集' });
  try {
    const text = await readFile(resolve(root, 'data', `${name}.json`), 'utf8');
    return reply.header('Cache-Control', 'public, max-age=300').send(JSON.parse(text));
  } catch { return reply.code(503).send({ error: '数据暂不可用' }); }
});

app.get('/v1/rates', async (request, reply) => {
  const { base = 'USD' } = request.query;
  if (!/^[A-Z]{3}$/.test(base)) return reply.code(400).send({ error: 'base 必须是三位货币代码' });
  const key = `rates:${base}`; const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return { ...hit.body, cached: true };
  try {
    // Frankfurter 使用欧洲央行公开参考汇率；不含用户数据。
    const response = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
    if (!response.ok) throw new Error(`upstream ${response.status}`);
    const payload = await response.json();
    const body = { ...payload, fetchedAt: new Date().toISOString(), provider: 'Frankfurter / ECB public reference rates', cached: false };
    cache.set(key, { body, expires: Date.now() + 12 * 60 * 60 * 1000 });
    return reply.header('Cache-Control', 'public, max-age=900').send(body);
  } catch (error) {
    request.log.warn(error, '汇率上游不可用');
    return reply.code(503).send({ error: '汇率服务暂不可用，请稍后重试' });
  }
});

await app.listen({ port, host: '0.0.0.0' });
