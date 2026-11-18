(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const eur = (v, d = 0) => v.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header */
  const top = $(".top");
  const onScroll = () => top.classList.toggle("scrolled", scrollY > 10);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $(".burger").addEventListener("click", (e) => {
    const open = document.body.classList.toggle("nav-open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

  /* scroll spy */
  const links = $$(".nav a");
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((l) => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const t = $(l.getAttribute("href")); if (t) spy.observe(t); });

  /* reveal */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .step, .phone, .road, .final-in").forEach((el) => io.observe(el));
  // stagger siblings
  $$(".hero-copy .reveal").forEach((el, i) => el.style.setProperty("--rd", i * .08 + "s"));
  $$(".prob-grid .reveal, .price-grid .reveal, .acc .reveal, .feat .reveal").forEach((el) => {
    const i = [...el.parentNode.children].indexOf(el); el.style.setProperty("--rd", i * .08 + "s");
  });

  /* count up */
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count; if (!to || reduce) return;
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  /* pseudo QR codes (deterministic pattern, finder squares) */
  const makeQR = (el, seed = 7) => {
    const n = 21; let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const finder = (x, y, ox, oy) => { const dx = x - ox, dy = y - oy; if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null; const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6; const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4; return edge || core; };
    let html = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on = finder(x, y, 0, 0); if (on === null) on = finder(x, y, 14, 0); if (on === null) on = finder(x, y, 0, 14);
      const nearF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (on === null) on = nearF ? false : rnd() > .52;
      html += `<i class="${on ? "" : "o"}" style="--d:${(x + y) * 18}"></i>`;
    }
    el.innerHTML = html;
  };
  makeQR($("#qr"), 11); $$("[data-qr]").forEach((el, i) => makeQR(el, 3 + i));

  /* hero checkout loop */
  const stages = $$(".stage"), dots = $$(".dots i");
  const dur = [2600, 2200, 2200, 2800, 3200];
  let cur = 0;
  const show = (i) => {
    stages.forEach((s, k) => { s.classList.toggle("is-out", k === cur && k !== i); s.classList.remove("is-on"); });
    // restart animations
    const st = stages[i]; void st.offsetWidth; st.classList.add("is-on"); st.classList.remove("is-out");
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
    if (i === 4) { const fp = $(".f-pay"); fp.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(.3,1.4,.5,1)" }); }
    cur = i;
    setTimeout(() => show((i + 1) % stages.length), dur[i]);
  };
  if (!reduce) setTimeout(() => show(1), dur[0]);

  /* pet eyes follow pointer */
  const eyes = $$(".pet-ava .eye, .cat .eye");
  addEventListener("pointermove", (e) => {
    eyes.forEach((eye) => {
      const r = eye.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const a = Math.atan2(dy, dx), m = Math.min(1.4, Math.hypot(dx, dy) / 120);
      eye.setAttribute("transform", `translate(${(Math.cos(a) * m).toFixed(2)} ${(Math.sin(a) * m).toFixed(2)})`);
    });
  }, { passive: true });

  /* tabs */
  const blob = $(".tab-blob"), tabs = $$(".tab");
  const moveBlob = (t) => { blob.style.left = t.offsetLeft + "px"; blob.style.width = t.offsetWidth + "px"; };
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => { x.classList.toggle("is-on", x === t); x.setAttribute("aria-selected", x === t); });
    $$(".panel").forEach((p) => p.classList.toggle("is-on", p.dataset.panel === t.dataset.tab));
    moveBlob(t);
  }));
  const fixBlob = () => moveBlob($(".tab.is-on"));
  addEventListener("resize", fixBlob); document.fonts?.ready.then(fixBlob); fixBlob();

  /* range fill */
  const paint = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");

  /* praxis calculator */
  const iN = $("#i-n"), iA = $("#i-a"), iQ = $("#i-q"), iH = $("#i-h");
  const animNum = (el, to, fmt) => {
    const from = +(el.dataset.v || 0); el.dataset.v = to; if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 500); el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const calcPraxis = () => {
    [iN, iA, iQ, iH].forEach(paint);
    const n = +iN.value, a = +iA.value, q = +iQ.value / 100, h = +iH.value;
    $("#o-n").textContent = n; $("#o-a").textContent = eur(a); $("#o-q").textContent = Math.round(q * 100) + " %"; $("#o-h").textContent = h + " h";
    const rev = n * a * q * 12, fee = rev * .039, net = rev - fee, hours = h * 52;
    animNum($("#r-rev"), rev, (v) => eur(Math.round(v)));
    $("#r-fee").textContent = eur(Math.round(fee)); $("#r-hours").textContent = hours + " h"; $("#r-net").textContent = eur(Math.round(net));
    $("#r-bar").style.height = Math.min(100, 40 + (rev / 400000) * 60) + "%";
  };
  [iN, iA, iQ, iH].forEach((r) => r.addEventListener("input", calcPraxis)); calcPraxis();

  /* halter calculator */
  const iB = $("#i-b"); let months = 12;
  const EFF = .079, r = Math.pow(1 + EFF, 1 / 12) - 1, NOM = r * 12;
  const calcHalter = () => {
    paint(iB);
    const b = +iB.value; $("#o-b").textContent = eur(b);
    let rate, total, zins;
    if (months <= 6) { rate = b / months; total = b; zins = "0,00 % / 0,00 %"; }
    else { rate = b * r / (1 - Math.pow(1 + r, -months)); total = rate * months; zins = (NOM * 100).toFixed(2).replace(".", ",") + " % / 7,90 %"; }
    animNum($("#h-rate"), rate, (v) => eur(v, 2));
    $("#h-total").textContent = eur(total, 2); $("#h-zins").textContent = zins;
    const cal = $("#h-cal"); cal.style.gridTemplateColumns = `repeat(${Math.min(months, 12)}, 1fr)`;
    cal.innerHTML = Array.from({ length: months }, (_, i) => `<i class="${months <= 6 ? "zero" : ""}" style="--i:${i}"></i>`).join("");
  };
  iB.addEventListener("input", () => { $$(".pet").forEach((p) => p.classList.remove("is-on")); calcHalter(); });
  $$(".seg button").forEach((bt) => bt.addEventListener("click", () => {
    $$(".seg button").forEach((x) => x.classList.toggle("is-on", x === bt)); months = +bt.dataset.m; calcHalter();
  }));
  $$(".pet").forEach((p) => p.addEventListener("click", () => {
    $$(".pet").forEach((x) => x.classList.toggle("is-on", x === p)); iB.value = p.dataset.amt; calcHalter();
  }));
  calcHalter();

  /* toast */
  const toast = $("#toast"); let tt;
  const say = (msg) => { toast.textContent = msg; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 3600); };
  $$('a[href="#praxis-finden"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); say("Praxissuche startet mit dem Launch. Bis dahin: fragen Sie am Empfang nach fintavo."); }));

  /* form */
  const form = $("#pilot-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("input[required]", form).forEach((i) => {
      const bad = !i.value.trim() || (i.type === "email" && !/^\S+@\S+\.\S+$/.test(i.value)) || (i.name === "plz" && !/^\d{5}$/.test(i.value));
      i.classList.toggle("bad", bad); if (bad) ok = false;
    });
    if (!ok) { say("Bitte die markierten Felder prüfen."); return; }
    $(".form-ok", form).hidden = false;
    $$("[data-seats-taken]").forEach((el) => el.textContent = "64");
    $$(".seat-bar i").forEach((el) => el.style.width = "64%");
    $$("[data-seats]").forEach((el) => el.textContent = "36");
  });
  $$("input", form).forEach((i) => i.addEventListener("input", () => i.classList.remove("bad")));

  /* seats: occasionally someone else grabs one */
  if (!reduce) setTimeout(() => {
    const s = $("[data-seats]"); if (+s.textContent > 36) { s.textContent = +s.textContent - 1; say("Tierarztpraxis aus Schwabing hat sich gerade einen Gründerplatz gesichert."); }
  }, 14000);
})();
