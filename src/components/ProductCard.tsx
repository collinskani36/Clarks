import React, { useState, useRef } from "react";
import { Product } from "@/hooks/useProducts";
import { Heart, MessageCircle, Share2, ShieldCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onLike: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onWishlistToggle: (productId: string) => void;
  wishlistIds: Set<string>;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onLike,
  onOpenDetail,
  onWishlistToggle,
  wishlistIds,
}) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [liked, setLiked] = useState(product.isLiked);
  const [likeAnim, setLikeAnim] = useState(false);
  const [likeCount, setLikeCount] = useState(product.likes);
  const [starAnim, setStarAnim] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const isWishlisted = wishlistIds.has(product.id);

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((l) => {
      const next = !l;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    onLike(product.id);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 400);
      onLike(product.id);
    }
  };

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarAnim(true);
    setTimeout(() => setStarAnim(false), 400);
    onWishlistToggle(product.id);
  };

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const productUrl = `${window.location.origin}/product/${product.id}`;
    const shareText = `🔥 Check out this ${product.name} on Sneaker City!\n\nCondition: ${product.condition}/10 · Size: ${product.size} · KES ${product.price.toLocaleString()}\n\n${productUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: shareText, url: productUrl });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: WhatsApp share
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  // ── WhatsApp seller ────────────────────────────────────────────────────────
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Hi, I'm interested in this item. Is it still available?\n\n*${product.name}*\nCondition: ${product.condition}/10\nSize: ${product.size}\nPrice: KES ${product.price.toLocaleString()}`
    );
    window.open(
      `https://wa.me/${product.seller?.whatsapp?.replace(/\D/g, "") ?? ""}?text=${msg}`,
      "_blank"
    );
  };

  // ── Image carousel ────────────────────────────────────────────────────────
  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i === 0 ? product.images.length - 1 : i - 1));
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i === product.images.length - 1 ? 0 : i + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setImgIndex((i) => (i === product.images.length - 1 ? 0 : i + 1));
      else setImgIndex((i) => (i === 0 ? product.images.length - 1 : i - 1));
    }
    touchStartX.current = null;
  };

  const conditionColor =
    product.condition >= 9
      ? "hsl(var(--success))"
      : product.condition >= 7
      ? "hsl(var(--primary))"
      : "hsl(var(--destructive))";

  // Initials from seller name (e.g. "Sneaker City" → "SC")
  const initials = (product.seller?.name ?? "SC")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="w-full bg-surface-1 rounded-2xl overflow-hidden border border-border shadow-md animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-sm">
          <span className="font-display text-primary-foreground text-sm">{initials}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">{product.seller?.name}</p>
            {product.seller?.verified && (
              <ShieldCheck size={13} color="hsl(var(--primary))" fill="hsl(var(--primary))" />
            )}
          </div>
          <p className="text-[11px] text-foreground-muted">{product.postedAgo} ago</p>
        </div>
        <span className="text-xl font-display text-gradient">KES {product.price.toLocaleString()}</span>
      </div>

      {/* Image carousel */}
      <div
        className="relative aspect-square overflow-hidden bg-surface-2 cursor-pointer"
        onClick={() => onOpenDetail(product)}
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={product.images[imgIndex]}
          alt={product.name}
          className="w-full h-full object-cover transition-opacity duration-200"
          loading="lazy"
          width={600}
          height={600}
        />

        {/* Double-tap like anim */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={72}
              fill="hsl(var(--primary))"
              color="hsl(var(--primary))"
              className="animate-like opacity-90 drop-shadow-lg"
            />
          </div>
        )}

        {/* Carousel nav */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full glass-dark border border-border/50 active:scale-90 transition-all"
            >
              <ChevronLeft size={14} className="text-foreground" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full glass-dark border border-border/50 active:scale-90 transition-all"
            >
              <ChevronRight size={14} className="text-foreground" />
            </button>
          </>
        )}

        {/* Image dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {product.images.map((_, i) => (
            <div key={i} className={`carousel-dot ${i === imgIndex ? "active" : ""}`} />
          ))}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badge === "new-drop" && (
            <span className="px-2 py-0.5 bg-gradient-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider shadow-glow-sm">
              New Drop
            </span>
          )}
          {product.badge === "only-1-left" && (
            <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full uppercase tracking-wider">
              Only 1 Left
            </span>
          )}
          {product.badge === "sold-out" && (
            <span className="px-2 py-0.5 bg-surface-3 text-foreground-muted text-[10px] font-bold rounded-full uppercase tracking-wider border border-border">
              Sold Out
            </span>
          )}
        </div>

        {/* Condition badge */}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full glass-dark text-[11px] font-bold border border-border"
          style={{ color: conditionColor }}
        >
          {product.condition}/10
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-4">

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 active:scale-90 transition-all"
          aria-label="Like"
        >
          <Heart
            size={22}
            fill={liked ? "hsl(var(--primary))" : "none"}
            color={liked ? "hsl(var(--primary))" : "hsl(var(--foreground-muted))"}
            className={likeAnim ? "animate-like-beat" : ""}
          />
        </button>

        {/* Comment / open detail */}
        <button
          onClick={() => onOpenDetail(product)}
          className="flex items-center gap-1.5 text-foreground-muted active:scale-90 transition-all hover:text-foreground"
          aria-label="View details"
        >
          <MessageCircle size={22} strokeWidth={1.8} />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-foreground-muted active:scale-90 transition-all hover:text-foreground"
          aria-label="Share"
        >
          <Share2 size={20} strokeWidth={1.8} />
        </button>

        {/* Wishlist star */}
        <button
          onClick={handleWishlist}
          className="flex items-center gap-1.5 active:scale-90 transition-all ml-1"
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Star
            size={21}
            fill={isWishlisted ? "hsl(var(--primary))" : "none"}
            color={isWishlisted ? "hsl(var(--primary))" : "hsl(var(--foreground-muted))"}
            strokeWidth={1.8}
            className={starAnim ? "animate-like-beat" : "transition-colors duration-200"}
          />
        </button>

        {/* Message Seller */}
        <button
          onClick={handleWhatsApp}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-whatsapp text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Message Seller
        </button>
      </div>

      {/* Likes + product info */}
      <div className="px-4 pb-4 pt-1">
        <p className="text-sm font-semibold text-foreground mb-0.5">{likeCount.toLocaleString()} likes</p>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-foreground">{product.seller?.name}</span>
          <span className="text-sm text-foreground-muted truncate">
            {product.name} · {product.size}
          </span>
        </div>
        {product.comments > 0 && (
          <p
            className="text-xs text-foreground-subtle mt-0.5 cursor-pointer hover:text-foreground-muted transition-colors"
            onClick={() => onOpenDetail(product)}
          >
            View all {product.comments} comments
          </p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;