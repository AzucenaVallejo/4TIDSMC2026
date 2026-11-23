
"use strict";

// ---------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------

const API_BASE_URL = "https://pureblood-starfish-happening.ngrok-free.dev/api";
const FORMACION_ENDPOINT = `${API_BASE_URL}/Formacion`;
const AUTH_ENDPOINT = `${API_BASE_URL}/Auth`;
const DOCUMENTOS_ENDPOINT = `${API_BASE_URL}/Documentos`;

const MAX_DOCUMENTO_BYTES = 10 * 1024 * 1024;
const TIMEOUT_SOLICITUD = 10000;
const TIMEOUT_SESION = 5000;
const REDIRECT_DELAY = 2500;

let formaciones = [];
let formacionAEliminar = null;
let guardando = false;

let documentoCertificadoActual = null;
let documentoTituloActual = null;

let formacionDetalleActual = null;
let documentoPendienteQuitar = null;
let documentoVisualizadoActual = null;
let urlDocumentoTemporal = null;
let blobDocumentoActual = null;
let nombreDocumentoActual = null;

let redireccionEnProceso = false;
let contadorSolicitudDocumento = 0;

// ---------------------------------------------------------
// ELEMENTOS DEL DOM
// ---------------------------------------------------------

const elementos = {
    lista: document.getElementById("educationList"),
    modal: document.getElementById("formModal"),
    deleteModal: document.getElementById("deleteModal"),
    formulario: document.getElementById("educationForm"),

    id: document.getElementById("formEducationId"),
    nivel: document.getElementById("formGrado"),
    carrera: document.getElementById("formCarrera"),
    institucion: document.getElementById("formInstitucion"),
    enCurso: document.getElementById("formEnCurso"),
    fechaInicio: document.getElementById("formFechaInicio"),
    fechaFin: document.getElementById("formFechaFin"),
    fechaFinGroup: document.getElementById("fechaFinGroup"),
    descripcion: document.getElementById("formDescripcion"),

    guardar: document.getElementById("saveEducationBtn"),
    guardarTexto: document.getElementById("saveButtonText"),
    usuario: document.getElementById("userName"),

    certificado: document.getElementById("formCertificado"),
    titulo: document.getElementById("formTitulo"),
    certificadoActual: document.getElementById("certificadoActual"),
    tituloActual: document.getElementById("tituloActual"),
    certificadoSeleccionado: document.getElementById("certificadoSeleccionado"),
    tituloSeleccionado: document.getElementById("tituloSeleccionado"),

    successModal: document.getElementById("successModal"),
    detailModal: document.getElementById("detailModal"),
    documentViewerModal: document.getElementById("documentViewerModal"),
    removeDocumentModal: document.getElementById("removeDocumentModal"),

    sessionErrorModal: document.getElementById("sessionErrorModal"),
    connectionErrorModal: document.getElementById("connectionErrorModal")
};

// ---------------------------------------------------------
// SOLICITUDES HTTP
// ---------------------------------------------------------

