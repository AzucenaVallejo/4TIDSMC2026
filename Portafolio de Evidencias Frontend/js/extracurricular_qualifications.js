
"use strict";

// CONFIGURACIÓN DE LA API
const API_BASE_URL = "https://pureblood-starfish-happening.ngrok-free.dev/api";
const ACTIVIDAD_ENDPOINT = `${API_BASE_URL}/Actividad`;
const AUTH_ENDPOINT = `${API_BASE_URL}/Auth`;
const DOCUMENTOS_ENDPOINT = `${API_BASE_URL}/Documentos`;

const TIPO_DOCUMENTO_CONSTANCIA = 8;
const MAX_DOCUMENTO_BYTES = 10 * 1024 * 1024;
let accesoVerificado = false;
let redireccionEnProceso = false;
// ENUMS DEL BACKEND
const TIPOS_ACTIVIDAD = {
    Curso: 1,
    Certificacion: 2,
    Taller: 3,
    Congreso: 4,
    Conferencia: 5,
    Seminario: 6,
    Diplomado: 7,
    Idiomas: 8,
    Voluntariado: 9,
    ConcursoCompetencia: 10,
    ActividadDeportiva: 11,
    ActividadCulturalArtistica: 12,
    ServicioComunitario: 13,
    OtraActividad: 14
};

const MODALIDADES = {
    Presencial: 1,
    EnLinea: 2,
    Hibrida: 3
};

const ESTADOS = {
    Finalizada: 1,
    EnCurso: 2
};

const UNIDADES_DURACION = {
    Horas: 1,
    Dias: 2,
    Semanas: 3,
    Meses: 4
};

// ELEMENTOS DEL DOM
const elementos = {
    lista: document.getElementById("educationList"),
    modal: document.getElementById("formModal"),
    deleteModal: document.getElementById("deleteModal"),
    formulario: document.getElementById("educationForm"),

    id: document.getElementById("formEducationId"),
    nombre: document.getElementById("formNombre"),
    tipo: document.getElementById("formTipo"),
    modalidad: document.getElementById("formModalidad"),
    organizacion: document.getElementById("formInstitucion"),
    estado: document.getElementById("formEnCurso"),
    fechaInicio: document.getElementById("formFechaInicio"),
    fechaFin: document.getElementById("formFechaFin"),
    fechaFinGroup: document.getElementById("fechaFinGroup"),
    duracion: document.getElementById("formDuracion"),
    unidadDuracion: document.getElementById("formUnidadDuracion"),
    descripcion: document.getElementById("formDescripcion"),

    guardar: document.getElementById("saveEducationBtn"),
    guardarTexto: document.getElementById("saveButtonText"),
    usuario: document.getElementById("userName"),

    certificado: document.getElementById("formCertificado"),
    certificadoActual: document.getElementById("certificadoActual"),

    successModal: document.getElementById("successModal"),
    detailModal: document.getElementById("detailModal"),
    documentViewerModal: document.getElementById("documentViewerModal"),
    removeDocumentModal: document.getElementById("removeDocumentModal")
};

// ESTADO DE LA PÁGINA
let actividades = [];
let actividadAEliminar = null;
let actividadDetalleActual = null;

let documentoActual = null;
let documentoPendienteQuitar = null;
let documentoVisualizadoActual = null;

let urlDocumentoTemporal = null;
let blobDocumentoActual = null;
let nombreDocumentoActual = null;

let guardando = false;
let solicitudVisualizador = 0;

// REGISTRO SEGURO DE EVENTOS
function registrarEvento(id, evento, callback) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.addEventListener(evento, callback);
    }
}

// NORMALIZACIÓN DE ENUMS
function obtenerValorEnum(valor, enumeracion) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    const numero = Number(valor);

    if (
        Number.isInteger(numero) &&
        Object.values(enumeracion).includes(numero)
    ) {
        return numero;
    }

    const nombre = String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_-]/g, "")
        .toLowerCase();

    for (const [clave, valorEnum] of Object.entries(enumeracion)) {
        const claveNormalizada = clave
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\s_-]/g, "")
            .toLowerCase();

        if (claveNormalizada === nombre) {
            return valorEnum;
        }
    }

    return null;
}

function obtenerNombreEnum(valor, enumeracion) {
    const numero = Number(valor);

    return Object.entries(enumeracion)
        .find(([, valorEnum]) => valorEnum === numero)?.[0] || "";
}

function obtenerNombreTipo(tipo) {
    const nombres = {
        1: "Curso",
        2: "Certificación",
        3: "Taller",
        4: "Congreso",
        5: "Conferencia",
        6: "Seminario",
        7: "Diplomado",
        8: "Idiomas",
        9: "Voluntariado",
        10: "Concurso o competencia",
        11: "Actividad deportiva",
        12: "Actividad cultural o artística",
        13: "Servicio comunitario",
        14: "Otra actividad"
    };

    return nombres[Number(tipo)] || "Otra actividad";
}

function obtenerNombreModalidad(modalidad) {
    const nombres = {
        1: "Presencial",
        2: "En línea",
        3: "Híbrida"
    };

    return nombres[Number(modalidad)] || "No especificada";
}

function obtenerNombreEstado(estado) {
    return Number(estado) === ESTADOS.EnCurso
        ? "En curso"
        : "Finalizada";
}

function obtenerNombreUnidad(unidad) {
    const nombres = {
        1: "Horas",
        2: "Días",
        3: "Semanas",
        4: "Meses"
    };

    return nombres[Number(unidad)] || "";
}

