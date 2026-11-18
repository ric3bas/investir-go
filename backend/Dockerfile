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

# tzdata fornece America/Sao_Paulo; krb5-libs fornece libgssapi_krb5.so.2,
# carregada pelo Npgsql em ambientes que anunciam autenticação GSS/Kerberos.
RUN apk add --no-cache tzdata krb5-libs

# Execução como usuário não-root por segurança
USER $APP_UID

COPY --from=build /app/publish .

EXPOSE 5050
ENTRYPOINT ["dotnet", "InvestirGo.API.dll"]
