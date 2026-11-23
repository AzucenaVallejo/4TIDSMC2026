
    const API_URL = 'https://pureblood-starfish-happening.ngrok-free.dev';

    document.addEventListener('DOMContentLoaded', () => {
        configurarCierreModales();

        const formulario = document.getElementById('form-acceso-invitado');

        if (formulario) {
            formulario.addEventListener('submit', validarAccesoInvitado);
        }
    });

    // ==========================================
    // VALIDACIÓN DE ACCESO COMO INVITADO
    // ==========================================
    async function validarAccesoInvitado(event) {
        event.preventDefault();

        const inputCodigo = document.getElementById('codigo-acceso');

        if (!inputCodigo) {
            console.error('No se encontró el campo codigo-acceso.');
            return;
        }

        const codigo = inputCodigo.value.trim().toUpperCase();

        if (!codigo) {
            abrirModal('error-modal');
            inputCodigo.focus();
            return;
        }

        if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(codigo)) {
            mostrarErrorAcceso(
                'El código debe contener exactamente 10 caracteres válidos.'
            );
            inputCodigo.focus();
            return;
        }

        const boton = event.submitter ||
            document.querySelector('#form-acceso-invitado button[type="submit"]');

        if (boton?.disabled) return;

        const textoOriginal = boton?.textContent;

        try {
            if (boton) {
                boton.disabled = true;
                boton.textContent = 'Validando...';
            }

            const respuesta = await fetch(
    `${API_URL}/api/EnlacesPublicos/publico/validar-codigo`,
    {
        method: 'POST',
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
            codigoAcceso: codigo
        })
    }
);

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                const mensaje = datos.mensaje ||
                    (respuesta.status === 404
                        ? 'El código no es válido, ha expirado o fue revocado.'
                        : 'No fue posible validar el código de acceso.');

                mostrarErrorAcceso(mensaje);
                return;
            }

            if (!datos.token) {
                throw new Error(
                    'El servidor no devolvió un token de acceso válido.'
                );
            }

            // El token permite consultar el currículum público.
            const urlDestino =
                `public_profile.html?token=${encodeURIComponent(datos.token)}`;

            window.location.href = urlDestino;

        } catch (error) {
            console.error('Error al validar el acceso:', error);

            mostrarErrorAcceso(
                'No fue posible conectar con el servidor. Verifica que la API esté funcionando e inténtalo nuevamente.'
            );

        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = textoOriginal || 'Ingresar';
            }
        }
    }

    // ==========================================
    // MOSTRAR ERRORES DE ACCESO
    // ==========================================
    function mostrarErrorAcceso(mensaje) {
        const modal = document.getElementById('error-modal');

        if (modal) {
            const texto = modal.querySelector(
                '.modal-message, .modal-text, p'
            );

            if (texto) {
                texto.textContent = mensaje;
            }

            abrirModal('error-modal');
        } else {
            alert(mensaje);
        }
    }

    // ==========================================
    // SISTEMA DE MODALES
    // ==========================================
    function abrirModal(id) {
        const modal = document.getElementById(id);

        if (!modal) return;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    function cerrarModal(id) {
        const modal = document.getElementById(id);

        if (!modal) return;

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    function configurarCierreModales() {

        // Cerrar al hacer clic fuera de la tarjeta.
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', event => {
                if (event.target === overlay) {
                    cerrarModal(overlay.id);
                }
            });
        });

        // Cerrar con la tecla ESC.
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                    cerrarModal(modal.id);
                });
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