
/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const API_URL = 'https://pureblood-starfish-happening.ngrok-free.dev'.replace(/\/+$/, '');
const API_TIMEOUT = 20000;

let modal;
let modalFeatureName;
let fotografiaActual = null;
let redireccionEnProceso = false;
let redirectTimer = null;
let skeletonElement = null;

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', inicializarDashboard);

async function inicializarDashboard() {
    document.body.style.visibility = 'hidden';
    document.body.style.opacity = '0';

    modal = document.getElementById('pendingModal');
    modalFeatureName = document.getElementById('modalFeatureName');

    configurarNavegacion();
    configurarModal();
    configurarTransiciones();

    try {
        const autenticado = await comprobarAutenticacion();

        if (!autenticado) {
            mostrarModalAcceso();
            return;
        }

        // Mostramos la estructura mientras llegan los datos.
        crearSkeleton();

        document.body.style.visibility = 'visible';

        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });

        // Perfil y preferencias se cargan simultáneamente.
        const tareaPerfil = cargarPerfil();
        const tareaTema = cargarTema();

        const [resultadoPerfil] = await Promise.allSettled([
            tareaPerfil,
            tareaTema
        ]);

        if (resultadoPerfil.status === 'rejected') {
            console.error(
                'Error al cargar el perfil:',
                resultadoPerfil.reason
            );

            if (
                resultadoPerfil.reason?.message?.includes(
                    'sesión ha expirado'
                )
            ) {
                mostrarModalAcceso();
            } else {
                mostrarToastCarga();
            }
        }

        if (
            resultadoPerfil.status === 'fulfilled' &&
            resultadoPerfil.value === false
        ) {
            return;
        }

    } catch (error) {
        console.error(
            'Error al inicializar el Dashboard:',
            error
        );

        mostrarModalError();

    } finally {
        retirarSkeleton();
    }
}

/* ============================================================
   TRANSICIONES Y SKELETON
   ============================================================ */

function configurarTransiciones() {
    const estilos = document.createElement('style');

    estilos.id = 'dashboard-optimization-styles';

    estilos.textContent = `
        body {
            opacity: 1;
            transition: opacity 220ms ease;
        }

        #dashboardSkeleton {
            position: fixed;
            inset: 0;
            z-index: 9998;
            display: flex;
            flex-direction: column;
            gap: 22px;
            padding: 28px;
            overflow: hidden;
            background: var(--theme-background, #f7f8fa);
            transition:
                opacity 300ms ease,
                visibility 300ms ease;
        }

        #dashboardSkeleton.skeleton-hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        .skeleton-shimmer {
            position: relative;
            overflow: hidden;
            background: rgba(128, 128, 128, 0.12);
            border-radius: 8px;
        }

        .skeleton-shimmer::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.48),
                transparent
            );
            animation: skeletonLoading 1.35s infinite;
        }

        .skeleton-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .skeleton-circle {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            border-radius: 50%;
        }

        .skeleton-line {
            height: 13px;
            margin-bottom: 12px;
        }

        .skeleton-line.short {
            width: 38%;
        }

        .skeleton-line.medium {
            width: 65%;
        }

        .skeleton-line.long {
            width: 90%;
        }

        .skeleton-card {
            padding: 22px;
            border: 1px solid rgba(128, 128, 128, 0.10);
            border-radius: 14px;
            background: var(--theme-surface, #fff);
        }

        .skeleton-card-title {
            width: 42%;
            height: 17px;
            margin-bottom: 24px;
        }

        .skeleton-profile {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
        }

        .skeleton-profile-info {
            flex: 1;
        }

        .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        @keyframes skeletonLoading {
            100% {
                transform: translateX(100%);
            }
        }

        @media (max-width: 600px) {
            #dashboardSkeleton {
                padding: 18px;
                gap: 16px;
            }

            .skeleton-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            body,
            #dashboardSkeleton {
                transition: none !important;
            }

            .skeleton-shimmer::after {
                animation: none !important;
            }
        }
    `;

    document.head.appendChild(estilos);
}

