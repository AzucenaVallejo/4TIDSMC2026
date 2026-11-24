using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class PreferenciaUsuarioRepository : IPreferenciaUsuarioRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public PreferenciaUsuarioRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<PreferenciaUsuario?> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.PreferenciasUsuarios
            .FirstOrDefaultAsync(x => x.UsuarioId == usuarioId);
    }

    public async Task AgregarAsync(PreferenciaUsuario preferencia)
    {
        await _context.PreferenciasUsuarios.AddAsync(preferencia);
    }

    public void Actualizar(PreferenciaUsuario preferencia)
    {
        _context.PreferenciasUsuarios.Update(preferencia);
    }

    public void Eliminar(PreferenciaUsuario preferencia)
    {
        _context.PreferenciasUsuarios.Remove(preferencia);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}