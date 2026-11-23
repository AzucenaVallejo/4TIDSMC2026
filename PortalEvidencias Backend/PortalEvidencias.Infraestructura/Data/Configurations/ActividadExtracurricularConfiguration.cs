using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class ActividadExtracurricularConfiguration
    : IEntityTypeConfiguration<ActividadExtracurricular>
{
    public void Configure(EntityTypeBuilder<ActividadExtracurricular> entity)
    {
        entity.ToTable("ActividadesExtracurriculares", table =>
        {
            table.HasCheckConstraint(
                "CK_ActividadesExtracurriculares_Duracion",
                "[Duracion] IS NULL OR [Duracion] > 0");
        });

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Nombre)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.Tipo)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.Modalidad)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.Organizacion)
            .HasMaxLength(200);

        entity.Property(x => x.Descripcion)
            .HasMaxLength(3000);

        entity.Property(x => x.Estado)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.Duracion)
            .HasPrecision(8, 2);

        entity.Property(x => x.UnidadDuracion)
            .HasConversion<int>();

        entity.Property(x => x.FechaCreacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.ActividadesExtracurriculares)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.Documento)
            .WithOne(x => x.ActividadExtracurricular)
            .HasForeignKey<Documento>(x => x.ActividadExtracurricularId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
    }
}