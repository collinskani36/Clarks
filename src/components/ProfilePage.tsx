import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductDetailModal from "./ProductDetailModal";
import {
  ShieldCheck,
  Star,
  Package,
  Grid3X3,
  Lock,
  Eye,
  EyeOff,
  X,
  Shield,
  Loader2,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
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
  created_at: string;
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
  tagline: string;
  whatsapp: string;
  rating: number;
  total_sales: number;
  response_time: string;
  verified: boolean;
}

// ─── Fallback profile ─────────────────────────────────────────────────────────

const FALLBACK_PROFILE: ShopProfile = {
  name: "Sneaker City",
  tagline: "Authenticated sneakers & jerseys",
  whatsapp: "",
  rating: 4.9,
  total_sales: 0,
  response_time: "Replies within 1hr",
  verified: true,
};

// ─── Currency formatter ───────────────────────────────────────────────────────

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  onWishlistToggle: (id: string) => void;
  wishlistIds: Set<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProfilePage: React.FC<ProfilePageProps> = ({ onWishlistToggle, wishlistIds }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopProfile, setShopProfile] = useState<ShopProfile>(FALLBACK_PROFILE);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Hidden admin trigger ─────────────────────────────────────────────────
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // ── Admin login state ────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  // ── Fetch shop profile ───────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("shop_profile")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) setShopProfile(data as ShopProfile);
      });
  }, []);

  // ── Fetch all products ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setProducts((data ?? []) as Product[]);
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  // ── Logo tap (5× opens admin login) ─────────────────────────────────────
  const handleLogoTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (next >= 5) {
      setTapCount(0);
      setShowAdminModal(true);
      return;
    }
    tapTimer.current = setTimeout(() => setTapCount(0), 2000);
  };

  // ── Admin login ──────────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    } else {
      setShowAdminModal(false);
      setEmail("");
      setPassword("");
      navigate("/admin");
    }
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAuthError("");
    setEmail("");
    setPassword("");
  };

  // ── WhatsApp CTA ─────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    if (!shopProfile.whatsapp) return;
    const msg = encodeURIComponent(
      "Hi! I'd like to browse your store. What's currently available?"
    );
    window.open(
      `https://wa.me/${shopProfile.whatsapp.replace(/\D/g, "")}?text=${msg}`,
      "_blank"
    );
  };

  // ── Normalise product for detail modal ───────────────────────────────────
  const toModalProduct = (p: Product): Product => ({
    ...p,
    isLiked: wishlistIds.has(p.id),
    postedAgo: p.posted_ago ?? "just now",
    category: p.categories,
    seller: {
      name: shopProfile.name,
      whatsapp: shopProfile.whatsapp,
      verified: shopProfile.verified,
      responseTime: shopProfile.response_time,
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ── Profile Hero ─────────────────────────────────────────────── */}
        <div className="relative">
          <div
            className="w-full h-32"
            style={{
              background:
                "linear-gradient(135deg, hsl(220 18% 10%), hsl(32 40% 15%), hsl(220 18% 8%))",
            }}
          />

          {/* Logo — tap 5× to reveal admin login */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <button
              onClick={handleLogoTap}
              className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center border-4 border-background shadow-glow active:scale-95 transition-transform select-none"
              aria-label="Shop logo"
            >
              <img
                src={logoImg}
                alt="Sneaker City"
                className="w-14 h-14 object-contain pointer-events-none"
                loading="lazy"
                width={56}
                height={56}
              />
            </button>

            {/* Tap progress dots */}
            {tapCount > 0 && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full transition-all ${
                      i < tapCount ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Profile info ──────────────────────────────────────────────── */}
        <div className="mt-12 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-foreground">{shopProfile.name}</h1>
            {shopProfile.verified && (
              <ShieldCheck size={18} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
            )}
          </div>
          <p className="text-sm text-foreground-muted mb-3">{shopProfile.tagline}</p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Star size={13} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
              <span className="text-xs font-bold text-foreground">{shopProfile.rating}</span>
              <span className="text-xs text-foreground-muted">rating</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <Package size={13} color="hsl(var(--foreground-muted))" />
              <span className="text-xs font-bold text-foreground">{shopProfile.total_sales}</span>
              <span className="text-xs text-foreground-muted">sold</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-foreground-muted">{shopProfile.response_time}</span>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={handleWhatsApp}
            disabled={!shopProfile.whatsapp}
            className="w-full max-w-xs py-3.5 rounded-2xl bg-gradient-whatsapp text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto shadow-md active:scale-95 transition-all mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Message on WhatsApp
          </button>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-0 border-t border-b border-border mt-5 mx-0">
          <div className="py-4 flex flex-col items-center gap-0.5 border-r border-border">
            <p className="text-xl font-display text-foreground">
              {loadingProducts ? "—" : products.length}
            </p>
            <p className="text-[11px] text-foreground-muted">Items</p>
          </div>
          <div className="py-4 flex flex-col items-center gap-0.5 border-r border-border">
            <p className="text-xl font-display text-foreground">{shopProfile.total_sales}</p>
            <p className="text-[11px] text-foreground-muted">Sold</p>
          </div>
          <div className="py-4 flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Star size={12} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
              <p className="text-xl font-display text-foreground">{shopProfile.rating}</p>
            </div>
            <p className="text-[11px] text-foreground-muted">Rating</p>
          </div>
        </div>

        {/* ── Products grid ─────────────────────────────────────────────── */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">All Products</p>
          <button className="p-1.5 rounded-lg bg-surface-2 border border-border">
            <Grid3X3 size={16} className="text-foreground-muted" />
          </button>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-foreground-subtle text-xs">
            No products listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 px-0.5">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="aspect-square overflow-hidden bg-surface-2 relative active:opacity-80 transition-opacity"
              >
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                    <Package size={18} className="text-foreground-subtle opacity-40" />
                  </div>
                )}
                {/* ── Price badge in KES ── */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/90 to-transparent flex items-end px-1.5 pb-1.5">
                  <span className="font-display text-xs text-gradient leading-tight">
                    {formatKES(product.price)}
                  </span>
                </div>
                {product.badge === "new-drop" && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary shadow-glow-sm" />
                )}
                {product.badge === "sold-out" && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-foreground-subtle uppercase tracking-widest">
                      Sold
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product detail modal ──────────────────────────────────────────── */}
      {selectedProduct && (
        <ProductDetailModal
          product={toModalProduct(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          onWishlistToggle={onWishlistToggle}
        />
      )}

      {/* ── Admin Login Modal ─────────────────────────────────────────────── */}
      {showAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          // Prevents the page behind from scrolling when modal is open
          style={{ alignItems: "center" }}
        >
          {/*
            overflow-y-auto + max-h lets the card scroll internally if the
            keyboard squishes the viewport on older Android devices.
          */}
          <div className="w-full max-w-sm bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-lg animate-fade-up max-h-[90dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Shield size={15} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Admin Access</p>
                  <p className="text-[10px] text-foreground-subtle">Sneaker City · Restricted</p>
                </div>
              </div>
              <button
                onClick={closeAdminModal}
                className="text-foreground-subtle hover:text-foreground transition-colors p-1"
              >
                <X size={17} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="p-5 space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email"
                  autoComplete="email"
                  // scrollIntoView so the field isn't hidden behind keyboard
                  onFocus={(e) =>
                    setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)
                  }
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  onFocus={(e) =>
                    setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)
                  }
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-10 py-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {authError && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading || !email || !password}
                className="w-full bg-gradient-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Enter Admin Panel"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;