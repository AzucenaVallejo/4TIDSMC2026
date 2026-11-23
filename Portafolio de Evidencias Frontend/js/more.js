
    const API_BASE = 'https://pureblood-starfish-happening.ngrok-free.dev/api';
    const AUTH_ENDPOINT = `${API_BASE}/Auth`;

    // ----- SEGURIDAD Y SESIÓN -----
    let accesoVerificado = false;
    let usuarioAutenticado = null;

    function crearModalConexion() {
        if (document.getElementById("connectionErrorModal")) return;

        const estilos = document.createElement("style");

        estilos.id = "connectionErrorStyles";
        estilos.textContent = `
            #connectionErrorModal {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(12, 24, 38, .82);
                backdrop-filter: blur(5px);
            }

            #connectionErrorModal.show {
                display: flex;
            }

            .connection-error-content {
                width: 100%;
                max-width: 420px;
                padding: 35px 28px;
                text-align: center;
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,.25);
            }

            .connection-error-icon {
                width: 70px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                border-radius: 50%;
                background: #fff0f0;
                color: #d9536f;
                font-size: 35px;
            }

            .connection-error-content h2 {
                margin-bottom: 12px;
                color: #263746;
                font-size: 21px;
                font-family: 'Poppins', sans-serif;
                font-weight: bold;
            }

            .connection-error-content p {
                margin: 0;
                color: #718096;
                line-height: 1.6;
                font-size: 14px;
            }

            .connection-error-content .connection-loading {
                margin-top: 20px;
                color: #3980a5;
                font-size: 13px;
                font-weight: 600;
            }
        `;

        document.head.appendChild(estilos);

        const modal = document.createElement("div");

        modal.id = "connectionErrorModal";
        modal.innerHTML = `
            <div class="connection-error-content">
                <div class="connection-error-icon">
                    <i class="ri-wifi-off-line"></i>
                </div>
                <h2>Error de conexión</h2>
                <p>
                    No fue posible establecer comunicación con el servidor.
                    Por seguridad, no puedes acceder a esta pantalla.
                </p>
                <div class="connection-loading">
                    Redirigiendo al inicio...
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function mostrarModalConexion() {
    ocultarSkeleton();

    crearModalConexion();

    const modal = document.getElementById(
        "connectionErrorModal"
    );

    modal.classList.add("show");

    document.body.style.visibility = "visible";
    document.body.style.overflow = "hidden";
}

// ---------------------------------------------------------
// VALIDACIÓN DE SESIÓN
// ---------------------------------------------------------

async function verificarAccesoInicial() {
    const controlador = new AbortController();

    const tiempoLimite = setTimeout(
        () => controlador.abort(),
        5000
    );

    try {
        const response = await fetch(`${AUTH_ENDPOINT}/me`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            signal: controlador.signal
        });

        if (response.status === 401 || response.status === 403) {
            accesoVerificado = false;
            ocultarSkeleton();

            window.location.replace("index.html");
            return false;
        }

        if (!response.ok) {
            throw new Error(
                `Error al validar la sesión: HTTP ${response.status}`
            );
        }

        usuarioAutenticado = await response.json();
        accesoVerificado = true;

        return true;

    } catch (error) {
        console.error(
            "No fue posible verificar la sesión:",
            error
        );

        accesoVerificado = false;

        ocultarSkeleton();
        mostrarModalConexion();

        setTimeout(() => {
            window.location.replace("index.html");
        }, 1800);

        return false;

    } finally {
        clearTimeout(tiempoLimite);
    }
}

    // ----- FIN SEGURIDAD -----


    /* ==========================================
       ESTADO DE LA PÁGINA
    ========================================== */

    const DEFAULT_PREFS = {
        theme: 'classic',
        accent: '#2A9D8F',
        textSize: 'medium',
        reducedMotion: false,
        compactDensity: false,
        notifyGeneral: true,
        notifyReminders: true,
        documentAlerts: true,
        language: 'es'
    };

    let currentPrefs = { ...DEFAULT_PREFS };
    let toastTimer = null;
    let preferencesLoaded = false;
    let savingPreferences = false;


    /* ==========================================
       ADAPTADOR ENTRE MORE Y PORTALTHEME
    ========================================== */

    function syncPreferencesFromGlobal(prefs) {
        currentPrefs = {
            theme: prefs.tema,
            accent: prefs.colorAcento,
            textSize: prefs.tamanoTexto,
            reducedMotion: prefs.reducirAnimaciones,
            compactDensity: prefs.densidadCompacta,
            notifyGeneral: prefs.notificacionesGenerales,
            notifyReminders: prefs.recordatoriosPerfil,
            documentAlerts: prefs.avisosEvidencias,
            language: prefs.idioma
        };

        return currentPrefs;
    }

    function syncPreferencesToGlobal() {
        return {
            tema: currentPrefs.theme,
            colorAcento: currentPrefs.accent,
            tamanoTexto: currentPrefs.textSize,
            reducirAnimaciones: currentPrefs.reducedMotion,
            densidadCompacta: currentPrefs.compactDensity,
            notificacionesGenerales: currentPrefs.notifyGeneral,
            recordatoriosPerfil: currentPrefs.notifyReminders,
            avisosEvidencias: currentPrefs.documentAlerts,
            idioma: currentPrefs.language
        };
    }

    /*
     * PortalTheme aplica las variables CSS.
     * Esta función únicamente sincroniza los controles
     * visuales de la página Más.
     */

    function applyInterfacePreferences() {
        const controls = {
            'pref-textSize': currentPrefs.textSize,
            'pref-reducedMotion': currentPrefs.reducedMotion,
            'pref-density': currentPrefs.compactDensity,
            'pref-accent': currentPrefs.accent,
            'pref-language': currentPrefs.language,
            'pref-notifyGeneral': currentPrefs.notifyGeneral,
            'pref-notifyReminders': currentPrefs.notifyReminders,
            'pref-documentAlerts': currentPrefs.documentAlerts
        };

        Object.entries(controls).forEach(([id, value]) => {
            const element = document.getElementById(id);

            if (!element) return;

            if (element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else {
                element.value = value;
            }
        });
    }


    /* ==========================================
       GALERÍA DE TEMAS
    ========================================== */

    function renderThemeGallery() {
        const container = document.getElementById(
            'themeGalleryContainer'
        );

        if (!container || !window.PortalTheme) return;

        const themes = window.PortalTheme.themes;

        container.innerHTML = themes.map(theme => `
            <button
                type="button"
                class="theme-card ${currentPrefs.theme === theme.id ? 'active' : ''}"
                data-theme="${theme.id}"
                onclick="selectTheme('${theme.id}')"
            >
                <div
                    class="theme-preview"
                    style="background:${theme.base}"
                >
                    <div
                        class="theme-preview-surface"
                        style="background:${theme.surface}"
                    ></div>

                    <div class="theme-preview-bottom">
                        <div
                            class="theme-preview-line"
                            style="background:${theme.text}"
                        ></div>

                        <div
                            class="theme-preview-accent"
                            style="background:${theme.accent}"
                        ></div>
                    </div>
                </div>

                <span class="theme-card-name">
                    ${theme.name}
                </span>

                <span class="theme-card-description">
                    ${theme.description}
                </span>

                <span
                    class="theme-check ${currentPrefs.theme === theme.id ? '' : 'hidden'} mt-2 text-xs font-bold"
                    style="color:var(--theme-primary)"
                >
                    <i class="ri-check-line"></i>
                    Seleccionado
                </span>
            </button>
        `).join('');
    }

    async function selectTheme(themeId) {
        if (!preferencesLoaded) return;

        const theme = window.PortalTheme.themes.find(
            item => item.id === themeId
        );

        if (!theme) return;

        const previous = { ...currentPrefs };

        currentPrefs.theme = themeId;
        currentPrefs.accent = theme.accent;

        // Aplicar visualmente mediante PortalTheme.
        const result = await window.PortalTheme.setTheme(themeId);

        if (result.ok) {
            syncPreferencesFromGlobal(result.preferences);
            applyInterfacePreferences();
            renderThemeGallery();

            setPreferencesStatus('Preferencias guardadas.');
        } else {
            syncPreferencesFromGlobal(
                window.PortalTheme.getPreferences()
            );

            applyInterfacePreferences();
            renderThemeGallery();

            showToast(
                'No se pudo guardar el tema seleccionado.'
            );

            setPreferencesStatus(
                'No se pudo guardar el cambio.'
            );
        }

        return previous;
    }


    /* ==========================================
       CARGAR PREFERENCIAS
    ========================================== */

    async function loadPreferences() {
        if (!window.PortalTheme) {
            throw new Error(
                'No se encontró el sistema global PortalTheme.'
            );
        }

        setPreferencesStatus('Cargando preferencias...');

        const result = await window.PortalTheme.load();

        if (!result.ok) {
            setPreferencesStatus(
                'No se pudieron cargar las preferencias.'
            );

            showToast(
                'No fue posible cargar tus preferencias.'
            );

            return false;
        }

        syncPreferencesFromGlobal(result.preferences);

        preferencesLoaded = true;

        applyInterfacePreferences();
        renderThemeGallery();

        setPreferencesStatus(
            'Preferencias sincronizadas con tu cuenta.'
        );

        return true;
    }


    /* ==========================================
       GUARDAR PREFERENCIAS
    ========================================== */

    async function savePreferences() {
        if (!preferencesLoaded || savingPreferences) return;

        savingPreferences = true;

        setPreferencesStatus('Guardando cambios...');

        try {
            const result = await window.PortalTheme.save(
                syncPreferencesToGlobal()
            );

            if (!result.ok) {
                throw result.error || new Error(
                    'No se pudieron guardar las preferencias.'
                );
            }

            syncPreferencesFromGlobal(result.preferences);

            setPreferencesStatus('Preferencias guardadas.');

            return true;

        } catch (error) {
            setPreferencesStatus(
                'No se pudo guardar el cambio.'
            );

            showToast(
                error.message || 'Error al guardar preferencias.'
            );

            return false;

        } finally {
            savingPreferences = false;
        }
    }


    /* ==========================================
       ACTUALIZAR PREFERENCIAS
    ========================================== */

    async function updatePreference(key, value) {
        if (!preferencesLoaded) return;

        const allowedKeys = [
            'theme',
            'accent',
            'textSize',
            'reducedMotion',
            'compactDensity',
            'notifyGeneral',
            'notifyReminders',
            'documentAlerts',
            'language'
        ];

        if (!allowedKeys.includes(key)) return;

        const previous = { ...currentPrefs };

        currentPrefs[key] = value;

        let result;

        try {
            if (key === 'theme') {
                const theme = window.PortalTheme.themes.find(
                    item => item.id === value
                );

                if (!theme) return;

                currentPrefs.accent = theme.accent;

                result = await window.PortalTheme.setTheme(value);

            } else if (key === 'accent') {
                result = await window.PortalTheme.setAccent(value);

            } else {
                result = await window.PortalTheme.save(
                    syncPreferencesToGlobal()
                );
            }

            if (!result.ok) {
                throw result.error || new Error(
                    'No se pudieron guardar las preferencias.'
                );
            }

            syncPreferencesFromGlobal(result.preferences);

            applyInterfacePreferences();

            if (key === 'theme' || key === 'accent') {
                renderThemeGallery();
            }

            setPreferencesStatus('Preferencias guardadas.');

            return previous;

        } catch (error) {
            // Recuperar los valores anteriores si falla el guardado.
            currentPrefs = previous;

            window.PortalTheme.apply(
                syncPreferencesToGlobal()
            );

            applyInterfacePreferences();
            renderThemeGallery();

            setPreferencesStatus(
                'No se pudo guardar el cambio.'
            );

            showToast(
                error.message || 'Error al guardar preferencias.'
            );

            return previous;
        }
    }


    /* ==========================================
       RESTABLECER PREFERENCIAS
    ========================================== */

    async function confirmResetPreferences() {
        closeResetModal();

        setPreferencesStatus(
            'Restableciendo preferencias...'
        );

        try {
            const result = await window.PortalTheme.reset();

            if (!result.ok) {
                throw result.error || new Error(
                    'No se pudieron restablecer las preferencias.'
                );
            }

            syncPreferencesFromGlobal(result.preferences);

            applyInterfacePreferences();
            renderThemeGallery();

            showToast('Preferencias restablecidas.');

            setPreferencesStatus(
                'Configuración predeterminada restaurada.'
            );

        } catch (error) {
            showToast(
                error.message ||
                'No se pudieron restablecer las preferencias.'
            );
        }
    }


    /* ==========================================
       API REQUEST
       Exclusivamente para reportes.
    ========================================== */

    async function apiRequest(path, options = {}) {

    const headers = new Headers(options.headers || {});

    headers.set('ngrok-skip-browser-warning', 'true');

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    if (
        options.body !== undefined &&
        options.body !== null &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof Blob) &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include',
        cache: 'no-store',
        headers
    });

    if (response.status === 401 || response.status === 403) {
        mostrarModalConexion();

        setTimeout(
            () => window.location.replace("index.html"),
            1800
        );

        throw new Error('La sesión no es válida.');
    }

    if (!response.ok) {
        const body = await response.json().catch(() => null);

        throw new Error(
            body?.detail ||
            body?.message ||
            `Error HTTP ${response.status}`
        );
    }

    if (response.status === 204) return null;

    return response.json().catch(() => null);
}


    /* ==========================================
       ESTADO DE PREFERENCIAS
    ========================================== */

    function setPreferencesStatus(message) {
        const element = document.getElementById(
            'preferencesStatus'
        );

        if (element) {
            element.textContent = message;
        }
    }


    /* ==========================================
       NAVEGACIÓN
    ========================================== */

    function navigateTo(viewId) {
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });

        const target = document.getElementById(
            `view-${viewId}`
        );

        if (target) {
            target.classList.add('active');
        }

        window.scrollTo({
            top: 0,
            behavior: currentPrefs.reducedMotion
                ? 'auto'
                : 'smooth'
        });
    }


    /* ==========================================
       MODALES
    ========================================== */

    function openResetModal() {
        document.getElementById('resetModal').classList.add('open');
    }

    function closeResetModal() {
        document.getElementById('resetModal').classList.remove('open');
    }

    function openReportModal() {
        document.getElementById('reportType').value = 'bug';
        document.getElementById('reportSubject').value = '';
        document.getElementById('reportDesc').value = '';

        document.getElementById('reportError').classList.add('hidden');

        document.getElementById('reportModal').classList.add('open');
    }

    function closeReportModal() {
        document.getElementById('reportModal').classList.remove('open');
    }


    /* ==========================================
       REPORTAR PROBLEMAS
    ========================================== */

    async function submitReport() {
        const type = document.getElementById('reportType').value;

        const subject = document
            .getElementById('reportSubject')
            .value.trim();

        const description = document
            .getElementById('reportDesc')
            .value.trim();

        const errorElement = document.getElementById('reportError');
        const button = document.getElementById('submitReportButton');

        errorElement.classList.add('hidden');

        if (!subject || !description) {
            errorElement.textContent =
                'Completa el asunto y la descripción.';

            errorElement.classList.remove('hidden');
            return;
        }

        if (subject.length > 150 || description.length > 2000) {
            errorElement.textContent =
                'El asunto o la descripción superan el límite permitido.';

            errorElement.classList.remove('hidden');
            return;
        }

        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            await apiRequest('/Reportes', {
                method: 'POST',
                body: JSON.stringify({
                    tipo: type,
                    asunto: subject,
                    descripcion: description
                })
            });

            closeReportModal();

            showToast('Reporte enviado correctamente.');

        } catch (error) {
            errorElement.textContent =
                error.message ||
                'No se pudo enviar el reporte.';

            errorElement.classList.remove('hidden');

        } finally {
            button.disabled = false;
            button.textContent = 'Enviar reporte';
        }
    }


    /* ==========================================
       NOTIFICACIONES
    ========================================== */

    function showToast(message) {
        const toast = document.getElementById(
            'toastNotification'
        );

        toast.textContent = message;
        toast.classList.add('show');

        clearTimeout(toastTimer);

        toastTimer = setTimeout(
            () => toast.classList.remove('show'),
            3200
        );
    }


    /* ==========================================
       PREGUNTAS FRECUENTES
    ========================================== */

    const faqsData = [
        {
            q: '¿Cómo edito mis datos personales?',
            a: 'Accede a la sección Perfil desde el menú principal para consultar y actualizar la información disponible.'
        },
        {
            q: '¿Qué documentos puedo subir?',
            a: 'Los formatos y límites permitidos dependen de cada apartado de evidencias. Consulta las indicaciones del formulario correspondiente.'
        },
        {
            q: '¿Cómo cambio los colores del portal?',
            a: 'Entra a Más, abre Personalización global y selecciona una paleta. También puedes personalizar el color de acento.'
        },
        {
            q: '¿Mis preferencias se guardan?',
            a: 'Las preferencias se envían al servicio de configuración de tu cuenta y se recuperan al volver a entrar.'
        },
        {
            q: '¿Cómo reporto un problema?',
            a: 'Abre Ayuda y soporte, selecciona Reportar un problema y completa el tipo, asunto y descripción.'
        }
    ];

    function renderFAQs(data) {
        const container = document.getElementById('faqContainer');
        const empty = document.getElementById('faqEmptyState');

        if (!data.length) {
            container.classList.add('hidden');
            empty.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        empty.classList.add('hidden');

        container.innerHTML = data.map(item => `
            <div class="faq-item border-b last:border-0"
                 style="border-color:var(--theme-border)">

                <button
                    type="button"
                    onclick="toggleFAQ(this)"
                    class="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-theme-surface-hover"
                >
                    <span class="text-sm font-semibold">
                        ${item.q}
                    </span>

                    <i
                        class="faq-icon ri-arrow-down-s-line text-xl"
                        style="color:var(--theme-text-muted)"
                    ></i>
                </button>

                <div class="faq-content px-5">
                    <p
                        class="pb-5 text-sm leading-relaxed"
                        style="color:var(--theme-text-muted)"
                    >
                        ${item.a}
                    </p>
                </div>
            </div>
        `).join('');
    }

    function toggleFAQ(button) {
        const item = button.closest('.faq-item');
        const wasOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item').forEach(element => {
            element.classList.remove('open');
        });

        if (!wasOpen) {
            item.classList.add('open');
        }
    }

    function filterFAQs() {
        const term = document
            .getElementById('faqSearchInput')
            .value.toLowerCase()
            .trim();

        const filtered = faqsData.filter(item =>
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term)
        );

        renderFAQs(filtered);
    }


    // ---------------------------------------------------------
// SKELETON LOADER
// ---------------------------------------------------------

let skeletonRemovalTimer = null;

function mostrarSkeleton() {
    if (document.querySelector(".skeleton-screen")) return;

    clearTimeout(skeletonRemovalTimer);

    document.body.classList.add("skeleton-loading");
    document.body.classList.remove("skeleton-ready");

    const skeleton = document.createElement("div");

    skeleton.className = "skeleton-screen";
    skeleton.setAttribute("aria-hidden", "true");

    skeleton.innerHTML = `
        <aside class="skeleton-sidebar">
            <div class="skeleton-block skeleton-logo"></div>

            ${Array.from({ length: 5 }, () => `
                <div class="skeleton-block skeleton-nav-item"></div>
            `).join("")}
        </aside>

        <main class="skeleton-main">
            <div class="skeleton-block skeleton-topbar"></div>
            <div class="skeleton-block skeleton-heading"></div>
            <div class="skeleton-block skeleton-banner"></div>

            <section class="skeleton-metrics">
                ${Array.from({ length: 3 }, () => `
                    <div class="skeleton-metric">
                        <div class="skeleton-block skeleton-metric-icon"></div>
                        <div class="skeleton-block skeleton-metric-value"></div>
                        <div class="skeleton-block skeleton-metric-label"></div>
                    </div>
                `).join("")}
            </section>

            <div class="skeleton-block skeleton-section-title"></div>

            <section class="skeleton-cards">
                ${Array.from({ length: 3 }, () => `
                    <article class="skeleton-card">
                        <div class="skeleton-card-top">
                            <div class="skeleton-block skeleton-card-icon"></div>
                            <div class="skeleton-block skeleton-card-actions"></div>
                        </div>

                        <div class="skeleton-block skeleton-card-title"></div>
                        <div class="skeleton-block skeleton-card-subtitle"></div>
                        <div class="skeleton-block skeleton-card-line"></div>
                        <div class="skeleton-block skeleton-card-footer"></div>
                    </article>
                `).join("")}
            </section>
        </main>
    `;

    document.body.appendChild(skeleton);
}

function ocultarSkeleton() {
    const skeleton = document.querySelector(".skeleton-screen");

    document.body.classList.remove("skeleton-loading");
    document.body.classList.add("skeleton-ready");

    if (!skeleton) return;

    skeleton.classList.add("is-leaving");

    const eliminar = () => {
        if (skeleton.isConnected) {
            skeleton.remove();
        }

        clearTimeout(skeletonRemovalTimer);
        skeletonRemovalTimer = null;
    };

    skeleton.addEventListener("transitionend", eliminar, {
        once: true
    });

    // Respaldo por si no se ejecuta la transición CSS.
    skeletonRemovalTimer = setTimeout(eliminar, 450);
}
    /* ==========================================
       INICIALIZACIÓN
    ========================================== */
/* ==========================================
   INICIALIZACIÓN
========================================== */

async function init() {
    document.body.style.visibility = "visible";

    // Mostrar skeleton inmediatamente.
    mostrarSkeleton();

    try {
        // 1. Validar sesión.
        const accesoPermitido = await verificarAccesoInicial();

        if (!accesoPermitido || !accesoVerificado) {
            return;
        }

        // 2. Renderizar contenido estático.
        renderFAQs(faqsData);

        // 3. Cargar preferencias del usuario.
        await loadPreferences();

    } catch (error) {
        console.error(
            "Error inicializando la página:",
            error
        );

    } finally {
        // Retirar el skeleton independientemente del resultado.
        ocultarSkeleton();
    }
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeResetModal();
        closeReportModal();
    }
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
        once: true
    });
} else {
    init();
}

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeResetModal();
            closeReportModal();
        }
    });

    document.addEventListener(
        'DOMContentLoaded',
        init
    );