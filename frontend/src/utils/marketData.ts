import { Ativo, HistoricoAtivo, HistoricoPonto, PeriodoHistorico, PeriodoPerformance, PerformanceAtivo, NoticiaAtivo, Operacao, Provento, PosicaoCarteira, ResumoCarteira } from '../types';

// ==========================================
// 1. BASE DE ATIVOS: TOP 30 DA B3 & FIIs
// ==========================================
export const TOP_30_ATIVOS: Ativo[] = [
  // 15 AÇÕES
  { id: 1, ticker: 'PETR4', nome: 'Petróleo Brasileiro S.A. Petrobras', tipo: 'Acao', setor: 'Petróleo, Gás e Biocombustíveis', precoAtual: 37.85, variacaoDia: 1.20, dividendYield: 14.20, dataAtualizacao: new Date().toISOString() },
  { id: 2, ticker: 'VALE3', nome: 'Vale S.A.', tipo: 'Acao', setor: 'Mineração', precoAtual: 58.20, variacaoDia: -0.80, dividendYield: 8.40, dataAtualizacao: new Date().toISOString() },
  { id: 3, ticker: 'ITUB4', nome: 'Itaú Unibanco Holding S.A.', tipo: 'Acao', setor: 'Financeiro / Bancos', precoAtual: 34.60, variacaoDia: 0.75, dividendYield: 7.90, dataAtualizacao: new Date().toISOString() },
  { id: 4, ticker: 'BBAS3', nome: 'Banco do Brasil S.A.', tipo: 'Acao', setor: 'Financeiro / Bancos', precoAtual: 14.95, variacaoDia: 0.45, dividendYield: 9.85, dataAtualizacao: new Date().toISOString() },
  { id: 5, ticker: 'BBDC4', nome: 'Banco Bradesco S.A. PN', tipo: 'Acao', setor: 'Financeiro / Bancos', precoAtual: 14.23, variacaoDia: 0.28, dividendYield: 7.50, dataAtualizacao: new Date().toISOString() },
  { id: 6, ticker: 'TAEE4', nome: 'Transmissora Aliança de Energia Elétrica S.A.', tipo: 'Acao', setor: 'Energia Elétrica', precoAtual: 14.07, variacaoDia: -0.15, dividendYield: 8.90, dataAtualizacao: new Date().toISOString() },
  { id: 7, ticker: 'TAEE11', nome: 'Taesa Unit', tipo: 'Acao', setor: 'Energia Elétrica', precoAtual: 34.80, variacaoDia: 0.10, dividendYield: 9.10, dataAtualizacao: new Date().toISOString() },
  { id: 8, ticker: 'ITSA4', nome: 'Itaúsa S.A.', tipo: 'Acao', setor: 'Financeiro / Holdings', precoAtual: 13.39, variacaoDia: 0.60, dividendYield: 8.20, dataAtualizacao: new Date().toISOString() },
  { id: 9, ticker: 'SANB4', nome: 'Banco Santander Brasil S.A.', tipo: 'Acao', setor: 'Financeiro / Bancos', precoAtual: 14.09, variacaoDia: 0.50, dividendYield: 7.80, dataAtualizacao: new Date().toISOString() },
  { id: 10, ticker: 'POMO4', nome: 'Marcopolo S.A.', tipo: 'Acao', setor: 'Material de Transporte', precoAtual: 3.81, variacaoDia: -0.26, dividendYield: 6.40, dataAtualizacao: new Date().toISOString() },
  { id: 11, ticker: 'BBDC3', nome: 'Banco Bradesco S.A. ON', tipo: 'Acao', setor: 'Financeiro / Bancos', precoAtual: 13.00, variacaoDia: 0.15, dividendYield: 7.10, dataAtualizacao: new Date().toISOString() },
  { id: 12, ticker: 'WEGE3', nome: 'WEG S.A.', tipo: 'Acao', setor: 'Motores e Equipamentos Elétricos', precoAtual: 52.40, variacaoDia: 1.45, dividendYield: 1.80, dataAtualizacao: new Date().toISOString() },
  { id: 13, ticker: 'ABEV3', nome: 'Ambev S.A.', tipo: 'Acao', setor: 'Bebidas', precoAtual: 12.80, variacaoDia: -0.30, dividendYield: 6.20, dataAtualizacao: new Date().toISOString() },
  { id: 14, ticker: 'RENT3', nome: 'Localiza Rent a Car S.A.', tipo: 'Acao', setor: 'Locação de Veículos', precoAtual: 44.50, variacaoDia: 0.90, dividendYield: 3.50, dataAtualizacao: new Date().toISOString() },
  { id: 15, ticker: 'PRIO3', nome: 'PRIO S.A.', tipo: 'Acao', setor: 'Petróleo e Gás Independente', precoAtual: 42.10, variacaoDia: 2.10, dividendYield: 0.00, dataAtualizacao: new Date().toISOString() },

  // 15 FUNDOS IMOBILIÁRIOS (FIIs)
  { id: 16, ticker: 'MXRF11', nome: 'Maxi Renda FII', tipo: 'FII', setor: 'Papel / CRI', precoAtual: 10.15, variacaoDia: 0.10, dividendYield: 12.40, dataAtualizacao: new Date().toISOString() },
  { id: 17, ticker: 'HGLG11', nome: 'CSHG Logística FII', tipo: 'FII', setor: 'Logística / Galpões', precoAtual: 161.50, variacaoDia: 0.35, dividendYield: 8.60, dataAtualizacao: new Date().toISOString() },
  { id: 18, ticker: 'XPML11', nome: 'XP Malls FII', tipo: 'FII', setor: 'Shopping Centers', precoAtual: 107.20, variacaoDia: 0.20, dividendYield: 9.10, dataAtualizacao: new Date().toISOString() },
  { id: 19, ticker: 'KNIP11', nome: 'Kinea Índices de Preços FII', tipo: 'FII', setor: 'Papel / IPCA', precoAtual: 91.80, variacaoDia: -0.10, dividendYield: 10.80, dataAtualizacao: new Date().toISOString() },
  { id: 20, ticker: 'KNCR11', nome: 'Kinea Rendimentos Imobiliários FII', tipo: 'FII', setor: 'Papel / CDI', precoAtual: 104.30, variacaoDia: 0.05, dividendYield: 12.60, dataAtualizacao: new Date().toISOString() },
  { id: 21, ticker: 'BTLG11', nome: 'BTG Pactual Logística FII', tipo: 'FII', setor: 'Logística / Galpões', precoAtual: 99.40, variacaoDia: 0.40, dividendYield: 9.30, dataAtualizacao: new Date().toISOString() },
  { id: 22, ticker: 'VISC11', nome: 'Vinci Shopping Centers FII', tipo: 'FII', setor: 'Shopping Centers', precoAtual: 114.80, variacaoDia: 0.15, dividendYield: 8.95, dataAtualizacao: new Date().toISOString() },
  { id: 23, ticker: 'HGRU11', nome: 'CSHG Renda Urbana FII', tipo: 'FII', setor: 'Renda Urbana / Educacional', precoAtual: 124.60, variacaoDia: 0.25, dividendYield: 9.20, dataAtualizacao: new Date().toISOString() },
  { id: 24, ticker: 'CPTS11', nome: 'Capitânia Securities II FII', tipo: 'FII', setor: 'Papel / CRI', precoAtual: 7.95, variacaoDia: -0.25, dividendYield: 11.90, dataAtualizacao: new Date().toISOString() },
  { id: 25, ticker: 'VGHF11', nome: 'Valora Hedge Fund FII', tipo: 'FII', setor: 'Hedge Fund Imobiliário', precoAtual: 8.45, variacaoDia: 0.00, dividendYield: 12.80, dataAtualizacao: new Date().toISOString() },
  { id: 26, ticker: 'TGAR11', nome: 'TG Ativo Real FII', tipo: 'FII', setor: 'Desenvolvimento / Loteamentos', precoAtual: 118.50, variacaoDia: 0.30, dividendYield: 13.50, dataAtualizacao: new Date().toISOString() },
  { id: 27, ticker: 'KNHY11', nome: 'Kinea High Yield FII', tipo: 'FII', setor: 'Papel / High Yield', precoAtual: 99.20, variacaoDia: 0.10, dividendYield: 12.10, dataAtualizacao: new Date().toISOString() },
  { id: 28, ticker: 'XPLG11', nome: 'XP Log FII', tipo: 'FII', setor: 'Logística / Galpões', precoAtual: 102.10, variacaoDia: 0.18, dividendYield: 8.70, dataAtualizacao: new Date().toISOString() },
  { id: 29, ticker: 'TRXF11', nome: 'TRX Real Estate FII', tipo: 'FII', setor: 'Renda Urbana / Imóveis Comerciais', precoAtual: 105.80, variacaoDia: 0.45, dividendYield: 9.80, dataAtualizacao: new Date().toISOString() },
  { id: 30, ticker: 'ALZR11', nome: 'Alianza Trust Renda Imobiliária FII', tipo: 'FII', setor: 'Híbrido / Renda Urbana', precoAtual: 103.50, variacaoDia: 0.20, dividendYield: 8.85, dataAtualizacao: new Date().toISOString() },
];

