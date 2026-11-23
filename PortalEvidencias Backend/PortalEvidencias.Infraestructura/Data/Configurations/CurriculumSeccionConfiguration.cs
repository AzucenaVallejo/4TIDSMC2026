
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class CurriculumSeccionConfiguration
    : IEntityTypeConfiguration<CurriculumSeccion>
{
    public void Configure(EntityTypeBuilder<CurriculumSeccion> entity)
    {
        entity.ToTable("CurriculumSecciones");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.TipoSeccion)
            .HasMaxLength(80)
            .IsRequired();

        entity.Property(x => x.Titulo)
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(x => x.Configuracion)
            .HasColumnType("nvarchar(max)");

        entity.Property(x => x.Visible)
            .HasDefaultValue(true);

        entity.HasOne(x => x.Curriculum)
            .WithMany(x => x.Secciones)
            .HasForeignKey(x => x.CurriculumId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => new
        {
            x.CurriculumId,
            x.Orden
        });
    }
}
