/**
 * Get Started Background Animation (Merged ColorBends & DotField)
 *
 * Combines:
 * 1. ColorBends: WebGL warping fluid ribbon shader with parallax and pointer influence.
 * 2. DotField: Interactive 2D canvas particle grid with elastic cursor bulging, wave motion, and luminous glow.
 *
 * Monochromatic design dynamically tuned for both Dark and Light themes.
 * High-performance, mobile-optimized, with graceful cleanup on entering the app.
 */

(function () {
  'use strict';

  const MAX_COLORS = 8;

  // Vertex shader for full-screen quad
  const VERT_SRC = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // Fragment shader for ColorBends
  const FRAG_SRC = `
    precision highp float;
    #define MAX_COLORS 8
    uniform vec2 uCanvas;
    uniform float uTime;
    uniform float uSpeed;
    uniform vec2 uRot;
    uniform int uColorCount;
    uniform vec3 uColors[MAX_COLORS];
    uniform int uTransparent;
    uniform float uScale;
    uniform float uFrequency;
    uniform float uWarpStrength;
    uniform vec2 uPointer;
    uniform float uMouseInfluence;
    uniform float uParallax;
    uniform float uNoise;
    uniform int uIterations;
    uniform float uIntensity;
    uniform float uBandWidth;
    varying vec2 vUv;

    void main() {
      float t = uTime * uSpeed;
      vec2 p = vUv * 2.0 - 1.0;
      p += uPointer * uParallax * 0.1;
      vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
      vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
      q /= max(uScale, 0.0001);
      q /= 0.5 + 0.2 * dot(q, q);
      q += 0.2 * cos(t) - 7.56;
      vec2 toward = (uPointer - rp);
      q += toward * uMouseInfluence * 0.2;

      for (int j = 0; j < 5; j++) {
        if (j >= uIterations - 1) break;
        vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
        q += (rr - q) * 0.15;
      }

      vec3 col = vec3(0.0);
      float a = 1.0;

      if (uColorCount > 0) {
        vec2 s = q;
        vec3 sumCol = vec3(0.0);
        float cover = 0.0;
        for (int i = 0; i < MAX_COLORS; ++i) {
          if (i >= uColorCount) break;
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float kBelow = clamp(uWarpStrength, 0.0, 1.0);
          float kMix = pow(kBelow, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * kBelow;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float m = mix(m0, m1, kMix);
          float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
          sumCol += uColors[i] * w;
          cover = max(cover, w);
        }
        col = clamp(sumCol, 0.0, 1.0);
        a = uTransparent > 0 ? cover : 1.0;
      } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
          float kBelow = clamp(uWarpStrength, 0.0, 1.0);
          float kMix = pow(kBelow, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * kBelow;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
          float m = mix(m0, m1, kMix);
          col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
      }

      col *= uIntensity;

      if (uNoise > 0.0001) {
        float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);
      }

      vec3 rgb = (uTransparent > 0) ? col * a : col;
      gl_FragColor = vec4(rgb, a);
    }
  `;

  // Palette definitions: pure monochrome elegance
  const PALETTES = {
    dark: {
      bends: ['#0d0e12', '#181920', '#282a35', '#3f4252', '#5e6278', '#858aa5'],
      bendsClear: [0.035, 0.035, 0.045, 1.0],
      dotGradientFrom: 'rgba(255, 255, 255, 0.34)',
      dotGradientTo: 'rgba(210, 218, 235, 0.10)',
      cursorGlow: 'rgba(255, 255, 255, 0.12)'
    },
    light: {
      bends: ['#f2f3f7', '#e2e3ea', '#cbcedb', '#afb3c4', '#8c91a3'],
      bendsClear: [0.97, 0.97, 0.98, 1.0],
      dotGradientFrom: 'rgba(20, 24, 32, 0.30)',
      dotGradientTo: 'rgba(60, 68, 85, 0.08)',
      cursorGlow: 'rgba(20, 24, 32, 0.07)'
    }
  };

  function hexToRgb(hex) {
    const h = hex.replace('#', '').trim();
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16) / 255,
        parseInt(h[1] + h[1], 16) / 255,
        parseInt(h[2] + h[2], 16) / 255
      ];
    }
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  function createShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader compile failed:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function createProgram(gl, vSrc, fSrc) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('Program link failed:', gl.getProgramInfoLog(p));
      gl.deleteProgram(p);
      return null;
    }
    return p;
  }

  /**
   * Initializes the unified Get Started background.
   */
  function initGetStartedBackground(containerEl) {
    if (!containerEl) return null;

    const isMobile = window.innerWidth < 768;

    // Create Canvas Layers
    const webglCanvas = document.createElement('canvas');
    webglCanvas.className = 'splash-bg-canvas splash-bg-webgl';

    const dotsCanvas = document.createElement('canvas');
    dotsCanvas.className = 'splash-bg-canvas splash-bg-dots';

    containerEl.innerHTML = '';
    containerEl.appendChild(webglCanvas);
    containerEl.appendChild(dotsCanvas);

    // Setup WebGL Layer
    const gl = webglCanvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });

    let glProgram = null;
    let glBuffer = null;
    let uniforms = {};

    if (gl) {
      glProgram = createProgram(gl, VERT_SRC, FRAG_SRC);
      if (glProgram) {
        gl.useProgram(glProgram);

        // Quad geometry
        const vertices = new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1
        ]);
        glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(glProgram, 'aPosition');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        // Uniform locations
        const uNames = [
          'uCanvas', 'uTime', 'uSpeed', 'uRot', 'uColorCount', 'uColors[0]',
          'uTransparent', 'uScale', 'uFrequency', 'uWarpStrength', 'uPointer',
          'uMouseInfluence', 'uParallax', 'uNoise', 'uIterations', 'uIntensity',
          'uBandWidth'
        ];
        uNames.forEach(name => {
          uniforms[name] = gl.getUniformLocation(glProgram, name);
        });
      }
    }

    // Setup 2D Dots Canvas
    const ctx = dotsCanvas.getContext('2d', { alpha: true });

    // Dynamic state
    let width = 0;
    let height = 0;
    let dpr = 1;
    let dots = [];
    let rafId = null;
    let lastTime = performance.now();
    let isDestroyed = false;

    // Theme state
    let isLight = document.documentElement.getAttribute('data-theme') === 'light';
    let currentPalette = isLight ? PALETTES.light : PALETTES.dark;

    // Unified pointer and interaction tracking
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      prevX: -9999,
      prevY: -9999,
      speed: 0,
      engagement: 0,
      glowOpacity: 0,
      userInteracted: false,
      lastMoveTime: performance.now()
    };

    // ColorBends parameters
    const bendsProps = {
      speed: 0.18,
      rotation: 85,
      autoRotate: 2.5,
      scale: 1.05,
      frequency: 0.95,
      warpStrength: 1.0,
      mouseInfluence: isMobile ? 0.4 : 0.85,
      parallax: isMobile ? 0.25 : 0.45,
      noise: 0.12,
      iterations: isMobile ? 1 : 2,
      intensity: 1.45,
      bandWidth: 5.5,
      transparent: 1,
      ndcPointer: [0, 0]
    };

    // DotField parameters
    const dotsProps = {
      dotRadius: isMobile ? 1.2 : 1.4,
      dotSpacing: isMobile ? 20 : 16,
      cursorRadius: isMobile ? 240 : 420,
      cursorForce: 0.1,
      bulgeOnly: true,
      bulgeStrength: isMobile ? 42 : 62,
      glowRadius: isMobile ? 130 : 200,
      sparkle: false,
      waveAmplitude: isMobile ? 1.8 : 2.6
    };

    function updateColorsUniform() {
      if (!gl || !glProgram) return;
      gl.useProgram(glProgram);
      const colorArr = currentPalette.bends;
      const count = Math.min(colorArr.length, MAX_COLORS);
      const flat = new Float32Array(MAX_COLORS * 3);
      for (let i = 0; i < count; i++) {
        const rgb = hexToRgb(colorArr[i]);
        flat[i * 3 + 0] = rgb[0];
        flat[i * 3 + 1] = rgb[1];
        flat[i * 3 + 2] = rgb[2];
      }
      gl.uniform1i(uniforms['uColorCount'], count);
      gl.uniform3fv(uniforms['uColors[0]'], flat);
      gl.uniform1i(uniforms['uTransparent'], bendsProps.transparent);
    }

    function buildDots(w, h) {
      const step = dotsProps.dotRadius + dotsProps.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const total = rows * cols;
      const newDots = new Array(total);
      let idx = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          newDots[idx++] = {
            ax,
            ay,
            sx: ax,
            sy: ay,
            vx: 0,
            vy: 0
          };
        }
      }
      dots = newDots;
    }

    function resize() {
      if (isDestroyed) return;
      const rect = containerEl.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;

      const maxDpr = isMobile ? 1.25 : 2.0;
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      // WebGL Canvas size
      webglCanvas.width = Math.round(width * dpr);
      webglCanvas.height = Math.round(height * dpr);
      webglCanvas.style.width = width + 'px';
      webglCanvas.style.height = height + 'px';

      if (gl) {
        gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
        if (glProgram && uniforms['uCanvas']) {
          gl.useProgram(glProgram);
          gl.uniform2f(uniforms['uCanvas'], webglCanvas.width, webglCanvas.height);
        }
      }

      // 2D Dots Canvas size
      dotsCanvas.width = Math.round(width * dpr);
      dotsCanvas.height = Math.round(height * dpr);
      dotsCanvas.style.width = width + 'px';
      dotsCanvas.style.height = height + 'px';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildDots(width, height);
    }

    function onPointerMove(e) {
      if (isDestroyed) return;
      const rect = containerEl.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      mouse.targetX = px;
      mouse.targetY = py;
      mouse.userInteracted = true;
      mouse.lastMoveTime = performance.now();

      // NDC pointer for WebGL [-1, 1]
      bendsProps.ndcPointer[0] = (px / (width || 1)) * 2 - 1;
      bendsProps.ndcPointer[1] = -((py / (height || 1)) * 2 - 1);
    }

    function onTouchMove(e) {
      if (e.touches && e.touches.length > 0) {
        onPointerMove(e.touches[0]);
      }
    }

    function updateSpeed() {
      if (isDestroyed) return;
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (dist - mouse.speed) * 0.45;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    }

    const speedInterval = setInterval(updateSpeed, 25);

    let frameCount = 0;
    const TWO_PI = Math.PI * 2;

    function render(time) {
      if (isDestroyed) return;

      frameCount++;
      const dt = Math.min((time - lastTime) * 0.001, 0.1);
      lastTime = time;
      const elapsed = time * 0.001;

      // Autonomous gentle drift when idle or on mobile before touch
      const now = performance.now();
      const timeSinceMove = now - mouse.lastMoveTime;
      if (!mouse.userInteracted || timeSinceMove > 1400) {
        const driftT = elapsed * 0.55;
        const driftX = width * 0.5 + Math.cos(driftT) * (width * 0.32) + Math.sin(driftT * 1.7) * (width * 0.1);
        const driftY = height * 0.5 + Math.sin(driftT * 0.8) * (height * 0.25) + Math.cos(driftT * 1.3) * (height * 0.08);

        // Smoothly blend toward idle motion
        const blend = timeSinceMove > 2000 ? 0.05 : 0.02;
        mouse.targetX += (driftX - mouse.targetX) * blend;
        mouse.targetY += (driftY - mouse.targetY) * blend;

        bendsProps.ndcPointer[0] = (mouse.targetX / (width || 1)) * 2 - 1;
        bendsProps.ndcPointer[1] = -((mouse.targetY / (height || 1)) * 2 - 1);
      }

      // Smooth pointer interpolation
      const smoothRate = Math.min(1, dt * 7.5);
      if (mouse.x === -9999) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * smoothRate;
        mouse.y += (mouse.targetY - mouse.y) * smoothRate;
      }

      // Engagement calculation
      const targetEngagement = Math.min(mouse.speed / 6, 1) * 0.85 + (mouse.userInteracted ? 0.25 : 0.4);
      mouse.engagement += (targetEngagement - mouse.engagement) * 0.08;
      if (mouse.engagement < 0.001) mouse.engagement = 0;
      const eng = mouse.engagement;

      mouse.glowOpacity += (eng - mouse.glowOpacity) * 0.08;

      // ─────────────────────────────────────────────
      // 1. Render ColorBends Layer (WebGL)
      // ─────────────────────────────────────────────
      if (gl && glProgram) {
        gl.useProgram(glProgram);

        const clear = currentPalette.bendsClear;
        gl.clearColor(clear[0], clear[1], clear[2], clear[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Calculate rotation
        const deg = (bendsProps.rotation % 360) + bendsProps.autoRotate * elapsed;
        const rad = (deg * Math.PI) / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        gl.uniform1f(uniforms['uTime'], elapsed);
        gl.uniform1f(uniforms['uSpeed'], bendsProps.speed);
        gl.uniform2f(uniforms['uRot'], c, s);
        gl.uniform1f(uniforms['uScale'], bendsProps.scale);
        gl.uniform1f(uniforms['uFrequency'], bendsProps.frequency);
        gl.uniform1f(uniforms['uWarpStrength'], bendsProps.warpStrength);
        gl.uniform2f(uniforms['uPointer'], bendsProps.ndcPointer[0], bendsProps.ndcPointer[1]);
        gl.uniform1f(uniforms['uMouseInfluence'], bendsProps.mouseInfluence);
        gl.uniform1f(uniforms['uParallax'], bendsProps.parallax);
        gl.uniform1f(uniforms['uNoise'], bendsProps.noise);
        gl.uniform1i(uniforms['uIterations'], bendsProps.iterations);
        gl.uniform1f(uniforms['uIntensity'], bendsProps.intensity);
        gl.uniform1f(uniforms['uBandWidth'], bendsProps.bandWidth);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // ─────────────────────────────────────────────
      // 2. Render DotField Layer (2D Canvas)
      // ─────────────────────────────────────────────
      ctx.clearRect(0, 0, width, height);

      // Render subtle cursor luminance glow
      if (mouse.glowOpacity > 0.01 && mouse.x > -500 && mouse.y > -500) {
        const glowR = dotsProps.glowRadius;
        const glowGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowR);
        glowGrad.addColorStop(0, currentPalette.cursorGlow);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.save();
        ctx.globalAlpha = mouse.glowOpacity;
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowR, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      }

      // Dots linear gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, currentPalette.dotGradientFrom);
      grad.addColorStop(1, currentPalette.dotGradientTo);
      ctx.fillStyle = grad;

      const cr = dotsProps.cursorRadius;
      const crSq = cr * cr;
      const rad = dotsProps.dotRadius;
      const isBulge = dotsProps.bulgeOnly;
      const waveT = frameCount * 0.024;
      const len = dots.length;

      ctx.beginPath();

      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = mouse.x - d.ax;
        const dy = mouse.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          if (isBulge) {
            const factor = 1 - dist / cr;
            const push = factor * factor * dotsProps.bulgeStrength * eng;
            const angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.16;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.16;
          }
        } else {
          d.sx += (d.ax - d.sx) * 0.12;
          d.sy += (d.ay - d.sy) * 0.12;
        }

        let drawX = d.sx;
        let drawY = d.sy;

        if (dotsProps.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.028 + waveT) * dotsProps.waveAmplitude;
          drawX += Math.cos(d.ay * 0.028 + waveT * 0.7) * (dotsProps.waveAmplitude * 0.55);
        }

        ctx.moveTo(drawX + rad, drawY);
        ctx.arc(drawX, drawY, rad, 0, TWO_PI);
      }

      ctx.fill();

      rafId = requestAnimationFrame(render);
    }

    // Event listeners
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchMove, { passive: true });

    // Initial setup
    resize();
    updateColorsUniform();
    rafId = requestAnimationFrame(render);

    // Theme toggle listener
    function setTheme(light) {
      isLight = light;
      currentPalette = isLight ? PALETTES.light : PALETTES.dark;
      updateColorsUniform();
    }

    const themeHandler = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      setTheme(light);
    };

    window.addEventListener('themechange', themeHandler);

    // Cleanup / Disposal on entering app
    function destroy() {
      if (isDestroyed) return;
      isDestroyed = true;

      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(speedInterval);

      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchMove);
      window.removeEventListener('themechange', themeHandler);

      // Cleanup WebGL resources
      if (gl) {
        if (glBuffer) gl.deleteBuffer(glBuffer);
        if (glProgram) gl.deleteProgram(glProgram);
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) loseContext.loseContext();
      }

      dots = [];

      if (containerEl && containerEl.parentNode) {
        containerEl.innerHTML = '';
      }
    }

    return {
      destroy,
      resize,
      setTheme
    };
  }

  // Auto-init or expose globally
  window.initGetStartedBackground = initGetStartedBackground;

  // Initialize once DOM is ready if #splashBgContainer exists
  function autoInit() {
    const splashBg = document.getElementById('splashBgContainer');
    if (splashBg && !window.splashBgInstance) {
      window.splashBgInstance = initGetStartedBackground(splashBg);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
