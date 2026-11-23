/* ============================================================
   CONFIGURACIÓN Y ESTADO REAL DE LA API
   ============================================================ */

const API_URL = 'https://pureblood-starfish-happening.ngrok-free.dev';

const API_TIMEOUT = 20000;

let accesoVerificado = false;
let redireccionEnProceso = false;
let sessionData = null;

const userProfileState = {
    fullName: '',
    phone: '',
    email: '',
    curp: '',
    avatarUrl: null
};

const documentTypes = {
    acta: 2,
    curp: 3,
    ine: 4
};

const tiposDocumento = {
    2: 'acta',
    3: 'curp',
    4: 'ine'
};

const documentsState = {
    acta: {
        title: 'Acta de nacimiento',
        status: 'pending',
        fileType: 'pdf',
        fileUrl: null,
        rawFile: null,
        id: null,
        fechaSubida: null
    },
    curp: {
        title: 'CURP',
        status: 'pending',
        fileType: 'pdf',
        fileUrl: null,
        rawFile: null,
        id: null,
        fechaSubida: null
    },
    ine: {
        title: 'INE',
        status: 'pending',
        fileType: 'image',
        fileUrl: null,
        rawFile: null,
        id: null,
        fechaSubida: null
    }
};

let currentDocKey = 'acta';
let mediaStream = null;
let originalLoadedImage = null;
let currentRotation = 0;
let activeFilter = 'normal';

let currentImageObjectUrl = null;
let currentViewerUrl = null;
let currentCameraImageUrl = null;

let isSavingDocument = false;
let isDeletingDocument = false;
let isLoggingOut = false;

let skeletonStyleElement = null;

/* ============================================================
   SKELETON LOADING Y TRANSICIONES
   ============================================================ */

const SKELETON_TARGETS = [
    'profileFullName',
    'profileEmail',
    'infoFullName',
    'infoPhone',
    'infoEmail',
    'infoCurp',
    'badgeIconActa',
    'badgeTypeActa',
    'statusActa',
    'btnTextActa',
    'badgeIconCurp',
    'badgeTypeCurp',
    'statusCurp',
    'btnTextCurp',
    'badgeIconIne',
    'badgeTypeIne',
    'statusIne',
    'btnTextIne'
];

function instalarEstilosCarga() {
    if (document.getElementById('portalLoadingStyles')) return;

    const style = document.createElement('style');
    style.id = 'portalLoadingStyles';

    style.textContent = `
        /* Capa que impide mostrar partes de la interfaz por separado */
        body.pe-app-booting {
            overflow: hidden !important;
        }

        body.pe-app-booting > :not(#peInitialLoader) {
            visibility: hidden !important;
        }

        #peInitialLoader {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: grid;
            grid-template-columns: 260px minmax(0, 1fr);
            background: var(--bg, #f5f7fa);
            opacity: 1;
            visibility: visible;
            transition: opacity .38s ease, visibility .38s ease;
        }

        #peInitialLoader.pe-loader-exit {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        .pe-loader-sidebar {
            padding: 28px 20px;
            background: var(--sidebar-bg, #fff);
            border-right: 1px solid rgba(128,128,128,.12);
        }

        .pe-loader-brand {
            width: 145px;
            height: 34px;
            margin-bottom: 48px;
        }

        .pe-loader-nav {
            display: grid;
            gap: 19px;
        }

        .pe-loader-nav-item {
            height: 17px;
            width: 85%;
        }

        .pe-loader-nav-item:nth-child(2n) {
            width: 68%;
        }

        .pe-loader-main {
            min-width: 0;
            padding: 36px clamp(20px, 4vw, 55px);
        }

        .pe-loader-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 38px;
        }

        .pe-loader-title {
            width: 230px;
            height: 30px;
        }

        .pe-loader-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
        }

        .pe-loader-profile {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 24px;
            margin-bottom: 28px;
            border-radius: 14px;
            background: var(--card-bg, #fff);
            border: 1px solid rgba(128,128,128,.12);
        }

        .pe-loader-profile-avatar {
            width: 76px;
            height: 76px;
            flex: 0 0 76px;
            border-radius: 50%;
        }

        .pe-loader-profile-info {
            flex: 1;
            display: grid;
            gap: 12px;
        }

        .pe-loader-line {
            height: 14px;
            max-width: 100%;
        }

        .pe-loader-line.short {
            width: 35%;
        }

        .pe-loader-line.medium {
            width: 58%;
        }

        .pe-loader-section-title {
            width: 190px;
            height: 22px;
            margin-bottom: 18px;
        }

        .pe-loader-cards {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
        }

        .pe-loader-card {
            min-height: 155px;
            padding: 22px;
            border-radius: 14px;
            background: var(--card-bg, #fff);
            border: 1px solid rgba(128,128,128,.12);
        }

        .pe-loader-card-icon {
            width: 42px;
            height: 42px;
            margin-bottom: 20px;
            border-radius: 10px;
        }

        .pe-loader-card-line {
            height: 13px;
            width: 75%;
            margin-bottom: 12px;
        }

        .pe-loader-card-line pe-loader-placeholder {
            height: 13px;
            width: 75%;
            margin-bottom: 12px;
        }

        .pe-skeleton {
            position: relative !important;
            color: transparent !important;
            background: rgba(128,128,128,.13) !important;
            border-radius: 5px !important;
            overflow: hidden !important;
            user-select: none !important;
            pointer-events: none !important;
            min-height: 1em;
        }

        .pe-skeleton::after,
        .pe-loader-placeholder::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,.48),
                transparent
            );
            animation: peSkeletonShimmer 1.35s infinite;
        }

        .pe-loader-placeholder {
            position: relative;
            overflow: hidden;
            background: rgba(128,128,128,.13);
            border-radius: 7px;
        }

        @keyframes peSkeletonShimmer {
            100% {
                transform: translateX(100%);
            }
        }

        .pe-content-ready {
            animation: peContentAppear .35s ease both;
        }

        @keyframes peContentAppear {
            from {
                opacity: 0;
                transform: translateY(5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .pe-image-loading {
            opacity: 0;
            transition: opacity .3s ease;
        }

        .pe-image-ready {
            opacity: 1;
        }

        @media (max-width: 900px) {
            #peInitialLoader {
                grid-template-columns: 80px minmax(0, 1fr);
            }

            .pe-loader-sidebar {
                padding: 24px 14px;
            }

            .pe-loader-brand {
                width: 42px;
            }

            .pe-loader-nav-item {
                width: 100%;
            }

            .pe-loader-cards {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 600px) {
            #peInitialLoader {
                grid-template-columns: 1fr;
            }

            .pe-loader-sidebar {
                display: none;
            }

            .pe-loader-main {
                padding: 24px 16px;
            }

            .pe-loader-profile {
                padding: 16px;
            }

            .pe-loader-profile-avatar {
                width: 55px;
                height: 55px;
                flex-basis: 55px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .pe-skeleton::after,
            .pe-loader-placeholder::after {
                animation: none;
            }

            #peInitialLoader,
            .pe-content-ready,
            .pe-image-loading {
                transition: none;
                animation: none;
            }
        }
    `;

    document.head.appendChild(style);
    skeletonStyleElement = style;
}

