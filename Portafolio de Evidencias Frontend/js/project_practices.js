
"use strict";

/* ============================================================
   CONFIGURACIÓN GENERAL
============================================================ */

const API_BASE = "https://pureblood-starfish-happening.ngrok-free.dev/api";

const ENDPOINT_AUTH = `${API_BASE}/Auth`;
const ENDPOINT_PROYECTOS = `${API_BASE}/Proyectos`;
const ENDPOINT_PRACTICAS = `${API_BASE}/Practicas`;
const ENDPOINT_DOCUMENTOS = `${API_BASE}/Documentos`;

const LOGIN_URL = "login.html";
const MAX_EVIDENCIA = 10 * 1024 * 1024;

const TIPOS_DOCUMENTO = {
    EVIDENCIA_PROYECTO: 9,
    CONSTANCIA: 8,
    CONSTANCIA_LABORAL: 11,
    OTRO: 10
};

const TIPOS_ARCHIVO_PERMITIDOS = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
];

/* ============================================================
   ESTADO DE LA APLICACIÓN
============================================================ */

let proyectos = [];
let practicas = [];

let proyectoActual = null;
let practicaActual = null;

let elementoAEliminar = null;
let tipoElementoAEliminar = null;

let tecnologiasFormulario = [];

let archivosEvidenciaPendientes = [];
let documentoPracticaPendiente = null;
let documentoPracticaActual = null;

let guardandoProyecto = false;
let guardandoPractica = false;
let eliminandoRegistro = false;

let documentoActualVisor = null;
let urlTemporalVisor = null;
let controllerVisor = null;

let moduloActual = "projects";
let usuarioAutenticado = null;
let temporizadorModalSesion = null;
let sesionBloqueada = false;
/* ============================================================
   UTILIDADES GENERALES
============================================================ */

const $ = (id) => document.getElementById(id);

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizarTexto(valor) {
    return String(valor ?? "").trim();
}

function convertirFechaInput(valor) {
    if (!valor) return "";
    if (typeof valor === "string") return valor.substring(0, 10);
    return "";
}

