
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class CurriculumConfiguration : IEntityTypeConfiguration<Curriculum>
{
    public void Configure(EntityTypeBuilder<Curriculum> entity)
    {
        entity.ToTable("Curriculums");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Titulo)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.Descripcion)
            .HasMaxLength(1000);

        entity.Property(x => x.EsPredeterminado)
            .HasDefaultValue(false);

        entity.Property(x => x.EsPublico)
            .HasDefaultValue(false);

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.Curriculums)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
    }
}
