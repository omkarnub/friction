/**
 * theory.js — Renders the Theory & Definitions section content
 */
(function () {
  'use strict';

  const theoryData = [
    {
      icon: '📜',
      title: 'Laws of Friction',
      content: `
        <ul>
          <li><strong>First Law (Amontons):</strong> The force of friction is directly proportional to the applied normal force. Doubling the weight pressing the surfaces together doubles the friction force.</li>
          <li><strong>Second Law (Amontons):</strong> The force of friction is independent of the apparent area of contact. A wide, flat block and a narrow, tall block of the same weight experience the same friction force on the same surface.</li>
          <li><strong>Third Law (Coulomb):</strong> Kinetic friction is independent of the sliding velocity. Once the block starts moving, the friction force doesn't change with speed (at low to moderate speeds).</li>
          <li><strong>Material Dependence:</strong> The magnitude of friction depends on the nature (material, roughness, and condition) of the two surfaces in contact.</li>
        </ul>
      `
    },
    {
      icon: '🔬',
      title: 'Coefficient of Friction (<span class="sym">μ</span>)',
      content: `
        <p><strong><span class="sym">μ</span> is a property of the surface pair</strong>, not of any single material alone. It quantifies the ratio of the maximum friction force to the normal force between two surfaces:</p>
        <div style="margin: 1rem 0;"><span class="formula">F_friction = <span class="sym">μ</span> × N</span></div>
        <p>The same block of wood will have different <span class="sym">μ</span> values when placed on steel vs. glass vs. another piece of wood. This is why we always specify the <em>material pair</em> (e.g., "Wood on Steel") rather than just "Wood."</p>
        <p style="margin-top: 0.75rem;">Both experimental methods in this simulator — Angle of Repose and Friction Plane — should yield approximately the same <span class="sym">μ</span> for the same material pair, since <span class="sym">μ</span> depends on the surfaces, not on how you measure it.</p>
      `
    },
    {
      icon: '📐',
      title: 'Angle of Friction vs. Angle of Repose',
      content: `
        <p>These two concepts are closely related but not identical in general:</p>
        <ul>
          <li><strong>Angle of Friction (<span class="sym">φ</span>):</strong> The angle whose tangent equals the coefficient of friction. By definition, tan <span class="sym">φ</span> = <span class="sym">μ</span>. This is a derived quantity — you can compute it from <span class="sym">μ</span> regardless of the experiment.</li>
          <li><strong>Angle of Repose (<span class="sym">α</span>):</strong> The steepest angle at which a block placed on an inclined plane remains stationary under gravity alone (no applied external force). It is directly measured in the lab.</li>
        </ul>
        <p style="margin-top: 0.75rem;">In the special case of the Angle of Repose experiment — where the only forces are gravity, normal force, and friction — the angle of repose equals the angle of friction:</p>
        <div style="margin: 1rem 0;"><span class="formula"><span class="sym">α</span> = <span class="sym">φ</span> → <span class="sym">μ</span> = tan <span class="sym">α</span></span></div>
        <p>This equality holds <em>because there is no additional applied force</em>. If an external push or pull were applied (as in the Friction Plane method), the slip angle would be different from the angle of friction.</p>
      `
    },
    {
      icon: '⚡',
      title: 'Static vs. Kinetic Friction',
      content: `
        <p><strong>Both methods in this simulator measure the <em>limiting static</em> coefficient of friction</strong> — the friction right at the verge of motion, the maximum friction before the block begins to move.</p>
        <ul>
          <li><strong>Static Friction (<span class="sym">μ</span>_s):</strong> The friction that acts on a body at rest. It adjusts its magnitude to match the applied force, up to a maximum value. The coefficient we measure here is this maximum — the "limiting" value.</li>
          <li><strong>Kinetic Friction (<span class="sym">μ</span>_k):</strong> The friction that acts on a body already in motion. It is typically lower than limiting static friction (<span class="sym">μ</span>_k < <span class="sym">μ</span>_s), which is why objects sometimes accelerate suddenly once they start sliding.</li>
        </ul>
        <p style="margin-top: 0.75rem;">This simulator focuses exclusively on <em>static</em> friction. The "slip" or "motion" event you see in the simulation represents the moment the applied force exceeds the maximum static friction — the very instant motion begins.</p>
      `
    },
    {
      icon: '🧮',
      title: 'Deriving the Formulas',
      content: `
        <p><strong>Angle of Repose:</strong> At the verge of slipping on an incline at angle <span class="sym">α</span>, the forces along the slope are balanced:</p>
        <ul>
          <li>Down-slope component of gravity: W sin <span class="sym">α</span></li>
          <li>Maximum friction force (up-slope): <span class="sym">μ</span> × W cos <span class="sym">α</span></li>
        </ul>
        <p>Setting them equal: W sin <span class="sym">α</span> = <span class="sym">μ</span> × W cos <span class="sym">α</span>, so:</p>
        <div style="margin: 1rem 0;"><span class="formula"><span class="sym">μ</span> = sin <span class="sym">α</span> / cos <span class="sym">α</span> = tan <span class="sym">α</span></span></div>

        <p style="margin-top: 1rem;"><strong>Friction Plane:</strong> At angle <span class="sym">θ</span> with pull force P applied up the slope (via pulley):</p>
        <ul>
          <li>Forces up the slope: P (the pull from the hanging pan)</li>
          <li>Forces down the slope: W sin <span class="sym">θ</span> + F_friction = W sin <span class="sym">θ</span> + <span class="sym">μ</span> × W cos <span class="sym">θ</span></li>
        </ul>
        <p>At the verge of motion up the slope, P just overcomes gravity's component and friction:</p>
        <div style="margin: 1rem 0;"><span class="formula">P = W sin <span class="sym">θ</span> + <span class="sym">μ</span> × W cos <span class="sym">θ</span></span></div>
        <p>Solving for <span class="sym">μ</span>:</p>
        <div style="margin: 0.5rem 0;"><span class="formula"><span class="sym">μ</span> = (P − W sin <span class="sym">θ</span>) / (W cos <span class="sym">θ</span>)</span></div>
      `
    }
  ];

  function renderTheory() {
    const container = document.getElementById('theoryContent');
    if (!container) return;

    container.innerHTML = theoryData.map(block => `
      <div class="theory-block">
        <h3>${block.icon} ${block.title}</h3>
        ${block.content}
      </div>
    `).join('');
  }

  // Render on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTheory);
  } else {
    renderTheory();
  }
})();
