/**
 * Formata uma string de data (ISO ou YYYY-MM-DD) para dd/mm/yyyy.
 * @param {string | Date | null | undefined} dateString A data a ser formatada.
 * @returns {string} A data formatada como dd/mm/yyyy ou 'N/A'.
 */
export const formatarDataBR = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // Tenta criar um objeto Date. Funciona com ISO strings e YYYY-MM-DD.
    // Adiciona 'T00:00:00Z' para strings YYYY-MM-DD para garantir que seja interpretado como UTC
    // e evitar problemas de fuso horário na conversão apenas da data.
    const dateObj = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00Z`);
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }

    // Obtém dia, mês e ano em UTC para evitar deslocamentos de fuso horário
    const dia = String(dateObj.getUTCDate()).padStart(2, '0');
    const mes = String(dateObj.getUTCMonth() + 1).padStart(2, '0'); // Mês é base 0
    const ano = dateObj.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return 'Erro na data';
  }
};

/**
 * Formata uma string de data/hora ISO para dd/mm/yyyy HH:MM.
 * Usa o fuso horário local (São Paulo) para exibir a hora correta.
 * @param {string | Date | null | undefined} dateTimeString A data/hora a ser formatada.
 * @returns {string} A data/hora formatada ou 'N/A'.
 */
export const formatarDataHoraBR = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    
    try {
        const dateObj = new Date(dateTimeString);
        if (isNaN(dateObj.getTime())) return 'Data inválida';

        return dateObj.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo', // Garante a conversão para o fuso correto
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        // Saída: "19/10/2025, 19:21"
    } catch (error) {
        console.error("Erro ao formatar data/hora:", error);
        return 'Erro na data/hora';
    }
};