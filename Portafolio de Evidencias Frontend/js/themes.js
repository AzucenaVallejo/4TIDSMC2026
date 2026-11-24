
/*
 * Portal de Evidencias | Sistema global de temas
 *
 * No requiere css/themes.css.
 *
 * La base de datos es la fuente de verdad.
 *
 * Caché local:
 * - Almacena exclusivamente preferencias visuales.
 * - No almacena tokens ni información privada.
 * - Permite aplicar el último tema inmediatamente.
 *
 * Responsabilidades:
 * - Consultar las preferencias del usuario.
 * - Aplicar temas, acentos y preferencias visuales.
 * - Generar los estilos globales de banners y sidebar.
 * - Guardar cambios mediante la API.
 * - Comunicar cambios mediante eventos globales.
 */

(() => {
    "use strict";

    /* ==========================================
       CONFIGURACIÓN
    ========================================== */

    const API_BASE = (
        window.PORTAL_API_BASE ||
        "https://pureblood-starfish-happening.ngrok-free.dev/api"
    ).replace(/\/+$/, "");

    const API_URL = `${API_BASE}/Preferencias`;

    const STORAGE_KEY = "portal.preferences.visual.v1";

    const STYLE_ID = "portal-theme-visual-styles";

    const DEFAULTS = Object.freeze({
        tema: "classic",
        colorAcento: "#2A9D8F",
        tamanoTexto: "medium",
        reducirAnimaciones: false,
        densidadCompacta: false,
        notificacionesGenerales: true,
        recordatoriosPerfil: true,
        avisosEvidencias: true,
        idioma: "es"
    });

    const VISUAL_KEYS = Object.freeze([
        "tema",
        "colorAcento",
        "tamanoTexto",
        "reducirAnimaciones",
        "densidadCompacta",
        "idioma"
    ]);

    /* ==========================================
       CATÁLOGO CANÓNICO: 21 TEMAS
    ========================================== */

    const THEME_DATA = {
        classic: {
            name: "Clásico profesional",
            description: "Gris claro y verde azulado.",
            base: "#F4F6F8",
            surface: "#FFFFFF",
            hover: "#F8FAFC",
            border: "#E2E8F0",
            text: "#16324F",
            muted: "#5C6B73",
            accent: "#2A9D8F"
        },

        ocean: {
            name: "Océano",
            description: "Azules frescos y claros.",
            base: "#F0F8FF",
            surface: "#FFFFFF",
            hover: "#E6F3FA",
            border: "#CBE4F9",
            text: "#003366",
            muted: "#4D7399",
            accent: "#0284C7"
        },

        rose: {
            name: "Rosa elegante",
            description: "Rosas suaves y burdeos.",
            base: "#FFF0F3",
            surface: "#FFFFFF",
            hover: "#FFE4E8",
            border: "#FFCCD5",
            text: "#590D22",
            muted: "#A4133C",
            accent: "#FF4D6D"
        },

        forest: {
            name: "Bosque",
            description: "Verdes naturales.",
            base: "#F1F8E9",
            surface: "#FFFFFF",
            hover: "#E8F5E0",
            border: "#CFE3C3",
            text: "#264B1A",
            muted: "#557A45",
            accent: "#689F38"
        },

        coffee: {
            name: "Café",
            description: "Crema y caramelo.",
            base: "#F5EBE0",
            surface: "#FFFCF8",
            hover: "#FAF1E8",
            border: "#E3D5CA",
            text: "#4A3022",
            muted: "#7A5B49",
            accent: "#B87942"
        },

        midnight: {
            name: "Medianoche",
            description: "Morado oscuro y violeta.",
            base: "#10002B",
            surface: "#1A1230",
            hover: "#251A3A",
            border: "#392A50",
            text: "#EAE4F1",
            muted: "#B3A2C8",
            accent: "#8B6BB8"
        },

        abyss: {
            name: "Abismo",
            description: "Negro azulado y cian.",
            base: "#0B0C10",
            surface: "#171D24",
            hover: "#202A33",
            border: "#34434B",
            text: "#E5EAED",
            muted: "#AAB6BE",
            accent: "#4C9A9A"
        },

        monochrome: {
            name: "Monocromo",
            description: "Blanco, gris y negro.",
            base: "#F3F4F6",
            surface: "#FFFFFF",
            hover: "#E5E7EB",
            border: "#D1D5DB",
            text: "#111827",
            muted: "#4B5563",
            accent: "#374151"
        },

        lavender: {
            name: "Lavanda",
            description: "Violetas delicados.",
            base: "#F5F0FF",
            surface: "#FFFFFF",
            hover: "#EDE5FF",
            border: "#DDD0F7",
            text: "#39245B",
            muted: "#76618F",
            accent: "#8B5CF6"
        },

        sunset: {
            name: "Atardecer",
            description: "Naranja y tonos cálidos.",
            base: "#FFF4E8",
            surface: "#FFFFFF",
            hover: "#FFE8D1",
            border: "#F3D2B4",
            text: "#60351E",
            muted: "#986344",
            accent: "#E87936"
        },

        mint: {
            name: "Menta",
            description: "Verde menta suave.",
            base: "#ECFDF5",
            surface: "#FFFFFF",
            hover: "#D9FBEA",
            border: "#B8E8D0",
            text: "#14543D",
            muted: "#4C806B",
            accent: "#10B981"
        },

        crimson: {
            name: "Carmesí",
            description: "Rojo profundo y elegante.",
            base: "#FFF1F2",
            surface: "#FFFFFF",
            hover: "#FFE4E6",
            border: "#FECDD3",
            text: "#651B2B",
            muted: "#9F5260",
            accent: "#BE123C"
        },

        graphite: {
            name: "Grafito",
            description: "Grises modernos.",
            base: "#E9ECEF",
            surface: "#F8F9FA",
            hover: "#DEE2E6",
            border: "#CED4DA",
            text: "#212529",
            muted: "#59636E",
            accent: "#495057"
        },

        sapphire: {
            name: "Zafiro",
            description: "Azul intenso.",
            base: "#EFF4FF",
            surface: "#FFFFFF",
            hover: "#DFE9FF",
            border: "#C4D4F5",
            text: "#172B59",
            muted: "#536A9B",
            accent: "#3155B8"
        },

        emerald: {
            name: "Esmeralda",
            description: "Verde profundo.",
            base: "#ECFDF3",
            surface: "#FFFFFF",
            hover: "#D6F8E4",
            border: "#B7E5CA",
            text: "#164B32",
            muted: "#527C63",
            accent: "#059669"
        },

        sand: {
            name: "Arena",
            description: "Beige y tierra.",
            base: "#F8F3E9",
            surface: "#FFFDF8",
            hover: "#EFE7D8",
            border: "#E4D8C4",
            text: "#514332",
            muted: "#83745F",
            accent: "#A98251"
        },

        arctic: {
            name: "Ártico",
            description: "Blanco frío y azul hielo.",
            base: "#EFFAFF",
            surface: "#FFFFFF",
            hover: "#DFF4FA",
            border: "#C7E6EF",
            text: "#173B4A",
            muted: "#5A7D89",
            accent: "#0891B2"
        },

        plum: {
            name: "Ciruela",
            description: "Ciruela y malva.",
            base: "#F9F0F8",
            surface: "#FFFFFF",
            hover: "#F0DFF0",
            border: "#E5CBE2",
            text: "#512B4D",
            muted: "#896181",
            accent: "#A855A0"
        },

        olive: {
            name: "Oliva",
            description: "Verde oliva y natural.",
            base: "#F4F5E9",
            surface: "#FFFFFF",
            hover: "#E9EBD5",
            border: "#D8DDBA",
            text: "#42472A",
            muted: "#747B50",
            accent: "#7C8535"
        },

        nordic: {
            name: "Nórdico",
            description: "Azul grisáceo y minimalista.",
            base: "#EEF2F6",
            surface: "#FFFFFF",
            hover: "#E1E8EF",
            border: "#D0DAE4",
            text: "#263746",
            muted: "#647789",
            accent: "#54758F"
        },

        obsidian: {
            name: "Obsidiana",
            description: "Oscuro sobrio y neutro.",
            base: "#111315",
            surface: "#1B1E21",
            hover: "#25292D",
            border: "#363D43",
            text: "#CCD2D8",
            muted: "#7D8387",
            accent: "#6D7A85"
        }
    };

    /*
     * Catálogo único:
     * - Propiedades originales.
     * - Alias compatibles.
     * - Propiedades utilizadas por PortalTheme.
     */

    const DARK_THEMES = new Set([
        "midnight",
        "abyss",
        "obsidian"
    ]);

    const THEMES = Object.freeze(
        Object.entries(THEME_DATA).map(([id, theme]) =>
            Object.freeze({
                id,
                ...theme,

                background: theme.base,
                surfaceSoft: theme.hover,
                navy: theme.text,

                sidebar: DARK_THEMES.has(id)
                    ? theme.base
                    : theme.text
            })
        )
    );

    const LEGACY_THEMES = Object.freeze({
        light: "classic",
        dark: "midnight",
        auto: "classic"
    });

    const validThemes = new Set(
        THEMES.map(theme => theme.id)
    );

    /* ==========================================
       ESTADO INTERNO
    ========================================== */

    let preferences = { ...DEFAULTS };

    let loaded = false;
    let saving = false;

    let saveQueue = Promise.resolve();

    let preferenceRevision = 0;

    /* ==========================================
       CACHÉ LOCAL
    ========================================== */

    function getVisualPreferences(data = preferences) {
        return Object.fromEntries(
            VISUAL_KEYS.map(key => [
                key,
                data[key]
            ])
        );
    }

    function readLocalPreferences() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (!stored) {
                return null;
            }

            const parsed = JSON.parse(stored);

            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {
                return null;
            }

            return normalizePreferences(parsed);

        } catch (error) {
            console.warn(
                "No fue posible recuperar las preferencias locales.",
                error
            );

            return null;
        }
    }

    function saveLocalPreferences(data = preferences) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(getVisualPreferences(data))
            );

        } catch (error) {
            console.warn(
                "No fue posible guardar las preferencias visuales.",
                error
            );
        }
    }

    /* ==========================================
       NORMALIZACIÓN
    ========================================== */

    function normalizeTheme(value) {
        const theme = String(value || "").toLowerCase();

        if (validThemes.has(theme)) {
            return theme;
        }

        return LEGACY_THEMES[theme] || DEFAULTS.tema;
    }

    function normalizeAccent(
        value,
        fallback = DEFAULTS.colorAcento
    ) {
        return typeof value === "string" &&
            /^#[0-9a-fA-F]{6}$/.test(value)
            ? value
            : fallback;
    }

    function normalizeSize(value) {
        return ["small", "medium", "large"].includes(value)
            ? value
            : DEFAULTS.tamanoTexto;
    }

    function normalizePreferences(data = {}) {
        const tema = normalizeTheme(data.tema);

        const selectedTheme = THEMES.find(
            item => item.id === tema
        );

        return {
            tema,

            colorAcento: normalizeAccent(
                data.colorAcento,
                selectedTheme?.accent || DEFAULTS.colorAcento
            ),

            tamanoTexto: normalizeSize(data.tamanoTexto),

            reducirAnimaciones:
                data.reducirAnimaciones === true,

            densidadCompacta:
                data.densidadCompacta === true,

            notificacionesGenerales:
                data.notificacionesGenerales !== false,

            recordatoriosPerfil:
                data.recordatoriosPerfil !== false,

            avisosEvidencias:
                data.avisosEvidencias !== false,

            idioma: ["es", "en", "it"].includes(data.idioma)
                ? data.idioma
                : DEFAULTS.idioma
        };
    }

    /* ==========================================
       UTILIDADES DE COLOR
    ========================================== */

    function hexToRgb(hex) {
        const clean = normalizeAccent(hex).substring(1);

        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    }

    function shadeColor(hex, percent) {
        const { r, g, b } = hexToRgb(hex);

        const adjust = value => Math.max(
            0,
            Math.min(
                255,
                Math.round(value * (100 + percent) / 100)
            )
        );

        return "#" + [adjust(r), adjust(g), adjust(b)]
            .map(value => value.toString(16).padStart(2, "0"))
            .join("");
    }

    function getContrastColor({ r, g, b }) {
        const luminance =
            (0.299 * r) +
            (0.587 * g) +
            (0.114 * b);

        return luminance > 160
            ? "#172033"
            : "#FFFFFF";
    }

    function rgbaFromHex(hex, alpha = 1) {
        const { r, g, b } = hexToRgb(hex);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /* ==========================================
       GENERADOR DE ESTILOS VISUALES
    ========================================== */

    /*
     * Los estilos se generan desde JavaScript.
     *
     * BANNERS:
     * - Gradientes radiales.
     * - Reflejos superiores y laterales.
     * - Profundidad inferior.
     * - Transición entre colores del tema.
     * - Sombras moderadas.
     *
     * SIDEBAR:
     * - Transparencia controlada.
     * - Desenfoque moderado.
     * - Borde discreto.
     * - Contraste adaptativo.
     *
     * No se aplican efectos de cristal a todas
     * las tarjetas ni a todos los contenedores.
     */

    function injectThemeStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");

        style.id = STYLE_ID;

        style.textContent = `

            /* ======================================
               VARIABLES VISUALES GLOBALES
            ====================================== */

            :root {
                --theme-banner-background:
                    linear-gradient(
                        118deg,
                        var(--theme-banner-start) 0%,
                        var(--theme-banner-middle) 48%,
                        var(--theme-banner-end) 100%
                    );

                --theme-banner-shadow:
                    0 18px 42px rgba(20, 30, 45, .15),
                    0 5px 15px rgba(20, 30, 45, .08);

                --theme-sidebar-blur: 16px;

                --theme-sidebar-opacity: .90;
            }

            /* ======================================
               BANNERS GLOBALES
            ====================================== */

            :is(
                .welcome-panel,
                .page-banner,
                .dashboard-banner,
                .content-banner,
                .profile-banner,
                .section-banner,
                .hero-banner,
                [class*="banner-"],
                [class$="-banner"]
            ) {
                position: relative;

                isolation: isolate;

                background:
                    radial-gradient(
                        ellipse at 18% -20%,
                        rgba(255, 255, 255, .24),
                        transparent 48%
                    ),

                    radial-gradient(
                        ellipse at 95% 12%,
                        rgba(255, 255, 255, .17),
                        transparent 34%
                    ),

                    radial-gradient(
                        ellipse at 10% 110%,
                        rgba(0, 0, 0, .19),
                        transparent 48%
                    ),

                    radial-gradient(
                        ellipse at 72% 90%,
                        var(--theme-primary-soft),
                        transparent 52%
                    ),

                    linear-gradient(
                        118deg,
                        var(--theme-banner-start) 0%,
                        var(--theme-banner-middle) 48%,
                        var(--theme-banner-end) 100%
                    );

                color: #FFFFFF;

                border-color: rgba(255, 255, 255, .20);

                box-shadow:
                    0 18px 42px rgba(20, 30, 45, .15),
                    0 5px 15px rgba(20, 30, 45, .08),
                    inset 0 1px 0 rgba(255, 255, 255, .20);

                background-repeat: no-repeat;
            }

            /* Evita que el contenido quede debajo
               de los elementos decorativos. */

            :is(
                .welcome-panel,
                .page-banner,
                .dashboard-banner,
                .content-banner,
                .profile-banner,
                .section-banner,
                .hero-banner,
                [class*="banner-"],
                [class$="-banner"]
            ) > * {
                position: relative;
                z-index: 1;
            }

            /* Texto de banners */

            :is(
                .welcome-panel,
                .page-banner,
                .dashboard-banner,
                .content-banner,
                .profile-banner,
                .section-banner,
                .hero-banner,
                [class*="banner-"],
                [class$="-banner"]
            ) :is(h1, h2, h3, h4, p, span, small, label) {
                color: inherit;
            }

            /* Los textos secundarios conservan
               una jerarquía visual legible. */

            :is(
                .welcome-panel,
                .page-banner,
                .dashboard-banner,
                .content-banner,
                .profile-banner,
                .section-banner,
                .hero-banner,
                [class*="banner-"],
                [class$="-banner"]
            ) :is(p, small) {
                color: rgba(255, 255, 255, .84);
            }

            /* ======================================
               SIDEBAR: TRANSPARENCIA CONTROLADA
            ====================================== */

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) {
                background:
                    linear-gradient(
                        155deg,
                        rgba(255, 255, 255, .055),
                        transparent 42%
                    ),
                    linear-gradient(
                        180deg,
                        color-mix(
                            in srgb,
                            var(--sidebar-background) 91%,
                            transparent
                        ),
                        color-mix(
                            in srgb,
                            var(--sidebar-background) 96%,
                            transparent
                        )
                    );

                -webkit-backdrop-filter:
                    blur(var(--theme-sidebar-blur));

                backdrop-filter:
                    blur(var(--theme-sidebar-blur));

                border-color: var(--sidebar-border);

                box-shadow:
                    8px 0 28px rgba(15, 23, 42, .07),
                    inset -1px 0 0 rgba(255, 255, 255, .06);

                color: var(--sidebar-text);
            }

            /* Encabezado de la sidebar */

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) :is(
                .sidebar-header,
                .sidebar-brand,
                .brand-container,
                .sidebar-top
            ) {
                background: transparent;
                border-color: var(--sidebar-border);
            }

            /* Enlaces */

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) :is(
                .nav-link,
                .sidebar-link,
                .menu-link
            ) {
                color: var(--sidebar-link);
                transition:
                    background-color .22s ease,
                    color .22s ease,
                    transform .22s ease;
            }

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) :is(
                .nav-link,
                .sidebar-link,
                .menu-link
            ):hover {
                color: var(--sidebar-text);

                background: var(--sidebar-link-hover);
            }

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) :is(
                .nav-link,
                .sidebar-link,
                .menu-link
            ).active {
                color: var(--sidebar-link-active-text);

                background:
                    linear-gradient(
                        115deg,
                        var(--theme-primary),
                        var(--theme-primary-hover)
                    );

                box-shadow:
                    0 4px 12px rgba(0, 0, 0, .10);
            }

            /* Etiquetas y separadores */

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) :is(
                .sidebar-label,
                .nav-section-title,
                .menu-section-title
            ) {
                color: var(--sidebar-label);
            }

            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) hr {
                border-color: var(--sidebar-border);
                opacity: .75;
            }

            /* ======================================
               AJUSTES DE TRANSICIÓN
            ====================================== */

            :is(
                .welcome-panel,
                .page-banner,
                .dashboard-banner,
                .content-banner,
                .profile-banner,
                .section-banner,
                .hero-banner,
                [class*="banner-"],
                [class$="-banner"]
            ),
            :is(
                .sidebar,
                .app-sidebar,
                .main-sidebar,
                .dashboard-sidebar,
                .sidebar-container
            ) {
                transition:
                    background-color .25s ease,
                    border-color .25s ease,
                    box-shadow .25s ease,
                    color .25s ease;
            }

            /* ======================================
               MOVIMIENTO REDUCIDO
            ====================================== */

            .reduce-motion *,
            .theme-reduced-motion * {
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: .01ms !important;
            }

            /* ======================================
               DENSIDAD COMPACTA
            ====================================== */

            .compact-density .welcome-panel,
            .theme-compact .welcome-panel {
                padding-top: 25px;
                padding-bottom: 25px;
            }

            /* ======================================
               COMPATIBILIDAD CON NAVEGADORES
            ====================================== */

            @supports not (
                (backdrop-filter: blur(1px)) or
                (-webkit-backdrop-filter: blur(1px))
            ) {
                :is(
                    .sidebar,
                    .app-sidebar,
                    .main-sidebar,
                    .dashboard-sidebar,
                    .sidebar-container
                ) {
                    background: var(--sidebar-background);
                }
            }

            /* ======================================
               RESPONSIVE
            ====================================== */

            @media (max-width: 768px) {
                :is(
                    .sidebar,
                    .app-sidebar,
                    .main-sidebar,
                    .dashboard-sidebar,
                    .sidebar-container
                ) {
                    box-shadow:
                        0 12px 30px rgba(15, 23, 42, .12),
                        inset -1px 0 0 rgba(255, 255, 255, .06);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                :is(
                    .welcome-panel,
                    .page-banner,
                    .dashboard-banner,
                    .content-banner,
                    .profile-banner,
                    .section-banner,
                    .hero-banner,
                    [class*="banner-"],
                    [class$="-banner"]
                ),
                :is(
                    .sidebar,
                    .app-sidebar,
                    .main-sidebar,
                    .dashboard-sidebar,
                    .sidebar-container
                ) {
                    transition: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ==========================================
       APLICACIÓN DE PALETA
    ========================================== */

    function applyPalette(themeId, accentOverride = null) {
        const root = document.documentElement;

        const theme = THEMES.find(
            item => item.id === normalizeTheme(themeId)
        ) || THEMES[0];

        const accent = normalizeAccent(
            accentOverride || theme.accent,
            theme.accent
        );

        const rgb = hexToRgb(accent);

        const primaryHover = shadeColor(accent, -14);

        const primarySoft =
            `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .14)`;

        const sidebarRgb = hexToRgb(theme.sidebar);

        const sidebarText = getContrastColor(sidebarRgb);

        const sidebarMuted = sidebarText === "#FFFFFF"
            ? "rgba(255, 255, 255, .68)"
            : "rgba(23, 32, 51, .68)";

        const sidebarLabel = sidebarText === "#FFFFFF"
            ? "rgba(255, 255, 255, .52)"
            : "rgba(23, 32, 51, .55)";

        const sidebarLink = sidebarText === "#FFFFFF"
            ? "rgba(255, 255, 255, .82)"
            : "rgba(23, 32, 51, .82)";

        const sidebarHover = sidebarText === "#FFFFFF"
            ? "rgba(255, 255, 255, .10)"
            : "rgba(23, 32, 51, .09)";

        const primaryText = getContrastColor(rgb);

        const variables = {
            /* PALETA PRINCIPAL */

            "--background": theme.background,
            "--surface": theme.surface,
            "--surface-soft": theme.surfaceSoft,
            "--text": theme.text,
            "--muted": theme.muted,
            "--border": theme.border,
            "--navy": theme.navy,
            "--navy-deep": theme.sidebar,

            /* COMPATIBILIDAD */

            "--theme-base": theme.base,
            "--theme-surface": theme.surface,
            "--theme-surface-hover": theme.hover,
            "--theme-text-main": theme.text,
            "--theme-text-muted": theme.muted,
            "--theme-border": theme.border,

            /* ACENTO */

            "--teal": accent,
            "--theme-primary": accent,
            "--theme-primary-hover": primaryHover,
            "--theme-primary-soft": primarySoft,
            "--theme-primary-text": primaryText,

            /* COLORES SECUNDARIOS */

            "--blue": theme.navy,
            "--blue-light": theme.surfaceSoft,
            "--teal-light": primarySoft,

            /* SIDEBAR */

            "--sidebar-background": theme.sidebar,
            "--sidebar-text": sidebarText,
            "--sidebar-text-muted": sidebarMuted,
            "--sidebar-label": sidebarLabel,
            "--sidebar-link": sidebarLink,
            "--sidebar-link-hover": sidebarHover,

            "--sidebar-link-active": accent,
            "--sidebar-link-active-text": primaryText,

            "--sidebar-brand-background": primarySoft,
            "--sidebar-brand-icon": accent,

            "--sidebar-border": sidebarText === "#FFFFFF"
                ? "rgba(255, 255, 255, .15)"
                : "rgba(23, 32, 51, .15)",

            /* BANNERS */

            "--theme-banner-start": theme.sidebar,
            "--theme-banner-middle": theme.navy,
            "--theme-banner-end": accent,

            "--banner-gradient-start": theme.sidebar,
            "--banner-gradient-middle": theme.navy,
            "--banner-gradient-end": accent,
            "--banner-text": "#FFFFFF",

            /* EFECTOS GLOBALES */

            "--theme-banner-shadow":
                "0 18px 42px rgba(20, 30, 45, .15)",

            "--theme-sidebar-blur": "16px"
        };

        Object.entries(variables).forEach(([name, value]) => {
            root.style.setProperty(name, value);
        });

        root.dataset.theme = theme.id;

        const metaTheme = document.querySelector(
            'meta[name="theme-color"]'
        );

        if (metaTheme) {
            metaTheme.content = theme.base;
        }
    }

    /* ==========================================
       APLICACIÓN DE PREFERENCIAS
    ========================================== */

    function applyPreferences(data = {}, notify = true) {
        preferences = normalizePreferences({
            ...preferences,
            ...data
        });

        const root = document.documentElement;
        const body = document.body;

        injectThemeStyles();

        applyPalette(
            preferences.tema,
            preferences.colorAcento
        );

        /* TAMAÑO DE TEXTO */

        const fontSizes = {
            small: "14px",
            medium: "16px",
            large: "18px"
        };

        const fontSize =
            fontSizes[preferences.tamanoTexto];

        root.style.setProperty(
            "--theme-font-size",
            fontSize
        );

        root.style.fontSize = fontSize;

        root.dataset.textSize =
            preferences.tamanoTexto;

        /* MOVIMIENTO */

        root.classList.toggle(
            "reduce-motion",
            preferences.reducirAnimaciones
        );

        body?.classList.toggle(
            "theme-reduced-motion",
            preferences.reducirAnimaciones
        );

        /* DENSIDAD */

        root.classList.toggle(
            "compact-density",
            preferences.densidadCompacta
        );

        body?.classList.toggle(
            "theme-compact",
            preferences.densidadCompacta
        );

        /* IDIOMA */

        root.lang = preferences.idioma;

        /* EVENTO GLOBAL */

        if (notify) {
            document.dispatchEvent(
                new CustomEvent("portal:preferences-applied", {
                    detail: { ...preferences }
                })
            );
        }

        return { ...preferences };
    }

    /* ==========================================
       COMUNICACIÓN CON LA API
    ========================================== */

    async function apiRequest(url, options = {}) {
        const headers = new Headers(options.headers || {});

        headers.set(
            "ngrok-skip-browser-warning",
            "true"
        );

        if (
            options.body &&
            !headers.has("Content-Type")
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );
        }

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: "include"
        });

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            const error = new Error(
                "La sesión no está autenticada o ha expirado."
            );

            error.status = response.status;

            throw error;
        }

        if (!response.ok) {
            const detail = await response.text().catch(() => "");

            const error = new Error(
                detail || `Error HTTP ${response.status}`
            );

            error.status = response.status;

            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        const text = await response.text();

        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);

        } catch {
            throw new Error(
                "La API devolvió una respuesta que no contiene JSON válido."
            );
        }
    }

    /* ==========================================
       CARGAR PREFERENCIAS
    ========================================== */

    async function loadPreferences() {
        const revisionAtStart = preferenceRevision;

        try {
            const response = await apiRequest(API_URL, {
                method: "GET"
            });

            if (
                revisionAtStart !== preferenceRevision
            ) {
                return {
                    ok: true,
                    preferences: { ...preferences },
                    skipped: true
                };
            }

            preferences = normalizePreferences(
                response || DEFAULTS
            );

            loaded = true;

            saveLocalPreferences(preferences);

            applyPreferences(preferences);

            return {
                ok: true,
                preferences: { ...preferences }
            };

        } catch (error) {
            loaded = false;

            document.dispatchEvent(
                new CustomEvent("portal:preferences-error", {
                    detail: error
                })
            );

            return {
                ok: false,
                error
            };
        }
    }

    /* ==========================================
       GUARDAR PREFERENCIAS
    ========================================== */

    async function savePreferences(changes = {}) {
        const next = normalizePreferences({
            ...preferences,
            ...changes
        });

        preferenceRevision++;

        const currentRevision = preferenceRevision;

        /* ACTUALIZACIÓN VISUAL INMEDIATA */

        preferences = next;

        applyPreferences(next);

        saveLocalPreferences(next);

        const payload = { ...next };

        /* COLA DE GUARDADO */

        const operation = saveQueue
            .catch(() => undefined)
            .then(async () => {
                saving = true;

                try {
                    const response = await apiRequest(API_URL, {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    });

                    const serverPreferences =
                        normalizePreferences(
                            response || payload
                        );

                    loaded = true;

                    if (
                        currentRevision === preferenceRevision
                    ) {
                        preferences = serverPreferences;

                        saveLocalPreferences(preferences);

                        applyPreferences(preferences);
                    }

                    document.dispatchEvent(
                        new CustomEvent("portal:preferences-saved", {
                            detail: { ...preferences }
                        })
                    );

                    return {
                        ok: true,
                        preferences: { ...preferences }
                    };

                } catch (error) {
                    document.dispatchEvent(
                        new CustomEvent("portal:preferences-error", {
                            detail: error
                        })
                    );

                    return {
                        ok: false,
                        error
                    };

                } finally {
                    saving = false;
                }
            });

        saveQueue = operation;

        return operation;
    }

    /* ==========================================
       RESTABLECER PREFERENCIAS
    ========================================== */

    async function resetPreferences() {
        preferenceRevision++;

        const currentRevision = preferenceRevision;

        try {
            const response = await apiRequest(
                `${API_URL}/restablecer`,
                { method: "POST" }
            );

            if (
                currentRevision !== preferenceRevision
            ) {
                return {
                    ok: true,
                    preferences: { ...preferences },
                    skipped: true
                };
            }

            preferences = normalizePreferences(
                response || DEFAULTS
            );

            loaded = true;

            saveLocalPreferences(preferences);

            applyPreferences(preferences);

            document.dispatchEvent(
                new CustomEvent("portal:preferences-reset", {
                    detail: { ...preferences }
                })
            );

            return {
                ok: true,
                preferences: { ...preferences }
            };

        } catch (error) {
            document.dispatchEvent(
                new CustomEvent("portal:preferences-error", {
                    detail: error
                })
            );

            return {
                ok: false,
                error
            };
        }
    }

    /* ==========================================
       MÉTODOS PÚBLICOS
    ========================================== */

    function setTheme(themeId) {
        const theme = THEMES.find(
            item => item.id === themeId
        );

        if (!theme) {
            throw new Error(
                `Tema no válido: ${themeId}`
            );
        }

        return savePreferences({
            tema: themeId,
            colorAcento: theme.accent
        });
    }

    function setAccent(color) {
        if (!/^#[0-9a-fA-F]{6}$/.test(color || "")) {
            throw new Error(
                "El color debe tener formato hexadecimal #RRGGBB."
            );
        }

        return savePreferences({
            colorAcento: color
        });
    }

    function setTextSize(size) {
        if (
            !["small", "medium", "large"].includes(size)
        ) {
            throw new Error(
                "Tamaño de texto no válido."
            );
        }

        return savePreferences({
            tamanoTexto: size
        });
    }

    function getPreferences() {
        return { ...preferences };
    }

    /* ==========================================
       API PÚBLICA DEL SISTEMA
    ========================================== */

    window.PortalTheme = Object.freeze({
        load: loadPreferences,
        save: savePreferences,
        reset: resetPreferences,

        setTheme,
        setAccent,
        setTextSize,

        apply: applyPreferences,
        applyPalette,

        getPreferences,

        injectStyles: injectThemeStyles,

        get loaded() {
            return loaded;
        },

        get saving() {
            return saving;
        },

        themes: THEMES
    });

    /* ==========================================
       INICIALIZACIÓN VISUAL INMEDIATA
    ========================================== */

    /*
     * Recuperamos las preferencias visuales
     * antes de esperar cualquier petición HTTP.
     *
     * Las preferencias funcionales mantienen
     * sus valores predeterminados hasta recibir
     * la información correspondiente del servidor.
     *
     * No se ejecuta ninguna petición automática.
     * Cada página ejecuta PortalTheme.load()
     * después de validar la sesión.
     */

    injectThemeStyles();

    const cachedPreferences = readLocalPreferences();

    if (cachedPreferences) {
        preferences = normalizePreferences({
            ...DEFAULTS,
            ...cachedPreferences
        });

        applyPreferences(preferences, false);

    } else {
        applyPreferences(DEFAULTS, false);
    }

})();
