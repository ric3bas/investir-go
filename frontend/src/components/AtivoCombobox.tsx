import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, Sparkles, X } from 'lucide-react';
import { Ativo } from '../types';

interface AtivoComboboxProps {
  ativos: Ativo[];
  selectedTicker: string;
  onSelectAtivo: (ativo: Ativo | { ticker: string; precoAtual: number; nome?: string }) => void;
  accentColor?: 'emerald' | 'amber' | 'cyan';
}

// Normalizador para ignorar acentos e maiúsculas
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const AtivoCombobox: React.FC<AtivoComboboxProps> = ({
  ativos,
  selectedTicker,
  onSelectAtivo,
  accentColor = 'emerald',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedTicker);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(selectedTicker);
  }, [selectedTicker]);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtro avançado: ativa após 2 caracteres digitados
  const trimmedQuery = query.trim();
  const searchNormalized = normalize(trimmedQuery);
  const searchWords = searchNormalized.split(/\s+/).filter(Boolean);

  const filteredAtivos =
    trimmedQuery.length >= 2
      ? ativos.filter((a) => {
          const tickerNorm = normalize(a.ticker);
          const nomeNorm = normalize(a.nome);
          const setorNorm = normalize(a.setor || '');

          // Se bate no ticker direto
          if (tickerNorm.includes(searchNormalized)) return true;

          // Se bate no nome completo
          if (nomeNorm.includes(searchNormalized)) return true;

          // Se todas as palavras digitadas estão presentes no nome ou ticker (ex: "ban brasil" -> "Banco do Brasil")
          const allWordsMatch = searchWords.every(
            (word) =>
              tickerNorm.includes(word) ||
              nomeNorm.includes(word) ||
              setorNorm.includes(word) ||
              (word === 'ban' && nomeNorm.includes('banco'))
          );
          if (allWordsMatch) return true;

          return false;
        })
      : isOpen
      ? ativos // se abriu pela seta sem digitar 2 letras, mostra todos
      : [];

  const handleSelect = (ativo: Ativo) => {
    setQuery(ativo.ticker);
    onSelectAtivo(ativo);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onSelectAtivo({ ticker: '', precoAtual: 0 });
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setQuery(rawVal);
    setHighlightedIndex(0);

    // Se digitou 2 ou mais letras, abre o dropdown imediatamente
    if (rawVal.trim().length >= 2) {
      setIsOpen(true);
    }

    // Se digitou exatamente o ticker de um ativo existente
    const encontrado = ativos.find(
      (a) => a.ticker.toUpperCase() === rawVal.trim().toUpperCase()
    );
    if (encontrado) {
      onSelectAtivo(encontrado);
    } else {
      onSelectAtivo({ ticker: rawVal.trim().toUpperCase(), precoAtual: 0 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredAtivos.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredAtivos.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredAtivos.length) % filteredAtivos.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAtivos[highlightedIndex]) {
        handleSelect(filteredAtivos[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const ringColor =
    accentColor === 'amber'
      ? 'focus-within:border-amber-500 focus-within:ring-amber-500/20'
      : accentColor === 'cyan'
      ? 'focus-within:border-cyan-500 focus-within:ring-cyan-500/20'
      : 'focus-within:border-emerald-500 focus-within:ring-emerald-500/20';

  const atalhosAtivos = ['BBAS3', 'TAEE4', 'ITSA4', 'BBDC4', 'MXRF11', 'HGLG11', 'PETR4', 'VALE3'];

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">
          Ativo / Ticker
        </label>
        <span className="text-[11px] text-slate-500">
          Pesquise por código ou nome (após 2 letras)
        </span>
      </div>

      {/* Input de Busca com o botão "X" interno para limpar */}
      <div
        className={`relative flex items-center bg-slate-950 border border-slate-800 rounded-xl transition ring-2 ring-transparent ${ringColor}`}
      >
        <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (trimmedQuery.length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digite o código ou nome (ex: BANCO DO BRASIL, BBAS3, TAESA...)"
          className="w-full py-2.5 pl-2.5 pr-16 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Botão X para limpar e Seta para ver todos */}
        <div className="flex items-center gap-0.5 pr-2">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Apagar selecionado"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Ver todos os ativos"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown de Resultados da Pesquisa */}
      {isOpen && (
        <div className="absolute top-[68px] left-0 right-0 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
          {filteredAtivos.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 text-center space-y-1">
              <p className="font-semibold text-slate-300">Nenhum ativo encontrado para "{query}"</p>
              <p className="text-[11px] text-slate-500">
                Pressione Enter para usar "{query.toUpperCase()}" como ativo customizado.
              </p>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Resultados ({filteredAtivos.length})</span>
                <span>Cotação Mercado</span>
              </div>
              {filteredAtivos.map((ativo, index) => {
                const isSelected = ativo.ticker.toUpperCase() === query.trim().toUpperCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={ativo.id}
                    type="button"
                    onClick={() => handleSelect(ativo)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition ${
                      isHighlighted
                        ? 'bg-slate-800 text-slate-100'
                        : isSelected
                        ? 'bg-slate-800/50'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-100 text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {ativo.ticker}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          ativo.tipo === 'FII'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {ativo.tipo}
                      </span>
                      <div>
                        <span className="font-medium text-slate-200 block truncate max-w-[160px] sm:max-w-[220px]">
                          {ativo.nome}
                        </span>
                        {ativo.setor && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                            {ativo.setor}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-100 text-xs block">
                          {ativo.precoAtual.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                        <span
                          className={`text-[10px] block ${
                            ativo.variacaoDia >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {ativo.variacaoDia >= 0 ? '+' : ''}
                          {ativo.variacaoDia.toFixed(2)}%
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Pílulas de Acesso Rápido */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Mais negociados:
        </span>
        {atalhosAtivos.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              const ativo = ativos.find((a) => a.ticker === t);
              if (ativo) handleSelect(ativo);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition border ${
              query.toUpperCase() === t
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};
