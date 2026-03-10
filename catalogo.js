class CatalogoCMS {
  constructor() {
    this.produtos = [];
    this.cards = [];
    this.currentFilters = new Set();
    this.searchTerm = '';
    this.currentSort = 'relevancia';

    this.searchInput = document.getElementById('searchInput');
    this.productGrid = document.getElementById('productGrid');
    this.resultsCount = document.getElementById('resultsCount');
    this.activeFilters = document.getElementById('activeFilters');
    this.sortSelect = document.getElementById('sortSelect');
    this.clearFiltersBtn = document.getElementById('clearFilters');
    this.quickTags = document.querySelectorAll('.quick-tag');
    this.filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    this.emptyState = document.getElementById('emptyState');

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.renderProdutos();
    this.updateResults();
  }

  async loadData() {
    try {
      const response = await fetch('./data/produtos.json');
      if (!response.ok) throw new Error('Erro ao carregar produtos.json');
      this.produtos = await response.json();
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      this.produtos = [];
    }
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.updateResults();
      });
    }

    if (this.filterCheckboxes.length) {
      this.filterCheckboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
          const value = e.target.value;
          const group = e.target.dataset.group;

          if (e.target.checked) {
            this.currentFilters.add(`${group}:${value}`);
          } else {
            this.currentFilters.delete(`${group}:${value}`);
          }

          this.updateActiveFiltersDisplay();
          this.updateResults();
        });
      });
    }

    if (this.quickTags.length) {
      this.quickTags.forEach(tag => {
        tag.addEventListener('click', () => {
          const value = tag.dataset.filterTag;

          if (tag.classList.contains('active')) {
            tag.classList.remove('active');
            this.currentFilters.delete(`quick:${value}`);
          } else {
            this.quickTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            Array.from(this.currentFilters)
              .filter(f => f.startsWith('quick:'))
              .forEach(f => this.currentFilters.delete(f));

            this.currentFilters.add(`quick:${value}`);
          }

          this.updateActiveFiltersDisplay();
          this.updateResults();
        });
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.updateResults();
      });
    }

    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => {
        this.currentFilters.clear();
        this.searchTerm = '';

        if (this.searchInput) this.searchInput.value = '';
        if (this.sortSelect) this.sortSelect.value = 'relevancia';

        this.quickTags.forEach(tag => tag.classList.remove('active'));
        this.filterCheckboxes.forEach(cb => cb.checked = false);

        this.updateActiveFiltersDisplay();
        this.updateResults();
      });
    }
  }

  renderProdutos() {
    if (!this.productGrid) return;

    this.productGrid.innerHTML = '';

    this.produtos.forEach(produto => {
      const card = this.createProductCard(produto);
      this.productGrid.appendChild(card);
    });

    this.cards = Array.from(document.querySelectorAll('.product-card'));
  }

  createProductCard(produto) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const categoria = (produto.categoria || '').toLowerCase();
    const status = (produto.status || '').toLowerCase();
    const personalizacao = (produto.personalizacao || '').toLowerCase();
    const estilo = (produto.estilo || '').toLowerCase();
    const keywords = (produto.keywords || '').toLowerCase();
    const nome = (produto.nome || '').toLowerCase();

    card.dataset.name = nome;
    card.dataset.category = categoria;
    card.dataset.status = status;
    card.dataset.personalizacao = personalizacao;
    card.dataset.estilo = estilo;
    card.dataset.keywords = keywords;

    const badges = [];
    if (status.includes('promocao')) badges.push('<span class="badge promo">Promoção</span>');
    if (status.includes('pronta-entrega')) badges.push('<span class="badge ready">Pronta entrega</span>');
    if (produto['bordado-alta']) badges.push('<span class="badge trend">Em alta</span>');

    card.innerHTML = `
      <div class="product-badges">
        ${badges.join('')}
      </div>

      <div class="product-image">
        <img src="./img/${produto.imagem}" alt="${produto.nome}" loading="lazy">
      </div>

      <div class="product-content">
        <p class="product-category">${this.getCategoryLabel(produto.categoria)}</p>
        <h3>${produto.nome || ''}</h3>
        ${produto.preco ? `<div class="product-price">${produto.preco}</div>` : ''}
        <p>${produto.descricao || ''}</p>

        <div class="product-actions">
          <a href="${produto.whatsapp || '#'}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
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
      bebe: 'Bebê',
      toalhas: 'Toalhas',
      casa: 'Casa e presente',
      lavabo: 'Lavabo'
    };

    return labels[(categoria || '').toLowerCase()] || categoria || '';
  }

  updateResults() {
    if (!this.cards.length) return;

    let visibleCards = this.cards.filter(card => this.matchesCard(card));

    visibleCards = this.sortCards(visibleCards);

    this.cards.forEach(card => {
      card.style.display = 'none';
    });

    visibleCards.forEach(card => {
      card.style.display = 'block';
      this.productGrid.appendChild(card);
    });

    this.updateResultsCount(visibleCards.length);
    this.toggleEmptyState(visibleCards.length === 0);
  }

  matchesCard(card) {
    const name = card.dataset.name || '';
    const category = card.dataset.category || '';
    const status = card.dataset.status || '';
    const personalizacao = card.dataset.personalizacao || '';
    const estilo = card.dataset.estilo || '';
    const keywords = card.dataset.keywords || '';

    if (this.searchTerm) {
      const haystack = `${name} ${category} ${status} ${personalizacao} ${estilo} ${keywords}`;
      if (!haystack.includes(this.searchTerm)) {
        return false;
      }
    }

    const normalFilters = Array.from(this.currentFilters).filter(f => !f.startsWith('quick:'));
    const quickFilters = Array.from(this.currentFilters).filter(f => f.startsWith('quick:'));

    for (const filter of normalFilters) {
      const [group, value] = filter.split(':');

      if (group === 'categoria' && !category.includes(value)) return false;
      if (group === 'status' && !status.includes(value)) return false;
      if (group === 'personalizacao' && !personalizacao.includes(value)) return false;
      if (group === 'estilo' && !estilo.includes(value)) return false;
    }

    for (const quick of quickFilters) {
      const value = quick.replace('quick:', '');

      if (value === 'todos') {
        continue;
      }

      if (value === 'promocao' && !status.includes('promocao')) return false;
      if (value === 'pronta-entrega' && !status.includes('pronta-entrega')) return false;
      if (value === 'bordados' && !estilo && !personalizacao.includes('bordado')) return false;
      if (value === 'bebê' && !category.includes('bebê') && !category.includes('bebe')) return false;
      if (value === 'canecas' && !category.includes('canecas')) return false;
    }

    return true;
  }

  sortCards(cards) {
    const sorted = [...cards];

    switch (this.currentSort) {
      case 'nome':
      case 'nome-asc':
        sorted.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || '', 'pt-BR'));
        break;

      case 'nome-desc':
        sorted.sort((a, b) => (b.dataset.name || '').localeCompare(a.dataset.name || '', 'pt-BR'));
        break;

      case 'status':
        sorted.sort((a, b) => {
          const getWeight = (status) => {
            if ((status || '').includes('pronta-entrega')) return 1;
            if ((status || '').includes('promocao')) return 2;
            return 3;
          };
          return getWeight(a.dataset.status) - getWeight(b.dataset.status);
        });
        break;

      case 'categoria':
        sorted.sort((a, b) => (a.dataset.category || '').localeCompare(b.dataset.category || '', 'pt-BR'));
        break;

      default:
        break;
    }

    return sorted;
  }

  updateResultsCount(count) {
    if (this.resultsCount) {
      this.resultsCount.textContent = `${count} produto${count !== 1 ? 's' : ''}`;
    }
  }

  toggleEmptyState(show) {
    if (this.emptyState) {
      this.emptyState.style.display = show ? 'block' : 'none';
    }
  }

  updateActiveFiltersDisplay() {
    if (!this.activeFilters) return;

    this.activeFilters.innerHTML = '';

    this.currentFilters.forEach(filter => {
      const label = filter.startsWith('quick:')
        ? filter.replace('quick:', '')
        : this.getReadableFilter(filter);

      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.innerHTML = `
        <span class="tag-label">${label}</span>
        <button class="tag-remove" type="button" aria-label="Remover filtro ${label}">×</button>
      `;

      tag.querySelector('.tag-remove').addEventListener('click', () => {
        this.currentFilters.delete(filter);

        if (filter.startsWith('quick:')) {
          const quickValue = filter.replace('quick:', '');
          const quickBtn = document.querySelector(`[data-filter-tag="${quickValue}"]`);
          if (quickBtn) quickBtn.classList.remove('active');
        } else {
          const [group, value] = filter.split(':');
          const checkbox = document.querySelector(`[data-group="${group}"][value="${value}"]`);
          if (checkbox) checkbox.checked = false;
        }

        this.updateActiveFiltersDisplay();
        this.updateResults();
      });

      this.activeFilters.appendChild(tag);
    });
  }

  getReadableFilter(filter) {
    const [group, value] = filter.split(':');

    const labels = {
      categoria: {
        canecas: 'Canecas',
        bebê: 'Bebê',
        bebe: 'Bebê',
        toalhas: 'Toalhas',
        casa: 'Casa',
        lavabo: 'Lavabo'
      },
      status: {
        promocao: 'Promoção',
        'pronta-entrega': 'Pronta entrega',
        'sob-encomenda': 'Sob encomenda'
      },
      personalizacao: {
        estampa: 'Estampa',
        bordado: 'Bordado',
        nome: 'Nome',
        monograma: 'Monograma'
      },
      estilo: {
        floral: 'Floral',
        minimalista: 'Minimalista',
        classico: 'Clássico',
        lacinho: 'Lacinho'
      }
    };

    return labels[group]?.[value] || value;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CatalogoCMS();
});
