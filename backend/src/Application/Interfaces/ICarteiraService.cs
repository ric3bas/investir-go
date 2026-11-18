using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Application.Interfaces;

public interface ICarteiraService
{
    Task<IEnumerable<PosicaoCarteira>> ObterPosicoesAsync(Guid? userId = null);
    Task<ResumoCarteira> ObterResumoAsync(Guid? userId = null);
}
