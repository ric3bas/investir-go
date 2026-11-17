# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /app

# Copia arquivos de projeto e restaura dependências
COPY src/*.csproj ./src/
RUN dotnet restore src/InvestirGo.API.csproj

# Copia código-fonte e publica release
COPY src/ ./src/
WORKDIR /app/src
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

# Execução como usuário não-root por segurança
USER $APP_UID

COPY --from=build /app/publish .

EXPOSE 5050
EXPOSE 8080
ENTRYPOINT ["dotnet", "InvestirGo.API.dll"]
