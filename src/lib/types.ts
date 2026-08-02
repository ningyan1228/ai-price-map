export type PriceType = '官方公开价' | '含税估算' | '用户实测参考';
export interface Price { id: string; region: string; regionSlug: string; plan: 'Free'|'Plus'|'Pro'|'Business'; price: number; currency: string; usd: number; cny: number; taxNote: string; channelNote: string; source: string; sourceName: string; verifiedAt: string; confidence: PriceType; }
export interface News { slug: string; title: string; source: string; sourceUrl: string; publishedAt: string; companies: string[]; category: string; summary: string; importance: number; }
export interface Tool { slug: string; name: string; free: boolean; monthlyPrice: string; strength: string; audience: string; url: string; }
export interface PriceHistory { priceId: string; date: string; price: number; currency: string; cny: number; changeType: '官方定价'|'汇率'|'税费'|'数据修正'; source: string; note: string; }
