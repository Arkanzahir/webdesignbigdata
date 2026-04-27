import { CryptoPrice, HourlyPrice, HourlyVolatility, NewsVolume, PipelineStep } from './types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
};

export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd,idr&include_24hr_change=true`
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    return Object.entries(COIN_IDS).map(([symbol, id]) => ({
      symbol,
      price_usd: data[id]?.usd ?? 0,
      price_idr: data[id]?.idr ?? 0,
      change_24h: data[id]?.usd_24h_change ?? 0,
      timestamp: new Date().toISOString(),
    }));
  } catch {
    return getSimulatedPrices();
  }
}

function getSimulatedPrices(): CryptoPrice[] {
  const now = new Date().toISOString();
  return [
    { symbol: 'BTC', price_usd: 94250 + Math.random() * 500, price_idr: 1520000000 + Math.random() * 10000000, change_24h: 2.34 + (Math.random() - 0.5) * 2, timestamp: now },
    { symbol: 'ETH', price_usd: 3580 + Math.random() * 50, price_idr: 57800000 + Math.random() * 500000, change_24h: -1.12 + (Math.random() - 0.5) * 2, timestamp: now },
    { symbol: 'BNB', price_usd: 612 + Math.random() * 10, price_idr: 9900000 + Math.random() * 100000, change_24h: 0.87 + (Math.random() - 0.5) * 2, timestamp: now },
  ];
}

export function generateHourlyPrices(): HourlyPrice[] {
  const hours = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000);
    const label = h.getHours().toString().padStart(2, '0') + ':00';
    hours.push({
      hour: label,
      btc: 94000 + Math.sin(i * 0.3) * 1500 + Math.random() * 300,
      eth: 3550 + Math.sin(i * 0.25) * 120 + Math.random() * 30,
      bnb: 610 + Math.sin(i * 0.2) * 15 + Math.random() * 5,
    });
  }
  return hours;
}

export function generateHourlyVolatility(): HourlyVolatility[] {
  const hours = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000);
    const label = h.getHours().toString().padStart(2, '0') + ':00';
    hours.push({
      hour: label,
      btc: Math.abs(Math.sin(i * 0.4) * 3 + Math.random() * 1.5),
      eth: Math.abs(Math.sin(i * 0.35) * 2.5 + Math.random() * 1.2),
      bnb: Math.abs(Math.sin(i * 0.3) * 2 + Math.random() * 1),
    });
  }
  return hours;
}

export function generateNewsVolume(): NewsVolume[] {
  const hours = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000);
    const label = h.getHours().toString().padStart(2, '0') + ':00';
    hours.push({
      hour: label,
      count: Math.floor(Math.abs(Math.sin(i * 0.5) * 12 + Math.random() * 8)),
    });
  }
  return hours;
}

export function getPipelineStatus(): PipelineStep[] {
  return [
    { name: 'api', label: 'API Ingestion', status: 'active', description: 'CoinGecko + RSS feeds' },
    { name: 'kafka', label: 'Kafka Stream', status: 'active', description: 'crypto-api & crypto-rss topics' },
    { name: 'hdfs', label: 'HDFS Storage', status: 'active', description: 'Parquet partitioned storage' },
    { name: 'spark', label: 'Spark Processing', status: 'active', description: 'Aggregation & analytics' },
  ];
}

export async function fetchNews(): Promise<{ items: import('./types').NewsItem[]; volumes: import('./types').NewsVolume[] }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) throw new Error('No Supabase config');

    const res = await fetch(`${supabaseUrl}/functions/v1/crypto-rss`, {
      headers: {
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Edge function error');
    const data = await res.json();
    return { items: data.items ?? [], volumes: data.volumes ?? [] };
  } catch {
    return { items: getSimulatedNews(), volumes: generateNewsVolume() };
  }
}

function getSimulatedNews(): import('./types').NewsItem[] {
  const now = new Date();
  return [
    { title: 'Bitcoin Surges Past $94K as Institutional Demand Grows', link: '#', pubDate: new Date(now.getTime() - 300000).toISOString(), hash: 'a1', source: 'CoinDesk' },
    { title: 'Ethereum Layer 2 Solutions See Record Transaction Volume', link: '#', pubDate: new Date(now.getTime() - 900000).toISOString(), hash: 'b2', source: 'Cointelegraph' },
    { title: 'Binance Chain DeFi TVL Reaches New All-Time High', link: '#', pubDate: new Date(now.getTime() - 1800000).toISOString(), hash: 'c3', source: 'CoinDesk' },
    { title: 'SEC Approves New Crypto ETF Applications', link: '#', pubDate: new Date(now.getTime() - 3600000).toISOString(), hash: 'd4', source: 'Cointelegraph' },
    { title: 'Global Crypto Adoption Rate Hits 8% Milestone', link: '#', pubDate: new Date(now.getTime() - 5400000).toISOString(), hash: 'e5', source: 'CoinDesk' },
  ];
}