function crearSkeleton() {
    if (skeletonElement) {
        return;
    }

    skeletonElement = document.createElement('div');

    skeletonElement.id = 'dashboardSkeleton';
    skeletonElement.setAttribute('aria-hidden', 'true');
    skeletonElement.setAttribute('aria-label', 'Cargando contenido');

    skeletonElement.innerHTML = `
        <div class="skeleton-header">
            <div class="skeleton-shimmer skeleton-circle"></div>

            <div style="flex:1;">
                <div class="skeleton-shimmer skeleton-line medium"></div>
                <div class="skeleton-shimmer skeleton-line short"></div>
            </div>

            <div class="skeleton-shimmer skeleton-circle"></div>
        </div>

        <div class="skeleton-card">
            <div class="skeleton-profile">
                <div class="skeleton-shimmer skeleton-circle"
                     style="width:68px;height:68px;"></div>

                <div class="skeleton-profile-info">
                    <div class="skeleton-shimmer skeleton-line medium"></div>
                    <div class="skeleton-shimmer skeleton-line short"></div>
                </div>
            </div>

            <div class="skeleton-shimmer skeleton-line long"></div>
            <div class="skeleton-shimmer skeleton-line medium"></div>
        </div>

        <div class="skeleton-grid">
            <div class="skeleton-card">
                <div class="skeleton-shimmer skeleton-card-title"></div>
                <div class="skeleton-shimmer skeleton-line long"></div>
                <div class="skeleton-shimmer skeleton-line medium"></div>
            </div>

            <div class="skeleton-card">
                <div class="skeleton-shimmer skeleton-card-title"></div>
                <div class="skeleton-shimmer skeleton-line long"></div>
                <div class="skeleton-shimmer skeleton-line medium"></div>
            </div>
        </div>

        <div class="skeleton-card">
            <div class="skeleton-shimmer skeleton-card-title"></div>
            <div class="skeleton-shimmer skeleton-line long"></div>
            <div class="skeleton-shimmer skeleton-line long"></div>
            <div class="skeleton-shimmer skeleton-line medium"></div>
        </div>
    `;

    document.body.appendChild(skeletonElement);
}

function retirarSkeleton() {
    if (!skeletonElement) {
        return;
    }

    skeletonElement.classList.add('skeleton-hidden');

    const elementoActual = skeletonElement;

    setTimeout(() => {
        elementoActual.remove();

        if (skeletonElement === elementoActual) {
            skeletonElement = null;
        }
    }, 320);
}

function mostrarToastCarga() {
    console.warn(
        'El Dashboard se ha mostrado, pero algunos datos no pudieron cargarse.'
    );
}

/* ============================================================
   SOLICITUDES HTTP
   ============================================================ */


async function fetchConTimeout(url, opciones = {}) {
    const controller = new AbortController();

    const temporizador = setTimeout(() => {
        controller.abort();
    }, API_TIMEOUT);

    try {
        const headers = new Headers(opciones.headers || {});

        // Evita la página de advertencia de ngrok.
        headers.set('ngrok-skip-browser-warning', 'true');

        return await fetch(url, {
            ...opciones,
            headers,
            credentials: opciones.credentials || 'include',
            signal: controller.signal
        });

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(
                'La solicitud tardó demasiado en responder.'
            );
        }

        throw error;

    } finally {
        clearTimeout(temporizador);
    }
}


/* ============================================================
   CARGA DEL TEMA
   ============================================================ */

async function cargarTema() {
    try {
        if (
            !window.PortalTheme ||
            typeof window.PortalTheme.load !== 'function'
        ) {
            console.warn(
                'PortalTheme no está disponible en esta página.'
            );

            return;
        }

        const resultadoTema = await window.PortalTheme.load();

        if (!resultadoTema?.ok) {
            console.warn(
                'No se pudieron cargar las preferencias visuales:',
                resultadoTema?.error
            );
        }

    } catch (error) {
        console.error(
            'Error al cargar las preferencias visuales:',
            error
        );
    }
}

/* ============================================================
   1. AUTENTICACIÓN
   ============================================================ */

async function comprobarAutenticacion() {
    console.log('[AUTH] Consultando /api/Auth/me');

    let respuesta = await fetchConTimeout(
        `${API_URL}/api/Auth/me`,
        {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        }
    );

    console.log('[AUTH] Respuesta inicial:', respuesta.status);

    if (respuesta.ok) {
        console.log('[AUTH] Sesión validada correctamente');
        return true;
    }

    if (respuesta.status === 401) {
        console.log('[AUTH] Sesión no validada. Intentando refresh');

        const renovacion = await fetchConTimeout(
            `${API_URL}/api/Auth/refresh`,
            {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store'
            }
        );

        console.log('[AUTH] Respuesta refresh:', renovacion.status);

        if (!renovacion.ok) {
            return false;
        }

        respuesta = await fetchConTimeout(
            `${API_URL}/api/Auth/me`,
            {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store'
            }
        );

        console.log('[AUTH] Segunda validación:', respuesta.status);

        if (respuesta.ok) {
            return true;
        }

        if (respuesta.status === 401 || respuesta.status === 403) {
            return false;
        }

        throw new Error(
            `Error al comprobar la sesión: ${respuesta.status}`
        );
    }

    if (respuesta.status === 403) {
        return false;
    }

    throw new Error(
        `Error al comprobar la sesión: ${respuesta.status}`
    );
}

