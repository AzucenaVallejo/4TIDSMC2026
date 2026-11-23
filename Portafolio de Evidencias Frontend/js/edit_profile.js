
const API_URL = 'https://pureblood-starfish-happening.ngrok-free.dev';
const API_TIMEOUT = 20000;
const STATS_CONCURRENCY = 3;

let accesoVerificado = false;
let redireccionEnProceso = false;
let sessionState = null;

let currentImageObj = null;
let videoStream = null;
let toastTimeout = null;
let currentPhotoFile = null;
let originalPhotoUrl = null;
let previewPhotoUrl = null;
let userProfileState = null;

let curriculumActual = null;
let enlacesPublicos = [];
let enlaceActual = null;

let cargandoEnlaces = false;
let actualizandoPublicacion = false;
let cargandoCurriculumPromise = null;
let cargandoPerfilPromise = null;
let cargandoFotoPromise = null;

// EDITOR DE FOTOGRAFÍA

const canvas = document.getElementById('photo-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let editorState = {
    zoom: 1,
    rotation: 0,
    filter: 'none'
};

const filters = [
    { name: 'Normal', css: 'none' },
    { name: 'B&N', css: 'grayscale(100%)' },
    { name: 'Sepia', css: 'sepia(100%)' },
    { name: 'Contraste', css: 'contrast(150%)' },
    { name: 'Brillo', css: 'brightness(120%)' },
    { name: 'Vintage', css: 'sepia(50%) contrast(120%)' },
    { name: 'Frío', css: 'hue-rotate(180deg) saturate(150%)' }
];

// ============================================================
// PETICIONES HTTP CENTRALIZADAS
// ============================================================

async function apiFetch(endpoint, options = {}) {
    const {
        timeout = API_TIMEOUT,
        signal: externalSignal,
        headers: customHeaders,
        body,
        ...requestOptions
    } = options;

    const controller = new AbortController();
    let timeoutTriggered = false;

    const timeoutId = setTimeout(() => {
        timeoutTriggered = true;
        controller.abort();
    }, timeout);

    const handleExternalAbort = () => controller.abort();

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener(
                'abort',
                handleExternalAbort,
                { once: true }
            );
        }
    }

    const headers = new Headers(customHeaders || {});

    // Evita la página intermedia de advertencia de ngrok.
    headers.set('ngrok-skip-browser-warning', 'true');

    if (
        body !== undefined &&
        body !== null &&
        !(body instanceof FormData) &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...requestOptions,
            body,
            headers,
            credentials: 'include',
            cache: requestOptions.cache || 'no-store',
            signal: controller.signal
        });

        if (response.status === 401) {
            throw new Error(
                'Tu sesión ha expirado. Inicia sesión nuevamente.'
            );
        }

        return response;

    } catch (error) {
        if (error.name === 'AbortError') {
            if (timeoutTriggered) {
                throw new Error(
                    'La solicitud tardó demasiado en responder. Comprueba tu conexión e inténtalo nuevamente.'
                );
            }

            throw new Error('La solicitud fue cancelada.');
        }

        if (error instanceof TypeError) {
            throw new Error(
                'No fue posible establecer comunicación con el servidor.'
            );
        }

        throw error;

    } finally {
        clearTimeout(timeoutId);

        if (externalSignal) {
            externalSignal.removeEventListener(
                'abort',
                handleExternalAbort
            );
        }
    }
}
// Recupera mensajes de error de la API.
async function getErrorMessage(response) {
    try {
        const data = await response.json();

        if (data.errors) {
            return Object.values(data.errors)
                .flat()
                .join(' ');
        }

        return data.mensaje ||
            data.message ||
            data.title ||
            'Ocurrió un error al procesar la solicitud.';

    } catch {
        return 'Ocurrió un error al procesar la solicitud.';
    }
}

// ============================================================
// MODALES DE AUTENTICACIÓN
// ============================================================

function mostrarModalErrorConexion() {
    if (redireccionEnProceso) return;

    redireccionEnProceso = true;
    document.body.style.visibility = 'visible';

    const modal = document.createElement('div');

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

    redireccionEnProceso = true;
    document.body.style.visibility = 'visible';

    const modal = document.createElement('div');

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

// Comprueba la sesión una sola vez y conserva su respuesta.
async function verificarAccesoInicial() {
    try {
        const response = await apiFetch('/api/Auth/me', {
            method: 'GET',
            timeout: 10000
        });

        if (response.status === 401 || response.status === 403) {
            mostrarModalAcceso();
            return false;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        sessionState = await response.json();

        if (!sessionState) {
            throw new Error('No se recibió información de sesión.');
        }

        accesoVerificado = true;

        return true;

    } catch (error) {
        console.error('Error al verificar el acceso:', error);

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        } else {
            mostrarModalErrorConexion();
        }

        return false;
    }
}

function handleSessionError(error) {
    console.error('Error de sesión:', error);

    if (
        error.message?.includes('sesión ha expirado') ||
        error.message?.includes('no es válida')
    ) {
        mostrarModalAcceso();
        return;
    }

    showMessage(
        'Error al cargar el perfil',
        error.message || 'No fue posible recuperar tu información.',
        true
    );
}

// ============================================================
// INICIALIZACIÓN ÚNICA
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    document.body.style.visibility = 'hidden';

    const accesoPermitido = await verificarAccesoInicial();

    if (!accesoPermitido) return;

    try {
        if (window.PortalTheme?.load) {
            await window.PortalTheme.load();
        }

        setupFilters();
        prepararEventosFormulario();
        prepararControlesEnlaces();
        PE_inicializarPaneles();

        document.body.style.visibility = 'visible';

        // Perfil y currículum se recuperan simultáneamente.
        // La fotografía se carga después, sin bloquear esta fase.
        const resultadosIniciales = await Promise.allSettled([
            loadProfileData(),
            cargarEstadoPublicacion()
        ]);

        resultadosIniciales.forEach((resultado, index) => {
            if (resultado.status === 'rejected') {
                console.error(
                    index === 0
                        ? 'Error al cargar el perfil:'
                        : 'Error al cargar la publicación:',
                    resultado.reason
                );
            }
        });

        // Enlaces, documentos y privacidad dependen de la sesión,
        // pero no necesitan bloquearse entre sí.
        const tareasSecundarias = [];

        if (curriculumActual) {
            tareasSecundarias.push(cargarEnlacesPublicos());
        }

        tareasSecundarias.push(
            PE_cargarConfiguracionPublica()
        );

        await Promise.allSettled(tareasSecundarias);

    } catch (error) {
        console.error('Error al inicializar el perfil:', error);

        document.body.style.visibility = 'visible';

        showToast(
            error.message || 'No se pudo inicializar completamente el perfil.'
        );
    }
});

function prepararEventosFormulario() {
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay.active');

            if (modal) {
                closeModal(modal.id);
            }
        }
    });

    document.getElementById('input-curp')?.addEventListener(
        'input',
        event => {
            event.target.value = event.target.value.toUpperCase();
        }
    );

    document.getElementById('input-phone')?.addEventListener(
        'input',
        event => {
            event.target.value = event.target.value.replace(
                /[^\d+()\-\s]/g,
                ''
            );
        }
    );

    document.getElementById('input-bio')?.addEventListener(
        'input',
        event => {
            const counter = document.getElementById('bio-counter');

            if (counter) {
                counter.textContent =
                    `${event.target.value.length} / 2000 caracteres`;
            }
        }
    );
}

