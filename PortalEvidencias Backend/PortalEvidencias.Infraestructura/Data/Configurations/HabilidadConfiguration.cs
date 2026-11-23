using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class HabilidadConfiguration : IEntityTypeConfiguration<Habilidad>
{
    public void Configure(EntityTypeBuilder<Habilidad> entity)
    {
        entity.ToTable("Habilidades", table =>
        {
            table.HasCheckConstraint(
                "CK_Habilidades_PorcentajeDominio",
                "[PorcentajeDominio] IS NULL OR " +
                "([PorcentajeDominio] >= 0 AND [PorcentajeDominio] <= 100)");
        });

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Nombre)
            .HasMaxLength(120)
            .IsRequired();

        entity.Property(x => x.Descripcion)
            .HasMaxLength(1000);

        entity.Property(x => x.Activa)
            .HasDefaultValue(true);

        entity.Property(x => x.Categoria)
            .HasMaxLength(30)
            .IsRequired();

        entity.Property(x => x.Nivel)
            .HasMaxLength(50);

        entity.Property(x => x.Experiencia)
            .HasMaxLength(30);

        entity.HasIndex(x => new
        {
            x.UsuarioId,
            x.Nombre
        })
        .IsUnique();

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.Habilidades)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}