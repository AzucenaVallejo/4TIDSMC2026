
import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "./firebase-config.js";


// CREAR SESIÓN SEGURA EN EL BACKEND
async function crearSesionBackend(user) {
    const idToken = await user.getIdToken();

    const respuesta = await fetch("/api/Autenticacion/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo iniciar la sesión.");
    }

    return resultado;
}


// ESTADO DE LA APLICACIÓN
const state = {
    profile: {
        name: "",
        nombres: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        phone: "",
        email: "",
        fotografia: ""
    },
    education: [],
    extra: [],
    experience: [],
    projects: [],
    skills: [],
    interests: [],
    evidencias: [],
    currentUser: null,
    currentType: null,
    editId: null
};


// ACTUALIZAR NOMBRE COMPLETO
function actualizarNombreCompleto() {
    const nombre = [
        state.profile.nombres,
        state.profile.apellidoPaterno,
        state.profile.apellidoMaterno
    ].filter(Boolean).join(" ");

    if (nombre) state.profile.name = nombre;
}


// ACTUALIZAR VISTA DE FOTOGRAFÍA
function actualizarVistaFotografia(url) {
    const imagen = document.getElementById("profile-photo-preview");

    if (!imagen) return;

    if (url) {
        imagen.src = url;
        imagen.classList.remove("hidden");
    } else {
        imagen.removeAttribute("src");
        imagen.classList.add("hidden");
    }
}


// RECUPERAR EVIDENCIAS
async function cargarEvidencias() {
    const respuesta = await fetch("/api/Archivos/evidencias", {
        method: "GET",
        credentials: "same-origin"
    });

    if (!respuesta.ok) {
        throw new Error("No se pudieron recuperar las evidencias.");
    }

    state.evidencias = await respuesta.json();
    renderAll();
}


// RECUPERAR PORTAFOLIO
async function cargarPortafolio() {
    const respuesta = await fetch("/api/Portafolio", {
        method: "GET",
        credentials: "same-origin"
    });

    if (!respuesta.ok) {
        throw new Error("No se pudo recuperar el portafolio.");
    }

    const datos = await respuesta.json();
    const perfil = datos.profile || {};

    state.profile.nombres = perfil.nombres || state.profile.nombres;
    state.profile.apellidoPaterno = perfil.apellidoPaterno || state.profile.apellidoPaterno;
    state.profile.apellidoMaterno = perfil.apellidoMaterno || state.profile.apellidoMaterno;
    state.profile.phone = perfil.telefono || state.profile.phone;
    state.profile.email = perfil.correo || state.profile.email;
    state.profile.fotografia = perfil.fotografia || "";

    actualizarNombreCompleto();
    actualizarVistaFotografia(state.profile.fotografia);

    state.education = datos.education || [];
    state.extra = datos.extra || [];
    state.experience = datos.experience || [];
    state.projects = datos.projects || [];
    state.skills = datos.skills || [];
    state.interests = datos.interests || [];

    document.getElementById("profile-name").textContent =
        state.profile.name || "Sin registrar";

    document.getElementById("profile-phone").textContent =
        state.profile.phone || "Sin registrar";

    document.getElementById("profile-email").textContent =
        state.profile.email || "Sin registrar";

    await cargarEvidencias();

    renderAll();
    renderPortfolio();
}


// GUARDAR PORTAFOLIO
async function guardarPortafolio() {
    if (!state.currentUser) {
        throw new Error("Inicia sesión para guardar tu información.");
    }

    if (!state.profile.nombres || !state.profile.apellidoPaterno) {
        throw new Error("Completa tus nombres y apellido paterno en tu perfil.");
    }

    const datos = {
        profile: {
            nombres: state.profile.nombres,
            apellidoPaterno: state.profile.apellidoPaterno,
            apellidoMaterno: state.profile.apellidoMaterno,
            telefono: state.profile.phone,
            correo: state.profile.email,
            curp: "",
            domicilio: "",
            fotografia: state.profile.fotografia
        },
        education: state.education,
        extra: state.extra,
        experience: state.experience,
        projects: state.projects,
        skills: state.skills,
        interests: state.interests
    };

    const respuesta = await fetch("/api/Portafolio", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        let mensaje = resultado.mensaje || resultado.title;

        if (resultado.errors) {
            mensaje = Object.values(resultado.errors).flat().join(" ");
        }

        throw new Error(mensaje || "No se pudo guardar el portafolio.");
    }

    return resultado;
}


