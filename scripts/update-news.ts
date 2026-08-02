/**
 * 合规新闻聚合器：只读取 data/sources.json 中启用的公开官方 RSS。
 * 仅保留标题、日期、链接并生成短中文规则摘要；不抓取登录、付费或禁止自动访问的内容。
 */
import Parser from 'rss-parser';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Source = { name: string; type: string; url: string; feedUrl?: string; tags?: string[]; enabled?: boolean };
type FeedItem = { title?: string; link?: string; isoDate?: string; pubDate?: string; contentSnippet?: string; content?: string };
const root = resolve(import.meta.dirname, '..');
const sources = JSON.parse(await readFile(resolve(root, 'data/sources.json'), 'utf8')) as Source[];
const feeds = sources.filter((source) => source.type === '新闻' && source.enabled !== false && source.feedUrl);
const parser = new Parser({ timeout: 15_000, headers: { 'User-Agent': 'AI-Price-Map/0.1 (public RSS aggregator)' } });

function slugify(input: string) { return `rss-${Buffer.from(input).toString('base64url').slice(0, 42).toLowerCase()}`; }
function clip(input = '', length = 72) { return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, length); }
function category(title: string) {
  const text = title.toLowerCase();
  if (/(price|pricing|subscription|plan|收费|价格)/.test(text)) return '价格调整';
  if (/(policy|safety|regulat|政策|安全)/.test(text)) return '政策';
  if (/(open source|open-source|github|开源)/.test(text)) return '开源项目';
  if (/(model|gpt|gemini|claude|模型)/.test(text)) return '模型发布';
  return '产品更新';
}
function chineseSummary(source: Source, item: FeedItem) {
  const subject = clip(item.title || item.contentSnippet || '最新官方更新');
  return `${source.name}发布官方更新，主题为“${subject}”。本页仅整理公开信息，请通过原文链接核验完整内容。`.slice(0, 120);
}

const collected: Array<Record<string, unknown>> = [];
const seen = new Set<string>();
for (const source of feeds) {
  try {
    const parsed = await parser.parseURL(source.feedUrl!);
    for (const item of (parsed.items as FeedItem[]).slice(0, 12)) {
      if (!item.link || seen.has(item.link)) continue;
      seen.add(item.link);
      collected.push({
        slug: slugify(item.link), title: item.title || '官方更新', source: source.name, sourceUrl: item.link,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(), companies: source.tags || [source.name],
        category: category(item.title || ''), summary: chineseSummary(source, item), importance: 6
      });
    }
  } catch (error) { console.warn(`抓取失败：${source.name}`, error); }
}
if (!collected.length) throw new Error('所有新闻源均不可用；为保护现有数据，未修改 data/news.json');
collected.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
await writeFile(resolve(root, 'data/news.json'), `${JSON.stringify(collected, null, 2)}\n`, 'utf8');
console.log(`已从 ${feeds.length} 个公开官方 RSS 获取 ${collected.length} 条新闻`);
