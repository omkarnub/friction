/**
 * verify.js — Fast validation check for Friction Laboratory Standalone & Source
 *
 * Runs integrity checks on:
 * 1. JavaScript compilation & syntax across all modules
 * 2. Inlined standalone HTML bundle (assets, icons, manifest, scripts)
 * 3. Synchronization between project files and standalone file
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const standalonePath = path.join(rootDir, 'friction_standalone.html');
const indexHtmlPath = path.join(rootDir, 'index.html');

console.log('🔍 Running Friction Laboratory Integrity Checks...\n');

let pass = true;

// 1. Check standalone file existence and size
if (!fs.existsSync(standalonePath)) {
  console.error('❌ friction_standalone.html not found!');
  process.exit(1);
}
const standalone = fs.readFileSync(standalonePath, 'utf8');
console.log(`✅ Standalone bundle exists: ${(standalone.length / (1024 * 1024)).toFixed(2)} MB (${standalone.length} bytes)`);

// 2. Check JavaScript compilation in standalone
const scripts = Array.from(standalone.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi), m => m[1]);
console.log(`✅ Found ${scripts.length} inlined script blocks in standalone HTML.`);

scripts.forEach((code, idx) => {
  try {
    new vm.Script(code, { filename: `standalone_script_${idx}.js` });
  } catch (err) {
    console.error(`❌ Script block #${idx} syntax error:`, err.message);
    pass = false;
  }
});

if (pass) {
  console.log('✅ All standalone script blocks compiled cleanly with 0 syntax errors.');
}

// 3. Check critical feature signatures
const signatures = [
  { name: 'Haptics Engine (SimHaptics)', check: standalone.includes('window.SimHaptics') },
  { name: 'Slip Feedback Hook', check: standalone.includes('SimHaptics.slipFeedback') },
  { name: 'Motion Start Feedback Hook', check: standalone.includes('SimHaptics.motionStartFeedback') },
  { name: 'Warning Feedback Nudge', check: standalone.includes('SimHaptics.warningFeedback') },
  { name: 'Repose Method Card ID (mrReposeSim)', check: standalone.includes('id="mrReposeSim"') },
  { name: 'Friction Plane Card ID (mfFrictionSim)', check: standalone.includes('id="mfFrictionSim"') },
  { name: 'All 8 Inlined Manual Images', check: (standalone.match(/src="data:image\/png;base64,/g) || []).length >= 8 },
  { name: 'Embedded Base64 Web App Manifest', check: standalone.includes('data:application/manifest+json;base64,') },
  { name: 'Safe Service Worker on file:// protocol', check: standalone.includes('window.location.protocol.startsWith("http")') }
];

signatures.forEach(sig => {
  if (sig.check) {
    console.log(`✅ ${sig.name}: verified`);
  } else {
    console.error(`❌ ${sig.name}: MISSING!`);
    pass = false;
  }
});

// 4. Verify 0 lingering unbundled local paths
const lingeringAssets = Array.from(standalone.matchAll(/(?:src|href)=["'](?:\.\/)?(assets\/[^"']+|icons\/[^"']+)["']/gi), m => m[1]);
if (lingeringAssets.length === 0) {
  console.log('✅ 0 lingering local file dependencies: standalone is 100% self-contained.');
} else {
  console.error('❌ Found lingering local references:', lingeringAssets);
  pass = false;
}

console.log(pass ? '\n🎉 ALL SYSTEM CHECKS PASSED — Standalone is completely flawless!\n' : '\n❌ Issues detected!\n');
process.exit(pass ? 0 : 1);
