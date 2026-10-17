(function () {
  "use strict";

  var CONTACT_EMAIL = "contact@saftech-infrastructures.com";

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

  // Formulaire : pas de serveur, on prépare un e-mail dans la messagerie du visiteur
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var required = ["f-nom", "f-email", "f-msg"];
    var firstInvalid = null;
    required.forEach(function (id) {
      var el = document.getElementById(id);
      var ok = el.value.trim() !== "" && (el.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      status.className = "form-status error";
      status.textContent = "Merci de renseigner votre nom, une adresse e-mail valide et votre message.";
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
    status.textContent = "Votre messagerie s'ouvre avec la demande pré-remplie. Si rien ne s'ouvre, écrivez-nous à " + CONTACT_EMAIL + " ou appelez le +225 01 00 66 63 63.";
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  // Courbes de niveau du hero (motif topographique)
  var canvas = document.querySelector(".hero-contours");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var hills = [
    { x: .78, y: .28, s: .22, h: 1 },
    { x: .62, y: .78, s: .18, h: .8 },
    { x: .18, y: .2, s: .26, h: .7 },
    { x: .32, y: .92, s: .2, h: .6 },
    { x: .95, y: .9, s: .14, h: .5 }
  ];
  function field(x, y) {
    var v = 0;
    for (var i = 0; i < hills.length; i++) {
      var p = hills[i], dx = x - p.x, dy = (y - p.y) * .8;
      v += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.s * p.s));
    }
    return v + .06 * Math.sin(x * 9) * Math.cos(y * 7);
  }
  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var step = 10, cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1;
    var grid = new Float32Array(cols * rows);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) grid[j * cols + i] = field(i * step / w, j * step / h);
    ctx.lineWidth = 1;
    for (var L = 1; L <= 14; L++) {
      var t = L * .075;
      ctx.strokeStyle = L % 5 === 0 ? "rgba(47,180,236,.55)" : "rgba(47,180,236,.22)";
      ctx.beginPath();
      for (var y = 0; y < rows - 1; y++) for (var x = 0; x < cols - 1; x++) {
        var a = grid[y * cols + x], b = grid[y * cols + x + 1], c = grid[(y + 1) * cols + x + 1], d = grid[(y + 1) * cols + x];
        var k = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        if (k === 0 || k === 15) continue;
        var px = x * step, py = y * step;
        var top = [px + step * (t - a) / (b - a), py];
        var right = [px + step, py + step * (t - b) / (c - b)];
        var bottom = [px + step * (t - d) / (c - d), py + step];
        var left = [px, py + step * (t - a) / (d - a)];
        var segs = {
          1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
          5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
          9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]],
          13: [[bottom, right]], 14: [[left, bottom]]
        }[k];
        for (var s = 0; s < segs.length; s++) {
          ctx.moveTo(segs[s][0][0], segs[s][0][1]);
          ctx.lineTo(segs[s][1][0], segs[s][1][1]);
        }
      }
      ctx.stroke();
    }
  }
  var timer;
  window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(draw, 150); });
  draw();
})();