function crearLoaderInicial() {
    if (document.getElementById('peInitialLoader')) return;

    const loader = document.createElement('div');
    loader.id = 'peInitialLoader';

    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Cargando la interfaz');

    loader.innerHTML = `
        <aside class="pe-loader-sidebar">
            <div class="pe-loader-brand pe-loader-placeholder"></div>

            <div class="pe-loader-nav">
                <div class="pe-loader-nav-item pe-loader-placeholder"></div>
                <div class="pe-loader-nav-item pe-loader-placeholder"></div>
                <div class="pe-loader-nav-item pe-loader-placeholder"></div>
                <div class="pe-loader-nav-item pe-loader-placeholder"></div>
                <div class="pe-loader-nav-item pe-loader-placeholder"></div>
                <div class="pe-loader-nav-item pe-loader-placeholder"></div>
            </div>
        </aside>

        <main class="pe-loader-main">
            <div class="pe-loader-header">
                <div class="pe-loader-title pe-loader-placeholder"></div>
                <div class="pe-loader-avatar pe-loader-placeholder"></div>
            </div>

            <section class="pe-loader-profile">
                <div class="pe-loader-profile-avatar pe-loader-placeholder"></div>

                <div class="pe-loader-profile-info">
                    <div class="pe-loader-line medium pe-loader-placeholder"></div>
                    <div class="pe-loader-line short pe-loader-placeholder"></div>
                </div>
            </section>

            <div class="pe-loader-section-title pe-loader-placeholder"></div>

            <section class="pe-loader-cards">
                <div class="pe-loader-card">
                    <div class="pe-loader-card-icon pe-loader-placeholder"></div>
                    <div class="pe-loader-card-line pe-loader-placeholder"></div>
                    <div class="pe-loader-card-line pe-loader-placeholder"></div>
                </div>

                <div class="pe-loader-card">
                    <div class="pe-loader-card-icon pe-loader-placeholder"></div>
                    <div class="pe-loader-card-line pe-loader-placeholder"></div>
                    <div class="pe-loader-card-line pe-loader-placeholder"></div>
                </div>

                <div class="pe-loader-card">
                    <div class="pe-loader-card-icon pe-loader-placeholder"></div>
                    <div class="pe-loader-card-line pe-loader-placeholder"></div>
                    <div class="pe-loader-card-line pe-loader-placeholder"></div>
                </div>
            </section>
        </main>
    `;

    document.body.appendChild(loader);
}

function finalizarCargaInicial() {
    const loader = document.getElementById('peInitialLoader');

    if (!loader) {
        document.body.classList.remove('pe-app-booting');
        return;
    }

    // Primero habilitamos toda la interfaz real al mismo tiempo.
    document.body.classList.remove('pe-app-booting');

    // Después retiramos la capa de skeleton con una transición.
    requestAnimationFrame(() => {
        loader.classList.add('pe-loader-exit');

        setTimeout(() => {
            loader.remove();
            document.body.style.overflow = '';
        }, 400);
    });
}