// COMUNICACIÓN CON LA API
async function apiRequest(url, options = {}) {
    const headers = new Headers(options.headers || {});

    headers.set("ngrok-skip-browser-warning", "true");

    if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
    }

    if (
        options.body !== undefined &&
        options.body !== null &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof Blob) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const config = {
        ...options,
        method: options.method || "GET",
        credentials: "include",
        headers
    };

    const response = await fetch(url, config);

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const texto = await response.text();
        data = texto ? { message: texto } : null;
    }

    if (!response.ok) {
        const error = new Error(
            obtenerMensajeError(data, response.status)
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

function obtenerMensajeError(data, status) {
    if (!data) {
        return `La solicitud no pudo completarse. Código ${status}.`;
    }

    if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
    }

    if (typeof data.mensaje === "string" && data.mensaje.trim()) {
        return data.mensaje;
    }

    if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
    }

    if (typeof data.title === "string" && data.title.trim()) {
        return data.title;
    }

    if (data.errors && typeof data.errors === "object") {
        const primerError = Object.values(data.errors)
            .flat()
            .find(value =>
                typeof value === "string" && value.trim()
            );

        if (primerError) {
            return primerError;
        }
    }

    return `La solicitud no pudo completarse. Código ${status}.`;
}
// CONTROL DE ACCESO Y CONEXIÓN
function mostrarModalErrorConexion() {
    if (redireccionEnProceso) return;
    ocultarSkeleton();
    redireccionEnProceso = true;
    document.body.style.visibility = "visible";

    const modal = document.createElement("div");

    modal.className = "auth-modal-overlay";

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
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        window.location.replace("index.html");
    }, 1800);
}

function mostrarModalAcceso() {
    if (redireccionEnProceso) return;
    ocultarSkeleton();
    redireccionEnProceso = true;
    document.body.style.visibility = "visible";

    const modal = document.createElement("div");

    modal.className = "auth-modal-overlay";

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
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        window.location.replace("login.html");
    }, 1800);
}

function manejarErrorAcceso(error) {
    if (
        error?.status === 401 ||
        error?.status === 403
    ) {
        mostrarModalAcceso();
        return true;
    }

    if (
        error?.name === "AbortError" ||
        error instanceof TypeError
    ) {
        mostrarModalErrorConexion();
        return true;
    }

    return false;
}

async function verificarAccesoInicial() {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 5000);

    try {
        const response = await fetch(`${AUTH_ENDPOINT}/me`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
                "ngrok-skip-browser-warning": "true",
                "Accept": "application/json"
            },
            signal: controller.signal
        });

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            mostrarModalAcceso();
            return false;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        accesoVerificado = true;

        return true;

    } catch (error) {
        console.error("Error al verificar el acceso:", error);

        mostrarModalErrorConexion();

        return false;

    } finally {
        clearTimeout(timeout);
    }
}
// DOCUMENTOS
async function subirDocumento(archivo) {
    if (!archivo) return null;

    if (archivo.size === 0) {
        throw new Error("El archivo está vacío.");
    }

    if (archivo.size > MAX_DOCUMENTO_BYTES) {
        throw new Error("El archivo supera el límite de 10 MB.");
    }

    const datos = new FormData();

    datos.append("archivo", archivo);
    datos.append("tipoDocumento", String(TIPO_DOCUMENTO_CONSTANCIA));

    const response = await fetch(DOCUMENTOS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json"
    },
    body: datos
});

    const contentType = response.headers.get("content-type") || "";
    let resultado = null;

    if (contentType.includes("application/json")) {
        resultado = await response.json();
    } else {
        const texto = await response.text();
        resultado = texto ? { message: texto } : null;
    }

        if (!response.ok) {
        const error = new Error(
            obtenerMensajeError(resultado, response.status)
        );

        error.status = response.status;
        error.data = resultado;

        throw error;
    }

    const documentoId =
        resultado?.id ??
        resultado?.Id ??
        resultado?.documentoId ??
        resultado?.DocumentoId;

    if (
        documentoId === null ||
        documentoId === undefined ||
        documentoId === "" ||
        !Number.isFinite(Number(documentoId))
    ) {
        throw new Error(
            "La API no devolvió un identificador válido del documento."
        );
    }

    return Number(documentoId);
}

async function obtenerArchivoDocumento(documentoId) {
    const response = await fetch(
    `${DOCUMENTOS_ENDPOINT}/${encodeURIComponent(documentoId)}/descargar`,
    {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            "ngrok-skip-browser-warning": "true",
            "Accept": "*/*"
        }
    }
);

    if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let data = null;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const texto = await response.text();
            data = texto ? { message: texto } : null;
        }

                const error = new Error(
            obtenerMensajeError(data, response.status)
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    const blob = await response.blob();

    return {
        blob,
        contentType: response.headers.get("content-type") || blob.type,
        disposition: response.headers.get("content-disposition") || ""
    };
}

function obtenerNombreArchivo(disposition, documentoId) {
    if (disposition) {
        const utf8Match = disposition.match(
            /filename\*=UTF-8''([^;]+)/i
        );

        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(
                    utf8Match[1].replace(/"/g, "")
                );
            } catch {
                // Se utiliza el nombre alternativo.
            }
        }

        const normalMatch = disposition.match(
            /filename="?([^";]+)"?/i
        );

        if (normalMatch?.[1]) {
            return normalMatch[1].trim();
        }
    }

    return `documento-${documentoId}`;
}

async function descargarDocumento(documentoId) {
    if (!documentoId) {
        mostrarToast("No se encontró el documento.", "error");
        return;
    }

    let urlTemporal = null;

    try {
        const resultado = await obtenerArchivoDocumento(documentoId);

        urlTemporal = URL.createObjectURL(resultado.blob);

        const nombre = obtenerNombreArchivo(
            resultado.disposition,
            documentoId
        );

        const enlace = document.createElement("a");

        enlace.href = urlTemporal;
        enlace.download = nombre;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

    } catch (error) {
        console.error("Error al descargar el documento:", error);

        if (manejarErrorAcceso(error)) return;

        mostrarToast(
            error.message || "No fue posible descargar el documento.",
            "error"
        );

    } finally {
        if (urlTemporal) {
            setTimeout(() => {
                URL.revokeObjectURL(urlTemporal);
            }, 1000);
        }
    }
}

