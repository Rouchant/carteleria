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

(function(window) {
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

  // Carga asíncrona del archivo CSV si está disponible via HTTP/HTTPS
  async function loadCategoriesFromCSV() {
    try {
      if (window.location && window.location.protocol.startsWith("http")) {
        const res = await fetch("assets/categorias_falabella.csv", { cache: "no-cache" });
        if (res.ok) {
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

  // Algoritmo de puntuación y filtrado inteligente
  function searchCategories(query, maxResults = 10) {
    if (!query || typeof query !== "string") return [];
    const qClean = query.trim();
    if (!qClean) return [];

    const normQ = normalizeText(qClean);
    const results = [];

    for (let i = 0; i < categoriasList.length; i++) {
      const cat = categoriasList[i];
      const normCat = normalizeText(cat);

      let score = 0;
      if (normCat.startsWith(normQ)) {
        score = 100 - (normCat.length - normQ.length);
      } else {
        const words = normCat.split(/[\\s,-]+/);
        let wordMatch = false;
        for (const w of words) {
          if (w.startsWith(normQ)) {
            score = 80;
            wordMatch = true;
            break;
          }
        }
        if (!wordMatch && normCat.includes(normQ)) {
          score = 50;
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

  // Exportar al objeto global
  window.CategoriasManager = {
    getCategorias: () => [...categoriasList],
    search: searchCategories,
    initAutocomplete: (inputEl, dropdownEl, countBadgeEl, clearBtnEl) => {
      return new CategoriaAutocomplete(inputEl, dropdownEl, countBadgeEl, clearBtnEl);
    }
  };

})(window);
`;

const targetPath = path.join(__dirname, 'js', 'categorias.js');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Generado js/categorias.js con', unique.length, 'categorías.');
