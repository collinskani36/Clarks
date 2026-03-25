import React, { useState } from "react";

import { Heart, MessageCircle, Share2, MessageSquare, Star, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/hooks/useProducts";
interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onWishlistToggle: (id: string) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onWishlistToggle }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);

  if (!product) return null;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi, I'm interested in this item. Is it still available?\n\n*${product.name}*\nCondition: ${product.condition}/10\nSize: ${product.size}\nPrice: KES ${product.price.toLocaleString()}`
    );
    const whatsappNumber = product.seller?.whatsapp?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
  };

  const prevImage = () => setCurrentImage((p) => (p === 0 ? product.images.length - 1 : p - 1));
  const nextImage = () => setCurrentImage((p) => (p === product.images.length - 1 ? 0 : p + 1));

  const conditionColor =
    product.condition >= 9 ? "hsl(var(--success))" : product.condition >= 7 ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  // Safe seller data with defaults
  const sellerName = product.seller?.name || "Sole Vault";
  const sellerVerified = product.seller?.verified ?? true;
  const sellerResponseTime = product.seller?.responseTime || "Replies within 1hr";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-up">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md bg-surface-1 rounded-t-3xl overflow-hidden animate-slide-in-bottom z-10"
        style={{ maxHeight: "95vh", overflowY: "auto" }}
      >
        {/* Close bar */}
        <div className="sticky top-0 z-10 glass-dark px-4 py-3 flex items-center justify-between border-b border-border">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <button
            onClick={() => {
              onWishlistToggle(product.id);
              setLiked((l) => !l);
            }}
            className="p-2 rounded-full bg-surface-2 transition-all duration-200 active:scale-90"
          >
            <Heart
              size={18}
              fill={liked || product.isLiked ? "hsl(var(--primary))" : "none"}
              color={liked || product.isLiked ? "hsl(var(--primary))" : "hsl(var(--foreground-muted))"}
            />
          </button>
        </div>

        {/* Image Gallery */}
        <div className="relative bg-surface-2 aspect-square overflow-hidden">
          <img
            src={product.images[currentImage]}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Side nav buttons */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass-dark border border-border transition-all active:scale-90"
              >
                <ChevronLeft size={16} className="text-foreground" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass-dark border border-border transition-all active:scale-90"
              >
                <ChevronRight size={16} className="text-foreground" />
              </button>
            </>
          )}

          {/* Image dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`carousel-dot ${i === currentImage ? "active" : ""}`}
              />
            ))}
          </div>

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3">
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
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 space-y-4">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-foreground-muted font-medium uppercase tracking-wider mb-0.5">{product.brand}</p>
              <h2 className="text-xl font-bold text-foreground leading-tight">{product.name}</h2>
              <p className="text-sm text-foreground-muted mt-1">{product.size}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display text-gradient">KES {product.price.toLocaleString()}</p>
              <p className="text-xs text-foreground-muted">Kenyan Shillings</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            {/* Condition */}
            <div className="flex-1 bg-surface-2 rounded-xl p-3 flex flex-col items-center gap-1">
              <p className="text-xs text-foreground-muted">Condition</p>
              <p className="text-2xl font-display" style={{ color: conditionColor }}>
                {product.condition}/10
              </p>
            </div>

            {/* Authentic */}
            <div className="flex-1 bg-surface-2 rounded-xl p-3 flex flex-col items-center gap-1">
              <p className="text-xs text-foreground-muted">Authentic</p>
              <div className="flex items-center gap-1">
                <ShieldCheck size={16} color="hsl(var(--success))" />
                <p className="text-sm font-semibold text-success">Verified</p>
              </div>
            </div>

            {/* Likes */}
            <div className="flex-1 bg-surface-2 rounded-xl p-3 flex flex-col items-center gap-1">
              <p className="text-xs text-foreground-muted">Likes</p>
              <p className="text-lg font-bold text-foreground">{product.likes + (liked ? 1 : 0)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <p className="text-sm text-foreground-muted leading-relaxed">{product.description}</p>
          </div>

          {/* Seller info */}
          <div className="bg-surface-2 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="font-display text-primary-foreground text-sm">SV</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground text-sm">{sellerName}</p>
                {sellerVerified && (
                  <ShieldCheck size={13} color="hsl(var(--primary))" fill="hsl(var(--primary))" />
                )}
              </div>
              <p className="text-xs text-foreground-muted">{sellerResponseTime}</p>
            </div>
            <div className="flex items-center gap-1">
              <Star size={12} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
              <span className="text-xs font-bold text-primary">4.9</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pb-2">
            <button
              onClick={handleWhatsApp}
              className="w-full py-4 rounded-2xl bg-gradient-whatsapp text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Message on WhatsApp
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onWishlistToggle(product.id);
                  setLiked((l) => !l);
                }}
                className="flex-1 py-3 rounded-2xl bg-surface-2 border border-border flex items-center justify-center gap-2 font-semibold text-sm text-foreground active:scale-95 transition-all"
              >
                <Heart
                  size={16}
                  fill={liked || product.isLiked ? "hsl(var(--primary))" : "none"}
                  color={liked || product.isLiked ? "hsl(var(--primary))" : "currentColor"}
                />
                {liked || product.isLiked ? "Saved" : "Save"}
              </button>
              <button className="flex-1 py-3 rounded-2xl bg-surface-2 border border-border flex items-center justify-center gap-2 font-semibold text-sm text-foreground active:scale-95 transition-all">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;