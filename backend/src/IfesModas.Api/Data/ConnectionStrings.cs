using Npgsql;

namespace IfesModas.Api.Data;

public static class ConnectionStrings
{
    /// <summary>
    /// O Neon (e o Render) entregam a conexão em formato URL:
    /// <c>postgresql://usuario:senha@host/banco?sslmode=require</c>.
    /// O Npgsql só entende o formato chave=valor, então convertemos aqui.
    /// Se a string já estiver no formato do Npgsql, ela é devolvida sem mudança.
    /// </summary>
    public static string ParaNpgsql(string connectionString)
    {
        if (!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return connectionString;

        var uri = new Uri(connectionString);
        var credenciais = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(credenciais[0]),
            Password = credenciais.Length > 1 ? Uri.UnescapeDataString(credenciais[1]) : null,
            SslMode = SslMode.Require
        };

        // Repassa parâmetros conhecidos da query (?sslmode=...). channel_binding é do libpq e o Npgsql ignora.
        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        if (Enum.TryParse<SslMode>(query["sslmode"]?.Replace("-", ""), ignoreCase: true, out var ssl))
            builder.SslMode = ssl;

        return builder.ConnectionString;
    }
}