// SUBIR FOTOGRAFÍA A CLOUDINARY
async function subirFotografia(e) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!state.currentUser) {
        showToast("Inicia sesión para subir tu fotografía.");
        e.target.value = "";
        return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
        showToast("Selecciona una imagen JPG, PNG o WEBP.");
        e.target.value = "";
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        showToast("La imagen no puede superar los 5 MB.");
        e.target.value = "";
        return;
    }

    const fotografiaAnterior = state.profile.fotografia;

    try {
        showToast("Subiendo fotografía...");

        const formulario = new FormData();
        formulario.append("archivo", archivo);

        const respuesta = await fetch("/api/Archivos/fotografia", {
            method: "POST",
            credentials: "same-origin",
            body: formulario
        });

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo subir la fotografía.");
        }

        if (!resultado.url) {
            throw new Error("No se recibió la dirección de la fotografía.");
        }

        state.profile.fotografia = resultado.url;

        await guardarPortafolio();

        actualizarVistaFotografia(resultado.url);
        showToast("¡Fotografía guardada correctamente!");

    } catch (error) {
        state.profile.fotografia = fotografiaAnterior;
        actualizarVistaFotografia(fotografiaAnterior);
        console.error("Error al subir fotografía:", error);
        showToast(error.message);

    } finally {
        e.target.value = "";
    }
}


// OPCIONES
const availableSkills = [
    "Comunicación",
    "Empatía",
    "Análisis",
    "Liderazgo",
    "Trabajo en equipo",
    "Organización"
];

const availableInterests = [
    "Arte",
    "Tecnología",
    "Deporte",
    "Lectura",
    "Música",
    "Medio ambiente"
];

const icons = {
    education: "graduation-cap",
    extra: "award",
    experience: "briefcase-business",
    projects: "folder-kanban",
    skills: "sparkles",
    interests: "heart",
    profile: "user-round"
};


// COMUNICACIÓN CON LA API
async function enviarDatosAPI(endpoint, datos) {
    const respuesta = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(
            resultado.mensaje ||
            resultado.title ||
            "Ocurrió un error al comunicarse con el servidor."
        );
    }

    return resultado;
}


// CONTROL DE ACCESO
function showAccess(id) {
    document.querySelectorAll(".access-view").forEach(el => {
        el.classList.remove("active");
    });

    const vista = document.getElementById(id);

    if (vista) vista.classList.add("active");

    document.getElementById("app-main").classList.add("hidden");
    document.getElementById("bottom-nav").classList.remove("visible");
}

function enterApp() {
    document.querySelectorAll(".access-view").forEach(el => {
        el.classList.remove("active");
    });

    document.getElementById("app-main").classList.remove("hidden");
    document.getElementById("bottom-nav").classList.add("visible");

    showView("home");
}

function showView(id) {
    document.querySelectorAll(".view").forEach(el => {
        el.classList.remove("active");
    });

    const view = document.getElementById(id);

    if (!view) return;

    view.classList.add("active");
    view.scrollTop = 0;

    document.querySelectorAll(".nav-item").forEach(b => {
        b.classList.toggle("active", b.dataset.nav === id);
    });

    if ([
        "education", "extra", "experience",
        "projects", "skills", "interests"
    ].includes(id)) {
        renderAll();
    }

    if (id === "portfolio") renderPortfolio();

    if (["cv", "preview", "export"].includes(id)) renderCV();

    if (id === "home") updateProgress();
}

function showSection(id) {
    showView(id);
}


// INICIO DE SESIÓN
async function login(e) {
    e.preventDefault();

    const correo = document.getElementById("login-email").value.trim();
    const contrasena = document.getElementById("login-password").value;

    try {
        const credencial = await signInWithEmailAndPassword(
            auth, correo, contrasena
        );

        const user = credencial.user;
        const resultado = await crearSesionBackend(user);
        const nombre = user.displayName || correo.split("@")[0];

        state.currentUser = {
            id: resultado.usuarioId,
            nombre: nombre
        };

        state.profile.name = nombre;
        state.profile.email = correo;

        await cargarPortafolio();

        enterApp();
        showToast("¡Bienvenido a tu portafolio!");

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        showMessage("login-message", error.message, false);
    }
}


