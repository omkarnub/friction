/**
 * home-showcase.js — Seamless Looping Simulation Animation + Scroll-reveal Text
 *
 * 1) Showcase: Pure continuous cinematic animation loop demonstrating
 *    both the Angle of Repose and Friction Plane methods with full physical
 *    apparatus (hatched base, wall, clamp, dial, needle, pulley, hanging pan,
 *    slotted weights, dynamic force vectors), smooth closeup camera pans/zooms,
 *    and cinematic transitions.
 *    No user toggles, no formulas, no badges, no framing box.
 * 2) Scroll Reveal: Word-by-word opacity + blur reveal on scroll.
 */
(function () {
  'use strict';

  /* ================================================================
     Utilities
     ================================================================ */
  const toRad = (d) => (d * Math.PI) / 180;

  function drawArc(cx, cy, r, startDeg, endDeg) {
    const s = toRad(startDeg), e = toRad(endDeg);
    const sx = cx + r * Math.cos(s), sy = cy - r * Math.sin(s);
    const ex = cx + r * Math.cos(e), ey = cy - r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  /* ================================================================
     PART 1 — Simulation Showcase (Seamless Cinematic Loop)
     ================================================================ */
  let masterShowcaseTl = null;
  let showcaseInitialized = false;

  function initShowcase() {
    const svg = document.getElementById('showSimSvg');
    if (!svg) return;

    if (masterShowcaseTl) {
      masterShowcaseTl.play();
      return;
    }

    if (showcaseInitialized) return;
    showcaseInitialized = true;

    buildMasterCinematicLoop();
  }

  function buildMasterCinematicLoop() {
    const svgEl = document.getElementById('showSimSvg');
    const showNeedle = document.getElementById('showNeedle');
    const showAngleArc = document.getElementById('showAngleArc');

    // Scene 1 elements (Angle of Repose)
    const showReposeScene = document.getElementById('showReposeScene');
    const showReposeIncline = document.getElementById('showReposeIncline');
    const showReposeBlockMover = document.getElementById('showReposeBlockMover');
    const showReposeVectors = document.getElementById('showReposeVectors');
    const showReposeGravityGroup = document.getElementById('showReposeGravityGroup');
    const showReposeNormalLine = document.getElementById('showReposeNormalLine');
    const showReposeFrictionLine = document.getElementById('showReposeFrictionLine');

    // Scene 2 elements (Friction Plane)
    const showFrictionScene = document.getElementById('showFrictionScene');
    const showFrictionBlockMover = document.getElementById('showFrictionBlockMover');
    const showFrictionString1 = document.getElementById('showFrictionString1');
    const showFrictionHangString = document.getElementById('showFrictionHangString');
    const showFrictionPanAssembly = document.getElementById('showFrictionPanAssembly');
    const showFrictionPLine = document.getElementById('showFrictionPLine');
    const showWeightDiscs = document.querySelectorAll('.show-weight-disc');

    if (!svgEl || !showReposeScene || !showFrictionScene) return;

    // Persistent camera state for native SVG viewBox interpolation
    const camera = { x: 0, y: 0, w: 800, h: 420 };
    const simState = {
      reposeAngle: 0,
      frictionTension: 0,
      needleDeg: 0,
      frictionClimb: 0,
    };

    function applyCamera() {
      svgEl.setAttribute(
        'viewBox',
        `${camera.x.toFixed(1)} ${camera.y.toFixed(1)} ${camera.w.toFixed(1)} ${camera.h.toFixed(1)}`
      );
    }

    function updateNeedleOnly(deg) {
      const rad = toRad(deg);
      if (showNeedle) {
        showNeedle.setAttribute('x2', (120 + 45 * Math.cos(rad)).toFixed(1));
        showNeedle.setAttribute('y2', (320 - 45 * Math.sin(rad)).toFixed(1));
      }
      if (showAngleArc) {
        showAngleArc.setAttribute('d', deg > 0.8 ? drawArc(120, 320, 38, 0, deg) : '');
      }
    }

    function updateReposePhysics(alpha) {
      const rad = toRad(alpha);
      if (showReposeIncline) {
        showReposeIncline.setAttribute('transform', `rotate(${-alpha} 120 320)`);
      }
      updateNeedleOnly(alpha);

      // Keep gravity pointing vertically downward in world space
      if (showReposeGravityGroup) {
        showReposeGravityGroup.setAttribute('transform', `rotate(${alpha} 0 0)`);
      }
      // Normal force perpendicular to surface (decreases with cos)
      if (showReposeNormalLine) {
        const nLen = 46 * Math.cos(rad);
        showReposeNormalLine.setAttribute('y2', (18 - nLen).toFixed(1));
      }
      // Friction force along surface up-slope (grows with sin)
      if (showReposeFrictionLine) {
        const fLen = 46 * Math.sin(rad);
        showReposeFrictionLine.setAttribute('x2', (-fLen).toFixed(1));
      }
    }

    function updateFrictionTension(prog) {
      if (showFrictionPLine) {
        showFrictionPLine.setAttribute('x2', (28 + 16 + prog * 24).toFixed(1));
      }
    }

    function updateFrictionClimb(climb) {
      if (showFrictionBlockMover) {
        gsap.set(showFrictionBlockMover, { x: climb });
      }
      if (showFrictionString1) {
        showFrictionString1.setAttribute('x1', (288 + climb).toFixed(1));
      }
      if (showFrictionHangString) {
        showFrictionHangString.setAttribute('y2', (76 + climb).toFixed(1));
      }
      if (showFrictionPanAssembly) {
        gsap.set(showFrictionPanAssembly, { y: climb });
      }
    }

    // Master Looping Timeline
    const tl = gsap.timeline({ repeat: -1 });

    /* ════════════════════════════════════════════════════════════════
       PHASE 1: ANGLE OF REPOSE
       ════════════════════════════════════════════════════════════════ */
    tl.addLabel('reposeStart')
      .set(showReposeScene, { opacity: 1, visibility: 'visible' })
      .set(showFrictionScene, { opacity: 0, visibility: 'hidden' })
      .set(showReposeBlockMover, { x: 0, opacity: 1 })
      .set(showReposeVectors, { opacity: 1 })
      .call(() => {
        camera.x = 0; camera.y = 0; camera.w = 800; camera.h = 420;
        applyCamera();
        simState.reposeAngle = 0;
        simState.needleDeg = 0;
        updateReposePhysics(0);
      });

    // Hold briefly at wide view (0.8s)
    tl.to({}, { duration: 0.8 });

    // Closeup 1: Zoom in on Pivot & Protractor Dial (Dramatic ~2.8x zoom)
    tl.to(camera, {
      x: 40,
      y: 200,
      w: 280,
      h: 147,
      duration: 2.6,
      ease: 'power2.inOut',
      onUpdate: applyCamera,
    }, 'reposeLift');

    tl.to(simState, {
      reposeAngle: 14,
      duration: 2.6,
      ease: 'power1.inOut',
      onUpdate: () => updateReposePhysics(simState.reposeAngle),
    }, 'reposeLift');

    // Closeup 2: Pan & zoom directly to Block as it approaches critical slip angle
    tl.to(camera, {
      x: 120,
      y: 146,
      w: 320,
      h: 168,
      duration: 2.8,
      ease: 'power2.inOut',
      onUpdate: applyCamera,
    }, 'reposeToSlip');

    tl.to(simState, {
      reposeAngle: 24.5,
      duration: 2.8,
      ease: 'power1.out',
      onUpdate: () => updateReposePhysics(simState.reposeAngle),
    }, 'reposeToSlip');

    // Micro-vibration at verge of slip (0.24s)
    tl.to(showReposeBlockMover, {
      x: -2,
      duration: 0.06,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut',
    });

    // SLIP! Block accelerates down the inclined plane to the bottom stop bracket
    tl.to(showReposeVectors, { opacity: 0, duration: 0.2 }, 'slipAction');

    tl.to(showReposeBlockMover, {
      x: -170,
      opacity: 0.45,
      duration: 0.75,
      ease: 'power2.in',
    }, 'slipAction');

    // Pull camera back to wide view
    tl.to(camera, {
      x: 0,
      y: 0,
      w: 800,
      h: 420,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: applyCamera,
    }, 'slipAction+=0.2');

    // Settle at wide view (0.8s)
    tl.to({}, { duration: 0.8 });

    /* ════════════════════════════════════════════════════════════════
       PHASE 2: CINEMATIC TRANSITION TO FRICTION PLANE
       ════════════════════════════════════════════════════════════════ */
    tl.addLabel('transitionToFriction');

    // Make friction scene visible and crossfade
    tl.set(showFrictionScene, { visibility: 'visible' }, 'trans');
    tl.to(showReposeScene, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 'trans');
    tl.to(showFrictionScene, { opacity: 1, duration: 0.8, ease: 'power1.inOut' }, 'trans');
    tl.set(showReposeScene, { visibility: 'hidden' }, 'trans+=0.8');

    // Needle glides to 20°
    tl.to(simState, {
      needleDeg: 20,
      duration: 0.8,
      ease: 'power1.inOut',
      onUpdate: () => updateNeedleOnly(simState.needleDeg),
    }, 'trans');

    // Reset friction elements
    tl.set(showWeightDiscs, { opacity: 0, y: -20 }, 'trans');
    tl.call(() => {
      updateFrictionClimb(0);
      simState.frictionTension = 0;
      updateFrictionTension(0);
    }, null, 'trans');

    // Settle at wide view for Friction Plane (0.8s)
    tl.to({}, { duration: 0.8 });

    /* ════════════════════════════════════════════════════════════════
       PHASE 3: FRICTION PLANE METHOD
       ════════════════════════════════════════════════════════════════ */
    tl.addLabel('frictionStart');

    // Closeup 3: Dramatic zoom into Pulley & Hanging Pan as slotted weights load
    tl.to(camera, {
      x: 415,
      y: 131,
      w: 320,
      h: 168,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate: applyCamera,
    }, 'zoomPan');

    // Slotted weights drop sequentially onto pan with bounce
    tl.to(showWeightDiscs, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.3,
      ease: 'bounce.out',
    }, 'zoomPan+=0.5');

    // Pan sinks slightly under weight load
    tl.to(showFrictionPanAssembly, {
      y: 8,
      duration: 0.4,
      ease: 'power1.out',
      onUpdate: () => {
        const yVal = gsap.getProperty(showFrictionPanAssembly, 'y');
        if (showFrictionHangString) {
          showFrictionHangString.setAttribute('y2', (76 + yVal).toFixed(1));
        }
      },
    }, 'zoomPan+=1.6');

    tl.call(() => { updateFrictionTension(0.4); }, null, 'zoomPan+=1.6');

    // Closeup 4: Glide camera to Block as tension builds
    tl.to(camera, {
      x: 140,
      y: 146,
      w: 340,
      h: 178.5,
      duration: 2.4,
      ease: 'power2.inOut',
      onUpdate: applyCamera,
    }, 'glideToBlock');

    // Tension ramps up to threshold
    tl.to(simState, {
      frictionTension: 1.0,
      duration: 2.0,
      ease: 'power1.inOut',
      onUpdate: () => updateFrictionTension(simState.frictionTension),
    }, 'glideToBlock');

    // MOTION! Block overcomes static friction and glides up incline toward pulley
    tl.addLabel('blockAscent');

    tl.to(simState, {
      frictionClimb: 90,
      duration: 2.0,
      ease: 'power1.inOut',
      onUpdate: () => updateFrictionClimb(simState.frictionClimb),
    }, 'blockAscent');

    // Pull camera back to wide view
    tl.to(camera, {
      x: 0,
      y: 0,
      w: 800,
      h: 420,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: applyCamera,
    }, 'blockAscent+=0.5');

    // Hold at wide view (0.8s)
    tl.to({}, { duration: 0.8 });

    /* ════════════════════════════════════════════════════════════════
       PHASE 4: CINEMATIC LOOP RESET
       ════════════════════════════════════════════════════════════════ */
    tl.set(showReposeScene, { visibility: 'visible' }, 'loopReset');
    tl.to(showFrictionScene, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 'loopReset');
    tl.to(showReposeScene, { opacity: 1, duration: 0.8, ease: 'power1.inOut' }, 'loopReset');
    tl.set(showFrictionScene, { visibility: 'hidden' }, 'loopReset+=0.8');

    // Smoothly reset needle back to 0°
    tl.to(simState, {
      needleDeg: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => updateNeedleOnly(simState.needleDeg),
    }, 'loopReset');

    masterShowcaseTl = tl;
  }


  /* ================================================================
     PART 1B — Individual Method Card Simulations (Looping)
     ================================================================ */
  let mrReposeTl = null;
  let mfFrictionTl = null;

  function buildReposeMethodLoop() {
    if (mrReposeTl) { mrReposeTl.play(); return; }

    const incline = document.getElementById('mrReposeIncline');
    const blockMover = document.getElementById('mrReposeBlockMover');
    const vectors = document.getElementById('mrReposeVectors');
    const gravityGroup = document.getElementById('mrReposeGravityGroup');
    const normalLine = document.getElementById('mrReposeNormalLine');
    const frictionLine = document.getElementById('mrReposeFrictionLine');
    const needle = document.getElementById('mrReposeNeedle');
    const arc = document.getElementById('mrReposeArc');

    if (!incline || !blockMover) return;

    const state = { angle: 0 };

    function updatePhysics(alpha) {
      const rad = toRad(alpha);
      incline.setAttribute('transform', `rotate(${-alpha} 120 320)`);
      // Needle
      if (needle) {
        needle.setAttribute('x2', (120 + 45 * Math.cos(rad)).toFixed(1));
        needle.setAttribute('y2', (320 - 45 * Math.sin(rad)).toFixed(1));
      }
      if (arc) {
        arc.setAttribute('d', alpha > 0.8 ? drawArc(120, 320, 38, 0, alpha) : '');
      }
      // Gravity counter-rotate
      if (gravityGroup) gravityGroup.setAttribute('transform', `rotate(${alpha} 0 0)`);
      // Normal decreases
      if (normalLine) normalLine.setAttribute('y2', (18 - 46 * Math.cos(rad)).toFixed(1));
      // Friction grows
      if (frictionLine) frictionLine.setAttribute('x2', (-46 * Math.sin(rad)).toFixed(1));
    }

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

    // Reset
    tl.call(() => { state.angle = 0; updatePhysics(0); })
      .set(blockMover, { x: 0, opacity: 1 })
      .set(vectors, { opacity: 1 });

    // Hold
    tl.to({}, { duration: 0.6 });

    // Tilt slowly to 24.5°
    tl.to(state, {
      angle: 24.5,
      duration: 3.5,
      ease: 'power1.inOut',
      onUpdate: () => updatePhysics(state.angle),
    });

    // Vibration at verge
    tl.to(blockMover, { x: -2, duration: 0.06, yoyo: true, repeat: 3, ease: 'sine.inOut' });

    // Slip!
    tl.to(vectors, { opacity: 0, duration: 0.2 }, 'mrSlip');
    tl.to(blockMover, { x: -170, opacity: 0.45, duration: 0.7, ease: 'power2.in' }, 'mrSlip');

    // Hold at slipped state
    tl.to({}, { duration: 1 });

    // Fade out and reset (handled by repeat)
    tl.to(blockMover, { opacity: 0, duration: 0.3 });

    mrReposeTl = tl;
  }

  function buildFrictionMethodLoop() {
    if (mfFrictionTl) { mfFrictionTl.play(); return; }

    const blockMover = document.getElementById('mfFrictionBlockMover');
    const string1 = document.getElementById('mfFrictionString1');
    const hangString = document.getElementById('mfFrictionHangString');
    const panAssembly = document.getElementById('mfFrictionPanAssembly');
    const pLine = document.getElementById('mfFrictionPLine');
    const weightDiscs = document.querySelectorAll('.mf-weight-disc');
    const arcEl = document.getElementById('mfFrictionArc');

    if (!blockMover) return;

    // Show the 20° arc
    if (arcEl) arcEl.setAttribute('d', drawArc(120, 320, 38, 0, 20));

    const state = { tension: 0, climb: 0 };

    function updateTension(prog) {
      if (pLine) pLine.setAttribute('x2', (28 + 16 + prog * 24).toFixed(1));
    }

    function updateClimb(climb) {
      gsap.set(blockMover, { x: climb });
      if (string1) string1.setAttribute('x1', (288 + climb).toFixed(1));
      if (hangString) hangString.setAttribute('y2', (76 + climb).toFixed(1));
      if (panAssembly) gsap.set(panAssembly, { y: climb });
    }

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

    // Reset
    tl.call(() => {
      state.tension = 0; state.climb = 0;
      updateTension(0);
      updateClimb(0);
    })
      .set(blockMover, { x: 0 })
      .set(weightDiscs, { opacity: 0, y: -20 })
      .set(panAssembly, { y: 0 });

    // Hold
    tl.to({}, { duration: 0.6 });

    // Weights drop sequentially
    tl.to(weightDiscs, {
      opacity: 1, y: 0,
      duration: 0.45,
      stagger: 0.3,
      ease: 'bounce.out',
    }, 'mfWeights');

    // Pan sinks under load
    tl.to(panAssembly, {
      y: 8,
      duration: 0.4,
      ease: 'power1.out',
      onUpdate: () => {
        const yVal = gsap.getProperty(panAssembly, 'y');
        if (hangString) hangString.setAttribute('y2', (76 + yVal).toFixed(1));
      },
    }, 'mfWeights+=1.6');

    // Tension builds
    tl.to(state, {
      tension: 1.0,
      duration: 1.5,
      ease: 'power1.inOut',
      onUpdate: () => updateTension(state.tension),
    }, 'mfTension');

    // Block climbs up
    tl.to(state, {
      climb: 90,
      duration: 2.0,
      ease: 'power1.inOut',
      onUpdate: () => updateClimb(state.climb),
    }, 'mfClimb');

    // Hold
    tl.to({}, { duration: 1 });

    // Fade
    tl.to(blockMover, { opacity: 0.3, duration: 0.3 });

    mfFrictionTl = tl;
  }


  /* ================================================================
     PART 2 — Scroll Reveal (Disabled: text is clean, static, 100% visible)
     ================================================================ */
  let scrollRevealInitialized = false;

  function initScrollReveal() {
    // Clean, static, 100% visible text with no scroll animation across all devices
    const textEls = document.querySelectorAll('[data-sr-text]');
    textEls.forEach(el => {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.querySelectorAll('.sr-word').forEach(span => {
        span.style.opacity = '1';
        span.style.filter = 'none';
        span.style.transform = 'none';
      });
    });
    document.querySelectorAll('.learn-point-number').forEach(el => {
      el.style.opacity = '0.4';
      el.style.transform = 'none';
    });
    scrollRevealInitialized = true;
  }


  /* ================================================================
     PART 3 — Viewport Visibility Optimization
     Pauses offscreen SVG animation loops to free up 100% CPU on mobile
     ================================================================ */
  let visibilityObserverInitialized = false;

  function setupShowcaseVisibilityObserver() {
    if (visibilityObserverInitialized || !('IntersectionObserver' in window)) return;
    visibilityObserverInitialized = true;

    const simShowcase = document.getElementById('simShowcase');
    if (simShowcase) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (masterShowcaseTl) {
            if (entry.isIntersecting) {
              masterShowcaseTl.play();
            } else {
              masterShowcaseTl.pause();
            }
          }
        });
      }, { rootMargin: '120px 0px 120px 0px', threshold: 0.05 });
      observer.observe(simShowcase);
    }

    const reposeCard = document.getElementById('mrReposeSim') || document.querySelector('.learn-method-card');
    if (reposeCard) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (mrReposeTl) {
            if (entry.isIntersecting) {
              mrReposeTl.play();
            } else {
              mrReposeTl.pause();
            }
          }
        });
      }, { rootMargin: '120px 0px 120px 0px', threshold: 0.05 });
      observer.observe(reposeCard);
    }

    const cards = document.querySelectorAll('.learn-method-card');
    const frictionCard = document.getElementById('mfFrictionSim') || (cards.length > 1 ? cards[1] : null);
    if (frictionCard) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (mfFrictionTl) {
            if (entry.isIntersecting) {
              mfFrictionTl.play();
            } else {
              mfFrictionTl.pause();
            }
          }
        });
      }, { rootMargin: '120px 0px 120px 0px', threshold: 0.05 });
      observer.observe(frictionCard);
    }
  }


  /* ================================================================
  /* ================================================================
     PART 3 — Exact Signature Component Animation (Framer-Motion Replica in GSAP)
     ================================================================ */
  let signatureTimeline = null;
  let signatureObserver = null;
  let footerScrollListenerAttached = false;

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
    const baseDelay = 0;

    // Build the exact Framer-Motion animation in GSAP:
    // variants: { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }
    // pathLength transition: delay + i * 0.2, duration: 1.5, ease: "easeInOut"
    // opacity transition: delay + i * 0.2 + 0.01, duration: 0.01
    function resetToHidden() {
      maskPaths.forEach((maskP, i) => {
        const strokeP = strokePaths[i];
        let len = 300;
        try {
          len = Math.ceil(maskP.getTotalLength() || 300);
        } catch (e) {
          len = 300;
        }
        gsap.set(maskP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
        if (strokeP) {
          gsap.set(strokeP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
        }
      });
    }

    function buildSignatureTimeline() {
      if (signatureTimeline) {
        signatureTimeline.kill();
      }
      resetToHidden();
      signatureTimeline = gsap.timeline({ paused: true });

      maskPaths.forEach((maskP, i) => {
        const strokeP = strokePaths[i];
        let len = 300;
        try {
          len = Math.ceil(maskP.getTotalLength() || 300);
        } catch (e) {
          len = 300;
        }

        const startTime = baseDelay + i * charDelay;

        // Ensure path starts hidden at t=0
        signatureTimeline.set(maskP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 }, 0);
        if (strokeP) {
          signatureTimeline.set(strokeP, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 }, 0);
        }

        // opacity transition: delay + i * 0.2 + 0.01, duration: 0.01
        signatureTimeline.to(maskP, { opacity: 1, duration: 0.01 }, startTime + 0.01);
        if (strokeP) {
          signatureTimeline.to(strokeP, { opacity: 1, duration: 0.01 }, startTime + 0.01);
        }

        // pathLength transition: delay + i * 0.2, duration: 1.5, ease: "easeInOut"
        signatureTimeline.to(maskP, {
          strokeDashoffset: 0,
          duration: duration,
          ease: 'power1.inOut'
        }, startTime);

        if (strokeP) {
          signatureTimeline.to(strokeP, {
            strokeDashoffset: 0,
            duration: duration,
            ease: 'power1.inOut'
          }, startTime);
        }
      });
    }

    buildSignatureTimeline();

    let isAtBottom = false;

    function playSignature() {
      buildSignatureTimeline();
      signatureTimeline.play(0);
    }

    // Auto-animate whenever user scrolls to the very bottom of the home page
    if (signatureObserver) {
      signatureObserver.disconnect();
    }

    if ('IntersectionObserver' in window) {
      signatureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isAtBottom) {
              isAtBottom = true;
              playSignature();
            }
          } else {
            // Scrolled away: reset so scrolling back to bottom replays
            isAtBottom = false;
          }
        });
      }, { threshold: 0.1 });
      signatureObserver.observe(footer);
    } else {
      playSignature();
    }

    // Window scroll backup for fast touch flings / trackpad bottom scroll
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
                if (!isAtBottom) {
                  isAtBottom = true;
                  playSignature();
                }
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

    // Interactive button: Single click = replay animation, Double click = open repo on browser
    const sigBtn = footer.querySelector('#homeFooterSig') || footer.querySelector('.home-footer-caption-wrap');
    if (sigBtn) {
      let clickTimer = null;
      const DOUBLE_CLICK_DELAY = 280;

      function openRepo() {
        window.open('https://github.com/omkarnub/friction', '_blank', 'noopener,noreferrer');
      }

      sigBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (clickTimer) {
          // Double click detected! Cancel single click replay and open GitHub repo
          clearTimeout(clickTimer);
          clickTimer = null;
          openRepo();
        } else {
          // Wait to see if a second click arrives within threshold
          clickTimer = setTimeout(() => {
            clickTimer = null;
            // One click: replay animation!
            playSignature();
          }, DOUBLE_CLICK_DELAY);
        }
      });

      // Also listen to native dblclick
      sigBtn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        openRepo();
      });

      // Accessibility keyboard trigger: Enter key replays animation
      sigBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          playSignature();
        }
      });
    }
  }

  /* ================================================================
     INIT — Hook into page lifecycle
     ================================================================ */
  function tryInit() {
    const homePage = document.getElementById('page-home');
    if (homePage && homePage.classList.contains('active')) {
      initShowcase();
      buildReposeMethodLoop();
      buildFrictionMethodLoop();
      initScrollReveal();
      setupShowcaseVisibilityObserver();
      initFooterSignature();
    }
  }

  // On page load
  if (document.readyState === 'complete') {
    tryInit();
  } else {
    window.addEventListener('load', tryInit);
  }

  // On page change (SPA router)
  window.addEventListener('pagechange', (e) => {
    if (e.detail && e.detail.page === 'home') {
      initShowcase();
      buildReposeMethodLoop();
      buildFrictionMethodLoop();
      setupShowcaseVisibilityObserver();
      initFooterSignature();

      // Refresh scroll reveal triggers
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    } else {
      // Pause animations when leaving home
      if (masterShowcaseTl) masterShowcaseTl.pause();
      if (mrReposeTl) mrReposeTl.pause();
      if (mfFrictionTl) mfFrictionTl.pause();
    }
  });

})();