// ============================================================
// PERFIL DEL USUARIO
// ============================================================

async function loadProfileData() {
    if (cargandoPerfilPromise) {
        return cargandoPerfilPromise;
    }

    cargandoPerfilPromise = (async () => {
        try {
            const response = await apiFetch('/api/Perfil/me');

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const perfil = await response.json();

            userProfileState = {
                id: perfil.id,
                nombres: perfil.nombres || '',
                apellidoPaterno: perfil.apellidoPaterno || '',
                apellidoMaterno: perfil.apellidoMaterno || '',
                nombreCompleto: perfil.nombreCompleto || '',
                telefono: perfil.telefono || '',
                curp: perfil.curp || '',
                fechaNacimiento: perfil.fechaNacimiento || null,
                biografia: perfil.biografia || '',
                correo: sessionState?.correo || '',
                fotografia: perfil.rutaFotografia || null
            };

            populateForm();

            // La fotografía se carga en segundo plano.
            loadProfilePhoto().catch(error => {
                console.error('Error al cargar fotografía:', error);
            });

            return userProfileState;

        } catch (error) {
            handleSessionError(error);
            throw error;

        } finally {
            cargandoPerfilPromise = null;
        }
    })();

    return cargandoPerfilPromise;
}

function populateForm() {
    if (!userProfileState) return;

    const fields = {
        'input-names': userProfileState.nombres,
        'input-paternal-surname': userProfileState.apellidoPaterno,
        'input-maternal-surname': userProfileState.apellidoMaterno,
        'input-email': userProfileState.correo,
        'input-phone': userProfileState.telefono,
        'input-curp': userProfileState.curp,
        'input-birthdate': userProfileState.fechaNacimiento || '',
        'input-bio': userProfileState.biografia
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.value = value;
        }
    });

    const counter = document.getElementById('bio-counter');

    if (counter) {
        counter.textContent =
            `${userProfileState.biografia.length} / 2000 caracteres`;
    }

    updatePhotoLabels();
}

function updatePhotoLabels() {
    if (!userProfileState) return;

    const fullName = [
        userProfileState.nombres,
        userProfileState.apellidoPaterno,
        userProfileState.apellidoMaterno
    ].filter(Boolean).join(' ');

    const nameElement = document.getElementById('photo-name');
    const emailElement = document.getElementById('photo-email');

    if (nameElement) {
        nameElement.textContent = fullName || 'Usuario';
    }

    if (emailElement) {
        emailElement.textContent = userProfileState.correo || '';
    }
}

// Recupera la fotografía sin duplicar solicitudes simultáneas.
async function loadProfilePhoto() {
    if (cargandoFotoPromise) {
        return cargandoFotoPromise;
    }

    cargandoFotoPromise = (async () => {
        try {
            const response = await apiFetch('/api/Perfil/me/fotografia');

            if (response.status === 404) {
                updateAvatarDisplay(null);
                return;
            }

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const imageBlob = await response.blob();
            const newUrl = URL.createObjectURL(imageBlob);
            const previousUrl = originalPhotoUrl;

            originalPhotoUrl = newUrl;

            updateAvatarDisplay(newUrl);

            if (previousUrl && previousUrl !== previewPhotoUrl) {
                URL.revokeObjectURL(previousUrl);
            }

        } catch (error) {
            console.error('No se pudo cargar la fotografía:', error);

            if (error.message?.includes('sesión ha expirado')) {
                mostrarModalAcceso();
                return;
            }

            if (!previewPhotoUrl) {
                updateAvatarDisplay(null);
            }

        } finally {
            cargandoFotoPromise = null;
        }
    })();

    return cargandoFotoPromise;
}

function updateAvatarDisplay(imageUrl) {
    const img = document.getElementById('current-avatar');
    const placeholder = document.getElementById('avatar-placeholder');

    if (!img || !placeholder) return;

    if (imageUrl) {
        img.src = imageUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        img.removeAttribute('src');
        img.style.display = 'none';
        placeholder.style.display = 'grid';
    }
}

// ============================================================
// VALIDACIÓN Y ACTUALIZACIÓN DEL PERFIL
// ============================================================

function validateProfileForm() {
    let valid = true;

    document.querySelectorAll('.error-message').forEach(element => {
        element.style.display = 'none';
    });

    document.querySelectorAll('.form-input').forEach(element => {
        element.classList.remove('error');
    });

    const birthDate = document.getElementById('input-birthdate').value;

    // Fecha local, evitando diferencias por UTC.
    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
    ].join('-');

    const fields = [
        {
            id: 'input-names',
            errorId: 'err-names',
            value: document.getElementById('input-names').value.trim(),
            valid: value => value.length > 0 && value.length <= 100
        },
        {
            id: 'input-paternal-surname',
            errorId: 'err-paternal-surname',
            value: document.getElementById('input-paternal-surname').value.trim(),
            valid: value => value.length > 0 && value.length <= 100
        },
        {
            id: 'input-maternal-surname',
            errorId: 'err-maternal-surname',
            value: document.getElementById('input-maternal-surname').value.trim(),
            valid: value => value.length <= 100
        },
        {
            id: 'input-phone',
            errorId: 'err-phone',
            value: document.getElementById('input-phone').value.trim(),
            valid: value => value.length <= 25
        },
        {
            id: 'input-curp',
            errorId: 'err-curp',
            value: document.getElementById('input-curp').value.trim().toUpperCase(),
            valid: value => value === '' ||
                /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/.test(value)
        },
        {
            id: 'input-bio',
            errorId: 'err-bio',
            value: document.getElementById('input-bio').value.trim(),
            valid: value => value.length <= 2000
        }
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const error = document.getElementById(field.errorId);

        const fieldIsValid = field.valid(field.value);

        if (input) {
            input.classList.toggle('error', !fieldIsValid);
        }

        if (!fieldIsValid) {
            if (error) {
                error.style.display = 'block';
            }

            valid = false;
        }
    });

    const birthDateInput = document.getElementById('input-birthdate');

    if (birthDate && birthDate > today) {
        birthDateInput?.classList.add('error');

        const error = document.getElementById('err-birthdate');

        if (error) {
            error.style.display = 'block';
        }

        valid = false;
    }

    if (!valid) {
        showToast('Revisa los campos marcados antes de continuar.');
    }

    return valid;
}

function getProfileFormData() {
    const birthDate = document.getElementById('input-birthdate').value;

    return {
        nombres: document.getElementById('input-names').value.trim(),
        apellidoPaterno: document.getElementById('input-paternal-surname').value.trim(),
        apellidoMaterno: document.getElementById('input-maternal-surname').value.trim(),
        telefono: document.getElementById('input-phone').value.trim(),
        biografia: document.getElementById('input-bio').value.trim(),
        curp: document.getElementById('input-curp').value.trim().toUpperCase(),
        fechaNacimiento: birthDate || null,
        eliminarFechaNacimiento: false
    };
}

