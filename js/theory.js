/**
 * theory.js — Renders the Editorial Physics Monograph for #page-theory
 * Zero emojis, inline monochrome vector diagrams, interactive derivation toggle.
 */
(function () {
  'use strict';

  const chapters = [
    {
      num: '01',
      id: 'theory-laws',
      shortLabel: 'Laws',
      title: 'Laws of Dry Friction',
      subtitle: 'Amontons & Coulomb empirical principles governing macroscopic contact',
      diagram: `
        <svg class="th-diagram" viewBox="0 0 280 150" aria-label="Normal force and friction proportionality diagram">
          <line x1="20" y1="122" x2="260" y2="122" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.5"/>
          <rect x="92" y="68" width="96" height="54" rx="2" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5"/>
          <text x="140" y="99" text-anchor="middle" fill="currentColor" font-size="13" font-weight="700" font-family="JetBrains Mono, monospace">m</text>
          <!-- Normal N -->
          <line x1="140" y1="68" x2="140" y2="24" stroke="currentColor" stroke-width="1.8" class="th-vec-line"/>
          <polygon points="140,18 135,28 145,28" fill="currentColor"/>
          <text x="150" y="34" fill="currentColor" font-size="11" font-family="JetBrains Mono, monospace">N</text>
          <!-- Weight W -->
          <line x1="140" y1="122" x2="140" y2="144" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="3,2"/>
          <text x="150" y="142" fill="currentColor" fill-opacity="0.65" font-size="10" font-family="JetBrains Mono, monospace">W = mg</text>
          <!-- Applied Force F -->
          <line x1="188" y1="95" x2="244" y2="95" stroke="currentColor" stroke-width="1.8" class="th-vec-line"/>
          <polygon points="250,95 240,90 240,100" fill="currentColor"/>
          <text x="220" y="86" fill="currentColor" font-size="11" font-family="JetBrains Mono, monospace">F</text>
          <!-- Friction fs -->
          <line x1="92" y1="114" x2="36" y2="114" stroke="var(--text-primary)" stroke-width="2" class="th-vec-line"/>
          <polygon points="30,114 40,109 40,119" fill="var(--text-primary)"/>
          <text x="42" y="104" fill="var(--text-primary)" font-size="11" font-weight="600" font-family="JetBrains Mono, monospace">f_s ≤ μN</text>
        </svg>
      `,
      body: `
        <div class="th-law-grid">
          <div class="th-law-item">
            <span class="th-law-index">I</span>
            <div>
              <strong>First Law (Amontons)</strong>
              <p>The force of friction is directly proportional to the applied normal force. Doubling the weight pressing the surfaces together doubles the maximum friction force.</p>
            </div>
          </div>
          <div class="th-law-item">
            <span class="th-law-index">II</span>
            <div>
              <strong>Second Law (Amontons)</strong>
              <p>Friction is independent of the apparent area of contact. A wide, flat block and a narrow, tall block of identical weight experience the same friction force on the same surface.</p>
            </div>
          </div>
          <div class="th-law-item">
            <span class="th-law-index">III</span>
            <div>
              <strong>Third Law (Coulomb)</strong>
              <p>Kinetic friction is independent of sliding velocity. Once motion begins, the resisting friction force remains approximately constant across low to moderate speeds.</p>
            </div>
          </div>
          <div class="th-law-item">
            <span class="th-law-index">IV</span>
            <div>
              <strong>Material Pair Dependence</strong>
              <p>Friction depends strictly on the physical nature, micro-roughness, and lubrication state of the two contacting surfaces.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      num: '02',
      id: 'theory-mu',
      shortLabel: 'Coefficient μ',
      title: 'Coefficient of Friction (<span class="sym">μ</span>)',
      subtitle: 'A dimensionless ratio intrinsic to a surface pair, never a single material',
      diagram: `
        <svg class="th-diagram" viewBox="0 0 280 150" aria-label="Microscopic asperity contact diagram">
          <!-- Upper body -->
          <path d="M 28 24 L 252 24 L 252 68 L 222 76 L 194 64 L 160 79 L 128 66 L 94 78 L 60 65 L 28 74 Z"
                fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-opacity="0.65" stroke-width="1.4"/>
          <!-- Lower body -->
          <path d="M 28 128 L 252 128 L 252 84 L 222 76 L 190 88 L 160 79 L 124 89 L 94 78 L 58 87 L 28 82 Z"
                fill="currentColor" fill-opacity="0.04" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4"/>
          <!-- Contact points highlighted in spark amber -->
          <circle cx="94" cy="78" r="3.5" fill="var(--text-primary)" class="th-pulse-dot"/>
          <circle cx="160" cy="79" r="3.5" fill="var(--text-primary)" class="th-pulse-dot"/>
          <circle cx="222" cy="76" r="3.5" fill="var(--text-primary)" class="th-pulse-dot"/>
          <text x="140" y="46" text-anchor="middle" fill="currentColor" fill-opacity="0.7" font-size="10" font-family="JetBrains Mono, monospace">SURFACE A (BLOCK)</text>
          <text x="140" y="114" text-anchor="middle" fill="currentColor" fill-opacity="0.55" font-size="10" font-family="JetBrains Mono, monospace">SURFACE B (PLANE)</text>
        </svg>
      `,
      body: `
        <p class="th-lead"><strong><span class="sym">μ</span> is a property of the surface pair</strong>, not of any single material alone. It quantifies the ratio of the maximum friction force to the normal force between two surfaces:</p>
        <div class="th-formula-plate">
          <span class="th-formula-label">GOVERNING RATIO</span>
          <span class="formula">F<sub>friction</sub> = <span class="sym">μ</span> × N</span>
        </div>
        <p>The same block of wood exhibits different <span class="sym">μ</span> values on steel, glass, or another piece of wood. Engineering tables therefore always specify the <em>material pair</em> (e.g., "Wood on Steel") rather than a single material.</p>
        <p>Both experimental methods in this simulator — Angle of Repose and Friction Plane — converge on the same <span class="sym">μ</span> for a given material pair, because <span class="sym">μ</span> is an intrinsic property of the interface, independent of measurement method.</p>
      `
    },
    {
      num: '03',
      id: 'theory-angles',
      shortLabel: 'α vs. φ',
      title: 'Angle of Friction vs. Angle of Repose',
      subtitle: 'Closely coupled geometric angles that coincide under pure gravity',
      diagram: `
        <svg class="th-diagram" viewBox="0 0 280 150" aria-label="Angle of friction resultant cone">
          <line x1="25" y1="125" x2="255" y2="125" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.5"/>
          <!-- Normal N -->
          <line x1="140" y1="125" x2="140" y2="30" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="4,3"/>
          <text x="147" y="38" fill="currentColor" fill-opacity="0.65" font-size="10" font-family="JetBrains Mono, monospace">N</text>
          <!-- Resultant R -->
          <line x1="140" y1="125" x2="88" y2="36" stroke="var(--text-primary)" stroke-width="2" class="th-vec-line"/>
          <polygon points="85,31 94,37 86,42" fill="var(--text-primary)"/>
          <text x="68" y="38" fill="var(--text-primary)" font-size="11" font-weight="600" font-family="JetBrains Mono, monospace">R</text>
          <!-- Friction fs -->
          <line x1="140" y1="36" x2="88" y2="36" stroke="currentColor" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="3,2"/>
          <text x="108" y="29" fill="currentColor" fill-opacity="0.6" font-size="10" font-family="JetBrains Mono, monospace">f_max</text>
          <!-- Angle arc phi -->
          <path d="M 140 78 A 47 47 0 0 0 116 84" fill="none" stroke="var(--text-primary)" stroke-width="1.6"/>
          <text x="122" y="72" fill="var(--text-primary)" font-size="13" font-family="OriginalMathSymbol, Georgia, serif">φ</text>
        </svg>
      `,
      body: `
        <div class="th-compare-pair">
          <div class="th-compare-col">
            <div class="th-col-tag">DERIVED QUANTITY</div>
            <h4>Angle of Friction (<span class="sym">φ</span>)</h4>
            <p>The angle between the normal reaction and the resultant contact force at limiting friction. By definition, tan <span class="sym">φ</span> = <span class="sym">μ</span>, computable from <span class="sym">μ</span> regardless of setup.</p>
          </div>
          <div class="th-compare-col">
            <div class="th-col-tag">MEASURED IN LAB</div>
            <h4>Angle of Repose (<span class="sym">α</span>)</h4>
            <p>The steepest inclination at which a block remains stationary under gravity alone (zero external pull). Directly read from the inclined plane protractor at the instant of slip.</p>
          </div>
        </div>
        <div class="th-formula-plate">
          <span class="th-formula-label">PURE GRAVITY IDENTITY</span>
          <span class="formula"><span class="sym">α</span> = <span class="sym">φ</span> &nbsp;→&nbsp; <span class="sym">μ</span> = tan <span class="sym">α</span></span>
        </div>
        <p>This equality holds <em>only when no external push or pull acts on the block</em>. Once an external cable tension is introduced (as in the Friction Plane method), the plane angle <span class="sym">θ</span> is independent of <span class="sym">φ</span>.</p>
      `
    },
    {
      num: '04',
      id: 'theory-static-kinetic',
      shortLabel: 'Static vs. Kinetic',
      title: 'Static vs. Kinetic Friction',
      subtitle: 'Why breaking free requires more force than sustaining motion',
      diagram: `
        <svg class="th-diagram" viewBox="0 0 280 150" aria-label="Static to kinetic friction force curve">
          <!-- Axes -->
          <line x1="34" y1="124" x2="256" y2="124" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.4"/>
          <line x1="34" y1="124" x2="34" y2="20" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.4"/>
          <!-- Curve: static ramp -> peak -> kinetic plateau -->
          <path d="M 34 124 L 128 34 L 146 66 L 248 66" fill="none" stroke="currentColor" stroke-width="2.2" class="th-curve-path"/>
          <!-- Peak marker -->
          <line x1="128" y1="34" x2="128" y2="124" stroke="var(--text-primary)" stroke-width="1" stroke-dasharray="3,3"/>
          <circle cx="128" cy="34" r="4.5" fill="var(--text-primary)" class="th-pulse-dot"/>
          <text x="128" y="23" text-anchor="middle" fill="var(--text-primary)" font-size="9.5" font-weight="700" font-family="JetBrains Mono, monospace">PEAK μ_s·N</text>
          <!-- Labels -->
          <text x="76" y="112" text-anchor="middle" fill="currentColor" fill-opacity="0.55" font-size="9" font-family="JetBrains Mono, monospace">STATIC</text>
          <text x="198" y="56" text-anchor="middle" fill="currentColor" fill-opacity="0.65" font-size="9" font-family="JetBrains Mono, monospace">KINETIC (μ_k·N)</text>
          <text x="246" y="138" text-anchor="end" fill="currentColor" fill-opacity="0.45" font-size="9" font-family="JetBrains Mono, monospace">APPLIED FORCE →</text>
        </svg>
      `,
      body: `
        <p class="th-lead"><strong>Both methods in this simulator measure the <em>limiting static</em> coefficient of friction</strong> — the peak resistance right at the verge of motion.</p>
        <div class="th-compare-pair">
          <div class="th-compare-col">
            <div class="th-col-tag">AT REST</div>
            <h4>Static Friction (<span class="sym">μ</span><sub>s</sub>)</h4>
            <p>Self-adjusting resistance that matches any applied load up to its ceiling f<sub>max</sub> = <span class="sym">μ</span><sub>s</sub>N. The simulator detects this exact ceiling.</p>
          </div>
          <div class="th-compare-col">
            <div class="th-col-tag">IN MOTION</div>
            <h4>Kinetic Friction (<span class="sym">μ</span><sub>k</sub>)</h4>
            <p>Acts once surfaces slide past each other. Because micro-welds have less time to interlock, <span class="sym">μ</span><sub>k</sub> &lt; <span class="sym">μ</span><sub>s</sub>, causing the sudden lurch when a block breaks free.</p>
          </div>
        </div>
      `
    },
    {
      num: '05',
      id: 'theory-derivations',
      shortLabel: 'Derivations',
      title: 'Step-by-Step Formula Derivations',
      subtitle: 'Equilibrium force resolution along and perpendicular to the inclined plane',
      diagram: null,
      body: `
        <div class="th-deriv-tabs" role="tablist" aria-label="Choose method derivation">
          <button type="button" class="th-deriv-tab active" data-deriv="repose" role="tab" aria-selected="true">01 · Angle of Repose</button>
          <button type="button" class="th-deriv-tab" data-deriv="friction" role="tab" aria-selected="false">02 · Friction Plane</button>
        </div>

        <div class="th-deriv-panel active" id="thDerivRepose">
          <ol class="th-steps">
            <li>
              <span class="th-step-tag">STEP 01</span>
              <div>Resolve weight <strong>W</strong> parallel and perpendicular to the plane inclined at angle <span class="sym">α</span>: down-slope pull = <code>W sin α</code>, normal reaction = <code>N = W cos α</code>.</div>
            </li>
            <li>
              <span class="th-step-tag">STEP 02</span>
              <div>At the verge of slipping downward, maximum static friction acts up the slope: <code>f_max = μ · N = μ · W cos α</code>.</div>
            </li>
            <li>
              <span class="th-step-tag">STEP 03</span>
              <div>Set along-slope forces in equilibrium (<code>ΣF_x = 0</code>): <code>W sin α = μ · W cos α</code>. Weight <strong>W</strong> cancels cleanly.</div>
            </li>
          </ol>
          <div class="th-formula-plate th-formula-final">
            <span class="th-formula-label">RESULTING EQUATION</span>
            <span class="formula"><span class="sym">μ</span> = sin <span class="sym">α</span> / cos <span class="sym">α</span> = tan <span class="sym">α</span></span>
          </div>
        </div>

        <div class="th-deriv-panel" id="thDerivFriction">
          <ol class="th-steps">
            <li>
              <span class="th-step-tag">STEP 01</span>
              <div>With the plane locked at angle <span class="sym">θ</span>, hanging pan tension <strong>P</strong> pulls up the slope while weight resolves into <code>W sin θ</code> (down-slope) and <code>N = W cos θ</code> (normal).</div>
            </li>
            <li>
              <span class="th-step-tag">STEP 02</span>
              <div>Because impending motion is <em>up</em> the slope, limiting static friction opposes it <em>down</em> the slope: <code>f_max = μ · W cos θ</code>.</div>
            </li>
            <li>
              <span class="th-step-tag">STEP 03</span>
              <div>Equilibrium at the instant of upward slip gives <code>P = W sin θ + μ · W cos θ</code>. Isolating <span class="sym">μ</span> yields:</div>
            </li>
          </ol>
          <div class="th-formula-plate th-formula-final">
            <span class="th-formula-label">RESULTING EQUATION</span>
            <span class="formula"><span class="sym">μ</span> = (P − W sin <span class="sym">θ</span>) / (W cos <span class="sym">θ</span>)</span>
          </div>
        </div>
      `
    }
  ];

  function renderTheory() {
    const container = document.getElementById('theoryContent');
    if (!container) return;

    const navHtml = `
      <nav class="th-chapter-rail" aria-label="Theory Chapters">
        ${chapters.map((ch, idx) => `
          <button type="button" class="th-rail-btn${idx === 0 ? ' active' : ''}" data-target="${ch.id}">
            <span class="th-rail-num">${ch.num}</span>
            <span class="th-rail-txt">${ch.shortLabel}</span>
          </button>
        `).join('')}
      </nav>
    `;

    const chaptersHtml = chapters.map(ch => `
      <article class="th-chapter" id="${ch.id}">
        <div class="th-chapter-head">
          <div class="th-chapter-num">${ch.num}</div>
          <div class="th-chapter-titles">
            <h3 class="th-chapter-title">${ch.title}</h3>
            <p class="th-chapter-sub">${ch.subtitle}</p>
          </div>
        </div>
        <div class="th-chapter-body${ch.diagram ? ' has-diagram' : ''}">
          <div class="th-chapter-copy">
            ${ch.body}
          </div>
          ${ch.diagram ? `<div class="th-diagram-wrap">${ch.diagram}</div>` : ''}
        </div>
      </article>
    `).join('');

    container.innerHTML = navHtml + `<div class="th-chapters-stack">${chaptersHtml}</div>`;

    // Bind interactive chapter rail
    container.querySelectorAll('.th-rail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        container.querySelectorAll('.th-rail-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const y = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });

    // Bind derivation switcher tabs
    const tabs = container.querySelectorAll('.th-deriv-tab');
    const panels = {
      repose: container.querySelector('#thDerivRepose'),
      friction: container.querySelector('#thDerivFriction')
    };
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.deriv;
        tabs.forEach(t => {
          const isAct = t === tab;
          t.classList.toggle('active', isAct);
          t.setAttribute('aria-selected', isAct ? 'true' : 'false');
        });
        Object.keys(panels).forEach(k => {
          if (panels[k]) panels[k].classList.toggle('active', k === key);
        });
        if (window.gsap && panels[key]) {
          window.gsap.fromTo(
            panels[key].querySelectorAll('.th-steps li, .th-formula-plate'),
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out', overwrite: 'auto' }
          );
        }
      });
    });

    window.dispatchEvent(new CustomEvent('theoryrendered'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTheory);
  } else {
    renderTheory();
  }
})();