// REGISTRO DE USUARIOS
async function registerUser(e) {
    e.preventDefault();

    const nombres = document.getElementById("register-nombres").value.trim();
    const apellidoPaterno = document.getElementById("register-apellido-paterno").value.trim();
    const apellidoMaterno = document.getElementById("register-apellido-materno").value.trim();
    const correo = document.getElementById("register-email").value.trim();
    const contrasena = document.getElementById("register-password").value;
    const confirmar = document.getElementById("register-confirm").value;

    if (!nombres || !apellidoPaterno || !apellidoMaterno) {
        showMessage("register-message", "Completa tus nombres y apellidos.", false);
        return;
    }

    if (contrasena !== confirmar) {
        showMessage("register-message", "Las contraseñas no coinciden.", false);
        return;
    }

    if (contrasena.length < 8) {
        showMessage("register-message", "La contraseña debe tener al menos 8 caracteres.", false);
        return;
    }

    const nombreCompleto = [
        nombres, apellidoPaterno, apellidoMaterno
    ].join(" ");

    try {
        const credencial = await createUserWithEmailAndPassword(
            auth, correo, contrasena
        );

        const user = credencial.user;

        await updateProfile(user, { displayName: nombreCompleto });

        const resultado = await crearSesionBackend(user);

        state.currentUser = {
            id: resultado.usuarioId,
            nombre: nombreCompleto
        };

        state.profile = {
            name: nombreCompleto,
            nombres,
            apellidoPaterno,
            apellidoMaterno,
            phone: "",
            email: correo,
            fotografia: ""
        };

        await cargarPortafolio();

        enterApp();
        showToast("¡Cuenta creada correctamente!");

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        showMessage("register-message", error.message, false);
    }
}


// CERRAR SESIÓN
async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error al cerrar Firebase:", error);
    }

    try {
        await fetch("/api/Autenticacion/cerrar", {
            method: "POST",
            credentials: "same-origin"
        });
    } catch (error) {
        console.error("Error al cerrar la sesión del backend:", error);
    }

    state.currentUser = null;

    state.profile = {
        name: "",
        nombres: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        phone: "",
        email: "",
        fotografia: ""
    };

    state.education = [];
    state.extra = [];
    state.experience = [];
    state.projects = [];
    state.skills = [];
    state.interests = [];
    state.evidencias = [];

    actualizarVistaFotografia("");

    renderAll();
    renderPortfolio();

    showAccess("welcome");
    showToast("Sesión cerrada.");
}


// MENSAJES Y NOTIFICACIONES
function showMessage(id, text, ok = true) {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.textContent = text;
    elemento.style.background = ok ? "#e9fff2" : "#fff0f2";
    elemento.style.color = ok ? "#16714a" : "#b42342";
    elemento.classList.add("show");
}

function showToast(text) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = text;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 2600);
}


// PROGRESO DEL PORTAFOLIO
function updateProgress() {
    let complete = 55 +
        (state.education.length ? 5 : 0) +
        (state.extra.length ? 2 : 0) +
        (state.projects.length ? 3 : 0) +
        (state.skills.length ? 3 : 0) +
        (state.interests.length ? 2 : 0);

    complete = Math.min(100, complete);

    document.getElementById("progress-text").textContent = complete + "%";
    document.getElementById("progress-bar").style.width = complete + "%";
}


// MOSTRAR REGISTROS
function renderAll() {
    ["education", "extra", "experience", "projects"].forEach(renderRecords);

    renderChips("skills");
    renderChips("interests");

    updateProgress();
}


