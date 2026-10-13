/**
 * Estado global y gestión de presets
 */

// Calcular la semana de vigencia actual dinámica (Martes anterior a Lunes próximo)
const semanaInicial = (typeof getSemanaVigenteActual === 'function')
  ? getSemanaVigenteActual()
  : { desde: '2026-10-06', hasta: '2026-10-12' };

// Estado global reactivo de la aplicación
const state = {
  marca: 'MARCA',
  categoria: 'Categoria',
  modelo: 'Modelo',
  sku: '00000000',
  vigenciaDesde: semanaInicial.desde,
  vigenciaHasta: semanaInicial.hasta,
  fechasPersonalizadas: false, // Flag que indica si el usuario escogió fechas a mano
  precioCmr: 999990,
  precioOferta: 999990,
  precioNormal: 999990,
  cae: 39.93,
  cuotasNum: 12,
  autoCalcularCuotas: true,
  cuotaMontoManual: 101292,
  ctcManual: 1223424,
  template: 'p118', // 'p118', 'p132', 'p123', 'p121', 't-15x21', 't-9x13', 't-9x7', 't-12x3', 't-6x4', 't-6x4-sheet'
  zoom: 0.75
};

// Cargar preset de ejemplo
function applyPreset(type) {
  // Solo preformatear fechas a la semana vigente si el usuario NO ha escogido fechas a mano
  if (!state.fechasPersonalizadas) {
    const semana = (typeof getSemanaVigenteActual === 'function') ? getSemanaVigenteActual() : semanaInicial;
    state.vigenciaDesde = semana.desde;
    state.vigenciaHasta = semana.hasta;
  }

  if (type === 'asus-full') {
    state.marca = 'MARCA';
    state.categoria = 'Categoria';
    state.modelo = 'Modelo';
    state.sku = '00000000';
    state.precioCmr = 999990;
    state.precioOferta = 999990;
    state.precioNormal = 999990;
    state.cae = 39.93;
    state.autoCalcularCuotas = true;
    showToast('Ejemplo Oportunidad Única cargado');
  } else if (type === 'sin-cmr') {
    state.marca = 'MARCA';
    state.categoria = 'Categoria';
    state.modelo = 'Modelo';
    state.sku = '00000000';
    state.precioCmr = null;
    state.precioOferta = 999990;
    state.precioNormal = 999990;
    state.cae = 39.93;
    state.autoCalcularCuotas = true;
    showToast('Ejemplo Todo Medio de Pago cargado');
  } else if (type === 'solo-normal') {
    state.marca = 'MARCA';
    state.categoria = 'Categoria';
    state.modelo = 'Modelo';
    state.sku = '00000000';
    state.precioCmr = null;
    state.precioOferta = null;
    state.precioNormal = 999990;
    state.cae = 39.93;
    state.autoCalcularCuotas = true;
    showToast('Ejemplo Solo Precio Normal cargado');
  } else if (type === 'clean') {
    state.marca = '';
    state.categoria = '';
    state.modelo = '';
    state.sku = '';
    state.precioCmr = null;
    state.precioOferta = null;
    state.precioNormal = null;
    state.fechasPersonalizadas = false;
    const semana = (typeof getSemanaVigenteActual === 'function') ? getSemanaVigenteActual() : semanaInicial;
    state.vigenciaDesde = semana.desde;
    state.vigenciaHasta = semana.hasta;
    showToast('Formulario limpiado');
  }

  syncFormFromState();
  if (typeof updateCalculos === 'function') updateCalculos();
  if (typeof renderCartel === 'function') renderCartel();
}

// Sincronizar formulario desde el estado actual
function syncFormFromState() {
  if (!dom.inputMarca) return;
  dom.inputMarca.value = state.marca;
  dom.inputCategoria.value = state.categoria;
  if (dom.btnClearCategoria) {
    dom.btnClearCategoria.classList.toggle('hidden', !state.categoria || state.categoria.trim() === '');
  }
  dom.inputModelo.value = state.modelo;
  dom.inputSku.value = state.sku;
  dom.inputVigenciaDesde.value = state.vigenciaDesde;
  dom.inputVigenciaHasta.value = state.vigenciaHasta;
  dom.inputPrecioCmr.value = state.precioCmr ? formatCLP(state.precioCmr) : '';
  dom.inputPrecioOferta.value = state.precioOferta ? formatCLP(state.precioOferta) : '';
  dom.inputPrecioNormal.value = state.precioNormal ? formatCLP(state.precioNormal) : '';
  dom.inputCae.value = state.cae;
  dom.checkAutoCalc.checked = state.autoCalcularCuotas;
  dom.inputCuotaManual.value = formatCLP(state.cuotaMontoManual);
  dom.inputCtcManual.value = formatCLP(state.ctcManual);
  dom.manualCalcFields.style.display = state.autoCalcularCuotas ? 'none' : 'grid';

  if (typeof updateCalculos === 'function') updateCalculos();
}
