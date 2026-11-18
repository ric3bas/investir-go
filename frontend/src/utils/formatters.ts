export const formatarDinheiro = (valor: number | string): string => {
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const aplicarMascaraDinheiro = (valor: string): string => {
  // Remove tudo que não é dígito
  let v = valor.replace(/\D/g, '');
  // Adiciona zeros à esquerda se necessário e garante que temos pelo menos os decimais
  v = (parseInt(v) / 100).toFixed(2);
  // Formata como moeda BRL
  return v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