async function saveProfile() {
    if (!userProfileState) {
        showToast('No se ha podido cargar tu información.');
        return;
    }

    if (!validateProfileForm()) return;

    const saveButton = document.querySelector(
        '#edit-profile-form button[type="submit"]'
    );

    if (!saveButton || saveButton.disabled) return;

    saveButton.disabled = true;
    saveButton.innerHTML =
        '<i class="ri-loader-4-line"></i> Guardando...';

    let profileSaved = false;

    try {
        const profileData = getProfileFormData();

        const response = await apiFetch('/api/Perfil/me', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const updatedProfile = await response.json();

        userProfileState.nombres =
            updatedProfile.nombres ?? profileData.nombres;

        userProfileState.apellidoPaterno =
            updatedProfile.apellidoPaterno ?? profileData.apellidoPaterno;

        userProfileState.apellidoMaterno =
            updatedProfile.apellidoMaterno ?? profileData.apellidoMaterno;

        userProfileState.telefono =
            updatedProfile.telefono ?? profileData.telefono;

        userProfileState.biografia =
            updatedProfile.biografia ?? profileData.biografia;

        userProfileState.curp =
            updatedProfile.curp ?? profileData.curp;

        userProfileState.fechaNacimiento =
            updatedProfile.fechaNacimiento ?? profileData.fechaNacimiento;

        profileSaved = true;

        if (currentPhotoFile) {
            try {
                await uploadProfilePhoto(currentPhotoFile);

            } catch (photoError) {
                console.error('Error al subir la fotografía:', photoError);

                populateForm();
                updatePhotoLabels();

                showMessage(
                    'Información guardada parcialmente',
                    'Tus datos personales se guardaron correctamente, pero no se pudo subir la fotografía: ' +
                    photoError.message,
                    true
                );

                return;
            }
        }

        populateForm();
        updatePhotoLabels();

        showMessage(
            'Perfil actualizado',
            'Tu información personal se guardó correctamente.'
        );

    } catch (error) {
        console.error('Error al guardar el perfil:', error);

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
            return;
        }

        showMessage(
            profileSaved
                ? 'Información guardada'
                : 'No se pudieron guardar los cambios',
            error.message,
            true
        );

    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML =
            '<i class="ri-save-line"></i> Guardar cambios';
    }
}

async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('archivo', file);

    const response = await apiFetch('/api/Perfil/me/fotografia', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    const updatedProfile = await response.json();

    userProfileState.fotografia =
        updatedProfile.rutaFotografia || userProfileState.fotografia;

    currentPhotoFile = null;

    await loadProfilePhoto();

    if (previewPhotoUrl) {
        URL.revokeObjectURL(previewPhotoUrl);
        previewPhotoUrl = null;
    }
}

// ============================================================
// MODALES Y MENSAJES
// ============================================================

function openModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.remove('active');

    if (id === 'camera-modal') {
        stopCamera();
    }

    if (!document.querySelector('.modal-overlay.active')) {
        document.body.style.overflow = '';
    }
}

function closeModalOutside(event, id) {
    if (event.target.id === id) {
        closeModal(id);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const messageElement = document.getElementById('toast-msg');

    if (!toast || !messageElement) return;

    messageElement.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showMessage(title, description, isError = false) {
    const titleElement = document.getElementById('msg-title');
    const descriptionElement = document.getElementById('msg-desc');
    const icon = document.getElementById('msg-icon');

    if (titleElement) {
        titleElement.textContent = title;
    }

    if (descriptionElement) {
        descriptionElement.textContent = description;
    }

    if (icon) {
        icon.innerHTML = isError
            ? '<i class="ri-error-warning-line"></i>'
            : '<i class="ri-checkbox-circle-line"></i>';

        icon.style.color = isError
            ? 'var(--danger)'
            : 'var(--success)';
    }

    openModal('message-modal');
}

// ============================================================
// CONTRASEÑA
// ============================================================

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button?.querySelector('i');

    if (!input || !icon) return;

    input.type = input.type === 'password' ? 'text' : 'password';

    icon.className = input.type === 'password'
        ? 'ri-eye-off-line'
        : 'ri-eye-line';
}

function checkPasswordStrength() {
    const input = document.getElementById('input-pass-new');
    const bar = document.getElementById('pass-strength-bar');
    const text = document.getElementById('pass-strength-text');

    if (!input || !bar || !text) return;

    const value = input.value;

    let strength = 0;

    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;

    const states = [
        { width: '0%', color: 'transparent', label: '' },
        { width: '25%', color: '#D9534F', label: 'Débil' },
        { width: '50%', color: '#D69B35', label: 'Media' },
        { width: '75%', color: '#5BAA83', label: 'Buena' },
        { width: '100%', color: '#299D70', label: 'Fuerte' }
    ];

    bar.style.width = states[strength].width;
    bar.style.backgroundColor = states[strength].color;
    text.textContent = states[strength].label;
}

function confirmRemovePhoto() {
    showMessage(
        'Función no disponible',
        'La eliminación de fotografías todavía no está implementada en el backend.',
        true
    );
}

// ============================================================
// FOTOGRAFÍA Y CÁMARA
// ============================================================

function handleFileSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast('Selecciona una imagen JPG, PNG o WebP.');
        event.target.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen no debe superar los 5 MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = loadEvent => {
        loadImageForEditing(loadEvent.target.result);
    };

    reader.onerror = () => {
        showToast('No se pudo leer la imagen.');
    };

    reader.readAsDataURL(file);

    closeModal('photo-source-modal');
    event.target.value = '';
}

