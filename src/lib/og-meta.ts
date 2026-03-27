/**
 * og-meta.ts
 *
 * Sets <title> and <meta name="description"> for real browser users
 * visiting /product/:id. This is best-effort for browsers — the real
 * OG tags for crawlers are handled by the Vercel edge function.
 *
 * Usage in your ProductPage component:
 *
 *   import { setProductMeta, clearProductMeta } from "@/lib/og-meta";
 *
 *   useEffect(() => {
 *     if (product) setProductMeta(product);
 *     return () => clearProductMeta();
 *   }, [product]);
 */

export interface OgProduct {
  name: string;
  brand: string;
  price: number;
  condition: number;
  size: string;
  images?: string[];
}

const DEFAULT_TITLE = "Sneaker City";
const DEFAULT_DESCRIPTION = "Premium sneakers and streetwear.";

/**
 * Updates the page title and meta description to reflect the current product.
 * Call this inside a useEffect on your /product/:id page component.
 */
export function setProductMeta(product: OgProduct): void {
  const title = `${product.name} · KES ${product.price.toLocaleString()} — Sneaker City`;
  const description =
    `${product.brand} · Condition: ${product.condition}/10 · Size: ${product.size}` +
    ` — Available now on Sneaker City.`;

  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title, true);
  setMeta("og:description", description, true);

  if (product.images?.[0]) {
    setMeta("og:image", product.images[0], true);
  }
}

/**
 * Resets title and meta back to site defaults.
 * Call this in the useEffect cleanup (return () => clearProductMeta()).
 */
export function clearProductMeta(): void {
  document.title = DEFAULT_TITLE;
  setMeta("description", DEFAULT_DESCRIPTION);
  setMeta("og:title", DEFAULT_TITLE, true);
  setMeta("og:description", DEFAULT_DESCRIPTION, true);
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function setMeta(nameOrProperty: string, content: string, isProperty = false): void {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProperty}"]`);

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProperty);
    document.head.appendChild(el);
  }

  el.setAttribute("content", content);
}
