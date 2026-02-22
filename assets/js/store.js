import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

(function () {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.error("Supabase config missing in APP_CONFIG");
  }

  const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const TABLE = cfg.supabaseProductsTable || "products";

  async function getProducts() {
    // Prova con created_at, se manca fallback su id
    let query = supabase.from(TABLE).select("*");

    // primo tentativo: created_at
    let { data, error } = await query.order("created_at", { ascending: false });

    // se la colonna non esiste, rifai la query ordinando per id
    if (error && String(error.message || "").toLowerCase().includes("created_at")) {
      console.warn("No created_at column, fallback to order by id");
      ({ data, error } = await supabase.from(TABLE).select("*").order("id", { ascending: false }));
    }

    if (error) {
      console.error("Supabase getProducts error:", error);
      return [];
    }

    return (data || []).map((p) => ({
      ...p,
      soldAt: p.sold_at ?? p.soldAt ?? null
    }));
  }

  window.Store = { getProducts };
})();
