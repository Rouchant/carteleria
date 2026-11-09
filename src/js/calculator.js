/**
 * Motor de cálculos financieros para tarjetas de crédito (CMR) y CAE
 */

// Monto mínimo oficial Falabella para simulación de 12 cuotas CMR
const MONTO_MINIMO_CUOTAS = 60000;

// Umbrales de tramos CMF / Retail Falabella para simulación de 12 cuotas
const UMBRAL_TRAMO_BAJO_CLP = 600000;
const UMBRAL_TRAMO_ALTO_CLP = 2000000;

// Motor de cálculo financiero para 12 cuotas con tarjeta CMR y CAE
function calcularFinanciamiento(monto, caePorcentaje) {
  // En retail Falabella, la simulación de 12 cuotas aplica SOLAMENTE sobre los $60.000
  if (!monto || monto <= MONTO_MINIMO_CUOTAS) {
    return { cuota: 0, ctc: 0 };
  }

  const cae = parseFloat(caePorcentaje) || 39.93;

  // Ajuste proporcional si el usuario modifica manualmente el CAE respecto al 39.93% base
  const factorAjuste = (Math.abs(cae - 39.93) < 0.01)
    ? 1
    : (Math.pow(1 + cae / 100, 1 / 12) - 1) / (Math.pow(1 + 0.3993, 1 / 12) - 1);

  // 1. Tramo Alto (> $2.000.000 CLP / > 50 UF):
  // Calibrado con fleje real tienda SKU 80835900: $2.999.990 -> 12 cuotas de $301.995 / CTC $3.647.858
  if (monto > UMBRAL_TRAMO_ALTO_CLP) {
    const factorCuotaAlto = 301995 / 2999990; // ~0.1006653356
    const cuotaFinal = Math.round(monto * factorCuotaAlto * factorAjuste);
    const impuestoTE = Math.round(cuotaFinal * 12 * 0.0066);
    const ctcTotal = (cuotaFinal * 12) + impuestoTE;
    return {
      cuota: cuotaFinal,
      ctc: ctcTotal
    };
  }

  const factorCuotaBase = 151938 / 1499990; // ~0.101292675

  // 2. Tramo Bajo ($60.001 a $599.999 CLP):
  // Calibrado con fleje real tienda SKU 80709744: $569.990 -> 12 cuotas de $59.762 / CTC $721.817
  if (monto < UMBRAL_TRAMO_BAJO_CLP) {
    const montoBaseTramo = monto + 20000;
    const cuotaFinal = Math.round(montoBaseTramo * factorCuotaBase * factorAjuste);
    const impuestoTE = Math.round(montoBaseTramo * 0.00792);
    const ctcTotal = (cuotaFinal * 12) + impuestoTE;
    return {
      cuota: cuotaFinal,
      ctc: ctcTotal
    };
  }

  // 3. Tramo Medio Estándar ($600.000 a $2.000.000 CLP):
  // Coincide al peso exacto en los flejes de tienda:
  // $639.990   -> 12 cuotas de $64.826  / CTC $782.981
  // $1.219.990 -> 12 cuotas de $123.576 / CTC $1.492.574 (SKU 80739039)
  // $1.499.990 -> 12 cuotas de $151.938 / CTC $1.835.136
  const cuotaFinal = Math.round(monto * factorCuotaBase * factorAjuste);

  // CTC oficial en Chile (Normativa CMF / SERNAC y D.L. 3475):
  // CTC = (12 * Cuota) + Impuesto de Timbres y Estampillas (0.066% mensual x 12 = 0.792%)
  const impuestoTE = Math.round(monto * 0.00792);
  const ctcTotal = (cuotaFinal * 12) + impuestoTE;

  return {
    cuota: cuotaFinal,
    ctc: ctcTotal
  };
}

// Determinar el monto base para la simulación de cuotas CMR
function getMontoFinanciamiento() {
  if (state.precioCmr && state.precioCmr > 0) return state.precioCmr;
  if (state.precioOferta && state.precioOferta > 0) return state.precioOferta;
  if (state.precioNormal && state.precioNormal > 0) return state.precioNormal;
  return 0;
}

// Retorna los valores de cuota y CTC actuales a mostrar en el cartel
function getValoresCuotaActuales() {
  const monto = getMontoFinanciamiento();
  // Solamente sobre los $60.000 se permite simulación de cuotas
  if (monto <= MONTO_MINIMO_CUOTAS) {
    return { cuota: 0, ctc: 0 };
  }

  if (!state.autoCalcularCuotas) {
    return {
      cuota: state.cuotaMontoManual || 0,
      ctc: state.ctcManual || 0
    };
  }
  return calcularFinanciamiento(monto, state.cae);
}

// Actualizar cálculos de cuotas en el panel de control lateral
function updateCalculos() {
  if (!dom.calcSummaryBox) return;
  const monto = getMontoFinanciamiento();
  if (monto > MONTO_MINIMO_CUOTAS) {
    const res = calcularFinanciamiento(monto, state.cae);
    dom.calcSummaryBox.style.display = 'flex';
    dom.calcCuotaDisplay.textContent = formatCLP(res.cuota);
    dom.calcCtcDisplay.textContent = formatCLP(res.ctc);

    if (state.autoCalcularCuotas) {
      state.cuotaMontoCalculado = res.cuota;
      state.ctcCalculado = res.ctc;
    }
  } else {
    dom.calcSummaryBox.style.display = 'none';
    if (state.autoCalcularCuotas) {
      state.cuotaMontoCalculado = 0;
      state.ctcCalculado = 0;
    }
  }
}

// Compatibilidad modular y CommonJS para tests unitarios
if (typeof window !== 'undefined') {
  window.MONTO_MINIMO_CUOTAS = MONTO_MINIMO_CUOTAS;
  window.calcularFinanciamiento = calcularFinanciamiento;
  window.getMontoFinanciamiento = getMontoFinanciamiento;
  window.getValoresCuotaActuales = getValoresCuotaActuales;
  window.updateCalculos = updateCalculos;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MONTO_MINIMO_CUOTAS,
    calcularFinanciamiento,
    getMontoFinanciamiento,
    getValoresCuotaActuales,
    updateCalculos
  };
}
