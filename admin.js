// ADMIN DASHBOARD - LOJAS KOLTE

// ============================================
// CONFIGURAÇÕES
// ============================================
const ADMIN_CREDENTIALS = {
  email: 'admin@lojaskolte.com.br',
  password: 'kolte2025'
};

const IMGBB_API_KEY = '41f3f9818a7d6270ffb8ba045c50a790';

// ============================================
// ESTADO
// ============================================
let produtos = [];
let deleteIndex = -1;
let uploadedImageUrl = '';

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  bindLogin();
  bindSidebar();
  bindProductForm();
  bindUpload();
  bindSearch();
  bindDeleteModal();
});

// ============================================
// AUTH
// ============================================
function checkAuth() {
  if (sessionStorage.getItem('lk-admin') === 'true') {
    showDashboard();
  }
}

function bindLogin() {
  const form = document.getElementById('loginForm');
  const togglePass = document.querySelector('.toggle-pass');

  togglePass?.addEventListener('click', () => {
    const input = document.getElementById('loginPassword');
    const icon = togglePass.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const error = document.getElementById('loginError');

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('lk-admin', 'true');
      error.classList.add('hidden');
      showDashboard();
    } else {
      error.classList.remove('hidden');
      document.getElementById('loginPassword').value = '';
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('lk-admin');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
  });
}

function showDashboard() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');

  const email = document.getElementById('loginEmail')?.value || '';
  const loggedUser = document.getElementById('loggedUser');
  if (loggedUser && email) loggedUser.textContent = email.split('@')[0];

  loadProdutos();
  renderSection('produtos');
}

// ============================================
// SIDEBAR
// ============================================
function bindSidebar() {
  const navItems = document.querySelectorAll('.nav-item[data-section]');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (!section) return;

      renderSection(section);
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      sidebar.classList.remove('sidebar--open');
    });
  });

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--open');
  });

  document.addEventListener('click', (e) => {
    if (sidebar && !sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
      sidebar.classList.remove('sidebar--open');
    }
  });
}

