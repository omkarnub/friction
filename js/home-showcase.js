/**
 * home-showcase.js — Architectural Launch Transition + V4 Zero-Card Cinematic GSAP Showcase
 *
 * Preserves the exact Get Started screen and 5-column Launch Curtain transition untouched.
 * Powers a lean, zero-card, 100%-bleed 6-act monochrome GSAP ScrollTrigger Home Page:
 *   1) Act 1: Unobstructed Monumental FRICTION Hero -> Contact-Seam Dive into 10,000x Microscope Canvas
 *   2) Act 2: "The Invisible Threshold" — Pinned 3-Scene Animated SVG Cinema (Footstep Grip ->
 *             Spinning Brake Rotor Clamped by Calipers -> Tensioned Bolted Bridge Joint)
 *   3) Act 3: Method 01 — Angle of Repose 100% Full-Bleed Darkroom Cinema (#mrReposeSim)
 *   4) Act 4: Method 02 — Friction Plane 100% Full-Bleed Darkroom Cinema (#mfFrictionSim)
 *   5) Act 5: Static vs. Kinetic Polarity Wipe + Live Force-Curve Dot
 *   6) Act 6: Interactive 9-Surface Discovery Lab (? until measured) + Orbital Launch Portal + @Omkarnub Signature
 */
