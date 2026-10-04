/* Pulse presentation helpers. Purely visual: reads what is already on screen,
   never calls the API and never changes app data or behaviour. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function confidenceRing() {
    var dd = document.querySelector('.result-metrics > div:first-child dd');
    if (!dd || dd.dataset.pf) return;
    var raw = dd.textContent.trim(), m = raw.match(/([\d.]+)\s*%/);
    dd.dataset.pf = '1';
    if (!m) return;
    var v = Math.max(0, Math.min(100, parseFloat(m[1])));
    dd.style.setProperty('--p', v);
    if (reduce) return;
    var dec = (m[1].split('.')[1] || '').length, t0 = performance.now(), D = 1300;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      dd.textContent = k < 1 ? (v * e).toFixed(dec) + '%' : raw;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function stepper() {
    var form = document.getElementById('scan-form');
    var steps = document.querySelectorAll('.stepper li');
    if (!form || steps.length < 4) return;
    var farm = document.getElementById('scan-farm'), crop = document.getElementById('scan-crop'), file = document.getElementById('scan-file');
    var done = [
      !!(farm && farm.value) || !!(crop && crop.value) || !!(file && file.files && file.files.length),
      !!(crop && crop.value) || !!(file && file.files && file.files.length),
      !!(file && file.files && file.files.length),
      false
    ];
    var busy = !!document.querySelector('#submit-scan-btn .button-spinner');
    steps.forEach(function (li, i) {
      li.classList.toggle('pf-done', done[i] || (busy && i < 3));
      li.classList.toggle('pf-active', (busy && i === 3) || (!busy && !done[i] && (i === 0 || done[i - 1])));
    });
    if (!form.dataset.pf) {
      form.dataset.pf = '1';
      ['change', 'input'].forEach(function (ev) { form.addEventListener(ev, stepper); });
      var pv = document.getElementById('preview-container');
      if (pv) new MutationObserver(stepper).observe(pv, { attributes: true, attributeFilter: ['hidden'] });
    }
  }


  /* ---------- decorative leaf scene (presentation only) ---------- */
  var LEAF = 'M150 18C262 92 276 228 150 346 24 228 38 92 150 18Z';
  var SPOTS = [[118, 128, 20, '94%', .9], [188, 196, 26, '88%', 1.4], [108, 244, 16, '91%', 1.75], [186, 118, 13, '79%', .85]];
  function heroLeaf() {
    var s = '<svg class="pf-art" viewBox="0 0 300 370" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="pfG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8bff"/><stop offset="1" stop-color="#0b1f78"/></linearGradient>' +
      '<linearGradient id="pfG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CB8FF"/><stop offset=".55" stop-color="#3DDC97"/><stop offset="1" stop-color="#0f7a5a"/></linearGradient>' +
      '<linearGradient id="pfSw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CB8FF" stop-opacity="0"/><stop offset=".85" stop-color="#5CB8FF" stop-opacity=".4"/><stop offset="1" stop-color="#bfe3ff" stop-opacity=".95"/></linearGradient>' +
      '<radialGradient id="pfSp"><stop offset="0" stop-color="#5a230a"/><stop offset=".6" stop-color="#d9731a"/><stop offset="1" stop-color="#ffb454" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="pfClip"><path d="' + LEAF + '"/></clipPath></defs>' +
      '<g class="pf-leaf-sway"><g class="pf-leaf">' +
      '<path d="' + LEAF + '" fill="url(#pfG1)" stroke="#5CB8FF" stroke-opacity=".6" stroke-width="2"/>' +
      '<path class="pf-heal" d="' + LEAF + '" fill="url(#pfG2)"/>' +
      '<g stroke="#bfe3ff" stroke-opacity=".38" fill="none" stroke-linecap="round" stroke-width="1.6"><path d="M150 30V340"/>' +
      '<path d="M150 100C190 112 214 132 232 158M150 100C110 112 86 132 68 158"/><path d="M150 160C196 174 222 198 240 232M150 160C104 174 78 198 60 232"/>' +
      '<path d="M150 220C184 232 204 252 214 280M150 220C116 232 96 252 86 280"/></g>' +
      '<g clip-path="url(#pfClip)"><rect class="pf-sweep" x="0" y="-80" width="300" height="80" fill="url(#pfSw)"/></g>';
    SPOTS.forEach(function (p) {
      s += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g class="pf-sp" style="animation-delay:' + p[4] + 's">' +
        '<circle r="' + p[2] + '" fill="url(#pfSp)"/><circle r="' + (p[2] * .42) + '" fill="#4a1d08" opacity=".75"/>' +
        '<circle class="pf-ring" r="' + (p[2] + 9) + '"/><text class="pf-tag" x="' + (p[2] + 12) + '" y="' + (-p[2] * .5) + '">' + p[3] + '</text></g></g>';
    });
    s += '</g></g>';
    [[110, 300, 0], [150, 320, .5], [190, 300, 1], [130, 270, 1.4], [175, 250, .8]].forEach(function (q) {
      s += '<g transform="translate(' + q[0] + ' ' + q[1] + ')"><path class="pf-sprout" style="animation-delay:' + q[2] + 's" d="M0 0C7-6 7-15 0-22-7-15-7-6 0 0Z"/></g>';
    });
    return s + '</svg>';
  }
  var PAL = ['#2f6bff', '#5CB8FF', '#1c3aa9', '#3d7bff', '#7cc8ff', '#2450d6'];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function drift(host, n, small) {
    var wrap = document.createElement('div'), h = host.offsetHeight || 400, html = '';
    wrap.className = 'pf-drift'; wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < n; i++) {
      var far = Math.random() < .4, size = small ? rnd(10, 20) : (far ? rnd(14, 24) : rnd(26, 52));
      html += '<i style="--x:' + rnd(2, 94).toFixed(1) + '%;--s:' + size.toFixed(0) + 'px;--c:' + PAL[i % PAL.length] +
        ';--o:' + (far ? rnd(.18, .3) : rnd(.32, .55)).toFixed(2) + ';--b:' + (far ? '1.5px' : '0px') + ';--t:' + rnd(15, 28).toFixed(1) + 's;--dl:-' + rnd(0, 24).toFixed(1) +
        's;--r:' + rnd(-40, 40).toFixed(0) + 'deg;--sw:' + rnd(-90, 90).toFixed(0) + 'px;--tr:' + (h + 90) + 'px">' +
        '<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1C21 8 22 19 12 27 2 19 3 8 12 1Z" fill="currentColor"/><path d="M12 5V25" stroke="#050816" stroke-opacity=".35" stroke-width="1"/></svg></i>';
    }
    wrap.innerHTML = html;
    host.insertBefore(wrap, host.firstChild);
  }
  function decorate() {
    var il = document.querySelector('.leaf-illustration');
    if (il && !il.dataset.pf) { il.dataset.pf = '1'; il.insertAdjacentHTML('beforeend', heroLeaf()); }
    if (reduce) return;
    [['.hero-panel', 10, 0], ['.auth-aside', 9, 0], ['.diagnosis-hero', 6, 0], ['.page-header', 5, 1]].forEach(function (d) {
      document.querySelectorAll(d[0]).forEach(function (el) {
        if (el.dataset.pfd) return;
        el.dataset.pfd = '1'; drift(el, d[1], d[2]);
      });
    });
  }

  var queued = false;
  function run() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; confidenceRing(); stepper(); decorate(); });
  }

  function init() {
    var root = document.body;
    new MutationObserver(run).observe(root, { childList: true, subtree: true });
    run();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
