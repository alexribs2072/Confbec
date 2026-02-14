// Regras de enquadramento e validação para o módulo de competições
// Baseadas no Regulamento Geral (REGRAS GERAIS DE ESPORTES DE CONTATO)

function calcAgeYears(birthDate, refDate) {
  const b = new Date(birthDate);
  const r = new Date(refDate);
  let age = r.getFullYear() - b.getFullYear();
  const m = r.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < b.getDate())) age--;
  return Math.max(0, age);
}

/**
 * Grupo etário conforme regulamento:
 * - Kadete: 5 anos completos até a véspera de completar 15
 * - Juvenil: 15 completos até a véspera de completar 18
 * - Adulto: 18 a 40 completos
 * - Master 1: 41 a 55 completos
 * - Master 2: 56+
 */
function grupoEtarioFromAge(ageYears) {
  const age = Number(ageYears);
  if (!Number.isFinite(age)) return null;
  if (age < 5) return null;
  if (age < 15) return 'KADETE';
  if (age < 18) return 'JUVENIL';
  if (age <= 40) return 'ADULTO';
  if (age <= 55) return 'MASTER';
  return 'MASTER2';
}

function divisaoIdadeFromGrupo(grupoEtario) {
  switch (grupoEtario) {
    case 'KADETE': return '5-14';
    case 'JUVENIL': return '15-17';
    case 'ADULTO': return '18-40';
    case 'MASTER': return '41-55';
    case 'MASTER2': return '56+';
    default: return null;
  }
}

/**
 * Modalidades permitidas (Art. 06)
 * Kadete: Point Fight, Kickboxing Light Contact, K1 Light, Brazilian Grappling, e também Kickboxing Semi Contato.
 * Master: Point Fight, Kickboxing Light Contact, K1 Light e Brazilian Grappling.
 * Juvenil/Adulto: todas as modalidades previstas pela Confederação.
 */
function modalidadePermitidaPorGrupo(grupoEtario, competicaoModalidadeCode) {
  const g = String(grupoEtario || '').toUpperCase();
  const code = String(competicaoModalidadeCode || '').toUpperCase();

  if (!code) return false;

  // Juvenil/Adulto: sem restrição aqui (depende do que o evento habilitar)
  if (g === 'JUVENIL' || g === 'ADULTO') return true;

  const base = new Set(['POINT_FIGHT', 'KB_LIGHT', 'K1_LIGHT', 'BRAZILIAN_GRAPPLING']);
  if (g === 'KADETE') {
    base.add('KB_SEMI');
    return base.has(code);
  }
  if (g === 'MASTER' || g === 'MASTER2') {
    return base.has(code);
  }

  return false;
}

/**
 * Divisões de peso: o regulamento menciona que seguem tabelas oficiais (Art. 08),
 * mas não inclui os limites exatos.
 * Aqui aplicamos apenas o peso mínimo por grupo (para impedir inscrições inválidas)
 * e mantemos uma divisão placeholder até a tabela oficial ser adicionada.
 */
function minPesoPorGrupo(grupoEtario) {
  switch (String(grupoEtario || '').toUpperCase()) {
    case 'KADETE': return 25;
    case 'JUVENIL': return 40;
    case 'ADULTO': return 55;
    case 'MASTER':
    case 'MASTER2':
      return 60;
    default:
      return null;
  }
}

function validatePesoMinimo(grupoEtario, pesoKg) {
  const min = minPesoPorGrupo(grupoEtario);
  const n = Number(pesoKg);
  if (!Number.isFinite(n)) return { ok: false, msg: 'Peso inválido.' };
  if (min == null) return { ok: false, msg: 'Grupo etário inválido.' };
  if (n < min) return { ok: false, msg: `Peso mínimo para ${grupoEtario} é ${min}kg (tabela oficial).` };
  return { ok: true };
}

function divisaoPesoPlaceholder(pesoKg) {
  const n = Number(pesoKg);
  if (!Number.isFinite(n)) return 'PENDENTE';
  return `ATE_${Math.ceil(n)}`.slice(0, 20);
}

/**
 * Autorização especial (Art. 05): acima de 40 anos.
 * - Municipal/Estadual: Federação Estadual
 * - Nacional/Internacional: CONFBEC
 * - Solicitação com antecedência mínima de 30 dias
 */
function requiresAutorizacaoEspecial(idadeAnos) {
  const age = Number(idadeAnos);
  return Number.isFinite(age) && age > 40;
}

function authorityByEscopo(escopo) {
  const e = String(escopo || '').toUpperCase();
  if (e === 'NACIONAL' || e === 'INTERNACIONAL') return 'CONFBEC';
  // MUNICIPAL ou ESTADUAL
  return 'FEDERACAO_ESTADUAL';
}

function hasMinAntecedenciaDias(eventDate, nowDate = new Date(), minDays = 30) {
  const ev = new Date(eventDate);
  const now = new Date(nowDate);
  if (Number.isNaN(ev.getTime()) || Number.isNaN(now.getTime())) return false;
  const diffMs = ev.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= minDays;
}

/**
 * Categoria de combate por nível técnico (Art. 07)
 * - AVANCADA: faixas/graduações superiores (ex.: Marrom, Preta, Dan, Coral, Grau Preto...)
 * - COLORIDAS: iniciantes/intermediários
 */
function isGraduacaoAvancada(graduacaoNome) {
  const n = String(graduacaoNome || '').toLowerCase();
  if (!n) return false;

  const matchers = [
    'faixa marrom',
    'faixa preta',
    'dan',
    'faixa coral',
    'grau preto',
    'prajied',
    'ponta preta',
  ];

  return matchers.some(m => n.includes(m));
}

function validateCategoriaCombate(categoriaSelecionada, graduacaoNome) {
  const cat = String(categoriaSelecionada || '').toUpperCase();
  if (!['COLORIDAS', 'AVANCADA'].includes(cat)) {
    return { ok: false, msg: 'Categoria de combate inválida.' };
  }

  const avancada = isGraduacaoAvancada(graduacaoNome);
  if (avancada && cat !== 'AVANCADA') {
    return { ok: false, msg: 'Sua graduação exige inscrição na categoria AVANÇADA.' };
  }
  if (!avancada && cat !== 'COLORIDAS') {
    return { ok: false, msg: 'Sua graduação não permite inscrição na categoria AVANÇADA.' };
  }

  return { ok: true };
}

module.exports = {
  calcAgeYears,
  grupoEtarioFromAge,
  divisaoIdadeFromGrupo,
  modalidadePermitidaPorGrupo,
  minPesoPorGrupo,
  validatePesoMinimo,
  divisaoPesoPlaceholder,
  requiresAutorizacaoEspecial,
  authorityByEscopo,
  hasMinAntecedenciaDias,
  isGraduacaoAvancada,
  validateCategoriaCombate,
};
