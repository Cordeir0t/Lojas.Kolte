// CATÁLOGO LOJAS KOLTE - JS COMPLETO COM CMS
// Funcionalidades: pesquisa, filtros múltiplos, chips rápidos, ordenação, contagem, filtros ativos + CMS JSON

class CatalogoCMS {
  constructor() {
    this.produtos = [];
    this.cards = [];
    this.currentFilters = new Set();
    this.searchTerm = '';
    this.currentSort = 'relevancia';
    
    this.searchInput = null;
    this.productGrid = null;
    this.resultsCount = null;
    this.activeFilters = null;
    this.sortSelect = null;
    this.clearFiltersBtn = null;
    this.quickTags = null;
    this.filterCheckboxes = null;
    this.emptyState = null;

    this.init();
  }

  async init() {
    await this.loadData();
    
    // Cache elementos DOM
    this.searchInput = document.getElementById('searchInput');
    this.productGrid = document.getElementById('productGrid');
    this.resultsCount = document.getElementById('resultsCount');
    this.activeFilters = document.getElementById('activeFilters');
    this.sortSelect = document.getElementById('sortSelect');
    this.clearFiltersBtn = document.getElementById('clearFilters');
    this.quickTags = document.querySelectorAll('.quick-tag');
    this.filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    this.emptyState = document.getElementById('emptyState');

    // Eventos
    if (this.searchInput) this.searchInput.addEventListener('input', debounce(this.handleSearch.bind(this), 300));
    if (this.filterCheckboxes.length) {
      this.filterCheckboxes.forEach(cb => cb.addEventListener('change', this.handleFilterChange.bind(this)));
    }
    if (this.quickTags.length) {
      this.quickTags.forEach(tag => tag.addEventListener('click', this.handleQuickTag.bind(this)));
    }
    if (this.sortSelect) this.sortSelect.addEventListener('change', this.handleSort.bind(this));
    if (this.clearFiltersBtn) this.clearFiltersBtn.addEventListener('click', this.clearAllFilters.bind(this));

    // Inicial
    this.renderProdutos();
    this.updateResults();
    this.attachKeyboardNavigation();
  }

  async loadData() {
    try {
      const response = await fetch('/data/produtos.json');
      if (response.ok) {
        this.produtos = await response.json();
      } else {
        // Fallback se não existir
        this.produtos = [];
      }
    } catch (error) {
      console.warn('Não foi possível carregar produtos.json:', error);
      this.produtos = [];
    }
  }

  renderProdutos() {
    this.productGrid.innerHTML = '';
    
    this.produtos.forEach(produto => {
      const card = this.createProductCard(produto);
      this.productGrid.appendChild(card);
    });

    this.cards = document.querySelectorAll('.product-card');
  }

  createProductCard(produto) {
    const card = document.createElement('article');
    card.className = 'product-card';
    
    // Data attributes para filtros
    card.dataset.name = produto.nome.toLowerCase();
    card.dataset.category = produto.categoria;
    card.dataset.status = produto.status || 'sob-encomenda';
    card.dataset.personalizacao = produto.personalizacao || '';
    card.dataset.estilo = produto.estilo || '';
    card.dataset.keywords = (produto.keywords || '').toLowerCase();

    // Badges
    const badges = [];
    if (produto.status === 'promocao') badges.push('promo');
    if (produto.status === 'pronta-entrega') badges.push('ready');
    if (produto['bordado-alta']) badges.push('trend');

    card.innerHTML = `
      <div class="product-badges">
        ${badges.map(b => `<span class="badge ${b}">${b === 'promo' ? 'Promoção' : b === 'ready' ? 'Pronta entrega' : 'Em alta'}</span>`).join('')}
      </div>
      <div class="product-image">
        <img src="/img/${produto.imagem}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="product-content">
        <p class="product-category">${this.getCategoryLabel(produto.categoria)}</p>
        <h3>${produto.nome}</h3>
        ${produto.preco ? `<div class="product-price">${produto.preco}</div>` : ''}
        <p>${produto.descricao}</p>
        <div class="product-actions">
          <a href="${produto.whatsapp}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
        </div>
      </div>
    `;
    
    return card;
  }

  getCategoryLabel(categoria) {
    const labels = {
      canecas: 'Canecas',
      bebê: 'Bebê',
      toalhas: 'Toalhas',
      casa: 'Casa e presente',
      lavabo: 'Lavabo'
    };
    return labels[categoria] || categoria;
  }

  // === MÉTODOS DE FILTRO (iguais ao anterior) ===
  handleSearch(e) {
    this.searchTerm = e.target.value.toLowerCase().trim();
    this.updateResults();
  }

  handleFilterChange(e) {
    const value = e.target.value;
    const group = e.target.dataset.group;

    if (e.target.checked) {
      this.currentFilters.add(`${group}:${value}`);
    } else {
      this.currentFilters.delete(`${group}:${value}`);
    }

    this.updateActiveFiltersDisplay();
    this.updateResults();
  }

  handleQuickTag(e) {
    const tag = e.currentTarget;
    const value = tag.dataset.filterTag;

    if (tag.classList.contains('active')) {
      tag.classList.remove('active');
      this.currentFilters.delete(`quick:${value}`);
    } else {
      document.querySelectorAll('.quick-tag.active').forEach(active => active.classList.remove('active'));
      tag.classList.add('active');
      this.currentFilters = new Set(['quick:' + value]);
      this.clearCheckboxes();
    }

    this.updateActiveFiltersDisplay();
    this.updateResults();
  }

