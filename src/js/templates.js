/**
 * Plantillas y renderizadores de cartelería retail
 */

// Rutas o Data URIs para compatibilidad 100% portable y offline
const ASSET_PATHS = {
  get cmr() {
    return (typeof ASSETS !== 'undefined' && ASSETS.CMR) ? ASSETS.CMR : 'src/assets/cmr.png';
  },
  get oportunidadunica() {
    return (typeof ASSETS !== 'undefined' && ASSETS.OPORTUNIDAD_UNICA) ? ASSETS.OPORTUNIDAD_UNICA : 'src/assets/oportunidadunica.png';
  },
  get infocmf() {
    return (typeof ASSETS !== 'undefined' && ASSETS.INFOCMF) ? ASSETS.INFOCMF : 'src/assets/infocmf.png';
  },
  get fpuntos() {
    return (typeof ASSETS !== 'undefined' && ASSETS.FPUNTOS) ? ASSETS.FPUNTOS : 'src/assets/fpuntos.svg';
  }
};

// Assets e iconos oficiales
const ICONS = {
  // Logo oficial Fpuntos embebido directamente para renderizado vectorial 100% confiable y sin peticiones de red
  fpuntos: `
    <svg viewBox="0 0 1333.333 1333.333" width="100%" height="100%" class="fpuntos-img" xmlns="http://www.w3.org/2000/svg" style="display:block; width:100%; height:100%;"><path d="M1167.203 997.68c109.284-362.149-133.971-640.09-133.971-640.09-8.424-9.965-7.387-24.81 2.143-33.716l51.936-49.18c10.353-9.679 26.654-8.617 35.864 2.161 78.537 91.92 127.762 206.434 140.361 327.374 14.2 136.332-20.252 280.577-96.333 393.45" fill="#006cac"/><path d="M1142.675 616.978c-9.935-95.394-47.963-186.654-109.443-259.388 0 0 243.257 277.938 133.97 640.09-5.53 8.644-11.68 16.862-17.702 25.248-8.61 11.997-20.75 26.458-32.93 40.72-18.455 21.61-97.923-66.079-61.582-117.047 69.941-98.09 99.61-215.152 87.686-329.623" fill="#003695"/><path d="M993.152 162.445c-361.314-112.01-626.61 130.661-626.61 130.661-10.027 8.345-24.863 7.199-33.698-2.396l-54.078-50.919c-9.603-10.429-6.984-25.286 3.862-34.414 92.507-77.84 205.56-124.983 326.592-136.67 136.435-13.173 269.902 19.56 383.932 93.738" fill="#439e36"/><path d="M620.845 189.16c-95.692 9.467-180.239 43.906-254.304 103.947 0 0 265.295-242.675 626.61-130.663 8.606 5.595 17.115 11.363 25.474 17.423 6.432 4.663 18.567 14.285 40.136 31.915 22.008 17.982-65.579 98.188-116.835 62.26-93.65-65.644-206.548-96.214-321.08-84.883" fill="#007937"/><path d="M166.384 335.048c-107.866 362.575 134.4 639.69 134.4 639.69 8.462 9.93 6.804 25.206-2.69 34.15l-53.686 50.576c-10.318 9.722-24.565 7.838-33.817-2.904C131.698 964.95 83.038 851.71 69.97 730.82c-14.734-136.278 20.253-282.804 96.414-395.772" fill="#ffb700"/><path d="M191.004 718.208c10.467 97.8 48.484 182.83 109.78 256.53 0 0-242.27-277.115-134.4-639.69 5.497-8.667 11.881-17.319 17.843-25.748 4.59-6.485 14.677-18.855 32.69-40.505 18.175-21.848 97.783 65.71 61.36 116.616-66.94 93.561-100.106 212.893-87.273 332.797" fill="#ff6000"/><path d="M331.512 1164.264c359.325 118.242 635.104-125.269 635.104-125.269 10.168-8.172 24.982-6.77 33.65 2.98l53.416 49.879c9.419 10.593 7.954 26.862-3.05 35.802-93.84 76.228-215.118 128.346-336.332 137.935-136.647 10.812-270.059-25.187-382.788-101.327" fill="#e90646"/><path d="M704.59 1142.905c95.614-7.563 187.786-44.255 262.026-103.91 0 0-275.778 243.514-635.104 125.27-8.21-5.636-8.265-5.69-16.745-11.755-6.464-4.623-19.535-14.007-40.787-32.307-21.534-18.544 69.55-98.592 120.178-61.78 92.504 67.251 195.7 93.56 310.433 84.482" fill="#9e2b44"/><path d="M472.165 729.302c5.872 0 10.718-1.025 14.538-3.082 3.818-2.055 6.718-5.47 8.702-10.243 1.981-4.77 2.973-11.196 2.973-19.273 0-6.754-.736-12.48-2.203-17.183-1.47-4.697-4.002-8.332-7.6-10.903-3.598-2.568-8.629-3.854-15.088-3.854-7.049 0-12.08.7-15.089 2.092-3.01 1.398-4.515 3.196-4.515 5.397v52.424c2.788 1.619 5.871 2.79 9.251 3.524 3.377.737 6.388 1.101 9.03 1.101m9.694 26.434c-2.204 0-5.436-.22-9.693-.662-4.26-.438-8.664-1.43-13.216-2.973-4.554-1.543-8.446-3.927-11.674-7.16l6.608-10.35v57.71h-32.158V664.544c0-4.846 1.392-8.955 4.184-12.335 2.788-3.377 6.608-6.168 11.454-8.37 4.846-2.203 10.463-3.854 16.85-4.957 6.389-1.1 13.25-1.652 20.597-1.652 11.156 0 20.959 1.874 29.405 5.618 8.442 3.744 15.051 10.022 19.823 18.833 4.77 8.81 7.16 20.853 7.16 36.123 0 11.456-1.983 21.553-5.948 30.29-3.964 8.736-9.581 15.527-16.85 20.372-7.27 4.847-16.117 7.27-26.542 7.27M595.517 755.736c-10.282 0-19.384-1.617-27.315-4.847-7.93-3.226-14.097-8.184-18.503-14.866-4.405-6.682-6.606-15.382-6.606-26.104v-68.944h32.818v66.3c0 7.049 1.578 12.302 4.736 15.75 3.158 3.454 8.186 5.176 15.09 5.176 7.048 0 12.114-1.722 15.197-5.176 3.085-3.448 4.627-8.701 4.627-15.75v-66.3h30.837v68.944c0 15.86-4.553 27.462-13.657 34.802-9.106 7.347-21.512 11.015-37.224 11.015M664.46 650.447c2.789-1.467 6.46-2.974 11.013-4.516 4.552-1.54 9.544-2.896 14.979-4.075a208.473 208.473 0 0116.41-2.863c5.507-.733 10.607-1.101 15.31-1.101 9.982 0 18.5 1.287 25.55 3.855 7.048 2.57 12.446 6.718 16.19 12.444 3.744 5.728 5.617 13.513 5.617 23.349v74.892h-32.821v-68.284c0-2.788-.404-5.357-1.21-7.71-.81-2.347-2.021-4.367-3.634-6.058-1.62-1.687-3.82-3.007-6.61-3.964-2.79-.952-6.168-1.43-10.132-1.43-3.38 0-6.756.405-10.132 1.211-3.38.808-5.948 1.65-7.71 2.532v83.703h-32.82zM833.185 756.837c-12.924 0-22.544-3.05-28.855-9.142-6.316-6.092-9.472-14.72-9.472-25.88v-55.729h-16.301v-25.112h16.301v-30.617h34.362v30.617h24.449v25.112h-24.45v51.543c0 3.82.806 6.645 2.423 8.48 1.615 1.837 4.33 2.753 8.152 2.753 2.202 0 4.624-.441 7.268-1.321 2.643-.882 4.846-1.983 6.607-3.303v28.193c-3.083 1.615-6.424 2.755-10.023 3.414-3.598.661-7.085.992-10.461.992M917.767 729.524c5.43 0 9.946-1.284 13.546-3.855 3.596-2.568 6.314-6.312 8.151-11.234 1.835-4.92 2.752-10.975 2.752-18.171 0-8.224-.917-14.721-2.752-19.495-1.837-4.77-4.592-8.222-8.26-10.353-3.673-2.128-8.15-3.193-13.437-3.193-5.582 0-10.13 1.1-13.656 3.304-3.524 2.202-6.134 5.693-7.82 10.462-1.69 4.774-2.532 11.199-2.532 19.275 0 11.16 1.942 19.492 5.836 25 3.888 5.507 9.946 8.26 18.172 8.26m0 26.212c-18.798 0-32.93-5.028-42.402-15.09-9.472-10.057-14.208-24.851-14.208-44.382 0-20.999 4.808-36.087 14.428-45.267 9.616-9.174 23.68-13.766 42.182-13.766 12.481 0 22.942 2.093 31.39 6.278 8.44 4.183 14.83 10.61 19.163 19.272 4.33 8.667 6.497 19.826 6.497 33.483 0 19.53-4.922 34.325-14.757 44.383-9.841 10.06-23.939 15.089-42.293 15.089M1019.532 755.736c-7.93 0-14.725-.848-20.375-2.535-5.656-1.685-10.98-3.557-15.97-5.616V718.73c3.082 2.06 6.532 4.152 10.353 6.279 3.816 2.13 8.039 3.855 12.665 5.176 4.626 1.321 9.506 1.983 14.648 1.983 5.286 0 8.994-.916 11.123-2.754 2.128-1.834 3.193-4.074 3.193-6.717 0-2.496-1.101-4.517-3.302-6.059-2.203-1.541-5.067-2.825-8.591-3.853a179.198 179.198 0 00-11.233-2.865c-3.526-.734-7.05-1.871-10.574-3.414a32.742 32.742 0 01-9.472-6.277c-2.79-2.644-5.03-5.91-6.717-9.803-1.69-3.888-2.535-8.624-2.535-14.206 0-7.195 1.395-13.18 4.186-17.952 2.788-4.771 6.46-8.626 11.014-11.564a46.929 46.929 0 0114.759-6.28c5.285-1.244 10.424-1.794 15.417-1.65 9.104.295 16.336 1.287 21.698 2.974 5.358 1.69 10.242 3.854 14.648 6.498v25.77a326.019 326.019 0 00-14.868-7.818c-4.923-2.424-10.54-3.636-16.851-3.636-5.728 0-9.841.882-12.335 2.644-2.498 1.762-3.746 4.114-3.746 7.048 0 2.79.845 4.995 2.534 6.61 1.687 1.616 3.927 2.9 6.718 3.854 2.788.956 5.872 1.87 9.25 2.752 3.67.882 7.454 1.948 11.346 3.194a44.952 44.952 0 0111.013 5.286c3.45 2.279 6.24 5.436 8.37 9.472 2.127 4.042 3.193 9.363 3.193 15.97-.147 8.958-2.571 16.117-7.268 21.476-4.7 5.362-10.76 9.18-18.172 11.454-7.418 2.275-15.458 3.415-24.12 3.415" fill="#333d40"/><path d="M275.983 752.428v-148.65c0-25.697 20.831-46.527 46.527-46.527h86.324v36.577h-71.637c-7.627 0-13.81 6.181-13.81 13.808v32.719h73.742v37.162h-73.742v46.66c0 15.603-12.648 28.251-28.25 28.251z" fill="#29a010"/></svg>
  `,

  // Badge oficial Oportunidad Única + Tarjeta CMR provistos por el usuario
  cmrComboBadge: `
    <div class="cmr-badge-combo">
      <img src="${ASSET_PATHS.oportunidadunica}" alt="Oportunidad Única" class="oportunidad-img" width="447" height="447">
      <img src="${ASSET_PATHS.cmr}" alt="Tarjeta CMR Banco Falabella" class="cmr-card-img" width="409" height="644">
    </div>
  `
};

