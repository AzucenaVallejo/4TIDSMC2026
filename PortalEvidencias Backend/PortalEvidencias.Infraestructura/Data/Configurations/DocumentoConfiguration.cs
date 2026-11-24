
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class DocumentoConfiguration : IEntityTypeConfiguration<Documento>
{
    public void Configure(EntityTypeBuilder<Documento> entity)
    {
        entity.ToTable("Documentos", table =>
        {
            table.HasCheckConstraint(
                "CK_Documentos_TamanoBytes",
                "[TamanoBytes] >= 0");
        });

        entity.HasKey(x => x.Id);

        entity.Property(x => x.NombreArchivo)
            .HasMaxLength(255)
            .IsRequired();

        entity.Property(x => x.TipoContenido)
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(x => x.TamanoBytes)
            .IsRequired();

        entity.Property(x => x.TipoDocumento)
            .HasConversion<int>();

        entity.Property(x => x.Estado)
            .HasConversion<int>();

        entity.Property(x => x.Contenido)
            .HasColumnType("varbinary(max)")
            .IsRequired();

        entity.Property(x => x.FechaCarga)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.Documentos)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.Proyecto)
            .WithMany(x => x.Documentos)
            .HasForeignKey(x => x.ProyectoId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.ActividadExtracurricular)
            .WithOne(x => x.Documento)
            .HasForeignKey<Documento>(x => x.ActividadExtracurricularId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.ExperienciaLaboral)
            .WithOne(x => x.Documento)
            .HasForeignKey<Documento>(x => x.ExperienciaLaboralId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
        entity.HasIndex(x => x.TipoDocumento);
        entity.HasIndex(x => x.ProyectoId);
        entity.HasIndex(x => x.ActividadExtracurricularId);
        entity.HasIndex(x => x.ExperienciaLaboralId);
    }
}
