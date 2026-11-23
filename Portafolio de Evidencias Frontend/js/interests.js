

"use strict";

/* ============================================================
   CONFIGURACIÓN GENERAL
============================================================ */
const API_BASE = "https://pureblood-starfish-happening.ngrok-free.dev/api";
const ENDPOINT_AUTH = `${API_BASE}/Auth`;
const ENDPOINT_INTERESES = `${API_BASE}/Intereses`;
const LOGIN_URL = "login.html";

/* ============================================================
   METADATA PARA UI
============================================================ */
const categoryMeta = {
    tech: { label: "Tecnología", icon: "ri-macbook-line", color: "blue" },
    art: { label: "Arte y Creatividad", icon: "ri-palette-line", color: "purple" },
    science: { label: "Ciencia", icon: "ri-flask-line", color: "teal" },
    sports: { label: "Deportes", icon: "ri-basketball-line", color: "amber" },
    business: { label: "Negocios", icon: "ri-briefcase-4-line", color: "blue" },
    other: { label: "General", icon: "ri-price-tag-3-line", color: "gray" }
};

const typeLabels = {
    personal: { label: "Interés personal", icon: "ri-heart-3-line" },
    learn: { label: "Quiero aprender", icon: "ri-book-open-line" },
    practice: { label: "Lo practico", icon: "ri-run-line" },
    explore: { label: "Deseo explorar", icon: "ri-compass-3-line" }
};

const frequencyLabels = {
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
    occasional: "Ocasional"
};

/* ============================================================
   ESTADO
============================================================ */
let intereses = [];
let interesAEliminar = null;
let guardando = false;
let eliminando = false;
let sesionBloqueada = false;
let usuarioAutenticado = null;
let temporizadorModalSesion = null;

/* ============================================================
   UTILIDADES
============================================================ */
const $ = id => document.getElementById(id);

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[c]);
}

function normalizarTexto(valor) {
    return String(valor ?? "").trim();
}

function crearElementoHTML(html) {
    const contenedor = document.createElement("template");
    contenedor.innerHTML = html.trim();
    return contenedor.content.firstElementChild;
}

function obtenerPropiedad(objeto, camelCase, pascalCase) {
    return objeto?.[camelCase] ?? objeto?.[pascalCase];
}

/* Convierte la respuesta del backend al formato utilizado por la interfaz. */
function mapearInteres(dto) {
    return {
        id: String(obtenerPropiedad(dto, "id", "Id")),
        name: obtenerPropiedad(dto, "nombre", "Nombre") ?? "",
        description: obtenerPropiedad(dto, "descripcion", "Descripcion") ?? "",
        icon: obtenerPropiedad(dto, "icono", "Icono") ?? "",
        category: obtenerPropiedad(dto, "categoria", "Categoria") ?? "",
        customCategory: obtenerPropiedad(dto, "categoriaPersonalizada", "CategoriaPersonalizada") ?? "",
        type: obtenerPropiedad(dto, "tipo", "Tipo") ?? "personal",
        frequency: obtenerPropiedad(dto, "frecuencia", "Frecuencia") ?? "occasional",
        includePublic: obtenerPropiedad(dto, "includePublic", "IncludePublic") ?? false,
        includeCV: obtenerPropiedad(dto, "includeCV", "IncludeCV") ?? false
    };
}

/* ============================================================
   AUTENTICACIÓN Y SESIÓN
============================================================ */
function manejarSesionNoValida(mensaje = "Tu sesión ha expirado o no es válida. Debes iniciar sesión nuevamente.") {
    if (sesionBloqueada) return;
    ocultarSkeleton();
    sesionBloqueada = true;

    if (temporizadorModalSesion) {
        clearTimeout(temporizadorModalSesion);
    }

    // Bloqueamos completamente la pantalla.
    document.body.style.visibility = "visible";
    document.body.style.overflow = "hidden";

    const app = $("appShell");
    const modal = $("sessionModal");

    if (app) {
        app.style.pointerEvents = "none";
        app.style.userSelect = "none";
    }

    if (modal) {
        const mensajeModal = modal.querySelector("p");

        if (mensajeModal) {
            mensajeModal.textContent = mensaje;
        }

        modal.classList.add("show");
        modal.style.display = "flex";
        modal.style.opacity = "1";
        modal.style.visibility = "visible";
        modal.style.pointerEvents = "auto";
        modal.style.zIndex = "999999";
    }

    // Redirección automática.
    temporizadorModalSesion = setTimeout(() => {
        window.location.replace(LOGIN_URL);
    }, 2500);
}

