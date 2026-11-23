
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IPracticaRepository
{
    Task<PracticaProfesional?> ObtenerPorIdAsync(int id);

    Task<PracticaProfesional?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId);

    Task<List<PracticaProfesional>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<bool> ExisteDocumentoAsociadoAsync(int documentoId);

    Task AgregarAsync(PracticaProfesional practica);

    void Actualizar(PracticaProfesional practica);

    void Eliminar(PracticaProfesional practica);

    Task GuardarCambiosAsync();
}
