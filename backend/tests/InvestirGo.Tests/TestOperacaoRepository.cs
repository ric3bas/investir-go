using System.Collections.Concurrent;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.Tests;

/// <summary>Dublê isolado usado somente no teste de autorização IDOR.</summary>
internal sealed class TestOperacaoRepository : IOperacaoRepository
{
    private readonly ConcurrentDictionary<int, Operacao> _items = new();
    private int _nextId;

    public Task<IEnumerable<Operacao>> ObterTodasAsync(string? ticker = null, string? tipoOperacao = null, Guid? userId = null)
    {
        var result = _items.Values.AsEnumerable();
        if (userId.HasValue) result = result.Where(item => item.UserId == userId);
        if (!string.IsNullOrWhiteSpace(ticker)) result = result.Where(item => item.Ticker.Equals(ticker, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(tipoOperacao)) result = result.Where(item => item.TipoOperacao.Equals(tipoOperacao, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(result);
    }

    public Task<Operacao?> ObterPorIdAsync(int id) =>
        Task.FromResult(_items.TryGetValue(id, out var item) ? item : null);

    public Task<int> CriarAsync(Operacao operacao)
    {
        operacao.Id = Interlocked.Increment(ref _nextId);
        _items[operacao.Id] = operacao;
        return Task.FromResult(operacao.Id);
    }

    public Task<bool> AtualizarAsync(Operacao operacao)
    {
        if (!_items.ContainsKey(operacao.Id)) return Task.FromResult(false);
        _items[operacao.Id] = operacao;
        return Task.FromResult(true);
    }

    public Task<bool> ExcluirAsync(int id) => Task.FromResult(_items.TryRemove(id, out _));
}
