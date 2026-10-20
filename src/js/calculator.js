/**
 * Motor de cálculos financieros para tarjetas de crédito (CMR) y CAE
 */

// Monto mínimo oficial Falabella para simulación de 12 cuotas CMR
const MONTO_MINIMO_CUOTAS = 60000;

// Motor de cálculo financiero para 12 cuotas con tarjeta CMR y CAE
function calcularFinanciamiento(monto, caePorcentaje) {
  // En retail Falabella, la simulación de 12 cuotas aplica SOLAMENTE sobre los $60.000
  if (!monto || monto <= MONTO_MINIMO_CUOTAS) {
    return { cuota: 0, ctc: 0 };
  }

  const cae = parseFloat(caePorcentaje) || 39.93;

  // Factor oficial retail Falabella para 12 cuotas (calibrado a CAE 39.93%)
  // Coincide al peso exacto en ambos ejemplos oficiales:
  // $639.990 -> 12 cuotas de $64.826 / CTC $782.981
  // $1.499.990 -> 12 cuotas de $151.938 / CTC $1.835.136
  const factorCuotaBase = 151938 / 1499990; // ~0.101292675

  // Ajuste según CAE si es diferente de 39.93%
  const factorAjuste = (Math.abs(cae - 39.93) < 0.01)
    ? 1
    : (Math.pow(1 + cae / 100, 1 / 12) - 1) / (Math.pow(1 + 0.3993, 1 / 12) - 1);

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
