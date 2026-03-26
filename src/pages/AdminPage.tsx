import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle,
  Package,
  Tag,
  Image as ImageIcon,
  LogOut,
  Shield,
  ChevronDown,
  Bell,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
type Badge = "new-drop" | "only-1-left" | "sold-out" | "";
type Category = "sneakers" | "air-force-1" | "jordans" | "jerseys" | "new-arrivals";

interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  condition: number;
  size: string;
  categories: Category[];
  images: string[];
  description: string;
  badge: Badge;
}

interface AdminNotification {
  id: string;
  type: "new-drop" | "restock" | "price-drop" | "sold";
  title: string;
  body: string;
  unread: boolean;
  created_at: string;
}

const CATEGORIES: Category[] = ["sneakers", "air-force-1", "jordans", "jerseys", "new-arrivals"];
const PRESET_BRANDS = ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "Reebok", "Mitchell & Ness", "Other"];

// ─── Product Form Modal ────────────────────────────────────────────────────────
interface ProductFormProps {
  initial?: AdminProduct | null;
  onSave: (p: AdminProduct) => void;
  onClose: () => void;
}

const emptyProduct = (): AdminProduct => ({
  id: "",
  name: "",
  brand: "Nike",
  price: 0,
  condition: 9,
  size: "",
  categories: ["sneakers"],
  images: [],
  description: "",
  badge: "",
});

