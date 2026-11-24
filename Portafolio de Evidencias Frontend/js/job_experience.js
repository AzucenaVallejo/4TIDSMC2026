
    "use strict";

    // CONFIGURACIÓN DE LA API
    const API_BASE_URL = "https://pureblood-starfish-happening.ngrok-free.dev/api";
    const EXPERIENCIA_ENDPOINT = `${API_BASE_URL}/Experiencia`;
    const AUTH_ENDPOINT = `${API_BASE_URL}/Auth`;
    const DOCUMENTOS_ENDPOINT = `${API_BASE_URL}/Documentos`;

    const MAX_DOCUMENTO_BYTES = 10 * 1024 * 1024;
    const TIPO_DOCUMENTO_CONSTANCIA_LABORAL = 11;

    // Los valores corresponden a los enums del backend.
    const TIPOS_EXPERIENCIA = {
        1: "Empleo formal",
        2: "Prácticas profesionales",
        3: "Servicio social",
        4: "Trabajo temporal",
        5: "Freelance",
        6: "Otro"
    };

    const MODALIDADES_EXPERIENCIA = {
        1: "No especificada",
        2: "Presencial",
        3: "Híbrida",
        4: "Remota"
    };

    const CATEGORY_ICONS = {
        "Empleo formal": "ri-building-4-line",
        "Prácticas profesionales": "ri-graduation-cap-line",
        "Servicio social": "ri-hand-heart-line",
        "Trabajo temporal": "ri-time-line",
        "Freelance": "ri-macbook-line",
        "Otro": "ri-briefcase-line"
    };

    let experiencias = [];
    let experienciaAEliminar = null;
    let guardando = false;

    let documentoConstanciaActual = null;
    let experienciaDetalleActual = null;
    let documentoPendienteQuitar = null;
    let documentoVisualizadoActual = null;
    let urlDocumentoTemporal = null;
    let blobDocumentoActual = null;
    let nombreDocumentoActual = null;

    const elementos = {
        lista: document.getElementById("experienceList"),
        modal: document.getElementById("formModal"),
        deleteModal: document.getElementById("deleteModal"),
        formulario: document.getElementById("experienceForm"),
        id: document.getElementById("formExperienceId"),

        puesto: document.getElementById("formPuesto"),
        empresa: document.getElementById("formEmpresa"),
        tipo: document.getElementById("formTipo"),
        modalidad: document.getElementById("formModalidad"),
        ubicacion: document.getElementById("formUbicacion"),
        trabajoActual: document.getElementById("formTrabajoActual"),
        fechaInicio: document.getElementById("formFechaInicio"),
        fechaFin: document.getElementById("formFechaFin"),
        fechaFinGroup: document.getElementById("fechaFinGroup"),
        descripcion: document.getElementById("formDescripcion"),

        guardar: document.getElementById("saveExperienceBtn"),
        guardarTexto: document.getElementById("saveButtonText"),
        usuario: document.getElementById("userName"),

        constancia: document.getElementById("formConstancia"),
        constanciaActual: document.getElementById("constanciaActual"),
        quitarConstancia: document.getElementById("quitarConstancia"),

        successModal: document.getElementById("successModal"),
        detailModal: document.getElementById("detailModal"),
        documentViewerModal: document.getElementById("documentViewerModal"),
        removeDocumentModal: document.getElementById("removeDocumentModal")
    };