function formatearFecha(valor) {
    if (!valor) return "Sin fecha";
    const fecha = new Date(`${convertirFechaInput(valor)}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return "Sin fecha";
    return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(".", "");
}

function formatearPeriodo(inicio, fin, enCurso = false) {
    const fechaInicio = formatearFecha(inicio);
    if (enCurso || !fin) return `${fechaInicio} - ACTUAL`;
    return `${fechaInicio} - ${formatearFecha(fin)}`;
}

function formatearBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function obtenerInicial(nombre) {
    const texto = normalizarTexto(nombre);
    return texto ? texto.charAt(0).toUpperCase() : "U";
}

function obtenerMensajeError(error) {
    if (error instanceof Error) return error.message;
    return "Ocurrió un error inesperado.";
}

function validarURL(valor) {
    if (!valor) return true;
    try {
        const url = new URL(valor);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function validarArchivo(archivo) {
    if (!archivo) return false;
    const extension = archivo.name.split(".").pop().toLowerCase();
    const extensionesPermitidas = ["pdf", "jpg", "jpeg", "png", "webp"];
    return extensionesPermitidas.includes(extension);
}

function crearElementoHTML(html) {
    const contenedor = document.createElement("template");
    contenedor.innerHTML = html.trim();
    return contenedor.content.firstElementChild;
}

/* ============================================================
   API
============================================================ */

class ApiError extends Error {
    constructor(mensaje, status = 0, datos = null) {
        super(mensaje);
        this.name = "ApiError";
        this.status = status;
        this.datos = datos;
    }
}

async function apiRequest(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});

    headers.set("ngrok-skip-browser-warning", "true");

    if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
    }

    const configuracion = {
        ...opciones,
        method: opciones.method || "GET",
        credentials: "include",
        cache: "no-store",
        headers,
        signal: opciones.signal
    };

    if (opciones.body instanceof FormData) {
        configuracion.body = opciones.body;
    } else if (opciones.body !== undefined && opciones.body !== null) {
        if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        configuracion.body = JSON.stringify(opciones.body);
    }

    let respuesta;

    try {
        respuesta = await fetch(url, configuracion);
    } catch (error) {
        if (error.name === "AbortError") throw error;

        throw new ApiError(
            "No fue posible conectar con el servidor. Verifica que la API esté ejecutándose."
        );
    }

    if (respuesta.status === 401) {
        manejarSesionNoValida();
        throw new ApiError("La sesión ha expirado.", 401);
    }

    if (respuesta.status === 403) {
        throw new ApiError(
            "No tienes autorización para realizar esta operación.",
            403
        );
    }

    if (respuesta.status === 204) return null;

    const tipoContenido = respuesta.headers.get("content-type") || "";
    let datos = null;

    if (tipoContenido.includes("application/json")) {
        try {
            datos = await respuesta.json();
        } catch {
            datos = null;
        }
    } else if (!respuesta.ok) {
        datos = await respuesta.text().catch(() => null);
    }

    if (!respuesta.ok) {
        const mensaje =
            datos?.mensaje ||
            datos?.message ||
            datos?.title ||
            (typeof datos === "string" ? datos : null) ||
            `Error HTTP ${respuesta.status}.`;

        throw new ApiError(mensaje, respuesta.status, datos);
    }

    return datos;
}

/* ============================================================
   AUTENTICACIÓN
============================================================ */

function manejarSesionNoValida() {
    if (sesionBloqueada) return;

    sesionBloqueada = true;

    ocultarSkeleton();

    document.body.style.visibility = "visible";
    document.body.style.overflow = "hidden";

    const modal = $("sessionModal");

    if (modal) {
        modal.classList.add("show");
        modal.style.display = "flex";
        modal.style.pointerEvents = "auto";
        modal.style.zIndex = "999999";
    }

    document.addEventListener("keydown", bloquearInteraccionSesion, true);

    if (temporizadorModalSesion) {
        clearTimeout(temporizadorModalSesion);
    }

    temporizadorModalSesion = setTimeout(() => {
        window.location.replace(LOGIN_URL);
    }, 2500);
}

function bloquearInteraccionSesion(evento) {
    if (!sesionBloqueada) return;

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
}

async function verificarSesion() {
    try {
        const usuario = await apiRequest(`${ENDPOINT_AUTH}/me`);
        usuarioAutenticado = usuario;
        
        const nombre = usuario?.nombreCompleto || usuario?.nombre || usuario?.NombreCompleto || usuario?.Nombre || usuario?.correo || usuario?.email || "Usuario";
        actualizarDatosUsuario(nombre);

        document.body.style.visibility = "visible";
        return true;
    } catch (error) {
        manejarSesionNoValida();
        return false;
    }
}

function actualizarDatosUsuario(nombre) {
    const nombreLimpio = normalizarTexto(nombre) || "Usuario";
    const inicial = obtenerInicial(nombreLimpio);

    if ($("userName")) $("userName").textContent = nombreLimpio;
    if ($("userAvatar")) $("userAvatar").textContent = inicial;
}

/* ============================================================
   NOTIFICACIONES (Toast Style matching UI)
============================================================ */

function showToast(mensaje, tipo = "info") {
    const contenedor = $("toastContainer");
    if (!contenedor) return;

    const iconos = {
        success: "ri-checkbox-circle-line",
        error: "ri-error-warning-line",
        warning: "ri-alert-line",
        info: "ri-information-line"
    };

    const toast = crearElementoHTML(`
        <div class="toast ${tipo}">
            <i class="${iconos[tipo] || iconos.info}"></i>
            <span>${escaparHTML(mensaje)}</span>
        </div>
    `);

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-removing");
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

/* ============================================================
   CONTROL DE MODALES
============================================================ */

function abrirModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}
function cerrarModal(id) {
    if (sesionBloqueada) return;

    const modal = $(id);
    if (!modal) return;

    modal.classList.remove("show");

    if (!document.querySelector(".modal-overlay.show")) {
        document.body.style.overflow = "";
    }
}

function cerrarTodosLosModales() {
    if (sesionBloqueada) return;

    document.querySelectorAll(".modal-overlay.show").forEach(modal => {
        modal.classList.remove("show");
    });

    document.body.style.overflow = "";
}

/* ============================================================
   NAVEGACIÓN ENTRE MÓDULOS
============================================================ */

function cambiarModulo(modulo) {
    if (!["projects", "practices"].includes(modulo)) return;
    moduloActual = modulo;

    $("projectsTab")?.classList.toggle("active", modulo === "projects");
    $("practicesTab")?.classList.toggle("active", modulo === "practices");

    $("projectsModule")?.classList.toggle("active", modulo === "projects");
    $("practicesModule")?.classList.toggle("active", modulo === "practices");

    if (modulo === "projects") {
        aplicarFiltrosProyectos();
    } else {
        aplicarFiltrosPracticas();
    }
}

/* ============================================================
   PROYECTOS
============================================================ */

async function cargarProyectos() {
    const grid = $("projectsGrid");
    if (grid) {
        grid.innerHTML = `
            <div class="state-panel">
                <i class="ri-loader-4-line spinner"></i>
                <p>Cargando proyectos...</p>
            </div>
        `;
    }

    try {
        const resultado = await apiRequest(ENDPOINT_PROYECTOS);
        proyectos = Array.isArray(resultado) ? resultado : [];
        actualizarEstadisticasProyectos();
        aplicarFiltrosProyectos();
        $("projectsTabCount").textContent = proyectos.length;
    } catch (error) {
        if (error.status !== 401) showToast(obtenerMensajeError(error), "error");
        if (grid) {
            grid.innerHTML = `
                <div class="state-panel error">
                    <div class="state-icon"><i class="ri-error-warning-line"></i></div>
                    <h3>Error al cargar</h3>
                    <p>No fue posible cargar los proyectos.</p>
                    <button type="button" class="primary-btn" id="retryProjectsBtn">Reintentar</button>
                </div>
            `;
            $("retryProjectsBtn")?.addEventListener("click", cargarProyectos);
        }
    }
}

function actualizarEstadisticasProyectos() {
    $("totalProjects").textContent = proyectos.length;
    $("activeProjects").textContent = proyectos.filter(p => p.esDestacado).length;
    $("completedProjects").textContent = proyectos.filter(p => (p.documentos || []).length > 0).length;
}

function obtenerTecnologias(proyecto) {
    if (!proyecto?.tecnologias) return [];
    if (Array.isArray(proyecto.tecnologias)) return proyecto.tecnologias;
    try {
        const datos = JSON.parse(proyecto.tecnologias);
        return Array.isArray(datos) ? datos : [];
    } catch {
        return proyecto.tecnologias.split(",").map(t => t.trim()).filter(Boolean);
    }
}

function obtenerDocumentosProyecto(proyecto) {
    return proyecto.documentos || proyecto.evidencias || [];
}

function aplicarFiltrosProyectos() {
    const busqueda = normalizarTexto($("searchInput")?.value).toLowerCase();
    const filtroDestacados = $("typeFilter")?.value || "";
    const orden = $("statusFilter")?.value || "recientes";

    let resultado = [...proyectos];

    if (busqueda) {
        resultado = resultado.filter(proyecto => {
            const tecnologias = obtenerTecnologias(proyecto).join(" ");
            const texto = [proyecto.nombre, proyecto.descripcion, tecnologias].join(" ").toLowerCase();
            return texto.includes(busqueda);
        });
    }

    if (filtroDestacados === "destacados") resultado = resultado.filter(p => p.esDestacado);
    if (filtroDestacados === "sin-destacar") resultado = resultado.filter(p => !p.esDestacado);

    if (orden === "recientes") resultado.sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")));
    if (orden === "antiguos") resultado.sort((a, b) => String(a.fechaInicio || "").localeCompare(String(b.fechaInicio || "")));
    if (orden === "nombre") resultado.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

    renderizarProyectos(resultado);
    $("resultsCount").textContent = `${resultado.length} ${resultado.length === 1 ? "proyecto" : "proyectos"}`;
}

function renderizarProyectos(lista) {
    const grid = $("projectsGrid");
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = `
            <div class="state-panel">
                <div class="state-icon"><i class="ri-folder-add-line"></i></div>
                <h3>No hay resultados</h3>
                <p>${proyectos.length ? "No hay proyectos que coincidan con los filtros." : "Agrega tu primer proyecto al portafolio."}</p>
                ${!proyectos.length ? '<button class="primary-btn" type="button" onclick="abrirFormularioProyecto()"><i class="ri-add-line"></i> Crear proyecto</button>' : ''}
            </div>
        `;
        return;
    }

    grid.innerHTML = "";

    lista.forEach((proyecto, idx) => {
        const tecnologias = obtenerTecnologias(proyecto);
        const documentos = obtenerDocumentosProyecto(proyecto);
        
        let tagsHTML = `<div class="tech-stack">`;
        tecnologias.slice(0, 3).forEach(tech => tagsHTML += `<span class="tech-pill">${escaparHTML(tech)}</span>`);
        if (tecnologias.length > 3) tagsHTML += `<span class="tech-pill more">+${tecnologias.length - 3}</span>`;
        if (tecnologias.length === 0) tagsHTML += `<span class="tech-pill">Sin tecnologías</span>`;
        tagsHTML += `</div>`;

        const tarjeta = crearElementoHTML(`
            <article class="project-card" style="animation-delay: ${idx * 0.05}s;">
                <div class="project-cover">
                    <i class="ri-macbook-line"></i>
                    <div class="cover-overlay"></div>
                    <div class="project-badges">
                        ${proyecto.esDestacado ? '<span class="badge status-destacado"><i class="ri-star-fill"></i> Destacado</span>' : '<span class="badge"><i class="ri-code-s-slash-line"></i> Proyecto</span>'}
                        ${!proyecto.fechaFin ? '<span class="badge status status-desarrollo">En desarrollo</span>' : '<span class="badge status status-finalizado">Finalizado</span>'}
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${escaparHTML(proyecto.nombre)}</h3>
                    <div class="project-date">
                        <i class="ri-calendar-line"></i>
                        <span>${escaparHTML(formatearPeriodo(proyecto.fechaInicio, proyecto.fechaFin))}</span>
                    </div>
                    <p class="project-description">${escaparHTML(proyecto.descripcion || "Sin descripción registrada.")}</p>
                    ${tagsHTML}
                </div>
                <div class="project-actions">
                    <button type="button" class="action-btn view" data-action="view-project" data-id="${proyecto.id}">
                        <i class="ri-eye-line"></i> Ver
                    </button>
                    <button type="button" class="action-btn" data-action="edit-project" data-id="${proyecto.id}">
                        <i class="ri-edit-line"></i> Editar
                    </button>
                    <button type="button" class="action-btn delete" data-action="delete-project" data-id="${proyecto.id}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </article>
        `);
        grid.appendChild(tarjeta);
    });
}

function limpiarFormularioProyecto() {
    $("projectForm")?.reset();
    $("formId").value = "";
    tecnologiasFormulario = [];
    archivosEvidenciaPendientes = [];
    actualizarListaTecnologias();
    actualizarListaEvidencias();
    $("modalTitle").textContent = "Nuevo proyecto";
    $("saveBtnText").textContent = "Guardar proyecto";
}

function abrirFormularioProyecto(proyecto = null) {
    limpiarFormularioProyecto();
    proyectoActual = proyecto;

    if (proyecto) {
        $("modalTitle").textContent = "Editar proyecto";
        $("saveBtnText").textContent = "Guardar cambios";
        $("formId").value = proyecto.id;
        $("formName").value = proyecto.nombre || "";
        $("formDescription").value = proyecto.descripcion || "";
        $("formStartDate").value = convertirFechaInput(proyecto.fechaInicio);
        $("formEndDate").value = convertirFechaInput(proyecto.fechaFin);
        $("formFeatured").checked = Boolean(proyecto.esDestacado);
        $("formGithub").value = proyecto.urlRepositorio || "";
        $("formDemo").value = proyecto.urlDemostracion || "";

        tecnologiasFormulario = obtenerTecnologias(proyecto);
        actualizarListaTecnologias();
        cargarEvidenciasProyecto(proyecto.id);
    } else {
        proyectoActual = null;
    }
    cerrarModal("detailModal");
    abrirModal("formModal");
}

function actualizarListaTecnologias() {
    const lista = $("techList");
    if (!lista) return;
    lista.innerHTML = "";
    if (tecnologiasFormulario.length === 0) {
        lista.innerHTML = '<span class="tech-empty">Todavía no agregas tecnologías.</span>';
        return;
    }
    tecnologiasFormulario.forEach((tecnologia, indice) => {
        const etiqueta = crearElementoHTML(`
            <span class="tech-edit-tag">
                ${escaparHTML(tecnologia)}
                <button type="button" data-remove-tech="${indice}"><i class="ri-close-line"></i></button>
            </span>
        `);
        lista.appendChild(etiqueta);
    });
}

function agregarTecnologia() {
    const input = $("techInput");
    const tecnologia = normalizarTexto(input.value);
    if (!tecnologia) return;
    if (tecnologia.length > 30) return showToast("La tecnología no puede superar 30 caracteres.", "warning");
    if (tecnologiasFormulario.length >= 10) return showToast("Puedes registrar hasta 10 tecnologías.", "warning");
    if (tecnologiasFormulario.some(t => t.toLowerCase() === tecnologia.toLowerCase())) return showToast("Esta tecnología ya está agregada.", "warning");
    tecnologiasFormulario.push(tecnologia);
    input.value = "";
    actualizarListaTecnologias();
}

async function cargarEvidenciasProyecto(proyectoId) {
    try {
        const documentos = await apiRequest(`${ENDPOINT_DOCUMENTOS}/proyecto/${proyectoId}`);
        const proyecto = proyectos.find(p => p.id === Number(proyectoId));
        if (proyecto) proyecto.documentos = Array.isArray(documentos) ? documentos : [];
        renderizarEvidenciasExistentes(documentos || []);
        actualizarEstadisticasProyectos();
    } catch (error) {
        if (error.status !== 401) showToast("No fue posible cargar las evidencias.", "error");
    }
}

function renderizarEvidenciasExistentes(documentos) {
    const lista = $("evidenceList");
    if (!lista) return;
    lista.innerHTML = "";
    documentos.forEach(documento => {
        const elemento = crearElementoHTML(`
            <div class="evidence-item">
                <div class="evidence-info">
                    <div class="evidence-icon"><i class="ri-file-shield-2-line"></i></div>
                    <div>
                        <span class="evidence-name">${escaparHTML(documento.nombreArchivo)}</span>
                        <span class="evidence-meta">${formatearBytes(documento.tamanoBytes)}</span>
                    </div>
                </div>
                <button type="button" class="evidence-remove" data-delete-document="${documento.id}">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `);
        lista.appendChild(elemento);
    });
    actualizarListaEvidencias();
}

function actualizarListaEvidencias() {
    const lista = $("evidenceList");
    if (!lista) return;
    
    if (archivosEvidenciaPendientes.length === 0 && lista.children.length === 0) {
        lista.innerHTML = '<div class="tech-empty">No hay evidencias seleccionadas.</div>';
    }

    archivosEvidenciaPendientes.forEach((archivo, indice) => {
        const elemento = crearElementoHTML(`
            <div class="evidence-item">
                <div class="evidence-info">
                    <div class="evidence-icon"><i class="ri-upload-cloud-2-line"></i></div>
                    <div>
                        <span class="evidence-name">${escaparHTML(archivo.name)}</span>
                        <span class="evidence-meta">${formatearBytes(archivo.size)} · Pendiente</span>
                    </div>
                </div>
                <button type="button" class="evidence-remove" data-remove-pending-evidence="${indice}">
                    <i class="ri-close-line"></i>
                </button>
            </div>
        `);
        // Remove empty state message if exists
        const emptyState = lista.querySelector('.tech-empty');
        if (emptyState) emptyState.remove();
        
        lista.appendChild(elemento);
    });
}

function seleccionarEvidencias(archivos) {
    const seleccionados = Array.from(archivos || []);
    for (const archivo of seleccionados) {
        if (!validarArchivo(archivo)) { showToast(`Formato no permitido: ${archivo.name}`, "warning"); continue; }
        if (archivo.size > MAX_EVIDENCIA) { showToast(`Supera los 10MB: ${archivo.name}`, "warning"); continue; }
        if (!archivosEvidenciaPendientes.some(a => a.name === archivo.name && a.size === archivo.size)) {
            archivosEvidenciaPendientes.push(archivo);
        }
    }
    actualizarListaEvidencias();
}

async function subirDocumento(archivo, tipoDocumento, proyectoId = null) {
    const formulario = new FormData();
    formulario.append("archivo", archivo);
    formulario.append("tipoDocumento", String(tipoDocumento));
    if (proyectoId !== null && proyectoId !== undefined) formulario.append("proyectoId", String(proyectoId));
    return await apiRequest(ENDPOINT_DOCUMENTOS, { method: "POST", body: formulario });
}

async function eliminarDocumento(documentoId) {
    await apiRequest(`${ENDPOINT_DOCUMENTOS}/${documentoId}`, { method: "DELETE" });
    showToast("Documento eliminado correctamente.", "success");
}

function construirProyectoDto() {
    const nombre = normalizarTexto($("formName").value);
    const descripcion = normalizarTexto($("formDescription").value);
    const fechaInicio = $("formStartDate").value || null;
    const fechaFin = $("formEndDate").value || null;
    const repositorio = normalizarTexto($("formGithub").value);
    const demostracion = normalizarTexto($("formDemo").value);

    if (!nombre) throw new Error("El nombre del proyecto es obligatorio.");
    if (nombre.length > 150) throw new Error("El nombre no puede superar 150 caracteres.");
    if (descripcion.length > 1500) throw new Error("La descripción no puede superar 1500 caracteres.");
    if (repositorio && !validarURL(repositorio)) throw new Error("La URL del repositorio no es válida.");
    if (demostracion && !validarURL(demostracion)) throw new Error("La URL de demostración no es válida.");
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) throw new Error("La fecha de fin no puede ser anterior al inicio.");

    const tecnologias = tecnologiasFormulario.join(", ");
    if (tecnologias.length > 100) throw new Error("Demasiadas tecnologías.");

    return {
        nombre,
        descripcion: descripcion || null,
        tecnologias: tecnologias || null,
        urlRepositorio: repositorio || null,
        urlDemostracion: demostracion || null,
        fechaInicio,
        fechaFin,
        esDestacado: $("formFeatured").checked
    };
}

async function guardarProyecto(evento) {
    evento.preventDefault();
    if (guardandoProyecto) return;

    let dto;
    try { dto = construirProyectoDto(); } catch (error) { return showToast(error.message, "warning"); }

    guardandoProyecto = true;
    const boton = $("saveBtn");
    boton.disabled = true;
    $("saveBtnText").textContent = "Guardando...";

    try {
        const id = $("formId").value;
        let proyectoGuardado;
        if (id) {
            proyectoGuardado = await apiRequest(`${ENDPOINT_PROYECTOS}/${id}`, { method: "PUT", body: dto });
            showToast("Proyecto actualizado.", "success");
        } else {
            proyectoGuardado = await apiRequest(ENDPOINT_PROYECTOS, { method: "POST", body: dto });
            showToast("Proyecto creado.", "success");
        }

        const proyectoId = proyectoGuardado?.id || Number(id);
        let erroresEvidencias = 0;
        for (const archivo of archivosEvidenciaPendientes) {
            try {
                await subirDocumento(archivo, TIPOS_DOCUMENTO.EVIDENCIA_PROYECTO, proyectoId);
            } catch {
                erroresEvidencias++;
            }
        }
        cerrarModal("formModal");
        await cargarProyectos();
        if (erroresEvidencias > 0) showToast(`Guardado, pero ${erroresEvidencias} evidencias fallaron.`, "warning");
    } catch (error) {
        showToast(obtenerMensajeError(error), "error");
    } finally {
        guardandoProyecto = false;
        boton.disabled = false;
        $("saveBtnText").textContent = $("formId").value ? "Guardar cambios" : "Guardar proyecto";
    }
}

async function abrirDetalleProyecto(id) {
    try {
        const proyecto = await apiRequest(`${ENDPOINT_PROYECTOS}/${id}`);
        proyectoActual = proyecto;

        $("detailName").textContent = proyecto.nombre || "Proyecto";
        $("detailDescription").textContent = proyecto.descripcion || "Sin descripción registrada.";
        $("detailDates").textContent = formatearPeriodo(proyecto.fechaInicio, proyecto.fechaFin);

        $("detailTechs").innerHTML = "";
        const techs = obtenerTecnologias(proyecto);
        if (techs.length === 0) $("detailTechs").innerHTML = '<span class="detail-empty">Sin tecnologías.</span>';
        techs.forEach(tecnologia => {
            $("detailTechs").appendChild(crearElementoHTML(`<span class="tech-pill">${escaparHTML(tecnologia)}</span>`));
        });

        $("detailLinks").innerHTML = "";
        agregarEnlaceDetalle($("detailLinks"), "Repositorio", proyecto.urlRepositorio, "ri-github-line");
        agregarEnlaceDetalle($("detailLinks"), "Demostración", proyecto.urlDemostracion, "ri-external-link-line");
        if (!proyecto.urlRepositorio && !proyecto.urlDemostracion) $("detailLinks").innerHTML = '<span class="detail-empty">No hay enlaces externos.</span>';

        await cargarDetalleEvidencias(proyecto.id);
        abrirModal("detailModal");
    } catch (error) {
        showToast(obtenerMensajeError(error), "error");
    }
}

function agregarEnlaceDetalle(contenedor, titulo, url, icon) {
    if (!url) return;
    contenedor.appendChild(crearElementoHTML(`
        <a class="detail-link" href="${escaparHTML(url)}" target="_blank" rel="noopener noreferrer">
            <i class="${icon}"></i> Consultar ${escaparHTML(titulo)}
        </a>
    `));
}

async function cargarDetalleEvidencias(proyectoId) {
    const contenedor = $("detailEvidenceList");
    contenedor.innerHTML = `<span class="detail-empty">Cargando evidencias...</span>`;
    try {
        const documentos = await apiRequest(`${ENDPOINT_DOCUMENTOS}/proyecto/${proyectoId}`);
        contenedor.innerHTML = "";
        if (!documentos.length) {
            contenedor.innerHTML = `<span class="detail-empty">Este proyecto no tiene evidencias.</span>`;
            return;
        }
        documentos.forEach(documento => {
            contenedor.appendChild(crearElementoHTML(`
                <div class="evidence-item">
                    <div class="evidence-info">
                        <div class="evidence-icon"><i class="ri-file-shield-2-line"></i></div>
                        <div>
                            <span class="evidence-name">${escaparHTML(documento.nombreArchivo)}</span>
                            <span class="evidence-meta">${formatearBytes(documento.tamanoBytes)}</span>
                        </div>
                    </div>
                    <div class="evidence-actions-group">
                        <button type="button" class="evidence-action-btn" data-view-document="${documento.id}"><i class="ri-eye-line"></i></button>
                        <button type="button" class="evidence-action-btn" data-download-document="${documento.id}"><i class="ri-download-line"></i></button>
                    </div>
                </div>
            `));
        });
    } catch {
        contenedor.innerHTML = `<span class="detail-empty" style="color:var(--red);">Error al cargar evidencias.</span>`;
    }
}

/* ============================================================
   PRÁCTICAS
============================================================ */

async function cargarPracticas() {
    const grid = $("practicesGrid");
    if (grid) grid.innerHTML = `<div class="state-panel"><i class="ri-loader-4-line spinner"></i><p>Cargando prácticas...</p></div>`;
    try {
        const resultado = await apiRequest(ENDPOINT_PRACTICAS);
        practicas = Array.isArray(resultado) ? resultado : [];
        actualizarEstadisticasPracticas();
        aplicarFiltrosPracticas();
        $("practicesTabCount").textContent = practicas.length;
    } catch (error) {
        if (error.status !== 401) showToast(obtenerMensajeError(error), "error");
        if (grid) {
            grid.innerHTML = `<div class="state-panel error"><div class="state-icon"><i class="ri-error-warning-line"></i></div><h3>Error</h3><p>No fue posible cargar las prácticas.</p></div>`;
        }
    }
}

function actualizarEstadisticasPracticas() {
    $("totalPractices").textContent = practicas.length;
    $("ongoingPractices").textContent = practicas.filter(p => p.enCurso).length;
    $("totalPracticeHours").textContent = practicas.reduce((acc, p) => acc + (Number(p.horasRealizadas) || 0), 0).toLocaleString("es-MX");
}

function aplicarFiltrosPracticas() {
    const busqueda = normalizarTexto($("practiceSearchInput")?.value).toLowerCase();
    const filtroEstado = $("practiceStatusFilter")?.value || "";
    let resultado = [...practicas];

    if (busqueda) {
        resultado = resultado.filter(practica => {
            const texto = [practica.empresa, practica.puesto, practica.institucionEducativa, practica.descripcion].join(" ").toLowerCase();
            return texto.includes(busqueda);
        });
    }
    if (filtroEstado === "en-curso") resultado = resultado.filter(p => p.enCurso);
    if (filtroEstado === "finalizadas") resultado = resultado.filter(p => !p.enCurso);
    resultado.sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")));

    renderizarPracticas(resultado);
    $("practiceResultsCount").textContent = `${resultado.length} ${resultado.length === 1 ? "práctica" : "prácticas"}`;
}

function renderizarPracticas(lista) {
    const grid = $("practicesGrid");
    if (!grid) return;
    if (lista.length === 0) {
        grid.innerHTML = `
            <div class="state-panel">
                <div class="state-icon"><i class="ri-briefcase-add-line"></i></div>
                <h3>No hay resultados</h3>
                <p>${practicas.length ? "No hay prácticas que coincidan." : "Registra tu primera experiencia profesional."}</p>
                ${!practicas.length ? '<button class="primary-btn" type="button" onclick="abrirFormularioPractica()"><i class="ri-add-line"></i> Nueva práctica</button>' : ''}
            </div>
        `;
        return;
    }
    grid.innerHTML = "";
    lista.forEach((practica, idx) => {
        const tarjeta = crearElementoHTML(`
            <article class="project-card" style="animation-delay: ${idx * 0.05}s;">
                <div class="project-cover practice-cover">
                    <i class="ri-building-4-line"></i>
                    <div class="cover-overlay"></div>
                    <div class="project-badges">
                        <span class="badge"><i class="ri-briefcase-4-line"></i> Práctica</span>
                        ${practica.enCurso ? '<span class="badge status status-desarrollo">En curso</span>' : '<span class="badge status status-finalizado">Finalizada</span>'}
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${escaparHTML(practica.empresa)}</h3>
                    <div class="project-subtitle">${escaparHTML(practica.puesto)}</div>
                    <div class="project-date">
                        <i class="ri-time-line"></i>
                        <span>${Number(practica.horasRealizadas) || 0} hrs · ${escaparHTML(formatearPeriodo(practica.fechaInicio, practica.fechaFin, practica.enCurso))}</span>
                    </div>
                    <p class="project-description">${escaparHTML(practica.descripcion || "Sin descripción.")}</p>
                </div>
                <div class="project-actions">
                    <button type="button" class="action-btn view" data-action="view-practice" data-id="${practica.id}">
                        <i class="ri-eye-line"></i> Ver
                    </button>
                    <button type="button" class="action-btn" data-action="edit-practice" data-id="${practica.id}">
                        <i class="ri-edit-line"></i> Editar
                    </button>
                    <button type="button" class="action-btn delete" data-action="delete-practice" data-id="${practica.id}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </article>
        `);
        grid.appendChild(tarjeta);
    });
}

function limpiarFormularioPractica() {
    $("practiceForm")?.reset();
    $("practiceFormId").value = "";
    $("practiceDocumentId").value = "";
    documentoPracticaPendiente = null;
    documentoPracticaActual = null;
    $("practiceDocumentName").textContent = "Ningún documento seleccionado";
    $("removePracticeDocumentBtn")?.classList.add("hidden");
    $("practiceModalTitle").textContent = "Nueva práctica profesional";
    $("savePracticeBtnText").textContent = "Guardar práctica";
    actualizarEstadoFechaPractica();
}

function abrirFormularioPractica(practica = null) {
    limpiarFormularioPractica();
    practicaActual = practica;
    if (practica) {
        $("practiceModalTitle").textContent = "Editar práctica";
        $("savePracticeBtnText").textContent = "Guardar cambios";
        $("practiceFormId").value = practica.id;
        $("practiceCompany").value = practica.empresa || "";
        $("practicePosition").value = practica.puesto || "";
        $("practiceInstitution").value = practica.institucionEducativa || "";
        $("practiceDescription").value = practica.descripcion || "";
        $("practiceStartDate").value = convertirFechaInput(practica.fechaInicio);
        $("practiceEndDate").value = convertirFechaInput(practica.fechaFin);
        $("practiceOngoing").checked = Boolean(practica.enCurso);
        $("practiceHours").value = practica.horasRealizadas ?? "";
        $("practiceDocumentId").value = practica.documentoId ?? "";
        documentoPracticaActual = practica.documentoId || null;
        if (practica.documentoId) {
            $("practiceDocumentName").textContent = "Documento previamente asociado";
            $("removePracticeDocumentBtn").classList.remove("hidden");
        }
    }
    actualizarEstadoFechaPractica();
    cerrarModal("practiceDetailModal");
    abrirModal("practiceFormModal");
}

function actualizarEstadoFechaPractica() {
    const enCurso = $("practiceOngoing")?.checked;
    const campo = $("practiceEndDate");
    if (!campo) return;
    campo.disabled = Boolean(enCurso);
    if (enCurso) campo.value = "";
}

function seleccionarDocumentoPractica(archivo) {
    if (!archivo) return;
    if (!validarArchivo(archivo)) return showToast("Formato no permitido.", "warning");
    if (archivo.size > MAX_EVIDENCIA) return showToast("Supera los 10MB.", "warning");
    documentoPracticaPendiente = archivo;
    $("practiceDocumentName").textContent = archivo.name;
    $("removePracticeDocumentBtn").classList.remove("hidden");
}

function quitarDocumentoPractica() {
    documentoPracticaPendiente = null;
    documentoPracticaActual = null;
    $("practiceDocumentId").value = "";
    $("practiceDocumentInput").value = "";
    $("practiceDocumentName").textContent = "Ningún documento seleccionado";
    $("removePracticeDocumentBtn").classList.add("hidden");
}

function construirPracticaDto() {
    const empresa = normalizarTexto($("practiceCompany").value);
    const puesto = normalizarTexto($("practicePosition").value);
    const institucion = normalizarTexto($("practiceInstitution").value);
    const descripcion = normalizarTexto($("practiceDescription").value);
    const fechaInicio = $("practiceStartDate").value;
    const fechaFin = $("practiceEndDate").value || null;
    const enCurso = $("practiceOngoing").checked;
    const horasTexto = $("practiceHours").value.trim();
    const horas = horasTexto === "" ? null : Number(horasTexto);

    if (!empresa || !puesto) throw new Error("Empresa y puesto son obligatorios.");
    if (empresa.length > 150 || puesto.length > 150) throw new Error("Máximo 150 caracteres para empresa y puesto.");
    if (institucion.length > 150) throw new Error("Máximo 150 caracteres para institución.");
    if (descripcion.length > 1000) throw new Error("Máximo 1000 caracteres para descripción.");
    if (!fechaInicio) throw new Error("Fecha de inicio obligatoria.");
    if (!enCurso && !fechaFin) throw new Error("Indica fecha de fin o marca como en curso.");
    if (fechaFin && fechaFin < fechaInicio) throw new Error("La fecha final no puede ser anterior.");
    if (horas !== null && (!Number.isInteger(horas) || horas < 0)) throw new Error("Horas inválidas.");

    return {
        empresa, puesto, institucionEducativa: institucion || null, descripcion: descripcion || null,
        fechaInicio, fechaFin: enCurso ? null : fechaFin, enCurso, horasRealizadas: horas,
        documentoId: $("practiceDocumentId").value ? Number($("practiceDocumentId").value) : null
    };
}

async function guardarPractica(evento) {
    evento.preventDefault();
    if (guardandoPractica) return;
    let dto;
    try { dto = construirPracticaDto(); } catch (error) { return showToast(error.message, "warning"); }

    guardandoPractica = true;
    const boton = $("savePracticeBtn");
    boton.disabled = true;
    $("savePracticeBtnText").textContent = "Guardando...";

    try {
        if (documentoPracticaPendiente) {
            const doc = await subirDocumento(documentoPracticaPendiente, TIPOS_DOCUMENTO.CONSTANCIA_LABORAL);
            dto.documentoId = doc.id;
        }

        const id = $("practiceFormId").value;
        if (id) {
            await apiRequest(`${ENDPOINT_PRACTICAS}/${id}`, { method: "PUT", body: dto });
            showToast("Práctica actualizada.", "success");
        } else {
            await apiRequest(ENDPOINT_PRACTICAS, { method: "POST", body: dto });
            showToast("Práctica registrada.", "success");
        }

        cerrarModal("practiceFormModal");
        await cargarPracticas();
    } catch (error) {
        showToast(obtenerMensajeError(error), "error");
    } finally {
        guardandoPractica = false;
        boton.disabled = false;
        $("savePracticeBtnText").textContent = $("practiceFormId").value ? "Guardar cambios" : "Guardar práctica";
    }
}

async function abrirDetallePractica(id) {
    try {
        const practica = await apiRequest(`${ENDPOINT_PRACTICAS}/${id}`);
        practicaActual = practica;

        $("practiceDetailTitle").textContent = practica.empresa || "Práctica";
        $("practiceDetailPositionTitle").textContent = practica.puesto || "—";
        $("practiceDetailInstitution").textContent = practica.institucionEducativa || "—";
        $("practiceDetailDates").textContent = formatearPeriodo(practica.fechaInicio, practica.fechaFin, practica.enCurso);
        
        $("practiceDetailStatusBadge").textContent = practica.enCurso ? "En curso" : "Finalizada";
        $("practiceDetailStatusBadge").className = `badge status ${practica.enCurso ? 'status-desarrollo' : 'status-finalizado'}`;
        
        $("practiceDetailHours").textContent = `${Number(practica.horasRealizadas) || 0} hrs`;
        $("practiceDetailDescription").textContent = practica.descripcion || "Sin descripción.";

        await cargarDocumentoDetallePractica(practica.documentoId);
        abrirModal("practiceDetailModal");
    } catch (error) {
        showToast(obtenerMensajeError(error), "error");
    }
}

async function cargarDocumentoDetallePractica(documentoId) {
    const contenedor = $("practiceDetailDocument");
    contenedor.innerHTML = "";
    if (!documentoId) {
        contenedor.innerHTML = `<span class="detail-empty">No hay documento asociado.</span>`;
        return;
    }
    try {
        const documento = await apiRequest(`${ENDPOINT_DOCUMENTOS}/${documentoId}`);
        contenedor.innerHTML = `
            <div class="evidence-item">
                <div class="evidence-info">
                    <div class="evidence-icon"><i class="ri-file-shield-2-line"></i></div>
                    <div>
                        <span class="evidence-name">${escaparHTML(documento.nombreArchivo)}</span>
                        <span class="evidence-meta">${formatearBytes(documento.tamanoBytes)}</span>
                    </div>
                </div>
                <div class="evidence-actions-group">
                    <button type="button" class="evidence-action-btn" data-view-document="${documento.id}"><i class="ri-eye-line"></i></button>
                    <button type="button" class="evidence-action-btn" data-download-document="${documento.id}"><i class="ri-download-line"></i></button>
                </div>
            </div>
        `;
    } catch {
        contenedor.innerHTML = `<span class="detail-empty">Error al cargar documento.</span>`;
    }
}

/* ============================================================
   ELIMINACIÓN
============================================================ */

function solicitarEliminacion(tipo, id) {
    tipoElementoAEliminar = tipo;
    elementoAEliminar = Number(id);
    const esProyecto = tipo === "proyecto";
    $("deleteModalTitle").textContent = esProyecto ? "Eliminar proyecto" : "Eliminar práctica";
    $("deleteModalMessage").textContent = esProyecto ? "El proyecto dejará de aparecer en tu portafolio. Esta acción no se puede deshacer." : "La práctica se eliminará. Esta acción no se puede deshacer.";
    abrirModal("deleteModal");
}

async function confirmarEliminacion() {
    if (!elementoAEliminar || eliminandoRegistro) return;
    eliminandoRegistro = true;
    const boton = $("confirmDeleteBtn");
    boton.disabled = true;
    boton.textContent = "Eliminando...";

    try {
        const endpoint = tipoElementoAEliminar === "proyecto" ? ENDPOINT_PROYECTOS : ENDPOINT_PRACTICAS;
        await apiRequest(`${endpoint}/${elementoAEliminar}`, { method: "DELETE" });
        showToast("Eliminado correctamente.", "success");
        cerrarModal("deleteModal");
        if (tipoElementoAEliminar === "proyecto") await cargarProyectos();
        else await cargarPracticas();
    } catch (error) {
        showToast(obtenerMensajeError(error), "error");
    } finally {
        eliminandoRegistro = false;
        boton.disabled = false;
        boton.textContent = "Eliminar";
        elementoAEliminar = null;
        tipoElementoAEliminar = null;
    }
}

/* ============================================================
   VISOR Y DESCARGAS
============================================================ */

function liberarURLTemporal() {
    if (controllerVisor) { controllerVisor.abort(); controllerVisor = null; }
    if (urlTemporalVisor) { URL.revokeObjectURL(urlTemporalVisor); urlTemporalVisor = null; }
    documentoActualVisor = null;
}

async function visualizarDocumento(documentoId) {
    liberarURLTemporal();

    documentoActualVisor = Number(documentoId);
    controllerVisor = new AbortController();

    $("viewerTitle").textContent = "Cargando...";
    $("viewerContent").innerHTML = `
        <div class="state-panel">
            <i class="ri-loader-4-line spinner"></i>
        </div>
    `;

    abrirModal("viewerModal");

    try {
        const respuesta = await fetch(
            `${ENDPOINT_DOCUMENTOS}/${documentoId}/visualizar`,
            {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    "Accept": "application/pdf, image/*, application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                signal: controllerVisor.signal
            }
        );

        if (respuesta.status === 401) {
            manejarSesionNoValida();
            throw new ApiError("La sesión ha expirado.", 401);
        }

        if (respuesta.status === 403) {
            throw new ApiError(
                "No tienes autorización para visualizar este documento.",
                403
            );
        }

        if (!respuesta.ok) {
            const tipoRespuesta =
                respuesta.headers.get("content-type") || "";

            let mensaje = `No fue posible visualizar el documento. Error HTTP ${respuesta.status}.`;

            if (tipoRespuesta.includes("application/json")) {
                const datos = await respuesta.json().catch(() => null);

                mensaje =
                    datos?.mensaje ||
                    datos?.message ||
                    datos?.title ||
                    mensaje;
            } else {
                const texto = await respuesta.text().catch(() => "");

                if (texto) mensaje = texto;
            }

            throw new ApiError(mensaje, respuesta.status);
        }

        const tipo = (
            respuesta.headers.get("content-type") || ""
        ).toLowerCase();

        const blob = await respuesta.blob();

        urlTemporalVisor = URL.createObjectURL(blob);

        $("viewerTitle").textContent = "Documento";

        if (tipo.includes("application/pdf")) {
            $("viewerContent").innerHTML = `
                <iframe
                    src="${urlTemporalVisor}"
                    title="Visualización del documento PDF">
                </iframe>
            `;
        } else if (tipo.startsWith("image/")) {
            $("viewerContent").innerHTML = `
                <img
                    src="${urlTemporalVisor}"
                    alt="Documento">
            `;
        } else {
            throw new ApiError(
                "El formato recibido no puede visualizarse."
            );
        }

    } catch (error) {
        if (error.name === "AbortError") return;

        $("viewerContent").innerHTML = `
            <p class="detail-empty">
                ${escaparHTML(obtenerMensajeError(error))}
            </p>
        `;

        if (error.status !== 401) {
            showToast(obtenerMensajeError(error), "error");
        }
    }
}
async function descargarDocumento(documentoId) {
    try {
        const respuesta = await fetch(
            `${ENDPOINT_DOCUMENTOS}/${documentoId}/descargar`,
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

        if (respuesta.status === 401) {
            manejarSesionNoValida();
            throw new ApiError("Sesión expirada.", 401);
        }

        if (respuesta.status === 403) {
            throw new ApiError(
                "No tienes autorización para descargar este documento.",
                403
            );
        }

        if (!respuesta.ok) {
            throw new ApiError(
                "No fue posible descargar el documento.",
                respuesta.status
            );
        }

        const blob = await respuesta.blob();

        const disposicion =
            respuesta.headers.get("content-disposition") || "";

        let nombreArchivo = "documento";

        const coincidencia = disposicion.match(
            /filename\*=(?:UTF-8'')?([^;]+)|filename=["']?([^"';]+)["']?/i
        );

        if (coincidencia) {
            const nombre = coincidencia[1] || coincidencia[2];

            try {
                nombreArchivo = decodeURIComponent(
                    nombre.trim().replace(/^["']|["']$/g, "")
                );
            } catch {
                nombreArchivo = nombre.trim();
            }
        }

        const url = URL.createObjectURL(blob);

        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = nombreArchivo;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (error) {
        showToast(obtenerMensajeError(error), "error");
    }
}

/* ============================================================
   EVENTOS E INICIALIZACIÓN
============================================================ */

function configurarEventos() {
    $("projectsTab")?.addEventListener("click", () => cambiarModulo("projects"));
    $("practicesTab")?.addEventListener("click", () => cambiarModulo("practices"));
    $("confirmDeleteBtn")?.addEventListener("click", confirmarEliminacion);
    $("loginRedirectBtn")?.addEventListener("click", () => window.location.href = LOGIN_URL);

    // PROYECTOS
    $("newProjectBtn")?.addEventListener("click", () => abrirFormularioProyecto());
    $("projectForm")?.addEventListener("submit", guardarProyecto);
    $("addTechBtn")?.addEventListener("click", agregarTecnologia);
    $("techInput")?.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); agregarTecnologia(); }});
    $("searchInput")?.addEventListener("input", aplicarFiltrosProyectos);
    $("typeFilter")?.addEventListener("change", aplicarFiltrosProyectos);
    $("statusFilter")?.addEventListener("change", aplicarFiltrosProyectos);
    $("evidenceFileInput")?.addEventListener("change", ev => { seleccionarEvidencias(ev.target.files); ev.target.value = ""; });
    $("addEvidenceBtn")?.addEventListener("click", () => $("evidenceFileInput")?.click());
    
    $("projectsGrid")?.addEventListener("click", ev => {
        const boton = ev.target.closest("[data-action]");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        const accion = boton.dataset.action;
        if (accion === "view-project") abrirDetalleProyecto(id);
        if (accion === "edit-project") abrirFormularioProyecto(proyectos.find(p => p.id === id));
        if (accion === "delete-project") solicitarEliminacion("proyecto", id);
    });

    $("techList")?.addEventListener("click", ev => {
        const boton = ev.target.closest("[data-remove-tech]");
        if (boton) { tecnologiasFormulario.splice(Number(boton.dataset.removeTech), 1); actualizarListaTecnologias(); }
    });

    $("evidenceList")?.addEventListener("click", async ev => {
        const btnElim = ev.target.closest("[data-delete-document]");
        const btnQuit = ev.target.closest("[data-remove-pending-evidence]");
        if (btnQuit) { archivosEvidenciaPendientes.splice(Number(btnQuit.dataset.removePendingEvidence), 1); actualizarListaEvidencias(); return; }
        if (btnElim) {
            if (!confirm("¿Deseas eliminar esta evidencia?")) return;
            try { await eliminarDocumento(Number(btnElim.dataset.deleteDocument)); await cargarEvidenciasProyecto($("formId").value); } catch(e){}
        }
    });

    $("detailEvidenceList")?.addEventListener("click", ev => {
        const vis = ev.target.closest("[data-view-document]");
        const des = ev.target.closest("[data-download-document]");
        if (vis) visualizarDocumento(vis.dataset.viewDocument);
        if (des) descargarDocumento(des.dataset.downloadDocument);
    });
    $("editDetailProjectBtn")?.addEventListener("click", () => abrirFormularioProyecto(proyectoActual));

    // PRACTICAS
    $("newPracticeBtn")?.addEventListener("click", () => abrirFormularioPractica());
    $("practiceForm")?.addEventListener("submit", guardarPractica);
    $("practiceSearchInput")?.addEventListener("input", aplicarFiltrosPracticas);
    $("practiceStatusFilter")?.addEventListener("change", aplicarFiltrosPracticas);
    $("practiceOngoing")?.addEventListener("change", actualizarEstadoFechaPractica);
    $("selectPracticeDocumentBtn")?.addEventListener("click", () => $("practiceDocumentInput")?.click());
    $("practiceDocumentInput")?.addEventListener("change", ev => seleccionarDocumentoPractica(ev.target.files[0]));
    $("removePracticeDocumentBtn")?.addEventListener("click", quitarDocumentoPractica);

    $("practicesGrid")?.addEventListener("click", ev => {
        const boton = ev.target.closest("[data-action]");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        const accion = boton.dataset.action;
        if (accion === "view-practice") abrirDetallePractica(id);
        if (accion === "edit-practice") abrirFormularioPractica(practicas.find(p => p.id === id));
        if (accion === "delete-practice") solicitarEliminacion("practica", id);
    });

    $("editDetailPracticeBtn")?.addEventListener("click", () => abrirFormularioPractica(practicaActual));
    $("practiceDetailDocument")?.addEventListener("click", ev => {
        const vis = ev.target.closest("[data-view-document]");
        const des = ev.target.closest("[data-download-document]");
        if (vis) visualizarDocumento(vis.dataset.viewDocument);
        if (des) descargarDocumento(des.dataset.downloadDocument);
    });

    // Modales genéricos
    document.querySelectorAll("[data-close-modal]").forEach(boton => {
    boton.addEventListener("click", () => {
        if (sesionBloqueada) return;

        if (boton.dataset.closeModal === "viewerModal") {
            liberarURLTemporal();
        }

        cerrarModal(boton.dataset.closeModal);
    });
});

   document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", ev => {
        if (sesionBloqueada) return;

        if (ev.target === modal) {
            if (modal.id === "viewerModal") liberarURLTemporal();
            cerrarModal(modal.id);
        }
    });
});

document.addEventListener("keydown", ev => {
    if (sesionBloqueada) {
        bloquearInteraccionSesion(ev);
        return;
    }

    if (ev.key === "Escape") {
        if ($("viewerModal")?.classList.contains("show")) {
            liberarURLTemporal();
        }

        cerrarTodosLosModales();
    }
});

    $("viewerDownloadBtn")?.addEventListener("click", () => { if (documentoActualVisor) descargarDocumento(documentoActualVisor); });
}

/* ============================================================
   SKELETON LOADER
============================================================ */

let temporizadorSkeleton = null;

function mostrarSkeleton() {
    document.body.classList.remove("skeleton-ready");
    document.body.classList.add("skeleton-loading");

    if ($("skeletonScreen")) return;

    const skeleton = document.createElement("div");

    skeleton.id = "skeletonScreen";
    skeleton.className = "skeleton-screen";
    skeleton.setAttribute("aria-hidden", "true");

    skeleton.innerHTML = `
        <aside class="skeleton-sidebar">
            <div class="skeleton-logo skeleton-block"></div>

            <div class="skeleton-nav">
                ${Array.from({ length: 6 }, (_, index) => `
                    <div class="skeleton-nav-item skeleton-block"></div>
                `).join("")}
            </div>
        </aside>

        <main class="skeleton-main">

            <header class="skeleton-topbar skeleton-block"></header>

            <div class="skeleton-heading skeleton-block"></div>

            <section class="skeleton-banner skeleton-block"></section>

            <section class="skeleton-metrics">
                ${Array.from({ length: 3 }, () => `
                    <article class="skeleton-metric">
                        <div class="skeleton-metric-icon skeleton-block"></div>
                        <div class="skeleton-metric-value skeleton-block"></div>
                        <div class="skeleton-metric-label skeleton-block"></div>
                    </article>
                `).join("")}
            </section>

            <div class="skeleton-section-title skeleton-block"></div>

            <section class="skeleton-cards">
                ${Array.from({ length: 3 }, () => `
                    <article class="skeleton-card">

                        <div class="skeleton-card-top">
                            <div class="skeleton-card-icon skeleton-block"></div>
                            <div class="skeleton-card-actions skeleton-block"></div>
                        </div>

                        <div class="skeleton-card-title skeleton-block"></div>
                        <div class="skeleton-card-subtitle skeleton-block"></div>
                        <div class="skeleton-card-line skeleton-block"></div>
                        <div class="skeleton-card-footer skeleton-block"></div>

                    </article>
                `).join("")}
            </section>

        </main>
    `;

    document.body.appendChild(skeleton);
}

function ocultarSkeleton() {
    const skeleton = $("skeletonScreen");

    document.body.classList.remove("skeleton-loading");
    document.body.classList.add("skeleton-ready");

    if (!skeleton) return;

    skeleton.classList.add("is-leaving");

    setTimeout(() => {
        skeleton.remove();
    }, 350);
}

/* ============================================================
   INICIALIZACIÓN
============================================================ */

async function inicializarPagina() {
    mostrarSkeleton();

    configurarEventos();

    try {
        const sesionValida = await verificarSesion();

        if (!sesionValida) {
            ocultarSkeleton();
            return;
        }

        try {
            await window.PortalTheme.load();
        } catch (error) {
            console.error("Error al cargar el tema:", error);
        }

        await Promise.all([
            cargarProyectos(),
            cargarPracticas()
        ]);

    } catch (error) {
        console.error("Error al inicializar la página:", error);

    } finally {
        ocultarSkeleton();
    }
}

document.addEventListener("DOMContentLoaded", inicializarPagina, {
    once: true
});

window.addEventListener("pageshow", (evento) => {
    if (!evento.persisted) return;

    if (sesionBloqueada) {
        window.location.replace(LOGIN_URL);
        return;
    }

    verificarSesion();
});