  handleSort(e) {
    this.currentSort = e.target.value;
    this.sortResults();
  }

  clearAllFilters() {
    this.currentFilters.clear();
    this.searchTerm = '';
    if (this.searchInput) this.searchInput.value = '';
    document.querySelector('.quick-tag.active')?.classList.remove('active');
    this.clearCheckboxes();
    if (this.sortSelect) this.sortSelect.value = 'relevancia';
    this.updateActiveFiltersDisplay();
    this.updateResults();
  }

  clearCheckboxes() {
    if (this.filterCheckboxes) {
      this.filterCheckboxes.forEach(cb => cb.checked = false);
    }
  }

  updateActiveFiltersDisplay() {
    if (!this.activeFilters) return;
    
    this.activeFilters.innerHTML = '';

    const quickFilters = Array.from(this.currentFilters).filter(f => f.startsWith('quick:'));
    quickFilters.forEach(filter => {
      const tagName = filter.split(':')[1];
      const tagElement = this.createFilterTag(tagName, () => {
        this.currentFilters.delete(filter);
        document.querySelector(`[data-filter-tag="${tagName}"]`)?.classList.remove('active');
        this.updateActiveFiltersDisplay();
        this.updateResults();
      });
      this.activeFilters.appendChild(tagElement);
    });

    const checkboxFilters = Array.from(this.currentFilters).filter(f => !f.startsWith('quick:'));
    checkboxFilters.forEach(filter => {
      const [group, value] = filter.split(':');
      const label = this.getFilterLabel(group, value);
      const tagElement = this.createFilterTag(label, () => {
        this.currentFilters.delete(filter);
        const checkbox = document.querySelector(`[value="${value}"][data-group="${group}"]`);
        if (checkbox) checkbox.checked = false;
        this.updateActiveFiltersDisplay();
        this.updateResults();
      });
      this.activeFilters.appendChild(tagElement);
    });
  }

  getFilterLabel(group, value) {
    const labels = {
      categoria: { canecas: 'Canecas', bebê: 'Bebê', toalhas: 'Toalhas', casa: 'Casa', lavabo: 'Lavabo' },
      status: { promocao: 'Promoção', 'pronta-entrega': 'Pronta entrega', 'sob-encomenda': 'Sob encomenda' },
      personalizacao: { estampa: 'Estampa', bordado: 'Bordado', nome: 'Nome', monograma: 'Monograma' },
      estilo: { floral: 'Floral', minimalista: 'Minimalista', classico: 'Clássico', lacinho: 'Lacinho' }
    };
    return labels[group]?.[value] || value;
  }

  createFilterTag(label, onRemove) {
    const tag = document.createElement('span');
    tag.className = 'filter-tag';
    tag.innerHTML = `
      <span class="tag-label">${label}</span>
      <button class="tag-remove" type="button" aria-label="Remover filtro ${label}">×</button>
    `;
    
    const removeBtn = tag.querySelector('.tag-remove');
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      tag.remove();
      if (typeof onRemove === 'function') {
        onRemove();
      }
    });
    
    return tag;
  }

  updateResults() {
    const visibleCards = [];

    this.cards.forEach(card => {
      let matches = true;

      // Filtro por busca
      if (this.searchTerm) {
        const name = card.dataset.name;
        const category = card.dataset.category;
        const keywords = card.dataset.keywords;
        const searchMatch = name.includes(this.searchTerm) || category.includes(this.searchTerm) || keywords.includes(this.searchTerm);
        if (!searchMatch) matches = false;
      }

      // Filtros por checkboxes e quick tags
      if (this.currentFilters.size > 0) {
        const cardFilters = {
          categoria: card.dataset.category,
          status: card.dataset.status,
          personalizacao: card.dataset.personalizacao,
          estilo: card.dataset.estilo
        };

        let hasMatchingFilter = false;
        for (const filter of this.currentFilters) {
          if (filter.startsWith('quick:')) {
            continue;
          }
          const [group, value] = filter.split(':');
          if (cardFilters[group] && cardFilters[group].includes(value)) {
            hasMatchingFilter = true;
            break;
          }
        }

        if (!hasMatchingFilter) matches = false;
      }

      card.style.display = matches ? 'block' : 'none';
      if (matches) visibleCards.push(card);
    });

    this.sortResults();
    this.updateResultsCount(visibleCards.length);
    this.showEmptyState(visibleCards.length === 0);
  }

  updateResultsCount(count) {
    if (this.resultsCount) {
      this.resultsCount.textContent = `${count} produto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
  }

  showEmptyState(show) {
    if (this.emptyState) {
      this.emptyState.style.display = show ? 'block' : 'none';
    }
  }

  sortResults() {
    const visibleCards = Array.from(this.cards).filter(card => card.style.display !== 'none');

    visibleCards.sort((a, b) => {
      switch (this.currentSort) {
        case 'nome-asc':
          return a.dataset.name.localeCompare(b.dataset.name, 'pt-BR');
        case 'nome-desc':
          return b.dataset.name.localeCompare(a.dataset.name, 'pt-BR');
        case 'categoria':
          return a.dataset.category.localeCompare(b.dataset.category, 'pt-BR');
        default: // relevancia
          return 0;
      }
    });

    visibleCards.forEach(card => {
      this.productGrid.appendChild(card);
    });
  }

  attachKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.searchInput) {
          this.searchInput.focus();
        }
      }
    });
  }
}