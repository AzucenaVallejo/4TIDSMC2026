using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class EnlacePublicoConfiguration
    : IEntityTypeConfiguration<EnlacePublico>
{
    public void Configure(EntityTypeBuilder<EnlacePublico> entity)
    {
        entity.ToTable("EnlacesPublicos");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Token)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.CodigoAcceso)
            .HasMaxLength(10)
            .IsRequired();

        entity.Property(x => x.Estado)
            .HasConversion<int>();

        entity.Property(x => x.FechaCreacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasIndex(x => x.Token)
            .IsUnique();

        entity.HasIndex(x => x.CodigoAcceso)
            .IsUnique();

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.EnlacesPublicos)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.Curriculum)
            .WithMany()
            .HasForeignKey(x => x.CurriculumId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.CurriculumId);
    }
}