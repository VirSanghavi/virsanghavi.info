// Adds a "Copy" button to the top of every blog post.
// Copies the post (title + body) as plain text to the clipboard — handy for
// quoting, sharing, or pasting into an LLM. Injected into the .article-meta row
// so it sits next to the date and reading time. No per-post markup needed
// beyond including this script.
(function () {
  var article = document.querySelector(".article");
  if (!article) return;
  var meta = article.querySelector(".article-meta");
  if (!meta) return;
  if (meta.querySelector(".copy-post-btn")) return;

  var title = article.querySelector("h1");
  var body = article.querySelector(".article-body");

  var copyIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">' +
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var checkIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">' +
    '<path d="M20 6 9 17l-5-5"/></svg>';

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "copy-post-btn";
  btn.setAttribute("aria-label", "Copy post text");
  btn.innerHTML = copyIcon + "<span>Copy</span>";

  function postText() {
    var parts = [];
    if (title) parts.push(title.innerText.trim());
    if (body) parts.push(body.innerText.trim());
    return parts.join("\n\n");
  }

  var resetTimer;
  btn.addEventListener("click", function () {
    var text = postText();
    var done = function (ok) {
      btn.innerHTML = (ok ? checkIcon : copyIcon) + "<span>" + (ok ? "Copied!" : "Copy") + "</span>";
      btn.classList.toggle("copied", ok);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        btn.innerHTML = copyIcon + "<span>Copy</span>";
        btn.classList.remove("copied");
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(text, done); });
    } else {
      fallback(text, done);
    }
  });

  function fallback(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      done(ok);
    } catch (e) {
      done(false);
    }
  }

  meta.appendChild(btn);
})();
