/**
 * Motor de cálculos financieros para tarjetas de crédito (CMR) y CAE
 */

// Motor de cálculo financiero para 12 cuotas con tarjeta CMR y CAE
function calcularFinanciamiento(monto, caePorcentaje) {
  if (!monto || monto <= 0) {
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
  if (!state.autoCalcularCuotas) {
    return {
      cuota: state.cuotaMontoManual || 0,
      ctc: state.ctcManual || 0
    };
  }
  const res = calcularFinanciamiento(monto, state.cae);
  return res;
}

// Actualizar cálculos de cuotas en el panel de control lateral
function updateCalculos() {
  if (!dom.calcSummaryBox) return;
  const monto = getMontoFinanciamiento();
  if (monto > 0) {
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
  }
}
