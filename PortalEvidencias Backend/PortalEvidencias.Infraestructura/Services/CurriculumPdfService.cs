
using System.Globalization;
using System.Net;
using System.Text;
using Microsoft.Playwright;
using PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;
using PortalEvidencias.Aplicacion.DTOs.Perfil;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Infraestructura.Services;

public class CurriculumPdfService : ICurriculumPdfService
{
    public CurriculumPdfService()
    {
    }

    public async Task<byte[]> GenerarPdfAsync(
        CurriculumPublicoDto curriculum,
        FotografiaPerfilResponseDto? fotografia)
    {
        ArgumentNullException.ThrowIfNull(curriculum);

        var html = ConstruirHtml(curriculum, fotografia);

        using var playwright = await Playwright.CreateAsync();

        await using var browser = await playwright.Chromium.LaunchAsync(
            new BrowserTypeLaunchOptions
            {
                Headless = true,
                Args =
                [
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--ignore-certificate-errors"
                ]
            });

        var page = await browser.NewPageAsync();

        await page.SetContentAsync(
            html,
            new PageSetContentOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle
            });

        await page.EmulateMediaAsync(
            new PageEmulateMediaOptions
            {
                Media = Media.Print
            });

        await page.EvaluateAsync(
            "() => document.fonts.ready");

        await page.EvaluateAsync(
            "() => Promise.all(Array.from(document.images).map(img => img.decode().catch(() => {})))");

        var pdf = await page.PdfAsync(
            new PagePdfOptions
            {
                Format = "Letter",
                PrintBackground = true,
                PreferCSSPageSize = true,
                Margin = new Margin
                {
                    Top = "0",
                    Right = "0",
                    Bottom = "0",
                    Left = "0"
                }
            });

        await browser.CloseAsync();

