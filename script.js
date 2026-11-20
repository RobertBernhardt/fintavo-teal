(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const eur = (v, d = 0) => v.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const annuity = (A, n, eff) => { const r = Math.pow(1 + eff, 1 / 12) - 1; return A * r / (1 - Math.pow(1 + r, -n)); };
  const pct = (e) => (e * 100).toFixed(1).replace(".", ",") + " %";

  /* toast */
  const toast = $("#toast"); let tt;
  const say = (m) => { toast.textContent = m; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 3800); };

  /* nav */
  $(".burger").addEventListener("click", (e) => { const o = document.body.classList.toggle("nav-open"); e.currentTarget.setAttribute("aria-expanded", o); });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  const links = $$(".nav a");
  const spy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((l) => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const t = $(l.getAttribute("href")); if (t) spy.observe(t); });

  /* reveal */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -5% 0px" });
  $$(".reveal, .step, .phone, .compare").forEach((el) => {
    const sib = [...el.parentNode.children].filter((c) => c.classList.contains("reveal"));
    if (sib.length > 1) el.style.setProperty("--rd", Math.min(sib.indexOf(el), 5) * .07 + "s");
    io.observe(el);
  });
  $$(".tiles i.y").forEach((t, k) => t.style.setProperty("--k", k));

  /* count up */
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count; if (reduce) return; const t0 = performance.now();
    const f = (t) => { const p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), { threshold: .6 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  /* pseudo QR */
  $$("[data-qr]").forEach((el) => {
    const n = 21; let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const fin = (x, y, ox, oy) => { const dx = x - ox, dy = y - oy; if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null; return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); };
    let h = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on = fin(x, y, 0, 0); if (on === null) on = fin(x, y, 14, 0); if (on === null) on = fin(x, y, 0, 14);
      const near = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (on === null) on = near ? false : rnd() > .52;
      h += `<i class="${on ? "" : "o"}" style="--d:${(x + y) * 16}"></i>`;
    }
    el.innerHTML = h;
  });

  /* ============ HERO ORBIT ============ */
  const bankIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>';
  const orbit = $("#orbit"), rays = $("#rays"), N = 20, R = 150;
  const banks = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2, x = Math.cos(a), y = Math.sin(a);
    const b = document.createElement("div"); b.className = "bank";
    b.style.left = 50 + x * 37.5 + "%"; b.style.top = 50 + y * 37.5 + "%";
    b.innerHTML = bankIcon + '<span class="tag"></span>';
    orbit.append(b);
    const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
    ln.setAttribute("x1", (x * 88).toFixed(1)); ln.setAttribute("y1", (y * 88).toFixed(1));
    ln.setAttribute("x2", (x * (R - 24)).toFixed(1)); ln.setAttribute("y2", (y * (R - 24)).toFixed(1));
    ln.setAttribute("class", "ray"); rays.append(ln);
    banks.push({ el: b, ray: ln, tag: b.querySelector(".tag") });
  }
  const status = $("#oc-status"), count = $("#oc-count"), offersEl = $("#offers"), best = $("#best"), payout = $("#payout"), core = $("#core");
  const deals = [{ i: 3, e: .064 }, { i: 10, e: .072 }, { i: 1, e: .089 }, { i: 17, e: .099 }];
  const AMT = 2840, M = 24;
  async function loop() {
    while (true) {
      banks.forEach((b) => { b.el.className = "bank"; b.ray.setAttribute("class", "ray"); b.tag.textContent = ""; });
      offersEl.innerHTML = ""; best.textContent = "wird ermittelt…"; payout.classList.remove("on");
      status.textContent = "Anfrage an Partnerbanken"; count.textContent = "0 / 20";
      core.classList.remove("pulse"); void core.offsetWidth; core.classList.add("pulse");
      for (let i = 0; i < N; i++) {
        banks[i].ray.setAttribute("class", "ray on"); banks[i].el.classList.add("ping");
        count.textContent = `${i + 1} / 20`; await sleep(55);
      }
      await sleep(400);
      status.textContent = "Banken prüfen";
      const order = [...Array(N).keys()].sort(() => Math.random() - .5);
      const yes = new Set(deals.map((d) => d.i));
      let answered = 0;
      for (const i of order) {
        const b = banks[i]; b.el.classList.remove("ping"); answered++;
        if (yes.has(i)) {
          const d = deals.find((x) => x.i === i); const r = annuity(AMT, M, d.e);
          b.el.classList.add("yes"); b.tag.textContent = eur(r, 0);
          const o = document.createElement("span"); o.className = "offer"; o.dataset.r = r; o.textContent = `${eur(r, 2)} · ${pct(d.e)}`; offersEl.append(o);
        } else { b.el.classList.add("no"); b.ray.setAttribute("class", "ray"); }
        count.textContent = `${answered} Antworten`; await sleep(110);
      }
      await sleep(500);
      const w = deals[0]; const wr = annuity(AMT, M, w.e);
      banks[w.i].el.classList.add("best"); banks[w.i].ray.setAttribute("class", "ray win");
      deals.slice(1).forEach((d) => banks[d.i].ray.setAttribute("class", "ray"));
      $$(".offer", offersEl).forEach((o) => o.classList.toggle("best", +o.dataset.r === wr));
      status.textContent = "Beste Rate gefunden"; count.textContent = "4 Zusagen";
      best.textContent = `${eur(wr, 2)} × ${M}`;
      await sleep(1400);
      status.textContent = "Zusage erteilt"; payout.classList.add("on");
      await sleep(3800);
      if (reduce) break;
    }
  }
  const heroIO = new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); loop(); } });
  heroIO.observe(orbit);

  /* ============ COMPARE GRID ============ */
  const many = $("#many");
  many.innerHTML = Array.from({ length: 20 }, () => '<i class="bk"></i>').join("");
  const mk = $$(".bk", many);
  async function manyLoop() {
    while (true) {
      mk.forEach((b) => (b.className = "bk"));
      await sleep(900);
      const pick = [...Array(20).keys()].sort(() => Math.random() - .5);
      const yes = pick.slice(0, 4);
      for (const i of pick) { mk[i].classList.add(yes.includes(i) ? "yes" : "no"); await sleep(70); }
      await sleep(300); mk[yes[0]].classList.add("best");
      await sleep(2600); if (reduce) break;
    }
  }
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); manyLoop(); } }, { threshold: .3 }).observe(many);

  /* ============ TABS ============ */
  const blob = $(".tab-blob"), tabs = $$(".tab");
  const moveBlob = (t) => { blob.style.left = t.offsetLeft + "px"; blob.style.width = t.offsetWidth + "px"; };
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => { x.classList.toggle("is-on", x === t); x.setAttribute("aria-selected", x === t); });
    $$(".tpanel").forEach((p) => p.classList.toggle("is-on", p.dataset.panel === t.dataset.tab));
    moveBlob(t);
  }));
  const fixBlob = () => moveBlob($(".tab.is-on"));
  addEventListener("resize", fixBlob); document.fonts?.ready.then(fixBlob); fixBlob();

  const paint = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");
  const animNum = (el, to, fmt) => {
    const from = +(el.dataset.v || 0); el.dataset.v = to; if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const f = (t) => { const p = Math.min(1, (t - t0) / 500); el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };

  /* praxis */
  const iN = $("#i-n"), iA = $("#i-a"), iQ = $("#i-q");
  const monthsEl = $("#r-months");
  const season = [.8, .85, 1, 1.05, 1.1, 1.15, 1.2, 1.1, 1, .95, .9, 1.05];
  monthsEl.innerHTML = season.map((_, i) => `<i style="--i:${i};--h:10%"></i>`).join("");
  const calcPraxis = () => {
    [iN, iA, iQ].forEach(paint);
    const n = +iN.value, a = +iA.value, q = +iQ.value / 100;
    $("#o-n").textContent = n; $("#o-a").textContent = eur(a); $("#o-q").textContent = Math.round(q * 100) + " %";
    const rev = n * a * q * 12;
    animNum($("#r-rev"), rev, (v) => eur(Math.round(v)));
    $("#r-cases").textContent = Math.round(n * q * 12);
    const scale = Math.min(1, rev / 250000) * .55 + .4;
    $$("i", monthsEl).forEach((m, i) => m.style.setProperty("--h", Math.round(season[i] * scale * 82) + "%"));
  };
  [iN, iA, iQ].forEach((r) => r.addEventListener("input", calcPraxis)); calcPraxis();

  /* halter: offers from banks */
  const iB = $("#i-b"); let months = 24;
  const bankSet = [["D", .064], ["K", .072], ["B", .089], ["R", .099], ["F", null], ["M", null]];
  const calcHalter = () => {
    paint(iB);
    const b = +iB.value; $("#o-b").textContent = eur(b);
    $("#h-offers").innerHTML = bankSet.map(([n, e], i) => {
      if (e === null) return `<div class="bo declined" style="--i:${i}"><span class="bi"></span><span>Partnerbank&nbsp;${n}</span><b>keine Zusage</b><em></em></div>`;
      const r = annuity(b, months, e);
      return `<div class="bo ${i === 0 ? "best" : ""}" style="--i:${i}"><span class="bi"></span><span>Partnerbank&nbsp;${n}${i === 0 ? '<br><span class="badge">Beste Rate</span>' : ""}</span><b>${eur(r, 2)}</b><em>${pct(e)} eff.</em></div>`;
    }).join("");
  };
  iB.addEventListener("input", () => { $$(".pet").forEach((p) => p.classList.remove("is-on")); calcHalter(); });
  $$(".seg button").forEach((bt) => bt.addEventListener("click", () => { $$(".seg button").forEach((x) => x.classList.toggle("is-on", x === bt)); months = +bt.dataset.m; calcHalter(); }));
  $$(".pet").forEach((p) => p.addEventListener("click", () => { $$(".pet").forEach((x) => x.classList.toggle("is-on", x === p)); iB.value = p.dataset.amt; calcHalter(); }));
  calcHalter();

  /* share */
  $("#share-btn").addEventListener("click", async () => {
    const text = "Hallo liebes Praxisteam, kennen Sie fintavo? Damit können Tierhalter größere Behandlungen finanzieren: eine Anfrage geht an über 20 Banken, die Praxis bekommt den vollen Betrag und trägt kein Kreditrisiko. Würde ich mir sehr wünschen!";
    try { if (navigator.share) { await navigator.share({ text }); return; } await navigator.clipboard.writeText(text); say("Nachricht kopiert. Jetzt nur noch an Ihre Praxis schicken."); }
    catch (_) { say("Teilen abgebrochen."); }
  });

  /* form */
  const form = $("#pilot-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault(); let ok = true;
    $$("input[required]", form).forEach((i) => {
      const bad = !i.value.trim() || (i.type === "email" && !/^\S+@\S+\.\S+$/.test(i.value)) || (i.name === "plz" && !/^\d{5}$/.test(i.value));
      i.classList.toggle("bad", bad); if (bad) ok = false;
    });
    if (!ok) { say("Bitte die markierten Felder prüfen."); return; }
    $(".form-ok", form).hidden = false;
  });
  $$("input", form).forEach((i) => i.addEventListener("input", () => i.classList.remove("bad")));
})();
