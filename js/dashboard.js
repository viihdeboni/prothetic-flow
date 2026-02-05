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
      'coroa': '🦷 Coroa',
      'ponte': '🦷 Ponte',
      'implante': '🦷 Implante',
      'protese-total': '🦷 Prótese Total',
      'protese-parcial': '🦷 Prótese Parcial',
      'placa-funcional': '🦴 Placa Funcional',
      'placa-miorrelaxante': '🦴 Placa Miorrelaxante',
      'placa-clareamento': '✨ Placa de Clareamento',
      'modelo-zocal': '🏛️ Modelo Zocal',
      'modelo-ferradura': '🏛️ Modelo Ferradura',
      'contencao-estetica': '😁 Contenção Estética'
    };
    return labels[type] || type;
  };

  const getProsthesesSummary = (prostheses) => {
    if (!prostheses || prostheses.length === 0) return '';
    
    if (prostheses.length === 1) {
      return getTypeLabel(prostheses[0].type);
    }
    
    // Múltiplas próteses - mostrar resumo
    const types = prostheses.map(p => getTypeLabel(p.type)).join(' + ');
    return types;
  };

  const getProsthesesBadge = (prostheses) => {
    if (!prostheses || prostheses.length <= 1) return '';
    
    return `<span class="prostheses-count-badge">${prostheses.length} próteses</span>`;
  };

  const getMostAdvancedStatus = (prostheses) => {
    if (!prostheses || prostheses.length === 0) return 'escaneamento';
    
    const statusOrder = ['escaneamento', 'planejamento', 'impressao', 'teste', 'concluido'];
    
    let mostAdvanced = 'escaneamento';
    let maxIndex = 0;
    
    prostheses.forEach(p => {
      const index = statusOrder.indexOf(p.status);
      if (index > maxIndex) {
        maxIndex = index;
        mostAdvanced = p.status;
      }
    });
    
    return mostAdvanced;
  };

  const hasAnyProsthesisCompleted = (prostheses) => {
    if (!prostheses || prostheses.length === 0) return false;
    return prostheses.every(p => p.status === 'concluido');
  };

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  const renderCase = (caseData) => {
    const prostheses = caseData.prostheses || [];
    const mainStatus = getMostAdvancedStatus(prostheses);
    const isCompleted = hasAnyProsthesisCompleted(prostheses);
    
    // Pegar a data mais recente das próteses
    let earliestDate = null;
    prostheses.forEach(p => {
      if (p.firstConsultation) {
        const date = new Date(p.firstConsultation);
        if (!earliestDate || date < earliestDate) {
          earliestDate = p.firstConsultation;
        }
      }
    });

    return `
      <a href="case-detail.html?id=${caseData.id}" class="case-card">
        <div class="case-header">
          <div class="case-patient-info">
            <div class="case-patient-name">${caseData.patientName}</div>
            <div class="case-id">#${caseData.id.slice(0, 8)}</div>
          </div>
          <span class="case-status-badge ${isCompleted ? 'concluido' : mainStatus}">
            ${isCompleted ? 'Concluído' : getStatusLabel(mainStatus)}
          </span>
        </div>
        
        <div class="case-prostheses">
          <div class="case-type">
            ${getProsthesesSummary(prostheses)}
          </div>
          ${getProsthesesBadge(prostheses)}
        </div>
        
        <div class="case-dates">
          <div class="case-date-item">
            <span class="case-date-label">Criado em:</span>
            <span class="case-date-value">${formatDate(caseData.createdAt)}</span>
          </div>
          ${earliestDate ? `
            <div class="case-date-item">
              <span class="case-date-label">1ª Consulta:</span>
              <span class="case-date-value">${formatDate(earliestDate)}</span>
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
    
    let completed = 0;
    cases.forEach(c => {
      if (hasAnyProsthesisCompleted(c.prostheses)) {
        completed++;
      }
    });
    
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
    
    // Busca por nome ou ID
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.patientName.toLowerCase().includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro por status - verifica se ALGUMA prótese tem esse status
    if (statusValue) {
      filtered = filtered.filter(c => {
        if (!c.prostheses || c.prostheses.length === 0) return false;
        
        if (statusValue === 'concluido') {
          return hasAnyProsthesisCompleted(c.prostheses);
        }
        
        return c.prostheses.some(p => p.status === statusValue);
      });
    }
    
    // Filtro por tipo - verifica se ALGUMA prótese é desse tipo
    if (typeValue) {
      filtered = filtered.filter(c => {
        if (!c.prostheses || c.prostheses.length === 0) return false;
        return c.prostheses.some(p => p.type === typeValue);
      });
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
