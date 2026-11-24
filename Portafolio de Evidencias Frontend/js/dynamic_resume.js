

    /* ============================================================
       1. CONFIGURACIÓN Y VARIABLES
    ============================================================ */

    const API_URL = (
        window.PORTAL_API_BASE ||
        'https://pureblood-starfish-happening.ngrok-free.dev/api'
    ).replace(/\/+$/, '');

    const cvData = {
        profile: null,
        experience: [],
        education: [],
        skills: [],
        projects: []
    };

    let authData = null;
    let curriculumIdActual = null;
    let sessionRedirectTimer = null;
    let photoObjectUrl = null;
    let photoRequestInProgress = false;

    let cvConfig = {
        showPhoto: true,
        showEmail: true,
        showPhone: true,
        selectedExperience: [],
        selectedEducation: [],
        selectedSkills: [],
        selectedProjects: []
    };

    /* ============================================================
       2. PETICIONES HTTP Y AUTENTICACIÓN
    ============================================================ */

    
async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || 'GET',
        credentials: 'include',
        headers: {
            'ngrok-skip-browser-warning': 'true',

            ...(options.body !== undefined
                ? { 'Content-Type': 'application/json' }
                : {}),

            ...(options.headers || {})
        },
        ...(options.body !== undefined
            ? {
                body: typeof options.body === 'string'
                    ? options.body
                    : JSON.stringify(options.body)
            }
            : {})
    };

    try {
        const response = await fetch(
            `${API_URL}${endpoint}`,
            config
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            mostrarModalSesion();

            const error = new Error(
                'Sesión no válida o expirada.'
            );

            error.status = response.status;
            throw error;
        }

        if (!response.ok) {
            const errText = await response.text();

            const error = new Error(
                `Error HTTP: ${response.status} - ${errText}`
            );

            error.status = response.status;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        const contentType =
            response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();

    } catch (error) {
        console.error(
            `Error en la llamada a ${endpoint}:`,
            error
        );

        throw error;
    }
}


    function mostrarModalSesion() {
        document.body.style.visibility = 'visible';

        const modal = document.getElementById('sessionModal');

        if (!modal) {
            window.location.href =
                window.PORTAL_LOGIN_URL || 'login.html';
            return;
        }

        if (sessionRedirectTimer !== null) {
            return;
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        sessionRedirectTimer = setTimeout(() => {
            modal.classList.remove('show');
            document.body.style.overflow = '';

            window.location.href =
                window.PORTAL_LOGIN_URL || 'login.html';

        }, 2500);
    }

    async function verificarSesionYPreferencias() {
        try {
            // Una sola consulta de autenticación.
            authData = await apiRequest('/Auth/me');

            if (!authData) {
                throw new Error(
                    'No se recibió información de autenticación.'
                );
            }

            return true;

        } catch (error) {
            console.error(
                'No fue posible validar la sesión:',
                error
            );

            return false;
        }
    }

    /* ============================================================
       3. RECUPERACIÓN DEL CURRÍCULUM
    ============================================================ */

    async function fetchCurriculumActual() {
        const curriculums = await apiRequest('/Curriculum');

        if (
            !Array.isArray(curriculums) ||
            curriculums.length === 0
        ) {
            throw new Error(
                'No hay currículums registrados.'
            );
        }

        const curriculum = curriculums.find(
            item => item.esPredeterminado
        );

        if (!curriculum) {
            throw new Error(
                'No se encontró un currículum predeterminado.'
            );
        }

        curriculumIdActual = curriculum.id;

        console.log(
            'Currículum seleccionado:',
            curriculumIdActual
        );
    }

    /* ============================================================
       4. CARGA PARALELA DE INFORMACIÓN
    ============================================================ */

    async function loadAllData() {
        /*
         * Las peticiones independientes comienzan
         * simultáneamente, sin esperar al currículum.
         */

        const results = await Promise.allSettled([
            fetchCurriculumActual(),
            fetchProfile(),
            fetchExperience(),
            fetchEducation(),
            fetchSkills(),
            fetchProjects()
        ]);

        const curriculumResult = results[0];
        const profileResult = results[1];

        if (
            curriculumResult.status === 'rejected'
        ) {
            console.error(
                'No fue posible recuperar el currículum:',
                curriculumResult.reason
            );

            return false;
        }

        if (
            profileResult.status === 'rejected' ||
            !cvData.profile
        ) {
            console.error(
                'No fue posible cargar el perfil del usuario.'
            );

            return false;
        }

        /*
         * La configuración depende del ID del currículum,
         * por eso se consulta después de identificarlo.
         */

        await loadSavedConfiguration();

        // Aplicamos las opciones recuperadas.
        document.getElementById('cfg-photo').checked =
            cvConfig.showPhoto;

        document.getElementById('cfg-email').checked =
            cvConfig.showEmail;

        document.getElementById('cfg-phone').checked =
            cvConfig.showPhone;

        // Dibujamos los controles.
        renderConfigControls();

        // Primera representación de la vista previa.
        updatePreview();

        return true;
    }

    /* ============================================================
       5. CONFIGURACIÓN GUARDADA DEL CURRÍCULUM
    ============================================================ */

    async function loadSavedConfiguration() {
        try {
            if (!curriculumIdActual) {
                throw new Error(
                    'No se ha identificado el currículum actual.'
                );
            }

            const savedConfig = await apiRequest(
                `/Curriculum/config?curriculumId=${encodeURIComponent(curriculumIdActual)}`
            );

            if (!savedConfig) {
                return;
            }

            cvConfig.showPhoto =
                typeof savedConfig.showPhoto === 'boolean'
                    ? savedConfig.showPhoto
                    : true;

            cvConfig.showEmail =
                typeof savedConfig.showEmail === 'boolean'
                    ? savedConfig.showEmail
                    : true;

            cvConfig.showPhone =
                typeof savedConfig.showPhone === 'boolean'
                    ? savedConfig.showPhone
                    : true;

            cvConfig.selectedExperience =
                Array.isArray(savedConfig.selectedExperience)
                    ? savedConfig.selectedExperience.map(String)
                    : [];

            cvConfig.selectedEducation =
                Array.isArray(savedConfig.selectedEducation)
                    ? savedConfig.selectedEducation.map(String)
                    : [];

            cvConfig.selectedSkills =
                Array.isArray(savedConfig.selectedSkills)
                    ? savedConfig.selectedSkills.map(String)
                    : [];

            cvConfig.selectedProjects =
                Array.isArray(savedConfig.selectedProjects)
                    ? savedConfig.selectedProjects.map(String)
                    : [];

            console.log(
                'Configuración del currículum recuperada.'
            );

        } catch (error) {
            console.error(
                'No fue posible recuperar la configuración del currículum:',
                error
            );
        }
    }

    /* ============================================================
       6. PERFIL Y FOTOGRAFÍA
    ============================================================ */

    async function fetchProfile() {
        try {
            const profile = await apiRequest('/Perfil/me');

            if (!profile || !authData) {
                throw new Error(
                    'La respuesta del perfil está vacía.'
                );
            }

            /*
             * Reutilizamos los datos de /Auth/me.
             * Ya no hacemos una segunda petición.
             */

            cvData.profile = {
                name: profile.nombreCompleto ||
                    'Nombre no registrado',

                title: profile.tituloProfesional || '',

                email: authData.correo || '',

                phone: profile.telefono || '',

                summary: profile.presentacion || '',

                hasPhoto: !!profile.rutaFotografia,

                photoUrl: null
            };

            /*
             * La fotografía se descarga en segundo plano.
             * No bloquea la carga de las demás secciones.
             */

            if (cvData.profile.hasPhoto) {
                cargarFotografia();
            }

        } catch (error) {
            cvData.profile = null;
            throw error;

        } finally {
            document.getElementById('load-profile').style.display =
                'none';
        }
    }

    
async function cargarFotografia() {
    if (
        photoRequestInProgress ||
        !cvData.profile ||
        !cvData.profile.hasPhoto
    ) {
        return;
    }

    photoRequestInProgress = true;

    try {
        const response = await fetch(
            `${API_URL}/Perfil/me/fotografia`,
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            }
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            mostrarModalSesion();
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Error al recuperar fotografía: ${response.status}`
            );
        }

        const blob = await response.blob();

        if (
            !blob.type.startsWith('image/') ||
            blob.size === 0
        ) {
            throw new Error(
                'El servidor no devolvió una imagen válida.'
            );
        }

        const newObjectUrl = URL.createObjectURL(blob);

        if (photoObjectUrl) {
            URL.revokeObjectURL(photoObjectUrl);
        }

        photoObjectUrl = newObjectUrl;

        if (cvData.profile) {
            cvData.profile.photoUrl = photoObjectUrl;

            updatePreview();
        }

        console.log('Fotografía del perfil cargada correctamente.');

    } catch (error) {
        console.error(
            'No fue posible cargar la fotografía:',
            error
        );

    } finally {
        photoRequestInProgress = false;
    }
}

    /* ============================================================
       7. EXPERIENCIA LABORAL
    ============================================================ */

    async function fetchExperience() {
        try {
            const exps = await apiRequest('/Experiencia');

            cvData.experience = Array.isArray(exps)
                ? exps
                : [];

            cvConfig.selectedExperience =
                cvData.experience.map(
                    item => String(item.id)
                );

        } catch (error) {
            console.error(
                'Error al cargar experiencia laboral:',
                error
            );

        } finally {
            document.getElementById('load-experience').style.display =
                'none';
        }
    }

    /* ============================================================
       8. FORMACIÓN ACADÉMICA
    ============================================================ */

    async function fetchEducation() {
        try {
            const edu = await apiRequest('/Formacion');

            cvData.education = Array.isArray(edu)
                ? edu
                : [];

            console.log(
                'Formación académica:',
                cvData.education
            );

            cvConfig.selectedEducation =
                cvData.education.map(
                    item => String(item.id)
                );

        } catch (error) {
            console.error(
                'Error al cargar formación académica:',
                error
            );

        } finally {
            document.getElementById('load-education').style.display =
                'none';
        }
    }

    /* ============================================================
       9. HABILIDADES
    ============================================================ */

    async function fetchSkills() {
        try {
            const skills = await apiRequest(
                '/Habilidades/mis-habilidades'
            );

            cvData.skills = Array.isArray(skills)
                ? skills
                : [];

            cvConfig.selectedSkills =
                cvData.skills.map(
                    item => String(item.id)
                );

        } catch (error) {
            console.error(
                'Error al cargar habilidades:',
                error
            );

        } finally {
            document.getElementById('load-skills').style.display =
                'none';
        }
    }

    /* ============================================================
       10. PROYECTOS
    ============================================================ */

    async function fetchProjects() {
        try {
            const projs = await apiRequest('/Proyectos');

            cvData.projects = Array.isArray(projs)
                ? projs.filter(
                    project => project.esDestacado
                )
                : [];

            cvConfig.selectedProjects =
                cvData.projects.map(
                    item => String(item.id)
                );

        } catch (error) {
            console.error(
                'Error al cargar proyectos:',
                error
            );

        } finally {
            document.getElementById('load-projects').style.display =
                'none';
        }
    }

    /* ============================================================
       11. CONTROLES DE CONFIGURACIÓN
    ============================================================ */

    function toggleSection(btn) {
        const isExpanded =
            btn.getAttribute('aria-expanded') === 'true';

        btn.setAttribute(
            'aria-expanded',
            String(!isExpanded)
        );

        const content = btn.nextElementSibling;

        if (isExpanded) {
            content.classList.remove('active');
        } else {
            content.classList.add('active');
        }
    }

    function createCheckboxHTML(
        id,
        category,
        title,
        subtitle,
        isChecked
    ) {
        return `
            <label class="item-toggle">
                <input
                    type="checkbox"
                    value="${escapeHtml(id)}"
                    data-category="${category}"
                    ${isChecked ? 'checked' : ''}
                    onchange="handleSelectionChange(this)"
                >

                <div class="item-info">
                    <span class="item-title">
                        ${escapeHtml(title || 'Sin título')}
                    </span>

                    ${
                        subtitle
                            ? `<span class="item-subtitle">${escapeHtml(subtitle)}</span>`
                            : ''
                    }
                </div>
            </label>
        `;
    }

    function renderConfigControls() {
        const listExp =
            document.getElementById('list-experience');

        if (cvData.experience.length === 0) {
            listExp.innerHTML = `
                <div class="empty-state-msg">
                    No hay registros.<br>
                    <a href="job_experience.html">Agregar</a>
                </div>
            `;
        } else {
            listExp.innerHTML = cvData.experience.map(item =>
                createCheckboxHTML(
                    item.id,
                    'experience',
                    item.puesto || item.cargo,
                    item.empresa,
                    cvConfig.selectedExperience.includes(
                        String(item.id)
                    )
                )
            ).join('');
        }

        const listEdu =
            document.getElementById('list-education');

        if (cvData.education.length === 0) {
            listEdu.innerHTML = `
                <div class="empty-state-msg">
                    No hay registros.<br>
                    <a href="academic_qualifications.html">Agregar</a>
                </div>
            `;
        } else {
            listEdu.innerHTML = cvData.education.map(item =>
                createCheckboxHTML(
                    item.id,
                    'education',
                    item.carrera,
                    item.institucion,
                    cvConfig.selectedEducation.includes(
                        String(item.id)
                    )
                )
            ).join('');
        }

        const listSkills =
            document.getElementById('list-skills');

        if (cvData.skills.length === 0) {
            listSkills.innerHTML = `
                <div class="empty-state-msg">
                    No hay registros.<br>
                    <a href="skills.html">Agregar</a>
                </div>
            `;
        } else {
            listSkills.innerHTML = cvData.skills.map(item =>
                createCheckboxHTML(
                    item.id,
                    'skills',
                    item.nombre,
                    item.nivel,
                    cvConfig.selectedSkills.includes(
                        String(item.id)
                    )
                )
            ).join('');
        }

        const listProj =
            document.getElementById('list-projects');

        if (cvData.projects.length === 0) {
            listProj.innerHTML = `
                <div class="empty-state-msg">
                    No hay proyectos destacados.<br>
                    <a href="projects_practices.html">Agregar</a>
                </div>
            `;
        } else {
            listProj.innerHTML = cvData.projects.map(item =>
                createCheckboxHTML(
                    item.id,
                    'projects',
                    item.nombre,
                    '',
                    cvConfig.selectedProjects.includes(
                        String(item.id)
                    )
                )
            ).join('');
        }
    }

    function handleSelectionChange(checkbox) {
        const category =
            checkbox.getAttribute('data-category');

        const id = checkbox.value;

        let targetArray;

        if (category === 'experience') {
            targetArray = cvConfig.selectedExperience;

        } else if (category === 'education') {
            targetArray = cvConfig.selectedEducation;

        } else if (category === 'skills') {
            targetArray = cvConfig.selectedSkills;

        } else if (category === 'projects') {
            targetArray = cvConfig.selectedProjects;
        }

        if (!targetArray) {
            return;
        }

        if (checkbox.checked) {
            if (!targetArray.includes(id)) {
                targetArray.push(id);
            }
        } else {
            const index = targetArray.indexOf(id);

            if (index > -1) {
                targetArray.splice(index, 1);
            }
        }

        updatePreview();
    }

    /* ============================================================
       12. FUNCIONES AUXILIARES DEL CURRÍCULUM
    ============================================================ */

    function formatDate(dateString) {
        if (!dateString) {
            return 'Presente';
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return dateString;
        }

        return date.getFullYear();
    }

    function escapeHtml(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildDateRange(startDate, endDate) {
        const start = formatDate(startDate);
        const end = formatDate(endDate);

        if (start === end) {
            return start;
        }

        return `${start} — ${end}`;
    }

    /* ============================================================
       13. GENERACIÓN DEL CURRÍCULUM
    ============================================================ */

    function updatePreview() {
        const photoControl =
            document.getElementById('cfg-photo');

        const emailControl =
            document.getElementById('cfg-email');

        const phoneControl =
            document.getElementById('cfg-phone');

        cvConfig.showPhoto = photoControl.checked;
        cvConfig.showEmail = emailControl.checked;
        cvConfig.showPhone = phoneControl.checked;

        const profile = cvData.profile;

        if (!profile) {
            return;
        }

        const previewDiv =
            document.getElementById('cvPreview');

        /* COLUMNA IZQUIERDA */

        let sidebarHTML = `<aside class="cv-sidebar">`;

        if (
            cvConfig.showPhoto &&
            profile.photoUrl
        ) {
            sidebarHTML += `
                <div class="cv-photo-wrapper">
                    <img
                        src="${profile.photoUrl}"
                        class="cv-photo"
                        alt="Fotografía de perfil"
                    >
                </div>
            `;
        }

        /* CONTACTO */

        if (
            (cvConfig.showEmail && profile.email) ||
            (cvConfig.showPhone && profile.phone)
        ) {
            sidebarHTML += `
                <section class="cv-sidebar-section">
                    <h2 class="cv-sidebar-title">
                        Contacto
                    </h2>

                    <div class="cv-contact-list">
            `;

            if (
                cvConfig.showPhone &&
                profile.phone
            ) {
                sidebarHTML += `
                    <div class="cv-contact-item">
                        <span class="cv-contact-icon">
                            <i class="ri-phone-fill"></i>
                        </span>

                        <span>
                            ${escapeHtml(profile.phone)}
                        </span>
                    </div>
                `;
            }

            if (
                cvConfig.showEmail &&
                profile.email
            ) {
                sidebarHTML += `
                    <div class="cv-contact-item">
                        <span class="cv-contact-icon">
                            <i class="ri-mail-fill"></i>
                        </span>

                        <span>
                            ${escapeHtml(profile.email)}
                        </span>
                    </div>
                `;
            }

            sidebarHTML += `
                    </div>
                </section>
            `;
        }

        /* HABILIDADES */

        const selectedSkills = cvData.skills.filter(
            item =>
                cvConfig.selectedSkills.includes(
                    String(item.id)
                )
        );

        if (selectedSkills.length > 0) {
            sidebarHTML += `
                <section class="cv-sidebar-section">
                    <h2 class="cv-sidebar-title">
                        Habilidades
                    </h2>

                    <ul class="cv-sidebar-list">
            `;

            selectedSkills.forEach(skill => {
                sidebarHTML += `
                    <li>
                        ${escapeHtml(skill.nombre)}
                    </li>
                `;
            });

            sidebarHTML += `
                    </ul>
                </section>
            `;
        }

        /* FORMACIÓN ACADÉMICA */

        const selectedEducation = cvData.education
            .filter(item =>
                cvConfig.selectedEducation.includes(
                    String(item.id)
                )
            )
            .sort((a, b) =>
                new Date(b.fechaInicio) -
                new Date(a.fechaInicio)
            );

        if (selectedEducation.length > 0) {
            sidebarHTML += `
                <section class="cv-sidebar-section">
                    <h2 class="cv-sidebar-title">
                        Formación
                    </h2>

                    <div>
            `;

            selectedEducation.forEach(education => {
                sidebarHTML += `
                    <div class="cv-edu-item">
                        <div class="cv-edu-degree">
                            ${escapeHtml(
                                education.carrera || 'Sin título'
                            )}
                        </div>

                        <div class="cv-edu-school">
                            ${escapeHtml(
                                education.institucion
                            )}
                        </div>

                        <div class="cv-edu-date">
                            ${buildDateRange(
                                education.fechaInicio,
                                education.fechaFin
                            )}
                        </div>
                    </div>
                `;
            });

            sidebarHTML += `
                    </div>
                </section>
            `;
        }

        sidebarHTML += `</aside>`;

        /* COLUMNA DERECHA */

        let mainHTML = `
            <div class="cv-main">

                <header class="cv-main-header">
                    <div class="cv-header-kicker">
                        Currículum profesional
                    </div>

                    <h1 class="cv-name">
                        ${escapeHtml(profile.name)}
                    </h1>

                    ${
                        profile.title
                            ? `
                                <div class="cv-title">
                                    ${escapeHtml(profile.title)}
                                </div>
                            `
                            : ''
                    }
                </header>

                <div class="cv-main-body">
        `;

        /* PERFIL PROFESIONAL */

        if (profile.summary) {
            mainHTML += `
                <section class="cv-section-main">
                    <h2 class="cv-main-title">
                        Perfil profesional
                    </h2>

                    <p class="cv-summary">
                        ${escapeHtml(profile.summary)}
                    </p>
                </section>
            `;
        }

        /* EXPERIENCIA LABORAL */

        const selectedExperience = cvData.experience
            .filter(item =>
                cvConfig.selectedExperience.includes(
                    String(item.id)
                )
            )
            .sort((a, b) =>
                new Date(b.fechaInicio) -
                new Date(a.fechaInicio)
            );

        if (selectedExperience.length > 0) {
            mainHTML += `
                <section class="cv-section-main">
                    <h2 class="cv-main-title">
                        Experiencia profesional
                    </h2>

                    <div class="cv-timeline">
            `;

            selectedExperience.forEach(experience => {
                mainHTML += `
                    <article class="cv-timeline-item">
                        <h3 class="cv-item-title">
                            ${escapeHtml(
                                experience.puesto ||
                                experience.cargo
                            )}
                        </h3>

                        <div class="cv-item-subtitle">
                            ${escapeHtml(
                                experience.empresa
                            )}
                        </div>

                        <div class="cv-item-date">
                            ${buildDateRange(
                                experience.fechaInicio,
                                experience.fechaFin
                            )}
                        </div>

                        ${
                            experience.descripcion
                                ? `
                                    <p class="cv-item-desc">
                                        ${escapeHtml(
                                            experience.descripcion
                                        )}
                                    </p>
                                `
                                : ''
                        }
                    </article>
                `;
            });

            mainHTML += `
                    </div>
                </section>
            `;
        }

        /* PROYECTOS */

        const selectedProjects = cvData.projects.filter(
            item =>
                cvConfig.selectedProjects.includes(
                    String(item.id)
                )
        );

        if (selectedProjects.length > 0) {
            mainHTML += `
                <section class="cv-section-main">
                    <h2 class="cv-main-title">
                        Proyectos destacados
                    </h2>

                    <div class="cv-timeline">
            `;

            selectedProjects.forEach(project => {
                mainHTML += `
                    <article class="cv-timeline-item">
                        <h3 class="cv-item-title">
                            ${escapeHtml(project.nombre)}
                        </h3>

                        ${
                            project.tecnologias
                                ? `
                                    <div class="cv-item-subtitle">
                                        ${escapeHtml(
                                            project.tecnologias
                                        )}
                                    </div>
                                `
                                : ''
                        }

                        <div class="cv-item-date">
                            ${formatDate(project.fechaInicio)}
                        </div>

                        ${
                            project.descripcion
                                ? `
                                    <p class="cv-item-desc">
                                        ${escapeHtml(
                                            project.descripcion
                                        )}
                                    </p>
                                `
                                : ''
                        }
                    </article>
                `;
            });

            mainHTML += `
                    </div>
                </section>
            `;
        }

        /* ESTADO SIN CONTENIDO COMPLEMENTARIO */

        if (
            !profile.summary &&
            selectedExperience.length === 0 &&
            selectedProjects.length === 0
        ) {
            mainHTML += `
                <p class="cv-empty">
                    No hay información profesional adicional seleccionada.
                </p>
            `;
        }

        mainHTML += `
                </div>
            </div>
        `;

        previewDiv.innerHTML =
            sidebarHTML + mainHTML;
    }

    /* ============================================================
       14. NOTIFICACIONES
    ============================================================ */

    function showToast(message, type = 'info') {
        const container =
            document.getElementById('toastContainer');

        const toast = document.createElement('div');

        toast.className = `toast ${type}`;

        const icon = type === 'success'
            ? 'ri-checkbox-circle-line'
            : type === 'error'
                ? 'ri-error-warning-line'
                : 'ri-information-line';

        const iconElement =
            document.createElement('i');

        iconElement.className = icon;

        const textElement =
            document.createElement('span');

        textElement.textContent = message;

        toast.appendChild(iconElement);
        toast.appendChild(textElement);

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation =
                'slideIn .3s reverse forwards';

            setTimeout(() => {
                toast.remove();
            }, 300);

        }, 3000);
    }

    /* ============================================================
       15. REDIMENSIONAMIENTO DEL PANEL
    ============================================================ */

    function initResizer() {
        const resizer =
            document.getElementById('dragMe');

        const leftPanel =
            document.getElementById('configPanel');

        if (!resizer || !leftPanel) {
            return;
        }

        let isResizing = false;
        let currentX;
        let startWidth;

        resizer.addEventListener('mousedown', function (e) {
            isResizing = true;

            currentX = e.clientX;

            startWidth =
                leftPanel.getBoundingClientRect().width;

            resizer.classList.add('resizing');

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            document.addEventListener(
                'mousemove',
                handleMouseMove
            );

            document.addEventListener(
                'mouseup',
                handleMouseUp
            );
        });

        function handleMouseMove(e) {
            if (!isResizing) {
                return;
            }

            const dx = e.clientX - currentX;
            const newWidth = startWidth + dx;

            leftPanel.style.width = `${newWidth}px`;
        }

        function handleMouseUp() {
            isResizing = false;

            resizer.classList.remove('resizing');

            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            document.removeEventListener(
                'mousemove',
                handleMouseMove
            );

            document.removeEventListener(
                'mouseup',
                handleMouseUp
            );
        }
    }

    /* ============================================================
       16. GUARDADO DE CONFIGURACIÓN
    ============================================================ */

    async function saveConfiguration() {
        const btn =
            document.getElementById('btnSaveConfig');

        const originalHtml = btn.innerHTML;

        btn.innerHTML = `
            <i class="ri-loader-4-line"
               style="animation:spin 1s linear infinite;"></i>
            Guardando...
        `;

        btn.disabled = true;

        try {
            if (!curriculumIdActual) {
                throw new Error(
                    'No se ha identificado el currículum actual.'
                );
            }

            cvConfig.showPhoto =
                document.getElementById('cfg-photo').checked;

            cvConfig.showEmail =
                document.getElementById('cfg-email').checked;

            cvConfig.showPhone =
                document.getElementById('cfg-phone').checked;

            await apiRequest(
                `/Curriculum/config?curriculumId=${encodeURIComponent(curriculumIdActual)}`,
                {
                    method: 'PUT',
                    body: cvConfig
                }
            );

            showToast(
                'Configuración del currículum guardada.',
                'success'
            );

        } catch (error) {
            console.error(
                'No fue posible guardar la configuración:',
                error
            );

            showToast(
                'No se pudo guardar la configuración en el servidor.',
                'error'
            );

        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    /* ============================================================
       17. INICIALIZACIÓN
    ============================================================ */

    document.addEventListener(
        'DOMContentLoaded',
        async () => {

            // Evitamos mostrar información protegida
            // antes de validar la sesión.

            document.body.style.visibility = 'hidden';

            initResizer();

            try {
                const autenticado =
                    await verificarSesionYPreferencias();

                if (!autenticado) {
                    mostrarModalSesion();
                    return;
                }

                /*
                 * El tema ya puede haberse aplicado
                 * desde la inicialización de PortalTheme.
                 *
                 * La consulta al servidor se inicia
                 * sin bloquear la carga del currículum.
                 */

                if (
                    window.PortalTheme &&
                    typeof window.PortalTheme.load === 'function'
                ) {
                    window.PortalTheme.load().then(resultado => {
                        if (
                            resultado &&
                            resultado.ok === false
                        ) {
                            console.error(
                                'No se pudieron sincronizar las preferencias visuales:',
                                resultado.error
                            );
                        }
                    }).catch(error => {
                        console.error(
                            'Error al sincronizar el tema:',
                            error
                        );
                    });
                }

                /*
                 * La autenticación ya fue validada.
                 * Mostramos la página mientras se carga
                 * la información del currículum.
                 */

                document.body.style.visibility = 'visible';

                const perfilCargado =
                    await loadAllData();

                if (!perfilCargado) {
                    showToast(
                        'No fue posible cargar la información del perfil.',
                        'error'
                    );
                }

            } catch (error) {
                console.error(
                    'Error al inicializar el currículum:',
                    error
                );

                document.body.style.visibility = 'visible';

                showToast(
                    'Ocurrió un error al cargar el currículum.',
                    'error'
                );
            }
        }
    );

    /* ============================================================
       18. LIBERACIÓN DE RECURSOS
    ============================================================ */

    window.addEventListener('pagehide', () => {
        if (photoObjectUrl) {
            URL.revokeObjectURL(photoObjectUrl);
            photoObjectUrl = null;
        }
    });