// Todas las solicitudes utilizan la cookie HttpOnly.
// Nunca se leen ni almacenan tokens desde JavaScript.
async function fetchConTimeout(url, options = {}, timeout = TIMEOUT_SOLICITUD) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers = new Headers(options.headers || {});

    headers.set("ngrok-skip-browser-warning", "true");

    if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
    }

    try {
        return await fetch(url, {
            ...options,
            headers,
            credentials: "include",
            cache: "no-store",
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function leerRespuesta(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return await response.json();
    }

    const texto = await response.text();

    return texto ? { message: texto } : null;
}
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

    const response = await fetchConTimeout(
        url,
        config,
        options.timeout || TIMEOUT_SOLICITUD
    );

    const data = await leerRespuesta(response);

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

// ---------------------------------------------------------
// CONTROL DE SESIÓN Y CONEXIÓN
// ---------------------------------------------------------

function manejarErrorAcceso(error) {
    if (!error) return false;

    if (redireccionEnProceso) {
        return true;
    }

    // SESIÓN INVÁLIDA
    if (error.status === 401 || error.status === 403) {
        redireccionEnProceso = true;

        // Retirar el skeleton antes de mostrar el modal.
        ocultarSkeleton();

        document.body.style.visibility = "visible";
        document.body.style.overflow = "hidden";

        const modal = elementos.sessionErrorModal;

        if (modal) {
            modal.classList.add("show");
        } else {
            console.error(
                "No se encontró el elemento HTML sessionErrorModal."
            );
        }

        console.error("Sesión inválida:", error);

        setTimeout(() => {
            window.location.replace("login.html");
        }, REDIRECT_DELAY);

        return true;
    }

    // ERROR DE CONEXIÓN O TIEMPO DE ESPERA
    if (
    error.name === "AbortError" ||
    error instanceof TypeError ||
    [500, 502, 503, 504].includes(error.status)
) {
        redireccionEnProceso = true;

        // Retirar el skeleton antes de mostrar el modal.
        ocultarSkeleton();

        document.body.style.visibility = "visible";
        document.body.style.overflow = "hidden";

        const modal = elementos.connectionErrorModal;

        if (modal) {
            modal.classList.add("show");
        } else {
            console.error(
                "No se encontró el elemento HTML connectionErrorModal."
            );
        }

        setTimeout(() => {
            window.location.replace("index.html");
        }, REDIRECT_DELAY);

        return true;
    }

    return false;
}
// ---------------------------------------------------------
// DOCUMENTOS: SUBIDA
// ---------------------------------------------------------

async function subirDocumento(archivo, tipoDocumento) {
    if (!archivo) return null;

    if (archivo.size > MAX_DOCUMENTO_BYTES) {
        throw new Error(
            `El archivo "${archivo.name}" supera el límite permitido de 10 MB.`
        );
    }

    const datos = new FormData();

    datos.append("archivo", archivo);
    datos.append("tipoDocumento", String(tipoDocumento));

    const response = await fetchConTimeout(
        DOCUMENTOS_ENDPOINT,
        {
            method: "POST",
            body: datos
        }
    );

    const resultado = await leerRespuesta(response);

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
        !Number.isFinite(Number(documentoId)) ||
        Number(documentoId) <= 0
    ) {
        throw new Error(
            "El servidor recibió el archivo, pero no devolvió un identificador válido."
        );
    }

    return Number(documentoId);
}

// ---------------------------------------------------------
// DOCUMENTOS: OBTENCIÓN
// ---------------------------------------------------------

async function obtenerArchivoDocumento(documentoId) {
    if (!documentoId) {
        throw new Error("No se proporcionó un identificador de documento.");
    }

    const response = await fetchConTimeout(
        `${DOCUMENTOS_ENDPOINT}/${encodeURIComponent(documentoId)}/descargar`,
        {
            method: "GET"
        }
    );

    if (!response.ok) {
        const data = await leerRespuesta(response);

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

// ---------------------------------------------------------
// DESCARGA DE DOCUMENTOS
// ---------------------------------------------------------

async function descargarDocumento(documentoId) {
    if (!documentoId) {
        mostrarToast(
            "No se encontró el identificador del documento.",
            "error"
        );
        return;
    }

    try {
        const resultado = await obtenerArchivoDocumento(documentoId);

        const urlTemporal = URL.createObjectURL(resultado.blob);

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

        setTimeout(() => {
            URL.revokeObjectURL(urlTemporal);
        }, 1000);

    } catch (error) {
        console.error("Error al descargar el documento:", error);

        if (manejarErrorAcceso(error)) return;

        mostrarToast(
            error.message || "No fue posible descargar el documento.",
            "error"
        );
    }
}

// ---------------------------------------------------------
// VISUALIZADOR DE DOCUMENTOS
// ---------------------------------------------------------

async function abrirVisualizadorDocumento(documentoId, nombreDocumento) {
    if (!documentoId) {
        mostrarToast("No se encontró el documento.", "error");
        return;
    }

    const modal = elementos.documentViewerModal;
    const contenido = document.getElementById("documentViewerContent");
    const titulo = document.getElementById("documentViewerTitle");
    const descripcion = document.getElementById("documentViewerDescription");
    const nombre = document.getElementById("documentViewerFileName");
    const botonDescargar = document.getElementById("downloadViewerDocumentBtn");

    if (!modal || !contenido) {
        mostrarToast(
            "No se encontró el visualizador de documentos.",
            "error"
        );
        return;
    }

    cerrarVisualizadorDocumento(false);

    const solicitudActual = ++contadorSolicitudDocumento;

    documentoVisualizadoActual = documentoId;
    nombreDocumentoActual = nombreDocumento || `Documento ${documentoId}`;

    titulo.textContent = nombreDocumentoActual;
    descripcion.textContent = "Preparando la visualización del archivo...";
    nombre.textContent = nombreDocumentoActual;

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

        if (
            solicitudActual !== contadorSolicitudDocumento ||
            documentoVisualizadoActual !== documentoId
        ) {
            return;
        }

        blobDocumentoActual = resultado.blob;
        urlDocumentoTemporal = URL.createObjectURL(resultado.blob);

        const tipo = (resultado.contentType || "").toLowerCase();

        const esPDF =
            tipo.includes("application/pdf") ||
            nombreDocumentoActual.toLowerCase().endsWith(".pdf");

        const esImagen =
            tipo.startsWith("image/") ||
            /\.(png|jpe?g|gif|webp|bmp)$/i.test(nombreDocumentoActual);

        if (esPDF) {
            const iframe = document.createElement("iframe");

            iframe.className = "document-preview-frame";
            iframe.src = urlDocumentoTemporal;
            iframe.title = nombreDocumentoActual;

            contenido.replaceChildren(iframe);

            descripcion.textContent = "Vista previa del documento PDF.";

        } else if (esImagen) {
            const contenedor = document.createElement("div");
            contenedor.className = "document-preview-image-container";

            const imagen = document.createElement("img");

            imagen.className = "document-preview-image";
            imagen.src = urlDocumentoTemporal;
            imagen.alt = nombreDocumentoActual;

            contenedor.appendChild(imagen);
            contenido.replaceChildren(contenedor);

            descripcion.textContent = "Vista previa de la imagen.";

        } else {
            contenido.innerHTML = `
                <div class="document-preview-unavailable">
                    <i class="ri-file-download-line"
                       style="font-size:40px;color:#3980a5;margin-bottom:10px;display:block;text-align:center;">
                    </i>
                    <h3 style="text-align:center;">Vista previa no disponible</h3>
                    <p style="text-align:center;">
                        Este formato no se puede mostrar directamente.
                        Puedes descargar el archivo para abrirlo.
                    </p>
                </div>`;

            descripcion.textContent =
                "El formato requiere una aplicación compatible.";
        }

        nombre.textContent = obtenerNombreArchivo(
            resultado.disposition,
            documentoId
        );

        botonDescargar.disabled = false;

    } catch (error) {
        console.error("Error al visualizar el documento:", error);

        if (manejarErrorAcceso(error)) return;

        if (solicitudActual !== contadorSolicitudDocumento) {
            return;
        }

        contenido.innerHTML = `
            <div class="document-preview-unavailable">
                <i class="ri-error-warning-line"
                   style="font-size:40px;color:#D9536F;margin-bottom:10px;display:block;text-align:center;">
                </i>
                <h3 style="text-align:center;">No se pudo abrir el documento</h3>
                <p style="text-align:center;">
                    ${escaparHTML(error.message)}
                </p>
            </div>`;

        descripcion.textContent =
            "No fue posible cargar el archivo.";

        mostrarToast(error.message, "error");
    }
}

function cerrarVisualizadorDocumento(restaurarScroll = true) {
    contadorSolicitudDocumento++;

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

    const contenido = document.getElementById("documentViewerContent");

    if (contenido) {
        contenido.innerHTML = `
            <div class="document-viewer-loading">
                <i class="ri-loader-4-line"></i>
                <p>Cargando documento...</p>
            </div>`;
    }

    const botonDescargar = document.getElementById("downloadViewerDocumentBtn");

    if (botonDescargar) {
        botonDescargar.disabled = true;
    }

    if (restaurarScroll) {
        restaurarScrollSegunModal();
    }
}

// ---------------------------------------------------------
// USUARIO Y SESIÓN
// ---------------------------------------------------------

async function cargarUsuario() {
    try {
        const usuario = await apiRequest(`${AUTH_ENDPOINT}/me`);

        if (usuario && usuario.correo && elementos.usuario) {
            elementos.usuario.textContent = usuario.correo;
        }

    } catch (error) {
        console.error(
            "No fue posible obtener los datos de sesión:",
            error
        );

        if (manejarErrorAcceso(error)) return;

        mostrarToast(
            error.message || "No fue posible obtener los datos del usuario.",
            "error"
        );
    }
}

// ---------------------------------------------------------
// CARGA DE FORMACIONES
// ---------------------------------------------------------

async function cargarFormaciones() {
    if (!elementos.lista) return;

    elementos.lista.innerHTML = `
        <div class="loading-state">
            <i class="ri-loader-4-line"></i>
            <p>Cargando tu formación académica...</p>
        </div>`;

    try {
        const respuesta = await apiRequest(FORMACION_ENDPOINT);

        formaciones = Array.isArray(respuesta) ? respuesta : [];

        renderizarFormaciones();
        actualizarEstadisticas();

    } catch (error) {
        console.error(
            "Error al consultar las formaciones:",
            error
        );

        if (manejarErrorAcceso(error)) return;

        mostrarErrorLista(
            error.message || "No fue posible cargar tus registros."
        );
    }
}

function renderizarFormaciones() {
    if (formaciones.length === 0) {
        elementos.lista.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="ri-graduation-cap-line"></i>
                </div>

                <h3>Tu historial académico está vacío</h3>

                <p>
                    Todavía no tienes formaciones registradas.
                    Agrega tus estudios para comenzar a construir tu expediente.
                </p>

                <button class="primary-btn"
                        type="button"
                        onclick="abrirFormularioNuevo()">
                    <i class="ri-add-line"></i>
                    Agregar mi primera formación
                </button>
            </div>`;

        actualizarEstadisticas();
        return;
    }

    elementos.lista.innerHTML = formaciones
        .map(formacion => crearTarjetaFormacion(formacion))
        .join("");
}

function crearTarjetaFormacion(formacion) {
    const id = Number(formacion.id ?? formacion.Id);

    const nivel = obtenerNombreNivel(
        formacion.nivelEducativo ?? formacion.NivelEducativo
    );

    const carrera = formacion.carrera ?? formacion.Carrera ?? "";
    const titulo = carrera.trim() || nivel;

    const institucion = escaparHTML(
        formacion.institucion ??
        formacion.Institucion ??
        "Institución no especificada"
    );

    const descripcionOriginal =
        formacion.descripcion ?? formacion.Descripcion;

    const descripcion = descripcionOriginal
        ? escaparHTML(descripcionOriginal)
        : "Sin descripción adicional.";

    const enCurso = Boolean(
        formacion.enCurso ?? formacion.EnCurso
    );

    const estado = enCurso
        ? `<span class="status current"><span class="status-dot"></span>En curso</span>`
        : `<span class="status completed"><span class="status-dot"></span>Finalizada</span>`;

    const inicio = formatearFecha(
        formacion.fechaInicio ?? formacion.FechaInicio
    );

    const fin = enCurso
        ? "Actualmente"
        : formatearFecha(formacion.fechaFin ?? formacion.FechaFin);

    return `
        <article class="education-card">
            <div class="card-top">
                <div class="degree-icon">
                    <i class="ri-graduation-cap-line"></i>
                </div>

                <div class="card-actions">

                    <button class="icon-btn view"
                            type="button"
                            title="Ver información"
                            aria-label="Ver información de la formación"
                            onclick="verDetalleFormacion(${id})">
                        <i class="ri-eye-line"></i>
                    </button>

                    <button class="icon-btn"
                            type="button"
                            title="Editar formación"
                            aria-label="Editar formación"
                            onclick="editarFormacion(${id})">
                        <i class="ri-edit-line"></i>
                    </button>

                    <button class="icon-btn delete"
                            type="button"
                            title="Eliminar formación"
                            aria-label="Eliminar formación"
                            onclick="solicitarEliminacion(${id})">
                        <i class="ri-delete-bin-line"></i>
                    </button>

                </div>
            </div>

            <h3>${escaparHTML(titulo)}</h3>

            <div class="card-institution">${institucion}</div>

            <p class="card-description">${descripcion}</p>

            <div class="card-meta">
                ${estado}

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
    const enCurso = formaciones.filter(item =>
        Boolean(item.enCurso ?? item.EnCurso)
    ).length;

    const finalizadas = formaciones.length - enCurso;

    const total = document.getElementById("totalStudies");
    const actuales = document.getElementById("currentStudies");
    const completadas = document.getElementById("completedStudies");

    if (total) total.textContent = formaciones.length;
    if (actuales) actuales.textContent = enCurso;
    if (completadas) completadas.textContent = finalizadas;
}

function mostrarErrorLista(mensaje) {
    elementos.lista.innerHTML = `
        <div class="error-state">
            <div class="empty-icon">
                <i class="ri-error-warning-line"></i>
            </div>

            <h3>No se pudo cargar la información</h3>

            <p>${escaparHTML(mensaje)}</p>

            <button class="primary-btn"
                    type="button"
                    onclick="cargarFormaciones()">
                <i class="ri-refresh-line"></i>
                Intentar nuevamente
            </button>
        </div>`;
}

// ---------------------------------------------------------
// DETALLE DE FORMACIÓN
// ---------------------------------------------------------

function verDetalleFormacion(id) {
    const formacion = formaciones.find(item =>
        Number(item.id ?? item.Id) === Number(id)
    );

    if (!formacion) {
        mostrarToast(
            "No se encontró la formación seleccionada.",
            "error"
        );
        return;
    }

    formacionDetalleActual = formacion;

    const carrera = formacion.carrera ?? formacion.Carrera ?? "";

    const nivel = obtenerNombreNivel(
        formacion.nivelEducativo ?? formacion.NivelEducativo
    );

    const institucion =
        formacion.institucion ??
        formacion.Institucion ??
        "Institución no especificada";

    const enCurso = Boolean(
        formacion.enCurso ?? formacion.EnCurso
    );

    const fechaInicio =
        formacion.fechaInicio ?? formacion.FechaInicio;

    const fechaFin =
        formacion.fechaFin ?? formacion.FechaFin;

    const descripcion =
        formacion.descripcion ??
        formacion.Descripcion ??
        "Sin descripción adicional.";

    document.getElementById("detailCareer").textContent =
        carrera.trim() || nivel;

    document.getElementById("detailInstitution").textContent =
        institucion;

    document.getElementById("detailLevel").textContent = nivel;

    document.getElementById("detailStartDate").textContent =
        formatearFecha(fechaInicio);

    document.getElementById("detailEndDate").textContent =
        enCurso ? "Actualmente" : formatearFecha(fechaFin);

    document.getElementById("detailDescription").textContent =
        descripcion;

    document.getElementById("detailStatus").innerHTML = enCurso
        ? `<span class="status current"><span class="status-dot"></span>En curso</span>`
        : `<span class="status completed"><span class="status-dot"></span>Finalizada</span>`;

    const certificadoId =
        formacion.documentoCertificadoId ??
        formacion.DocumentoCertificadoId ??
        null;

    const tituloId =
        formacion.documentoTituloId ??
        formacion.DocumentoTituloId ??
        null;

    configurarDocumentoDetalle(
        "certificate",
        certificadoId,
        "Certificado académico"
    );

    configurarDocumentoDetalle(
        "title",
        tituloId,
        "Título académico"
    );

    elementos.detailModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function configurarDocumentoDetalle(tipo, documentoId, nombre) {
    const status = document.getElementById(
        tipo === "certificate"
            ? "detailCertificateStatus"
            : "detailTitleStatus"
    );

    const actions = document.getElementById(
        tipo === "certificate"
            ? "detailCertificateActions"
            : "detailTitleActions"
    );

    if (!status || !actions) return;

    if (!documentoId) {
        status.textContent = "Sin documento adjunto";

        actions.innerHTML = `
            <span class="document-not-attached"
                  style="color:#84909c;font-size:12px;">
                No adjunto
            </span>`;

        return;
    }

    const id = Number(documentoId);

    status.textContent = `Documento vinculado #${id}`;

    actions.innerHTML = `
        <button class="icon-btn view"
                type="button"
                title="Visualizar documento"
                aria-label="Visualizar ${escaparHTML(nombre)}"
                onclick="abrirVisualizadorDocumento(${id}, '${escaparHTML(nombre)}')">
            <i class="ri-eye-line"></i>
        </button>

        <button class="icon-btn"
                type="button"
                title="Descargar documento"
                aria-label="Descargar ${escaparHTML(nombre)}"
                onclick="descargarDocumento(${id})">
            <i class="ri-download-cloud-2-line"></i>
        </button>

        <button class="icon-btn delete"
                type="button"
                title="Quitar documento"
                aria-label="Quitar ${escaparHTML(nombre)}"
                onclick="solicitarQuitarDocumento('${tipo === "certificate" ? "certificado" : "titulo"}', 'detalle')">
            <i class="ri-delete-bin-line"></i>
        </button>`;
}

function cerrarDetalleFormacion(restaurarScroll = true) {
    if (elementos.detailModal) {
        elementos.detailModal.classList.remove("show");
    }

    formacionDetalleActual = null;

    if (restaurarScroll) {
        restaurarScrollSegunModal();
    }
}

// ---------------------------------------------------------
// QUITAR / DESVINCULAR DOCUMENTOS
// ---------------------------------------------------------

function solicitarQuitarDocumento(tipo, origen = "formulario") {
    const esCertificado = tipo === "certificado";

    let documentoId = null;

    if (origen === "formulario") {
        documentoId = esCertificado
            ? documentoCertificadoActual
            : documentoTituloActual;

    } else if (formacionDetalleActual) {
        documentoId = esCertificado
            ? (
                formacionDetalleActual.documentoCertificadoId ??
                formacionDetalleActual.DocumentoCertificadoId
            )
            : (
                formacionDetalleActual.documentoTituloId ??
                formacionDetalleActual.DocumentoTituloId
            );
    }

    if (!documentoId) {
        mostrarToast(
            "No hay un documento vinculado para quitar.",
            "info"
        );
        return;
    }

    documentoPendienteQuitar = {
        tipo,
        origen,
        documentoId
    };

    const mensaje = document.getElementById("removeDocumentMessage");

    if (mensaje) {
        mensaje.textContent =
            `El documento "${esCertificado ? "Certificado académico" : "Título académico"}" dejará de estar asociado a esta formación. El archivo no se eliminará físicamente del servidor.`;
    }

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
    if (!documentoPendienteQuitar || guardando) return;

    const { tipo, origen } = documentoPendienteQuitar;

    const boton = document.getElementById("confirmRemoveDocumentBtn");

    if (boton) {
        boton.disabled = true;
        boton.innerHTML = `
            <i class="ri-loader-4-line"></i>
            Procesando...`;
    }

    try {
        if (origen === "formulario") {
            if (tipo === "certificado") {
                documentoCertificadoActual = null;
                mostrarDocumentoActual("certificado", null);
            } else {
                documentoTituloActual = null;
                mostrarDocumentoActual("titulo", null);
            }

            cerrarModalQuitarDocumento(false);

            mostrarToast(
                "Documento marcado para quitar. Guarda la formación para aplicar el cambio.",
                "info"
            );

            restaurarScrollSegunModal();
            return;
        }

        if (!formacionDetalleActual) {
            throw new Error(
                "No se encontró la formación relacionada."
            );
        }

        await desvincularDocumentoEnServidor(
            formacionDetalleActual,
            tipo
        );

        cerrarModalQuitarDocumento(false);
        cerrarDetalleFormacion(false);

        await cargarFormaciones();

        mostrarToast(
            "El documento se desvinculó de la formación. El archivo permanece almacenado.",
            "success"
        );

    } catch (error) {
        console.error("Error al quitar el documento:", error);

        if (manejarErrorAcceso(error)) return;

        mostrarToast(
            error.message || "No fue posible quitar el documento.",
            "error"
        );

    } finally {
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = `
                <i class="ri-delete-bin-line"></i>
                Quitar documento`;
        }
    }
}

// ---------------------------------------------------------
// DESVINCULACIÓN EN SERVIDOR
// ---------------------------------------------------------

async function desvincularDocumentoEnServidor(formacion, tipo) {
    const id = formacion.id ?? formacion.Id;

    if (!id) {
        throw new Error(
            "La formación no tiene un identificador válido."
        );
    }

    const dto = {
        institucion:
            formacion.institucion ??
            formacion.Institucion ??
            "",

        nivelEducativo:
            formacion.nivelEducativo ??
            formacion.NivelEducativo,

        carrera:
            formacion.carrera ??
            formacion.Carrera ??
            null,

        descripcion:
            formacion.descripcion ??
            formacion.Descripcion ??
            null,

        fechaInicio:
            formacion.fechaInicio ??
            formacion.FechaInicio ??
            null,

        fechaFin:
            formacion.enCurso ?? formacion.EnCurso
                ? null
                : (
                    formacion.fechaFin ??
                    formacion.FechaFin ??
                    null
                ),

        enCurso: Boolean(
            formacion.enCurso ?? formacion.EnCurso
        ),

        documentoCertificadoId: tipo === "certificado"
            ? null
            : (
                formacion.documentoCertificadoId ??
                formacion.DocumentoCertificadoId ??
                null
            ),

        documentoTituloId: tipo === "titulo"
            ? null
            : (
                formacion.documentoTituloId ??
                formacion.DocumentoTituloId ??
                null
            )
    };

    await apiRequest(
        `${FORMACION_ENDPOINT}/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(dto)
        }
    );
}

// ---------------------------------------------------------
// DOCUMENTOS DEL FORMULARIO
// ---------------------------------------------------------

function limpiarDocumentosPendientes() {
    if (elementos.certificado) {
        elementos.certificado.value = "";
    }

    if (elementos.titulo) {
        elementos.titulo.value = "";
    }

    if (elementos.certificadoSeleccionado) {
        elementos.certificadoSeleccionado.innerHTML = "";
    }

    if (elementos.tituloSeleccionado) {
        elementos.tituloSeleccionado.innerHTML = "";
    }
}

function mostrarDocumentoActual(tipo, documentoId) {
    const contenedor = tipo === "certificado"
        ? elementos.certificadoActual
        : elementos.tituloActual;

    if (!contenedor) return;

    if (!documentoId) {
        contenedor.innerHTML = `
            <span class="document-empty">
                <i class="ri-file-info-line"></i>
                Sin documento vinculado
            </span>`;

        return;
    }

    const id = Number(documentoId);

    const nombre = tipo === "certificado"
        ? "Certificado académico"
        : "Título académico";

    contenedor.innerHTML = `
        <div class="document-current-info">
            <span>
                <i class="ri-file-check-line"></i>
                Documento vinculado #${id}
            </span>

            <div class="document-actions">
                <button type="button"
                        class="document-link"
                        onclick="abrirVisualizadorDocumento(${id}, '${nombre}')">
                    <i class="ri-eye-line"></i>
                    Ver
                </button>

                <button type="button"
                        class="document-link"
                        onclick="descargarDocumento(${id})">
                    <i class="ri-download-line"></i>
                    Descargar
                </button>

                <button type="button"
                        class="document-link danger"
                        onclick="solicitarQuitarDocumento('${tipo}', 'formulario')">
                    <i class="ri-delete-bin-line"></i>
                    Quitar
                </button>
            </div>
        </div>`;
}

function mostrarArchivoSeleccionado(tipo, archivo) {
    const contenedor = tipo === "certificado"
        ? elementos.certificadoSeleccionado
        : elementos.tituloSeleccionado;

    if (!contenedor) return;

    if (!archivo) {
        contenedor.innerHTML = "";
        return;
    }

    const tamanoMB = (
        archivo.size / (1024 * 1024)
    ).toFixed(2);

    contenedor.innerHTML = `
        <div class="document-file-info">
            <span class="document-file-name">
                <i class="ri-attachment-2"></i>
                ${escaparHTML(archivo.name)}
            </span>

            <span class="document-file-meta">
                ${tamanoMB} MB
            </span>

            <button type="button"
                    class="document-link danger"
                    onclick="limpiarArchivo('${tipo}')">
                <i class="ri-close-line"></i>
                Quitar selección
            </button>
        </div>`;
}

function limpiarArchivo(tipo) {
    const input = tipo === "certificado"
        ? elementos.certificado
        : elementos.titulo;

    if (input) {
        input.value = "";
    }

    mostrarArchivoSeleccionado(tipo, null);
}

function actualizarDocumentosUI() {
    const estaEnCurso = elementos.enCurso.checked;

    const controles = [
        {
            input: elementos.certificado,
            contenedor: document.getElementById("certificadoUpload")
        },
        {
            input: elementos.titulo,
            contenedor: document.getElementById("tituloUpload")
        }
    ];

    controles.forEach(({ input, contenedor }) => {
        if (input) {
            input.disabled = estaEnCurso;
        }

        if (contenedor) {
            contenedor.classList.toggle(
                "document-disabled",
                estaEnCurso
            );
        }
    });

    if (estaEnCurso) {
        limpiarDocumentosPendientes();
    }
}

// ---------------------------------------------------------
// FORMULARIO: NUEVA FORMACIÓN
// ---------------------------------------------------------

function abrirFormularioNuevo() {
    elementos.formulario.reset();

    elementos.id.value = "";

    limpiarErrores();

    documentoCertificadoActual = null;
    documentoTituloActual = null;

    limpiarDocumentosPendientes();

    mostrarDocumentoActual("certificado", null);
    mostrarDocumentoActual("titulo", null);

    document.getElementById("modalTitle").textContent =
        "Agregar formación";

    elementos.guardarTexto.textContent =
        "Guardar formación";

    actualizarCampoFechaFin();

    elementos.modal.classList.add("show");
    document.body.style.overflow = "hidden";

    elementos.nivel.focus();
}

// ---------------------------------------------------------
// FORMULARIO: CERRAR
// ---------------------------------------------------------

function cerrarFormulario() {
    if (guardando) return;

    elementos.modal.classList.remove("show");

    restaurarScrollSegunModal();
}

// ---------------------------------------------------------
// FORMULARIO: EDICIÓN
// ---------------------------------------------------------

function editarFormacion(id) {
    const formacion = formaciones.find(item =>
        Number(item.id ?? item.Id) === Number(id)
    );

    if (!formacion) {
        mostrarToast(
            "No se encontró el registro que deseas editar.",
            "error"
        );
        return;
    }

    elementos.formulario.reset();

    limpiarErrores();

    elementos.id.value =
        formacion.id ?? formacion.Id;

    elementos.nivel.value =
        formacion.nivelEducativo ??
        formacion.NivelEducativo ??
        "";

    elementos.carrera.value =
        formacion.carrera ??
        formacion.Carrera ??
        "";

    elementos.institucion.value =
        formacion.institucion ??
        formacion.Institucion ??
        "";

    elementos.enCurso.checked = Boolean(
        formacion.enCurso ?? formacion.EnCurso
    );

    elementos.fechaInicio.value =
        formacion.fechaInicio ??
        formacion.FechaInicio ??
        "";

    elementos.fechaFin.value =
        formacion.fechaFin ??
        formacion.FechaFin ??
        "";

    elementos.descripcion.value =
        formacion.descripcion ??
        formacion.Descripcion ??
        "";

    documentoCertificadoActual =
        formacion.documentoCertificadoId ??
        formacion.DocumentoCertificadoId ??
        null;

    documentoTituloActual =
        formacion.documentoTituloId ??
        formacion.DocumentoTituloId ??
        null;

    limpiarDocumentosPendientes();

    mostrarDocumentoActual(
        "certificado",
        documentoCertificadoActual
    );

    mostrarDocumentoActual(
        "titulo",
        documentoTituloActual
    );

    document.getElementById("modalTitle").textContent =
        "Editar formación";

    elementos.guardarTexto.textContent =
        "Guardar cambios";

    actualizarCampoFechaFin();

    elementos.modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

// ---------------------------------------------------------
// CAMPO DE FECHA DE FINALIZACIÓN
// ---------------------------------------------------------

function actualizarCampoFechaFin() {
    const estaEnCurso = elementos.enCurso.checked;

    elementos.fechaFin.disabled = estaEnCurso;
    elementos.fechaFin.required = false;

    if (estaEnCurso) {
        elementos.fechaFin.value = "";
        elementos.fechaFinGroup.style.opacity = ".5";
    } else {
        elementos.fechaFinGroup.style.opacity = "1";
    }

    actualizarDocumentosUI();
}

// ---------------------------------------------------------
// VALIDACIÓN DEL FORMULARIO
// ---------------------------------------------------------

function limpiarErrores() {
    document.querySelectorAll(".field-error").forEach(error => {
        error.textContent = "";
    });

    document.querySelectorAll(".field").forEach(field => {
        field.classList.remove("invalid");
    });
}

function mostrarErrorCampo(id, mensaje) {
    const error = document.getElementById(id);

    if (!error) return;

    error.textContent = mensaje;

    const field = error.closest(".field");

    if (field) {
        field.classList.add("invalid");
    }
}

function validarArchivo(archivo, idError, nombreDocumento) {
    if (!archivo) return true;

    if (archivo.size > MAX_DOCUMENTO_BYTES) {
        mostrarErrorCampo(
            idError,
            `${nombreDocumento} no puede superar los 10 MB.`
        );

        return false;
    }

    const extensionesPermitidas = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png"
    ];

    const nombre = archivo.name.toLowerCase();

    const extensionValida = extensionesPermitidas.some(extension =>
        nombre.endsWith(extension)
    );

    if (!extensionValida) {
        mostrarErrorCampo(
            idError,
            "Formato no permitido. Utiliza PDF, JPG, JPEG o PNG."
        );

        return false;
    }

    return true;
}

function validarFormulario() {
    limpiarErrores();

    let valido = true;

    const nivel = elementos.nivel.value.trim();
    const institucion = elementos.institucion.value.trim();
    const carrera = elementos.carrera.value.trim();
    const descripcion = elementos.descripcion.value.trim();

    const inicio = elementos.fechaInicio.value;

    const fin = elementos.enCurso.checked
        ? ""
        : elementos.fechaFin.value;

    const nivelesPermitidos = [
        "Secundaria",
        "Preparatoria",
        "TSU",
        "Licenciatura",
        "Ingenieria",
        "Maestria",
        "Doctorado",
        "Otro"
    ];

    if (!nivelesPermitidos.includes(nivel)) {
        mostrarErrorCampo(
            "errGrado",
            "Selecciona un nivel educativo válido."
        );

        valido = false;
    }

    if (!institucion) {
        mostrarErrorCampo(
            "errInstitucion",
            "La institución es obligatoria."
        );

        valido = false;

    } else if (institucion.length > 150) {
        mostrarErrorCampo(
            "errInstitucion",
            "La institución no puede superar 150 caracteres."
        );

        valido = false;
    }

    if (carrera.length > 200) {
        mostrarErrorCampo(
            "errCarrera",
            "La carrera no puede superar 200 caracteres."
        );

        valido = false;
    }

    if (descripcion.length > 500) {
        mostrarErrorCampo(
            "errDescripcion",
            "La descripción no puede superar 500 caracteres."
        );

        valido = false;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    if (inicio && new Date(`${inicio}T00:00:00`) > hoy) {
        mostrarErrorCampo(
            "errFechaInicio",
            "La fecha de inicio no puede ser futura."
        );

        valido = false;
    }

    if (fin && new Date(`${fin}T00:00:00`) > hoy) {
        mostrarErrorCampo(
            "errFechaFin",
            "La fecha de finalización no puede ser futura."
        );

        valido = false;
    }

    if (inicio && fin && fin < inicio) {
        mostrarErrorCampo(
            "errFechaFin",
            "La fecha de finalización no puede ser anterior al inicio."
        );

        valido = false;
    }

    const archivoCertificado =
        elementos.certificado?.files?.[0];

    const archivoTitulo =
        elementos.titulo?.files?.[0];

    if (!elementos.enCurso.checked) {
        if (!validarArchivo(
            archivoCertificado,
            "errCertificado",
            "El certificado"
        )) {
            valido = false;
        }

        if (!validarArchivo(
            archivoTitulo,
            "errTitulo",
            "El título"
        )) {
            valido = false;
        }
    }

    return valido;
}

// ---------------------------------------------------------
// GUARDAR FORMACIÓN
// ---------------------------------------------------------

async function guardarFormacion(event) {
    event.preventDefault();

    if (guardando) return;

    if (!validarFormulario()) return;

    const id = elementos.id.value;
    const enCurso = elementos.enCurso.checked;
    const esEdicion = Boolean(id);

    if (esEdicion && (
        !Number.isFinite(Number(id)) ||
        Number(id) <= 0
    )) {
        mostrarToast(
            "El identificador de la formación no es válido.",
            "error"
        );

        return;
    }

    const url = esEdicion
        ? `${FORMACION_ENDPOINT}/${encodeURIComponent(id)}`
        : FORMACION_ENDPOINT;

    let certificadoId = enCurso
        ? null
        : documentoCertificadoActual;

    let tituloId = enCurso
        ? null
        : documentoTituloActual;

    const archivoCertificado =
        elementos.certificado?.files?.[0] || null;

    const archivoTitulo =
        elementos.titulo?.files?.[0] || null;

    const documentosSubidos = [];

    try {
        establecerEstadoGuardado(true);

        if (!enCurso && archivoCertificado) {
            elementos.guardarTexto.textContent =
                "Subiendo certificado...";

            const tipoCertificado =
                elementos.nivel.value === "Preparatoria" ? 5 : 6;

            certificadoId = await subirDocumento(
                archivoCertificado,
                tipoCertificado
            );

            documentosSubidos.push(certificadoId);
        }

        if (!enCurso && archivoTitulo) {
            elementos.guardarTexto.textContent =
                "Subiendo título...";

            tituloId = await subirDocumento(
                archivoTitulo,
                7
            );

            documentosSubidos.push(tituloId);
        }

        const dto = {
            institucion: elementos.institucion.value.trim(),
            nivelEducativo: elementos.nivel.value,
            carrera: elementos.carrera.value.trim() || null,
            descripcion: elementos.descripcion.value.trim() || null,

            fechaInicio: elementos.fechaInicio.value || null,

            fechaFin: enCurso
                ? null
                : (elementos.fechaFin.value || null),

            enCurso: enCurso,

            documentoCertificadoId: certificadoId,
            documentoTituloId: tituloId
        };

        elementos.guardarTexto.textContent =
            "Guardando formación...";

        await apiRequest(url, {
            method: esEdicion ? "PUT" : "POST",
            body: JSON.stringify(dto)
        });

        cerrarFormularioForzado();

        await cargarFormaciones();

        if (redireccionEnProceso) return;

        mostrarModalExito(esEdicion, dto);

    } catch (error) {
        console.error(
            "Error al guardar la formación:",
            error
        );

        if (manejarErrorAcceso(error)) return;

        mostrarToast(
            error.message || "No fue posible guardar la formación.",
            "error"
        );

        if (documentosSubidos.length > 0) {
            console.warn(
                "Se subieron documentos que podrían no haberse asociado a una formación:",
                documentosSubidos
            );

            mostrarToast(
                "Uno o más documentos se subieron, pero la formación no pudo guardarse. Revisa el expediente antes de volver a subirlos.",
                "info"
            );
        }

    } finally {
        establecerEstadoGuardado(false);
    }
}

function establecerEstadoGuardado(estado) {
    guardando = estado;

    elementos.guardar.disabled = estado;

    elementos.guardarTexto.textContent = estado
        ? "Procesando..."
        : (
            elementos.id.value
                ? "Guardar cambios"
                : "Guardar formación"
        );
}

function cerrarFormularioForzado() {
    elementos.modal.classList.remove("show");

    restaurarScrollSegunModal();
}

// ---------------------------------------------------------
// CONFIRMACIÓN DE GUARDADO
// ---------------------------------------------------------

function mostrarModalExito(esEdicion, dto) {
    if (!elementos.successModal) {
        mostrarToast(
            esEdicion
                ? "La formación académica se actualizó correctamente."
                : "La formación académica se guardó correctamente.",
            "success"
        );

        return;
    }

    const titulo = document.getElementById("successTitle");
    const mensaje = document.getElementById("successMessage");
    const resumen = document.getElementById("successSummary");

    if (titulo) {
        titulo.textContent = esEdicion
            ? "Formación actualizada"
            : "Formación guardada";
    }

    if (mensaje) {
        mensaje.textContent = esEdicion
            ? "Los cambios de tu formación académica se guardaron correctamente."
            : "Tu formación académica se agregó correctamente a tu expediente.";
    }

    if (resumen) {
        const documentos = [];

        if (dto.documentoCertificadoId) {
            documentos.push("Certificado académico");
        }

        if (dto.documentoTituloId) {
            documentos.push("Título académico");
        }

        resumen.innerHTML = `
            <div>
                <strong>Institución</strong>
                <span>${escaparHTML(dto.institucion)}</span>
            </div>

            <div>
                <strong>Nivel educativo</strong>
                <span>${escaparHTML(obtenerNombreNivel(dto.nivelEducativo))}</span>
            </div>

            <div>
                <strong>Documentos</strong>
                <span>
                    ${documentos.length
                        ? escaparHTML(documentos.join(", "))
                        : "Sin documentos adjuntos"}
                </span>
            </div>`;
    }

    elementos.successModal.classList.add("show");

    document.body.style.overflow = "hidden";
}

function cerrarModalExito() {
    if (!elementos.successModal) return;

    elementos.successModal.classList.remove("show");

    restaurarScrollSegunModal();
}

// ---------------------------------------------------------
// ELIMINAR FORMACIÓN
// ---------------------------------------------------------

function solicitarEliminacion(id) {
    const existe = formaciones.some(item =>
        Number(item.id ?? item.Id) === Number(id)
    );

    if (!existe) {
        mostrarToast(
            "No se encontró el registro seleccionado.",
            "error"
        );

        return;
    }

    formacionAEliminar = id;

    elementos.deleteModal.classList.add("show");

    document.body.style.overflow = "hidden";
}

function cerrarModalEliminar() {
    if (elementos.deleteModal) {
        elementos.deleteModal.classList.remove("show");
    }

    formacionAEliminar = null;

    restaurarScrollSegunModal();
}

async function eliminarFormacion() {
    if (!formacionAEliminar || guardando) return;

    const id = formacionAEliminar;

    const boton = document.getElementById("confirmDeleteBtn");

    boton.disabled = true;
    boton.textContent = "Eliminando...";

    try {
        await apiRequest(
            `${FORMACION_ENDPOINT}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        cerrarModalEliminar();

        mostrarToast(
            "El registro se eliminó correctamente.",
            "success"
        );

        await cargarFormaciones();

    } catch (error) {
        console.error(
            "Error al eliminar la formación:",
            error
        );

        if (manejarErrorAcceso(error)) return;

        mostrarToast(
            error.message || "No fue posible eliminar el registro.",
            "error"
        );

    } finally {
        boton.disabled = false;
        boton.textContent = "Sí, eliminar";
    }
}

// ---------------------------------------------------------
// CONTROL DEL SCROLL DE LOS MODALES
// ---------------------------------------------------------

function restaurarScrollSegunModal() {
    const modales = [
        elementos.modal,
        elementos.deleteModal,
        elementos.successModal,
        elementos.detailModal,
        elementos.documentViewerModal,
        elementos.removeDocumentModal
    ];

    const hayModalAbierto = modales.some(modal =>
        modal && modal.classList.contains("show")
    );

    document.body.style.overflow =
        hayModalAbierto ? "hidden" : "";
}

// ---------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------

function obtenerNombreNivel(nivel) {
    const nombres = {
        Secundaria: "Secundaria",
        Preparatoria: "Preparatoria",
        TSU: "Técnico Superior Universitario",
        Licenciatura: "Licenciatura",
        Ingenieria: "Ingeniería",
        Maestria: "Maestría",
        Doctorado: "Doctorado",
        Otro: "Otro"
    };

    return nombres[nivel] || nivel || "Formación académica";
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = String(fecha).split("-");

    if (partes.length !== 3) return fecha;

    const fechaLocal = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    return fechaLocal.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short"
    });
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entidades[caracter];
    });
}

