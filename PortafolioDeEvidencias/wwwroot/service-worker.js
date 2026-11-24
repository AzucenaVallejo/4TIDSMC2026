
const CACHE_NAME = "portafolio-v1";

const ARCHIVOS = [
    "/",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/css/style.css",
    "/js/script.js"
];

// Instalar el Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ARCHIVOS);
        })
    );

    self.skipWaiting();
});

// Activar y limpiar cachés anteriores
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(nombres => {
            return Promise.all(
                nombres
                    .filter(nombre => nombre !== CACHE_NAME)
                    .map(nombre => caches.delete(nombre))
            );
        })
    );

    self.clients.claim();
});

// Consultar archivos guardados en caché
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(respuesta => {
                if (respuesta && respuesta.status === 200) {
                    const copia = respuesta.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copia);
                    });
                }

                return respuesta;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
