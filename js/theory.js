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
      title: 'Coefficient of Friction (μ)',
      content: `
        <p><strong>μ is a property of the surface pair</strong>, not of any single material alone. It quantifies the ratio of the maximum friction force to the normal force between two surfaces:</p>
        <div style="margin: 1rem 0;"><span class="formula">F_friction = μ × N</span></div>
        <p>The same block of wood will have different μ values when placed on steel vs. glass vs. another piece of wood. This is why we always specify the <em>material pair</em> (e.g., "Wood on Steel") rather than just "Wood."</p>
        <p style="margin-top: 0.75rem;">Both experimental methods in this simulator — Angle of Repose and Friction Plane — should yield approximately the same μ for the same material pair, since μ depends on the surfaces, not on how you measure it.</p>
      `
    },
    {
      icon: '📐',
      title: 'Angle of Friction vs. Angle of Repose',
      content: `
        <p>These two concepts are closely related but not identical in general:</p>
        <ul>
          <li><strong>Angle of Friction (φ):</strong> The angle whose tangent equals the coefficient of friction. By definition, tan φ = μ. This is a derived quantity — you can compute it from μ regardless of the experiment.</li>
          <li><strong>Angle of Repose (α):</strong> The steepest angle at which a block placed on an inclined plane remains stationary under gravity alone (no applied external force). It is directly measured in the lab.</li>
        </ul>
        <p style="margin-top: 0.75rem;">In the special case of the Angle of Repose experiment — where the only forces are gravity, normal force, and friction — the angle of repose equals the angle of friction:</p>
        <div style="margin: 1rem 0;"><span class="formula">α = φ → μ = tan α</span></div>
        <p>This equality holds <em>because there is no additional applied force</em>. If an external push or pull were applied (as in the Friction Plane method), the slip angle would be different from the angle of friction.</p>
      `
    },
    {
      icon: '⚡',
      title: 'Static vs. Kinetic Friction',
      content: `
        <p><strong>Both methods in this simulator measure the <em>limiting static</em> coefficient of friction</strong> — the friction right at the verge of motion, the maximum friction before the block begins to move.</p>
        <ul>
          <li><strong>Static Friction (μ_s):</strong> The friction that acts on a body at rest. It adjusts its magnitude to match the applied force, up to a maximum value. The coefficient we measure here is this maximum — the "limiting" value.</li>
          <li><strong>Kinetic Friction (μ_k):</strong> The friction that acts on a body already in motion. It is typically lower than limiting static friction (μ_k < μ_s), which is why objects sometimes accelerate suddenly once they start sliding.</li>
        </ul>
        <p style="margin-top: 0.75rem;">This simulator focuses exclusively on <em>static</em> friction. The "slip" or "motion" event you see in the simulation represents the moment the applied force exceeds the maximum static friction — the very instant motion begins.</p>
      `
    },
    {
      icon: '🧮',
      title: 'Deriving the Formulas',
      content: `
        <p><strong>Angle of Repose:</strong> At the verge of slipping on an incline at angle α, the forces along the slope are balanced:</p>
        <ul>
          <li>Down-slope component of gravity: W sin α</li>
          <li>Maximum friction force (up-slope): μ × W cos α</li>
        </ul>
        <p>Setting them equal: W sin α = μ × W cos α, so:</p>
        <div style="margin: 1rem 0;"><span class="formula">μ = sin α / cos α = tan α</span></div>

        <p style="margin-top: 1rem;"><strong>Friction Plane:</strong> At angle θ with pull force P applied up the slope (via pulley):</p>
        <ul>
          <li>Forces up the slope: P (the pull from the hanging pan)</li>
          <li>Forces down the slope: W sin θ + F_friction = W sin θ + μ × W cos θ</li>
        </ul>
        <p>At the verge of motion up the slope, P just overcomes gravity's component and friction:</p>
        <div style="margin: 1rem 0;"><span class="formula">P = W sin θ + μ × W cos θ</span></div>
        <p>Solving for μ:</p>
        <div style="margin: 0.5rem 0;"><span class="formula">μ = (P − W sin θ) / (W cos θ)</span></div>
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
