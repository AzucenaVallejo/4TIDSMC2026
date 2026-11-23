
using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public RefreshTokenRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> ObtenerPorHashAsync(string tokenHash)
    {
        return await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
    }

    public async Task<List<RefreshToken>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.RefreshTokens
            .Where(r => r.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task AgregarAsync(RefreshToken refreshToken)
    {
        await _context.RefreshTokens.AddAsync(refreshToken);
    }

    public void Actualizar(RefreshToken refreshToken)
    {
        _context.RefreshTokens.Update(refreshToken);
    }

    public async Task<bool> RevocarSiActivoAsync(
        string tokenHash,
        DateTime fechaRevocacion,
        string motivo)
    {
        // SQL Server actualiza el registro solo si todavía está activo.
        int filasAfectadas = await _context.RefreshTokens
            .Where(r =>
                r.TokenHash == tokenHash &&
                r.FechaRevocacion == null &&
                r.FechaExpiracion > fechaRevocacion)
            .ExecuteUpdateAsync(actualizacion => actualizacion
                .SetProperty(
                    r => r.FechaRevocacion,
                    (DateTime?)fechaRevocacion)
                .SetProperty(
                    r => r.MotivoRevocacion,
                    motivo));

        // Solo una solicitud puede revocar el registro activo.
        return filasAfectadas == 1;
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}
