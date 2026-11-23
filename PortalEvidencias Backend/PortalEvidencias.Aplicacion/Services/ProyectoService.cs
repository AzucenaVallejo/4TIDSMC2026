
using PortalEvidencias.Aplicacion.DTOs.Proyectos;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Services;

public class ProyectoService : IProyectoService
{
    private readonly IProyectoRepository _proyectoRepository;
    private readonly IDocumentoRepository _documentoRepository;

    public ProyectoService(
        IProyectoRepository proyectoRepository,
        IDocumentoRepository documentoRepository)
    {
        _proyectoRepository = proyectoRepository;
        _documentoRepository = documentoRepository;
    }

    public async Task<List<ProyectoResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var proyectos = await _proyectoRepository
            .ObtenerPorUsuarioAsync(usuarioId);

        return proyectos.Select(MapearRespuesta).ToList();
    }

    public async Task<ProyectoResponseDto?> ObtenerPorIdAsync(
        int id, int usuarioId)
    {
        ValidarProyectoId(id);
        ValidarUsuarioId(usuarioId);

        var proyecto = await _proyectoRepository
            .ObtenerPorIdYUsuarioAsync(id, usuarioId);

        return proyecto is null ? null : MapearRespuesta(proyecto);
    }

    public async Task<List<ProyectoResponseDto>> ObtenerDestacadosAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var proyectos = await _proyectoRepository
            .ObtenerDestacadosPorUsuarioAsync(usuarioId);

        return proyectos.Select(MapearRespuesta).ToList();
    }

    public async Task<ProyectoResponseDto> CrearAsync(
        int usuarioId, CrearProyectoRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Nombre,
            dto.Descripcion,
            dto.Tecnologias,
            dto.UrlRepositorio,
            dto.UrlDemostracion,
            dto.FechaInicio,
            dto.FechaFin);

        var proyecto = new Proyecto
        {
            UsuarioId = usuarioId,
            Nombre = dto.Nombre.Trim(),
            Descripcion = NormalizarTexto(dto.Descripcion),
            Tecnologias = NormalizarTexto(dto.Tecnologias),
            EnlaceRepositorio = NormalizarUrl(dto.UrlRepositorio),
            EnlaceDemostracion = NormalizarUrl(dto.UrlDemostracion),
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            EsDestacado = dto.EsDestacado,
            FechaCreacion = DateTime.UtcNow
        };

        await _proyectoRepository.AgregarAsync(proyecto);
        await _proyectoRepository.GuardarCambiosAsync();

        return MapearRespuesta(proyecto);
    }

    public async Task<ProyectoResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarProyectoRequestDto dto)
    {
        ValidarProyectoId(id);
        ValidarUsuarioId(usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Nombre,
            dto.Descripcion,
            dto.Tecnologias,
            dto.UrlRepositorio,
            dto.UrlDemostracion,
            dto.FechaInicio,
            dto.FechaFin);

        var proyecto = await _proyectoRepository
            .ObtenerPorIdYUsuarioAsync(id, usuarioId);

        if (proyecto is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el proyecto solicitado.");
        }

        proyecto.Nombre = dto.Nombre.Trim();
        proyecto.Descripcion = NormalizarTexto(dto.Descripcion);
        proyecto.Tecnologias = NormalizarTexto(dto.Tecnologias);
        proyecto.EnlaceRepositorio = NormalizarUrl(dto.UrlRepositorio);
        proyecto.EnlaceDemostracion = NormalizarUrl(dto.UrlDemostracion);
        proyecto.FechaInicio = dto.FechaInicio;
        proyecto.FechaFin = dto.FechaFin;
        proyecto.EsDestacado = dto.EsDestacado;
        proyecto.FechaActualizacion = DateTime.UtcNow;

        _proyectoRepository.Actualizar(proyecto);
        await _proyectoRepository.GuardarCambiosAsync();

        return MapearRespuesta(proyecto);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        ValidarProyectoId(id);
        ValidarUsuarioId(usuarioId);

        var proyecto = await _proyectoRepository
            .ObtenerPorIdYUsuarioAsync(id, usuarioId);

        if (proyecto is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el proyecto solicitado.");
        }

        var documentos = await _documentoRepository
            .ObtenerPorProyectoAsync(id, usuarioId);

        if (documentos.Count > 0)
        {
            throw new InvalidOperationException(
                "No se puede eliminar el proyecto porque tiene documentos asociados. " +
                "Elimina primero sus evidencias.");
        }

        _proyectoRepository.Eliminar(proyecto);
        await _proyectoRepository.GuardarCambiosAsync();
    }

    private static void ValidarDatos(
        string nombre,
        string? descripcion,
        string? tecnologias,
        string? urlRepositorio,
        string? urlDemostracion,
        DateOnly? fechaInicio,
        DateOnly? fechaFin)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException(
                "El nombre del proyecto es obligatorio.");
        }

        if (nombre.Trim().Length > 150)
        {
            throw new ArgumentException(
                "El nombre no puede superar los 150 caracteres.");
        }

        if (descripcion?.Length > 1500)
        {
            throw new ArgumentException(
                "La descripción no puede superar los 1500 caracteres.");
        }

        if (tecnologias?.Length > 100)
        {
            throw new ArgumentException(
                "El campo de tecnologías no puede superar los 100 caracteres.");
        }

        ValidarUrl(urlRepositorio, "repositorio");
        ValidarUrl(urlDemostracion, "demostración");

        if (fechaInicio.HasValue &&
            fechaFin.HasValue &&
            fechaFin.Value < fechaInicio.Value)
        {
            throw new ArgumentException(
                "La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }
    }

    private static void ValidarUrl(string? url, string campo)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        if (url.Trim().Length > 300)
        {
            throw new ArgumentException(
                $"La URL de {campo} no puede superar los 300 caracteres.");
        }

        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp &&
             uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException(
                $"La URL de {campo} debe ser una dirección HTTP o HTTPS válida.");
        }
    }

    private static void ValidarProyectoId(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException(
                "El identificador del proyecto debe ser mayor que cero.");
        }
    }

    private static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new ArgumentException(
                "El identificador del usuario debe ser mayor que cero.");
        }
    }

    private static string? NormalizarTexto(string? valor)
    {
        return string.IsNullOrWhiteSpace(valor)
            ? null
            : valor.Trim();
    }

    private static string? NormalizarUrl(string? url)
    {
        return string.IsNullOrWhiteSpace(url)
            ? null
            : url.Trim();
    }

    private static ProyectoResponseDto MapearRespuesta(Proyecto proyecto)
    {
        return new ProyectoResponseDto
        {
            Id = proyecto.Id,
            UsuarioId = proyecto.UsuarioId,
            Nombre = proyecto.Nombre,
            Descripcion = proyecto.Descripcion,
            Tecnologias = proyecto.Tecnologias,
            UrlRepositorio = proyecto.EnlaceRepositorio,
            UrlDemostracion = proyecto.EnlaceDemostracion,
            FechaInicio = proyecto.FechaInicio,
            FechaFin = proyecto.FechaFin,
            EsDestacado = proyecto.EsDestacado
        };
    }
}
