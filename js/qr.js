/**
 * Generador de código QR para cartelería
 */

// Generador de QR dinámico hacia falabella.com/falabella-cl/product/{sku}/
function generateQRCode(containerEl, sku) {
  containerEl.innerHTML = '';
  const cleanSku = (sku || '').trim() || '80835902';
  const targetUrl = `https://www.falabella.com/falabella-cl/product/${cleanSku}/`;

  if (window.QRCode) {
    new QRCode(containerEl, {
      text: targetUrl,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });

    // Ocultar canvas explícitamente por si el navegador ignora inline styles
    const canvas = containerEl.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'none';
    }
  } else {
    // Fallback visual si la librería aún no ha cargado
    containerEl.innerHTML = `<div style="font-size:9px; border:1px solid #ccc; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">QR SKU</div>`;
  }
}
