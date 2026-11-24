
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class ExperienciaLaboralConfiguration
    : IEntityTypeConfiguration<ExperienciaLaboral>
{
    public void Configure(EntityTypeBuilder<ExperienciaLaboral> entity)
    {
        entity.ToTable("ExperienciasLaborales");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Empresa)
    .HasMaxLength(150)
    .IsRequired();

        entity.Property(x => x.Puesto)
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(x => x.Tipo)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.Modalidad)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.Ubicacion)
            .HasMaxLength(200);

        entity.Property(x => x.Descripcion)
     .HasMaxLength(1000);

        entity.Property(x => x.FechaCreacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.Experiencias)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
    }
}