// Variações consolidadas para 1D, 7D e 15D
interface VariacoesMultiPeriodo {
  var1D: number;
  var7D: number;
  var15D: number;
  retorno5Anos: number; // Retorno acumulado em 5 anos (%)
}

const VARIACOES_MAP: Record<string, VariacoesMultiPeriodo> = {
  PRIO3:  { var1D: 2.10,  var7D: 6.85,  var15D: 12.40, retorno5Anos: 182.50 },
  WEGE3:  { var1D: 1.45,  var7D: 5.40,  var15D: 8.90,  retorno5Anos: 68.20 },
  PETR4:  { var1D: 1.20,  var7D: 4.15,  var15D: 7.60,  retorno5Anos: 88.40 },
  RENT3:  { var1D: 0.90,  var7D: 3.10,  var15D: 5.20,  retorno5Anos: 14.50 },
  ITUB4:  { var1D: 0.75,  var7D: 3.20,  var15D: 5.80,  retorno5Anos: 46.80 },
  ITSA4:  { var1D: 0.60,  var7D: 2.80,  var15D: 4.90,  retorno5Anos: 39.20 },
  SANB4:  { var1D: 0.50,  var7D: 2.10,  var15D: 3.70,  retorno5Anos: 22.10 },
  BBAS3:  { var1D: 0.45,  var7D: 3.80,  var15D: 6.40,  retorno5Anos: 56.40 },
  TRXF11: { var1D: 0.45,  var7D: 2.10,  var15D: 3.60,  retorno5Anos: 18.20 },
  BTLG11: { var1D: 0.40,  var7D: 2.40,  var15D: 3.90,  retorno5Anos: 14.80 },
  HGLG11: { var1D: 0.35,  var7D: 1.90,  var15D: 4.30,  retorno5Anos: 12.40 },
  TGAR11: { var1D: 0.30,  var7D: 1.60,  var15D: 2.90,  retorno5Anos: 16.50 },
  BBDC4:  { var1D: 0.28,  var7D: 1.40,  var15D: 2.50,  retorno5Anos: -8.40 },
  HGRU11: { var1D: 0.25,  var7D: 1.30,  var15D: 2.80,  retorno5Anos: 15.60 },
  XPML11: { var1D: 0.20,  var7D: 1.15,  var15D: 2.40,  retorno5Anos: 11.20 },
  ALZR11: { var1D: 0.20,  var7D: 0.95,  var15D: 1.80,  retorno5Anos: 9.80 },
  XPLG11: { var1D: 0.18,  var7D: 0.85,  var15D: 1.70,  retorno5Anos: 8.50 },
  BBDC3:  { var1D: 0.15,  var7D: 1.10,  var15D: 2.00,  retorno5Anos: -6.20 },
  VISC11: { var1D: 0.15,  var7D: 0.70,  var15D: 1.50,  retorno5Anos: 10.40 },
  TAEE11: { var1D: 0.10,  var7D: 0.60,  var15D: 1.20,  retorno5Anos: 32.50 },
  MXRF11: { var1D: 0.10,  var7D: 0.40,  var15D: 0.90,  retorno5Anos: 6.80 },
  KNHY11: { var1D: 0.10,  var7D: -0.30, var15D: -1.20, retorno5Anos: 7.20 },
  KNCR11: { var1D: 0.05,  var7D: 0.35,  var15D: 0.80,  retorno5Anos: 8.40 },
  VGHF11: { var1D: 0.00,  var7D: -0.60, var15D: -0.80, retorno5Anos: -3.50 },
  KNIP11: { var1D: -0.10, var7D: -0.90, var15D: -1.80, retorno5Anos: 2.10 },
  TAEE4:  { var1D: -0.15, var7D: -1.20, var15D: -2.40, retorno5Anos: 28.60 },
  CPTS11: { var1D: -0.25, var7D: -2.10, var15D: -4.30, retorno5Anos: -15.40 },
  POMO4:  { var1D: -0.26, var7D: -3.20, var15D: -5.80, retorno5Anos: 48.90 },
  ABEV3:  { var1D: -0.30, var7D: -1.90, var15D: -3.60, retorno5Anos: -18.20 },
  VALE3:  { var1D: -0.80, var7D: -4.50, var15D: -7.20, retorno5Anos: -24.50 },
};

