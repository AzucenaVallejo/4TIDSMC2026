
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class RefreshTokenConfiguration
    : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> entity)
    {
        entity.ToTable("RefreshTokens");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.TokenHash)
            .HasMaxLength(500)
            .IsRequired();

        entity.Property(x => x.DireccionIpCreacion)
            .HasMaxLength(45);

        entity.Property(x => x.MotivoRevocacion)
            .HasMaxLength(500);

        entity.Property(x => x.FechaCreacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasIndex(x => x.TokenHash)
            .IsUnique();

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.RefreshTokens)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => new
        {
            x.UsuarioId,
            x.FechaExpiracion
        });
    }
}
