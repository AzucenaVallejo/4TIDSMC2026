  
        document.addEventListener('DOMContentLoaded', () => {
            setupKeyboardListener();
            setupModalBackdrop();
        });

        // Abre la pantalla de autenticación real.
        function openLogin() {
            window.location.href = 'login.html';
        }

        // Acceso a la modalidad de invitado.
        function handleGuestEntry() {
            window.location.href = 'guest.html';
        }

        // Muestra un aviso para funciones todavía no disponibles.
        function showBackendNotice(title, message) {
            const modal = document.getElementById('notice-modal');
            const titleElement = document.getElementById('notice-title');
            const textElement = document.getElementById('notice-text');

            if (!modal || !titleElement || !textElement) return;

            titleElement.textContent = title || 'Función no disponible';
            textElement.textContent = message ||
                'Esta funcionalidad estará disponible próximamente.';

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }

        // Cierra el modal indicado.
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);

            if (!modal) return;

            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }

        // Cierra el modal al pulsar fuera de su contenido.
        function setupModalBackdrop() {
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                overlay.addEventListener('click', event => {
                    if (event.target === overlay) {
                        closeModal(overlay.id);
                    }
                });
            });
        }

        // Permite cerrar los modales con Escape.
        function setupKeyboardListener() {
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                        closeModal(modal.id);
                    });
                }
            });
        }
