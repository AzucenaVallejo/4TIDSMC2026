
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> ObtenerPorHashAsync(string tokenHash);

    Task<List<RefreshToken>> ObtenerPorUsuarioAsync(int usuarioId);

    Task AgregarAsync(RefreshToken refreshToken);

    void Actualizar(RefreshToken refreshToken);

    // Revoca el token solamente si sigue vigente y no está revocado.
    Task<bool> RevocarSiActivoAsync(
        string tokenHash,
        DateTime fechaRevocacion,
        string motivo);

    Task GuardarCambiosAsync();
}
