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

  const base = new Set([
    'POINT_FIGHT',
    'KB_LIGHT',
    'K1_LIGHT',
    'BRAZILIAN_GRAPPLING',
    // Boxe Clássico/Amador (tabela de rounds/duração)
    'BOXE_CLASSICO_AMADOR',
    'BOXE_CLASSICO',
    'BOXE_AMADOR',
  ]);
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
 * Divisões de peso (Art. 08) – tabelas oficiais.
 * Observação: a tabela é apresentada como cortes (ex.: 55, 60, 65...).
 * Interpretamos como "até X kg" (inclusive) e a última como "acima de X".
 */
const PESO_DIVISOES = {
  KADETE: { cortes: [25, 35, 45, 55, 65, 75, 85, 95, 100], acimaDe: 100 },
  JUVENIL: { cortes: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95], acimaDe: 95 },
  ADULTO: { cortes: [55, 60, 65, 70, 75, 80, 85, 90, 95], acimaDe: 95 },
  MASTER: { cortes: [60, 70, 80, 90], acimaDe: 90 },
  MASTER2: { cortes: [60, 70, 80, 90], acimaDe: 90 },
};

function pesoDivisoesByGrupo(grupoEtario) {
  const g = String(grupoEtario || '').toUpperCase();
  return PESO_DIVISOES[g] || null;
}

function minPesoPorGrupo(grupoEtario) {
  const t = pesoDivisoesByGrupo(grupoEtario);
  return t?.cortes?.[0] ?? null;
}

function validatePesoMinimo(grupoEtario, pesoKg) {
  const min = minPesoPorGrupo(grupoEtario);
  const n = Number(pesoKg);
  if (!Number.isFinite(n)) return { ok: false, msg: 'Peso inválido.' };
  if (min == null) return { ok: false, msg: 'Grupo etário inválido.' };
  if (n < min) return { ok: false, msg: `Peso mínimo para ${grupoEtario} é ${min}kg (conforme tabela oficial).` };
  return { ok: true };
}

/**
 * Retorna um código curto (<= 20 chars) para salvar no banco.
 * Exemplos: ATE_70 / ACIMA_95
 */
function divisaoPesoFromGrupo(grupoEtario, pesoKg) {
  const t = pesoDivisoesByGrupo(grupoEtario);
  const n = Number(pesoKg);
  if (!t || !Number.isFinite(n)) return null;

  for (const c of t.cortes) {
    if (n <= c) return `ATE_${c}`;
  }
  return `ACIMA_${t.acimaDe}`;
}

function divisaoPesoLabel(divisaoPesoCode) {
  const code = String(divisaoPesoCode || '').toUpperCase();
  if (code.startsWith('ATE_')) {
    const n = Number(code.replace('ATE_', ''));
    if (Number.isFinite(n)) return `Até ${n} kg`;
  }
  if (code.startsWith('ACIMA_')) {
    const n = Number(code.replace('ACIMA_', ''));
    if (Number.isFinite(n)) return `Acima de ${n} kg`;
  }
  return code || '—';
}

// =========================
// Dinâmica de combate (Boxe Clássico/Amador)
// =========================

function boxeRoundsConfigFromAge(ageYears) {
  const age = Number(ageYears);
  if (!Number.isFinite(age) || age < 5) return null;

  // Tabela 1 (Rounds e Duração - Boxe Clássico/Amador)
  // Kadete I: 05 a 10 -> 3x1min (descanso 1min)
  // Kadete II/Juvenil: 11 a 17 -> 3x2min (descanso 1min)
  // Adulto/Master 1: 18 a 55 -> 3x3min (descanso 1min)
  // Master 2: 56+ -> 3x2min (descanso 1min)
  const rounds = 3;
  const descansoMin = 1;

  let duracaoMin = 2;
  if (age <= 10) duracaoMin = 1;
  else if (age <= 17) duracaoMin = 2;
  else if (age <= 55) duracaoMin = 3;
  else duracaoMin = 2;

  return {
    rounds,
    duracao_segundos: duracaoMin * 60,
    descanso_segundos: descansoMin * 60,
    label: `${rounds}x${duracaoMin}min (descanso ${descansoMin}min)`,
  };
}

function fightConfigByModalidadeCode(competicaoModalidadeCode, ageYears) {
  const code = String(competicaoModalidadeCode || '').toUpperCase();
  if (!code) return null;

  if (code === 'BOXE_CLASSICO_AMADOR' || code === 'BOXE_CLASSICO' || code === 'BOXE_AMADOR') {
    return boxeRoundsConfigFromAge(ageYears);
  }

  return null;
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
  pesoDivisoesByGrupo,
  minPesoPorGrupo,
  validatePesoMinimo,
  divisaoPesoFromGrupo,
  divisaoPesoLabel,
  boxeRoundsConfigFromAge,
  fightConfigByModalidadeCode,
  requiresAutorizacaoEspecial,
  authorityByEscopo,
  hasMinAntecedenciaDias,
  isGraduacaoAvancada,
  validateCategoriaCombate,
};
