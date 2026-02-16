// /frontend/src/utils/currencyUtils.js

/**
 * Formata um número ou string numérica para o padrão monetário BRL (R$).
 * Usa a vírgula como separador decimal.
 * @param {string | number | null | undefined} valor O valor a ser formatado.
 * @returns {string} O valor formatado como R$ 150,00 ou 'R$ 0,00'.
 */
export const formatarValorBR = (valor) => {
  // Converte o valor para número. Se falhar (null, undefined, NaN), usa 0.
  const numero = Number(valor);
  if (isNaN(numero)) {
    return 'R$ 0,00';
  }

  // Usa a API Intl.NumberFormat, que é nativa do JavaScript
  // e sabe formatar moedas corretamente para qualquer localidade.
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2, // Garante sempre 2 casas decimais
  });
};