/* ============================================================
   2. CARGA DEL PERFIL
   ============================================================ */

async function cargarPerfil() {
    const respuesta = await fetchConTimeout(
        `${API_URL}/api/Perfil/me`,
        {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        }
    );

    if (
        respuesta.status === 401 ||
        respuesta.status === 403
    ) {
        mostrarModalAcceso();
        return false;
    }

    if (respuesta.status === 404) {
        console.warn(
            'El usuario todavía no tiene un perfil registrado.'
        );

        return true;
    }

    if (!respuesta.ok) {
        throw new Error(
            `Error al obtener el perfil: ${respuesta.status}`
        );
    }

    const perfil = await respuesta.json();

    // Nombre del usuario.
    const nombre = perfil.nombreCompleto?.trim() || 'Usuario';

    const nombreBienvenida =
        document.getElementById('userNameDisplay');

    const nombrePerfil =
        document.getElementById('profileNameDisplay');

    if (nombreBienvenida) {
        nombreBienvenida.textContent = nombre;
    }

    if (nombrePerfil) {
        nombrePerfil.textContent = nombre;
    }

    // Teléfono.
    const telefono =
        document.getElementById('profilePhoneDisplay');

    if (telefono) {
        telefono.textContent =
            perfil.telefono || 'Teléfono no registrado';
    }

    // Fecha de nacimiento.
    const fechaNacimiento =
        document.getElementById('profileBirthDisplay');

    if (fechaNacimiento) {
        fechaNacimiento.textContent = perfil.fechaNacimiento
            ? formatearFecha(perfil.fechaNacimiento)
            : 'Fecha de nacimiento no registrada';
    }

    // La fotografía se descarga en segundo plano.
    if (perfil.rutaFotografia) {
        cargarFotografia(perfil.rutaFotografia);
    }

    return true;
}

/* ============================================================
   3. FORMATO DE FECHA
   ============================================================ */

function formatearFecha(fecha) {
    if (typeof fecha !== 'string') {
        return '';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
        return fecha;
    }

    const [anio, mes, dia] = partes;

    const fechaLocal = new Date(
        Number(anio),
        Number(mes) - 1,
        Number(dia)
    );

    if (Number.isNaN(fechaLocal.getTime())) {
        return fecha;
    }

    return fechaLocal.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/* ============================================================
   4. FOTOGRAFÍA DEL USUARIO
   ============================================================ */

async function cargarFotografia(rutaFotografia) {
    try {
        const urlFotografia = new URL(
            rutaFotografia,
            `${API_URL}/`
        );

        // Solo permitimos descargar imágenes desde nuestra API.
        if (urlFotografia.origin !== new URL(API_URL).origin) {
            console.warn(
                'Se rechazó una ruta de fotografía externa.'
            );

            return;
        }

        const respuesta = await fetchConTimeout(
            urlFotografia.href,
            {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store'
            }
        );

        if (
            respuesta.status === 401 ||
            respuesta.status === 403
        ) {
            mostrarModalAcceso();
            return;
        }

        if (!respuesta.ok) {
            console.warn(
                'No se pudo cargar la fotografía del usuario:',
                respuesta.status
            );

            return;
        }

        const imagenBlob = await respuesta.blob();

        if (!imagenBlob.type.startsWith('image/')) {
            console.warn(
                'El recurso recibido no es una imagen.'
            );

            return;
        }

        const nuevaFotografia = URL.createObjectURL(imagenBlob);

        if (fotografiaActual) {
            URL.revokeObjectURL(fotografiaActual);
        }

        fotografiaActual = nuevaFotografia;

        // Avatar del encabezado.
        const avatar =
            document.getElementById('userPhotoDisplay');

        const avatarPlaceholder =
            document.getElementById('avatarPlaceholder');

        if (avatar) {
            avatar.src = fotografiaActual;
            avatar.style.display = 'block';
            avatar.decoding = 'async';
        }

        if (avatarPlaceholder) {
            avatarPlaceholder.style.display = 'none';
        }

        // Fotografía del resumen de perfil.
        const fotoPerfil =
            document.getElementById('profilePhotoDisplay');

        const fotoPlaceholder =
            document.getElementById('profilePhotoPlaceholder');

        if (fotoPerfil) {
            fotoPerfil.src = fotografiaActual;
            fotoPerfil.style.display = 'block';
            fotoPerfil.decoding = 'async';
        }

        if (fotoPlaceholder) {
            fotoPlaceholder.style.display = 'none';
        }

    } catch (error) {
        console.error(
            'Error al cargar la fotografía:',
            error
        );
    }
}

/* ============================================================
   5. NAVEGACIÓN
   ============================================================ */

function configurarNavegacion() {
    const navItems = document.querySelectorAll(
        '.nav-item, .bottom-nav-item'
    );

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const targetNav = this.getAttribute('data-nav');

            if (targetNav === 'inicio') {
                setActiveNav('inicio');
            }
        });
    });
}

