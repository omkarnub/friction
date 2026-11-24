/**
 * ai-helper.js — Floating Monochrome Friction Lab AI Assistant Pop-Up
 *
 * Ports and integrates three high-craft UI patterns in pure self-contained JS + GSAP:
 *  1. AITextLoading (Kokonut UI) — cycling blur-swap words with per-letter brightness wave + elapsed timer
 *  2. AILoadingState (Kokonut UI) — collapsible 3-step rail with spinning ring -> self-drawing checkmark,
 *     scrolling monospace log lines, step durations, and auto-fold when done
 *  3. BlurText — per-word blur-to-sharp spring settle presentation for every generated AI answer
 *
 * Uses your deployed Cloudflare Worker (type: "chat") with built-in client rate limiting
 * (3.5s cooldown + 25/day cap) and an offline Engineering Mechanics fallback responder.
 */
(function () {
  'use strict';

  const AI_ENDPOINT = 'https://friction-quiz.126omkar4024.workers.dev/';
  const STORAGE_CHAT_RATE = 'fl-ai-chat-rate-v1';
  const COOLDOWN_MS = 3500;
  const MAX_DAILY_MSGS = 25;

  const hasGsap = () => typeof window.gsap !== 'undefined';
  const reducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const THINKING_WORDS = ['Thinking...', 'Analyzing...', 'Computing...', 'Formulating...'];
  const STARTER_PROMPTS = [
    'Check my current simulator reading',
    'Open the Quiz page for me',
    'Why does weight W cancel in μ = tan α?',
    'Explain the Cone of Friction simply'
  ];

  let isOpen = false;
  let isBusy = false;
  let voiceOutEnabled = false;
  let isListening = false;
  let recognition = null;
  let history = []; // { role: 'user' | 'model', text: string }

  function cleanMathText(str) {
    return String(str || '')
      .replace(/\$/g, '')
      .replace(/\\mu/g, 'μ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\phi/g, 'φ')
      .replace(/\\sin/g, 'sin')
      .replace(/\\cos/g, 'cos')
      .replace(/\\tan/g, 'tan')
      .replace(/\\cot/g, 'cot')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\sqrt/g, '√')
      .replace(/\\degree|\^\{\\circ\}|\^\\circ/g, '°')
      .replace(/\\_/g, '_')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .trim();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function checkRateLimit() {
    try {
      const raw = localStorage.getItem(STORAGE_CHAT_RATE);
      const r = raw ? JSON.parse(raw) : { day: todayKey(), count: 0, lastAt: 0 };
      if (r.day !== todayKey()) return { ok: true };
      if (r.count >= MAX_DAILY_MSGS) return { ok: false, reason: 'daily' };
      if (Date.now() - (r.lastAt || 0) < COOLDOWN_MS) return { ok: false, reason: 'cooldown' };
      return { ok: true };
    } catch (e) {
      return { ok: true };
    }
  }

  function recordChatCall() {
    try {
      const day = todayKey();
      const raw = localStorage.getItem(STORAGE_CHAT_RATE);
      const r = raw ? JSON.parse(raw) : { day, count: 0, lastAt: 0 };
      const count = r.day === day ? (r.count || 0) + 1 : 1;
      localStorage.setItem(STORAGE_CHAT_RATE, JSON.stringify({ day, count, lastAt: Date.now() }));
    } catch (e) {}
  }

  /* ================================================================
     LIVE LAB CONTEXT READER & IN-APP ACTION EXECUTOR
     Lets the AI read your exact live simulator readings, Data Log
     stats, and open/control any page, tab, menu, theme, or apparatus.
     ================================================================ */
  const VALID_PAGES = ['home', 'simulate', 'log', 'methods', 'theory', 'reference', 'compare', 'how-to-use', 'quiz', 'contributors'];

  function getLiveLabContext() {
    const activeSec = document.querySelector('.page-section.active');
    const page = activeSec ? activeSec.id.replace('page-', '') : 'home';
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

    const reposePanel = document.getElementById('simRepose');
    const activeSimTab = (reposePanel && !reposePanel.classList.contains('hidden')) ? 'repose' : 'friction';

    let repose = null;
    if (typeof window.getReposeValues === 'function') {
      try {
        const r = window.getReposeValues();
        const m = window.MATERIALS && window.MATERIALS[r.material];
        repose = {
          material: m ? m.name : r.material,
          refRange: m ? `${m.low}–${m.high}` : 'N/A',
          angleDeg: Number(r.angle.toFixed(1)),
          weightN: Number(r.weight.toFixed(1)),
          mu: r.mu !== null && isFinite(r.mu) ? Number(r.mu.toFixed(4)) : 0,
          sliding: !!r.sliding
        };
      } catch (e) {}
    }

    let friction = null;
    if (typeof window.getFrictionValues === 'function') {
      try {
        const f = window.getFrictionValues();
        const m = window.MATERIALS && window.MATERIALS[f.material];
        friction = {
          material: m ? m.name : f.material,
          refRange: m ? `${m.low}–${m.high}` : 'N/A',
          angleDeg: Number(f.angle.toFixed(1)),
          weightN: Number(f.weight.toFixed(1)),
          pullForceN: Number(f.pullForce.toFixed(2)),
          mu: f.mu !== null && isFinite(f.mu) ? Number(f.mu.toFixed(4)) : null,
          moving: !!f.moving
        };
      } catch (e) {}
    }

    let logSummary = { totalTrials: 0 };
    if (typeof window.getLogEntries === 'function') {
      try {
        const entries = window.getLogEntries() || [];
        const valid = entries.filter(e => e.valid && e.mu !== null);
        const mean = valid.length ? valid.reduce((a, b) => a + b.mu, 0) / valid.length : null;
        logSummary = {
          totalTrials: entries.length,
          validTrials: valid.length,
          overallMeanMu: mean !== null ? Number(mean.toFixed(4)) : null
        };
      } catch (e) {}
    }

    return { page, theme, activeSimTab, repose, friction, logSummary };
  }

  function executeAction(cmd, arg) {
    const action = String(cmd || '').toLowerCase().trim();
    const val = String(arg || '').toLowerCase().trim();

    if (action === 'navigate' && VALID_PAGES.includes(val)) {
      window.location.hash = val;
      return `Opened ${val.replace(/-/g, ' ').toUpperCase()}`;
    }
    if (action === 'select_sim_tab' && (val === 'repose' || val === 'friction')) {
      window.location.hash = 'simulate';
      setTimeout(() => { if (typeof window.selectSimTab === 'function') window.selectSimTab(val); }, 480);
      return `Opened Simulate · ${val === 'repose' ? 'Angle of Repose' : 'Friction Plane'}`;
    }
    if (action === 'open_menu') {
      const toggle = document.querySelector('#staggered-menu-root .sm-toggle');
      if (toggle) toggle.click();
      return 'Opened Navigation Menu';
    }
    if (action === 'toggle_theme') {
      const cb = document.getElementById('themeToggleCheckbox');
      if (cb) {
        const wantLight = val === 'light' ? true : val === 'dark' ? false : (document.documentElement.getAttribute('data-theme') !== 'light');
        // Checked = Dark, Unchecked = Light
        cb.checked = !wantLight;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        return `Switched to ${wantLight ? 'Light' : 'Dark'} Theme`;
      }
    }
    if (action === 'reset_apparatus') {
      if (typeof window.resetReposeApparatus === 'function') window.resetReposeApparatus();
      if (typeof window.resetFrictionApparatus === 'function') window.resetFrictionApparatus();
      return 'Reset Simulator Apparatus';
    }
    if (action === 'set_material' && window.MATERIALS && window.MATERIALS[val]) {
      ['reposeMaterial', 'frictionMaterial'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          sel.value = val;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      return `Selected Material: ${window.MATERIALS[val].name}`;
    }
    if (action === 'load_sample_log') {
      window.location.hash = 'log';
      setTimeout(() => {
        const btn = document.getElementById('logLoadDemoBtn');
        if (btn) btn.click();
      }, 520);
      return 'Loaded Sample Data Log Trials';
    }
    return null;
  }

  function parseAndRunActionTags(rawText) {
    const badges = [];
    const cleaned = String(rawText || '').replace(/\[\[ACTION:([a-z_]+)(?::([a-z0-9_-]+))?\]\]/gi, (_, cmd, arg) => {
      const label = executeAction(cmd, arg);
      if (label) badges.push(label);
      return '';
    }).trim();
    return { text: cleaned, badges };
  }

  function detectLocalCommand(q, ctx) {
    const t = q.toLowerCase();
    // Instant navigation / UI commands
    if (/(open|go to|show|take me to|switch to)\s+(the\s+)?menu/.test(t)) {
      return { text: 'Sure! I have opened the navigation menu for you.', badges: [executeAction('open_menu', '')].filter(Boolean) };
    }
    if (/(light mode|light theme|day mode)/.test(t)) {
      return { text: 'Done! I have switched the lab to Light Theme for you.', badges: [executeAction('toggle_theme', 'light')].filter(Boolean) };
    }
    if (/(dark mode|dark theme|night mode)/.test(t)) {
      return { text: 'Done! I have switched the lab to Dark Theme for you.', badges: [executeAction('toggle_theme', 'dark')].filter(Boolean) };
    }
    if (/(reset)\s+(the\s+)?(apparatus|simulator|experiment|plane|rig)/.test(t)) {
      return { text: 'I have reset the apparatus back to its starting position for a fresh reading.', badges: [executeAction('reset_apparatus', '')].filter(Boolean) };
    }
    if (/(open|go to|show|switch to)\s+(the\s+)?(angle of repose|repose method|repose tab)/.test(t) && !t.includes('what is') && !t.includes('explain')) {
      return { text: 'Opening the Angle of Repose simulator for you now!', badges: [executeAction('select_sim_tab', 'repose')].filter(Boolean) };
    }
    if (/(open|go to|show|switch to)\s+(the\s+)?(friction plane|pulley|pan method)/.test(t) && !t.includes('what is') && !t.includes('explain')) {
      return { text: 'Opening the Friction Plane simulator for you now!', badges: [executeAction('select_sim_tab', 'friction')].filter(Boolean) };
    }
    const pageMap = [
      ['simulate', /(open|go to|show|launch|take me to)\s+(the\s+)?(simulator|simulate|experiment)/],
      ['log', /(open|go to|show|take me to)\s+(the\s+)?(data log|log|readings|table)/],
      ['methods', /(open|go to|show|take me to)\s+(the\s+)?(methods)/],
      ['theory', /(open|go to|show|take me to)\s+(the\s+)?(theory|derivations)/],
      ['reference', /(open|go to|show|take me to)\s+(the\s+)?(reference|handbook|values)/],
      ['compare', /(open|go to|show|take me to)\s+(the\s+)?(compare|comparison)/],
      ['how-to-use', /(open|go to|show|take me to)\s+(the\s+)?(manual|how to use|guide)/],
      ['quiz', /(open|go to|show|start|take me to)\s+(the\s+)?(quiz|test|mcq)/],
      ['contributors', /(open|go to|show|take me to)\s+(the\s+)?(contributors|team|credits|mentorship)/],
      ['home', /(open|go to|show|take me to)\s+(the\s+)?(home)/]
    ];
    for (const [pg, rx] of pageMap) {
      if (rx.test(t)) {
        return { text: `Sure! I have opened the ${pg.replace(/-/g, ' ')} page for you.`, badges: [executeAction('navigate', pg)].filter(Boolean) };
      }
    }
    // Live reading inspection (works offline too!)
    if (/(my reading|current reading|my value|check my|what am i|my simulator|my trial|my log|current angle|current mu)/.test(t)) {
      const r = ctx.repose;
      const f = ctx.friction;
      if (ctx.activeSimTab === 'repose' && r) {
        const status = r.sliding ? 'The block HAS slipped — you can record this trial now!' : 'The block is still holding — slowly increase tilt angle α until it slips.';
        return {
          text: `Here is your current Angle of Repose reading: Material is ${r.material} (handbook range ${r.refRange}), Tilt α = ${r.angleDeg}°, Weight W = ${r.weightN} N, and current μ = ${r.mu}. ${status}`,
          badges: ['Read Live Simulator State']
        };
      }
      if (f) {
        const status = f.moving ? 'The block is moving up — you can log this trial now!' : 'The block is still at rest — add more weights to the hanging pan P until motion starts.';
        return {
          text: `Here is your current Friction Plane reading: Material is ${f.material} (handbook range ${f.refRange}), Angle θ = ${f.angleDeg}°, Weight W = ${f.weightN} N, Pull P = ${f.pullForceN} N, and μ = ${f.mu !== null ? f.mu : '—'}. ${status}`,
          badges: ['Read Live Simulator State']
        };
      }
    }
    return null;
  }

  /* ================================================================
     Offline Engineering Mechanics Fallback Responder
     ================================================================ */
  function offlineFallbackAnswer(q) {
    const t = q.toLowerCase();
    const onTopic = /(friction|repose|incline|plane|pulley|pan|mu|μ|alpha|α|theta|θ|phi|φ|cone|static|kinetic|normal|weight|force|slip|slide|amonton|coulomb|rough|surface|wood|steel|glass|rubber|aluminum|brass|lubricat|bearing|brake|bolt|error|log|trial|simulat|quiz|lab|formula|deriv|angle|block|mass|gravity|mechanics)/.test(t);
    if (!onTopic) {
      return 'Sorry, I can only help with friction, Engineering Mechanics, and this virtual lab. Please feel free to ask me about Angle of Repose, Friction Plane, Cone of Friction, static vs. kinetic friction, or how to use the simulator!';
    }
    if (t.includes('repose') || t.includes('tan') || t.includes('cancel') || t.includes('alpha')) {
      return 'In the Angle of Repose method, you slowly tilt a ramp until the block just starts to slide. At that exact moment, gravity pulling the block down (W sin α) equals maximum friction holding it back (μ_s × W cos α). Because W appears on both sides, it cancels out — leaving the simple formula μ_s = tan α.';
    }
    if (t.includes('cone')) {
      return 'Think of the Cone of Friction as a safety zone. When you combine the normal force (N) and maximum friction (f_max), they form one combined force tilted at angle φ. Rotating that arrow 360° makes a cone: as long as the force stays inside the cone, the block stays locked; once it crosses the edge, the block slips.';
    }
    if (t.includes('friction plane') || t.includes('pulley') || t.includes('pan')) {
      return 'In the Friction Plane method, the ramp stays fixed at angle θ and you add weights to a hanging pan until pull force P starts moving the block up the ramp. That pull has to beat both gravity (W sin θ) and friction, giving μ_s = (P − W sin θ) / (W cos θ). On a flat table (θ = 0°), it becomes simply μ_s = P / W.';
    }
    if (t.includes('kinetic') || t.includes('static')) {
      return 'Static friction (μ_s) holds an object still and matches your push up to a peak limit. Once you push hard enough to break the tiny surface grip loose, kinetic friction (μ_k) takes over. Because μ_k is lower than μ_s, a heavy box often jumps forward the moment it finally starts moving.';
    }
    if (t.includes('law') || t.includes('amonton') || t.includes('coulomb') || t.includes('area')) {
      return 'Dry friction follows four simple rules: (1) doubling the weight pressing surfaces together doubles friction, (2) changing the contact area (flat vs. upright) does not change friction, (3) sliding speed barely changes kinetic friction, and (4) μ depends on BOTH surfaces touching each other.';
    }
    if (t.includes('error') || t.includes('log') || t.includes('pdf')) {
      return 'In the Data Log, each trial calculates μ automatically and finds your average (Mean μ). It then compares your average with the standard handbook midpoint using % Error = |Mean μ − Ref Midpoint| / Ref Midpoint × 100%, and lets you download a clean PDF or CSV report.';
    }
    return 'I would be happy to explain! Both experiments here measure static friction (μ_s): Angle of Repose uses μ_s = tan α, and Friction Plane uses μ_s = (P − W sin θ) / (W cos θ). Ask me about any step, formula, or concept and I will break it down simply.';
  }

  /* ================================================================
     Component 1: AITextLoading (Kokonut UI Port)
     ================================================================ */
  function createAITextLoading(container) {
    const wrap = document.createElement('div');
    wrap.className = 'aih-text-load';
    wrap.innerHTML = `<span class="aih-tl-word"></span><span class="aih-tl-sec mono">0s</span>`;
    container.appendChild(wrap);

    const wordEl = wrap.querySelector('.aih-tl-word');
    const secEl = wrap.querySelector('.aih-tl-sec');
    const startedAt = Date.now();
    let idx = 0;

    function renderWord(text) {
      wordEl.innerHTML = '';
      Array.from(text).forEach((ch, i) => {
        const outer = document.createElement('span');
        outer.className = 'aih-tl-char';
        const inner = document.createElement('span');
        inner.className = 'kokonut-ai-wave';
        inner.style.animationDelay = `${i * 0.06}s`;
        inner.textContent = ch;
        outer.appendChild(inner);
        wordEl.appendChild(outer);
      });
      if (hasGsap() && !reducedMotion()) {
        window.gsap.fromTo(
          wordEl.querySelectorAll('.aih-tl-char'),
          { opacity: 0, y: 7, filter: 'blur(4px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.26, stagger: 0.016, ease: 'power3.out' }
        );
      }
    }

    renderWord(THINKING_WORDS[0]);

    const wordTimer = setInterval(() => {
      idx = (idx + 1) % THINKING_WORDS.length;
      if (hasGsap() && !reducedMotion()) {
        window.gsap.to(wordEl, {
          opacity: 0, y: -5, filter: 'blur(3px)', duration: 0.14, ease: 'power2.in',
          onComplete: () => {
            window.gsap.set(wordEl, { opacity: 1, y: 0, filter: 'blur(0px)' });
            renderWord(THINKING_WORDS[idx]);
          }
        });
      } else {
        renderWord(THINKING_WORDS[idx]);
      }
    }, 1400);

    const secTimer = setInterval(() => {
      secEl.textContent = `${Math.floor((Date.now() - startedAt) / 1000)}s`;
    }, 500);

    return {
      stop() {
        clearInterval(wordTimer);
        clearInterval(secTimer);
        wrap.remove();
      }
    };
  }

  /* ================================================================
     Component 2: AILoadingState (Kokonut UI Step Rail Port)
     ================================================================ */
  function createAILoadingState(container, userPrompt) {
    const shortQ = userPrompt.length > 34 ? userPrompt.slice(0, 34) + '…' : userPrompt;
    const steps = [
      { id: 'parse', label: 'Analyzing mechanics query', detail: [`input: "${shortQ}"`, 'identifying friction domain'] },
      { id: 'verify', label: 'Checking laws & equations', detail: ['resolving N, W sin θ, μ_s N', 'verifying boundary conditions'] },
      { id: 'draft', label: 'Composing explanation', detail: ['formatting clear Unicode math'] }
    ];

    const root = document.createElement('div');
    root.className = 'aih-steps-box';
    root.innerHTML = `
      <button type="button" class="aih-steps-head" aria-expanded="true">
        <span class="aih-sh-title">Analyzing mechanics query</span>
        <span class="aih-sh-meta mono">0s</span>
        <svg class="aih-sh-chev" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>
      </button>
      <ol class="aih-steps-list">
        ${steps.map((s, i) => `
          <li class="aih-step-row" data-status="pending" data-step="${i}">
            ${i < steps.length - 1 ? '<span class="aih-step-rail"><i></i></span>' : ''}
            <span class="aih-step-icon"></span>
            <div class="aih-step-main">
              <div class="aih-step-top">
                <span class="aih-step-lbl">${s.label}</span>
                <span class="aih-step-time mono"></span>
              </div>
              <div class="aih-step-log mono"></div>
            </div>
          </li>
        `).join('')}
      </ol>
    `;
    container.appendChild(root);

    const headBtn = root.querySelector('.aih-steps-head');
    const titleEl = root.querySelector('.aih-sh-title');
    const metaEl = root.querySelector('.aih-sh-meta');
    const listEl = root.querySelector('.aih-steps-list');
    const rows = Array.from(root.querySelectorAll('.aih-step-row'));

    let open = true;
    headBtn.addEventListener('click', () => {
      open = !open;
      headBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.classList.toggle('is-collapsed', !open);
    });

    const ICON_PENDING = '<span class="aih-dot-pending"></span>';
    const ICON_RUNNING = `<svg class="aih-spin-ring" viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.6"/><path d="M8 2a6 6 0 0 1 6 6" stroke="#10b981" stroke-width="1.7" stroke-linecap="round"/></svg>`;
    const ICON_DONE = `<svg class="aih-check-svg" viewBox="0 0 16 16" width="14" height="14" fill="none"><path class="aih-check-path" d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const stepStarts = {};
    const runStart = Date.now();
    let curStep = 0;

    function setRowStatus(idx, status) {
      const row = rows[idx];
      if (!row) return;
      row.setAttribute('data-status', status);
      const iconWrap = row.querySelector('.aih-step-icon');
      const lblWrap = row.querySelector('.aih-step-lbl');
      const timeWrap = row.querySelector('.aih-step-time');
      const logWrap = row.querySelector('.aih-step-log');

      if (status === 'pending') {
        iconWrap.innerHTML = ICON_PENDING;
        lblWrap.textContent = steps[idx].label;
      } else if (status === 'running') {
        stepStarts[idx] = Date.now();
        iconWrap.innerHTML = ICON_RUNNING;
        titleEl.textContent = steps[idx].label;
        lblWrap.innerHTML = Array.from(steps[idx].label)
          .map((ch, k) => `<span class="kokonut-ai-wave" style="animation-delay:${(k * 0.045).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`)
          .join('');
        logWrap.innerHTML = steps[idx].detail.map((d, j) => `<div class="aih-log-line"><span>${j + 1}</span>${d}</div>`).join('');
      } else if (status === 'done') {
        iconWrap.innerHTML = ICON_DONE;
        lblWrap.textContent = steps[idx].label;
        logWrap.innerHTML = '';
        const dt = Math.max(200, Date.now() - (stepStarts[idx] || runStart));
        timeWrap.textContent = `${(dt / 1000).toFixed(1)}s`;
      }
    }

    rows.forEach((_, i) => setRowStatus(i, i === 0 ? 'running' : 'pending'));

    const elapsedTimer = setInterval(() => {
      metaEl.textContent = `${Math.floor((Date.now() - runStart) / 1000)}s`;
    }, 400);

    const stepTimer = setInterval(() => {
      if (curStep < steps.length - 1) {
        setRowStatus(curStep, 'done');
        curStep++;
        setRowStatus(curStep, 'running');
      }
    }, 700);

    return {
      complete() {
        clearInterval(elapsedTimer);
        clearInterval(stepTimer);
        rows.forEach((_, i) => {
          if (rows[i].getAttribute('data-status') !== 'done') setRowStatus(i, 'done');
        });
        const totalSec = Math.max(1, Math.round((Date.now() - runStart) / 1000));
        titleEl.textContent = `Worked for ${totalSec}s`;
        metaEl.textContent = `· ${steps.length} steps`;
        // Fold cleanly once done (Kokonut UI collapseWhenDone behavior)
        setTimeout(() => {
          open = false;
          headBtn.setAttribute('aria-expanded', 'false');
          root.classList.add('is-collapsed');
        }, 320);
      }
    };
  }

  /* ================================================================
     Component 3: BlurText (Per-word Blurred Spring-Settle Presentation)
     ================================================================ */
  function renderBlurText(container, text) {
    const p = document.createElement('p');
    p.className = 'aih-blur-text';
    container.appendChild(p);

    const cleaned = cleanMathText(text);
    const words = cleaned.split(/(\s+)/);

    if (reducedMotion() || !hasGsap()) {
      p.textContent = cleaned;
      return;
    }

    const spans = [];
    words.forEach(token => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        p.appendChild(document.createTextNode(token));
      } else {
        const sp = document.createElement('span');
        sp.className = 'aih-blur-word';
        sp.textContent = token;
        p.appendChild(sp);
        spans.push(sp);
      }
    });

    window.gsap.fromTo(
      spans,
      { opacity: 0, y: 8, filter: 'blur(7px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.42,
        stagger: Math.min(0.028, 0.9 / Math.max(1, spans.length)),
        ease: 'power3.out',
        clearProps: 'filter,transform'
      }
    );
  }

  /* ================================================================
     API Call to Omkar's Live Cloudflare Worker (type: "chat")
     ================================================================ */
  async function askWorker(userText) {
    const ctx = getLiveLabContext();

    // Execute instant UI navigation/control commands cleanly if unmistakable
    const localCmd = detectLocalCommand(userText, ctx);
    if (localCmd && !navigator.onLine) {
      return { text: localCmd.text, badges: localCmd.badges, offline: true };
    }

    const rate = checkRateLimit();
    if (!rate.ok) {
      if (localCmd) return { text: localCmd.text, badges: localCmd.badges, offline: true };
      if (rate.reason === 'cooldown') {
        return { text: 'Please wait just a moment before sending your next question.', badges: [], offline: true };
      }
      return { text: offlineFallbackAnswer(userText), badges: [], offline: true };
    }

    if (!navigator.onLine) {
      return { text: offlineFallbackAnswer(userText), badges: [], offline: true };
    }

    recordChatCall();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 11000);

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: 'chat',
          message: userText,
          history: history.slice(-6),
          context: ctx
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) {
        return localCmd
          ? { text: localCmd.text, badges: localCmd.badges, offline: true }
          : { text: offlineFallbackAnswer(userText), badges: [], offline: true };
      }
      const data = await res.json();
      if (data && typeof data.reply === 'string' && data.reply.trim()) {
        const parsed = parseAndRunActionTags(data.reply.trim());
        // If AI forgot to emit an action tag on a clear nav command, still honor it cleanly
        if (parsed.badges.length === 0 && localCmd && localCmd.badges.length > 0 && !/read live/i.test(localCmd.badges[0])) {
          return { text: parsed.text || localCmd.text, badges: localCmd.badges, offline: false };
        }
        return { text: parsed.text || 'Done!', badges: parsed.badges, offline: false };
      }
      return localCmd
        ? { text: localCmd.text, badges: localCmd.badges, offline: true }
        : { text: offlineFallbackAnswer(userText), badges: [], offline: true };
    } catch (e) {
      clearTimeout(timer);
      return localCmd
        ? { text: localCmd.text, badges: localCmd.badges, offline: true }
        : { text: offlineFallbackAnswer(userText), badges: [], offline: true };
    }
  }

  /* ================================================================
     Web Speech API — Voice Input (Mic) & Natural Spoken Math Replies
     ================================================================ */
  function speakClean(text) {
    if (!voiceOutEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const spoken = String(text || '')
        .replace(/μ_s/g, 'static mu')
        .replace(/μ_k/g, 'kinetic mu')
        .replace(/μ/g, 'mu')
        .replace(/α/g, 'alpha')
        .replace(/θ/g, 'theta')
        .replace(/φ/g, 'phi')
        .replace(/°/g, ' degrees')
        .replace(/≤/g, ' less than or equal to ')
        .replace(/≥/g, ' greater than or equal to ')
        .replace(/×/g, ' times ')
        .replace(/−/g, ' minus ')
        .replace(/√/g, ' square root of ');
      const utt = new SpeechSynthesisUtterance(spoken);
      utt.lang = 'en-US';
      utt.rate = 1.03;
      utt.pitch = 1.0;
      window.speechSynthesis.speak(utt);
    } catch (e) {}
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  /* ================================================================
     Mount Floating Monochrome Chat Widget
     ================================================================ */
  function mountAiHelper() {
    if (document.getElementById('aiHelperRoot')) return;

    const root = document.createElement('div');
    root.id = 'aiHelperRoot';
    root.className = 'aih-root';
    root.innerHTML = `
      <!-- Floating Launcher Button -->
      <button type="button" class="aih-fab" id="aiHelperFab" aria-label="Open Friction Lab AI Assistant" aria-expanded="false">
        <svg class="aih-fab-icon" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 2.5 11.7 7.3 16.5 9 11.7 10.7 10 15.5 8.3 10.7 3.5 9 8.3 7.3 10 2.5Z"/>
        </svg>
        <span class="aih-fab-label mono">ASK AI</span>
      </button>

      <!-- Pop-Up Chat Panel -->
      <div class="aih-panel" id="aiHelperPanel" role="dialog" aria-label="Friction Lab AI Assistant" aria-hidden="true">
        <div class="aih-header">
          <div class="aih-header-left">
            <span class="aih-live-dot" aria-hidden="true"></span>
            <div>
              <div class="aih-title mono">FRICTION LAB AI</div>
              <div class="aih-sub">Engineering Mechanics Assistant</div>
            </div>
          </div>
          <div class="aih-header-actions">
            <button type="button" class="aih-icon-btn" id="aiHelperVoice" title="Toggle voice replies" aria-label="Toggle voice replies" aria-pressed="false"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6v4h2.8L9 13V3L5.3 6H2.5Z"/><path class="aih-vol-wave" d="M11.5 5.5a3.5 3.5 0 0 1 0 5"/></svg></button>
            <button type="button" class="aih-icon-btn" id="aiHelperClear" title="Clear conversation" aria-label="Clear conversation">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5l.6 8.5h4.8l.6-8.5"/></svg>
            </button>
            <button type="button" class="aih-icon-btn" id="aiHelperClose" title="Close" aria-label="Close assistant">✕</button>
          </div>
        </div>

        <div class="aih-messages" id="aiHelperMessages">
          <div class="aih-welcome" id="aiHelperWelcome">
            <p class="aih-welcome-copy">Ask anything about Angle of Repose, Friction Plane, Cone of Friction, derivations, or numerical problems.</p>
            <div class="aih-chips">
              ${STARTER_PROMPTS.map(p => `<button type="button" class="aih-chip">${p}</button>`).join('')}
            </div>
          </div>
        </div>

        <form class="aih-form" id="aiHelperForm" autocomplete="off">
          <input type="text" class="aih-input" id="aiHelperInput" placeholder="Ask about friction physics…" maxlength="450" aria-label="Ask a friction physics question">
          <button type="button" class="aih-mic-btn" id="aiHelperMic" title="Speak your question or command" aria-label="Voice input"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="1.8" width="5" height="8" rx="2.5"/><path d="M3.2 7.8a4.8 4.8 0 0 0 9.6 0M8 12.6V14.5M5.8 14.5h4.4"/></svg></button>
          <button type="submit" class="aih-send-btn" id="aiHelperSend" aria-label="Send message">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(root);

    const fab = document.getElementById('aiHelperFab');
    const panel = document.getElementById('aiHelperPanel');
    const closeBtn = document.getElementById('aiHelperClose');
    const clearBtn = document.getElementById('aiHelperClear');
    const msgsEl = document.getElementById('aiHelperMessages');
    const form = document.getElementById('aiHelperForm');
    const input = document.getElementById('aiHelperInput');

    function scrollToBottom() {
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function setOpen(next) {
      isOpen = next;
      if (!isOpen) { stopSpeaking(); if (recognition && isListening) { try { recognition.stop(); } catch (e) {} } }
      fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      root.classList.toggle('is-open', isOpen);

      if (isOpen) {
        panel.style.display = 'flex';
        if (hasGsap() && !reducedMotion()) {
          window.gsap.fromTo(panel, { y: 18, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.32, ease: 'power3.out' });
        }
        setTimeout(() => input.focus(), 140);
      } else {
        if (hasGsap() && !reducedMotion()) {
          window.gsap.to(panel, {
            y: 12, scale: 0.96, opacity: 0, duration: 0.2, ease: 'power2.in',
            onComplete: () => { if (!isOpen) panel.style.display = 'none'; }
          });
        } else {
          panel.style.display = 'none';
        }
      }
    }

    async function sendMessage(rawText) {
      const text = String(rawText || '').trim();
      if (!text || isBusy) return;
      isBusy = true;
      input.value = '';

      const welcome = document.getElementById('aiHelperWelcome');
      if (welcome) welcome.style.display = 'none';

      // 1. Append User Bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'aih-msg aih-msg-user';
      userBubble.textContent = text;
      msgsEl.appendChild(userBubble);
      if (hasGsap() && !reducedMotion()) {
        window.gsap.fromTo(userBubble, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.26, ease: 'power3.out' });
      }
      scrollToBottom();

      // 2. Append AI Response Container with AITextLoading + AILoadingState
      const aiMsg = document.createElement('div');
      aiMsg.className = 'aih-msg aih-msg-ai';
      msgsEl.appendChild(aiMsg);

      const textLoader = createAITextLoading(aiMsg);
      const stepLoader = createAILoadingState(aiMsg, text);
      scrollToBottom();

      // Ensure at least 950ms so the user sees the step rail & wave animation cleanly
      const minAnim = new Promise(r => setTimeout(r, 950));
      const [result] = await Promise.all([askWorker(text), minAnim]);

      // 3. Complete Step Rail (auto-folds) & swap AITextLoading -> BlurText Answer
      textLoader.stop();
      stepLoader.complete();

      if (result.badges && result.badges.length) {
        const badgeRow = document.createElement('div');
        badgeRow.className = 'aih-action-badges';
        result.badges.forEach(lbl => {
          const b = document.createElement('span');
          b.className = 'aih-action-badge mono';
          b.textContent = '↗ ' + lbl;
          badgeRow.appendChild(b);
        });
        aiMsg.appendChild(badgeRow);
      }

      const answerWrap = document.createElement('div');
      answerWrap.className = 'aih-answer-body';
      aiMsg.appendChild(answerWrap);
      renderBlurText(answerWrap, result.text);
      speakClean(result.text);

      history.push({ role: 'user', text });
      history.push({ role: 'model', text: result.text });
      if (history.length > 12) history = history.slice(-12);

      isBusy = false;
      scrollToBottom();
    }

    fab.addEventListener('click', () => setOpen(!isOpen));
    closeBtn.addEventListener('click', () => setOpen(false));
    clearBtn.addEventListener('click', () => {
      history = [];
      const welcome = document.getElementById('aiHelperWelcome');
      msgsEl.querySelectorAll('.aih-msg').forEach(n => n.remove());
      if (welcome) welcome.style.display = 'block';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(input.value);
    });

    root.querySelectorAll('.aih-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.textContent));
    });

    // Voice Reply Toggle (Text-to-Speech)
    const voiceBtn = document.getElementById('aiHelperVoice');
    if (voiceBtn) {
      if (!('speechSynthesis' in window)) {
        voiceBtn.style.display = 'none';
      } else {
        voiceBtn.addEventListener('click', () => {
          voiceOutEnabled = !voiceOutEnabled;
          voiceBtn.setAttribute('aria-pressed', voiceOutEnabled ? 'true' : 'false');
          voiceBtn.classList.toggle('is-active', voiceOutEnabled);
          if (!voiceOutEnabled) stopSpeaking();
        });
      }
    }

    // Push-to-Talk Mic (SpeechRecognition)
    const micBtn = document.getElementById('aiHelperMic');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (micBtn) {
      if (!SR) {
        micBtn.style.display = 'none';
      } else {
        recognition = new SR();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        let finalTranscript = '';

        recognition.onstart = () => {
          isListening = true;
          finalTranscript = '';
          stopSpeaking();
          micBtn.classList.add('is-listening');
          input.placeholder = 'Listening… speak now';
        };

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const tr = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalTranscript += tr;
            else interim += tr;
          }
          input.value = (finalTranscript + interim).trim();
        };

        recognition.onerror = () => {
          isListening = false;
          micBtn.classList.remove('is-listening');
          input.placeholder = 'Ask about friction physics…';
        };

        recognition.onend = () => {
          isListening = false;
          micBtn.classList.remove('is-listening');
          input.placeholder = 'Ask about friction physics…';
          const spoken = (finalTranscript || input.value || '').trim();
          if (spoken) {
            // Auto-enable spoken reply if user asked by voice and speechSynthesis exists
            if (voiceBtn && !voiceOutEnabled && 'speechSynthesis' in window) {
              voiceOutEnabled = true;
              voiceBtn.setAttribute('aria-pressed', 'true');
              voiceBtn.classList.add('is-active');
            }
            sendMessage(spoken);
          }
        };

        micBtn.addEventListener('click', () => {
          if (isBusy) return;
          if (isListening) {
            try { recognition.stop(); } catch (e) {}
          } else {
            try { recognition.start(); } catch (e) {}
          }
        });
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) setOpen(false);
    });

    // Keep FAB clear of Home page's bottom-right SOUND OFF pill
    function syncHomeOffset() {
      const home = document.getElementById('page-home');
      const onHome = home && home.classList.contains('active');
      root.classList.toggle('on-home', !!onHome);
    }
    window.addEventListener('pagechange', syncHomeOffset);
    syncHomeOffset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAiHelper);
  } else {
    mountAiHelper();
  }
})();
