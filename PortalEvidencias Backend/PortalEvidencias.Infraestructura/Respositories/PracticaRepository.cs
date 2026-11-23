
using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class PracticaRepository : IPracticaRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public PracticaRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<PracticaProfesional?> ObtenerPorIdAsync(int id)
    {
        return await _context.PracticasProfesionales
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PracticaProfesional?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId)
    {
        return await _context.PracticasProfesionales
            .FirstOrDefaultAsync(p =>
                p.Id == id && p.UsuarioId == usuarioId);
    }

    public async Task<List<PracticaProfesional>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.PracticasProfesionales
            .Where(p => p.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<bool> ExisteDocumentoAsociadoAsync(int documentoId)
    {
        return await _context.PracticasProfesionales
            .AnyAsync(p => p.DocumentoId == documentoId);
    }

    public async Task AgregarAsync(PracticaProfesional practica)
    {
        await _context.PracticasProfesionales.AddAsync(practica);
    }

    public void Actualizar(PracticaProfesional practica)
    {
        _context.PracticasProfesionales.Update(practica);
    }

    public void Eliminar(PracticaProfesional practica)
    {
        _context.PracticasProfesionales.Remove(practica);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}
