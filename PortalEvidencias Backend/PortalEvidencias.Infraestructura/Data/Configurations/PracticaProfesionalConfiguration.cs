
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class PracticaProfesionalConfiguration
    : IEntityTypeConfiguration<PracticaProfesional>
{
    public void Configure(EntityTypeBuilder<PracticaProfesional> entity)
    {
        entity.ToTable("PracticasProfesionales");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Empresa)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.Puesto)
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(x => x.InstitucionEducativa)
            .HasMaxLength(200);

        entity.Property(x => x.Descripcion)
            .HasMaxLength(3000);

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.PracticasProfesionales)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.Documento)
            .WithOne()
            .HasForeignKey<PracticaProfesional>(x => x.DocumentoId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
    }
}