async function startCamera() {
    closeModal('photo-source-modal');

    if (!navigator.mediaDevices?.getUserMedia) {
        showMessage(
            'Cámara no disponible',
            'Tu navegador no permite acceder a la cámara en este contexto.',
            true
        );

        return;
    }

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });

        const video = document.getElementById('camera-video');

        if (!video) {
            stopCamera();
            return;
        }

        video.srcObject = videoStream;

        openModal('camera-modal');

    } catch (error) {
        console.error('No se pudo acceder a la cámara:', error);

        showMessage(
            'Error de cámara',
            'Revisa los permisos del navegador y vuelve a intentarlo.',
            true
        );
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    const video = document.getElementById('camera-video');

    if (video) {
        video.srcObject = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-video');

    if (!video?.videoWidth || !video?.videoHeight) {
        showToast('La cámara todavía no está lista.');
        return;
    }

    const tempCanvas = document.createElement('canvas');

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    const tempContext = tempCanvas.getContext('2d');

    if (!tempContext) {
        showToast('No se pudo procesar la imagen de la cámara.');
        return;
    }

    tempContext.drawImage(
        video,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );

    tempCanvas.toBlob(blob => {
        if (!blob) {
            showToast('No se pudo capturar la fotografía.');
            return;
        }

        const imageUrl = URL.createObjectURL(blob);

        closeModal('camera-modal');
        loadImageForEditing(imageUrl, true);

    }, 'image/jpeg', 0.92);
}

// ============================================================
// EDITOR DE IMÁGENES
// ============================================================

let editorSourceUrl = null;
let editorSourceIsObjectUrl = false;

function setupFilters() {
    const gallery = document.getElementById('filter-gallery');

    if (!gallery) return;

    gallery.innerHTML = '';

    const fragment = document.createDocumentFragment();

    filters.forEach((filter, index) => {
        const item = document.createElement('button');

        item.type = 'button';
        item.className = `filter-item ${index === 0 ? 'active' : ''}`;
        item.setAttribute('aria-label', `Filtro ${filter.name}`);

        const preview = document.createElement('div');
        preview.className = 'filter-preview';
        preview.style.filter = filter.css;

        const name = document.createElement('span');
        name.className = 'filter-name';
        name.textContent = filter.name;

        item.append(preview, name);

        item.addEventListener('click', () => {
            applyFilterPreview(filter.css, item);
        });

        fragment.appendChild(item);
    });

    gallery.appendChild(fragment);
}

function loadImageForEditing(source, isObjectUrl = false) {
    const image = new Image();

    image.onload = () => {
        if (editorSourceIsObjectUrl && editorSourceUrl) {
            URL.revokeObjectURL(editorSourceUrl);
        }

        currentImageObj = image;
        editorSourceUrl = isObjectUrl ? source : null;
        editorSourceIsObjectUrl = isObjectUrl;

        document.querySelectorAll('.filter-preview').forEach(preview => {
            preview.style.backgroundImage = `url("${source}")`;
        });

        resetEditor();
        openModal('editor-modal');
    };

    image.onerror = () => {
        if (isObjectUrl) {
            URL.revokeObjectURL(source);
        }

        showToast('No se pudo cargar la imagen seleccionada.');
    };

    image.src = source;
}

function applyFilterPreview(filter, element) {
    document.querySelectorAll('.filter-item').forEach(item => {
        item.classList.remove('active');
    });

    if (element) {
        element.classList.add('active');
    }

    editorState.filter = filter;
    updateCanvas();
}

function resetEditor() {
    editorState = {
        zoom: 1,
        rotation: 0,
        filter: 'none'
    };

    const zoomSlider = document.getElementById('zoom-slider');
    const rotateSlider = document.getElementById('rotate-slider');

    if (zoomSlider) zoomSlider.value = 1;
    if (rotateSlider) rotateSlider.value = 0;

    const firstFilter = document.querySelector('.filter-item');

    applyFilterPreview('none', firstFilter);
    updateCanvas();
}

function updateCanvas() {
    if (!currentImageObj || !canvas || !ctx) return;

    const zoomSlider = document.getElementById('zoom-slider');
    const rotateSlider = document.getElementById('rotate-slider');

    editorState.zoom = parseFloat(zoomSlider?.value || 1);
    editorState.rotation = parseInt(rotateSlider?.value || 0, 10);

    const size = 600;

    if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
    }

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    ctx.translate(size / 2, size / 2);
    ctx.rotate(editorState.rotation * Math.PI / 180);
    ctx.scale(editorState.zoom, editorState.zoom);
    ctx.filter = editorState.filter;

    const aspect = currentImageObj.width / currentImageObj.height;

    let width;
    let height;

    if (aspect > 1) {
        height = size;
        width = size * aspect;
    } else {
        width = size;
        height = size / aspect;
    }

    ctx.drawImage(
        currentImageObj,
        -width / 2,
        -height / 2,
        width,
        height
    );

    ctx.restore();
}

function applyPhotoEdit() {
    if (!currentImageObj || !canvas) return;

    canvas.toBlob(blob => {
        if (!blob) {
            showToast('No se pudo procesar la fotografía.');
            return;
        }

        currentPhotoFile = new File(
            [blob],
            'fotografia-perfil.jpg',
            { type: 'image/jpeg' }
        );

        if (previewPhotoUrl) {
            URL.revokeObjectURL(previewPhotoUrl);
        }

        previewPhotoUrl = URL.createObjectURL(blob);

        updateAvatarDisplay(previewPhotoUrl);

        closeModal('editor-modal');

        showToast(
            'Fotografía preparada. Guarda los cambios para subirla.'
        );

    }, 'image/jpeg', 0.9);
}

// ============================================================
// DESCARTAR CAMBIOS
// ============================================================

function cancelChanges() {
    const hasChanges = userProfileState && (
        document.getElementById('input-names').value.trim() !== userProfileState.nombres ||
        document.getElementById('input-paternal-surname').value.trim() !== userProfileState.apellidoPaterno ||
        document.getElementById('input-maternal-surname').value.trim() !== userProfileState.apellidoMaterno ||
        document.getElementById('input-phone').value.trim() !== userProfileState.telefono ||
        document.getElementById('input-curp').value.trim().toUpperCase() !== userProfileState.curp ||
        document.getElementById('input-birthdate').value !== (userProfileState.fechaNacimiento || '') ||
        document.getElementById('input-bio').value.trim() !== userProfileState.biografia ||
        currentPhotoFile !== null
    );

    if (!hasChanges) {
        window.location.href = 'profile.html';
        return;
    }

    document.getElementById('confirm-title').textContent =
        'Descartar cambios';

    document.getElementById('confirm-desc').textContent =
        'Los cambios que no hayas guardado se perderán. ¿Deseas regresar al perfil?';

    const button = document.getElementById('confirm-action-btn');

    button.textContent = 'Descartar';

    button.onclick = () => {
        closeModal('confirm-modal');
        window.location.href = 'profile.html';
    };

    openModal('confirm-modal');
}

// ============================================================
// CURRÍCULUM Y PUBLICACIÓN
// ============================================================

// Solicitud compartida para evitar consultar el currículum dos veces.
async function obtenerCurriculumActual() {
    if (curriculumActual) {
        return curriculumActual;
    }

    if (cargandoCurriculumPromise) {
        return cargandoCurriculumPromise;
    }

    cargandoCurriculumPromise = (async () => {
        const response = await apiFetch('/api/Curriculum');

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const data = await response.json();

        const curriculums = Array.isArray(data)
            ? data
            : [data];

        curriculumActual =
            curriculums.find(c => c.esPredeterminado === true) ||
            curriculums[0] ||
            null;

        if (!curriculumActual) {
            throw new Error(
                'No se encontró un currículum registrado.'
            );
        }

        // Ambas secciones utilizan la misma instancia.
        PE_curriculum = curriculumActual;

        PE_prepararSeccionesDesdeCurriculum();

        return curriculumActual;

    })();

    try {
        return await cargandoCurriculumPromise;

    } finally {
        cargandoCurriculumPromise = null;
    }
}

async function cargarEstadoPublicacion() {
    const toggle = document.getElementById('toggle-public');

    if (toggle) {
        toggle.disabled = true;
    }

    try {
        await obtenerCurriculumActual();

        if (toggle) {
            toggle.checked = curriculumActual.esPublico === true;
            toggle.disabled = false;
        }

    } catch (error) {
        console.error(
            'Error al cargar el estado de publicación:',
            error
        );

        curriculumActual = null;
        PE_curriculum = null;

        if (toggle) {
            toggle.checked = false;
            toggle.disabled = true;
        }

        showToast(
            error.message ||
            'No se pudo consultar el estado de publicación.'
        );
    }
}

