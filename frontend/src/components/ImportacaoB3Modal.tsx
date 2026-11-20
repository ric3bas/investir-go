import React, { DragEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { InvestirApi } from '../services/api';
import { ImportacaoB3Previa, ImportacaoB3Resultado } from '../types';
import { formatarDinheiro } from '../utils/formatters';

interface ImportacaoB3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportacaoConcluida: () => Promise<void>;
}

const formatarData = (valor: string) => {
  const [data] = valor.split('T');
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

const obterMensagemErro = (erro: unknown) => {
  if (axios.isAxiosError(erro)) {
    const resposta = erro.response?.data as { message?: string; detail?: string } | undefined;
    return resposta?.message || resposta?.detail || 'Não foi possível processar a planilha.';
  }
  return 'Não foi possível processar a planilha.';
};

export const ImportacaoB3Modal: React.FC<ImportacaoB3ModalProps> = ({
  isOpen,
  onClose,
  onImportacaoConcluida,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<ImportacaoB3Previa | null>(null);
  const [resultado, setResultado] = useState<ImportacaoB3Resultado | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setArquivo(null);
    setPrevia(null);
    setResultado(null);
    setAnalisando(false);
    setImportando(false);
    setArrastando(false);
    setConfirmado(false);
    setErro(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !analisando && !importando) onClose();
    };
    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [analisando, importando, isOpen, onClose]);

  if (!isOpen) return null;

  const analisarArquivo = async (selecionado?: File) => {
    const proximoArquivo = selecionado || arquivo;
    if (!proximoArquivo || analisando) return;

    if (!proximoArquivo.name.toLowerCase().endsWith('.xlsx')) {
      setArquivo(null);
      setPrevia(null);
      setErro('Formato não permitido. Selecione o arquivo Excel .xlsx exportado pela B3.');
      return;
    }
    if (proximoArquivo.size > 10 * 1024 * 1024) {
      setArquivo(null);
      setPrevia(null);
      setErro('A planilha deve ter no máximo 10 MB.');
      return;
    }

    setArquivo(proximoArquivo);
    setPrevia(null);
    setResultado(null);
    setConfirmado(false);
    setErro(null);
    setAnalisando(true);
    try {
      setPrevia(await InvestirApi.gerarPreviaImportacaoB3(proximoArquivo));
    } catch (error) {
      setErro(obterMensagemErro(error));
    } finally {
      setAnalisando(false);
    }
  };

  const confirmarImportacao = async () => {
    if (!arquivo || !previa || !confirmado || importando) return;
    setErro(null);
    setImportando(true);
    try {
      const importacao = await InvestirApi.confirmarImportacaoB3(arquivo);
      setResultado(importacao);
      await onImportacaoConcluida();
    } catch (error) {
      setErro(obterMensagemErro(error));
    } finally {
      setImportando(false);
    }
  };

  const receberDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastando(false);
    const selecionado = event.dataTransfer.files?.[0];
    if (selecionado) void analisarArquivo(selecionado);
  };

  const voltar = () => {
    setArquivo(null);
    setPrevia(null);
    setConfirmado(false);
    setErro(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#02050b]/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="importacao-b3-titulo"
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#080d18] shadow-[0_28px_100px_rgba(0,0,0,0.55)]">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
              <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 id="importacao-b3-titulo" className="truncate text-base font-black tracking-tight text-white sm:text-lg">
                Importar negociações da B3
              </h2>
              <p className="text-[11px] text-slate-400 sm:text-xs">
                Revise a prévia antes de substituir as operações da carteira.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={analisando || importando}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
            aria-label="Fechar importação"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {resultado ? (
            <section className="mx-auto max-w-lg py-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-black text-white">Carteira atualizada</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                A substituição foi concluída em uma única transação. Seus proventos foram preservados.
              </p>
              <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                <div className="p-4">
                  <span className="block font-mono text-xl font-black tabular-nums text-emerald-300">{resultado.operacoesImportadas}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Importadas</span>
                </div>
                <div className="border-x border-white/[0.07] p-4">
                  <span className="block font-mono text-xl font-black tabular-nums text-rose-300">{resultado.operacoesRemovidas}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Substituídas</span>
                </div>
                <div className="p-4">
                  <span className="block font-mono text-xl font-black tabular-nums text-amber-300">{resultado.ativosCriados}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Ativos novos</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-7 min-h-11 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                Concluir
              </button>
            </section>
          ) : !previa ? (
            <section className="mx-auto max-w-2xl py-3 sm:py-8">
              <div
                onDragEnter={(event) => { event.preventDefault(); setArrastando(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setArrastando(false)}
                onDrop={receberDrop}
                className={`rounded-3xl border border-dashed p-7 text-center transition sm:p-12 ${arrastando
                  ? 'border-emerald-400/60 bg-emerald-500/10'
                  : 'border-white/[0.13] bg-white/[0.025] hover:border-emerald-400/35 hover:bg-emerald-500/[0.04]'
                }`}
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0d1422]">
                  {analisando
                    ? <LoaderCircle className="h-7 w-7 animate-spin text-emerald-300" />
                    : <Upload className="h-7 w-7 text-emerald-300" />}
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  {analisando ? 'Lendo e validando a planilha…' : 'Solte aqui o arquivo exportado pela B3'}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                  Somente Excel .xlsx, com até 10 MB. A planilha precisa conter data, tipo, código de negociação, quantidade e preço.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(event) => {
                    const selecionado = event.target.files?.[0];
                    if (selecionado) void analisarArquivo(selecionado);
                  }}
                />
                <button
                  type="button"
                  disabled={analisando}
                  onClick={() => {
                    if (inputRef.current) inputRef.current.value = '';
                    inputRef.current?.click();
                  }}
                  className="mt-6 min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:border-emerald-400/45 dark:hover:bg-emerald-500/15"
                >
                  Selecionar planilha
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-500/[0.04] p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <p className="text-[11px] leading-5 text-slate-400">
                  Nada é apagado nesta etapa. Primeiro mostraremos o resumo e uma amostra das linhas para sua aprovação.
                </p>
              </div>
            </section>
          ) : (
            <section className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300">Prévia validada</span>
                    <span className="truncate text-xs text-slate-500">{previa.nomeArquivo}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-white">Confira o que será importado</h3>
                </div>
                <button
                  type="button"
                  onClick={voltar}
                  className="flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Trocar arquivo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
                {[
                  ['Operações', previa.totalOperacoes.toLocaleString('pt-BR'), 'text-white'],
                  ['Compras', previa.totalCompras.toLocaleString('pt-BR'), 'text-emerald-300'],
                  ['Vendas', previa.totalVendas.toLocaleString('pt-BR'), 'text-rose-300'],
                  ['Volume', formatarDinheiro(previa.valorTotal), 'text-amber-300'],
                  ['Período', `${formatarData(previa.dataInicial)} — ${formatarData(previa.dataFinal)}`, 'text-cyan-300'],
                ].map(([rotulo, valor, cor]) => (
                  <div key={rotulo} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500">{rotulo}</span>
                    <span className={`mt-1 block font-mono text-sm font-black tabular-nums ${cor}`}>{valor}</span>
                  </div>
                ))}
              </div>

              {previa.ativosNovos.length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/[0.05] p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-amber-200">
                      {previa.ativosNovos.length} {previa.ativosNovos.length === 1 ? 'ativo será cadastrado' : 'ativos serão cadastrados'} como “OTHER”
                    </p>
                    <p className="mt-1 break-words font-mono text-[11px] leading-5 text-amber-200/70">
                      {previa.ativosNovos.join(', ')}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">Depois, revise a classe fiscal desses ativos no cadastro.</p>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060a12]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Amostra das operações</span>
                  {previa.linhasOmitidas > 0 && (
                    <span className="text-[10px] text-slate-500">+ {previa.linhasOmitidas.toLocaleString('pt-BR')} linhas validadas</span>
                  )}
                </div>
                <div className="max-h-[310px] overflow-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[#0c1220] font-mono text-[9px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Linha</th>
                        <th className="px-3 py-3">Data</th>
                        <th className="px-3 py-3">Tipo</th>
                        <th className="px-3 py-3">Ativo</th>
                        <th className="px-3 py-3 text-right">Quantidade</th>
                        <th className="px-3 py-3 text-right">Preço</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.045] text-slate-300">
                      {previa.operacoes.map((operacao) => (
                        <tr key={operacao.linha} className="hover:bg-white/[0.025]">
                          <td className="px-4 py-2.5 font-mono text-slate-600">{operacao.linha}</td>
                          <td className="px-3 py-2.5 font-mono tabular-nums">{formatarData(operacao.dataOperacao)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${operacao.tipoOperacao === 'COMPRA'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-rose-500/10 text-rose-300'
                            }`}>
                              {operacao.tipoOperacao}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-white">{operacao.ticker}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums">{operacao.quantidade.toLocaleString('pt-BR')}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-cyan-300">{formatarDinheiro(operacao.precoUnitario)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-100">{formatarDinheiro(operacao.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.055] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <div>
                    <p className="text-xs font-bold text-rose-100">Esta ação substituirá {previa.operacoesExistentes.toLocaleString('pt-BR')} operações existentes.</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      Compras e vendas atuais serão apagadas e trocadas pelas {previa.totalOperacoes.toLocaleString('pt-BR')} linhas validadas acima. Proventos e dados de outras contas não serão alterados.
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-3">
                  <input
                    type="checkbox"
                    checked={confirmado}
                    onChange={(event) => setConfirmado(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-rose-500 focus:ring-rose-400/40"
                  />
                  <span className="text-[11px] font-medium leading-5 text-slate-300">
                    Revisei a prévia e autorizo a substituição das operações da minha carteira.
                  </span>
                </label>
              </div>
            </section>
          )}

          {erro && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.07] p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <p className="max-h-32 overflow-y-auto text-xs leading-5 text-rose-200">{erro}</p>
            </div>
          )}
        </main>

        {previa && !resultado && (
          <footer className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-[#070b14] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={importando}
              className="min-h-10 rounded-xl px-4 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarImportacao}
              disabled={!confirmado || importando}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-black text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
            >
              {importando ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {importando ? 'Substituindo operações…' : `Apagar e importar ${previa.totalOperacoes.toLocaleString('pt-BR')} operações`}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
