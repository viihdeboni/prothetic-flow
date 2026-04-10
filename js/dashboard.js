// ========================================
// DASHBOARD - ProtheticFlow
// ========================================

console.log('📊 dashboard.js carregado');

// ========================================
// ESTÁGIOS (mesma lista do case-detail.js)
// ========================================

const STAGES = [
  { value: 'aguardando-outra',     label: 'Aguardando Outra'      },
  { value: 'chamar-paciente',      label: 'Chamar Paciente' },
  { value: 'concluido',            label: 'Concluído'       },
  { value: 'escaneamento',         label: 'Escaneamento'    },
  { value: 'imprimindo',           label: 'Imprimindo'      },
  { value: 'impressao-placa',      label: 'Impressão Placa'   },
  { value: 'impressao-protese',    label: 'Impressão Prótese' },
  { value: 'impressao',            label: 'Impressão'       },
  { value: 'montagem',             label: 'Montagem'        },
  { value: 'planejamento-placa',   label: 'Planejamento Placa'   },
  { value: 'planejamento-protese', label: 'Planejamento Prótese' },
  { value: 'planejamento',         label: 'Planejamento'    },
  { value: 'polimento',            label: 'Polimento'       },
  { value: 'teste',                label: 'Teste'           },
  { value: 'teste-ok',             label: 'Teste OK'        },
];

const PLACA_TYPES = ['placa-funcional', 'placa-miorrelaxante', 'placa-clareamento'];

const getStageLabel = (value) => {
  const found = STAGES.find(s => s.value === value);
  return found ? found.label : (value || '');
};

// ========================================
// INICIALIZAR
// ========================================

const initDashboard = async () => {
  // Aguardar Firebase
  while (!window.FirebaseApp?.auth || !window.FirebaseApp?.db) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const auth = window.FirebaseApp.auth;
  const db = window.FirebaseApp.db;

  const currentUser = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      unsubscribe();
      
      if (!authUser) {
        window.location.href = 'index.html';
        resolve(null);
        return;
      }

      try {
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        resolve({ id: authUser.uid, email: authUser.email, ...userDoc.data() });
      } catch (error) {
        window.location.href = 'index.html';
        resolve(null);
      }
    });
  });

  if (!currentUser) return;

  // ========================================
  // ELEMENTOS DO DOM
  // ========================================

  const userName        = document.getElementById('userName');
  const logoutBtn       = document.getElementById('logoutBtn');
  const metricsLink     = document.getElementById('metricsLink');
  const searchInput     = document.getElementById('searchInput');
  const statusFilter    = document.getElementById('statusFilter');
  const typeFilter      = document.getElementById('typeFilter');
  const casesGrid       = document.getElementById('casesGrid');
  const emptyState      = document.getElementById('emptyState');
  const loadingState    = document.getElementById('loadingState');
  const totalCasesEl    = document.getElementById('totalCases');
  const activeCasesEl   = document.getElementById('activeCases');
  const completedCasesEl = document.getElementById('completedCases');

  if (userName) userName.textContent = currentUser.name;
  if (currentUser.role === 'operational' && metricsLink) metricsLink.style.display = 'none';

  // Preencher o select de status dinamicamente
  if (statusFilter) {
    statusFilter.innerHTML = '<option value="">Todos os status</option>';
    STAGES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      statusFilter.appendChild(opt);
    });
  }

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
    if (dateValue.toDate) date = dateValue.toDate();
    else if (dateValue instanceof Date) date = dateValue;
    else if (typeof dateValue === 'string') date = new Date(dateValue);
    else return 'Não definida';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    return prostheses.map(p => getTypeLabel(p.type)).join(' + ');
  };

  const getProsthesisStatusBadges = (prostheses) => {
    if (!prostheses || prostheses.length === 0) return '';
    return prostheses.map((p, i) => {
      const status = p.status || 'escaneamento';
      const label  = getStageLabel(status);
      return `<span class="case-status-badge ${sanitizeClass(status)}" title="Prótese ${i + 1}">${label}</span>`;
    }).join('');
  };

  const sanitizeClass = (value) => {
    return (value || '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  };

  const getProsthesesBadge = (prostheses) => {
    if (!prostheses || prostheses.length <= 1) return '';
    return `<span class="prostheses-count-badge">${prostheses.length} próteses</span>`;
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

    let earliestDate = null;
    prostheses.forEach(p => {
      if (p.firstConsultation) {
        const date = new Date(p.firstConsultation);
        if (!earliestDate || date < earliestDate) earliestDate = p.firstConsultation;
      }
    });

    return `
      <a href="case-detail.html?id=${caseData.id}" class="case-card">
        <div class="case-header">
          <div class="case-patient-info">
            <div class="case-patient-name">${caseData.patientName}</div>
            <div class="case-id">#${caseData.id.slice(0, 8)}</div>
          </div>
          <div class="case-status-badges">
            ${getProsthesisStatusBadges(prostheses)}
          </div>
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
    if (cases.length === 0) {
      if (casesGrid) casesGrid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    if (emptyState) emptyState.classList.add('hidden');
    if (casesGrid) casesGrid.innerHTML = cases.map(renderCase).join('');
  };

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  const updateStats = (cases) => {
    const total = cases.length;
    let completed = 0;
    cases.forEach(c => { if (hasAnyProsthesisCompleted(c.prostheses)) completed++; });
    const active = total - completed;
    if (totalCasesEl) totalCasesEl.textContent = total;
    if (activeCasesEl) activeCasesEl.textContent = active;
    if (completedCasesEl) completedCasesEl.textContent = completed;
  };

  // ========================================
  // FILTROS
  // ========================================

  let allCases = [];

  const applyFilters = () => {
    const searchTerm  = searchInput  ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const typeValue   = typeFilter   ? typeFilter.value : '';
    
    let filtered = allCases;
    
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.patientName.toLowerCase().includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm)
      );
    }
    
    if (statusValue) {
      filtered = filtered.filter(c => {
        if (!c.prostheses || c.prostheses.length === 0) return false;
        if (statusValue === 'concluido') return hasAnyProsthesisCompleted(c.prostheses);
        return c.prostheses.some(p => p.status === statusValue);
      });
    }
    
    if (typeValue) {
      filtered = filtered.filter(c => {
        if (!c.prostheses || c.prostheses.length === 0) return false;
        return c.prostheses.some(p => p.type === typeValue);
      });
    }
    
    renderCases(filtered);
  };

  if (searchInput)  searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (typeFilter)   typeFilter.addEventListener('change', applyFilters);

  // ========================================
  // CARREGAR CASOS (REAL-TIME)
  // ========================================

  const loadCases = () => {
    if (loadingState) loadingState.classList.remove('hidden');
    if (casesGrid) casesGrid.innerHTML = '';
    if (emptyState) emptyState.classList.add('hidden');
    
    db.collection('cases')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        allCases = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          // Exclui casos que são APENAS placas (esses vão pro dashboard de Placas)
          const soPlacas = (data.prostheses || []).every(p => PLACA_TYPES.includes(p.type));
          if (!soPlacas) allCases.push(data);
        });
        
        updateStats(allCases);
        applyFilters();
        
        if (loadingState) loadingState.classList.add('hidden');
      }, (error) => {
        console.error('❌ Erro ao carregar casos:', error);
        if (loadingState) loadingState.classList.add('hidden');
      });
  };

  loadCases();
  console.log('✅ Dashboard pronto!');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