// MOSTRAR EVIDENCIAS DE UN REGISTRO
function renderEvidencias(type, registroId) {
    const evidencias = state.evidencias.filter(e =>
        String(e.seccion).toLowerCase() === String(type).toLowerCase() &&
        String(e.registroId) === String(registroId)
    );

    if (!evidencias.length) return "";

    return `
        <div class="mt-3">
            <p class="text-xs font-semibold mb-2">
                Evidencias adjuntas (${evidencias.length})
            </p>

            <div class="flex flex-wrap gap-3">
                ${evidencias.map(e => `
                    <div style="width:85px;position:relative">

                        <a href="${escapeAttr(e.url)}"
                           target="_blank"
                           rel="noopener noreferrer"
                           title="${escapeAttr(e.nombre)}"
                           class="block"
                           style="text-decoration:none">

                            <img src="${escapeAttr(e.url)}"
                                 alt="${escapeAttr(e.nombre)}"
                                 loading="lazy"
                                 style="width:85px;height:75px;object-fit:cover;border-radius:10px;border:1px solid #ddd">

                            <span class="block text-xs mt-1"
                                  style="overflow-wrap:anywhere">
                                ${escapeHtml(e.nombre)}
                            </span>
                        </a>

                        <button
                            type="button"
                            class="btn-eliminar-evidencia"
                            data-evidencia-id="${escapeAttr(e.id)}"
                            title="Eliminar evidencia"
                            aria-label="Eliminar evidencia"
                            style="position:absolute;top:4px;right:4px;background:#fff;color:#dc2626;border:0;border-radius:50%;width:25px;height:25px;cursor:pointer">

                            <i data-lucide="trash-2"
                               style="width:14px;height:14px"></i>
                        </button>

                    </div>
                `).join("")}
            </div>
        </div>
    `;
}


// MOSTRAR TARJETAS
function renderRecords(type) {
    const target = document.getElementById(type + "-list");

    if (!target) return;

    const items = state[type] || [];

    target.innerHTML = items.length
        ? ""
        : "<div class='empty'>Aún no hay registros. Agrega el primero para completar tu portafolio.</div>";

    items.forEach(item => {
        const registroId = item.id;

        const card = document.createElement("article");
        card.className = "record-card";

        card.innerHTML = `
            <div class="record-top">
                <div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.institution)}</p>
                    <p>${escapeHtml(item.period)}</p>
                    <p>${escapeHtml(item.detail)}</p>
                </div>

                <div class="flex gap-1">
                    <button class="icon-action" aria-label="Editar" type="button">
                        <i data-lucide="pencil"></i>
                    </button>

                    <button class="icon-action danger" aria-label="Eliminar" type="button">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>

            <button class="text-xs font-semibold mt-3"
                style="color:#6d3df5;background:transparent;border:0;padding:0"
                type="button">
                Adjuntar evidencia
            </button>

            ${renderEvidencias(type, registroId)}
        `;

        const buttons = card.querySelectorAll("button");

        buttons[0].onclick = () => openRecordModal(type, registroId);
        buttons[1].onclick = () => deleteRecord(type, registroId);
        buttons[2].onclick = () => seleccionarEvidencia(type, registroId);

        card.querySelectorAll(".btn-eliminar-evidencia").forEach(button => {
            button.onclick = () => eliminarEvidencia(
                button.dataset.evidenciaId,
                type
            );
        });

        target.appendChild(card);
    });

    lucide.createIcons();
}


// SELECCIONAR IMAGEN PARA EVIDENCIA
function seleccionarEvidencia(type, registroId) {
    if (!state.currentUser) {
        showToast("Inicia sesión para adjuntar evidencias.");
        return;
    }

    const registroExiste = state[type]?.some(item =>
        String(item.id) === String(registroId)
    );

    if (!registroExiste) {
        showToast("No se encontró el registro seleccionado.");
        return;
    }

    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

    input.onchange = async () => {
        const archivo = input.files?.[0];

        if (!archivo) return;

        const formatos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!formatos.includes(archivo.type)) {
            showToast("Selecciona una imagen JPG, PNG o WEBP.");
            return;
        }

        if (archivo.size > 5 * 1024 * 1024) {
            showToast("La imagen no puede superar los 5 MB.");
            return;
        }

        const nombre = prompt(
            "Escribe el nombre de esta evidencia:",
            archivo.name.replace(/\.[^/.]+$/, "")
        );

        if (nombre === null) return;

        if (!nombre.trim()) {
            showToast("Escribe un nombre para la evidencia.");
            return;
        }

        if (nombre.trim().length > 100) {
            showToast("El nombre no puede superar los 100 caracteres.");
            return;
        }

        await subirEvidencia(
            archivo,
            nombre.trim(),
            type,
            registroId
        );
    };

    input.click();
}