// Se ejecuta antes de DOMContentLoaded para evitar que la interfaz
// real aparezca parcialmente durante el arranque.
document.body.classList.add('pe-app-booting');
instalarEstilosCarga();
crearLoaderInicial();

function activarSkeleton(element) {
    if (!element) return;

    element.classList.add('pe-skeleton');
    element.setAttribute('aria-busy', 'true');
}

function retirarSkeleton(element, mostrar = true) {
    if (!element) return;

    element.classList.remove('pe-skeleton');
    element.removeAttribute('aria-busy');

    if (mostrar) {
        element.classList.add('pe-content-ready');
    }
}

function prepararSkeletons() {
    instalarEstilosCarga();

    SKELETON_TARGETS.forEach(id => {
        activarSkeleton(document.getElementById(id));
    });

    const avatar = document.getElementById('userAvatarImg');

    if (avatar) {
        avatar.classList.add('pe-image-loading');
    }
}

function finalizarSkeletons(ids) {
    ids.forEach(id => {
        retirarSkeleton(document.getElementById(id));
    });
}

function finalizarSkeletonsPerfil() {
    finalizarSkeletons([
        'profileFullName',
        'profileEmail',
        'infoFullName',
        'infoPhone',
        'infoEmail',
        'infoCurp'
    ]);
}

function finalizarSkeletonsDocumentos() {
    finalizarSkeletons([
        'badgeIconActa',
        'badgeTypeActa',
        'statusActa',
        'btnTextActa',
        'badgeIconCurp',
        'badgeTypeCurp',
        'statusCurp',
        'btnTextCurp',
        'badgeIconIne',
        'badgeTypeIne',
        'statusIne',
        'btnTextIne'
    ]);
}

function finalizarTodosLosSkeletons() {
    SKELETON_TARGETS.forEach(id => {
        retirarSkeleton(document.getElementById(id));
    });
}

/* ============================================================
   PETICIONES HTTP CENTRALIZADAS
   ============================================================ */

async function apiFetch(endpoint, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, options.timeout ?? API_TIMEOUT);

    const externalSignal = options.signal;

    const abortFromExternal = () => controller.abort();

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener(
                'abort',
                abortFromExternal,
                { once: true }
            );
        }
    }

    try {
        const headers = new Headers(options.headers || {});

        // Encabezado necesario para evitar la página de advertencia de ngrok.
        headers.set('ngrok-skip-browser-warning', 'true');

        const body = options.body;

        if (
            body &&
            !(body instanceof FormData) &&
            !(body instanceof Blob) &&
            !headers.has('Content-Type')
        ) {
            headers.set('Content-Type', 'application/json');
        }

        const fetchOptions = {
            ...options,
            headers,
            credentials: 'include',
            signal: controller.signal
        };

        delete fetchOptions.timeout;

        const response = await fetch(
            `${API_URL}${endpoint}`,
            fetchOptions
        );

        if (response.status === 401) {
            throw new Error(
                'Tu sesión ha expirado. Inicia sesión nuevamente.'
            );
        }

        return response;

    } catch (error) {
        if (error.name === 'AbortError') {
            if (externalSignal?.aborted) {
                throw error;
            }

            throw new Error(
                'La solicitud tardó demasiado. Comprueba tu conexión.'
            );
        }

        throw error;

    } finally {
        clearTimeout(timeout);

        if (externalSignal) {
            externalSignal.removeEventListener(
                'abort',
                abortFromExternal
            );
        }
    }
}

async function getErrorMessage(response) {
    try {
        const data = await response.json();

        return (
            data.mensaje ||
            data.title ||
            data.detail ||
            `Error HTTP ${response.status}.`
        );

    } catch {
        return `Error HTTP ${response.status}.`;
    }
}

async function leerRespuestaJSON(response) {
    if (response.status === 204) return null;

    const texto = await response.text();

    if (!texto.trim()) return null;

    try {
        return JSON.parse(texto);
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }
}

function esErrorSesion(error) {
    return error?.message?.includes('sesión ha expirado') === true;
}

function manejarErrorOperacion(error, contexto) {
    console.error(`Error en ${contexto}:`, error);

    if (esErrorSesion(error)) {
        mostrarModalAcceso();
    }
}

/* ============================================================
   VERIFICACIÓN DE CONEXIÓN Y AUTENTICACIÓN
   ============================================================ */

