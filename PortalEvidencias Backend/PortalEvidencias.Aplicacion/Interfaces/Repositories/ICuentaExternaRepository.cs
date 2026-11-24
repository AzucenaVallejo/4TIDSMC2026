
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface ICuentaExternaRepository
{
    Task<CuentaExterna?> ObtenerPorIdAsync(int id);
    Task<CuentaExterna?> ObtenerPorUsuarioYProveedorAsync(
        int usuarioId, ProveedorAutenticacion proveedor);
    Task<CuentaExterna?> ObtenerPorProveedorEIdentificadorAsync(
        ProveedorAutenticacion proveedor, string identificadorExterno);
    Task<List<CuentaExterna>> ObtenerPorUsuarioAsync(int usuarioId);
    Task AgregarAsync(CuentaExterna cuenta);
    void Eliminar(CuentaExterna cuenta);
    Task GuardarCambiosAsync();
}
