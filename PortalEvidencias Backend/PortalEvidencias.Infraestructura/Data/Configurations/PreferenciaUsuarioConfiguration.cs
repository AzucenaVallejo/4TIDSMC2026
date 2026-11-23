using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class PreferenciaUsuarioConfiguration
    : IEntityTypeConfiguration<PreferenciaUsuario>
{
    public void Configure(EntityTypeBuilder<PreferenciaUsuario> entity)
    {
        entity.ToTable("PreferenciasUsuarios");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Tema)
            .HasMaxLength(10)
            .IsRequired();

        entity.Property(x => x.ColorAcento)
            .HasMaxLength(7)
            .IsRequired();

        entity.Property(x => x.TamanoTexto)
            .HasMaxLength(10)
            .IsRequired();

        entity.Property(x => x.Idioma)
            .HasMaxLength(5)
            .IsRequired();

        entity.Property(x => x.FechaActualizacion)
            .IsRequired();

        entity.HasOne<Usuario>()
            .WithOne()
            .HasForeignKey<PreferenciaUsuario>(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        // Garantiza que cada usuario tenga como máximo una preferencia.
        entity.HasIndex(x => x.UsuarioId)
            .IsUnique();
    }
}