async function handleVisibilityToggle(checkbox) {
    if (!curriculumActual || actualizandoPublicacion) {
        checkbox.checked = curriculumActual?.esPublico === true;
        return;
    }

    const estadoAnterior = curriculumActual.esPublico === true;
    const nuevoEstado = checkbox.checked;

    actualizandoPublicacion = true;
    checkbox.disabled = true;

    try {
        const response = await apiFetch(
            `/api/Curriculum/${curriculumActual.id}/publicacion`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    esPublico: nuevoEstado
                })
            }
        );

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        curriculumActual.esPublico = nuevoEstado;

        showToast(
            nuevoEstado
                ? 'Tu currículum ahora es público.'
                : 'Tu currículum ahora es privado.'
        );

    } catch (error) {
        console.error(
            'Error al cambiar la publicación:',
            error
        );

        checkbox.checked = estadoAnterior;

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        } else {
            showToast(
                error.message ||
                'No se pudo actualizar la visibilidad pública.'
            );
        }

    } finally {
        actualizandoPublicacion = false;
        checkbox.disabled = false;
    }
}

// ============================================================
// ENLACES PÚBLICOS
// ============================================================

async function cargarEnlacesPublicos() {
    if (cargandoEnlaces) return;

    if (!curriculumActual) {
        enlacesPublicos = [];
        enlaceActual = null;
        limpiarEstadisticas();
        renderizarEnlacesPublicos();
        return;
    }

    cargandoEnlaces = true;

    try {
        const response = await apiFetch('/api/EnlacesPublicos');

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const data = await response.json();

        enlacesPublicos = Array.isArray(data) ? data : [];

        const enlacesDelCurriculum = enlacesPublicos.filter(enlace =>
            Number(enlace.curriculumId) === Number(curriculumActual.id)
        );

        const enlacesActivos = enlacesDelCurriculum
            .filter(enlace => enlace.activo === true)
            .sort((a, b) =>
                new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
            );

        enlaceActual = enlacesActivos[0] || null;

        const codigo = document.getElementById('access-code');

        if (codigo) {
            codigo.textContent = enlaceActual
                ? enlaceActual.codigoAcceso
                : 'Sin código generado';
        }

        renderizarEnlacesPublicos();

        // Las estadísticas no bloquean la presentación de los enlaces.
        cargarEstadisticasPublicas().catch(error => {
            console.error('Error al cargar estadísticas:', error);
        });

    } catch (error) {
        console.error(
            'Error al recuperar los enlaces públicos:',
            error
        );

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        } else {
            showToast(
                error.message ||
                'No se pudieron cargar los enlaces públicos.'
            );
        }

    } finally {
        cargandoEnlaces = false;
    }
}

function prepararControlesEnlaces() {
    const linkBox = document.querySelector('.public-link-box');

    if (
        !linkBox ||
        document.getElementById('generate-public-link')
    ) {
        return;
    }

    const container = document.createElement('div');

    container.id = 'public-links-management';
    container.style.marginTop = '12px';

    container.innerHTML = `
        <button
            type="button"
            id="generate-public-link"
            class="copy-btn"
            style="width:auto; padding:0 12px; display:flex; gap:7px;"
        >
            <i class="ri-add-line"></i>
            Generar enlace público
        </button>

        <div id="public-links-list" style="margin-top:12px;"></div>
    `;

    linkBox.parentElement.appendChild(container);

    document.getElementById('generate-public-link')
        .addEventListener('click', generarEnlacePublico);
}

function renderizarEnlacesPublicos() {
    const container = document.getElementById('public-links-list');

    if (!container) return;

    container.replaceChildren();

    const activos = enlacesPublicos.filter(enlace =>
        enlace.activo === true &&
        Number(enlace.curriculumId) === Number(curriculumActual?.id)
    );

    if (activos.length === 0) {
        container.textContent =
            'Todavía no tienes enlaces públicos activos.';

        container.style.color = 'var(--muted)';
        container.style.fontSize = '11px';

        return;
    }

    container.style.color = '';
    container.style.fontSize = '';

    activos.sort((a, b) =>
        new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
    );

    const fragment = document.createDocumentFragment();

    activos.forEach(enlace => {
        const item = document.createElement('div');

        item.style.cssText = `
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
            padding:10px;
            margin-top:8px;
            border:1px solid var(--border);
            border-radius:10px;
            background:var(--surface-soft);
        `;

        const info = document.createElement('div');

        const code = document.createElement('strong');

        code.textContent =
            enlace.codigoAcceso || 'Código no disponible';

        code.style.cssText = `
            display:block;
            color:var(--navy);
            font-family:monospace;
            font-size:11px;
        `;

        const date = document.createElement('span');

        date.textContent = enlace.fechaCreacion
            ? new Date(enlace.fechaCreacion).toLocaleDateString('es-MX')
            : '';

        date.style.cssText = `
            display:block;
            margin-top:3px;
            color:var(--muted);
            font-size:9px;
        `;

        info.append(code, date);

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex; gap:6px;';

        const copyButton = document.createElement('button');

        copyButton.type = 'button';
        copyButton.className = 'copy-btn';
        copyButton.title = 'Copiar código';
        copyButton.setAttribute('aria-label', 'Copiar código');
        copyButton.innerHTML =
            '<i class="ri-file-copy-line"></i>';

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(enlace.codigoAcceso || '')
                .then(() => showToast('Código copiado.'))
                .catch(() => showToast('No se pudo copiar el código.'));
        });

        const revokeButton = document.createElement('button');

        revokeButton.type = 'button';
        revokeButton.className = 'copy-btn';
        revokeButton.title = 'Revocar enlace';
        revokeButton.setAttribute('aria-label', 'Revocar enlace');
        revokeButton.innerHTML =
            '<i class="ri-delete-bin-line"></i>';

        revokeButton.addEventListener('click', () => {
            revocarEnlacePublico(enlace.id);
        });

        actions.append(copyButton, revokeButton);
        item.append(info, actions);

        fragment.appendChild(item);
    });

    container.appendChild(fragment);
}

async function generarEnlacePublico() {
    const button = document.getElementById('generate-public-link');

    if (!curriculumActual) {
        showToast('No se encontró un currículum disponible.');
        return;
    }

    if (!curriculumActual.esPublico) {
        showToast('Primero debes publicar tu currículum.');
        return;
    }

    if (button?.disabled) return;

    if (button) {
        button.disabled = true;
        button.innerHTML =
            '<i class="ri-loader-4-line"></i> Generando...';
    }

    try {
        const response = await apiFetch('/api/EnlacesPublicos', {
            method: 'POST',
            body: JSON.stringify({
                curriculumId: curriculumActual.id,
                fechaExpiracion: null,
                permitirDescarga: true
            })
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const nuevoEnlace = await response.json();

        showToast(
            nuevoEnlace.codigoAcceso
                ? `Enlace generado: ${nuevoEnlace.codigoAcceso}`
                : 'Enlace generado correctamente.'
        );

        await cargarEnlacesPublicos();

    } catch (error) {
        console.error('Error al generar el enlace:', error);

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        } else {
            showMessage(
                'No se pudo generar el enlace',
                error.message,
                true
            );
        }

    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<i class="ri-add-line"></i> Generar enlace público';
        }
    }
}