function mostrarToast(mensaje, tipo = "info") {
    const contenedor = document.getElementById("toastContainer");

    if (!contenedor) {
        console.warn(mensaje);
        return;
    }

    const toast = document.createElement("div");

    const iconos = {
        success: "ri-checkbox-circle-line",
        error: "ri-error-warning-line",
        info: "ri-information-line"
    };

    toast.className = `toast ${tipo}`;

    toast.innerHTML = `
        <i class="${iconos[tipo] || iconos.info}"></i>
        <span></span>`;

    toast.querySelector("span").textContent = mensaje;

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4500);
}

// ---------------------------------------------------------
// EVENTOS DE INTERFAZ
// ---------------------------------------------------------

document.getElementById("addEducationBtn")
    ?.addEventListener("click", abrirFormularioNuevo);

document.getElementById("closeFormBtn")
    ?.addEventListener("click", cerrarFormulario);

document.getElementById("cancelFormBtn")
    ?.addEventListener("click", cerrarFormulario);

document.getElementById("cancelDeleteBtn")
    ?.addEventListener("click", cerrarModalEliminar);

document.getElementById("confirmDeleteBtn")
    ?.addEventListener("click", eliminarFormacion);

elementos.formulario?.addEventListener(
    "submit",
    guardarFormacion
);

