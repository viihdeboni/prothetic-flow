// ========================================
// DASHBOARD - ProtheticFlow
// ========================================

console.log('📊 dashboard.js carregado');

// Proteger rota e obter usuário
let currentUser = null;

const initDashboard = async () => {
  currentUser = await window.ProtheticAuth?.protectRoute();
  
  if (!currentUser) {
    console.log('❌ Usuário não autenticado');
    return;
  }

  console.log('✅ Dashboard iniciado para:', currentUser.name);

  // Elementos do DOM
  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const metricsLink = document.getElementById('metricsLink');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const typeFilter = document.getElementById('typeFilter');
  const casesGrid = document.getElementById('casesGrid');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const totalCasesEl = document.getElementById('totalCases');
  const activeCasesEl = document.getElementById('activeCases');
  const completedCasesEl = document.getElementById('completedCases');

  // Definir nome do usuário
  if (userName) {
    userName.textContent = currentUser.name;
  }

  // Ocultar link de Métricas se for usuário Operacional
  if (currentUser.role === 'operational' && metricsLink) {
    metricsLink.style.display = 'none';
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.ProtheticAuth.logout();
    });
  }

  // ========================================
  // FIREBASE - GERENCIAMENTO DE CASOS
  // ========================================

  const db = window.FirebaseApp.db;

  // ========================================
  // RENDERIZAÇÃO DE CASOS
  // ========================================

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Não definida';
    
    let date;
    if (timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      'escaneamento': 'Escaneamento',
      'planejamento': 'Planejamento',
      'impressao': 'Impressão',
      'teste': 'Teste',
      'concluido': 'Concluído'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type) => {
    const labels = {
      'coroa': 'Coroa',
      'ponte': 'Ponte',
      'protese-total': 'Prótese Total',
      'protese-parcial': 'Prótese Parcial',
      'implante': 'Implante'
    };
    return labels[type] || type;
  };

  const renderCase = (caseData) => {
    return `
      <a href="case-detail.html?id=${caseData.id}" class="case-card">
        <div class="case-header">
          <div class="case-patient-info">
            <div class="case-patient-name">${caseData.patientName}</div>
            <div class="case-id">#${caseData.id.slice(0, 8)}</div>
          </div>
          <span class="case-status-badge ${caseData.status}">
            ${getStatusLabel(caseData.status)}
          </span>
        </div>
        
        <div class="case-type">
          🦷 ${getTypeLabel(caseData.type)}
        </div>
        
        <div class="case-dates">
          <div class="case-date-item">
            <span class="case-date-label">Criado em:</span>
            <span class="case-date-value">${formatDate(caseData.createdAt)}</span>
          </div>
          ${caseData.firstConsultation ? `
            <div class="case-date-item">
              <span class="case-date-label">1ª Consulta:</span>
              <span class="case-date-value">${formatDate(caseData.firstConsultation)}</span>
            </div>
          ` : ''}
        </div>
      </a>
    `;
  };

  const renderCases = (cases) => {
    console.log('🎨 Renderizando casos:', cases.length);
    
    if (cases.length === 0) {
      casesGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    casesGrid.innerHTML = cases.map(renderCase).join('');
  };

  // ========================================
  // ATUALIZAR ESTATÍSTICAS
  // ========================================

  const updateStats = (cases) => {
    const total = cases.length;
    const completed = cases.filter(c => c.status === 'concluido').length;
    const active = total - completed;
    
    if (totalCasesEl) totalCasesEl.textContent = total;
    if (activeCasesEl) activeCasesEl.textContent = active;
    if (completedCasesEl) completedCasesEl.textContent = completed;
    
    console.log('📊 Stats:', { total, active, completed });
  };

  // ========================================
  // FILTROS E BUSCA
  // ========================================

  let allCases = [];
  let unsubscribe = null;

  const applyFilters = () => {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    
    let filtered = allCases;
    
    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.patientName.toLowerCase().includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro de status
    if (statusValue) {
      filtered = filtered.filter(c => c.status === statusValue);
    }
    
    // Filtro de tipo
    if (typeValue) {
      filtered = filtered.filter(c => c.type === typeValue);
    }
    
    console.log('🔍 Casos filtrados:', filtered.length);
    renderCases(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyFilters);

  // ========================================
  // CARREGAR CASOS DO FIREBASE (REAL-TIME)
  // ========================================

  const loadCases = () => {
    console.log('🔄 Carregando casos do Firebase...');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (casesGrid) casesGrid.innerHTML = '';
    if (emptyState) emptyState.classList.add('hidden');
    
    // Escutar mudanças em tempo real
    unsubscribe = db.collection('cases')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        console.log('📦 Snapshot recebido:', snapshot.size, 'casos');
        
        allCases = [];
        
        snapshot.forEach((doc) => {
          allCases.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('✅ Casos carregados:', allCases.length);
        
        updateStats(allCases);
        applyFilters();
        
        if (loadingState) loadingState.classList.add('hidden');
      }, (error) => {
        console.error('❌ Erro ao carregar casos:', error);
        window.ProtheticAuth?.showNotification('Erro ao carregar casos', 'error');
        if (loadingState) loadingState.classList.add('hidden');
      });
  };

  // Carregar casos ao iniciar
  loadCases();

  // Limpar listener ao sair da página
  window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
