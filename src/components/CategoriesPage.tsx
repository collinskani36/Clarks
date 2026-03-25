import React, { useState } from "react";
import { useProducts, normaliseProduct, Product } from "@/hooks/useProducts";
import ProductDetailModal from "./ProductDetailModal";
import af1 from "@/assets/af1.jpg";
import jordan4 from "@/assets/jordan4.jpg";
import bullsJersey from "@/assets/bulls-jersey.jpg";
import jordan1 from "@/assets/jordan1.jpg";
import dunkLow from "@/assets/dunk-low.jpg";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

type Category = "sneakers" | "air-force-1" | "jordans" | "jerseys" | "new-arrivals";

interface CategoriesPageProps {
  onWishlistToggle: (id: string) => void;
  wishlistIds: Set<string>;
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ onWishlistToggle, wishlistIds }) => {
  const { products, loading } = useProducts();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = [
    { id: "sneakers" as Category, label: "Sneakers", image: dunkLow, color: "from-blue-900/60 to-surface-1" },
    { id: "air-force-1" as Category, label: "Air Force 1", image: af1, color: "from-zinc-700/60 to-surface-1" },
    { id: "jordans" as Category, label: "Jordans", image: jordan1, color: "from-red-900/60 to-surface-1" },
    { id: "jerseys" as Category, label: "Jerseys", image: bullsJersey, color: "from-red-800/60 to-surface-1" },
    { id: "new-arrivals" as Category, label: "New Arrivals", image: jordan4, color: "from-amber-900/60 to-surface-1" },
  ].map((cat) => ({
    ...cat,
    count: products.filter((p) => p.categories?.includes(cat.id)).length,
  }));

  const filteredProducts = activeCategory
    ? products.filter((p) => p.categories?.includes(activeCategory)).map((p) => normaliseProduct(p, wishlistIds))
    : [];

  const activeCatData = categories.find((c) => c.id === activeCategory);

  if (activeCategory) {
    return (
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActiveCategory(null)} className="p-2 rounded-full bg-surface-2 border border-border active:scale-90 transition-all">
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <div>
            <h2 className="font-display text-xl text-gradient tracking-wider">{activeCatData?.label}</h2>
            <p className="text-xs text-foreground-muted">{filteredProducts.length} items available</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 pb-24">
              {filteredProducts.map((product) => (
                <button key={product.id} onClick={() => setSelectedProduct(product)}
                  className="bg-surface-1 rounded-2xl overflow-hidden border border-border active:scale-95 transition-all text-left shadow-sm">
                  <div className="aspect-square overflow-hidden bg-surface-2 relative">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" width={300} height={300} />
                    ) : (
                      <div className="w-full h-full bg-surface-3" />
                    )}
                    {product.badge === "new-drop" && <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gradient-primary text-primary-foreground text-[9px] font-bold rounded-full">NEW</span>}
                    {product.badge === "only-1-left" && <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-destructive text-white text-[9px] font-bold rounded-full">1 LEFT</span>}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full glass-dark text-[10px] font-bold"
                      style={{ color: product.condition >= 9 ? "hsl(var(--success))" : product.condition >= 7 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                      {product.condition}/10
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-foreground-muted truncate">{product.brand}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-sm font-display text-gradient mt-0.5">KES {product.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-2 text-center py-12 text-foreground-subtle text-sm">No items in this category yet.</div>
              )}
            </div>
          )}
        </div>

        {selectedProduct && (
          <ProductDetailModal product={{ ...selectedProduct, isLiked: wishlistIds.has(selectedProduct.id) }} onClose={() => setSelectedProduct(null)} onWishlistToggle={onWishlistToggle} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3">
        <h1 className="font-display text-2xl text-gradient tracking-wider">EXPLORE</h1>
        <p className="text-xs text-foreground-muted">Browse by category</p>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3 pb-24">
          <button onClick={() => setActiveCategory("new-arrivals")}
            className="w-full relative rounded-2xl overflow-hidden border border-border shadow-md active:scale-[0.98] transition-all" style={{ height: 160 }}>
            <img src={jordan4} alt="New Arrivals" className="w-full h-full object-cover" loading="lazy" width={600} height={160} />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center px-5">
              <div className="text-left">
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">Just In</p>
                <h2 className="font-display text-3xl text-foreground leading-none">NEW ARRIVALS</h2>
                <p className="text-xs text-foreground-muted mt-1">{categories.find(c => c.id === "new-arrivals")?.count ?? 0} fresh items</p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2"><ChevronRight size={20} className="text-primary" /></div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            {categories.filter((c) => c.id !== "new-arrivals").map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className="relative rounded-2xl overflow-hidden border border-border shadow-sm active:scale-[0.96] transition-all" style={{ height: 130 }}>
                <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" loading="lazy" width={300} height={130} />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent flex flex-col justify-end p-3">
                  <p className="font-display text-xl text-foreground leading-tight">{cat.label}</p>
                  <p className="text-[10px] text-foreground-muted">{cat.count} items</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;