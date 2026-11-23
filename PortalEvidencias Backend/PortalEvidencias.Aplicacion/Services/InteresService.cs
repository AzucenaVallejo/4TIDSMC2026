using PortalEvidencias.Aplicacion.DTOs.Intereses;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Services;

public class InteresService : IInteresService
{
    private readonly IInteresRepository _interesRepository;

    private static readonly string[] CategoriasPermitidas =
    {
        "tech", "art", "science", "sports", "business", "other"
    };

    private static readonly string[] TiposPermitidos =
    {
        "personal", "learn", "practice", "explore"
    };

    private static readonly string[] FrecuenciasPermitidas =
    {
        "daily", "weekly", "monthly", "occasional"
    };

    public InteresService(IInteresRepository interesRepository)
    {
        _interesRepository = interesRepository;
    }

    public async Task<List<InteresResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var intereses =
            await _interesRepository.ObtenerPorUsuarioAsync(usuarioId);

        return intereses.Select(MapearRespuesta).ToList();
    }

    public async Task<InteresResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);
        ValidarId(id);

        var interes =
            await _interesRepository.ObtenerPorIdYUsuarioAsync(
                id, usuarioId);

        return interes is null ? null : MapearRespuesta(interes);
    }

    public async Task<InteresResponseDto> CrearAsync(
        int usuarioId,
        CrearInteresRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(dto.Nombre, dto.Descripcion, dto.Icono);
        ValidarOpciones(
            dto.Categoria,
            dto.CategoriaPersonalizada,
            dto.Tipo,
            dto.Frecuencia);

        var interes = new Interes
        {
            UsuarioId = usuarioId,
            Nombre = dto.Nombre.Trim(),
            Descripcion = NormalizarTexto(dto.Descripcion),
            Icono = NormalizarTexto(dto.Icono),
            Categoria = NormalizarOpcion(dto.Categoria),
            CategoriaPersonalizada =
                NormalizarTexto(dto.CategoriaPersonalizada),
            Tipo = NormalizarOpcion(dto.Tipo),
            Frecuencia = NormalizarOpcion(dto.Frecuencia),
            IncludePublic = dto.IncludePublic,
            IncludeCV = dto.IncludeCV,
            FechaCreacion = DateTime.UtcNow
        };

        await _interesRepository.AgregarAsync(interes);
        await _interesRepository.GuardarCambiosAsync();

        return MapearRespuesta(interes);
    }

    public async Task<InteresResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarInteresRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);
        ValidarId(id);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(dto.Nombre, dto.Descripcion, dto.Icono);
        ValidarOpciones(
            dto.Categoria,
            dto.CategoriaPersonalizada,
            dto.Tipo,
            dto.Frecuencia);

        var interes =
            await _interesRepository.ObtenerPorIdYUsuarioAsync(
                id, usuarioId);

        if (interes is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el interés solicitado.");
        }

        interes.Nombre = dto.Nombre.Trim();
        interes.Descripcion = NormalizarTexto(dto.Descripcion);
        interes.Icono = NormalizarTexto(dto.Icono);
        interes.Categoria = NormalizarOpcion(dto.Categoria);
        interes.CategoriaPersonalizada =
            NormalizarTexto(dto.CategoriaPersonalizada);
        interes.Tipo = NormalizarOpcion(dto.Tipo);
        interes.Frecuencia = NormalizarOpcion(dto.Frecuencia);
        interes.IncludePublic = dto.IncludePublic;
        interes.IncludeCV = dto.IncludeCV;
        interes.FechaActualizacion = DateTime.UtcNow;

        _interesRepository.Actualizar(interes);
        await _interesRepository.GuardarCambiosAsync();

        return MapearRespuesta(interes);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        ValidarUsuarioId(usuarioId);
        ValidarId(id);

        var interes =
            await _interesRepository.ObtenerPorIdYUsuarioAsync(
                id, usuarioId);

        if (interes is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el interés solicitado.");
        }

        _interesRepository.Eliminar(interes);
        await _interesRepository.GuardarCambiosAsync();
    }

    private static void ValidarDatos(
        string nombre,
        string? descripcion,
        string? icono)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException(
                "El nombre del interés es obligatorio.");
        }

        if (nombre.Trim().Length > 100)
        {
            throw new ArgumentException(
                "El nombre no puede superar los 100 caracteres.");
        }

        if (descripcion?.Length > 1000)
        {
            throw new ArgumentException(
                "La descripción no puede superar los 1000 caracteres.");
        }

        if (icono?.Length > 100)
        {
            throw new ArgumentException(
                "El icono no puede superar los 100 caracteres.");
        }
    }

    private static void ValidarOpciones(
        string categoria,
        string? categoriaPersonalizada,
        string tipo,
        string frecuencia)
    {
        if (string.IsNullOrWhiteSpace(categoria) ||
            !CategoriasPermitidas.Contains(
                categoria.Trim().ToLowerInvariant()))
        {
            throw new ArgumentException(
                "La categoría seleccionada no es válida.");
        }

        if (string.IsNullOrWhiteSpace(tipo) ||
            !TiposPermitidos.Contains(
                tipo.Trim().ToLowerInvariant()))
        {
            throw new ArgumentException(
                "El tipo de interés no es válido.");
        }

        if (string.IsNullOrWhiteSpace(frecuencia) ||
            !FrecuenciasPermitidas.Contains(
                frecuencia.Trim().ToLowerInvariant()))
        {
            throw new ArgumentException(
                "La frecuencia seleccionada no es válida.");
        }

        if (categoria.Trim().Equals(
                "other",
                StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(categoriaPersonalizada))
        {
            throw new ArgumentException(
                "Debes especificar la categoría personalizada.");
        }

        if (!categoria.Trim().Equals(
                "other",
                StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(categoriaPersonalizada))
        {
            throw new ArgumentException(
                "La categoría personalizada solo se permite cuando se selecciona 'other'.");
        }

        if (categoriaPersonalizada?.Trim().Length > 100)
        {
            throw new ArgumentException(
                "La categoría personalizada no puede superar los 100 caracteres.");
        }
    }

    private static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new ArgumentException(
                "El identificador del usuario no es válido.");
        }
    }

    private static void ValidarId(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException(
                "El identificador del interés no es válido.");
        }
    }

    private static string? NormalizarTexto(string? texto)
    {
        return string.IsNullOrWhiteSpace(texto)
            ? null
            : texto.Trim();
    }

    private static string NormalizarOpcion(string opcion)
    {
        return opcion.Trim().ToLowerInvariant();
    }

    private static InteresResponseDto MapearRespuesta(Interes interes)
    {
        return new InteresResponseDto
        {
            Id = interes.Id,
            UsuarioId = interes.UsuarioId,
            Nombre = interes.Nombre,
            Descripcion = interes.Descripcion,
            Icono = interes.Icono,
            Categoria = interes.Categoria,
            CategoriaPersonalizada = interes.CategoriaPersonalizada,
            Tipo = interes.Tipo,
            Frecuencia = interes.Frecuencia,
            IncludePublic = interes.IncludePublic,
            IncludeCV = interes.IncludeCV
        };
    }
}