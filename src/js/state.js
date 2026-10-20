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
  zoom: 0.75,
  mode: 'manual', // 'manual' | 'batch'
  batchItems: [],
  activeBatchIndex: 0,
  batchViewMode: 'single', // 'single' | 'mosaic'
  batchVigenciaDesde: semanaInicial.desde,
  batchVigenciaHasta: semanaInicial.hasta,
  batchCae: 39.93
};

// Mapeo completo declarativo de configuración de presets
const PRESET_CONFIG_MAP = {
  'asus-full': {
    data: {
      marca: 'MARCA',
      categoria: 'Categoria',
      modelo: 'Modelo',
      sku: '00000000',
      precioCmr: 999990,
      precioOferta: 999990,
      precioNormal: 999990,
      cae: 39.93,
      autoCalcularCuotas: true
    },
    message: 'Ejemplo Oportunidad Única cargado'
  },
  'sin-cmr': {
    data: {
      marca: 'MARCA',
      categoria: 'Categoria',
      modelo: 'Modelo',
      sku: '00000000',
      precioCmr: null,
      precioOferta: 999990,
      precioNormal: 999990,
      cae: 39.93,
      autoCalcularCuotas: true
    },
    message: 'Ejemplo Todo Medio de Pago cargado'
  },
  'solo-normal': {
    data: {
      marca: 'MARCA',
      categoria: 'Categoria',
      modelo: 'Modelo',
      sku: '00000000',
      precioCmr: null,
      precioOferta: null,
      precioNormal: 999990,
      cae: 39.93,
      autoCalcularCuotas: true
    },
    message: 'Ejemplo Solo Precio Normal cargado'
  },
  'clean': {
    data: {
      marca: '',
      categoria: '',
      modelo: '',
      sku: '',
      precioCmr: null,
      precioOferta: null,
      precioNormal: null,
      fechasPersonalizadas: false
    },
    resetDates: true,
    message: 'Formulario limpiado'
  }
};

// Cargar preset de ejemplo mediante mapeo declarativo
function applyPreset(type) {
  const preset = PRESET_CONFIG_MAP[type];
  if (!preset) return;

  // Solo preformatear fechas a la semana vigente si el usuario NO ha escogido fechas a mano o si es limpieza
  if (!state.fechasPersonalizadas || preset.resetDates) {
    const semana = (typeof getSemanaVigenteActual === 'function') ? getSemanaVigenteActual() : semanaInicial;
    state.vigenciaDesde = semana.desde;
    state.vigenciaHasta = semana.hasta;
    state.batchVigenciaDesde = semana.desde;
    state.batchVigenciaHasta = semana.hasta;
  }

  Object.assign(state, preset.data);

  if (type === 'clean') {
    if (dom.autofillDisclaimer) {
      dom.autofillDisclaimer.classList.add('hidden');
    }
    // Limpieza total: resetear y quitar todos los elementos adicionales del modo por lote
    if (typeof clearBatch === 'function') {
      clearBatch();
    } else {
      state.batchItems = [];
      state.activeBatchIndex = 0;
    }
  }

  showToast(preset.message);

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

  // Sincronizar campos de vigencia y CAE para modo lote
  if (dom.inputBatchVigenciaDesde) {
    dom.inputBatchVigenciaDesde.value = state.batchVigenciaDesde || state.vigenciaDesde;
  }
  if (dom.inputBatchVigenciaHasta) {
    dom.inputBatchVigenciaHasta.value = state.batchVigenciaHasta || state.vigenciaHasta;
  }
  if (dom.inputBatchCae) {
    dom.inputBatchCae.value = state.batchCae || state.cae || 39.93;
  }

  if (typeof updateCalculos === 'function') updateCalculos();
}
