
namespace PortalEvidencias.Dominio.Entities;

public class Usuario
{
    public int Id { get; set; }

    public string Correo { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool CorreoVerificado { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaActualizacion { get; set; }

    // Relaciones
    public Perfil? Perfil { get; set; }

    public ICollection<CuentaExterna> CuentasExternas { get; set; }
        = new List<CuentaExterna>();

    public ICollection<Documento> Documentos { get; set; }
        = new List<Documento>();

    public ICollection<FormacionAcademica> Formaciones { get; set; }
        = new List<FormacionAcademica>();

    public ICollection<ExperienciaLaboral> Experiencias { get; set; }
        = new List<ExperienciaLaboral>();

    public ICollection<ActividadExtracurricular> ActividadesExtracurriculares { get; set; }
        = new List<ActividadExtracurricular>();

    public ICollection<Proyecto> Proyectos { get; set; }
        = new List<Proyecto>();

    public ICollection<PracticaProfesional> PracticasProfesionales { get; set; }
        = new List<PracticaProfesional>();

    public ICollection<Habilidad> Habilidades { get; set; }
    = new List<Habilidad>();

    public ICollection<Interes> Intereses { get; set; }
        = new List<Interes>();

    public ICollection<Curriculum> Curriculums { get; set; }
        = new List<Curriculum>();

    public ICollection<EnlacePublico> EnlacesPublicos { get; set; }
        = new List<EnlacePublico>();

    public ICollection<RefreshToken> RefreshTokens { get; set; }
        = new List<RefreshToken>();
}
