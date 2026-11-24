using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class ActividadRepository : IActividadRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public ActividadRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<ActividadExtracurricular?> ObtenerPorIdAsync(int id)
    {
        return await _context.ActividadesExtracurriculares
            .Include(a => a.Documento)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<ActividadExtracurricular?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId)
    {
        return await _context.ActividadesExtracurriculares
            .Include(a => a.Documento)
            .FirstOrDefaultAsync(a =>
                a.Id == id &&
                a.UsuarioId == usuarioId);
    }

    public async Task<List<ActividadExtracurricular>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.ActividadesExtracurriculares
            .AsNoTracking()
            .Include(a => a.Documento)
            .Where(a => a.UsuarioId == usuarioId)
            .OrderByDescending(a => a.FechaCreacion)
            .ToListAsync();
    }

    public async Task<Documento?> ObtenerDocumentoPorIdYUsuarioAsync(
        int documentoId,
        int usuarioId)
    {
        return await _context.Documentos
            .FirstOrDefaultAsync(d =>
                d.Id == documentoId &&
                d.UsuarioId == usuarioId &&
                d.Estado == EstadoDocumento.Activo);
    }

    public async Task<bool> ExisteDocumentoAsync(
        int documentoId,
        int usuarioId)
    {
        return await _context.Documentos
            .AnyAsync(d =>
                d.Id == documentoId &&
                d.UsuarioId == usuarioId &&
                d.Estado == EstadoDocumento.Activo);
    }


    public async Task<bool> DocumentoEstaVinculadoAsync(
    int documentoId,
    int? actividadActualId = null,
    int? proyectoActualId = null)
    {
        return await _context.Documentos
            .AnyAsync(d =>
                d.Id == documentoId &&
                (
                    (
                        d.ProyectoId != null &&
                        d.ProyectoId != proyectoActualId
                    ) ||
                    d.ExperienciaLaboralId != null ||
                    (
                        d.ActividadExtracurricularId != null &&
                        d.ActividadExtracurricularId != actividadActualId
                    )
                ));
    }


    public async Task AgregarAsync(ActividadExtracurricular actividad)
    {
        await _context.ActividadesExtracurriculares.AddAsync(actividad);
    }

    public void Actualizar(ActividadExtracurricular actividad)
    {
        _context.ActividadesExtracurriculares.Update(actividad);
    }

    public void Eliminar(ActividadExtracurricular actividad)
    {
        _context.ActividadesExtracurriculares.Remove(actividad);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}