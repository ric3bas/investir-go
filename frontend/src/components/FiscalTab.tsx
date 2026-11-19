import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Info,
  Loader2,
  ReceiptText,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { InvestirApi } from '../services/api';
import { ApuracaoFiscal, ApuracaoFiscalMensal } from '../types';
import { usePrivacy } from '../context/PrivacyContext';

const mesesCurtos = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantidade = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });

const dataBrasileira = (valor: string) => {
  const [data] = valor.split('T');
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

const resultadoClass = (valor: number) => valor > 0 ? 'text-emerald-300' : valor < 0 ? 'text-rose-300' : 'text-slate-300';

const mensagemErroFiscal = (erro: unknown) => {
  if (!axios.isAxiosError<{ message?: string; detail?: string; title?: string }>(erro))
    return 'Falha inesperada ao calcular a apuração fiscal.';

  const status = erro.response?.status;
  if (status === 404)
    return 'A API em execução ainda não possui a rota fiscal. Reinicie ou publique a versão atual do backend.';
  if (status === 401)
    return 'Sua sessão expirou. Entre novamente para consultar a apuração fiscal.';
  if (status === 403)
    return 'Sua conta não tem autorização para consultar esta apuração.';
  if (status && status >= 500)
    return erro.response?.data?.detail || erro.response?.data?.message || `A API encontrou um erro durante o cálculo (HTTP ${status}).`;
  if (!erro.response)
    return 'Não foi possível alcançar a API. Verifique se o backend está online e se VITE_API_URL aponta para o endereço correto.';
  return erro.response.data?.message || erro.response.data?.detail || `A consulta fiscal falhou (HTTP ${status}).`;
};

const StatusBadge: React.FC<{ mes: ApuracaoFiscalMensal }> = ({ mes }) => {
  const classe = mes.darfDevido
    ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
    : mes.saldoAbaixoMinimo > 0
      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
      : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classe}`}>{mes.situacao}</span>;
};

export const FiscalTab: React.FC = () => {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [apuracao, setApuracao] = useState<ApuracaoFiscal | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [ativoAtualizando, setAtivoAtualizando] = useState<number | null>(null);
  const { esconderValores } = usePrivacy();

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    InvestirApi.getApuracaoFiscal(ano)
      .then((dados) => {
        if (!ativo) return;
        setApuracao(dados);
        const comMovimento = [...dados.meses].reverse().find((mes) =>
          mes.vendasAcoes + mes.vendasOuro + mes.vendasOutros + mes.vendasFiis + mes.vendasDayTrade > 0);
        const preferido = ano === anoAtual ? new Date().getMonth() + 1 : comMovimento?.mes ?? 12;
        setMesSelecionado(preferido);
      })
      .catch((erroConsulta) => ativo && setErro(mensagemErroFiscal(erroConsulta)))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [ano, anoAtual, versao]);

  const mes = useMemo(
    () => apuracao?.meses.find((item) => item.mes === mesSelecionado) ?? null,
    [apuracao, mesSelecionado],
  );

  const moeda = (valor: number) => esconderValores ? 'R$ ••••••' : `R$ ${numero.format(valor)}`;
  const totalVendasComuns = mes ? mes.vendasAcoes + mes.vendasOuro + mes.vendasOutros + mes.vendasFiis : 0;
  const totalPrejuizo = mes ? mes.saldoPrejuizoComum + mes.saldoPrejuizoFiis + mes.saldoPrejuizoDayTrade : 0;

  const atualizarClasse = async (ativoId: number, classeFiscal: string) => {
    setAtivoAtualizando(ativoId);
    try {
      await InvestirApi.atualizarClasseFiscal(ativoId, classeFiscal);
      setVersao((valor) => valor + 1);
    } catch {
      setErro('Não foi possível atualizar a classe fiscal do ativo.');
    } finally {
      setAtivoAtualizando(null);
    }
  };

  if (carregando) {
    return <div className="flex min-h-[520px] items-center justify-center text-slate-400"><Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-400" /> Calculando operações do ano...</div>;
  }

  if (erro || !apuracao || !mes) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-400/20 bg-rose-500/5 p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-rose-300" />
        <p className="font-semibold text-slate-100">{erro ?? 'Apuração indisponível.'}</p>
        <button type="button" onClick={() => setVersao((valor) => valor + 1)} className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.07] hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"><RefreshCw className="h-3.5 w-3.5" /> Tentar novamente</button>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            <Scale className="h-4 w-4" /> Central fiscal do investidor
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Apuração mensal & DARF</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Memória de cálculo construída com as compras e vendas da sua conta, separando operações comuns, day trade e FIIs.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#090e19] p-1 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <button type="button" onClick={() => setAno((valor) => valor - 1)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white" aria-label="Ano anterior"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-20 text-center font-mono text-sm font-bold tabular-nums text-white">{ano}</span>
          <button type="button" onClick={() => setAno((valor) => Math.min(anoAtual, valor + 1))} disabled={ano >= anoAtual} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Próximo ano"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </header>

      <section className="grid overflow-hidden rounded-3xl border border-white/[0.07] bg-[#080d18] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_70px_rgba(0,0,0,0.22)] xl:grid-cols-[1.12fr_0.88fr]">
        <div className="relative overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-500/[0.08] blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><ReceiptText className="h-4 w-4 text-emerald-300" /> DARF estimado · {mes.competencia}</div>
              <p className={`mt-3 font-mono text-3xl font-black tabular-nums sm:text-5xl ${mes.darfDevido ? 'text-amber-200' : 'text-emerald-300'}`}>{moeda(mes.darfEstimado)}</p>
              <div className="mt-3"><StatusBadge mes={mes} /></div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Código da receita</span>
              <span className="mt-1 block font-mono text-2xl font-black tracking-wider text-white">{apuracao.codigoDarf}</span>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <CalendarClock className="mb-3 h-4 w-4 text-cyan-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vencimento estimado</span>
              <strong className="mt-1 block font-mono text-sm tabular-nums text-slate-100">{dataBrasileira(mes.vencimentoEstimado)}</strong>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <CircleDollarSign className="mb-3 h-4 w-4 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Imposto bruto</span>
              <strong className="mt-1 block font-mono text-sm tabular-nums text-slate-100">{moeda(mes.impostoBruto)}</strong>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <ShieldCheck className="mb-3 h-4 w-4 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">IRRF compensado</span>
              <strong className="mt-1 block font-mono text-sm tabular-nums text-slate-100">− {moeda(mes.irrfCompensado)}</strong>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] bg-[#0b111e] p-5 sm:p-7 xl:border-l xl:border-t-0">
          <div className="mb-5 flex items-center gap-2"><Calculator className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-bold text-white">Como chegamos ao valor</h3></div>
          <div className="space-y-3 text-sm">
            <LinhaCalculo label="Base tributável comum" valor={moeda(mes.baseTributavelComum)} detalhe="15%" />
            <LinhaCalculo label="Base de FIIs" valor={moeda(mes.baseTributavelFiis)} detalhe="20%" />
            <LinhaCalculo label="Base day trade" valor={moeda(mes.baseTributavelDayTrade)} detalhe="20%" />
            <LinhaCalculo label="IRRF estimado utilizado" valor={`− ${moeda(mes.irrfCompensado)}`} tom="emerald" />
            <LinhaCalculo label="Saldo abaixo de R$ 10 anterior" valor={`+ ${moeda(mes.saldoMesesAnteriores)}`} tom="cyan" />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total para DARF</span>
            <span className="font-mono text-lg font-black tabular-nums text-white">{moeda(mes.darfEstimado)}</span>
          </div>
        </div>
      </section>

      <section aria-label="Meses da apuração" className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-12">
        {apuracao.meses.map((item) => {
          const ativo = item.mes === mesSelecionado;
          const movimento = item.vendasAcoes + item.vendasOuro + item.vendasOutros + item.vendasFiis + item.vendasDayTrade > 0;
          return (
            <button key={item.mes} type="button" onClick={() => setMesSelecionado(item.mes)} className={`group min-h-20 rounded-2xl border px-3 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${ativo ? 'border-emerald-400/40 bg-emerald-400/[0.09] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]' : 'border-white/[0.06] bg-[#090e18] hover:-translate-y-0.5 hover:border-white/[0.14]'}`}>
              <span className={`text-[10px] font-black tracking-[0.14em] ${ativo ? 'text-emerald-300' : 'text-slate-500'}`}>{mesesCurtos[item.mes - 1]}</span>
              <span className={`mt-2 block h-1.5 w-1.5 rounded-full ${item.darfDevido ? 'bg-amber-300' : movimento ? 'bg-emerald-300' : 'bg-slate-700'}`} />
              <span className="mt-2 block truncate font-mono text-[10px] tabular-nums text-slate-400">{item.darfDevido ? moeda(item.darfEstimado) : movimento ? 'apurado' : 'sem eventos'}</span>
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
        <div className="rounded-3xl border border-white/[0.07] bg-[#090e18] p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Memória mensal</span><h3 className="mt-1 text-lg font-black text-white">Resultados por modalidade</h3></div>
            <span className="font-mono text-xs text-slate-500">Vendas comuns: {moeda(totalVendasComuns)}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <ResultadoCard titulo="Grupo geral comum" resultado={mes.resultadoAcoes + mes.resultadoOuro + mes.resultadoOutros} base={mes.baseTributavelComum} aliquota="15%" moeda={moeda} />
            <ResultadoCard titulo="Day trade" resultado={mes.resultadoDayTrade} base={mes.baseTributavelDayTrade} aliquota="20%" moeda={moeda} />
            <ResultadoCard titulo="FII / Fiagro" resultado={mes.resultadoFiis} base={mes.baseTributavelFiis} aliquota="20%" moeda={moeda} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <LimiteIsencao titulo="Ações no mercado à vista" vendas={mes.vendasAcoes} isento={mes.acoesIsentas} moeda={moeda} />
            <LimiteIsencao titulo="Ouro ativo financeiro" vendas={mes.vendasOuro} isento={mes.ouroIsento} moeda={moeda} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-[#090e18] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-rose-300" /><h3 className="text-sm font-bold text-white">Prejuízos a compensar</h3></div>
          <p className="font-mono text-3xl font-black tabular-nums text-slate-100">{moeda(totalPrejuizo)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Saldo transportado para os meses seguintes, preservando a separação legal entre as modalidades.</p>
          <div className="mt-6 space-y-3">
            <SaldoPrejuizo label="Operações comuns" valor={mes.saldoPrejuizoComum} moeda={moeda} />
            <SaldoPrejuizo label="Day trade" valor={mes.saldoPrejuizoDayTrade} moeda={moeda} />
            <SaldoPrejuizo label="Grupo FII / Fiagro" valor={mes.saldoPrejuizoFiis} moeda={moeda} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#090e18]">
        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-end sm:px-6">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Regras utilizadas</span><h3 className="mt-1 text-lg font-black text-white">Matriz fiscal aplicada</h3></div>
          <p className="max-w-xl text-xs leading-5 text-slate-500">A classificação vem do cadastro do ativo. Classes não reconhecidas ficam em revisão manual e não alteram o DARF.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.13em] text-slate-500"><tr><th className="px-6 py-3">Classe</th><th className="px-4 py-3">Comum</th><th className="px-4 py-3">Day trade</th><th className="px-4 py-3">Isenção</th><th className="px-4 py-3">Prejuízo</th><th className="px-6 py-3 text-right">Resultado no mês</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {apuracao.matrizFiscal.map((regra) => {
                const classeMes = mes.classes.find((classe) => classe.codigo === regra.codigo);
                const resultadoMes = (classeMes?.resultadoComum ?? 0) + (classeMes?.resultadoDayTrade ?? 0);
                return <tr key={regra.codigo} className={`transition hover:bg-white/[0.02] ${!regra.calculavel ? 'bg-amber-400/[0.025]' : ''}`}><td className="px-6 py-4"><strong className={`font-mono text-xs ${regra.calculavel ? 'text-slate-100' : 'text-amber-200'}`}>{regra.codigo}</strong><span className="mt-1 block text-[10px] text-slate-500">{regra.rotulo}</span></td><td className="px-4 py-4 font-mono text-xs text-slate-300">{regra.aliquotaComum === null ? 'não calcular' : `${regra.aliquotaComum}%`}</td><td className="px-4 py-4 font-mono text-xs text-slate-300">{regra.aliquotaDayTrade === null ? 'não calcular' : `${regra.aliquotaDayTrade}%`}</td><td className="px-4 py-4 text-xs text-slate-400">{regra.isencao}</td><td className="px-4 py-4 text-xs text-slate-400">{regra.grupoPrejuizo}</td><td className={`px-6 py-4 text-right font-mono text-xs font-bold tabular-nums ${resultadoClass(resultadoMes)}`}>{moeda(resultadoMes)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#090e18]">
        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:px-6">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Rastreabilidade</span><h3 className="mt-1 text-lg font-black text-white">Ativos que formaram o mês</h3></div>
          <span className="text-xs text-slate-500">Preço médio inclui taxas informadas nos lançamentos</span>
        </div>
        {mes.ativos.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500"><CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-slate-700" />Nenhuma venda registrada nesta competência.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.13em] text-slate-500"><tr><th className="px-6 py-3">Ativo</th><th className="px-4 py-3">Classe fiscal</th><th className="px-4 py-3 text-right">Quantidade</th><th className="px-4 py-3 text-right">Vendas</th><th className="px-4 py-3 text-right">Resultado comum</th><th className="px-6 py-3 text-right">Day trade</th></tr></thead>
              <tbody className="divide-y divide-white/[0.05]">
                {mes.ativos.map((ativo) => <tr key={`${ativo.ticker}-${ativo.tipoAtivo}`} className={`transition hover:bg-white/[0.02] ${!ativo.calculado ? 'bg-amber-400/[0.025]' : ''}`}><td className="px-6 py-4"><strong className="font-mono text-slate-100">{ativo.ticker}</strong><span className="ml-2 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-slate-500">{ativo.tipoAtivo}</span></td><td className="px-4 py-4"><select value={ativo.classeFiscal} disabled={ativoAtualizando === ativo.ativoId} onChange={(evento) => atualizarClasse(ativo.ativoId, evento.target.value)} aria-label={`Classe fiscal de ${ativo.ticker}`} className={`rounded-lg border px-2 py-1.5 font-mono text-[10px] font-bold outline-none transition focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50 ${ativo.calculado ? 'border-emerald-400/15 bg-[#0c1718] text-emerald-200' : 'border-amber-400/20 bg-[#19150c] text-amber-200'}`}>{apuracao.matrizFiscal.map((regra) => <option key={regra.codigo} value={regra.codigo}>{regra.codigo}</option>)}</select></td><td className="px-4 py-4 text-right font-mono tabular-nums text-slate-300">{quantidade.format(ativo.quantidadeVendida)}</td><td className="px-4 py-4 text-right font-mono tabular-nums text-slate-300">{moeda(ativo.totalVendas)}</td><td className={`px-4 py-4 text-right font-mono tabular-nums ${resultadoClass(ativo.resultadoComum)}`}>{moeda(ativo.resultadoComum)}</td><td className={`px-6 py-4 text-right font-mono tabular-nums ${resultadoClass(ativo.resultadoDayTrade)}`}>{moeda(ativo.resultadoDayTrade)}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.045] p-5">
          <div className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h3 className="text-sm font-bold text-amber-100">Antes de recolher</h3><ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">{apuracao.alertas.map((alerta) => <li key={alerta}>• {alerta}</li>)}</ul></div></div>
        </div>
      </section>
    </main>
  );
};

const LinhaCalculo: React.FC<{ label: string; valor: string; detalhe?: string; tom?: 'emerald' | 'cyan' }> = ({ label, valor, detalhe, tom }) => (
  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-slate-400"><span>{label}</span>{detalhe && <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{detalhe}</span>}</div><span className={`font-mono font-bold tabular-nums ${tom === 'emerald' ? 'text-emerald-300' : tom === 'cyan' ? 'text-cyan-300' : 'text-slate-100'}`}>{valor}</span></div>
);

const ResultadoCard: React.FC<{ titulo: string; resultado: number; base: number; aliquota: string; isento?: boolean; moeda: (valor: number) => string }> = ({ titulo, resultado, base, aliquota, isento, moeda }) => (
  <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:border-white/[0.12]">
    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-300">{titulo}</span>{resultado >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : <ArrowDownRight className="h-4 w-4 text-rose-300" />}</div>
    <p className={`mt-4 font-mono text-lg font-black tabular-nums ${resultadoClass(resultado)}`}>{moeda(resultado)}</p>
    <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[10px]"><span className="text-slate-500">Base: {moeda(base)}</span><span className={`font-bold ${isento ? 'text-emerald-300' : 'text-slate-400'}`}>{isento ? 'ISENTO' : aliquota}</span></div>
  </article>
);

const SaldoPrejuizo: React.FC<{ label: string; valor: number; moeda: (valor: number) => string }> = ({ label, valor, moeda }) => (
  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3"><span className="text-xs text-slate-400">{label}</span><span className="font-mono text-xs font-bold tabular-nums text-rose-200">{moeda(valor)}</span></div>
);

const LimiteIsencao: React.FC<{ titulo: string; vendas: number; isento: boolean; moeda: (valor: number) => string }> = ({ titulo, vendas, isento, moeda }) => {
  const percentual = Math.min(100, (vendas / 20_000) * 100);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-300">{titulo}</span><span className="font-mono tabular-nums text-slate-400">{moeda(vendas)} / R$ 20.000,00</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all ${vendas > 20_000 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${percentual}%` }} /></div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{isento ? 'Dentro do limite próprio; eventual ganho comum positivo é isento.' : 'Limite ultrapassado; eventual ganho positivo entra no grupo geral tributável.'}</p>
    </div>
  );
};

export default FiscalTab;
