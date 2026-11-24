/**
 * pages-gsap.js — Awwwards-tier GSAP choreography & interactive polish for:
 *   1. Methods (#page-methods) — live GSAP-animated CAD apparatus diagrams
 *   2. Reference (#page-reference) — animated μ spectrum range bars & category filter
 *   3. Data Log (#page-log) — telemetry console entrances & chart draw-in
 *   4. Theory (#page-theory) — monograph reveals & chapter scrollspy
 *   5. Compare (#page-compare) — VS telemetry reveals & animated bar growth
 *   6. How to Use (#page-how-to-use) — magnetic variant transitions & image lightbox
 *   7. Contributors (#page-contributors) — uniform architectural cards, spotlight tilt & sheen
 */
(function () {
  'use strict';

  const hasGsap = () => typeof window.gsap !== 'undefined';

  /* ================================================================
     Shared Hero Reveal Helper
     ================================================================ */
  function revealHero(page) {
    if (!hasGsap() || !page) return;
    const gsap = window.gsap;
    const items = page.querySelectorAll('.pg-eyebrow, .pg-hero-title, .pg-hero-sub, .log-telemetry-bar');
    if (items.length) {
      gsap.fromTo(
        items,
        { y: 26, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.72, stagger: 0.08, ease: 'power4.out', clearProps: 'clipPath', overwrite: 'auto' }
      );
    }
  }

  /* ================================================================
     1. METHODS PAGE — Live GSAP-Animated CAD Apparatus + Entrances
     ================================================================ */
  let reposeLoopTl = null;
  let frictionLoopTl = null;

  function buildMethodsDiagrams() {
    if (!hasGsap()) return;
    const gsap = window.gsap;

    const rBeam = document.getElementById('methReposePivot');
    const rBlock = document.getElementById('methReposeBlock');
    const rAngleTxt = document.getElementById('methReposeAngleVal');
    const rStateBadge = document.getElementById('methReposeStatus');
    const rArc = document.getElementById('methReposeArc');

    if (rBeam && rBlock) {
      if (reposeLoopTl) reposeLoopTl.kill();
      const state = { deg: 6 };

      function syncReposeArc(deg) {
        if (rAngleTxt) rAngleTxt.textContent = `α = ${deg.toFixed(1)}°`;
        if (rArc) {
          const rad = (deg * Math.PI) / 180;
          const R = 58;
          const ex = 72 + R * Math.cos(-rad);
          const ey = 186 + R * Math.sin(-rad);
          rArc.setAttribute('d', `M ${72 + R} 186 A ${R} ${R} 0 0 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`);
        }
      }

      gsap.set(rBeam, { svgOrigin: '72 186', rotation: -6 });
      gsap.set(rBlock, { x: 0 });
      syncReposeArc(6);

      reposeLoopTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      reposeLoopTl
        .call(() => {
          if (rStateBadge) {
            rStateBadge.textContent = 'HOLDING · STATIC';
            rStateBadge.setAttribute('fill', 'currentColor');
          }
        })
        .to(state, {
          deg: 26.5,
          duration: 2.6,
          ease: 'power1.inOut',
          onUpdate: () => {
            gsap.set(rBeam, { rotation: -state.deg });
            syncReposeArc(state.deg);
          }
        })
        .call(() => {
          if (rStateBadge) {
            rStateBadge.textContent = 'THRESHOLD · SLIP (μ = tan α)';
            rStateBadge.setAttribute('fill', 'var(--hx-spark, #d4943a)');
          }
        })
        .to(rBlock, { x: -92, duration: 1.05, ease: 'power2.in' }, '+=0.2')
        .to(rBlock, { opacity: 0, duration: 0.25 }, '-=0.15')
        .set(rBlock, { x: 0, opacity: 1 })
        .to(state, {
          deg: 6,
          duration: 0.85,
          ease: 'power2.out',
          onUpdate: () => {
            gsap.set(rBeam, { rotation: -state.deg });
            syncReposeArc(state.deg);
          }
        });
    }

    const fBlock = document.getElementById('methFricBlock');
    const fPan = document.getElementById('methFricPan');
    const fStringTop = document.getElementById('methFricStrTop');
    const fStringDown = document.getElementById('methFricStrDown');
    const fPulley = document.getElementById('methFricPulleySpokes');
    const fLoadTxt = document.getElementById('methFricLoadVal');
    const fStateBadge = document.getElementById('methFricStatus');
    const fW1 = document.getElementById('methFricWeight1');
    const fW2 = document.getElementById('methFricWeight2');

    if (fBlock && fPan) {
      if (frictionLoopTl) frictionLoopTl.kill();

      const syncFrictionRig = (travel) => {
        const cosA = 0.9135, sinA = 0.4067;
        const bx = travel * cosA;
        const by = -travel * sinA;
        gsap.set(fBlock, { x: bx, y: by });
        gsap.set(fPan, { y: travel * 0.72 });
        if (fPulley) gsap.set(fPulley, { svgOrigin: '286 78', rotation: travel * 3.8 });
        if (fStringTop) {
          fStringTop.setAttribute('x1', (168 + bx).toFixed(1));
          fStringTop.setAttribute('y1', (126 + by).toFixed(1));
        }
        if (fStringDown) {
          fStringDown.setAttribute('y2', (154 + travel * 0.72).toFixed(1));
        }
      };

      const fState = { travel: 0 };
      syncFrictionRig(0);
      if (fW1) gsap.set(fW1, { y: -22, opacity: 0 });
      if (fW2) gsap.set(fW2, { y: -22, opacity: 0 });

      frictionLoopTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      frictionLoopTl
        .call(() => {
          if (fLoadTxt) fLoadTxt.textContent = 'P = 1.5 N';
          if (fStateBadge) {
            fStateBadge.textContent = 'STATIC · LOADING PAN';
            fStateBadge.setAttribute('fill', 'currentColor');
          }
        })
        .to(fW1, { y: 0, opacity: 1, duration: 0.45, ease: 'bounce.out' }, '+=0.35')
        .call(() => { if (fLoadTxt) fLoadTxt.textContent = 'P = 3.2 N'; })
        .to(fW2, { y: 0, opacity: 1, duration: 0.45, ease: 'bounce.out' }, '+=0.45')
        .call(() => {
          if (fLoadTxt) fLoadTxt.textContent = 'P = 4.9 N';
          if (fStateBadge) {
            fStateBadge.textContent = 'LIMITING PULL · MOVING UP';
            fStateBadge.setAttribute('fill', 'var(--hx-spark, #d4943a)');
          }
        })
        .to(fState, {
          travel: 54,
          duration: 1.25,
          ease: 'power2.inOut',
          onUpdate: () => syncFrictionRig(fState.travel)
        }, '+=0.2')
        .to([fW1, fW2], { opacity: 0, duration: 0.25 }, '+=0.6')
        .to(fState, {
          travel: 0,
          duration: 0.7,
          ease: 'power2.out',
          onUpdate: () => syncFrictionRig(fState.travel)
        })
        .set([fW1, fW2], { y: -22 });
    }
  }

  function animateMethodsPage() {
    if (!hasGsap()) return;
    const page = document.getElementById('page-methods');
    if (!page) return;
    revealHero(page);
    window.gsap.fromTo(
      page.querySelectorAll('.meth-showcase, .meth-matrix-wrap'),
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.72, stagger: 0.14, delay: 0.16, ease: 'power3.out', overwrite: 'auto' }
    );
    buildMethodsDiagrams();
  }

  function pauseMethodsDiagrams() {
    if (reposeLoopTl) reposeLoopTl.pause();
    if (frictionLoopTl) frictionLoopTl.pause();
  }

  /* ================================================================
     2. REFERENCE PAGE — Spectrum Bar Animation & Interactive Filter
     ================================================================ */
  let refFilterBound = false;

  function bindReferenceFilter() {
    if (refFilterBound) return;
    const bar = document.getElementById('refFilterBar');
    const tbody = document.querySelector('#referenceTable tbody');
    if (!bar || !tbody) return;
    refFilterBound = true;

    bar.querySelectorAll('.ref-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tier;
        bar.querySelectorAll('.ref-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const visible = [];
        rows.forEach(tr => {
          const match = tier === 'all' || tr.dataset.tier === tier;
          tr.style.display = match ? '' : 'none';
          if (match) visible.push(tr);
        });
        if (hasGsap() && visible.length) {
          window.gsap.fromTo(visible, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, ease: 'power3.out', overwrite: 'auto' });
          animateRefBars(visible);
        }
      });
    });
  }

  function animateRefBars(scopeRows) {
    if (!hasGsap()) return;
    const fills = scopeRows
      ? scopeRows.map(r => r.querySelector('.ref-bar-fill')).filter(Boolean)
      : Array.from(document.querySelectorAll('#referenceTable .ref-bar-fill'));
    if (fills.length) {
      window.gsap.fromTo(
        fills,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.75, stagger: 0.05, ease: 'power3.out', overwrite: 'auto' }
      );
    }
  }

  function animateReferencePage() {
    if (!hasGsap()) return;
    const page = document.getElementById('page-reference');
    if (!page) return;
    bindReferenceFilter();
    revealHero(page);
    window.gsap.fromTo(
      page.querySelectorAll('.ref-filter-bar, .ref-table-wrap, .ref-note-band'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.62, stagger: 0.09, delay: 0.14, ease: 'power3.out', overwrite: 'auto' }
    );
    window.gsap.fromTo(
      page.querySelectorAll('#referenceTable tbody tr'),
      { x: -12, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, stagger: 0.04, delay: 0.22, ease: 'power3.out', overwrite: 'auto' }
    );
    setTimeout(() => animateRefBars(), 220);
  }

  /* ================================================================
     3. DATA LOG PAGE — Telemetry Console Entrances & Chart Draw-In
     ================================================================ */
  function syncLogFormulaChip() {
    const sel = document.getElementById('logMethod');
    const chip = document.getElementById('logActiveFormula');
    if (!sel || !chip) return;
    chip.innerHTML = sel.value === 'friction'
      ? '<span class="sym">μ</span> = (P − W sin <span class="sym">θ</span>) / (W cos <span class="sym">θ</span>)'
      : '<span class="sym">μ</span> = tan <span class="sym">α</span>';
    if (hasGsap()) {
      window.gsap.fromTo(chip, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    }
  }

  function animateDataLogPage() {
    if (!hasGsap()) return;
    const page = document.getElementById('page-log');
    if (!page) return;
    syncLogFormulaChip();
    revealHero(page);
    window.gsap.fromTo(
      page.querySelectorAll('.log-header, .log-entry-form:not(.hidden), #logTableWrapper, #logSummary, #logChart'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.62, stagger: 0.08, delay: 0.12, ease: 'power3.out', overwrite: 'auto' }
    );
    animateDataLogChart();
  }

  function animateDataLogChart() {
    if (!hasGsap()) return;
    const svg = document.getElementById('logChartSvg');
    if (!svg) return;
    const path = svg.querySelector('.chart-animated-path');
    if (path && typeof path.getTotalLength === 'function') {
      const len = path.getTotalLength();
      window.gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', overwrite: 'auto' }
      );
    }
    const pts = svg.querySelectorAll('.chart-animated-point');
    if (pts.length) {
      window.gsap.fromTo(
        pts,
        { scale: 0, transformOrigin: 'center center' },
        { scale: 1, duration: 0.42, stagger: 0.055, ease: 'back.out(2)', overwrite: 'auto' }
      );
    }
  }

  /* ================================================================
     4. THEORY PAGE — Monograph Reveals & Scrollspy
     ================================================================ */
  let theoryObserver = null;

  function animateTheoryPage() {
    if (!hasGsap()) return;
    const page = document.getElementById('page-theory');
    if (!page) return;
    revealHero(page);
    window.gsap.fromTo(
      page.querySelectorAll('.th-chapter-rail, .th-chapter'),
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.68, stagger: 0.1, delay: 0.15, ease: 'power3.out', overwrite: 'auto' }
    );

    if (theoryObserver) theoryObserver.disconnect();
    const chapters = page.querySelectorAll('.th-chapter');
    const railBtns = page.querySelectorAll('.th-rail-btn');
    if (chapters.length && railBtns.length && 'IntersectionObserver' in window) {
      theoryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            railBtns.forEach(b => b.classList.toggle('active', b.dataset.target === id));
          }
        });
      }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
      chapters.forEach(ch => theoryObserver.observe(ch));
    }
  }

  /* ================================================================
     5. COMPARE PAGE — VS Telemetry Choreography & Chart Bar Growth
     ================================================================ */
  function animateCompareBars() {
    if (!hasGsap()) return;
    const svg = document.getElementById('compareChartSvg');
    if (!svg) return;
    const bars = svg.querySelectorAll('.cmp-bar-rect');
    if (bars.length) {
      window.gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: 'bottom center' },
        { scaleY: 1, duration: 0.72, stagger: 0.12, ease: 'power3.out', overwrite: 'auto' }
      );
    }
  }

  function animateComparePage() {
    if (!hasGsap()) return;
    const page = document.getElementById('page-compare');
    if (!page) return;
    revealHero(page);
    window.gsap.fromTo(
      page.querySelectorAll('.cmp-toolbar, .cmp-card, .cmp-vs-node, #compareResult, #compareChart'),
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.62, stagger: 0.08, delay: 0.14, ease: 'power3.out', overwrite: 'auto' }
    );
    animateCompareBars();
  }

  /* ================================================================
     6. HOW TO USE PAGE — Smooth Variant Switch + Image Lightbox
     ================================================================ */
  let manualEnhancementsBound = false;

  function bindManualEnhancements() {
    if (manualEnhancementsBound) return;
    const page = document.getElementById('page-how-to-use');
    if (!page) return;
    manualEnhancementsBound = true;

    // Animate cards when toggling Desktop / Mobile guide
    const toggleBtns = page.querySelectorAll('.manual-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!hasGsap()) return;
        setTimeout(() => {
          const activeView = page.querySelector('.manual-content-view.active');
          if (activeView) {
            window.gsap.fromTo(
              activeView.querySelectorAll('.manual-step-card'),
              { y: 22, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.52, stagger: 0.08, ease: 'power3.out', overwrite: 'auto' }
            );
          }
        }, 20);
      });
    });

    // Click-to-inspect lightbox for manual screenshots
    let lightbox = document.getElementById('manualLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'manualLightbox';
      lightbox.className = 'manual-lightbox';
      lightbox.innerHTML = `
        <button type="button" class="manual-lb-close" aria-label="Close preview">✕</button>
        <img class="manual-lb-img" alt="Enlarged guide screenshot">
        <div class="manual-lb-cap"></div>
      `;
      document.body.appendChild(lightbox);

      const closeLb = () => {
        if (hasGsap()) {
          window.gsap.to(lightbox, {
            opacity: 0, duration: 0.2, ease: 'power2.in',
            onComplete: () => { lightbox.classList.remove('open'); lightbox.style.opacity = ''; }
          });
        } else {
          lightbox.classList.remove('open');
        }
      };
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('manual-lb-close')) closeLb();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLb();
      });
    }

    page.querySelectorAll('.manual-img-wrap').forEach(wrap => {
      wrap.style.cursor = 'zoom-in';
      wrap.addEventListener('click', () => {
        const img = wrap.querySelector('img');
        const cap = wrap.closest('figure') ? wrap.closest('figure').querySelector('figcaption') : null;
        if (!img) return;
        lightbox.querySelector('.manual-lb-img').src = img.src;
        lightbox.querySelector('.manual-lb-cap').textContent = cap ? cap.textContent : img.alt;
        lightbox.classList.add('open');
        if (hasGsap()) {
          window.gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
          window.gsap.fromTo(lightbox.querySelector('.manual-lb-img'), { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' });
        }
      });
    });
  }

  function animateHowToUsePage() {
    if (!hasGsap()) return;
    const page = document.getElementById('page-how-to-use');
    if (!page) return;
    bindManualEnhancements();
    revealHero(page);
    window.gsap.fromTo(
      page.querySelectorAll('.manual-view-toggle-bar, .manual-content-view.active .manual-step-card'),
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, stagger: 0.09, delay: 0.14, ease: 'power3.out', overwrite: 'auto' }
    );
  }

  /* ================================================================
     7. CONTRIBUTORS PAGE — Uniform Cards + Kinetic GSAP Choreography
     ================================================================ */
  let contribInteractiveBound = false;

  function bindContributorsInteractions() {
    if (contribInteractiveBound) return;
    const page = document.getElementById('page-contributors');
    if (!page) return;
    contribInteractiveBound = true;

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const cards = page.querySelectorAll('.cr-card');

    cards.forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--spot-x', `${x}px`);
        card.style.setProperty('--spot-y', `${y}px`);

        if (!isTouch && hasGsap()) {
          const rx = ((y / rect.height) - 0.5) * -7;
          const ry = ((x / rect.width) - 0.5) * 8;
          window.gsap.to(card, {
            rotateX: rx,
            rotateY: ry,
            y: -4,
            transformPerspective: 850,
            duration: 0.32,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });

      card.addEventListener('pointerleave', () => {
        if (!isTouch && hasGsap()) {
          window.gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, 0.6)',
            overwrite: 'auto'
          });
        }
      });
    });
  }

  function animateContributorsPage() {
    if (!hasGsap()) return;
    const gsap = window.gsap;
    const page = document.getElementById('page-contributors');
    if (!page) return;

    bindContributorsInteractions();
    revealHero(page);

    const cards = page.querySelectorAll('.cr-card');
    const labels = page.querySelectorAll('.cr-section-label');

    gsap.fromTo(
      labels,
      { x: -16, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, stagger: 0.14, delay: 0.12, ease: 'power3.out', overwrite: 'auto' }
    );

    gsap.fromTo(
      cards,
      { y: 38, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.72, stagger: { each: 0.075, from: 'start' }, delay: 0.16, ease: 'power4.out', overwrite: 'auto' }
    );

    // Subtle kinetic light sheen across the highlighted Developer card on arrival
    const devSheen = page.querySelector('.cr-dev-sheen');
    if (devSheen) {
      gsap.fromTo(
        devSheen,
        { xPercent: -130, opacity: 0.85 },
        { xPercent: 230, opacity: 0, duration: 1.35, delay: 0.55, ease: 'power2.inOut', overwrite: 'auto' }
      );
    }
  }

  /* ================================================================
     Router & Event Hooks
     ================================================================ */
  function handlePage(page) {
    if (page !== 'methods') pauseMethodsDiagrams();
    if (page === 'methods') requestAnimationFrame(animateMethodsPage);
    else if (page === 'reference') requestAnimationFrame(animateReferencePage);
    else if (page === 'log') requestAnimationFrame(animateDataLogPage);
    else if (page === 'theory') requestAnimationFrame(animateTheoryPage);
    else if (page === 'compare') requestAnimationFrame(animateComparePage);
    else if (page === 'how-to-use') requestAnimationFrame(animateHowToUsePage);
    else if (page === 'contributors') requestAnimationFrame(animateContributorsPage);
  }

  window.addEventListener('pagechange', (e) => {
    const page = e && e.detail ? e.detail.page : '';
    handlePage(page);
  });

  window.addEventListener('datalogrendered', () => {
    animateDataLogChart();
    if (hasGsap()) {
      const newRows = document.querySelectorAll('#logTableBody tr.table-row-new');
      if (newRows.length) {
        window.gsap.fromTo(newRows, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42, ease: 'power3.out', overwrite: 'auto' });
      }
    }
  });

  window.addEventListener('comparerendered', () => {
    animateCompareBars();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const logMethodSel = document.getElementById('logMethod');
    if (logMethodSel) {
      logMethodSel.addEventListener('change', syncLogFormulaChip);
    }
    syncLogFormulaChip();

    const active = document.querySelector('.page-section.active');
    if (active && active.id) {
      handlePage(active.id.replace('page-', ''));
    }
  });
})();
