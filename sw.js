const CACHE = "mech-lab-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./StaggeredMenu.css",
  "./js/menu-init.jsx",
  "./js/staggered-menu.bundle.js",
  "./js/staggered-menu.bundle.css",
  "./js/simulate.js",
  "./js/data-log.js",
  "./js/compare.js",
  "./js/theory.js",
  "./js/pdf-export.js",
  "./js/home-showcase.js",
  "./js/get-started-bg.js",
  "./js/gsap.min.js",
  "./js/ScrollTrigger.min.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
