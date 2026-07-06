/* =========================================================
   NEURA — Config
   Konstanta global aplikasi. Jangan ubah API_KEY.
   ========================================================= */
window.NEURA = window.NEURA || {};

NEURA.config = {
  API_BASE: "https://api.theresav.biz.id/ai/claude",
  API_KEY: "ziP11",           // JANGAN PERNAH DIUBAH
  CONTEXT_LIMIT: 16,          // jumlah pesan terakhir yang dipakai sebagai memori percakapan
  STORAGE_KEY: "neura_chat_history_v1",
  THEME_KEY: "neura_theme_v1",
  TOAST_DURATION: 3200
};
