
using System.Text.Json;
using PortalEvidencias.Aplicacion.DTOs.Curriculum;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Services;

public class CurriculumService : ICurriculumService
{
    private const string TipoConfiguracion = "ConfiguracionConstructor";

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    private readonly ICurriculumRepository _repository;
    private readonly IExperienciaRepository _experienciaRepository;
    private readonly IFormacionRepository _formacionRepository;
    private readonly IHabilidadRepository _habilidadRepository;
    private readonly IProyectoRepository _proyectoRepository;

    public CurriculumService(
        ICurriculumRepository repository,
        IExperienciaRepository experienciaRepository,
        IFormacionRepository formacionRepository,
        IHabilidadRepository habilidadRepository,
        IProyectoRepository proyectoRepository)
    {
        _repository = repository;
        _experienciaRepository = experienciaRepository;
        _formacionRepository = formacionRepository;
        _habilidadRepository = habilidadRepository;
        _proyectoRepository = proyectoRepository;
    }

    public async Task<List<CurriculumResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        CurriculumValidator.ValidarUsuarioId(usuarioId);

        var curriculums = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        return curriculums.Select(MapearRespuesta).ToList();
    }

    public async Task<CurriculumResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        CurriculumValidator.ValidarIdentificadores(id, usuarioId);

        var curriculum = await _repository.ObtenerPorIdConSeccionesAsync(id);

        if (curriculum is null || curriculum.UsuarioId != usuarioId)
            return null;

        return MapearRespuesta(curriculum);
    }

    public async Task<CurriculumResponseDto> CrearAsync(
        int usuarioId,
        CrearCurriculumRequestDto dto)
    {
        CurriculumValidator.ValidarUsuarioId(usuarioId);
        CurriculumValidator.Validar(dto);

        var curriculum = new Curriculum
        {
            UsuarioId = usuarioId,
            Titulo = dto.Nombre.Trim(),
            EsPredeterminado = dto.EsPredeterminado,
            EsPublico = false,
            FechaCreacion = DateTime.UtcNow
        };

        if (curriculum.EsPredeterminado)
            await DesmarcarPredeterminadosAsync(usuarioId);

        await _repository.AgregarAsync(curriculum);
        await _repository.GuardarCambiosAsync();

        return MapearRespuesta(curriculum);
    }

    public async Task<CurriculumResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarCurriculumRequestDto dto)
    {
        CurriculumValidator.ValidarIdentificadores(id, usuarioId);
        CurriculumValidator.Validar(dto);

        var curriculum = await _repository.ObtenerPorIdYUsuarioAsync(
            id, usuarioId);

        if (curriculum is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");
        }

        if (dto.EsPredeterminado)
            await DesmarcarPredeterminadosAsync(usuarioId, id);

        curriculum.Titulo = dto.Nombre.Trim();
        curriculum.EsPredeterminado = dto.EsPredeterminado;
        curriculum.FechaActualizacion = DateTime.UtcNow;

        _repository.Actualizar(curriculum);
        await _repository.GuardarCambiosAsync();

        return MapearRespuesta(curriculum);
    }

    public async Task<CurriculumResponseDto> ActualizarSeccionesAsync(
        int id,
        int usuarioId,
        ActualizarSeccionesRequestDto dto)
    {
        CurriculumValidator.ValidarIdentificadores(id, usuarioId);
        CurriculumValidator.Validar(dto);

        var curriculum = await _repository.ObtenerPorIdConSeccionesAsync(id);

        if (curriculum is null || curriculum.UsuarioId != usuarioId)
        {
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");
        }

        // Conservamos la configuración del constructor.
        var configuracionExistente = curriculum.Secciones
            .FirstOrDefault(s => s.TipoSeccion == TipoConfiguracion);

        var jsonConfiguracion = configuracionExistente?.Configuracion;

        await _repository.EliminarSeccionesAsync(id);

        curriculum.Secciones = new List<CurriculumSeccion>();

        foreach (var seccionDto in dto.Secciones)
        {
            var tipo = seccionDto.TipoSeccion.Trim();

            if (tipo == TipoConfiguracion)
                continue;

            curriculum.Secciones.Add(new CurriculumSeccion
            {
                CurriculumId = curriculum.Id,
                TipoSeccion = tipo,
                Titulo = tipo,
                Orden = seccionDto.Orden,
                Visible = seccionDto.Visible
            });
        }

        // Restauramos la configuración si ya existía.
        if (!string.IsNullOrWhiteSpace(jsonConfiguracion))
        {
            curriculum.Secciones.Add(new CurriculumSeccion
            {
                CurriculumId = curriculum.Id,
                TipoSeccion = TipoConfiguracion,
                Titulo = TipoConfiguracion,
                Orden = int.MaxValue,
                Visible = true,
                Configuracion = jsonConfiguracion
            });
        }

        curriculum.FechaActualizacion = DateTime.UtcNow;

        _repository.Actualizar(curriculum);
        await _repository.GuardarCambiosAsync();

        return MapearRespuesta(curriculum);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        CurriculumValidator.ValidarIdentificadores(id, usuarioId);

        var curriculum = await _repository.ObtenerPorIdYUsuarioAsync(
            id, usuarioId);

        if (curriculum is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");
        }

        await _repository.EliminarSeccionesAsync(id);

        _repository.Eliminar(curriculum);
        await _repository.GuardarCambiosAsync();
    }

    public async Task<ConfiguracionCurriculumDto> ObtenerConfiguracionAsync(
    int usuarioId,
    int curriculumId)
    {
        CurriculumValidator.ValidarUsuarioId(usuarioId);
        CurriculumValidator.ValidarIdentificadores(curriculumId, usuarioId);

        var curriculum =
            await _repository.ObtenerPorIdConSeccionesAsync(curriculumId);

        if (curriculum is null || curriculum.UsuarioId != usuarioId)
        {
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");
        }

        var seccion = curriculum.Secciones
            .FirstOrDefault(s => s.TipoSeccion == TipoConfiguracion);

        if (string.IsNullOrWhiteSpace(seccion?.Configuracion))
            return new ConfiguracionCurriculumDto();

        try
        {
            return JsonSerializer.Deserialize<ConfiguracionCurriculumDto>(
                seccion.Configuracion,
                JsonOptions) ?? new ConfiguracionCurriculumDto();
        }
        catch (JsonException)
        {
            throw new InvalidOperationException(
                "La configuración guardada del currículum no tiene un formato válido.");
        }
    }
    public async Task GuardarConfiguracionAsync(
    int usuarioId,
    int curriculumId,
    ConfiguracionCurriculumDto dto)
    {
        CurriculumValidator.ValidarUsuarioId(usuarioId);
        CurriculumValidator.ValidarIdentificadores(curriculumId, usuarioId);

        if (dto is null)
            throw new ArgumentNullException(nameof(dto));

        var experiencias = ParsearIds(dto.SelectedExperience, "experiencia");
        var formaciones = ParsearIds(dto.SelectedEducation, "formación");
        var habilidades = ParsearIds(dto.SelectedSkills, "habilidad");
        var proyectos = ParsearIds(dto.SelectedProjects, "proyecto");

        await ValidarExperienciasAsync(usuarioId, experiencias);
        await ValidarFormacionesAsync(usuarioId, formaciones);
        await ValidarHabilidadesAsync(usuarioId, habilidades);
        await ValidarProyectosAsync(usuarioId, proyectos);

        var curriculum =
            await _repository.ObtenerPorIdConSeccionesAsync(curriculumId);

        if (curriculum is null || curriculum.UsuarioId != usuarioId)
        {
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");
        }

        var configuracion = new ConfiguracionCurriculumDto
        {
            ShowPhoto = dto.ShowPhoto,
            ShowEmail = dto.ShowEmail,
            ShowPhone = dto.ShowPhone,
            SelectedExperience = experiencias
                .Select(id => id.ToString())
                .ToList(),
            SelectedEducation = formaciones
                .Select(id => id.ToString())
                .ToList(),
            SelectedSkills = habilidades
                .Select(id => id.ToString())
                .ToList(),
            SelectedProjects = proyectos
                .Select(id => id.ToString())
                .ToList()
        };

        var json = JsonSerializer.Serialize(configuracion, JsonOptions);

        var seccion = curriculum.Secciones
            .FirstOrDefault(s => s.TipoSeccion == TipoConfiguracion);

        if (seccion is null)
        {
            seccion = new CurriculumSeccion
            {
                CurriculumId = curriculum.Id,
                TipoSeccion = TipoConfiguracion,
                Titulo = TipoConfiguracion,
                Orden = int.MaxValue,
                Visible = true
            };

            curriculum.Secciones.Add(seccion);
        }

        seccion.Configuracion = json;

        curriculum.FechaActualizacion = DateTime.UtcNow;

        _repository.Actualizar(curriculum);
        await _repository.GuardarCambiosAsync();
    }

    private async Task<Curriculum> ObtenerOCrearCurriculumPredeterminadoAsync(
        int usuarioId)
    {
        var curriculum =
            await _repository.ObtenerPredeterminadoConSeccionesPorUsuarioAsync(
                usuarioId);

        if (curriculum is not null)
            return curriculum;

        // Si ya tiene currículums, reutilizamos uno existente.
        var curriculums = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        if (curriculums.Count > 0)
        {
            curriculum = curriculums[0];
            curriculum.EsPredeterminado = true;
            curriculum.FechaActualizacion = DateTime.UtcNow;

            _repository.Actualizar(curriculum);
            await _repository.GuardarCambiosAsync();

            return await _repository.ObtenerPredeterminadoConSeccionesPorUsuarioAsync(
                usuarioId)
                ?? throw new InvalidOperationException(
                    "No fue posible recuperar el currículum predeterminado.");
        }

        // Si no tiene ninguno, creamos el primero.
        curriculum = new Curriculum
        {
            UsuarioId = usuarioId,
            Titulo = "Mi currículum",
            EsPredeterminado = true,
            EsPublico = false,
            FechaCreacion = DateTime.UtcNow
        };

        await _repository.AgregarAsync(curriculum);
        await _repository.GuardarCambiosAsync();

        return await _repository.ObtenerPredeterminadoConSeccionesPorUsuarioAsync(
            usuarioId)
            ?? throw new InvalidOperationException(
                "No fue posible crear el currículum predeterminado.");
    }

    private async Task ValidarExperienciasAsync(
        int usuarioId,
        List<int> ids)
    {
        foreach (var id in ids)
        {
            var experiencia =
                await _experienciaRepository.ObtenerPorIdYUsuarioAsync(
                    id, usuarioId);

            if (experiencia is null)
            {
                throw new ArgumentException(
                    $"La experiencia con identificador {id} no pertenece al usuario.");
            }
        }
    }

    private async Task ValidarFormacionesAsync(
        int usuarioId,
        List<int> ids)
    {
        foreach (var id in ids)
        {
            var formacion =
                await _formacionRepository.ObtenerPorIdYUsuarioAsync(
                    id, usuarioId);

            if (formacion is null)
            {
                throw new ArgumentException(
                    $"La formación con identificador {id} no pertenece al usuario.");
            }
        }
    }

    private async Task ValidarHabilidadesAsync(
        int usuarioId,
        List<int> ids)
    {
        foreach (var id in ids)
        {
            var habilidad =
                await _habilidadRepository.ObtenerPorIdAsync(
                    usuarioId, id);

            if (habilidad is null || !habilidad.Activa)
            {
                throw new ArgumentException(
                    $"La habilidad con identificador {id} no existe, no pertenece al usuario o está inactiva.");
            }
        }
    }

    private async Task ValidarProyectosAsync(
        int usuarioId,
        List<int> ids)
    {
        foreach (var id in ids)
        {
            var proyecto =
                await _proyectoRepository.ObtenerPorIdYUsuarioAsync(
                    id, usuarioId);

            if (proyecto is null || !proyecto.EsDestacado)
            {
                throw new ArgumentException(
                    $"El proyecto con identificador {id} no existe, no pertenece al usuario o no está destacado.");
            }
        }
    }

    private static List<int> ParsearIds(
        List<string>? valores,
        string nombreModulo)
    {
        if (valores is null)
        {
            throw new ArgumentException(
                $"La lista de {nombreModulo} no puede ser nula.");
        }

        var resultado = new List<int>();
        var identificadores = new HashSet<int>();

        foreach (var valor in valores)
        {
            if (!int.TryParse(valor, out var id) || id <= 0)
            {
                throw new ArgumentException(
                    $"Se recibió un identificador inválido en {nombreModulo}.");
            }

            if (!identificadores.Add(id))
            {
                throw new ArgumentException(
                    $"La lista de {nombreModulo} contiene identificadores duplicados.");
            }

            resultado.Add(id);
        }

        return resultado;
    }

    private async Task DesmarcarPredeterminadosAsync(
        int usuarioId,
        int? curriculumIdExcluir = null)
    {
        var curriculums = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        foreach (var curriculum in curriculums)
        {
            if (curriculum.EsPredeterminado &&
                curriculum.Id != curriculumIdExcluir)
            {
                curriculum.EsPredeterminado = false;
                curriculum.FechaActualizacion = DateTime.UtcNow;

                _repository.Actualizar(curriculum);
            }
        }

        await _repository.GuardarCambiosAsync();
    }

    private static CurriculumResponseDto MapearRespuesta(
    Curriculum curriculum)
    {
        return new CurriculumResponseDto
        {
            Id = curriculum.Id,
            UsuarioId = curriculum.UsuarioId,
            Nombre = curriculum.Titulo,
            EsPredeterminado = curriculum.EsPredeterminado,
            EsPublico = curriculum.EsPublico,
            FechaCreacion = curriculum.FechaCreacion,
            Secciones = curriculum.Secciones
                .Where(s => s.TipoSeccion != TipoConfiguracion)
                .OrderBy(s => s.Orden)
                .Select(s => new SeccionCurriculumDto
                {
                    TipoSeccion = s.TipoSeccion,
                    Orden = s.Orden,
                    Visible = s.Visible
                })
                .ToList()
        };
    }
    public async Task CambiarPublicacionAsync(
    int id,
    int usuarioId,
    bool esPublico)
    {
        CurriculumValidator.ValidarIdentificadores(id, usuarioId);

        var curriculum = await _repository.ObtenerPorIdYUsuarioAsync(
            id,
            usuarioId);

        if (curriculum is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el currículum solicitado.");
        }

        curriculum.EsPublico = esPublico;
        curriculum.FechaActualizacion = DateTime.UtcNow;

        _repository.Actualizar(curriculum);
        await _repository.GuardarCambiosAsync();
    }
}