// SUBIR EVIDENCIA A CLOUDINARY Y FIRESTORE
async function subirEvidencia(archivo, nombre, seccion, registroId) {
    try {
        const seccionCorrecta = String(seccion).toLowerCase();
        const idCorrecto = String(registroId);

        const registroExiste = state[seccionCorrecta]?.some(item =>
            String(item.id) === idCorrecto
        );

        if (!registroExiste) {
            throw new Error("El registro seleccionado ya no existe.");
        }

        showToast("Subiendo evidencia...");

        const formulario = new FormData();

        formulario.append("archivo", archivo);
        formulario.append("nombre", nombre);
        formulario.append("seccion", seccionCorrecta);
        formulario.append("registroId", idCorrecto);

        const respuesta = await fetch("/api/Archivos/evidencia", {
            method: "POST",
            credentials: "same-origin",
            body: formulario
        });

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo subir la evidencia.");
        }

        state.evidencias.push({
            id: resultado.id,
            registroId: resultado.registroId,
            nombre: resultado.nombre,
            seccion: resultado.seccion,
            url: resultado.url
        });

        renderRecords(seccionCorrecta);

        showToast("¡Evidencia guardada correctamente!");

    } catch (error) {
        console.error("Error al subir evidencia:", error);
        showToast(error.message);
    }
}


// ELIMINAR EVIDENCIA DE CLOUDINARY Y FIRESTORE
async function eliminarEvidencia(evidenciaId, type) {
    const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar esta evidencia? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
        showToast("Eliminando evidencia...");

        const respuesta = await fetch(
            `/api/Archivos/evidencia/${encodeURIComponent(evidenciaId)}`,
            {
                method: "DELETE",
                credentials: "same-origin"
            }
        );

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo eliminar la evidencia.");
        }

        state.evidencias = state.evidencias.filter(
            e => String(e.id) !== String(evidenciaId)
        );

        renderRecords(type);

        showToast("¡Evidencia eliminada correctamente!");

    } catch (error) {
        console.error("Error al eliminar evidencia:", error);
        showToast(error.message);
    }
}


// HABILIDADES E INTERESES
function renderChips(type) {
    const parent = document.getElementById(type + "-chips");

    if (!parent) return;

    const options = type === "skills"
        ? availableSkills
        : availableInterests;

    parent.innerHTML = "";

    [...new Set([...options, ...state[type]])].forEach(value => {
        const b = document.createElement("button");

        b.type = "button";
        b.className = "chip" + (
            state[type].includes(value) ? " selected" : ""
        );

        b.textContent = value;
        b.onclick = () => toggleChip(type, value);

        parent.appendChild(b);
    });
}

async function toggleChip(type, value) {
    const i = state[type].indexOf(value);

    if (i > -1) {
        state[type].splice(i, 1);
    } else {
        state[type].push(value);
    }

    renderChips(type);
    updateProgress();

    try {
        await guardarPortafolio();
        showToast("Cambios guardados.");
    } catch (error) {
        showToast(error.message);
    }
}

async function addCustomChip(e, type) {
    e.preventDefault();

    const input = document.getElementById(
        type === "skills" ? "skill-input" : "interest-input"
    );

    const value = input.value.trim();

    if (value && !state[type].includes(value)) {
        state[type].push(value);
        input.value = "";

        renderChips(type);
        updateProgress();

        try {
            await guardarPortafolio();
            showToast("Elemento agregado a tu portafolio.");
        } catch (error) {
            showToast(error.message);
        }
    }
}


// PERFIL
function openProfileModal() {
    state.currentType = "profile";
    state.editId = null;

    document.getElementById("modal-title").textContent = "Editar perfil";

    document.getElementById("modal-fields").innerHTML =
        field("Nombres", "nombres", state.profile.nombres) +
        field("Apellido paterno", "apellidoPaterno", state.profile.apellidoPaterno) +
        field("Apellido materno", "apellidoMaterno", state.profile.apellidoMaterno, "text", false) +
        field("Teléfono", "phone", state.profile.phone) +
        field("Correo electrónico", "email", state.profile.email, "email");

    document.getElementById("modal-wrap").classList.add("show");

    lucide.createIcons();
}

