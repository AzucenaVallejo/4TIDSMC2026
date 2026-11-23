using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class VisitaEnlacePublicoConfiguration
    : IEntityTypeConfiguration<VisitaEnlacePublico>
{
    public void Configure(EntityTypeBuilder<VisitaEnlacePublico> builder)
    {
        builder.ToTable("VisitasEnlacesPublicos");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.TipoEvento)
            .IsRequired();

        builder.Property(v => v.FechaEvento)
            .IsRequired()
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(v => v.IdentificadorVisitante)
            .HasMaxLength(128)
            .IsRequired(false);

        builder.HasOne(v => v.EnlacePublico)
            .WithMany()
            .HasForeignKey(v => v.EnlacePublicoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => new
        {
            v.EnlacePublicoId,
            v.TipoEvento,
            v.FechaEvento
        });

        builder.HasIndex(v => new
        {
            v.EnlacePublicoId,
            v.IdentificadorVisitante,
            v.TipoEvento
        })
        .IsUnique()
        .HasFilter("[TipoEvento] = 2 AND [IdentificadorVisitante] IS NOT NULL");
    }
}