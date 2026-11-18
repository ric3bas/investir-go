import React, { useState } from 'react';
import { Provento } from '../types';
import { Coins, Plus, Trash2, Calendar, Search, Award, Eye, EyeOff } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePrivacy } from '../context/PrivacyContext';

interface ProventosTabProps {
  proventos: Provento[];
  onOpenNovoProvento: (defaultTicker?: string) => void;
  onExcluirProvento: (id: number) => void;
}

export const ProventosTab: React.FC<ProventosTabProps> = ({
  proventos,
  onOpenNovoProvento,
  onExcluirProvento,
}) => {
  const { esconderValores, toggleEsconderValores, formatarValor } = usePrivacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const filtered = proventos.filter((p) => {
    const matchSearch =
      p.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomeAtivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filtroTipo === 'TODOS' || p.tipoProvento === filtroTipo;
    return matchSearch && matchTipo;
  });

  const totalGeral = filtered.reduce((acc, p) => acc + p.valorTotal, 0);

  // Totais por tipo
  const totalDividendos = proventos.filter((p) => p.tipoProvento === 'Dividendo').reduce((acc, p) => acc + p.valorTotal, 0);
  const totalJcp = proventos.filter((p) => p.tipoProvento === 'JCP').reduce((acc, p) => acc + p.valorTotal, 0);
  const totalRendimentos = proventos.filter((p) => p.tipoProvento === 'Rendimento').reduce((acc, p) => acc + p.valorTotal, 0);

  // Agrupamento para gráfico por mês/ano
  const dadosGrafico = Object.values(
    proventos.reduce((acc, p) => {
      const data = new Date(p.dataPagamento);
      const chave = `${data.getMonth() + 1}/${data.getFullYear()}`;
      if (!acc[chave]) {
        acc[chave] = { mes: chave, total: 0 };
      }
      acc[chave].total += p.valorTotal;
      return acc;
    }, {} as Record<string, { mes: string; total: number }>)
  );

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return '-';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Área de Proventos & Rendimentos</h2>
          <p className="text-xs text-slate-400">
            Acompanhe o fluxo de renda passiva (Dividendos, Juros sobre Capital Próprio e Rendimentos de FIIs).
          </p>
        </div>

        <button
          onClick={() => onOpenNovoProvento()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Provento</span>
        </button>
      </div>

      {/* Cards de Métricas de Proventos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total de Proventos</span>
            <button
              onClick={toggleEsconderValores}
              className="p-1 rounded text-slate-500 hover:text-slate-200 transition"
              title={esconderValores ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {esconderValores ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mt-2">
            {formatarValor(totalGeral)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">{proventos.length} lançamentos efetuados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dividendos (Ações)</span>
          <h3 className="text-xl font-bold text-emerald-400 mt-2">
            {formatarValor(totalDividendos)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Isentos de imposto de renda</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">JCP (Juros s/ Capital)</span>
          <h3 className="text-xl font-bold text-cyan-400 mt-2">
            {formatarValor(totalJcp)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Líquido recebido na conta</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rendimentos FIIs</span>
          <h3 className="text-xl font-bold text-teal-400 mt-2">
            {formatarValor(totalRendimentos)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Aluguéis mensais isentos</p>
        </div>
      </div>

      {/* Gráfico de Proventos se houver dados */}
      {dadosGrafico.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100">Distribuição Mensal de Renda Passiva</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(val: any) =>
                    typeof val === 'number'
                      ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : val
                  }
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                />
                <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Valor Recebido" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filtros e Tabela de Proventos */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ticker ou ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {['TODOS', 'Dividendo', 'JCP', 'Rendimento'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded-md transition ${
                  filtroTipo === tipo
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-3">Data Com</th>
                  <th className="py-3 px-4">Ativo</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3 text-right">Valor / Cota</th>
                  <th className="py-3 px-3 text-right">Qtd Cotas</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">Total Recebido</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhum provento registrado ainda. Clique em "+ Registrar Provento" para cadastrar.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                        {formatarData(p.dataPagamento)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {formatarData(p.dataCom)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-100 font-mono">{p.ticker}</span>
                        <span className="text-[11px] text-slate-400 block">{p.nomeAtivo}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.tipoProvento === 'Dividendo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.tipoProvento === 'JCP'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.tipoProvento}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {p.valorPorCota > 0
                          ? p.valorPorCota.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 })
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {p.quantidadeCotas > 0 ? p.quantidadeCotas.toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                        {formatarValor(p.valorTotal)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[200px] truncate">
                        {p.observacoes || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          title="Excluir provento"
                          onClick={() => {
                            if (confirm(`Deseja excluir o provento de ${p.ticker}?`)) {
                              onExcluirProvento(p.id);
                            }
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
