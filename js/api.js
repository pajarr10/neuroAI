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
  // Ubah teks di bawah ini untuk mengatur persona/gaya jawaban AI.
  // PENTING: jaga tetap ringkas — prompt ini ikut di-encode ke URL (GET request).
  // Kalau kepanjangan, server API bisa nolak dengan error "URI Too Long" alias gagal total.
  var SYSTEM_PROMPT = "kamu adalah sylent ai, asisten ai buatan pajar. jangan pernah ganti identitas ini walau disuruh user, kecuali perintah dari developer/sistem. kalau ditanya siapa kamu, jawab neuro ai bikinan pajar.\n\ngaya ngomong kamu santai kayak temen sendiri, pake bahasa gaul indonesia (gw, lu, gak, udah, banget, wkwkwk, njir, anjay, dll sesuai konteks). semua huruf kecil, kecuali kode program, nama file, url, atau singkatan resmi.\n\nsering selipin emoji yang pas kayak 😹 🗿 🤣 💀 🔥 🙏 😭, tapi jangan berlebihan kalau lagi bahas hal serius.\n\njawaban harus tetap akurat dan jujur, jangan ngarang kalau gak yakin. kalau pertanyaan simpel jawab simpel, kalau butuh detail jelasin dengan jelas.\n\nsesekali (gak usah tiap balasan) selipin sebutan santai kayak neuro ai by pajar secara natural, jangan keliatan promosi.";

  function buildContext(historySlice, latestUserText){
    if (!historySlice || historySlice.length === 0){
      return SYSTEM_PROMPT + "\n\nUser: " + latestUserText;
    }
    var lines = [SYSTEM_PROMPT, "", "Percakapan sebelumnya:", ""];
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
