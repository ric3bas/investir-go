namespace InvestirGo.API.Infrastructure.Services;

/// <summary>
/// Resolve o fuso da B3 sem impedir a inicialização em imagens Linux mínimas.
/// A imagem de produção instala tzdata, mas o fallback UTC-03 mantém a API viva
/// caso a base de fusos do sistema esteja temporariamente indisponível.
/// </summary>
internal static class BrazilMarketClock
{
    public static TimeZoneInfo TimeZone { get; } = ResolveTimeZone();

    public static DateTimeOffset Now => Convert(DateTimeOffset.UtcNow);

    public static DateTimeOffset Convert(DateTimeOffset value) =>
        TimeZoneInfo.ConvertTime(value, TimeZone);

    private static TimeZoneInfo ResolveTimeZone()
    {
        foreach (var id in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        return TimeZoneInfo.CreateCustomTimeZone(
            "America/Sao_Paulo-Fallback",
            TimeSpan.FromHours(-3),
            "Brasília (UTC-03 fallback)",
            "Brasília (UTC-03 fallback)");
    }
}