// Plantillas Verticales: P_118 (Carta) y P_132 (13x19)
function renderVerticalTemplate(sheet, tplCode, ctx) {
  let codeLabel = tplCode === 'p118' ? 'P_118' : 'P_132';
  if (!ctx.hasCmr && !ctx.hasOferta && ctx.hasNormal && tplCode === 'p118') {
    codeLabel = 'P_156';
  } else if (!ctx.hasCmr && ctx.hasOferta && tplCode === 'p118') {
    codeLabel = 'P_141';
  }

  // 1. Header superior con slogan y QR
  const topHeader = document.createElement('div');
  topHeader.className = 'top-header-row';
  topHeader.innerHTML = `
    <div class="online-slogan">
      TENEMOS MÁS DE LO QUE PODEMOS MOSTRAR <span class="highlight">ONLINE</span>
    </div>
    <div class="qr-box" id="qrContainer" title="Escanea para ver en falabella.com"></div>
  `;
  sheet.appendChild(topHeader);

  // 2. Encabezado del Producto
  const prodHeader = document.createElement('div');
  prodHeader.className = 'product-header';
  prodHeader.innerHTML = `
    <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
    <div class="category-name">${escapeHTML(state.categoria || 'CATEGORÍA')}</div>
    <div class="model-sku-row">${escapeHTML(state.modelo || '')} / ${escapeHTML(state.sku || '')}</div>
  `;
  sheet.appendChild(prodHeader);

  // 3. Bloque Central de Precios
  const centerPricing = document.createElement('div');
  centerPricing.className = 'pricing-center';

  // Caso 1: SOLO PRECIO NORMAL (P_156 de muestra oficial)
  if (!ctx.hasCmr && !ctx.hasOferta && ctx.hasNormal) {
    centerPricing.innerHTML = `
      <div class="solo-normal-big-price">${formatCLP(state.precioNormal)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644">
        <div class="cuotas-texts">
          <div class="cuotas-line-1">12 CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
    `;
  }
  // Caso 2: SIN CMR / OFERTA + NORMAL (P_141 - TODO MEDIO DE PAGO)
  else if (!ctx.hasCmr && ctx.hasOferta) {
    centerPricing.innerHTML = `
      <div class="todo-medio-label">TODO MEDIO DE PAGO</div>
      <div class="price-cmr-value">${formatCLP(state.precioOferta)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644">
        <div class="cuotas-texts">
          <div class="cuotas-line-1">12 CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}

      ${ctx.hasNormal ? `
        <div class="price-normal-block">
          <div class="price-normal-label">PRECIO NORMAL</div>
          <div class="price-normal-value">${formatCLP(state.precioNormal)}</div>
        </div>
      ` : ''}
    `;
  }
  // Caso 3: COMPLETO CON PRECIO CMR (Oportunidad Única P_118)
  else {
    centerPricing.innerHTML = `
      ${ICONS.cmrComboBadge}
      <div class="price-cmr-block">
        <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
        ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
        <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
        <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        ` : ''}
      </div>

      ${ctx.hasOferta ? `
        <div class="price-oferta-block">
          <div class="price-oferta-value">${formatCLP(state.precioOferta)}</div>
          <div class="price-oferta-label">OTRO MEDIO DE PAGO</div>
        </div>
      ` : ''}

      ${ctx.hasNormal ? `
        <div class="price-normal-block">
          <div class="price-normal-value">${formatCLP(state.precioNormal)}</div>
          <div class="price-normal-label">PRECIO NORMAL</div>
        </div>
      ` : ''}
    `;
  }
  sheet.appendChild(centerPricing);

  // 4. Pie de página Legal y Fpuntos
  const footer = document.createElement('div');
  footer.className = 'bottom-footer';
  footer.innerHTML = `
    <div class="legal-box">
      <div class="vigencia-text">${ctx.vigenciaStr}</div>
      <img src="${ASSET_PATHS.infocmf}" alt="Información CMF" class="legal-cmf-img" width="1303" height="114">
    </div>
    <div class="fpuntos-badge">
      ${ICONS.fpuntos}
    </div>
    <div class="template-code-badge">${codeLabel}</div>
  `;
  sheet.appendChild(footer);
}

// Plantilla Horizontal: P_123 (Cenefa / Fleje - 210 x 48 mm)
function renderFlejeHorizontal(sheet, ctx) {
  const fDesde = formatDateChile(state.vigenciaDesde);
  const fHasta = formatDateChile(state.vigenciaHasta);
  const vigenciaFleje = (fDesde && fHasta) ? `VIGENCIA: ${fDesde} A ${fHasta}` : '';

  let pricingHtml = '';

  if (ctx.hasCmr) {
    pricingHtml = `
      <div class="cmr-row">
        ${ICONS.cmrComboBadge}
        <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
      </div>

      ${ctx.hasOferta ? `
        <div class="oferta-row">
          <span class="price-oferta-label">OTRO MEDIO DE PAGO:</span>
          <span class="price-oferta-value">${formatCLP(state.precioOferta)}</span>
        </div>
      ` : ''}

      ${ctx.hasNormal ? `
        <div class="normal-row ${ctx.hasOferta ? 'pequeno' : ''}">
          <span class="price-normal-label">PRECIO NORMAL:</span>
          <span class="price-normal-value">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  } else if (ctx.hasOferta) {
    pricingHtml = `
      <div class="cmr-row">
        <span class="price-oferta-main-label">PRECIO OFERTA:</span>
        <div class="price-cmr-value" style="color: #df0024;">${formatCLP(state.precioOferta)}</div>
      </div>

      ${ctx.hasNormal ? `
        <div class="normal-row pequeno">
          <span class="price-normal-label">PRECIO NORMAL:</span>
          <span class="price-normal-value">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  } else {
    pricingHtml = `
      <div class="cmr-row">
        <div class="price-cmr-value" style="color: #000;">${formatCLP(state.precioNormal)}</div>
      </div>
    `;
  }

  const isTriPrice = ctx.hasCmr && ctx.hasOferta && ctx.hasNormal;

  sheet.innerHTML = `
    <div class="left-col">
      <div>
        <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
        <div class="model-sku-block">${escapeHTML(state.modelo || '')} / ${escapeHTML(state.sku || '')}</div>
        <div class="category-name">${escapeHTML(state.categoria || 'CATEGORÍA')}</div>
      </div>
      <div class="vigencia-text">${vigenciaFleje}</div>
    </div>

    <div class="divider-line"></div>

    <div class="right-col ${isTriPrice ? 'tri-price' : ''}">
      ${pricingHtml}
      <div class="template-code-badge">P_123</div>
    </div>
  `;
}

// Plantilla P_121 (Ficha Horizontal - 140 x 95 mm)
function renderFichaP121(sheet, ctx) {
  sheet.innerHTML = `
    <div class="product-header">
      <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
      <div class="category-name">${escapeHTML(state.categoria || 'CATEGORÍA')}</div>
      <div class="model-sku-row">${escapeHTML(state.modelo || '')} / ${escapeHTML(state.sku || '')}</div>
    </div>

    <div class="pricing-center">
      ${ctx.hasCmr ? `
        ${ICONS.cmrComboBadge}
        <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
        ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
        <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
        <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        ` : ''}
      ` : ''}

      ${ctx.hasOferta ? `
        <div class="price-oferta-block">
          <div class="price-oferta-value">${formatCLP(state.precioOferta)}</div>
          <div class="price-oferta-label">OTRO MEDIO DE PAGO</div>
        </div>
      ` : ''}

      ${ctx.hasNormal ? `
        <div class="price-normal-inline">
          <span>PRECIO NORMAL</span>
          <span class="val">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    </div>

    <div class="template-code-badge">P_121</div>
  `;
}

// Plantilla 15x21 (Pedestal Mediano - 150 x 210 mm)
function render15x21(sheet, ctx) {
  let pricingHtml = '';
  if (!ctx.hasCmr && !ctx.hasOferta && ctx.hasNormal) {
    pricingHtml = `
      <div class="solo-normal-big-price" style="font-size: 50pt;">${formatCLP(state.precioNormal)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644" style="height: 10mm;">
        <div class="cuotas-texts">
          <div class="cuotas-line-1" style="font-size: 13pt;">12 CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2" style="font-size: 10pt;">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
    `;
  } else if (!ctx.hasCmr && ctx.hasOferta) {
    pricingHtml = `
      <div class="todo-medio-label" style="font-size: 15pt;">TODO MEDIO DE PAGO</div>
      <div class="price-cmr-value" style="font-size: 44pt;">${formatCLP(state.precioOferta)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644" style="height: 10mm;">
        <div class="cuotas-texts">
          <div class="cuotas-line-1" style="font-size: 13pt;">12 CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2" style="font-size: 10pt;">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
      ${ctx.hasNormal ? `
        <div class="price-normal-block">
          <div class="price-normal-label" style="font-size: 10pt;">PRECIO NORMAL</div>
          <div class="price-normal-value" style="font-size: 30pt;">${formatCLP(state.precioNormal)}</div>
        </div>
      ` : ''}
    `;
  } else {
    pricingHtml = `
      ${ICONS.cmrComboBadge}
      <div class="price-cmr-block">
        <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
        ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
        <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
        <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        ` : ''}
      </div>
      ${ctx.hasOferta ? `
        <div class="price-oferta-block">
          <div class="price-oferta-value">${formatCLP(state.precioOferta)}</div>
          <div class="price-oferta-label">OTRO MEDIO DE PAGO</div>
        </div>
      ` : ''}
      ${ctx.hasNormal ? `
        <div class="price-normal-block">
          <div class="price-normal-value">${formatCLP(state.precioNormal)}</div>
          <div class="price-normal-label">PRECIO NORMAL</div>
        </div>
      ` : ''}
    `;
  }

  sheet.innerHTML = `
    <div class="top-header-row">
      <div class="online-slogan">
        TENEMOS MÁS DE LO QUE PODEMOS MOSTRAR <span class="highlight">ONLINE</span>
      </div>
      <div class="qr-box"></div>
    </div>

    <div class="product-header">
      <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
      <div class="category-name">${escapeHTML(state.categoria || '')}</div>
      <div class="model-sku-row">${escapeHTML(state.modelo || '')} / ${escapeHTML(state.sku || '')}</div>
    </div>

    <div class="pricing-center">
      ${pricingHtml}
    </div>

    <div class="bottom-footer">
      <div class="legal-box">
        <div class="vigencia-text">${ctx.vigenciaStr}</div>
        <img src="${ASSET_PATHS.infocmf}" alt="Información CMF" class="legal-cmf-img" width="1303" height="114">
      </div>
      <div class="fpuntos-badge">
        ${ICONS.fpuntos}
      </div>
      <div class="template-code-badge">15x21</div>
    </div>
  `;
}

// Plantilla 9x13 (Pedestal Compacto - 90 x 130 mm)
function render9x13(sheet, ctx) {
  let pricingHtml = '';
  if (!ctx.hasCmr && !ctx.hasOferta && ctx.hasNormal) {
    pricingHtml = `
      <div class="solo-normal-big-price" style="font-size: 34pt;">${formatCLP(state.precioNormal)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644" style="height: 7mm;">
        <div class="cuotas-texts">
          <div class="cuotas-line-1" style="font-size: 8.5pt;">12 CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2" style="font-size: 6.5pt;">CAE: ${state.cae.toFixed(1)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
    `;
  } else if (!ctx.hasCmr && ctx.hasOferta) {
    pricingHtml = `
      <div class="todo-medio-label" style="font-size: 9pt;">TODO MEDIO DE PAGO</div>
      <div class="price-cmr-value" style="font-size: 28pt;">${formatCLP(state.precioOferta)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644" style="height: 7mm;">
        <div class="cuotas-texts">
          <div class="cuotas-line-1" style="font-size: 8.5pt;">12 CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2" style="font-size: 6.5pt;">CAE: ${state.cae.toFixed(1)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
      ${ctx.hasNormal ? `
        <div class="price-normal-block">
          <div class="price-normal-label" style="font-size: 7pt;">PRECIO NORMAL</div>
          <div class="price-normal-value" style="font-size: 19pt;">${formatCLP(state.precioNormal)}</div>
        </div>
      ` : ''}
    `;
  } else {
    pricingHtml = `
      ${ICONS.cmrComboBadge}
      <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
      <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
      ` : ''}
      ${ctx.hasOferta ? `
        <div class="price-oferta-block">
          <div class="price-oferta-value">${formatCLP(state.precioOferta)}</div>
          <div class="price-oferta-label">OTRO MEDIO DE PAGO</div>
        </div>
      ` : ''}
      ${ctx.hasNormal ? `
        <div class="price-normal-block">
          <div class="price-normal-value">${formatCLP(state.precioNormal)}</div>
          <div class="price-normal-label">PRECIO NORMAL</div>
        </div>
      ` : ''}
    `;
  }

  sheet.innerHTML = `
    <div class="product-header">
      <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
      <div class="category-name">${escapeHTML(state.categoria || '')}</div>
      <div class="model-sku-row">${escapeHTML(state.modelo || '')} / ${escapeHTML(state.sku || '')}</div>
    </div>

    <div class="pricing-center">
      ${pricingHtml}
    </div>

    <div class="bottom-footer">
      <div class="legal-box">
        <div class="vigencia-text">${ctx.vigenciaStr}</div>
        <img src="${ASSET_PATHS.infocmf}" alt="Información CMF" class="legal-cmf-img" width="1303" height="114">
      </div>
      <div class="template-code-badge">9x13</div>
    </div>
  `;
}

// Plantilla P_130 / P_121 (Ficha Mesón 9x7 - 90 x 70 mm)
function render9x7(sheet, ctx) {
  const fDesde = formatDateChile(state.vigenciaDesde);
  const fHasta = formatDateChile(state.vigenciaHasta);
  const vigenciaStr = (fDesde && fHasta) ? `VIGENCIA: ${fDesde} A ${fHasta}` : 'VIGENCIA DISPONIBLE EN TIENDA';

  const modelSkuText = (state.modelo && state.sku)
    ? `${escapeHTML(state.modelo)} / ${escapeHTML(state.sku)}`
    : escapeHTML(state.modelo || state.sku || '');

  const codeLabel = ctx.hasCmr ? 'P_121' : 'P_130';

  if (sheet.classList) {
    sheet.classList.remove('tri-price');
    sheet.classList.remove('has-cmr');
  }

  let pricingHtml = '';

  // Caso 1: Solo Precio Normal
  if (!ctx.hasCmr && !ctx.hasOferta && ctx.hasNormal) {
    pricingHtml = `
      <div class="price-oferta-header" style="color: #000;">PRECIO NORMAL</div>
      <div class="price-oferta-value" style="color: #000;">${formatCLP(state.precioNormal)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644">
        <div class="cuotas-texts">
          <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
    `;
  }
  // Caso 2: Precio Oferta (sin CMR) - Caso oficial P_130
  else if (!ctx.hasCmr && ctx.hasOferta) {
    pricingHtml = `
      <div class="price-oferta-header">PRECIO OFERTA</div>
      <div class="price-oferta-value">${formatCLP(state.precioOferta)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-row">
        <img src="${ASSET_PATHS.cmr}" alt="CMR" class="cmr-mini-card" width="409" height="644">
        <div class="cuotas-texts">
          <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
          <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
        </div>
      </div>
      ` : ''}
      ${ctx.hasNormal ? `
        <div class="price-normal-row">
          PRECIO NORMAL <span class="val">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  }
  // Caso 3: Precio CMR con Precio Oferta (Tri-precio idéntico a referencia visual del usuario)
  else if (ctx.hasCmr && ctx.hasOferta) {
    if (sheet.classList) {
      sheet.classList.add('tri-price', 'has-cmr');
    } else {
      sheet.className += ' tri-price has-cmr';
    }

    pricingHtml = `
      <div class="cmr-badge-combo">
        <img src="${ASSET_PATHS.oportunidadunica}" alt="Oportunidad Única" class="oportunidad-img" width="447" height="447">
        <img src="${ASSET_PATHS.cmr}" alt="Tarjeta CMR Banco Falabella" class="cmr-card-img" width="409" height="644">
      </div>
      <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-block">
        <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
        <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
      </div>
      ` : ''}

      <div class="price-oferta-block">
        <div class="price-oferta-value">${formatCLP(state.precioOferta)}</div>
        <div class="price-oferta-label">OTRO MEDIO DE PAGO</div>
      </div>

      ${ctx.hasNormal ? `
        <div class="price-normal-row">
          PRECIO NORMAL <span class="val">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  }
  // Caso 4: Precio CMR sin Precio Oferta
  else {
    if (sheet.classList) {
      sheet.classList.add('has-cmr');
    } else {
      sheet.className += ' has-cmr';
    }

    pricingHtml = `
      <div class="cmr-badge-combo">
        <img src="${ASSET_PATHS.oportunidadunica}" alt="Oportunidad Única" class="oportunidad-img" width="447" height="447">
        <img src="${ASSET_PATHS.cmr}" alt="Tarjeta CMR Banco Falabella" class="cmr-card-img" width="409" height="644">
      </div>
      <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
      ${ctx.financiamiento && ctx.financiamiento.cuota > 0 ? `
      <div class="cuotas-cmr-block">
        <div class="cuotas-line-1">${state.cuotasNum} CUOTAS DE ${formatCLP(ctx.financiamiento.cuota)}</div>
        <div class="cuotas-line-2">CAE: ${state.cae.toFixed(2)}% / CTC: ${formatCLP(ctx.financiamiento.ctc)}</div>
      </div>
      ` : ''}
      ${ctx.hasNormal ? `
        <div class="price-normal-row">
          PRECIO NORMAL <span class="val">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  }

  sheet.innerHTML = `
    <div class="product-header">
      <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
      <div class="category-name">${escapeHTML(state.categoria || 'CATEGORÍA')}</div>
      <div class="model-sku-row">${modelSkuText}</div>
    </div>

    <div class="pricing-center">
      ${pricingHtml}
    </div>

    <div class="bottom-footer">
      <div class="vigencia-text">${vigenciaStr}</div>
      <div class="template-code-badge">${codeLabel}</div>
    </div>
  `;
}

// Plantilla 12x3 (Fleje Angosto - 120 x 30 mm)
function render12x3(sheet, ctx) {
  const fDesde = formatDateChile(state.vigenciaDesde);
  const fHasta = formatDateChile(state.vigenciaHasta);
  const vigenciaStr = (fDesde && fHasta) ? `VIGENCIA: ${fDesde} A ${fHasta}` : '';

  let pricingHtml = '';

  if (ctx.hasCmr) {
    pricingHtml = `
      <div class="cmr-row">
        ${ICONS.cmrComboBadge}
        <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
      </div>

      ${ctx.hasOferta ? `
        <div class="oferta-row">
          <span class="price-oferta-label-12x3">OTRO MEDIO DE PAGO:</span>
          <span class="price-oferta-value-12x3">${formatCLP(state.precioOferta)}</span>
        </div>
      ` : ''}

      ${ctx.hasNormal ? `
        <div class="normal-row ${ctx.hasOferta ? 'pequeno' : ''}">
          <span class="price-normal-label">PRECIO NORMAL:</span>
          <span class="price-normal-value">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  } else if (ctx.hasOferta) {
    pricingHtml = `
      <div class="cmr-row">
        <span class="price-oferta-main-label">PRECIO OFERTA:</span>
        <div class="price-cmr-value" style="color: #df0024;">${formatCLP(state.precioOferta)}</div>
      </div>
      ${ctx.hasNormal ? `
        <div class="normal-row pequeno">
          <span class="price-normal-label">PRECIO NORMAL:</span>
          <span class="price-normal-value">${formatCLP(state.precioNormal)}</span>
        </div>
      ` : ''}
    `;
  } else {
    pricingHtml = `
      <div class="cmr-row">
        <div class="price-cmr-value" style="color: #000;">${formatCLP(state.precioNormal)}</div>
      </div>
    `;
  }

  sheet.innerHTML = `
    <div class="left-col">
      <div>
        <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
        <div class="prod-sku">${escapeHTML(state.modelo || '')} / ${escapeHTML(state.sku || '')}</div>
        <div class="prod-cat">${escapeHTML(state.categoria || '')}</div>
      </div>
      <div class="vigencia-text">${vigenciaStr}</div>
    </div>

    <div class="divider-line"></div>

    <div class="right-col">
      ${pricingHtml}
      <div class="template-code-badge">12x3</div>
    </div>
  `;
}

// Generador HTML para Etiqueta 6x4
function get6x4Html(ctx) {
  const fDesde = formatDateChile(state.vigenciaDesde);
  const fHasta = formatDateChile(state.vigenciaHasta);
  const vigenciaStr = (fDesde && fHasta) ? `VIGENCIA: ${fDesde} A ${fHasta}` : '';

  let codeLabel = 'P_141';
  if (!ctx.hasCmr && !ctx.hasOferta && ctx.hasNormal) {
    codeLabel = 'P_156';
  }

  const modelSkuText = (state.modelo && state.sku)
    ? `${escapeHTML(state.modelo)} / ${escapeHTML(state.sku)}`
    : escapeHTML(state.modelo || state.sku || '');

  // Caso especial: Tri-precio simultáneo (CMR + Oferta + Normal) según muestra solicitada
  if (ctx.hasCmr && ctx.hasOferta && ctx.hasNormal) {
    return `
      <div class="header-6x4">
        <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
        <div class="category-name">${escapeHTML(state.categoria || '')}</div>
        <div class="model-sku">${modelSkuText}</div>
      </div>

      <div class="pricing-center-6x4 tri-price">
        <div class="cmr-inline-row-6x4">
          ${ICONS.cmrComboBadge}
          <div class="price-cmr-value">${formatCLP(state.precioCmr)}</div>
        </div>

        <div class="otro-medio-block-6x4">
          <div class="otro-medio-label-6x4">OTRO MEDIO</div>
          <div class="otro-medio-value-6x4">${formatCLP(state.precioOferta)}</div>
        </div>
      </div>

      <div class="footer-6x4">
        <div class="vigencia-text">${vigenciaStr}</div>
        <div class="footer-normal-col-6x4">
          <div class="footer-normal-label-6x4">PRECIO NORMAL</div>
          <div class="footer-normal-val-6x4">${formatCLP(state.precioNormal)}</div>
        </div>
      </div>
    `;
  }

  let pricingContentHtml = '';

  if (ctx.hasCmr) {
    // Caso CMR con solo Normal o solo Oferta
    let secondaryHtml = '';
    if (ctx.hasNormal) {
      secondaryHtml = `
        <div class="price-normal-col-6x4">
          <div class="price-normal-label-6x4">PRECIO NORMAL</div>
          <div class="price-normal-value-6x4">${formatCLP(state.precioNormal)}</div>
        </div>
      `;
    } else if (ctx.hasOferta) {
      secondaryHtml = `
        <div class="price-normal-col-6x4">
          <div class="price-normal-label-6x4">OTRO MEDIO DE PAGO</div>
          <div class="price-normal-value-6x4">${formatCLP(state.precioOferta)}</div>
        </div>
      `;
    }

    pricingContentHtml = `
      <div class="pricing-center-6x4">
        ${ICONS.cmrComboBadge}
        <div class="price-cmr-value" style="color: #df0024;">${formatCLP(state.precioCmr)}</div>
        ${secondaryHtml}
      </div>
    `;
  } else if (ctx.hasOferta) {
    // Caso en Oferta (Todo Medio de Pago)
    let secondaryHtml = '';
    if (ctx.hasNormal) {
      secondaryHtml = `
        <div class="price-normal-col-6x4">
          <div class="price-normal-label-6x4">PRECIO NORMAL</div>
          <div class="price-normal-value-6x4">${formatCLP(state.precioNormal)}</div>
        </div>
      `;
    }

    pricingContentHtml = `
      <div class="pricing-center-6x4">
        <div class="price-cmr-value" style="color: #df0024;">${formatCLP(state.precioOferta)}</div>
        ${secondaryHtml}
      </div>
    `;
  } else {
    // Caso Solo Normal
    pricingContentHtml = `
      <div class="pricing-center-6x4">
        <div class="price-normal-col-6x4" style="margin-top: 0;">
          <div class="price-normal-label-6x4" style="margin-bottom: 0.5mm;">PRECIO NORMAL</div>
          <div class="price-cmr-value" style="color: #000000;">${formatCLP(state.precioNormal)}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="header-6x4">
      <div class="brand-name">${escapeHTML(state.marca || 'MARCA')}</div>
      <div class="category-name">${escapeHTML(state.categoria || '')}</div>
      <div class="model-sku">${modelSkuText}</div>
    </div>

    ${pricingContentHtml}

    <div class="footer-6x4">
      <div class="vigencia-text">${vigenciaStr}</div>
      <div class="template-code-badge">${codeLabel}</div>
    </div>
  `;
}

// Plantilla 6x4 Individual
function render6x4(sheet, ctx) {
  sheet.innerHTML = get6x4Html(ctx);
}

// Plantilla Hoja Carta con 18 etiquetas de 6x4
function render6x4Sheet(sheet, ctx) {
  const labelHtml = get6x4Html(ctx);
  let gridCells = '';
  // 18 etiquetas (3 columnas x 6 filas)
  for (let i = 0; i < 18; i++) {
    gridCells += `<div class="grid-cell-label t-6x4">${labelHtml}</div>`;
  }
  sheet.innerHTML = `<div class="sheet-6x4-grid">${gridCells}</div>`;
}