async function revocarEnlacePublico(id) {
    try {
        const response = await apiFetch(
            `/api/EnlacesPublicos/${encodeURIComponent(id)}`,
            {
                method: 'DELETE'
            }
        );

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        showToast('Enlace revocado correctamente.');

        await cargarEnlacesPublicos();

    } catch (error) {
        console.error('Error al revocar el enlace:', error);

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        } else {
            showMessage(
                'No se pudo revocar el enlace',
                error.message,
                true
            );
        }
    }
}

// ============================================================
// ESTADÍSTICAS PÚBLICAS
// ============================================================

function obtenerNumero(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero) && numero >= 0
        ? numero
        : 0;
}

async function obtenerEstadisticasEnlace(enlaceId) {
    const response = await apiFetch(
        `/api/EnlacesPublicos/${encodeURIComponent(enlaceId)}/estadisticas`
    );

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return response.json();
}

// Limita las solicitudes simultáneas para no saturar la API.
async function ejecutarConcurrenciaLimitada(items, limite, callback) {
    const resultados = new Array(items.length);
    let siguienteIndice = 0;

    async function worker() {
        while (true) {
            const indice = siguienteIndice++;

            if (indice >= items.length) {
                return;
            }

            try {
                resultados[indice] = {
                    status: 'fulfilled',
                    value: await callback(items[indice], indice)
                };
            } catch (error) {
                resultados[indice] = {
                    status: 'rejected',
                    reason: error
                };
            }
        }
    }

    const cantidadWorkers = Math.min(limite, items.length);

    await Promise.all(
        Array.from(
            { length: cantidadWorkers },
            () => worker()
        )
    );

    return resultados;
}

async function cargarEstadisticasPublicas() {
    const metricas = {
        visualizaciones: 0,
        semanales: 0,
        meGusta: 0,
        descargas: 0
    };

    if (!curriculumActual) {
        actualizarIndicadores(metricas);
        return;
    }

    const enlacesDelCurriculum = enlacesPublicos.filter(enlace =>
        Number(enlace.curriculumId) === Number(curriculumActual.id)
    );

    if (enlacesDelCurriculum.length === 0) {
        actualizarIndicadores(metricas);
        return;
    }

    const resultados = await ejecutarConcurrenciaLimitada(
        enlacesDelCurriculum,
        STATS_CONCURRENCY,
        enlace => obtenerEstadisticasEnlace(enlace.id)
    );

    let errores = 0;

    resultados.forEach((resultado, index) => {
        if (resultado.status !== 'fulfilled') {
            errores++;

            console.error(
                `No se pudieron recuperar las estadísticas del enlace ${enlacesDelCurriculum[index].id}:`,
                resultado.reason
            );

            return;
        }

        const data = resultado.value;

        metricas.visualizaciones +=
            obtenerNumero(data.visualizacionesTotales);

        metricas.semanales +=
            obtenerNumero(data.visualizacionesSemanales);

        metricas.meGusta +=
            obtenerNumero(data.meGustas);

        metricas.descargas +=
            obtenerNumero(data.descargasCurriculum);
    });

    actualizarIndicadores(metricas);

    if (errores > 0) {
        console.warn(
            `${errores} enlace(s) no pudieron aportar sus estadísticas.`
        );
    }
}

function actualizarIndicadores(metricas) {
    const valores = [
        metricas.visualizaciones.toLocaleString('es-MX'),
        metricas.meGusta.toLocaleString('es-MX'),
        metricas.semanales.toLocaleString('es-MX'),
        metricas.descargas.toLocaleString('es-MX')
    ];

    const viewsElement = document.getElementById('stat-views');
    const weeklyElement = document.getElementById('stat-weekly');
    const likesElement = document.getElementById('stat-likes');
    const downloadsElement = document.getElementById('stat-downloads');

    if (viewsElement) viewsElement.textContent = valores[0];
    if (weeklyElement) weeklyElement.textContent = valores[2];
    if (likesElement) likesElement.textContent = valores[1];
    if (downloadsElement) downloadsElement.textContent = valores[3];

    const items = document.querySelectorAll(
        '.stats-grid .stat-item'
    );

    items.forEach((item, index) => {
        const value = item.querySelector('.stat-value');

        if (value && valores[index] !== undefined) {
            value.textContent = valores[index];
        }
    });
}

function limpiarEstadisticas() {
    actualizarIndicadores({
        visualizaciones: 0,
        visualizacionesSemanales: 0,
        semanales: 0,
        meGusta: 0,
        descargas: 0
    });
}

// ============================================================
// COPIAR TEXTO
// ============================================================

async function copyToClipboard(id) {
    const element = document.getElementById(id);

    if (!element) return;

    const text = element.textContent.trim();

    try {
        await navigator.clipboard.writeText(text);
        showToast('Texto copiado al portapapeles.');

    } catch {
        showToast('No se pudo copiar el texto.');
    }
}

// ============================================================
// PORTAL DE EVIDENCIAS
// VISIBILIDAD DE SECCIONES Y PRIVACIDAD DE DOCUMENTOS
// ============================================================

const PE_SECCIONES_PUBLICAS = [
    { tipo: 'perfil', nombre: 'Información personal' },
    { tipo: 'formacion', nombre: 'Formación académica' },
    { tipo: 'experiencia', nombre: 'Experiencia laboral' },
    { tipo: 'proyectos', nombre: 'Proyectos' },
    { tipo: 'practicas', nombre: 'Prácticas profesionales' },
    { tipo: 'actividades', nombre: 'Actividades extracurriculares' },
    { tipo: 'habilidades', nombre: 'Habilidades' },
    { tipo: 'intereses', nombre: 'Intereses' }
];

let PE_curriculum = null;
let PE_secciones = [];
let PE_documentos = [];
let PE_documentosPublicos = [];

let PE_guardandoSecciones = false;
let PE_guardandoDocumentos = false;
let PE_cargandoConfiguracion = false;

// ============================================================
// PETICIONES PE
// Se utiliza el mismo apiFetch y la misma cookie de sesión.
// ============================================================

async function PE_request(endpoint, options = {}) {
    const response = await apiFetch(`/api${endpoint}`, options);

    if (response.status === 403) {
        throw new Error(
            'No tienes autorización para realizar esta operación.'
        );
    }

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    return null;
}

// ============================================================
// INICIALIZACIÓN DE PANELES
// ============================================================

