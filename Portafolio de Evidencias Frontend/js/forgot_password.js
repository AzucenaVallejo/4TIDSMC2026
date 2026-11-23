
    // ==========================================
    // CONFIGURACIÓN DE LA API
    // ==========================================

    const API_BASE_URL = 'https://pureblood-starfish-happening.ngrok-free.dev/api/Auth';

    // ==========================================
    // VARIABLES DEL PROCESO
    // ==========================================

    let currentStage = 1;
    let recoveryEmail = '';
    let recoveryToken = null;
    let countdownInterval = null;
    let remainingSeconds = 60;

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    document.addEventListener('DOMContentLoaded', () => {
        setupModalBackdrop();
        setupKeyboardEscListener();
        setupOtpInputs();

        document.getElementById('emailForm')
            .addEventListener('submit', handleEmailSubmit);

        document.getElementById('otpForm')
            .addEventListener('submit', handleOtpSubmit);

        document.getElementById('passwordForm')
            .addEventListener('submit', handlePasswordSubmit);

        document.getElementById('newPassword')
            .addEventListener('input', evaluatePassword);

        document.getElementById('confirmPassword')
            .addEventListener('input', validatePasswordMatch);

        document.getElementById('resendButton')
            .addEventListener('click', resendCode);

        document.getElementById('btnChangeEmail')
            .addEventListener('click', changeEmail);

        document.getElementById('emailInput').focus();
    });

    // ==========================================
    // COMUNICACIÓN CON LA API
    // ==========================================

 async function apiRequest(endpoint, data) {

    let response;

    try {
        response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(data)
        });

    } catch (error) {
        console.error('Error de conexión con la API:', error);

        throw new Error(
            'No fue posible establecer conexión con el servidor. Verifica que la API esté ejecutándose y que el certificado HTTPS sea válido.'
        );
    }

    const responseText = await response.text();

    let result = null;

    if (responseText) {
        try {
            result = JSON.parse(responseText);
        } catch {
            result = null;
        }
    }

    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(result, response.status)
        );
    }

    return result;
}

    function getApiErrorMessage(result, statusCode) {

        if (result) {
            if (typeof result === 'string') {
                return result;
            }

            if (result.detail) {
                return result.detail;
            }

            if (result.message) {
                return result.message;
            }

            if (result.mensaje) {
                return result.mensaje;
            }

            if (result.title) {
                return result.title;
            }

            if (result.errors && typeof result.errors === 'object') {
                const errors = Object.values(result.errors).flat();

                if (errors.length > 0) {
                    return errors.join('\n');
                }
            }
        }

        const messages = {
            400: 'La solicitud no es válida. Verifica los datos e inténtalo nuevamente.',
            401: 'La solicitud no está autorizada o el código ya no es válido.',
            403: 'El servidor rechazó la solicitud por motivos de seguridad.',
            404: 'No se encontró el recurso solicitado.',
            409: 'La operación no pudo completarse porque existe un conflicto.',
            429: 'Se realizaron demasiadas solicitudes. Espera un momento antes de intentarlo nuevamente.',
            500: 'Ocurrió un error interno en el servidor.'
        };

        return messages[statusCode] ||
            'Ocurrió un error al procesar la solicitud.';
    }

    // ==========================================
    // ESTADOS DE LOS BOTONES
    // ==========================================

    function setButtonLoading(buttonId, loading, loadingText = 'Procesando...') {

        const button = document.getElementById(buttonId);

        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalContent = button.innerHTML;

            button.innerHTML = `
                <span class="btn-loading">
                    <span class="spinner"></span>
                    ${loadingText}
                </span>
            `;
        } else {
            button.disabled = false;

            if (button.dataset.originalContent) {
                button.innerHTML = button.dataset.originalContent;
                delete button.dataset.originalContent;
            }
        }
    }

    // ==========================================
    // CAMBIO DE ETAPAS
    // ==========================================

    function changeStage(stageNumber) {

        if (stageNumber < 1 || stageNumber > 4) return;

        currentStage = stageNumber;

        const stages = [
            'stageEmail',
            'stageOtp',
            'stagePassword',
            'stageSuccess'
        ];

        stages.forEach((id, index) => {
            document.getElementById(id).classList.toggle(
                'active',
                index + 1 === stageNumber
            );
        });

        for (let i = 1; i <= 4; i++) {

            const bar = document.getElementById(`stepBar${i}`);

            bar.classList.remove('active', 'completed');

            if (i < stageNumber) {
                bar.classList.add('completed');
            } else if (i === stageNumber) {
                bar.classList.add('active');
            }
        }

        const labels = {
            1: 'Identificación',
            2: 'Verificación',
            3: 'Nueva contraseña',
            4: 'Completado'
        };

        document.getElementById('stepCounter').textContent =
            `PASO ${stageNumber} DE 4`;

        document.getElementById('stepName').textContent =
            labels[stageNumber];

        if (stageNumber !== 2) {
            stopCountdown();
        }

        if (stageNumber === 2) {
            setTimeout(() => {
                document.querySelector('.otp-input').focus();
            }, 100);
        }
    }

    // ==========================================
    // ETAPA 1: SOLICITAR CÓDIGO
    // ==========================================

    async function handleEmailSubmit(event) {

        event.preventDefault();

        const emailInput = document.getElementById('emailInput');
        const email = emailInput.value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            showModal(
                'Correo requerido',
                'Introduce tu correo electrónico para continuar.',
                'warning'
            );

            emailInput.focus();
            return;
        }

        if (!emailRegex.test(email)) {
            showModal(
                'Correo inválido',
                'Introduce una dirección de correo electrónico válida.',
                'warning'
            );

            emailInput.focus();
            return;
        }

        setButtonLoading('btnSendCode', true, 'Enviando solicitud...');

        try {

            // DTO: SolicitarRecuperacionDto
            // Propiedad: Correo

            await apiRequest('solicitar-recuperacion', {
                correo: email
            });

            recoveryEmail = email;
            recoveryToken = null;

            document.getElementById('emailDisplay').textContent =
                recoveryEmail;

            clearOtpInputs();

            changeStage(2);
            startCountdown();

            showModal(
                'Solicitud procesada',
                'Si la dirección corresponde a una cuenta registrada, recibirás un código de verificación en tu correo electrónico.',
                'success'
            );

        } catch (error) {

            console.error('Error al solicitar recuperación:', error);

            showModal(
                'No se pudo procesar la solicitud',
                error.message,
                'warning'
            );

        } finally {
            setButtonLoading('btnSendCode', false);
        }
    }

    // ==========================================
    // ETAPA 2: CÓDIGO OTP
    // ==========================================

    function setupOtpInputs() {

        const inputs = document.querySelectorAll('.otp-input');

        inputs.forEach((input, index) => {

            input.addEventListener('input', () => {

                input.value = input.value.replace(/\D/g, '').slice(0, 1);

                if (input.value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', event => {

                if (
                    event.key === 'Backspace' &&
                    !input.value &&
                    index > 0
                ) {
                    inputs[index - 1].focus();
                }

                if (event.key === 'ArrowLeft' && index > 0) {
                    inputs[index - 1].focus();
                }

                if (
                    event.key === 'ArrowRight' &&
                    index < inputs.length - 1
                ) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('paste', event => {

                event.preventDefault();

                const pasted = (
                    event.clipboardData || window.clipboardData
                ).getData('text').replace(/\D/g, '').slice(0, 6);

                pasted.split('').forEach((digit, digitIndex) => {
                    if (inputs[digitIndex]) {
                        inputs[digitIndex].value = digit;
                    }
                });

                const nextIndex = Math.min(
                    pasted.length,
                    inputs.length - 1
                );

                inputs[nextIndex].focus();
            });
        });
    }

    function getOtpValue() {

        return Array.from(
            document.querySelectorAll('.otp-input')
        ).map(input => input.value).join('');
    }

    function clearOtpInputs() {

        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
        });
    }

    async function handleOtpSubmit(event) {

        event.preventDefault();

        const enteredCode = getOtpValue();

        if (enteredCode.length !== 6) {
            showModal(
                'Código incompleto',
                'Introduce los seis dígitos del código de verificación.',
                'warning'
            );

            return;
        }

        if (!recoveryEmail) {
            showModal(
                'Solicitud no válida',
                'No se encontró el correo de recuperación. Inicia nuevamente el proceso.',
                'warning'
            );

            changeStage(1);
            return;
        }

        setButtonLoading('btnVerifyCode', true, 'Verificando código...');

        try {

            // DTO: VerificarCodigoRecuperacionDto
            // Propiedades: Correo y Codigo

            const result = await apiRequest('verificar-codigo', {
                correo: recoveryEmail,
                codigo: enteredCode
            });

            // DTO de respuesta:
            // TokenRestablecimiento y FechaExpiracion

            const token = result?.tokenRestablecimiento ??
                          result?.TokenRestablecimiento;

            if (!token) {
                throw new Error(
                    'El servidor no devolvió el token de restablecimiento. No es posible continuar.'
                );
            }

            recoveryToken = token;

            stopCountdown();
            changeStage(3);

            document.getElementById('newPassword').focus();

        } catch (error) {

            console.error('Error al verificar código:', error);

            clearOtpInputs();

            showModal(
                'No se pudo verificar el código',
                error.message,
                'warning'
            );

            document.querySelector('.otp-input').focus();

        } finally {
            setButtonLoading('btnVerifyCode', false);
        }
    }

    // ==========================================
    // TEMPORIZADOR Y REENVÍO
    // ==========================================

    function startCountdown() {

        stopCountdown();

        remainingSeconds = 60;

        const button = document.getElementById('resendButton');
        const counter = document.getElementById('countdown');

        button.disabled = true;
        button.innerHTML =
            'Reenviar en <span id="countdown">60</span>s';

        countdownInterval = setInterval(() => {

            remainingSeconds--;

            const currentCounter =
                document.getElementById('countdown');

            if (currentCounter) {
                currentCounter.textContent = remainingSeconds;
            }

            if (remainingSeconds <= 0) {

                stopCountdown();

                button.disabled = false;
                button.textContent = 'Reenviar código';
            }

        }, 1000);
    }

    function stopCountdown() {

        if (countdownInterval !== null) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    async function resendCode() {

        if (remainingSeconds > 0 || !recoveryEmail) return;

        const button = document.getElementById('resendButton');

        button.disabled = true;
        button.textContent = 'Enviando...';

        try {

            // El endpoint de reenvío recibe SolicitarRecuperacionDto.
            // Se reutiliza el correo asociado a la solicitud.

            await apiRequest('reenviar-codigo', {
                correo: recoveryEmail
            });

            recoveryToken = null;

            clearOtpInputs();
            startCountdown();

            showModal(
                'Solicitud procesada',
                'Si la cuenta corresponde a la dirección indicada, recibirás un nuevo código de verificación.',
                'success'
            );

            document.querySelector('.otp-input').focus();

        } catch (error) {

            console.error('Error al reenviar código:', error);

            button.disabled = false;
            button.textContent = 'Reenviar código';

            showModal(
                'No se pudo reenviar el código',
                error.message,
                'warning'
            );
        }
    }

    // ==========================================
    // CAMBIAR CORREO
    // ==========================================

    function changeEmail() {

        stopCountdown();

        recoveryEmail = '';
        recoveryToken = null;

        clearOtpInputs();

        document.getElementById('emailInput').value = '';

        changeStage(1);

        document.getElementById('emailInput').focus();
    }

    // ==========================================
    // ETAPA 3: NUEVA CONTRASEÑA
    // ==========================================

    function evaluatePassword() {

        const password =
            document.getElementById('newPassword').value;

        const requirements = {
            length: password.length >= 12,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /\d/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password)
        };

        const requirementElements = {
            length: 'reqLength',
            upper: 'reqUpper',
            lower: 'reqLower',
            number: 'reqNumber',
            symbol: 'reqSymbol'
        };

        let score = 0;

        Object.entries(requirements).forEach(([key, valid]) => {

            const element = document.getElementById(
                requirementElements[key]
            );

            element.classList.toggle('valid', valid);

            if (valid) score++;
        });

        const fill = document.getElementById('strengthFill');
        const text = document.getElementById('strengthText');

        fill.style.width = `${score * 20}%`;

        const levels = [
            'Sin evaluar',
            'Muy débil',
            'Débil',
            'Regular',
            'Buena',
            'Fuerte'
        ];

        const colors = [
            '#A84E43',
            '#A84E43',
            '#C17B45',
            '#C49B48',
            '#477D6A',
            '#28645F'
        ];

        text.textContent = levels[score];
        text.style.color = colors[score];
        fill.style.background = colors[score];

        validatePasswordMatch();

        return Object.values(requirements).every(Boolean);
    }

    function validatePasswordMatch() {

        const password =
            document.getElementById('newPassword').value;

        const confirmation =
            document.getElementById('confirmPassword').value;

        const message =
            document.getElementById('passwordMatch');

        if (!confirmation) {

            message.textContent =
                'Ambas contraseñas deben coincidir.';

            message.className = 'password-match';

            return false;
        }

        if (password === confirmation) {

            message.textContent = 'Las contraseñas coinciden.';
            message.className = 'password-match valid';

            return true;
        }

        message.textContent = 'Las contraseñas no coinciden.';
        message.className = 'password-match invalid';

        return false;
    }

    async function handlePasswordSubmit(event) {

        event.preventDefault();

        const password =
            document.getElementById('newPassword').value;

        const confirmation =
            document.getElementById('confirmPassword').value;

        if (!recoveryToken) {
            showModal(
                'Verificación requerida',
                'No existe un token de recuperación válido. Debes verificar primero el código recibido por correo.',
                'warning'
            );

            changeStage(2);
            return;
        }

        if (!password) {
            showModal(
                'Contraseña requerida',
                'Introduce una nueva contraseña.',
                'warning'
            );

            return;
        }

        if (!evaluatePassword()) {
            showModal(
                'Contraseña insuficiente',
                'Cumple todos los requisitos de seguridad antes de continuar.',
                'warning'
            );

            return;
        }

        if (password !== confirmation) {
            showModal(
                'Las contraseñas no coinciden',
                'Verifica que ambos campos contengan exactamente la misma contraseña.',
                'warning'
            );

            document.getElementById('confirmPassword').focus();
            return;
        }

        setButtonLoading(
            'btnResetPassword',
            true,
            'Actualizando contraseña...'
        );

        try {

            // DTO: RestablecerContrasenaDto
            // Propiedades:
            // TokenRestablecimiento
            // NuevaContrasena
            // ConfirmarContrasena

            await apiRequest('restablecer-contrasena', {
                tokenRestablecimiento: recoveryToken,
                nuevaContrasena: password,
                confirmarContrasena: confirmation
            });

            // El token deja de estar disponible en el frontend.
            recoveryToken = null;

            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';

            changeStage(4);

        } catch (error) {

            console.error('Error al restablecer contraseña:', error);

            showModal(
                'No se pudo restablecer la contraseña',
                error.message,
                'warning'
            );

        } finally {
            setButtonLoading('btnResetPassword', false);
        }
    }

    // ==========================================
    // VISIBILIDAD DE CONTRASEÑAS
    // ==========================================

    function togglePassword(inputId, iconId) {

        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);

        const showing = input.type === 'password';

        input.type = showing ? 'text' : 'password';

        if (showing) {

            icon.innerHTML = `
                <path d="M3 3 21 21"/>
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
                <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.1 3.9"/>
                <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4.1-.9"/>
            `;

        } else {

            icon.innerHTML = `
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    }

    // ==========================================
    // MODALES
    // ==========================================

    function showModal(title, message, type = 'info') {

        const modal = document.getElementById('appModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');

        const iconContainer =
            document.getElementById('modalIconContainer');

        const modalIcon = document.getElementById('modalIcon');

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        iconContainer.className = `modal-symbol ${type}`;

        if (type === 'warning') {

            modalIcon.innerHTML = `
                <path d="M12 3 22 20H2L12 3Z"/>
                <path d="M12 9V13M12 16H12.01"/>
            `;

        } else if (type === 'success') {

            modalIcon.innerHTML = `
                <path d="m5 12 4 4L19 6"/>
                <circle cx="12" cy="12" r="9"/>
            `;

        } else {

            modalIcon.innerHTML = `
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 11V16M12 8H12.01"/>
            `;
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalId) {

        const modal = document.getElementById(modalId);

        if (!modal) return;

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = '';
    }

    function setupModalBackdrop() {

        document.querySelectorAll('.modal-overlay').forEach(overlay => {

            overlay.addEventListener('click', event => {

                if (event.target === overlay) {
                    closeModal(overlay.id);
                }
            });
        });
    }

    function setupKeyboardEscListener() {

        document.addEventListener('keydown', event => {

            if (event.key === 'Escape') {

                document.querySelectorAll('.modal-overlay.active')
                    .forEach(modal => closeModal(modal.id));
            }
        });
    }

    // ==========================================
    // NAVEGACIÓN
    // ==========================================

    function handleNavigation(targetUrl) {

        if (!targetUrl) return;

        window.location.href = targetUrl;
    }

    // ==========================================
    // LIMPIEZA
    // ==========================================

    window.addEventListener('beforeunload', () => {
        stopCountdown();
        recoveryToken = null;
    });
