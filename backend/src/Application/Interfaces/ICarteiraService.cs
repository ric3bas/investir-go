using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Application.Interfaces;

public interface ICarteiraService
{
    Task<IEnumerable<PosicaoCarteira>> ObterPosicoesAsync();
    Task<ResumoCarteira> ObterResumoAsync();
}
