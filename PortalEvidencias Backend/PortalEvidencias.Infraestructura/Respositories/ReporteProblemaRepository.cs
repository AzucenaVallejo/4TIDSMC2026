using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class ReporteProblemaRepository : IReporteProblemaRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public ReporteProblemaRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<ReporteProblema?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId)
    {
        return await _context.ReportesProblemas
            .FirstOrDefaultAsync(x =>
                x.Id == id && x.UsuarioId == usuarioId);
    }

    public async Task<List<ReporteProblema>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.ReportesProblemas
            .Where(x => x.UsuarioId == usuarioId)
            .OrderByDescending(x => x.FechaCreacion)
            .ToListAsync();
    }

    public async Task AgregarAsync(ReporteProblema reporte)
    {
        await _context.ReportesProblemas.AddAsync(reporte);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}