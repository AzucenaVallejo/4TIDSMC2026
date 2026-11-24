using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;
using PortalEvidencias.Infraestructura.Data;

namespace PortalEvidencias.Infraestructura.Repositories;

public class CuentaExternaRepository : ICuentaExternaRepository
{
    private readonly PortalEvidenciasDbContext _context;

    public CuentaExternaRepository(PortalEvidenciasDbContext context)
    {
        _context = context;
    }

    public async Task<CuentaExterna?> ObtenerPorIdAsync(int id)
    {
        return await _context.CuentasExternas
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<CuentaExterna?> ObtenerPorUsuarioYProveedorAsync(
        int usuarioId, ProveedorAutenticacion proveedor)
    {
        return await _context.CuentasExternas
            .FirstOrDefaultAsync(c =>
                c.UsuarioId == usuarioId &&
                c.Proveedor == proveedor);
    }

    public async Task<CuentaExterna?> ObtenerPorProveedorEIdentificadorAsync(
        ProveedorAutenticacion proveedor, string identificadorExterno)
    {
        return await _context.CuentasExternas
            .FirstOrDefaultAsync(c =>
                c.Proveedor == proveedor &&
                c.IdentificadorExterno == identificadorExterno);
    }

    public async Task<List<CuentaExterna>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        return await _context.CuentasExternas
            .Where(c => c.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task AgregarAsync(CuentaExterna cuenta)
    {
        await _context.CuentasExternas.AddAsync(cuenta);
    }

    public void Eliminar(CuentaExterna cuenta)
    {
        _context.CuentasExternas.Remove(cuenta);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}