/* =========================================================
   NEURA — UI
   Semua fungsi rendering & interaksi DOM yang tidak
   menyimpan state percakapan (state ada di app.js).
   ========================================================= */
window.NEURA = window.NEURA || {};

NEURA.ui = (function(){
  var cfg = NEURA.config;
  var md = NEURA.markdown;

  var toastContainer = document.getElementById("toastContainer");
  var chatMain = document.getElementById("chatMain");
  var chatInner = document.getElementById("chatInner");
  var emptyState = document.getElementById("emptyState");
  var input = document.getElementById("chatInput");
  var sendBtn = document.getElementById("sendBtn");
  var themeToggle = document.getElementById("themeToggle");
  var themeIcon = document.getElementById("themeIcon");

  /* ---------- icons ---------- */
  function copyIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  }
  function regenIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
  }
  function playIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
  }
  function closeIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  }

  /* ---------- toast ---------- */
  function showToast(message, type){
    type = type || "error";
    var el = document.createElement("div");
    el.className = "toast " + type;
    el.style.pointerEvents = "auto";
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(function(){
      el.classList.add("fade-out");
      setTimeout(function(){ el.remove(); }, 300);
    }, cfg.TOAST_DURATION);
  }

  /* ---------- ripple ---------- */
  function rippleEffect(el){
    var circle = document.createElement("span");
    circle.className = "ripple";
    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = size + "px";
    circle.style.left = (rect.width/2 - size/2) + "px";
    circle.style.top = (rect.height/2 - size/2) + "px";
    el.style.position = "relative";
    el.appendChild(circle);
    setTimeout(function(){ circle.remove(); }, 500);
  }

  /* ---------- theme ---------- */
  function applyTheme(theme){
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.innerHTML = theme === "dark"
      ? '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    try{ localStorage.setItem(cfg.THEME_KEY, theme); }catch(e){}
  }
  function loadTheme(){
    var saved = null;
    try{ saved = localStorage.getItem(cfg.THEME_KEY); }catch(e){}
    if (!saved){
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    applyTheme(saved);
  }

  /* ---------- textarea autoresize ---------- */
  function autoResize(){
    input.style.height = "auto";
    var max = 150;
    var newHeight = Math.min(input.scrollHeight, max);
    input.style.height = newHeight + "px";
    input.style.overflowY = input.scrollHeight > max ? "auto" : "hidden";
  }

  /* ---------- scrolling ---------- */
  function scrollToBottom(){
    requestAnimationFrame(function(){
      chatMain.scrollTop = chatMain.scrollHeight;
    });
  }

  function toggleEmptyState(hasMessages){
    emptyState.style.display = hasMessages ? "none" : "block";
  }

  /* ---------- bubble rendering ---------- */
  function buildBubble(msg, isLastAi, handlers){
    var row = document.createElement("div");
    row.className = "msg-row " + msg.role;
    row.dataset.id = msg.id;

    var bubble = document.createElement("div");
    bubble.className = "bubble";

    var content = document.createElement("div");
    content.className = "content";

    var parsed = null;
    if (msg.role === "ai"){
      parsed = md.parse(msg.text);
      content.innerHTML = parsed.html;
    } else {
      content.innerHTML = "<p>" + md.escapeHtml(msg.text).replace(/\n/g,"<br>") + "</p>";
    }
    bubble.appendChild(content);

    var meta = document.createElement("div");
    meta.className = "bubble-meta";

    var ts = document.createElement("span");
    ts.className = "timestamp";
    ts.textContent = formatTime(msg.ts);
    meta.appendChild(ts);

    if (msg.role === "ai"){
      var actions = document.createElement("div");
      actions.className = "msg-actions";

      var copyBtn = document.createElement("button");
      copyBtn.className = "mini-btn";
      copyBtn.innerHTML = copyIcon() + "<span>Copy</span>";
      copyBtn.addEventListener("click", function(){
        navigator.clipboard.writeText(msg.text).then(function(){
          showToast("Jawaban disalin", "success");
        }).catch(function(){
          showToast("Gagal menyalin");
        });
      });
      actions.appendChild(copyBtn);

      if (parsed && md.isPreviewable(parsed.codeBlocks)){
        var previewBtn = document.createElement("button");
        previewBtn.className = "mini-btn preview-btn";
        previewBtn.innerHTML = playIcon() + "<span>Preview</span>";
        previewBtn.addEventListener("click", function(){
          openPreviewModal(parsed.codeBlocks);
        });
        actions.appendChild(previewBtn);
      }

      if (isLastAi && handlers && handlers.onRegenerate){
        var regenBtn = document.createElement("button");
        regenBtn.className = "mini-btn";
        regenBtn.innerHTML = regenIcon() + "<span>Regenerate</span>";
        regenBtn.addEventListener("click", handlers.onRegenerate);
        actions.appendChild(regenBtn);
      }

      meta.appendChild(actions);
    }

    bubble.appendChild(meta);
    row.appendChild(bubble);
    return row;
  }

  function formatTime(ts){
    var d = new Date(ts);
    var h = d.getHours().toString().padStart(2,"0");
    var m = d.getMinutes().toString().padStart(2,"0");
    return h + ":" + m;
  }

  function renderAll(messages, handlers){
    var frag = document.createDocumentFragment();
    var lastAiId = null;
    for (var i = messages.length - 1; i >= 0; i--){
      if (messages[i].role === "ai"){ lastAiId = messages[i].id; break; }
    }
    messages.forEach(function(msg){
      frag.appendChild(buildBubble(msg, msg.id === lastAiId, handlers));
    });
    chatInner.innerHTML = "";
    chatInner.appendChild(emptyState);
    chatInner.appendChild(frag);
    toggleEmptyState(messages.length > 0);
    scrollToBottom();
  }

  function renderTypingBubble(){
    removeTypingBubble();
    var row = document.createElement("div");
    row.className = "msg-row ai";
    row.id = "typingRow";
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = '<div class="typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    row.appendChild(bubble);
    chatInner.appendChild(row);
    scrollToBottom();
  }
  function removeTypingBubble(){
    var el = document.getElementById("typingRow");
    if (el) el.remove();
  }

  /* ---------- confirm modal ---------- */
  function openConfirmModal(onConfirm){
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal-box">' +
        '<h3>Hapus semua chat?</h3>' +
        '<p>Riwayat percakapan akan dihapus permanen dari perangkat ini.</p>' +
        '<div class="modal-actions">' +
          '<button class="btn-cancel" id="cancelClear">Batal</button>' +
          '<button class="btn-confirm" id="confirmClear">Hapus</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function(e){
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelector("#cancelClear").addEventListener("click", function(){
      overlay.remove();
    });
    overlay.querySelector("#confirmClear").addEventListener("click", function(){
      overlay.remove();
      onConfirm();
    });
  }

  /* ---------- preview modal ---------- */
  function openPreviewModal(codeBlocks){
    var doc = md.buildPreviewDocument(codeBlocks);

    var overlay = document.createElement("div");
    overlay.className = "preview-overlay";
    overlay.innerHTML =
      '<div class="preview-box">' +
        '<div class="preview-header">' +
          '<div class="ph-title">▶ Live Preview</div>' +
          '<button class="preview-close" id="closePreview" aria-label="Tutup preview"></button>' +
        '</div>' +
        '<div class="preview-body">' +
          '<iframe sandbox="allow-scripts" title="Code preview"></iframe>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector("#closePreview").innerHTML = closeIcon();

    var iframe = overlay.querySelector("iframe");
    iframe.srcdoc = doc;

    overlay.addEventListener("click", function(e){
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelector("#closePreview").addEventListener("click", function(){
      overlay.remove();
    });

    function escHandler(e){
      if (e.key === "Escape"){
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
      }
    }
    document.addEventListener("keydown", escHandler);
  }

  return {
    showToast: showToast,
    rippleEffect: rippleEffect,
    applyTheme: applyTheme,
    loadTheme: loadTheme,
    autoResize: autoResize,
    scrollToBottom: scrollToBottom,
    renderAll: renderAll,
    renderTypingBubble: renderTypingBubble,
    removeTypingBubble: removeTypingBubble,
    openConfirmModal: openConfirmModal,
    openPreviewModal: openPreviewModal,
    dom: {
      input: input,
      sendBtn: sendBtn,
      themeToggle: themeToggle
    }
  };
})();
