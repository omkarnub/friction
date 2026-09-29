/**
 * haptics.js — Haptic Feedback Engine for Virtual Mechanics Lab
 *
 * Provides tactile vibration feedback on supported mobile devices
 * for physical simulation events (block slip, weight added, etc.).
 * Uses the Vibration API — silently no-ops on unsupported devices.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'fl-haptics-enabled';
  let enabled = true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored !== 'false';
  } catch (e) { /* ignore */ }

  const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  function vibrate(pattern) {
    if (!enabled || !canVibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  /* ================================================================
     Haptic Patterns
     ================================================================ */

  /** Block slips / slides — strong double pulse */
  function slipFeedback() { vibrate([60, 30, 80]); }

  /** Weight added to pan — short tap */
  function weightAddedFeedback() { vibrate(25); }

  /** Trial logged successfully — soft confirmation pulse */
  function trialLoggedFeedback() { vibrate([20, 40, 20]); }

  /** Approaching slip threshold — gentle warning nudge */
  function warningFeedback() { vibrate(15); }

  /** Apparatus reset — quick buzz */
  function resetFeedback() { vibrate(30); }

  /** Block begins climbing (friction plane motion) — ramp pulse */
  function motionStartFeedback() { vibrate([15, 20, 40]); }

  /** Slider step button press — micro tap */
  function tickFeedback() { vibrate(8); }

  /* ================================================================
     Integration — Hook into existing simulation events
     ================================================================ */
  function init() {
    if (!canVibrate) return; // skip wiring on desktop

    // Slider step buttons → micro tap
    document.querySelectorAll('.slider-step-btn, .stepper-arrow-btn').forEach(btn => {
      btn.addEventListener('click', tickFeedback);
    });

    // Quick-add weight buttons → weight tap
    document.querySelectorAll('[data-add-p]').forEach(btn => {
      btn.addEventListener('click', weightAddedFeedback);
    });

    // Clear pan → reset buzz
    const clearPanBtn = document.getElementById('clearPanBtn');
    if (clearPanBtn) clearPanBtn.addEventListener('click', resetFeedback);

    // Add to Data Log → confirmation
    ['reposeAddTrial', 'frictionAddTrial', 'logAddReposeBtn', 'logAddFrictionBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', trialLoggedFeedback);
    });

    // Reset buttons → reset buzz
    ['reposeResetBtn', 'frictionResetBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', resetFeedback);
    });

    // Data log export buttons → confirmation pulse
    ['exportPdfBtn', 'exportCsvBtn', 'printLogBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', trialLoggedFeedback);
    });

    // Manual view switcher buttons → micro tap
    ['manualBtnDesktop', 'manualBtnMobile'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', tickFeedback);
    });
  }

  /* ================================================================
     Expose API for other modules (simulate.js slip/motion hooks)
     ================================================================ */
  window.SimHaptics = {
    slipFeedback,
    weightAddedFeedback,
    trialLoggedFeedback,
    warningFeedback,
    resetFeedback,
    motionStartFeedback,
    tickFeedback,
    isEnabled: () => enabled,
    setEnabled: (val) => {
      enabled = !!val;
      try { localStorage.setItem(STORAGE_KEY, enabled); } catch (e) { /* ignore */ }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
