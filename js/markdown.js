/* =========================================================
   NEURA — Markdown
   Parser markdown ringan (heading, bold, italic, list,
   inline code, code block) + ekstraksi code block untuk
   fitur Preview.
   ========================================================= */
window.NEURA = window.NEURA || {};

NEURA.markdown = (function(){

  function escapeHtml(str){
    return str
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function inlineFmt(str){
    str = str.replace(/`([^`]+)`/g, "<code>$1</code>");
    str = str.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    str = str.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
    str = str.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
    return str;
  }

  /**
   * Parse markdown text into HTML, and separately return
   * the raw code blocks found (with language tag) so the
   * caller can offer a live Preview.
   * @returns {{html:string, codeBlocks:Array<{lang:string,code:string}>}}
   */
  function parse(raw){
    var codeBlocks = [];

    var text = raw.replace(/```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g, function(_, lang, code){
      var idx = codeBlocks.length;
      var cleanCode = code.replace(/\n$/,"");
      codeBlocks.push({ lang: (lang || "").toLowerCase(), code: cleanCode });
      return "%%CODEBLOCK" + idx + "%%";
    });

    text = escapeHtml(text);

    text = text.replace(/%%CODEBLOCK(\d+)%%/g, function(_, idxStr){
      var idx = parseInt(idxStr, 10);
      var block = codeBlocks[idx];
      var label = block.lang ? block.lang : "code";
      return '<div class="code-block-wrap" data-block-index="' + idx + '">' +
               '<div class="code-block-head"><span>' + escapeHtml(label) + '</span></div>' +
               '<pre><code>' + escapeHtml(block.code) + '</code></pre>' +
             '</div>';
    });

    var lines = text.split("\n");
    var html = [];
    var inList = false;

    for (var i = 0; i < lines.length; i++){
      var line = lines[i];

      if (/<div class="code-block-wrap"/.test(line) || /<\/div>/.test(line) || /<pre><code>/.test(line) || /<\/code><\/pre>/.test(line) || /<div class="code-block-head">/.test(line)){
        if (inList){ html.push("</ul>"); inList = false; }
        html.push(line);
        continue;
      }

      var heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading){
        if (inList){ html.push("</ul>"); inList = false; }
        var level = heading[1].length;
        html.push("<h" + level + ">" + inlineFmt(heading[2]) + "</h" + level + ">");
        continue;
      }

      var listItem = line.match(/^\s*[-*]\s+(.*)$/);
      if (listItem){
        if (!inList){ html.push("<ul>"); inList = true; }
        html.push("<li>" + inlineFmt(listItem[1]) + "</li>");
        continue;
      } else if (inList){
        html.push("</ul>");
        inList = false;
      }

      if (line.trim() === ""){
        html.push("");
      } else {
        html.push("<p>" + inlineFmt(line) + "</p>");
      }
    }
    if (inList) html.push("</ul>");

    var finalHtml = html.join("\n").replace(/(<p><\/p>\n?)+/g, "");

    return { html: finalHtml, codeBlocks: codeBlocks };
  }

  /**
   * Decide whether a set of code blocks is "previewable"
   * (i.e. contains something renderable in a browser).
   */
  function isPreviewable(codeBlocks){
    if (!codeBlocks || codeBlocks.length === 0) return false;
    return codeBlocks.some(function(b){
      var lang = b.lang;
      if (["html","htm","css","javascript","js","xml","svg"].indexOf(lang) !== -1) return true;
      if (!lang && /<\s*[a-z!]/i.test(b.code)) return true; // looks like markup even without a tag
      return false;
    });
  }

  /**
   * Build a full HTML document string out of the code blocks
   * so it can be rendered inside a sandboxed iframe.
   */
  function buildPreviewDocument(codeBlocks){
    var htmlBlock = codeBlocks.find(function(b){ return b.lang === "html" || b.lang === "htm"; });
    var cssBlocks = codeBlocks.filter(function(b){ return b.lang === "css"; });
    var jsBlocks = codeBlocks.filter(function(b){ return b.lang === "javascript" || b.lang === "js"; });

    if (!htmlBlock){
      htmlBlock = codeBlocks.find(function(b){ return !b.lang && /<\s*[a-z!]/i.test(b.code); });
    }

    var cssInline = cssBlocks.map(function(b){ return b.code; }).join("\n\n");
    var jsInline = jsBlocks.map(function(b){ return b.code; }).join("\n\n");

    if (htmlBlock){
      var bodyMarkup = htmlBlock.code;
      var isFullDoc = /<html[\s>]/i.test(bodyMarkup);

      if (isFullDoc){
        var doc = bodyMarkup;
        if (cssInline){
          doc = doc.replace(/<\/head>/i, "<style>" + cssInline + "</style></head>");
        }
        if (jsInline){
          doc = doc.replace(/<\/body>/i, "<script>" + jsInline + "<\/script></body>");
        }
        return doc;
      }

      return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
             "<style>" + cssInline + "</style></head><body>" +
             bodyMarkup +
             "<script>" + jsInline + "<\/script>" +
             "</body></html>";
    }

    // No HTML block — just CSS/JS: render a minimal shell so it can still run.
    return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
           "<style>" + cssInline + "</style></head><body>" +
           "<script>" + jsInline + "<\/script>" +
           "</body></html>";
  }

  return {
    escapeHtml: escapeHtml,
    parse: parse,
    isPreviewable: isPreviewable,
    buildPreviewDocument: buildPreviewDocument
  };
})();