function mostrarModalErrorConexion() {
    if (redireccionEnProceso) return;
    finalizarCargaInicial();
    redireccionEnProceso = true;

    document.body.style.visibility = 'visible';

    const modal = document.createElement('div');

    modal.id = 'connectionErrorModal';
    modal.className = 'auth-modal-overlay';

    modal.innerHTML = `
        <div class="auth-modal">
            <div class="auth-modal-icon">
                <i class="ri-error-warning-line"></i>
            </div>
            <h2>Error de conexión</h2>
            <p>
                No fue posible establecer comunicación con el servidor.
                Por seguridad, no puedes acceder al sistema.
            </p>
            <span class="auth-modal-message">
                Redirigiendo al inicio...
            </span>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        window.location.replace('index.html');
    }, 1800);
}

function mostrarModalAcceso() {
    if (redireccionEnProceso) return;
    finalizarCargaInicial();
    redireccionEnProceso = true;

    document.body.style.visibility = 'visible';

    const modal = document.createElement('div');

    modal.id = 'accessErrorModal';
    modal.className = 'auth-modal-overlay';

    modal.innerHTML = `
        <div class="auth-modal">
            <div class="auth-modal-icon">
                <i class="ri-lock-line"></i>
            </div>
            <h2>Acceso restringido</h2>
            <p>
                Tu sesión no es válida o ha expirado.
                Inicia sesión nuevamente para continuar.
            </p>
            <span class="auth-modal-message">
                Redirigiendo al inicio de sesión...
            </span>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        window.location.replace('login.html');
    }, 1800);
}

async function verificarAccesoInicial() {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 5000);

    try {
        const response = await fetch(
            `${API_URL}/api/Auth/me`,
            {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                },
                signal: controller.signal
            }
        );

        if (response.status === 401 || response.status === 403) {
            mostrarModalAcceso();
            return false;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        sessionData = await leerRespuestaJSON(response);

        if (!sessionData) {
            throw new Error('No se recibió información de sesión.');
        }

        accesoVerificado = true;

        return true;

    } catch (error) {
        console.error('Error al verificar el acceso:', error);

        mostrarModalErrorConexion();

        return false;

    } finally {
        clearTimeout(timeout);
    }
}
/* ============================================================
   INICIALIZACIÓN PRINCIPAL
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    prepararSkeletons();

    setupKeyboardEscListener();
    setupDocumentTypeSelector();

    const accesoPermitido = await verificarAccesoInicial();

    if (!accesoPermitido) return;

    // Aplicamos el tema antes de mostrar la interfaz real.
    try {
        if (window.PortalTheme?.load) {
            const resultadoTema = await window.PortalTheme.load();

            if (!resultadoTema?.ok) {
                console.warn(
                    'No se pudieron cargar las preferencias visuales:',
                    resultadoTema?.error
                );
            }
        }
    } catch (error) {
        console.error('Error al cargar el tema:', error);
    }

    // Las tres cargas se ejecutan simultáneamente.
    const tareasIniciales = [
        {
            nombre: 'perfil',
            ejecutar: loadUserProfileData
        },
        {
            nombre: 'fotografía',
            ejecutar: loadProfilePhoto
        },
        {
            nombre: 'documentos',
            ejecutar: loadDocuments
        }
    ];

    const resultados = await Promise.allSettled(
        tareasIniciales.map(tarea => tarea.ejecutar())
    );

    resultados.forEach((resultado, index) => {
        if (resultado.status === 'rejected') {
            manejarErrorOperacion(
                resultado.reason,
                tareasIniciales[index].nombre
            );
        }
    });

    // Evita dejar campos en skeleton si alguna carga falló.
    finalizarTodosLosSkeletons();

    // Sidebar y contenido aparecen en una sola transición.
    finalizarCargaInicial();
});

/* ============================================================
   PERFIL DEL USUARIO
   ============================================================ */