// ==========================================
// 2. GERADOR DETERMINÍSTICO DE SÉRIE HISTÓRICA (ATÉ 5 ANOS)
// ==========================================
export function getHistoricoAtivo(
  ticker: string,
  periodo: PeriodoHistorico,
  precoAtualFornecido?: number
): HistoricoAtivo {
  const ativo = TOP_30_ATIVOS.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase()) || {
    ticker,
    nome: ticker,
    precoAtual: precoAtualFornecido || 50.0,
  };

  const precoFinal = precoAtualFornecido || ativo.precoAtual;
  const varia = VARIACOES_MAP[ticker.toUpperCase()] || {
    var1D: 0.5,
    var7D: 2.0,
    var15D: 3.5,
    retorno5Anos: 25.0,
  };

  let numPontos = 30;
  let variacaoAlvoPercentual = 0;
  let labels: string[] = [];
  let datasCompletas: string[] = [];

  const hoje = new Date(2026, 10, 17, 16, 0); // Nov 17, 2026

  switch (periodo) {
    case '1D':
      numPontos = 8;
      variacaoAlvoPercentual = varia.var1D;
      const horas = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      labels = horas;
      datasCompletas = horas.map((h) => `Hoje, 17/11/2026 às ${h}`);
      break;

    case '7D':
      numPontos = 7;
      variacaoAlvoPercentual = varia.var7D;
      labels = ['11/Nov', '12/Nov', '13/Nov', '14/Nov', '15/Nov', '16/Nov', '17/Nov'];
      datasCompletas = labels.map((l) => `${l}/2026 Fechamento`);
      break;

    case '15D':
      numPontos = 15;
      variacaoAlvoPercentual = varia.var15D;
      for (let i = 14; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
        datasCompletas.push(d.toLocaleDateString('pt-BR'));
      }
      break;

    case '1M':
      numPontos = 22;
      variacaoAlvoPercentual = varia.var15D * 1.5;
      for (let i = 21; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i * 1.4);
        labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
        datasCompletas.push(d.toLocaleDateString('pt-BR'));
      }
      break;

    case '6M':
      numPontos = 26;
      variacaoAlvoPercentual = varia.retorno5Anos * 0.25;
      for (let i = 25; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i * 7);
        labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
        datasCompletas.push(`Semana ${d.toLocaleDateString('pt-BR')}`);
      }
      break;

    case '1A':
      numPontos = 24;
      variacaoAlvoPercentual = varia.retorno5Anos * 0.45;
      for (let i = 23; i >= 0; i--) {
        const d = new Date(hoje);
        d.setMonth(d.getMonth() - Math.floor(i / 2));
        labels.push(i % 2 === 0 ? d.toLocaleDateString('pt-BR', { month: 'short' }) : '');
        datasCompletas.push(d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
      }
      break;

    case '2A':
      numPontos = 24;
      variacaoAlvoPercentual = varia.retorno5Anos * 0.70;
      for (let i = 23; i >= 0; i--) {
        const d = new Date(hoje);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
        datasCompletas.push(d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
      }
      break;

    case '5A':
    default:
      numPontos = 30; // 30 amostras bimestrais/trimestrais ao longo de 5 anos (2021 - 2026)
      variacaoAlvoPercentual = varia.retorno5Anos;
      for (let i = 29; i >= 0; i--) {
        const d = new Date(hoje);
        d.setMonth(d.getMonth() - i * 2);
        labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
        datasCompletas.push(d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
      }
      break;
  }

  // Preço inicial calculado com base na variação percentual do período
  // precoFinal = precoInicial * (1 + variacaoAlvoPercentual / 100)
  const precoInicial = Number((precoFinal / (1 + variacaoAlvoPercentual / 100)).toFixed(4));
  const variacaoReais = Number((precoFinal - precoInicial).toFixed(2));

  // Geração determinística dos pontos intermediários conectando precoInicial -> precoFinal
  const pontos: HistoricoPonto[] = [];
  const seedBase = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  for (let i = 0; i < numPontos; i++) {
    const progresso = i / (numPontos - 1);
    let precoPonto: number;

    if (i === 0) {
      precoPonto = precoInicial;
    } else if (i === numPontos - 1) {
      precoPonto = precoFinal;
    } else {
      // Interpolação suave com ondulações de mercado realísticas
      const baseInterpolada = precoInicial + (precoFinal - precoInicial) * progresso;
      const oscilacaoSeno = Math.sin((i + seedBase % 7) * 0.8) * (precoFinal * 0.035);
      const oscilacaoCos = Math.cos((i + seedBase % 5) * 1.4) * (precoFinal * 0.02);
      precoPonto = Math.max(0.5, baseInterpolada + oscilacaoSeno + oscilacaoCos);
    }

    precoPonto = Number(precoPonto.toFixed(2));
    const variacaoPonto = Number((((precoPonto - precoInicial) / precoInicial) * 100).toFixed(2));

    pontos.push({
      data: labels[i] || `P${i + 1}`,
      preco: precoPonto,
      variacaoPeriodo: variacaoPonto,
      dataCompleta: datasCompletas[i] || labels[i] || `Ponto ${i + 1}`,
    });
  }

  const precos = pontos.map((p) => p.preco);
  const minima = Math.min(...precos);
  const maxima = Math.max(...precos);
  const precoMedio = Number((precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2));

  return {
    ticker,
    nome: ativo.nome,
    periodo,
    precoInicial,
    precoFinal,
    variacaoReais,
    variacaoPercentual: Number(variacaoAlvoPercentual.toFixed(2)),
    minima,
    maxima,
    precoMedio,
    pontos,
  };
}

// ==========================================
// 3. RANKINGS: TOP 7 MAIORES ALTAS E TOP 7 BAIXAS
// ==========================================
export function getPerformanceRanking(
  periodo: PeriodoPerformance,
  filtroTipo: 'TODOS' | 'Acao' | 'FII' = 'TODOS',
  ativosBase: Ativo[] = TOP_30_ATIVOS
) {
  const filtrados = ativosBase.filter((a) => filtroTipo === 'TODOS' || a.tipo === filtroTipo);

  const dadosCalculados = filtrados.map((ativo) => {
    const varia = VARIACOES_MAP[ativo.ticker.toUpperCase()] || {
      var1D: ativo.variacaoDia,
      var7D: ativo.variacaoDia * 2.5,
      var15D: ativo.variacaoDia * 4.2,
      retorno5Anos: 20.0,
    };

    let variacaoPercentual = varia.var1D;
    if (periodo === '7D') variacaoPercentual = varia.var7D;
    if (periodo === '15D') variacaoPercentual = varia.var15D;

    const precoInicial = Number((ativo.precoAtual / (1 + variacaoPercentual / 100)).toFixed(2));
    const variacaoReais = Number((ativo.precoAtual - precoInicial).toFixed(2));

    return {
      ativo,
      ticker: ativo.ticker,
      nome: ativo.nome,
      tipo: ativo.tipo,
      setor: ativo.setor,
      precoAtual: ativo.precoAtual,
      precoInicial,
      variacaoPercentual: Number(variacaoPercentual.toFixed(2)),
      variacaoReais,
      isAlta: variacaoPercentual >= 0,
    };
  });

  // Ordenar decrescente para as Maiores Altas (Top 7)
  const ordenadoAltas = [...dadosCalculados].sort((a, b) => b.variacaoPercentual - a.variacaoPercentual);
  const top7Altas: PerformanceAtivo[] = ordenadoAltas.slice(0, 7).map((item, idx) => ({
    ...item,
    posicao: idx + 1,
  }));

  // Ordenar crescente para as Maiores Baixas / Pior Performance (Top 7)
  const ordenadoBaixas = [...dadosCalculados].sort((a, b) => a.variacaoPercentual - b.variacaoPercentual);
  const top7Baixas: PerformanceAtivo[] = ordenadoBaixas.slice(0, 7).map((item, idx) => ({
    ...item,
    posicao: idx + 1,
  }));

  return {
    periodo,
    top7Altas,
    top7Baixas,
    destaqueAlta: top7Altas[0],
    destaqueBaixa: top7Baixas[0],
    mediaVariacao: Number(
      (dadosCalculados.reduce((acc, curr) => acc + curr.variacaoPercentual, 0) / dadosCalculados.length).toFixed(2)
    ),
  };
}

// ==========================================
// 4. FEED DE NOTÍCIAS RECENTES (B3 & FIIs)
// ==========================================
export const NOTICIAS_MERCADO: NoticiaAtivo[] = [
  {
    id: 'noticia-1',
    ticker: 'PETR4',
    tickersRelacionados: ['PRIO3'],
    titulo: 'Petrobras aprova pagamento de R$ 13,8 bilhões em dividendos extraordinários após resultado do 3T',
    resumo: 'O Conselho de Administração da Petrobras aprovou nova distribuição robusta aos acionistas, mantendo atratividade do Dividend Yield de dois dígitos e fluxo de caixa livre saudável com a produção do pré-sal.',
    fonte: 'InfoMoney',
    dataPublicacao: 'Há 18 minutos',
    categoria: 'Proventos',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-2',
    ticker: 'MXRF11',
    tickersRelacionados: ['CPTS11', 'KNCR11'],
    titulo: 'Maxi Renda (MXRF11) anuncia provento mensal e base de cotistas supera 1,1 milhão de investidores',
    resumo: 'O fundo imobiliário de papel mais popular da bolsa manteve distribuição estável com retorno isento de Imposto de Renda, impulsionado por novas alocações em CRIs de baixo risco de crédito.',
    fonte: 'Funds Explorer',
    dataPublicacao: 'Há 45 minutos',
    categoria: 'Proventos',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-3',
    ticker: 'PRIO3',
    titulo: 'PRIO atinge novo recorde de produção no Campo de Frade e custos de extração (lifting cost) caem 8%',
    resumo: 'A petroleira independente informou que a produção média diária ultrapassou 105 mil barris, superando as estimativas do mercado e consolidando forte geração de caixa para recompra de ações.',
    fonte: 'Brazil Journal',
    dataPublicacao: 'Há 1 hora',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-4',
    ticker: 'VALE3',
    titulo: 'Vale avança em negociações de licenciamento no Pará e amplia embarques de minério de alta pureza',
    resumo: 'Mesmo com oscilações pontuais no preço do minério em Dalian, analistas destacam prêmio de qualidade do produto da Vale e avanço na resolução das pendências do acordo de Mariana.',
    fonte: 'Valor Econômico',
    dataPublicacao: 'Há 2 horas',
    categoria: 'Resultado',
    sentimento: 'Neutro',
  },
  {
    id: 'noticia-5',
    ticker: 'BBAS3',
    tickersRelacionados: ['ITUB4', 'BBDC4', 'SANB4'],
    titulo: 'Banco do Brasil registra ROE acima de 21% e mantém liderança no crédito do agronegócio',
    resumo: 'A instituição financeira estatal reportou carteira de crédito expandida com inadimplência controlada, reiterando projeção de payout elevado e distribuição contínua de JCP aos acionistas.',
    fonte: 'Suno Research',
    dataPublicacao: 'Há 2 horas',
    categoria: 'Resultado',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-6',
    ticker: 'HGLG11',
    tickersRelacionados: ['BTLG11', 'XPLG11'],
    titulo: 'CSHG Logística (HGLG11) renova contratos atípicos e zera vacância em galpões de São Paulo',
    resumo: 'O fundo imobiliário logístico anunciou aditivos contratuais com reajustes pelo IPCA, garantindo previsibilidade de receita e proventos recorrentes nos próximos 5 anos para os cotistas.',
    fonte: 'Clube FII',
    dataPublicacao: 'Há 3 horas',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-7',
    ticker: 'WEGE3',
    titulo: 'WEG fecha contrato internacional de US$ 120 milhões para fornecimento de transformadores na Europa',
    resumo: 'A multinacional catarinense continua acelerando sua expansão na transição energética e inteligência industrial, com carteira de pedidos em níveis recordes para o próximo biênio.',
    fonte: 'Valor Econômico',
    dataPublicacao: 'Há 3 horas',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-8',
    ticker: 'XPML11',
    tickersRelacionados: ['VISC11'],
    titulo: 'XP Malls (XPML11) conclui compra de participação adicional em shopping premium com cap rate atrativo',
    resumo: 'Operação adiciona Área Bruta Locável de alto rendimento com fluxo consistente de consumidores e potencial de aumento nos rendimentos mensais distribuídos.',
    fonte: 'InfoMoney',
    dataPublicacao: 'Há 4 horas',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-9',
    ticker: 'TAEE11',
    tickersRelacionados: ['TAEE4'],
    titulo: 'Taesa entrega obra de linha de transmissão com 6 meses de antecedência e antecipa RAP integral',
    resumo: 'A transmissora de energia garantiu o direito ao recebimento da Receita Anual Permitida de forma antecipada, reforçando a blindagem do fluxo de caixa e dividendos robustos.',
    fonte: 'Suno Research',
    dataPublicacao: 'Há 5 horas',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-10',
    ticker: 'ITUB4',
    tickersRelacionados: ['ITSA4'],
    titulo: 'Itaú Unibanco expande margem com clientes e reduz custo de captação digital no terceiro trimestre',
    resumo: 'O maior banco privado do Brasil apresentou crescimento consistente nas receitas de serviços, impulsionando também os resultados da holding controladora Itaúsa (ITSA4).',
    fonte: 'Exame Invest',
    dataPublicacao: 'Há 6 horas',
    categoria: 'Resultado',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-11',
    ticker: 'KNCR11',
    tickersRelacionados: ['KNIP11', 'KNHY11'],
    titulo: 'Kinea Rendimentos Imobiliários (KNCR11) se beneficia de Selic em patamar elevado e paga provento máximo',
    resumo: 'Com carteira 100% atrelada ao CDI de emissores corporativos com rating AAA, o KNCR11 segue entre os preferidos para investidores que buscam liquidez e rendimento mensal defensivo.',
    fonte: 'Funds Explorer',
    dataPublicacao: 'Há 7 horas',
    categoria: 'Proventos',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-12',
    ticker: 'RENT3',
    titulo: 'Localiza conclui venda de seminovos com margens normalizadas e acelera frota pesada corporativa',
    resumo: 'A companhia registrou recuperação no mercado de usados, reduzindo a depreciação contábil por carro e aumentando o retorno sobre o capital empregado (ROIC).',
    fonte: 'Brazil Journal',
    dataPublicacao: 'Há 8 horas',
    categoria: 'Resultado',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-13',
    ticker: 'BTLG11',
    titulo: 'BTG Pactual Logística capta R$ 800 milhões em emissão de cotas com demanda superior à oferta',
    resumo: 'Os recursos serão alocados na expansão de galpões refrigerados e last-mile nos principais anéis rodoviários de São Paulo e Minas Gerais.',
    fonte: 'InfoMoney',
    dataPublicacao: 'Ontem',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-14',
    ticker: 'CPTS11',
    titulo: 'Capitânia (CPTS11) conclui giro tático de carteira de CRI e recompõe reserva de lucros acumulados',
    resumo: 'A gestão informou que a taxa média da carteira foi elevada para IPCA + 8,2% a.a., trazendo perspectiva de recuperação gradual na cotação a mercado nos próximos meses.',
    fonte: 'Clube FII',
    dataPublicacao: 'Ontem',
    categoria: 'Analise',
    sentimento: 'Neutro',
  },
  {
    id: 'noticia-15',
    ticker: 'ABEV3',
    titulo: 'Ambev acelera vendas digitais B2B pelo app BEES e expande linhas de cervejas artesanais e premium',
    resumo: 'Apesar do cenário competitivo com marcas importadas, a gigante de bebidas conseguiu ganhos de eficiência logística e reduziu custos com embalagens de alumínio.',
    fonte: 'Valor Econômico',
    dataPublicacao: 'Ontem',
    categoria: 'Resultado',
    sentimento: 'Neutro',
  },
  {
    id: 'noticia-16',
    ticker: 'TRXF11',
    titulo: 'TRX Real Estate adquire imóveis de atacarejo locados para Assaí e Grupo Pão de Açúcar com contratos de 15 anos',
    resumo: 'O fundo imobiliário de renda urbana amplia exposição a locatários essenciais com contratos atípicos de longo prazo e multas rescisórias integrais.',
    fonte: 'Funds Explorer',
    dataPublicacao: 'Ontem',
    categoria: 'Fato Relevante',
    sentimento: 'Positivo',
  },
  {
    id: 'noticia-17',
    ticker: 'BBDC4',
    tickersRelacionados: ['BBDC3'],
    titulo: 'Bradesco intensifica reestruturação de agências e avança no plano estratégico de crédito colateralizado',
    resumo: 'A diretoria destacou avanços na redução de despesas operacionais e migração de clientes para canais digitais, com foco em linhas de crédito de menor risco.',
    fonte: 'Exame Invest',
    dataPublicacao: 'Há 2 dias',
    categoria: 'Analise',
    sentimento: 'Neutro',
  },
  {
    id: 'noticia-18',
    ticker: 'POMO4',
    titulo: 'Marcopolo amplia exportações de ônibus elétricos Attivi e carteira de pedidos cobre 7 meses de produção',
    resumo: 'A fabricante nacional de carrocerias segue com fábrica em ritmo acelerado atendendo demandas de renovação de frotas urbanas no Brasil e na América Latina.',
    fonte: 'Valor Econômico',
    dataPublicacao: 'Há 2 dias',
    categoria: 'Resultado',
    sentimento: 'Positivo',
  },
];

// ==========================================
// 5. GERENCIAMENTO DE FAVORITOS (LOCALSTORAGE)
// ==========================================
const STORAGE_KEY_FAVORITOS = 'investirgo_ativos_favoritos';

export function getFavoritos(): string[] {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_FAVORITOS);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler favoritos do localStorage', e);
  }
  // Favoritos padrão na primeira inicialização
  const defaults = ['PETR4', 'VALE3', 'BBAS3', 'MXRF11', 'WEGE3'];
  salvarFavoritos(defaults);
  return defaults;
}

