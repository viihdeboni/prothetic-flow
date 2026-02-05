// ========================================
// DASHBOARD - ProtheticFlow
// ========================================

console.log('📊 dashboard.js carregado');

// ========================================
// INICIALIZAR
// ========================================

const initDashboard = async () => {
  // Aguardar Firebase
  while (!window.FirebaseApp?.auth || !window.FirebaseApp?.db) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Firebase pronto');

  const auth = window.FirebaseApp.auth;
  const db = window.FirebaseApp.db;

  // Esperar autenticação
  const currentUser = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      unsubscribe();
      
      if (!authUser) {
        console.log('❌ Usuário não autenticado, redirecionando...');
        window.location.href = 'index.html';
        resolve(null);
        return;
      }

      console.log('✅ Usuário autenticado:', authUser.uid);

      try {
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        const userData = {
          id: authUser.uid,
          email: authUser.email,
          ...userDoc.data()
        };
        console.log('✅ Dados do usuário:', userData);
        resolve(userData);
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        window.location.href = 'index.html';
        resolve(null);
      }
    });
  });

  if (!currentUser) return;

  // ========================================
  // ELEMENTOS DO DOM
  // ========================================

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

  // Ocultar Métricas para Operacional
  if (currentUser.role === 'operational' && metricsLink) {
    metricsLink.style.display = 'none';
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }

  // ========================================
  // FUNÇÕES DE FORMATAÇÃO
  // ========================================

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Não definida';
    
    let date;
    if (dateValue.toDate) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return 'Não definida';
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
        // Próteses Fixas
        'coroa': '🦷 Coroa',
        'ponte': '🦷 Ponte',
        'implante': '🦷 Implante',
        // Próteses Removíveis
        'protese-total': '🦷 Prótese Total',
        'protese-parcial': '🦷 Prótese Parcial',
        // Placas
        'placa-funcional': '🦴 Placa Funcional',
        'placa-miorrelaxante': '🦴 Placa Miorrelaxante',
        'placa-clareamento': '✨ Placa de Clareamento',
        // Modelos
        'modelo-zocal': '🏛️ Modelo Zocal',
        'modelo-ferradura': '🏛️ Modelo Ferradura',
        // Ortodontia
        'contencao-estetica': '😁 Contenção Estética'
    };
    return labels[type] || type;
};

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

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
      if (casesGrid) casesGrid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    if (casesGrid) {
      casesGrid.innerHTML = cases.map(renderCase).join('');
    }
  };

  // ========================================
  // ESTATÍSTICAS
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
  // FILTROS
  // ========================================

  let allCases = [];

  const applyFilters = () => {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    
    let filtered = allCases;
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.patientName.toLowerCase().includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm)
      );
    }
    
    if (statusValue) {
      filtered = filtered.filter(c => c.status === statusValue);
    }
    
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
  // CARREGAR CASOS (REAL-TIME)
  // ========================================

  const loadCases = () => {
    console.log('🔄 Carregando casos do Firebase...');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (casesGrid) casesGrid.innerHTML = '';
    if (emptyState) emptyState.classList.add('hidden');
    
    // Escutar mudanças em tempo real
    db.collection('cases')
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
        
        console.log('✅ Casos carregados:', allCases);
        
        updateStats(allCases);
        applyFilters();
        
        if (loadingState) loadingState.classList.add('hidden');
      }, (error) => {
        console.error('❌ Erro ao carregar casos:', error);
        if (loadingState) loadingState.classList.add('hidden');
      });
  };

  // Carregar casos
  loadCases();

  console.log('✅ Dashboard pronto!');
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