function PE_inicializarPaneles() {
    if (document.getElementById('pe-public-settings')) return;

    const contenedor =
        document.querySelector('main') ||
        document.querySelector('.main-content') ||
        document.querySelector('.content') ||
        document.body;

    const panel = document.createElement('section');
    panel.id = 'pe-public-settings';

    panel.innerHTML = `
        <style>
            #pe-public-settings {
                display: grid;
                gap: 22px;
                margin: 28px 0;
                width: 100%;
            }

            .pe-panel {
                background: var(--card-bg, #fff);
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 14px;
                padding: 22px;
                color: var(--text-color, #222);
            }

            .pe-panel h3 {
                margin: 0 0 8px;
                font-size: 18px;
            }

            .pe-description {
                color: var(--text-secondary, #777);
                font-size: 13px;
                margin: 0 0 18px;
                line-height: 1.5;
            }

            .pe-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                padding: 13px 0;
                border-bottom: 1px solid var(--border-color, #eee);
            }

            .pe-option:last-child {
                border-bottom: none;
            }

            .pe-option-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .pe-option-info strong {
                font-size: 14px;
                font-weight: 600;
            }

            .pe-option-info small {
                color: var(--text-secondary, #777);
                font-size: 12px;
            }

            .pe-switch {
                position: relative;
                width: 44px;
                height: 24px;
                flex-shrink: 0;
            }

            .pe-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .pe-slider {
                position: absolute;
                inset: 0;
                cursor: pointer;
                background: #cbd5e1;
                border-radius: 20px;
                transition: .2s;
            }

            .pe-slider:before {
                content: "";
                position: absolute;
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background: white;
                border-radius: 50%;
                transition: .2s;
            }

            .pe-switch input:checked + .pe-slider {
                background: #16a34a;
            }

            .pe-switch input:checked + .pe-slider:before {
                transform: translateX(20px);
            }

            .pe-switch input:disabled + .pe-slider {
                opacity: .45;
                cursor: not-allowed;
            }

            .pe-document {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 13px 0;
                border-bottom: 1px solid var(--border-color, #eee);
            }

            .pe-document:last-child {
                border-bottom: none;
            }

            .pe-document-info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .pe-document-info strong {
                font-size: 13px;
                overflow-wrap: anywhere;
            }

            .pe-document-info small {
                font-size: 11px;
                color: var(--text-secondary, #777);
            }

            .pe-save {
                border: none;
                border-radius: 8px;
                padding: 11px 18px;
                background: #15803d;
                color: white;
                font-weight: 600;
                cursor: pointer;
                margin-top: 16px;
            }

            .pe-save:disabled {
                opacity: .55;
                cursor: not-allowed;
            }

            .pe-status {
                font-size: 12px;
                margin-top: 12px;
                min-height: 18px;
            }

            .pe-empty {
                color: var(--text-secondary, #777);
                font-size: 13px;
                padding: 12px 0;
            }
        </style>

        <div class="pe-panel">
            <h3>Visibilidad del perfil público</h3>

            <p class="pe-description">
                Selecciona qué secciones podrán consultar las personas
                que tengan acceso a tu enlace público.
            </p>

            <div id="pe-sections-list">
                <p class="pe-empty">Cargando configuración...</p>
            </div>

            <button
                type="button"
                class="pe-save"
                id="pe-save-sections"
                onclick="PE_guardarSecciones()">
                Guardar visibilidad
            </button>

            <div id="pe-sections-status" class="pe-status"></div>
        </div>

        <div class="pe-panel">
            <h3>Documentos públicos</h3>

            <p class="pe-description">
                Autoriza individualmente los documentos que podrán
                consultarse desde las secciones públicas de tu perfil.
                Los documentos personales protegidos no pueden publicarse.
            </p>

            <div id="pe-documents-list">
                <p class="pe-empty">Cargando documentos...</p>
            </div>

            <button
                type="button"
                class="pe-save"
                id="pe-save-documents"
                onclick="PE_guardarDocumentos()">
                Guardar privacidad
            </button>

            <div id="pe-documents-status" class="pe-status"></div>
        </div>
    `;

    contenedor.appendChild(panel);
}

// ============================================================
// CARGAR CONFIGURACIÓN PÚBLICA
// ============================================================

async function PE_cargarConfiguracionPublica() {
    if (PE_cargandoConfiguracion) return;

    PE_cargandoConfiguracion = true;

    try {
        // El currículum ya fue recuperado por el módulo principal.
        PE_curriculum = curriculumActual;

        if (!PE_curriculum) {
            PE_renderizarSecciones();
        } else {
            PE_prepararSeccionesDesdeCurriculum();
            PE_renderizarSecciones();
        }

        // Documentos y privacidad son independientes.
        const resultados = await Promise.allSettled([
            PE_cargarDocumentos(),
            PE_cargarPrivacidad()
        ]);

        resultados.forEach((resultado, index) => {
            if (resultado.status === 'rejected') {
                console.error(
                    index === 0
                        ? 'Error al cargar documentos:'
                        : 'Error al cargar privacidad:',
                    resultado.reason
                );
            }
        });

        PE_renderizarDocumentos();

        const errores = resultados.filter(
            resultado => resultado.status === 'rejected'
        );

        if (errores.length > 0) {
            PE_mostrarEstado(
                'pe-documents-status',
                'No fue posible recuperar toda la configuración. Revisa la conexión e inténtalo nuevamente.',
                true
            );
        }

    } catch (error) {
        console.error(
            'Error al cargar configuración pública:',
            error
        );

        PE_mostrarEstado(
            'pe-sections-status',
            error.message,
            true
        );

    } finally {
        PE_cargandoConfiguracion = false;
    }
}

// ============================================================
// CURRÍCULUM Y SECCIONES
// ============================================================

// No realiza una segunda solicitud al endpoint /Curriculum.
async function PE_cargarCurriculum() {
    PE_curriculum = await obtenerCurriculumActual();
    PE_prepararSeccionesDesdeCurriculum();

    return PE_curriculum;
}

function PE_prepararSeccionesDesdeCurriculum() {
    PE_curriculum = curriculumActual;

    if (!PE_curriculum) {
        PE_secciones = [];
        return;
    }

    PE_secciones = Array.isArray(PE_curriculum.secciones)
        ? PE_curriculum.secciones
            .filter(s =>
                s.tipoSeccion?.toLowerCase() !==
                'configuracionconstructor'
            )
            .map(s => ({
                tipoSeccion: s.tipoSeccion,
                orden: s.orden,
                visible: s.visible
            }))
        : [];

    PE_SECCIONES_PUBLICAS.forEach((definicion, indice) => {
        const existe = PE_secciones.some(s =>
            PE_normalizarTipo(s.tipoSeccion) ===
            PE_normalizarTipo(definicion.tipo)
        );

        if (!existe) {
            PE_secciones.push({
                tipoSeccion: definicion.tipo,
                orden: indice,
                visible: true
            });
        }
    });

    PE_secciones.sort((a, b) => a.orden - b.orden);
}

