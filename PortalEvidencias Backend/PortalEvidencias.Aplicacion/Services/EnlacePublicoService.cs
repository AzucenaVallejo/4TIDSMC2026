
using PortalEvidencias.Aplicacion.DTOs.Curriculum;
using PortalEvidencias.Aplicacion.DTOs.Documentos;
using PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;
using System.Linq;
using System.Text.Json;
using System.Security.Cryptography;
using PortalEvidencias.Aplicacion.DTOs.Perfil;

namespace PortalEvidencias.Aplicacion.Services;

public class EnlacePublicoService : IEnlacePublicoService
{
    private readonly IEnlacePublicoRepository _enlaceRepository;
    private readonly IDocumentoRepository _documentoRepository;
    private readonly ICurriculumService _curriculumService;
    private readonly IPerfilService _perfilService;
    private readonly IFormacionService _formacionService;
    private readonly IExperienciaService _experienciaService;
    private readonly IActividadService _actividadService;
    private readonly IProyectoService _proyectoService;
    private readonly IPracticaService _practicaService;
    private readonly IHabilidadService _habilidadService;
    private readonly IInteresService _interesService;
    private readonly IConfiguracionPrivacidadService _privacidadService;
    private readonly IVisitaEnlacePublicoService _visitaService;
    private readonly ICurriculumPdfService _curriculumPdfService;
    private readonly ICurriculumRepository _curriculumRepository;
    private readonly IUsuarioRepository _usuarioRepository;
    private const string TipoConfiguracion = "ConfiguracionConstructor";

