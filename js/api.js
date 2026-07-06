/* =========================================================
   NEURA — API
   Komunikasi dengan endpoint AI + pembangunan context memory.
   ========================================================= */
window.NEURA = window.NEURA || {};

NEURA.api = (function(){
  var cfg = NEURA.config;

  /**
   * Gabungkan riwayat pesan terakhir + pesan baru menjadi
   * satu string context sesuai format yang diminta backend.
   */
  function buildContext(historySlice, latestUserText){
    if (!historySlice || historySlice.length === 0){
      return latestUserText;
    }
    var lines = ["Percakapan sebelumnya:", ""];
    historySlice.forEach(function(m){
      lines.push((m.role === "user" ? "User: " : "AI: ") + m.text);
    });
    lines.push("");
    lines.push("User: " + latestUserText);
    lines.push("");
    lines.push("Jawab pertanyaan terakhir berdasarkan percakapan di atas.");
    return lines.join("\n");
  }

  /**
   * Panggil API AI. Mengembalikan Promise<string> berisi teks jawaban.
   */
  function call(contextText){
    var url = cfg.API_BASE + "?text=" + encodeURIComponent(contextText) + "&apikey=" + cfg.API_KEY;
    return fetch(url, { method: "GET" })
      .then(function(res){
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function(data){
        if (!data || data.status !== true || typeof data.result !== "string"){
          throw new Error("invalid_response");
        }
        return data.result;
      });
  }

  return { buildContext: buildContext, call: call };
})();