interface PendingImage {
  previewUrl: string;
  file: File;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<AdminProduct>(initial ? { ...initial } : emptyProduct());
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images ?? []);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Brand: detect if initial brand is a custom one ───────────────────────
  const isCustomBrand = initial?.brand && !PRESET_BRANDS.includes(initial.brand);
  const [brandSelect, setBrandSelect] = useState<string>(isCustomBrand ? "Other" : (initial?.brand ?? "Nike"));
  const [customBrand, setCustomBrand] = useState<string>(isCustomBrand ? (initial?.brand ?? "") : "");

  // Keep form.brand in sync with the brand selectors
  useEffect(() => {
    if (brandSelect === "Other") {
      setForm((f) => ({ ...f, brand: customBrand }));
    } else {
      setForm((f) => ({ ...f, brand: brandSelect }));
    }
  }, [brandSelect, customBrand]);

  const set = (key: keyof AdminProduct, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleCategory = (cat: Category) => {
    const has = form.categories.includes(cat);
    set("categories", has ? form.categories.filter((c) => c !== cat) : [...form.categories, cat]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { previewUrl, file }]);
    });
  };

  const removePending = (idx: number) =>
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));

  const removeExisting = (idx: number) =>
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    setUploadError("");
    try {
      const uploadedUrls = await Promise.all(pendingImages.map((p) => uploadFile(p.file)));
      const allImages = [...existingImages, ...uploadedUrls];

      const payload = {
        name: form.name,
        brand: form.brand,
        price: form.price,
        condition: form.condition,
        size: form.size,
        categories: form.categories,
        images: allImages,
        description: form.description,
        badge: form.badge || null,
      };

      if (initial?.id) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", initial.id)
          .select()
          .single();
        if (error) throw error;
        onSave(dbRowToProduct(data));
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        onSave(dbRowToProduct(data));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed. Please try again.";
      setUploadError(message);
      setSaving(false);
    }
  };

  const totalImages = existingImages.length + pendingImages.length;
  const valid = form.name.trim() && form.price > 0 && form.size.trim() && form.categories.length > 0 && form.brand.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-lg bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-lg animate-fade-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-foreground text-sm">
              {initial ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="text-foreground-subtle hover:text-foreground transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {uploadError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{uploadError}</p>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-2">
              Photos ({totalImages})
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-surface-2"
              }`}
            >
              <Upload size={20} className="mx-auto mb-2 text-foreground-subtle" />
              <p className="text-xs text-foreground-muted">
                Drag & drop photos or <span className="text-primary">browse</span>
              </p>
              <p className="text-[10px] text-foreground-subtle mt-1">JPG, PNG, WEBP</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {(existingImages.length > 0 || pendingImages.length > 0) && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {existingImages.map((url, i) => (
                  <div key={`existing-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeExisting(i)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                    {i === 0 && pendingImages.length === 0 && (
                      <span className="absolute bottom-1 left-1 text-[8px] bg-primary text-primary-foreground px-1 rounded font-bold">MAIN</span>
                    )}
                  </div>
                ))}
                {pendingImages.map((p, i) => (
                  <div key={`pending-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/40 group">
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePending(i)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[8px] bg-primary/80 text-primary-foreground px-1 rounded font-bold">NEW</span>
                    {existingImages.length === 0 && i === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] bg-primary text-primary-foreground px-1 rounded font-bold">MAIN</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5 h-8 flex items-center">Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Air Force 1 '07"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5 h-8 flex items-center">Brand *</label>
              <div className="relative">
                <select
                  value={brandSelect}
                  onChange={(e) => setBrandSelect(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                >
                  {PRESET_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle pointer-events-none" />
              </div>
              {brandSelect === "Other" && (
                <input
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Enter brand name"
                  className="w-full mt-2 bg-surface-2 border border-primary/40 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              )}
            </div>
          </div>

          {/* Price, Size, Condition */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5 h-8 flex items-center">Price (KES) *</label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
                placeholder="5000"
                min={0}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5 h-8 flex items-center">Size *</label>
              <input
                value={form.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="UK 9 / US 10"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5 h-8 flex items-center">Condition</label>
              <div className="relative">
                <select
                  value={form.condition}
                  onChange={(e) => set("condition", Number(e.target.value))}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                >
                  {[10, 9, 8, 7, 6, 5].map((n) => (
                    <option key={n} value={n}>{n}/10</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-2">Categories *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.categories.includes(cat)
                      ? "bg-primary text-primary-foreground shadow-glow-sm"
                      : "bg-surface-2 border border-border text-foreground-muted hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-2">Badge</label>
            <div className="flex gap-2 flex-wrap">
              {(["", "new-drop", "only-1-left", "sold-out"] as Badge[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set("badge", b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.badge === b
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 border border-border text-foreground-muted hover:border-primary/40"
                  }`}
                >
                  {b === "" ? "None" : b}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Describe condition, history, what's included..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border bg-surface-2 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-surface-3 border border-border text-foreground-muted rounded-xl py-3 text-sm font-semibold hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {pendingImages.length > 0 ? "Uploading..." : "Saving..."}
              </>
            ) : (
              initial ? "Save Changes" : "Add Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Notifications Admin ──────────────────────────────────────────────────────
const NotificationsAdmin: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: "new-drop" as AdminNotification["type"],
    title: "",
    body: "",
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    setError("");
    const { error } = await supabase.from("notifications").insert({
      type: form.type,
      title: form.title,
      body: form.body,
      unread: true,
    });
    if (!error) {
      setSuccess("Notification sent!");
      setForm({ type: "new-drop", title: "", body: "" });
      fetchNotifications();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError("Failed to send notification");
      setTimeout(() => setError(""), 3000);
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) fetchNotifications();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-2xl bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-lg animate-fade-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Manage Notifications</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Send alerts to users</p>
          </div>
          <button onClick={onClose} className="text-foreground-subtle hover:text-foreground transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-success/10 border border-success/20 rounded-xl">
              <CheckCircle size={14} className="text-success" />
              <p className="text-xs text-success">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle size={14} className="text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Create New Notification</h3>
            <div>
              <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5">Type</label>
              <div className="flex gap-2 flex-wrap">
                {(["new-drop", "restock", "price-drop", "sold"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, type })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.type === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 border border-border text-foreground-muted hover:border-primary/40"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., New Drop 🔥"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground-muted uppercase tracking-widest block mb-1.5">Message *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                placeholder="Detailed notification message..."
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!form.title.trim() || !form.body.trim() || sending}
              className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <><Loader2 size={14} className="animate-spin" /> Sending...</>
              ) : "Send Notification"}
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Existing Notifications</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-foreground-subtle text-sm py-8">No notifications yet</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{notif.title}</span>
                        <span className="text-[10px] text-foreground-subtle">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted mt-0.5">{notif.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-primary">{notif.type}</span>
                        {notif.unread && <span className="text-[10px] text-foreground-subtle">· Unread</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/20 hover:text-destructive text-foreground-subtle transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DB row → AdminProduct ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToProduct(row: any): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    condition: row.condition,
    size: row.size,
    categories: row.categories ?? [],
    images: row.images ?? [],
    description: row.description ?? "",
    badge: (row.badge ?? "") as Badge,
  };
}