elementos.enCurso?.addEventListener(
    "change",
    actualizarCampoFechaFin
);

// ---------------------------------------------------------
// SELECCIÓN DE DOCUMENTOS
// ---------------------------------------------------------

if (elementos.certificado) {
    elementos.certificado.addEventListener("change", () => {
        mostrarArchivoSeleccionado(
            "certificado",
            elementos.certificado.files[0]
        );
    });
}

if (elementos.titulo) {
    elementos.titulo.addEventListener("change", () => {
        mostrarArchivoSeleccionado(
            "titulo",
            elementos.titulo.files[0]
        );
    });
}

// ---------------------------------------------------------
// MODAL DE CONFIRMACIÓN DE GUARDADO
// ---------------------------------------------------------

const closeSuccessBtn =
    document.getElementById("closeSuccessBtn");

if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener(
        "click",
        cerrarModalExito
    );
}

if (elementos.successModal) {
    elementos.successModal.addEventListener("click", event => {
        if (event.target === elementos.successModal) {
            cerrarModalExito();
        }
    });
}

// ---------------------------------------------------------
// MODAL DE DETALLE
// ---------------------------------------------------------

const closeDetailBtn =
    document.getElementById("closeDetailBtn");

const closeDetailFooterBtn =
    document.getElementById("closeDetailFooterBtn");

