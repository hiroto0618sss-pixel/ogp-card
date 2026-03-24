import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function randomSlug(len = 6) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, description, image, url, site, style, color } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: "title と url は必須です" });
  }

  let slug;
  for (let i = 0; i < 5; i++) {
    slug = randomSlug();
    const exists = await redis.get(`card:${slug}`);
    if (!exists) break;
  }

  await redis.set(`card:${slug}`, JSON.stringify({ title, description, image, url, site, style, color }), { ex: 60 * 60 * 24 * 365 });

  const host = req.headers.host;
  const proto = host.includes("localhost") ? "http" : "https";
  const cardUrl = `${proto}://${host}/${slug}`;

  return res.status(200).json({ slug, cardUrl });
}
