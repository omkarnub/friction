const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

// Read base template from original index.html (untouched)
let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

// 1. Base64 encode icons for standalone file
const icon192Base64 = fs.readFileSync(path.join(rootDir, 'icons', 'icon-192.png')).toString('base64');
const icon512Base64 = fs.readFileSync(path.join(rootDir, 'icons', 'icon-512.png')).toString('base64');
const iconMask192File = path.join(rootDir, 'icons', 'icon-maskable-192.png');
const iconMask512File = path.join(rootDir, 'icons', 'icon-maskable-512.png');
const iconMask192DataUri = fs.existsSync(iconMask192File)
  ? `data:image/png;base64,${fs.readFileSync(iconMask192File).toString('base64')}` : null;
const iconMask512DataUri = fs.existsSync(iconMask512File)
  ? `data:image/png;base64,${fs.readFileSync(iconMask512File).toString('base64')}` : null;

const icon192DataUri = `data:image/png;base64,${icon192Base64}`;
const icon512DataUri = `data:image/png;base64,${icon512Base64}`;

const manifestIcons = [
  {
    src: icon192DataUri,
    sizes: "192x192",
    type: "image/png",
    purpose: "any"
  },
  {
    src: icon512DataUri,
    sizes: "512x512",
    type: "image/png",
    purpose: "any"
  }
];

if (iconMask192DataUri) {
  manifestIcons.push({
    src: iconMask192DataUri,
    sizes: "192x192",
    type: "image/png",
    purpose: "maskable"
  });
}
if (iconMask512DataUri) {
  manifestIcons.push({
    src: iconMask512DataUri,
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable"
  });
}

// Create embedded manifest
const manifestObj = {
  name: "Coefficient of Friction — Virtual Simulation",
  short_name: "μs Sim",
  description: "Virtual Mechanics Simulation: Coefficient of Friction Experiment",
  start_url: "#home",
  scope: "./",
  display: "standalone",
  orientation: "any",
  background_color: "#0b0b0f",
  theme_color: "#0b0b0f",
  icons: manifestIcons
};
const manifestDataUri = `data:application/manifest+json;base64,${Buffer.from(JSON.stringify(manifestObj, null, 2)).toString('base64')}`;

// Replace icon & manifest tags in HTML using function replacers to prevent $ patterns
html = html.replace(/<link\s+rel="manifest"[^>]*>/i, () => `<link rel="manifest" href="${manifestDataUri}">`);
html = html.replace(/<link\s+rel="apple-touch-icon"[^>]*>/i, () => `<link rel="apple-touch-icon" href="${icon192DataUri}">`);
html = html.replace(/<link\s+rel="icon"\s+href="\.\/icons\/icon-192\.png"[^>]*>/i, () => `<link rel="icon" href="${icon192DataUri}" sizes="192x192">`);
html = html.replace(/<link\s+rel="icon"\s+href="\.\/icons\/icon-512\.png"[^>]*>/i, () => `<link rel="icon" href="${icon512DataUri}" sizes="512x512">`);

// 2. Add Harshit Sankhe to the contributors list
const harshitCard = `
          <!-- Harshit Sankhe -->
          <div class="team-card">
            <h3 class="team-member-name">Harshit Sankhe</h3>
            <div class="team-field">
              <span class="team-field-label">Roll Number:</span>
              <span class="team-field-val">28</span>
            </div>
            <div class="team-field">
              <span class="team-field-label">Branch:</span>
              <span class="team-field-val">Electronics &amp; Computer Science</span>
            </div>
          </div>`;

if (!html.includes('Harshit Sankhe')) {
  html = html.replace(/(<!-- Piyush Gupta -->[\s\S]*?<\/div>\s*<\/div>)/i, (match) => {
    return `${match}\n${harshitCard}`;
  });
}

// 3. Read and combine CSS files + add center alignment enhancements
const stylesCss = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const staggeredMenuCss = fs.readFileSync(path.join(rootDir, 'StaggeredMenu.css'), 'utf8');

const titleCenteringCss = `
/* ════════════════════════════════════════════════════════════════
   Hero Title Center-Alignment Guarantee (All Screen Sizes)
   ════════════════════════════════════════════════════════════════ */
.get-started-hero {
  text-align: center !important;
  align-items: center !important;
}

.get-started-title {
  text-align: center !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: auto !important;
  margin-right: auto !important;
  display: block !important;
}

.get-started-title .split-parent {
  text-align: center !important;
  display: inline-block !important;
  max-width: 100% !important;
  margin: 0 auto !important;
}

.get-started-title .split-word {
  display: inline-block !important;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .get-started-hero {
    text-align: center !important;
    align-items: center !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
  .get-started-title {
    font-size: clamp(1.85rem, 7.5vw, 3rem) !important;
    text-align: center !important;
    line-height: 1.15 !important;
    padding: 0 4px !important;
  }
  .get-started-title .split-parent {
    text-align: center !important;
    display: inline-block !important;
    max-width: 100% !important;
  }
  .get-started-topic-tag {
    text-align: center !important;
  }
}

@media (max-width: 480px) {
  .get-started-title {
    font-size: clamp(1.6rem, 8vw, 2.3rem) !important;
    text-align: center !important;
    line-height: 1.18 !important;
  }
  .get-started-title .split-parent {
    text-align: center !important;
    display: inline-block !important;
    max-width: 100% !important;
  }
}
`;

