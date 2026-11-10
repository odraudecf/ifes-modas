namespace IfesModas.Api.Dtos;

/// <summary>Versão publicada: o commit do GitHub que está rodando e quando a API subiu.</summary>
public record VersaoDto(string Commit, string CommitCurto, string? Branch, string Ambiente, DateTimeOffset IniciadaEm);
