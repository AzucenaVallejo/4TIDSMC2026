using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class PerfilRepository : IPerfilRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public PerfilRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<Perfil?> ObtenerPorIdAsync(int id)
    {
        return await _context.Perfiles
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Perfil?> ObtenerPorUsuarioIdAsync(int usuarioId)
    {
        return await _context.Perfiles
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId);
    }

    public async Task AgregarAsync(Perfil perfil)
    {
        await _context.Perfiles.AddAsync(perfil);
    }

    public void Actualizar(Perfil perfil)
    {
        _context.Perfiles.Update(perfil);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}