async function loadUserProfileData() {
    try {
        const response = await apiFetch('/api/Perfil/me', {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const perfil = await leerRespuestaJSON(response);

        if (!perfil) {
            throw new Error('No se recibió información del perfil.');
        }

        userProfileState.fullName = perfil.nombreCompleto || '';
        userProfileState.phone = perfil.telefono || '';
        userProfileState.email = sessionData?.correo || '';
        userProfileState.curp = perfil.curp || '';
        userProfileState.avatarUrl = perfil.rutaFotografia || null;

        actualizarDatosPerfil();

    } finally {
        finalizarSkeletonsPerfil();
    }
}

function actualizarDatosPerfil() {
    const datos = {
        profileFullName: userProfileState.fullName || 'Sin nombre registrado',
        profileEmail: userProfileState.email || 'Sin correo registrado',
        infoFullName: userProfileState.fullName || 'No registrado',
        infoPhone: userProfileState.phone || 'No registrado',
        infoEmail: userProfileState.email || 'No registrado',
        infoCurp: userProfileState.curp || 'No registrada'
    };

    Object.entries(datos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    });
}

async function loadProfilePhoto() {
    const image = document.getElementById('userAvatarImg');
    const placeholder = document.getElementById('avatarPlaceholderIcon');

    if (!image || !placeholder) return;

    try {
        const response = await apiFetch('/api/Perfil/me/fotografia', {
            cache: 'no-store'
        });

        if (response.status === 404) return;

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const blob = await response.blob();

        if (!blob.type.startsWith('image/')) return;

        const nuevaUrl = URL.createObjectURL(blob);

        if (userProfileState.avatarUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(userProfileState.avatarUrl);
        }

        userProfileState.avatarUrl = nuevaUrl;

        image.onload = () => {
            image.classList.add('pe-image-ready');
            image.style.display = 'block';
            placeholder.style.display = 'none';
        };

        image.onerror = () => {
            URL.revokeObjectURL(nuevaUrl);
            image.removeAttribute('src');
        };

        image.src = nuevaUrl;

    } catch (error) {
        manejarErrorOperacion(error, 'fotografía de perfil');

    } finally {
        image?.classList.remove('pe-image-loading');
    }
}

/* ============================================================
   DOCUMENTOS
   ============================================================ */

async function loadDocuments() {
    try {
        const response = await apiFetch('/api/Documentos', {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const documentos = await leerRespuestaJSON(response);

        Object.values(documentsState).forEach(doc => {
            if (doc.fileUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(doc.fileUrl);
            }

            doc.status = 'pending';
            doc.fileType = 'pdf';
            doc.fileUrl = null;
            doc.rawFile = null;
            doc.id = null;
            doc.fechaSubida = null;
            doc.fileName = null;
        });

        if (Array.isArray(documentos)) {
            for (const documento of documentos) {
                const key = tiposDocumento[documento.tipoDocumento];

                if (!key) continue;

                const actual = documentsState[key];

                if (
                    actual.id !== null &&
                    new Date(documento.fechaSubida) <=
                    new Date(actual.fechaSubida)
                ) {
                    continue;
                }

                actual.id = documento.id;
                actual.fechaSubida = documento.fechaSubida;
                actual.fileType = obtenerTipoArchivo(
                    documento.tipoContenido
                );
                actual.status = 'loaded';
                actual.fileName = documento.nombreArchivo;
            }
        }

        updateDocCardsUI();

    } finally {
        finalizarSkeletonsDocumentos();
    }
}

function obtenerTipoArchivo(tipoContenido) {
    if (tipoContenido === 'application/pdf') return 'pdf';

    if (tipoContenido?.startsWith('image/')) {
        return 'image';
    }

    return 'archivo';
}

function updateDocCardsUI() {
    ['acta', 'curp', 'ine'].forEach(key => {
        const doc = documentsState[key];

        const keyCap = key.charAt(0).toUpperCase() + key.slice(1);

        const badgeIcon = document.getElementById(`badgeIcon${keyCap}`);
        const badgeType = document.getElementById(`badgeType${keyCap}`);
        const statusElem = document.getElementById(`status${keyCap}`);
        const btnTextElem = document.getElementById(`btnText${keyCap}`);

        if (!badgeIcon || !badgeType || !statusElem || !btnTextElem) {
            return;
        }

        if (doc.status === 'loaded') {
            badgeIcon.classList.add('loaded');

            badgeType.textContent = (
                doc.fileType || 'archivo'
            ).toUpperCase();

            badgeType.classList.remove('pending');

            statusElem.textContent = 'Documento cargado';
            statusElem.className = 'doc-status loaded';

            btnTextElem.textContent = 'Ver documento';

        } else {
            badgeIcon.classList.remove('loaded');

            badgeType.textContent = key === 'ine' ? 'JPG' : 'PDF';

            badgeType.classList.add('pending');

            statusElem.textContent = 'Documento pendiente';
            statusElem.className = 'doc-status pending';

            btnTextElem.textContent = 'Cargar';
        }
    });
}

/* ============================================================
   NAVEGACIÓN
   ============================================================ */

function navigateToDashboard() {
    window.location.href = 'dashboard.html';
}

function navigateToProfile() {
    window.location.href = 'profile.html';
}

function navigateToDynamicResume() {
    window.location.href = 'dynamic_resume.html';
}

function navigateToMore() {
    window.location.href = 'more.html';
}

function navigateToEditProfile() {
    window.location.href = 'edit_profile.html';
}

function handleDocAction(key) {
    if (!documentsState[key]) return;

    currentDocKey = key;

    if (documentsState[key].status === 'loaded') {
        openViewModal(key);
    } else {
        openUploadModal(key);
    }
}

function setupDocumentTypeSelector() {
    const selector = document.getElementById('docTypeSelect');

    if (!selector) return;

    selector.addEventListener('change', event => {
        currentDocKey = event.target.value;
    });
}

/* ============================================================
   SUBIDA DE DOCUMENTOS
   ============================================================ */

function openUploadModal(key) {
    if (key) {
        currentDocKey = key;
    } else {
        const selector = document.getElementById('docTypeSelect');

        if (!selector) return;

        currentDocKey = selector.value;
    }

    const selector = document.getElementById('docTypeSelect');

    if (selector) {
        selector.value = currentDocKey;
    }

    const doc = documentsState[currentDocKey];

    if (doc) {
        doc.rawFile = null;
    }

    resetScannerModalState();

    openModal('uploadModal');
}

function triggerFileInput(source) {
    stopCameraStream();

    const cameraBox = document.getElementById('cameraBox');
    const fileInput = document.getElementById('fileInput');

    if (!fileInput) return;

    if (cameraBox) {
        cameraBox.style.display = 'none';
    }

    if (source === 'camera') {
        fileInput.setAttribute('capture', 'environment');
    } else {
        fileInput.removeAttribute('capture');
    }

    fileInput.click();
}

function handleFileSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
        alert('Selecciona un PDF, JPEG, PNG o WebP válido.');
        event.target.value = '';
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar los 10 MB.');
        event.target.value = '';
        return;
    }

    const doc = documentsState[currentDocKey];

    if (!doc) return;

    doc.rawFile = file;
    doc.fileType = obtenerTipoArchivo(file.type);

    if (doc.fileType === 'pdf') {
        originalLoadedImage = null;

        const scannerBox = document.getElementById('scannerBox');
        const scannerControls = document.getElementById('scannerControls');

        if (scannerBox) {
            scannerBox.style.display = 'flex';

            scannerBox.innerHTML = `
                <div style="color:white;text-align:center;padding:2rem;">
                    <i class="ri-file-pdf-line"
                       style="font-size:3rem;color:var(--teal);"></i>
                    <p style="margin-top:.5rem;">
                        Archivo PDF listo para guardar:<br>
                        <strong>${escapeHtml(file.name)}</strong>
                    </p>
                </div>
            `;
        }

        if (scannerControls) {
            scannerControls.style.display = 'none';
        }

        return;
    }

    if (currentImageObjectUrl) {
        URL.revokeObjectURL(currentImageObjectUrl);
    }

    currentImageObjectUrl = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
        originalLoadedImage = img;

        currentRotation = 0;
        activeFilter = 'normal';

        const scannerBox = document.getElementById('scannerBox');
        const scannerControls = document.getElementById('scannerControls');

        if (scannerBox) scannerBox.style.display = 'flex';
        if (scannerControls) scannerControls.style.display = 'flex';

        setScanFilter('normal');
    };

    img.onerror = () => {
        alert('No se pudo leer la imagen seleccionada.');
    };

    img.src = currentImageObjectUrl;
}