function field(label, name, value = "", type = "text", required = true) {
    return `
        <div class="field">
            <label for="modal-${name}">${label}</label>

            <input
                id="modal-${name}"
                name="${name}"
                type="${type}"
                value="${escapeAttr(value)}"
                ${required ? "required" : ""}
            >
        </div>
    `;
}


// REGISTROS DEL PORTAFOLIO
function openRecordModal(type, id = null) {
    state.currentType = type;
    state.editId = id;

    const item = id !== null
        ? state[type].find(x => String(x.id) === String(id))
        : null;

    const titles = {
        education: "Agregar estudio",
        extra: "Agregar actividad",
        experience: "Agregar experiencia",
        projects: "Agregar proyecto"
    };

    document.getElementById("modal-title").textContent =
        item ? "Editar registro" : titles[type];

    let fields = "";

    if (type === "education") {
        fields =
            field("Nivel educativo", "title", item?.title || "") +
            field("Institución", "institution", item?.institution || "") +
            field("Periodo", "period", item?.period || "") +
            field("Información adicional", "detail", item?.detail || "");
    }

    if (type === "extra") {
        fields =
            field("Actividad", "title", item?.title || "") +
            field("Institución o categoría", "institution", item?.institution || "") +
            field("Periodo", "period", item?.period || "") +
            field("Evidencia o descripción", "detail", item?.detail || "");
    }

    if (type === "experience") {
        fields =
            field("Puesto o actividad", "title", item?.title || "") +
            field("Espacio o proyecto", "institution", item?.institution || "") +
            field("Fechas", "period", item?.period || "") +
            field("Descripción", "detail", item?.detail || "");
    }

    if (type === "projects") {
        fields =
            field("Nombre del proyecto", "title", item?.title || "") +
            field("Materia o área", "institution", item?.institution || "") +
            field("Periodo", "period", item?.period || "") +
            field("Evidencia o descripción", "detail", item?.detail || "");
    }

    document.getElementById("modal-fields").innerHTML = fields;
    document.getElementById("modal-wrap").classList.add("show");

    lucide.createIcons();
}

function closeModal() {
    document.getElementById("modal-wrap").classList.remove("show");
    document.getElementById("modal-message").classList.remove("show");
}


// GUARDAR CAMBIOS
async function saveRecord(e) {
    e.preventDefault();

    const f = new FormData(e.target);

    if (state.currentType === "profile") {
        state.profile.nombres = f.get("nombres").trim();
        state.profile.apellidoPaterno = f.get("apellidoPaterno").trim();
        state.profile.apellidoMaterno = (f.get("apellidoMaterno") || "").trim();
        state.profile.phone = f.get("phone").trim();
        state.profile.email = f.get("email").trim();

        actualizarNombreCompleto();

        document.getElementById("profile-name").textContent =
            state.profile.name || "Sin registrar";

        document.getElementById("profile-phone").textContent =
            state.profile.phone || "Sin registrar";

        document.getElementById("profile-email").textContent =
            state.profile.email || "Sin registrar";

        if (state.currentUser) {
            state.currentUser.nombre = state.profile.name;
        }

    } else {
        const item = {
            id: state.editId !== null ? state.editId : Date.now(),
            title: f.get("title"),
            institution: f.get("institution"),
            period: f.get("period"),
            detail: f.get("detail")
        };

        const arr = state[state.currentType];

        const i = arr.findIndex(x =>
            String(x.id) === String(state.editId)
        );

        if (i > -1) {
            arr[i] = item;
        } else {
            arr.unshift(item);
        }

        renderRecords(state.currentType);
    }

    try {
        await guardarPortafolio();

        closeModal();
        updateProgress();

        showToast("Cambios guardados correctamente.");

    } catch (error) {
        showMessage("modal-message", error.message, false);
    }
}


