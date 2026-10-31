// HOSSO library — renders every section's cards from window.CATALOG (built by make-library.mjs).
(() => {
  const C = window.CATALOG;
  const page = document.body.dataset.page;
  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const grid = $("#grid");
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="#0A0A0A"><path d="M7 4l13 8-13 8z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="#0A0A0A"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="#E8E7E3" stroke-width="2.4" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/></svg>';

  // copy-to-clipboard chips: the exact value the studio reads
  document.addEventListener("click", (e) => {
    const c = e.target.closest(".code");
    if (!c) return;
    navigator.clipboard?.writeText(c.dataset.copy || c.textContent).catch(() => {});
    c.classList.add("done"); const t = c.textContent; c.textContent = "copied ✓";
    setTimeout(() => { c.classList.remove("done"); c.textContent = t; }, 1100);
  });
  const code = (v, copy) => `<button class="code" data-copy='${esc(copy ?? v)}'>${esc(v)}</button>`;
  const setCount = (n) => { const el = $("#count"); if (el) el.textContent = `${n} items`; };

  // run an animation only while its card is on screen
  const onView = (el, start, stop) => new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop && stop())), { rootMargin: "120px" }).observe(el);
  const loop = (build, el) => {
    let tl = null;
    const play = () => { if (!tl) { tl = build(); tl.repeat(-1).repeatDelay(0.9); } tl.play(); };
    onView(el, play, () => tl && tl.pause());
    el.querySelector(".replay")?.addEventListener("click", () => tl && tl.restart());
  };
  const fitFrame = (phone) => { const f = phone.querySelector(".frame"); const fit = () => { f.style.transform = `scale(${phone.clientWidth / 1080})`; }; new ResizeObserver(fit).observe(phone); fit(); };

  // ---------- fonts load lazily: a face is only fetched when its card scrolls into view
  const loaded = new Set();
  const loadFont = (f) => {
    const fam = "F_" + f.id.replace(/\W/g, "_");
    if (!loaded.has(fam)) { loaded.add(fam); const face = new FontFace(fam, `url("${f.file}")`); face.load().then((ff) => { document.fonts.add(ff); document.querySelectorAll(`[data-fam="${fam}"]`).forEach((n) => n.classList.remove("loading")); }).catch(() => {}); }
    return fam;
  };
  const famFor = (name) => C.fonts.find((f) => f.family.toLowerCase() === name.toLowerCase() || f.name.toLowerCase() === name.toLowerCase());

  // ---------- text moves (shared by the motion, pairs and typing pages)
  const words = (el) => { const parts = el.innerHTML.split(/(\s+)/); el.innerHTML = parts.map((p) => (/^\s+$/.test(p) ? p : `<span class="mask"><span>${p}</span></span>`)).join(""); return el.querySelectorAll(".mask > span"); };
  // Arabic letters must stay joined: splitting them into boxes breaks their shapes, so Arabic text moves word by word
  const chars = (el) => { const txt = el.textContent; if (/[؀-ۿ]/.test(txt)) { el.innerHTML = txt.split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? w : `<span style="display:inline-block">${w}</span>`)).join(""); return el.querySelectorAll("span"); } el.innerHTML = [...txt].map((c) => (c === " " ? " " : `<span style="display:inline-block">${c}</span>`)).join(""); return el.querySelectorAll("span"); };
  const MOVES = {
    slam: { name: "Slam", ar: "ضربة وهزة", use: "الهوك، أول 2 ثانية", run: (el) => { const tl = gsap.timeline(); tl.fromTo(el, { scale: 2.3, opacity: 0, filter: "blur(16px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.22, ease: "expo.out" }).to(el, { keyframes: [{ x: 12, y: -6, duration: 0.03 }, { x: -9, y: 5, duration: 0.03 }, { x: 4, y: -2, duration: 0.03 }, { x: 0, y: 0, duration: 0.05 }] }); return tl; } },
    maskRise: { name: "Mask rise", ar: "الكلمات بتطلع من خط", use: "عناوين المشاهد", run: (el) => gsap.timeline().fromTo(words(el), { yPercent: 115 }, { yPercent: 0, duration: 0.7, stagger: 0.09, ease: "expo.out" }) },
    blurStagger: { name: "Blur stagger", ar: "بلور كلمة كلمة", use: "جمل هادية وفخمة", run: (el) => gsap.timeline().fromTo(words(el), { opacity: 0, filter: "blur(16px)", y: 24 }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, stagger: 0.12, ease: "power4.out" }) },
    typewriter: { name: "Typewriter", ar: "كتابة حرف حرف", use: "برومبت أو أمر", run: (el) => { const txt = el.textContent, o = { n: 0 }; return gsap.timeline().fromTo(o, { n: 0 }, { n: txt.length, duration: Math.min(1.6, txt.length * 0.07), ease: "none", onUpdate: () => { el.innerHTML = esc(txt.slice(0, Math.round(o.n))) + '<i class="caret"></i>'; } }); } },
    scramble: { name: "Scramble decode", ar: "حروف بتتفك", use: "أسامي أدوات وأكواد", run: (el) => { const fin = el.textContent, g = "#%&@$X01<>/", o = { p: 0 }; return gsap.timeline().fromTo(o, { p: 0 }, { p: 1, duration: 1.1, ease: "power2.out", onUpdate: () => { const k = Math.floor(o.p * fin.length); let s = fin.slice(0, k); for (let i = k; i < fin.length; i++) s += fin[i] === " " ? " " : g[(i * 7 + Math.floor(o.p * 40)) % g.length]; el.textContent = s; } }); } },
    posterPunch: { name: "Poster punch", ar: "مط بوستر", use: "أرقام وصدمة", run: (el) => gsap.timeline().fromTo(el, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" }, { scaleY: 1, opacity: 1, duration: 0.6, ease: "back.out(2.4)" }) },
    inkWipe: { name: "Ink wipe", ar: "حبر من اليمين", use: "خط يدوي وتوقيع", run: (el) => gsap.timeline().fromTo(el, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.0, ease: "power2.inOut" }) },
    letterCascade: { name: "Letter cascade", ar: "حروف بتنزل", use: "كلمة واحدة إنجليزي", run: (el) => gsap.timeline().fromTo(chars(el), { y: -60, opacity: 0, rotation: -12 }, { y: 0, opacity: 1, rotation: 0, duration: 0.55, stagger: 0.04, ease: "back.out(2)" }) },
    flipUp: { name: "Flip up", ar: "قلبة 3D", use: "انتقال بين سطرين", run: (el) => gsap.timeline().fromTo(words(el), { rotationX: -95, opacity: 0, transformOrigin: "50% 50% -30px", transformPerspective: 600 }, { rotationX: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" }) },
    trackIn: { name: "Tracking in", ar: "مسافات بتقفل", use: "سطر إنجليزي فخم", run: (el) => gsap.timeline().fromTo(el, { letterSpacing: "0.6em", opacity: 0, filter: "blur(6px)" }, { letterSpacing: "0.02em", opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out" }) },
    highlight: { name: "Gold highlight", ar: "هايلايت دهبي", use: "كلمة مهمة", run: (el) => { const em = el.querySelector("em") || el; em.style.backgroundImage = "linear-gradient(#AD8330,#AD8330)"; em.style.backgroundRepeat = "no-repeat"; em.style.backgroundPosition = "100% 88%"; em.style.padding = "0 6px"; const tl = gsap.timeline(); tl.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }).fromTo(em, { backgroundSize: "0% 38%", color: "#AD8330" }, { backgroundSize: "100% 38%", color: "#E8E7E3", duration: 0.5, ease: "power3.inOut" }, 0.35); return tl; } },
    zoomPunch: { name: "Zoom punch", ar: "زوم من بعيد", use: "كلمة واحدة كبيرة", run: (el) => gsap.timeline().fromTo(el, { scale: 0.2, opacity: 0, filter: "blur(10px)" }, { scale: 1.12, opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power4.out" }).to(el, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" }) },
    glitch: { name: "Glitch in", ar: "جليتش", use: "تقنية وأخطاء", run: (el) => { const tl = gsap.timeline(); tl.set(el, { opacity: 1 }); for (let i = 0; i < 6; i++) tl.to(el, { x: (i % 2 ? -1 : 1) * (10 - i), skewX: (i % 2 ? 12 : -12), opacity: i % 2 ? 0.4 : 1, duration: 0.04 }); return tl.to(el, { x: 0, skewX: 0, opacity: 1, duration: 0.05 }); } },
    wave: { name: "Wave", ar: "موجة", use: "جمل خفيفة ومرحة", run: (el) => gsap.timeline().fromTo(chars(el), { y: 0 }, { keyframes: [{ y: -22, duration: 0.18 }, { y: 0, duration: 0.22 }], stagger: 0.035, ease: "sine.inOut" }) },
    splitSlide: { name: "Split slide", ar: "نصين بيتقابلوا", use: "مقارنة أو قبل/بعد", run: (el) => { const ws = words(el); return gsap.timeline().fromTo(ws, { x: (i) => (i % 2 ? -260 : 260), opacity: 0, filter: "blur(10px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.07, ease: "expo.out" }); } },
    countUp: { name: "Count up", ar: "رقم بيعدّ", use: "إحصائيات", run: (el) => { const target = parseInt(el.textContent.replace(/\D/g, "")) || 1000, o = { v: 0 }; return gsap.timeline().fromTo(o, { v: 0 }, { v: target, duration: 1.2, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString("en-US") + "+"; } }); } },
  };
  const MOVE_TEXT = { slam: "بتعلّم <em>Claude</em>", maskRise: "فكرتك تبقى <em>فيديو</em>", blurStagger: "المونتاج <em>فن</em>", typewriter: "اعملي ريل عن الحلقة 3", scramble: "CLAUDE CODE", posterPunch: "دقيقة <em>واحدة</em>", inkWipe: "حكاية <em>بصرية</em>", letterCascade: "HOSSO", flipUp: "من فكرة لـ <em>فيديو</em>", trackIn: "LEARN WITH HOSSO", highlight: "السر في <em>الهوك</em>", zoomPunch: "<em>WAIT</em>", glitch: "ERROR 404", wave: "يلا نبدأ الحلقة", splitSlide: "قبل بعد", countUp: "1000000" };
  const MONO = new Set(["scramble", "letterCascade", "trackIn", "glitch", "countUp"]);

  // ---------- pages
  const render = {
    fonts() {
      let filter = "all", q = "", sample = null;
      const L1 = "الريل ده <em>محدش</em> منتجه", L2 = "اكتب «استوديو» في الكومنت وأبعتلك الطريقة كلها ١٢٣", L3 = "HOSSO VISUALS 1,000,000+";
      const draw = () => {
        grid.innerHTML = "";
        const list = C.fonts.filter((f) => (filter === "all" || (filter === "identity" ? f.role : f.source === filter)) && (!q || (f.name + f.id).toLowerCase().includes(q)));
        setCount(list.length);
        list.forEach((f) => {
          const fam = "F_" + f.id.replace(/\W/g, "_");
          // on the public site a paid font is shown as a picture of its card (its file is not published)
          const stage = f.img ? `<img loading="lazy" src="${f.img}" alt="${esc(f.name)}" style="width:100%;display:block;margin-top:18px;border-radius:10px"/>`
            : `<div class="l1 loading" data-fam="${fam}" style="font-family:'${fam}'">${sample ? esc(sample) : L1}</div><div class="l2 loading" data-fam="${fam}" style="font-family:'${fam}'">${L2}</div><div class="l3 loading" data-fam="${fam}" style="font-family:'${fam}'">${L3}</div>`;
          const el = h(`<article class="card font-card"><div class="stage"><span class="fid">${esc(f.id)}</span><span class="fname">${esc(f.name)}</span>
            ${stage}</div>
            <div class="meta"><div class="meta-row"><h3>${esc(f.family)} <small style="color:var(--mute);font-weight:700">${esc(f.style)}</small></h3>${code(f.id)}</div>
            <div class="tags">${f.role ? `<span class="tag gold">${esc(f.role)}</span>` : ""}<span class="tag">${{ catalog: "مكتبتي", ofl: "مجاني OFL", brand: "الهوية" }[f.source]}</span></div></div></article>`);
          grid.append(el);
          if (!f.img) onView(el, () => loadFont(f));
        });
      };
      $("#q").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
      $("#sample").addEventListener("input", (e) => { sample = e.target.value.trim() || null; document.querySelectorAll(".font-card .l1").forEach((n) => { if (sample) n.textContent = sample; else n.innerHTML = L1; }); });
      $("#size").addEventListener("input", (e) => grid.style.setProperty("--fs", e.target.value + "px"));
      document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c)); filter = c.dataset.f; draw(); }));
      draw();
    },
    pairs() {
      const MOVE_OF = { 1: "slam", 2: "maskRise", 3: "blurStagger", 4: "typewriter", 5: "posterPunch", 6: "flipUp", 7: "inkWipe" };
      const TXT = { 1: ["بتعلّم <em>Claude</em>", "LEARN WITH HOSSO"], 2: ["فكرتك تبقى <em>فيديو</em>", "IDEA → VIDEO"], 3: ["المونتاج <em>فن</em>", "the art of the cut"], 4: ["اكتب واتفرج", "CLAUDE CODE"], 5: ["دقيقة <em>واحدة</em>", "60 SECONDS"], 6: ["اعمل <em>فيديو</em>", "$ claude --make reel"], 7: ["حكاية <em>بصرية</em>", "a visual story"] };
      setCount(C.pairs.length);
      C.pairs.forEach((p) => {
        const fa = famFor(p.arabic) || famFor(p.arabic.split(" ")[0]), fl = famFor(p.latin) || famFor(p.latin.split(" ")[0]);
        const A = fa ? loadFont(fa) : "Cairo", B = fl ? loadFont(fl) : "Quicksand";
        const [t1, t2] = TXT[p.id] || ["", ""];
        const el = h(`<article class="card"><div class="stage mstage" style="height:300px;flex-direction:column"><div class="line" style="font-family:'${A}';font-size:clamp(28px,3.4vw,44px);white-space:normal">${t1}</div><div class="sub" style="font-family:'${B}';font-size:clamp(16px,1.9vw,24px);color:var(--text);white-space:normal">${t2}</div><button class="replay">${ICON_REPLAY}</button></div>
          <div class="meta"><div class="meta-row"><h3>${esc(p.arabic)} × ${esc(p.latin)}</h3><span class="code">#${p.id}</span></div><p>${esc(p.motion)}</p><div class="tags"><span class="tag">${esc(p.use)}</span></div></div></article>`);
        grid.append(el);
        const l1 = $(".line", el), l2 = $(".sub", el), h1 = l1.innerHTML, h2 = l2.innerHTML;
        loop(() => { l1.innerHTML = h1; l2.innerHTML = h2; const tl = gsap.timeline(); tl.add(MOVES[MOVE_OF[p.id]].run(l1)).fromTo(l2, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }, 0.4); return tl; }, el);
      });
    },
    motion() {
      const keys = Object.keys(MOVES);
      setCount(keys.length);
      keys.forEach((k) => {
        const m = MOVES[k];
        const el = h(`<article class="card"><div class="stage mstage"><div class="line" style="${MONO.has(k) ? "font-family:var(--mono);direction:ltr" : ""}">${MOVE_TEXT[k]}</div><button class="replay">${ICON_REPLAY}</button></div>
          <div class="meta"><div class="meta-row"><h3>${esc(m.ar)}</h3>${code(m.name, `"textMotion": "${k}"`)}</div><p>${esc(m.use)}</p><div class="tags">${k === "slam" ? '<span class="tag gold">في الاستوديو</span>' : '<span class="tag soon">مكتبة · جاهزة للإضافة</span>'}</div></div></article>`);
        grid.append(el);
        const line = $(".line", el), html = line.innerHTML;
        loop(() => { line.innerHTML = html; gsap.set(line, { clearProps: "all" }); return m.run(line); }, el);
      });
    },
    transitions() {
      setCount(C.transitions.length);
      C.transitions.forEach((t, i) => {
        const el = h(`<article class="card"><div class="stage"><div class="phone"><div class="frame" id="tf${i}">
            <div class="mini a"><div class="t">مشهد <em>1</em></div><div class="box">SCENE A</div></div>
            <div class="mini b"><div class="t">مشهد <em>2</em></div><div class="box">SCENE B</div></div></div></div><button class="replay">${ICON_REPLAY}</button></div>
          <div class="meta"><div class="meta-row"><h3>${esc(t.id)}</h3>${code(`"exit": "${t.id}"`)}</div><div class="tags">${t.inRotation ? '<span class="tag gold">في الدوران التلقائي</span>' : ""}<span class="tag">خروج 0.32ث · دخول 0.6ث</span></div></div></article>`);
        grid.append(el);
        fitFrame($(".phone", el));
        loop(() => {
          const A = `#tf${i} .mini.a`, B = `#tf${i} .mini.b`;
          gsap.set([A, B], { clearProps: "all" });
          const tl = gsap.timeline();
          tl.set(B, { opacity: 0 }).set(A, { opacity: 1 });
          const ex = gsap.timeline(); new Function("tl", t.exit.replaceAll("__G__", A))(ex); tl.add(ex, 0.9);
          tl.set(B, { opacity: 1 }, 1.22);
          if (t.enter) { const en = gsap.timeline(); new Function("tl", t.enter.replaceAll("__G__", B))(en); tl.add(en, 1.22); }
          tl.to({}, { duration: 1.1 });
          return tl;
        }, el);
      });
    },
    scenes() {
      setCount(C.scenes.length);
      C.scenes.forEach((s) => {
        const el = h(`<article class="card"><div class="stage"><div class="phone">${s.clip ? `<video muted playsinline preload="none" src="${s.clip.video}#t=${s.clip.start}"></video><button class="sound-toggle">SOUND OFF</button>` : '<div class="no-clip">لسه مفيش كليب مترندر للمشهد ده<br/>(بيتعمل في ريل التجربة الجاي)</div>'}</div></div>
          <div class="meta"><div class="meta-row"><h3>${esc(s.id)}</h3>${code(`"type": "${s.id}"`)}</div><p>${esc(s.info)}</p>${s.clip ? `<div class="tags"><span class="tag">من ${esc(s.clip.from)}</span></div>` : ""}</div></article>`);
        grid.append(el);
        const v = $("video", el);
        if (!v) return;
        v.addEventListener("timeupdate", () => { if (v.currentTime >= s.clip.end - 0.05) v.currentTime = s.clip.start; });
        onView(el, () => { if (v.preload === "none") { v.preload = "auto"; v.currentTime = s.clip.start; } v.play().catch(() => {}); }, () => v.pause());
        $(".sound-toggle", el).addEventListener("click", (e) => { v.muted = !v.muted; e.target.textContent = v.muted ? "SOUND OFF" : "SOUND ON"; });
      });
    },
    stickers() {
      const ENTER = {
        spring: (img) => gsap.fromTo(img, { scale: 0, rotation: -40, y: 60 }, { scale: 1, rotation: 0, y: 0, duration: 0.8, ease: "back.out(2.2)" }),
        pop: (img) => gsap.fromTo(img, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "elastic.out(1, 0.45)" }),
        drop: (img) => gsap.fromTo(img, { y: -260, rotation: 8 }, { y: 0, rotation: 0, duration: 0.9, ease: "bounce.out" }),
        spin: (img) => gsap.fromTo(img, { rotation: -360, scale: 0.2, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, duration: 0.9, ease: "expo.out" }),
        slide: (img) => gsap.fromTo(img, { x: 300, rotation: 20, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: 0.7, ease: "expo.out" }),
        float: (img) => gsap.fromTo(img, { y: 14, rotation: -3 }, { y: -14, rotation: 3, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: 1 }),
      };
      let mode = "spring";
      document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c)); mode = c.dataset.f; document.querySelectorAll(".st-stage img").forEach((img) => ENTER[mode](img)); }));
      setCount(C.stickers.length);
      C.stickers.forEach((s) => {
        const el = h(`<article class="card"><div class="stage st-stage"><img loading="lazy" src="${s.file}" alt="${esc(s.id)}"/><button class="replay">${ICON_REPLAY}</button></div>
          <div class="meta"><div class="meta-row"><h3>${esc(s.id)}</h3>${code(`"${s.id}"`)}</div><div class="tags">${s.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div></div></article>`);
        grid.append(el);
        const img = $("img", el);
        let seen = false;
        onView(el, () => { if (!seen) { seen = true; ENTER[mode](img); } });
        el.addEventListener("mouseenter", () => ENTER[mode](img));
        $(".replay", el).addEventListener("click", () => ENTER[mode](img));
      });
    },
    sounds() {
      const CAT = { whoosh: "Whoosh · سحبة", transition: "Transition · انتقال", click: "Click · كليك", ui: "UI · واجهة", impact: "Impact · ضربة", hit: "Hit · خبطة", riser: "Riser · صعود", glitch: "Glitch · جليتش", bundled: "Basics · أساسيات" };
      let only = "all", cur = null;
      const draw = () => {
        grid.innerHTML = "";
        const list = C.sounds.filter((s) => only === "all" || (only === "soft" ? s.soft : s.cat === only));
        setCount(list.length);
        const cats = [...new Set(list.map((s) => s.cat))];
        cats.forEach((cat) => {
          grid.append(h(`<div class="group-title" style="grid-column:1/-1">${esc(CAT[cat] || cat)} <small>${list.filter((s) => s.cat === cat).length}</small></div>`));
          list.filter((s) => s.cat === cat).forEach((s) => {
            const el = h(`<article class="card snd"><div class="stage">${s.wave ? `<img src="${s.wave}" alt=""/>` : ""}<div class="bar"></div><button class="play">${ICON_PLAY}</button></div>
              <div class="meta"><div class="meta-row"><h3 style="direction:ltr;text-align:right">${esc(s.name)}</h3>${code(`{ "cat": "${s.cat}" }`)}</div><div class="tags">${s.soft ? '<span class="tag gold">الباليتة الخفيفة (شغالة)</span>' : ""}${s.label ? `<span class="tag">${esc(s.label)}</span>` : ""}${s.dur ? `<span class="tag">${s.dur}s</span>` : ""}</div></div></article>`);
            grid.append(el);
            const audio = new Audio(); audio.preload = "none"; audio.src = s.file;
            const bar = $(".bar", el), btn = $(".play", el);
            const stop = () => { audio.pause(); btn.innerHTML = ICON_PLAY; };
            audio.addEventListener("timeupdate", () => { bar.style.width = (audio.currentTime / (audio.duration || 1)) * 100 + "%"; });
            audio.addEventListener("ended", () => { btn.innerHTML = ICON_PLAY; bar.style.width = "0"; });
            $(".stage", el).addEventListener("click", () => { if (!audio.paused) return stop(); if (cur && cur !== audio) cur.pause(); document.querySelectorAll(".snd .play").forEach((b) => (b.innerHTML = ICON_PLAY)); cur = audio; audio.currentTime = 0; audio.play(); btn.innerHTML = ICON_PAUSE; });
          });
        });
      };
      document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c)); only = c.dataset.f; draw(); }));
      draw();
    },
    typing() {
      const snd = (name) => C.sounds.find((s) => s.name === name)?.file;
      const play = (name, vol = 0.6) => { const f = snd(name); if (!f) return; const a = new Audio(f); a.volume = vol; a.play().catch(() => {}); return a; };
      const COMBOS = [
        { id: "typing-bed", ar: "كتابة + صوت كيبورد متصل", use: "برومبت طويل", text: "اعملي ريل عن الحلقة 3", run: (out) => { const a = play("typing", 0.5); const txt = out.dataset.t, o = { n: 0 }; return gsap.timeline({ onComplete: () => a && a.pause() }).fromTo(o, { n: 0 }, { n: txt.length, duration: 1.4, ease: "none", onUpdate: () => (out.innerHTML = esc(txt.slice(0, Math.round(o.n))) + '<i class="caret"></i>') }); } },
        { id: "key-per-letter", ar: "كل حرف بنقرة", use: "كلمة كومنت قصيرة", text: "استوديو", run: (out) => { const txt = out.dataset.t, tl = gsap.timeline(); [...txt].forEach((c, i) => tl.call(() => { out.innerHTML = esc(txt.slice(0, i + 1)) + '<i class="caret"></i>'; play("key-press", 0.55); }, null, i * 0.16)); return tl; } },
        { id: "command-confirm", ar: "أمر + تأكيد", use: "ترمينال", term: true, text: "$ claude --make reel", run: (out) => { const a = play("typing", 0.45); const txt = out.dataset.t, o = { n: 0 }; const tl = gsap.timeline(); tl.fromTo(o, { n: 0 }, { n: txt.length, duration: 1.1, ease: "none", onUpdate: () => (out.innerHTML = esc(txt.slice(0, Math.round(o.n))) + '<i class="caret"></i>') }).call(() => { a && a.pause(); play("15-ui-confirm", 0.5); out.innerHTML = esc(txt) + '<br/><span style="color:#9be59b">✓ done</span>'; }); return tl; } },
        { id: "scramble-glitch", ar: "فك الحروف + جليتش", use: "اسم أداة", text: "CLAUDE CODE", mono: true, run: (out) => { play("21-glitch-short", 0.5); const fin = out.dataset.t, g = "#%&@$X01<>/", o = { p: 0 }; return gsap.timeline().fromTo(o, { p: 0 }, { p: 1, duration: 1.0, ease: "power2.out", onUpdate: () => { const k = Math.floor(o.p * fin.length); let s = fin.slice(0, k); for (let i = k; i < fin.length; i++) s += fin[i] === " " ? " " : g[(i * 7 + Math.floor(o.p * 40)) % g.length]; out.textContent = s; } }); } },
        { id: "comment-send", ar: "كومنت + نشر + إشعار", use: "الـ CTA", text: "كود", run: (out) => { const txt = out.dataset.t, tl = gsap.timeline(); [...txt].forEach((c, i) => tl.call(() => { out.innerHTML = esc(txt.slice(0, i + 1)) + '<i class="caret"></i>'; play("key-press", 0.5); }, null, i * 0.2)); tl.call(() => { play("16-click-soft", 0.7); out.innerHTML = esc(txt) + ' <span style="color:var(--gold);font-size:.6em">نشر ✓</span>'; }, null, txt.length * 0.2 + 0.25); tl.call(() => play("notification", 0.35), null, txt.length * 0.2 + 0.8); return tl; } },
        { id: "count-tick", ar: "عدّاد بتكّات", use: "إحصائية", text: "12400", mono: true, run: (out) => { const target = +out.dataset.t, o = { v: 0 }, tl = gsap.timeline(); tl.fromTo(o, { v: 0 }, { v: target, duration: 1.2, ease: "power3.out", onUpdate: () => (out.textContent = Math.round(o.v).toLocaleString("en-US")) }); [0, 0.15, 0.32, 0.55, 0.85].forEach((t) => tl.call(() => play("12-ui-tap", 0.35), null, t)); tl.call(() => play("13-ui-pop-up", 0.5), null, 1.15); return tl; } },
      ];
      setCount(COMBOS.length);
      COMBOS.forEach((c) => {
        const el = h(`<article class="card"><div class="stage type-stage"><div class="${c.term ? "term" : "out"}" data-t="${esc(c.text)}" style="${c.mono ? "font-family:var(--mono);direction:ltr" : ""}">${esc(c.text)}</div><button class="big-play">${ICON_PLAY} شغّل بالصوت</button></div>
          <div class="meta"><div class="meta-row"><h3>${esc(c.ar)}</h3>${code(c.id)}</div><p>${esc(c.use)}</p></div></article>`);
        grid.append(el);
        const out = $("[data-t]", el);
        $(".big-play", el).addEventListener("click", () => { out.textContent = ""; c.run(out); });
      });
    },
    backgrounds() {
      setCount(C.backgrounds.length);
      C.backgrounds.forEach((b) => {
        const media = b.kind === "video" ? `<video src="${b.file}" muted loop playsinline autoplay></video>` : `<img loading="lazy" src="${b.file}" alt=""/>`;
        const el = h(`<article class="card bg-card"><div class="stage"><div class="phone">${media}</div></div>
          <div class="meta"><div class="meta-row"><h3>${esc(b.id)}</h3>${b.kind === "video" ? code(`"bgVideo": "${b.id}"`) : code(b.id)}</div>${b.prompt ? `<div class="prompt">${esc(b.prompt)}</div>${code("نسخ البرومبت", b.prompt)}` : ""}<div class="tags"><span class="tag">Google Flow</span><span class="tag">${b.kind === "video" ? "فيديو 1080p" : "صورة 2K"}</span></div></div></article>`);
        grid.append(el);
      });
    },
    ideas() {
      const SEC = { ideas: "أفكار ريلز", hooks: "الهوك", "speaker-text": "الكلام مع المتكلم", motion: "الموشن", story: "القصة والكلام", edit: "المونتاج", profile: "البروفايل والبايو", sound: "الصوت", shoot: "التصوير والألوان" };
      const ST = { built: ['<span class="tag gold">في الاستوديو</span>'], todo: ['<span class="tag soon">هتتبني في الاستوديو</span>'], "n/a": ['<span class="tag">للتصوير والكتابة</span>'] };
      const list = C.ideas || [];
      let sec = "all", st = "all", q = "";
      const secs = $("#secs");
      secs.innerHTML = `<button class="chip on" data-sec="all">الكل ${list.length}</button>` + Object.entries(SEC).map(([k, v]) => `<button class="chip" data-sec="${k}">${v} ${list.filter((c) => c.section === k).length}</button>`).join("");
      const draw = () => {
        grid.innerHTML = "";
        const shown = list.filter((c) => (sec === "all" || c.section === sec) && (st === "all" || c.studio === st) && (!q || [c.title, c.what, ...(c.how || [])].join(" ").toLowerCase().includes(q)));
        setCount(shown.length);
        const groups = sec === "all" ? Object.keys(SEC) : [sec];
        groups.forEach((g) => {
          const items = shown.filter((c) => c.section === g);
          if (!items.length) return;
          grid.append(h(`<div class="group-title" style="grid-column:1/-1">${esc(SEC[g])} <small>${items.length}</small></div>`));
          items.forEach((c) => grid.append(h(`<article class="card"><div class="stage" style="height:230px">${c.frame ? `<img loading="lazy" src="${c.frame}" alt="" style="width:100%;height:100%;object-fit:cover;opacity:.92"/>` : ""}<span class="code" style="position:absolute;top:10px;left:10px">ريل #${esc(c.source)} · ${Math.round(c.at)}ث</span></div>
            <div class="meta"><h3>${esc(c.title)}</h3><p>${esc(c.what)}</p>
            ${c.how?.length ? `<p style="font-size:13px;color:var(--text)">${c.how.map((x, i) => `<b style="color:var(--gold)">${i + 1}.</b> ${esc(x)}`).join("<br/>")}</p>` : ""}
            <div class="tags">${(ST[c.studio] || []).join("")}<span class="tag">${esc(SEC[c.section] || c.section)}</span></div></div></article>`)));
        });
      };
      $("#q").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
      secs.addEventListener("click", (e) => { const b = e.target.closest("[data-sec]"); if (!b) return; secs.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === b)); sec = b.dataset.sec; draw(); });
      document.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { document.querySelectorAll("[data-st]").forEach((x) => x.classList.toggle("on", x === b)); st = b.dataset.st; draw(); }));
      draw();
    },
    inspiration() {
      let only = "all", q = "";
      const draw = () => {
        grid.innerHTML = "";
        const list = (C.inspiration || []).filter((x) => (only === "all" || (only === "learned" ? x.learned : !x.learned)) && (!q || [x.title, x.note, x.liked, ...x.categories, ...x.techniques].join(" ").toLowerCase().includes(q)));
        setCount(list.length);
        if (!list.length) grid.append(h('<div class="empty" style="grid-column:1/-1">مفيش حاجة هنا. ابعت فيديو لبوت مكتبة الإلهام.</div>'));
        list.forEach((x) => {
          const el = h(`<article class="card"><div class="stage"><div class="phone">${x.video ? `<video muted playsinline loop preload="none" poster="${x.thumb}" src="${x.video}"></video>` : `<img src="${x.thumb}" alt="" style="width:100%;height:100%;object-fit:cover"/>`}</div></div>
            <div class="meta"><div class="meta-row"><h3>${esc(x.title || x.id)}</h3><span class="code">#${esc(x.id)}</span></div>
            ${x.note ? `<p style="color:var(--text)">«${esc(x.note)}»</p>` : ""}${x.liked ? `<p>${esc(x.liked)}</p>` : ""}
            ${x.techniques.length ? `<p style="font-size:13px">${x.techniques.map((t) => "• " + esc(t)).join("<br/>")}</p>` : ""}
            <div class="tags">${x.learned ? '<span class="tag gold">الاستوديو اتعلمها</span>' : '<span class="tag soon">لسه هتتعلم</span>'}${x.categories.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}${x.cps ? `<span class="tag">${x.cps} قطع/ث</span>` : ""}</div>
            ${x.url ? `<a class="code" style="justify-self:start" href="${esc(x.url)}" target="_blank" rel="noopener">الأصل ↗</a>` : ""}</div></article>`);
          grid.append(el);
          const v = $("video", el);
          if (v) { el.addEventListener("mouseenter", () => { v.preload = "auto"; v.play().catch(() => {}); }); el.addEventListener("mouseleave", () => v.pause()); }
        });
      };
      $("#q").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
      document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c)); only = c.dataset.f; draw(); }));
      draw();
    },
    home() {
      const n = { fonts: C.fonts.length, pairs: C.pairs.length, motion: Object.keys(MOVES).length, transitions: C.transitions.length, scenes: C.scenes.length, stickers: C.stickers.length, sounds: C.sounds.length, typing: 6, ideas: (C.ideas || []).length, inspiration: (C.inspiration || []).length, backgrounds: C.backgrounds.length };
      document.querySelectorAll("[data-n]").forEach((el) => (el.textContent = n[el.dataset.n] ?? ""));
      $("#total").textContent = Object.values(n).reduce((a, b) => a + b, 0);
      gsap.from(".hero > *", { y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" });
      gsap.from(".tile", { y: 40, opacity: 0, duration: 0.8, stagger: 0.05, ease: "expo.out", delay: 0.2 });
    },
  };
  $("#built") && ($("#built").textContent = C.built);
  render[page]?.();
})();
