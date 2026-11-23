using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class DocumentoRepository : IDocumentoRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public DocumentoRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<Documento?> ObtenerPorIdAsync(int id)
    {
        return await _context.Documentos
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Documento?> ObtenerPorIdYUsuarioAsync(
        int id, int usuarioId)
    {
        return await _context.Documentos
            .FirstOrDefaultAsync(d =>
                d.Id == id && d.UsuarioId == usuarioId);
    }

    public async Task<List<Documento>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.Documentos
            .Where(d => d.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<List<Documento>> ObtenerPorProyectoAsync(
        int proyectoId, int usuarioId)
    {
        return await _context.Documentos
            .Where(d =>
                d.ProyectoId == proyectoId &&
                d.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<List<Documento>> ObtenerPorTipoAsync(
        int usuarioId, TipoDocumento tipoDocumento)
    {
        return await _context.Documentos
            .Where(d =>
                d.UsuarioId == usuarioId &&
                d.TipoDocumento == tipoDocumento)
            .ToListAsync();
    }

    public async Task AgregarAsync(Documento documento)
    {
        await _context.Documentos.AddAsync(documento);
    }

    public void Actualizar(Documento documento)
    {
        _context.Documentos.Update(documento);
    }

    public void Eliminar(Documento documento)
    {
        _context.Documentos.Remove(documento);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}