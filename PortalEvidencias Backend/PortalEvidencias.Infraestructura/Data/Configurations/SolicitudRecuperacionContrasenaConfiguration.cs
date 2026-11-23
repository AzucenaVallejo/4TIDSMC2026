
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class SolicitudRecuperacionContrasenaConfiguration
    : IEntityTypeConfiguration<SolicitudRecuperacionContrasena>
{
    public void Configure(EntityTypeBuilder<SolicitudRecuperacionContrasena> builder)
    {
        builder.ToTable("SolicitudesRecuperacionContrasena");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.CodigoHash)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(s => s.TokenRestablecimientoHash)
            .HasMaxLength(512);

        builder.Property(s => s.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(s => s.IntentosFallidos)
            .IsRequired();

        builder.Property(s => s.FechaExpiracionCodigo)
            .IsRequired();

        builder.Property(s => s.FechaCreacion)
            .IsRequired();

        builder.HasIndex(s => s.UsuarioId);

        builder.HasIndex(s => s.Estado);

        builder.HasOne(s => s.Usuario)
            .WithMany()
            .HasForeignKey(s => s.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