if (closeDetailBtn) {
    closeDetailBtn.addEventListener(
        "click",
        () => cerrarDetalleFormacion()
    );
}

if (closeDetailFooterBtn) {
    closeDetailFooterBtn.addEventListener(
        "click",
        () => cerrarDetalleFormacion()
    );
}

if (elementos.detailModal) {
    elementos.detailModal.addEventListener("click", event => {
        if (event.target === elementos.detailModal) {
            cerrarDetalleFormacion();
        }
    });
}

// ---------------------------------------------------------
// MODAL DEL VISUALIZADOR
// ---------------------------------------------------------

const closeDocumentViewerBtn =
    document.getElementById("closeDocumentViewerBtn");

const closeDocumentViewerFooterBtn =
    document.getElementById("closeDocumentViewerFooterBtn");

const downloadViewerDocumentBtn =
    document.getElementById("downloadViewerDocumentBtn");

if (closeDocumentViewerBtn) {
    closeDocumentViewerBtn.addEventListener(
        "click",
        () => cerrarVisualizadorDocumento()
    );
}

if (closeDocumentViewerFooterBtn) {
    closeDocumentViewerFooterBtn.addEventListener(
        "click",
        () => cerrarVisualizadorDocumento()
    );
}

if (downloadViewerDocumentBtn) {
    downloadViewerDocumentBtn.addEventListener("click", () => {
        if (
            !documentoVisualizadoActual ||
            !blobDocumentoActual
        ) {
            return;
        }

        const urlTemporal = URL.createObjectURL(
            blobDocumentoActual
        );

        const enlace = document.createElement("a");

        enlace.href = urlTemporal;

        enlace.download = nombreDocumentoActual ||
            `documento-${documentoVisualizadoActual}`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => {
            URL.revokeObjectURL(urlTemporal);
        }, 1000);
    });
}