function redirigirLogin() {
    if (temporizadorModalSesion) {
        clearTimeout(temporizadorModalSesion);
    }

    window.location.replace(LOGIN_URL);
}

async function verificarSesion() {
    try {
        const respuesta = await fetch(`${ENDPOINT_AUTH}/me`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true"
            }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            manejarSesionNoValida();
            return false;
        }

        if (!respuesta.ok) {
            manejarSesionNoValida(
                "No fue posible validar tu sesión. Inicia sesión nuevamente."
            );
            return false;
        }

        usuarioAutenticado = await respuesta.json();

        const nombre =
            usuarioAutenticado?.nombreCompleto ||
            usuarioAutenticado?.NombreCompleto ||
            usuarioAutenticado?.correo ||
            usuarioAutenticado?.Correo ||
            "Usuario";

        $("userName").textContent = nombre;
        $("userAvatar").textContent = nombre.charAt(0).toUpperCase();

        return true;

    } catch (error) {
        console.error("Error al verificar la sesión:", error);

        manejarSesionNoValida(
            "No fue posible verificar tu sesión. Serás redirigido al inicio de sesión."
        );

        return false;
    }
}
/* ============================================================
   COMUNICACIÓN CON API
============================================================ */
async function apiRequest(url, opciones = {}) {
    if (sesionBloqueada) {
        throw new Error("La sesión no es válida.");
    }

    const headers = new Headers(opciones.headers || {});

    headers.set("Accept", "application/json");
    headers.set("ngrok-skip-browser-warning", "true");

    if (
        opciones.body !== undefined &&
        opciones.body !== null &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const config = {
        ...opciones,
        method: opciones.method || "GET",
        credentials: "include",
        cache: "no-store",
        headers
    };

    if (opciones.body !== undefined && opciones.body !== null) {
        config.body = JSON.stringify(opciones.body);
    }

    const respuesta = await fetch(url, config);

    if (respuesta.status === 401 || respuesta.status === 403) {
        manejarSesionNoValida();
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
    }

    if (!respuesta.ok) {
        let mensaje = `Error HTTP ${respuesta.status}.`;

        try {
            const errorApi = await respuesta.json();

            mensaje =
                errorApi.message ||
                errorApi.Message ||
                errorApi.title ||
                errorApi.detail ||
                mensaje;
        } catch {
            // La respuesta puede no contener JSON.
        }

        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    const texto = await respuesta.text();

    return texto ? JSON.parse(texto) : null;
}

/* ============================================================
   NOTIFICACIONES
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
    if (sesionBloqueada) return;

    const modal = $(id);
    if (!modal) return;

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function cerrarModal(id) {
    if (sesionBloqueada || guardando || eliminando) return;

    const modal = $(id);
    if (!modal) return;

    modal.classList.remove("show");

    if (!document.querySelector(".modal-overlay.show")) {
        document.body.style.overflow = "";
    }
}

/* ============================================================
   INTERESES: CONSULTA
============================================================ */
async function cargarIntereses() {
    if (sesionBloqueada) return;

    const grid = $("interestsGrid");

    if (grid) {
        grid.innerHTML = `
            <div class="state-panel">
                <i class="ri-loader-4-line spinner"></i>
                <p>Cargando tus intereses...</p>
            </div>
        `;
    }

    try {
        const resultado = await apiRequest(ENDPOINT_INTERESES);

        if (sesionBloqueada) return;

        if (!Array.isArray(resultado)) {
            throw new Error("El servidor devolvió una respuesta inesperada.");
        }

        intereses = resultado.map(mapearInteres);

        actualizarEstadisticas();
        aplicarFiltros();

    } catch (error) {
        if (sesionBloqueada) return;

        console.error("Error al cargar intereses:", error);

        if (grid) {
            grid.innerHTML = `
                <div class="state-panel error">
                    <div class="state-icon">
                        <i class="ri-error-warning-line"></i>
                    </div>
                    <h3>No fue posible cargar tus intereses</h3>
                    <p>${escaparHTML(error.message)}</p>
                    <button type="button" class="primary-btn" id="retryLoadBtn">
                        <i class="ri-refresh-line"></i> Reintentar
                    </button>
                </div>
            `;

            $("retryLoadBtn")?.addEventListener("click", cargarIntereses);
        }
    }
}

/* ============================================================
   ESTADÍSTICAS
============================================================ */
function actualizarEstadisticas() {
    $("stat-total").textContent = intereses.length;

    $("stat-learn").textContent =
        intereses.filter(i => i.type === "learn").length;

    $("stat-explore").textContent =
        intereses.filter(i => i.type === "explore").length;

    $("stat-practice").textContent =
        intereses.filter(i => i.type === "practice").length;
}

/* ============================================================
   FILTROS
============================================================ */
function aplicarFiltros() {
    const busqueda = normalizarTexto($("searchInput")?.value).toLowerCase();
    const filtroCat = $("categoryFilter")?.value || "all";

    let resultado = [...intereses];

    if (filtroCat !== "all") {
        resultado = resultado.filter(i => i.category === filtroCat);
    }

    if (busqueda) {
        resultado = resultado.filter(i => {
            const texto = [
                i.name,
                i.description,
                i.customCategory,
                i.category
            ].join(" ").toLowerCase();

            return texto.includes(busqueda);
        });
    }

    renderizarGrid(resultado);

    $("resultsCount").textContent =
        `${resultado.length} ${resultado.length === 1 ? "interés" : "intereses"}`;
}

/* ============================================================
   RENDERIZADO DE TARJETAS
============================================================ */
function renderizarGrid(lista) {
    const grid = $("interestsGrid");
    if (!grid) return;

    if (lista.length === 0) {
        const mensajeVacio = intereses.length === 0
            ? "Registra las actividades, temas y aficiones que disfrutas."
            : "No hay intereses que coincidan con los filtros aplicados.";

        grid.innerHTML = `
            <div class="state-panel">
                <div class="state-icon">
                    <i class="ri-magic-line"></i>
                </div>
                <h3>No hay resultados</h3>
                <p>${mensajeVacio}</p>
                ${intereses.length === 0
                    ? `<button class="primary-btn" type="button" id="emptyAddBtn">
                           <i class="ri-add-line"></i> Agregar interés
                       </button>`
                    : ""}
            </div>
        `;

        $("emptyAddBtn")?.addEventListener("click", abrirFormularioNuevo);
        return;
    }

    grid.innerHTML = "";

    lista.forEach((item, index) => {
        const meta = categoryMeta[item.category] || categoryMeta.other;
        const tipoMeta = typeLabels[item.type] || typeLabels.personal;

        const etiquetaCat =
            item.category === "other" && item.customCategory
                ? item.customCategory
                : meta.label;

        const descripcion = item.description
            ? escaparHTML(item.description)
            : '<span style="font-style:italic;opacity:0.6;">Sin descripción.</span>';

        let tagsHTML = `
            <div class="type-pill">
                <i class="${tipoMeta.icon}"></i>
                ${tipoMeta.label}
            </div>
        `;

        if (item.type === "practice" && item.frequency) {
            tagsHTML += `
                <div class="type-pill">
                    <i class="ri-time-line"></i>
                    ${frequencyLabels[item.frequency] || "No especificado"}
                </div>
            `;
        }

        let prefHTML = "";

        if (item.includePublic) {
            prefHTML += `
                <span class="preference-tag" title="Público">
                    <i class="ri-global-line"></i> Perfil
                </span>
            `;
        }

        if (item.includeCV) {
            prefHTML += `
                <span class="preference-tag" title="CV">
                    <i class="ri-file-list-3-line"></i> CV
                </span>
            `;
        }

        const tarjeta = crearElementoHTML(`
            <article class="interest-card"
                style="animation-delay: ${Math.min(index * 0.05, 0.3)}s;">

                <div class="card-top">
                    <div class="category-icon ${meta.color}">
                        <i class="${meta.icon}"></i>
                    </div>

                    <div class="card-actions">
                        <button type="button"
                            class="icon-action"
                            data-action="edit"
                            data-id="${escaparHTML(item.id)}"
                            title="Editar">
                            <i class="ri-edit-line"></i>
                        </button>

                        <button type="button"
                            class="icon-action delete"
                            data-action="delete"
                            data-id="${escaparHTML(item.id)}"
                            title="Eliminar">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>

                <div class="interest-meta">
                    <i class="ri-price-tag-3-line"></i>
                    ${escaparHTML(etiquetaCat)}
                </div>

                <h3 class="interest-name">${escaparHTML(item.name)}</h3>

                <div class="interest-description">${descripcion}</div>

                <div class="card-footer">
                    <div class="pill-group">${tagsHTML}</div>
                    <div class="preference-tags">${prefHTML}</div>
                </div>
            </article>
        `);

        grid.appendChild(tarjeta);
    });
}

/* ============================================================
   FORMULARIO Y VALIDACIÓN
============================================================ */
function limpiarFormulario() {
    $("interestForm").reset();
    $("formId").value = "";

    document.querySelectorAll(".field-error").forEach(e => {
        e.textContent = "";
        e.style.display = "none";
    });

    document.querySelectorAll(".field").forEach(e => {
        e.classList.remove("invalid");
    });

    actualizarCamposCondicionales();
    $("descCount").textContent = "0";
}

function actualizarCamposCondicionales() {
    const isOther = $("formCategory").value === "other";
    const isPractice = $("formType").value === "practice";

    $("customCategoryContainer").classList.toggle("hidden", !isOther);

    if (!isOther) {
        $("formCustomCategory").value = "";
    }

    $("frequencyContainer").classList.toggle("hidden", !isPractice);

    if (!isPractice) {
        $("formFrequency").value = "";
    }
}

function abrirFormularioNuevo() {
    if (sesionBloqueada) return;

    limpiarFormulario();

    $("modalTitle").textContent = "Agregar interés";
    $("modalSubtitle").textContent =
        "Registra algo que te inspira o te gustaría explorar.";

    $("saveBtnText").textContent = "Guardar interés";

    abrirModal("formModal");
}

function editarInteres(id) {
    if (sesionBloqueada) return;

    const item = intereses.find(i => i.id === String(id));

    if (!item) {
        return showToast("No se encontró el interés.", "error");
    }

    limpiarFormulario();

    $("formId").value = item.id;
    $("formName").value = item.name;
    $("formCategory").value = item.category;
    $("formCustomCategory").value = item.customCategory;
    $("formDescription").value = item.description;
    $("formType").value = item.type;
    $("formFrequency").value = item.frequency;
    $("formIncludePublic").checked = item.includePublic;
    $("formIncludeCV").checked = item.includeCV;

    $("descCount").textContent = item.description.length;

    actualizarCamposCondicionales();

    $("modalTitle").textContent = "Editar interés";
    $("modalSubtitle").textContent =
        "Actualiza la información de este registro.";

    $("saveBtnText").textContent = "Guardar cambios";

    abrirModal("formModal");
}

function mostrarError(campoId, msjId, msj) {
    const campo = $(campoId);
    campo.closest(".field").classList.add("invalid");

    const error = $(msjId);
    error.textContent = msj;
    error.style.display = "block";
}

/* ============================================================
   CREAR Y ACTUALIZAR INTERESES
============================================================ */
async function guardarInteres(e) {
    e.preventDefault();

    if (guardando || sesionBloqueada) return;

    document.querySelectorAll(".field-error").forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });

    document.querySelectorAll(".field").forEach(el => {
        el.classList.remove("invalid");
    });

    const id = $("formId").value;
    const name = normalizarTexto($("formName").value);
    const category = $("formCategory").value;
    const customCat = normalizarTexto($("formCustomCategory").value);
    const type = $("formType").value;
    const frequency = $("formFrequency").value;

    let valido = true;

    if (!name) {
        mostrarError("formName", "errName", "Escribe el nombre del interés.");
        valido = false;
    }

    if (name.length > 100) {
        mostrarError("formName", "errName", "El nombre no puede superar los 100 caracteres.");
        valido = false;
    }

    if (!category) {
        mostrarError("formCategory", "errCategory", "Selecciona una categoría.");
        valido = false;
    }

    if (category === "other" && !customCat) {
        mostrarError(
            "formCustomCategory",
            "errCustomCategory",
            "Especifica la categoría."
        );
        valido = false;
    }

    if (type === "practice" && !frequency) {
        showToast("Selecciona la frecuencia de práctica.", "warning");
        valido = false;
    }

    const duplicado = intereses.some(i =>
        i.id !== id &&
        normalizarTexto(i.name).toLowerCase() === name.toLowerCase()
    );

    if (duplicado) {
        mostrarError(
            "formName",
            "errName",
            "Ya tienes un interés con este nombre."
        );
        valido = false;
    }

    if (!valido) return;

    /*
       El backend requiere una frecuencia válida.
       Para intereses que no son de práctica se almacena
       'occasional' como valor predeterminado.
    */
    const dto = {
        nombre: name,
        descripcion: normalizarTexto($("formDescription").value) || null,
        icono: null,
        categoria: category,
        categoriaPersonalizada: category === "other" ? customCat : null,
        tipo: type,
        frecuencia: type === "practice" ? frequency : "occasional",
        includePublic: $("formIncludePublic").checked,
        includeCV: $("formIncludeCV").checked
    };

    guardando = true;

    const btn = $("saveBtn");
    btn.disabled = true;
    $("saveBtnText").textContent = "Guardando...";

    try {
        const url = id
            ? `${ENDPOINT_INTERESES}/${encodeURIComponent(id)}`
            : ENDPOINT_INTERESES;

        await apiRequest(url, {
            method: id ? "PUT" : "POST",
            body: dto
        });

        if (sesionBloqueada) return;

        cerrarModal("formModal");

        await cargarIntereses();

        if (!sesionBloqueada) {
            showToast(
                id
                    ? "Cambios guardados correctamente."
                    : "Interés agregado correctamente.",
                "success"
            );
        }

    } catch (error) {
        if (!sesionBloqueada) {
            console.error("Error al guardar interés:", error);
            showToast(error.message || "No fue posible guardar el interés.", "error");
        }
    } finally {
        guardando = false;
        btn.disabled = false;
        $("saveBtnText").textContent = id
            ? "Guardar cambios"
            : "Guardar interés";
    }
}

