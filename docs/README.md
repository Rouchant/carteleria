# Generador de Cartelería Retail & CMR (Single Page App)

Aplicación web Single Page (SPA) profesional diseñada para la creación y exportación a PDF en alta resolución (300 DPI) de carteles oficiales para retail, compatible con los formatos físicos de tiendas Falabella.

---

## 🚀 Características Principales

1. **Personalización Completa**:
   - **Marca**: (ej. `ASUS`)
   - **Categoría**: (ej. `NOTEBOOK`)
   - **Modelo**: (ej. `X1504VA-E84208W`)
   - **SKU**: (ej. `80835902`)
   - **Vigencia**: Selector de fechas inicio y fin con formato `VIGENCIA: DD/MM/AAAA A DD/MM/AAAA`.

2. **Lógica Dinámica de Precios**:
   - **Completo (CMR + Oferta + Normal)**: Badge oficial de *Oportunidad Única* + tarjeta verde *CMR*, precio destacado en rojo, cálculo de 12 cuotas con CAE/CTC, precio oferta en negro y precio normal referencial.
   - **Sin CMR (Oferta + Normal)**: Si no se ingresa precio CMR, el precio oferta toma el protagonismo destacado y se oculta el badge y cuotas de CMR.
   - **Solo Precio Normal**: Si solo se ingresa el precio normal, se genera automáticamente el diseño limpio y centrado de precio regular.

3. **Cálculo Financiero Automático**:
   - Selector de **CAE %** anual (ej. `39.93%`).
   - Cálculo automático de **12 cuotas fijas** con fórmula de amortización y timbres.
   - Cálculo automático de **Costo Total del Crédito (CTC)**.
   - Opción para ajustar o ingresar montos manuales en caso de promociones especiales.

4. **Código QR Dinámico**:
   - En formatos aplicables (ej. Carta P_118 y 13x19 P_132), genera en tiempo real un código QR en la esquina superior derecha que redirige a:
     `https://www.falabella.com/falabella-cl/product/{sku}/`

5. **Formatos Soportados**:
   - **P_118**: Carta Vertical (`21.6 × 27.9 cm`) con cabecera *"TENEMOS MÁS DE LO QUE PODEMOS MOSTRAR ONLINE"*, QR y Fpuntos.
   - **P_132**: Góndola Vertical (`13.0 × 19.0 cm`) de alta densidad.
   - **P_123**: Fleje / Cenefa Horizontal (`21.0 × 4.8 cm`) con división vertical.
   - **P_121**: Ficha de Mesa / Mostrador (`14.0 × 9.5 cm`).

6. **Exportación e Impresión**:
   - **Descargar PDF**: Exportación directa a 300 DPI respetando las medidas milimétricas exactas de cada cartel.
   - **Imprimir / Guardar como PDF**: Integración con el motor de impresión nativo del navegador con estilos `@media print` milimétricos.

---

## 💻 Cómo Iniciar la Aplicación

Desde la terminal en esta carpeta:

```bash
npm start
```
o directamente con Node:
```bash
node server.js
```

Luego abre en tu navegador:
👉 **[http://localhost:3000](http://localhost:3000)**
