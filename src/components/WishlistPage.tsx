import React, { useState } from "react";
import { useProducts, normaliseProduct, Product } from "@/hooks/useProducts";
import ProductDetailModal from "./ProductDetailModal";
import { Heart } from "lucide-react";

interface WishlistPageProps {
  wishlistIds: Set<string>;
  onWishlistToggle: (id: string) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ wishlistIds, onWishlistToggle }) => {
  const { products } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const saved = products
    .filter((p) => wishlistIds.has(p.id))
    .map((p) => normaliseProduct(p, wishlistIds));

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3">
        <h1 className="font-display text-2xl text-gradient tracking-wider">SAVED</h1>
        <p className="text-xs text-foreground-muted">{saved.length} item{saved.length !== 1 ? "s" : ""} in your wishlist</p>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <Heart size={32} className="text-foreground-subtle" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">No saved items yet</h2>
              <p className="text-sm text-foreground-muted">Tap the heart icon on any item to save it here for later.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3">
            {saved.map((product) => (
              <button key={product.id} onClick={() => setSelectedProduct(product)}
                className="bg-surface-1 rounded-2xl overflow-hidden border border-border active:scale-95 transition-all text-left shadow-sm relative">
                <div className="aspect-square overflow-hidden bg-surface-2 relative">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" width={300} height={300} />
                  ) : (
                    <div className="w-full h-full bg-surface-3" />
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onWishlistToggle(product.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full glass-dark border border-border active:scale-90 transition-all">
                    <Heart size={13} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
                  </button>
                  {product.badge === "new-drop" && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gradient-primary text-primary-foreground text-[9px] font-bold rounded-full">NEW</span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-foreground-muted">{product.brand}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-display text-base text-gradient">${product.price}</p>
                    <p className="text-[11px] font-bold"
                      style={{ color: product.condition >= 9 ? "hsl(var(--success))" : product.condition >= 7 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                      {product.condition}/10
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal product={{ ...selectedProduct, isLiked: wishlistIds.has(selectedProduct.id) }} onClose={() => setSelectedProduct(null)} onWishlistToggle={onWishlistToggle} wishlistIds={wishlistIds} />
      )}
    </div>
  );
};

export default WishlistPage;