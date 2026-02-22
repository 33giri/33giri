// assets/js/store.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

(function(){
  const cfg = window.APP_CONFIG || {};
  const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const TABLE = cfg.supabaseProductsTable || "products";

  async function getProducts(){
    // Public: per policy vede solo disponibili, Admin: vede tutto
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if(error){
      console.error("Supabase getProducts error:", error);
      return [];
    }

    // Adatta i nomi ai tuoi campi attuali (soldAt vs sold_at)
    return (data || []).map(p => ({
      ...p,
      soldAt: p.sold_at || null
    }));
  }

  // --- Admin helpers (richiedono login Supabase) ---
  async function upsertProduct(product){
    const payload = {
      id: product.id || undefined,
      title: product.title || "",
      artist: product.artist || "",
      genre: product.genre || "",
      year: product.year ? Number(product.year) : null,
      model: product.model || "",
      collection: product.collection || "",
      image1: product.image1 || "",
      image2: product.image2 || "",
      sold_at: product.soldAt || product.sold_at || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload)
      .select()
      .single();

    if(error) throw error;
    return data;
  }

  async function deleteProduct(id){
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if(error) throw error;
    return true;
  }

  async function markSold(id, sold=true){
    const { error } = await supabase
      .from(TABLE)
      .update({ sold_at: sold ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if(error) throw error;
    return true;
  }

  // --- Auth (Admin) ---
  async function signInWithPassword(email, password){
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    return data;
  }

  async function signOut(){
    const { error } = await supabase.auth.signOut();
    if(error) throw error;
    return true;
  }

  async function getSession(){
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  }

  window.Store = {
    getProducts,
    upsertProduct,
    deleteProduct,
    markSold,
    signInWithPassword,
    signOut,
    getSession
  };
})();