async function saveDocumentFromModal() {
    if (isSavingDocument) return;

    const doc = documentsState[currentDocKey];

    if (!doc || (!doc.rawFile && !originalLoadedImage)) {
        alert('Selecciona un archivo antes de guardar.');
        return;
    }

    isSavingDocument = true;

    const saveButton = document.getElementById('btnSaveUploadedDoc');

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.style.opacity = '.65';
    }

    try {
        let archivo = doc.rawFile;

        if (doc.fileType === 'image' && originalLoadedImage) {
            const canvas = document.getElementById('scannerCanvas');

            if (!canvas) {
                throw new Error('No se encontró el área de procesamiento.');
            }

            archivo = await new Promise((resolve, reject) => {
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('No se pudo procesar la imagen.'));
                        return;
                    }

                    resolve(new File(
                        [blob],
                        `${currentDocKey}-${Date.now()}.jpg`,
                        { type: 'image/jpeg' }
                    ));

                }, 'image/jpeg', .92);
            });
        }

        const formData = new FormData();

        formData.append('archivo', archivo);

        formData.append(
            'tipoDocumento',
            String(documentTypes[currentDocKey])
        );

        const response = await apiFetch('/api/Documentos', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const guardado = await leerRespuestaJSON(response);

        if (!guardado) {
            throw new Error('El servidor no confirmó el documento guardado.');
        }

        doc.id = guardado.id;
        doc.fileType = obtenerTipoArchivo(guardado.tipoContenido);
        doc.fileName = guardado.nombreArchivo;
        doc.status = 'loaded';
        doc.fechaSubida = guardado.fechaSubida;
        doc.rawFile = null;

        updateDocCardsUI();

        closeModal('uploadModal');

        resetScannerModalState();

    } catch (error) {
        manejarErrorOperacion(error, 'guardar documento');

        alert(error.message || 'No fue posible guardar el documento.');

    } finally {
        isSavingDocument = false;

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.style.opacity = '1';
        }
    }
}

/* ============================================================
   CÁMARA
   ============================================================ */

async function startCamera() {
    const scannerBox = document.getElementById('scannerBox');
    const scannerControls = document.getElementById('scannerControls');

    const cameraBox = document.getElementById('cameraBox');
    const video = document.getElementById('cameraVideo');

    if (scannerBox) scannerBox.style.display = 'none';
    if (scannerControls) scannerControls.style.display = 'none';

    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('La cámara no está disponible en este contexto.');
        }

        stopCameraStream();

        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        if (!video || !cameraBox) {
            stopCameraStream();
            return;
        }

        video.srcObject = mediaStream;
        video.style.display = 'block';

        cameraBox.style.display = 'flex';

        await video.play();

    } catch (error) {
        console.warn('No se pudo activar la cámara:', error);

        stopCameraStream();

        alert('No se pudo activar la cámara. Puedes seleccionar una imagen.');

        triggerFileInput('camera');
    }
}