// ELIMINAR REGISTROS
async function deleteRecord(type, id) {
    const anteriores = [...state[type]];

    state[type] = state[type].filter(x =>
        String(x.id) !== String(id)
    );

    renderRecords(type);
    updateProgress();

    try {
        await guardarPortafolio();
        showToast("Registro eliminado.");

    } catch (error) {
        state[type] = anteriores;
        renderRecords(type);
        updateProgress();
        showToast(error.message);
    }
}


// RESUMEN DEL PORTAFOLIO
function renderPortfolio() {
    const sections = [
        ["profile", "Información personal"],
        ["education", "Formación académica"],
        ["extra", "Formación extracurricular"],
        ["experience", "Experiencia"],
        ["projects", "Proyectos"],
        ["skills", "Habilidades"],
        ["interests", "Intereses"]
    ];

    const parent = document.getElementById("portfolio-summary");

    parent.innerHTML = "";

    sections.forEach(([id, label]) => {
        const b = document.createElement("button");

        b.className = "summary-card";
        b.type = "button";

        b.innerHTML = `
            <div>
                <i data-lucide="${icons[id]}"></i>
                <span>${label}</span>
            </div>

            <i data-lucide="chevron-right"></i>
        `;

        b.onclick = () => showView(id);

        parent.appendChild(b);
    });

    lucide.createIcons();
}


// GENERAR VISTA DEL CV
function renderCV() {
    const sections = `
        <h3>Perfil</h3>
        <p>Estudiante con interés en el aprendizaje continuo, la organización de evidencias y el desarrollo de proyectos.</p>

        <h3>Formación académica</h3>
        <ul>
            ${state.education.map(x => `
                <li>
                    <b>${escapeHtml(x.title)}</b> ·
                    ${escapeHtml(x.institution)}
                    (${escapeHtml(x.period)})
                </li>
            `).join("")}
        </ul>

        <h3>Formación extracurricular</h3>
        <ul>
            ${state.extra.map(x => `
                <li>
                    ${escapeHtml(x.title)} ·
                    ${escapeHtml(x.period)}
                </li>
            `).join("")}
        </ul>

        <h3>Experiencia</h3>
        <ul>
            ${state.experience.map(x => `
                <li>
                    <b>${escapeHtml(x.title)}</b> ·
                    ${escapeHtml(x.detail)}
                </li>
            `).join("")}
        </ul>

        <h3>Proyectos</h3>
        <ul>
            ${state.projects.map(x => `
                <li>
                    <b>${escapeHtml(x.title)}</b> ·
                    ${escapeHtml(x.institution)}
                </li>
            `).join("")}
        </ul>

        <h3>Habilidades e intereses</h3>
        <p>
            ${state.skills.map(escapeHtml).join(" · ")}
            <br>
            ${state.interests.map(escapeHtml).join(" · ")}
        </p>
    `;

    // ENCABEZADO CON FOTOGRAFÍA
    const fotografia = state.profile.fotografia
        ? `
            <img
                class="cv-photo"
                src="${escapeAttr(state.profile.fotografia)}"
                alt="Fotografía de perfil"
            >
        `
        : `
            <div class="cv-photo-placeholder">
                Sin foto
            </div>
        `;

    const content = `
        <div class="cv-header">
            ${fotografia}

            <div class="cv-header-info">
                <h2>${escapeHtml(state.profile.name || "Mi nombre")}</h2>

                <p>
                    ${escapeHtml(state.profile.email)}<br>
                    ${escapeHtml(state.profile.phone)}
                </p>
            </div>
        </div>

        ${sections}
    `;

    document.getElementById("cv-summary").innerHTML = content;
    document.getElementById("cv-preview").innerHTML = content;
}


