/**
 * simulate.js — High-Precision Physics Simulator for Virtual Mechanics Lab
 * Features:
 * - Real-time physics calculations with zero margin for error
 * - Realistic material textures & colors for both Block and Plane (Wood, Steel, Glass, Rubber, Brass, Aluminum, Concrete)
 * - Complete mechanical apparatus realism for Friction Plane:
 *   - Golden brass scale pan plate with triangular stirrup hanger wire
 *   - Stacked slotted weights that dynamically update and animate with pull force P
 *   - Realistic inextensible cord wrapping around detailed ball-bearing pulley at any angle (including horizontal θ = 0°)
 *   - Synchronized climbing kinematics: block moves up, string shortens, pulley rotates, pan lowers
 * - Angle of Repose apparatus with protractor dial, rotating needle, dynamic vectors, and accelerated slide-off to end bracket
 * - Automatic reset to default starting position upon data logging (fresh experimental variance per trial)
 * - Quick-add slotted weights buttons (+0.5N, +1N, +2N, +5N, Empty Pan)
 * - In-simulator toast notification system for seamless lab workflow
 */
(function () {
  'use strict';

  /* ================================================================
     Material Styles & Reference Data
     ================================================================ */
  const MATERIAL_STYLES = {
    wood: {
      name: 'Wood',
      fill: 'url(#simGradWood)',
      pattern: 'url(#simPatWood)',
      planeFill: 'url(#simGradWood)',
      planeStroke: '#6d4219',
      stroke: '#5c3412',
      labelColor: '#ffffff',
      textStroke: '#331a05',
      swatch: '#9e6328'
    },
    steel_dry: {
      name: 'Steel (dry)',
      fill: 'url(#simGradSteelDry)',
      pattern: 'url(#simPatSteel)',
      planeFill: 'url(#simGradSteelDry)',
      planeStroke: '#78909c',
      stroke: '#607d8b',
      labelColor: '#0a101d',
      textStroke: '#ffffff',
      swatch: '#cfd8dc'
    },
    steel_lub: {
      name: 'Steel (lubricated)',
      fill: 'url(#simGradSteelLub)',
      pattern: null,
      planeFill: 'url(#simGradSteelLub)',
      planeStroke: '#37474f',
      stroke: '#263238',
      labelColor: '#00e5ff',
      textStroke: '#05101a',
      swatch: '#546e7a'
    },
    glass: {
      name: 'Glass',
      fill: 'url(#simGradGlass)',
      pattern: null,
      planeFill: 'url(#simGradGlass)',
      planeStroke: 'rgba(129, 212, 250, 0.85)',
      stroke: 'rgba(79, 195, 247, 0.9)',
      labelColor: '#01579b',
      textStroke: '#e1f5fe',
      swatch: '#b3e5fc'
    },
    rubber: {
      name: 'Rubber',
      fill: 'url(#simGradRubber)',
      pattern: 'url(#simPatRubber)',
      planeFill: 'url(#simGradRubber)',
      planeStroke: '#101114',
      stroke: '#08080a',
      labelColor: '#f5f5f5',
      textStroke: '#000000',
      swatch: '#242629'
    },
    aluminum: {
      name: 'Aluminum',
      fill: 'url(#simGradAluminum)',
      pattern: null,
      planeFill: 'url(#simGradAluminum)',
      planeStroke: '#90a4ae',
      stroke: '#78909c',
      labelColor: '#1c2833',
      textStroke: '#ffffff',
      swatch: '#e0e0e0'
    },
    concrete: {
      name: 'Concrete',
      fill: 'url(#simGradConcrete)',
      pattern: 'url(#simPatConcrete)',
      planeFill: 'url(#simGradConcrete)',
      planeStroke: '#555555',
      stroke: '#424242',
      labelColor: '#ffffff',
      textStroke: '#212121',
      swatch: '#858585'
    },
    brass: {
      name: 'Brass',
      fill: 'url(#simGradBrass)',
      pattern: null,
      planeFill: 'url(#simGradBrass)',
      planeStroke: '#b8860b',
      stroke: '#8c6d1d',
      labelColor: '#3e2723',
      textStroke: '#fff59d',
      swatch: '#d4af37'
    }
  };

  const MATERIALS = {
    'wood-wood':          { name: 'Wood on Wood',                blockMat: 'wood', planeMat: 'wood', low: 0.25, high: 0.50, color: '#b97737', label: '#ffffff' },
    'wood-steel':         { name: 'Wood on Steel',               blockMat: 'wood', planeMat: 'steel_dry', low: 0.20, high: 0.60, color: '#b97737', label: '#ffffff' },
    'wood-glass':         { name: 'Wood on Glass',               blockMat: 'wood', planeMat: 'glass', low: 0.20, high: 0.50, color: '#b97737', label: '#ffffff' },
    'glass-glass':        { name: 'Glass on Glass',              blockMat: 'glass', planeMat: 'glass', low: 0.90, high: 1.00, color: '#90caf9', label: '#0d47a1' },
    'steel-steel-dry':    { name: 'Steel on Steel (dry)',        blockMat: 'steel_dry', planeMat: 'steel_dry', low: 0.50, high: 0.80, color: '#b0bec5', label: '#0a101d' },
    'steel-steel-lub':    { name: 'Steel on Steel (lubricated)', blockMat: 'steel_lub', planeMat: 'steel_lub', low: 0.05, high: 0.20, color: '#546e7a', label: '#00e5ff' },
    'aluminum-aluminum':  { name: 'Aluminum on Aluminum',        blockMat: 'aluminum', planeMat: 'aluminum', low: 1.05, high: 1.35, color: '#cfd8dc', label: '#1c2833' },
    'rubber-concrete':    { name: 'Rubber on Concrete',          blockMat: 'rubber', planeMat: 'concrete', low: 0.60, high: 0.85, color: '#242629', label: '#f1ece2' },
    'brass-steel':        { name: 'Brass on Steel',              blockMat: 'brass', planeMat: 'steel_dry', low: 0.35, high: 0.50, color: '#d4af37', label: '#3e2723' },
  };

  // Expose for external modules
  window.MATERIALS = MATERIALS;
  window.MATERIAL_STYLES = MATERIAL_STYLES;

  /* ================================================================
     Math & Helper Functions
     ================================================================ */
  function toRad(deg) { return (deg * Math.PI) / 180; }
  function toDeg(rad) { return (rad * 180) / Math.PI; }
  function randomWithin(mat) { return +(mat.low + Math.random() * (mat.high - mat.low)).toFixed(4); }
  function polar(cx, cy, r, angleDeg) {
    const rad = toRad(angleDeg);
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  /* ================================================================
     Toast Notification System
     ================================================================ */
  function showSimToast(title, desc, actionText, actionHash) {
    const container = document.getElementById('simToastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'sim-toast';
    toast.innerHTML = `
      <span class="sim-toast-icon">✓</span>
      <div class="sim-toast-content">
        <div class="sim-toast-title">${title}</div>
        <div class="sim-toast-desc">${desc}</div>
      </div>
      ${actionText ? `<button class="sim-toast-action" type="button">${actionText}</button>` : ''}
    `;

    if (actionText && actionHash) {
      const btn = toast.querySelector('.sim-toast-action');
      if (btn) {
        btn.addEventListener('click', () => {
          window.location.hash = actionHash;
        });
      }
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(16px)';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }
  window.showSimToast = showSimToast;

  /* ================================================================
     Shared SVG Defs (Material Shaders, Patterns, Technical Chrome)
     ================================================================ */
  function getMaterialDefsSVG() {
    return `
      <defs>
        <!-- Hatch Pattern for Stands & Walls -->
        <pattern id="hatchPat" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(90, 140, 160, 0.24)" stroke-width="1.6"/>
        </pattern>

        <!-- Wood Texture -->
        <linearGradient id="simGradWood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#b67c42"/>
          <stop offset="35%" stop-color="#a0642d"/>
          <stop offset="70%" stop-color="#884d1a"/>
          <stop offset="100%" stop-color="#6e3c12"/>
        </linearGradient>
        <pattern id="simPatWood" width="48" height="12" patternUnits="userSpaceOnUse">
          <line x1="0" y1="3" x2="48" y2="3" stroke="rgba(60, 25, 5, 0.32)" stroke-width="0.8"/>
          <line x1="0" y1="8" x2="48" y2="8" stroke="rgba(120, 60, 15, 0.22)" stroke-width="0.6"/>
          <path d="M 12 3 Q 24 5.5 36 3" fill="none" stroke="rgba(50, 20, 5, 0.28)" stroke-width="0.9"/>
        </pattern>

        <!-- Steel (Dry) Texture -->
        <linearGradient id="simGradSteelDry" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#edf2f7"/>
          <stop offset="30%" stop-color="#c5d1dc"/>
          <stop offset="65%" stop-color="#93a4b3"/>
          <stop offset="100%" stop-color="#b8c8d6"/>
        </linearGradient>
        <pattern id="simPatSteel" width="20" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1" x2="20" y2="1" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
          <line x1="0" y1="3" x2="20" y2="3" stroke="rgba(15,25,35,0.12)" stroke-width="0.5"/>
        </pattern>

        <!-- Steel (Lubricated with Oily Gloss Sheen) -->
        <linearGradient id="simGradSteelLub" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#78909c"/>
          <stop offset="25%" stop-color="#37474f"/>
          <stop offset="50%" stop-color="#455a64"/>
          <stop offset="70%" stop-color="#263238"/>
          <stop offset="88%" stop-color="#00bcd4" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#546e7a"/>
        </linearGradient>

        <!-- Glass (Frosted Refraction) -->
        <linearGradient id="simGradGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(227, 246, 253, 0.88)"/>
          <stop offset="25%" stop-color="rgba(179, 235, 248, 0.6)"/>
          <stop offset="60%" stop-color="rgba(129, 218, 245, 0.45)"/>
          <stop offset="100%" stop-color="rgba(79, 195, 247, 0.72)"/>
        </linearGradient>

        <!-- Rubber (Matte Vulcanized Charcoal) -->
        <linearGradient id="simGradRubber" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#34373d"/>
          <stop offset="50%" stop-color="#23252a"/>
          <stop offset="100%" stop-color="#141518"/>
        </linearGradient>
        <pattern id="simPatRubber" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="rgba(0,0,0,0.45)"/>
          <circle cx="3" cy="3" r="0.4" fill="rgba(255,255,255,0.08)"/>
        </pattern>

        <!-- Aluminum (Satin Metallic) -->
        <linearGradient id="simGradAluminum" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#d4dbe0"/>
          <stop offset="70%" stop-color="#b0bec5"/>
          <stop offset="100%" stop-color="#e2e8ec"/>
        </linearGradient>

        <!-- Concrete (Stone Aggregate Granular) -->
        <linearGradient id="simGradConcrete" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a6a6a6"/>
          <stop offset="50%" stop-color="#8a8a8a"/>
          <stop offset="100%" stop-color="#6e6e6e"/>
        </linearGradient>
        <pattern id="simPatConcrete" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="0.8" fill="rgba(30,30,30,0.35)"/>
          <circle cx="8" cy="9" r="1.1" fill="rgba(15,15,15,0.3)"/>
          <circle cx="10" cy="2" r="0.6" fill="rgba(255,255,255,0.25)"/>
          <circle cx="4" cy="10" r="0.7" fill="rgba(40,40,40,0.2)"/>
        </pattern>

        <!-- Brass Texture -->
        <linearGradient id="simGradBrass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff176"/>
          <stop offset="35%" stop-color="#fbc02d"/>
          <stop offset="70%" stop-color="#d4af37"/>
          <stop offset="100%" stop-color="#aa8010"/>
        </linearGradient>

        <!-- Scale Pan Metallic Plate Gradient -->
        <linearGradient id="panPlateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#caa232"/>
          <stop offset="25%" stop-color="#ffec8b"/>
          <stop offset="50%" stop-color="#ffd700"/>
          <stop offset="75%" stop-color="#d4af37"/>
          <stop offset="100%" stop-color="#9a761e"/>
        </linearGradient>

        <!-- Slotted Weights Brass Gradient -->
        <linearGradient id="weightBrassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fff59d"/>
          <stop offset="25%" stop-color="#fbc02d"/>
          <stop offset="60%" stop-color="#d4af37"/>
          <stop offset="100%" stop-color="#9e7b16"/>
        </linearGradient>

        <!-- Vector Markers -->
        <marker id="arrowGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-green)"/>
        </marker>
        <marker id="arrowPurple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-purple)"/>
        </marker>
        <marker id="arrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-amber)"/>
        </marker>
        <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-cyan)"/>
        </marker>

        <!-- Subtle Glow Filter -->
        <filter id="simGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;
  }

  /** Technical apparatus background: bench baseline, wall, pivot base, clamp housing */
  function apparatusChrome(pivotX, pivotY) {
    return `
      <!-- Ground line -->
      <line x1="20" y1="${pivotY + 20}" x2="580" y2="${pivotY + 20}" stroke="rgba(90, 140, 160, 0.16)" stroke-width="1.5"/>
      <!-- Hatched vertical backstop / wall -->
      <rect x="566" y="24" width="14" height="${pivotY - 4}" fill="url(#hatchPat)" stroke="rgba(90, 140, 160, 0.2)" stroke-width="1"/>
      <text x="573" y="18" text-anchor="middle" font-family="JetBrains Mono" font-size="8" fill="var(--text-dim)">wall</text>
      <!-- Base block -->
      <rect x="${pivotX - 32}" y="${pivotY + 6}" width="64" height="14" fill="url(#hatchPat)" stroke="rgba(90, 140, 160, 0.2)" stroke-width="1"/>
      <text x="${pivotX}" y="${pivotY + 34}" text-anchor="middle" font-family="JetBrains Mono" font-size="8" fill="var(--text-dim)">stand base</text>
      <!-- Clamp / pivot housing -->
      <rect x="${pivotX - 12}" y="${pivotY - 8}" width="24" height="16" rx="2" fill="rgba(90, 140, 160, 0.2)" stroke="var(--accent-blue)" stroke-width="1.2"/>
      <circle cx="${pivotX}" cy="${pivotY}" r="3.5" fill="var(--accent-blue)"/>
      <text x="${pivotX}" y="${pivotY - 12}" text-anchor="middle" font-family="JetBrains Mono" font-size="8" fill="var(--text-dim)">clamp</text>
    `;
  }

  /** Protractor dial with fine degree markings, rotating needle, and arc */
  function protractorDial(cx, cy, r, currentAngle, angleLabel) {
    const p0 = polar(cx, cy, r, 0);
    const p90 = polar(cx, cy, r, 90);

    let ticks = '';
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(a => {
      const pIn = polar(cx, cy, r - 5, a);
      const pOut = polar(cx, cy, r + 2, a);
      const isMajor = a % 30 === 0;
      ticks += `<line x1="${pIn.x.toFixed(1)}" y1="${pIn.y.toFixed(1)}" x2="${pOut.x.toFixed(1)}" y2="${pOut.y.toFixed(1)}" stroke="rgba(90, 140, 160, 0.3)" stroke-width="${isMajor ? 1.5 : 0.8}"/>`;
      if (isMajor) {
        const pLabel = polar(cx, cy, r + 13, a);
        ticks += `<text x="${pLabel.x.toFixed(1)}" y="${(pLabel.y + 3).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono" font-size="7.5" fill="var(--text-dim)">${a}°</text>`;
      }
    });

    const clamped = Math.max(0, Math.min(90, currentAngle));
    const needleEnd = polar(cx, cy, r - 6, clamped);

    return `
      <path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${r} ${r} 0 0 0 ${p90.x.toFixed(1)} ${p90.y.toFixed(1)}" fill="rgba(90, 140, 160, 0.04)" stroke="rgba(90, 140, 160, 0.22)" stroke-width="1.2"/>
      ${ticks}
      <line class="dial-needle" x1="${cx}" y1="${cy}" x2="${needleEnd.x.toFixed(1)}" y2="${needleEnd.y.toFixed(1)}" stroke="var(--accent-amber)" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--accent-amber)"/>
      <text class="dial-label" x="${polar(cx, cy, r * 0.55, clamped / 2 + 3).x.toFixed(1)}" y="${polar(cx, cy, r * 0.55, clamped / 2 + 3).y.toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono" font-size="12" font-weight="700" fill="var(--accent-amber)">${angleLabel}</text>
    `;
  }

  function updateDialNeedle(svg, cx, cy, r, angleDeg) {
    const needle = svg.querySelector('.dial-needle');
    if (!needle) return;
    const p = polar(cx, cy, r - 6, Math.max(0, Math.min(90, angleDeg)));
    needle.setAttribute('x2', p.x.toFixed(1));
    needle.setAttribute('y2', p.y.toFixed(1));
  }

  /* ================================================================
     State & Hidden Experimental Variance
     ================================================================ */
  const simState = {
    repose: {
      trueMu: 0,
      threshold: 0,
      sliding: false,
      trialCount: 0,
      timer: null
    },
    friction: {
      trueMu: 0,
      moving: false,
      trialCount: 0,
      animating: false
    }
  };

  function refreshReposeThreshold(matKey) {
    const mat = MATERIALS[matKey];
    simState.repose.trueMu = randomWithin(mat);
    simState.repose.threshold = +(Math.atan(simState.repose.trueMu) * 180 / Math.PI).toFixed(1);
    simState.repose.sliding = false;
  }

  function refreshFrictionThreshold(matKey) {
    const mat = MATERIALS[matKey];
    simState.friction.trueMu = randomWithin(mat);
    simState.friction.moving = false;
  }

  /* ================================================================
     DOM Controls
     ================================================================ */
  const reposeAngleSlider = document.getElementById('reposeAngle');
  const reposeWeightSlider = document.getElementById('reposeWeight');
  const reposeMaterialSelect = document.getElementById('reposeMaterial');

  const frictionAngleSlider = document.getElementById('frictionAngle');
  const frictionWeightSlider = document.getElementById('frictionWeight');
  const frictionForceSlider = document.getElementById('frictionForce');
  const frictionMaterialSelect = document.getElementById('frictionMaterial');

  // Initialize randomized thresholds
  refreshReposeThreshold(reposeMaterialSelect.value);
  refreshFrictionThreshold(frictionMaterialSelect.value);

  /* ================================================================
     Radix Custom Dropdown Integration
     ================================================================ */
  function initRadixDropdown(dropdownId, selectId, activeTextId, activeSwatchId, itemsListId) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    const activeText = document.getElementById(activeTextId);
    const activeSwatch = document.getElementById(activeSwatchId);
    const itemsList = document.getElementById(itemsListId);
    if (!dropdown || !select || !activeText || !itemsList) return;

    const trigger = dropdown.querySelector('.radix-trigger');

    function updateTriggerDisplay(key) {
      const mat = MATERIALS[key];
      if (!mat) return;
      activeText.textContent = mat.name;
      if (activeSwatch) {
        const bStyle = MATERIAL_STYLES[mat.blockMat] || {};
        const pStyle = MATERIAL_STYLES[mat.planeMat] || {};
        activeSwatch.innerHTML = `
          <span class="swatch-dot" style="background: ${bStyle.swatch || '#999'};" title="Block: ${bStyle.name || ''}"></span>
          <span class="swatch-on">on</span>
          <span class="swatch-dot" style="background: ${pStyle.swatch || '#999'};" title="Plane: ${pStyle.name || ''}"></span>
        `;
      }
    }

    // Populate dropdown items
    itemsList.innerHTML = '';
    Array.from(select.options).forEach(opt => {
      const mat = MATERIALS[opt.value];
      if (!mat) return;
      const bStyle = MATERIAL_STYLES[mat.blockMat] || {};
      const pStyle = MATERIAL_STYLES[mat.planeMat] || {};
      const avgMu = ((mat.low + mat.high) / 2).toFixed(2);

      const item = document.createElement('div');
      item.className = 'radix-checkbox-item' + (opt.value === select.value ? ' selected' : '');
      item.setAttribute('role', 'menuitemcheckbox');
      item.setAttribute('aria-checked', opt.value === select.value ? 'true' : 'false');
      item.dataset.value = opt.value;

      item.innerHTML = `
        <span class="radix-checkbox-indicator">
          ${opt.value === select.value ? '<svg viewBox="0 0 15 15" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7.5l3.5 3.5 6.5-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
        </span>
        <div class="radix-item-content">
          <span class="radix-swatch-combo">
            <span class="swatch-dot" style="background: ${bStyle.swatch || '#999'};"></span>
            <span class="swatch-on">on</span>
            <span class="swatch-dot" style="background: ${pStyle.swatch || '#999'};"></span>
          </span>
          <span class="radix-item-title">${mat.name}</span>
          <span class="radix-item-mu">μ ≈ ${avgMu}</span>
        </div>
      `;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeDropdown();
      });

      itemsList.appendChild(item);
    });

    function openDropdown() {
      document.querySelectorAll('.radix-dropdown.open').forEach(dd => {
        if (dd !== dropdown) {
          dd.classList.remove('open');
          const trg = dd.querySelector('.radix-trigger');
          if (trg) trg.setAttribute('aria-expanded', 'false');
        }
      });
      dropdown.classList.add('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      dropdown.classList.remove('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown.classList.contains('open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });
    }

    // Sync trigger & item state when select changes
    select.addEventListener('change', () => {
      updateTriggerDisplay(select.value);
      itemsList.querySelectorAll('.radix-checkbox-item').forEach(it => {
        const isSelected = it.dataset.value === select.value;
        it.classList.toggle('selected', isSelected);
        it.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        const ind = it.querySelector('.radix-checkbox-indicator');
        if (ind) {
          ind.innerHTML = isSelected ? '<svg viewBox="0 0 15 15" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7.5l3.5 3.5 6.5-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
        }
      });
    });

    // Initial display
    updateTriggerDisplay(select.value);
  }

  // Global close on click outside & escape key
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.radix-dropdown')) {
      document.querySelectorAll('.radix-dropdown.open').forEach(dd => {
        dd.classList.remove('open');
        const trg = dd.querySelector('.radix-trigger');
        if (trg) trg.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.radix-dropdown.open').forEach(dd => {
        dd.classList.remove('open');
        const trg = dd.querySelector('.radix-trigger');
        if (trg) trg.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Expose dropdown initializer for external modules
  window.initRadixDropdown = initRadixDropdown;

  // Initialize both dropdowns
  initRadixDropdown('reposeRadixDropdown', 'reposeMaterial', 'reposeActiveText', 'reposeActiveSwatch', 'reposeRadixItems');
  initRadixDropdown('frictionRadixDropdown', 'frictionMaterial', 'frictionActiveText', 'frictionActiveSwatch', 'frictionRadixItems');

  /* ================================================================
     METHOD 1: ANGLE OF REPOSE
     ================================================================ */
  const R_PIVOT = { x: 90, y: 340 };
  const R_PLANE_LEN = 440;
  const R_DIAL_R = 48;

  function renderReposeSVG() {
    const svg = document.getElementById('reposeSvg');
    if (!svg) return;
    const matKey = reposeMaterialSelect.value;
    const mat = MATERIALS[matKey];
    const bStyle = MATERIAL_STYLES[mat.blockMat];
    const pStyle = MATERIAL_STYLES[mat.planeMat];
    const angleDeg = parseFloat(reposeAngleSlider.value);

    svg.innerHTML = `
      ${getMaterialDefsSVG()}
      ${apparatusChrome(R_PIVOT.x, R_PIVOT.y)}
      ${protractorDial(R_PIVOT.x, R_PIVOT.y, R_DIAL_R, angleDeg, 'α')}

      <!-- Rotating Incline Group -->
      <g id="reposeIncline">
        <!-- Structural Board Base (Extrusion Beam) -->
        <rect x="${R_PIVOT.x}" y="${R_PIVOT.y - 4}" width="${R_PLANE_LEN}" height="9" rx="1" fill="#1e2430" stroke="var(--accent-blue)" stroke-width="1.2"/>
        
        <!-- Interchangeable Friction Runner Surface (Rendered with Plane Material) -->
        <rect id="reposeRunnerTrack" x="${R_PIVOT.x}" y="${R_PIVOT.y - 8}" width="${R_PLANE_LEN}" height="4" fill="${pStyle.planeFill}" stroke="${pStyle.planeStroke}" stroke-width="0.8"/>
        ${pStyle.pattern ? `<rect x="${R_PIVOT.x}" y="${R_PIVOT.y - 8}" width="${R_PLANE_LEN}" height="4" fill="${pStyle.pattern}" opacity="0.65" pointer-events="none"/>` : ''}

        <!-- End Stop Bracket at Pivot End -->
        <rect x="${R_PIVOT.x - 3}" y="${R_PIVOT.y - 18}" width="5" height="18" rx="1" fill="var(--accent-blue)" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>

        <!-- Sliding Block Assembly -->
        <g id="reposeBlockGroup">
          <rect id="reposeBlockRect" x="0" y="0" width="52" height="34" rx="2" fill="${bStyle.fill}" stroke="${bStyle.stroke}" stroke-width="1.2"/>
          ${bStyle.pattern ? `<rect id="reposeBlockPat" x="0" y="0" width="52" height="34" rx="2" fill="${bStyle.pattern}" opacity="0.75" pointer-events="none"/>` : ''}
          <rect id="reposeBlockBevel" x="0" y="0" width="52" height="6" rx="1.5" fill="rgba(255,255,255,0.28)"/>
          <text id="reposeBlockText" x="26" y="22" text-anchor="middle" font-family="JetBrains Mono" font-size="12" font-weight="700" fill="${bStyle.labelColor}" stroke="${bStyle.textStroke}" stroke-width="2.5" paint-order="stroke fill">W</text>
        </g>
      </g>

      <!-- Force Vectors in World Coordinates -->
      <g id="reposeForces"></g>

      <!-- Slip Alert Indicator -->
      <g id="reposeSlipIndicator" opacity="0">
        <rect x="170" y="44" width="260" height="34" rx="17" fill="rgba(255, 77, 77, 0.14)" stroke="var(--accent-red)" stroke-width="1.2"/>
        <text id="reposeSlipText" x="300" y="66" text-anchor="middle" fill="var(--accent-red)" font-size="12" font-family="Inter, sans-serif" font-weight="700">⚠ CRITICAL SLIP AT α = 0.0°</text>
      </g>

      <!-- Technical Telemetry & Material Pair Indicator in Viewport -->
      <g id="reposeTelemetryOverlay" class="sim-telemetry-overlay">
        <rect x="18" y="16" width="260" height="24" rx="4" class="telemetry-badge-rect" fill="var(--bg-card)" stroke="var(--border-subtle)" stroke-width="0.8"/>
        <circle cx="28" cy="28" r="4.5" fill="${bStyle.swatch}" stroke="var(--border-subtle)" stroke-width="0.5"/>
        <text x="38" y="32" font-family="JetBrains Mono" font-size="9.5" fill="var(--text-secondary)">Block: <tspan fill="var(--text-primary)" font-weight="700">${bStyle.name}</tspan></text>
        <line x1="130" y1="20" x2="130" y2="36" stroke="var(--border-subtle)"/>
        <circle cx="142" cy="28" r="4.5" fill="${pStyle.swatch}" stroke="var(--border-subtle)" stroke-width="0.5"/>
        <text x="152" y="32" font-family="JetBrains Mono" font-size="9.5" fill="var(--text-secondary)">Plane: <tspan fill="var(--text-primary)" font-weight="700">${pStyle.name}</tspan></text>
      </g>

      <text id="reposeStatusText" x="300" y="28" text-anchor="middle" fill="var(--accent-cyan)" font-size="12" font-family="JetBrains Mono" font-weight="600" opacity="0.85"></text>
    `;

    updateReposeSVG();
  }

  function updateReposeSVG() {
    const angleDeg = parseFloat(reposeAngleSlider.value);
    const weight = parseFloat(reposeWeightSlider.value);
    const angleRad = toRad(angleDeg);
    const mu = Math.tan(angleRad);
    const svg = document.getElementById('reposeSvg');
    if (!svg) return;

    // Rotate incline board around pivot
    const incline = document.getElementById('reposeIncline');
    if (incline) {
      incline.setAttribute('transform', `rotate(${-angleDeg}, ${R_PIVOT.x}, ${R_PIVOT.y})`);
    }

    // Update needle
    updateDialNeedle(svg, R_PIVOT.x, R_PIVOT.y, R_DIAL_R, angleDeg);

    // Dynamic block geometry based on physical weight
    const blockW = 44 + weight * 0.5;
    const blockH = 26 + weight * 0.35;
    const blockX = R_PIVOT.x + R_PLANE_LEN * 0.44 - blockW / 2;
    const blockY = R_PIVOT.y - 8 - blockH;

    const blockRect = document.getElementById('reposeBlockRect');
    const blockPat = document.getElementById('reposeBlockPat');
    const blockBevel = document.getElementById('reposeBlockBevel');
    const blockText = document.getElementById('reposeBlockText');

    if (blockRect && !simState.repose.sliding) {
      [blockRect, blockPat, blockBevel].forEach(el => {
        if (el) {
          el.setAttribute('x', blockX);
          el.setAttribute('y', blockY);
          el.setAttribute('width', blockW);
          el.setAttribute('height', el === blockBevel ? Math.min(6, blockH * 0.22) : blockH);
        }
      });
      if (blockText) {
        blockText.setAttribute('x', blockX + blockW / 2);
        blockText.setAttribute('y', blockY + blockH / 2 + 4.5);
      }
    }

    // Calculate Real-Time Force Vectors in World Coordinates
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    const bcLocalX = blockX + blockW / 2;
    const bcLocalY = blockY + blockH / 2;
    const dx = bcLocalX - R_PIVOT.x;
    const dy = bcLocalY - R_PIVOT.y;
    const worldX = R_PIVOT.x + dx * cosA - dy * (-sinA);
    const worldY = R_PIVOT.y + dx * (-sinA) + dy * cosA;

    const forcesGroup = document.getElementById('reposeForces');
    let forcesHTML = '';

    if (angleDeg > 0.5 && !simState.repose.sliding) {
      const gLen = Math.min(weight * 1.6 + 20, 68);
      // Gravity W (pointing straight down)
      forcesHTML += `
        <line x1="${worldX.toFixed(1)}" y1="${worldY.toFixed(1)}" x2="${worldX.toFixed(1)}" y2="${(worldY + gLen).toFixed(1)}"
              stroke="var(--accent-green)" stroke-width="2" marker-end="url(#arrowGreen)" opacity="0.8"/>
        <text x="${worldX + 8}" y="${worldY + gLen / 2 + 3}" fill="var(--accent-green)" font-size="10" font-family="JetBrains Mono" font-weight="700">W</text>
      `;

      // Normal Reaction N (perpendicular to plane surface)
      const nLen = Math.min(weight * 1.5 * cosA + 16, 55);
      const nEndX = worldX + nLen * sinA;
      const nEndY = worldY - nLen * cosA;
      forcesHTML += `
        <line x1="${worldX.toFixed(1)}" y1="${worldY.toFixed(1)}" x2="${nEndX.toFixed(1)}" y2="${nEndY.toFixed(1)}"
              stroke="var(--accent-purple)" stroke-width="1.8" stroke-dasharray="4,2" marker-end="url(#arrowPurple)" opacity="0.8"/>
        <text x="${(nEndX + 6).toFixed(1)}" y="${(nEndY - 2).toFixed(1)}" fill="var(--accent-purple)" font-size="10" font-family="JetBrains Mono" font-weight="700">N</text>
      `;

      // Limiting Static Friction force f (along surface up-slope towards pivot)
      const fLen = Math.min(weight * 1.5 * sinA + 14, 55);
      const fEndX = worldX - fLen * cosA;
      const fEndY = worldY - fLen * sinA;
      forcesHTML += `
        <line x1="${worldX.toFixed(1)}" y1="${worldY.toFixed(1)}" x2="${fEndX.toFixed(1)}" y2="${fEndY.toFixed(1)}"
              stroke="var(--accent-amber)" stroke-width="2" marker-end="url(#arrowAmber)" opacity="0.85"/>
        <text x="${(fEndX - 12).toFixed(1)}" y="${(fEndY + 3).toFixed(1)}" fill="var(--accent-amber)" font-size="10" font-family="JetBrains Mono" font-weight="700">f</text>
      `;
    }
    if (forcesGroup) forcesGroup.innerHTML = forcesHTML;

    // Check for slip
    checkReposeSlip(angleDeg, weight);
  }

  function checkReposeSlip(angleDeg, weight) {
    if (simState.repose.sliding) return;

    if (angleDeg >= simState.repose.threshold) {
      simState.repose.sliding = true;

      // Display slip banner with critical angle
      const indicator = document.getElementById('reposeSlipIndicator');
      const slipText = document.getElementById('reposeSlipText');
      if (indicator && slipText) {
        indicator.setAttribute('opacity', '1');
        slipText.textContent = `⚠ SLIPPED AT α = ${angleDeg.toFixed(1)}° — μ_s = ${Math.tan(toRad(angleDeg)).toFixed(4)}`;
      }

      // Physical acceleration down the inclined plane towards the bottom stop bracket
      const blockGroup = document.getElementById('reposeBlockGroup');
      if (blockGroup) {
        blockGroup.style.transition = 'transform 0.85s cubic-bezier(0.38, 0, 0.7, 1)';
        blockGroup.style.transform = 'translate(-140px, 0)';
      }

      const statusEl = document.getElementById('reposeStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span class="status-badge error">⚠ Block slipped at ${angleDeg.toFixed(1)}° — recorded static angle of repose</span>`;
      }
    }
  }

  function resetReposeBlock() {
    const blockGroup = document.getElementById('reposeBlockGroup');
    if (blockGroup) {
      blockGroup.style.transition = 'none';
      blockGroup.style.transform = 'translate(0, 0)';
    }

    const indicator = document.getElementById('reposeSlipIndicator');
    if (indicator) indicator.setAttribute('opacity', '0');

    simState.repose.sliding = false;
    if (simState.repose.timer) {
      clearTimeout(simState.repose.timer);
      simState.repose.timer = null;
    }
  }

  function resetReposeApparatus() {
    resetReposeBlock();
    reposeAngleSlider.value = 0;
    refreshReposeThreshold(reposeMaterialSelect.value);
    renderReposeSVG();
    updateReposeReadout();
  }
  window.resetReposeApparatus = resetReposeApparatus;

  function updateReposeReadout() {
    const angleDeg = parseFloat(reposeAngleSlider.value);
    const weight = parseFloat(reposeWeightSlider.value);
    const angleRad = toRad(angleDeg);
    const mu = Math.tan(angleRad);
    const muDisplay = angleDeg >= 89.5 ? '∞' : mu.toFixed(4);

    const elAngle = document.getElementById('reposeAngleValue');
    const elWeight = document.getElementById('reposeWeightValue');
    const elMu = document.getElementById('reposeMu');
    const elReadoutAngle = document.getElementById('reposeReadoutAngle');
    const elReadoutWeight = document.getElementById('reposeReadoutWeight');
    const elReadoutTan = document.getElementById('reposeReadoutTan');
    const elReadoutMu = document.getElementById('reposeReadoutMu');
    const statusEl = document.getElementById('reposeStatus');
    const readoutStatusEl = document.getElementById('reposeReadoutStatus');

    if (elAngle) elAngle.textContent = angleDeg.toFixed(1) + '°';
    if (elWeight) elWeight.textContent = weight.toFixed(1) + ' N';
    if (elMu) elMu.textContent = muDisplay;
    if (elReadoutAngle) elReadoutAngle.textContent = angleDeg.toFixed(1) + '°';
    if (elReadoutWeight) elReadoutWeight.textContent = weight.toFixed(1) + ' N';
    if (elReadoutTan) elReadoutTan.textContent = muDisplay;
    if (elReadoutMu) elReadoutMu.textContent = muDisplay;

    if (!simState.repose.sliding) {
      if (angleDeg <= 0) {
        if (elMu) elMu.className = 'mu-readout';
        if (statusEl) statusEl.innerHTML = '<span class="status-badge success">Plane is level (0°) — raise angle to begin test</span>';
        if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge success">Level</span>';
      } else if (angleDeg >= simState.repose.threshold * 0.88) {
        if (elMu) elMu.className = 'mu-readout warning';
        if (statusEl) statusEl.innerHTML = '<span class="status-badge warning">Approaching slip threshold — raise carefully</span>';
        if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge warning">Near Slip</span>';
      } else {
        if (elMu) elMu.className = 'mu-readout';
        if (statusEl) statusEl.innerHTML = '<span class="status-badge success">Static equilibrium — block is stable</span>';
        if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge success">Stable</span>';
      }
    }
  }

  function updateRepose() {
    updateReposeReadout();
    updateReposeSVG();
  }

  reposeAngleSlider.addEventListener('input', updateRepose);
  reposeWeightSlider.addEventListener('input', updateRepose);
  reposeMaterialSelect.addEventListener('change', () => {
    resetReposeApparatus();
  });

  const reposeResetBtn = document.getElementById('reposeResetBtn');
  if (reposeResetBtn) {
    reposeResetBtn.addEventListener('click', () => {
      resetReposeApparatus();
      showSimToast('Apparatus Reset', 'Angle set to 0.0° — ready for a fresh measurement');
    });
  }

  /* ================================================================
     METHOD 2: FRICTION PLANE (APPARATUS OVERHAUL)
     ================================================================ */
  const F_PIVOT = { x: 70, y: 340 };
  const F_PLANE_LEN = 410;
  const F_DIAL_R = 48;
  const PULLEY_R = 14;

  function renderFrictionSVG() {
    const svg = document.getElementById('frictionSvg');
    if (!svg) return;
    const matKey = frictionMaterialSelect.value;
    const mat = MATERIALS[matKey];
    const bStyle = MATERIAL_STYLES[mat.blockMat];
    const pStyle = MATERIAL_STYLES[mat.planeMat];
    const angleDeg = parseFloat(frictionAngleSlider.value);

    svg.innerHTML = `
      ${getMaterialDefsSVG()}
      ${apparatusChrome(F_PIVOT.x, F_PIVOT.y)}
      ${protractorDial(F_PIVOT.x, F_PIVOT.y, F_DIAL_R, angleDeg, 'θ')}

      <!-- Rotating Incline Group -->
      <g id="frictionPlaneGroup">
        <!-- Structural Board Base Extrusion -->
        <rect x="${F_PIVOT.x}" y="${F_PIVOT.y - 4}" width="${F_PLANE_LEN}" height="9" rx="1" fill="#1e2430" stroke="var(--accent-blue)" stroke-width="1.2"/>

        <!-- Interchangeable Friction Runner Surface (Rendered with Plane Material) -->
        <rect id="frictionRunnerTrack" x="${F_PIVOT.x}" y="${F_PIVOT.y - 8}" width="${F_PLANE_LEN}" height="4" fill="${pStyle.planeFill}" stroke="${pStyle.planeStroke}" stroke-width="0.8"/>
        ${pStyle.pattern ? `<rect x="${F_PIVOT.x}" y="${F_PIVOT.y - 8}" width="${F_PLANE_LEN}" height="4" fill="${pStyle.pattern}" opacity="0.65" pointer-events="none"/>` : ''}

        <!-- End Bracket / Stop at Pivot End -->
        <rect x="${F_PIVOT.x - 3}" y="${F_PIVOT.y - 18}" width="5" height="18" rx="1" fill="var(--accent-blue)" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>

        <!-- Pulley Mounting Bracket at Tip -->
        <path d="M ${F_PIVOT.x + F_PLANE_LEN - 4} ${F_PIVOT.y - 4} L ${F_PIVOT.x + F_PLANE_LEN + 14} ${F_PIVOT.y - 10} L ${F_PIVOT.x + F_PLANE_LEN + 14} ${F_PIVOT.y + 6} L ${F_PIVOT.x + F_PLANE_LEN - 4} ${F_PIVOT.y + 4} Z" fill="rgba(90, 140, 160, 0.35)" stroke="var(--accent-blue)" stroke-width="1"/>

        <!-- Pulley Wheel Assembly -->
        <g id="frictionPulleyWheel" transform="translate(${F_PIVOT.x + F_PLANE_LEN + 14}, ${F_PIVOT.y - 8})">
          <circle cx="0" cy="0" r="${PULLEY_R}" fill="rgba(8, 14, 26, 0.95)" stroke="var(--accent-cyan)" stroke-width="2"/>
          <circle cx="0" cy="0" r="${PULLEY_R - 4}" fill="none" stroke="rgba(0, 229, 255, 0.45)" stroke-width="1" stroke-dasharray="3,3"/>
          <g id="pulleySpokes">
            <line x1="-10" y1="0" x2="10" y2="0" stroke="rgba(0, 229, 255, 0.6)" stroke-width="1"/>
            <line x1="0" y1="-10" x2="0" y2="10" stroke="rgba(0, 229, 255, 0.6)" stroke-width="1"/>
          </g>
          <circle cx="0" cy="0" r="3" fill="var(--accent-cyan)"/>
        </g>

        <!-- Block Assembly on Plane -->
        <g id="frictionBlockMover">
          <rect id="frictionBlockRect" x="0" y="0" width="48" height="32" rx="2" fill="${bStyle.fill}" stroke="${bStyle.stroke}" stroke-width="1.2"/>
          ${bStyle.pattern ? `<rect id="frictionBlockPat" x="0" y="0" width="48" height="32" rx="2" fill="${bStyle.pattern}" opacity="0.75" pointer-events="none"/>` : ''}
          <rect id="frictionBlockBevel" x="0" y="0" width="48" height="6" rx="1.5" fill="rgba(255,255,255,0.28)"/>
          <text id="frictionBlockLabel" x="24" y="21" text-anchor="middle" font-family="JetBrains Mono" font-size="11" font-weight="700" fill="${bStyle.labelColor}" stroke="${bStyle.textStroke}" stroke-width="2.5" paint-order="stroke fill">W</text>
          
          <!-- Hitch Eyelet Hook at Front Face -->
          <circle id="frictionBlockEyelet" cx="48" cy="18" r="2.8" fill="var(--accent-amber)" stroke="rgba(0,0,0,0.5)" stroke-width="0.8"/>
        </g>

        <!-- String 1: Straight from Block Eyelet to Pulley Top Rim (in plane space) -->
        <line id="frictionString1" x1="0" y1="0" x2="0" y2="0" stroke="rgba(255, 255, 255, 0.88)" stroke-width="1.6" stroke-dasharray="4,2"/>
      </g>

      <!-- Pulley Tangent Arc (world space string wrapping over the wheel) -->
      <path id="frictionPulleyWrapArc" d="" fill="none" stroke="rgba(255, 255, 255, 0.88)" stroke-width="1.6"/>

      <!-- Vertical Hanging Assembly (Scale Pan + Slotted Weights) -->
      <g id="frictionHangAnchor">
        <!-- Vertical Cord to Stirrup Hanger Ring -->
        <line id="frictionHangString" x1="0" y1="0" x2="0" y2="60" stroke="rgba(255, 255, 255, 0.88)" stroke-width="1.6" stroke-dasharray="4,2"/>

        <!-- Scale Pan Assembly (Stirrup + Tray + Stacked Weights) -->
        <g id="frictionPanAssembly" transform="translate(0, 60)">
          <!-- Brass Stirrup Hanger Wire -->
          <path d="M -15 0 L 0 -13 L 15 0" fill="none" stroke="#ffd700" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="0" cy="-13" r="2" fill="#ffd700"/>

          <!-- Polished Golden Brass Scale Pan Tray (Plate) -->
          <rect x="-19" y="0" width="38" height="5" rx="1.5" fill="url(#panPlateGrad)" stroke="#8c6d1d" stroke-width="0.8"/>
          <line x1="-17" y1="1" x2="17" y2="1" stroke="rgba(255,255,255,0.75)" stroke-width="0.8"/>

          <!-- Dynamic Stacked Slotted Weights (injected by JS) -->
          <g id="frictionSlottedWeights"></g>

          <!-- Pan Pull Force Reading Pill -->
          <text id="frictionPanPillText" x="0" y="16" text-anchor="middle" font-family="JetBrains Mono" font-size="9" font-weight="700" fill="var(--accent-cyan)">P = 0.0 N</text>
        </g>
      </g>

      <!-- Force Vectors in World Coordinates -->
      <g id="frictionForces"></g>

      <!-- Motion Indicator Banner -->
      <g id="frictionMoveIndicator" opacity="0">
        <rect x="170" y="44" width="260" height="34" rx="17" fill="rgba(0, 229, 255, 0.14)" stroke="var(--accent-cyan)" stroke-width="1.2"/>
        <text x="300" y="66" text-anchor="middle" fill="var(--accent-cyan)" font-size="12" font-family="Inter, sans-serif" font-weight="700">▲ BLOCK MOVING UP INCLINE</text>
      </g>

      <!-- Telemetry Overlay (Materials Display) -->
      <g id="frictionTelemetryOverlay" class="sim-telemetry-overlay">
        <rect x="18" y="16" width="260" height="24" rx="4" class="telemetry-badge-rect" fill="var(--bg-card)" stroke="var(--border-subtle)" stroke-width="0.8"/>
        <circle cx="28" cy="28" r="4.5" fill="${bStyle.swatch}" stroke="var(--border-subtle)" stroke-width="0.5"/>
        <text x="38" y="32" font-family="JetBrains Mono" font-size="9.5" fill="var(--text-secondary)">Block: <tspan fill="var(--text-primary)" font-weight="700">${bStyle.name}</tspan></text>
        <line x1="130" y1="20" x2="130" y2="36" stroke="var(--border-subtle)"/>
        <circle cx="142" cy="28" r="4.5" fill="${pStyle.swatch}" stroke="var(--border-subtle)" stroke-width="0.5"/>
        <text x="152" y="32" font-family="JetBrains Mono" font-size="9.5" fill="var(--text-secondary)">Plane: <tspan fill="var(--text-primary)" font-weight="700">${pStyle.name}</tspan></text>
      </g>

      <text id="frictionStatusText" x="300" y="28" text-anchor="middle" fill="var(--accent-cyan)" font-size="12" font-family="JetBrains Mono" font-weight="600" opacity="0.85"></text>
    `;

    updateFrictionSVG();
  }

  function updateFrictionSVG() {
    const angleDeg = parseFloat(frictionAngleSlider.value);
    const weight = parseFloat(frictionWeightSlider.value);
    const pullForce = parseFloat(frictionForceSlider.value);
    const angleRad = toRad(angleDeg);
    const svg = document.getElementById('frictionSvg');
    if (!svg) return;

    // Rotate plane group
    const planeGroup = document.getElementById('frictionPlaneGroup');
    if (planeGroup) {
      planeGroup.setAttribute('transform', `rotate(${-angleDeg}, ${F_PIVOT.x}, ${F_PIVOT.y})`);
    }

    // Update protractor needle
    updateDialNeedle(svg, F_PIVOT.x, F_PIVOT.y, F_DIAL_R, angleDeg);

    // Physics checks for motion up the plane
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    const Wcosth = weight * cosA;
    const Wsinth = weight * sinA;
    const requiredP = simState.friction.trueMu * Wcosth + Wsinth;
    const willMove = pullForce >= requiredP && pullForce > 0;

    // Block dimensions & position
    const blockW = 44 + weight * 0.45;
    const blockH = 26 + weight * 0.35;
    const initialBlockDist = F_PLANE_LEN * 0.38;
    
    // When climbing, block slides smoothly up the plane towards pulley
    const climbOffset = willMove ? 42 : 0;
    const blockLocalX = F_PIVOT.x + initialBlockDist - blockW / 2 + climbOffset;
    const blockLocalY = F_PIVOT.y - 8 - blockH;

    const blockMover = document.getElementById('frictionBlockMover');
    const blockRect = document.getElementById('frictionBlockRect');
    const blockPat = document.getElementById('frictionBlockPat');
    const blockBevel = document.getElementById('frictionBlockBevel');
    const blockLabel = document.getElementById('frictionBlockLabel');
    const blockEyelet = document.getElementById('frictionBlockEyelet');

    if (blockRect) {
      [blockRect, blockPat, blockBevel].forEach(el => {
        if (el) {
          el.setAttribute('x', blockLocalX);
          el.setAttribute('y', blockLocalY);
          el.setAttribute('width', blockW);
          el.setAttribute('height', el === blockBevel ? Math.min(6, blockH * 0.22) : blockH);
        }
      });
      if (blockLabel) {
        blockLabel.setAttribute('x', blockLocalX + blockW / 2);
        blockLabel.setAttribute('y', blockLocalY + blockH / 2 + 4.5);
      }
      if (blockEyelet) {
        blockEyelet.setAttribute('cx', blockLocalX + blockW);
        blockEyelet.setAttribute('cy', blockLocalY + blockH - 8);
      }
      if (blockMover) {
        blockMover.style.transition = 'all 0.55s ease';
      }
    }

    // Pulley axle coordinates in world space
    const pulleyLocalX = F_PIVOT.x + F_PLANE_LEN + 14;
    const pulleyLocalY = F_PIVOT.y - 8;
    const dxP = pulleyLocalX - F_PIVOT.x;
    const dyP = pulleyLocalY - F_PIVOT.y;
    const pulleyWorldX = F_PIVOT.x + dxP * cosA - dyP * (-sinA);
    const pulleyWorldY = F_PIVOT.y + dxP * (-sinA) + dyP * cosA;

    // String 1: from eyelet along incline to top tangent of pulley
    const string1 = document.getElementById('frictionString1');
    if (string1) {
      const eyeX = blockLocalX + blockW;
      const eyeY = blockLocalY + blockH - 8;
      // Top tangent of pulley in local coords: y = pulleyLocalY - PULLEY_R
      string1.setAttribute('x1', eyeX.toFixed(1));
      string1.setAttribute('y1', eyeY.toFixed(1));
      string1.setAttribute('x2', (pulleyLocalX - 3).toFixed(1));
      string1.setAttribute('y2', (pulleyLocalY - PULLEY_R).toFixed(1));
      string1.style.transition = 'all 0.55s ease';
    }

    // Rotate pulley spokes if climbing
    const pulleySpokes = document.getElementById('pulleySpokes');
    if (pulleySpokes) {
      pulleySpokes.setAttribute('transform', willMove ? 'rotate(54 0 0)' : 'rotate(0 0 0)');
      pulleySpokes.style.transition = 'transform 0.55s ease';
    }

    // Wrap Arc over Pulley in World Space
    const wrapArc = document.getElementById('frictionPulleyWrapArc');
    const hangAnchor = document.getElementById('frictionHangAnchor');
    const hangString = document.getElementById('frictionHangString');
    const panAssembly = document.getElementById('frictionPanAssembly');

    // Tangent wrap geometry: entry from incline top tangent to vertical rightmost edge
    const rDropWorldX = pulleyWorldX + PULLEY_R;
    const rDropWorldY = pulleyWorldY;

    if (wrapArc) {
      // Curve from entry point around pulley rim to drop point
      const entryAngRad = -angleRad + Math.PI / 2;
      const entryX = pulleyWorldX + PULLEY_R * Math.cos(entryAngRad);
      const entryY = pulleyWorldY - PULLEY_R * Math.sin(entryAngRad);
      wrapArc.setAttribute('d', `M ${entryX.toFixed(1)} ${entryY.toFixed(1)} A ${PULLEY_R} ${PULLEY_R} 0 0 1 ${rDropWorldX.toFixed(1)} ${rDropWorldY.toFixed(1)}`);
    }

    // Hanging pan drops down as block climbs
    const panDropBase = 62;
    const panDropDist = panDropBase + (willMove ? climbOffset : 0);

    if (hangAnchor) {
      hangAnchor.setAttribute('transform', `translate(${rDropWorldX.toFixed(1)}, ${rDropWorldY.toFixed(1)})`);
    }
    if (hangString) {
      hangString.setAttribute('x1', '0');
      hangString.setAttribute('y1', '0');
      hangString.setAttribute('x2', '0');
      hangString.setAttribute('y2', (panDropDist - 13).toFixed(1));
      hangString.style.transition = 'y2 0.55s ease';
    }
    if (panAssembly) {
      panAssembly.setAttribute('transform', `translate(0, ${panDropDist.toFixed(1)})`);
      panAssembly.style.transition = 'transform 0.55s ease';
    }

    // Stacked Slotted Weights inside Scale Pan
    const weightsGroup = document.getElementById('frictionSlottedWeights');
    if (weightsGroup) {
      let wHTML = '';
      if (pullForce > 0.05) {
        // Slotted weight count: 1 to 6 discs proportional to P
        const numDiscs = Math.min(6, Math.max(1, Math.ceil(pullForce / 3.5)));
        for (let i = 0; i < numDiscs; i++) {
          const dy = -(i * 5.5 + 5);
          wHTML += `
            <g class="pan-slotted-disc" transform="translate(0, ${dy})">
              <!-- Slotted Brass Cylindrical Disc -->
              <rect x="-15" y="0" width="30" height="5" rx="1.5" fill="url(#weightBrassGrad)" stroke="#8c6d1d" stroke-width="0.6"/>
              <!-- Center Slot Cutout (Real slotted weight detail) -->
              <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(30, 20, 5, 0.45)" stroke-width="1.2"/>
              <!-- Specular rim highlight -->
              <line x1="-13" y1="0.8" x2="13" y2="0.8" stroke="rgba(255, 255, 255, 0.65)" stroke-width="0.6"/>
            </g>
          `;
        }
      }
      weightsGroup.innerHTML = wHTML;
    }

    const panPill = document.getElementById('frictionPanPillText');
    if (panPill) {
      panPill.textContent = `P = ${pullForce.toFixed(1)} N`;
    }

    // Motion Indicator
    const moveIndicator = document.getElementById('frictionMoveIndicator');
    if (moveIndicator) {
      moveIndicator.setAttribute('opacity', willMove ? '1' : '0');
    }

    // Force Vectors in World Coordinates
    const forcesGroup = document.getElementById('frictionForces');
    let forcesHTML = '';
    const bWorldCenterX = F_PIVOT.x + (blockLocalX + blockW / 2 - F_PIVOT.x) * cosA - (blockLocalY + blockH / 2 - F_PIVOT.y) * (-sinA);
    const bWorldCenterY = F_PIVOT.y + (blockLocalX + blockW / 2 - F_PIVOT.x) * (-sinA) + (blockLocalY + blockH / 2 - F_PIVOT.y) * cosA;

    // Gravity W
    const gLen = Math.min(weight * 1.5 + 18, 62);
    forcesHTML += `
      <line x1="${bWorldCenterX.toFixed(1)}" y1="${bWorldCenterY.toFixed(1)}" x2="${bWorldCenterX.toFixed(1)}" y2="${(bWorldCenterY + gLen).toFixed(1)}"
            stroke="var(--accent-green)" stroke-width="2" marker-end="url(#arrowGreen)" opacity="0.8"/>
      <text x="${bWorldCenterX + 8}" y="${bWorldCenterY + gLen / 2 + 3}" fill="var(--accent-green)" font-size="10" font-family="JetBrains Mono" font-weight="700">W</text>
    `;

    // Tension Pull Force P (along plane towards pulley)
    if (pullForce > 0.2) {
      const pLen = Math.min(pullForce * 1.5 + 16, 65);
      const pEndX = bWorldCenterX + pLen * cosA;
      const pEndY = bWorldCenterY - pLen * sinA;
      forcesHTML += `
        <line x1="${bWorldCenterX.toFixed(1)}" y1="${bWorldCenterY.toFixed(1)}" x2="${pEndX.toFixed(1)}" y2="${pEndY.toFixed(1)}"
              stroke="var(--accent-cyan)" stroke-width="2.2" marker-end="url(#arrowCyan)" opacity="0.85"/>
        <text x="${(pEndX + 6).toFixed(1)}" y="${(pEndY - 3).toFixed(1)}" fill="var(--accent-cyan)" font-size="10" font-family="JetBrains Mono" font-weight="700">P</text>
      `;
    }
    if (forcesGroup) forcesGroup.innerHTML = forcesHTML;
  }

  function resetFrictionApparatus() {
    frictionForceSlider.value = 0;
    refreshFrictionThreshold(frictionMaterialSelect.value);
    renderFrictionSVG();
    updateFrictionReadout();
  }
  window.resetFrictionApparatus = resetFrictionApparatus;

  function updateFrictionReadout() {
    const angleDeg = parseFloat(frictionAngleSlider.value);
    const weight = parseFloat(frictionWeightSlider.value);
    const pullForce = parseFloat(frictionForceSlider.value);
    const angleRad = toRad(angleDeg);

    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const Wcosth = weight * cosA;
    const Wsinth = weight * sinA;

    let mu, isValid = true, pTooLow = false;

    if (Wcosth < 0.0001) {
      mu = Infinity;
      isValid = false;
    } else {
      // Limiting equilibrium: P = W sin θ + μ W cos θ
      // μ = (P - W sin θ) / (W cos θ)
      // When θ = 0°: μ = P / W
      mu = (pullForce - Wsinth) / Wcosth;
      if (pullForce < Wsinth - 0.0001) {
        pTooLow = true;
        isValid = false;
      }
    }

    const muDisplay = !isValid ? (pTooLow ? '< 0' : '∞') : mu.toFixed(4);

    const elAngle = document.getElementById('frictionAngleValue');
    const elWeight = document.getElementById('frictionWeightValue');
    const elForce = document.getElementById('frictionForceValue');
    const elMu = document.getElementById('frictionMu');
    const elReadoutAngle = document.getElementById('frictionReadoutAngle');
    const elReadoutWeight = document.getElementById('frictionReadoutWeight');
    const elReadoutForce = document.getElementById('frictionReadoutForce');
    const elReadoutMu = document.getElementById('frictionReadoutMu');
    const statusEl = document.getElementById('frictionStatus');
    const readoutStatusEl = document.getElementById('frictionReadoutStatus');

    if (elAngle) elAngle.textContent = angleDeg.toFixed(1) + '°';
    if (elWeight) elWeight.textContent = weight.toFixed(1) + ' N';
    if (elForce) elForce.textContent = pullForce.toFixed(1) + ' N';
    if (elMu) elMu.textContent = muDisplay;
    if (elReadoutAngle) elReadoutAngle.textContent = angleDeg.toFixed(1) + '°';
    if (elReadoutWeight) elReadoutWeight.textContent = weight.toFixed(1) + ' N';
    if (elReadoutForce) elReadoutForce.textContent = pullForce.toFixed(1) + ' N';
    if (elReadoutMu) elReadoutMu.textContent = muDisplay;

    // Movement threshold check
    const requiredP = simState.friction.trueMu * Wcosth + Wsinth;
    const willMove = pullForce >= requiredP && pullForce > 0 && isValid;

    if (pTooLow) {
      if (elMu) elMu.className = 'mu-readout error';
      if (statusEl) statusEl.innerHTML = '<span class="status-badge error">P is below downhill gravity (W sin θ)</span>';
      if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge error">P &lt; W sin θ</span>';
    } else if (willMove) {
      if (elMu) { elMu.className = 'mu-readout'; elMu.style.color = 'var(--accent-green)'; }
      if (statusEl) statusEl.innerHTML = '<span class="status-badge success">Block is moving up plane — Limiting pull P reached ✓</span>';
      if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge success">Moving ▲</span>';
    } else if (pullForce <= 0) {
      if (elMu) { elMu.className = 'mu-readout'; elMu.style.color = ''; }
      if (statusEl) statusEl.innerHTML = '<span class="status-badge success">Pan is empty (P = 0 N) — Add slotted weights to pan</span>';
      if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge success">Empty Pan</span>';
    } else {
      if (elMu) { elMu.className = 'mu-readout'; elMu.style.color = ''; }
      if (statusEl) statusEl.innerHTML = '<span class="status-badge success">Static equilibrium — Add more weights until block slides</span>';
      if (readoutStatusEl) readoutStatusEl.innerHTML = '<span class="status-badge success">Stable</span>';
    }
  }

  function updateFriction() {
    updateFrictionReadout();
    updateFrictionSVG();
  }

  frictionAngleSlider.addEventListener('input', updateFriction);
  frictionWeightSlider.addEventListener('input', updateFriction);
  frictionForceSlider.addEventListener('input', updateFriction);
  frictionMaterialSelect.addEventListener('change', () => {
    resetFrictionApparatus();
  });

  // Quick Slotted Weight Increment Buttons
  document.querySelectorAll('[data-add-p]').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseFloat(btn.dataset.addP);
      const current = parseFloat(frictionForceSlider.value) || 0;
      const next = Math.min(100, Math.max(0, current + delta));
      frictionForceSlider.value = next.toFixed(1);
      updateFriction();
    });
  });

  const clearPanBtn = document.getElementById('clearPanBtn');
  if (clearPanBtn) {
    clearPanBtn.addEventListener('click', () => {
      frictionForceSlider.value = 0;
      updateFriction();
    });
  }

  const frictionResetBtn = document.getElementById('frictionResetBtn');
  if (frictionResetBtn) {
    frictionResetBtn.addEventListener('click', () => {
      resetFrictionApparatus();
      showSimToast('Apparatus Reset', 'Pull force P cleared to 0.0 N — ready for next trial');
    });
  }

  // Stepper buttons (- / +) for all simulation sliders
  document.querySelectorAll('.slider-step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.stepTarget;
      const delta = parseFloat(btn.dataset.step);
      const slider = document.getElementById(targetId);
      if (!slider) return;

      const min = parseFloat(slider.min) !== undefined ? parseFloat(slider.min) : 0;
      const max = parseFloat(slider.max) !== undefined ? parseFloat(slider.max) : 100;
      const step = parseFloat(slider.step) || 0.1;
      const current = parseFloat(slider.value) || 0;

      let next = current + delta;
      next = Math.max(min, Math.min(max, next));
      const stepDecimals = (step.toString().split('.')[1] || '').length;
      next = parseFloat(next.toFixed(Math.max(1, stepDecimals)));

      slider.value = next;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  /* ================================================================
     Tab Switching
     ================================================================ */
  const simTabs = document.getElementById('simTabs');
  if (simTabs) {
    simTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      const tab = btn.dataset.tab;

      simTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById('tab-' + tab);
      if (activePanel) activePanel.classList.add('active');
    });
  }

  window.selectSimTab = function (tab) {
    window.location.hash = 'simulate';
    setTimeout(() => {
      if (simTabs) {
        const btn = simTabs.querySelector(`[data-tab="${tab}"]`);
        if (btn) btn.click();
      }
    }, 100);
  };

  /* ================================================================
     Values Accessors for Data Log
     ================================================================ */
  window.getReposeValues = function () {
    const angle = parseFloat(reposeAngleSlider.value);
    const weight = parseFloat(reposeWeightSlider.value);
    const mu = Math.tan(toRad(angle));
    const material = reposeMaterialSelect.value;
    return { angle, weight, mu, material, method: 'repose' };
  };

  window.getFrictionValues = function () {
    const angle = parseFloat(frictionAngleSlider.value);
    const weight = parseFloat(frictionWeightSlider.value);
    const pullForce = parseFloat(frictionForceSlider.value);
    const angleRad = toRad(angle);
    const Wcosth = weight * Math.cos(angleRad);
    const mu = Wcosth > 0.0001 ? (pullForce - weight * Math.sin(angleRad)) / Wcosth : null;
    const material = frictionMaterialSelect.value;
    return { angle, weight, pullForce, mu, material, method: 'friction' };
  };

  /* ================================================================
     Initial Render
     ================================================================ */
  renderReposeSVG();
  updateReposeReadout();
  renderFrictionSVG();
  updateFrictionReadout();
})();
