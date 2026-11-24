using PortalEvidencias.Aplicacion.DTOs.Habilidades;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Services;

public class HabilidadService : IHabilidadService
{
    private readonly IHabilidadRepository _habilidadRepository;

    private static readonly string[] Categorias =
    {
        "tecnica",
        "personal",
        "idioma",
        "otra"
    };

    private static readonly string[] NivelesGenerales =
    {
        "Básico",
        "Intermedio",
        "Avanzado",
        "Experto"
    };

    private static readonly string[] NivelesIdioma =
    {
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2",
        "Nativo"
    };

    private static readonly string[] Experiencias =
    {
        "Menos de 1 año",
        "1–2 años",
        "3–5 años",
        "Más de 5 años"
    };

    public HabilidadService(IHabilidadRepository habilidadRepository)
    {
        _habilidadRepository = habilidadRepository;
    }

    public async Task<List<HabilidadResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var habilidades =
            await _habilidadRepository.ObtenerPorUsuarioAsync(usuarioId);

        return habilidades.Select(MapearRespuesta).ToList();
    }

    public async Task AgregarAlUsuarioAsync(
        int usuarioId,
        AsignarHabilidadRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);

        if (dto is null)
            throw new ArgumentNullException(nameof(dto));

        ValidarDatos(
            dto.Nombre,
            dto.Categoria,
            dto.Nivel,
            dto.Experiencia);

        var habilidadesExistentes =
            await _habilidadRepository.ObtenerPorUsuarioAsync(usuarioId);

        bool nombreDuplicado = habilidadesExistentes.Any(h =>
            string.Equals(
                h.Nombre.Trim(),
                dto.Nombre.Trim(),
                StringComparison.OrdinalIgnoreCase));

        if (nombreDuplicado)
            throw new InvalidOperationException(
                "Ya tienes registrada una habilidad con ese nombre.");

        var habilidad = new Habilidad
        {
            UsuarioId = usuarioId,
            Nombre = dto.Nombre.Trim(),
            Descripcion = LimpiarTextoOpcional(dto.Descripcion),
            Categoria = dto.Categoria.Trim().ToLowerInvariant(),
            Nivel = dto.Nivel.Trim(),
            Experiencia = LimpiarTextoOpcional(dto.Experiencia),
            Activa = true
        };

        await _habilidadRepository.AgregarAsync(habilidad);
        await _habilidadRepository.GuardarCambiosAsync();
    }

    public async Task ActualizarDeUsuarioAsync(
        int usuarioId,
        int habilidadId,
        ActualizarHabilidadRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);

        if (habilidadId <= 0)
            throw new ArgumentException("El identificador de la habilidad no es válido.");

        if (dto is null)
            throw new ArgumentNullException(nameof(dto));

        ValidarDatos(
            dto.Nombre,
            dto.Categoria,
            dto.Nivel,
            dto.Experiencia);

        var habilidad =
            await _habilidadRepository.ObtenerPorIdAsync(usuarioId, habilidadId);

        if (habilidad is null)
            throw new KeyNotFoundException(
                "La habilidad no existe o no pertenece a tu cuenta.");

        var habilidadesExistentes =
            await _habilidadRepository.ObtenerPorUsuarioAsync(usuarioId);

        bool nombreDuplicado = habilidadesExistentes.Any(h =>
            h.Id != habilidadId &&
            string.Equals(
                h.Nombre.Trim(),
                dto.Nombre.Trim(),
                StringComparison.OrdinalIgnoreCase));

        if (nombreDuplicado)
            throw new InvalidOperationException(
                "Ya tienes registrada otra habilidad con ese nombre.");

        habilidad.Nombre = dto.Nombre.Trim();
        habilidad.Descripcion = LimpiarTextoOpcional(dto.Descripcion);
        habilidad.Categoria = dto.Categoria.Trim().ToLowerInvariant();
        habilidad.Nivel = dto.Nivel.Trim();
        habilidad.Experiencia = LimpiarTextoOpcional(dto.Experiencia);

        _habilidadRepository.Actualizar(habilidad);
        await _habilidadRepository.GuardarCambiosAsync();
    }

    public async Task EliminarDelUsuarioAsync(
        int usuarioId,
        int habilidadId)
    {
        ValidarUsuarioId(usuarioId);

        if (habilidadId <= 0)
            throw new ArgumentException("El identificador de la habilidad no es válido.");

        var habilidad =
            await _habilidadRepository.ObtenerPorIdAsync(usuarioId, habilidadId);

        if (habilidad is null)
            throw new KeyNotFoundException(
                "La habilidad no existe o no pertenece a tu cuenta.");

        _habilidadRepository.Eliminar(habilidad);
        await _habilidadRepository.GuardarCambiosAsync();
    }

    private static void ValidarDatos(
        string nombre,
        string categoria,
        string nivel,
        string? experiencia)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la habilidad es obligatorio.");

        if (nombre.Trim().Length > 120)
            throw new ArgumentException(
                "El nombre de la habilidad no puede superar los 120 caracteres.");

        if (!Categorias.Contains(
            categoria?.Trim().ToLowerInvariant()))
        {
            throw new ArgumentException("La categoría seleccionada no es válida.");
        }

        if (string.IsNullOrWhiteSpace(nivel))
            throw new ArgumentException("El nivel es obligatorio.");

        bool nivelValido = NivelesGenerales.Contains(
            nivel.Trim(),
            StringComparer.OrdinalIgnoreCase);

        if (!nivelValido)
        {
            nivelValido = NivelesIdioma.Contains(
                nivel.Trim(),
                StringComparer.OrdinalIgnoreCase);
        }

        if (!nivelValido)
            throw new ArgumentException("El nivel seleccionado no es válido.");

        if (!string.IsNullOrWhiteSpace(experiencia) &&
            !Experiencias.Contains(
                experiencia.Trim(),
                StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "La experiencia seleccionada no es válida.");
        }
    }

    private static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
            throw new ArgumentException("El identificador del usuario no es válido.");
    }

    private static string? LimpiarTextoOpcional(string? valor)
    {
        return string.IsNullOrWhiteSpace(valor)
            ? null
            : valor.Trim();
    }

    private static HabilidadResponseDto MapearRespuesta(Habilidad habilidad)
    {
        return new HabilidadResponseDto
        {
            Id = habilidad.Id,
            Nombre = habilidad.Nombre,
            Descripcion = habilidad.Descripcion,
            Categoria = habilidad.Categoria,
            Nivel = habilidad.Nivel,
            Experiencia = habilidad.Experiencia
        };
    }
}