        return pdf;
    }

    private string ConstruirHtml(
        CurriculumPublicoDto curriculum,
        FotografiaPerfilResponseDto? fotografia)
    {
        var nombre = Texto(
            curriculum.Perfil?.NombreCompleto,
            curriculum.Nombre);

        var biografia = curriculum.Perfil?.Biografia;

        // La fotografía se incrusta directamente en el HTML.
        // No se realiza ninguna solicitud HTTP desde Chromium.
        string? fotografiaBase64 = null;

        bool mostrarFotografia =
            curriculum.ConfiguracionConstructor?.ShowPhoto == true;

        if (mostrarFotografia &&
            fotografia is not null &&
            fotografia.Contenido is { Length: > 0 } &&
            (
                fotografia.TipoContenido == "image/jpeg" ||
                fotografia.TipoContenido == "image/png" ||
                fotografia.TipoContenido == "image/webp"
            ))
        {
            fotografiaBase64 =
                $"data:{fotografia.TipoContenido};base64," +
                Convert.ToBase64String(fotografia.Contenido);
        }

        var html = new StringBuilder();

        html.Append("""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

            <style>
                @page {
                    size: letter portrait;
                    margin: 0;
                }

                * {
                    box-sizing: border-box;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                    width: 215.9mm;
                    min-height: 279.4mm;
                    background: #FFFFFF;
                    font-family: 'DM Sans', Arial, sans-serif;
                    color: #263746;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .a4-document {
                    --cv-navy: #142D46;
                    --cv-navy-soft: #1D405F;
                    --cv-accent: #B7C9D8;
                    --cv-text: #263746;
                    --cv-muted: #647586;
                    --cv-line: #DCE4EA;
                    --cv-sidebar-text: #F4F7FA;

                    width: 215.9mm;
                    min-height: 279.4mm;
                    display: flex;
                    padding: 0;
                    background: #FFFFFF;
                    color: var(--cv-text);
                    font-size: 10pt;
                    line-height: 1.5;
                    overflow: hidden;
                }

                .cv-sidebar {
                    width: 34%;
                    flex-shrink: 0;
                    padding: 34px 25px 38px;
                    background: var(--cv-navy);
                    color: var(--cv-sidebar-text);
                    display: flex;
                    flex-direction: column;
                    gap: 27px;
                }

                .cv-photo-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2px;
                }

                .cv-photo {
                    width: 122px;
                    height: 122px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid #FFFFFF;
                }

                .cv-sidebar-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    break-inside: avoid;
                }

                .cv-sidebar-title {
                    margin: 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255,255,255,.35);
                    color: #FFFFFF;
                    font-family: 'Manrope', sans-serif;
                    font-size: 10pt;
                    font-weight: 800;
                    letter-spacing: 1.25px;
                    text-transform: uppercase;
                }

                .cv-contact-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .cv-contact-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    color: var(--cv-sidebar-text);
                    font-size: 8.5pt;
                    line-height: 1.45;
                    overflow-wrap: anywhere;
                }

                .cv-contact-icon {
                    width: 23px;
                    height: 23px;
                    min-width: 23px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,.45);
                    border-radius: 50%;
                    color: #FFFFFF;
                    font-size: 9pt;
                    font-weight: 700;
                }

                .cv-sidebar-list {
                    margin: 0;
                    padding-left: 17px;
                    display: flex;
                    flex-direction: column;
                    gap: 9px;
                }

                .cv-sidebar-list li {
                    padding-left: 2px;
                    color: var(--cv-sidebar-text);
                    font-size: 9pt;
                    line-height: 1.45;
                }

                .cv-edu-item {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    break-inside: avoid;
                }

                .cv-edu-degree {
                    color: #FFFFFF;
                    font-size: 9.2pt;
                    font-weight: 700;
                    line-height: 1.4;
                }

                .cv-edu-school {
                    color: #DCE6EF;
                    font-size: 8.5pt;
                    line-height: 1.4;
                }

                .cv-edu-date {
                    color: var(--cv-accent);
                    font-size: 8pt;
                }

                .cv-main {
                    width: 66%;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    background: #FFFFFF;
                }

                .cv-main-header {
                    padding: 47px 38px 38px;
                    background: #F2F5F8;
                    border-bottom: 4px solid var(--cv-navy);
                }

                .cv-header-kicker {
                    margin: 0 0 12px;
                    color: var(--cv-muted);
                    font-family: 'Manrope', sans-serif;
                    font-size: 8pt;
                    font-weight: 700;
                    letter-spacing: 1.6px;
                    text-transform: uppercase;
                }

                .cv-name {
                    margin: 0;
                    color: var(--cv-navy);
                    font-family: 'Manrope', sans-serif;
                    font-size: 27pt;
                    font-weight: 800;
                    line-height: 1.08;
                    overflow-wrap: anywhere;
                    text-transform: uppercase;
                }

                .cv-main-body {
                    padding: 34px 38px 42px;
                    display: flex;
                    flex-direction: column;
                    gap: 27px;
                }

                .cv-section-main {
                    display: flex;
                    flex-direction: column;
                    gap: 13px;
                    break-inside: avoid;
                }

                .cv-main-title {
                    position: relative;
                    margin: 0;
                    padding-bottom: 9px;
                    border-bottom: 1px solid var(--cv-line);
                    color: var(--cv-navy);
                    font-family: 'Manrope', sans-serif;
                    font-size: 11pt;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .cv-main-title::after {
                    content: "";
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 42px;
                    height: 3px;
                    background: var(--cv-navy);
                }

                .cv-summary {
                    margin: 0;
                    color: var(--cv-text);
                    font-size: 9.2pt;
                    line-height: 1.7;
                    text-align: justify;
                    white-space: pre-line;
                }

                .cv-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 19px;
                }

                .cv-timeline-item {
                    padding-left: 15px;
                    border-left: 2px solid var(--cv-line);
                    break-inside: avoid;
                }

                .cv-item-title {
                    margin: 0 0 3px;
                    color: var(--cv-navy);
                    font-size: 10pt;
                    font-weight: 800;
                    line-height: 1.4;
                }

                .cv-item-subtitle {
                    margin: 0 0 3px;
                    color: var(--cv-navy-soft);
                    font-size: 9pt;
                    font-weight: 600;
                }

                .cv-item-date {
                    margin: 0 0 7px;
                    color: var(--cv-muted);
                    font-size: 8pt;
                }

                .cv-item-desc {
                    margin: 0;
                    color: var(--cv-text);
                    font-size: 8.8pt;
                    line-height: 1.6;
                    white-space: pre-line;
                }

                .cv-empty {
                    margin: 0;
                    color: var(--cv-muted);
                    font-size: 9pt;
                    font-style: italic;
                }
            </style>
        </head>

        <body>
            <div class="a4-document">

                <aside class="cv-sidebar">
        """);

        // FOTOGRAFÍA
        if (!string.IsNullOrWhiteSpace(fotografiaBase64))
        {
            html.Append($"""
                    <div class="cv-photo-wrapper">
                        <img class="cv-photo"
                             src="{Atributo(fotografiaBase64)}"
                             alt="Fotografía del propietario">
                    </div>
            """);
        }

        // CONTACTO
        if (!string.IsNullOrWhiteSpace(curriculum.Perfil?.Correo) ||
            !string.IsNullOrWhiteSpace(curriculum.Perfil?.Telefono))
        {
            html.Append("""
                    <section class="cv-sidebar-section">
                        <h2 class="cv-sidebar-title">Contacto</h2>
                        <div class="cv-contact-list">
            """);

            if (!string.IsNullOrWhiteSpace(curriculum.Perfil?.Correo))
            {
                html.Append($"""
                            <div class="cv-contact-item">
                                <span class="cv-contact-icon">@</span>
                                <span>{Html(curriculum.Perfil.Correo)}</span>
                            </div>
                """);
            }

            if (!string.IsNullOrWhiteSpace(curriculum.Perfil?.Telefono))
            {
                html.Append($"""
                            <div class="cv-contact-item">
                                <span class="cv-contact-icon">T</span>
                                <span>{Html(curriculum.Perfil.Telefono)}</span>
                            </div>
                """);
            }

            html.Append("""
                        </div>
                    </section>
            """);
        }

        // HABILIDADES
        if (curriculum.Habilidades.Count > 0)
        {
            html.Append("""
                    <section class="cv-sidebar-section">
                        <h2 class="cv-sidebar-title">Habilidades</h2>
                        <ul class="cv-sidebar-list">
            """);

            foreach (var habilidad in curriculum.Habilidades)
            {
                html.Append($"""
                            <li>
                                <strong>{Html(habilidad.Nombre)}</strong>
                                {(string.IsNullOrWhiteSpace(habilidad.Nivel) ? "" : $"<br><span>{Html(habilidad.Nivel)}</span>")}
                            </li>
                """);
            }

            html.Append("""
                        </ul>
                    </section>
            """);
        }

        // FORMACIÓN
        if (curriculum.Formacion.Count > 0)
        {
            html.Append("""
                    <section class="cv-sidebar-section">
                        <h2 class="cv-sidebar-title">Formación académica</h2>
            """);

            foreach (var formacion in curriculum.Formacion)
            {
                var estudios = string.IsNullOrWhiteSpace(formacion.Carrera)
                    ? formacion.NivelEducativo
                    : $"{formacion.NivelEducativo} en {formacion.Carrera}";

                html.Append($"""
                        <div class="cv-edu-item">
                            <div class="cv-edu-degree">{Html(estudios)}</div>
                            <div class="cv-edu-school">{Html(formacion.Institucion)}</div>
                            <div class="cv-edu-date">{Html(FechaRango(formacion.FechaInicio, formacion.FechaFin, formacion.EnCurso))}</div>
                        </div>
                """);
            }

            html.Append("""
                    </section>
            """);
        }

        html.Append("""
                </aside>

                <main class="cv-main">
                    <header class="cv-main-header">
                        <p class="cv-header-kicker">Currículum profesional</p>
                        <h1 class="cv-name">
        """);

        html.Append(Html(nombre));

        html.Append("""
                        </h1>
                    </header>

                    <div class="cv-main-body">
        """);

        // PERFIL
        if (!string.IsNullOrWhiteSpace(biografia))
        {
            html.Append($"""
                        <section class="cv-section-main">
                            <h2 class="cv-main-title">Perfil profesional</h2>
                            <p class="cv-summary">{Html(biografia)}</p>
                        </section>
            """);
        }

        // EXPERIENCIA
        if (curriculum.Experiencia.Count > 0)
        {
            html.Append("""
                        <section class="cv-section-main">
                            <h2 class="cv-main-title">Experiencia laboral</h2>
                            <div class="cv-timeline">
            """);

            foreach (var experiencia in curriculum.Experiencia)
            {
                var subtitulo = string.IsNullOrWhiteSpace(experiencia.Ubicacion)
                    ? experiencia.Empresa
                    : $"{experiencia.Empresa} · {experiencia.Ubicacion}";

                html.Append($"""
                                <article class="cv-timeline-item">
                                    <h3 class="cv-item-title">{Html(experiencia.Puesto)}</h3>
                                    <p class="cv-item-subtitle">{Html(subtitulo)}</p>
                                    <p class="cv-item-date">{Html(FechaRango(experiencia.FechaInicio, experiencia.FechaFin, experiencia.TrabajoActual))}</p>
                """);

                if (!string.IsNullOrWhiteSpace(experiencia.Descripcion))
                {
                    html.Append($"""
                                    <p class="cv-item-desc">{Html(experiencia.Descripcion)}</p>
                    """);
                }

                html.Append("""
                                </article>
                """);
            }

            html.Append("""
                            </div>
                        </section>
            """);
        }

        // PROYECTOS
        if (curriculum.Proyectos.Count > 0)
        {
            html.Append("""
                        <section class="cv-section-main">
                            <h2 class="cv-main-title">Proyectos</h2>
                            <div class="cv-timeline">
            """);

            foreach (var proyecto in curriculum.Proyectos)
            {
                html.Append($"""
                                <article class="cv-timeline-item">
                                    <h3 class="cv-item-title">{Html(proyecto.Nombre)}</h3>
                                    <p class="cv-item-date">{Html(FechaRango(proyecto.FechaInicio, proyecto.FechaFin, false))}</p>
                """);

                if (!string.IsNullOrWhiteSpace(proyecto.Descripcion))
                {
                    html.Append($"""
                                    <p class="cv-item-desc">{Html(proyecto.Descripcion)}</p>
                    """);
                }

                if (!string.IsNullOrWhiteSpace(proyecto.Tecnologias))
                {
                    html.Append($"""
                                    <p class="cv-item-subtitle">Tecnologías: {Html(proyecto.Tecnologias)}</p>
                    """);
                }

                html.Append("""
                                </article>
                """);
            }

            html.Append("""
                            </div>
                        </section>
            """);
        }

        html.Append("""
                    </div>
                </main>

            </div>
        </body>
        </html>
        """);

        return html.ToString();
    }

    private static string FechaRango(
        DateOnly? inicio,
        DateOnly? fin,
        bool actual)
    {
        var cultura = CultureInfo.GetCultureInfo("es-MX");

        var fechaInicio = inicio?.ToString("MMM yyyy", cultura);
        var fechaFin = actual
            ? "Actualidad"
            : fin?.ToString("MMM yyyy", cultura);

        if (string.IsNullOrWhiteSpace(fechaInicio) &&
            string.IsNullOrWhiteSpace(fechaFin))
        {
            return string.Empty;
        }

        if (string.IsNullOrWhiteSpace(fechaInicio))
            return fechaFin!;

        if (string.IsNullOrWhiteSpace(fechaFin))
            return fechaInicio;

        return $"{fechaInicio} — {fechaFin}";
    }

    private static string Texto(
        string? valor,
        string valorAlternativo)
    {
        return string.IsNullOrWhiteSpace(valor)
            ? valorAlternativo
            : valor;
    }

    private static string Html(string? valor)
    {
        return WebUtility.HtmlEncode(valor ?? string.Empty);
    }

    private static string Atributo(string valor)
    {
        return WebUtility.HtmlEncode(valor);
    }
}