(function () {
  'use strict';

  const toRad = (d) => (d * Math.PI) / 180;

  function drawArc(cx, cy, r, startDeg, endDeg) {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const sx = cx + r * Math.cos(s);
    const sy = cy - r * Math.sin(s);
    const ex = cx + r * Math.cos(e);
    const ey = cy - r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  /* ================================================================
     Canonical 9 Surface Pairs (Hidden as ? until user tilts to measure)
     ================================================================ */
  const SURFACE_PAIRS = [
    { key: 'steel-steel-lub',   name: 'Steel on Steel (Lubricated)', mu: 0.12, angle: 6.8 },
    { key: 'wood-glass',        name: 'Wood on Glass',               mu: 0.33, angle: 18.3 },
    { key: 'wood-wood',         name: 'Wood on Wood',                mu: 0.38, angle: 21.0 },
    { key: 'brass-steel',       name: 'Brass on Steel',              mu: 0.41, angle: 22.3 },
    { key: 'wood-steel',        name: 'Wood on Steel',               mu: 0.42, angle: 22.8 },
    { key: 'steel-steel-dry',   name: 'Steel on Steel (Dry)',        mu: 0.62, angle: 31.8 },
    { key: 'rubber-concrete',   name: 'Rubber on Concrete',          mu: 0.70, angle: 35.0 },
    { key: 'glass-glass',       name: 'Glass on Glass',              mu: 0.92, angle: 42.6 },
    { key: 'aluminum-aluminum', name: 'Aluminum on Aluminum',        mu: 1.23, angle: 51.0 }
  ];

  /* ================================================================
     State & Cleanup Registry
     ================================================================ */
  let homeGsapCtx = null;
  let homeInitialized = false;
  let transitionRunning = false;
  let splashListenersAttached = false;
  let signatureTimeline = null;
  let signatureObserver = null;
  let footerScrollListenerAttached = false;

  let ambientRaf = null;
  let microRaf = null;
  let microProgress = 0;

  let selectedSurfaceIdx = 2;
  const discoveredMap = {};
  let autoTiltTl = null;

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isLightTheme = () =>
    document.documentElement.getAttribute('data-theme') === 'light';

  /* ================================================================
     PART 1 — Splash Entrance + Magnetic Button + Scroll-to-Enter
     (Preserved 100% verbatim as approved)
     ================================================================ */
  function initSplashInteractions() {
    if (splashListenersAttached) return;
    splashListenersAttached = true;

    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    if (window.gsap && !prefersReducedMotion()) {
      const lines = splash.querySelectorAll('.splash-line-inner');
      const metas = splash.querySelectorAll('.splash-meta-reveal');
      if (lines.length) {
        gsap.set(lines, { yPercent: 115, opacity: 0 });
        gsap.to(lines, { yPercent: 0, opacity: 1, duration: 0.95, stagger: 0.11, ease: 'power4.out', delay: 0.25 });
      }
      if (metas.length) {
        gsap.set(metas, { y: 18, opacity: 0 });
        gsap.to(metas, { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out', delay: 0.55 });
      }
    }

    const enterBtn = document.getElementById('enterAppBtn');
    if (enterBtn && window.gsap && !prefersReducedMotion()) {
      enterBtn.addEventListener('mousemove', (e) => {
        const r = enterBtn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        gsap.to(enterBtn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
      });
      enterBtn.addEventListener('mouseleave', () => {
        gsap.to(enterBtn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
      });
    }

    let wheelAccum = 0;
    let touchStartY = null;

    window.addEventListener('wheel', (e) => {
      const sp = document.getElementById('splashScreen');
      if (!sp || sp.classList.contains('dismissed') || sp.style.display === 'none' || transitionRunning) return;
      if (e.deltaY > 12) {
        wheelAccum += e.deltaY;
        if (wheelAccum > 65) {
          wheelAccum = 0;
          if (typeof window.triggerLaunchTransition === 'function') window.triggerLaunchTransition();
        }
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length) touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const sp = document.getElementById('splashScreen');
      if (!sp || sp.classList.contains('dismissed') || sp.style.display === 'none' || transitionRunning) return;
      if (touchStartY !== null && e.touches && e.touches.length) {
        if (touchStartY - e.touches[0].clientY > 55) {
          touchStartY = null;
          if (typeof window.triggerLaunchTransition === 'function') window.triggerLaunchTransition();
        }
      }
    }, { passive: true });
  }

  /* ================================================================
     PART 2 — Full-Screen 5-Column Architectural Launch Transition
     (Preserved 100% verbatim as approved)
     ================================================================ */
  function triggerLaunchTransition(onMidpoint) {
    if (transitionRunning) return;
    transitionRunning = true;

    const splash = document.getElementById('splashScreen');
    const curtain = document.getElementById('launchCurtain');
    const cols = curtain ? curtain.querySelectorAll('.lc-col') : [];
    const hud = curtain ? curtain.querySelector('.lc-hud') : null;
    const counterEl = curtain ? curtain.querySelector('.lc-counter') : null;
    const barEl = curtain ? curtain.querySelector('.lc-progress-fill') : null;

    const finishInstant = () => {
      if (window.splashBgInstance && typeof window.splashBgInstance.destroy === 'function') {
        window.splashBgInstance.destroy();
        window.splashBgInstance = null;
      }
      document.body.classList.remove('pre-launch');
      if (splash) { splash.classList.add('dismissed'); splash.style.display = 'none'; }
      if (typeof onMidpoint === 'function') onMidpoint();
      playHomeHeroEntrance(true);
      initHomeScrollChoreography();
      transitionRunning = false;
    };

    if (!window.gsap || !curtain || !cols.length || prefersReducedMotion()) {
      finishInstant();
      return;
    }

    document.body.classList.add('is-transitioning');
    curtain.classList.add('active');

    const splashLines = splash ? splash.querySelectorAll('.splash-line-inner') : [];
    const splashMetas = splash ? splash.querySelectorAll('.splash-meta-reveal') : [];
    const splashBg = document.getElementById('splashBgContainer');
    const countObj = { val: 0 };

    gsap.set(cols, { scaleY: 0, transformOrigin: 'bottom center' });
    if (hud) gsap.set(hud, { opacity: 0, y: 12 });
    if (barEl) gsap.set(barEl, { scaleX: 0, transformOrigin: 'left center' });
    if (counterEl) counterEl.textContent = '00%';

    const tl = gsap.timeline({
      onComplete: () => {
        curtain.classList.remove('active');
        document.body.classList.remove('is-transitioning');
        transitionRunning = false;
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    });

    if (splashLines.length) tl.to(splashLines, { yPercent: -115, opacity: 0, duration: 0.42, stagger: 0.04, ease: 'power3.in' }, 0);
    if (splashMetas.length) tl.to(splashMetas, { y: -16, opacity: 0, duration: 0.34, stagger: 0.03, ease: 'power2.in' }, 0);
    if (splashBg) tl.to(splashBg, { scale: 1.12, opacity: 0.35, duration: 0.48, ease: 'power2.in' }, 0);

    tl.to(cols, { scaleY: 1, duration: 0.56, stagger: 0.045, ease: 'power4.inOut' }, 0.16);

    if (hud) tl.to(hud, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.58);
    if (barEl) tl.to(barEl, { scaleX: 1, duration: 0.48, ease: 'power2.inOut' }, 0.62);
    if (counterEl) {
      tl.to(countObj, {
        val: 100, duration: 0.48, ease: 'power2.inOut',
        onUpdate: () => { counterEl.textContent = String(Math.round(countObj.val)).padStart(2, '0') + '%'; }
      }, 0.62);
    }

    tl.call(() => {
      if (window.splashBgInstance && typeof window.splashBgInstance.destroy === 'function') {
        window.splashBgInstance.destroy();
        window.splashBgInstance = null;
      }
      document.body.classList.remove('pre-launch');
      if (splash) { splash.classList.add('dismissed'); splash.style.display = 'none'; }
      if (typeof onMidpoint === 'function') onMidpoint();
      window.scrollTo(0, 0);
      prepareHomeHeroForEntrance();
      initHomeScrollChoreography();
    }, null, 0.85);

    if (hud) tl.to(hud, { opacity: 0, y: -14, duration: 0.24, ease: 'power2.in' }, 1.14);

    tl.set(cols, { transformOrigin: 'top center' }, 1.2);
    tl.to(cols, { scaleY: 0, duration: 0.68, stagger: 0.045, ease: 'power4.inOut' }, 1.22);
    tl.call(() => playHomeHeroEntrance(false), null, 1.32);
  }


  /* ================================================================
     PART 2B — Same 5-Column Architectural Transition for Page-to-Page Switches
     ================================================================ */
  const PAGE_LABELS = {
    home: 'HOME · SHOWCASE',
    simulate: 'VIRTUAL SIMULATOR',
    log: 'SCIENTIFIC DATA LOG',
    methods: 'EXPERIMENTAL METHODS',
    theory: 'THEORY & DERIVATIONS',
    quiz: 'KNOWLEDGE QUIZ',
    compare: 'REFERENCE COMPARISON',
    reference: 'MATERIAL REFERENCE',
    'how-to-use': 'USER MANUAL',
    contributors: 'PROJECT TEAM'
  };

  function triggerPageTransition(targetPage, onMidpoint) {
    const curtain = document.getElementById('launchCurtain');
    const cols = curtain ? curtain.querySelectorAll('.lc-col') : [];
    const hud = curtain ? curtain.querySelector('.lc-hud') : null;
    const statusEl = curtain ? curtain.querySelector('.lc-status') : null;
    const counterEl = curtain ? curtain.querySelector('.lc-counter') : null;
    const barEl = curtain ? curtain.querySelector('.lc-progress-fill') : null;

    if (transitionRunning || !window.gsap || !curtain || !cols.length || prefersReducedMotion()) {
      document.body.classList.remove('nav-cinema-hidden');
      if (typeof onMidpoint === 'function') onMidpoint();
      return;
    }

    transitionRunning = true;
    document.body.classList.add('is-transitioning');
    document.body.classList.remove('nav-cinema-hidden');
    curtain.classList.add('active');

    const prevStatus = statusEl ? statusEl.textContent : 'INITIALIZING APPARATUS';
    if (statusEl) statusEl.textContent = PAGE_LABELS[targetPage] || String(targetPage || 'LOADING').toUpperCase();

    const countObj = { val: 0 };
    gsap.set(cols, { scaleY: 0, transformOrigin: 'bottom center' });
    if (hud) gsap.set(hud, { opacity: 0, y: 10 });
    if (barEl) gsap.set(barEl, { scaleX: 0, transformOrigin: 'left center' });
    if (counterEl) counterEl.textContent = '00%';

    const tl = gsap.timeline({
      onComplete: () => {
        curtain.classList.remove('active');
        document.body.classList.remove('is-transitioning');
        if (statusEl) statusEl.textContent = prevStatus;
        transitionRunning = false;
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    });

    // Sweep 5 columns up to seal screen
    tl.to(cols, {
      scaleY: 1,
      duration: 0.40,
      stagger: 0.032,
      ease: 'power4.inOut'
    }, 0);

    // Quick HUD progress flash
    if (hud) tl.to(hud, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.24);
    if (barEl) tl.to(barEl, { scaleX: 1, duration: 0.30, ease: 'power2.inOut' }, 0.26);
    if (counterEl) {
      tl.to(countObj, {
        val: 100,
        duration: 0.30,
        ease: 'power2.inOut',
        onUpdate: () => {
          counterEl.textContent = String(Math.round(countObj.val)).padStart(2, '0') + '%';
        }
      }, 0.26);
    }

    // Midpoint swap while viewport is sealed
    tl.call(() => {
      if (typeof onMidpoint === 'function') onMidpoint();
      window.scrollTo(0, 0);
    }, null, 0.44);

    // Hide HUD and open shutters upward
    if (hud) tl.to(hud, { opacity: 0, y: -10, duration: 0.18, ease: 'power2.in' }, 0.56);
    tl.set(cols, { transformOrigin: 'top center' }, 0.60);
    tl.to(cols, {
      scaleY: 0,
      duration: 0.48,
      stagger: 0.032,
      ease: 'power4.inOut'
    }, 0.62);
  }

  function prepareHomeHeroForEntrance() {
    if (!window.gsap || prefersReducedMotion()) return;
    const nav = document.getElementById('mainNav');
    const chars = document.querySelectorAll('#hxHeroMicro .hx-char');
    const reveals = document.querySelectorAll('#hxHeroMicro .hx-hero-reveal');
    if (nav) gsap.set(nav, { y: -24, opacity: 0 });
    if (chars.length) gsap.set(chars, { yPercent: 115, opacity: 0 });
    if (reveals.length) gsap.set(reveals, { y: 20, opacity: 0 });
  }

  function playHomeHeroEntrance(instant) {
    const nav = document.getElementById('mainNav');
    const chars = document.querySelectorAll('#hxHeroMicro .hx-char');
    const reveals = document.querySelectorAll('#hxHeroMicro .hx-hero-reveal');
    if (!window.gsap || instant || prefersReducedMotion()) {
      if (nav) gsap.set(nav, { clearProps: 'transform,opacity' });
      if (chars.length) gsap.set(chars, { clearProps: 'transform,opacity' });
      if (reveals.length) gsap.set(reveals, { clearProps: 'transform,opacity' });
      return;
    }
    const tl = gsap.timeline();
    if (nav) tl.to(nav, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', clearProps: 'transform' }, 0);
    if (chars.length) tl.to(chars, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.04, ease: 'power4.out' }, 0.06);
    if (reveals.length) tl.to(reveals, { y: 0, opacity: 1, duration: 0.72, stagger: 0.08, ease: 'power3.out' }, 0.28);
  }

  function replayLaunchIntro() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;
    destroyHomeScrollChoreography();
    window.scrollTo({ top: 0, behavior: 'instant' });
    splash.classList.remove('dismissed');
    splash.style.display = 'flex';
    document.body.classList.add('pre-launch');

    const splashBg = document.getElementById('splashBgContainer');
    if (splashBg && window.initGetStartedBackground && !window.splashBgInstance) {
      gsap.set(splashBg, { scale: 1, opacity: 1 });
      window.splashBgInstance = window.initGetStartedBackground(splashBg);
    }

    const lines = splash.querySelectorAll('.splash-line-inner');
    const metas = splash.querySelectorAll('.splash-meta-reveal');
    if (window.gsap) {
      gsap.fromTo(lines, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.1, ease: 'power4.out' });
      gsap.fromTo(metas, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.2 });
    }
  }

  /* ================================================================
     PART 3 — Ambient Subtle Monochrome Force-Field Canvas
     ================================================================ */
  function startAmbientVectorField() {
    stopAmbientVectorField();
    const canvas = document.getElementById('hxAmbientCanvas');
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const pointer = { x: -999, y: -999 };

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });

    let t = 0;
    function frame() {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      const spacing = w < 768 ? 90 : 76;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);
      const light = isLightTheme();
      const baseStroke = light ? 'rgba(18, 18, 18, 0.06)' : 'rgba(245, 245, 245, 0.055)';
      const nearStroke = light ? 'rgba(18, 18, 18, 0.24)' : 'rgba(245, 245, 245, 0.22)';
      ctx.lineWidth = 1;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * spacing + 24;
          const y = r * spacing + 24;
          const dx = pointer.x - x;
          const dy = pointer.y - y;
          const dist = Math.hypot(dx, dy);
          const near = dist < 185;
          const angle = near ? Math.atan2(dy, dx) : Math.sin(x * 0.004 + t) * 0.28 + Math.cos(y * 0.004 - t * 0.7) * 0.28;
          const len = near ? 10 + (1 - dist / 185) * 9 : 6.5;

          ctx.strokeStyle = near ? nearStroke : baseStroke;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(angle) * (len * 0.5), y - Math.sin(angle) * (len * 0.5));
          ctx.lineTo(x + Math.cos(angle) * (len * 0.5), y + Math.sin(angle) * (len * 0.5));
          ctx.stroke();
        }
      }
      ambientRaf = requestAnimationFrame(frame);
    }

    ambientRaf = requestAnimationFrame(frame);
    canvas._cleanup = () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }

  function stopAmbientVectorField() {
    if (ambientRaf) { cancelAnimationFrame(ambientRaf); ambientRaf = null; }
    const canvas = document.getElementById('hxAmbientCanvas');
    if (canvas && canvas._cleanup) { canvas._cleanup(); canvas._cleanup = null; }
  }

  /* ================================================================
     PART 3B — Mesmerizing Interactive Startup Hero Tribology Canvas
     Full-bleed 60fps reactive shear-vector field + contact horizon +
     subtle amber sparks on high shear velocity + live telemetry readout.
     ================================================================ */
  let heroLiveRaf = null;

  function startHeroLiveCanvas() {
    stopHeroLiveCanvas();
    const canvas = document.getElementById('hxHeroLiveCanvas');
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const shearEl = document.getElementById('hxHeroShearVal');
    const tiltEl = document.getElementById('hxHeroTiltVal');
    const stateEl = document.getElementById('hxHeroStateVal');
    const reticle = document.getElementById('hxHeroReticle');

    let w = 0, h = 0, dpr = 1;
    const ptr = { x: -999, y: -999, vx: 0, vy: 0, active: false };
    const sparks = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(300, rect.width || window.innerWidth);
      h = Math.max(360, rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      if (ptr.active) {
        ptr.vx = (nx - ptr.x) * 0.45 + ptr.vx * 0.55;
        ptr.vy = (ny - ptr.y) * 0.45 + ptr.vy * 0.55;
      }
      ptr.x = nx;
      ptr.y = ny;
      ptr.active = true;

      const speed = Math.hypot(ptr.vx, ptr.vy);
      if (speed > 6.5 && sparks.length < 36) {
        sparks.push({
          x: nx,
          y: ny,
          vx: ptr.vx * 0.25 + (Math.random() - 0.5) * 2.4,
          vy: ptr.vy * 0.25 + (Math.random() - 0.5) * 2.4,
          life: 1
        });
      }
    };

    const onLeave = () => { ptr.active = false; };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });

    let t = 0;
    let lastHudUpdate = 0;

    function frame(now) {
      t += 0.014;
      ptr.vx *= 0.92;
      ptr.vy *= 0.92;
      ctx.clearRect(0, 0, w, h);

      const light = isLightTheme();
      const spacing = w < 640 ? 48 : 54;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);

      // Autonomous harmonic wave center when pointer isn't active (keeps mobile & idle mesmerizing!)
      const waveX = ptr.active ? ptr.x : w * (0.5 + Math.sin(t * 0.65) * 0.28);
      const waveY = ptr.active ? ptr.y : h * (0.5 + Math.cos(t * 0.48) * 0.18);
      const radius = w < 640 ? 175 : 240;

      // Subtle atmospheric radial focus glow
      const glow = ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, radius * 1.45);
      glow.addColorStop(0, light ? 'rgba(18, 18, 18, 0.06)' : 'rgba(245, 245, 245, 0.075)');
      glow.addColorStop(1, 'rgba(245, 245, 245, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Precision Shear Vector Field
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * spacing + 18;
          const y = r * spacing + 18;
          const dx = waveX - x;
          const dy = waveY - y;
          const dist = Math.hypot(dx, dy);
          const prox = Math.max(0, 1 - dist / radius);

          const baseAngle = Math.sin(x * 0.005 + t) * 0.35 + Math.cos(y * 0.005 - t * 0.7) * 0.25;
          const targetAngle = Math.atan2(dy, dx);
          const angle = baseAngle * (1 - prox) + targetAngle * prox;
          const len = 8 + prox * 15;

          if (prox > 0.58) {
            ctx.strokeStyle = light
              ? `rgba(18, 18, 18, ${(0.35 + prox * 0.55).toFixed(2)})`
              : `rgba(255, 255, 255, ${(0.35 + prox * 0.60).toFixed(2)})`;
            ctx.lineWidth = 1.35;
          } else {
            const alpha = (light ? 0.08 : 0.075) + prox * 0.22;
            ctx.strokeStyle = light ? `rgba(18, 18, 18, ${alpha.toFixed(2)})` : `rgba(245, 245, 245, ${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
          }

          const cosA = Math.cos(angle) * (len * 0.5);
          const sinA = Math.sin(angle) * (len * 0.5);
          ctx.beginPath();
          ctx.moveTo(x - cosA, y - sinA);
          ctx.lineTo(x + cosA, y + sinA);
          ctx.stroke();
        }
      }

      // Subtle living micro-seam wave near bottom 16% of viewport
      const seamY = h * 0.84;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const pull = Math.exp(-Math.pow((x - waveX) / 180, 2)) * 9 * Math.sin(t * 2.2);
        const y = seamY + Math.sin(x * 0.018 + t * 1.4) * 3.5 + pull;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = light ? 'rgba(18, 18, 18, 0.14)' : 'rgba(245, 245, 245, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Update & draw amber shear sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.96;
        sp.vy *= 0.96;
        sp.life -= 0.028;
        if (sp.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.fillStyle = light ? `rgba(18, 18, 18, ${(sp.life * 0.75).toFixed(2)})` : `rgba(255, 255, 255, ${(sp.life * 0.85).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.8 * sp.life + 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gently rotate reticle & update telemetry HUD at ~15fps
      if (reticle) {
        const rx = ((waveX / w) - 0.5) * 16;
        reticle.style.transform = `translate(-50%, -50%) rotate(${(t * 4 + rx).toFixed(1)}deg)`;
      }
      if (now - lastHudUpdate > 70) {
        lastHudUpdate = now;
        const speed = Math.hypot(ptr.vx, ptr.vy);
        const shearForce = ptr.active ? Math.min(18.5, speed * 0.85 + Math.abs(waveX / w - 0.5) * 4.2) : (1.2 + Math.abs(Math.sin(t * 0.7)) * 2.4);
        const tiltDeg = ((waveX / w) - 0.5) * 34;
        if (shearEl) shearEl.textContent = shearForce.toFixed(2) + ' N';
        if (tiltEl) tiltEl.textContent = Math.abs(tiltDeg).toFixed(1) + '°';
        if (stateEl) {
          stateEl.textContent = shearForce > 6.5 ? 'SHEAR BREAKAWAY' : 'STATIC LOCK';
        }
      }

      heroLiveRaf = requestAnimationFrame(frame);
    }

    heroLiveRaf = requestAnimationFrame(frame);
    canvas._cleanup = () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }

  function stopHeroLiveCanvas() {
    if (heroLiveRaf) { cancelAnimationFrame(heroLiveRaf); heroLiveRaf = null; }
    const canvas = document.getElementById('hxHeroLiveCanvas');
    if (canvas && canvas._cleanup) { canvas._cleanup(); canvas._cleanup = null; }
  }


  /* ================================================================
     PART 4 — Seamless 10,000x Microscopic Asperity Collision Canvas
     ================================================================ */
  function startMicroAsperityCanvas() {
    stopMicroAsperityCanvas();
    const canvas = document.getElementById('hxMicroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const sparks = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(300, rect.width || window.innerWidth);
      h = Math.max(260, rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    function terrainHeight(x, seed) {
      return (
        Math.sin(x * 0.017 + seed) * 28 +
        Math.sin(x * 0.043 + seed * 2.1) * 16 +
        Math.cos(x * 0.091 - seed * 1.3) * 8 +
        Math.sin(x * 0.19 + seed * 3.7) * 3.5
      );
    }

    function render() {
      ctx.clearRect(0, 0, w, h);
      const p = microProgress;
      const light = isLightTheme();

      const zoomAmp = Math.min(1, p / 0.36);
      const strain = p > 0.36 && p <= 0.72 ? ((p - 0.36) / 0.36) * 36 : 0;
      const slide = p > 0.72 ? 36 + Math.pow((p - 0.72) / 0.28, 1.7) * 400 : strain;
      const lift = p > 0.72 ? Math.sin(((p - 0.72) / 0.28) * Math.PI * 3) * 6 + 14 : 0;
      // Keep the opposing contact plates centered inside the framed bottom window at p=0,
      // then smoothly glide to vertical center (52%) as the window expands full-bleed!
      const midY = h * 0.52;
      const gap = (1 - zoomAmp) * 20 + lift;

      ctx.strokeStyle = light ? 'rgba(18, 18, 18, 0.045)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 64) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += 64) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

      const step = 6;
      const baseAmp = Math.max(0.14, zoomAmp);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, midY + 10 + terrainHeight(x, 1.4) * baseAmp);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = light ? 'rgba(18, 18, 18, 0.07)' : 'rgba(245, 245, 245, 0.05)';
      ctx.fill();
      ctx.strokeStyle = light ? 'rgba(18, 18, 18, 0.65)' : 'rgba(245, 245, 245, 0.6)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, midY - 10 - gap - terrainHeight(x - slide, 1.4) * baseAmp);
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fillStyle = light ? 'rgba(18, 18, 18, 0.12)' : 'rgba(245, 245, 245, 0.09)';
      ctx.fill();
      ctx.strokeStyle = light ? '#121212' : '#f5f5f5';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const stressIntensity = p > 0.30 ? Math.min(1, (p - 0.30) / 0.35) : 0;
      if (stressIntensity > 0.05) {
        for (let x = 28; x < w - 28; x += 30) {
          const yBot = midY + 10 + terrainHeight(x, 1.4) * baseAmp;
          const yTop = midY - 10 - gap - terrainHeight(x - slide, 1.4) * baseAmp;
          const dist = Math.abs(yBot - yTop);
          if (dist < 20) {
            const cy = (yBot + yTop) * 0.5;
            const radius = (3.5 + (1 - dist / 20) * 7) * stressIntensity;
            const glow = ctx.createRadialGradient(x, cy, 0, x, cy, radius * 2.2);
            glow.addColorStop(0, 'rgba(218, 152, 62, 0.9)');
            glow.addColorStop(1, 'rgba(218, 152, 62, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, cy, radius * 2.2, 0, Math.PI * 2);
            ctx.fill();

            if (p > 0.70 && sparks.length < 40 && Math.random() < 0.2) {
              sparks.push({ x, y: cy, vx: 1.8 + Math.random() * 4.2, vy: (Math.random() - 0.5) * 3.2, life: 1 });
            }
          }
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.032;
        if (sp.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(218, 152, 62, ${sp.life.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.6 * sp.life + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      microRaf = requestAnimationFrame(render);
    }

    microRaf = requestAnimationFrame(render);
    canvas._cleanup = () => window.removeEventListener('resize', resize);
  }

  function stopMicroAsperityCanvas() {
    if (microRaf) { cancelAnimationFrame(microRaf); microRaf = null; }
    const canvas = document.getElementById('hxMicroCanvas');
    if (canvas && canvas._cleanup) { canvas._cleanup(); canvas._cleanup = null; }
  }

  /* ================================================================
     PART 5 — Act 6: Build 9-Lane "Race to Slip" DOM (Zero μ numbers spoiled)
     ================================================================ */
  let raceBuilt = false;

  function buildRaceLanes() {
    const container = document.getElementById('hxRaceLanes');
    if (!container || raceBuilt) return;
    raceBuilt = true;

    container.innerHTML = SURFACE_PAIRS.map((s, idx) => `
      <div class="hx-rlane" data-race-idx="${idx}" data-slip-angle="${s.angle}">
        <span class="hx-rlane-name">${s.name}</span>
        <div class="hx-rlane-track">
          <div class="hx-rlane-rail"></div>
          <div class="hx-rlane-trail"></div>
          <div class="hx-rlane-block"></div>
        </div>
        <span class="hx-rlane-status">HOLD</span>
      </div>
    `).join('');
  }


  /* ================================================================
     V6 POLISH — Synthesized Mechanical Soundscape (Web Audio API)
     ================================================================ */
  let audioEnabled = false;
  let audioCtx = null;
  let lastTickDeg = -99;
  let lastSlippedRace = 0;

  function ensureAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function playMechTick(freq) {
    if (!audioEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq || 1150, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.022);
    } catch (e) {}
  }

  function playSlipSnap() {
    if (!audioEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.075);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch (e) {}
  }

  let audioBound = false;
  function initAudioToggle() {
    if (audioBound) return;
    const btn = document.getElementById('hxAudioToggle');
    const txt = document.getElementById('hxAudioText');
    if (!btn) return;
    audioBound = true;
    btn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      btn.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
      if (txt) txt.textContent = audioEnabled ? 'SOUND ON' : 'SOUND OFF';
      if (audioEnabled) {
        ensureAudio();
        playMechTick(1400);
      }
    });
  }

  /* Native scrolling + GSAP scrub interpolation (no wheel hijacking) */
  function startSmoothInertia() {
    if (window.ScrollTrigger) {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }
  }

  /* ================================================================
     V6 POLISH — Desktop Precision Crosshair Cursor
     ================================================================ */
  let cursorBound = false;
  function initPrecisionCursor() {
    if (cursorBound || prefersReducedMotion() || !window.gsap) return;
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const wrap = document.getElementById('hxCursor');
    if (!wrap) return;
    cursorBound = true;

    const dot = wrap.querySelector('.hx-cursor-dot');
    const ring = wrap.querySelector('.hx-cursor-ring');

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.24, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.24, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      const home = document.getElementById('page-home');
      const active = home && home.classList.contains('active') && !document.body.classList.contains('pre-launch');
      wrap.classList.toggle('is-visible', !!active);
      if (!active) return;

      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      const interactive = e.target && e.target.closest('a, button, input');
      wrap.classList.toggle('is-hover', !!interactive);
    }, { passive: true });

    document.addEventListener('mouseleave', () => wrap.classList.remove('is-visible'));
  }

  /* ================================================================
     V6 POLISH — One-Click 01-07 Act Jump Rail
     ================================================================ */
  let jumpRailBound = false;

  /* ================================================================
     V8 POLISH — Immersive Auto-Hide Top Ribbon on Home Scroll
     Hides on downward scroll (> 60px), reveals cleanly on upward scroll,
     top-edge cursor hover (< 54px), or when leaving #page-home.
     ================================================================ */
  let navCinemaBound = false;
  function initCinemaNavHide() {
    if (navCinemaBound) return;
    navCinemaBound = true;

    let lastY = window.scrollY || 0;
    let ticking = false;
    let hoverReveal = false;

    const isMenuOpen = () => {
      const panel = document.querySelector('#staggered-menu-root .staggered-menu-panel');
      return panel && panel.getAttribute('aria-hidden') === 'false';
    };

    const setHidden = (hide) => {
      const home = document.getElementById('page-home');
      const onHome = home && home.classList.contains('active') && !document.body.classList.contains('pre-launch');
      if (!onHome || isMenuOpen() || hoverReveal) {
        document.body.classList.remove('nav-cinema-hidden');
        return;
      }
      document.body.classList.toggle('nav-cinema-hidden', !!hide);
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const delta = y - lastY;
        if (y < 60) {
          setHidden(false);
        } else if (delta > 10) {
          setHidden(true);
        } else if (delta < -14) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      const nearTop = e.clientY <= 54;
      if (nearTop !== hoverReveal) {
        hoverReveal = nearTop;
        if (nearTop) {
          document.body.classList.remove('nav-cinema-hidden');
        } else if ((window.scrollY || 0) > 80) {
          setHidden(true);
        }
      }
    }, { passive: true });

    window.addEventListener('pagechange', (e) => {
      if (!e.detail || e.detail.page !== 'home') {
        document.body.classList.remove('nav-cinema-hidden');
      }
    });
  }

  function initJumpRail() {
    const rail = document.getElementById('hxJumpRail');
    if (!rail || jumpRailBound) return;
    jumpRailBound = true;

    const buttons = Array.from(rail.querySelectorAll('.hx-jtick'));
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sel = btn.getAttribute('data-jump');
        const target = sel ? document.querySelector(sel) : null;
        if (!target) return;
        playMechTick(1350);
        if (window.ScrollTrigger) {
          const st = ScrollTrigger.getAll().find((t) => t.trigger === target);
          if (st) {
            window.scrollTo({ top: st.start + 4, behavior: 'smooth' });
            return;
          }
        }
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ================================================================
     PART 6 — Clean Per-Section 7-Act GSAP ScrollTrigger Cinema
     ================================================================ */
  function destroyHomeScrollChoreography() {
    stopAmbientVectorField();
    stopHeroLiveCanvas();
    stopMicroAsperityCanvas();
    if (autoTiltTl) { autoTiltTl.kill(); autoTiltTl = null; }
    if (homeGsapCtx) {
      homeGsapCtx.revert();
      homeGsapCtx = null;
    }
    homeInitialized = false;
  }

  function initHomeScrollChoreography() {
    const homeSection = document.getElementById('page-home');
    if (!homeSection || !homeSection.classList.contains('active')) return;
    if (document.body.classList.contains('pre-launch')) return;

    microProgress = 0;
    lastTickDeg = -99;
    lastSlippedRace = 0;
    initAudioToggle();
    startSmoothInertia();
    initPrecisionCursor();
    initJumpRail();
    initCinemaNavHide();
    initFooterSignature();
    startAmbientVectorField();
    startHeroLiveCanvas();
    startMicroAsperityCanvas();

    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (homeGsapCtx) {
      homeGsapCtx.revert();
      homeGsapCtx = null;
    }

    const reduceMotion = prefersReducedMotion();

    homeGsapCtx = gsap.context(() => {
      if (reduceMotion) return;

      /* ── ACT 1: Full-Bleed Interactive Hero -> 10,000x Microscope Dive ── */
      const heroMicro = document.getElementById('hxHeroMicro');
      if (heroMicro) {
        const leftChars = heroMicro.querySelectorAll('.hx-char-left');
        const rightChars = heroMicro.querySelectorAll('.hx-char-right');
        const heroMeta = heroMicro.querySelectorAll('.hx-hero-reveal');
        const seamWindow = document.getElementById('hxSeamWindow');
        const microHud = document.getElementById('hxMicroHud');
        const magEl = document.getElementById('hxMicroMag');
        const captions = Array.from(heroMicro.querySelectorAll('[data-micro-cap]'));
        const masterProxy = { t: 0 };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroMicro,
            start: 'top top',
            end: () => (window.innerWidth <= 768 ? '+=185%' : '+=260%'),
            pin: true,
            scrub: 0.95,
            anticipatePin: 1
          }
        });

        tl.to(leftChars, { xPercent: -150, opacity: 0, duration: 0.30, stagger: 0.015, ease: 'power2.in' }, 0);
        tl.to(rightChars, { xPercent: 150, opacity: 0, duration: 0.30, stagger: 0.015, ease: 'power2.in' }, 0);
        tl.to(heroMeta, { opacity: 0, y: -20, duration: 0.22, ease: 'power2.in' }, 0);
        const heroLayerEl = heroMicro.querySelector('.hx-hero-layer');
        if (heroLayerEl) tl.set(heroLayerEl, { pointerEvents: 'none' }, 0.26);

        if (seamWindow) {
          tl.fromTo(seamWindow,
            { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
            { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.34, ease: 'power2.inOut' },
            0.06
          );
        }
        if (microHud) tl.fromTo(microHud, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' }, 0.30);

        tl.to(masterProxy, {
          t: 1,
          duration: 0.72,
          ease: 'none',
          onUpdate: () => {
            const p = masterProxy.t;
            microProgress = p;
            const mag = Math.round(1 + Math.pow(Math.min(1, p / 0.40), 2.2) * 9999);
            if (magEl) magEl.textContent = mag.toLocaleString() + '×';
            const idx = p >= 0.72 ? 2 : p >= 0.35 ? 1 : 0;
            captions.forEach((c, i) => c.classList.toggle('is-active', i === idx));
          }
        }, 0.28);
      }

      /* ── ACT 2: The Invisible Threshold ── */
      const everyday = document.getElementById('hxEveryday');
      if (everyday) {
        const sceneStep = document.getElementById('hxSceneStep');
        const sceneBrake = document.getElementById('hxSceneBrake');
        const sceneBridge = document.getElementById('hxSceneBridge');
        const evCaps = Array.from(everyday.querySelectorAll('[data-ev-cap]'));
        const footGroup = document.getElementById('hxFootGroup');
        const footGripArrow = document.getElementById('hxFootGripArrow');
        const footPulse = document.getElementById('hxFootPulse');
        const brakeRotor = document.getElementById('hxBrakeRotor');
        const caliperTop = document.getElementById('hxCaliperTop');
        const caliperBot = document.getElementById('hxCaliperBot');
        const brakeHeat = document.getElementById('hxBrakeHeat');
        const plateLeft = document.getElementById('hxBridgePlateL');
        const plateRight = document.getElementById('hxBridgePlateR');
        const boltTension = document.getElementById('hxBridgeBolts');
        const shearGlow = document.getElementById('hxBridgeSeamGlow');
        const evProg = document.getElementById('hxEvProgFill');
        const eProxy = { p: 0 };

        function renderEveryday(p) {
          if (evProg) evProg.style.transform = `scaleX(${p.toFixed(3)})`;
          const oStep = p < 0.28 ? 1 : p < 0.36 ? 1 - (p - 0.28) / 0.08 : 0;
          const oBrake = p < 0.28 ? 0 : p < 0.36 ? (p - 0.28) / 0.08 : p < 0.62 ? 1 : p < 0.70 ? 1 - (p - 0.62) / 0.08 : 0;
          const oBridge = p < 0.62 ? 0 : p < 0.70 ? (p - 0.62) / 0.08 : 1;
          if (sceneStep) sceneStep.style.opacity = oStep.toFixed(3);
          if (sceneBrake) sceneBrake.style.opacity = oBrake.toFixed(3);
          if (sceneBridge) sceneBridge.style.opacity = oBridge.toFixed(3);
          if (oStep > 0) {
            const k = Math.min(1, p / 0.30);
            const dropY = (1 - Math.min(1, k * 2.2)) * -38;
            const tilt = (1 - Math.min(1, k * 2.2)) * -14;
            if (footGroup) footGroup.setAttribute('transform', `translate(0, ${dropY.toFixed(1)}) rotate(${tilt.toFixed(1)} 320 260)`);
            const gripScale = Math.max(0, (k - 0.35) / 0.65);
            if (footGripArrow) footGripArrow.setAttribute('transform', `translate(${(gripScale * 44).toFixed(1)}, 0)`);
            if (footPulse) footPulse.style.opacity = (gripScale * 0.95).toFixed(2);
          }
          if (oBrake > 0) {
            const k = Math.max(0, Math.min(1, (p - 0.30) / 0.36));
            const rotDeg = (1 - Math.pow(1 - k, 2.6)) * 520;
            const clamp = Math.min(1, k * 1.35);
            if (brakeRotor) brakeRotor.setAttribute('transform', `rotate(${rotDeg.toFixed(1)} 400 210)`);
            if (caliperTop) caliperTop.setAttribute('transform', `translate(0, ${(clamp * 22).toFixed(1)})`);
            if (caliperBot) caliperBot.setAttribute('transform', `translate(0, ${(-clamp * 22).toFixed(1)})`);
            if (brakeHeat) brakeHeat.style.opacity = (Math.sin(clamp * Math.PI * 0.85) * 0.95).toFixed(2);
          }
          if (oBridge > 0) {
            const k = Math.max(0, Math.min(1, (p - 0.65) / 0.32));
            const strain = Math.sin(k * Math.PI * 0.5) * 8;
            if (plateLeft) plateLeft.setAttribute('transform', `translate(${(-strain).toFixed(1)}, 0)`);
            if (plateRight) plateRight.setAttribute('transform', `translate(${strain.toFixed(1)}, 0)`);
            if (boltTension) boltTension.style.opacity = (0.35 + k * 0.65).toFixed(2);
            if (shearGlow) shearGlow.style.opacity = (k * 0.95).toFixed(2);
          }
          const capIdx = p >= 0.84 ? 3 : p >= 0.65 ? 2 : p >= 0.32 ? 1 : 0;
          evCaps.forEach((c, i) => c.classList.toggle('is-active', i === capIdx));
        }

        renderEveryday(0);
        gsap.to(eProxy, {
          p: 1, ease: 'none', onUpdate: () => renderEveryday(eProxy.p),
          scrollTrigger: { trigger: everyday, start: 'top top', end: () => (window.innerWidth <= 768 ? '+=175%' : '+=240%'), pin: true, scrub: 0.95, anticipatePin: 1 }
        });
      }

      /* ── ACT 3: Method 01 — Angle of Repose (#mrReposeSim) ── */
      const reposeStage = document.getElementById('mrReposeSim');
      if (reposeStage) {
        const incline = document.getElementById('hsReposeIncline');
        const blockMover = document.getElementById('hsReposeBlockMover');
        const gravityGroup = document.getElementById('hsReposeGravityGroup');
        const normalLine = document.getElementById('hsReposeNormalLine');
        const frictionLine = document.getElementById('hsReposeFrictionLine');
        const needle = document.getElementById('hsReposeNeedle');
        const arc = document.getElementById('hsReposeArc');
        const giantDeg = document.getElementById('hxReposeGiantDeg');
        const hudMu = document.getElementById('hsHudMu');
        const hudState = document.getElementById('hsHudState');
        const hudProg = document.getElementById('hsReposeProgFill');
        const caps = Array.from(reposeStage.querySelectorAll('[data-repose-cap]'));
        const state = { p: 0 };

        function renderRepose(p) {
          const tiltP = Math.min(1, p / 0.72);
          const alpha = tiltP * 24.5;
          const rad = toRad(alpha);
          const mu = Math.tan(rad);
          const cosA = Math.cos(rad);
          const sinA = Math.sin(rad);
          if (incline) incline.setAttribute('transform', `rotate(${-alpha.toFixed(2)} 120 320)`);
          if (needle) { needle.setAttribute('x2', (120 + 52 * cosA).toFixed(1)); needle.setAttribute('y2', (320 - 52 * sinA).toFixed(1)); }
          if (arc) arc.setAttribute('d', alpha > 0.5 ? drawArc(120, 320, 44, 0, alpha) : '');
          if (gravityGroup) gravityGroup.setAttribute('transform', `rotate(${alpha.toFixed(2)} 0 0)`);
          if (normalLine) normalLine.setAttribute('y2', (18 - 52 * cosA).toFixed(1));
          if (frictionLine) frictionLine.setAttribute('x2', (-56 * sinA).toFixed(1));
          if (giantDeg) giantDeg.textContent = alpha.toFixed(1) + '°';
          if (hudMu) hudMu.textContent = mu.toFixed(3);
          if (hudProg) hudProg.style.transform = `scaleX(${p.toFixed(3)})`;
          const isSlip = p > 0.74;
          if (blockMover) {
            const slide = isSlip ? -Math.pow((p - 0.74) / 0.26, 1.8) * 185 : 0;
            blockMover.setAttribute('transform', `translate(${slide.toFixed(1)}, 0)`);
          }
          if (hudState) {
            hudState.textContent = isSlip ? 'CRITICAL SLIP' : (p > 0.55 ? 'LIMITING THRESHOLD' : 'STATIC EQUILIBRIUM');
            hudState.dataset.phase = isSlip ? 'slip' : 'static';
          }
          const ci = isSlip ? 2 : p > 0.35 ? 1 : 0;
          caps.forEach((c, i) => c.classList.toggle('is-active', i === ci));
        }

        renderRepose(0);
        gsap.to(state, {
          p: 1, ease: 'none', onUpdate: () => renderRepose(state.p),
          scrollTrigger: { trigger: reposeStage, start: 'top top', end: () => (window.innerWidth <= 768 ? '+=165%' : '+=220%'), pin: true, scrub: 0.95, anticipatePin: 1 }
        });
      }

      /* ── ACT 4: Method 02 — Friction Plane (#mfFrictionSim) ── */
      const fricStage = document.getElementById('mfFrictionSim');
      if (fricStage) {
        const fArc = document.getElementById('hsFricArc');
        const fPulley = document.getElementById('hxPulleyWheel');
        const fBlock = document.getElementById('hsFricBlockMover');
        const fPLine = document.getElementById('hsFricPLine');
        const fStr1 = document.getElementById('hsFricString1');
        const fHang = document.getElementById('hsFricHangString');
        const fPan = document.getElementById('hsFricPanAssembly');
        const fDiscs = Array.from(fricStage.querySelectorAll('.hs-fric-disc'));
        const fGiant = document.getElementById('hxFricGiantPull');
        const fMu = document.getElementById('hxFricHudMu');
        const fState = document.getElementById('hxFricHudState');
        const fProg = document.getElementById('hxFricProgFill');
        const fCaps = Array.from(fricStage.querySelectorAll('[data-fric-cap]'));
        if (fArc) fArc.setAttribute('d', drawArc(120, 320, 44, 0, 20));
        const fProxy = { p: 0 };

        function renderFriction(p) {
          const pullN = Math.min(4.2, p * 5.4);
          const moveP = p > 0.74 ? (p - 0.74) / 0.26 : 0;
          const slide = Math.pow(moveP, 1.5) * 110;
          const muCalc = Math.max(0, (pullN - 5 * Math.sin(toRad(20))) / (5 * Math.cos(toRad(20))));
          if (fGiant) fGiant.textContent = pullN.toFixed(1) + ' N';
          if (fMu) fMu.textContent = muCalc.toFixed(3);
          if (fProg) fProg.style.transform = `scaleX(${p.toFixed(3)})`;
          if (fBlock) fBlock.setAttribute('transform', `translate(${slide.toFixed(1)}, 0)`);
          if (fPLine) fPLine.setAttribute('x2', (36 + pullN * 14).toFixed(1));
          if (fStr1) fStr1.setAttribute('x1', (288 + slide).toFixed(1));
          if (fHang) fHang.setAttribute('y2', (76 + slide * 0.78).toFixed(1));
          if (fPan) fPan.setAttribute('transform', `translate(0, ${(slide * 0.78).toFixed(1)})`);
          if (fPulley) fPulley.setAttribute('transform', `rotate(${(slide * 3.8).toFixed(1)} 590 310)`);
          const discCount = Math.min(fDiscs.length, Math.floor(p * 5.2));
          fDiscs.forEach((d, i) => { d.style.opacity = i < discCount ? '1' : '0.12'; });
          if (fState) { fState.textContent = moveP > 0 ? 'UPWARD ASCENT' : 'LOADING PAN'; fState.dataset.phase = moveP > 0 ? 'slip' : 'static'; }
          const ci = moveP > 0 ? 2 : p > 0.35 ? 1 : 0;
          fCaps.forEach((c, i) => c.classList.toggle('is-active', i === ci));
        }

        renderFriction(0);
        gsap.to(fProxy, {
          p: 1, ease: 'none', onUpdate: () => renderFriction(fProxy.p),
          scrollTrigger: { trigger: fricStage, start: 'top top', end: () => (window.innerWidth <= 768 ? '+=165%' : '+=220%'), pin: true, scrub: 0.95, anticipatePin: 1 }
        });
      }

      /* ── ACT 5: Static vs. Kinetic Polarity Wipe ── */
      const splitSec = document.getElementById('hxSplit');
      const splitLightLayer = document.getElementById('hxSplitLight');
      const splitDot = document.getElementById('hxSplitDot');
      if (splitSec && splitLightLayer) {
        const sProxy = { p: 0 };
        gsap.to(sProxy, {
          p: 1, ease: 'none',
          onUpdate: () => {
            const p = sProxy.p;
            const wipe = (1 - p) * 100;
            splitLightLayer.style.clipPath = `polygon(${wipe.toFixed(1)}% 0%, 100% 0%, 100% 100%, ${wipe.toFixed(1)}% 100%)`;
            if (splitDot) {
              let cx = 20, cy = 110;
              if (p <= 0.48) { const k = p / 0.48; cx = 20 + k * 170; cy = 110 - k * 88; }
              else if (p <= 0.58) { const k = (p - 0.48) / 0.10; cx = 190 + k * 28; cy = 22 + k * 34; }
              else { const k = (p - 0.58) / 0.42; cx = 218 + k * 142; cy = 56; }
              splitDot.setAttribute('cx', cx.toFixed(1));
              splitDot.setAttribute('cy', cy.toFixed(1));
            }
          },
          scrollTrigger: { trigger: splitSec, start: 'top top', end: () => (window.innerWidth <= 768 ? '+=115%' : '+=145%'), pin: true, scrub: 0.85, anticipatePin: 1 }
        });
      }

      /* ── ACT 6: First-Year Engineering Mechanics — FBD & Cone of Friction ── */
      const fbdSec = document.getElementById('hxFbdCinema');
      if (fbdSec) {
        const s1 = document.getElementById('hxFbdStage1');
        const s2 = document.getElementById('hxFbdStage2');
        const s3 = document.getElementById('hxFbdStage3');
        const phaseEl = document.getElementById('hxFbdPhase');
        const progEl = document.getElementById('hxFbdProgFill');
        const caps = Array.from(fbdSec.querySelectorAll('[data-fbd-cap]'));
        const sweeper = document.getElementById('fbdConeSweeper');
        const s2Res = document.getElementById('fbdS2Res');
        const s2Fric = document.getElementById('fbdS2Fric');
        const s2DashTop = document.getElementById('fbdS2DashTop');
        const s2DashLeft = document.getElementById('fbdS2DashLeft');
        const fProxy = { p: 0 };

        function renderFbd(p) {
          if (progEl) progEl.style.transform = `scaleX(${p.toFixed(3)})`;
          const o1 = p < 0.30 ? 1 : p < 0.38 ? 1 - (p - 0.30) / 0.08 : 0;
          const o2 = p < 0.30 ? 0 : p < 0.38 ? (p - 0.30) / 0.08 : p < 0.64 ? 1 : p < 0.72 ? 1 - (p - 0.64) / 0.08 : 0;
          const o3 = p < 0.64 ? 0 : p < 0.72 ? (p - 0.64) / 0.08 : 1;
          if (s1) s1.style.opacity = o1.toFixed(3);
          if (s2) s2.style.opacity = o2.toFixed(3);
          if (s3) s3.style.opacity = o3.toFixed(3);
          if (o2 > 0) {
            const k = Math.max(0, Math.min(1, (p - 0.32) / 0.30));
            const rx = 420 - k * 110;
            if (s2Res) s2Res.setAttribute('x2', rx.toFixed(1));
            if (s2Fric) s2Fric.setAttribute('x2', rx.toFixed(1));
            if (s2DashTop) s2DashTop.setAttribute('x2', rx.toFixed(1));
            if (s2DashLeft) { s2DashLeft.setAttribute('x1', rx.toFixed(1)); s2DashLeft.setAttribute('x2', rx.toFixed(1)); }
          }
          if (o3 > 0 && sweeper) {
            const k = Math.max(0, Math.min(1, (p - 0.66) / 0.32));
            sweeper.setAttribute('x2', (420 + Math.sin(k * Math.PI * 1.5) * 124).toFixed(1));
          }
          const idx = p >= 0.68 ? 2 : p >= 0.34 ? 1 : 0;
          if (phaseEl) phaseEl.textContent = idx === 2 ? '03 / CONE OF FRICTION' : idx === 1 ? '02 / RESULTANT R & ANGLE φ' : '01 / RESOLVING WEIGHT W';
          caps.forEach((c, i) => c.classList.toggle('is-active', i === idx));
        }

        renderFbd(0);
        gsap.to(fProxy, {
          p: 1, ease: 'none', onUpdate: () => renderFbd(fProxy.p),
          scrollTrigger: { trigger: fbdSec, start: 'top top', end: () => (window.innerWidth <= 768 ? '+=155%' : '+=210%'), pin: true, scrub: 0.9, anticipatePin: 1 }
        });
      }

      /* ── ACT 7: Why Does This Matter in Engineering? ── */
      const engSec = document.getElementById('hxEngineering');
      if (engSec) {
        const sceneSeize = document.getElementById('hxEngSeize');
        const sceneSlip = document.getElementById('hxEngSlipScene');
        const sceneCal = document.getElementById('hxEngCalibrated');
        const bearingCage = document.getElementById('hxBearingCage');
        const thermalHalo = document.getElementById('hxThermalHalo');
        const rollerL = document.getElementById('hxRollerL');
        const rollerR = document.getElementById('hxRollerR');
        const skidLoad = document.getElementById('hxSkidLoad');
        const calReticle = document.getElementById('hxCalReticle');
        const engState = document.getElementById('hxEngState');
        const engProg = document.getElementById('hxEngProgFill');
        const engCaps = Array.from(engSec.querySelectorAll('[data-eng-cap]'));
        const eState = { p: 0 };

        function renderEng(p) {
          if (engProg) engProg.style.transform = `scaleX(${p.toFixed(3)})`;
          const oA = p < 0.30 ? 1 : p < 0.38 ? 1 - (p - 0.30) / 0.08 : 0;
          const oB = p < 0.30 ? 0 : p < 0.38 ? (p - 0.30) / 0.08 : p < 0.64 ? 1 : p < 0.72 ? 1 - (p - 0.64) / 0.08 : 0;
          const oC = p < 0.64 ? 0 : p < 0.72 ? (p - 0.64) / 0.08 : 1;
          if (sceneSeize) sceneSeize.style.opacity = oA.toFixed(3);
          if (sceneSlip) sceneSlip.style.opacity = oB.toFixed(3);
          if (sceneCal) sceneCal.style.opacity = oC.toFixed(3);
          if (oA > 0) {
            const k = Math.min(1, p / 0.34);
            const chokeRot = (1 - Math.pow(1 - k, 2.5)) * 72 + (k > 0.55 ? Math.sin(k * 95) * 2.2 : 0);
            if (bearingCage) bearingCage.setAttribute('transform', `rotate(${chokeRot.toFixed(1)} 420 200)`);
            if (thermalHalo) thermalHalo.style.opacity = (0.25 + k * 0.75).toFixed(2);
          }
          if (oB > 0) {
            const k = Math.max(0, Math.min(1, (p - 0.32) / 0.36));
            const spin = k * 360;
            if (rollerL) rollerL.setAttribute('transform', `rotate(${spin.toFixed(1)} 210 252)`);
            if (rollerR) rollerR.setAttribute('transform', `rotate(${spin.toFixed(1)} 630 252)`);
            if (skidLoad) skidLoad.setAttribute('transform', `translate(${(-Math.pow(k, 1.4) * 165).toFixed(1)}, 0)`);
          }
          if (oC > 0 && calReticle) {
            const k = Math.max(0, Math.min(1, (p - 0.68) / 0.32));
            calReticle.setAttribute('transform', `rotate(${((1 - k) * 45).toFixed(1)} 420 200)`);
          }
          const idx = p >= 0.68 ? 2 : p >= 0.34 ? 1 : 0;
          if (engState) {
            engState.textContent = idx === 2 ? 'CALIBRATED PRECISION' : idx === 1 ? 'OVERESTIMATED · TRACTION LOSS' : 'UNDERESTIMATED · SEIZURE';
            engState.dataset.phase = idx === 2 ? 'static' : 'slip';
          }
          engCaps.forEach((c, i) => c.classList.toggle('is-active', i === idx));
        }

        renderEng(0);
        gsap.to(eState, {
          p: 1, ease: 'none', onUpdate: () => renderEng(eState.p),
          scrollTrigger: { trigger: engSec, start: 'top top', end: () => (window.innerWidth <= 768 ? '+=155%' : '+=210%'), pin: true, scrub: 0.9, anticipatePin: 1 }
        });
      }

      /* ── Sync Active Tick on 01-07 Jump Rail ── */
      const railButtons = Array.from(document.querySelectorAll('#hxJumpRail .hx-jtick'));
      const actIds = ['#hxHeroMicro', '#hxEveryday', '#mrReposeSim', '#mfFrictionSim', '#hxSplit', '#hxFbdCinema', '#hxEngineering'];
      actIds.forEach((sel, idx) => {
        const el = document.querySelector(sel);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => railButtons.forEach((b, i) => b.classList.toggle('is-active', i === idx)),
          onEnterBack: () => railButtons.forEach((b, i) => b.classList.toggle('is-active', i === idx))
        });
      });

      /* ── Closing Orbital Reticle Launch Portal ── */
      const finale = document.getElementById('hxFinale');
      const outerRing = document.getElementById('hxFinaleRingOuter');
      const innerRing = document.getElementById('hxFinaleRingInner');
      if (finale) {
        if (outerRing) {
          gsap.fromTo(outerRing,
            { scale: 0.58, rotation: -30, opacity: 0.14 },
            { scale: 1.12, rotation: 30, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: finale, start: 'top bottom', end: 'center center', scrub: 0.8 } }
          );
        }
        if (innerRing) {
          gsap.fromTo(innerRing,
            { scale: 1.3, rotation: 35, opacity: 0.1 },
            { scale: 0.92, rotation: -35, opacity: 0.45, ease: 'none', scrollTrigger: { trigger: finale, start: 'top bottom', end: 'center center', scrub: 0.8 } }
          );
        }
      }
    }, homeSection);

    homeInitialized = true;
    ScrollTrigger.refresh();
  }

  /* ================================================================
     PART 7 — Preserved @Omkarnub Animated Signature Footer
     ================================================================ */
  function initFooterSignature() {
    const footer = document.getElementById('homeFooter');
    if (!footer) return;
    const svg = document.getElementById('signatureSvg');
    if (!svg) return;

    const maskPaths = Array.from(svg.querySelectorAll('.sig-mask-path'));
    const strokePaths = Array.from(svg.querySelectorAll('.sig-stroke-path'));
    if (!maskPaths.length || !strokePaths.length) return;

    const duration = 1.5;
    const charDelay = 0.2;

    function resetToHidden() {
      maskPaths.forEach((maskP, i) => {
        const strokeP = strokePaths[i];
        let len = 300;
        try { len = Math.ceil(maskP.getTotalLength() || 300); } catch (e) {}
        gsap.set(maskP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
        if (strokeP) gsap.set(strokeP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
      });
    }

    function buildSignatureTimeline() {
      if (signatureTimeline) signatureTimeline.kill();
      resetToHidden();
      signatureTimeline = gsap.timeline({ paused: true });

      maskPaths.forEach((maskP, i) => {
        const strokeP = strokePaths[i];
        let len = 300;
        try { len = Math.ceil(maskP.getTotalLength() || 300); } catch (e) {}
        const startTime = i * charDelay;

        signatureTimeline.set(maskP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 }, 0);
        if (strokeP) signatureTimeline.set(strokeP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 }, 0);

        signatureTimeline.to(maskP, { opacity: 1, duration: 0.01 }, startTime + 0.01);
        if (strokeP) signatureTimeline.to(strokeP, { opacity: 1, duration: 0.01 }, startTime + 0.01);

        signatureTimeline.to(maskP, { strokeDashoffset: 0, duration, ease: 'power1.inOut' }, startTime);
        if (strokeP) signatureTimeline.to(strokeP, { strokeDashoffset: 0, duration, ease: 'power1.inOut' }, startTime);
      });
    }

    buildSignatureTimeline();
    let isAtBottom = false;
    function playSignature() {
      buildSignatureTimeline();
      signatureTimeline.play(0);
    }

    if (signatureObserver) signatureObserver.disconnect();
    if ('IntersectionObserver' in window) {
      signatureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isAtBottom) { isAtBottom = true; playSignature(); }
          } else {
            isAtBottom = false;
          }
        });
      }, { threshold: 0.1 });
      signatureObserver.observe(footer);
    } else {
      playSignature();
    }

    if (!footerScrollListenerAttached) {
      footerScrollListenerAttached = true;
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const homePage = document.getElementById('page-home');
            if (homePage && homePage.classList.contains('active')) {
              const scrollBottom = window.innerHeight + window.scrollY;
              const totalHeight = document.documentElement.scrollHeight;
              if (totalHeight - scrollBottom < 80) {
                if (!isAtBottom) { isAtBottom = true; playSignature(); }
              } else if (totalHeight - scrollBottom > 350) {
                isAtBottom = false;
              }
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    const sigBtn = footer.querySelector('#homeFooterSig') || footer.querySelector('.home-footer-caption-wrap');
    if (sigBtn && !sigBtn.dataset.sigBound) {
      sigBtn.dataset.sigBound = 'true';
      let clickTimer = null;
      const openRepo = () => window.open('https://github.com/omkarnub/friction', '_blank', 'noopener,noreferrer');

      sigBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; openRepo(); }
        else { clickTimer = setTimeout(() => { clickTimer = null; playSignature(); }, 280); }
      });
      sigBtn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        openRepo();
      });
      sigBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playSignature(); }
      });
    }
  }

  /* ================================================================
     PART 8 — Lifecycle & Global Hooks
     ================================================================ */
  window.triggerLaunchTransition = triggerLaunchTransition;
  window.triggerPageTransition = triggerPageTransition;
  window.replayLaunchIntro = replayLaunchIntro;
  window.initHomeScrollChoreography = initHomeScrollChoreography;
  window.destroyHomeScrollChoreography = destroyHomeScrollChoreography;

  function boot() {
    initSplashInteractions();
    const replayBtn = document.getElementById('hsReplayIntroBtn');
    if (replayBtn) replayBtn.addEventListener('click', () => replayLaunchIntro());

    if (!document.body.classList.contains('pre-launch')) {
      const home = document.getElementById('page-home');
      if (home && home.classList.contains('active')) {
        initHomeScrollChoreography();
      }
    }
  }

  window.addEventListener('pagechange', (e) => {
    const page = e.detail && e.detail.page;
    if (page === 'home') {
      if (!document.body.classList.contains('pre-launch')) {
        requestAnimationFrame(() => initHomeScrollChoreography());
      }
    } else {
      destroyHomeScrollChoreography();
    }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (homeInitialized && window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
