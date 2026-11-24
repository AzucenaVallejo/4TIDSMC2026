using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class FormacionRepository : IFormacionRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public FormacionRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<FormacionAcademica?> ObtenerPorIdAsync(int id)
    {
        return await _context.FormacionesAcademicas
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<FormacionAcademica?> ObtenerPorIdYUsuarioAsync(
        int id, int usuarioId)
    {
        return await _context.FormacionesAcademicas
            .FirstOrDefaultAsync(f =>
                f.Id == id && f.UsuarioId == usuarioId);
    }

    public async Task<List<FormacionAcademica>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.FormacionesAcademicas
            .Where(f => f.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task AgregarAsync(FormacionAcademica formacion)
    {
        await _context.FormacionesAcademicas.AddAsync(formacion);
    }
    public async Task<bool> ExisteDocumentoAsociadoAsync(int documentoId)
    {
        return await _context.FormacionesAcademicas
            .AnyAsync(f =>
                f.DocumentoCertificadoId == documentoId ||
                f.DocumentoTituloId == documentoId);
    }
    public void Actualizar(FormacionAcademica formacion)
    {
        _context.FormacionesAcademicas.Update(formacion);
    }

    public void Eliminar(FormacionAcademica formacion)
    {
        _context.FormacionesAcademicas.Remove(formacion);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}