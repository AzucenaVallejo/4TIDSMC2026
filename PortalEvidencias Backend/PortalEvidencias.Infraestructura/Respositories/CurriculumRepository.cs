using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class CurriculumRepository : ICurriculumRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public CurriculumRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<Curriculum?> ObtenerPorIdAsync(int id)
    {
        return await _context.Curriculums
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Curriculum?> ObtenerPorIdYUsuarioAsync(
        int id, int usuarioId)
    {
        return await _context.Curriculums
            .FirstOrDefaultAsync(c =>
                c.Id == id && c.UsuarioId == usuarioId);
    }

    public async Task<Curriculum?> ObtenerPorIdConSeccionesAsync(int id)
    {
        return await _context.Curriculums
            .Include(c => c.Secciones)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<List<Curriculum>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Curriculums
            .Where(c => c.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<Curriculum?> ObtenerPredeterminadoPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Curriculums
            .FirstOrDefaultAsync(c =>
                c.UsuarioId == usuarioId &&
                c.EsPredeterminado);
    }

    public async Task<Curriculum?> ObtenerPredeterminadoConSeccionesPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Curriculums
            .Include(c => c.Secciones)
            .FirstOrDefaultAsync(c =>
                c.UsuarioId == usuarioId &&
                c.EsPredeterminado);
    }

    public async Task AgregarAsync(Curriculum curriculum)
    {
        await _context.Curriculums.AddAsync(curriculum);
    }

    public void Actualizar(Curriculum curriculum)
    {
        _context.Curriculums.Update(curriculum);
    }

    public void Eliminar(Curriculum curriculum)
    {
        _context.Curriculums.Remove(curriculum);
    }
    public async Task EliminarSeccionesAsync(int curriculumId)
    {
        var secciones = await _context.CurriculumSecciones
            .Where(s => s.CurriculumId == curriculumId)
            .ToListAsync();

        if (secciones.Count > 0)
        {
            _context.CurriculumSecciones.RemoveRange(secciones);
        }
    }
    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}