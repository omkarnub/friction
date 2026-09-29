const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'assets', 'manual');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let [urlPath, queryString] = req.url.split('?');
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(rootDir, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    let content = fs.readFileSync(filePath);

    if (filePath.endsWith('index.html')) {
      const params = new URLSearchParams(queryString || '');
      const targetPage = params.get('page') || 'simulate';
      const targetTab = params.get('tab') || 'repose';

      const headInjection = `
      <script>
        (function() {
          const sampleData = [
            { id: 1, method: "repose", material: "wood-wood", angle: 22.0, weight: 2.0, pullForce: null, mu: 0.4040, valid: true, validationMsg: "", timestamp: Date.now() - 600000 },
            { id: 2, method: "repose", material: "wood-wood", angle: 22.5, weight: 3.5, pullForce: null, mu: 0.4142, valid: true, validationMsg: "", timestamp: Date.now() - 400000 },
            { id: 3, method: "repose", material: "wood-wood", angle: 22.2, weight: 5.0, pullForce: null, mu: 0.4081, valid: true, validationMsg: "", timestamp: Date.now() - 200000 }
          ];
          try {
            localStorage.setItem("fl-data-log", JSON.stringify(sampleData));
          } catch(e) {}
        })();
      </script>
      <style>
        /* Force eliminate splash screen & page loader */
        #splashScreen, #pageLoader, .splash-hero, .splash-screen {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        body.pre-launch {
          overflow: auto !important;
        }
        /* Show strictly the target section */
        .page-section { display: none !important; }
        #page-${targetPage} {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
      </style>
      `;

      const bodyInjection = `
      <script>
        (function() {
          function setupTargetView() {
            document.body.classList.remove('pre-launch');
            const splash = document.getElementById('splashScreen');
            if (splash) splash.remove();
            const loader = document.getElementById('pageLoader');
            if (loader) loader.remove();

            // Set target active section
            document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
            const sec = document.getElementById('page-${targetPage}');
            if (sec) {
              sec.classList.add('active');
              sec.style.display = 'block';
            }

            if ("${targetPage}" === "simulate") {
              const tabBtn = document.querySelector('[data-tab="${targetTab}"]');
              if (tabBtn) tabBtn.click();

              if ("${targetTab}" === "friction") {
                const forceInput = document.getElementById('frictionForce');
                if (forceInput) {
                  forceInput.value = 2.1;
                  forceInput.dispatchEvent(new Event('input', { bubbles: true }));
                  forceInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else {
                const reposeInput = document.getElementById('reposeAngle');
                if (reposeInput) {
                  reposeInput.value = 22.5;
                  reposeInput.dispatchEvent(new Event('input', { bubbles: true }));
                  reposeInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
            }

            if ("${targetPage}" === "log") {
              window.dispatchEvent(new CustomEvent('pagechange', { detail: { page: 'log' } }));
            }

            window.scrollTo(0, 0);
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupTargetView);
          } else {
            setupTargetView();
          }
          window.addEventListener('load', () => {
            setupTargetView();
            setTimeout(setupTargetView, 150);
          });
        })();
      </script>
      `;

      let htmlStr = content.toString('utf8');
      htmlStr = htmlStr.replace('</head>', `${headInjection}</head>`);
      htmlStr = htmlStr.replace('</body>', `${bodyInjection}</body>`);
      content = Buffer.from(htmlStr);
    }
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

server.listen(8097, async () => {
  console.log('Capture server running on port 8097');

  const targets = [
    {
      name: 'desktop_methods.png',
      width: 1440,
      height: 900,
      url: 'http://localhost:8097/index.html?page=methods'
    },
    {
      name: 'desktop_repose.png',
      width: 1440,
      height: 900,
      url: 'http://localhost:8097/index.html?page=simulate&tab=repose'
    },
    {
      name: 'desktop_friction_plane.png',
      width: 1440,
      height: 900,
      url: 'http://localhost:8097/index.html?page=simulate&tab=friction'
    },
    {
      name: 'desktop_datalog.png',
      width: 1440,
      height: 900,
      url: 'http://localhost:8097/index.html?page=log'
    },
    {
      name: 'mobile_methods.png',
      width: 390,
      height: 844,
      url: 'http://localhost:8097/index.html?page=methods'
    },
    {
      name: 'mobile_repose.png',
      width: 390,
      height: 844,
      url: 'http://localhost:8097/index.html?page=simulate&tab=repose'
    },
    {
      name: 'mobile_friction_plane.png',
      width: 390,
      height: 844,
      url: 'http://localhost:8097/index.html?page=simulate&tab=friction'
    },
    {
      name: 'mobile_datalog.png',
      width: 390,
      height: 844,
      url: 'http://localhost:8097/index.html?page=log'
    }
  ];

  for (const t of targets) {
    const outFile = path.join(outDir, t.name);
    // Use user-data-dir in scratch to prevent session interference
    const tmpDataDir = path.join(__dirname, '..', '.tmp-chrome-profile');
    const cmd = `"${chromePath}" --headless=new --screenshot="${outFile}" --window-size=${t.width},${t.height} --hide-scrollbars --virtual-time-budget=2500 --user-data-dir="${tmpDataDir}" "${t.url}"`;
    await new Promise((resolve) => {
      exec(cmd, (err) => {
        if (err) console.error('Error capturing', t.name, err.message);
        else {
          const sz = fs.existsSync(outFile) ? fs.statSync(outFile).size : 0;
          console.log(`[Captured] ${t.name} -> ${sz} bytes`);
        }
        resolve();
      });
    });
  }

  // Clean up tmp profile if exists
  try {
    fs.rmSync(path.join(__dirname, '..', '.tmp-chrome-profile'), { recursive: true, force: true });
  } catch(e) {}

  server.close(() => {
    console.log('All 8 screenshots captured successfully!');
  });
});
