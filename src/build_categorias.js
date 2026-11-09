const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'assets', 'categorias_falabella.csv');
const raw = fs.readFileSync(csvPath, 'utf8');
const list = raw
  .split(/\r?\n/)
  .map(l => l.trim().replace(/^"|"$/g, '').trim())
  .filter(l => l && l.toLowerCase() !== 'categoria');
const unique = Array.from(new Set(list));

const content = `/**
 * Módulo de Autocompletado de Categorías Falabella Retail
 * Procesa dinámicamente assets/categorias_falabella.csv con respaldo integrado
 */

(function(root) {
  "use strict";

  // Catálogo base de categorías oficiales de Falabella (3.001 registros)
  let categoriasList = ${JSON.stringify(unique, null, 2)};

  // Normalizador para búsqueda insensible a mayúsculas y acentos
  function normalizeText(text) {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "");
  }

  // Reducción morfológica española (singular/plural) para emparejar ej. "afeitadora" <-> "afeitadoras"
  function stemWord(word) {
    if (!word || word.length < 4) return word;
    if (word.endsWith("iones") && word.length > 6) return word.slice(0, -3) + "n";
    if (word.endsWith("dores") && word.length > 6) return word.slice(0, -2);
    if (word.endsWith("doras") && word.length > 6) return word.slice(0, -1);
    if (word.endsWith("es") && word.length > 5 && !/[aeiou]es$/.test(word)) return word.slice(0, -2);
    if (word.endsWith("s") && word.length > 4) return word.slice(0, -1);
    return word;
  }

  // Distancia de edición de Levenshtein con cota máxima (tolerancia de 1 a 2 letras de error)
  function levenshteinDistance(a, b, maxDist = 3) {
    if (a === b) return 0;
    const lenA = a.length;
    const lenB = b.length;
    if (Math.abs(lenA - lenB) > maxDist) return 99;
    if (lenA === 0) return lenB <= maxDist ? lenB : 99;
    if (lenB === 0) return lenA <= maxDist ? lenA : 99;

    let prev = new Array(lenB + 1);
    let curr = new Array(lenB + 1);
    for (let j = 0; j <= lenB; j++) prev[j] = j;

    for (let i = 1; i <= lenA; i++) {
      curr[0] = i;
      let rowMin = curr[0];
      const charA = a.charCodeAt(i - 1);
      for (let j = 1; j <= lenB; j++) {
        const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
        const val = Math.min(
          prev[j] + 1,       // eliminación
          curr[j - 1] + 1,   // inserción
          prev[j - 1] + cost // sustitución
        );
        curr[j] = val;
        if (val < rowMin) rowMin = val;
      }
      if (rowMin > maxDist) return 99;
      const tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[lenB] <= maxDist ? prev[lenB] : 99;
  }

  const STOP_WORDS = new Set([
    "de", "del", "la", "el", "los", "las", "con", "para", "en", "por", "sin",
    "un", "una", "unos", "unas", "y", "e", "o", "u", "al", "a", "ante", "bajo",
    "color", "negro", "blanco", "gris", "azul", "rojo", "verde", "rosado", "rosa",
    "plateado", "dorado", "plata", "grafito", "beige", "cafe", "marron", "celeste",
    "pulgadas", "litros", "watts", "mah", "mm", "cm", "kg", "gr", "ml", "oz",
    "pack", "set", "kit", "pro", "max", "plus", "ultra", "mini", "nuevo", "nueva"
  ]);

  const ACCESSORY_PREFIXES = new Set([
    "repuesto", "repuestos", "accesorio", "accesorios", "funda", "fundas",
    "carcasa", "carcasas", "protector", "protectores", "soporte", "soportes",
    "adaptador", "adaptadores", "cable", "cables", "cargador", "cargadores",
    "filtro", "filtros", "bolsa", "bolsas", "estuche", "estuches"
  ]);

  // Carga asíncrona del archivo CSV si está disponible via HTTP/HTTPS
  async function loadCategoriesFromCSV() {
    try {
      if (typeof window !== "undefined" && window.location && window.location.protocol && window.location.protocol.startsWith("http")) {
        let res = await fetch("src/assets/categorias_falabella.csv", { cache: "no-cache" }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch("assets/categorias_falabella.csv", { cache: "no-cache" }).catch(() => null);
        }
        if (res && res.ok) {
          const text = await res.text();
          const lines = text.split(/\\r?\\n/)
            .map(l => l.trim().replace(/^"|"$/g, "").trim())
            .filter(l => l && l.toLowerCase() !== "categoria");
          if (lines.length > 0) {
            categoriasList = Array.from(new Set(lines));
            console.log("[CategoriasManager] Categorías cargadas dinámicamente desde CSV:", categoriasList.length);
          }
        }
      }
    } catch (err) {
      console.warn("[CategoriasManager] Usando catálogo base local:", err.message);
    }
  }

  // Algoritmo de puntuación y filtrado inteligente con tolerancia de 1-2 letras (Levenshtein)
  function searchCategories(query, maxResults = 10) {
    if (!query || typeof query !== "string") return [];
    const qClean = query.trim();
    if (!qClean) return [];

    const normQ = normalizeText(qClean);
    const stemQ = stemWord(normQ);
    const qWords = normQ.split(/[\\s,-]+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
    const results = [];

    for (let i = 0; i < categoriasList.length; i++) {
      const cat = categoriasList[i];
      const normCat = normalizeText(cat);

      let score = 0;
      if (normCat === normQ || stemWord(normCat) === stemQ) {
        score = 120;
      } else if (normCat.startsWith(normQ)) {
        score = 100 - Math.min(18, normCat.length - normQ.length);
      } else {
        const words = normCat.split(/[\\s,-]+/).filter(Boolean);
        let wordMatch = false;
        for (const w of words) {
          if (w.startsWith(normQ) || stemWord(w) === stemQ) {
            score = 80;
            wordMatch = true;
            break;
          }
        }
        if (!wordMatch && normCat.includes(normQ)) {
          score = 55;
        }
        // Tolerancia fuzzy de 1 a 2 letras si no hubo coincidencia exacta/subcadena
        if (score === 0 && normQ.length >= 4) {
          const maxTol = normQ.length >= 7 ? 2 : 1;
          for (const w of words) {
            if (w.length < 3 || STOP_WORDS.has(w)) continue;
            const dist = Math.min(
              levenshteinDistance(normQ, w, maxTol),
              levenshteinDistance(stemQ, stemWord(w), maxTol)
            );
            if (dist <= maxTol) {
              score = Math.max(score, 40 - dist * 10);
            }
          }
          if (score === 0 && qWords.length > 1) {
            let matchedWords = 0;
            for (const qw of qWords) {
              if (qw.length < 4) continue;
              const tol = qw.length >= 7 ? 2 : 1;
              const qwStem = stemWord(qw);
              if (words.some(cw => cw.length >= 3 && Math.min(levenshteinDistance(qw, cw, tol), levenshteinDistance(qwStem, stemWord(cw), tol)) <= tol)) {
                matchedWords++;
              }
            }
            if (matchedWords > 0) {
              score = 25 + matchedWords * 10;
            }
          }
        }
      }

      if (score > 0) {
        results.push({ category: cat, score, normCat });
      }
    }

    // Ordenar por relevancia
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.category.localeCompare(b.category, "es");
    });

    return results.slice(0, maxResults);
  }

  /**
   * Busca la mejor categoría oficial de Falabella a partir del título comercial del producto
   * utilizando extracción de palabras clave y tolerancia de error de 1 a 2 letras (Levenshtein).
   */
  function findBestCategoryFromTitle(title, brand = "") {
    if (!title || typeof title !== "string") return null;

    const normBrand = normalizeText(brand);
    const normTitle = normalizeText(title);

    // Extraer tokens significativos del título (descartando marca, códigos alfanuméricos con números y stopwords)
    const rawTokens = normTitle.split(/[^a-z0-9]+/).filter(Boolean);
    const titleWords = [];
    for (const tk of rawTokens) {
      if (tk.length < 3) continue;
      if (normBrand && (tk === normBrand || normBrand.split(/\\s+/).includes(tk))) continue;
      if (/\\d/.test(tk)) continue; // Descarta modelos/medidas como qp2724, 10, g614, 16gb, 55"
      if (STOP_WORDS.has(tk)) continue;
      titleWords.push(tk);
    }

    if (titleWords.length === 0) return null;

    // 1. Mapeo semántico prioritario con tolerancia de 1-2 letras para sustantivos de producto frecuentes
    // Ej: "Afeitadora Philips Qp2724/10 Oneblade" -> "Maquina de afeitar"
    const directAliases = [
      { roots: ["afeitadora", "rasuradora", "oneblade"], category: "Maquina de afeitar" },
      { roots: ["cortapelo", "cortapelos", "trimmer"], category: "Afeitadoras y Cortapelos" },
      { roots: ["depiladora"], category: "Depiladoras" },
      { roots: ["alisador", "alisadora"], category: "Alisadores de pelo" },
      { roots: ["ondulador", "rizador"], category: "Onduladores de pelo" },
      { roots: ["secador"], requireAlso: ["pelo", "cabello", "profesional", "ionico"], category: "Secadores de pelo" }
    ];

    const firstThreeWords = titleWords.slice(0, 4);
    for (const alias of directAliases) {
      if (alias.requireAlso && !alias.requireAlso.some(req => titleWords.includes(req))) {
        continue;
      }
      for (let idx = 0; idx < firstThreeWords.length; idx++) {
        const w = firstThreeWords[idx];
        const wStem = stemWord(w);
        for (const root of alias.roots) {
          const tol = root.length >= 7 ? 2 : 1;
          const dist = Math.min(
            levenshteinDistance(w, root, tol),
            levenshteinDistance(wStem, stemWord(root), tol)
          );
          if (dist <= tol) {
            return alias.category;
          }
        }
      }
    }

    const titleHasAccessoryWord = titleWords.some(w => ACCESSORY_PREFIXES.has(w) || ACCESSORY_PREFIXES.has(stemWord(w)));

    // 2. Búsqueda fuzzy contra los 3.001 registros de categoriasList con tolerancia de 1 a 2 letras
    const candidateWords = titleWords.slice(0, 5);
    let bestCategory = null;
    let bestScore = 0;

    for (let i = 0; i < categoriasList.length; i++) {
      const cat = categoriasList[i];
      const normCat = normalizeText(cat);
      const catTokens = normCat.split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
      if (catTokens.length === 0) continue;

      let catScore = 0;
      let matchedCatWords = 0;

      // Penalizar categorías de repuestos/accesorios si el producto principal no es un repuesto/accesorio
      const firstCatRaw = normCat.split(/[^a-z0-9]+/).filter(Boolean)[0] || "";
      if (!titleHasAccessoryWord && (ACCESSORY_PREFIXES.has(firstCatRaw) || ACCESSORY_PREFIXES.has(stemWord(firstCatRaw)))) {
        catScore -= 90;
      }

      for (let cwIdx = 0; cwIdx < catTokens.length; cwIdx++) {
        const cw = catTokens[cwIdx];
        const cwStem = stemWord(cw);
        let bestWordScore = 0;

        for (let twIdx = 0; twIdx < candidateWords.length; twIdx++) {
          const tw = candidateWords[twIdx];
          const twStem = stemWord(tw);
          // Mayor peso a la primera palabra del título (que en español suele ser el tipo de producto)
          const posWeight = twIdx === 0 ? 1.35 : (twIdx === 1 ? 1.15 : 0.9);

          if (tw === cw || twStem === cwStem) {
            bestWordScore = Math.max(bestWordScore, 90 * posWeight);
          } else if (tw.length >= 5 && cw.length >= 5) {
            const maxTol = Math.min(tw.length, cw.length) >= 7 ? 2 : 1;
            const dist = Math.min(
              levenshteinDistance(tw, cw, maxTol),
              levenshteinDistance(twStem, cwStem, maxTol)
            );
            if (dist <= maxTol && dist === 1) {
              bestWordScore = Math.max(bestWordScore, 76 * posWeight);
            } else if (dist <= maxTol && dist === 2) {
              bestWordScore = Math.max(bestWordScore, 62 * posWeight);
            } else if (twStem.slice(0, 6) === cwStem.slice(0, 6) && twStem.length >= 6 && cwStem.length >= 6) {
              // Misma raíz léxica de 6+ caracteres (ej. "afeitad" en "afeitadora" vs "afeitado")
              bestWordScore = Math.max(bestWordScore, 65 * posWeight);
            }
          }
        }

        if (bestWordScore > 0) {
          matchedCatWords++;
          catScore += bestWordScore;
          if (cwIdx === 0) catScore += 18; // Bonificación si coincide la palabra principal de la categoría
        }
      }

      if (matchedCatWords > 0) {
        // Preferir categorías específicas y concisas sin palabras extra no relacionadas
        const unmatchedCatWords = catTokens.length - matchedCatWords;
        catScore -= unmatchedCatWords * 12;

        if (catScore > bestScore) {
          bestScore = catScore;
          bestCategory = cat;
        }
      }
    }

    return bestScore >= 75 ? bestCategory : null;
  }

  // Resaltado seguro de caracteres coincidentes
  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const normQ = normalizeText(query);
    const normText = normalizeText(text);
    const idx = normText.indexOf(normQ);

    if (idx === -1) {
      return escapeHtml(text);
    }

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);

    return escapeHtml(before) + "<mark class=\\"cat-highlight\\">" + escapeHtml(match) + "</mark>" + escapeHtml(after);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Controlador del componente Autocomplete en el DOM
  class CategoriaAutocomplete {
    constructor(inputEl, dropdownEl, countBadgeEl, clearBtnEl) {
      this.input = inputEl;
      this.dropdown = dropdownEl;
      this.countBadge = countBadgeEl;
      this.clearBtn = clearBtnEl;
      this.currentIndex = -1;
      this.currentResults = [];
      this.isOpen = false;

      this.init();
    }

    async init() {
      if (!this.input || !this.dropdown) return;
      await loadCategoriesFromCSV();
      this.updateBadge();
      this.updateClearButton();
      this.bindEvents();
    }

    updateBadge() {
      if (this.countBadge) {
        this.countBadge.textContent = categoriasList.length.toLocaleString("es-CL");
        this.countBadge.title = categoriasList.length.toLocaleString("es-CL") + " categorías de Falabella cargadas";
      }
    }

    updateClearButton() {
      if (!this.clearBtn) return;
      if (this.input.value && this.input.value.trim().length > 0) {
        this.clearBtn.classList.remove("hidden");
      } else {
        this.clearBtn.classList.add("hidden");
      }
    }

    bindEvents() {
      // Evento de entrada de texto
      this.input.addEventListener("input", (e) => {
        this.updateClearButton();
        this.onQuery(e.target.value);
      });

      // Foco y click para abrir sugerencias
      this.input.addEventListener("focus", () => {
        this.updateClearButton();
        if (this.input.value && this.input.value.trim().length >= 1) {
          this.onQuery(this.input.value);
        }
      });

      // Botón limpiar
      if (this.clearBtn) {
        this.clearBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.input.value = "";
          this.updateClearButton();
          this.input.dispatchEvent(new Event("input", { bubbles: true }));
          this.input.focus();
          this.close();
        });
      }

      // Navegación por teclado
      this.input.addEventListener("keydown", (e) => {
        if (!this.isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          if (this.input.value.trim()) {
            this.onQuery(this.input.value);
            e.preventDefault();
            return;
          }
        }

        if (!this.isOpen) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.moveActive(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          this.moveActive(-1);
        } else if (e.key === "Enter") {
          if (this.currentIndex >= 0 && this.currentIndex < this.currentResults.length) {
            e.preventDefault();
            this.selectCategory(this.currentResults[this.currentIndex].category);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.close();
        } else if (e.key === "Tab") {
          this.close();
        }
      });

      // Cerrar al clickear afuera
      document.addEventListener("pointerdown", (e) => {
        if (!this.input.contains(e.target) && !this.dropdown.contains(e.target) && (!this.clearBtn || !this.clearBtn.contains(e.target))) {
          this.close();
        }
      });
    }

    onQuery(query) {
      const q = (query || "").trim();
      if (!q) {
        this.close();
        return;
      }

      const results = searchCategories(q, 10);
      this.currentResults = results;
      this.currentIndex = -1;

      if (results.length === 0) {
        this.renderEmpty(q);
      } else {
        this.renderResults(results, q);
      }
      this.open();
    }

    renderResults(results, query) {
      let html = '<div class="cat-list" role="listbox">';
      results.forEach((item, index) => {
        const highlighted = highlightMatch(item.category, query);
        html += \`
          <div class="cat-item" data-index="\${index}" role="option" aria-selected="false">
            <span class="cat-item-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </span>
            <span class="cat-item-text">\${highlighted}</span>
          </div>\`;
      });
      html += '</div>';

      html += \`
        <div class="cat-dropdown-footer">
          <span>\${results.length} sugerencias</span>
          <span class="cat-footer-hint">↑ ↓ para navegar • Enter para elegir</span>
        </div>\`;

      this.dropdown.innerHTML = html;

      // Eventos mouse / pointer
      const items = this.dropdown.querySelectorAll(".cat-item");
      items.forEach(el => {
        el.addEventListener("mouseenter", () => {
          const idx = parseInt(el.getAttribute("data-index"), 10);
          this.setActiveIndex(idx);
        });

        el.addEventListener("pointerdown", (e) => {
          e.preventDefault(); // Previene blur del input
          const idx = parseInt(el.getAttribute("data-index"), 10);
          if (this.currentResults[idx]) {
            this.selectCategory(this.currentResults[idx].category);
          }
        });
      });
    }

    renderEmpty(query) {
      this.dropdown.innerHTML = \`
        <div class="cat-empty-state">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p>Sin coincidencias para "<strong>\${escapeHtml(query)}</strong>"</p>
          <small>Puedes ingresar cualquier categoría libremente</small>
        </div>\`;
    }

    moveActive(delta) {
      if (this.currentResults.length === 0) return;
      let newIdx = this.currentIndex + delta;
      if (newIdx < 0) newIdx = this.currentResults.length - 1;
      if (newIdx >= this.currentResults.length) newIdx = 0;
      this.setActiveIndex(newIdx);
    }

    setActiveIndex(index) {
      this.currentIndex = index;
      const items = this.dropdown.querySelectorAll(".cat-item");
      items.forEach((item, idx) => {
        if (idx === index) {
          item.classList.add("is-active");
          item.setAttribute("aria-selected", "true");
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.classList.remove("is-active");
          item.setAttribute("aria-selected", "false");
        }
      });
    }

    selectCategory(category) {
      this.input.value = category;
      this.updateClearButton();
      // Disparar evento input para sincronizar state.categoria y redibujar cartel en vivo
      this.input.dispatchEvent(new Event("input", { bubbles: true }));
      this.close();
      this.input.focus();
    }

    open() {
      this.dropdown.classList.remove("hidden");
      this.isOpen = true;
    }

    close() {
      this.dropdown.classList.add("hidden");
      this.currentIndex = -1;
      this.isOpen = false;
    }
  }

  const api = {
    getCategorias: () => [...categoriasList],
    search: searchCategories,
    findBestCategoryFromTitle: findBestCategoryFromTitle,
    levenshteinDistance: levenshteinDistance,
    normalizeText: normalizeText,
    initAutocomplete: (inputEl, dropdownEl, countBadgeEl, clearBtnEl) => {
      return new CategoriaAutocomplete(inputEl, dropdownEl, countBadgeEl, clearBtnEl);
    }
  };

  if (root) {
    root.CategoriasManager = api;
  }
  if (typeof window !== "undefined") {
    window.CategoriasManager = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
`;

const targetPath = path.join(__dirname, 'js', 'categorias.js');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Generado js/categorias.js con', unique.length, 'categorías.');
