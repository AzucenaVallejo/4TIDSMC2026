
using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class SolicitudRecuperacionContrasenaRepository
    : ISolicitudRecuperacionContrasenaRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public SolicitudRecuperacionContrasenaRepository(
        PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<SolicitudRecuperacionContrasena?> ObtenerPorIdAsync(
        int id)
    {
        return await _context.SolicitudesRecuperacionContrasena
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<SolicitudRecuperacionContrasena?> ObtenerUltimaPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.SolicitudesRecuperacionContrasena
            .Where(s => s.UsuarioId == usuarioId)
            .OrderByDescending(s => s.FechaCreacion)
            .FirstOrDefaultAsync();
    }

    public async Task<SolicitudRecuperacionContrasena?> ObtenerPorTokenHashAsync(
        string tokenHash)
    {
        return await _context.SolicitudesRecuperacionContrasena
            .FirstOrDefaultAsync(s =>
                s.TokenRestablecimientoHash == tokenHash);
    }

    public async Task AgregarAsync(
        SolicitudRecuperacionContrasena solicitud)
    {
        await _context.SolicitudesRecuperacionContrasena
            .AddAsync(solicitud);
    }

    public void Actualizar(
        SolicitudRecuperacionContrasena solicitud)
    {
        _context.SolicitudesRecuperacionContrasena.Update(solicitud);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}
