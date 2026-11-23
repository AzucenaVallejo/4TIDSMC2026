using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class ConfiguracionPrivacidadRepository
    : IConfiguracionPrivacidadRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public ConfiguracionPrivacidadRepository(
        PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<ConfiguracionPrivacidad?> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.ConfiguracionesPrivacidad
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId);
    }

    public async Task AgregarAsync(
        ConfiguracionPrivacidad configuracion)
    {
        await _context.ConfiguracionesPrivacidad.AddAsync(configuracion);
    }

    public void Actualizar(ConfiguracionPrivacidad configuracion)
    {
        _context.ConfiguracionesPrivacidad.Update(configuracion);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}