function captureCameraSnapshot() {
    const video = document.getElementById('cameraVideo');

    if (!video?.videoWidth || !video?.videoHeight) {
        alert('La cámara todavía no está lista.');
        return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
        alert('No se pudo procesar la captura.');
        return;
    }

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    stopCameraStream();

    const cameraBox = document.getElementById('cameraBox');

    if (cameraBox) {
        cameraBox.style.display = 'none';
    }

    canvas.toBlob(blob => {
        if (!blob) {
            alert('No se pudo capturar la fotografía.');
            return;
        }

        const img = new Image();

        img.onload = () => {
            originalLoadedImage = img;

            documentsState[currentDocKey].rawFile = new File(
                [blob],
                `captura-${Date.now()}.jpg`,
                { type: 'image/jpeg' }
            );

            documentsState[currentDocKey].fileType = 'image';

            currentRotation = 0;
            activeFilter = 'normal';

            const scannerBox = document.getElementById('scannerBox');
            const scannerControls = document.getElementById('scannerControls');

            if (scannerBox) scannerBox.style.display = 'flex';
            if (scannerControls) scannerControls.style.display = 'flex';

            setScanFilter('normal');
            applyScanFilters();

            if (currentCameraImageUrl) {
                URL.revokeObjectURL(currentCameraImageUrl);
                currentCameraImageUrl = null;
            }
        };

        img.onerror = () => {
            if (currentCameraImageUrl) {
                URL.revokeObjectURL(currentCameraImageUrl);
                currentCameraImageUrl = null;
            }

            alert('No se pudo procesar la fotografía capturada.');
        };

        currentCameraImageUrl = URL.createObjectURL(blob);

        img.src = currentCameraImageUrl;

    }, 'image/jpeg', .92);
}

function stopCameraStream() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    const video = document.getElementById('cameraVideo');

    if (video) {
        video.pause();
        video.srcObject = null;
    }
}

/* ============================================================
   ESCÁNER Y PROCESAMIENTO DE IMÁGENES
   ============================================================ */

function setScanFilter(filter) {
    const filtrosValidos = ['normal', 'bw', 'gray', 'sharp'];

    if (!filtrosValidos.includes(filter)) return;

    activeFilter = filter;

    document.querySelectorAll('.filter-pills .pill-btn')
        .forEach(btn => btn.classList.remove('active'));

    const filterIds = {
        normal: 'filterNormal',
        bw: 'filterBW',
        gray: 'filterGray',
        sharp: 'filterSharp'
    };

    document.getElementById(filterIds[filter])?.classList.add('active');

    applyScanFilters();
}

function rotateImage() {
    currentRotation = (currentRotation + 90) % 360;

    applyScanFilters();
}

