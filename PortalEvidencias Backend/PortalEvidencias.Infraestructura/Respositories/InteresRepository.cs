using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class InteresRepository : IInteresRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public InteresRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }


    public async Task<Interes?> ObtenerPorIdYUsuarioAsync(
        int id, int usuarioId)
    {
        return await _context.Intereses
            .FirstOrDefaultAsync(i =>
                i.Id == id && i.UsuarioId == usuarioId);
    }

    public async Task<List<Interes>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Intereses
            .Where(i => i.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task AgregarAsync(Interes interes)
    {
        await _context.Intereses.AddAsync(interes);
    }

    public void Actualizar(Interes interes)
    {
        _context.Intereses.Update(interes);
    }

    public void Eliminar(Interes interes)
    {
        _context.Intereses.Remove(interes);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}