    private const string AlfabetoCodigo =
        "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    public EnlacePublicoService(
        IEnlacePublicoRepository enlaceRepository,
        IDocumentoRepository documentoRepository,
        ICurriculumService curriculumService,
        IPerfilService perfilService,
        IFormacionService formacionService,
        IExperienciaService experienciaService,
        IActividadService actividadService,
        IProyectoService proyectoService,
        IPracticaService practicaService,
        IHabilidadService habilidadService,
        IInteresService interesService,
        IConfiguracionPrivacidadService privacidadService,
        IVisitaEnlacePublicoService visitaService,
        ICurriculumPdfService curriculumPdfService,
        ICurriculumRepository curriculumRepository,
        IUsuarioRepository usuarioRepository)
    {
        _enlaceRepository = enlaceRepository;
        _documentoRepository = documentoRepository;
        _curriculumService = curriculumService;
        _perfilService = perfilService;
        _formacionService = formacionService;
        _experienciaService = experienciaService;
        _actividadService = actividadService;
        _proyectoService = proyectoService;
        _practicaService = practicaService;
        _habilidadService = habilidadService;
        _interesService = interesService;
        _privacidadService = privacidadService;
        _visitaService = visitaService;
        _curriculumPdfService = curriculumPdfService;
        _curriculumRepository = curriculumRepository;
        _usuarioRepository = usuarioRepository;
    }

    public async Task<EnlacePublicoResponseDto> CrearAsync(
        int usuarioId,
        CrearEnlaceRequestDto dto)
    {
        if (usuarioId <= 0)
            throw new ArgumentException(
                "El usuario autenticado no es válido.");

        if (dto.CurriculumId <= 0)
            throw new ArgumentException(
                "Debes indicar un currículum válido.");

        if (dto.FechaExpiracion.HasValue &&
            dto.FechaExpiracion.Value <= DateTime.UtcNow)
        {
            throw new ArgumentException(
                "La fecha de expiración debe ser futura.");
        }

        var curriculum = await _curriculumService.ObtenerPorIdAsync(
            dto.CurriculumId,
            usuarioId);

        if (curriculum is null)
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");

        if (!curriculum.EsPublico)
            throw new InvalidOperationException(
                "Debes publicar el currículum antes de generar un enlace público.");

        var token = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32));

        var codigoAcceso = await GenerarCodigoAccesoUnicoAsync();

        var enlace = new EnlacePublico
        {
            UsuarioId = usuarioId,
            CurriculumId = dto.CurriculumId,
            Token = token,
            CodigoAcceso = codigoAcceso,
            Estado = EstadoEnlacePublico.Activo,
            FechaCreacion = DateTime.UtcNow,
            FechaExpiracion = dto.FechaExpiracion.HasValue
                ? DateTime.SpecifyKind(
                    dto.FechaExpiracion.Value,
                    DateTimeKind.Utc)
                : null,
            PermitirDescarga = dto.PermitirDescarga
        };

        await _enlaceRepository.AgregarAsync(enlace);
        await _enlaceRepository.GuardarCambiosAsync();

        return MapearRespuesta(enlace);
    }

    public async Task<List<EnlacePublicoResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        var enlaces = await _enlaceRepository
            .ObtenerPorUsuarioAsync(usuarioId);

        return enlaces
            .OrderByDescending(e => e.FechaCreacion)
            .Select(MapearRespuesta)
            .ToList();
    }

    public async Task<EnlacePublicoResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        var enlace = await _enlaceRepository.ObtenerPorIdAsync(id);

        if (enlace is null || enlace.UsuarioId != usuarioId)
            return null;

        return MapearRespuesta(enlace);
    }

    public async Task<CurriculumPublicoDto> ConsultarPorTokenAsync(
        string token)
    {
        var enlace = await ObtenerEnlaceActivoAsync(token);

        var resultado = await ConstruirCurriculumPublicoAsync(
            enlace,
            token);

        await _visitaService.RegistrarVisualizacionAsync(
            enlace.Id,
            null);

        return resultado;
    }

    public async Task<FotografiaPerfilResponseDto?> ConsultarFotografiaPorTokenAsync(
        string token)
    {
        var enlace = await ObtenerEnlaceActivoAsync(token);

        await ObtenerCurriculumPublicadoAsync(enlace);

        var curriculumEntidad =
            await _curriculumRepository.ObtenerPorIdConSeccionesAsync(
                enlace.CurriculumId);

        if (curriculumEntidad is null ||
            curriculumEntidad.UsuarioId != enlace.UsuarioId)
        {
            throw new KeyNotFoundException(
                "El currículum público no está disponible.");
        }

        var seccionConfiguracion = curriculumEntidad.Secciones
            .FirstOrDefault(s =>
                string.Equals(
                    s.TipoSeccion,
                    TipoConfiguracion,
                    StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(seccionConfiguracion?.Configuracion))
            return null;

        ConfiguracionCurriculumDto? configuracion;

        try
        {
            configuracion =
                JsonSerializer.Deserialize<ConfiguracionCurriculumDto>(
                    seccionConfiguracion.Configuracion,
                    JsonOptions);
        }
        catch (JsonException)
        {
            throw new InvalidOperationException(
                "La configuración guardada del currículum no tiene un formato válido.");
        }

        if (configuracion is null || !configuracion.ShowPhoto)
            return null;

        var fotografia = await _perfilService.ObtenerFotografiaAsync(
            enlace.UsuarioId);

        return fotografia;
    }

    private async Task<CurriculumPublicoDto> ConstruirCurriculumPublicoAsync(
    EnlacePublico enlace,
    string token)
    {
        var curriculum = await _curriculumService.ObtenerPorIdAsync(
            enlace.CurriculumId,
            enlace.UsuarioId);

        if (curriculum is null || !curriculum.EsPublico)
            throw new KeyNotFoundException(
                "El currículum público no está disponible.");

        // Recuperar la entidad con la configuración del constructor.
        var curriculumEntidad =
            await _curriculumRepository.ObtenerPorIdConSeccionesAsync(
                enlace.CurriculumId);

        if (curriculumEntidad is null ||
            curriculumEntidad.UsuarioId != enlace.UsuarioId)
        {
            throw new KeyNotFoundException(
                "El currículum público no está disponible.");
        }

        // Recuperar la configuración guardada.
        var seccionConfiguracion = curriculumEntidad.Secciones
            .FirstOrDefault(s =>
                string.Equals(
                    s.TipoSeccion,
                    TipoConfiguracion,
                    StringComparison.OrdinalIgnoreCase));

        ConfiguracionCurriculumDto? configuracion = null;

        if (!string.IsNullOrWhiteSpace(seccionConfiguracion?.Configuracion))
        {
            try
            {
                configuracion =
                    JsonSerializer.Deserialize<ConfiguracionCurriculumDto>(
                        seccionConfiguracion.Configuracion,
                        JsonOptions);
            }
            catch (JsonException)
            {
                throw new InvalidOperationException(
                    "La configuración guardada del currículum no tiene un formato válido.");
            }
        }

        // Si no existe configuración, las listas quedan vacías.
        configuracion ??= new ConfiguracionCurriculumDto();

        // Convertir las selecciones a conjuntos para filtrar por ID.
        var formacionesSeleccionadas = new HashSet<string>(
            configuracion.SelectedEducation ?? [],
            StringComparer.Ordinal);

        var experienciasSeleccionadas = new HashSet<string>(
            configuracion.SelectedExperience ?? [],
            StringComparer.Ordinal);

        var habilidadesSeleccionadas = new HashSet<string>(
            configuracion.SelectedSkills ?? [],
            StringComparer.Ordinal);

        var proyectosSeleccionados = new HashSet<string>(
            configuracion.SelectedProjects ?? [],
            StringComparer.Ordinal);

        // Recuperar las secciones habilitadas.
        var visibles = curriculum.Secciones
            .Where(s => s.Visible)
            .Select(s => Normalizar(s.TipoSeccion))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var seccionesVisibles = curriculum.Secciones
            .Where(s =>
                s.Visible &&
                !string.Equals(
                    s.TipoSeccion,
                    TipoConfiguracion,
                    StringComparison.OrdinalIgnoreCase))
            .Select(s => s.TipoSeccion)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var resultado = new CurriculumPublicoDto
        {
            Nombre = curriculum.Nombre,
            SeccionesVisibles = seccionesVisibles,
            ConfiguracionConstructor = configuracion
        };

        // PERFIL
        var perfil = await _perfilService.ObtenerPorUsuarioAsync(
            enlace.UsuarioId);

        if (perfil is not null)
        {
            // Recuperar el correo del propietario únicamente si está permitido.
            var usuario = configuracion.ShowEmail
                ? await _usuarioRepository.ObtenerPorIdAsync(
                    enlace.UsuarioId)
                : null;

            resultado.Perfil = new PerfilPublicoDto
            {
                NombreCompleto = perfil.NombreCompleto,
                Biografia = perfil.Biografia,

                RutaFotografia = configuracion.ShowPhoto
                    ? $"/api/EnlacesPublicos/publico/{token}/fotografia"
                    : null,

                Correo = configuracion.ShowEmail
                    ? usuario?.Correo
                    : null,

                Telefono = configuracion.ShowPhone
                    ? perfil.Telefono
                    : null
            };
        }

        // FORMACIÓN ACADÉMICA
        if (visibles.Contains("formacion") ||
            visibles.Contains("formacionacademica"))
        {
            var formaciones = await _formacionService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            foreach (var f in formaciones.Where(f =>
                formacionesSeleccionadas.Contains(f.Id.ToString())))
            {
                var formacionPublica = new FormacionPublicaDto
                {
                    Id = f.Id,
                    Institucion = f.Institucion,
                    NivelEducativo = f.NivelEducativo,
                    Carrera = f.Carrera,
                    Descripcion = f.Descripcion,
                    FechaInicio = f.FechaInicio,
                    FechaFin = f.FechaFin,
                    EnCurso = f.EnCurso
                };

                var certificado = await MapearDocumentoPublicoAsync(
                    f.DocumentoCertificadoId,
                    enlace.UsuarioId,
                    token);

                var titulo = await MapearDocumentoPublicoAsync(
                    f.DocumentoTituloId,
                    enlace.UsuarioId,
                    token);

                if (certificado is not null)
                    formacionPublica.Documentos.Add(certificado);

                if (titulo is not null)
                    formacionPublica.Documentos.Add(titulo);

                resultado.Formacion.Add(formacionPublica);
            }
        }

        // EXPERIENCIA LABORAL
        if (visibles.Contains("experiencia"))
        {
            var experiencias = await _experienciaService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            foreach (var e in experiencias.Where(e =>
                experienciasSeleccionadas.Contains(e.Id.ToString())))
            {
                var experienciaPublica = new ExperienciaPublicaDto
                {
                    Id = e.Id,
                    Empresa = e.Empresa,
                    Puesto = e.Puesto,
                    Tipo = e.Tipo.ToString(),
                    Modalidad = e.Modalidad.ToString(),
                    Ubicacion = e.Ubicacion,
                    Descripcion = e.Descripcion,
                    FechaInicio = e.FechaInicio,
                    FechaFin = e.FechaFin,
                    TrabajoActual = e.TrabajoActual
                };

                experienciaPublica.Documento =
                    await MapearDocumentoPublicoAsync(
                        e.DocumentoId,
                        enlace.UsuarioId,
                        token);

                resultado.Experiencia.Add(experienciaPublica);
            }
        }

        // ACTIVIDADES EXTRACURRICULARES
        if (visibles.Contains("actividades") ||
            visibles.Contains("actividad") ||
            visibles.Contains("extracurricular"))
        {
            var actividades = await _actividadService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            foreach (var a in actividades)
            {
                var actividadPublica = new ActividadPublicaDto
                {
                    Id = a.Id,
                    Nombre = a.Nombre,
                    Tipo = a.Tipo.ToString(),
                    Modalidad = a.Modalidad.ToString(),
                    Organizacion = a.Organizacion,
                    Descripcion = a.Descripcion,
                    Estado = a.Estado.ToString(),
                    FechaInicio = a.FechaInicio,
                    FechaFin = a.FechaFin,
                    Duracion = a.Duracion,
                    UnidadDuracion = a.UnidadDuracion?.ToString()
                };

                actividadPublica.Documento =
                    await MapearDocumentoPublicoAsync(
                        a.DocumentoId,
                        enlace.UsuarioId,
                        token);

                resultado.Actividades.Add(actividadPublica);
            }
        }

        // PROYECTOS
        if (visibles.Contains("proyectos") ||
            visibles.Contains("proyecto"))
        {
            var proyectos = await _proyectoService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            foreach (var p in proyectos.Where(p =>
                proyectosSeleccionados.Contains(p.Id.ToString())))
            {
                var proyectoPublico = new ProyectoPublicoDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Tecnologias = p.Tecnologias,
                    UrlRepositorio = p.UrlRepositorio,
                    UrlDemostracion = p.UrlDemostracion,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin
                };

                var documentos = await _documentoRepository
                    .ObtenerPorProyectoAsync(
                        p.Id,
                        enlace.UsuarioId);

                foreach (var documento in documentos)
                {
                    var documentoPublico =
                        await MapearDocumentoPublicoAsync(
                            documento.Id,
                            enlace.UsuarioId,
                            token);

                    if (documentoPublico is not null)
                    {
                        proyectoPublico.Documentos.Add(
                            documentoPublico);
                    }
                }

                resultado.Proyectos.Add(proyectoPublico);
            }
        }

        // PRÁCTICAS PROFESIONALES
        if (visibles.Contains("practicas") ||
            visibles.Contains("practicaprofesional"))
        {
            var practicas = await _practicaService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            foreach (var p in practicas)
            {
                var practicaPublica = new PracticaPublicaDto
                {
                    Id = p.Id,
                    Empresa = p.Empresa,
                    Puesto = p.Puesto,
                    InstitucionEducativa = p.InstitucionEducativa,
                    Descripcion = p.Descripcion,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin,
                    EnCurso = p.EnCurso,
                    HorasRealizadas = p.HorasRealizadas
                };

                practicaPublica.Documento =
                    await MapearDocumentoPublicoAsync(
                        p.DocumentoId,
                        enlace.UsuarioId,
                        token);

                resultado.Practicas.Add(practicaPublica);
            }
        }

        // HABILIDADES
        if (visibles.Contains("habilidades") ||
            visibles.Contains("habilidad"))
        {
            var habilidades = await _habilidadService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            resultado.Habilidades = habilidades
                .Where(h => habilidadesSeleccionadas.Contains(h.Id.ToString()))
                .Select(h => new HabilidadPublicaDto
                {
                    Id = h.Id,
                    Nombre = h.Nombre,
                    Descripcion = h.Descripcion,
                    Categoria = h.Categoria,
                    Nivel = h.Nivel,
                    Experiencia = h.Experiencia
                })
                .ToList();
        }

        // ACTIVIDADES EXTRACURRICULARES
        // Se conservan disponibles para el contenido público.

        // INTERESES
        if (visibles.Contains("intereses") ||
            visibles.Contains("interes"))
        {
            var intereses = await _interesService
                .ObtenerPorUsuarioAsync(enlace.UsuarioId);

            resultado.Intereses = intereses
                .Where(i => i.IncludePublic)
                .Select(i => new InteresPublicoDto
                {
                    Id = i.Id,
                    Nombre = i.Nombre,
                    Descripcion = i.Descripcion,
                    Icono = i.Icono,
                    Categoria = i.Categoria,
                    CategoriaPersonalizada = i.CategoriaPersonalizada,
                    Tipo = i.Tipo,
                    Frecuencia = i.Frecuencia
                })
                .ToList();
        }

        return resultado;
    }

    public async Task RegistrarMeGustaPorTokenAsync(
        string token,
        string identificadorVisitante)
    {
        if (string.IsNullOrWhiteSpace(identificadorVisitante))
            throw new ArgumentException(
                "El identificador del visitante es obligatorio.");

        var enlace = await ObtenerEnlaceActivoAsync(token);

        await ObtenerCurriculumPublicadoAsync(enlace);

        await _visitaService.RegistrarMeGustaAsync(
            enlace.Id,
            identificadorVisitante);
    }

    public async Task<DocumentoDescargaDto> ConsultarDocumentoPorTokenAsync(
        string token,
        int documentoId)
    {
        if (documentoId <= 0)
            throw new KeyNotFoundException(
                "El documento solicitado no está disponible.");

        var enlace = await ObtenerEnlaceActivoAsync(token);

        var curriculum = await ConstruirCurriculumPublicoAsync(
            enlace,
            token);

        bool documentoVisible =
            curriculum.Formacion.Any(f =>
                f.Documentos.Any(d => d.Id == documentoId)) ||

            curriculum.Experiencia.Any(e =>
                e.Documento?.Id == documentoId) ||

            curriculum.Actividades.Any(a =>
                a.Documento?.Id == documentoId) ||

            curriculum.Proyectos.Any(p =>
                p.Documentos.Any(d => d.Id == documentoId)) ||

            curriculum.Practicas.Any(p =>
                p.Documento?.Id == documentoId);

        if (!documentoVisible)
            throw new KeyNotFoundException(
                "El documento no está disponible públicamente.");

        bool autorizado = await _privacidadService
            .DocumentoEstaAutorizadoAsync(
                enlace.UsuarioId,
                documentoId);

        if (!autorizado)
            throw new KeyNotFoundException(
                "El documento no está disponible públicamente.");

        var documento = await _documentoRepository
            .ObtenerPorIdAsync(documentoId);

        if (documento is null ||
            documento.UsuarioId != enlace.UsuarioId ||
            documento.Estado != EstadoDocumento.Activo)
        {
            throw new KeyNotFoundException(
                "El documento solicitado no está disponible.");
        }

        return new DocumentoDescargaDto
        {
            NombreArchivo = documento.NombreArchivo,
            TipoContenido = documento.TipoContenido,
            Contenido = documento.Contenido.ToArray()
        };
    }

    public async Task RevocarAsync(int id, int usuarioId)
    {
        var enlace = await _enlaceRepository.ObtenerPorIdAsync(id);

        if (enlace is null || enlace.UsuarioId != usuarioId)
            throw new KeyNotFoundException(
                "No se encontró el enlace solicitado.");

        if (enlace.Estado == EstadoEnlacePublico.Revocado)
            return;

        enlace.Estado = EstadoEnlacePublico.Revocado;
        enlace.FechaRevocacion = DateTime.UtcNow;

        _enlaceRepository.Actualizar(enlace);
        await _enlaceRepository.GuardarCambiosAsync();
    }

    public async Task<DocumentoDescargaDto?> DescargarCurriculumPorTokenAsync(
        string token,
        string identificadorVisitante)
    {
        if (string.IsNullOrWhiteSpace(identificadorVisitante))
            throw new ArgumentException(
                "El identificador del visitante es obligatorio.");

        var enlace = await ObtenerEnlaceActivoAsync(token);

        if (!enlace.PermitirDescarga)
            return null;

        var curriculum = await ConstruirCurriculumPublicoAsync(
            enlace,
            token);

        FotografiaPerfilResponseDto? fotografia = null;

        if (curriculum.ConfiguracionConstructor?.ShowPhoto == true)
        {
            fotografia = await _perfilService.ObtenerFotografiaAsync(
                enlace.UsuarioId);
        }

        var contenido = await _curriculumPdfService.GenerarPdfAsync(
            curriculum,
            fotografia);

        await _visitaService.RegistrarDescargaCurriculumAsync(
            enlace.Id,
            identificadorVisitante);

        var nombre = string.Concat(
            curriculum.Nombre
                .Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_')
                .Select(c => c));

        if (string.IsNullOrWhiteSpace(nombre))
            nombre = "Curriculum";

        return new DocumentoDescargaDto
        {
            NombreArchivo = $"{nombre}.pdf",
            TipoContenido = "application/pdf",
            Contenido = contenido
        };
    }

    public async Task<string> ValidarCodigoAccesoAsync(string codigoAcceso)
    {
        if (string.IsNullOrWhiteSpace(codigoAcceso))
            throw new ArgumentException(
                "Debes proporcionar un código de acceso.");

        codigoAcceso = codigoAcceso.Trim().ToUpperInvariant();

        if (codigoAcceso.Length != 10)
            throw new KeyNotFoundException(
                "El código de acceso no es válido o ha expirado.");

        var enlace = await _enlaceRepository
            .ObtenerPorCodigoAccesoAsync(codigoAcceso);

        if (enlace is null)
            throw new KeyNotFoundException(
                "El código de acceso no es válido o ha expirado.");

        await ObtenerEnlaceActivoAsync(enlace.Token);

        await ObtenerCurriculumPublicadoAsync(enlace);

        return enlace.Token;
    }

    private async Task<CurriculumResponseDto> ObtenerCurriculumPublicadoAsync(
        EnlacePublico enlace)
    {
        var curriculum = await _curriculumService.ObtenerPorIdAsync(
            enlace.CurriculumId,
            enlace.UsuarioId);

        if (curriculum is null || !curriculum.EsPublico)
            throw new KeyNotFoundException(
                "El currículum público no está disponible.");

        return curriculum;
    }

    private async Task<DocumentoPublicoDto?> MapearDocumentoPublicoAsync(
        int? documentoId,
        int usuarioId,
        string token)
    {
        if (!documentoId.HasValue)
            return null;

        bool autorizado = await _privacidadService
            .DocumentoEstaAutorizadoAsync(
                usuarioId,
                documentoId.Value);

        if (!autorizado)
            return null;

        var documento = await _documentoRepository
            .ObtenerPorIdAsync(documentoId.Value);

        if (documento is null ||
            documento.UsuarioId != usuarioId ||
            documento.Estado != EstadoDocumento.Activo)
        {
            return null;
        }

        return new DocumentoPublicoDto
        {
            Id = documento.Id,
            NombreArchivo = documento.NombreArchivo,
            TipoContenido = documento.TipoContenido,
            TamanoBytes = documento.TamanoBytes,
            UrlVisualizacion =
                $"/api/EnlacesPublicos/publico/{token}/documentos/{documento.Id}"
        };
    }

    private async Task<EnlacePublico> ObtenerEnlaceActivoAsync(
        string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new KeyNotFoundException(
                "El enlace no es válido.");

        var enlace = await _enlaceRepository.ObtenerPorTokenAsync(token);

        if (enlace is null ||
            enlace.Estado != EstadoEnlacePublico.Activo ||
            enlace.FechaRevocacion.HasValue ||
            (enlace.FechaExpiracion.HasValue &&
             enlace.FechaExpiracion.Value <= DateTime.UtcNow))
        {
            throw new KeyNotFoundException(
                "El enlace no existe, ha expirado o fue revocado.");
        }

        return enlace;
    }

    private EnlacePublicoResponseDto MapearRespuesta(
        EnlacePublico enlace)
    {
        var url = $"/api/EnlacesPublicos/publico/{enlace.Token}";

        return new EnlacePublicoResponseDto
        {
            Id = enlace.Id,
            CurriculumId = enlace.CurriculumId,
            Token = enlace.Token,
            CodigoAcceso = enlace.CodigoAcceso,
            UrlPublica = url,
            FechaCreacion = enlace.FechaCreacion,
            FechaExpiracion = enlace.FechaExpiracion,
            Activo = enlace.Estado == EstadoEnlacePublico.Activo
                     && !enlace.FechaRevocacion.HasValue
                     && (!enlace.FechaExpiracion.HasValue
                         || enlace.FechaExpiracion.Value > DateTime.UtcNow),
            PermitirDescarga = enlace.PermitirDescarga
        };
    }

    private static string Normalizar(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return string.Empty;

        return new string(valor
            .Where(char.IsLetterOrDigit)
            .Select(char.ToLowerInvariant)
            .ToArray());
    }

    private async Task<string> GenerarCodigoAccesoUnicoAsync()
    {
        while (true)
        {
            var caracteres = new char[10];

            for (int i = 0; i < caracteres.Length; i++)
            {
                int indice = RandomNumberGenerator.GetInt32(
                    AlfabetoCodigo.Length);

                caracteres[i] = AlfabetoCodigo[indice];
            }

            string codigo = new(caracteres);

            var existente = await _enlaceRepository
                .ObtenerPorCodigoAccesoAsync(codigo);

            if (existente is null)
                return codigo;
        }
    }
}