/* ============================================================
   ELIMINACIÓN
============================================================ */
function solicitarEliminacion(id) {
    if (sesionBloqueada) return;

    const item = intereses.find(i => i.id === String(id));

    if (!item) return;

    interesAEliminar = item.id;

    $("deleteTargetName").textContent = `"${item.name}"`;

    abrirModal("deleteModal");
}

async function confirmarEliminacion() {
    if (!interesAEliminar || eliminando || sesionBloqueada) return;

    eliminando = true;

    const btn = $("confirmDeleteBtn");
    btn.disabled = true;
    btn.textContent = "Eliminando...";

    try {
        await apiRequest(
            `${ENDPOINT_INTERESES}/${encodeURIComponent(interesAEliminar)}`,
            { method: "DELETE" }
        );

        if (sesionBloqueada) return;

        $("deleteModal").classList.remove("show");
        document.body.style.overflow = "";

        interesAEliminar = null;

        await cargarIntereses();

        if (!sesionBloqueada) {
            showToast("El interés se eliminó correctamente.", "success");
        }

    } catch (error) {
        if (!sesionBloqueada) {
            console.error("Error al eliminar interés:", error);
            showToast(error.message || "No fue posible eliminar el interés.", "error");
        }
    } finally {
        eliminando = false;
        btn.disabled = false;
        btn.textContent = "Eliminar";
    }
}

