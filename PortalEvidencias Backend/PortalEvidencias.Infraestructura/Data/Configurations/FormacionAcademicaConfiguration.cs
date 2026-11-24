
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class FormacionAcademicaConfiguration
    : IEntityTypeConfiguration<FormacionAcademica>
{
    public void Configure(EntityTypeBuilder<FormacionAcademica> entity)
    {
        entity.ToTable("FormacionesAcademicas");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Nivel)
            .HasConversion<int>();

        entity.Property(x => x.Institucion)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.NombrePrograma)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.Descripcion)
            .HasMaxLength(2000);

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.Formaciones)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne<Documento>()
            .WithMany()
            .HasForeignKey(x => x.DocumentoCertificadoId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne<Documento>()
            .WithMany()
            .HasForeignKey(x => x.DocumentoTituloId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
        entity.HasIndex(x => x.DocumentoCertificadoId);
        entity.HasIndex(x => x.DocumentoTituloId);
    }
}
