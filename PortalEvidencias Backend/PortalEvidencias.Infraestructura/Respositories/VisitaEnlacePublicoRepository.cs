using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class VisitaEnlacePublicoRepository : IVisitaEnlacePublicoRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public VisitaEnlacePublicoRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task AgregarAsync(VisitaEnlacePublico visita)
    {
        await _context.VisitasEnlacesPublicos.AddAsync(visita);
    }

    public Task<bool> ExisteMeGustaAsync(
        int enlacePublicoId,
        string identificadorVisitante)
    {
        return _context.VisitasEnlacesPublicos
            .AnyAsync(v =>
                v.EnlacePublicoId == enlacePublicoId &&
                v.TipoEvento == TipoEventoEnlacePublico.MeGusta &&
                v.IdentificadorVisitante == identificadorVisitante);
    }

    public Task<int> ContarEventosAsync(
        int enlacePublicoId,
        TipoEventoEnlacePublico tipoEvento,
        DateTime? desde = null)
    {
        var consulta = _context.VisitasEnlacesPublicos
            .Where(v =>
                v.EnlacePublicoId == enlacePublicoId &&
                v.TipoEvento == tipoEvento);

        if (desde.HasValue)
        {
            consulta = consulta.Where(v => v.FechaEvento >= desde.Value);
        }

        return consulta.CountAsync();
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}