export function salvarFavoritos(favoritos: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITOS, JSON.stringify(favoritos));
  } catch (e) {
    console.error('Erro ao salvar favoritos no localStorage', e);
  }
}

export function toggleFavorito(ticker: string): string[] {
  const tickerUpper = ticker.toUpperCase();
  const atuais = getFavoritos();
  let novos: string[];
  if (atuais.includes(tickerUpper)) {
    novos = atuais.filter((t) => t !== tickerUpper);
  } else {
    novos = [...atuais, tickerUpper];
  }
  salvarFavoritos(novos);
  return novos;
}

export function isFavorito(ticker: string, listaFavoritos?: string[]): boolean {
  const favs = listaFavoritos || getFavoritos();
  return favs.includes(ticker.toUpperCase());
}

// ==========================================
// 6. DADOS MOCKADOS COMPLETOS DE CARTEIRA (FALLBACK)
// ==========================================
export const MOCK_OPERACOES: Operacao[] = [
  { id: 1, ativoId: 4, ticker: 'BBAS3', nomeAtivo: 'Banco do Brasil S.A.', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 1500, precoUnitario: 17.94, valorTotal: 26910.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 14.95, valorAtualTotal: 22425.00, createdAt: '2026-10-26' },
  { id: 2, ativoId: 6, ticker: 'TAEE4', nomeAtivo: 'Transmissora Aliança S.A.', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 1000, precoUnitario: 14.08, valorTotal: 14080.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 14.07, valorAtualTotal: 14070.00, createdAt: '2026-10-26' },
  { id: 3, ativoId: 8, ticker: 'ITSA4', nomeAtivo: 'Itaúsa S.A.', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 1000, precoUnitario: 13.19, valorTotal: 13190.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 13.39, valorAtualTotal: 13390.00, createdAt: '2026-10-26' },
  { id: 4, ativoId: 5, ticker: 'BBDC4', nomeAtivo: 'Banco Bradesco S.A. PN', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 1000, precoUnitario: 14.78, valorTotal: 14780.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 14.23, valorAtualTotal: 14230.00, createdAt: '2026-10-26' },
  { id: 5, ativoId: 9, ticker: 'SANB4', nomeAtivo: 'Banco Santander Brasil S.A.', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 1000, precoUnitario: 14.73, valorTotal: 14730.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 14.09, valorAtualTotal: 14090.00, createdAt: '2026-10-26' },
  { id: 6, ativoId: 10, ticker: 'POMO4', nomeAtivo: 'Marcopolo S.A.', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 3000, precoUnitario: 3.42, valorTotal: 10260.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 3.81, valorAtualTotal: 11430.00, createdAt: '2026-10-26' },
  { id: 7, ativoId: 11, ticker: 'BBDC3', nomeAtivo: 'Banco Bradesco S.A. ON', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-26', quantidade: 1000, precoUnitario: 13.56, valorTotal: 13560.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 13.00, valorAtualTotal: 13000.00, createdAt: '2026-10-26' },
  { id: 8, ativoId: 1, ticker: 'PETR4', nomeAtivo: 'Petrobras', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-27', quantidade: 500, precoUnitario: 36.20, valorTotal: 18100.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 37.85, valorAtualTotal: 18925.00, createdAt: '2026-10-27' },
  { id: 9, ativoId: 2, ticker: 'VALE3', nomeAtivo: 'Vale S.A.', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-27', quantidade: 300, precoUnitario: 61.50, valorTotal: 18450.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 58.20, valorAtualTotal: 17460.00, createdAt: '2026-10-27' },
  { id: 10, ativoId: 3, ticker: 'ITUB4', nomeAtivo: 'Itaú Unibanco', tipoAtivo: 'Acao', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-27', quantidade: 400, precoUnitario: 33.10, valorTotal: 13240.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 34.60, valorAtualTotal: 13840.00, createdAt: '2026-10-27' },
  { id: 11, ativoId: 16, ticker: 'MXRF11', nomeAtivo: 'Maxi Renda FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 1500, precoUnitario: 10.35, valorTotal: 15525.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 10.15, valorAtualTotal: 15225.00, createdAt: '2026-10-28' },
  { id: 12, ativoId: 17, ticker: 'HGLG11', nomeAtivo: 'CSHG Logística FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 80, precoUnitario: 163.20, valorTotal: 13056.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 161.50, valorAtualTotal: 12920.00, createdAt: '2026-10-28' },
  { id: 13, ativoId: 18, ticker: 'XPML11', nomeAtivo: 'XP Malls FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 120, precoUnitario: 108.50, valorTotal: 13020.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 107.20, valorAtualTotal: 12864.00, createdAt: '2026-10-28' },
  { id: 14, ativoId: 19, ticker: 'KNIP11', nomeAtivo: 'Kinea IPCA FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 150, precoUnitario: 93.40, valorTotal: 14010.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 91.80, valorAtualTotal: 13770.00, createdAt: '2026-10-28' },
  { id: 15, ativoId: 20, ticker: 'KNCR11', nomeAtivo: 'Kinea CDI FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 100, precoUnitario: 102.80, valorTotal: 10280.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 104.30, valorAtualTotal: 10430.00, createdAt: '2026-10-28' },
  { id: 16, ativoId: 21, ticker: 'BTLG11', nomeAtivo: 'BTG Logística FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 110, precoUnitario: 98.70, valorTotal: 10857.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 99.40, valorAtualTotal: 10934.00, createdAt: '2026-10-28' },
  { id: 17, ativoId: 22, ticker: 'VISC11', nomeAtivo: 'Vinci Shoppings FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 90, precoUnitario: 116.20, valorTotal: 10458.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 114.80, valorAtualTotal: 10332.00, createdAt: '2026-10-28' },
  { id: 18, ativoId: 23, ticker: 'HGRU11', nomeAtivo: 'CSHG Renda Urbana FII', tipoAtivo: 'FII', tipoOperacao: 'COMPRA', dataOperacao: '2026-10-28', quantidade: 70, precoUnitario: 126.00, valorTotal: 8820.00, taxas: 0, observacoes: 'Lançamento inicial', precoAtual: 124.60, valorAtualTotal: 8722.00, createdAt: '2026-10-28' },
];

export const MOCK_PROVENTOS: Provento[] = [
  { id: 1, ativoId: 16, ticker: 'MXRF11', nomeAtivo: 'Maxi Renda FII', tipoProvento: 'Rendimento', dataCom: '2026-10-31', dataPagamento: '2026-11-14', valorPorCota: 0.10, quantidadeCotas: 1500, valorTotal: 150.00, observacoes: 'Rendimento Novembro/2026' },
  { id: 2, ativoId: 4, ticker: 'BBAS3', nomeAtivo: 'Banco do Brasil S.A.', tipoProvento: 'JCP', dataCom: '2026-10-25', dataPagamento: '2026-11-15', valorPorCota: 0.38, quantidadeCotas: 1500, valorTotal: 570.00, observacoes: 'JCP 3T26' },
  { id: 3, ativoId: 6, ticker: 'TAEE4', nomeAtivo: 'Transmissora Aliança S.A.', tipoProvento: 'Dividendo', dataCom: '2026-10-28', dataPagamento: '2026-11-16', valorPorCota: 0.32, quantidadeCotas: 1000, valorTotal: 320.00, observacoes: 'Dividendos Intercalares' },
  { id: 4, ativoId: 17, ticker: 'HGLG11', nomeAtivo: 'CSHG Logística FII', tipoProvento: 'Rendimento', dataCom: '2026-10-31', dataPagamento: '2026-11-14', valorPorCota: 1.10, quantidadeCotas: 80, valorTotal: 88.00, observacoes: 'Rendimento Novembro/2026' },
  { id: 5, ativoId: 1, ticker: 'PETR4', nomeAtivo: 'Petrobras', tipoProvento: 'Dividendo', dataCom: '2026-10-20', dataPagamento: '2026-11-10', valorPorCota: 1.15, quantidadeCotas: 500, valorTotal: 575.00, observacoes: 'Dividendos Extraordinários' },
  { id: 6, ativoId: 18, ticker: 'XPML11', nomeAtivo: 'XP Malls FII', tipoProvento: 'Rendimento', dataCom: '2026-10-31', dataPagamento: '2026-11-14', valorPorCota: 0.92, quantidadeCotas: 120, valorTotal: 110.40, observacoes: 'Rendimento Novembro/2026' },
];

export function calcularResumoEPosicoesMock(
  operacoes: Operacao[] = MOCK_OPERACOES,
  proventos: Provento[] = MOCK_PROVENTOS,
  ativos: Ativo[] = TOP_30_ATIVOS
): { resumo: ResumoCarteira; posicoes: PosicaoCarteira[] } {
  const mapAtivos = new Map<string, Ativo>();
  ativos.forEach((a) => mapAtivos.set(a.ticker.toUpperCase(), a));

  // Mapa de proventos por ticker
  const proventosPorTicker = new Map<string, number>();
  proventos.forEach((p) => {
    const t = p.ticker.toUpperCase();
    proventosPorTicker.set(t, (proventosPorTicker.get(t) || 0) + p.valorTotal);
  });

  // Cálculo de Preço Médio e Custódia
  interface CalcPos {
    quantidade: number;
    precoMedio: number;
    lucroRealizado: number;
  }
  const posMap = new Map<string, CalcPos>();

  const opsOrdenadas = [...operacoes].sort((a, b) => new Date(a.dataOperacao).getTime() - new Date(b.dataOperacao).getTime());

  for (const op of opsOrdenadas) {
    const ticker = op.ticker.toUpperCase();
    if (!posMap.has(ticker)) {
      posMap.set(ticker, { quantidade: 0, precoMedio: 0, lucroRealizado: 0 });
    }
    const pos = posMap.get(ticker)!;

    if (op.tipoOperacao === 'COMPRA') {
      const custoAtual = pos.quantidade * pos.precoMedio;
      const custoCompra = op.quantidade * op.precoUnitario;
      pos.quantidade += op.quantidade;
      if (pos.quantidade > 0) {
        pos.precoMedio = (custoAtual + custoCompra) / pos.quantidade;
      }
    } else if (op.tipoOperacao === 'VENDA') {
      const lucro = (op.precoUnitario - pos.precoMedio) * op.quantidade;
      pos.lucroRealizado += lucro;
      pos.quantidade -= op.quantidade;
      if (pos.quantidade <= 0) {
        pos.quantidade = 0;
      }
    }
  }

  const posicoes: PosicaoCarteira[] = [];
  let saldoTotalGeral = 0;

  for (const [ticker, calc] of posMap.entries()) {
    if (calc.quantidade <= 0 && calc.lucroRealizado === 0) continue;

    const ativo = mapAtivos.get(ticker) || {
      id: 0,
      ticker,
      nome: ticker,
      tipo: (ticker.endsWith('11') ? 'FII' : 'Acao') as 'Acao' | 'FII',
      precoAtual: calc.precoMedio,
      variacaoDia: 0,
      dividendYield: 0,
      dataAtualizacao: new Date().toISOString(),
    };

    const totalInvestido = Number((calc.quantidade * calc.precoMedio).toFixed(2));
    const saldoAtual = Number((calc.quantidade * ativo.precoAtual).toFixed(2));
    const variacaoReais = Number((saldoAtual - totalInvestido).toFixed(2));
    const rentabilidadePercentual = totalInvestido > 0 ? Number(((variacaoReais / totalInvestido) * 100).toFixed(2)) : 0;
    const totalProventosRecebidos = Number((proventosPorTicker.get(ticker) || 0).toFixed(2));
    const lucroRealizadoVendas = Number(calc.lucroRealizado.toFixed(2));
    const lucroTotalGeral = Number((variacaoReais + totalProventosRecebidos + lucroRealizadoVendas).toFixed(2));

    saldoTotalGeral += saldoAtual;

    posicoes.push({
      ativoId: ativo.id,
      ticker: ativo.ticker,
      nome: ativo.nome,
      tipo: ativo.tipo,
      setor: ativo.setor,
      quantidadeCustodia: calc.quantidade,
      precoMedio: Number(calc.precoMedio.toFixed(4)),
      precoAtual: ativo.precoAtual,
      totalInvestido,
      saldoAtual,
      variacaoReais,
      rentabilidadePercentual,
      totalProventosRecebidos,
      lucroRealizadoVendas,
      lucroTotalGeral,
      percentualCarteira: 0,
    });
  }

  // Atualizar percentual da carteira
  posicoes.forEach((p) => {
    p.percentualCarteira = saldoTotalGeral > 0 ? Number(((p.saldoAtual / saldoTotalGeral) * 100).toFixed(2)) : 0;
  });

  posicoes.sort((a, b) => b.saldoAtual - a.saldoAtual);

  const totalInvestidoGeral = Number(posicoes.reduce((acc, p) => acc + p.totalInvestido, 0).toFixed(2));
  const saldoAtualGeral = Number(saldoTotalGeral.toFixed(2));
  const lucroPrejuizoNaoRealizado = Number((saldoAtualGeral - totalInvestidoGeral).toFixed(2));
  const rentabilidadePercentual = totalInvestidoGeral > 0 ? Number(((lucroPrejuizoNaoRealizado / totalInvestidoGeral) * 100).toFixed(2)) : 0;
  const totalProventos = Number(proventos.reduce((acc, p) => acc + p.valorTotal, 0).toFixed(2));
  const lucroRealizadoVendas = Number(posicoes.reduce((acc, p) => acc + p.lucroRealizadoVendas, 0).toFixed(2));
  const retornoTotalGeral = Number((lucroPrejuizoNaoRealizado + totalProventos + lucroRealizadoVendas).toFixed(2));

  const acoesList = posicoes.filter((p) => p.tipo === 'Acao');
  const fiisList = posicoes.filter((p) => p.tipo === 'FII');

  const totalAcoes = Number(acoesList.reduce((acc, p) => acc + p.saldoAtual, 0).toFixed(2));
  const totalFIIs = Number(fiisList.reduce((acc, p) => acc + p.saldoAtual, 0).toFixed(2));

  const percentualAcoes = saldoAtualGeral > 0 ? Number(((totalAcoes / saldoAtualGeral) * 100).toFixed(2)) : 0;
  const percentualFIIs = saldoAtualGeral > 0 ? Number(((totalFIIs / saldoAtualGeral) * 100).toFixed(2)) : 0;

  const resumo: ResumoCarteira = {
    totalInvestido: totalInvestidoGeral,
    saldoAtual: saldoAtualGeral,
    lucroPrejuizoNaoRealizado,
    rentabilidadePercentual,
    totalProventos,
    lucroRealizadoVendas,
    retornoTotalGeral,
    quantidadeAtivos: posicoes.length,
    totalAcoes,
    totalFIIs,
    percentualAcoes,
    percentualFIIs,
  };

  return { resumo, posicoes };
}
