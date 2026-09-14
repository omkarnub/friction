/**
 * compare.js — Cross-method comparison
 * Shows side-by-side mean μ from both methods for the same material pair,
 * computes % deviation, and renders a comparison chart.
 */
(function () {
  'use strict';

  const materialSelect = document.getElementById('compareMaterial');

  function updateCompare() {
    if (!window.getLogStats || !window.MATERIALS) return;

    const material = materialSelect.value;
    const mat = window.MATERIALS[material];

    const statsA = window.getLogStats('repose', material);
    const statsB = window.getLogStats('friction', material);

    // Method A
    const muAEl = document.getElementById('compareMuA');
    const trialsAEl = document.getElementById('compareTrialsA');
    if (statsA.meanMu !== null) {
      muAEl.textContent = statsA.meanMu.toFixed(4);
      muAEl.style.color = '';
    } else {
      muAEl.textContent = '—';
    }
    trialsAEl.textContent = `${statsA.count} trial${statsA.count !== 1 ? 's' : ''}`;

    // Method B
    const muBEl = document.getElementById('compareMuB');
    const trialsBEl = document.getElementById('compareTrialsB');
    if (statsB.meanMu !== null) {
      muBEl.textContent = statsB.meanMu.toFixed(4);
      muBEl.style.color = '';
    } else {
      muBEl.textContent = '—';
    }
    trialsBEl.textContent = `${statsB.count} trial${statsB.count !== 1 ? 's' : ''}`;

    // Deviation
    const resultEl = document.getElementById('compareResult');
    const deviationEl = document.getElementById('compareDeviation');
    const verdictEl = document.getElementById('compareVerdict');

    if (statsA.meanMu !== null && statsB.meanMu !== null) {
      const avg = (statsA.meanMu + statsB.meanMu) / 2;
      const deviation = avg > 0 ? (Math.abs(statsA.meanMu - statsB.meanMu) / avg * 100) : 0;

      resultEl.style.display = 'block';
      deviationEl.textContent = deviation.toFixed(2) + '%';

      if (deviation < 5) {
        deviationEl.style.color = 'var(--accent-green)';
        verdictEl.innerHTML = '<span class="status-badge success" style="font-size: 0.85rem;">Excellent agreement — both methods yield consistent μ</span>';
      } else if (deviation < 15) {
        deviationEl.style.color = 'var(--accent-amber)';
        verdictEl.innerHTML = '<span class="status-badge warning" style="font-size: 0.85rem;">Moderate deviation — results are reasonable but could be improved</span>';
      } else {
        deviationEl.style.color = 'var(--accent-red)';
        verdictEl.innerHTML = '<span class="status-badge error" style="font-size: 0.85rem;">High deviation — check for systematic errors in one or both methods</span>';
      }

      // Reference comparison
      const refMid = (mat.low + mat.high) / 2;
      const errA = Math.abs(statsA.meanMu - refMid) / refMid * 100;
      const errB = Math.abs(statsB.meanMu - refMid) / refMid * 100;
      verdictEl.innerHTML += `<div style="margin-top: 0.75rem; color: var(--text-dim); font-size: 0.8rem;">
        Reference midpoint: ${refMid.toFixed(3)} | Repose % error: ${errA.toFixed(1)}% | Friction Plane % error: ${errB.toFixed(1)}%
      </div>`;

      renderCompareChart(statsA, statsB, mat);
    } else {
      resultEl.style.display = 'none';
      document.getElementById('compareChart').style.display = 'none';
    }
  }

  function renderCompareChart(statsA, statsB, mat) {
    const chartContainer = document.getElementById('compareChart');
    const svg = document.getElementById('compareChartSvg');

    if (!statsA.meanMu && !statsB.meanMu) {
      chartContainer.style.display = 'none';
      return;
    }
    chartContainer.style.display = 'block';

    const W = 700, H = 250;
    const pad = { top: 40, right: 30, bottom: 50, left: 60 };
    const plotH = H - pad.top - pad.bottom;

    // Determine value range
    const allVals = [statsA.meanMu, statsB.meanMu, mat.low, mat.high].filter(v => v !== null);
    const minV = Math.max(0, Math.min(...allVals) - 0.1);
    const maxV = Math.max(...allVals) + 0.1;
    const range = maxV - minV || 0.5;

    function yPos(v) { return pad.top + plotH - ((v - minV) / range) * plotH; }

    let html = '';

    // Y-axis grid
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = minV + (range * i) / yTicks;
      const y = yPos(val);
      html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="var(--diagram-grid)" stroke-width="1"/>`;
      html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-dim)" font-size="10" font-family="JetBrains Mono">${val.toFixed(2)}</text>`;
    }

    // Reference range band
    const refLowY = yPos(Math.max(mat.low, minV));
    const refHighY = yPos(Math.min(mat.high, maxV));
    html += `<rect x="${pad.left}" y="${refHighY}" width="${W - pad.left - pad.right}" height="${Math.max(0, refLowY - refHighY)}" fill="rgba(90, 140, 160,0.08)" rx="3"/>`;
    html += `<text x="${W - pad.right - 5}" y="${refHighY + 14}" text-anchor="end" fill="var(--accent-blue)" font-size="10" font-family="JetBrains Mono" opacity="0.7">Ref Range</text>`;

    // Bar width and positions
    const barWidth = 80;
    const barGap = 100;
    const centerX = (W - pad.left - pad.right) / 2 + pad.left;
    const bar1X = centerX - barGap / 2 - barWidth / 2;
    const bar2X = centerX + barGap / 2 - barWidth / 2;

    // Bar A — Angle of Repose
    if (statsA.meanMu !== null) {
      const barY = yPos(statsA.meanMu);
      const barH = yPos(minV) - barY;
      html += `<rect x="${bar1X}" y="${barY}" width="${barWidth}" height="${Math.max(0, barH)}" rx="4" fill="var(--accent-blue)" opacity="0.7"/>`;
      html += `<text x="${bar1X + barWidth / 2}" y="${barY - 8}" text-anchor="middle" fill="var(--accent-cyan)" font-size="13" font-family="JetBrains Mono" font-weight="700">${statsA.meanMu.toFixed(4)}</text>`;
    }

    // Bar B — Friction Plane
    if (statsB.meanMu !== null) {
      const barY = yPos(statsB.meanMu);
      const barH = yPos(minV) - barY;
      html += `<rect x="${bar2X}" y="${barY}" width="${barWidth}" height="${Math.max(0, barH)}" rx="4" fill="var(--accent-amber)" opacity="0.7"/>`;
      html += `<text x="${bar2X + barWidth / 2}" y="${barY - 8}" text-anchor="middle" fill="var(--accent-amber)" font-size="13" font-family="JetBrains Mono" font-weight="700">${statsB.meanMu.toFixed(4)}</text>`;
    }

    // Labels
    html += `<text x="${bar1X + barWidth / 2}" y="${H - pad.bottom + 20}" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="Inter" font-weight="600">Angle of Repose</text>`;
    html += `<text x="${bar2X + barWidth / 2}" y="${H - pad.bottom + 20}" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="Inter" font-weight="600">Friction Plane</text>`;

    // Trial counts
    html += `<text x="${bar1X + barWidth / 2}" y="${H - pad.bottom + 35}" text-anchor="middle" fill="var(--text-dim)" font-size="9" font-family="Inter">(${statsA.count} trials)</text>`;
    html += `<text x="${bar2X + barWidth / 2}" y="${H - pad.bottom + 35}" text-anchor="middle" fill="var(--text-dim)" font-size="9" font-family="Inter">(${statsB.count} trials)</text>`;

    // Axes
    html += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${H - pad.bottom}" stroke="var(--diagram-axis)" stroke-width="1"/>`;
    html += `<line x1="${pad.left}" y1="${H - pad.bottom}" x2="${W - pad.right}" y2="${H - pad.bottom}" stroke="var(--diagram-axis)" stroke-width="1"/>`;

    // Y-axis label
    html += `<text x="15" y="${H / 2}" text-anchor="middle" fill="var(--text-dim)" font-size="11" font-family="Inter" transform="rotate(-90, 15, ${H / 2})">Mean μ</text>`;

    svg.innerHTML = html;
  }

  // Expose for data-log.js to call
  window.updateCompare = updateCompare;

  materialSelect.addEventListener('change', updateCompare);

  // Update when navigating to compare page
  window.addEventListener('pagechange', (e) => {
    if (e.detail.page === 'compare') {
      updateCompare();
    }
  });

  // Initial render
  updateCompare();
})();
