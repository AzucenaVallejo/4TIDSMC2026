using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class HabilidadRepository : IHabilidadRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public HabilidadRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<Habilidad?> ObtenerPorIdAsync(
        int usuarioId,
        int habilidadId)
    {
        return await _context.Habilidades
            .FirstOrDefaultAsync(h =>
                h.Id == habilidadId &&
                h.UsuarioId == usuarioId);
    }

    public async Task<List<Habilidad>> ObtenerPorUsuarioAsync(int usuarioId)
    {
        return await _context.Habilidades
            .Where(h => h.UsuarioId == usuarioId)
            .OrderBy(h => h.Nombre)
            .ToListAsync();
    }

    public async Task AgregarAsync(Habilidad habilidad)
    {
        await _context.Habilidades.AddAsync(habilidad);
    }

    public void Actualizar(Habilidad habilidad)
    {
        _context.Habilidades.Update(habilidad);
    }

    public void Eliminar(Habilidad habilidad)
    {
        _context.Habilidades.Remove(habilidad);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}