/**
 * Vercel Edge Function — /api/product-og
 *
 * Called by vercel.json rewrites when a bot/crawler visits /product/:id.
 * Fetches the product from Supabase and returns a minimal HTML shell with
 * fully populated Open Graph meta tags so WhatsApp, Telegram, Twitter etc.
 * show a rich preview card (image + title + description).
 *
 * Real browser visits are handled by the normal Vite SPA — this function
 * is never called for human users.
 */

export const config = { runtime: "edge" };

// ─── Bot detection ────────────────────────────────────────────────────────────
// These are the user-agent substrings sent by social/messaging crawlers.
const BOT_AGENTS = [
  "whatsapp",
  "facebookexternalhit",
  "twitterbot",
  "telegrambot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "applebot",
  "ia_archiver",
  "preview",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some((bot) => ua.includes(bot));
}

// ─── Supabase fetch (no SDK — plain REST, works in edge runtime) ──────────────
interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  condition: number;
  size: string;
  description: string;
  images: string[];
  categories: string[];
}

async function fetchProduct(id: string): Promise<ProductRow | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=id,name,brand,price,condition,size,description,images,categories&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) return null;

  const rows: ProductRow[] = await res.json();
  return rows[0] ?? null;
}

// ─── OG HTML shell ────────────────────────────────────────────────────────────
function buildOgHtml(product: ProductRow, pageUrl: string): string {
  const title = `${product.name} · KES ${product.price.toLocaleString()}`;
  const description =
    `Condition: ${product.condition}/10 · Size: ${product.size} · Brand: ${product.brand}` +
    ` — Available on Sneaker City`;
  const image = product.images?.[0] ?? "";
  const escaped = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary -->
  <title>${escaped(title)}</title>
  <meta name="description" content="${escaped(description)}" />

  <!-- Open Graph (WhatsApp, Facebook, Telegram) -->
  <meta property="og:type"        content="product" />
  <meta property="og:url"         content="${escaped(pageUrl)}" />
  <meta property="og:title"       content="${escaped(title)}" />
  <meta property="og:description" content="${escaped(description)}" />
  <meta property="og:image"       content="${escaped(image)}" />
  <meta property="og:image:alt"   content="${escaped(product.name)}" />
  <meta property="og:site_name"   content="Sneaker City" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${escaped(title)}" />
  <meta name="twitter:description" content="${escaped(description)}" />
  <meta name="twitter:image"       content="${escaped(image)}" />

  <!-- Redirect real users to the SPA immediately -->
  <meta http-equiv="refresh" content="0;url=${escaped(pageUrl)}" />
</head>
<body>
  <!-- This page is only served to bots. Real users are redirected instantly. -->
  <p>Redirecting to Sneaker City...</p>
  <p><a href="${escaped(pageUrl)}">${escaped(title)}</a></p>
</body>
</html>`;
}

// ─── Fallback OG HTML (product not found) ────────────────────────────────────
function buildFallbackHtml(pageUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sneaker City</title>
  <meta property="og:title"       content="Sneaker City" />
  <meta property="og:description" content="Premium sneakers and streetwear." />
  <meta property="og:site_name"   content="Sneaker City" />
  <meta http-equiv="refresh"      content="0;url=${pageUrl}" />
</head>
<body><p><a href="${pageUrl}">Sneaker City</a></p></body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const userAgent = req.headers.get("user-agent") ?? "";

  // Extract product ID from query param (set by vercel.json rewrite)
  const productId = url.searchParams.get("id") ?? "";

  // Reconstruct the canonical product page URL
  const origin = url.origin;
  const pageUrl = `${origin}/product/${productId}`;

  // ── Non-bot request: redirect straight to the SPA ─────────────────────────
  // This is a safety net — vercel.json should only route bots here,
  // but if a real user somehow hits this endpoint, send them to the SPA.
  if (!isBot(userAgent)) {
    return Response.redirect(pageUrl, 302);
  }

  // ── Bot request: fetch product and return OG HTML ─────────────────────────
  const product = productId ? await fetchProduct(productId) : null;

  const html = product
    ? buildOgHtml(product, pageUrl)
    : buildFallbackHtml(pageUrl);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cache for 5 minutes on the edge — balances freshness vs crawler speed
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
