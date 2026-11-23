
using PortalEvidencias.Aplicacion.DTOs.Usuarios;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Aplicacion.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPerfilRepository _perfilRepository;

    public UsuarioService(
        IUsuarioRepository usuarioRepository,
        IPerfilRepository perfilRepository)
    {
        _usuarioRepository = usuarioRepository;
        _perfilRepository = perfilRepository;
    }

    public async Task<UsuarioResponseDto?> ObtenerPorIdAsync(int usuarioId)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId);

        if (usuario is null)
            return null;

        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(usuarioId);

        string nombre = perfil is null
            ? string.Empty
            : string.Join(" ", new[]
            {
                perfil.Nombres,
                perfil.ApellidoPaterno,
                perfil.ApellidoMaterno
            }.Where(parte => !string.IsNullOrWhiteSpace(parte)));

        return new UsuarioResponseDto
        {
            Id = usuario.Id,
            Nombre = nombre,
            Correo = usuario.Correo,
            FechaRegistro = usuario.FechaCreacion
        };
    }

    public async Task<UsuarioResponseDto> ActualizarAsync(
        int usuarioId,
        ActualizarUsuarioRequestDto dto)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId);

        if (usuario is null)
            throw new InvalidOperationException(
                "No se encontró el usuario solicitado.");

        if (string.IsNullOrWhiteSpace(dto.Nombre))
            throw new InvalidOperationException(
                "El nombre no puede estar vacío.");

        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(usuarioId);

        if (perfil is null)
            throw new InvalidOperationException(
                "No se encontró el perfil del usuario.");

        perfil.Nombres = dto.Nombre.Trim();
        perfil.FechaActualizacion = DateTime.UtcNow;

        _perfilRepository.Actualizar(perfil);
        await _perfilRepository.GuardarCambiosAsync();

        return new UsuarioResponseDto
        {
            Id = usuario.Id,
            Nombre = perfil.Nombres,
            Correo = usuario.Correo,
            FechaRegistro = usuario.FechaCreacion
        };
    }
}