// CONTROL DE CONEXIÓN Y ACCESO

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
    crearModalConexion();

    document.getElementById("connectionErrorModal")
        .classList.add("show");

    document.body.style.visibility = "visible";
    document.body.style.overflow = "hidden";
}

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

        clearTimeout(tiempoLimite);

        // La API responde, pero no existe una sesión válida.
        if (response.status === 401 || response.status === 403) {
            ocultarSkeleton();

            window.location.replace("index.html");
            return false;
        }

        // El servidor responde con un error interno.
        if (!response.ok) {
    const error = new Error(
        `El servidor respondió con HTTP ${response.status}.`
    );

    error.status = response.status;
    throw error;
}

        usuarioAutenticado = await response.json();

        accesoVerificado = true;

        return true;

    } catch (error) {
        clearTimeout(tiempoLimite);

        console.error("Error al verificar el acceso:", error);

        // Retirar el skeleton antes de mostrar el modal.
        ocultarSkeleton();

        mostrarModalConexion();

        // Evita que el usuario permanezca en una pantalla sin conexión.
        setTimeout(() => {
            window.location.replace("index.html");
        }, 1800);

        return false;
    }
}
    // NORMALIZACIÓN DE DATOS

    function obtenerPropiedad(objeto, camelCase, pascalCase) {
        return objeto?.[camelCase] ?? objeto?.[pascalCase] ?? null;
    }

    function obtenerIdExperiencia(exp) {
        return Number(obtenerPropiedad(exp, "id", "Id"));
    }

    function obtenerIdDocumento(exp) {
        const id = obtenerPropiedad(exp, "documentoId", "DocumentoId");
        return id == null ? null : Number(id);
    }

    function obtenerTipoTexto(tipo) {
        if (typeof tipo === "number" || /^\d+$/.test(String(tipo))) {
            return TIPOS_EXPERIENCIA[Number(tipo)] || "Otro";
        }

        return tipo || "Otro";
    }

    function obtenerModalidadTexto(modalidad) {
        if (typeof modalidad === "number" || /^\d+$/.test(String(modalidad))) {
            return MODALIDADES_EXPERIENCIA[Number(modalidad)] || "No especificada";
        }

        return modalidad || "No especificada";
    }

    function obtenerValorEnum(valor, catalogo) {
        if (typeof valor === "number" || /^\d+$/.test(String(valor))) {
            return Number(valor);
        }

        const entrada = Object.entries(catalogo).find(
            ([, texto]) => texto.toLowerCase() === String(valor || "").toLowerCase()
        );

        return entrada ? Number(entrada[0]) : null;
    }

    function obtenerDatosExperiencia(exp) {
        return {
            id: obtenerIdExperiencia(exp),
            puesto: obtenerPropiedad(exp, "puesto", "Puesto") || "",
            empresa: obtenerPropiedad(exp, "empresa", "Empresa") || "",
            tipo: obtenerTipoTexto(obtenerPropiedad(exp, "tipo", "Tipo")),
            modalidad: obtenerModalidadTexto(obtenerPropiedad(exp, "modalidad", "Modalidad")),
            ubicacion: obtenerPropiedad(exp, "ubicacion", "Ubicacion") || "",
            descripcion: obtenerPropiedad(exp, "descripcion", "Descripcion") || "",
            fechaInicio: obtenerPropiedad(exp, "fechaInicio", "FechaInicio") || "",
            fechaFin: obtenerPropiedad(exp, "fechaFin", "FechaFin") || "",
            trabajoActual: Boolean(obtenerPropiedad(exp, "trabajoActual", "TrabajoActual")),
            documentoId: obtenerIdDocumento(exp),
            nombreDocumento: obtenerPropiedad(exp, "nombreDocumento", "NombreDocumento") || null
        };
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
        cache: "no-store",
        headers
    };

    const response = await fetch(url, config);

    if (response.status === 204) return null;

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
                .find(value => typeof value === "string" && value.trim());

            if (primerError) return primerError;
        }

        return `La solicitud no pudo completarse. Código ${status}.`;
    }

    // DOCUMENTOS

    async function subirDocumento(archivo, tipoDocumento) {
    if (!archivo) return null;

    if (archivo.size > MAX_DOCUMENTO_BYTES) {
        throw new Error("El archivo supera los 10 MB.");
    }

    const datos = new FormData();
    datos.append("archivo", archivo);
    datos.append("tipoDocumento", String(tipoDocumento));

    const response = await fetch(DOCUMENTOS_ENDPOINT, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true"
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
        throw error;
    }

    const documentoId =
        resultado?.id ??
        resultado?.Id ??
        resultado?.documentoId ??
        resultado?.DocumentoId;

    if (!documentoId || !Number.isFinite(Number(documentoId))) {
        throw new Error("El servidor no devolvió un ID de documento válido.");
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
                "Accept": "*/*",
                "ngrok-skip-browser-warning": "true"
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
            const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

            if (utf8Match?.[1]) {
                try {
                    return decodeURIComponent(
                        utf8Match[1].replace(/"/g, "")
                    );
                } catch {
                    // Se utiliza el nombre alternativo.
                }
            }

            const normalMatch = disposition.match(/filename="?([^";]+)"?/i);

            if (normalMatch?.[1]) {
                return normalMatch[1].trim();
            }
        }

        return `documento-${documentoId}`;
    }

    async function descargarDocumento(documentoId) {
        if (!documentoId) {
            return mostrarToast("No se encontró el documento.", "error");
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

            setTimeout(() => URL.revokeObjectURL(urlTemporal), 1000);
        } catch (error) {
            mostrarToast(error.message || "Error al descargar.", "error");
        }
    }

    async function abrirVisualizadorDocumento(documentoId, nombreDocumento) {
        if (!documentoId) return;

        const modal = elementos.documentViewerModal;
        const contenido = document.getElementById("documentViewerContent");

        cerrarVisualizadorDocumento(false);

        documentoVisualizadoActual = documentoId;
        nombreDocumentoActual = nombreDocumento || `Documento ${documentoId}`;

        document.getElementById("documentViewerTitle").textContent =
            nombreDocumentoActual;

        document.getElementById("documentViewerDescription").textContent =
            "Preparando...";

        document.getElementById("documentViewerFileName").textContent =
            nombreDocumentoActual;

        contenido.innerHTML = `
            <div class="document-viewer-loading">
                <i class="ri-loader-4-line"></i>
                <p>Cargando...</p>
            </div>`;

        document.getElementById("downloadViewerDocumentBtn").disabled = true;

        modal.classList.add("show");
        document.body.style.overflow = "hidden";

        try {
            const resultado = await obtenerArchivoDocumento(documentoId);

            if (documentoVisualizadoActual !== documentoId) return;

            blobDocumentoActual = resultado.blob;
            urlDocumentoTemporal = URL.createObjectURL(resultado.blob);

            const tipo = (resultado.contentType || "").toLowerCase();

            const esPDF =
                tipo.includes("pdf") ||
                nombreDocumentoActual.toLowerCase().endsWith(".pdf");

            const esImagen =
                tipo.startsWith("image/") ||
                /\.(png|jpe?g|gif|webp|bmp)$/i.test(nombreDocumentoActual);

            if (esPDF) {
                const iframe = document.createElement("iframe");

                iframe.src = urlDocumentoTemporal;
                iframe.title = "Vista previa del documento";
                iframe.style.cssText =
                    "width:100%;height:100%;min-height:450px;border:none;border-radius:8px;";

                contenido.replaceChildren(iframe);

                document.getElementById("documentViewerDescription").textContent =
                    "Vista previa PDF.";

            } else if (esImagen) {
                const imagen = document.createElement("img");

                imagen.src = urlDocumentoTemporal;
                imagen.alt = nombreDocumentoActual;
                imagen.style.cssText =
                    "max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;";

                contenido.replaceChildren(imagen);

                document.getElementById("documentViewerDescription").textContent =
                    "Vista previa de imagen.";

            } else {
                contenido.innerHTML = `
                    <div style="text-align:center;">
                        <i class="ri-file-download-line"
                           style="font-size:40px;color:#3980a5;"></i>
                        <h3>No disponible</h3>
                        <p>Descarga el archivo para consultarlo.</p>
                    </div>`;

                document.getElementById("documentViewerDescription").textContent =
                    "Formato no previsualizable.";
            }

            document.getElementById("documentViewerFileName").textContent =
                obtenerNombreArchivo(resultado.disposition, documentoId);

            document.getElementById("downloadViewerDocumentBtn").disabled = false;

        } catch (error) {
            contenido.innerHTML = `
                <div style="text-align:center;color:#D9536F;">
                    <i class="ri-error-warning-line" style="font-size:40px;"></i>
                    <p>${escaparHTML(error.message)}</p>
                </div>`;

            document.getElementById("documentViewerDescription").textContent =
                "Error al cargar.";
        }
    }

    function cerrarVisualizadorDocumento(restaurarScroll = true) {
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

 // USUARIO Y EXPERIENCIAS

async function cargarUsuario() {
    if (!accesoVerificado || !usuarioAutenticado) return;

    const correo =
        usuarioAutenticado.correo ||
        usuarioAutenticado.Correo;

    if (correo && elementos.usuario) {
        elementos.usuario.textContent = correo;
    }
}

    async function cargarExperiencias() {
        elementos.lista.innerHTML = `
            <div class="loading-state">
                <i class="ri-loader-4-line"></i>
                <p>Cargando tu experiencia laboral...</p>
            </div>`;

        try {
            const respuesta = await apiRequest(EXPERIENCIA_ENDPOINT);

            experiencias = Array.isArray(respuesta) ? respuesta : [];

            renderizarExperiencias();
            actualizarEstadisticas();

        } catch (error) {
            mostrarErrorLista(
                error.status === 401
                    ? "Tu sesión ha expirado."
                    : (error.message || "Error al cargar las experiencias.")
            );
        }
    }

    function getIconForTipo(tipo) {
        return CATEGORY_ICONS[tipo] || "ri-briefcase-line";
    }

    function renderizarExperiencias() {
        if (experiencias.length === 0) {
            elementos.lista.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="ri-briefcase-4-line"></i>
                    </div>
                    <h3>Tu historial está vacío</h3>
                    <p>
                        Todavía no tienes experiencia laboral registrada.
                        Agrega puestos para construir tu currículum.
                    </p>
                    <button class="primary-btn" type="button"
                            onclick="abrirFormularioNuevo()">
                        <i class="ri-add-line"></i>
                        Agregar experiencia
                    </button>
                </div>`;

            return;
        }

        experiencias.sort((a, b) => {
            const fechaA = obtenerDatosExperiencia(a).fechaInicio;
            const fechaB = obtenerDatosExperiencia(b).fechaInicio;

            return new Date(fechaB) - new Date(fechaA);
        });

        elementos.lista.innerHTML = experiencias
            .map(exp => crearTarjetaExperiencia(exp))
            .join("");
    }

    function crearTarjetaExperiencia(exp) {
        const datos = obtenerDatosExperiencia(exp);

        const icon = getIconForTipo(datos.tipo);

        const estado = datos.trabajoActual
            ? `<span class="status current">
                    <span class="status-dot"></span>Actual
               </span>`
            : `<span class="status completed">
                    <span class="status-dot"></span>Previo
               </span>`;

        const inicio = formatearFecha(datos.fechaInicio);

        const fin = datos.trabajoActual
            ? "Actualmente"
            : formatearFecha(datos.fechaFin);

        return `
            <article class="education-card">
                <div class="card-top">
                    <div class="degree-icon">
                        <i class="${icon}"></i>
                    </div>

                    <div class="card-actions">
                        <button class="icon-btn view" type="button"
                                onclick="verDetalleExperiencia(${datos.id})">
                            <i class="ri-eye-line"></i>
                        </button>

                        <button class="icon-btn" type="button"
                                onclick="editarExperiencia(${datos.id})">
                            <i class="ri-edit-line"></i>
                        </button>

                        <button class="icon-btn delete" type="button"
                                onclick="solicitarEliminacion(${datos.id})">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>

                <h3>${escaparHTML(datos.puesto)}</h3>

                <div class="card-institution">
                    ${escaparHTML(datos.empresa)}
                </div>

                <p class="card-description">
                    ${escaparHTML(datos.descripcion || "Sin descripción.")}
                </p>

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
        const enCurso = experiencias.filter(
            item => obtenerDatosExperiencia(item).trabajoActual
        ).length;

        document.getElementById("totalExperiences").textContent =
            experiencias.length;

        document.getElementById("currentExperiences").textContent =
            enCurso;

        document.getElementById("completedExperiences").textContent =
            experiencias.length - enCurso;
    }

    function mostrarErrorLista(mensaje) {
        elementos.lista.innerHTML = `
            <div class="error-state">
                <div class="empty-icon">
                    <i class="ri-error-warning-line"></i>
                </div>
                <h3>Error</h3>
                <p>${escaparHTML(mensaje)}</p>
                <button class="primary-btn" type="button"
                        onclick="cargarExperiencias()">
                    <i class="ri-refresh-line"></i>
                    Reintentar
                </button>
            </div>`;
    }

    // DETALLE DE EXPERIENCIA

    function verDetalleExperiencia(id) {
        const exp = experiencias.find(
            item => obtenerIdExperiencia(item) === Number(id)
        );

        if (!exp) {
            return mostrarToast("No se encontró la experiencia.", "error");
        }

        experienciaDetalleActual = exp;

        const datos = obtenerDatosExperiencia(exp);

        document.getElementById("detailPuesto").textContent = datos.puesto;
        document.getElementById("detailEmpresa").textContent = datos.empresa;
        document.getElementById("detailTipoBadge").textContent = datos.tipo;

        document.getElementById("detailIcon").className =
            getIconForTipo(datos.tipo);

        document.getElementById("detailModalidad").textContent =
            datos.modalidad;

        document.getElementById("detailUbicacion").textContent =
            datos.ubicacion || "No especificada";

        document.getElementById("detailStartDate").textContent =
            formatearFecha(datos.fechaInicio);

        document.getElementById("detailEndDate").textContent =
            datos.trabajoActual
                ? "Actualmente"
                : formatearFecha(datos.fechaFin);

        document.getElementById("detailDescription").textContent =
            datos.descripcion || "Sin descripción.";

        document.getElementById("detailStatus").innerHTML =
            datos.trabajoActual
                ? `<span class="status current">
                        <span class="status-dot"></span>Trabajo actual
                   </span>`
                : `<span class="status completed">
                        <span class="status-dot"></span>Previo
                   </span>`;

        configurarDocumentoDetalle(
            "constancia",
            datos.documentoId,
            datos.nombreDocumento || "Constancia laboral"
        );

        elementos.detailModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function configurarDocumentoDetalle(tipo, documentoId, nombre) {
        const status = document.getElementById("detailConstanciaStatus");
        const actions = document.getElementById("detailConstanciaActions");

        if (!status || !actions) return;

        if (!documentoId) {
            status.textContent = "Sin documento adjunto";

            actions.innerHTML = `
                <span style="color:#84909c;font-size:12px;">
                    No adjunto
                </span>`;

            return;
        }

        status.textContent = `Documento vinculado #${documentoId}`;

        actions.innerHTML = `
            <button class="icon-btn view" type="button"
                    onclick="abrirVisualizadorDocumento(${Number(documentoId)}, 'Constancia laboral')">
                <i class="ri-eye-line"></i>
            </button>

            <button class="icon-btn" type="button"
                    onclick="descargarDocumento(${Number(documentoId)})">
                <i class="ri-download-cloud-2-line"></i>
            </button>

            <button class="icon-btn delete" type="button"
                    onclick="solicitarQuitarDocumento('constancia', 'detalle')">
                <i class="ri-delete-bin-line"></i>
            </button>`;
    }

    function cerrarDetalleExperiencia(restaurarScroll = true) {
        if (elementos.detailModal) {
            elementos.detailModal.classList.remove("show");
        }

        experienciaDetalleActual = null;

        if (restaurarScroll) {
            restaurarScrollSegunModal();
        }
    }

    // QUITAR DOCUMENTOS

    function solicitarQuitarDocumento(tipo, origen = "formulario") {
        let documentoId = null;

        if (origen === "formulario") {
            documentoId = documentoConstanciaActual;
        } else if (experienciaDetalleActual) {
            documentoId = obtenerIdDocumento(experienciaDetalleActual);
        }

        if (!documentoId) return;

        documentoPendienteQuitar = {
            tipo,
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

        const { origen } = documentoPendienteQuitar;

        const boton = document.getElementById("confirmRemoveDocumentBtn");

        boton.disabled = true;
        boton.innerHTML = `<i class="ri-loader-4-line"></i>...`;

        try {
            if (origen === "formulario") {
                documentoConstanciaActual = null;

                limpiarArchivo();
                mostrarDocumentoActual("constancia", null);

                cerrarModalQuitarDocumento(false);
                restaurarScrollSegunModal();

                mostrarToast(
                    "El documento se desvinculará al guardar los cambios.",
                    "info"
                );

                return;
            }

            if (!experienciaDetalleActual) {
                throw new Error("No se encontró la experiencia.");
            }

            await desvincularDocumentoEnServidor(experienciaDetalleActual);

            cerrarModalQuitarDocumento(false);
            cerrarDetalleExperiencia(false);

            await cargarExperiencias();

            mostrarToast("Documento desvinculado correctamente.", "success");

        } catch (error) {
            mostrarToast(error.message || "Error al quitar el documento.", "error");

        } finally {
            boton.disabled = false;
            boton.innerHTML = "Sí, quitar";
        }
    }

    async function desvincularDocumentoEnServidor(exp) {
        const datos = obtenerDatosExperiencia(exp);

        const dto = {
            puesto: datos.puesto,
            empresa: datos.empresa,
            tipo: obtenerValorEnum(datos.tipo, TIPOS_EXPERIENCIA),
            modalidad: obtenerValorEnum(datos.modalidad, MODALIDADES_EXPERIENCIA),
            ubicacion: datos.ubicacion || null,
            descripcion: datos.descripcion || null,
            fechaInicio: datos.fechaInicio,
            fechaFin: datos.trabajoActual ? null : (datos.fechaFin || null),
            trabajoActual: datos.trabajoActual,
            documentoId: null
        };

        await apiRequest(
            `${EXPERIENCIA_ENDPOINT}/${encodeURIComponent(datos.id)}`,
            {
                method: "PUT",
                body: JSON.stringify(dto)
            }
        );
    }

    // DOCUMENTO DEL FORMULARIO

    function limpiarArchivo() {
        if (elementos.constancia) {
            elementos.constancia.value = "";
        }
    }

    function mostrarDocumentoActual(tipo, documentoId) {
        const contenedor = elementos.constanciaActual;

        if (!contenedor) return;

        if (!documentoId) {
            contenedor.innerHTML = "";

            if (elementos.quitarConstancia) {
                elementos.quitarConstancia.style.display = "none";
            }

            return;
        }

        contenedor.innerHTML = `
            <div class="document-current">
                <div class="document-current-info">
                    <i class="ri-file-check-line"></i>
                    <span>Documento #${documentoId} vinculado</span>
                </div>

                <button type="button" class="document-download"
                        onclick="descargarDocumento(${Number(documentoId)})">
                    Descargar
                </button>
            </div>`;

        if (elementos.quitarConstancia) {
            elementos.quitarConstancia.style.display = "block";

            elementos.quitarConstancia.onclick = () =>
                solicitarQuitarDocumento("constancia", "formulario");
        }
    }

    // FORMULARIO PRINCIPAL

    function abrirFormularioNuevo() {
        elementos.formulario.reset();

        elementos.id.value = "";

        limpiarErrores();

        documentoConstanciaActual = null;

        limpiarArchivo();
        mostrarDocumentoActual("constancia", null);

        document.getElementById("modalTitle").textContent =
            "Agregar experiencia";

        elementos.guardarTexto.textContent = "Guardar experiencia";

        actualizarCampoFechaFin();

        elementos.modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function cerrarFormulario() {
        if (guardando) return;

        elementos.modal.classList.remove("show");

        restaurarScrollSegunModal();
    }

    function editarExperiencia(id) {
        const exp = experiencias.find(
            item => obtenerIdExperiencia(item) === Number(id)
        );

        if (!exp) {
            return mostrarToast("No se encontró la experiencia.", "error");
        }

        const datos = obtenerDatosExperiencia(exp);

        elementos.formulario.reset();

        limpiarErrores();

        elementos.id.value = datos.id;
        elementos.puesto.value = datos.puesto;
        elementos.empresa.value = datos.empresa;

        elementos.tipo.value = String(
            obtenerValorEnum(datos.tipo, TIPOS_EXPERIENCIA) || ""
        );

        elementos.modalidad.value = String(
            obtenerValorEnum(datos.modalidad, MODALIDADES_EXPERIENCIA) || 1
        );

        elementos.ubicacion.value = datos.ubicacion;
        elementos.trabajoActual.checked = datos.trabajoActual;
        elementos.fechaInicio.value = datos.fechaInicio;
        elementos.fechaFin.value = datos.fechaFin;
        elementos.descripcion.value = datos.descripcion;

        documentoConstanciaActual = datos.documentoId;

        limpiarArchivo();

        mostrarDocumentoActual(
            "constancia",
            documentoConstanciaActual
        );

        document.getElementById("modalTitle").textContent =
            "Editar experiencia";

        elementos.guardarTexto.textContent = "Guardar cambios";

        actualizarCampoFechaFin();

        elementos.modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function actualizarCampoFechaFin() {
        const actual = elementos.trabajoActual.checked;

        elementos.fechaFin.disabled = actual;

        if (actual) {
            elementos.fechaFin.value = "";
            elementos.fechaFinGroup.style.opacity = ".5";
        } else {
            elementos.fechaFinGroup.style.opacity = "1";
        }
    }

    // VALIDACIONES

    function limpiarErrores() {
        document.querySelectorAll(".field-error").forEach(el => {
            el.textContent = "";
        });

        document.querySelectorAll(".field").forEach(el => {
            el.classList.remove("invalid");
        });
    }

    function mostrarErrorCampo(id, mensaje) {
        const el = document.getElementById(id);

        if (el) {
            el.textContent = mensaje;

            const campo = el.closest(".field");

            if (campo) {
                campo.classList.add("invalid");
            }
        }
    }

    function validarFormulario() {
        limpiarErrores();

        let valido = true;

        if (!elementos.puesto.value.trim()) {
            mostrarErrorCampo("errPuesto", "Obligatorio");
            valido = false;
        } else if (elementos.puesto.value.trim().length > 150) {
            mostrarErrorCampo("errPuesto", "Máximo 150 caracteres.");
            valido = false;
        }

        if (!elementos.empresa.value.trim()) {
            mostrarErrorCampo("errEmpresa", "Obligatorio");
            valido = false;
        } else if (elementos.empresa.value.trim().length > 150) {
            mostrarErrorCampo("errEmpresa", "Máximo 150 caracteres.");
            valido = false;
        }

        if (!elementos.tipo.value) {
            mostrarErrorCampo("errTipo", "Obligatorio");
            valido = false;
        }

        if (!elementos.modalidad.value) {
            mostrarErrorCampo("errModalidad", "Obligatorio");
            valido = false;
        }

        if (!elementos.fechaInicio.value) {
            mostrarErrorCampo("errFechaInicio", "Obligatorio");
            valido = false;
        }

        if (elementos.descripcion.value.length > 1000) {
            mostrarErrorCampo("errDescripcion", "Máximo 1000 caracteres.");
            valido = false;
        }

        if (elementos.ubicacion.value.length > 200) {
            mostrarErrorCampo("errUbicacion", "Máximo 200 caracteres.");
            valido = false;
        }

        const fin = elementos.trabajoActual.checked
            ? ""
            : elementos.fechaFin.value;

        if (elementos.fechaInicio.value && fin &&
            fin < elementos.fechaInicio.value) {

            mostrarErrorCampo(
                "errFechaFin",
                "La fecha de fin no puede ser anterior a la de inicio."
            );

            valido = false;
        }

        const archivo = elementos.constancia?.files?.[0];

        if (archivo && archivo.size > MAX_DOCUMENTO_BYTES) {
            mostrarErrorCampo("errConstancia", "Máximo 10 MB.");
            valido = false;
        }

        return valido;
    }

    // GUARDAR EXPERIENCIA

    async function guardarExperiencia(e) {
        e.preventDefault();

        if (guardando || !validarFormulario()) return;

        const id = elementos.id.value;
        const actual = elementos.trabajoActual.checked;
        const esEdicion = Boolean(id);

        const url = esEdicion
            ? `${EXPERIENCIA_ENDPOINT}/${encodeURIComponent(id)}`
            : EXPERIENCIA_ENDPOINT;

        let documentoId = documentoConstanciaActual;

        const archivo = elementos.constancia?.files?.[0] || null;

        try {
            guardando = true;

            elementos.guardar.disabled = true;
            elementos.guardarTexto.textContent = "Procesando...";

            // Primero se carga el documento, si el usuario seleccionó uno.
            if (archivo) {
                elementos.guardarTexto.textContent = "Subiendo archivo...";

                documentoId = await subirDocumento(
                    archivo,
                    TIPO_DOCUMENTO_CONSTANCIA_LABORAL
                );
            }

            // DTO compatible con CrearExperienciaRequestDto
            // y ActualizarExperienciaRequestDto.
            const dto = {
                puesto: elementos.puesto.value.trim(),
                empresa: elementos.empresa.value.trim(),

                tipo: Number(elementos.tipo.value),
                modalidad: Number(elementos.modalidad.value),

                ubicacion: elementos.ubicacion.value.trim() || null,

                trabajoActual: actual,

                fechaInicio: elementos.fechaInicio.value,

                fechaFin: actual
                    ? null
                    : (elementos.fechaFin.value || null),

                descripcion: elementos.descripcion.value.trim() || null,

                documentoId: documentoId
            };

            elementos.guardarTexto.textContent = "Guardando...";

            await apiRequest(url, {
                method: esEdicion ? "PUT" : "POST",
                body: JSON.stringify(dto)
            });

            elementos.modal.classList.remove("show");

            restaurarScrollSegunModal();

            await cargarExperiencias();

            mostrarModalExito(esEdicion);

        } catch (error) {
            mostrarToast(
                error.message || "Error al guardar la experiencia.",
                "error"
            );

        } finally {
            guardando = false;

            elementos.guardar.disabled = false;

            elementos.guardarTexto.textContent = id
                ? "Guardar cambios"
                : "Guardar experiencia";
        }
    }

    // MODAL DE ÉXITO

    function mostrarModalExito(esEdicion) {
        if (elementos.successModal) {
            document.getElementById("successTitle").textContent =
                esEdicion ? "Actualizada" : "Guardada";

            document.getElementById("successMessage").textContent =
                esEdicion
                    ? "Los cambios se guardaron correctamente."
                    : "Experiencia agregada a tu expediente.";

            elementos.successModal.classList.add("show");

            document.body.style.overflow = "hidden";
        }
    }

    function cerrarModalExito() {
        if (elementos.successModal) {
            elementos.successModal.classList.remove("show");
        }

        restaurarScrollSegunModal();
    }

    // ELIMINACIÓN

    function solicitarEliminacion(id) {
        experienciaAEliminar = id;

        elementos.deleteModal.classList.add("show");

        document.body.style.overflow = "hidden";
    }

    function cerrarModalEliminar() {
        elementos.deleteModal.classList.remove("show");

        restaurarScrollSegunModal();

        experienciaAEliminar = null;
    }

    async function eliminarExperiencia() {
        if (!experienciaAEliminar) return;

        const boton = document.getElementById("confirmDeleteBtn");

        boton.disabled = true;
        boton.textContent = "...";

        try {
            await apiRequest(
                `${EXPERIENCIA_ENDPOINT}/${encodeURIComponent(experienciaAEliminar)}`,
                {
                    method: "DELETE"
                }
            );

            cerrarModalEliminar();

            mostrarToast("Registro eliminado.", "success");

            await cargarExperiencias();

        } catch (error) {
            mostrarToast(
                error.message || "Error al eliminar.",
                "error"
            );

        } finally {
            boton.disabled = false;
            boton.textContent = "Sí, eliminar";
        }
    }

    // UTILIDADES

    function restaurarScrollSegunModal() {
        const activo = document.querySelector(".modal-overlay.show");

        document.body.style.overflow = activo ? "hidden" : "";
    }

    function formatearFecha(fecha) {
        if (!fecha) return "Sin fecha";

        const partes = String(fecha).split("-");

        if (partes.length !== 3) return fecha;

        return new Date(
            Number(partes[0]),
            Number(partes[1]) - 1,
            Number(partes[2])
        ).toLocaleDateString("es-MX", {
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
        const contenedor = document.getElementById("toastContainer");

        const toast = document.createElement("div");

        const iconos = {
            success: "ri-checkbox-circle-line",
            error: "ri-error-warning-line",
            info: "ri-information-line"
        };

        toast.className = `toast ${tipo}`;

        toast.innerHTML = `
            <i class="${iconos[tipo] || iconos.info}"></i>
            <span>${escaparHTML(mensaje)}</span>`;

        contenedor.appendChild(toast);

        setTimeout(() => toast.remove(), 4500);
    }

    // EVENTOS

    document.getElementById("addExperienceBtn").onclick =
        abrirFormularioNuevo;

    document.getElementById("closeFormBtn").onclick =
        cerrarFormulario;

    document.getElementById("cancelFormBtn").onclick =
        cerrarFormulario;

    elementos.formulario.onsubmit = guardarExperiencia;

    elementos.trabajoActual.onchange = actualizarCampoFechaFin;

    document.getElementById("cancelDeleteBtn").onclick =
        cerrarModalEliminar;

    document.getElementById("confirmDeleteBtn").onclick =
        eliminarExperiencia;

    document.getElementById("closeSuccessBtn").onclick =
        cerrarModalExito;

    document.getElementById("closeDetailBtn").onclick =
        cerrarDetalleExperiencia;

    document.getElementById("closeDetailFooterBtn").onclick =
        cerrarDetalleExperiencia;

    document.getElementById("closeDocumentViewerBtn").onclick =
        () => cerrarVisualizadorDocumento();

    document.getElementById("closeDocumentViewerFooterBtn").onclick =
        () => cerrarVisualizadorDocumento();

    document.getElementById("closeRemoveDocumentBtn").onclick =
        () => cerrarModalQuitarDocumento();

    document.getElementById("cancelRemoveDocumentBtn").onclick =
        () => cerrarModalQuitarDocumento();

    document.getElementById("confirmRemoveDocumentBtn").onclick =
        confirmarQuitarDocumento;

    document.getElementById("downloadViewerDocumentBtn").onclick = () => {
        if (documentoVisualizadoActual && blobDocumentoActual) {
            const url = URL.createObjectURL(blobDocumentoActual);

            const enlace = document.createElement("a");

            enlace.href = url;
            enlace.download = nombreDocumentoActual || "documento";

            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    };

    // CIERRE DE MODALES AL HACER CLIC FUERA

    document.querySelectorAll(".modal-overlay").forEach(elemento => {
        elemento.addEventListener("click", evento => {
            if (evento.target !== elemento) return;

            if (elemento.id === "formModal") {
                cerrarFormulario();
            } else if (elemento.id === "deleteModal") {
                cerrarModalEliminar();
            } else if (elemento.id === "successModal") {
                cerrarModalExito();
            } else if (elemento.id === "detailModal") {
                cerrarDetalleExperiencia();
            } else if (elemento.id === "documentViewerModal") {
                cerrarVisualizadorDocumento();
            } else if (elemento.id === "removeDocumentModal") {
                cerrarModalQuitarDocumento();
            }
        });
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


// INICIALIZACIÓN SEGURA
// ---------------------------------------------------------
// INICIALIZACIÓN DE LA PÁGINA
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    document.body.style.visibility = "visible";
    mostrarSkeleton();

    try {
        const accesoPermitido = await verificarAccesoInicial();

        if (!accesoPermitido) {
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
            console.error(
                "Error al cargar las preferencias visuales:",
                error
            );
        }

        await cargarUsuario();
        await cargarExperiencias();

    } catch (error) {
        console.error(
            "Error al inicializar la página:",
            error
        );

    } finally {
        ocultarSkeleton();
    }
});