const combinedCss = `/* ════════════════════════════════════════════════════════════════
   Embedded Styles: styles.css + StaggeredMenu.css
   ════════════════════════════════════════════════════════════════ */
${stylesCss}

/* ════════════════════════════════════════════════════════════════
   Staggered Menu Styles
   ════════════════════════════════════════════════════════════════ */
${staggeredMenuCss}

${titleCenteringCss}
`;

// Replace stylesheet links with inline style tag using function replacer
const cssLinksRegex = /<link\s+rel="stylesheet"\s+href="styles\.css[^"]*">\s*<link\s+rel="stylesheet"\s+href="StaggeredMenu\.css[^"]*">/i;
if (!cssLinksRegex.test(html)) {
  console.error("Could not find CSS link tags to replace!");
  process.exit(1);
}
html = html.replace(cssLinksRegex, () => `<style>\n${combinedCss}\n  </style>`);

// 4. Read JavaScript files
const jsFiles = [
  { name: 'js/jspdf.umd.min.js', file: path.join(rootDir, 'js', 'jspdf.umd.min.js') },
  { name: 'js/gsap.min.js', file: path.join(rootDir, 'js', 'gsap.min.js') },
  { name: 'js/ScrollTrigger.min.js', file: path.join(rootDir, 'js', 'ScrollTrigger.min.js') },
  { name: 'js/home-showcase.js', file: path.join(rootDir, 'js', 'home-showcase.js') },
  { name: 'js/theory.js', file: path.join(rootDir, 'js', 'theory.js') },
  { name: 'js/simulate.js', file: path.join(rootDir, 'js', 'simulate.js') },
  { name: 'js/haptics.js', file: path.join(rootDir, 'js', 'haptics.js') },
  { name: 'js/data-log.js', file: path.join(rootDir, 'js', 'data-log.js') },
  { name: 'js/compare.js', file: path.join(rootDir, 'js', 'compare.js') },
  { name: 'js/pdf-export.js', file: path.join(rootDir, 'js', 'pdf-export.js') },
  { name: 'js/staggered-menu.bundle.js', file: path.join(rootDir, 'js', 'staggered-menu.bundle.js') },
  { name: 'js/get-started-bg.js', file: path.join(rootDir, 'js', 'get-started-bg.js') }
];

let inlinedScripts = '';
for (const item of jsFiles) {
  let content = fs.readFileSync(item.file, 'utf8');
  // Safe-guard against closing script tag in JS code
  content = content.replace(/<\/script/gi, '<\\/script');
  inlinedScripts += `\n  <!-- ══════════════ [Inlined: ${item.name}] ══════════════ -->\n  <script>\n${content}\n  </script>\n`;
}

// Replace external script tags section using a function replacer so $& in JS code is NOT replaced!
const scriptTagsRegex = /<!-- ════════════════════════════════════════════════════════════════\s*Scripts\s*════════════════════════════════════════════════════════════════ -->[\s\S]*?<script src="js\/get-started-bg\.js[^"]*"><\/script>/i;

if (!scriptTagsRegex.test(html)) {
  console.error("Could not find script tags to replace!");
  process.exit(1);
}

html = html.replace(scriptTagsRegex, () => `<!-- ════════════════════════════════════════════════════════════════\n       Inlined Libraries & Modules (Single Self-Contained Bundle)\n       ════════════════════════════════════════════════════════════════ -->\n${inlinedScripts}`);

// 5. Ensure triggerHeroSplitText always centers the hero title lines on any screen
html = html.replace(/function triggerHeroSplitText\(\) \{[\s\S]*?const enterBtn = document\.getElementById\('enterAppBtn'\);/i, (match) => {
  // Replace textAlign: 'left' with textAlign: 'center'
  return match.replace(/textAlign:\s*'left'/g, "textAlign: 'center'");
});

// 6. Update service worker registration to run only on http/https so file:// protocol doesn't throw a console error
html = html.replace(
  'if ("serviceWorker" in navigator) {',
  'if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {'
);

// 7. Base64-inline manual screenshots so standalone file displays all manual images self-contained
const manualDir = path.join(rootDir, 'assets', 'manual');
if (fs.existsSync(manualDir)) {
  const manualFiles = fs.readdirSync(manualDir).filter(f => f.endsWith('.png'));
  for (const file of manualFiles) {
    const fullPath = path.join(manualDir, file);
    const b64 = fs.readFileSync(fullPath).toString('base64');
    const dataUri = `data:image/png;base64,${b64}`;
    const pattern = new RegExp(`src=["'](?:\\./)?assets/manual/${file}["']`, 'g');
    html = html.replace(pattern, () => `src="${dataUri}"`);
  }
  console.log(`Inlined ${manualFiles.length} manual screenshots into standalone HTML.`);
}

// Write to friction_standalone.html
fs.writeFileSync(path.join(rootDir, 'friction_standalone.html'), html, 'utf8');
console.log('Successfully created friction_standalone.html (Size: ' + html.length + ' bytes)');

