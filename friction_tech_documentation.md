# Coefficient of Friction — Virtual Simulation
## Technical Documentation

> **Version:** 1.0.0  
> **Application Title:** Coefficient of Friction — Virtual Simulation  
> **PWA Short Name:** μs Lab  
> **Last Updated:** September 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Application Lifecycle & Navigation](#4-application-lifecycle--navigation)
5. [Physics Engine — `simulate.js`](#5-physics-engine--simulatejs)
   - 5.1 [Material System](#51-material-system)
   - 5.2 [Method 1: Angle of Repose](#52-method-1-angle-of-repose)
   - 5.3 [Method 2: Friction Plane](#53-method-2-friction-plane)
   - 5.4 [SVG Rendering Pipeline](#54-svg-rendering-pipeline)
   - 5.5 [Hidden Experimental Variance](#55-hidden-experimental-variance)
6. [Data Logging System — `data-log.js`](#6-data-logging-system--data-logjs)
7. [Cross-Method Comparison — `compare.js`](#7-cross-method-comparison--comparejs)
8. [Theory Module — `theory.js`](#8-theory-module--theoryjs)
9. [PDF Lab Report Export — `pdf-export.js`](#9-pdf-lab-report-export--pdf-exportjs)
10. [Visual & Animation Systems](#10-visual--animation-systems)
    - 10.1 [Home Showcase Animation — `home-showcase.js`](#101-home-showcase-animation--home-showcasejs)
    - 10.2 [Splash Screen Background — `get-started-bg.js`](#102-splash-screen-background--get-started-bgjs)
    - 10.3 [Staggered Menu — React Component](#103-staggered-menu--react-component)
11. [Theming System](#11-theming-system)
12. [Progressive Web App (PWA)](#12-progressive-web-app-pwa)
13. [Build System — Standalone HTML](#13-build-system--standalone-html)
14. [UI Components & Custom Controls](#14-ui-components--custom-controls)
15. [Mathematical Reference](#15-mathematical-reference)
16. [Material Reference Data](#16-material-reference-data)
17. [Inter-Module Communication](#17-inter-module-communication)
18. [Accessibility](#18-accessibility)
19. [Performance Considerations](#19-performance-considerations)

---

## 1. Project Overview

This project is a **physics-accurate, interactive virtual simulation** for the engineering mechanics experiment: *"Determination of the Coefficient of Friction."* It replicates two classical laboratory methods for measuring the static coefficient of friction (μₛ) between material surface pairs:

| Method | Principle | Formula |
|--------|-----------|---------|
| **Angle of Repose** | Geometry-based — tilt incline until block slides | `μ = tan α` |
| **Friction Plane** | Force-based — pull block up incline via pulley & pan | `μ = (P − W sin θ) / (W cos θ)` |

The simulation features:
- **9 material pairs** with physically validated friction coefficient ranges
- **Real-time SVG apparatus rendering** with force vector decomposition
- **Realistic mechanical components**: protractor dial, ball-bearing pulley, brass scale pan, slotted weights, hatched engineering drawings
- **Scientific data recording** with per-trial validation, mean μ computation, % error analysis
- **PDF lab report generation** via jsPDF
- **Cross-method comparison** with deviation analysis
- **Progressive Web App** with offline support
- **Dark/Light theme** with premium glassmorphism UI
- **Cinematic home showcase** with GSAP-powered animations

---

## 2. Architecture & Technology Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Structure** | HTML5 (Semantic) | Page layout, sections, SVG apparatus |
| **Styling** | Vanilla CSS (113 KB) | Design system, theming, responsive layout |
| **Logic** | Vanilla JavaScript (ES6+) | Physics engine, rendering, data management |
| **Animation** | GSAP 3.15+ & ScrollTrigger | Cinematic animations, scroll reveals |
| **Menu** | React 19.3 (bundled) | Staggered navigation menu component |
| **PDF** | jsPDF (UMD bundle) | Lab report PDF generation |
| **Graphics** | SVG (inline, dynamic) | Apparatus visualisation, force vectors, charts |
| **Shader** | WebGL (GLSL) | Splash screen fluid ribbon background |
| **PWA** | Service Worker + manifest.json | Offline caching, installability |

### Design Philosophy

- **Zero external runtime dependencies** — all libraries are vendored in `js/`
- **Single-page application** — hash-based routing (`#home`, `#simulate`, `#log`, etc.)
- **IIFE module pattern** — each JS file wraps in `(function(){ 'use strict'; ... })()` for encapsulation
- **Global window API** — modules communicate via `window.*` function exports

---

## 3. Directory Structure

```
mech/
├── index.html                  # Main SPA (2,966 lines, 165 KB)
├── styles.css                  # Complete design system (113 KB)
├── StaggeredMenu.css           # React menu component styles (5 KB)
├── StaggeredMenu.jsx           # React menu source component (14 KB)
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (stale-while-revalidate)
├── package.json                # Node.js config (gsap, react, react-dom)
├── build-single-html.js        # Standalone HTML builder script (11 KB)
├── friction_standalone.html    # Self-contained single-file build (2 MB)
├── .gitignore
│
├── js/                         # Application JavaScript modules
│   ├── simulate.js             # Physics engine & SVG renderer (62 KB, 1,337 lines)
│   ├── data-log.js             # Data logging, validation, charts (34 KB, 883 lines)
│   ├── compare.js              # Cross-method comparison (8 KB, 175 lines)
│   ├── theory.js               # Theory content renderer (7 KB, 100 lines)
│   ├── pdf-export.js           # PDF lab report generator (14 KB, 374 lines)
│   ├── home-showcase.js        # GSAP cinematic home animation (25 KB, 744 lines)
│   ├── get-started-bg.js       # WebGL + Canvas splash background (22 KB, 660 lines)
│   ├── menu-init.jsx           # React menu initializer (2 KB)
│   ├── staggered-menu.bundle.js # Pre-built React menu bundle (304 KB)
│   ├── staggered-menu.bundle.css # Menu bundle styles (5 KB)
│   ├── gsap.min.js             # GSAP animation library (72 KB)
│   ├── ScrollTrigger.min.js    # GSAP ScrollTrigger plugin (43 KB)
│   └── jspdf.umd.min.js       # jsPDF library for PDF export (365 KB)
│
├── icons/                      # PWA app icons
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
│
├── assets/
│   └── manual/                 # User manual screenshots
│       └── *.png               # Desktop & mobile guide images
│
└── scripts/
    └── capture-perfect-screenshots.js  # Screenshot capture utility
```

---

## 4. Application Lifecycle & Navigation

### Startup Sequence

```
Browser Load
    │
    ├── 1. Page Loader animation (CSS bars)
    ├── 2. Font preloading (Google Fonts: Anton, Lexend, Outfit, Google Sans Flex)
    ├── 3. Splash screen renders (WebGL ColorBends + Canvas DotField)
    ├── 4. GSAP split-text title animation on splash
    │
    └── User clicks "Get Started"
         │
         ├── 5. Splash screen fades out (CSS transition)
         ├── 6. Main navigation bar appears
         ├── 7. Hero split-text animation triggers
         ├── 8. Home showcase cinematic loop initialises
         ├── 9. Scroll-reveal observers attach
         ├── 10. simulate.js initialises both apparatus
         ├── 11. data-log.js loads from localStorage
         ├── 12. Service worker registers
         └── 13. PWA install prompt captured
```

### Hash-Based Routing

The SPA uses URL hash fragments for navigation. Each section is a `<section class="page-section">` with a unique ID:

| Hash | Section ID | Description |
|------|-----------|-------------|
| `#home` | `page-home` | Landing page with showcase & educational content |
| `#methods` | `page-methods` | Experimental method cards (Repose & Friction Plane) |
| `#simulate` | `page-simulate` | Interactive simulator with two tabbed methods |
| `#reference` | `page-reference` | Material friction coefficient reference table |
| `#log` | `page-log` | Data recording, validation, chart, CSV/PDF export |
| `#theory` | `page-theory` | Physics theory (Laws of Friction, derivations) |
| `#compare` | `page-compare` | Cross-method μ comparison with deviation chart |
| `#how-to-use` | `page-how-to-use` | User manual with Desktop/Mobile variants |
| `#team` | `page-team` | Contributor credits |

### Navigation Components

1. **Ribbon Navigation** (`#ribbonNav`) — 3-tab radio-button nav (Home, Simulate, Data Log) with animated underline
2. **Staggered Menu** — Full-screen React-based hamburger menu providing access to all sections
3. **Breadcrumb Trail** — Each section has a breadcrumb bar linking back to Home

---

## 5. Physics Engine — `simulate.js`

The simulation engine (`js/simulate.js`, 1,337 lines) is the core of the application. It handles physics computation, SVG rendering, user interaction, and state management for both experimental methods.

### 5.1 Material System

#### Material Pairs (`MATERIALS`)

9 material pair configurations with validated friction coefficient ranges:

| Key | Name | Block Material | Plane Material | μ Range |
|-----|------|---------------|----------------|---------|
| `wood-wood` | Wood on Wood | Wood | Wood | 0.25 – 0.50 |
| `wood-steel` | Wood on Steel | Wood | Steel (dry) | 0.20 – 0.60 |
| `wood-glass` | Wood on Glass | Wood | Glass | 0.20 – 0.50 |
| `glass-glass` | Glass on Glass | Glass | Glass | 0.90 – 1.00 |
| `steel-steel-dry` | Steel on Steel (dry) | Steel (dry) | Steel (dry) | 0.50 – 0.80 |
| `steel-steel-lub` | Steel on Steel (lubricated) | Steel (lub) | Steel (lub) | 0.05 – 0.20 |
| `aluminum-aluminum` | Aluminum on Aluminum | Aluminum | Aluminum | 1.05 – 1.35 |
| `rubber-concrete` | Rubber on Concrete | Rubber | Concrete | 0.60 – 0.85 |
| `brass-steel` | Brass on Steel | Brass | Steel (dry) | 0.35 – 0.50 |

#### Material Styles (`MATERIAL_STYLES`)

Each base material has a visual definition for SVG rendering:

| Property | Description |
|----------|-------------|
| `fill` | SVG gradient reference for block/plane fill |
| `pattern` | Optional SVG pattern overlay (wood grain, rubber stipple, etc.) |
| `planeFill` | Gradient for the inclined plane runner surface |
| `planeStroke` / `stroke` | Border stroke colour |
| `labelColor` / `textStroke` | Block weight label text styling |
| `swatch` | Colour swatch for dropdown UI indicators |

**8 material textures** are defined via SVG `<defs>`:
- **Wood** — vertical gradient (#b67c42 → #6e3c12) + horizontal grain lines pattern
- **Steel (dry)** — diagonal metallic gradient + brushed-line pattern
- **Steel (lubricated)** — dark steel with oily cyan sheen
- **Glass** — semi-transparent frosted refraction gradient
- **Rubber** — matte vulcanised charcoal + stippled dots pattern
- **Aluminum** — satin metallic white-silver gradient
- **Concrete** — stone aggregate grey + random granular dots
- **Brass** — warm gold gradient (#fff176 → #aa8010)

### 5.2 Method 1: Angle of Repose

#### Physics Model

At limiting equilibrium on an inclined plane at angle α:

```
Forces along slope:   W sin α = μ × W cos α
Solving:              μ = sin α / cos α = tan α
```

The block remains stationary until the angle reaches the **angle of repose**, at which point:
- `W sin α > μₛ × W cos α`
- The block accelerates downhill

#### State Management

```javascript
simState.repose = {
    trueMu: 0,        // Hidden true coefficient (randomised within range)
    threshold: 0,     // Critical angle in degrees = atan(trueMu) × 180/π
    sliding: false,    // Block has slipped (prevents further interaction)
    trialCount: 0,
    timer: null
}
```

#### Simulation Controls

| Control | DOM ID | Range | Step |
|---------|--------|-------|------|
| Material Pair | `reposeMaterial` | 9 options | — |
| Angle (α) | `reposeAngle` | 0° – 89° | 0.5° |
| Block Weight (W) | `reposeWeight` | 0.5 N – 50 N | 0.5 N |

#### Rendering Pipeline

1. **`renderReposeSVG()`** — Full re-render of the apparatus:
   - Injects `getMaterialDefsSVG()` (gradients, patterns, markers)
   - Draws `apparatusChrome()` (lab bench, wall, pivot stand, clamp)
   - Draws `protractorDial()` (arc, degree ticks, rotating needle)
   - Creates incline board with material-specific runner surface
   - Positions block with material texture and weight label
   - Adds telemetry overlay (material pair badges)

2. **`updateReposeSVG()`** — Incremental update on slider input:
   - Rotates incline group via CSS `transform: rotate()`
   - Updates protractor needle position
   - Computes dynamic block dimensions (scale with weight)
   - Calculates **world-space force vectors** via coordinate transformation:
     ```
     worldX = pivot.x + dx × cos(α) + dy × sin(α)
     worldY = pivot.y - dx × sin(α) + dy × cos(α)
     ```
   - Renders three force vectors from block centre of mass:
     - **W** (green, downward) — gravity
     - **N** (purple, dashed, perpendicular to surface) — normal reaction
     - **f** (amber, along surface toward pivot) — friction force
   - Calls `checkReposeSlip()`

3. **`checkReposeSlip()`** — Slip detection:
   - If `angleDeg >= simState.repose.threshold`:
     - Sets `sliding = true`
     - Shows slip banner with critical angle
     - Animates block sliding toward end bracket via CSS transition (0.85s cubic-bezier)

4. **`resetReposeApparatus()`** — Complete reset:
   - Resets block position
   - Sets angle to 0°
   - Regenerates `trueMu` with fresh randomisation
   - Full re-render

### 5.3 Method 2: Friction Plane

#### Physics Model

At a fixed incline angle θ, a pull force P is applied upward along the plane via a cord-and-pulley system:

```
At limiting equilibrium (upward motion):
    P = W sin θ + μ × W cos θ

Solving for μ:
    μ = (P − W sin θ) / (W cos θ)

Special case θ = 0°:
    μ = P / W
```

#### State Management

```javascript
simState.friction = {
    trueMu: 0,        // Hidden true coefficient (randomised)
    moving: false,     // Block has begun climbing
    trialCount: 0,
    animating: false
}
```

#### Simulation Controls

| Control | DOM ID | Range | Step |
|---------|--------|-------|------|
| Material Pair | `frictionMaterial` | 9 options | — |
| Angle (θ) | `frictionAngle` | 0° – 89° | 0.5° |
| Block Weight (W) | `frictionWeight` | 0.5 N – 50 N | 0.5 N |
| Pull Force (P) | `frictionForce` | 0 N – 100 N | 0.1 N |

**Quick-add weight buttons:** `+0.5 N`, `+1.0 N`, `+2.0 N`, `+5.0 N`, `Empty Pan`

#### Mechanical Apparatus Components

The Friction Plane simulator renders a detailed mechanical apparatus:

1. **Incline Board** — Rotates around pivot with material-specific runner strip
2. **End Bracket** — Stop bracket at pivot end
3. **Pulley Assembly** — Ball-bearing pulley at board tip:
   - Outer rim (cyan stroke)
   - Inner bearing ring (dashed)
   - Axle pin (solid cyan dot)
   - Rotating spokes (animated on motion)
   - Mounting bracket
4. **String/Cord** — Dashed line from block eyelet to pulley tangent:
   - Segment 1: Along incline surface (block → pulley rim)
   - Wrap arc: Curved path over pulley wheel
   - Segment 2: Vertical drop from pulley to pan
5. **Scale Pan Assembly**:
   - Golden brass stirrup hanger wire (triangular)
   - Polished pan tray (metallic brass gradient)
   - Dynamic slotted weight discs (1–6 discs, proportional to P)
   - Pull force label pill (`P = X.X N`)
6. **Block** — Material-textured with eyelet hook and weight label

#### Motion Detection

```javascript
const requiredP = simState.friction.trueMu * W_cos_θ + W_sin_θ;
const willMove = pullForce >= requiredP && pullForce > 0;
```

When motion is detected:
- Block translates 42px up the incline (CSS transition, 0.55s ease)
- String shortens accordingly
- Pulley spokes rotate 54°
- Pan assembly drops further
- Motion indicator banner appears: "▲ BLOCK MOVING UP INCLINE"

### 5.4 SVG Rendering Pipeline

Both methods share a common SVG rendering architecture:

```
┌─────────────────────────────────────────────────┐
│                  SVG Viewport                    │
│                 600 × 400 units                  │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  getMaterialDefsSVG()                │       │
│  │  • 8 linearGradients                 │       │
│  │  • 4 SVG patterns                    │       │
│  │  • 4 arrowhead markers               │       │
│  │  • 1 glow filter                     │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  apparatusChrome(pivotX, pivotY)     │       │
│  │  • Ground baseline (hatched)         │       │
│  │  • Vertical wall backstop (hatched)  │       │
│  │  • Pivot base block (hatched)        │       │
│  │  • Clamp housing + pin              │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  protractorDial(cx, cy, r, angle)    │       │
│  │  • 0°–90° quarter-circle arc         │       │
│  │  • Major ticks at 0°, 30°, 60°, 90° │       │
│  │  • 6 minor ticks                     │       │
│  │  • Rotating needle (amber)           │       │
│  │  • Dynamic angle label               │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  Incline Group (transform: rotate)   │       │
│  │  • Structural beam base              │       │
│  │  • Material runner surface           │       │
│  │  • Block assembly (material texture) │       │
│  │  • [Friction only]: Pulley, string,  │       │
│  │    hanging pan, slotted weights      │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  Force Vectors (world coordinates)    │       │
│  │  • W: gravity (green, downward)      │       │
│  │  • N: normal (purple, dashed, ⊥)     │       │
│  │  • f: friction (amber, along slope)  │       │
│  │  • [Friction]: P: pull (cyan, along) │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  Telemetry Overlay | Status Indicator            │
└─────────────────────────────────────────────────┘
```

#### Coordinate Transformation

All force vectors are rendered in **world (screen) coordinates** even though the block is in the rotated incline frame. The transformation from local incline coordinates to world coordinates uses:

```javascript
// For a point (dx, dy) relative to pivot in local incline frame:
worldX = pivot.x + dx * cos(α) - dy * (-sin(α));
worldY = pivot.y + dx * (-sin(α)) + dy * cos(α);
```

This ensures gravity always points straight down, normal is always perpendicular to the visible surface, and friction is always along the visible surface.

### 5.5 Hidden Experimental Variance

To simulate realistic laboratory conditions where each trial produces slightly different measurements:

```javascript
function randomWithin(mat) {
    return +(mat.low + Math.random() * (mat.high - mat.low)).toFixed(4);
}
```

- On each apparatus reset or material change, a new `trueMu` is sampled uniformly from the material's `[low, high]` range
- The slip threshold angle is computed as `atan(trueMu) × 180/π`
- The user does **not** know the exact `trueMu` — they must discover it experimentally
- This produces natural trial-to-trial variance, just like a physical lab

---

## 6. Data Logging System — `data-log.js`

The data log module (`js/data-log.js`, 883 lines) provides a complete scientific data recording system.

### Data Model

```javascript
{
    method: 'repose' | 'friction',
    material: string,        // Material pair key
    angle: number,           // Degrees
    weight: number,          // Newtons
    pullForce: number|null,  // Newtons (friction method only)
    mu: number|null,         // Computed coefficient
    valid: boolean,          // Passed validation
    validationMsg: string,   // Error description if invalid
    timestamp: number        // Date.now()
}
```

### Features

| Feature | Description |
|---------|-------------|
| **Manual Entry** | Input fields with animated wave-label bars and stepper arrows (hold for auto-repeat) |
| **Simulator Integration** | "Add to Data Log" button in each simulator tab auto-populates and logs readings |
| **Validation** | Checks angle range (0–90°), positive weight, positive pull force, P > W sin θ condition |
| **Per-Row μ** | Auto-computes μ for each trial row |
| **Summary Statistics** | Trial count, Mean μ, Reference range, % Error, Range Check (pass/fail) |
| **SVG Chart** | Bar chart showing μ per trial with mean line and reference band |
| **Animated Rows** | New entries slide in with CSS `@keyframes logRowIn` animation |
| **Persistence** | `localStorage` save/load with key `fl-data-log` |
| **Export: CSV** | Tab-separated download with headers |
| **Export: Copy** | Formatted text copy to clipboard |
| **Export: PDF** | Full lab report via `pdf-export.js` |
| **Demo Data** | "Load Sample Trials" button populates realistic example data |
| **Clear All** | Confirmation dialog + complete log wipe |

### μ Calculation

```javascript
function calcMu(entry) {
    const rad = entry.angle * Math.PI / 180;
    if (entry.method === 'repose') {
        return Math.tan(rad);
    } else {
        const Wcosth = entry.weight * Math.cos(rad);
        if (Wcosth < 0.0001) return null;  // Prevent division by zero
        return (entry.pullForce - entry.weight * Math.sin(rad)) / Wcosth;
    }
}
```

### Auto-Reset Workflow

When a trial is logged from the simulator:
1. Entry is validated and added to the log
2. Toast notification appears: "Reading Logged to Data Log"
3. Apparatus automatically resets (angle → 0° / P → 0)
4. A **new randomised trueMu** is generated for the next trial
5. User can continue with fresh experimental conditions

---

## 7. Cross-Method Comparison — `compare.js`

The comparison module (`js/compare.js`, 175 lines) enables side-by-side validation of results from both methods for the same material pair.

### Analysis Pipeline

```
Select Material Pair
    │
    ├── Retrieve logged trials for "repose" method
    ├── Retrieve logged trials for "friction" method
    │
    ├── Compute Mean μ (Method A: Angle of Repose)
    ├── Compute Mean μ (Method B: Friction Plane)
    │
    ├── Calculate % Deviation:
    │     deviation = |μ_A - μ_B| / ((μ_A + μ_B) / 2) × 100
    │
    ├── Verdict Classification:
    │     < 5%  → "Excellent agreement" (green)
    │     < 15% → "Moderate deviation" (amber)
    │     ≥ 15% → "High deviation — check for systematic errors" (red)
    │
    └── Reference comparison:
          % error from reference midpoint for each method
```

### SVG Comparison Chart

Renders a grouped bar chart with:
- Method A bar (blue)
- Method B bar (cyan)
- Reference range shaded band
- Reference midpoint dashed line
- Y-axis scale with μ values
- Legend labels

---

## 8. Theory Module — `theory.js`

The theory module (`js/theory.js`, 100 lines) dynamically renders educational content into the `#theoryContent` container.

### Content Sections

1. **📜 Laws of Friction** — Amontons' First & Second Laws, Coulomb's Third Law, material dependence
2. **🔬 Coefficient of Friction (μ)** — Definition as a surface pair property, the fundamental equation `F_friction = μ × N`
3. **📐 Angle of Friction vs. Angle of Repose** — Distinction between φ (derived) and α (measured), and why they are equal when no external force is applied
4. **⚡ Static vs. Kinetic Friction** — Limiting static (μₛ) vs kinetic (μₖ), why μₖ < μₛ
5. **🧮 Deriving the Formulas** — Step-by-step force balance derivations for both methods

---

## 9. PDF Lab Report Export — `pdf-export.js`

The PDF export module (`js/pdf-export.js`, 374 lines) generates a professional A4 lab report using **jsPDF**.

### Report Structure

| Section | Content |
|---------|---------|
| **Header Banner** | Navy gradient header with logo, title, method name, material pair, timestamp |
| **Summary Cards** | 5-card row: Trials, Mean μ, Reference Range, % Error, Range Check |
| **Formula Card** | LaTeX-style formula rendering for the selected method |
| **Trial Table** | Full data table with zebra-striped rows, all trial values, per-row μ, validation status |
| **Comparison Card** | Cross-method comparison (if both methods have data for the same material) |
| **Certification** | Signature block for student/instructor certification |
| **Footer** | Page numbers, generation timestamp, application credit |

### Colour Palette (Print-Ready)

```javascript
brandNavy  = [15, 23, 42]       // Header background
brandBlue  = [37, 99, 235]      // Accent blue
brandCyan  = [14, 116, 144]     // Secondary accent
brandAmber = [217, 119, 6]      // Warning
brandGreen = [22, 101, 52]      // Success
brandRed   = [185, 28, 28]      // Error
```

---

## 10. Visual & Animation Systems

### 10.1 Home Showcase Animation — `home-showcase.js`

A continuously looping cinematic animation (`js/home-showcase.js`, 744 lines) that demonstrates both experimental methods on the home page.

#### Animation Architecture

- Uses **GSAP timeline** (`gsap.timeline({ repeat: -1 })`) for seamless infinite looping
- Two alternating scenes with cross-fade transitions
- **Camera system** via native SVG `viewBox` interpolation for zoom/pan effects

#### Scene 1: Angle of Repose

1. Camera establishes wide view
2. Incline tilts from 0° → critical angle (GSAP rotation)
3. Protractor needle follows angle
4. Force vectors grow proportionally
5. Gravity counter-rotation keeps W vector pointing down
6. Block slides to end bracket on slip
7. Camera zooms into detail

#### Scene 2: Friction Plane

1. Cross-fade transition (opacity swap)
2. Fixed incline at 20°
3. Weights stack onto pan (GSAP stagger animation)
4. Block climbs uphill
5. String shortens, pulley rotates
6. Pan drops as weights increase

#### Scroll-Reveal Text System

- Uses `IntersectionObserver` to detect when text blocks enter the viewport
- Word-by-word opacity + blur reveal animation on scroll
- `data-sr` and `data-sr-text` attributes mark scroll-reveal targets

### 10.2 Splash Screen Background — `get-started-bg.js`

A dual-layer generative background (`js/get-started-bg.js`, 660 lines):

#### Layer 1: ColorBends (WebGL)

- Full-screen quad vertex shader
- Fragment shader with:
  - Warping fluid ribbon mathematics
  - Pointer (mouse/touch) parallax influence
  - Monochromatic colour palette (adapts to theme)
  - Iterative sinusoidal deformation
- `requestAnimationFrame` rendering loop

#### Layer 2: DotField (Canvas 2D)

- Grid of particles with:
  - Elastic cursor bulging effect
  - Sinusoidal wave motion
  - Luminous glow rendering
- Mobile-optimised (reduced particle count on small screens)

Both layers are destroyed on "Get Started" click to free GPU resources.

### 10.3 Staggered Menu — React Component

The fullscreen navigation menu (`StaggeredMenu.jsx`, 14 KB) is a React 19 component:

- **Staggered animation**: Menu items cascade in with GSAP stagger (0.05s delay each)
- **Fullscreen overlay**: Dark semi-transparent backdrop
- **Section links**: Routes to all application pages via hash navigation
- **Build**: Pre-bundled to `staggered-menu.bundle.js` (304 KB) + companion CSS
- **Mount**: Rendered into `#staggered-menu-root` container via `menu-init.jsx`

---

## 11. Theming System

### CSS Custom Properties

The application uses a comprehensive CSS variable system defined on `:root` and toggled via `[data-theme="light"]`:

| Category | Example Variables |
|----------|------------------|
| **Backgrounds** | `--bg-app`, `--bg-card`, `--bg-surface` |
| **Text** | `--text-primary`, `--text-secondary`, `--text-dim` |
| **Accents** | `--accent-blue`, `--accent-amber`, `--accent-green`, `--accent-purple`, `--accent-cyan`, `--accent-red` |
| **Borders** | `--border-subtle`, `--border-strong` |
| **Spacing** | `--space-sm`, `--space-md`, `--space-lg`, `--space-xl` |
| **Radii** | `--radius-sm`, `--radius-md`, `--radius-lg` |
| **Typography** | `--font-body`, `--font-mono` |
| **Diagrams** | `--diagram-line-faint`, `--diagram-line-strong`, `--showcase-grid` |

### Theme Toggle

Two toggle mechanisms:
1. **Splash screen**: Simple button (`#themeToggleSplash`) — ☀/🌙 icon toggle
2. **Navigation bar**: Animated day/night switch with clouds, stars, and sun/moon morphing (CSS-only animation from Uiverse.io by Galahhad)

### Typography

| Font | Usage |
|------|-------|
| **Lexend** | Primary body text |
| **Outfit** | Headings and UI elements |
| **Anton** | Splash screen title |
| **Google Sans Flex** | Supplementary variable font |
| **JetBrains Mono** | Monospace: readouts, data, code |
| **Cambria Math** / Times New Roman | Mathematical symbols (α, μ, θ, φ) via `.sym` class |

### Math Symbol Guardian

An inline script ensures Greek symbols (α, μ, θ, φ) are always wrapped in `<span class="sym">` for consistent serif rendering:

```javascript
el.innerHTML = el.innerHTML.replace(/(?![^<]*>)([αμθφ])/g, '<span class="sym">$1</span>');
```

---

## 12. Progressive Web App (PWA)

### Manifest (`manifest.json`)

```json
{
    "name": "Coefficient of Friction — Virtual Lab",
    "short_name": "μs Lab",
    "display": "standalone",
    "orientation": "any",
    "background_color": "#0b0b0f",
    "theme_color": "#0b0b0f",
    "start_url": "./index.html#home"
}
```

### Service Worker (`sw.js`)

**Strategy:** Stale-While-Revalidate

```
Cache Name: "mech-lab-v1"

Install → Pre-cache 16 core assets
Activate → Purge old caches
Fetch → 
    Cache hit? → Return cached + background refresh
    Cache miss? → Network fetch → cache + return
    Network fail? → Return cached fallback
```

**Cached Assets:**
- `index.html`, `styles.css`, `StaggeredMenu.css`
- All JS modules (simulate, data-log, compare, theory, pdf-export, home-showcase, get-started-bg)
- GSAP + ScrollTrigger + jsPDF
- Staggered menu bundle
- `manifest.json`

### Install Prompt

The app captures the `beforeinstallprompt` event and shows an "INSTALL" button in the navigation bar. iOS detection provides Safari-specific "Add to Home Screen" instructions.

---

## 13. Build System — Standalone HTML

The build script (`build-single-html.js`, 226 lines) compiles the entire application into a single self-contained HTML file (`friction_standalone.html`, ~2 MB).

### Build Pipeline

```
1. Read index.html
2. Base64-encode PWA icons → data URIs
3. Embed manifest as data URI
4. Replace icon <link> tags with data URIs
5. Inject additional contributor (Harshit Sankhe)
6. Read & concatenate CSS:
   - styles.css
   - StaggeredMenu.css  
   - Title centering fixes
7. Read all JS modules
8. Replace external <link rel="stylesheet"> → inline <style>
9. Replace external <script src="..."> → inline <script>
10. Base64-encode manual screenshots → inline <img> data URIs
11. Remove service worker registration
12. Write friction_standalone.html
```

**Result:** A completely self-contained HTML file that runs anywhere — no server, no dependencies, no network required.

---

## 14. UI Components & Custom Controls

### Radix-Style Custom Dropdowns

Material pair selection uses custom dropdown components (not native `<select>`):

```
┌─────────────────────────────────────────┐
│  ● Wood  on  ● Wood    ▼               │  ← Trigger button
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Material Surfaces (Block / Plane)      │  ← Label
│  ─────────────────────────────────────  │  ← Separator
│  ✓  ● ● Wood on Wood       μ ≈ 0.38   │  ← Selected item
│     ● ● Wood on Steel      μ ≈ 0.40   │
│     ● ● Glass on Glass     μ ≈ 0.95   │
│     ...                                 │
└─────────────────────────────────────────┘
```

- Hidden native `<select>` (`sr-only-select`) maintains form state
- Custom dropdown syncs via `change` event dispatching
- Keyboard (Escape) and click-outside dismissal
- ARIA attributes for accessibility

### Slider Controls

Each parameter slider has:
- Header with label and live value display
- Range input (`<input type="range">`)
- Precision stepper buttons (−/+) with 0.5 unit increments

### Animated Wave-Label Input Bars

Data log form inputs use a sophisticated animated label system:
- Each character of the label has staggered `transition-delay` (30ms apart)
- Labels float up on focus with a wave-like cascade
- Error states trigger `input-error-shake` CSS keyframe animation

### Toast Notification System

```javascript
showSimToast(title, desc, actionText, actionHash)
```

- Renders in `#simToastContainer`
- Auto-dismisses after 4 seconds with opacity/transform fade
- Optional action button that navigates to a hash route
- Used for: trial logging confirmation, apparatus reset notification

---

## 15. Mathematical Reference

### Method 1: Angle of Repose — Force Balance

```
Given: Block of weight W on plane inclined at angle α

Forces perpendicular to plane:    N = W cos α
Forces parallel to plane:
    Driving force (downhill):     W sin α
    Resisting force (friction):   f = μ × N = μ × W cos α

At limiting equilibrium:
    W sin α = μ × W cos α

Therefore:
    μ = sin α / cos α = tan α
```

### Method 2: Friction Plane — Force Balance

```
Given: Block of weight W on plane at angle θ, pulled uphill by force P

Forces perpendicular to plane:    N = W cos θ
Forces along plane (up-slope):    P
Forces along plane (down-slope):  W sin θ + f = W sin θ + μ × W cos θ

At limiting equilibrium (upward motion impending):
    P = W sin θ + μ × W cos θ

Solving for μ:
    μ = (P − W sin θ) / (W cos θ)

When θ = 0°:
    μ = P / W
```

### Percent Error Calculation

```
Reference midpoint:  μ_ref = (μ_low + μ_high) / 2
Mean experimental:   μ_exp = Σ(μᵢ) / n
Percent error:       %E = |μ_exp − μ_ref| / μ_ref × 100
```

---

## 16. Material Reference Data

Standard engineering reference values for static friction coefficients:

| Material Pair | μ (Low) | μ (High) | Midpoint | Notes |
|---------------|---------|----------|----------|-------|
| Wood on Wood | 0.25 | 0.50 | 0.375 | Common lab surfaces |
| Wood on Steel | 0.20 | 0.60 | 0.400 | Wide range due to wood variability |
| Wood on Glass | 0.20 | 0.50 | 0.350 | Smooth glass surface |
| Glass on Glass | 0.90 | 1.00 | 0.950 | Very high due to molecular adhesion |
| Steel on Steel (dry) | 0.50 | 0.80 | 0.650 | Clean, unlubricated surfaces |
| Steel on Steel (lub.) | 0.05 | 0.20 | 0.125 | Oil/grease lubrication |
| Aluminum on Aluminum | 1.05 | 1.35 | 1.200 | Unusually high — real, commonly cited |
| Rubber on Concrete | 0.60 | 0.85 | 0.725 | Tire-on-road analogue |
| Brass on Steel | 0.35 | 0.50 | 0.425 | Bearing material combination |

> **Note:** These are typical ranges from standard engineering references, not certified values for any specific sample.

---

## 17. Inter-Module Communication

Modules communicate via `window` global exports:

```
┌──────────────┐     window.getReposeValues()    ┌──────────────┐
│              │────────────────────────────────→ │              │
│  simulate.js │     window.getFrictionValues()   │  data-log.js │
│              │────────────────────────────────→ │              │
│              │     window.showSimToast()         │              │
│              │←──────────────────────────────── │              │
│              │     window.resetReposeApparatus() │              │
│              │←──────────────────────────────── │              │
│              │     window.resetFrictionApparatus()              │
│              │←──────────────────────────────── │              │
└──────────────┘                                  └──────────────┘
        │                                                │
        │        window.MATERIALS                        │
        │        window.MATERIAL_STYLES                  │
        │               ↓                                │
        │        ┌──────────────┐     window.getLogStats()
        │        │  compare.js  │←───────────────────────│
        │        └──────────────┘     window.getLogEntries()
        │               │             window.updateCompare()
        │               │                                │
        │        ┌──────────────┐                        │
        │        │ pdf-export.js │←──── window.getLogEntries()
        │        └──────────────┘     window.MATERIALS
        │
        │        window.initRadixDropdown()
        └──────→ (shared dropdown initializer)
```

---

## 18. Accessibility

| Feature | Implementation |
|---------|---------------|
| **ARIA Roles** | `role="tablist"`, `role="tab"`, `role="menuitemcheckbox"` on navigation and dropdowns |
| **ARIA States** | `aria-selected`, `aria-expanded`, `aria-checked`, `aria-controls`, `aria-haspopup` |
| **Keyboard Navigation** | Escape key closes dropdowns; stepper buttons have `aria-label` descriptions |
| **Semantic HTML** | `<nav>`, `<main>`, `<section>`, `<figure>`, `<figcaption>`, `<table>` |
| **Screen Reader** | Hidden native `<select>` elements (`sr-only-select`) maintain form semantics |
| **Theme Labels** | Theme toggle has `aria-label="Toggle light/dark theme"` |
| **Focus Management** | Error shake animation calls `el.focus()` on invalid inputs |

---

## 19. Performance Considerations

| Optimisation | Details |
|-------------|---------|
| **IIFE Encapsulation** | Each module's variables are scoped, preventing global pollution |
| **Lazy SVG Rendering** | Full SVG re-render only on material change; incremental updates on slider input |
| **CSS Transitions** | Block motion uses CSS transitions (GPU-composited) rather than JS animation |
| **WebGL Cleanup** | Splash background WebGL context and canvases are destroyed on app entry |
| **Font Preconnect** | `<link rel="preconnect">` for Google Fonts domains |
| **Service Worker Caching** | All core assets pre-cached for instant offline loads |
| **Image Lazy Loading** | Manual screenshots use `loading="lazy"` attribute |
| **GSAP will-change** | Animation properties use `willChange: 'transform, opacity'` for GPU acceleration |
| **Standalone Build** | Single-file build inlines all assets for zero-network deployments |
| **Debounced Updates** | Slider `input` events directly call update functions (native browser throttling) |

---

*This documentation was generated for the Coefficient of Friction Virtual Simulation project. For questions about specific implementation details, refer to the source files linked in the directory structure above.*