if (elementos.documentViewerModal) {
    elementos.documentViewerModal.addEventListener("click", event => {
        if (event.target === elementos.documentViewerModal) {
            cerrarVisualizadorDocumento();
        }
    });
}

// ---------------------------------------------------------
// MODAL PARA QUITAR DOCUMENTOS
// ---------------------------------------------------------

const closeRemoveDocumentBtn =
    document.getElementById("closeRemoveDocumentBtn");

const cancelRemoveDocumentBtn =
    document.getElementById("cancelRemoveDocumentBtn");

const confirmRemoveDocumentBtn =
    document.getElementById("confirmRemoveDocumentBtn");

if (closeRemoveDocumentBtn) {
    closeRemoveDocumentBtn.addEventListener(
        "click",
        () => cerrarModalQuitarDocumento()
    );
}

if (cancelRemoveDocumentBtn) {
    cancelRemoveDocumentBtn.addEventListener(
        "click",
        () => cerrarModalQuitarDocumento()
    );
}

if (confirmRemoveDocumentBtn) {
    confirmRemoveDocumentBtn.addEventListener(
        "click",
        confirmarQuitarDocumento
    );
}

if (elementos.removeDocumentModal) {
    elementos.removeDocumentModal.addEventListener("click", event => {
        if (event.target === elementos.removeDocumentModal) {
            cerrarModalQuitarDocumento();
        }
    });
}