// VISUALIZADOR DE DOCUMENTOS
async function abrirVisualizadorDocumento(documentoId, nombreDocumento) {
    if (!documentoId) {
        mostrarToast("No hay documento adjunto.", "error");
        return;
    }

    const modal = elementos.documentViewerModal;
    const contenido = document.getElementById("documentViewerContent");
    const titulo = document.getElementById("documentViewerTitle");
    const descripcion = document.getElementById("documentViewerDescription");
    const nombreArchivo = document.getElementById("documentViewerFileName");
    const botonDescargar = document.getElementById("downloadViewerDocumentBtn");

    if (
        !modal ||
        !contenido ||
        !titulo ||
        !descripcion ||
        !nombreArchivo ||
        !botonDescargar
    ) {
        console.error("Faltan elementos necesarios del visualizador.");
        mostrarToast("No se pudo abrir el visualizador.", "error");
        return;
    }

    cerrarVisualizadorDocumento(false);

    const solicitudActual = ++solicitudVisualizador;

    documentoVisualizadoActual = Number(documentoId);
    nombreDocumentoActual =
        nombreDocumento || `Documento ${documentoId}`;

    titulo.textContent = nombreDocumentoActual;
    descripcion.textContent = "Preparando documento...";
    nombreArchivo.textContent = nombreDocumentoActual;

    contenido.innerHTML = `
        <div class="document-viewer-loading">
            <i class="ri-loader-4-line"></i>
            <p>Cargando documento...</p>
        </div>`;

    botonDescargar.disabled = true;

    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    try {
        const resultado = await obtenerArchivoDocumento(documentoId);

        // Evita mostrar respuestas de solicitudes anteriores.
        if (
            solicitudActual !== solicitudVisualizador ||
            !modal.classList.contains("show")
        ) {
            return;
        }

        blobDocumentoActual = resultado.blob;
        urlDocumentoTemporal = URL.createObjectURL(resultado.blob);

        const tipo = (resultado.contentType || "").toLowerCase();
        const nombre = nombreDocumentoActual.toLowerCase();

        const esPDF =
            tipo.includes("pdf") ||
            nombre.endsWith(".pdf");

        const esImagen =
            tipo.startsWith("image/") ||
            /\.(png|jpe?g|gif|webp|bmp)$/i.test(nombre);

        if (esPDF) {
            contenido.innerHTML = `
                <iframe
                    src="${urlDocumentoTemporal}"
                    title="${escaparHTML(nombreDocumentoActual)}">
                </iframe>`;

            descripcion.textContent =
                "Vista previa del documento PDF.";

        } else if (esImagen) {
            contenido.innerHTML = `
                <img
                    src="${urlDocumentoTemporal}"
                    alt="${escaparHTML(nombreDocumentoActual)}"
                    style="max-width:100%;max-height:100%;object-fit:contain;">`;

            descripcion.textContent =
                "Vista previa de la imagen.";

        } else {
            contenido.innerHTML = `
                <div style="text-align:center;">
                    <i class="ri-file-download-line"
                       style="font-size:40px;color:#3980a5;"></i>
                    <h3>Vista previa no disponible</h3>
                    <p>Descarga el archivo para consultarlo.</p>
                </div>`;

            descripcion.textContent =
                "Formato no compatible con la vista previa.";
        }

        nombreArchivo.textContent = obtenerNombreArchivo(
            resultado.disposition,
            documentoId
        );

        botonDescargar.disabled = false;

        } catch (error) {
        if (solicitudActual !== solicitudVisualizador) {
            return;
        }

        if (manejarErrorAcceso(error)) return;

        contenido.innerHTML = `
            <div style="text-align:center;">
                <i class="ri-error-warning-line"
                   style="font-size:40px;color:#D9536F;"></i>
                <h3>Error al cargar</h3>
                <p>${escaparHTML(error.message)}</p>
            </div>`;

        descripcion.textContent =
            "No fue posible cargar el documento.";

        mostrarToast(error.message, "error");
    }
}

function cerrarVisualizadorDocumento(restaurarScroll = true) {
    // Invalida cualquier solicitud de carga pendiente.
    solicitudVisualizador++;

    const contenido = document.getElementById("documentViewerContent");
    const botonDescargar = document.getElementById("downloadViewerDocumentBtn");

    // Se retira primero la referencia al Blob antes de revocarlo.
    if (contenido) {
        contenido.innerHTML = "";
    }

    if (botonDescargar) {
        botonDescargar.disabled = true;
    }

    if (urlDocumentoTemporal) {
        URL.revokeObjectURL(urlDocumentoTemporal);
        urlDocumentoTemporal = null;
    }

    blobDocumentoActual = null;
    documentoVisualizadoActual = null;
    nombreDocumentoActual = null;

    if (elementos.documentViewerModal) {
        elementos.documentViewerModal.classList.remove("show");
    }

    if (restaurarScroll) {
        restaurarScrollSegunModal();
    }
}

// USUARIO Y ACTIVIDADES
async function cargarUsuario() {
    try {
        const usuario = await apiRequest(`${AUTH_ENDPOINT}/me`);

        if (usuario && elementos.usuario) {
            elementos.usuario.textContent =
                usuario.correo ?? usuario.email ?? "";
        }

        } catch (error) {
        if (manejarErrorAcceso(error)) return;

        console.error("Error al cargar usuario:", error);
    }
}

async function cargarActividades() {
    if (!elementos.lista) return;

    elementos.lista.innerHTML = `
        <div class="loading-state">
            <i class="ri-loader-4-line"></i>
            <p>Cargando actividades...</p>
        </div>`;

    try {
        const respuesta = await apiRequest(ACTIVIDAD_ENDPOINT);

        actividades = Array.isArray(respuesta)
            ? respuesta
            : [];

        renderizarActividades();
        actualizarEstadisticas();

    } catch (error) {
        mostrarErrorLista(
            error.status === 401
                ? "Tu sesión ha expirado."
                : error.message || "No fue posible cargar las actividades."
        );
    }
}

function obtenerIdActividad(actividad) {
    return Number(actividad.id ?? actividad.Id);
}

function obtenerDocumentoId(actividad) {
    return actividad.documentoId ??
        actividad.DocumentoId ??
        null;
}

