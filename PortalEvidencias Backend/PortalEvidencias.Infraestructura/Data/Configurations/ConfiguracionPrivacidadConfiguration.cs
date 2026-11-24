using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class ConfiguracionPrivacidadConfiguration
    : IEntityTypeConfiguration<ConfiguracionPrivacidad>
{
    public void Configure(
        EntityTypeBuilder<ConfiguracionPrivacidad> entity)
    {
        entity.ToTable("ConfiguracionesPrivacidad");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.UsuarioId)
            .IsRequired();

        entity.Property(x => x.DocumentosPublicosJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        entity.Property(x => x.FechaCreacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasIndex(x => x.UsuarioId)
            .IsUnique();
    }
}