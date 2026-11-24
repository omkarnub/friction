/**
 * quiz.js — Hybrid Engineering Mechanics Friction MCQ Engine
 *
 * Architecture:
 *  - Mode 1 (Instant Offline): 36+ concept-family theory bank + dynamic material-pair
 *    intuition generator + 6 mathematically verified procedural numerical generators.
 *  - Mode 2 (Optional Live AI Hybrid): Calls a user-configured serverless proxy
 *    (see cloudflare-worker-quiz.js) backed by Gemini Flash-Lite for fresh theory MCQs,
 *    with strict schema validation, 4s timeout, and seamless silent fallback to local bank.
 *  - Zero repeats: Seen question IDs & missed IDs persisted in localStorage; at most
 *    1 variant per concept family appears in any single quiz session.
 */
(function () {
  'use strict';

  /* Optional hardcoded proxy URL — or configure live inside the Quiz settings drawer */
  const DEFAULT_AI_ENDPOINT = 'https://friction-quiz.126omkar4024.workers.dev/';
  const STORAGE_SEEN = 'fl-quiz-seen-v1';
  const STORAGE_MISSED = 'fl-quiz-missed-v1';
  const STORAGE_AI_URL = 'fl-quiz-ai-endpoint';

  const hasGsap = () => typeof window.gsap !== 'undefined';
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const round = (n, d = 3) => Number(n.toFixed(d));

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  /* ================================================================
     1. CURATED THEORY BANK (12 Concept Families × 3 Variants = 36 Qs)
     Every item has 4+ distractors (3 randomly chosen per attempt)
     and a crystal-clear engineering explanation.
     ================================================================ */
  const THEORY_BANK = [
    // Family 1: Amontons' First Law (Proportionality to Normal Force)
    {
      id: 'law1-a', family: 'amontons-1',
      q: 'According to Amontons’ First Law of dry friction, what happens to the maximum static friction force if the normal force N between two surfaces is doubled?',
      correct: 'It doubles proportionally (f_max = μ_s · N).',
      distractors: [
        'It increases fourfold because friction scales with N².',
        'It stays unchanged since μ_s is constant.',
        'It halves because heavier loads flatten surface peaks.',
        'It increases only if the contact area also doubles.'
      ],
      explanation: 'Amontons’ First Law states that limiting friction is directly proportional to the normal reaction: f_max = μ_s · N. Doubling N doubles f_max while μ_s remains constant.'
    },
    {
      id: 'law1-b', family: 'amontons-1',
      q: 'A 10 N steel block on a horizontal steel table requires 6 N of horizontal pull to start sliding. If an identical 10 N block is stacked on top of it, what pull force is now required?',
      correct: '12 N, because doubling the normal load doubles the limiting friction force.',
      distractors: [
        '6 N, because the contact area with the table did not change.',
        '9 N, because the upper block only partially transfers load.',
        '24 N, because friction increases with the square of weight.',
        '3 N, because added weight stabilizes the contact surface.'
      ],
      explanation: 'Stacking a second 10 N block doubles the normal reaction from 10 N to 20 N. Since f_max = μ_s · N = 0.6 × 20 N, the required limiting pull doubles to 12 N.'
    },
    {
      id: 'law1-c', family: 'amontons-1',
      q: 'Which graph correctly represents limiting static friction f_max (vertical axis) plotted against normal reaction N (horizontal axis) for a given dry surface pair?',
      correct: 'A straight line passing through the origin with slope equal to μ_s.',
      distractors: [
        'A horizontal line independent of N.',
        'A parabola curving upward as N increases.',
        'A hyperbola decreasing as N increases.',
        'A straight line with a negative slope equal to −μ_s.'
      ],
      explanation: 'Because f_max = μ_s · N is a linear relation with zero intercept, plotting f_max vs. N gives a straight line through the origin whose slope is μ_s.'
    },

    // Family 2: Amontons' Second Law (Area Independence)
    {
      id: 'law2-a', family: 'amontons-2',
      q: 'A rectangular wooden brick rests flat on its widest face on an inclined plane. If you stand the same brick upright on its narrowest end, how does the limiting friction force change?',
      correct: 'It remains the same because dry friction is independent of apparent contact area.',
      distractors: [
        'It decreases because fewer surface peaks touch the plane.',
        'It increases because pressure per unit area is higher.',
        'It drops to zero until the plane is tilted past 45°.',
        'It halves in proportion to the reduced footprint.'
      ],
      explanation: 'Amontons’ Second Law establishes that dry friction is independent of apparent contact area. A smaller face increases local pressure, keeping the real microscopic contact area unchanged.'
    },
    {
      id: 'law2-b', family: 'amontons-2',
      q: 'Two students test the same wood block on steel in the Angle of Repose apparatus—one places it flat and the other stands it on its narrow side. Both measure α = 22°. Which principle explains this?',
      correct: 'Amontons’ Second Law: limiting friction does not depend on apparent contact area.',
      distractors: [
        'Coulomb’s Third Law: kinetic friction is independent of speed.',
        'Newton’s Third Law: action and reaction cancel out.',
        'Hooke’s Law: elastic deformation cancels the angle difference.',
        'The law of conservation of angular momentum.'
      ],
      explanation: 'Since neither weight W nor material pair changed, changing only the apparent contact area does not alter limiting friction or the angle of repose α.'
    },
    {
      id: 'law2-c', family: 'amontons-2',
      q: 'Which statement about dry sliding friction between rigid engineering surfaces is FALSE?',
      correct: 'Doubling the apparent contact area of a block of the same weight doubles its friction force.',
      distractors: [
        'Limiting friction is directly proportional to the normal reaction.',
        'Friction always opposes impending or actual relative motion.',
        'The coefficient μ depends on the nature of both contacting surfaces.',
        'Static friction adjusts itself to match the applied force up to μ_s · N.'
      ],
      explanation: 'Dry friction is independent of the apparent area of contact (Amontons’ Second Law). Doubling footprint area without changing weight leaves limiting friction unchanged.'
    },

    // Family 3: Coulomb's Third Law (Velocity Independence)
    {
      id: 'law3-a', family: 'coulomb-3',
      q: 'According to Coulomb’s Third Law of dry friction, how does kinetic friction behave at low to moderate sliding speeds once motion is underway?',
      correct: 'It remains approximately constant and independent of sliding velocity.',
      distractors: [
        'It increases linearly with sliding speed like fluid drag.',
        'It drops to zero immediately after breakaway.',
        'It oscillates periodically with the block’s displacement.',
        'It grows with the square of velocity.'
      ],
      explanation: 'Coulomb’s Third Law states that dry kinetic friction is nearly independent of sliding velocity across typical low-to-moderate engineering speeds.'
    },
    {
      id: 'law3-b', family: 'coulomb-3',
      q: 'Why does Coulomb’s law of velocity-independent friction NOT apply to a heavily lubricated hydrodynamic bearing?',
      correct: 'Because a full fluid film introduces viscous shear, which increases with velocity.',
      distractors: [
        'Because steel has no microscopic surface roughness.',
        'Because normal force becomes zero in rotating bearings.',
        'Because gravity acts tangentially inside circular races.',
        'Because static friction is always lower than kinetic friction in oil.'
      ],
      explanation: 'Dry Coulomb friction applies to solid-on-solid contact. When a continuous lubricant film separates the surfaces, fluid viscosity governs drag and rises with speed.'
    },
    {
      id: 'law3-c', family: 'coulomb-3',
      q: 'A block slides across a dry horizontal surface at 0.5 m/s and then at 1.5 m/s under the same normal load. Under Coulomb’s model, how does the kinetic friction force compare?',
      correct: 'It is essentially the same at both speeds.',
      distractors: [
        'It is three times larger at 1.5 m/s.',
        'It is nine times larger at 1.5 m/s.',
        'It is three times smaller at 1.5 m/s.',
        'It equals zero at constant speed.'
      ],
      explanation: 'In dry Coulomb sliding, kinetic friction f_k = μ_k · N depends on μ_k and normal reaction N, not on the sliding speed (for low-to-moderate speeds).'
    },

    // Family 4: Surface-Pair Dependence of μ
    {
      id: 'pair-a', family: 'surface-pair',
      q: 'Why do engineering handbooks list μ as "Wood on Steel" rather than simply listing a single coefficient for "Wood"?',
      correct: 'Because μ is a property of the contacting surface pair, not of one isolated material.',
      distractors: [
        'Because wood absorbs steel particles during testing.',
        'Because μ depends only on the heavier of the two bodies.',
        'Because steel has a fixed μ of 1.0 against every material.',
        'Because handbooks only test metallic planes.'
      ],
      explanation: 'Microscopic interlocking and adhesion occur between BOTH surfaces. Wood on Steel has a different μ than Wood on Glass or Wood on Wood.'
    },
    {
      id: 'pair-b', family: 'surface-pair',
      q: 'If you measure μ_s for Brass on Steel using the Angle of Repose method and then using the Friction Plane method, what should you observe?',
      correct: 'Both methods should yield approximately the same μ_s.',
      distractors: [
        'Friction Plane always gives twice the μ_s of Angle of Repose.',
        'Angle of Repose always gives a higher μ_s because gravity assists it.',
        'They cannot be compared because one uses angle and the other uses pull.',
        'Friction Plane measures kinetic μ_k while Angle of Repose measures μ_s.'
      ],
      explanation: 'Both methods measure limiting static friction for the exact same surface pair. Since μ_s is an interface property, both setups converge on the same value.'
    },
    {
      id: 'pair-c', family: 'surface-pair',
      q: 'Can the static coefficient of friction μ_s ever exceed 1.0 for real engineering materials?',
      correct: 'Yes — clean dry pairs like Aluminum on Aluminum routinely exhibit μ_s > 1.0.',
      distractors: [
        'No — μ_s is mathematically bounded between 0 and 1.',
        'No — values above 1.0 violate Newton’s Second Law.',
        'Only if the inclined plane angle exceeds 90°.',
        'Only when the surfaces are heavily lubricated with oil.'
      ],
      explanation: 'There is no physical law capping μ_s at 1.0. Strong metallic adhesion in clean dry Aluminum-on-Aluminum gives μ_s ≈ 1.05–1.35 (meaning α > 45°).'
    },

    // Family 5: Angle of Repose (α) vs Angle of Friction (φ)
    {
      id: 'ang-a', family: 'angle-alpha-phi',
      q: 'When is the Angle of Repose (α) mathematically equal to the Angle of Friction (φ)?',
      correct: 'When gravity is the only driving force on the inclined plane (no external push or pull).',
      distractors: [
        'Only when the plane is completely horizontal (θ = 0°).',
        'Always, even when a pulley pulls the block uphill.',
        'Only when the block weighs exactly 10 N.',
        'Never — α is always half of φ.'
      ],
      explanation: 'With no external force, balancing W sin α = μ_s W cos α yields tan α = μ_s. Since tan φ = μ_s by definition, α = φ specifically in pure gravity equilibrium.'
    },
    {
      id: 'ang-b', family: 'angle-alpha-phi',
      q: 'How is the Angle of Friction (φ) formally defined in Engineering Mechanics?',
      correct: 'The angle between the normal reaction N and the resultant contact force R at limiting friction.',
      distractors: [
        'The angle between the inclined plane and the vertical wall.',
        'The angle of the pulley cord relative to the horizontal ground.',
        'Half of the block’s weight divided by normal force.',
        'The angle at which kinetic friction becomes zero.'
      ],
      explanation: 'At limiting equilibrium, normal force N and maximum friction f_max = μ_s N combine into resultant R. The angle φ between R and N satisfies tan φ = f_max / N = μ_s.'
    },
    {
      id: 'ang-c', family: 'angle-alpha-phi',
      q: 'In the Angle of Repose experiment, why does doubling the weight W of the test block NOT change the critical slip angle α?',
      correct: 'Both W sin α and μ_s W cos α are proportional to W, so W cancels cleanly from the equation.',
      distractors: [
        'Because heavier blocks float slightly above the incline.',
        'Because μ_s automatically halves when weight doubles.',
        'Because normal force is independent of weight on an incline.',
        'Because gravity acts only perpendicular to the incline.'
      ],
      explanation: 'In W sin α = μ_s W cos α, dividing both sides by W cos α removes W entirely, leaving μ_s = tan α.'
    },

    // Family 6: Cone of Friction
    {
      id: 'cone-a', family: 'cone-of-friction',
      q: 'What does the Cone of Friction represent in statics?',
      correct: 'The 3D boundary of half-angle φ within which the resultant contact force R must lie for the body to remain at rest.',
      distractors: [
        'The physical shape of the brass weights stacked on the pan.',
        'The trajectory traced by a block after it slides off a ramp.',
        'The region where kinetic friction exceeds static friction.',
        'The angle of the pulley groove holding the string.'
      ],
      explanation: 'Rotating the limiting resultant vector R (at angle φ from the normal) 360° forms a cone of half-angle φ = arctan(μ_s). Any resultant inside this cone keeps the block locked in static equilibrium.'
    },
    {
      id: 'cone-b', family: 'cone-of-friction',
      q: 'If the line of action of the resultant contact force R lies strictly INSIDE the Cone of Friction, what is the state of the block?',
      correct: 'It remains stationary in static equilibrium with zero impending slip.',
      distractors: [
        'It accelerates rapidly down the plane.',
        'It is right at the instant of sliding.',
        'Friction has dropped to kinetic friction μ_k.',
        'The normal reaction N is equal to zero.'
      ],
      explanation: 'Inside the Cone of Friction, the required resisting friction is strictly less than f_max = μ_s N, so the block stays safely at rest.'
    },
    {
      id: 'cone-c', family: 'cone-of-friction',
      q: 'What happens to the vertex half-angle φ of the Cone of Friction if oil is applied between two dry steel plates?',
      correct: 'The cone narrows sharply because lubrication lowers μ_s and therefore lowers φ = arctan(μ_s).',
      distractors: [
        'The cone widens because oil adds sticky adhesion.',
        'The cone stays the exact same width since both plates are still steel.',
        'The cone flips upside down.',
        'The half-angle φ becomes 90°.'
      ],
      explanation: 'Lubricating dry steel drops μ_s from ~0.65 down to ~0.12, shrinking φ = arctan(μ_s) from ~33° down to ~7°—making the stability cone much narrower.'
    },

    // Family 7: Static vs Kinetic Friction
    {
      id: 'sk-a', family: 'static-vs-kinetic',
      q: 'Why does a heavy crate often lurch forward suddenly the instant it finally starts moving?',
      correct: 'Because kinetic friction (μ_k) is lower than limiting static friction (μ_s), creating a sudden net forward force.',
      distractors: [
        'Because the crate loses mass once it starts sliding.',
        'Because gravity stops acting horizontally during motion.',
        'Because kinetic friction is always greater than static friction.',
        'Because air resistance pushes the crate forward.'
      ],
      explanation: 'Once microscopic surface interlocks shear free, resistance drops from μ_s N to the lower μ_k N. If you keep pushing with the breakaway force, the excess force accelerates the crate.'
    },
    {
      id: 'sk-b', family: 'static-vs-kinetic',
      q: 'Which type of friction is directly measured by both the Angle of Repose and Friction Plane experiments in this simulator?',
      correct: 'Limiting static friction (μ_s) at the exact verge of motion.',
      distractors: [
        'Kinetic sliding friction (μ_k) at constant high speed.',
        'Rolling resistance between spheres and rails.',
        'Fluid viscous drag.',
        'Average of static and rolling friction.'
      ],
      explanation: 'Both experiments record the critical angle α or critical pull P right at the verge of slip—which defines the limiting static coefficient μ_s.'
    },
    {
      id: 'sk-c', family: 'static-vs-kinetic',
      q: 'A 20 N block sits at rest on a flat floor with μ_s = 0.5 (so f_max = 10 N). If you push sideways with only 4 N, what is the magnitude of the friction force acting on the block?',
      correct: '4 N — static friction is self-adjusting and matches the applied load up to its ceiling.',
      distractors: [
        '10 N — friction always equals μ_s · N.',
        '6 N — the difference between f_max and the push.',
        '0 N — friction only activates once the block moves.',
        '14 N — the sum of push and maximum friction.'
      ],
      explanation: 'Static friction is a passive, self-adjusting force (0 ≤ f_s ≤ μ_s N). If it were 10 N against a 4 N push, the block would mysteriously accelerate backward! Thus f_s = 4 N.'
    },

    // Family 8: Friction Plane Mechanics (Upward Impending Motion)
    {
      id: 'fp-a', family: 'friction-plane',
      q: 'In the inclined Friction Plane method, the hanging pan pulls the block UP the slope. Which direction does the static friction force act on the block?',
      correct: 'Down the slope, opposing the impending upward motion.',
      distractors: [
        'Up the slope, helping the hanging pan lift the block.',
        'Straight upward perpendicular to the ground.',
        'Perpendicular to the plane along the normal vector N.',
        'Friction is zero whenever a pulley is used.'
      ],
      explanation: 'Friction always opposes impending relative motion. Since pull P tends to drag the block UP the incline, friction acts DOWN the incline alongside W sin θ.'
    },
    {
      id: 'fp-b', family: 'friction-plane',
      q: 'Why does the Friction Plane equation μ = (P − W sin θ) / (W cos θ) subtract W sin θ from P?',
      correct: 'Because part of the pull P must first overcome gravity’s down-slope component W sin θ; only the remainder overcomes friction.',
      distractors: [
        'Because the pulley absorbs W sin θ as rotational heat.',
        'Because W sin θ acts upward and assists P.',
        'Because W cos θ is always larger than P.',
        'To convert Newtons into degrees.'
      ],
      explanation: 'At the verge of upward slip, P balances BOTH gravity’s down-slope pull (W sin θ) and limiting friction (μ_s W cos θ). Thus f_max = P − W sin θ.'
    },
    {
      id: 'fp-c', family: 'friction-plane',
      q: 'What does the Friction Plane formula μ = (P − W sin θ) / (W cos θ) simplify to when the plane is set completely horizontal (θ = 0°)?',
      correct: 'μ = P / W, since sin 0° = 0 and cos 0° = 1.',
      distractors: [
        'μ = P · W, since cos 0° = 1.',
        'μ = W / P, since sin 0° = 0.',
        'μ = 0, because an incline is required to measure friction.',
        'Undefined, because cos 0° = 0.'
      ],
      explanation: 'At θ = 0°, sin 0° = 0 and cos 0° = 1, reducing the inclined formula cleanly to the classic horizontal expression μ = P / W.'
    },

    // Family 9: Experimental Error & Validity
    {
      id: 'err-a', family: 'exp-validity',
      q: 'In the inclined Friction Plane experiment (θ > 0°), what happens if the recorded pan pull P is LESS than W sin θ?',
      correct: 'The block would slide downhill instead of uphill, making the upward-pull formula invalid (negative μ).',
      distractors: [
        'The block moves upward faster than expected.',
        'μ becomes greater than 1.0 automatically.',
        'The normal reaction N becomes negative.',
        'The angle θ automatically resets to 0°.'
      ],
      explanation: 'If P ≤ W sin θ, the numerator (P − W sin θ) is zero or negative, meaning the pull cannot even balance gravity’s down-slope component, let alone overcome friction uphill.'
    },
    {
      id: 'err-b', family: 'exp-validity',
      q: 'Why is the Friction Plane formula μ = (P − W sin θ) / (W cos θ) mathematically undefined at θ = 90°?',
      correct: 'Because cos 90° = 0, meaning normal force N = W cos 90° vanishes and you would divide by zero.',
      distractors: [
        'Because sin 90° = 0.',
        'Because gravity turns off on a vertical wall.',
        'Because pulleys cannot rotate at 90°.',
        'Because μ is always infinite on vertical surfaces.'
      ],
      explanation: 'On a vertical 90° wall with no horizontal pressing force, W cos 90° = 0 gives zero normal force N, making division by W cos θ undefined.'
    },
    {
      id: 'err-c', family: 'exp-validity',
      q: 'In a lab session, why should you take 3–5 repeated trials and compute Mean μ instead of relying on a single reading?',
      correct: 'To average out random experimental variations such as local surface dust, vibration, or slight readout error.',
      distractors: [
        'Because μ increases by 10% after every trial.',
        'Because one trial only gives kinetic friction.',
        'Because tan α requires at least three angles to compute.',
        'To artificially inflate the % error.'
      ],
      explanation: 'Real surfaces have microscopic non-uniformities and small operator timing variations. Averaging multiple valid trials reduces random error and stabilizes your estimate of μ.'
    },

    // Family 10: Microscopic Origin of Friction
    {
      id: 'micro-a', family: 'microscopic',
      q: 'At the microscopic level, what is the primary physical cause of dry static friction between two seemingly smooth metal blocks?',
      correct: 'Microscopic surface peaks (asperities) interlock and form tiny adhesive junctions under load.',
      distractors: [
        'Air vacuum trapped completely beneath the block.',
        'Gravitational attraction between the two blocks’ centers of mass.',
        'Magnetic repulsion between free electrons.',
        'Centrifugal force from Earth’s rotation.'
      ],
      explanation: 'Even polished metal is rugged at 10,000× magnification. Real contact happens only at microscopic asperity tips, which interlock and cold-weld until sheared apart.'
    },
    {
      id: 'micro-b', family: 'microscopic',
      q: 'Why can two ultra-clean, mirror-polished glass plates actually exhibit VERY HIGH static friction (μ_s ≈ 0.90–1.00)?',
      correct: 'Extreme flatness brings huge numbers of molecules close enough for strong intermolecular adhesion.',
      distractors: [
        'Because glass is heavier than steel.',
        'Because glass has deep jagged teeth visible to the naked eye.',
        'Because glass melts instantly at room temperature.',
        'Because normal force doubles on transparent surfaces.'
      ],
      explanation: 'When surfaces become ultra-flat and clean, intermolecular van der Waals adhesion dominates over mechanical interlocking—giving Glass on Glass a surprisingly high μ_s near 0.95.'
    },
    {
      id: 'micro-c', family: 'microscopic',
      q: 'How does the REAL microscopic area of contact compare to the APPARENT geometric area of a flat steel block resting on a table?',
      correct: 'The real contact area is only a tiny fraction of the apparent area, concentrated at asperity peaks.',
      distractors: [
        'They are 100% identical across the entire underside.',
        'The real contact area is larger than the block’s footprint.',
        'Real contact area is zero until the block starts sliding.',
        'Real contact area depends only on block color.'
      ],
      explanation: 'Because surfaces touch only at their highest microscopic peaks, the true load-bearing area is a tiny fraction of the visible footprint—and grows proportionally with normal load N.'
    },

    // Family 11: Engineering Applications & Failure Modes
    {
      id: 'eng-a', family: 'engineering',
      q: 'What is the primary mechanical risk if a design engineer UNDERESTIMATES the coefficient of friction in a rotating shaft bearing?',
      correct: 'Excessive drag torque, rapid wear, and thermal seizure.',
      distractors: [
        'The shaft spins faster than the motor speed.',
        'The bearing generates electrical power.',
        'The housing cools below room temperature.',
        'The load slides backward off the shaft.'
      ],
      explanation: 'Underestimating friction means actual resisting torque and heat dissipation exceed design limits, leading to overheating and mechanical seizure.'
    },
    {
      id: 'eng-b', family: 'engineering',
      q: 'What happens if an engineer OVERESTIMATES the static friction coefficient when designing a belt drive or inclined conveyor?',
      correct: 'Traction fails prematurely and the belt or payload slips uncontrollably under load.',
      distractors: [
        'The conveyor locks solid and refuses to turn.',
        'The payload becomes weightless.',
        'Normal force doubles unexpectedly.',
        'Static friction converts into gravitational potential energy.'
      ],
      explanation: 'Assuming more grip than the real surface pair can deliver causes the driving traction limit μ_s N to be exceeded, resulting in uncontrolled slip.'
    },
    {
      id: 'eng-c', family: 'engineering',
      q: 'How does a high-strength friction-grip bolted joint hold two steel bridge plates together under tension?',
      correct: 'High bolt clamping tension creates a huge normal force N, generating enough static friction μ_s N to resist shear.',
      distractors: [
        'By gluing the steel plates with resin inside the bolt holes.',
        'By reducing the normal force between the plates to zero.',
        'By relying strictly on kinetic friction as the bridge slides.',
        'By making μ_s equal to zero between the plates.'
      ],
      explanation: 'Friction-grip joints deliberately maximize clamping force N so that static friction across the faying surfaces carries the shear load without bolt slip.'
    },

    // Family 12: Force Resolution on an Incline
    {
      id: 'res-a', family: 'force-resolution',
      q: 'For a block of weight W resting on a plane inclined at angle θ to the horizontal, what is the component of weight acting PARALLEL (down) the slope?',
      correct: 'W sin θ',
      distractors: ['W cos θ', 'W tan θ', 'W / cos θ', 'W · (1 − sin θ)'] ,
      explanation: 'Resolving vertical weight W into axes parallel and perpendicular to the incline gives W sin θ down the slope and W cos θ perpendicular into the plane.'
    },
    {
      id: 'res-b', family: 'force-resolution',
      q: 'As you slowly increase the tilt angle θ of an inclined plane from 0° to 40°, what happens to the Normal Reaction N = W cos θ?',
      correct: 'It decreases continuously because cos θ decreases as θ increases.',
      distractors: [
        'It increases continuously because sin θ increases.',
        'It stays constant and equal to W at all angles.',
        'It drops to zero at θ = 45°.',
        'It doubles at θ = 30°.'
      ],
      explanation: 'Because N = W cos θ and cos θ falls from 1.0 at 0° toward 0 at 90°, tilting the plane steeper reduces normal pressure and therefore reduces maximum available friction f_max = μ_s N.'
    },
    {
      id: 'res-c', family: 'force-resolution',
      q: 'Why does a block eventually slip as you tilt an inclined plane steeper?',
      correct: 'Down-slope gravity (W sin θ) increases while maximum friction (μ_s W cos θ) simultaneously decreases until they cross.',
      distractors: [
        'Because μ_s decreases with angle.',
        'Because block weight W increases as the ramp rises.',
        'Because air pressure pushes the block downward.',
        'Because cos θ becomes greater than 1.'
      ],
      explanation: 'Tilting steeper delivers a double hit: the driving component W sin θ grows while the normal force W cos θ (and thus f_max = μ_s W cos θ) shrinks, until W sin θ exceeds f_max at tan α = μ_s.'
    }
  ];

  /* ================================================================
     2. DYNAMIC MATERIAL-PAIR INTUITION GENERATOR (Reads window.MATERIALS)
     ================================================================ */
  function generateMaterialPairQuestion() {
    const mats = window.MATERIALS;
    if (!mats) return null;
    const keys = Object.keys(mats);
    if (keys.length < 4) return null;

    // Pick 4 distinct pairs with well-separated midpoints
    const pool = shuffle(keys).map(k => ({
      key: k,
      name: mats[k].name,
      low: mats[k].low,
      high: mats[k].high,
      mid: (mats[k].low + mats[k].high) / 2
    }));

    const chosen = [];
    for (const item of pool) {
      if (chosen.every(c => Math.abs(c.mid - item.mid) >= 0.14)) {
        chosen.push(item);
      }
      if (chosen.length === 4) break;
    }
    if (chosen.length < 4) return null;

    const askLowest = Math.random() < 0.5;
    const sorted = chosen.slice().sort((a, b) => a.mid - b.mid);
    const target = askLowest ? sorted[0] : sorted[3];
    const others = sorted.filter(x => x.key !== target.key);

    if (askLowest) {
      return {
        id: `mat-low-${target.key}-${Date.now()}`,
        type: 'THEORY',
        source: 'LOCAL',
        q: 'You place four blocks of different material pairs side-by-side on the same inclined plane and slowly raise the tilt angle. Which pair will SLIP FIRST?',
        options: shuffle([target.name, ...others.map(o => o.name)]),
        correctText: target.name,
        explanation: `${target.name} has the lowest static friction coefficient among these options (typical μ ≈ ${target.low}–${target.high}, midpoint ${target.mid.toFixed(3)}), so its critical slip angle α = arctan(μ) is reached first.`
      };
    } else {
      return {
        id: `mat-high-${target.key}-${Date.now()}`,
        type: 'THEORY',
        source: 'LOCAL',
        q: 'Among the following engineering surface pairs, which one produces the WIDEST Cone of Friction (steepest Angle of Repose before slipping)?',
        options: shuffle([target.name, ...others.map(o => o.name)]),
        correctText: target.name,
        explanation: `Since Cone of Friction half-angle φ = arctan(μ_s), the highest-friction pair has the widest cone. ${target.name} leads this set with typical μ ≈ ${target.low}–${target.high} (midpoint ${target.mid.toFixed(3)}).`
      };
    }
  }

  /* ================================================================
     3. 6 MATHEMATICALLY VERIFIED PROCEDURAL NUMERICAL GENERATORS
     ================================================================ */
  function uniqueNumericOptions(correctVal, candidateVals, decimals, unit = '') {
    const fmt = (v) => v.toFixed(decimals) + unit;
    const cStr = fmt(correctVal);
    const seen = new Set([cStr]);
    const distractors = [];

    for (const v of candidateVals) {
      if (!isFinite(v) || v <= 0) continue;
      const s = fmt(v);
      if (!seen.has(s)) {
        seen.add(s);
        distractors.push(s);
      }
      if (distractors.length === 3) break;
    }

    // Safe fallback offsets if any candidate collided
    const offsets = [0.18, -0.15, 0.32, 0.45, -0.25];
    for (const off of offsets) {
      if (distractors.length >= 3) break;
      const v = Math.max(0.05, correctVal * (1 + off));
      const s = fmt(v);
      if (!seen.has(s)) {
        seen.add(s);
        distractors.push(s);
      }
    }

    return {
      options: shuffle([cStr, ...distractors.slice(0, 3)]),
      correctText: cStr
    };
  }

  function genReposeMu() {
    const alpha = pick([14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]);
    const rad = toRad(alpha);
    const mu = Math.tan(rad);
    const { options, correctText } = uniqueNumericOptions(
      mu,
      [Math.sin(rad), Math.cos(rad), 1 / Math.tan(rad), mu * 1.35],
      3
    );
    return {
      id: `num-repose-mu-${alpha}`,
      type: 'NUMERICAL',
      source: 'PROCEDURAL',
      q: `In an Angle of Repose test, a wooden block begins to slide down the plane at α = ${alpha}°. What is the limiting static coefficient of friction μ_s?`,
      options,
      correctText,
      explanation: `At the verge of slipping under gravity alone, μ_s = tan(α) = tan(${alpha}°) = ${mu.toFixed(3)}. (Using sin α or cos α is a common mistake.)`
    };
  }

  function genReposeAngle() {
    const mu = pick([0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.58, 0.65, 0.75, 0.85]);
    const alpha = toDeg(Math.atan(mu));
    const { options, correctText } = uniqueNumericOptions(
      alpha,
      [toDeg(Math.asin(Math.min(0.98, mu))), mu * 45, 90 - alpha, alpha * 1.25],
      1,
      '°'
    );
    return {
      id: `num-repose-ang-${mu}`,
      type: 'NUMERICAL',
      source: 'PROCEDURAL',
      q: `A material pair has a static coefficient of friction μ_s = ${mu.toFixed(2)}. At what inclination angle α will a block placed on this plane just begin to slide?`,
      options,
      correctText,
      explanation: `Since μ_s = tan(α), the critical slip angle is α = arctan(${mu.toFixed(2)}) = ${alpha.toFixed(1)}°.`
    };
  }

  function genHorizontalPlane() {
    const W = pick([5, 6, 8, 10, 12, 15, 20]);
    const mu = pick([0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.60]);
    const P = round(W * mu, 2);
    const { options, correctText } = uniqueNumericOptions(
      mu,
      [W / P, P * W / 10, mu * 0.5, mu * 1.4],
      2
    );
    return {
      id: `num-horiz-${W}-${P}`,
      type: 'NUMERICAL',
      source: 'PROCEDURAL',
      q: `On a horizontal friction plane (θ = 0°), a block of weight W = ${W} N just starts moving when the hanging pan exerts a pull P = ${P.toFixed(2)} N. Find μ_s.`,
      options,
      correctText,
      explanation: `For a horizontal plane (θ = 0°), N = W and μ_s = P / W = ${P.toFixed(2)} / ${W} = ${mu.toFixed(2)}.`
    };
  }

  function genInclinedPlanePull() {
    const W = pick([6, 8, 10, 12, 15]);
    const theta = pick([15, 20, 25, 30]);
    const mu = pick([0.25, 0.30, 0.35, 0.40, 0.50]);
    const rad = toRad(theta);
    const P = W * (Math.sin(rad) + mu * Math.cos(rad));
    const wrongMinus = Math.abs(W * (mu * Math.cos(rad) - Math.sin(rad)));
    const wrongNoSin = W * mu * Math.cos(rad);
    const wrongSwap = W * (Math.cos(rad) + mu * Math.sin(rad));
    const { options, correctText } = uniqueNumericOptions(
      P,
      [wrongNoSin, wrongSwap, wrongMinus > 0.3 ? wrongMinus : P * 0.72, P * 1.25],
      2,
      ' N'
    );
    return {
      id: `num-inc-p-${W}-${theta}-${mu}`,
      type: 'NUMERICAL',
      source: 'PROCEDURAL',
      q: `A ${W} N block rests on a plane inclined at θ = ${theta}° with μ_s = ${mu.toFixed(2)}. What pull force P parallel and UP the plane is needed to initiate upward motion?`,
      options,
      correctText,
      explanation: `To initiate upward motion, P must overcome both gravity along the slope and friction: P = W sin(${theta}°) + μ_s W cos(${theta}°) = ${(W * Math.sin(rad)).toFixed(2)} + ${(mu * W * Math.cos(rad)).toFixed(2)} = ${P.toFixed(2)} N.`
    };
  }

  function genNormalForce() {
    const W = pick([10, 15, 20, 25, 30, 40, 50]);
    const theta = pick([20, 25, 30, 35, 40]);
    const rad = toRad(theta);
    const N = W * Math.cos(rad);
    const { options, correctText } = uniqueNumericOptions(
      N,
      [W * Math.sin(rad), W, W * Math.tan(rad), N * 0.75],
      2,
      ' N'
    );
    return {
      id: `num-norm-${W}-${theta}`,
      type: 'NUMERICAL',
      source: 'PROCEDURAL',
      q: `A block of weight W = ${W} N rests on an inclined plane tilted at θ = ${theta}°. What is the Normal Reaction N exerted by the plane on the block?`,
      options,
      correctText,
      explanation: `Perpendicular to the inclined plane, equilibrium gives N = W cos(θ) = ${W} × cos(${theta}°) = ${N.toFixed(2)} N. (W sin θ is the down-slope component.)`
    };
  }

  function genEquilibriumTrap() {
    const W = pick([10, 15, 20, 25, 30]);
    const mu = pick([0.40, 0.50, 0.60]);
    const fMax = round(W * mu, 1);
    const F = round(fMax * pick([0.4, 0.5, 0.6, 0.7]), 1);
    const { options, correctText } = uniqueNumericOptions(
      F,
      [fMax, round(fMax - F, 1), round(fMax + F, 1), W],
      1,
      ' N'
    );
    return {
      id: `num-trap-${W}-${mu}-${F}`,
      type: 'NUMERICAL',
      source: 'PROCEDURAL',
      q: `A ${W} N block rests on a horizontal floor (μ_s = ${mu.toFixed(2)}). A horizontal force F = ${F.toFixed(1)} N is applied. What is the actual static friction force acting on the block?`,
      options,
      correctText,
      explanation: `Maximum possible static friction is f_max = μ_s · W = ${fMax.toFixed(1)} N. Because the applied push (${F.toFixed(1)} N) is below f_max, the block stays at rest and static friction matches the push exactly: f_s = ${F.toFixed(1)} N.`
    };
  }

  const NUMERICAL_GENERATORS = [
    genReposeMu,
    genReposeAngle,
    genHorizontalPlane,
    genInclinedPlanePull,
    genNormalForce,
    genEquilibriumTrap
  ];

  /* ================================================================
     4. INTELLIGENT RATE-LIMITED AI FETCHER + LOCAL AI QUESTION CACHE
        Protects free-tier quota automatically:
          - Min 60s cooldown between live Worker requests per browser
          - Max 12 live Worker requests per calendar day per browser
          - Caches unused AI questions locally (up to 40) so consecutive
            quizzes stay fresh with zero extra API calls!
     ================================================================ */
  const AI_ENDPOINT = 'https://friction-quiz.126omkar4024.workers.dev/';
  const STORAGE_AI_CACHE = 'fl-quiz-ai-cache-v1';
  const STORAGE_RATE = 'fl-quiz-ai-rate-v1';
  const COOLDOWN_MS = 60 * 1000;
  const MAX_DAILY_CALLS = 12;

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
      .replace(/\\degree|\^\{\\circ\}|\^\\circ/g, '°')
      .replace(/\\_/g, '_')
      .trim();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function canCallAiWorker() {
    if (!AI_ENDPOINT || !navigator.onLine) return false;
    const rate = loadJson(STORAGE_RATE, { day: todayKey(), count: 0, lastAt: 0 });
    if (rate.day !== todayKey()) return true;
    if (rate.count >= MAX_DAILY_CALLS) return false;
    if (Date.now() - (rate.lastAt || 0) < COOLDOWN_MS) return false;
    return true;
  }

  function recordAiWorkerCall() {
    const day = todayKey();
    const rate = loadJson(STORAGE_RATE, { day, count: 0, lastAt: 0 });
    const nextCount = rate.day === day ? (rate.count || 0) + 1 : 1;
    saveJson(STORAGE_RATE, { day, count: nextCount, lastAt: Date.now() });
  }

  function popCachedAiQuestions(need) {
    const cache = loadJson(STORAGE_AI_CACHE, []);
    if (!cache.length) return [];
    const shuffled = shuffle(cache);
    const taken = shuffled.slice(0, need);
    const remaining = shuffled.slice(need);
    saveJson(STORAGE_AI_CACHE, remaining);
    return taken.map(item => ({
      ...item,
      options: shuffle(item.options)
    }));
  }

  async function fetchFreshAiQuestions(need, avoidFamilies) {
    // 1. First draw from local AI cache if we already have unseen AI questions buffered
    const fromCache = popCachedAiQuestions(need);
    if (fromCache.length >= need) return fromCache;

    // 2. If rate-limited or offline, return whatever cache had (local bank fills the rest invisibly)
    if (!canCallAiWorker()) return fromCache;

    recordAiWorkerCall();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    try {
      // Request a batch of 6 in 1 single API call to maximize free-tier efficiency
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          count: 6,
          avoidTopics: avoidFamilies
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return fromCache;

      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (Array.isArray(data.questions) ? data.questions : []);
      const valid = [];

      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        if (!item || typeof item.question !== 'string' || !Array.isArray(item.options) || item.options.length !== 4) continue;
        if (!Number.isInteger(item.correctIndex) || item.correctIndex < 0 || item.correctIndex > 3) continue;
        if (typeof item.explanation !== 'string' || !item.explanation.trim()) continue;
        const cleanOpts = item.options.map(o => cleanMathText(o));
        if (new Set(cleanOpts).size !== 4) continue;
        valid.push({
          id: `ai-${Date.now()}-${i}`,
          type: 'THEORY',
          q: cleanMathText(item.question),
          options: shuffle(cleanOpts),
          correctText: cleanOpts[item.correctIndex],
          explanation: cleanMathText(item.explanation)
        });
      }

      const stillNeed = Math.max(0, need - fromCache.length);
      const useNow = valid.slice(0, stillNeed);
      const extras = valid.slice(stillNeed);

      // Buffer leftover fresh AI questions into local cache (max 40) for instant future runs
      if (extras.length) {
        const existing = loadJson(STORAGE_AI_CACHE, []);
        saveJson(STORAGE_AI_CACHE, [...extras, ...existing].slice(0, 40));
      }

      return [...fromCache, ...useNow];
    } catch (e) {
      clearTimeout(timer);
      return fromCache;
    }
  }

  /* ================================================================
     5. HYBRID DECK BUILDER (Deep Random Shuffle, Zero Repeats)
     ================================================================ */
  function buildLocalTheoryItems(count, onlyMissedIds) {
    let seen = loadJson(STORAGE_SEEN, []);
    let candidates = onlyMissedIds
      ? THEORY_BANK.filter(q => onlyMissedIds.includes(q.id))
      : THEORY_BANK.filter(q => !seen.includes(q.id));

    if (!onlyMissedIds && candidates.length < count) {
      seen = [];
      saveJson(STORAGE_SEEN, []);
      candidates = THEORY_BANK.slice();
    }

    const picked = [];
    const usedFamilies = new Set();
    const shuffledCands = shuffle(candidates);

    for (const item of shuffledCands) {
      if (picked.length >= count) break;
      if (!onlyMissedIds && usedFamilies.has(item.family)) continue;
      usedFamilies.add(item.family);
      const chosenDistractors = shuffle(item.distractors).slice(0, 3);
      picked.push({
        id: item.id,
        family: item.family,
        type: 'THEORY',
        q: item.q,
        options: shuffle([item.correct, ...chosenDistractors]),
        correctText: item.correct,
        explanation: item.explanation
      });
    }

    if (picked.length < count) {
      const pickedIds = new Set(picked.map(p => p.id));
      for (const item of shuffledCands) {
        if (picked.length >= count) break;
        if (pickedIds.has(item.id)) continue;
        pickedIds.add(item.id);
        const chosenDistractors = shuffle(item.distractors).slice(0, 3);
        picked.push({
          id: item.id,
          family: item.family,
          type: 'THEORY',
          q: item.q,
          options: shuffle([item.correct, ...chosenDistractors]),
          correctText: item.correct,
          explanation: item.explanation
        });
      }
    }

    return picked;
  }

  function buildProceduralNumericals(count) {
    const out = [];
    let gens = shuffle(NUMERICAL_GENERATORS);
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % gens.length === 0) gens = shuffle(NUMERICAL_GENERATORS);
      out.push(gens[i % gens.length]());
    }
    return out;
  }

  async function buildQuizSession(mode, totalCount) {
    const TOTAL = Math.max(3, Math.min(30, Number(totalCount) || 10));
    const missedIds = loadJson(STORAGE_MISSED, []);
    const recentAvoid = loadJson(STORAGE_SEEN, []).slice(-8);

    if (mode === 'missed') {
      const missedTheory = buildLocalTheoryItems(TOTAL, missedIds);
      if (missedTheory.length > 0) return shuffle(missedTheory);
      mode = 'mixed';
    }

    if (mode === 'numerical') {
      return shuffle(buildProceduralNumericals(TOTAL));
    }

    if (mode === 'theory') {
      const aiTarget = Math.min(5, Math.ceil(TOTAL * 0.4));
      const aiItems = await fetchFreshAiQuestions(aiTarget, recentAvoid);
      const matItems = [];
      const matCount = Math.min(2, Math.max(0, TOTAL - aiItems.length - 3));
      for (let i = 0; i < matCount; i++) {
        const mq = generateMaterialPairQuestion();
        if (mq) matItems.push(mq);
      }
      const localNeed = Math.max(0, TOTAL - aiItems.length - matItems.length);
      const localTheory = buildLocalTheoryItems(localNeed, null);
      const seen = new Set(loadJson(STORAGE_SEEN, []));
      localTheory.forEach(item => { if (item.id) seen.add(item.id); });
      saveJson(STORAGE_SEEN, Array.from(seen));
      return shuffle(shuffle([...aiItems, ...matItems, ...localTheory]));
    }

    const numNeed = Math.max(1, Math.round(TOTAL * 0.40));
    const theoryPoolNeed = TOTAL - numNeed;
    const aiTarget = Math.min(4, Math.ceil(theoryPoolNeed * 0.5));
    const aiItems = await fetchFreshAiQuestions(aiTarget, recentAvoid);
    const matItems = [];
    const matTarget = theoryPoolNeed >= 3 ? Math.min(2, Math.floor(TOTAL / 6)) : 0;
    for (let i = 0; i < matTarget; i++) {
      const mq = generateMaterialPairQuestion();
      if (mq) matItems.push(mq);
    }
    const localTheoryNeed = Math.max(0, theoryPoolNeed - aiItems.length - matItems.length);
    const localTheory = buildLocalTheoryItems(localTheoryNeed, null);
    const numericals = buildProceduralNumericals(numNeed);

    const seen = new Set(loadJson(STORAGE_SEEN, []));
    localTheory.forEach(item => { if (item.id) seen.add(item.id); });
    saveJson(STORAGE_SEEN, Array.from(seen));

    return shuffle(shuffle([...aiItems, ...matItems, ...localTheory, ...numericals]));
  }

  /* ================================================================
     6. PRODUCTION QUIZ UI & EYE-CATCHING GSAP CHOREOGRAPHY
     ================================================================ */
  const LOAD_SUBTITLES = [
    'Crafting a fresh set of questions for you…',
    'Balancing theory concepts and numerical problems…',
    'Shuffling choices and calibrating formulas…'
  ];

  let state = {
    mode: 'mixed',
    count: 10,
    timed: false,
    secondsLeft: 0,
    timerId: null,
    loadSubTimer: null,
    loadTween: null,
    questions: [],
    idx: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    history: []
  };

  function el(id) { return document.getElementById(id); }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function stopLoadingAnim() {
    if (state.loadSubTimer) { clearInterval(state.loadSubTimer); state.loadSubTimer = null; }
    if (state.loadTween) { state.loadTween.kill(); state.loadTween = null; }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function startTimer() {
    stopTimer();
    const wrap = el('qzTimerWrap');
    const txt = el('qzTimerText');
    if (!state.timed) {
      if (wrap) wrap.style.display = 'none';
      return;
    }
    state.secondsLeft = state.questions.length * 45;
    if (wrap) wrap.style.display = 'inline';
    if (txt) txt.textContent = formatTime(state.secondsLeft);
    state.timerId = setInterval(() => {
      state.secondsLeft--;
      if (txt) txt.textContent = formatTime(Math.max(0, state.secondsLeft));
      if (state.secondsLeft <= 0) {
        stopTimer();
        renderSummary();
      }
    }, 1000);
  }

  function updateMissedButton() {
    const btn = el('qzModeMissed');
    if (!btn) return;
    const missed = loadJson(STORAGE_MISSED, []);
    btn.disabled = missed.length === 0;
    btn.textContent = missed.length > 0 ? `Missed (${missed.length})` : 'Missed (0)';
  }

  function showSetup() {
    stopTimer();
    stopLoadingAnim();
    updateMissedButton();
    if (el('qzStage')) el('qzStage').style.display = 'none';
    if (el('qzSummary')) el('qzSummary').style.display = 'none';
    if (el('qzLoading')) el('qzLoading').style.display = 'none';
    const setup = el('qzSetup');
    if (setup) {
      setup.style.display = 'block';
      if (hasGsap()) {
        window.gsap.fromTo(
          setup.querySelectorAll('.qz-setup-block, .qz-setup-cta'),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out', overwrite: 'auto' }
        );
      }
    }
  }

  async function startQuiz(overrideMode) {
    if (overrideMode) state.mode = overrideMode;
    stopTimer();
    stopLoadingAnim();

    const setupEl = el('qzSetup');
    const sumEl = el('qzSummary');
    const stageEl = el('qzStage');
    const loadEl = el('qzLoading');
    const fillEl = el('qzLoadFill');
    const pctEl = el('qzLoadPct');
    const subEl = el('qzLoadSub');

    if (setupEl) setupEl.style.display = 'none';
    if (sumEl) sumEl.style.display = 'none';
    if (stageEl) stageEl.style.display = 'none';
    if (loadEl) loadEl.style.display = 'flex';

    // Animated GSAP loading bar + rotating smooth subtitles
    const progObj = { v: 0 };
    let subIdx = 0;
    if (subEl) subEl.textContent = LOAD_SUBTITLES[0];
    if (pctEl) pctEl.textContent = '0%';
    if (fillEl) fillEl.style.transform = 'scaleX(0)';

    if (hasGsap()) {
      window.gsap.fromTo(loadEl, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
      state.loadTween = window.gsap.to(progObj, {
        v: 86,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => {
          if (pctEl) pctEl.textContent = `${Math.round(progObj.v)}%`;
          if (fillEl) fillEl.style.transform = `scaleX(${(progObj.v / 100).toFixed(3)})`;
        }
      });
    }

    state.loadSubTimer = setInterval(() => {
      subIdx = (subIdx + 1) % LOAD_SUBTITLES.length;
      if (!subEl) return;
      if (hasGsap()) {
        window.gsap.to(subEl, {
          y: -8, opacity: 0, duration: 0.22, ease: 'power2.in',
          onComplete: () => {
            subEl.textContent = LOAD_SUBTITLES[subIdx];
            window.gsap.fromTo(subEl, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
          }
        });
      } else {
        subEl.textContent = LOAD_SUBTITLES[subIdx];
      }
    }, 1100);

    // Ensure at least 650ms of smooth visual progress so the bar never flickers jarringly
    const minWait = new Promise(r => setTimeout(r, 650));
    const [questions] = await Promise.all([buildQuizSession(state.mode, state.count), minWait]);

    stopLoadingAnim();

    // Finish progress bar cleanly to 100% before revealing Question 1
    if (hasGsap() && loadEl) {
      await new Promise(resolve => {
        window.gsap.to(progObj, {
          v: 100,
          duration: 0.28,
          ease: 'power2.out',
          onUpdate: () => {
            if (pctEl) pctEl.textContent = `${Math.round(progObj.v)}%`;
            if (fillEl) fillEl.style.transform = `scaleX(${(progObj.v / 100).toFixed(3)})`;
          },
          onComplete: () => {
            window.gsap.to(loadEl, { y: -12, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: resolve });
          }
        });
      });
    }

    state.questions = questions;
    state.idx = 0;
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.answered = false;
    state.history = [];

    if (loadEl) { loadEl.style.display = 'none'; loadEl.style.opacity = ''; loadEl.style.transform = ''; }
    if (stageEl) stageEl.style.display = 'block';

    startTimer();
    renderCurrentQuestion(false);
  }

  /* ================================================================
     6A. PIXEL-FIELD RADIAL DISSOLVE REVEAL (Vanilla port of TapReveal)
         Paints a HiDPI monochrome pixel grid over #qzQuestionCard and
         dissolves cells radially with a crisp bright flash wave.
     ================================================================ */
  const MAX_PIXEL_CELLS = 40000;

  function pxHash(v) {
    let n = Math.imul(v ^ 0x9e3779b9, 0x85ebca6b);
    n ^= n >>> 13;
    n = Math.imul(n, 0xc2b2ae35);
    n ^= n >>> 16;
    return n >>> 0;
  }

  function getPixelPalette() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight
      ? { base: '#F7F2EB', shades: ['#EFE9DF', '#E8E0D5', '#DDD4C7'], twinkle: '#C7BDB0', flash: '#18181b' }
      : { base: '#0a0a0a', shades: ['#121214', '#18181b', '#1f1f23'], twinkle: '#3f3f46', flash: '#e4e4e7' };
  }

  let pixelRevealRaf = 0;

  function triggerPixelDissolve(durationMs = 620, originFrac = { x: 0.5, y: 0.45 }) {
    const card = el('qzQuestionCard');
    const canvas = el('qzPixelCanvas');
    if (!card || !canvas) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.opacity = '0';
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(pixelRevealRaf);

    const width = Math.max(100, card.clientWidth);
    const height = Math.max(100, card.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.opacity = '1';

    let cell = Math.max(8, Math.ceil(Math.sqrt((width * height) / MAX_PIXEL_CELLS)));
    while (Math.ceil(width / cell) * Math.ceil(height / cell) > MAX_PIXEL_CELLS) cell++;
    const gap = cell >= 4 ? 1 : 0;
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const count = cols * rows;
    const seed = (Date.now() & 0xfffffff) ^ 0x5bd1e995;
    const palette = getPixelPalette();

    const paintCell = (i, color) => {
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      ctx.fillStyle = palette.base;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cell - gap, cell - gap);
    };
    const clearCell = (i) => {
      ctx.clearRect((i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
    };

    // Paint initial sealed monochrome pixel field
    ctx.fillStyle = palette.base;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
      const h = pxHash(i + seed) % 10;
      paintCell(i, palette.shades[h < 6 ? 0 : h < 9 ? 1 : 2]);
    }

    // Compute radial dissolve start times + hash jitter
    const ox = width * (originFrac ? originFrac.x : 0.5);
    const oy = height * (originFrac ? originFrac.y : 0.45);
    const reach = Math.max(
      Math.hypot(ox, oy),
      Math.hypot(width - ox, oy),
      Math.hypot(ox, height - oy),
      Math.hypot(width - ox, height - oy)
    ) || 1;
    const flash = Math.min(72, durationMs * 0.13);
    const jitter = durationMs * 0.22;
    const spread = Math.max(0, durationMs - flash - jitter);

    const start = new Float32Array(count);
    const order = new Uint32Array(count);
    for (let i = 0; i < count; i++) {
      const cx = (i % cols) * cell + cell * 0.5;
      const cy = Math.floor(i / cols) * cell + cell * 0.5;
      start[i] = (Math.hypot(cx - ox, cy - oy) / reach) * spread + ((pxHash(i ^ seed) % 1000) / 1000) * jitter;
      order[i] = i;
    }
    order.sort((a, b) => start[a] - start[b]);

    let lit = 0;
    let cleared = 0;
    let startedAt = -1;

    const frame = (now) => {
      if (startedAt < 0) startedAt = now;
      const elapsed = now - startedAt;
      while (lit < count && start[order[lit]] <= elapsed) {
        paintCell(order[lit++], palette.flash);
      }
      while (cleared < lit && start[order[cleared]] + flash <= elapsed) {
        clearCell(order[cleared++]);
      }
      if (cleared < count) {
        pixelRevealRaf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        canvas.style.opacity = '0';
      }
    };
    pixelRevealRaf = requestAnimationFrame(frame);
  }

  function transitionToNextQuestion() {
    if (!hasGsap()) {
      state.idx++;
      renderCurrentQuestion(false);
      return;
    }
    const card = el('qzQuestionCard');
    window.gsap.to(card, {
      x: -26,
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        state.idx++;
        if (state.idx >= state.questions.length) {
          window.gsap.set(card, { x: 0, opacity: 1 });
          renderSummary();
        } else {
          renderCurrentQuestion(true);
        }
      }
    });
  }

  function renderCurrentQuestion(fromSlide) {
    const qObj = state.questions[state.idx];
    if (!qObj) { renderSummary(); return; }
    state.answered = false;

    const total = state.questions.length;
    el('qzProgressText').textContent = `${String(state.idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    if (hasGsap()) {
      window.gsap.to('#qzProgressFill', { scaleX: (state.idx + 1) / total, duration: 0.45, ease: 'power3.out' });
    } else {
      el('qzProgressFill').style.transform = `scaleX(${((state.idx + 1) / total).toFixed(3)})`;
    }
    el('qzScoreText').textContent = `${state.score}`;
    el('qzStreakText').textContent = `${state.streak}`;
    el('qzTypeTag').textContent = qObj.type;
    el('qzQuestionText').textContent = qObj.q;

    const fb = el('qzFeedback');
    if (fb) { fb.style.display = 'none'; fb.classList.remove('is-correct', 'is-wrong'); }

    const nextBtn = el('qzNextBtn');
    if (nextBtn) {
      nextBtn.style.display = 'none';
      nextBtn.textContent = state.idx === total - 1 ? 'View Results →' : 'Next Question →';
    }

    const optsWrap = el('qzOptions');
    const letters = ['A', 'B', 'C', 'D'];
    optsWrap.innerHTML = qObj.options.map((_, i) => `
      <button type="button" class="qz-opt" data-idx="${i}">
        <span class="qz-opt-key">${letters[i]}</span>
        <span class="qz-opt-text"></span>
        <span class="qz-opt-mark" aria-hidden="true"></span>
      </button>
    `).join('');

    optsWrap.querySelectorAll('.qz-opt').forEach((btn, i) => {
      btn.querySelector('.qz-opt-text').textContent = qObj.options[i];
      btn.addEventListener('click', () => handleAnswer(i));
    });

    if (hasGsap()) {
      const card = el('qzQuestionCard');
      window.gsap.set(card, { x: 0, opacity: 1 });
      window.gsap.fromTo(
        '#qzOptions .qz-opt',
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, delay: 0.14, ease: 'power3.out', overwrite: 'auto' }
      );
    }
    requestAnimationFrame(() => {
      triggerPixelDissolve(fromSlide ? 460 : 680, fromSlide ? { x: 0.18, y: 0.25 } : { x: 0.5, y: 0.42 });
    });
  }

  function handleAnswer(chosenIdx) {
    if (state.answered) return;
    state.answered = true;

    const qObj = state.questions[state.idx];
    const chosenText = qObj.options[chosenIdx];
    const isCorrect = chosenText === qObj.correctText;
    const correctIdx = qObj.options.indexOf(qObj.correctText);

    const optBtns = Array.from(document.querySelectorAll('#qzOptions .qz-opt'));
    optBtns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIdx) {
        btn.classList.add('is-correct');
        btn.querySelector('.qz-opt-mark').textContent = '✓';
      } else if (i === chosenIdx && !isCorrect) {
        btn.classList.add('is-wrong');
        btn.querySelector('.qz-opt-mark').textContent = '✕';
      } else {
        btn.classList.add('is-dim');
      }
    });

    const missedSet = new Set(loadJson(STORAGE_MISSED, []));
    if (isCorrect) {
      state.score++;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      if (qObj.id) missedSet.delete(qObj.id);
      if (hasGsap() && optBtns[correctIdx]) {
        window.gsap.fromTo(optBtns[correctIdx], { scale: 0.985 }, { scale: 1, duration: 0.38, ease: 'back.out(2.2)' });
        window.gsap.fromTo(['#qzScoreText', '#qzStreakText'], { scale: 1.3 }, { scale: 1, duration: 0.35, ease: 'power2.out' });
      }
    } else {
      state.streak = 0;
      if (qObj.id && !qObj.id.startsWith('num-') && !qObj.id.startsWith('ai-') && !qObj.id.startsWith('mat-')) {
        missedSet.add(qObj.id);
      }
      if (hasGsap() && optBtns[chosenIdx]) {
        window.gsap.fromTo(optBtns[chosenIdx], { x: -9 }, { x: 0, duration: 0.42, ease: 'elastic.out(1.2, 0.28)' });
      }
    }
    saveJson(STORAGE_MISSED, Array.from(missedSet));
    updateMissedButton();

    el('qzScoreText').textContent = `${state.score}`;
    el('qzStreakText').textContent = `${state.streak}`;

    state.history.push({
      q: qObj.q,
      chosen: chosenText,
      correctText: qObj.correctText,
      isCorrect,
      explanation: qObj.explanation,
      type: qObj.type
    });

    const fb = el('qzFeedback');
    const fbTitle = el('qzFeedbackTitle');
    const fbBody = el('qzFeedbackBody');
    if (fb && fbTitle && fbBody) {
      fb.classList.toggle('is-correct', isCorrect);
      fb.classList.toggle('is-wrong', !isCorrect);
      fbTitle.textContent = isCorrect ? 'CORRECT — VERIFIED' : 'INCORRECT — EXPLANATION';
      fbBody.textContent = qObj.explanation;
      fb.style.display = 'block';
      if (hasGsap()) {
        window.gsap.fromTo(fb, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
      }
    }

    const nextBtn = el('qzNextBtn');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      if (hasGsap()) {
        window.gsap.fromTo(nextBtn, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, delay: 0.08, ease: 'power3.out' });
      }
    }
  }

  function skipQuestion() {
    const qObj = state.questions[state.idx];
    if (!qObj) return;
    if (!state.answered) {
      state.streak = 0;
      state.history.push({
        q: qObj.q,
        chosen: 'Skipped',
        correctText: qObj.correctText,
        isCorrect: false,
        explanation: qObj.explanation,
        type: qObj.type
      });
    }
    transitionToNextQuestion();
  }

  function renderSummary() {
    stopTimer();
    el('qzStage').style.display = 'none';
    const sumEl = el('qzSummary');
    sumEl.style.display = 'block';

    const total = state.questions.length || Math.max(1, state.history.length);
    const pct = Math.round((state.score / total) * 100);
    const theoryItems = state.history.filter(h => h.type === 'THEORY');
    const numItems = state.history.filter(h => h.type === 'NUMERICAL');
    const thScore = theoryItems.filter(h => h.isCorrect).length;
    const numScore = numItems.filter(h => h.isCorrect).length;

    el('qzSumSplit').textContent = `${thScore}/${theoryItems.length} Theory · ${numScore}/${numItems.length} Numerical`;

    if (hasGsap()) {
      const counters = { s: 0, p: 0, st: 0 };
      window.gsap.to(counters, {
        s: state.score, p: pct, st: state.bestStreak,
        duration: 0.85, ease: 'power3.out',
        onUpdate: () => {
          el('qzSumScore').textContent = `${Math.round(counters.s)} / ${total}`;
          el('qzSumPct').textContent = `${Math.round(counters.p)}%`;
          el('qzSumStreak').textContent = `${Math.round(counters.st)}`;
        }
      });
    } else {
      el('qzSumScore').textContent = `${state.score} / ${total}`;
      el('qzSumPct').textContent = `${pct}%`;
      el('qzSumStreak').textContent = `${state.bestStreak}`;
    }

    const missedList = state.history.filter(h => !h.isCorrect);
    const reviewWrap = el('qzReviewList');
    if (missedList.length === 0 && state.history.length === total) {
      reviewWrap.innerHTML = `<div class="qz-perfect">Perfect score — zero errors across all ${total} questions.</div>`;
    } else if (missedList.length === 0) {
      reviewWrap.innerHTML = `<div class="qz-perfect">No incorrect answers in the ${state.history.length} questions completed.</div>`;
    } else {
      reviewWrap.innerHTML = missedList.map((m, i) => `
        <div class="qz-review-item">
          <div class="qz-rev-q"><span>${String(i + 1).padStart(2, '0')}</span> ${escapeHtml(m.q)}</div>
          <div class="qz-rev-ans">
            <span class="qz-rev-wrong">Your answer: ${escapeHtml(m.chosen)}</span>
            <span class="qz-rev-right">Correct: ${escapeHtml(m.correctText)}</span>
          </div>
          <p class="qz-rev-exp">${escapeHtml(m.explanation)}</p>
        </div>
      `).join('');
    }

    if (hasGsap()) {
      window.gsap.fromTo(
        sumEl.querySelectorAll('.qz-sum-kpi, .qz-sum-actions, .qz-review-item, .qz-perfect'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.52, stagger: 0.06, ease: 'power3.out' }
      );
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ================================================================
     7. BOOT & EVENT BINDINGS
     ================================================================ */
  let quizBound = false;

  function initQuiz() {
    const page = el('page-quiz');
    if (!page) return;

    if (!quizBound) {
      quizBound = true;

      page.querySelectorAll('#qzCountBar .qz-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          page.querySelectorAll('#qzCountBar .qz-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.count = parseInt(btn.dataset.count, 10) || 10;
        });
      });

      page.querySelectorAll('#qzModeBar .qz-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          page.querySelectorAll('#qzModeBar .qz-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.mode = btn.dataset.mode;
        });
      });

      page.querySelectorAll('#qzTimerBar .qz-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          page.querySelectorAll('#qzTimerBar .qz-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.timed = btn.dataset.timer === 'on';
        });
      });

      if (el('qzStartBtn')) el('qzStartBtn').addEventListener('click', () => startQuiz());
      if (el('qzResetDeckBtn')) {
        el('qzResetDeckBtn').addEventListener('click', () => {
          localStorage.removeItem(STORAGE_SEEN);
          localStorage.removeItem(STORAGE_MISSED);
          updateMissedButton();
          if (typeof window.showSimToast === 'function') {
            window.showSimToast('History Cleared', 'Question history has been reset.', 'OK');
          }
        });
      }

      if (el('qzNextBtn')) el('qzNextBtn').addEventListener('click', transitionToNextQuestion);
      if (el('qzSkipBtn')) el('qzSkipBtn').addEventListener('click', skipQuestion);
      if (el('qzEndBtn')) el('qzEndBtn').addEventListener('click', renderSummary);
      if (el('qzNewSetupBtn')) el('qzNewSetupBtn').addEventListener('click', showSetup);

      if (el('qzRestartBtn')) el('qzRestartBtn').addEventListener('click', () => startQuiz(state.mode));
      if (el('qzBackSetupBtn')) el('qzBackSetupBtn').addEventListener('click', showSetup);
      if (el('qzRetryMissedBtn')) {
        el('qzRetryMissedBtn').addEventListener('click', () => {
          const missed = loadJson(STORAGE_MISSED, []);
          startQuiz(missed.length > 0 ? 'missed' : 'mixed');
        });
      }

      document.addEventListener('keydown', (e) => {
        if (!page.classList.contains('active')) return;
        if (el('qzStage') && el('qzStage').style.display === 'none') return;
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        const k = e.key.toLowerCase();
        if (!state.answered) {
          const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
          if (k in map) { e.preventDefault(); handleAnswer(map[k]); }
        } else if (k === 'enter') {
          e.preventDefault();
          transitionToNextQuestion();
        }
      });
    }

    updateMissedButton();
    if (state.questions.length === 0) showSetup();
  }


  window.addEventListener('pagechange', (e) => {
    if (e && e.detail && e.detail.page === 'quiz') {
      requestAnimationFrame(initQuiz);
    } else {
      stopTimer();
      stopLoadingAnim();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const page = el('page-quiz');
    if (page && page.classList.contains('active')) initQuiz();
  });
})();
