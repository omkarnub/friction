/**
 * Scroll Index Component (Vanilla JS + CSS)
 * Adapted from Kokonut UI ScrollIndex by @dorianbaffier
 * 
 * Features:
 * - Proportional vertical tick rail based on heading scroll offsets
 * - macOS Dock-style magnification swell near pointer
 * - Scrub/drag rail to scroll page with momentum & snap physics
 * - Smooth easeInOut jump on tick click
 * - Section name flash bubble on scroll & hover
 * - Fully accessible with keyboard navigation
 */

(function () {
  'use strict';

  const RAIL = 280;      // Rail height in px
  const OFFSET = 80;     // Heading landing offset (clears fixed navbar)
  const SWELL = 1.6;     // Magnification peak width
  const REACH = 26;      // Reach radius in px for swell effect
  const SNAP = 18;       // Snap threshold for flick settlement
  const FLASH = 900;     // Milliseconds label stays up after entering section

  function easeInOut(t) {
    return t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  }

  function initScrollIndex() {
    const homeSection = document.getElementById('page-home');
    if (!homeSection) return;

    // Selector for homepage landmark headings
    const headingSelector = '.get-started-title, .learn-qa-question, .learn-method-title, .learn-point-title';

    // Create Rail Navigation DOM
    const nav = document.createElement('nav');
    nav.className = 'scroll-index-nav';
    nav.setAttribute('aria-label', 'Homepage Section Index');

    const rail = document.createElement('div');
    rail.className = 'scroll-index-rail';

    const head = document.createElement('span');
    head.className = 'scroll-index-head';
    head.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'scroll-index-label';
    label.setAttribute('aria-hidden', 'true');

    rail.appendChild(head);
    rail.appendChild(label);
    nav.appendChild(rail);
    document.body.appendChild(nav);

    let list = [];
    let start = 0;
    let end = 1;
    let active = -1;
    let height = RAIL;
    let raf = 0;
    let tween = 0;
    let flashTimer = 0;
    let painted = false;
    let hover = null;
    let drag = null;
    const swell = [];
    let tickButtons = [];

    const getRailHeight = () => rail.clientHeight || (window.innerWidth <= 420 ? 240 : window.innerWidth <= 768 ? 260 : RAIL);

    const getScroll = () => window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const setScroll = (value) => window.scrollTo(0, value);

    const isHomeActive = () => {
      const splash = document.getElementById('splashScreen');
      if (splash && !splash.classList.contains('dismissed') && splash.parentNode) {
        return false;
      }
      const hash = (window.location.hash || '').toLowerCase();
      return hash === '' || hash === '#home' || hash === '#';
    };

    const updateVisibility = () => {
      if (isHomeActive()) {
        nav.classList.add('visible');
      } else {
        nav.classList.remove('visible');
      }
    };

    const measure = () => {
      const scroll = getScroll();
      const homeRect = homeSection.getBoundingClientRect();
      const top = homeRect.top + scroll;
      start = Math.max(top - OFFSET, 0);
      end = Math.max(top + homeSection.offsetHeight - window.innerHeight, start + 1);

      const headings = Array.from(homeSection.querySelectorAll(headingSelector));
      list = headings.map(el => {
        let text = el.textContent ? el.textContent.trim() : '';
        // Clean up overly long questions for label badge
        if (text.length > 32) {
          text = text.slice(0, 30) + '…';
        }
        const level = Number(el.tagName.slice(1)) || 2;
        const at = Math.min(Math.max(el.getBoundingClientRect().top + scroll - OFFSET, start), end);
        const pos = end > start ? (at - start) / (end - start) : 0;
        return { el, text, level, at, pos };
      });

      height = getRailHeight();

      // Rebuild tick buttons if list size changed
      if (tickButtons.length !== list.length) {
        // Remove old ticks
        tickButtons.forEach(btn => btn.remove());
        tickButtons = [];

        list.forEach((section, index) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `scroll-index-tick ${section.level <= 2 ? 'major' : 'minor'}`;
          btn.setAttribute('aria-label', section.text);
          btn.dataset.state = 'ahead';
          btn.style.top = `${(section.pos * 100).toFixed(3)}%`;

          const bar = document.createElement('span');
          bar.className = 'scroll-index-bar';
          btn.appendChild(bar);

          btn.addEventListener('click', (e) => {
            if (e.detail === 0) { // Keyboard click
              jump(index);
            }
          });

          btn.addEventListener('focus', () => {
            show(index);
          });

          btn.addEventListener('blur', () => {
            label.style.opacity = '0';
          });

          btn.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            const next = Math.min(Math.max(index + (e.key === 'ArrowDown' ? 1 : -1), 0), list.length - 1);
            if (tickButtons[next]) tickButtons[next].focus();
          });

          rail.appendChild(btn);
          tickButtons.push(btn);
        });
      } else {
        // Update positions
        list.forEach((section, index) => {
          if (tickButtons[index]) {
            tickButtons[index].style.top = `${(section.pos * 100).toFixed(3)}%`;
            tickButtons[index].setAttribute('aria-label', section.text);
          }
        });
      }
    };

    const fraction = () => Math.min(Math.max((getScroll() - start) / (end - start), 0), 1);

    const nearest = (y) => {
      let best = -1;
      let distance = Number.POSITIVE_INFINITY;
      list.forEach((s, i) => {
        const d = Math.abs(s.pos * height - y);
        if (d < distance) {
          distance = d;
          best = i;
        }
      });
      return { index: best, distance };
    };

    const placeLabel = (index, visible) => {
      const section = list[index];
      if (!section) {
        label.style.opacity = '0';
        return;
      }
      if (label.textContent !== section.text) {
        label.textContent = section.text;
      }
      label.style.transform = `translate3d(0, ${(section.pos * height).toFixed(1)}px, 0) translateY(-50%)`;
      label.style.opacity = visible ? '1' : '0';
    };

    const current = () => {
      const scroll = getScroll() + 1;
      let index = -1;
      for (let i = 0; i < list.length; i++) {
        if (list[i].at <= scroll) {
          index = i;
        }
      }
      return index;
    };

    const markTicks = (activeIdx) => {
      tickButtons.forEach((tick, i) => {
        if (!tick) return;
        let state = 'ahead';
        if (i === activeIdx) {
          state = 'current';
        } else if (i < activeIdx) {
          state = 'passed';
        }
        tick.dataset.state = state;
        tick.tabIndex = i === Math.max(activeIdx, 0) ? 0 : -1;
        if (i === activeIdx) {
          tick.setAttribute('aria-current', 'location');
        } else {
          tick.removeAttribute('aria-current');
        }
      });
    };

    const paint = () => {
      raf = 0;
      head.style.transform = `translate3d(0, ${(fraction() * height).toFixed(1)}px, 0)`;
      const now = current();
      if (now !== active) {
        active = now;
        markTicks(active);
        // Scrolling into a new section flashes its name briefly
        if (painted && hover === null && !drag && active >= 0) {
          placeLabel(active, true);
          window.clearTimeout(flashTimer);
          flashTimer = window.setTimeout(() => {
            if (hover === null && !drag) {
              label.style.opacity = '0';
            }
          }, FLASH);
        }
      }

      // Smooth dock magnification swell
      let moving = false;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      tickButtons.forEach((tick, i) => {
        if (!tick) return;
        const y = (list[i]?.pos ?? 0) * height;
        const target = hover === null || reduceMotion
          ? 1
          : 1 + SWELL * Math.exp(-((hover - y) ** 2) / (2 * REACH * REACH));
        const val = (swell[i] ?? 1) + (target - (swell[i] ?? 1)) * 0.35;
        swell[i] = Math.abs(val - target) < 0.005 ? target : val;
        moving = moving || swell[i] !== target;
        tick.style.setProperty('--swell', swell[i].toFixed(3));
      });

      painted = true;
      if (moving) {
        schedule();
      }
    };

    function schedule() {
      if (!raf) {
        raf = requestAnimationFrame(paint);
      }
    }

    const stopTween = () => {
      cancelAnimationFrame(tween);
      tween = 0;
    };

    const scrollToTarget = (target) => {
      stopTween();
      const from = getScroll();
      const to = Math.min(Math.max(target, 0), end);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || Math.abs(to - from) < 2) {
        setScroll(to);
        return;
      }
      const duration = Math.min(Math.max(260 + Math.abs(to - from) * 0.12, 300), 650);
      const begin = performance.now();
      const step = (now) => {
        const t = Math.min((now - begin) / duration, 1);
        setScroll(from + (to - from) * easeInOut(t));
        tween = t < 1 ? requestAnimationFrame(step) : 0;
      };
      tween = requestAnimationFrame(step);
    };

    const jump = (index) => {
      const section = list[index];
      if (section) {
        scrollToTarget(section.at);
      }
    };

    const show = (index) => {
      hover = (list[index]?.pos ?? 0) * height;
      placeLabel(index, true);
      schedule();
    };

    const railY = (event) => Math.min(Math.max(event.clientY - rail.getBoundingClientRect().top, 0), height);
    const scrub = (y) => setScroll(start + (y / height) * (end - start));

    const onDown = (event) => {
      if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      rail.setPointerCapture(event.pointerId);
      stopTween();
      const y = railY(event);
      drag = { id: event.pointerId, moved: false, y, t: event.timeStamp, v: 0 };
      hover = y;
      rail.dataset.dragging = '';
      placeLabel(nearest(y).index, true);
      schedule();
    };

    const onMove = (event) => {
      const y = railY(event);
      if (drag && event.pointerId === drag.id) {
        const dt = Math.max(event.timeStamp - drag.t, 1);
        drag.v = drag.v * 0.4 + ((y - drag.y) / dt) * 0.6;
        drag.moved = drag.moved || Math.abs(y - drag.y) > 3;
        drag.y = y;
        drag.t = event.timeStamp;
        if (drag.moved) {
          scrub(y);
        }
      } else if (event.pointerType !== 'mouse') {
        return;
      }
      hover = y;
      placeLabel(nearest(y).index, true);
      schedule();
    };

    const onUp = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved, y, v } = drag;
      drag = null;
      delete rail.dataset.dragging;
      if (event.pointerType !== 'mouse') {
        hover = null;
        window.clearTimeout(flashTimer);
        flashTimer = window.setTimeout(() => {
          placeLabel(-1, false);
        }, 1100);
      }
      const projected = moved ? y + v * 120 : y;
      const hit = nearest(projected);
      if (hit.index >= 0 && (!moved || hit.distance < SNAP)) {
        jump(hit.index);
      }
      schedule();
    };

    const onLeave = () => {
      if (drag) return;
      hover = null;
      placeLabel(-1, false);
      schedule();
    };

    const onScroll = () => schedule();
    const onInput = () => stopTween();

    measure();
    paint();
    updateVisibility();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onInput, { passive: true });
    window.addEventListener('touchstart', onInput, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      updateVisibility();
      schedule();
    });
    window.addEventListener('hashchange', () => {
      updateVisibility();
      measure();
      schedule();
    });
    window.addEventListener('pagechange', () => {
      updateVisibility();
      measure();
      schedule();
    });

    const enterBtn = document.getElementById('enterAppBtn');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        setTimeout(() => {
          measure();
          updateVisibility();
          schedule();
        }, 550);
      });
    }

    rail.addEventListener('pointerdown', onDown);
    rail.addEventListener('pointermove', onMove);
    rail.addEventListener('pointerup', onUp);
    rail.addEventListener('pointercancel', onUp);
    rail.addEventListener('pointerleave', onLeave);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollIndex);
  } else {
    initScrollIndex();
  }
})();