// EXPORTAR CV A PDF
function exportCv() {
    renderCV();

    // Abrir ventana desde el clic del usuario
    const ventana = window.open("", "_blank");

    if (!ventana) {
        showToast("Permite las ventanas emergentes para exportar tu CV.");
        return;
    }

    const contenido = document.getElementById("cv-preview").innerHTML;

    const nombreArchivo = (state.profile.name || "Mi_CV")
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "")
        .trim()
        .replace(/\s+/g, "_");

    ventana.document.open();

    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>${escapeHtml(nombreArchivo)}</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    color: #25213a;
                    background: #fff;
                    margin: 0;
                    padding: 35px;
                    line-height: 1.5;
                }

                .cv {
                    max-width: 800px;
                    margin: auto;
                }

                /* ENCABEZADO Y FOTOGRAFÍA */
                .cv-header {
                    display: flex;
                    align-items: center;
                    gap: 25px;
                    padding-bottom: 22px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #e8e0ff;
                }

                .cv-photo {
                    width: 125px;
                    height: 125px;
                    min-width: 125px;
                    border-radius: 50%;
                    object-fit: cover;
                    object-position: center;
                    border: 4px solid #6d3df5;
                    display: block;
                }

                .cv-photo-placeholder {
                    width: 125px;
                    height: 125px;
                    min-width: 125px;
                    border-radius: 50%;
                    background: #f0eaff;
                    color: #6d3df5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }

                .cv-header-info {
                    flex: 1;
                    min-width: 0;
                }

                .cv-header-info h2 {
                    color: #3c096c;
                    font-size: 27px;
                    margin: 0 0 10px;
                    border: 0;
                    padding: 0;
                    overflow-wrap: anywhere;
                }

                .cv-header-info p {
                    margin: 0;
                    color: #555;
                    font-size: 13px;
                    line-height: 1.8;
                    overflow-wrap: anywhere;
                }

                h2 {
                    color: #6d3df5;
                    font-size: 28px;
                    margin-bottom: 8px;
                    border-bottom: 2px solid #e8e0ff;
                    padding-bottom: 12px;
                }

                h3 {
                    color: #6d3df5;
                    font-size: 17px;
                    margin-top: 25px;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #e9e3f4;
                    padding-bottom: 5px;
                }

                p {
                    margin: 8px 0;
                    font-size: 13px;
                }

                ul {
                    padding-left: 22px;
                    margin-top: 8px;
                }

                li {
                    font-size: 13px;
                    margin-bottom: 7px;
                }

                @page {
                    size: A4;
                    margin: 18mm;
                }

                @media print {
                    body {
                        padding: 0;
                    }

                    .cv-photo {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    h2, h3 {
                        page-break-after: avoid;
                    }

                    li {
                        page-break-inside: avoid;
                    }
                }

                @media screen and (max-width: 600px) {
                    body {
                        padding: 20px;
                    }

                    .cv-header {
                        gap: 15px;
                    }

                    .cv-photo,
                    .cv-photo-placeholder {
                        width: 95px;
                        height: 95px;
                        min-width: 95px;
                    }

                    .cv-header-info h2 {
                        font-size: 21px;
                    }
                }
            </style>
        </head>

        <body>
            <main class="cv">
                ${contenido}
            </main>

            <script>
                window.onload = function() {
                    const imagenes = Array.from(document.images);

                    Promise.all(
                        imagenes.map(img => {
                            if (img.complete) return Promise.resolve();

                            return new Promise(resolve => {
                                img.onload = resolve;
                                img.onerror = resolve;
                            });
                        })
                    ).then(() => {
                        setTimeout(() => {
                            window.focus();
                            window.print();
                        }, 300);
                    });
                };
            <\/script>
        </body>
        </html>
    `);

    ventana.document.close();

    showToast("Tu CV está listo para guardarse como PDF.");
}


// PROTEGER TEXTO HTML
function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[m]));
}

function escapeAttr(value) {
    return escapeHtml(value);
}


// INICIALIZAR APLICACIÓN
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    renderAll();
    renderPortfolio();

    const inputFotografia = document.getElementById("photo-input");

    if (inputFotografia) {
        inputFotografia.addEventListener("change", subirFotografia);
    }
});


// MANTENER DISPONIBLES LAS FUNCIONES PARA EL HTML
Object.assign(window, {
    showAccess,
    enterApp,
    showView,
    showSection,
    login,
    registerUser,
    logout,
    openProfileModal,
    openRecordModal,
    closeModal,
    saveRecord,
    addCustomChip,
    exportCv,
    showMessage,
    showToast,
    subirFotografia,
    renderEvidencias,
    eliminarEvidencia
});

// Registrar Service Worker de la PWA
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
            .then(() => {
                console.log("PWA: Service Worker registrado correctamente");
            })
            .catch(error => {
                console.error("Error al registrar el Service Worker:", error);
            });
    });
}