function setActiveNav(navName) {
    const allNavs = document.querySelectorAll(
        '.nav-item, .bottom-nav-item'
    );

    allNavs.forEach(nav => {
        if (nav.getAttribute('data-nav') === navName) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });
}

/* ============================================================
   6. REDIRECCIONES
   ============================================================ */

function navigateToProfile() {
    setActiveNav('perfil');
    window.location.href = 'profile.html';
}

function navigateToAcademicQualifications() {
    setActiveNav('formacion');
    window.location.href = 'academic_qualifications.html';
}

function navigateToExtracurricularQualifications() {
    setActiveNav('formacion');
    window.location.href = 'extracurricular_qualifications.html';
}

function navigateToJobExperience() {
    setActiveNav('experiencia');
    window.location.href = 'job_experience.html';
}

function navigateToProjectsPractices() {
    setActiveNav('proyectos');
    window.location.href = 'projects_practices.html';
}

function navigateToSkills() {
    setActiveNav('habilidades');
    window.location.href = 'skills.html';
}

function navigateToInterests() {
    setActiveNav('intereses');
    window.location.href = 'interests.html';
}

function navigateToDynamicResume() {
    setActiveNav('curriculum');
    window.location.href = 'dynamic_resume.html';
}

function navigateToMore() {
    setActiveNav('mas');
    window.location.href = 'more.html';
}

/* ============================================================
   7. MODAL DE FUNCIONES PENDIENTES
   ============================================================ */

function configurarModal() {
    if (!modal) {
        return;
    }

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

function showPendingModal(featureName) {
    if (!modal || !modalFeatureName) {
        return;
    }

    modalFeatureName.textContent = featureName;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modal) {
        return;
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============================================================
   8. MODAL DE ACCESO RESTRINGIDO
   ============================================================ */

function mostrarModalAcceso() {
    if (redireccionEnProceso) {
        return;
    }

    redireccionEnProceso = true;

    retirarSkeleton();

    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';

    if (!document.getElementById('authModal')) {
        const modalAcceso = document.createElement('div');

        modalAcceso.id = 'authModal';
        modalAcceso.className = 'auth-modal-overlay';

        modalAcceso.innerHTML = `
            <div class="auth-modal">

                <div class="auth-modal-icon">
                    <i class="ri-lock-2-line"></i>
                </div>

                <h2>Acceso restringido</h2>

                <p>
                    No has iniciado sesión. Para acceder a tu expediente
                    necesitas autenticarte primero.
                </p>

                <span class="auth-modal-message">
                    Redirigiendo al inicio de sesión...
                </span>

            </div>
        `;

        document.body.appendChild(modalAcceso);
    }

    document.body.style.overflow = 'hidden';

    redirectTimer = setTimeout(() => {
        window.location.replace('login.html');
    }, 1800);
}

/* ============================================================
   9. MODAL DE ERROR DE CONEXIÓN
   ============================================================ */

function mostrarModalError() {
    if (redireccionEnProceso) {
        return;
    }

    redireccionEnProceso = true;

    retirarSkeleton();

    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';

    if (!document.getElementById('connectionErrorModal')) {
        const modalError = document.createElement('div');

        modalError.id = 'connectionErrorModal';
        modalError.className = 'auth-modal-overlay';

        modalError.innerHTML = `
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

        document.body.appendChild(modalError);
    }

    document.body.style.overflow = 'hidden';

    redirectTimer = setTimeout(() => {
        window.location.replace('index.html');
    }, 1800);
}

/* ============================================================
   10. LIBERACIÓN DE RECURSOS
   ============================================================ */

window.addEventListener('beforeunload', () => {
    if (redirectTimer) {
        clearTimeout(redirectTimer);
    }

    if (fotografiaActual) {
        URL.revokeObjectURL(fotografiaActual);
        fotografiaActual = null;
    }
});