function applyScanFilters() {
    if (!originalLoadedImage) return;

    const canvas = document.getElementById('scannerCanvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const brightnessInput = document.getElementById('brightnessRange');
    const contrastInput = document.getElementById('contrastRange');

    const brightness = parseInt(brightnessInput?.value || 0, 10);
    const contrast = parseInt(contrastInput?.value || 0, 10);

    const imageWidth = originalLoadedImage.width;
    const imageHeight = originalLoadedImage.height;

    if (currentRotation % 180 === 0) {
        canvas.width = imageWidth;
        canvas.height = imageHeight;
    } else {
        canvas.width = imageHeight;
        canvas.height = imageWidth;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    ctx.rotate(currentRotation * Math.PI / 180);

    ctx.drawImage(
        originalLoadedImage,
        -imageWidth / 2,
        -imageHeight / 2
    );

    ctx.restore();

    const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const data = imageData.data;

    const factor = (259 * (contrast + 255)) /
        (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r = factor * (r + brightness - 128) + 128;
        g = factor * (g + brightness - 128) + 128;
        b = factor * (b + brightness - 128) + 128;

        if (activeFilter === 'gray' || activeFilter === 'bw') {
            const avg = .299 * r + .587 * g + .114 * b;

            if (activeFilter === 'gray') {
                r = g = b = avg;
            } else {
                r = g = b = avg >= 128 ? 255 : 0;
            }

        } else if (activeFilter === 'sharp') {
            const avg = .299 * r + .587 * g + .114 * b;

            r = r > avg
                ? Math.min(255, r * 1.15)
                : Math.max(0, r * .85);

            g = g > avg
                ? Math.min(255, g * 1.15)
                : Math.max(0, g * .85);

            b = b > avg
                ? Math.min(255, b * 1.15)
                : Math.max(0, b * .85);
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);
}

function resetScannerModalState() {
    stopCameraStream();

    originalLoadedImage = null;

    if (currentImageObjectUrl) {
        URL.revokeObjectURL(currentImageObjectUrl);
        currentImageObjectUrl = null;
    }

    if (currentCameraImageUrl) {
        URL.revokeObjectURL(currentCameraImageUrl);
        currentCameraImageUrl = null;
    }

    const fileInput = document.getElementById('fileInput');
    const cameraBox = document.getElementById('cameraBox');
    const scannerBox = document.getElementById('scannerBox');
    const scannerControls = document.getElementById('scannerControls');

    if (fileInput) fileInput.value = '';

    if (cameraBox) cameraBox.style.display = 'none';

    if (scannerBox) {
        scannerBox.style.display = 'none';
        scannerBox.innerHTML = '<canvas id="scannerCanvas"></canvas>';
    }

    if (scannerControls) {
        scannerControls.style.display = 'none';
    }

    const brightness = document.getElementById('brightnessRange');
    const contrast = document.getElementById('contrastRange');

    if (brightness) brightness.value = 0;
    if (contrast) contrast.value = 0;

    setScanFilter('normal');
}

/* ============================================================
   VISUALIZACIÓN DE DOCUMENTOS
   ============================================================ */

async function openViewModal(key) {
    currentDocKey = key;

    const doc = documentsState[key];

    if (!doc?.id) {
        alert('No se encontró el identificador del documento.');
        return;
    }

    const title = document.getElementById('viewModalTitle');
    const viewerBox = document.getElementById('viewerBox');

    if (!title || !viewerBox) return;

    title.textContent = `Visualizar ${doc.title}`;

    viewerBox.textContent = 'Cargando documento...';

    openModal('viewModal');

    try {
        const response = await apiFetch(
            `/api/Documentos/${encodeURIComponent(doc.id)}/descargar`
        );

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const blob = await response.blob();

        if (currentViewerUrl) {
            URL.revokeObjectURL(currentViewerUrl);
            currentViewerUrl = null;
        }

        currentViewerUrl = URL.createObjectURL(blob);

        viewerBox.innerHTML = '';

        if (blob.type === 'application/pdf') {
            const iframe = document.createElement('iframe');

            iframe.src = currentViewerUrl;
            iframe.title = doc.title;

            viewerBox.appendChild(iframe);

        } else if (blob.type.startsWith('image/')) {
            const img = document.createElement('img');

            img.src = currentViewerUrl;
            img.alt = doc.title;

            viewerBox.appendChild(img);

        } else {
            viewerBox.textContent =
                'Este formato no se puede mostrar en la vista previa.';
        }

    } catch (error) {
        manejarErrorOperacion(error, 'visualizar documento');

        viewerBox.textContent = error.message;
    }
}

/* ============================================================
   ELIMINACIÓN DE DOCUMENTOS
   ============================================================ */

function promptDeleteCurrentDoc() {
    closeModal('viewModal');

    const doc = documentsState[currentDocKey];

    if (!doc) return;

    const deleteText = document.getElementById('deleteModalText');

    if (deleteText) {
        deleteText.textContent =
            `¿Estás seguro de que deseas eliminar el documento "${doc.title}"?`;
    }

    openModal('deleteModal');
}

async function confirmDeleteDocument() {
    if (isDeletingDocument) return;

    const doc = documentsState[currentDocKey];

    if (!doc?.id) {
        alert('No existe un documento guardado para eliminar.');
        return;
    }

    isDeletingDocument = true;

    const deleteButton = document.querySelector(
        '#deleteModal button[onclick*="confirmDeleteDocument"]'
    );

    if (deleteButton) {
        deleteButton.disabled = true;
    }

    try {
        const response = await apiFetch(
            `/api/Documentos/${encodeURIComponent(doc.id)}`,
            { method: 'DELETE' }
        );

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        doc.status = 'pending';
        doc.id = null;
        doc.fileUrl = null;
        doc.rawFile = null;
        doc.fileName = null;
        doc.fechaSubida = null;

        updateDocCardsUI();

        closeModal('deleteModal');

    } catch (error) {
        manejarErrorOperacion(error, 'eliminar documento');

        alert(error.message || 'No fue posible eliminar el documento.');

    } finally {
        isDeletingDocument = false;

        if (deleteButton) {
            deleteButton.disabled = false;
        }
    }
}

/* ============================================================
   CIERRE DE SESIÓN
   ============================================================ */

function openLogoutModal() {
    openModal('logoutModal');
}

async function executeLogout() {
    if (isLoggingOut) return;

    isLoggingOut = true;

    try {
        const response = await apiFetch('/api/Auth/logout', {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        window.location.replace('index.html');

    } catch (error) {
        console.error('Error al cerrar sesión:', error);

        alert(
            'No se pudo confirmar el cierre de sesión. Inténtalo nuevamente.'
        );

        isLoggingOut = false;
    }
}

/* ============================================================
   MODALES Y EVENTOS
   ============================================================ */

function openModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove('active');
    }

    if (!document.querySelector('.modal-overlay.active')) {
        document.body.style.overflow = '';
    }

    if (id === 'uploadModal') {
        stopCameraStream();
    }

    if (id === 'viewModal' && currentViewerUrl) {
        URL.revokeObjectURL(currentViewerUrl);
        currentViewerUrl = null;
    }
}

function showPendingModal(featureName) {
    const element = document.getElementById('pendingFeatureName');

    if (element) {
        element.textContent = featureName;
    }

    openModal('pendingModal');
}

function setupKeyboardEscListener() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', event => {
            if (event.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active')
                .forEach(modal => closeModal(modal.id));
        }
    });
}

/* ============================================================
   UTILIDADES
   ============================================================ */

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

/* ============================================================
   LIBERACIÓN DE RECURSOS
   ============================================================ */

window.addEventListener('beforeunload', () => {
    stopCameraStream();

    if (currentImageObjectUrl) {
        URL.revokeObjectURL(currentImageObjectUrl);
    }

    if (currentCameraImageUrl) {
        URL.revokeObjectURL(currentCameraImageUrl);
    }

    if (currentViewerUrl) {
        URL.revokeObjectURL(currentViewerUrl);
    }

    if (userProfileState.avatarUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(userProfileState.avatarUrl);
    }
});