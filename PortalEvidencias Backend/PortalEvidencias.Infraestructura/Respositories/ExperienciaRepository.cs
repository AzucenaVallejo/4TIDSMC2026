
using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class ExperienciaRepository : IExperienciaRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public ExperienciaRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<ExperienciaLaboral?> ObtenerPorIdAsync(int id)
    {
        return await _context.ExperienciasLaborales
            .Include(x => x.Documento)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<ExperienciaLaboral?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId)
    {
        return await _context.ExperienciasLaborales
            .Include(x => x.Documento)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.UsuarioId == usuarioId);
    }

    public async Task<List<ExperienciaLaboral>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.ExperienciasLaborales
            .Include(x => x.Documento)
            .Where(x => x.UsuarioId == usuarioId)
            .OrderByDescending(x => x.FechaInicio)
            .ToListAsync();
    }

    public async Task<Documento?> ObtenerDocumentoPorIdYUsuarioAsync(
        int documentoId,
        int usuarioId)
    {
        return await _context.Documentos
            .FirstOrDefaultAsync(x =>
                x.Id == documentoId &&
                x.UsuarioId == usuarioId);
    }

    public async Task<bool> DocumentoEstaVinculadoAsync(
    int documentoId,
    int experienciaActualId)
    {
        return await _context.Documentos
            .AnyAsync(x =>
                x.Id == documentoId &&
                (
                    x.ActividadExtracurricularId != null ||
                    x.ProyectoId != null ||
                    (
                        x.ExperienciaLaboralId != null &&
                        x.ExperienciaLaboralId != experienciaActualId
                    )
                ));
    }

    public async Task AgregarAsync(ExperienciaLaboral experiencia)
    {
        await _context.ExperienciasLaborales.AddAsync(experiencia);
    }

    public void Actualizar(ExperienciaLaboral experiencia)
    {
        _context.ExperienciasLaborales.Update(experiencia);
    }

    public void Eliminar(ExperienciaLaboral experiencia)
    {
        _context.ExperienciasLaborales.Remove(experiencia);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}