// ─── Product Row ──────────────────────────────────────────────────────────────
// Fixed: stacked layout prevents text overlap on all screen sizes
const ProductRow: React.FC<{
  product: AdminProduct;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ product, onEdit, onDelete }) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors group">
    {/* Thumbnail */}
    <div className="w-12 h-12 rounded-xl bg-surface-3 flex-shrink-0 overflow-hidden border border-border">
      {product.images[0] ? (
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon size={16} className="text-foreground-subtle" />
        </div>
      )}
    </div>

    {/* Info — stacked to avoid overlap */}
    <div className="flex-1 min-w-0 space-y-0.5">
      {/* Row 1: name + badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">{product.name}</p>
        {product.badge && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20 flex-shrink-0">
            {product.badge}
          </span>
        )}
      </div>
      {/* Row 2: brand · size · condition */}
      <p className="text-xs text-foreground-muted truncate">
        {product.brand} · {product.size} · {product.condition}/10
      </p>
      {/* Row 3: price · photos */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-primary">KES {product.price.toLocaleString()}</span>
        <span className="text-[10px] text-foreground-subtle">
          · {product.images.length} photo{product.images.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>

    {/* Actions — always visible on mobile, hover on desktop */}
    <div className="flex gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        onClick={onEdit}
        className="px-2.5 py-1.5 rounded-lg bg-surface-3 hover:bg-primary/20 hover:text-primary text-foreground-muted transition-all text-xs font-medium"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg bg-surface-3 hover:bg-destructive/20 hover:text-destructive text-foreground-muted transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showNotificationsAdmin, setShowNotificationsAdmin] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setFetchError(error.message);
      } else {
        setProducts((data ?? []).map(dbRowToProduct));
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const openAdd = () => { setEditTarget(null); setShowForm(true); };
  const openEdit = (p: AdminProduct) => { setEditTarget(p); setShowForm(true); };

  const handleSave = (p: AdminProduct) => {
    setProducts((prev) =>
      prev.find((x) => x.id === p.id)
        ? prev.map((x) => (x.id === p.id ? p : x))
        : [p, ...prev]
    );
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const noPhoto = products.filter((p) => p.images.length === 0).length;
  const newDrops = products.filter((p) => p.badge === "new-drop").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield size={15} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl text-gradient tracking-widest leading-none">Sneaker City</h1>
            <p className="text-[9px] text-foreground-subtle tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Clean "Saved!" toast — no tech details */}
          {saved && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/20 border border-success/30 animate-fade-up">
              <CheckCircle size={11} className="text-success" />
              <span className="text-xs text-success font-medium">Saved!</span>
            </div>
          )}
          <button
            onClick={() => setShowNotificationsAdmin(true)}
            className="p-2 rounded-xl bg-surface-2 border border-border text-foreground-subtle hover:text-foreground transition-all"
          >
            <Bell size={15} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-surface-2 border border-border text-foreground-subtle hover:text-foreground transition-all"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Package size={16} />, label: "Products", value: products.length, color: "text-primary" },
            { icon: <Tag size={16} />, label: "Total Value", value: `KES ${totalValue.toLocaleString()}`, color: "text-success" },
            { icon: <Bell size={16} />, label: "New Drops", value: newDrops, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-1 border border-border rounded-2xl p-3 text-center">
              <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-foreground-subtle uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {noPhoto > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
            <ImageIcon size={16} className="text-primary flex-shrink-0" />
            <p className="text-xs text-foreground-muted">
              <span className="font-semibold text-primary">{noPhoto} product{noPhoto > 1 ? "s" : ""}</span> missing photos — edit to upload images.
            </p>
          </div>
        )}

        {fetchError && (
          <div className="flex items-start gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle size={15} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{fetchError}</p>
          </div>
        )}

        {/* Search + Add */}
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm shadow-glow-sm hover:opacity-90 transition-all active:scale-[0.98] flex-shrink-0"
          >
            <Plus size={15} />
            Add
          </button>
        </div>

        {/* Product list */}
        <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
            <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-widest">
              Listings ({filtered.length})
            </h2>
            <div className="flex items-center gap-1">
              <Star size={11} className="text-primary" />
              <span className="text-[10px] text-foreground-subtle">Tap to edit</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-foreground-subtle">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={32} className="mx-auto mb-3 text-foreground-subtle opacity-40" />
              <p className="text-foreground-muted text-sm">No products yet</p>
              <p className="text-foreground-subtle text-xs mt-1">Hit Add to list your first item</p>
            </div>
          ) : (
            filtered.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <ProductForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {showNotificationsAdmin && (
        <NotificationsAdmin onClose={() => setShowNotificationsAdmin(false)} />
      )}
    </div>
  );
};

// ─── Root — auth guard ────────────────────────────────────────────────────────
const AdminPage: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthed(true);
      } else {
        navigate("/");
      }
      setChecking(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return authed ? <Dashboard onLogout={handleLogout} /> : null;
};

export default AdminPage;