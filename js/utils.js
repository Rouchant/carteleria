/**
 * Utilidades de formato y helpers generales
 */

// Formateador de moneda en pesos chilenos ($1.099.990)
function formatCLP(val) {
  if (val === null || val === undefined || val === '' || isNaN(val)) return '';
  const num = Math.round(Number(val));
  return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Desformateador de texto a número entero
function parseCLP(str) {
  if (!str) return null;
  const clean = str.toString().replace(/[^\d]/g, '');
  if (!clean) return null;
  return parseInt(clean, 10);
}

// Formateador de fechas a DD/MM/AAAA
function formatDateChile(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Cálculo automático de la semana de vigencia retail (Martes anterior más cercano a Lunes próximo más cercano, incluyendo hoy)
function getSemanaVigenteActual(refDate = new Date()) {
  const d = new Date(refDate);
  const day = d.getDay(); // 0 = Domingo, 1 = Lunes, 2 = Martes, ..., 6 = Sábado

  // Días transcurridos desde el martes anterior más cercano (0 si hoy es martes)
  const diffToTuesday = (day - 2 + 7) % 7;

  // Días faltantes para el lunes próximo más cercano (0 si hoy es lunes)
  const diffToMonday = (1 - day + 7) % 7;

  const tuesdayPast = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToTuesday);
  const mondayNext = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);

  const toISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayNum}`;
  };

  return {
    desde: toISO(tuesdayPast),
    hasta: toISO(mondayNext)
  };
}

// Escapar texto para renderizado seguro en HTML
function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Toast de notificación en pantalla
function showToast(message, type = 'info') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') {
    toast.style.background = '#dc2626';
  }
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 14 14"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
