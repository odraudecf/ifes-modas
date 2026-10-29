# Imagem da API Ifes Modas — build em dois estágios.
# 1) "build": tem o SDK completo (~800 MB) e compila/publica a aplicação.
# 2) "final": só o runtime ASP.NET (~220 MB) + os arquivos publicados. Imagem menor e com menos superfície de ataque.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia só o .csproj primeiro: se as dependências não mudaram, o Docker reaproveita
# a camada do "restore" e o build fica bem mais rápido.
COPY src/IfesModas.Api/IfesModas.Api.csproj src/IfesModas.Api/
RUN dotnet restore src/IfesModas.Api/IfesModas.Api.csproj

COPY src/ src/
RUN dotnet publish src/IfesModas.Api/IfesModas.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .

# Porta padrão 8080. No Render, a variável PORT tem prioridade (tratada no Program.cs).
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Usuário sem privilégios de root, que já existe nas imagens oficiais do .NET.
USER $APP_UID

ENTRYPOINT ["dotnet", "IfesModas.Api.dll"]
