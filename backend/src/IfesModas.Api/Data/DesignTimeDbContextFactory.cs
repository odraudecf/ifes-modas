using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IfesModas.Api.Data;

/// <summary>
/// Usado só pelo `dotnet ef migrations add`. Com ele, gerar migrations não exige um banco
/// configurado nem os segredos da aplicação (chave JWT etc.).
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=ifes_modas;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;
        return new AppDbContext(options);
    }
}