/* ============================================================
   EVENTOS
============================================================ */
function configurarEventos() {
    $("newInterestBtn")?.addEventListener("click", abrirFormularioNuevo);

    $("interestForm")?.addEventListener("submit", guardarInteres);

    $("formCategory")?.addEventListener("change", actualizarCamposCondicionales);

    $("formType")?.addEventListener("change", actualizarCamposCondicionales);

    $("formDescription")?.addEventListener("input", e => {
        $("descCount").textContent = e.target.value.length;
    });

    $("searchInput")?.addEventListener("input", aplicarFiltros);

    $("categoryFilter")?.addEventListener("change", aplicarFiltros);

    $("interestsGrid")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-action]");

        if (!btn) return;

        if (btn.dataset.action === "edit") {
            editarInteres(btn.dataset.id);
        }

        if (btn.dataset.action === "delete") {
            solicitarEliminacion(btn.dataset.id);
        }
    });

    $("confirmDeleteBtn")?.addEventListener("click", confirmarEliminacion);

    $("loginRedirectBtn")?.addEventListener("click", redirigirLogin);

    document.querySelectorAll("[data-close-modal]").forEach(btn => {
        btn.addEventListener("click", () => {
            cerrarModal(btn.dataset.closeModal);
        });
    });

   document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", e => {
        if (modal.id === "sessionModal") {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (e.target === modal) {
            cerrarModal(modal.id);
        }
    });
});

 document.addEventListener("keydown", e => {
    if (sesionBloqueada) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    if (e.key === "Escape") {
        interesAEliminar = null;
        cerrarModal("deleteModal");
        cerrarModal("formModal");
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


/* ============================================================
   INICIALIZACIÓN
============================================================ */
/* ============================================================
   INICIALIZACIÓN
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    // Mostrar la página y activar el skeleton.
    document.body.style.visibility = "visible";
    mostrarSkeleton();

    try {
        configurarEventos();

        const permitido = await verificarSesion();

        if (!permitido || sesionBloqueada) {
            ocultarSkeleton();
            return;
        }

        await window.PortalTheme.load();

        await cargarIntereses();

        // Retirar el skeleton cuando termine la carga.
        ocultarSkeleton();

    } catch (error) {
        console.error("Error al inicializar la página:", error);
        ocultarSkeleton();
    }
});
