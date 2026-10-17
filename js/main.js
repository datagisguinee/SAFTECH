(function () {
  "use strict";

  var CONTACT_EMAIL = "contact@saftech-infrastructures.com";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Menu mobile
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    toggle.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Cartouche du hero : reporte le besoin et le lieu dans le formulaire de contact
  var quick = document.getElementById("quick-quote");
  quick.addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("f-besoin").value = document.getElementById("q-besoin").value;
    var site = document.getElementById("q-site").value.trim();
    var msg = document.getElementById("f-msg");
    if (site && msg.value.indexOf("Site : ") !== 0) msg.value = "Site : " + site + "\n" + msg.value;
    document.getElementById("contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(function () { document.getElementById("f-nom").focus({ preventScroll: true }); }, reduceMotion ? 0 : 600);
  });

  // Formulaire : pas de serveur, on prépare un e-mail dans la messagerie du visiteur
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var checks = [
      ["f-nom", "votre nom"],
      ["f-email", "une adresse e-mail valide"],
      ["f-msg", "quelques mots sur votre projet"]
    ];
    var missing = [], firstInvalid = null;
    checks.forEach(function (c) {
      var el = document.getElementById(c[0]);
      var val = el.value.trim();
      var ok = val !== "" && (el.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) { missing.push(c[1]); if (!firstInvalid) firstInvalid = el; }
    });
    if (firstInvalid) {
      status.className = "form-status error";
      status.textContent = "Il manque " + missing.join(", ") + ".";
      firstInvalid.focus();
      return;
    }
    var v = function (id) { return document.getElementById(id).value.trim(); };
    var subject = "Demande de projet : " + v("f-besoin") + (v("f-org") ? " (" + v("f-org") + ")" : "");
    var body = [
      "Nom : " + v("f-nom"),
      "Organisation : " + (v("f-org") || "-"),
      "E-mail : " + v("f-email"),
      "Téléphone : " + (v("f-tel") || "-"),
      "Besoin : " + v("f-besoin"),
      "",
      v("f-msg")
    ].join("\n");
    status.className = "form-status ok";
    status.textContent = "Votre messagerie s'ouvre avec la demande pré-remplie. Si rien ne s'ouvre, écrivez à " + CONTACT_EMAIL + " ou appelez le +225 01 00 66 63 63.";
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  // Courbes de niveau (marching squares sur un relief synthétique)
  function makeField(hills) {
    return function (x, y) {
      var v = 0;
      for (var i = 0; i < hills.length; i++) {
        var p = hills[i], dx = x - p.x, dy = (y - p.y) * .8;
        v += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.s * p.s));
      }
      return v + .05 * Math.sin(x * 9) * Math.cos(y * 7);
    };
  }
  var SEGS = {
    1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[3, 0], [2, 1]], 6: [[0, 2]], 7: [[3, 0]],
    8: [[3, 0]], 9: [[0, 2]], 10: [[3, 2], [0, 1]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]]
  };
  function contours(ctx, w, h, field, levels, minor, major) {
    var step = 9, cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1;
    var g = new Float32Array(cols * rows);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) g[j * cols + i] = field(i * step / w, j * step / h);
    ctx.lineWidth = 1;
    for (var L = 1; L <= levels; L++) {
      var t = L * .07;
      ctx.strokeStyle = L % 5 === 0 ? major : minor;
      ctx.lineWidth = L % 5 === 0 ? 1.4 : 1;
      ctx.beginPath();
      for (var y = 0; y < rows - 1; y++) for (var x = 0; x < cols - 1; x++) {
        var a = g[y * cols + x], b = g[y * cols + x + 1], c = g[(y + 1) * cols + x + 1], d = g[(y + 1) * cols + x];
        var k = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        if (k === 0 || k === 15) continue;
        var px = x * step, py = y * step;
        var e = [
          [px + step * (t - a) / (b - a), py],
          [px + step, py + step * (t - b) / (c - b)],
          [px + step * (t - d) / (c - d), py + step],
          [px, py + step * (t - a) / (d - a)]
        ];
        var s = SEGS[k];
        for (var n = 0; n < s.length; n++) {
          ctx.moveTo(e[s[n][0]][0], e[s[n][0]][1]);
          ctx.lineTo(e[s[n][1]][0], e[s[n][1]][1]);
        }
      }
      ctx.stroke();
    }
  }

  // Coordonnées indicatives : la feuille couvre une emprise d'Abidjan
  var BBOX = { latN: 5.42, latS: 5.29, lonW: 4.07, lonE: 3.92 };
  function dms(deg, pos, neg) {
    var hemi = deg >= 0 ? pos : neg; deg = Math.abs(deg);
    var d = Math.floor(deg), mFull = (deg - d) * 60, m = Math.floor(mFull), s = Math.round((mFull - m) * 60);
    if (s === 60) { s = 0; m += 1; }
    return (d < 10 ? "0" : "") + d + "°" + (m < 10 ? "0" : "") + m + "′" + (s < 10 ? "0" : "") + s + "″ " + hemi;
  }

  function sheet(canvas, opts) {
    var ctx = canvas.getContext("2d");
    var field = makeField(opts.hills);
    var base = document.createElement("canvas");
    var bctx = base.getContext("2d");
    var w = 0, h = 0, dpr = 1, pointer = null, reveal = reduceMotion || !opts.animate ? 1 : 0;

    function frame(c) {
      // Cadre de la feuille, graduations et coordonnées en marge
      var m = 14;
      c.strokeStyle = "rgba(158,217,245,.35)"; c.lineWidth = 1;
      c.strokeRect(m + .5, m + .5, w - 2 * m - 1, h - 2 * m - 1);
      c.font = "500 10px 'Azeret Mono', ui-monospace, monospace";
      c.fillStyle = "rgba(169,194,230,.75)";
      var cols = Math.max(3, Math.round(w / 220)), rowsN = Math.max(2, Math.round(h / 180));
      for (var i = 1; i < cols; i++) {
        var x = m + (w - 2 * m) * i / cols;
        c.beginPath(); c.moveTo(x, m); c.lineTo(x, m + 8); c.moveTo(x, h - m); c.lineTo(x, h - m - 8); c.stroke();
        c.beginPath(); c.setLineDash([2, 6]); c.moveTo(x, m + 8); c.lineTo(x, h - m - 8); c.strokeStyle = "rgba(158,217,245,.08)"; c.stroke(); c.setLineDash([]); c.strokeStyle = "rgba(158,217,245,.35)";
        var lon = BBOX.lonW + (BBOX.lonE - BBOX.lonW) * i / cols;
        if (w > 640) c.fillText(dms(lon, "O", "E").slice(0, 7), x + 4, h - m - 4);
      }
      for (var j = 1; j < rowsN; j++) {
        var y = m + (h - 2 * m) * j / rowsN;
        c.beginPath(); c.moveTo(m, y); c.lineTo(m + 8, y); c.moveTo(w - m, y); c.lineTo(w - m - 8, y); c.stroke();
        c.beginPath(); c.setLineDash([2, 6]); c.moveTo(m + 8, y); c.lineTo(w - m - 8, y); c.strokeStyle = "rgba(158,217,245,.08)"; c.stroke(); c.setLineDash([]); c.strokeStyle = "rgba(158,217,245,.35)";
      }
      // Échelle graphique
      if (w > 640) {
        var sx = m + 20, sy = h - m - 22, seg = 40;
        for (var k = 0; k < 4; k++) { c.fillStyle = k % 2 ? "rgba(158,217,245,.15)" : "rgba(158,217,245,.6)"; c.fillRect(sx + k * seg, sy, seg, 4); }
        c.fillStyle = "rgba(169,194,230,.75)"; c.fillText("0", sx - 3, sy - 5); c.fillText("2 km", sx + 4 * seg - 12, sy - 5);
      }
    }

    function build() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = base.width = w * dpr; canvas.height = base.height = h * dpr;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, w, h);
      contours(bctx, w, h, field, opts.levels, opts.minor, opts.major);
      if (opts.frame) frame(bctx);
      paint();
    }

    function paint() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (reveal < 1) {
        // Révélation : la feuille se dessine depuis le coin supérieur gauche
        ctx.save(); ctx.beginPath();
        var r = Math.hypot(canvas.width, canvas.height) * reveal;
        ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(base, 0, 0); ctx.restore();
      } else {
        ctx.drawImage(base, 0, 0);
      }
      if (pointer) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = "rgba(47,180,236,.55)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pointer.x, 14); ctx.lineTo(pointer.x, h - 14); ctx.moveTo(14, pointer.y); ctx.lineTo(w - 14, pointer.y); ctx.stroke();
        ctx.strokeStyle = "#2FB4EC"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#2FB4EC"; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (opts.animate && !reduceMotion) {
      var start = null;
      var tick = function (ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / 1600);
        reveal = 1 - Math.pow(1 - p, 4);
        paint();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    if (opts.readout) {
      var lat = document.getElementById("ro-lat"), lon = document.getElementById("ro-lon"), alt = document.getElementById("ro-alt");
      canvas.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        var fx = pointer.x / w, fy = pointer.y / h;
        lat.textContent = dms(BBOX.latN - (BBOX.latN - BBOX.latS) * fy, "N", "S");
        lon.textContent = dms(BBOX.lonW + (BBOX.lonE - BBOX.lonW) * fx, "O", "E");
        alt.textContent = (4 + field(fx, fy) * 62).toFixed(1).replace(".", ",") + " m";
        requestAnimationFrame(paint);
      });
      canvas.addEventListener("pointerleave", function () { pointer = null; requestAnimationFrame(paint); });
    }

    var timer;
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(build, 150); });
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  }

  var heroMap = document.querySelector(".hero-map");
  if (heroMap && heroMap.getContext) sheet(heroMap, {
    hills: [
      { x: .82, y: .3, s: .2, h: 1 }, { x: .6, y: .85, s: .17, h: .75 }, { x: .12, y: .18, s: .24, h: .65 },
      { x: .35, y: .98, s: .2, h: .55 }, { x: .97, y: .95, s: .13, h: .5 }
    ],
    levels: 14, minor: "rgba(47,180,236,.2)", major: "rgba(47,180,236,.5)",
    frame: true, animate: true, readout: true
  });
  // Logos partenaires : défilement continu et mise en couleur au passage dans la zone centrale
  (function () {
    var section = document.getElementById("partenaires");
    var viewport = section && section.querySelector(".partners-marquee");
    var track = document.getElementById("partners-track");
    if (!viewport || !track) return;
    if (reduceMotion) { section.classList.add("partners-static"); return; }

    var originals = Array.prototype.slice.call(track.children);
    var SPEED = 45;          // px par seconde
    var ZONE = .24;          // demi-largeur de la zone d'activation, en part de la largeur visible
    var items = [], period = 0, offset = 0, last = null, running = false, visible = true;

    function layout() {
      // Clone la séquence autant que nécessaire pour couvrir la largeur visible + une période
      while (track.children.length > originals.length) track.removeChild(track.lastChild);
      period = 0;
      var first = originals[0];
      var clone = originals.map(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); return c; });
      clone.forEach(function (c) { track.appendChild(c); });
      period = track.children[originals.length].offsetLeft - first.offsetLeft;
      var copies = Math.ceil(viewport.clientWidth / Math.max(period, 1)) + 1;
      for (var n = 1; n < copies; n++) {
        originals.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c); });
      }
      items = Array.prototype.slice.call(track.querySelectorAll("img"));
      offset = period ? offset % period : 0;
    }

    function colorize() {
      var vr = viewport.getBoundingClientRect();
      var center = vr.left + vr.width / 2, half = Math.max(vr.width * ZONE, 120);
      for (var i = 0; i < items.length; i++) {
        var r = items[i].getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - center) / half;      // 0 au centre, 1 au bord de la zone
        var t = Math.min(1, Math.max(0, (d - .35) / .65));             // plateau en couleur, puis fondu
        var gray = t * t * (3 - 2 * t);                                // smoothstep
        items[i].style.setProperty("--gray", gray.toFixed(3));
      }
    }

    function frame(ts) {
      if (!running) return;
      if (last !== null && period) {
        var dt = Math.min(64, ts - last) / 1000;                       // pas de saut après un onglet en arrière-plan
        offset = (offset + SPEED * dt) % period;
        track.style.transform = "translate3d(" + (-offset).toFixed(2) + "px,0,0)";
        colorize();
      }
      last = ts;
      requestAnimationFrame(frame);
    }
    function start() { if (running || !visible) return; running = true; last = null; requestAnimationFrame(frame); }
    function stop() { running = false; }

    layout(); colorize(); start();
    originals.forEach(function (li) {
      var img = li.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", function () { layout(); colorize(); });
    });
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { layout(); colorize(); }, 150); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(viewport);
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  })();

  var navyMap = document.querySelector(".navy-map");
  if (navyMap && navyMap.getContext) sheet(navyMap, {
    hills: [{ x: .9, y: .15, s: .22, h: .9 }, { x: .08, y: .9, s: .25, h: .8 }, { x: .55, y: .5, s: .12, h: .4 }],
    levels: 12, minor: "rgba(47,180,236,.12)", major: "rgba(47,180,236,.28)",
    frame: false, animate: false, readout: false
  });
})();
