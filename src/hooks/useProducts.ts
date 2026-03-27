import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  created_at: string;        // ← added: used by FeedPage timeAgo() and real-time patch
  // Computed for UI compatibility:
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

export interface ShopProfile {
  name: string;
  tagline: string;
  whatsapp: string;
  rating: number;
  total_sales: number;
  response_time: string;
  verified: boolean;
}

/**
 * Normalise a DB row to the shape ProductCard / Modal expect.
 *
 * @param row        Raw product row from Supabase
 * @param wishlistIds  Set of IDs the user has starred/saved (optional)
 * @param likedIds     Set of IDs the user has liked via the global like system (optional)
 *
 * Priority for isLiked:
 *   1. likedIds set  (localStorage liked system — most accurate)
 *   2. wishlistIds set (legacy fallback if likedIds not passed)
 *   3. row.is_liked  (DB field fallback)
 */
export function normaliseProduct(
  row: Product,
  wishlistIds?: Set<string>,
  likedIds?: Set<string>
): Product {
  return {
    ...row,
    isLiked: likedIds
      ? likedIds.has(row.id)
      : wishlistIds
      ? wishlistIds.has(row.id)
      : row.is_liked,
    postedAgo: row.posted_ago,
    category: row.categories, // CategoriesPage uses p.category
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) setError(error.message);
      else setProducts((data ?? []) as Product[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return { products, loading, error };
}

export function useShopProfile() {
  const [profile, setProfile] = useState<ShopProfile | null>(null);

  useEffect(() => {
    supabase
      .from("shop_profile")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as ShopProfile);
      });
  }, []);

  return profile;
}