function PE_normalizarTipo(valor) {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function PE_renderizarSecciones() {
    const contenedor = document.getElementById('pe-sections-list');

    if (!contenedor) return;

    if (!PE_curriculum) {
        contenedor.innerHTML = `
            <p class="pe-empty">
                Primero debes crear un currículum para configurar
                la visibilidad de sus secciones.
            </p>
        `;

        const button = document.getElementById('pe-save-sections');

        if (button) {
            button.disabled = true;
        }

        return;
    }

    const fragment = document.createDocumentFragment();

    PE_SECCIONES_PUBLICAS.forEach(definicion => {
        const seccion = PE_secciones.find(s =>
            PE_normalizarTipo(s.tipoSeccion) ===
            PE_normalizarTipo(definicion.tipo)
        );

        const visible = seccion
            ? seccion.visible === true
            : true;

        const item = document.createElement('div');
        item.className = 'pe-option';

        const info = document.createElement('div');
        info.className = 'pe-option-info';

        const title = document.createElement('strong');
        title.textContent = definicion.nombre;

        const description = document.createElement('small');
        description.textContent = visible
            ? 'Visible en el perfil público'
            : 'Oculta en el perfil público';

        info.append(title, description);

        const label = document.createElement('label');
        label.className = 'pe-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'pe-section-toggle';
        input.dataset.tipo = definicion.tipo;
        input.checked = visible;

        const slider = document.createElement('span');
        slider.className = 'pe-slider';

        input.addEventListener('change', () => {
            description.textContent = input.checked
                ? 'Visible en el perfil público'
                : 'Oculta en el perfil público';
        });

        label.append(input, slider);
        item.append(info, label);

        fragment.appendChild(item);
    });

    contenedor.replaceChildren(fragment);

    const button = document.getElementById('pe-save-sections');

    if (button) {
        button.disabled = false;
    }
}

async function PE_guardarSecciones() {
    if (!PE_curriculum || PE_guardandoSecciones) return;

    const boton = document.getElementById('pe-save-sections');

    if (!boton) return;

    try {
        PE_guardandoSecciones = true;
        boton.disabled = true;
        boton.textContent = 'Guardando...';

        const controles = document.querySelectorAll(
            '.pe-section-toggle'
        );

        const cambios = PE_secciones.map(seccion => ({
            ...seccion
        }));

        controles.forEach(control => {
            const seccion = cambios.find(s =>
                PE_normalizarTipo(s.tipoSeccion) ===
                PE_normalizarTipo(control.dataset.tipo)
            );

            if (seccion) {
                seccion.visible = control.checked;
            }
        });

        const payload = {
            secciones: cambios.map(s => ({
                tipoSeccion: s.tipoSeccion,
                orden: s.orden,
                visible: s.visible
            }))
        };

        await PE_request(
            `/Curriculum/${PE_curriculum.id}/secciones`,
            {
                method: 'PUT',
                body: JSON.stringify(payload)
            }
        );

        // Solo actualizamos el estado local después de confirmar el servidor.
        PE_secciones = cambios;

        PE_mostrarEstado(
            'pe-sections-status',
            'La visibilidad de las secciones se guardó correctamente.'
        );

    } catch (error) {
        console.error('Error al guardar secciones:', error);

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        }

        PE_mostrarEstado(
            'pe-sections-status',
            error.message,
            true
        );

    } finally {
        PE_guardandoSecciones = false;
        boton.disabled = false;
        boton.textContent = 'Guardar visibilidad';
    }
}

// ============================================================
// DOCUMENTOS
// ============================================================

async function PE_cargarDocumentos() {
    const resultado = await PE_request('/Documentos');

    PE_documentos = Array.isArray(resultado)
        ? resultado
        : resultado?.items || resultado?.documentos || [];

    return PE_documentos;
}

async function PE_cargarPrivacidad() {
    const resultado = await PE_request('/ConfiguracionPrivacidad');

    PE_documentosPublicos = Array.isArray(
        resultado?.documentosPublicos
    )
        ? resultado.documentosPublicos.map(Number)
        : [];

    return PE_documentosPublicos;
}

function PE_esDocumentoPrivado(documento) {
    const tipo = String(documento.tipoDocumento || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return (
        tipo.includes('curp') ||
        tipo.includes('ine') ||
        tipo.includes('acta') ||
        tipo.includes('nacimiento')
    );
}

function PE_renderizarDocumentos() {
    const contenedor = document.getElementById('pe-documents-list');

    if (!contenedor) return;

    if (!PE_documentos.length) {
        contenedor.innerHTML = `
            <p class="pe-empty">
                No tienes documentos registrados.
            </p>
        `;

        return;
    }

    const fragment = document.createDocumentFragment();

    PE_documentos.forEach(documento => {
        const id = Number(documento.id);
        const privado = PE_esDocumentoPrivado(documento);
        const autorizado = PE_documentosPublicos.includes(id);

        const item = document.createElement('div');
        item.className = 'pe-document';

        const info = document.createElement('div');
        info.className = 'pe-document-info';

        const name = document.createElement('strong');
        name.textContent =
            documento.nombreArchivo || 'Documento sin nombre';

        const details = document.createElement('small');

        details.textContent =
            `${documento.tipoDocumento || 'Documento'}` +
            (privado ? ' · Documento protegido' : '');

        info.append(name, details);

        const label = document.createElement('label');
        label.className = 'pe-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'pe-document-toggle';
        input.dataset.id = String(id);
        input.checked = autorizado && !privado;
        input.disabled = privado;

        const slider = document.createElement('span');
        slider.className = 'pe-slider';

        label.append(input, slider);
        item.append(info, label);

        fragment.appendChild(item);
    });

    contenedor.replaceChildren(fragment);
}

async function PE_guardarDocumentos() {
    if (PE_guardandoDocumentos) return;

    const boton = document.getElementById('pe-save-documents');

    if (!boton) return;

    try {
        PE_guardandoDocumentos = true;
        boton.disabled = true;
        boton.textContent = 'Guardando...';

        const controles = document.querySelectorAll(
            '.pe-document-toggle'
        );

        const documentosPublicos = Array.from(controles)
            .filter(control =>
                control.checked && !control.disabled
            )
            .map(control => Number(control.dataset.id));

        const resultado = await PE_request(
            '/ConfiguracionPrivacidad',
            {
                method: 'PUT',
                body: JSON.stringify({
                    documentosPublicos
                })
            }
        );

        PE_documentosPublicos = Array.isArray(
            resultado?.documentosPublicos
        )
            ? resultado.documentosPublicos.map(Number)
            : documentosPublicos;

        PE_mostrarEstado(
            'pe-documents-status',
            'La privacidad de los documentos se guardó correctamente.'
        );

    } catch (error) {
        console.error('Error al guardar privacidad:', error);

        if (error.message?.includes('sesión ha expirado')) {
            mostrarModalAcceso();
        }

        PE_mostrarEstado(
            'pe-documents-status',
            error.message,
            true
        );

    } finally {
        PE_guardandoDocumentos = false;
        boton.disabled = false;
        boton.textContent = 'Guardar privacidad';
    }
}

// ============================================================
// UTILIDADES PE
// ============================================================

function PE_mostrarEstado(id, mensaje, error = false) {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.style.color = error ? '#dc2626' : '#15803d';
}

function PE_escapeHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[caracter]);
}

// ============================================================
// LIBERAR RECURSOS TEMPORALES
// ============================================================

window.addEventListener('beforeunload', () => {
    stopCamera();

    if (originalPhotoUrl) {
        URL.revokeObjectURL(originalPhotoUrl);
        originalPhotoUrl = null;
    }

    if (previewPhotoUrl) {
        URL.revokeObjectURL(previewPhotoUrl);
        previewPhotoUrl = null;
    }

    if (editorSourceIsObjectUrl && editorSourceUrl) {
        URL.revokeObjectURL(editorSourceUrl);
        editorSourceUrl = null;
    }
});
