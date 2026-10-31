using IfesModas.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IfesModas.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Loja> Lojas => Set<Loja>();
    public DbSet<Endereco> Enderecos => Set<Endereco>();
    public DbSet<Uniforme> Uniformes => Set<Uniforme>();
    public DbSet<Administrador> Administradores => Set<Administrador>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Loja>(e =>
        {
            e.Property(l => l.Cnpj).HasMaxLength(14).IsRequired();
            e.HasIndex(l => l.Cnpj).IsUnique(); // a mesma loja não se cadastra duas vezes
            e.Property(l => l.Nome).HasMaxLength(120).IsRequired();
            e.Property(l => l.Telefone).HasMaxLength(11).IsRequired();
            e.Property(l => l.Instagram).HasMaxLength(255);
            e.Property(l => l.Facebook).HasMaxLength(255);
            e.Property(l => l.SenhaHash).HasMaxLength(100).IsRequired();

            e.HasOne(l => l.Endereco)
                .WithOne(en => en.Loja)
                .HasForeignKey<Endereco>(en => en.LojaId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(l => l.Uniformes)
                .WithOne(u => u.Loja)
                .HasForeignKey(u => u.LojaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Endereco>(e =>
        {
            e.Property(en => en.Rua).HasMaxLength(150).IsRequired();
            e.Property(en => en.Numero).HasMaxLength(10).IsRequired();
            e.Property(en => en.Bairro).HasMaxLength(100).IsRequired();
            e.Property(en => en.Cidade).HasMaxLength(100).IsRequired();
            e.Property(en => en.Uf).HasMaxLength(2).IsFixedLength().IsRequired();
            e.HasIndex(en => new { en.Uf, en.Cidade }); // usado na listagem por estado/cidade (RF03)
        });

        modelBuilder.Entity<Administrador>(e =>
        {
            e.Property(a => a.Usuario).HasMaxLength(40).IsRequired();
            e.HasIndex(a => a.Usuario).IsUnique();
            e.Property(a => a.SenhaHash).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<Uniforme>(e =>
        {
            // Enums gravados como texto ("Camisa", "Padrao"): o banco fica legível sem tabela auxiliar.
            e.Property(u => u.Tipo).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.Modelo).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.Genero).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.Tamanho).HasMaxLength(5).IsRequired();
            e.Property(u => u.Preco).HasPrecision(10, 2);
        });
    }
}
