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
  function all() { document.querySelectorAll(".cl-head").forEach(fit); }
  var timer; window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(all, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(all); else window.addEventListener("load", all);
  all();
})();
