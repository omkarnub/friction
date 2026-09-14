/**
 * pdf-export.js — One-click PDF export via jsPDF
 * Generates a beautifully formatted, high-contrast PDF lab report with:
 * - Header & experiment metadata
 * - Summary cards (Trials, Mean μ, Ref Range, % Error, Range Check)
 * - Formula specification
 * - Full trial readings table (crisp, readable text on zebra-striped rows)
 * - Cross-method comparison card (when available)
 * - Certification block and proper multi-page footers
 */
(function () {
  'use strict';

  const exportBtn = document.getElementById('exportPdfBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', generatePDF);
  }

  function generatePDF() {
    // Check jsPDF availability
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
      alert('PDF export library is still loading. Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    // Harmonious, print-ready color palette
    const brandNavy = [15, 23, 42];        // Deep slate header
    const brandBlue = [37, 99, 235];       // Accent blue
    const brandCyan = [14, 116, 144];      // Secondary accent
    const brandAmber = [217, 119, 6];      // Warning/amber
    const brandGreen = [22, 101, 52];      // Success green
    const brandRed = [185, 28, 28];        // Error red
    const textDark = [15, 23, 42];         // High-contrast primary text
    const textMuted = [100, 116, 139];     // Secondary labels
    const bgCard = [248, 250, 252];        // Light card fill
    const borderCard = [226, 232, 240];    // Card border
    const rowEven = [241, 245, 249];       // Alternating table row
    const rowOdd = [255, 255, 255];        // White table row

    // Current log parameters
    const logMethodEl = document.getElementById('logMethod');
    const logMaterialEl = document.getElementById('logMaterial');
    const logMethod = logMethodEl ? logMethodEl.value : 'repose';
    const logMaterial = logMaterialEl ? logMaterialEl.value : 'wood-wood';
    const mat = (window.MATERIALS && window.MATERIALS[logMaterial]) || {
      name: logMaterial.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      low: 0.25,
      high: 0.50
    };

    const entries = (window.getLogEntries ? window.getLogEntries() : [])
      .filter(e => e.method === logMethod && e.material === logMaterial);
    const validEntries = entries.filter(e => e.valid);
    const muValues = validEntries.map(e => e.mu);
    const meanMu = muValues.length > 0 ? muValues.reduce((a, b) => a + b, 0) / muValues.length : null;
    const refMid = (mat.low + mat.high) / 2;
    const percentError = meanMu !== null ? Math.abs(meanMu - refMid) / refMid * 100 : null;
    const inRange = meanMu !== null && meanMu >= mat.low && meanMu <= mat.high;

    // ── Header Banner ──
    doc.setFillColor(...brandNavy);
    doc.rect(0, 0, pageW, 46, 'F');

    // Accent line beneath banner
    doc.setFillColor(...brandBlue);
    doc.rect(0, 46, pageW, 1.8, 'F');

    // Logo mark
    doc.setFillColor(...brandBlue);
    doc.roundedRect(margin, 12, 10, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('μ', margin + 3.2, 19);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Engineering Mechanics — Friction Laboratory', margin + 14, 18.5);

    // Subtitle & metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const methodLabel = logMethod === 'repose' ? 'Angle of Repose Method' : 'Friction Plane Method';
    doc.text(`Method: ${methodLabel}   |   Surface Pair: ${mat.name}`, margin + 14, 26);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Report Generated: ${new Date().toLocaleString()}   |   Virtual Lab Simulator`, margin + 14, 33);

    y = 56;

    // ── Summary Metrics Card ──
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderCard);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, 'FD');

    const cols = 5;
    const colW = contentW / cols;
    const labels = ['TOTAL TRIALS', 'MEAN μ', 'REF RANGE', '% ERROR', 'RANGE CHECK'];
    const values = [
      `${entries.length} (${validEntries.length} valid)`,
      meanMu !== null ? meanMu.toFixed(4) : '—',
      `${mat.low.toFixed(2)} – ${mat.high.toFixed(2)}`,
      percentError !== null ? percentError.toFixed(2) + '%' : '—',
      meanMu !== null ? (inRange ? 'PASS (In Range)' : 'OUT OF RANGE') : '—'
    ];
    const valColors = [
      brandCyan,
      brandAmber,
      brandBlue,
      percentError !== null ? (percentError < 10 ? brandGreen : percentError < 25 ? brandAmber : brandRed) : textMuted,
      meanMu !== null ? (inRange ? brandGreen : brandRed) : textMuted
    ];

    for (let i = 0; i < cols; i++) {
      const cellCenterX = margin + colW * i + colW / 2;
      doc.setTextColor(...textMuted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(labels[i], cellCenterX, y + 9, { align: 'center' });

      doc.setTextColor(...valColors[i]);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(values[i], cellCenterX, y + 19, { align: 'center' });

      // Subtle divider between metric columns
      if (i < cols - 1) {
        doc.setDrawColor(...borderCard);
        doc.line(margin + colW * (i + 1), y + 5, margin + colW * (i + 1), y + 23);
      }
    }

    y += 34;

    // ── Formula Reference ──
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, y, contentW, 11, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(...brandBlue);
    doc.setFont('helvetica', 'bold');
    const formulaStr = logMethod === 'repose'
      ? 'Governing Formula:  μ_s = tan(α)   [At limiting static equilibrium on inclined plane]'
      : 'Governing Formula:  μ_s = (P − W · sin θ) / (W · cos θ)   [At impending motion up the incline]';
    doc.text(formulaStr, margin + 4, y + 7);

    y += 18;

    // ── Data Table ──
    doc.setTextColor(...textDark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recorded Trial Observations', margin, y);
    y += 6;

    if (entries.length > 0) {
      // Table configuration
      let headers, colWidths;
      if (logMethod === 'repose') {
        headers = ['#', 'Angle α (°)', 'Weight W (N)', 'μ = tan α', 'Status'];
        colWidths = [12, 38, 38, 42, 44];
      } else {
        headers = ['#', 'Angle θ (°)', 'Weight W (N)', 'Pull P (N)', 'μ', 'Status'];
        colWidths = [12, 32, 32, 32, 34, 32];
      }

      // Header row
      doc.setFillColor(...brandNavy);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');

      let cellX = margin + 3;
      headers.forEach((h, i) => {
        doc.text(h, cellX, y + 4.8);
        cellX += colWidths[i];
      });
      y += 7;

      // Rows
      entries.forEach((entry, idx) => {
        if (y > pageH - 28) {
          doc.addPage();
          y = margin;
          // Re-draw header on new page
          doc.setFillColor(...brandNavy);
          doc.rect(margin, y, contentW, 7, 'F');
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          let cx = margin + 3;
          headers.forEach((h, i) => {
            doc.text(h, cx, y + 4.8);
            cx += colWidths[i];
          });
          y += 7;
        }

        // Alternating row background
        doc.setFillColor(...(idx % 2 === 0 ? rowEven : rowOdd));
        doc.rect(margin, y, contentW, 6.5, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        cellX = margin + 3;
        const muStr = entry.mu !== null ? entry.mu.toFixed(4) : '—';
        const statusStr = entry.valid ? '✓ Valid' : '✗ Invalid';
        const muColor = entry.valid ? brandGreen : brandRed;

        if (logMethod === 'repose') {
          const rowData = [`${idx + 1}`, entry.angle.toFixed(1) + '°', entry.weight.toFixed(1) + ' N', muStr, statusStr];
          rowData.forEach((val, i) => {
            if (i === 3 || i === 4) {
              doc.setTextColor(...muColor);
              doc.setFont('helvetica', 'bold');
            } else {
              doc.setTextColor(...textDark);
              doc.setFont('helvetica', 'normal');
            }
            doc.text(val, cellX, y + 4.6);
            cellX += colWidths[i];
          });
        } else {
          const pStr = entry.pullForce !== null ? entry.pullForce.toFixed(1) + ' N' : '—';
          const rowData = [`${idx + 1}`, entry.angle.toFixed(1) + '°', entry.weight.toFixed(1) + ' N', pStr, muStr, statusStr];
          rowData.forEach((val, i) => {
            if (i === 4 || i === 5) {
              doc.setTextColor(...muColor);
              doc.setFont('helvetica', 'bold');
            } else {
              doc.setTextColor(...textDark);
              doc.setFont('helvetica', 'normal');
            }
            doc.text(val, cellX, y + 4.6);
            cellX += colWidths[i];
          });
        }

        y += 6.5;
      });

      y += 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...textMuted);
      doc.setFont('helvetica', 'italic');
      doc.text('No observations logged for this method and material selection.', margin, y);
      y += 12;
    }

    // ── Cross-Method Comparison (if both methods have readings) ──
    if (window.getLogStats) {
      const otherMethod = logMethod === 'repose' ? 'friction' : 'repose';
      const otherStats = window.getLogStats(otherMethod, logMaterial);

      if (otherStats.meanMu !== null && meanMu !== null) {
        if (y > pageH - 45) {
          doc.addPage();
          y = margin;
        }

        doc.setTextColor(...textDark);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Cross-Method Validation & Consistency Check', margin, y);
        y += 6;

        const avg = (meanMu + otherStats.meanMu) / 2;
        const deviation = avg > 0 ? Math.abs(meanMu - otherStats.meanMu) / avg * 100 : 0;
        const otherLabel = otherMethod === 'repose' ? 'Angle of Repose' : 'Friction Plane';

        doc.setFillColor(...bgCard);
        doc.setDrawColor(...borderCard);
        doc.roundedRect(margin, y, contentW, 20, 3, 3, 'FD');

        // Current method
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text(methodLabel, margin + 8, y + 6.5);
        doc.setTextColor(...brandBlue);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Mean μ = ${meanMu.toFixed(4)}`, margin + 8, y + 14);

        // VS separator
        doc.setTextColor(...textMuted);
        doc.setFontSize(8.5);
        doc.text('vs.', pageW / 2, y + 11, { align: 'center' });

        // Other method
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text(otherLabel, pageW - margin - 55, y + 6.5);
        doc.setTextColor(...brandAmber);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Mean μ = ${otherStats.meanMu.toFixed(4)}`, pageW - margin - 55, y + 14);

        y += 25;

        // Agreement verdict
        const devColor = deviation < 5 ? brandGreen : deviation < 15 ? brandAmber : brandRed;
        const verdict = deviation < 5
          ? '✓ Excellent Agreement: Both experimental methods yield consistent static friction values.'
          : deviation < 15
            ? '⚠ Moderate Deviation: Results are reasonably close; check experimental technique for alignment.'
            : '✗ High Deviation: Substantial variance between methods; verify weights and level calibration.';

        doc.setTextColor(...devColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`% Deviation: ${deviation.toFixed(2)}% — ${verdict}`, margin, y);
        y += 8;
      }
    }

    // ── Certification / Sign-off Block ──
    if (y < pageH - 35) {
      y = Math.max(y + 6, pageH - 35);
      doc.setDrawColor(...borderCard);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 7;

      doc.setFontSize(8);
      doc.setTextColor(...textMuted);
      doc.setFont('helvetica', 'normal');
      doc.text('Student / Investigator: ____________________________', margin, y);
      doc.text('Verified By: ____________________________', pageW / 2 + 10, y);
      y += 6;
      doc.text(`Lab Date: ${new Date().toLocaleDateString()}`, margin, y);
      doc.text('Status: COMPLETED', pageW / 2 + 10, y);
    }

    // ── Pagination & Footers on All Pages ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const footerY = pageH - 8;

      doc.setDrawColor(...borderCard);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3, pageW - margin, footerY - 3);

      doc.setTextColor(...textMuted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('FrictionLab — Coefficient of Friction Virtual Lab Simulator', margin, footerY);
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin, footerY, { align: 'right' });
    }

    // Save PDF
    const filename = `friction-lab-${logMethod}-${logMaterial}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }
})();
