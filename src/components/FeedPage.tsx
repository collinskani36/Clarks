import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { Search, Crown, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  condition: number;
  size: string;
  categories: string[];
  images: string[];
  description: string;
  badge: "new-drop" | "only-1-left" | "sold-out" | null;
  is_liked: boolean;
  likes: number;
  comments: number;
  authentic: boolean;
  posted_ago: string;
  // UI-computed fields that ProductCard/Modal expect
  isLiked?: boolean;
  postedAgo?: string;
  category?: string[];
  seller?: {
    name: string;
    whatsapp: string;
    verified: boolean;
    responseTime: string;
  };
}

interface ShopProfile {
  name: string;
  whatsapp: string;
  verified: boolean;
  response_time: string;
}

// ─── Normaliser ───────────────────────────────────────────────────────────────
// Maps a raw Supabase row to the shape ProductCard / ProductDetailModal expect.
function normalise(row: Product, wishlistIds: Set<string>, shop: ShopProfile | null): Product {
  return {
    ...row,
    isLiked: wishlistIds.has(row.id),
    postedAgo: row.posted_ago ?? "just now",
    category: row.categories,
    seller: {
      name: shop?.name ?? "Sole Vault",
      whatsapp: shop?.whatsapp ?? "",
      verified: shop?.verified ?? true,
      responseTime: shop?.response_time ?? "Replies within 1hr",
    },
  };
}

// ─── Category filter pills ─────────────────────────────────────────────────────

const FILTER_PILLS = [
  { label: "All", value: null },
  { label: "Sneakers", value: "sneakers" },
  { label: "Jordans", value: "jordans" },
  { label: "AF1", value: "air-force-1" },
  { label: "Jerseys", value: "jerseys" },
  { label: "New", value: "new-arrivals" },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeedPageProps {
  onLike: (id: string) => void;
  onWishlistToggle: (id: string) => void;
  wishlistIds: Set<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const FeedPage: React.FC<FeedPageProps> = ({ onLike, onWishlistToggle, wishlistIds }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // ── Fetch shop profile once ──────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("shop_profile")
      .select("name, whatsapp, verified, response_time")
      .single()
      .then(({ data }) => {
        if (data) setShopProfile(data as ShopProfile);
      });
  }, []);

  // ── Fetch products ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Filter out sold-out items from main feed (optional — remove if you want them shown)
      // query = query.neq("badge", "sold-out");

      const { data, error } = await query;

      if (error) {
        setError(error.message);
      } else {
        setProducts((data ?? []) as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // ── Derived: filter by active pill ──────────────────────────────────────
  const visibleProducts = activeFilter
    ? products.filter((p) => p.categories?.includes(activeFilter))
    : products;

  const feedProducts = visibleProducts.map((p) => normalise(p, wishlistIds, shopProfile));

  // ── Keep selected product in sync with wishlist state ───────────────────
  const selectedNormalised = selectedProduct
    ? normalise(selectedProduct, wishlistIds, shopProfile)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={logoImg}
            alt="Sole Vault"
            className="w-8 h-8 object-contain"
            loading="lazy"
            width={32}
            height={32}
          />
          <span className="font-display text-xl text-gradient tracking-wider">SOLE VAULT</span>
        </div>
        <button className="p-2 rounded-full bg-surface-2 border border-border text-foreground-muted hover:text-foreground transition-colors active:scale-90">
          <Search size={18} />
        </button>
      </header>

      {/* ── Category filter pills ─────────────────────────────────────────── */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto bg-surface-1 border-b border-border scrollbar-none">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.label}
            onClick={() => setActiveFilter(pill.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
              activeFilter === pill.value
                ? "bg-gradient-primary text-primary-foreground border-primary shadow-glow-sm"
                : "bg-surface-2 text-foreground-muted border-border hover:border-primary/40"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4 p-3 pb-24">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-foreground-subtle">Loading drops...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-10">
              <p className="text-destructive text-sm font-semibold">Failed to load products</p>
              <p className="text-xs text-foreground-subtle mt-1">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && feedProducts.length === 0 && (
            <div className="text-center py-16 text-foreground-subtle text-sm">
              <Crown size={20} className="mx-auto mb-3 text-primary opacity-30" />
              <p>No products yet.</p>
              <p className="text-xs mt-1">
                {activeFilter ? "Nothing in this category yet." : "Check back soon for new drops 🔥"}
              </p>
            </div>
          )}

          {/* Product cards */}
          {!loading &&
            !error &&
            feedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onLike={onLike}
                onOpenDetail={setSelectedProduct}
                onWishlistToggle={onWishlistToggle}
              />
            ))}

          {/* End-of-feed indicator */}
          {!loading && !error && feedProducts.length > 0 && (
            <div className="text-center py-8 text-foreground-subtle text-sm">
              <Crown size={20} className="mx-auto mb-2 text-primary opacity-50" />
              <p>You're all caught up!</p>
              <p className="text-xs mt-1">New drops coming soon 🔥</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Product detail modal ─────────────────────────────────────────── */}
      {selectedNormalised && (
        <ProductDetailModal
          product={selectedNormalised}
          onClose={() => setSelectedProduct(null)}
          onWishlistToggle={onWishlistToggle}
        />
      )}
    </div>
  );
};

export default FeedPage;