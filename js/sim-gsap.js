/**
 * sim-gsap.js — Museum-Grade GSAP Hardware Polish & 60fps FX Layer for #page-simulate
 * (Clean 1:1 full-frame apparatus, zero camera zoom clutter)
 */
(function () {
  'use strict';

  const toRad = (d) => (d * Math.PI) / 180;
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================
     1. Synthesized Web Audio FX (Opt-in via #simSoundToggle)
     ================================================================ */
  let simAudioOn = false;
  let simAudioCtx = null;

  function ensureAudio() {
    if (!simAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AC = window.AudioContext || window.webkitAudioContext;
      simAudioCtx = new AC();
    }
    if (simAudioCtx && simAudioCtx.state === 'suspended') {
      simAudioCtx.resume().catch(() => {});
    }
  }

  function playTone(freqStart, freqEnd, dur, vol, type) {
    if (!simAudioOn || !simAudioCtx) return;
    try {
      const now = simAudioCtx.currentTime;
      const osc = simAudioCtx.createOscillator();
      const gain = simAudioCtx.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.01);
      osc.connect(gain);
      gain.connect(simAudioCtx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.015);
    } catch (e) {}
  }

  const sfxTick = (pitch) => playTone(pitch || 1100, 340, 0.018, 0.03, 'triangle');
  const sfxClink = () => playTone(1650, 720, 0.055, 0.045, 'sine');
  const sfxSlip = () => playTone(460, 95, 0.095, 0.075, 'sawtooth');
  const sfxLog = () => {
    playTone(660, 990, 0.06, 0.04, 'sine');
    setTimeout(() => playTone(990, 1320, 0.08, 0.04, 'sine'), 65);
  };

  /* ================================================================
     2. 60fps Particle & Shockwave Canvas Overlay Engine
     ================================================================ */
  function createFxOverlay(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return { burst: () => {}, ring: () => {} };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { burst: () => {}, ring: () => {} };

    let w = 600, h = 400, dpr = 1;
    let raf = null;
    const particles = [];
    const rings = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function runLoop() {
      if (!particles.length && !rings.length) {
        ctx.clearRect(0, 0, w, h);
        raf = null;
        return;
      }
      ctx.clearRect(0, 0, w, h);

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.radius += (r.maxR - r.radius) * 0.14;
        r.alpha -= 0.03;
        if (r.alpha <= 0.01) { rings.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${r.rgb}, ${r.alpha.toFixed(2)})`;
        ctx.lineWidth = r.lineWidth;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.97; p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(${p.rgb}, ${p.life.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(runLoop);
    }

    function ensureLoop() { resize(); if (!raf) raf = requestAnimationFrame(runLoop); }

    return {
      burst: (nx, ny, count, rgb) => {
        if (prefersReducedMotion()) return;
        resize();
        const cx = nx * w, cy = ny * h, color = rgb || '212, 148, 58';
        for (let i = 0; i < (count || 24); i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1.8 + Math.random() * 5.0;
          particles.push({ x: cx, y: cy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1.3, size: 1.5 + Math.random() * 2.2, life: 1, decay: 0.02 + Math.random() * 0.02, rgb: color });
        }
        ensureLoop();
      },
      ring: (nx, ny, maxR, rgb) => {
        if (prefersReducedMotion()) return;
        resize();
        rings.push({ x: nx * w, y: ny * h, radius: 6, maxR: maxR || 90, alpha: 0.85, lineWidth: 2, rgb: rgb || '212, 148, 58' });
        ensureLoop();
      }
    };
  }

  /* ================================================================
     3. Floating Hardware Status Banner Helper
     ================================================================ */
  function setBannerState(bannerId, visible, title, sub) {
    const el = document.getElementById(bannerId);
    if (!el) return;
    const tEl = el.querySelector('.sim-banner-title');
    const sEl = el.querySelector('.sim-banner-sub');
    if (tEl && title) tEl.textContent = title;
    if (sEl && sub !== undefined) sEl.textContent = sub;

    const wasVisible = el.classList.contains('is-visible');
    if (visible === wasVisible) return;

    el.classList.toggle('is-visible', !!visible);
    if (!window.gsap || prefersReducedMotion()) return;

    if (visible) {
      gsap.fromTo(el,
        { y: -18, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(1.7)', clearProps: 'transform' }
      );
    } else {
      gsap.to(el, { y: -10, opacity: 0, duration: 0.22, ease: 'power2.in' });
    }
  }

  /* ================================================================
     4. GSAP UI & Tactile Hardware Micro-Animations
     ================================================================ */
  function animateSimEntrance() {
    if (!window.gsap || prefersReducedMotion()) return;
    const page = document.getElementById('page-simulate');
    if (!page || !page.classList.contains('active')) return;

    const headerBar = page.querySelector('.sim-header-bar');
    const activePanel = page.querySelector('.tab-panel.active');
    const controls = activePanel ? activePanel.querySelector('.sim-controls') : null;
    const viewport = activePanel ? activePanel.querySelector('.sim-viewport') : null;
    const readouts = activePanel ? activePanel.querySelectorAll('.sim-readout-item') : [];

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (headerBar) tl.fromTo(headerBar, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, clearProps: 'transform' }, 0);
    if (controls) tl.fromTo(controls, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, clearProps: 'transform' }, 0.06);
    if (viewport) tl.fromTo(viewport, { scale: 0.975, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.54, clearProps: 'transform' }, 0.1);
    if (readouts.length) tl.fromTo(readouts, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, clearProps: 'transform' }, 0.18);

    requestAnimationFrame(() => updateTabGlider(true));
  }

  function updateTabGlider(instant) {
    const tabs = document.getElementById('simTabs');
    if (!tabs) return;
    let glider = tabs.querySelector('.sim-tab-glider');
    if (!glider) {
      glider = document.createElement('span');
      glider.className = 'sim-tab-glider';
      glider.setAttribute('aria-hidden', 'true');
      tabs.prepend(glider);
    }
    const activeBtn = tabs.querySelector('.tab-btn.active');
    if (!activeBtn || !activeBtn.offsetWidth) return;

    if (!window.gsap || instant || prefersReducedMotion()) {
      glider.style.width = activeBtn.offsetWidth + 'px';
      glider.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    } else {
      gsap.to(glider, { x: activeBtn.offsetLeft, width: activeBtn.offsetWidth, duration: 0.36, ease: 'power3.out' });
    }
  }

  function triggerScanline(viewportEl) {
    if (!viewportEl || !window.gsap || prefersReducedMotion()) return;
    const scan = viewportEl.querySelector('.sim-scanline');
    if (!scan) return;
    gsap.killTweensOf(scan);
    gsap.fromTo(scan, { xPercent: -110, opacity: 0.85 }, { xPercent: 110, opacity: 0, duration: 0.52, ease: 'power2.inOut' });
  }

  function animateBlockDrop(blockId) {
    if (!window.gsap || prefersReducedMotion()) return;
    const el = document.getElementById(blockId);
    if (!el) return;
    gsap.fromTo(el, { y: -18, opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.5, ease: 'bounce.out', clearProps: 'transform' });
  }

  function animateLatestWeightDisc() {
    if (!window.gsap || prefersReducedMotion()) return;
    const discs = document.querySelectorAll('#frictionSlottedWeights .pan-slotted-disc');
    if (!discs.length) return;
    const topDisc = discs[discs.length - 1];
    gsap.fromTo(topDisc, { y: -22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: 'bounce.out', clearProps: 'transform' });
  }

  function triggerImpactJolt(viewportEl, amp) {
    if (!viewportEl || !window.gsap || prefersReducedMotion()) return;
    const a = amp || 4;
    gsap.timeline()
      .to(viewportEl, { x: -a, y: a * 0.5, duration: 0.045, ease: 'power2.out' })
      .to(viewportEl, { x: a * 0.8, y: -a * 0.4, duration: 0.05, ease: 'power2.out' })
      .to(viewportEl, { x: 0, y: 0, duration: 0.14, ease: 'power3.out', clearProps: 'transform' });
  }

  function popMuReadout(ids) {
    if (!window.gsap || prefersReducedMotion()) return;
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      gsap.fromTo(el, { scale: 1 }, { scale: 1.14, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' });
    });
  }

  function flyToDataLog(sourceBtn) {
    if (!sourceBtn || !window.gsap || prefersReducedMotion()) return;
    const logTab = document.querySelector('label[for="nav-radio-log"]');
    if (!logTab) return;
    const srcRect = sourceBtn.getBoundingClientRect();
    const dstRect = logTab.getBoundingClientRect();
    if (!dstRect.width) return;

    const ping = document.createElement('span');
    ping.className = 'sim-log-ping';
    document.body.appendChild(ping);

    gsap.set(ping, { x: srcRect.left + srcRect.width / 2, y: srcRect.top + srcRect.height / 2, scale: 1, opacity: 1 });
    gsap.to(ping, {
      x: dstRect.left + dstRect.width / 2,
      y: dstRect.top + dstRect.height / 2,
      scale: 0.35,
      opacity: 0.2,
      duration: 0.62,
      ease: 'power3.inOut',
      onComplete: () => {
        ping.remove();
        gsap.fromTo(logTab, { scale: 1 }, { scale: 1.14, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' });
      }
    });
  }

  /* ================================================================
     5. Boot & Bind Simulator Hardware Polish
     ================================================================ */
  function initSimGsap() {
    const simPage = document.getElementById('page-simulate');
    if (!simPage) return;

    const reposeFx = createFxOverlay('reposeFxCanvas');
    const frictionFx = createFxOverlay('frictionFxCanvas');
    const reposeViewport = document.querySelector('#tab-repose .sim-viewport');
    const frictionViewport = document.querySelector('#tab-friction .sim-viewport');

    // A) Sound Toggle
    const soundToggle = document.getElementById('simSoundToggle');
    const soundStatus = document.getElementById('simSoundStatus');
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        simAudioOn = soundToggle.checked;
        if (soundStatus) {
          soundStatus.textContent = simAudioOn ? 'ON' : 'OFF';
          soundStatus.classList.toggle('active', simAudioOn);
        }
        if (simAudioOn) { ensureAudio(); sfxTick(1400); }
      });
    }

    // B) Magnetic Sliding Tab Glider
    const simTabs = document.getElementById('simTabs');
    if (simTabs) {
      updateTabGlider(true);
      simTabs.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          sfxTick(1280);
          requestAnimationFrame(() => {
            updateTabGlider(false);
            const panel = document.getElementById('tab-' + btn.getAttribute('data-tab'));
            if (panel && window.gsap && !prefersReducedMotion()) {
              gsap.fromTo(panel, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.36, ease: 'power3.out', clearProps: 'transform' });
            }
          });
        });
      });
      window.addEventListener('resize', () => updateTabGlider(true), { passive: true });
    }

    if (typeof window.selectSimTab === 'function') {
      const origSelect = window.selectSimTab;
      window.selectSimTab = function (tabName) {
        origSelect(tabName);
        requestAnimationFrame(() => updateTabGlider(false));
      };
    }

    // Tactile GSAP spring detent on all +/- stepper buttons
    simPage.querySelectorAll('.slider-step-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        sfxTick(1180);
        if (window.gsap && !prefersReducedMotion()) {
          gsap.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: 0.28, ease: 'back.out(2.2)', clearProps: 'transform' });
        }
      });
    });

    // C) Angle of Repose Live Sync
    let reposeWasSlipping = false;
    let lastRepDeg = 0;
    const reposeAngleSlider = document.getElementById('reposeAngle');
    const reposeWeightSlider = document.getElementById('reposeWeight');
    const reposeStatusEl = document.getElementById('reposeReadoutStatus');

    function syncReposeInstruments() {
      const deg = reposeAngleSlider ? parseFloat(reposeAngleSlider.value) || 0 : 0;
      const w = reposeWeightSlider ? parseFloat(reposeWeightSlider.value) || 5 : 5;
      const rad = toRad(deg);
      const txt = reposeStatusEl ? (reposeStatusEl.textContent || '').toLowerCase() : '';
      const slipping = txt.includes('slip');

      const hudN = document.getElementById('reposeHudN');
      const hudS = document.getElementById('reposeHudS');
      if (hudN) hudN.textContent = (w * Math.cos(rad)).toFixed(2) + ' N';
      if (hudS) hudS.textContent = (w * Math.sin(rad)).toFixed(2) + ' N';

      if (reposeViewport) reposeViewport.classList.toggle('is-triggered', slipping);

      if (slipping) {
        const muTxt = document.getElementById('reposeMu') ? document.getElementById('reposeMu').textContent : '';
        setBannerState('reposeLiveBanner', true, 'CRITICAL SLIP DETECTED', `α = ${deg.toFixed(1)}° · μ = ${muTxt}`);
      } else {
        setBannerState('reposeLiveBanner', false);
      }
    }

    if (reposeAngleSlider) {
      reposeAngleSlider.addEventListener('input', () => {
        const v = parseFloat(reposeAngleSlider.value) || 0;
        if (Math.abs(v - lastRepDeg) >= 2) { lastRepDeg = v; sfxTick(1000 + v * 12); }
        requestAnimationFrame(syncReposeInstruments);
      });
    }
    if (reposeWeightSlider) reposeWeightSlider.addEventListener('input', () => requestAnimationFrame(syncReposeInstruments));

    if (reposeStatusEl) {
      new MutationObserver(() => {
        const txt = (reposeStatusEl.textContent || '').toLowerCase();
        const isSlipping = txt.includes('slip');
        if (isSlipping && !reposeWasSlipping) {
          reposeWasSlipping = true;
          sfxSlip();
          triggerImpactJolt(reposeViewport, 4.2);
          reposeFx.burst(0.46, 0.56, 26, '212, 148, 58');
          reposeFx.ring(0.46, 0.56, 95, '212, 148, 58');
          popMuReadout(['reposeMu', 'reposeReadoutMu']);
        } else if (!isSlipping) {
          reposeWasSlipping = false;
        }
        syncReposeInstruments();
      }).observe(reposeStatusEl, { childList: true, subtree: true, characterData: true });
    }

    // D) Friction Plane Live Sync
    let frictionWasMoving = false;
    const frictionAngleSlider = document.getElementById('frictionAngle');
    const frictionWeightSlider = document.getElementById('frictionWeight');
    const frictionForceSlider = document.getElementById('frictionForce');
    const frictionStatusEl = document.getElementById('frictionReadoutStatus');

    function syncFrictionInstruments() {
      const deg = frictionAngleSlider ? parseFloat(frictionAngleSlider.value) || 0 : 0;
      const w = frictionWeightSlider ? parseFloat(frictionWeightSlider.value) || 5 : 5;
      const p = frictionForceSlider ? parseFloat(frictionForceSlider.value) || 0 : 0;
      const rad = toRad(deg);
      const txt = frictionStatusEl ? (frictionStatusEl.textContent || '').toLowerCase() : '';
      const moving = txt.includes('moving') || txt.includes('impending') || txt.includes('sliding');

      const hudN = document.getElementById('frictionHudN');
      const hudP = document.getElementById('frictionHudP');
      if (hudN) hudN.textContent = (w * Math.cos(rad)).toFixed(2) + ' N';
      if (hudP) hudP.textContent = p.toFixed(2) + ' N';

      if (frictionViewport) frictionViewport.classList.toggle('is-triggered', moving);

      if (moving) {
        const muTxt = document.getElementById('frictionMu') ? document.getElementById('frictionMu').textContent : '';
        const headline = deg > 0 ? 'IMPENDING ASCENT · MOVING UP' : 'THRESHOLD REACHED · SLIDING';
        setBannerState('frictionLiveBanner', true, headline, `P = ${p.toFixed(2)} N · μ = ${muTxt}`);
      } else {
        setBannerState('frictionLiveBanner', false);
      }
    }

    if (frictionForceSlider) frictionForceSlider.addEventListener('input', () => requestAnimationFrame(syncFrictionInstruments));
    if (frictionAngleSlider) frictionAngleSlider.addEventListener('input', () => requestAnimationFrame(syncFrictionInstruments));
    if (frictionWeightSlider) frictionWeightSlider.addEventListener('input', () => requestAnimationFrame(syncFrictionInstruments));

    if (frictionStatusEl) {
      new MutationObserver(() => {
        const txt = (frictionStatusEl.textContent || '').toLowerCase();
        const isMoving = txt.includes('moving') || txt.includes('impending') || txt.includes('sliding');
        if (isMoving && !frictionWasMoving) {
          frictionWasMoving = true;
          sfxSlip();
          triggerImpactJolt(frictionViewport, 3.2);
          frictionFx.ring(0.72, 0.36, 82, '212, 148, 58');
          frictionFx.burst(0.42, 0.58, 20, '212, 148, 58');
          popMuReadout(['frictionMu', 'frictionReadoutMu']);
        } else if (!isMoving) {
          frictionWasMoving = false;
        }
        syncFrictionInstruments();
      }).observe(frictionStatusEl, { childList: true, subtree: true, characterData: true });
    }

    // E) Quick-Add Slotted Weights -> Brass Disc Bounce Drop + Metallic Clink
    simPage.querySelectorAll('[data-add-p]').forEach((chip) => {
      chip.addEventListener('click', () => {
        sfxClink();
        if (window.gsap && !prefersReducedMotion()) {
          gsap.fromTo(chip, { scale: 0.92 }, { scale: 1, duration: 0.32, ease: 'elastic.out(1.2, 0.45)', clearProps: 'transform' });
        }
        frictionFx.ring(0.76, 0.62, 48, '212, 148, 58');
        requestAnimationFrame(() => {
          animateLatestWeightDisc();
          syncFrictionInstruments();
        });
      });
    });

    // F) Material Swaps -> Scanline Sweep + Block Bounce Drop-In
    const repMat = document.getElementById('reposeMaterial');
    if (repMat) {
      repMat.addEventListener('change', () => {
        sfxTick(1350);
        triggerScanline(reposeViewport);
        requestAnimationFrame(() => animateBlockDrop('reposeBlock'));
      });
    }
    const fricMat = document.getElementById('frictionMaterial');
    if (fricMat) {
      fricMat.addEventListener('change', () => {
        sfxTick(1350);
        triggerScanline(frictionViewport);
        requestAnimationFrame(() => animateBlockDrop('frictionBlock'));
      });
    }

    ['reposeAddTrial', 'frictionAddTrial'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => { sfxLog(); flyToDataLog(btn); });
    });

    ['reposeResetBtn', 'frictionResetBtn'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => {
        sfxTick(880);
        triggerScanline(id.startsWith('repose') ? reposeViewport : frictionViewport);
      });
    });

    syncReposeInstruments();
    syncFrictionInstruments();

    window.addEventListener('pagechange', (e) => {
      if (e.detail && e.detail.page === 'simulate') {
        requestAnimationFrame(() => {
          animateSimEntrance();
          syncReposeInstruments();
          syncFrictionInstruments();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimGsap);
  } else {
    initSimGsap();
  }
})();
