/** 将公开汇率折算写回 prices.json。失败时退出非零，不修改原文件。 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const file = resolve('data/prices.json');
const prices = JSON.parse(await readFile(file, 'utf8'));
const currencies = [...new Set(prices.map((p: { currency: string }) => p.currency).filter((c: string) => c !== 'CNY'))];
const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencies.join(',')}`);
if (!response.ok) throw new Error(`汇率请求失败：${response.status}`);
const feed = await response.json() as { rates: Record<string, number>; date: string };
const rateToUsd = (currency: string) => currency === 'USD' ? 1 : 1 / feed.rates[currency];
for (const p of prices) { p.usd = Number((p.price * rateToUsd(p.currency)).toFixed(2)); p.cny = Number((p.usd * (1 / feed.rates.CNY)).toFixed(0)); p.verifiedAt = feed.date; }
await writeFile(file, `${JSON.stringify(prices, null, 2)}\n`, 'utf8');
console.log(`已更新 ${prices.length} 条价格的汇率折算，参考日期：${feed.date}`);
