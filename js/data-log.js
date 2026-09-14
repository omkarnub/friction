/**
 * data-log.js — Data log table with per-row μ, validation, mean μ,
 * % error, localStorage persistence, SVG chart, custom Radix dropdowns,
 * animated wave-label input bars, and animated data representation
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'fl-data-log';

  /* ================================================================
     State
     ================================================================ */
  let logEntries = [];  // { method, material, angle, weight, pullForce?, mu, valid, validationMsg, timestamp }
  let lastAddedIdx = -1;

  /* ================================================================
     DOM Refs
     ================================================================ */
  const logMethodSelect   = document.getElementById('logMethod');
  const logMaterialSelect = document.getElementById('logMaterial');
  const formRepose        = document.getElementById('logFormRepose');
  const formFriction      = document.getElementById('logFormFriction');
  const tableBody         = document.getElementById('logTableBody');
  const tableHead         = document.getElementById('logTableHead');
  const emptyState        = document.getElementById('logEmpty');
  const summaryEl         = document.getElementById('logSummary');
  const chartEl           = document.getElementById('logChart');

  /* ================================================================
     Load & Save from localStorage
     ================================================================ */
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        logEntries = JSON.parse(raw);
      }
    } catch (e) {
      logEntries = [];
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logEntries));
    } catch (e) { /* quota exceeded — silently fail */ }
  }

  /* ================================================================
     Validation
     ================================================================ */
  function validateEntry(entry) {
    const issues = [];

    if (entry.angle < 0 || entry.angle > 90) {
      issues.push('Angle must be 0–90°');
    }
    if (entry.weight <= 0) {
      issues.push('Weight must be positive');
    }
    if (entry.method === 'friction') {
      if (entry.pullForce <= 0) {
        issues.push('Pull force must be greater than zero');
      } else if (entry.angle > 0 && entry.pullForce <= entry.weight * Math.sin(entry.angle * Math.PI / 180)) {
        issues.push('P ≤ W sin θ — block slides downhill');
      }
    }
    if (entry.angle === 90) {
      issues.push('90° makes cos θ = 0 — undefined');
    }

    return {
      valid: issues.length === 0,
      msg: issues.join('; ')
    };
  }

  /* ================================================================
     Calculate μ
     ================================================================ */
  function calcMu(entry) {
    const rad = entry.angle * Math.PI / 180;
    if (entry.method === 'repose') {
      return Math.tan(rad);
    } else {
      const Wcosth = entry.weight * Math.cos(rad);
      if (Wcosth < 0.0001) return null;
      return (entry.pullForce - entry.weight * Math.sin(rad)) / Wcosth;
    }
  }

  /* ================================================================
     Radix Custom Dropdowns for Data Log
     ================================================================ */
  function initMethodRadixDropdown() {
    const dropdown = document.getElementById('logMethodRadixDropdown');
    const select = document.getElementById('logMethod');
    const activeText = document.getElementById('logMethodActiveText');
    const activeIcon = document.getElementById('logMethodActiveIcon');
    const itemsList = document.getElementById('logMethodRadixItems');
    if (!dropdown || !select || !activeText || !itemsList) return;

    const trigger = dropdown.querySelector('.radix-trigger');

    const METHODS = {
      repose: { name: 'Angle of Repose', icon: '📐', desc: 'Inclined plane limiting angle method' },
      friction: { name: 'Friction Plane', icon: '⚖', desc: 'Horizontal & inclined pull-force method' }
    };

    function updateTrigger(val) {
      const m = METHODS[val] || METHODS.repose;
      activeText.textContent = m.name;
      if (activeIcon) activeIcon.textContent = m.icon;
    }

    // Populate dropdown options
    itemsList.innerHTML = '';
    Object.keys(METHODS).forEach(key => {
      const m = METHODS[key];
      const isSelected = key === select.value;
      const item = document.createElement('div');
      item.className = 'radix-checkbox-item' + (isSelected ? ' selected' : '');
      item.setAttribute('role', 'menuitemcheckbox');
      item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      item.dataset.value = key;

      item.innerHTML = `
        <span class="radix-checkbox-indicator">
          ${isSelected ? '<svg viewBox="0 0 15 15" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7.5l3.5 3.5 6.5-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
        </span>
        <div class="radix-item-content">
          <span style="font-size: 1.15rem; margin-right: 6px;">${m.icon}</span>
          <div>
            <div class="radix-item-title">${m.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 1px;">${m.desc}</div>
          </div>
        </div>
      `;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = key;
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

    select.addEventListener('change', () => {
      updateTrigger(select.value);
      itemsList.querySelectorAll('.radix-checkbox-item').forEach(it => {
        const isSel = it.dataset.value === select.value;
        it.classList.toggle('selected', isSel);
        it.setAttribute('aria-checked', isSel ? 'true' : 'false');
        const ind = it.querySelector('.radix-checkbox-indicator');
        if (ind) {
          ind.innerHTML = isSel ? '<svg viewBox="0 0 15 15" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7.5l3.5 3.5 6.5-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
        }
      });
    });

    updateTrigger(select.value);
  }

  function initDataLogRadixDropdowns() {
    initMethodRadixDropdown();

    if (window.initRadixDropdown) {
      window.initRadixDropdown('logMaterialRadixDropdown', 'logMaterial', 'logMaterialActiveText', 'logMaterialActiveSwatch', 'logMaterialRadixItems');
    }
  }

  /* ================================================================
     Toggle Form Visibility
     ================================================================ */
  logMethodSelect.addEventListener('change', () => {
    const method = logMethodSelect.value;
    formRepose.classList.toggle('hidden', method !== 'repose');
    formFriction.classList.toggle('hidden', method !== 'friction');
    renderTable();
    renderChart();
  });

  /* ================================================================
     Animated Inputs & Stepper Controls
     ================================================================ */
  function initAnimatedInputsAndSteppers() {
    const inputs = document.querySelectorAll('#page-log .form-control input');
    inputs.forEach(input => {
      const syncValueState = () => {
        input.classList.toggle('has-value', input.value !== '' && input.value !== null);
        const ctrl = input.closest('.form-control');
        if (ctrl) ctrl.classList.remove('input-error-shake');
      };

      input.addEventListener('input', syncValueState);
      input.addEventListener('change', syncValueState);
      input.addEventListener('blur', syncValueState);
      syncValueState();
    });

    // Stepper arrows (Up/Down) with auto-repeat on hold
    document.querySelectorAll('#page-log .stepper-arrow-btn').forEach(btn => {
      const targetId = btn.getAttribute('data-step-target');
      const delta = parseFloat(btn.getAttribute('data-delta') || '0.5');
      const input = document.getElementById(targetId);
      if (!input) return;

      function stepValue() {
        const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
        const max = input.max !== '' ? parseFloat(input.max) : Infinity;
        let current = parseFloat(input.value);
        if (isNaN(current)) {
          current = delta > 0 ? (min > 0 ? min : 0) : (max < 90 ? max : 5.0);
        } else {
          current += delta;
        }
        current = Math.min(max, Math.max(min, current));
        input.value = Number(current.toFixed(1));
        input.classList.add('has-value');

        const ctrl = input.closest('.form-control');
        if (ctrl) ctrl.classList.remove('input-error-shake');

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      let holdInterval = null;
      let holdTimeout = null;
      let steppedOnDown = false;

      function startHold(e) {
        if (e.button !== undefined && e.button !== 0) return;
        steppedOnDown = true;
        stepValue();
        holdTimeout = setTimeout(() => {
          holdInterval = setInterval(stepValue, 75);
        }, 280);
      }

      function stopHold() {
        clearTimeout(holdTimeout);
        clearInterval(holdInterval);
        holdTimeout = null;
        holdInterval = null;
      }

      btn.addEventListener('mousedown', startHold);
      btn.addEventListener('touchstart', startHold, { passive: true });
      btn.addEventListener('mouseup', stopHold);
      btn.addEventListener('mouseleave', stopHold);
      btn.addEventListener('touchend', stopHold);
      btn.addEventListener('touchcancel', stopHold);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!steppedOnDown) {
          stepValue();
        }
        steppedOnDown = false;
      });
    });
  }

  function triggerShake(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const ctrl = el.closest('.form-control');
    if (ctrl) {
      ctrl.classList.remove('input-error-shake');
      void ctrl.offsetWidth; // trigger reflow
      ctrl.classList.add('input-error-shake');
      setTimeout(() => ctrl.classList.remove('input-error-shake'), 450);
    }
    el.focus();
  }

  /* ================================================================
     Add Entry from Form
     ================================================================ */
  document.getElementById('logAddReposeBtn').addEventListener('click', () => {
    const angleEl = document.getElementById('logReposeAngle');
    const weightEl = document.getElementById('logReposeW');
    const angle = parseFloat(angleEl.value);
    const weight = parseFloat(weightEl.value);

    let hasError = false;
    if (isNaN(angle)) { triggerShake('logReposeAngle'); hasError = true; }
    if (isNaN(weight)) { triggerShake('logReposeW'); hasError = true; }
    if (hasError) {
      if (window.showSimToast) {
        window.showSimToast('Missing Value', 'Please enter numeric values for Angle and Weight.', 'OK', 'log');
      }
      return;
    }

    addEntry({
      method: 'repose',
      material: logMaterialSelect.value,
      angle,
      weight,
      pullForce: null
    });

    angleEl.value = '';
    weightEl.value = '';
    angleEl.classList.remove('has-value');
    weightEl.classList.remove('has-value');
  });

  document.getElementById('logAddFrictionBtn').addEventListener('click', () => {
    const angleEl = document.getElementById('logFrictionAngle');
    const weightEl = document.getElementById('logFrictionW');
    const pullEl = document.getElementById('logFrictionP');

    const angle = parseFloat(angleEl.value);
    const weight = parseFloat(weightEl.value);
    const pullForce = parseFloat(pullEl.value);

    let hasError = false;
    if (isNaN(angle)) { triggerShake('logFrictionAngle'); hasError = true; }
    if (isNaN(weight)) { triggerShake('logFrictionW'); hasError = true; }
    if (isNaN(pullForce)) { triggerShake('logFrictionP'); hasError = true; }
    if (hasError) {
      if (window.showSimToast) {
        window.showSimToast('Missing Value', 'Please enter numeric values for Angle, Weight, and Pull Force.', 'OK', 'log');
      }
      return;
    }

    addEntry({
      method: 'friction',
      material: logMaterialSelect.value,
      angle,
      weight,
      pullForce
    });

    angleEl.value = '';
    weightEl.value = '';
    pullEl.value = '';
    angleEl.classList.remove('has-value');
    weightEl.classList.remove('has-value');
    pullEl.classList.remove('has-value');
  });

  /* ================================================================
     Add Entry from Simulator ("Add to Data Log" button)
     ================================================================ */
  document.getElementById('reposeAddTrial').addEventListener('click', () => {
    if (!window.getReposeValues) return;
    const vals = window.getReposeValues();
    logMethodSelect.value = 'repose';
    logMaterialSelect.value = vals.material;
    logMethodSelect.dispatchEvent(new Event('change', { bubbles: true }));
    logMaterialSelect.dispatchEvent(new Event('change', { bubbles: true }));

    formRepose.classList.remove('hidden');
    formFriction.classList.add('hidden');

    addEntry({
      method: 'repose',
      material: vals.material,
      angle: vals.angle,
      weight: vals.weight,
      pullForce: null
    });

    // Notify user in simulator
    if (window.showSimToast) {
      window.showSimToast(
        'Reading Logged to Data Log',
        `Trial #${logEntries.length}: α = ${vals.angle.toFixed(1)}°, W = ${vals.weight.toFixed(1)} N, μ = ${vals.mu.toFixed(4)} — Apparatus reset for next trial`,
        'View Data Log',
        'log'
      );
    }

    // Reset apparatus for fresh reading
    if (window.resetReposeApparatus) {
      window.resetReposeApparatus();
    }
  });

  document.getElementById('frictionAddTrial').addEventListener('click', () => {
    if (!window.getFrictionValues) return;
    const vals = window.getFrictionValues();
    logMethodSelect.value = 'friction';
    logMaterialSelect.value = vals.material;
    logMethodSelect.dispatchEvent(new Event('change', { bubbles: true }));
    logMaterialSelect.dispatchEvent(new Event('change', { bubbles: true }));

    formFriction.classList.remove('hidden');
    formRepose.classList.add('hidden');

    addEntry({
      method: 'friction',
      material: vals.material,
      angle: vals.angle,
      weight: vals.weight,
      pullForce: vals.pullForce
    });

    // Notify user in simulator
    const muText = vals.mu !== null && isFinite(vals.mu) ? vals.mu.toFixed(4) : '—';
    if (window.showSimToast) {
      window.showSimToast(
        'Reading Logged to Data Log',
        `Trial #${logEntries.length}: θ = ${vals.angle.toFixed(1)}°, W = ${vals.weight.toFixed(1)} N, P = ${vals.pullForce.toFixed(1)} N, μ = ${muText} — Apparatus reset for next trial`,
        'View Data Log',
        'log'
      );
    }

    // Reset apparatus for fresh reading
    if (window.resetFrictionApparatus) {
      window.resetFrictionApparatus();
    }
  });

  /* ================================================================
     Core Add / Delete
     ================================================================ */
  function addEntry(raw, shouldRender = true) {
    const validation = validateEntry(raw);
    const mu = calcMu(raw);

    const entry = {
      ...raw,
      mu: (mu !== null && isFinite(mu) && mu >= 0) ? mu : null,
      valid: validation.valid && mu !== null && isFinite(mu) && mu >= 0,
      validationMsg: validation.msg,
      timestamp: Date.now()
    };

    logEntries.push(entry);
    lastAddedIdx = logEntries.length - 1;
    saveToStorage();

    if (shouldRender) {
      renderTable(lastAddedIdx);
      renderChart();
    }

    // Notify compare module
    if (window.updateCompare) window.updateCompare();
  }

  function deleteEntry(index) {
    logEntries.splice(index, 1);
    lastAddedIdx = -1;
    saveToStorage();
    renderTable();
    renderChart();
    if (window.updateCompare) window.updateCompare();
  }

  // Clear all
  document.getElementById('clearLogBtn').addEventListener('click', () => {
    if (!confirm('Clear all log entries? This cannot be undone.')) return;
    logEntries = [];
    lastAddedIdx = -1;
    saveToStorage();
    renderTable();
    renderChart();
    if (window.updateCompare) window.updateCompare();
  });

  /* ================================================================
     Animated Stat Counter Helper
     ================================================================ */
  function animateStatNumber(el, targetNum, decimals = 4, suffix = '') {
    if (!el) return;
    if (targetNum === null || isNaN(targetNum)) {
      el.textContent = '—';
      return;
    }
    const currentNum = parseFloat(el.textContent.replace(/[^\d.-]/g, '')) || 0;
    const duration = 400;
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = currentNum + (targetNum - currentNum) * ease;
      el.textContent = val.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = targetNum.toFixed(decimals) + suffix;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ================================================================
     Render Table with Animations
     ================================================================ */
  function renderTable(newEntryIdx = -1) {
    const method = logMethodSelect.value;
    const material = logMaterialSelect.value;

    // Filter entries by current method and material
    const filtered = logEntries.filter(e => e.method === method && e.material === material);

    // Table header
    if (method === 'repose') {
      tableHead.innerHTML = `
        <tr>
          <th>#</th>
          <th>Angle α (°)</th>
          <th>Weight W (N)</th>
          <th>μ = tan α</th>
          <th>Status</th>
          <th></th>
        </tr>`;
    } else {
      tableHead.innerHTML = `
        <tr>
          <th>#</th>
          <th>Angle θ (°)</th>
          <th>Weight W (N)</th>
          <th>Pull P (N)</th>
          <th>μ</th>
          <th>Status</th>
          <th></th>
        </tr>`;
    }

    // Table body
    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      summaryEl.style.display = 'none';
      chartEl.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    summaryEl.style.display = 'grid';
    chartEl.style.display = 'block';

    // Find actual index in logEntries for each filtered entry
    tableBody.innerHTML = filtered.map((entry, i) => {
      const actualIdx = logEntries.indexOf(entry);
      const muStr = entry.mu !== null ? entry.mu.toFixed(4) : '—';
      const statusBadge = entry.valid
        ? '<span class="status-badge success">Valid</span>'
        : `<span class="status-badge error" title="${entry.validationMsg}">Invalid</span>`;

      const isNew = actualIdx === newEntryIdx;
      const rowClass = isNew ? 'table-row-new' : '';

      if (method === 'repose') {
        return `<tr class="${rowClass}" data-idx="${actualIdx}">
          <td class="mono">${i + 1}</td>
          <td class="mono">${entry.angle.toFixed(1)}</td>
          <td class="mono">${entry.weight.toFixed(1)}</td>
          <td class="mono ${entry.valid ? 'valid' : 'invalid'}">${muStr}</td>
          <td>${statusBadge}</td>
          <td><button class="btn btn-danger btn-sm" onclick="window._deleteLogEntry(${actualIdx}, this.closest('tr'))">✕</button></td>
        </tr>`;
      } else {
        return `<tr class="${rowClass}" data-idx="${actualIdx}">
          <td class="mono">${i + 1}</td>
          <td class="mono">${entry.angle.toFixed(1)}</td>
          <td class="mono">${entry.weight.toFixed(1)}</td>
          <td class="mono">${(entry.pullForce !== null ? entry.pullForce.toFixed(1) : '—')}</td>
          <td class="mono ${entry.valid ? 'valid' : 'invalid'}">${muStr}</td>
          <td>${statusBadge}</td>
          <td><button class="btn btn-danger btn-sm" onclick="window._deleteLogEntry(${actualIdx}, this.closest('tr'))">✕</button></td>
        </tr>`;
      }
    }).join('');

    // Summary stats calculation
    const validEntries = filtered.filter(e => e.valid);
    const muValues = validEntries.map(e => e.mu);
    const meanMu = muValues.length > 0 ? muValues.reduce((a, b) => a + b, 0) / muValues.length : null;

    const mat = window.MATERIALS ? window.MATERIALS[material] : null;
    const refLow = mat ? mat.low : 0;
    const refHigh = mat ? mat.high : 1;
    const refMid = (refLow + refHigh) / 2;
    const percentError = meanMu !== null ? Math.abs(meanMu - refMid) / refMid * 100 : null;
    const inRange = meanMu !== null && meanMu >= refLow && meanMu <= refHigh;

    // Animated counter stats
    const trialCountEl = document.getElementById('logTrialCount');
    animateStatNumber(trialCountEl, filtered.length, 0);

    const meanMuEl = document.getElementById('logMeanMu');
    animateStatNumber(meanMuEl, meanMu, 4);

    document.getElementById('logRefRange').textContent = `${refLow} – ${refHigh}`;

    const pctEl = document.getElementById('logPercentError');
    if (percentError !== null) {
      animateStatNumber(pctEl, percentError, 2, '%');
      pctEl.style.color = percentError < 10 ? 'var(--accent-green)' : percentError < 25 ? 'var(--accent-amber)' : 'var(--accent-red)';
    } else {
      pctEl.textContent = '—';
    }

    const rangeCheckEl = document.getElementById('logRangeCheck');
    if (meanMu !== null) {
      rangeCheckEl.innerHTML = inRange
        ? '<span class="status-badge success stat-pop" style="font-size: 0.9rem;">✓ Within Range</span>'
        : '<span class="status-badge error stat-pop" style="font-size: 0.9rem;">✗ Outside Range</span>';
    } else {
      rangeCheckEl.textContent = '—';
    }
  }

  // Smooth row deletion animation before removing state
  window._deleteLogEntry = function (actualIdx, trElement) {
    if (trElement) {
      trElement.classList.add('table-row-leaving');
      setTimeout(() => {
        deleteEntry(actualIdx);
      }, 320);
    } else {
      deleteEntry(actualIdx);
    }
  };

  // Expose log data for compare and PDF
  window.getLogEntries = function () { return logEntries; };
  window.getLogStats = function (method, material) {
    const filtered = logEntries.filter(e => e.method === method && e.material === material && e.valid);
    const muValues = filtered.map(e => e.mu);
    const meanMu = muValues.length > 0 ? muValues.reduce((a, b) => a + b, 0) / muValues.length : null;
    return { entries: filtered, meanMu, count: filtered.length };
  };

  /* ================================================================
     SVG Chart — μ per trial (Animated)
     ================================================================ */
  function renderChart() {
    const method = logMethodSelect.value;
    const material = logMaterialSelect.value;
    const filtered = logEntries.filter(e => e.method === method && e.material === material);

    if (filtered.length === 0) {
      chartEl.style.display = 'none';
      return;
    }
    chartEl.style.display = 'block';

    const svg = document.getElementById('logChartSvg');
    const W = 700, H = 250;
    const pad = { top: 30, right: 30, bottom: 40, left: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const validEntries = filtered.filter(e => e.valid);
    if (validEntries.length === 0) {
      svg.innerHTML = `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="var(--text-dim)" font-size="13" font-family="Inter">No valid data to chart</text>`;
      return;
    }

    const muValues = validEntries.map(e => e.mu);
    const minMu = Math.max(0, Math.min(...muValues) - 0.1);
    const maxMu = Math.max(...muValues) + 0.1;
    const range = maxMu - minMu || 0.5;

    const mat = window.MATERIALS ? window.MATERIALS[material] : { low: 0.3, high: 0.6 };

    function xPos(i) { return pad.left + (i / (validEntries.length - 1 || 1)) * plotW; }
    function yPos(mu) { return pad.top + plotH - ((mu - minMu) / range) * plotH; }

    let html = '';

    // Grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const muVal = minMu + (range * i) / yTicks;
      const y = yPos(muVal);
      html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="var(--diagram-grid)" stroke-width="1"/>`;
      html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-dim)" font-size="10" font-family="JetBrains Mono">${muVal.toFixed(2)}</text>`;
    }

    // Reference range band
    const refLowY = yPos(Math.max(mat.low, minMu));
    const refHighY = yPos(Math.min(mat.high, maxMu));
    if (mat.high >= minMu && mat.low <= maxMu) {
      html += `<rect x="${pad.left}" y="${refHighY}" width="${plotW}" height="${Math.max(0, refLowY - refHighY)}" fill="rgba(56, 189, 248, 0.08)" rx="3"/>`;
      html += `<text x="${W - pad.right - 5}" y="${refHighY + 12}" text-anchor="end" fill="var(--accent-cyan)" font-size="9.5" font-family="JetBrains Mono" opacity="0.75">Ref: ${mat.low}–${mat.high}</text>`;
    }

    // Mean line
    const meanMu = muValues.reduce((a, b) => a + b, 0) / muValues.length;
    const meanY = yPos(meanMu);
    html += `<line x1="${pad.left}" y1="${meanY}" x2="${W - pad.right}" y2="${meanY}" stroke="var(--accent-amber)" stroke-width="1.8" stroke-dasharray="6,4" opacity="0.8"/>`;
    html += `<text x="${pad.left + 6}" y="${meanY - 6}" fill="var(--accent-amber)" font-size="10" font-family="JetBrains Mono" font-weight="600">Mean: ${meanMu.toFixed(4)}</text>`;

    // Line path with draw animation
    if (validEntries.length > 1) {
      const pathD = validEntries.map((e, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(e.mu).toFixed(1)}`).join(' ');
      html += `<path d="${pathD}" fill="none" stroke="var(--accent-cyan)" stroke-width="2.5" opacity="0.85" class="chart-animated-path"/>`;
    }

    // Data points with pop-in animation
    validEntries.forEach((e, i) => {
      const cx = xPos(i);
      const cy = yPos(e.mu);
      const inRange = e.mu >= mat.low && e.mu <= mat.high;
      const color = inRange ? 'var(--accent-green)' : 'var(--accent-red)';
      html += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${color}" stroke="var(--bg-primary)" stroke-width="2" class="chart-animated-point" style="animation-delay: ${i * 65}ms;"/>`;
      // X label
      html += `<text x="${cx}" y="${H - pad.bottom + 18}" text-anchor="middle" fill="var(--text-dim)" font-size="10" font-family="JetBrains Mono">${i + 1}</text>`;
    });

    // Axes
    html += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${H - pad.bottom}" stroke="var(--diagram-axis)" stroke-width="1"/>`;
    html += `<line x1="${pad.left}" y1="${H - pad.bottom}" x2="${W - pad.right}" y2="${H - pad.bottom}" stroke="var(--diagram-axis)" stroke-width="1"/>`;

    // Axis labels
    html += `<text x="${W / 2}" y="${H - 5}" text-anchor="middle" fill="var(--text-dim)" font-size="11" font-family="Inter">Trial #</text>`;
    html += `<text x="15" y="${H / 2}" text-anchor="middle" fill="var(--text-dim)" font-size="11" font-family="Inter" transform="rotate(-90, 15, ${H / 2})">μ</text>`;

    svg.innerHTML = html;
  }

  /* ================================================================
     CSV Export & Clipboard Copy
     ================================================================ */
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const method = logMethodSelect.value;
      const material = logMaterialSelect.value;
      const filtered = logEntries.filter(e => e.method === method && e.material === material);
      const list = filtered.length > 0 ? filtered : logEntries;

      if (list.length === 0) {
        alert('No data log entries to export.');
        return;
      }

      let csv = 'Trial,Method,Material,Angle (deg),Weight (N),Pull Force (N),mu,Valid\n';
      list.forEach((e, idx) => {
        csv += `${idx + 1},"${e.method}","${e.material}",${e.angle},${e.weight},${e.pullForce ?? ''},${e.mu !== null ? e.mu.toFixed(4) : ''},${e.valid}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `friction-log-${method}-${material}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const copyLogBtn = document.getElementById('copyLogBtn');
  if (copyLogBtn) {
    copyLogBtn.addEventListener('click', () => {
      const method = logMethodSelect.value;
      const material = logMaterialSelect.value;
      const filtered = logEntries.filter(e => e.method === method && e.material === material);
      if (filtered.length === 0) {
        alert('No entries to copy for current selection.');
        return;
      }

      let text = `Coefficient of Friction Log — ${method.toUpperCase()} (${material})\n`;
      text += method === 'repose'
        ? '#\tAngle (°)\tWeight (N)\tμ\tStatus\n'
        : '#\tAngle (°)\tWeight (N)\tPull (N)\tμ\tStatus\n';

      filtered.forEach((e, i) => {
        text += method === 'repose'
          ? `${i + 1}\t${e.angle.toFixed(1)}\t${e.weight.toFixed(1)}\t${e.mu !== null ? e.mu.toFixed(4) : '—'}\t${e.valid ? 'Valid' : 'Invalid'}\n`
          : `${i + 1}\t${e.angle.toFixed(1)}\t${e.weight.toFixed(1)}\t${e.pullForce !== null ? e.pullForce.toFixed(1) : '—'}\t${e.mu !== null ? e.mu.toFixed(4) : '—'}\t${e.valid ? 'Valid' : 'Invalid'}\n`;
      });

      navigator.clipboard.writeText(text).then(() => {
        const orig = copyLogBtn.innerHTML;
        copyLogBtn.innerHTML = '✓ Copied!';
        copyLogBtn.style.borderColor = 'var(--accent-green)';
        setTimeout(() => {
          copyLogBtn.innerHTML = orig;
          copyLogBtn.style.borderColor = '';
        }, 1800);
      });
    });
  }

  /* ================================================================
     Sample Demo Trials Loader
     ================================================================ */
  const demoBtn = document.getElementById('logLoadDemoBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      const method = logMethodSelect.value;
      const matKey = logMaterialSelect.value;
      const mat = window.MATERIALS ? window.MATERIALS[matKey] : { low: 0.35, high: 0.50 };
      const mid = (mat.low + mat.high) / 2;

      if (method === 'repose') {
        const baseAngle = Math.atan(mid) * 180 / Math.PI;
        const sampleTrials = [
          { angle: +(baseAngle - 1.2).toFixed(1), weight: 5.0 },
          { angle: +(baseAngle + 0.4).toFixed(1), weight: 10.0 },
          { angle: +(baseAngle - 0.2).toFixed(1), weight: 15.0 },
          { angle: +(baseAngle + 0.9).toFixed(1), weight: 20.0 }
        ];
        sampleTrials.forEach(t => {
          addEntry({ method: 'repose', material: matKey, angle: t.angle, weight: t.weight, pullForce: null }, false);
        });
      } else {
        const angle = 15.0;
        const rad = angle * Math.PI / 180;
        const sampleWeights = [5.0, 10.0, 15.0, 20.0];
        sampleWeights.forEach(W => {
          const P = +(W * (Math.sin(rad) + mid * Math.cos(rad))).toFixed(1);
          addEntry({ method: 'friction', material: matKey, angle, weight: W, pullForce: P }, false);
        });
      }
      renderTable(logEntries.length - 1);
      renderChart();
    });
  }

  /* ================================================================
     Re-render on Material Change
     ================================================================ */
  logMaterialSelect.addEventListener('change', () => {
    renderTable();
    renderChart();
  });

  /* ================================================================
     Init
     ================================================================ */
  loadFromStorage();
  initDataLogRadixDropdowns();
  initAnimatedInputsAndSteppers();
  renderTable();
  renderChart();

  // Re-render when navigating to log page
  window.addEventListener('pagechange', (e) => {
    if (e.detail.page === 'log') {
      renderTable();
      renderChart();
    }
  });
})();