function renderizarActividades() {
    if (!elementos.lista) return;

    if (actividades.length === 0) {
        elementos.lista.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="ri-award-line"></i>
                </div>
                <h3>Sin actividades extracurriculares</h3>
                <p>No tienes actividades registradas. Agrega cursos, certificaciones o talleres.</p>
                <button class="primary-btn" type="button"
                        onclick="abrirFormularioNuevo()">
                    <i class="ri-add-line"></i>
                    Agregar actividad
                </button>
            </div>`;

        return;
    }

    elementos.lista.innerHTML = actividades
        .map(actividad => crearTarjetaActividad(actividad))
        .join("");
}

function getIconForType(tipo) {
    const icons = {
        1: "ri-book-read-line",
        2: "ri-shield-check-line",
        3: "ri-tools-line",
        4: "ri-group-line",
        5: "ri-mic-line",
        6: "ri-presentation-line",
        7: "ri-book-open-line",
        8: "ri-translate-2",
        9: "ri-heart-3-line",
        10: "ri-trophy-line",
        11: "ri-basketball-line",
        12: "ri-palette-line",
        13: "ri-group-2-line",
        14: "ri-award-line"
    };

    return icons[Number(tipo)] || "ri-award-line";
}

function crearTarjetaActividad(actividad) {
    const id = obtenerIdActividad(actividad);

    const nombre =
        actividad.nombre ?? actividad.Nombre ?? "Sin nombre";

    const tipo =
        actividad.tipo ?? actividad.Tipo ?? 14;

    const organizacion =
        actividad.organizacion ??
        actividad.Organizacion ??
        "Organización no especificada";

    const estado = Number(
        actividad.estado ?? actividad.Estado
    );

    const icon = getIconForType(tipo);

    const etiquetaEstado = estado === ESTADOS.EnCurso
        ? `<span class="status current"><span class="status-dot"></span>En curso</span>`
        : `<span class="status completed"><span class="status-dot"></span>Finalizada</span>`;

    const inicio = formatearFecha(
        actividad.fechaInicio ?? actividad.FechaInicio
    );

    const fin = estado === ESTADOS.EnCurso
        ? "Actualmente"
        : formatearFecha(
            actividad.fechaFin ?? actividad.FechaFin
        );

    return `
        <article class="education-card">
            <div class="card-top">
                <div class="degree-icon">
                    <i class="${icon}"></i>
                </div>

                <div class="card-actions">
                    <button class="icon-btn view" type="button"
                            title="Ver"
                            onclick="verDetalleActividad(${id})">
                        <i class="ri-eye-line"></i>
                    </button>

                    <button class="icon-btn" type="button"
                            title="Editar"
                            onclick="editarActividad(${id})">
                        <i class="ri-edit-line"></i>
                    </button>

                    <button class="icon-btn delete" type="button"
                            title="Eliminar"
                            onclick="solicitarEliminacion(${id})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>

            <h3 class="text-[14px] leading-tight mb-1"
                style="font-size:15px;margin-top:12px;">
                ${escaparHTML(nombre)}
            </h3>

            <div class="card-institution"
                 style="color:var(--muted);font-weight:600;font-size:11px;">
                ${escaparHTML(obtenerNombreTipo(tipo))}
            </div>

            <div class="card-institution" style="margin-top:2px;">
                ${escaparHTML(organizacion)}
            </div>

            <div class="card-meta">
                ${etiquetaEstado}
                <span>
                    <i class="ri-calendar-line"></i>
                    ${escaparHTML(inicio)}
                </span>
                <span>
                    <i class="ri-flag-line"></i>
                    ${escaparHTML(fin)}
                </span>
            </div>
        </article>`;
}

function actualizarEstadisticas() {
    const enCurso = actividades.filter(actividad =>
        Number(actividad.estado ?? actividad.Estado) === ESTADOS.EnCurso
    ).length;

    const total = actividades.length;

    const totalElement = document.getElementById("totalStudies");
    const currentElement = document.getElementById("currentStudies");
    const completedElement = document.getElementById("completedStudies");

    if (totalElement) totalElement.textContent = total;
    if (currentElement) currentElement.textContent = enCurso;
    if (completedElement) completedElement.textContent = total - enCurso;
}

function mostrarErrorLista(mensaje) {
    if (!elementos.lista) return;

    elementos.lista.innerHTML = `
        <div class="error-state">
            <div class="empty-icon">
                <i class="ri-error-warning-line"></i>
            </div>
            <h3>Error</h3>
            <p>${escaparHTML(mensaje)}</p>
            <button class="primary-btn" type="button"
                    onclick="cargarActividades()">
                Reintentar
            </button>
        </div>`;
}

// DETALLES
function asignarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor ?? "";
    }
}

function verDetalleActividad(id) {
    const actividad = actividades.find(item =>
        obtenerIdActividad(item) === Number(id)
    );

    if (!actividad) {
        mostrarToast("No se encontró la actividad.", "error");
        return;
    }

    if (!elementos.detailModal) {
        mostrarToast("No se encontró el modal de detalles.", "error");
        return;
    }

    actividadDetalleActual = actividad;

    const estado = Number(
        actividad.estado ?? actividad.Estado
    );

    const tipo = actividad.tipo ?? actividad.Tipo;
    const duracion = actividad.duracion ?? actividad.Duracion;

    const unidad = obtenerNombreUnidad(
        actividad.unidadDuracion ?? actividad.UnidadDuracion
    );

    asignarTexto(
        "detailCareer",
        actividad.nombre ?? actividad.Nombre ?? "Sin nombre"
    );

    asignarTexto("detailTypeLabel", obtenerNombreTipo(tipo));

    asignarTexto(
        "detailInstitution",
        actividad.organizacion ??
        actividad.Organizacion ??
        "No especificada"
    );

    asignarTexto(
        "detailModalidad",
        obtenerNombreModalidad(
            actividad.modalidad ?? actividad.Modalidad
        )
    );

    asignarTexto(
        "detailDuracionText",
        duracion !== null && duracion !== undefined
            ? `${duracion} ${unidad}`
            : "No especificada"
    );

    asignarTexto(
        "detailStartDate",
        formatearFecha(
            actividad.fechaInicio ?? actividad.FechaInicio
        )
    );

    asignarTexto(
        "detailEndDate",
        estado === ESTADOS.EnCurso
            ? "Actualmente"
            : formatearFecha(
                actividad.fechaFin ?? actividad.FechaFin
            )
    );

    asignarTexto(
        "detailDescription",
        actividad.descripcion ??
        actividad.Descripcion ??
        "Sin descripción."
    );

    const status = document.getElementById("detailStatus");

    if (status) {
        status.innerHTML = estado === ESTADOS.EnCurso
            ? `<span class="status current"><span class="status-dot"></span>En curso</span>`
            : `<span class="status completed"><span class="status-dot"></span>Finalizada</span>`;
    }

    configurarDocumentoDetalle(
        obtenerDocumentoId(actividad),
        actividad.nombreDocumento ??
        actividad.NombreDocumento ??
        "Constancia"
    );

    elementos.detailModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function configurarDocumentoDetalle(documentoId, nombreDocumento) {
    const status = document.getElementById("detailCertificateStatus");
    const actions = document.getElementById("detailCertificateActions");

    if (!status || !actions) return;

    if (!documentoId) {
        status.textContent = "Sin documento adjunto";

        actions.innerHTML = `
            <span style="color:#84909c;font-size:12px;">
                No adjunto
            </span>`;

        return;
    }

    const nombreCodificado = encodeURIComponent(nombreDocumento)
        .replace(/'/g, "%27");

    status.textContent = `Documento vinculado #${documentoId}`;

    actions.innerHTML = `
        <button class="icon-btn view" type="button"
                title="Ver"
                onclick="abrirVisualizadorDocumento(${Number(documentoId)}, decodeURIComponent('${nombreCodificado}'))">
            <i class="ri-eye-line"></i>
        </button>

        <button class="icon-btn" type="button"
                title="Descargar"
                onclick="descargarDocumento(${Number(documentoId)})">
            <i class="ri-download-cloud-2-line"></i>
        </button>

        <button class="icon-btn delete" type="button"
                title="Quitar"
                onclick="solicitarQuitarDocumento('detalle')">
            <i class="ri-delete-bin-line"></i>
        </button>`;
}

function cerrarDetalleActividad(restaurarScroll = true) {
    if (elementos.detailModal) {
        elementos.detailModal.classList.remove("show");
    }

    actividadDetalleActual = null;

    if (restaurarScroll) {
        restaurarScrollSegunModal();
    }
}

// DOCUMENTO VINCULADO A LA ACTIVIDAD
function solicitarQuitarDocumento(origen = "formulario") {
    let documentoId = null;

    if (origen === "formulario") {
        documentoId = documentoActual;
    } else if (actividadDetalleActual) {
        documentoId = obtenerDocumentoId(actividadDetalleActual);
    }

    if (!documentoId) {
        mostrarToast("No hay documento vinculado.", "info");
        return;
    }

    if (!elementos.removeDocumentModal) {
        mostrarToast("No se encontró el modal de confirmación.", "error");
        return;
    }

    documentoPendienteQuitar = {
        origen,
        documentoId
    };

    elementos.removeDocumentModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function cerrarModalQuitarDocumento(restaurarScroll = true) {
    if (elementos.removeDocumentModal) {
        elementos.removeDocumentModal.classList.remove("show");
    }

    documentoPendienteQuitar = null;

    if (restaurarScroll) {
        restaurarScrollSegunModal();
    }
}

async function confirmarQuitarDocumento() {
    if (!documentoPendienteQuitar) return;

    const origen = documentoPendienteQuitar.origen;
    const boton = document.getElementById("confirmRemoveDocumentBtn");

    if (boton) {
        boton.disabled = true;
        boton.innerHTML = `<i class="ri-loader-4-line"></i>...`;
    }

    try {
        if (origen === "formulario") {
            documentoActual = null;

            mostrarDocumentoActual(null);

            cerrarModalQuitarDocumento(false);

            mostrarToast(
                "El documento se desvinculará al guardar los cambios.",
                "info"
            );

            restaurarScrollSegunModal();
            return;
        }

        if (!actividadDetalleActual) {
            throw new Error("No se encontró la actividad.");
        }

        await desvincularDocumentoEnServidor(actividadDetalleActual);

        cerrarModalQuitarDocumento(false);
        cerrarDetalleActividad(false);

        await cargarActividades();

        mostrarToast(
            "Documento desvinculado correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al quitar documento:", error);
        mostrarToast(error.message, "error");
        if (manejarErrorAcceso(error)) return;
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = "Sí, quitar";
        }
    }
}

async function desvincularDocumentoEnServidor(actividad) {
    const id = obtenerIdActividad(actividad);
    const dto = crearDTOActividad(actividad, null);

    await apiRequest(
        `${ACTIVIDAD_ENDPOINT}/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(dto)
        }
    );
}

function mostrarDocumentoActual(documentoId) {
    const contenedor = elementos.certificadoActual;

    if (!contenedor) return;

    if (!documentoId) {
        contenedor.innerHTML = `
            <span class="document-empty">
                <i class="ri-file-info-line"></i>
                Sin documento vinculado
            </span>`;

        return;
    }

    contenedor.innerHTML = `
        <div class="document-current-info">
            <span>
                <i class="ri-file-check-line"></i>
                Doc #${Number(documentoId)}
            </span>

            <div class="document-actions">
                <button type="button" class="document-link"
                        onclick="abrirVisualizadorDocumento(${Number(documentoId)}, 'Constancia')">
                    Ver
                </button>

                <button type="button"
                        class="document-link danger"
                        onclick="solicitarQuitarDocumento('formulario')">
                    Quitar
                </button>
            </div>
        </div>`;
}

// FORMULARIO
function limpiarArchivo() {
    if (elementos.certificado) {
        elementos.certificado.value = "";
    }
}

function actualizarDocumentosUI() {
    // El checkbox correcto es elementos.estado.
    const estaEnCurso = Boolean(elementos.estado?.checked);

    const campo = elementos.certificado;
    const contenedor = document.getElementById("certificadoField");
    const mensaje = document.getElementById("documentosEnCursoMensaje");
    const botonQuitar = document.getElementById("quitarCertificado");

    if (campo) {
        campo.disabled = estaEnCurso;

        if (estaEnCurso) {
            campo.value = "";
        }
    }

    if (contenedor) {
        contenedor.classList.toggle(
            "document-disabled",
            estaEnCurso
        );
    }

    if (mensaje) {
        mensaje.classList.toggle("show", estaEnCurso);
    }

    if (botonQuitar) {
        botonQuitar.style.display = estaEnCurso ? "none" : "";
    }

    if (estaEnCurso && documentoActual) {
        documentoActual = null;
        mostrarDocumentoActual(null);
    }
}

function abrirFormularioNuevo() {
    if (!elementos.formulario || !elementos.modal) {
        mostrarToast("No se encontró el formulario de actividades.", "error");
        return;
    }

    elementos.formulario.reset();

    if (elementos.id) {
        elementos.id.value = "";
    }

    limpiarErrores();

    documentoActual = null;

    mostrarDocumentoActual(null);

    asignarTexto("modalTitle", "Agregar actividad");

    if (elementos.guardarTexto) {
        elementos.guardarTexto.textContent = "Guardar actividad";
    }

    actualizarCampoFechaFin();

    elementos.modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function cerrarFormulario() {
    if (guardando) return;

    if (elementos.modal) {
        elementos.modal.classList.remove("show");
    }

    restaurarScrollSegunModal();
}

function editarActividad(id) {
    const actividad = actividades.find(item =>
        obtenerIdActividad(item) === Number(id)
    );

    if (!actividad) {
        mostrarToast("No se encontró la actividad.", "error");
        return;
    }

    if (!elementos.formulario || !elementos.modal) {
        mostrarToast("No se encontró el formulario de actividades.", "error");
        return;
    }

    elementos.formulario.reset();
    limpiarErrores();

    if (elementos.id) {
        elementos.id.value = obtenerIdActividad(actividad);
    }

    if (elementos.nombre) {
        elementos.nombre.value =
            actividad.nombre ?? actividad.Nombre ?? "";
    }

    if (elementos.tipo) {
        elementos.tipo.value = obtenerNombreEnum(
            actividad.tipo ?? actividad.Tipo,
            TIPOS_ACTIVIDAD
        );
    }

    if (elementos.modalidad) {
        elementos.modalidad.value = obtenerNombreEnum(
            actividad.modalidad ?? actividad.Modalidad,
            MODALIDADES
        );
    }

    if (elementos.organizacion) {
        elementos.organizacion.value =
            actividad.organizacion ??
            actividad.Organizacion ??
            "";
    }

    if (elementos.estado) {
        elementos.estado.checked =
            Number(actividad.estado ?? actividad.Estado) === ESTADOS.EnCurso;
    }

    if (elementos.fechaInicio) {
        elementos.fechaInicio.value = normalizarFechaInput(
            actividad.fechaInicio ?? actividad.FechaInicio
        );
    }

    if (elementos.fechaFin) {
        elementos.fechaFin.value = normalizarFechaInput(
            actividad.fechaFin ?? actividad.FechaFin
        );
    }

    if (elementos.duracion) {
        elementos.duracion.value =
            actividad.duracion ??
            actividad.Duracion ??
            "";
    }

    if (elementos.unidadDuracion) {
        elementos.unidadDuracion.value =
            obtenerNombreEnum(
                actividad.unidadDuracion ?? actividad.UnidadDuracion,
                UNIDADES_DURACION
            ) || "Horas";
    }

    if (elementos.descripcion) {
        elementos.descripcion.value =
            actividad.descripcion ??
            actividad.Descripcion ??
            "";
    }

    documentoActual = obtenerDocumentoId(actividad);

    mostrarDocumentoActual(documentoActual);

    asignarTexto("modalTitle", "Editar actividad");

    if (elementos.guardarTexto) {
        elementos.guardarTexto.textContent = "Guardar cambios";
    }

    actualizarCampoFechaFin();

    elementos.modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function actualizarCampoFechaFin() {
    const estaEnCurso = Boolean(elementos.estado?.checked);

    if (elementos.fechaFin) {
        elementos.fechaFin.disabled = estaEnCurso;

        if (estaEnCurso) {
            elementos.fechaFin.value = "";
        }
    }

    if (elementos.fechaFinGroup) {
        elementos.fechaFinGroup.style.opacity =
            estaEnCurso ? ".5" : "1";
    }

    actualizarDocumentosUI();
}

function limpiarErrores() {
    document.querySelectorAll(".field-error").forEach(elemento => {
        elemento.textContent = "";
    });

    document.querySelectorAll(".field").forEach(elemento => {
        elemento.classList.remove("invalid");
    });
}

function mostrarErrorCampo(id, mensaje) {
    const error = document.getElementById(id);

    if (error) {
        error.textContent = mensaje;
        error.closest(".field")?.classList.add("invalid");
    }
}

function validarFormulario() {
    limpiarErrores();

    let valido = true;

    if (!elementos.nombre?.value.trim()) {
        mostrarErrorCampo("errNombre", "El nombre es obligatorio.");
        valido = false;
    }

    if (!elementos.tipo?.value) {
        mostrarErrorCampo("errTipo", "Selecciona un tipo de actividad.");
        valido = false;
    }

    if (!elementos.modalidad?.value) {
        mostrarErrorCampo("errModalidad", "Selecciona una modalidad.");
        valido = false;
    }

    const fechaInicio = elementos.fechaInicio?.value || "";
    const fechaFin = elementos.fechaFin?.value || "";

    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
        mostrarErrorCampo(
            "errFechaFin",
            "La fecha final no puede ser anterior a la inicial."
        );

        valido = false;
    }

    const duracion = elementos.duracion?.value || "";

    if (duracion && (!Number.isFinite(Number(duracion)) || Number(duracion) <= 0)) {
        mostrarErrorCampo(
            "errDuracion",
            "La duración debe ser mayor que cero."
        );

        valido = false;
    }

    const archivo = elementos.certificado?.files?.[0];

    if (archivo && archivo.size > MAX_DOCUMENTO_BYTES) {
        mostrarErrorCampo(
            "errCertificado",
            "El archivo no puede superar los 10 MB."
        );

        valido = false;
    }

    if (archivo && archivo.size === 0) {
        mostrarErrorCampo(
            "errCertificado",
            "El archivo está vacío."
        );

        valido = false;
    }

    return valido;
}

// CONSTRUCCIÓN DEL DTO
function crearDTOActividad(actividad, documentoId) {
    return {
        nombre: actividad.nombre ?? actividad.Nombre,

        tipo: obtenerValorEnum(
            actividad.tipo ?? actividad.Tipo,
            TIPOS_ACTIVIDAD
        ),

        modalidad: obtenerValorEnum(
            actividad.modalidad ?? actividad.Modalidad,
            MODALIDADES
        ),

        organizacion:
            actividad.organizacion ??
            actividad.Organizacion ??
            null,

        descripcion:
            actividad.descripcion ??
            actividad.Descripcion ??
            null,

        estado: Number(
            actividad.estado ?? actividad.Estado
        ),

        fechaInicio:
            actividad.fechaInicio ??
            actividad.FechaInicio ??
            null,

        fechaFin:
            actividad.fechaFin ??
            actividad.FechaFin ??
            null,

        duracion:
            actividad.duracion ??
            actividad.Duracion ??
            null,

        unidadDuracion: obtenerValorEnum(
            actividad.unidadDuracion ?? actividad.UnidadDuracion,
            UNIDADES_DURACION
        ),

        documentoId
    };
}

// GUARDAR ACTIVIDAD
async function guardarActividad(evento) {
    evento.preventDefault();

    if (guardando || !elementos.formulario) return;

    if (!validarFormulario()) return;

    const id = elementos.id?.value || "";
    const esEdicion = Boolean(id);

    const url = esEdicion
        ? `${ACTIVIDAD_ENDPOINT}/${encodeURIComponent(id)}`
        : ACTIVIDAD_ENDPOINT;

    const estado = elementos.estado?.checked
        ? ESTADOS.EnCurso
        : ESTADOS.Finalizada;

    let documentoId = estado === ESTADOS.EnCurso
        ? null
        : documentoActual;

    const archivo = estado === ESTADOS.EnCurso
        ? null
        : elementos.certificado?.files?.[0] || null;

    const dto = {
        nombre: elementos.nombre.value.trim(),

        tipo: obtenerValorEnum(
            elementos.tipo.value,
            TIPOS_ACTIVIDAD
        ),

        modalidad: obtenerValorEnum(
            elementos.modalidad.value,
            MODALIDADES
        ),

        organizacion:
            elementos.organizacion?.value.trim() || null,

        descripcion:
            elementos.descripcion?.value.trim() || null,

        estado,

        fechaInicio:
            elementos.fechaInicio?.value || null,

        fechaFin:
            estado === ESTADOS.EnCurso
                ? null
                : elementos.fechaFin?.value || null,

        duracion:
            elementos.duracion?.value
                ? Number(elementos.duracion.value)
                : null,

        unidadDuracion: elementos.duracion?.value
            ? obtenerValorEnum(
                elementos.unidadDuracion?.value,
                UNIDADES_DURACION
            )
            : null,

        documentoId
    };

    try {
        guardando = true;

        if (elementos.guardar) {
            elementos.guardar.disabled = true;
        }

        if (elementos.guardarTexto) {
            elementos.guardarTexto.textContent = "Guardando...";
        }

        if (archivo) {
            documentoId = await subirDocumento(archivo);
            dto.documentoId = documentoId;
        }

        await apiRequest(url, {
            method: esEdicion ? "PUT" : "POST",
            body: JSON.stringify(dto)
        });

        if (elementos.modal) {
            elementos.modal.classList.remove("show");
        }

        restaurarScrollSegunModal();

        await cargarActividades();

        mostrarModalExito(esEdicion);

    } catch (error) {
        console.error("Error al guardar actividad:", error);
        if (manejarErrorAcceso(error)) return;
        mostrarToast(
            error.message || "No fue posible guardar la actividad.",
            "error"
        );

    } finally {
        guardando = false;

        if (elementos.guardar) {
            elementos.guardar.disabled = false;
        }

        if (elementos.guardarTexto) {
            elementos.guardarTexto.textContent =
                id ? "Guardar cambios" : "Guardar actividad";
        }
    }
}

// MODAL DE ÉXITO
function mostrarModalExito(esEdicion) {
    if (!elementos.successModal) return;

    asignarTexto(
        "successTitle",
        esEdicion ? "Actividad actualizada" : "Actividad guardada"
    );

    elementos.successModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function cerrarModalExito() {
    if (elementos.successModal) {
        elementos.successModal.classList.remove("show");
    }

    restaurarScrollSegunModal();
}

// ELIMINACIÓN
function solicitarEliminacion(id) {
    if (!elementos.deleteModal) {
        mostrarToast("No se encontró el modal de eliminación.", "error");
        return;
    }

    actividadAEliminar = id;

    elementos.deleteModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function cerrarModalEliminar() {
    if (elementos.deleteModal) {
        elementos.deleteModal.classList.remove("show");
    }

    actividadAEliminar = null;

    restaurarScrollSegunModal();
}

async function eliminarActividad() {
    if (
        actividadAEliminar === null ||
        actividadAEliminar === undefined
    ) {
        return;
    }

    const boton = document.getElementById("confirmDeleteBtn");

    if (boton) {
        boton.disabled = true;
        boton.textContent = "...";
    }

    try {
        await apiRequest(
            `${ACTIVIDAD_ENDPOINT}/${encodeURIComponent(actividadAEliminar)}`,
            {
                method: "DELETE"
            }
        );

        cerrarModalEliminar();

        mostrarToast(
            "Actividad eliminada correctamente.",
            "success"
        );

        await cargarActividades();

    } catch (error) {
        console.error("Error al eliminar actividad:", error);
        if (manejarErrorAcceso(error)) return;
        mostrarToast(
            error.message || "No fue posible eliminar la actividad.",
            "error"
        );

    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = "Sí, eliminar";
        }
    }
}

// UTILIDADES
function restaurarScrollSegunModal() {
    const modalAbierto = document.querySelector(
        ".modal-overlay.show"
    );

    document.body.style.overflow =
        modalAbierto ? "hidden" : "";
}

function normalizarFechaInput(fecha) {
    if (!fecha) return "";

    return String(fecha).substring(0, 10);
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const valor = normalizarFechaInput(fecha);
    const partes = valor.split("-");

    if (partes.length !== 3) {
        return String(fecha);
    }

    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    if (
        !Number.isInteger(anio) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(dia)
    ) {
        return String(fecha);
    }

    return new Date(anio, mes - 1, dia).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short"
    });
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(
        /[&<>"']/g,
        caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]
    );
}

function mostrarToast(mensaje, tipo = "info") {
    const toast = document.getElementById("toastNotification");

    if (!toast) {
        console.log(mensaje);
        return;
    }

    const icono = document.getElementById("toastIcon");
    const texto = document.getElementById("toastMessage");

    if (texto) {
        texto.textContent = mensaje;
    }

    if (icono) {
        const iconos = {
            success: "ri-check-line",
            error: "ri-error-warning-line",
            info: "ri-information-line"
        };

        icono.className = iconos[tipo] || iconos.info;
    }

    toast.classList.add("show");

    clearTimeout(toast._timeout);

    toast._timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

// EVENTOS
function configurarEventos() {
    registrarEvento("addEducationBtn", "click", abrirFormularioNuevo);

    registrarEvento("closeFormBtn", "click", cerrarFormulario);
    registrarEvento("cancelFormBtn", "click", cerrarFormulario);

    registrarEvento("cancelDeleteBtn", "click", cerrarModalEliminar);
    registrarEvento("confirmDeleteBtn", "click", eliminarActividad);

    if (elementos.formulario) {
        elementos.formulario.addEventListener("submit", guardarActividad);
    }

    if (elementos.estado) {
        elementos.estado.addEventListener(
            "change",
            actualizarCampoFechaFin
        );
    }

    registrarEvento("closeSuccessBtn", "click", cerrarModalExito);

    registrarEvento("closeDetailBtn", "click", cerrarDetalleActividad);
    registrarEvento("closeDetailFooterBtn", "click", cerrarDetalleActividad);

    registrarEvento(
        "closeDocumentViewerBtn",
        "click",
        cerrarVisualizadorDocumento
    );

    registrarEvento(
        "closeDocumentViewerFooterBtn",
        "click",
        cerrarVisualizadorDocumento
    );

    registrarEvento(
        "closeRemoveDocumentBtn",
        "click",
        cerrarModalQuitarDocumento
    );

    registrarEvento(
        "cancelRemoveDocumentBtn",
        "click",
        cerrarModalQuitarDocumento
    );

    registrarEvento(
        "confirmRemoveDocumentBtn",
        "click",
        confirmarQuitarDocumento
    );

    registrarEvento("downloadViewerDocumentBtn", "click", () => {
        if (
            !blobDocumentoActual ||
            !documentoVisualizadoActual
        ) {
            return;
        }

        const url = URL.createObjectURL(blobDocumentoActual);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = nombreDocumentoActual || "documento";

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    });

    document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.addEventListener("click", evento => {
            if (evento.target !== modal) return;

            if (modal.id === "formModal") {
                cerrarFormulario();
            } else if (modal.id === "deleteModal") {
                cerrarModalEliminar();
            } else if (modal.id === "successModal") {
                cerrarModalExito();
            } else if (modal.id === "detailModal") {
                cerrarDetalleActividad();
            } else if (modal.id === "documentViewerModal") {
                cerrarVisualizadorDocumento();
            } else if (modal.id === "removeDocumentModal") {
                cerrarModalQuitarDocumento();
            }
        });
    });

    document.addEventListener("keydown", evento => {
        if (evento.key !== "Escape") return;

        if (elementos.removeDocumentModal?.classList.contains("show")) {
            cerrarModalQuitarDocumento();

        } else if (elementos.documentViewerModal?.classList.contains("show")) {
            cerrarVisualizadorDocumento();

        } else if (elementos.detailModal?.classList.contains("show")) {
            cerrarDetalleActividad();

        } else if (elementos.deleteModal?.classList.contains("show")) {
            cerrarModalEliminar();

        } else if (elementos.successModal?.classList.contains("show")) {
            cerrarModalExito();

        } else if (elementos.modal?.classList.contains("show")) {
            cerrarFormulario();
        }
    });
}


// SKELETON LOADER
function mostrarSkeleton() {
    if (document.querySelector(".skeleton-screen")) return;

    document.body.classList.add("skeleton-loading");
    document.body.classList.remove("skeleton-ready");

    const skeleton = document.createElement("div");

    skeleton.className = "skeleton-screen";
    skeleton.setAttribute("aria-hidden", "true");

    skeleton.innerHTML = `
        <aside class="skeleton-sidebar">
            <div class="skeleton-block skeleton-logo"></div>

            <div class="skeleton-block skeleton-nav-item"></div>
            <div class="skeleton-block skeleton-nav-item"></div>
            <div class="skeleton-block skeleton-nav-item"></div>
            <div class="skeleton-block skeleton-nav-item"></div>
            <div class="skeleton-block skeleton-nav-item"></div>
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

    skeleton.addEventListener("transitionend", () => {
        skeleton.remove();
    }, { once: true });

    // Respaldo para dispositivos que no ejecutan la transición.
    setTimeout(() => {
        skeleton.remove();
    }, 450);
}


// INICIALIZACIÓN

// INICIALIZACIÓN
async function inicializarPagina() {
    document.body.style.visibility = "visible";

    // Mostrar el skeleton desde el inicio.
    mostrarSkeleton();

    const accesoPermitido = await verificarAccesoInicial();

    if (!accesoPermitido) {
        ocultarSkeleton();
        return;
    }

    try {
    if (window.PortalTheme?.load) {
        const resultadoTema = await window.PortalTheme.load();

        if (resultadoTema && !resultadoTema.ok) {
            console.error(
                "No se pudieron cargar las preferencias visuales:",
                resultadoTema.error
            );
        }
    }
} catch (error) {
    console.error("Error al cargar el tema:", error);
}

    configurarEventos();

    actualizarCampoFechaFin();

    await Promise.all([
        cargarUsuario(),
        cargarActividades()
    ]);

    // Mostrar la página cuando los datos estén preparados.
    ocultarSkeleton();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarPagina, {
        once: true
    });
} else {
    inicializarPagina();
}
