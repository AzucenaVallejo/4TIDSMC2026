
"use strict";

const CACHE_NAME = "portal-evidencias-v1";

const ARCHIVOS_ESTATICOS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/img/PortalEvidenciasLogo.png"
];

// INSTALACIÓN

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ARCHIVOS_ESTATICOS);
        })
    );

    self.skipWaiting();
});

// ACTIVACIÓN

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// SOLICITUDES

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    // Solo solicitudes GET del mismo origen
    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    // No almacenar respuestas de autenticación ni API
    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.includes("/Auth")
    ) {
        return;
    }

    // Navegación: intentar red y recurrir a caché
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cached = await caches.match(request);

                return cached || caches.match("/index.html");
            })
        );

        return;
    }

    // Recursos estáticos: caché y actualización de red
    event.respondWith(
        caches.match(request).then(cached => {
            const networkRequest = fetch(request)
                .then(response => {
                    if (
                        response.ok &&
                        response.type === "basic"
                    ) {
                        const copy = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, copy);
                        });
                    }

                    return response;
                });

            return cached || networkRequest;
        })
    );
});