function renderSection(sectionName) {
  document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${sectionName}`)?.classList.remove('hidden');

  const titles = { produtos: 'Produtos', 'novo-produto': 'Novo Produto' };
  const topbarTitle = document.getElementById('topbarTitle');
  if (topbarTitle) topbarTitle.textContent = titles[sectionName] || sectionName;

  if (sectionName === 'produtos') {
    renderTable(produtos);
    updateStats();
  }

  if (sectionName === 'novo-produto') {
    resetForm();
  }
}

// ============================================
// LOCALSTORAGE
// ============================================
function loadProdutos() {
  try {
    const saved = localStorage.getItem('lk-produtos');
    produtos = saved ? JSON.parse(saved) : getDefaultProdutos();
  } catch {
    produtos = getDefaultProdutos();
  }
  if (!localStorage.getItem('lk-produtos')) saveProdutos();
}

function saveProdutos() {
  localStorage.setItem('lk-produtos', JSON.stringify(produtos));
}

function getDefaultProdutos() {
  return [
    {
      nome: 'Caneca de Cerâmica Personalizada',
      categoria: 'canecas',
      status: 'pronta-entrega',
      preco: 'R$ 35,00',
      descricao: 'Caneca de cerâmica com estampa personalizada. Ideal para presente.',
      imagem: 'https://via.placeholder.com/420x320/f4c2c2/ffffff?text=Caneca+Cerâmica',
      whatsapp: 'https://wa.me/5524992271334?text=Olá,%20quero%20a%20Caneca%20de%20Cerâmica',
      personalizacao: 'estampa nome',
      estilo: 'classico',
      keywords: 'caneca cerâmica estampa presente',
      'bordado-alta': false
    },
    {
      nome: 'Bolsa de Bebê Floral',
      categoria: 'bebê',
      status: 'promocao',
      preco: 'R$ 85,00',
      descricao: 'Bolsa de bebê com bordado floral delicado para maternidade.',
      imagem: 'https://via.placeholder.com/420x320/a0e7e5/ffffff?text=Bolsa+Bebê',
      whatsapp: 'https://wa.me/5524992271334?text=Olá,%20quero%20a%20Bolsa%20de%20Bebê',
      personalizacao: 'bordado nome',
      estilo: 'floral',
      keywords: 'bolsa bebê floral bordado maternidade',
      'bordado-alta': true
    }
  ];
}

// ============================================
// UPLOAD IMGBB
// ============================================
function bindUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('pImagemFile');

  uploadArea?.addEventListener('click', () => fileInput?.click());

  uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea?.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  });
}

async function handleUpload(file) {
  if (file.size > 10 * 1024 * 1024) {
    showToast('Imagem muito grande! Máx. 10MB.');
    return;
  }

  const progress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const uploadStatus = document.getElementById('uploadStatus');
  const placeholder = document.getElementById('uploadPlaceholder');
  const preview = document.getElementById('imagePreview');

  progress?.classList.remove('hidden');
  placeholder?.classList.add('hidden');
  uploadStatus.textContent = 'Enviando...';

  // Animação barra
  let width = 0;
  const interval = setInterval(() => {
    width = Math.min(width + 8, 85);
    if (progressFill) progressFill.style.width = width + '%';
  }, 150);

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    clearInterval(interval);

    if (data.success) {
      uploadedImageUrl = data.data.url;
      document.getElementById('pImagemUrl').value = uploadedImageUrl;

      if (progressFill) progressFill.style.width = '100%';
      uploadStatus.textContent = '✅ Upload concluído!';

      if (preview) {
        preview.classList.remove('hidden');
        preview.innerHTML = `
          <img src="${uploadedImageUrl}" alt="Preview">
          <div class="preview-info">
            <i class="fas fa-check-circle"></i>
            <span>${file.name} (${Math.round(file.size / 1024)}KB)</span>
            <button type="button" class="btn-change-img" id="btnChangeImg">
              <i class="fas fa-redo"></i> Trocar foto
            </button>
          </div>
        `;
        document.getElementById('btnChangeImg')?.addEventListener('click', () => {
          preview.classList.add('hidden');
          placeholder?.classList.remove('hidden');
          progress?.classList.add('hidden');
          uploadedImageUrl = '';
          document.getElementById('pImagemUrl').value = '';
          document.getElementById('pImagemFile').value = '';
        });
      }

      setTimeout(() => progress?.classList.add('hidden'), 1500);
    } else {
      throw new Error(data.error?.message || 'Upload falhou');
    }
  } catch (error) {
    clearInterval(interval);
    if (progressFill) progressFill.style.width = '0%';
    uploadStatus.textContent = '❌ Erro: ' + error.message;
    placeholder?.classList.remove('hidden');
    showToast('Erro no upload: ' + error.message);
  }
}

// ============================================
// TABELA
// ============================================
function renderTable(lista) {
  const tbody = document.getElementById('productsTableBody');
  const emptyState = document.getElementById('emptyTableState');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!lista.length) {
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  lista.forEach((produto, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="product-info">
          <img
            src="${produto.imagem || 'https://via.placeholder.com/48x48/f4c2c2/ffffff?text=?'}"
            alt="${produto.nome}"
            class="product-thumb"
            onerror="this.src='https://via.placeholder.com/48x48/f4c2c2/ffffff?text=?'"
          >
          <div>
            <div class="product-name">${produto.nome}</div>
            <div class="product-desc">${produto.descricao || ''}</div>
          </div>
        </div>
      </td>
      <td><span class="badge-cat">${getCategoryLabel(produto.categoria)}</span></td>
      <td>${getStatusBadge(produto.status)}</td>
      <td>${produto.preco || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" data-index="${index}" title="Editar">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn-delete" data-index="${index}" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editProduto(parseInt(btn.dataset.index)));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.index)));
  });
}

function getCategoryLabel(cat) {
  const labels = { canecas: 'Canecas', bebê: 'Bebê', toalhas: 'Toalhas', casa: 'Casa e presente', lavabo: 'Lavabo' };
  return labels[cat] || cat || '—';
}

function getStatusBadge(status) {
  const map = {
    'pronta-entrega': `<span class="badge badge-ready">Pronta entrega</span>`,
    'promocao': `<span class="badge badge-promo">Promoção</span>`,
    'sob-encomenda': `<span class="badge badge-order">Sob encomenda</span>`
  };
  return map[status] || `<span class="badge badge-order">${status || '—'}</span>`;
}

// ============================================
// STATS
// ============================================
function updateStats() {
  document.getElementById('statTotal').textContent = produtos.length;
  document.getElementById('statPromo').textContent = produtos.filter(p => p.status === 'promocao').length;
  document.getElementById('statReady').textContent = produtos.filter(p => p.status === 'pronta-entrega').length;
  document.getElementById('statTrend').textContent = produtos.filter(p => p['bordado-alta']).length;
}

// ============================================
// BUSCA E FILTRO
// ============================================
function bindSearch() {
  const searchInput = document.getElementById('adminSearch');
  const filterCat = document.getElementById('adminFilterCat');

  const applyFilter = () => {
    const term = (searchInput?.value || '').toLowerCase().trim();
    const cat = filterCat?.value || '';

    const filtered = produtos.filter(p => {
      const matchTerm = !term ||
        p.nome.toLowerCase().includes(term) ||
        (p.descricao || '').toLowerCase().includes(term) ||
        (p.keywords || '').toLowerCase().includes(term);

      const matchCat = !cat || p.categoria === cat;
      return matchTerm && matchCat;
    });

    renderTable(filtered);
  };

  searchInput?.addEventListener('input', applyFilter);
  filterCat?.addEventListener('change', applyFilter);
}

// ============================================
// FORMULÁRIO
// ============================================
function bindProductForm() {
  document.getElementById('btnVoltar')?.addEventListener('click', () => renderSection('produtos'));
  document.getElementById('btnCancelar')?.addEventListener('click', () => renderSection('produtos'));
  document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProduto();
  });
}

function resetForm() {
  document.getElementById('editIndex').value = '-1';
  document.getElementById('pImagemUrl').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('formTitle').textContent = 'Novo Produto';
  document.getElementById('formSubtitle').textContent = 'Preencha as informações abaixo';
  document.getElementById('formError')?.classList.add('hidden');
  document.getElementById('imagePreview')?.classList.add('hidden');
  document.getElementById('uploadPlaceholder')?.classList.remove('hidden');
  document.getElementById('uploadProgress')?.classList.add('hidden');
  uploadedImageUrl = '';
}

function editProduto(index) {
  const produto = produtos[index];
  if (!produto) return;

  renderSection('novo-produto');

  document.getElementById('editIndex').value = index;
  document.getElementById('formTitle').textContent = 'Editar Produto';
  document.getElementById('formSubtitle').textContent = `Editando: ${produto.nome}`;

  document.getElementById('pNome').value = produto.nome || '';
  document.getElementById('pCategoria').value = produto.categoria || '';
  document.getElementById('pStatus').value = produto.status || 'sob-encomenda';
  document.getElementById('pPreco').value = produto.preco || '';
  document.getElementById('pDescricao').value = produto.descricao || '';
  document.getElementById('pWhatsapp').value = produto.whatsapp || '';
  document.getElementById('pPersonalizacao').value = produto.personalizacao || '';
  document.getElementById('pEstilo').value = produto.estilo || '';
  document.getElementById('pKeywords').value = produto.keywords || '';
  document.getElementById('pBordadoAlta').checked = produto['bordado-alta'] || false;

  uploadedImageUrl = produto.imagem || '';
  document.getElementById('pImagemUrl').value = uploadedImageUrl;

  if (uploadedImageUrl) {
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('uploadPlaceholder');

    preview?.classList.remove('hidden');
    placeholder?.classList.add('hidden');

    if (preview) {
      preview.innerHTML = `
        <img src="${uploadedImageUrl}" alt="Preview">
        <div class="preview-info">
          <i class="fas fa-check-circle"></i>
          <span>Imagem atual</span>
          <button type="button" class="btn-change-img" id="btnChangeImg">
            <i class="fas fa-redo"></i> Trocar foto
          </button>
        </div>
      `;
      document.getElementById('btnChangeImg')?.addEventListener('click', () => {
        preview.classList.add('hidden');
        placeholder?.classList.remove('hidden');
        uploadedImageUrl = '';
        document.getElementById('pImagemUrl').value = '';
        document.getElementById('pImagemFile').value = '';
      });
    }
  }

  document.querySelector('[data-section="novo-produto"]')?.classList.add('active');
  document.querySelector('[data-section="produtos"]')?.classList.remove('active');
}

function saveProduto() {
  const formError = document.getElementById('formError');

  const nome = document.getElementById('pNome').value.trim();
  const categoria = document.getElementById('pCategoria').value;
  const descricao = document.getElementById('pDescricao').value.trim();
  const imagem = uploadedImageUrl || document.getElementById('pImagemUrl').value.trim();

  if (!nome || !categoria || !descricao) {
    formError.textContent = 'Preencha os campos obrigatórios: Nome, Categoria e Descrição.';
    formError.classList.remove('hidden');
    return;
  }

  if (!imagem) {
    formError.textContent = 'Faça o upload da foto do produto.';
    formError.classList.remove('hidden');
    return;
  }

  formError.classList.add('hidden');

  const produto = {
    nome,
    categoria,
    status: document.getElementById('pStatus').value,
    preco: document.getElementById('pPreco').value.trim(),
    descricao,
    imagem,
    whatsapp: document.getElementById('pWhatsapp').value.trim(),
    personalizacao: document.getElementById('pPersonalizacao').value.trim(),
    estilo: document.getElementById('pEstilo').value.trim(),
    keywords: document.getElementById('pKeywords').value.trim(),
    'bordado-alta': document.getElementById('pBordadoAlta').checked
  };

  const editIndex = parseInt(document.getElementById('editIndex').value);

  if (editIndex >= 0) {
    produtos[editIndex] = produto;
    showToast('✅ Produto atualizado!');
  } else {
    produtos.push(produto);
    showToast('✅ Produto adicionado!');
  }

  saveProdutos();
  exportJSON();
  renderSection('produtos');
}

// ============================================
// EXPORT JSON
// ============================================
function exportJSON() {
  const data = JSON.stringify(produtos, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'produtos.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// MODAL EXCLUSÃO
// ============================================
function bindDeleteModal() {
  document.getElementById('confirmDelete')?.addEventListener('click', () => {
    if (deleteIndex >= 0) {
      const nome = produtos[deleteIndex]?.nome || 'Produto';
      produtos.splice(deleteIndex, 1);
      saveProdutos();
      exportJSON();
      renderTable(produtos);
      updateStats();
      closeDeleteModal();
      showToast(`🗑️ "${nome}" excluído.`);
      deleteIndex = -1;
    }
  });

  document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);

  document.getElementById('deleteModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
  });
}

function openDeleteModal(index) {
  deleteIndex = index;
  const nome = produtos[index]?.nome || 'este produto';
  const label = document.getElementById('deleteProductName');
  if (label) label.textContent = `"${nome}" será removido do catálogo.`;
  document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.add('hidden');
}

// ============================================
// TOAST
// ============================================
function showToast(msg = 'Salvo!') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast) return;
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}
