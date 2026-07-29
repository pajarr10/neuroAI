window.NEURA = window.NEURA || {};

NEURA.api = (function () {
  var cfg = NEURA.config;
  var SYSTEM_PROMPT = "";

  async function loadPrompt() {
    if (SYSTEM_PROMPT) return SYSTEM_PROMPT;

    const res = await fetch("prompt.txt");
    if (!res.ok) throw new Error("gagal memuat prompt.txt");

    SYSTEM_PROMPT = await res.text();
    return SYSTEM_PROMPT.trim();
  }

  async function buildContext(historySlice, latestUserText) {
    const prompt = await loadPrompt();

    if (!historySlice || historySlice.length === 0) {
      return prompt + "\n\nUser: " + latestUserText;
    }

    var lines = [prompt, "", "Percakapan sebelumnya:", ""];

    historySlice.forEach(function (m) {
      lines.push((m.role === "user" ? "User: " : "AI: ") + m.text);
    });

    lines.push("");
    lines.push("User: " + latestUserText);
    lines.push("");
    lines.push("Jawab pertanyaan terakhir berdasarkan percakapan di atas.");

    return lines.join("\n");
  }

  function call(contextText) {
    var url =
      cfg.API_BASE +
      "?text=" +
      encodeURIComponent(contextText) +
      "&apikey=" +
      cfg.API_KEY;

    return fetch(url, { method: "GET" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || data.status !== true || typeof data.result !== "string") {
          throw new Error("invalid_response");
        }
        return data.result;
      });
  }

  return {
    buildContext,
    call,
  };
})();