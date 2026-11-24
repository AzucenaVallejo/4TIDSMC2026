using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class EnlacePublicoRepository : IEnlacePublicoRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public EnlacePublicoRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<EnlacePublico?> ObtenerPorIdAsync(int id)
    {
        return await _context.EnlacesPublicos
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<EnlacePublico?> ObtenerPorTokenAsync(string token)
    {
        return await _context.EnlacesPublicos
            .FirstOrDefaultAsync(e => e.Token == token);
    }

    public async Task<EnlacePublico?> ObtenerPorCodigoAccesoAsync(
        string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            return null;

        codigo = codigo.Trim().ToUpperInvariant();

        return await _context.EnlacesPublicos
            .FirstOrDefaultAsync(e => e.CodigoAcceso == codigo);
    }

    public async Task<List<EnlacePublico>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.EnlacesPublicos
            .Where(e => e.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task AgregarAsync(EnlacePublico enlace)
    {
        await _context.EnlacesPublicos.AddAsync(enlace);
    }

    public void Actualizar(EnlacePublico enlace)
    {
        _context.EnlacesPublicos.Update(enlace);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}