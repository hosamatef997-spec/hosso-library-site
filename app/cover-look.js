// HOSSO «cover look» on the web (2026-11-07, see /cover-look.css): fits each title line to the text width like the
// carousel cover, and draws the champagne pen loop of look D. Runs on load, after the fonts, and on resize.
(function () {
  var MAX = { l1: 132, l2: 116 }, MIN = { l1: 40, l2: 34 };
  function fit(head) {
    var box = head.querySelector(".cl-text"); if (!box) return;
    var w = box.getBoundingClientRect().width;
    // the block line first; a short first line is then held to 2.2x the block, so a phone never gets a giant first line
    var rows = [].slice.call(head.querySelectorAll(".cl-row")).sort(function (a, b) { return a.classList.contains("l2") ? -1 : 1; });
    var cap = { l1: MAX.l1, l2: MAX.l2 };
    rows.forEach(function (row) {
      var el = row.querySelector(".cl-fit"), k = row.classList.contains("l1") ? "l1" : "l2";
      el.classList.remove("wrap"); el.style.fontSize = "100px";
      var size = Math.min(cap[k], 100 * w / el.getBoundingClientRect().width);
      el.style.fontSize = size.toFixed(1) + "px";   // a second pass: Arabic shaping does not scale exactly linearly
      if (size < cap[k]) size = Math.min(cap[k], size * w / el.getBoundingClientRect().width) * 0.995;
      if (size < MIN[k]) { size = MIN[k]; el.classList.add("wrap"); }
      el.style.fontSize = size.toFixed(1) + "px";
      if (k === "l2") cap.l1 = Math.min(MAX.l1, size * 2.2);
    });
    loop(head);
  }
  function loop(head) {
    var svg = head.querySelector(".cl-loop"); if (!svg) return;
    var tgt = head.querySelector(".cl-row.l1 bdi") || head.querySelector(".cl-row.l1 .cl-fit");
    var hb = head.getBoundingClientRect(), b = tgt.getBoundingClientRect();
    var cx = b.left + b.width / 2 - hb.left, cy = b.top + b.height / 2 - hb.top + b.height * 0.03;
    var rx = b.width / 2 + Math.max(10, b.height * 0.12), ry = b.height * 0.42, d = "";
    for (var k = 0; k <= 160; k++) {
      var t = 0.5 + (k / 160) * (2 * Math.PI + 0.55), q = 1 + 0.03 * Math.sin(t * 2.7) + 0.018 * Math.sin(t * 6.1);
      var x = cx + rx * q * Math.cos(t), y = cy - ry * q * Math.sin(t) - (t > 2 * Math.PI + 0.5 ? (t - 2 * Math.PI - 0.5) * b.height * 0.2 : 0);
      d += (k ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    svg.setAttribute("viewBox", "0 0 " + hb.width.toFixed(0) + " " + hb.height.toFixed(0));
    var p = svg.querySelector("path"); p.setAttribute("d", d);
    p.setAttribute("transform", "rotate(-3 " + cx.toFixed(0) + " " + cy.toFixed(0) + ")");
    p.style.strokeWidth = Math.max(3, Math.min(6, b.height * 0.045)).toFixed(1);
  }
  // the carousel's 3D room on the web too (Hossam 2026-11-07, R126 «نفس الفكرة على الموقع والمكتبة واللينكات»): a few shapes from
  // the page topic peek in from the screen edges down the page, behind the glass cards; near ones soft, far ones a little soft
  var SETS = { lenses: ["disc-face", "disc-edge", "disc-face", "disc-edge"], keys: ["key-slash", "key-enter", "glyph-slash", "disc-edge"],
    coins: ["coin-face", "coin-edge", "disc-edge", "coin-face"] };
  var DEPTH = ["mid", "near", "far"], MEDIA = "assets/cover/";   // copy of hossovisuals.online/cover-look.js, shapes from library/assets/cover/
  function room() {
    var old = document.querySelector(".cl-room"); if (old) old.remove();
    var tag = document.querySelector("[data-props]"), topic = tag ? tag.getAttribute("data-props") : "lenses", set = SETS[topic] || SETS.lenses;
    var H = document.body.offsetHeight, W = document.documentElement.clientWidth;
    var head = document.querySelector(".page-head") || document.querySelector(".hero") || document.querySelector(".h-hero, .head") || document.querySelector("main > section"), start = 0;
    if (head) start = head.getBoundingClientRect().bottom + window.scrollY + (W < 700 ? 120 : 160);
    if (!start || start < 500 || start > H * 0.6) start = 700;
    var gap = W < 700 ? 780 : 880, layer = document.createElement("div");
    layer.className = "cl-room"; layer.setAttribute("aria-hidden", "true");
    for (var y = start, k = 0; y < H - 420 && k < 9; y += gap, k++) {
      var im = document.createElement("img");
      im.src = MEDIA + set[k % set.length] + ".webp"; im.alt = ""; im.loading = "lazy"; im.decoding = "async";
      im.className = "cl-shape " + DEPTH[k % 3] + (k % 2 ? " left" : " right"); im.style.top = Math.round(y) + "px";
      layer.appendChild(im);
    }
    document.body.appendChild(layer);
  }
  function all() { document.querySelectorAll(".cl-head").forEach(fit); room(); }
  var timer; window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(all, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(all); else window.addEventListener("load", all);
  all();
})();
