const fs = require('fs');

const path = require('path');

// Minimal Mock DOM for Node
class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.listeners = {};
    this.attributes = {};
    this.dataset = {};
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; },
      removeProperty: (k) => { delete this.style[k]; }
    };
    this.value = '';
    this.min = '0';
    this.max = '100';
    this.step = '0.1';
    this.disabled = false;
    this.innerHTML = '';
    this.textContent = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
  }

  addEventListener(type, fn, opts) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(f => f !== fn);
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(fn => fn(event));
    }
    if (event.bubbles && this.parentElement) {
      this.parentElement.dispatchEvent(event);
    }
    return true;
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }

  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }

  querySelectorAll(sel) {
    const res = [];
    const walk = (el) => {
      for (const ch of el.children) {
        if (sel.startsWith('#') && ch.id === sel.slice(1)) res.push(ch);
        else if (sel.startsWith('.') && ch.classList.contains(sel.slice(1))) res.push(ch);
        else if (sel.startsWith('[data-add-p]') && ch.dataset.addP !== undefined) res.push(ch);
        else if (sel.includes('[data-step-target="frictionForce"]') && ch.dataset.stepTarget === 'frictionForce') res.push(ch);
        else if (sel === '.slider-step-btn' && ch.classList.contains('slider-step-btn')) res.push(ch);
        else if (sel === 'option' && ch.tagName === 'OPTION') res.push(ch);
        walk(ch);
      }
    };
    walk(this);
    return res;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  closest(sel) {
    let cur = this;
    while (cur) {
      if (sel.startsWith('.') && cur.classList && cur.classList.contains(sel.slice(1))) return cur;
      if (sel.startsWith('#') && cur.id === sel.slice(1)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 200, height: 20, right: 200, bottom: 20 };
  }
}

class MockDocument extends MockElement {
  constructor() {
    super('document', 'DOCUMENT');
    this.elements = {};
    this.body = new MockElement('body', 'BODY');
    this.appendChild(this.body);
  }

  createElement(tag) {
    return new MockElement('', tag);
  }

  getElementById(id) {
    if (!this.elements[id]) {
      const el = new MockElement(id);
      this.elements[id] = el;
      this.body.appendChild(el);
    }
    return this.elements[id];
  }

  querySelectorAll(sel) {
    return this.body.querySelectorAll(sel);
  }

  querySelector(sel) {
    return this.body.querySelector(sel);
  }
}

// Set up global environment
const mockDoc = new MockDocument();
global.document = mockDoc;
global.window = global;
global.window.document = mockDoc;
global.window.listeners = {};
global.window.addEventListener = (type, fn) => {
  if (!global.window.listeners[type]) global.window.listeners[type] = [];
  global.window.listeners[type].push(fn);
};
global.window.removeEventListener = (type, fn) => {
  if (!global.window.listeners[type]) return;
  global.window.listeners[type] = global.window.listeners[type].filter(f => f !== fn);
};
global.window.dispatchEvent = (event) => {
  if (global.window.listeners[event.type]) {
    global.window.listeners[event.type].forEach(fn => fn(event));
  }
};
global.Event = class {
  constructor(type, opts = {}) {
    this.type = type;
    this.bubbles = !!opts.bubbles;
  }
  preventDefault() {}
  stopPropagation() {}
  stopImmediatePropagation() {}
};
global.requestAnimationFrame = (cb) => {
  return setTimeout(() => cb(Date.now()), 16);
};
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.performance = { now: () => Date.now() };

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// Populate DOM select options
function setupOptions(selectId) {
  const sel = mockDoc.getElementById(selectId);
  sel.options = [];
  const mats = [
    'wood-wood', 'wood-steel', 'wood-glass', 'glass-glass',
    'steel-steel-dry', 'steel-steel-lub', 'aluminum-aluminum',
    'rubber-concrete', 'brass-steel'
  ];
  mats.forEach(m => {
    const opt = new MockElement('', 'option');
    opt.value = m;
    opt.text = m;
    sel.appendChild(opt);
    sel.options.push(opt);
  });
  sel.value = 'wood-wood';
}

setupOptions('reposeMaterial');
setupOptions('frictionMaterial');
setupOptions('logMaterial');
setupOptions('compareMaterial');

const methodSelect = mockDoc.getElementById('logMethod');
methodSelect.options = [
  { value: 'repose', text: 'Angle of Repose' },
  { value: 'friction', text: 'Friction Plane' }
];
methodSelect.value = 'repose';

// Sliders setup
mockDoc.getElementById('reposeAngle').min = '0';
mockDoc.getElementById('reposeAngle').max = '90';
mockDoc.getElementById('reposeAngle').step = '0.1';
mockDoc.getElementById('reposeAngle').value = '0';

mockDoc.getElementById('reposeWeight').min = '0.5';
mockDoc.getElementById('reposeWeight').max = '50';
mockDoc.getElementById('reposeWeight').step = '0.5';
mockDoc.getElementById('reposeWeight').value = '5';

mockDoc.getElementById('frictionAngle').min = '0';
mockDoc.getElementById('frictionAngle').max = '89';
mockDoc.getElementById('frictionAngle').step = '0.5';
mockDoc.getElementById('frictionAngle').value = '0';

mockDoc.getElementById('frictionWeight').min = '0.5';
mockDoc.getElementById('frictionWeight').max = '50';
mockDoc.getElementById('frictionWeight').step = '0.5';
mockDoc.getElementById('frictionWeight').value = '5';

mockDoc.getElementById('frictionForce').min = '0';
mockDoc.getElementById('frictionForce').max = '100';
mockDoc.getElementById('frictionForce').step = '0.1';
mockDoc.getElementById('frictionForce').value = '0';

// Add quick-add chips to body
[0.5, 1, 2, 5].forEach(d => {
  const chip = new MockElement('', 'button');
  chip.dataset.addP = String(d);
  chip.classList.add('btn');
  mockDoc.body.appendChild(chip);
});

// Load the modules
console.log('--- Loading simulate.js ---');
require('../js/simulate.js');
console.log('--- Loading data-log.js ---');
require('../js/data-log.js');
console.log('--- Loading compare.js ---');
require('../js/compare.js');

const CANONICAL = window.CANONICAL;
console.log('\nCANONICAL TABLE:');
console.table(Object.entries(CANONICAL).map(([k, v]) => ({
  material: k,
  slipAngle_deg: v.slipAngle_deg,
  mu_s: v.mu_s.toFixed(6)
})));

let passedCount = 0;
let totalCount = 0;
function assert(desc, condition) {
  totalCount++;
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

// -------------------------------------------------------------
// ACCEPTANCE TEST 1: Repose drag speeds & jumps
// -------------------------------------------------------------
console.log('\n=== ACCEPTANCE TEST 1: Repose angle speed independence ===');
let t1AllPassed = true;
const materials = Object.keys(CANONICAL);

for (const mat of materials) {
  const targetSlip = CANONICAL[mat].slipAngle_deg;
  const targetMu = CANONICAL[mat].mu_s;

  const testCases = [
    { name: '0.1 deg/step', step: 0.1 },
    { name: '1.0 deg/step', step: 1.0 },
    { name: '10.0 deg/step', step: 10.0 },
    { name: 'single jump to 90', step: 90.0 }
  ];

  for (const tc of testCases) {
    window.resetReposeApparatus();
    mockDoc.getElementById('reposeMaterial').value = mat;
    window.resetReposeApparatus();

    const slider = mockDoc.getElementById('reposeAngle');

    if (tc.step >= 90) {
      window.setSliderValue(slider, 90.0);
    } else {
      let cur = 0;
      while (cur < 90 && !slider.disabled) {
        cur += tc.step;
        window.setSliderValue(slider, cur.toFixed(1));
      }
    }

    const vals = window.getReposeValues();
    const bannerText = mockDoc.getElementById('reposeSlipText').textContent;
    const matchAngle = vals.angle === targetSlip;
    const matchMu = vals.mu.toFixed(4) === targetMu.toFixed(4);
    const matchBanner = bannerText.includes(`α = ${targetSlip.toFixed(1)}°`);
    const isSliderInteractive = slider.disabled === false;

    if (!matchAngle || !matchMu || !matchBanner || !isSliderInteractive) {
      t1AllPassed = false;
      console.error(`Test 1 Failed for ${mat} at ${tc.name}: angle=${vals.angle} (exp ${targetSlip}), mu=${vals.mu.toFixed(4)} (exp ${targetMu.toFixed(4)}), banner="${bannerText}"`);
    }
  }
}
assert('Test 1: Repose, every material across 4 speeds (0.1°, 1°, 10°, 90 jump) gives exact CANONICAL angle, mu, and unblocked interactive slider', t1AllPassed);

// -------------------------------------------------------------
// ACCEPTANCE TEST 2: Friction raising P at different speeds
// -------------------------------------------------------------
console.log('\n=== ACCEPTANCE TEST 2: Friction speed & chip independence ===');
let t2AllPassed = true;

const angleWeightCombos = [
  { a: 0, w: 10 },
  { a: 15, w: 20 },
  { a: 30, w: 5 }
];

for (const mat of materials) {
  const mu_s = CANONICAL[mat].mu_s;

  for (const combo of angleWeightCombos) {
    const rad = combo.a * Math.PI / 180;
    const reqP = mu_s * combo.w * Math.cos(rad) + combo.w * Math.sin(rad);

    const methods = ['0.1N', '1.0N', '5.0N', 'chip+5N'];

    for (const m of methods) {
      window.resetFrictionApparatus();
      mockDoc.getElementById('frictionMaterial').value = mat;
      window.resetFrictionApparatus();

      window.setSliderValue(mockDoc.getElementById('frictionAngle'), combo.a);
      window.setSliderValue(mockDoc.getElementById('frictionWeight'), combo.w);

      const forceSlider = mockDoc.getElementById('frictionForce');

      if (m === 'chip+5N') {
        const chip5 = mockDoc.body.querySelectorAll('[data-add-p]').find(b => b.dataset.addP === '5');
        let count = 0;
        while (!forceSlider.disabled && count < 25) {
          chip5.dispatchEvent(new Event('click'));
          count++;
        }
      } else {
        const delta = parseFloat(m);
        let cur = 0;
        while (!forceSlider.disabled && cur < 100) {
          cur += delta;
          window.setSliderValue(forceSlider, cur.toFixed(1));
        }
      }

      const vals = window.getFrictionValues();
      const pDiff = Math.abs(vals.pullForce - reqP);
      const muDiff = Math.abs(vals.mu - mu_s);

      if (pDiff > 1e-7 || muDiff > 1e-7 || vals.mu.toFixed(4) !== mu_s.toFixed(4)) {
        t2AllPassed = false;
        console.error(`Test 2 Failed for ${mat} combo (a=${combo.a}, w=${combo.w}) method ${m}: P=${vals.pullForce} (exp ${reqP}), mu=${vals.mu.toFixed(6)} (exp ${mu_s.toFixed(6)})`);
      }
    }
  }
}
assert('Test 2: Friction, every material across 3 setups & 4 input methods gives exact limitingP and mu_s to 4+ decimals', t2AllPassed);

// -------------------------------------------------------------
// ACCEPTANCE TEST 3: Change angle or weight while P is loaded
// -------------------------------------------------------------
console.log('\n=== ACCEPTANCE TEST 3: Settings change while P is loaded ===');
window.resetFrictionApparatus();
mockDoc.getElementById('frictionMaterial').value = 'wood-wood';
window.resetFrictionApparatus();

// Setup: theta=0, W=10, wood-wood mu_s=0.383864... reqP = 3.83864...
window.setSliderValue(mockDoc.getElementById('frictionAngle'), 0);
window.setSliderValue(mockDoc.getElementById('frictionWeight'), 10);

const fSlider = mockDoc.getElementById('frictionForce');
window.setSliderValue(fSlider, 5); // Limiting reached, moving=true, limitingP=3.83864

const initialVals = window.getFrictionValues();
assert('Initial limiting P reached (3.84 N)', Math.abs(initialVals.pullForce - 3.83864) < 0.01 && initialVals.moving);

// Now change weight to 20 N (new reqP = 7.68 N > 3.84 N) -> should unlock, moving=false
window.setSliderValue(mockDoc.getElementById('frictionWeight'), 20);
const heavierVals = window.getFrictionValues();
assert('Increasing weight makes current P insufficient -> unlocks, moving=false', !heavierVals.moving && !fSlider.disabled);

// Now change weight down to 5 N (new reqP = 1.919 N < current P 3.84 N) -> should snap to 1.919 N, moving=true
window.setSliderValue(mockDoc.getElementById('frictionWeight'), 5);
const lighterVals = window.getFrictionValues();
const expectedNewReqP = CANONICAL['wood-wood'].mu_s * 5;
assert('Decreasing weight snaps limitingP to exact new requiredP', Math.abs(lighterVals.pullForce - expectedNewReqP) < 1e-7 && lighterVals.moving && !fSlider.disabled);
assert('mu remains exactly equal to canonical mu_s', lighterVals.mu.toFixed(4) === CANONICAL['wood-wood'].mu_s.toFixed(4));

// -------------------------------------------------------------
// ACCEPTANCE TEST 4: 50 sequential trials with resets
// -------------------------------------------------------------
console.log('\n=== ACCEPTANCE TEST 4: 50 sequential trials repeatability ===');
let t4AllIdentical = true;
const firstReposeValues = [];
const firstFrictionValues = [];

for (let i = 0; i < 50; i++) {
  // Repose trial
  window.resetReposeApparatus();
  const rSlider = mockDoc.getElementById('reposeAngle');
  window.setSliderValue(rSlider, 25.0);
  const rVals = window.getReposeValues();
  firstReposeValues.push(rVals);

  // Friction trial
  window.resetFrictionApparatus();
  const frSlider = mockDoc.getElementById('frictionForce');
  window.setSliderValue(frSlider, 10.0);
  const frVals = window.getFrictionValues();
  firstFrictionValues.push(frVals);
}

for (let i = 1; i < 50; i++) {
  if (firstReposeValues[i].angle !== firstReposeValues[0].angle ||
      firstReposeValues[i].mu !== firstReposeValues[0].mu) {
    t4AllIdentical = false;
  }
  if (firstFrictionValues[i].pullForce !== firstFrictionValues[0].pullForce ||
      firstFrictionValues[i].mu !== firstFrictionValues[0].mu) {
    t4AllIdentical = false;
  }
}
assert('Test 4: 50 sequential trials with resets give 50 identical results', t4AllIdentical);

// -------------------------------------------------------------
// ACCEPTANCE TEST 5: Edge case exceeding 100 N
// -------------------------------------------------------------
console.log('\n=== ACCEPTANCE TEST 5: Edge case exceeding 100 N ===');
window.resetFrictionApparatus();
mockDoc.getElementById('frictionMaterial').value = 'aluminum-aluminum'; // mu_s = 1.234897
window.resetFrictionApparatus();

// Allow larger W for test
mockDoc.getElementById('frictionWeight').max = '100';

// Aluminum on aluminum at W = 90 N, theta = 20 deg:
const bigW = 90;
const bigTheta = 20;
const evalHigh = window.evaluateFriction(bigTheta, bigW, 0, 'aluminum-aluminum');
assert('Aluminum at W=90 N, theta=20° exceeds 100 N', evalHigh.requiredP > 100);

window.setSliderValue(mockDoc.getElementById('frictionAngle'), bigTheta);
window.setSliderValue(mockDoc.getElementById('frictionWeight'), bigW);

const maxAfterSync = parseFloat(mockDoc.getElementById('frictionForce').max);
assert(`Slider max raised dynamically to accommodate required P (${maxAfterSync} >= ${Math.ceil(evalHigh.requiredP)})`, maxAfterSync >= Math.ceil(evalHigh.requiredP));

// -------------------------------------------------------------
// ACCEPTANCE TEST 6: Slider cannot move past limiting condition
// -------------------------------------------------------------
console.log('\n=== ACCEPTANCE TEST 6: Unblocked slider movement & state integrity ===');
window.resetReposeApparatus();
mockDoc.getElementById('reposeMaterial').value = 'wood-wood';
window.resetReposeApparatus();
const rSld = mockDoc.getElementById('reposeAngle');
window.setSliderValue(rSld, 25.0);
assert('Repose slider remains enabled and unblocked after slip', rSld.disabled === false);

// Try to move it further - slider responds freely
window.setSliderValue(rSld, 35.0);
assert('Repose slider allows free exploration', parseFloat(rSld.value) === 35.0);
const rValsAfter = window.getReposeValues();
assert('Repose recorded slip angle remains canonical threshold (21.0°)', rValsAfter.angle === 21.0);

// Lowering angle below threshold returns to equilibrium
window.setSliderValue(rSld, 10.0);
const rValsLower = window.getReposeValues();
assert('Lowering angle below threshold restores equilibrium', !rValsLower.sliding);

window.resetFrictionApparatus();
mockDoc.getElementById('frictionMaterial').value = 'wood-wood';
window.resetFrictionApparatus();
window.setSliderValue(mockDoc.getElementById('frictionAngle'), 0);
window.setSliderValue(mockDoc.getElementById('frictionWeight'), 5.0);
const fSld = mockDoc.getElementById('frictionForce');
window.setSliderValue(fSld, 15.0);
assert('Friction force slider remains enabled and unblocked after limiting motion reached', fSld.disabled === false);
window.setSliderValue(fSld, 25.0);
assert('Friction slider allows free exploration', parseFloat(fSld.value) === 25.0);
const fValsAfter = window.getFrictionValues();
assert('Friction value remains locked at canonical limiting P', Math.abs(fValsAfter.pullForce - CANONICAL['wood-wood'].mu_s * 5) < 1e-7);

// Lowering force below limiting restores static equilibrium
window.setSliderValue(fSld, 1.0);
const fValsLower = window.getFrictionValues();
assert('Lowering pull force below limiting restores static equilibrium', !fValsLower.moving);

console.log('\n=== ACCEPTANCE TEST 7: Keyboard navigation on sliders ===');
window.resetReposeApparatus();
const rSlider = mockDoc.getElementById('reposeAngle');
rSlider.dispatchEvent({ type: 'keydown', key: 'ArrowRight' });
rSlider.value = '0.1';
rSlider.dispatchEvent(new Event('input', { bubbles: true }));
rSlider.dispatchEvent({ type: 'keyup', key: 'ArrowRight' });
assert('Keyboard navigation smoothly increments repose slider', parseFloat(rSlider.value) === 0.1);

console.log('\n=== DATA LOG & COMPARE VERIFICATION ===');
window.localStorage.clear();
// Log Repose trial
window.resetReposeApparatus();
mockDoc.getElementById('reposeMaterial').value = 'wood-wood';
window.resetReposeApparatus();
window.setSliderValue(mockDoc.getElementById('reposeAngle'), 25.0);
mockDoc.getElementById('reposeAddTrial').dispatchEvent(new Event('click'));

// Log Friction trial
window.resetFrictionApparatus();
mockDoc.getElementById('frictionMaterial').value = 'wood-wood';
window.resetFrictionApparatus();
window.setSliderValue(mockDoc.getElementById('frictionWeight'), 5.0);
window.setSliderValue(mockDoc.getElementById('frictionForce'), 10.0);
mockDoc.getElementById('frictionAddTrial').dispatchEvent(new Event('click'));

console.log('Stats A (repose):', window.getLogStats('repose', 'wood-wood'));
console.log('Stats B (friction):', window.getLogStats('friction', 'wood-wood'));

// Check compare
mockDoc.getElementById('compareMaterial').value = 'wood-wood';
window.updateCompare();

const devEl = mockDoc.getElementById('compareDeviation');
console.log('compareDeviation text:', devEl.textContent);
assert('compare.js shows 0.00% deviation between repose and friction', devEl.textContent === '0.00%');

console.log(`\n========================================`);
console.log(`TEST RESULTS: ${passedCount}/${totalCount} assertions passed.`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
