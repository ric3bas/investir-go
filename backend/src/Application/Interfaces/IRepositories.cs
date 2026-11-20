using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Application.Interfaces;

public interface IAtivoRepository
{
    Task<IEnumerable<Ativo>> ObterTodosAsync();
    Task<Ativo?> ObterPorIdAsync(int id);
    Task<Ativo?> ObterPorTickerAsync(string ticker);
    Task<int> CriarAsync(Ativo ativo);
    Task<bool> AtualizarCotacaoAsync(int id, decimal precoAtual, decimal? variacaoDia, decimal? dividendYield);
    Task<bool> AtualizarTipoAsync(int id, string tipo);
}

public interface IOperacaoRepository
{
    Task<IEnumerable<Operacao>> ObterTodasAsync(string? ticker = null, string? tipoOperacao = null, Guid? userId = null);
    Task<Operacao?> ObterPorIdAsync(int id);
    Task<int> CriarAsync(Operacao operacao);
    Task<bool> AtualizarAsync(Operacao operacao);
    Task<bool> ExcluirAsync(int id);
    Task<int> ContarPorUsuarioAsync(Guid userId);
    Task<ResultadoSubstituicaoOperacoes> SubstituirPorImportacaoB3Async(
        Guid userId,
        IReadOnlyCollection<OperacaoImportacaoB3> operacoes);
}

public interface IProventoRepository
{
    Task<IEnumerable<Provento>> ObterTodosAsync(string? ticker = null, int? ano = null, Guid? userId = null);
    Task<Provento?> ObterPorIdAsync(int id);
    Task<int> CriarAsync(Provento provento);
    Task<bool> ExcluirAsync(int id);
    Task<decimal> ObterTotalProventosAsync(Guid? userId = null);
}
