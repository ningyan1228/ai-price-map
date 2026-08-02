/**
 * 只读取公开 RSS 的标题/日期/摘要/链接，按链接去重并截断摘要。
 * 不下载付费或需要登录的内容；失败不会清空现有 data/news.json。
 */
import Parser from 'rss-parser';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const feeds = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml', tags: ['OpenAI'] },
  { name: 'Google Blog', url: 'https://blog.google/technology/ai/rss/', tags: ['Google'] }
];
const clip = (text = '') => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 110);
const slugify = (input: string) => `rss-${Buffer.from(input).toString('base64url').slice(0, 42).toLowerCase()}`;
const parser = new Parser({ timeout: 12_000 }); const result: unknown[] = []; const seen = new Set<string>();
for (const feed of feeds) {
  try { const parsed = await parser.parseURL(feed.url); for (const item of parsed.items.slice(0, 12)) { if (!item.link || seen.has(item.link)) continue; seen.add(item.link); result.push({ slug: slugify(item.link), title: item.title || '官方更新', source: feed.name, sourceUrl: item.link, publishedAt: item.isoDate || item.pubDate || new Date().toISOString(), companies: feed.tags, category: '产品更新', summary: `官方公告：${clip(item.contentSnippet || item.content || item.title)}。`, importance: 5 }); } } catch (error) { console.warn(`抓取失败：${feed.name}`, error); }
}
if (result.length) { await writeFile(resolve('data/news.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8'); console.log(`已写入 ${result.length} 条新闻`); } else { console.warn('没有可用结果，保留原有 news.json'); }
