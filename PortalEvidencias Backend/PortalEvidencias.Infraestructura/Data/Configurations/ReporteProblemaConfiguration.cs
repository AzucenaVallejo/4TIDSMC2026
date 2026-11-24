using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class ReporteProblemaConfiguration
    : IEntityTypeConfiguration<ReporteProblema>
{
    public void Configure(EntityTypeBuilder<ReporteProblema> entity)
    {
        entity.ToTable("ReportesProblemas");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Tipo)
            .HasMaxLength(30)
            .IsRequired();

        entity.Property(x => x.Asunto)
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(x => x.Descripcion)
            .HasMaxLength(2000)
            .IsRequired();

        entity.Property(x => x.Estado)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.FechaCreacion)
            .IsRequired();

        entity.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);

        entity.HasIndex(x => new
        {
            x.UsuarioId,
            x.FechaCreacion
        });
    }
}