// assets/js/store.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

(function () {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.error("Supabase config missing in APP_CONFIG");
  }

  // ✅ client unico + niente auth (catalogo pubblico)
  const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const TABLE = cfg.supabaseProductsTable || "products";

  async function getProducts() {
    // seleziona tutto
    let { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    // fallback: se created_at non esiste
    if (error && String(error.message || "").toLowerCase().includes("created_at")) {
      console.warn("No created_at column, fallback to order by id");
      ({ data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("id", { ascending: false }));
    }

    if (error) {
      console.error("Supabase getProducts error:", error);
      return [];
    }

    // uniforma il campo
    return (data || []).map((p) => ({
      ...p,
      soldAt: p.sold_at ?? p.soldAt ?? null
    }));
  }

  window.Store = { getProducts };
})();
