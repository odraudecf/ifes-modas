using IfesModas.Api.Data;
using Npgsql;

namespace IfesModas.Tests.Unit;

public class ConnectionStringsTests
{
    [Fact]
    public void Converte_url_do_Neon_para_formato_Npgsql()
    {
        var url = "postgresql://ifes_owner:s3nh%40forte@ep-cool-name-123.sa-east-1.aws.neon.tech/ifes_modas?sslmode=require&channel_binding=require";

        var cs = new NpgsqlConnectionStringBuilder(ConnectionStrings.ParaNpgsql(url));

        Assert.Equal("ep-cool-name-123.sa-east-1.aws.neon.tech", cs.Host);
        Assert.Equal(5432, cs.Port);
        Assert.Equal("ifes_modas", cs.Database);
        Assert.Equal("ifes_owner", cs.Username);
        Assert.Equal("s3nh@forte", cs.Password); // %40 decodificado
        Assert.Equal(SslMode.Require, cs.SslMode);
    }

    [Fact]
    public void Mantem_string_que_ja_esta_no_formato_Npgsql()
    {
        const string cs = "Host=localhost;Database=ifes_modas;Username=postgres;Password=postgres";
        Assert.Equal(cs, ConnectionStrings.ParaNpgsql(cs));
    }
}
