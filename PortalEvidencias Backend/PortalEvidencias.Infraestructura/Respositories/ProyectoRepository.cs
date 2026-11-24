using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class ProyectoRepository : IProyectoRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public ProyectoRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<Proyecto?> ObtenerPorIdAsync(int id)
    {
        return await _context.Proyectos
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Proyecto?> ObtenerPorIdYUsuarioAsync(
        int id, int usuarioId)
    {
        return await _context.Proyectos
            .FirstOrDefaultAsync(p =>
                p.Id == id && p.UsuarioId == usuarioId);
    }

    public async Task<List<Proyecto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Proyectos
            .Where(p => p.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<List<Proyecto>> ObtenerDestacadosPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Proyectos
            .Where(p => p.UsuarioId == usuarioId && p.EsDestacado)
            .ToListAsync();
    }

    public async Task AgregarAsync(Proyecto proyecto)
    {
        await _context.Proyectos.AddAsync(proyecto);
    }

    public void Actualizar(Proyecto proyecto)
    {
        _context.Proyectos.Update(proyecto);
    }

    public void Eliminar(Proyecto proyecto)
    {
        _context.Proyectos.Remove(proyecto);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}