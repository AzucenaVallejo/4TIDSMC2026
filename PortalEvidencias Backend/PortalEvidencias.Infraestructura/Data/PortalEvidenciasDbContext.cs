
using Microsoft.EntityFrameworkCore;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data;

public class PortalEvidenciasDbContext : DbContext
{
    public PortalEvidenciasDbContext(
        DbContextOptions<PortalEvidenciasDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<CuentaExterna> CuentasExternas => Set<CuentaExterna>();
    public DbSet<Perfil> Perfiles => Set<Perfil>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<FormacionAcademica> FormacionesAcademicas => Set<FormacionAcademica>();
    public DbSet<ExperienciaLaboral> ExperienciasLaborales => Set<ExperienciaLaboral>();
    public DbSet<ActividadExtracurricular> ActividadesExtracurriculares => Set<ActividadExtracurricular>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<PracticaProfesional> PracticasProfesionales => Set<PracticaProfesional>();
    public DbSet<Habilidad> Habilidades => Set<Habilidad>();
    public DbSet<Interes> Intereses => Set<Interes>();
    public DbSet<Curriculum> Curriculums => Set<Curriculum>();
    public DbSet<CurriculumSeccion> CurriculumSecciones => Set<CurriculumSeccion>();
    public DbSet<EnlacePublico> EnlacesPublicos => Set<EnlacePublico>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PreferenciaUsuario> PreferenciasUsuarios { get; set; }
    public DbSet<ReporteProblema> ReportesProblemas { get; set; }
    public DbSet<ConfiguracionPrivacidad> ConfiguracionesPrivacidad { get; set; }
    public DbSet<VisitaEnlacePublico> VisitasEnlacesPublicos { get; set; }
    public DbSet<SolicitudRecuperacionContrasena> SolicitudesRecuperacionContrasena
    => Set<SolicitudRecuperacionContrasena>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(PortalEvidenciasDbContext).Assembly);

        modelBuilder.Entity<PracticaProfesional>()
            .HasOne(p => p.Documento)
            .WithMany()
            .HasForeignKey(p => p.DocumentoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
