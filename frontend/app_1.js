// Crop Health AI — Analyze page (Phase 3). Every result shown comes from the real /api/analyze response.
const $ = s => document.querySelector(s);
const MAX_BYTES = 10 * 1024 * 1024, TIMEOUT_MS = 60000;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title = x => String(x).replaceAll('_', ' ').replace(/\b\w/g, m => m.toUpperCase());
const pct = (v, d = 1) => (Number(v) * 100).toFixed(d) + '%';
const ic = n => `<svg class="icon"><use href="/static/icons.svg#i-${n}"/></svg>`;
const alertBox = (kind, icon, html, actions = '') => `<div class="alert alert-${kind}">${ic(icon)}<div>${html}${actions ? `<div class="alert-actions">${actions}</div>` : ''}</div></div>`;
const list = a => Array.isArray(a) && a.length ? `<ul class="list">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="small">No items provided.</p>';
const meter = (v, cls = '') => `<div class="meter ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}"><i style="width:${Math.min(100, Math.max(0, v * 100))}%"></i></div>`;

const el = {
  gal: $('#fileGallery'), cam: $('#fileCamera'), camBtn: $('#camBtn'), galBtn: $('#galBtn'),
  drop: $('#drop'), prevCard: $('#previewCard'), prev: $('#preview'), name: $('#fileName'), size: $('#fileSize'),
  replace: $('#replaceBtn'), remove: $('#removeBtn'), err: $('#fileError'), btn: $('#analyze'), label: $('#analyzeLabel'), icon: $('#analyzeIcon'),
  hint: $('#analyzeHint'), out: $('#result'), steps: document.querySelectorAll('#stepper li'), note: $('#serverNote'),
};
let file = null, busy = false, finished = false, objUrl = null;
const val = n => document.querySelector(`input[name="${n}"]:checked`).value;
const lockInputs = on => document.querySelectorAll('input[type=radio]').forEach(x => x.disabled = on);

// Camera button only on touch devices; drag hint only where drag and drop is likely.
const touch = navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches;
el.camBtn.hidden = !touch;
$('#dragHint').hidden = touch;

// ?crop= preselects the crop (used by the landing page crop cards).
const qc = new URLSearchParams(location.search).get('crop');
const qr = qc && ['maize', 'potato', 'tomato'].includes(qc) && document.querySelector(`input[name="crop"][value="${qc}"]`); if (qr) qr.checked = true;

// Real model status from /health.
fetch('/health').then(r => r.ok ? r.json() : Promise.reject()).then(h => {
  const s = $('#status'); s.className = 'badge ' + (h.model_ready ? 'ok' : 'warn');
  s.innerHTML = `<span class="dot"></span>${h.model_ready ? 'Model ready' : 'Model not trained'}`;
  if (!h.model_ready) { el.note.innerHTML = alertBox('info', 'info', '<strong>The AI model is not installed on this server yet.</strong> Photo checks still work, but disease results are unavailable until the model is trained.'); el.note.hidden = false; }
}).catch(() => {
  const s = $('#status'); s.className = 'badge bad'; s.textContent = 'Server offline';
  el.note.innerHTML = alertBox('error', 'wifi', '<strong>Cannot reach the analysis server.</strong> Check your connection. You can still add a photo and try again.'); el.note.hidden = false;
});

function setStep() {
  const cur = busy || finished ? 3 : file ? 2 : 1;
  el.steps.forEach(li => { const n = +li.dataset.step; li.dataset.state = (finished && !busy) || n < cur ? 'done' : n === cur ? 'active' : ''; });
  el.btn.disabled = !file || busy;
  el.hint.textContent = file ? 'Ready. Check the preview, then analyze.' : 'Add a photo to continue.';
  el.hint.hidden = busy;
}
const fmtSize = b => b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const fileError = html => { el.err.innerHTML = html ? alertBox('error', 'alert', html) : ''; el.err.hidden = !html; };
const clearResult = () => { el.out.hidden = true; el.out.innerHTML = ''; finished = false; };

function validate(f) {
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  if (/heic|heif/.test(f.type) || ['heic', 'heif'].includes(ext))
    return '<strong>This photo format is not supported.</strong> HEIC photos cannot be analyzed. Take the photo again, or set your camera to "Most Compatible" (JPEG).';
  if (!OK_TYPES.includes(f.type)) return `<strong>Unsupported file.</strong> Use a JPEG, PNG or WebP photo. This file is ${esc(f.type || 'an unknown type')}.`;
  if (f.size > MAX_BYTES) return `<strong>This photo is too large.</strong> It is ${fmtSize(f.size)}; the limit is 10 MB. Lower the camera resolution or choose a smaller photo.`;
  if (f.size === 0) return '<strong>This file is empty.</strong> Choose a different photo.';
  return '';
}
function pick(f) {
  if (!f || busy) return;
  const bad = validate(f);
  if (bad) { fileError(bad); return; }
  fileError('');
  const url = URL.createObjectURL(f), probe = new Image();
  probe.onload = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = url; file = f; el.prev.src = url; el.name.textContent = f.name; el.size.textContent = fmtSize(f.size);
    el.prevCard.hidden = false; el.drop.hidden = true; clearResult(); setStep();
  };
  probe.onerror = () => { URL.revokeObjectURL(url); fileError('<strong>This image could not be opened.</strong> The file may be damaged. Choose a different photo.'); };
  probe.src = url;
}
function removeFile() {
  if (busy) return;
  file = null; if (objUrl) URL.revokeObjectURL(objUrl); objUrl = null; el.prev.removeAttribute('src');
  el.gal.value = ''; el.cam.value = ''; el.prevCard.hidden = true; el.drop.hidden = false; fileError(''); clearResult(); setStep();
}
el.galBtn.onclick = () => el.gal.click();
el.camBtn.onclick = () => el.cam.click();
el.replace.onclick = () => el.gal.click();
el.remove.onclick = removeFile;
[el.gal, el.cam].forEach(i => i.addEventListener('change', () => { const f = i.files[0]; i.value = ''; pick(f); }));
['dragenter', 'dragover'].forEach(t => el.drop.addEventListener(t, e => { e.preventDefault(); el.drop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(t => el.drop.addEventListener(t, e => { e.preventDefault(); el.drop.classList.remove('drag'); }));
el.drop.addEventListener('drop', e => pick(e.dataTransfer.files[0]));
el.prevCard.addEventListener('drop', e => { e.preventDefault(); pick(e.dataTransfer.files[0]); });
window.addEventListener('dragover', e => e.preventDefault()); window.addEventListener('drop', e => e.preventDefault());

const show = html => { el.out.innerHTML = html; el.out.hidden = false; el.out.classList.remove('fade-in'); void el.out.offsetWidth; el.out.classList.add('fade-in'); el.out.scrollIntoView({behavior: 'smooth', block: 'start'}); el.out.focus({preventScroll: true}); };
const retryBtns = `<button type="button" class="btn btn-secondary btn-sm" data-act="retry">Try again</button><button type="button" class="btn btn-ghost btn-sm" data-act="change">Choose another photo</button>`;
el.out.addEventListener('click', e => {
  const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
  if (a === 'retry') run(); else { removeFile(); window.scrollTo({top: 0, behavior: 'smooth'}); }
});
function failure(heading, body, tone = 'error', icon = 'alert') { show(`<h2>${esc(heading)}</h2>${alertBox(tone, icon, body, retryBtns)}`); }
const qualityTips = {
  resolution: ["Move closer to the leaf, or use your camera's full resolution."],
  dark: ['Take the photo in daylight.', 'Avoid shadows falling across the leaf.'],
  blurry: ['Hold the phone steady and tap the leaf to focus.', 'Clean the camera lens.'],
  tissue: ['Fill the frame with one leaf.', 'Make sure the leaf, not soil or sky, is in the center.'],
};
const qualityKey = r => /resolution/i.test(r) ? 'resolution' : /dark/i.test(r) ? 'dark' : /blur/i.test(r) ? 'blurry' : /plant tissue/i.test(r) ? 'tissue' : null;

async function run() {
  if (!file || busy) return;
  busy = true; finished = false; setStep(); el.label.textContent = 'Analyzing…'; el.icon.outerHTML = '<span class="spinner" id="spin"></span>';
  lockInputs(true); el.replace.disabled = el.remove.disabled = true;
  show(`<div class="loading"><span class="spinner"></span><div><h2>Analyzing your photo</h2><p>Checking photo quality and screening the leaf. This usually takes a few seconds.</p></div></div>`);
  const fd = new FormData(); fd.append('file', file); fd.append('crop', val('crop')); fd.append('lang', val('lang'));
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/analyze', {method: 'POST', body: fd, signal: ctl.signal});
    let d = null; try { d = await res.json(); } catch (_) {}
    if (!res.ok) httpFailure(res.status);
    else if (!d || typeof d !== 'object') unexpected();
    else render(d);
  } catch (e) {
    if (e.name === 'AbortError') failure('The analysis took too long', '<strong>No response from the server.</strong> Check your connection and try again.', 'warn', 'wifi');
    else if (!navigator.onLine) failure('You appear to be offline', '<strong>No internet connection.</strong> Reconnect and try again. Your photo is still selected.', 'warn', 'wifi');
    else failure('Could not reach the server', '<strong>The request did not go through.</strong> Check your connection and try again. Your photo is still selected.', 'warn', 'wifi');
  } finally {
    clearTimeout(timer); busy = false; finished = true;
    $('#spin')?.replaceWith(Object.assign(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {id: 'analyzeIcon'}));
    const n = $('#analyzeIcon'); n.setAttribute('class', 'icon'); n.innerHTML = '<use href="/static/icons.svg#i-scan"/>'; el.icon = n;
    el.label.textContent = 'Analyze'; lockInputs(false); el.replace.disabled = el.remove.disabled = false; setStep();
  }
}
function httpFailure(s) {
  if (s === 415) failure('Unsupported image', '<strong>This photo format is not supported.</strong> Use a JPEG, PNG or WebP photo.');
  else if (s === 413) failure('Image too large', '<strong>This photo is over the 10 MB limit.</strong> Lower the camera resolution or choose a smaller photo.');
  else if (s === 400) failure('Invalid image', '<strong>The server could not read this image.</strong> The file may be damaged. Choose a different photo.');
  else if ([404, 502, 503, 504].includes(s)) failure('Analysis service unavailable', '<strong>The analysis service is not available right now.</strong> Please try again in a moment.', 'warn', 'wifi');
  else failure('Something went wrong', `<strong>The server could not complete the analysis (error ${s}).</strong> Please try again. If it keeps happening, try a different photo.`);
}
function unexpected() { failure('Unexpected response', '<strong>The server sent an answer this page could not understand.</strong> Please try again.'); }
el.btn.onclick = run;

function top3(d) {
  if (!Array.isArray(d.top3) || !d.top3.length) return '';
  return '<h3>Top predictions</h3>' + d.top3.map(t => `<div class="rowline"><span>${esc(title(t.label))}</span><b>${pct(t.probability)}</b></div>${meter(t.probability)}`).join('');
}
const again = `<div class="alert-actions" style="margin-top:20px"><button type="button" class="btn btn-secondary" data-act="again">Analyze another photo</button></div>`;

function render(d) {
  if (d.status === 'invalid_image') {
    const reason = (d.quality && d.quality.reason) || '', tips = qualityTips[qualityKey(reason)] || ['Take a clear, well-lit photo of one leaf.'];
    return show(`<h2>Photo quality too low</h2>${alertBox('warn', 'alert', `<strong>${esc(reason || d.message || 'This photo could not be used.')}</strong><ul>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`, retryBtns)}`);
  }
  if (d.status === 'model_missing') return show(`<h2>Disease analysis unavailable</h2>${alertBox('info', 'info', '<strong>The AI model is not installed on this server yet.</strong> Your photo passed the quality check, but it cannot be screened until the model is trained.')}${again}`);
  if (d.status === 'uncertain') {
    const hasCrop = !!val('crop');
    return show(`<h2>Not sure about this one</h2>${alertBox('warn', 'info', `<strong>The model could not identify this condition with enough confidence.</strong> This is not a "healthy" result.<ul><li>Retake the photo closer, in daylight, with one leaf in focus.</li>${hasCrop ? '' : '<li>Choose the crop to narrow the result.</li>'}<li>If the leaf looks diseased, ask a local extension officer.</li></ul>`, retryBtns)}
      <div class="rowline"><span>Highest confidence</span><b>${pct(d.confidence)}</b></div>${meter(d.confidence, 'warn')}
      <p class="small">Needed to give a result: ${pct(d.threshold)}</p>${top3(d)}`);
  }
  if (d.status !== 'ok' || typeof d.label !== 'string' || typeof d.confidence !== 'number') return unexpected();
  const r = d.recommendations || {}, sev = d.severity || {}, healthy = d.label.endsWith('_healthy');
  show(`<div class="result-head"><div><span class="badge ${healthy ? 'ok' : 'warn'}">${healthy ? 'Healthy' : 'Condition detected'}</span><h2 style="margin-top:8px">${esc(title(d.label))}</h2></div></div>
    <div class="stats">
      <div class="stat"><span>Confidence</span><b>${pct(d.confidence)}</b>${meter(d.confidence)}</div>
      <div class="stat"><span>Severity</span><b>${esc(sev.category || '—')}</b></div>
      <div class="stat"><span>Affected area*</span><b>${esc(sev.affected_percent ?? '—')}%</b></div>
    </div>
    <p class="small" style="margin-top:10px">*Project-defined image heuristic; not a validated agronomic severity score.</p>
    ${top3(d)}
    ${d.gradcam ? `<h3>Why the model focused here</h3><img class="cam" alt="Grad-CAM heatmap showing the leaf areas that influenced the result" src="${esc(d.gradcam)}">` : ''}
    <h3>Management</h3>${list(r.management)}<h3>Prevention</h3>${list(r.prevention)}<h3>Monitoring</h3>${list(r.monitoring)}
    ${r.safety ? `<div style="margin-top:16px">${alertBox('warn', 'alert', esc(r.safety))}</div>` : ''}
    ${Array.isArray(r.sources) && r.sources.length ? `<div class="sources"><h3>Sources</h3>${r.sources.map(s => /^https?:\/\//.test(s) ? `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a>` : `<span>${esc(s)}</span>`).join('')}</div>` : ''}${again}`);
}
setStep();
