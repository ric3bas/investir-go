using InvestirGo.API.Application.DTOs;

namespace InvestirGo.API.Application.Interfaces;

public interface IApuracaoFiscalService
{
    Task<ApuracaoFiscalResponseDto> CalcularAsync(Guid userId, int ano);
}
