using System.Reflection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using IfesModas.Api;
using IfesModas.Api.Data;
using IfesModas.Api.Errors;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// O Render informa em qual porta o container deve escutar pela variável PORT.
if (Environment.GetEnvironmentVariable("PORT") is { Length: > 0 } port)
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ---------- Banco de dados (PostgreSQL no Neon, via EF Core + Npgsql) ----------
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Configure ConnectionStrings__Default (string de conexão do Postgres).");

builder.Services.AddDbContext<AppDbContext>(opt => opt
    .UseNpgsql(ConnectionStrings.ParaNpgsql(connectionString))
    .UseSnakeCaseNamingConvention()); // tabelas/colunas em snake_case, o padrão do Postgres

// ---------- Serviços da aplicação ----------
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<LojaService>();
builder.Services.AddScoped<UniformeService>();
builder.Services.Configure<CadastroOptions>(builder.Configuration.GetSection(CadastroOptions.Secao));
builder.Services.AddHttpClient<ConsultaCnpjService>(c =>
{
    c.Timeout = TimeSpan.FromSeconds(8); // uma API lenta não pode travar o cadastro: passa para a próxima
    c.DefaultRequestHeaders.UserAgent.ParseAdd("IfesModas/2.0 (+https://ifes-modas.onrender.com)");
});

// ---------- Autenticação JWT ----------
builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.Secao))
    .ValidateDataAnnotations()
    .ValidateOnStart(); // sem chave JWT válida a API nem sobe (falha cedo, com mensagem clara)

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwt) =>
    {
        bearer.MapInboundClaims = false; // mantém "sub" como "sub" (sem renomear para os nomes longos da Microsoft)
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Value.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Value.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = TokenService.ChaveDeAssinatura(jwt.Value.Key),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

// ---------- CORS: só o front publicado (e o Vite local) pode chamar a API pelo navegador ----------
// Aceita a origem com ou sem esquema ("ifes-modas.onrender.com" vira "https://ifes-modas.onrender.com").
var origens = (builder.Configuration["Cors:Origins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(o => o.Contains("://") ? o.TrimEnd('/') : $"https://{o.TrimEnd('/')}")
    .ToArray();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origens).AllowAnyHeader().AllowAnyMethod()));

// ---------- Rate limit nas rotas de login/cadastro ----------
var limiteAuth = builder.Configuration.GetValue("RateLimit:AuthPorMinuto", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy(RateLimitPolicies.Auth, ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = limiteAuth, Window = TimeSpan.FromMinutes(1) }));
});

// O Render fica atrás de um proxy: sem isto, todo mundo teria o IP do proxy (e o rate limit valeria para todos juntos).
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

// ---------- Erros no formato ProblemDetails ----------
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx =>
    ctx.ProblemDetails.Title = MensagensPadrao.Traduzir(ctx.ProblemDetails.Status, ctx.ProblemDetails.Title));
builder.Services.AddExceptionHandler<ApiExceptionHandler>();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter())); // enums como "Camisa", não 0

builder.Services.AddHealthChecks();

// ---------- Swagger (Swashbuckle) com botão "Authorize" para o JWT ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Ifes Modas API",
        Version = "v1",
        Description = "Lojas de uniformes do Ifes Campus de Alegre. Rotas de consulta são públicas; " +
                      "gerenciamento exige token (faça login em /api/auth/login e clique em Authorize)."
    });
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml"));

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Cole aqui só o token (sem a palavra Bearer)."
    });
    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", doc)] = []
    });
});

var app = builder.Build();

// ---------- Migrations + dados de demonstração na subida ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsRelational())
        await db.Database.MigrateAsync();
    else
        await db.Database.EnsureCreatedAsync(); // testes (banco em memória)

    if (app.Configuration.GetValue("Seed:Enabled", true))
        await DbSeeder.SeedAsync(db);
}

// ---------- Pipeline HTTP ----------
app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages(); // 401/403/404 sem corpo também viram ProblemDetails

// Swagger também em produção: o professor testa a API publicada direto pelo navegador.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.DocumentTitle = "Ifes Modas API";
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ifes Modas API v1");
});

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

// Torna a classe Program visível para os testes de integração (WebApplicationFactory<Program>).
public partial class Program;
