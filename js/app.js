/* =========================================================
   NEURA — App
   State percakapan + wiring semua event.
   ========================================================= */
(function(){
  "use strict";

  var cfg = NEURA.config;
  var api = NEURA.api;
  var ui = NEURA.ui;

  var input = document.getElementById("chatInput");
  var sendBtn = document.getElementById("sendBtn");
  var themeToggle = document.getElementById("themeToggle");
  var clearChatBtn = document.getElementById("clearChatBtn");

  var messages = [];        // {id, role:'user'|'ai', text, ts}
  var isRequesting = false;

  function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  /* ---------- persistence ---------- */
  function saveHistory(){
    try{ localStorage.setItem(cfg.STORAGE_KEY, JSON.stringify(messages)); }
    catch(e){ /* storage full/unavailable — fail silently */ }
  }
  function loadHistory(){
    try{
      var raw = localStorage.getItem(cfg.STORAGE_KEY);
      if (raw){
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) messages = parsed;
      }
    }catch(e){ messages = []; }
  }

  /* ---------- rendering ---------- */
  function render(){
    ui.renderAll(messages, { onRegenerate: regenerateLast });
  }

  /* ---------- messages ---------- */
  function addMessage(role, text){
    var msg = { id: uid(), role: role, text: text, ts: Date.now() };
    messages.push(msg);
    saveHistory();
    return msg;
  }

  function setLoading(loading){
    isRequesting = loading;
    sendBtn.disabled = loading;
    sendBtn.classList.toggle("loading", loading);
  }

  function requestAndAppend(contextText){
    setLoading(true);
    ui.renderTypingBubble();

    api.call(contextText)
      .then(function(result){
        ui.removeTypingBubble();
        addMessage("ai", result);
        render();
      })
      .catch(function(){
        ui.removeTypingBubble();
        ui.showToast("Gagal bg, coba hapus chat ulang.");
      })
      .finally(function(){
        setLoading(false);
      });
  }

  function handleSend(){
    if (isRequesting) return;
    var trimmed = input.value.trim();
    if (trimmed === ""){
      ui.showToast("Pesan gaboleh kosong jig");
      return;
    }

    input.value = "";
    ui.autoResize();
    input.focus();

    var historyBeforeThis = messages.slice(-cfg.CONTEXT_LIMIT);
    addMessage("user", trimmed);
    render();

    var contextText = api.buildContext(historyBeforeThis, trimmed);
    requestAndAppend(contextText);
  }

  function regenerateLast(){
    if (isRequesting) return;
    if (messages.length === 0) return;
    var last = messages[messages.length - 1];
    if (last.role !== "ai") return;

    var lastUserIndex = -1;
    for (var i = messages.length - 2; i >= 0; i--){
      if (messages[i].role === "user"){ lastUserIndex = i; break; }
    }
    if (lastUserIndex === -1) return;

    var lastUserText = messages[lastUserIndex].text;
    var historySlice = messages.slice(Math.max(0, lastUserIndex - cfg.CONTEXT_LIMIT), lastUserIndex);

    messages.pop(); // remove AI answer being replaced
    saveHistory();
    render();

    var contextText = api.buildContext(historySlice, lastUserText);
    requestAndAppend(contextText);
  }

  /* ---------- clear chat ---------- */
  function handleClearChat(){
    ui.rippleEffect(clearChatBtn);
    if (messages.length === 0){
      ui.showToast("blum ada percakapan");
      return;
    }
    ui.openConfirmModal(function(){
      messages = [];
      saveHistory();
      render();
      ui.showToast("ngapain dihapus jir ", "success");
    });
  }

  /* ---------- events ---------- */
  input.addEventListener("input", ui.autoResize);
  /* Enter selalu newline — tidak ada listener submit-on-enter, ini biarkan perilaku default textarea. */

  sendBtn.addEventListener("click", function(){
    ui.rippleEffect(sendBtn);
    handleSend();
  });

  themeToggle.addEventListener("click", function(){
    var current = document.documentElement.getAttribute("data-theme");
    ui.applyTheme(current === "dark" ? "light" : "dark");
    ui.rippleEffect(themeToggle);
  });

  clearChatBtn.addEventListener("click", handleClearChat);

  /* ---------- init ---------- */
  function init(){
    ui.loadTheme();
    loadHistory();
    render();
    ui.autoResize();
    input.focus();
  }

  init();
})();