// ---------------------------------------------------------
// CIERRE DE MODALES CON CLIC EXTERIOR
// ---------------------------------------------------------

if (elementos.modal) {
    elementos.modal.addEventListener("click", event => {
        if (event.target === elementos.modal) {
            cerrarFormulario();
        }
    });
}

if (elementos.deleteModal) {
    elementos.deleteModal.addEventListener("click", event => {
        if (event.target === elementos.deleteModal) {
            cerrarModalEliminar();
        }
    });
}

// ---------------------------------------------------------
// CIERRE CON ESCAPE
// ---------------------------------------------------------

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (elementos.removeDocumentModal?.classList.contains("show")) {
        cerrarModalQuitarDocumento();
        return;
    }

    if (elementos.documentViewerModal?.classList.contains("show")) {
        cerrarVisualizadorDocumento();
        return;
    }

    if (elementos.detailModal?.classList.contains("show")) {
        cerrarDetalleFormacion();
        return;
    }

    if (elementos.successModal?.classList.contains("show")) {
        cerrarModalExito();
        return;
    }

    if (elementos.deleteModal?.classList.contains("show")) {
        cerrarModalEliminar();
        return;
    }

    if (elementos.modal?.classList.contains("show")) {
        cerrarFormulario();
    }
});


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

// ---------------------------------------------------------
// INICIALIZACIÓN Y VALIDACIÓN DE SESIÓN
// ---------------------------------------------------------

// ---------------------------------------------------------
// INICIALIZACIÓN Y VALIDACIÓN DE SESIÓN
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
    // Muestra el skeleton mientras se preparan los datos.
    mostrarSkeleton();

    // Evita mostrar información privada antes de validar la sesión.
    document.body.style.visibility = "visible";

    

    try {
        await apiRequest(
            `${AUTH_ENDPOINT}/me`,
            {
                timeout: TIMEOUT_SESION
            }
        );

        if (redireccionEnProceso) {
            ocultarSkeleton();
            return;
        }

        // Carga las preferencias visuales del usuario.
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
    console.error(
        "Error al cargar las preferencias visuales:",
        error
    );
}

        await cargarUsuario();

        if (redireccionEnProceso) {
            ocultarSkeleton();
            return;
        }

        await cargarFormaciones();

        // Retira el skeleton cuando termina la carga.
        ocultarSkeleton();

    } catch (error) {
        console.error(
            "Error al verificar la sesión:",
            error
        );

        ocultarSkeleton();

        manejarErrorAcceso(error);
    }
});

