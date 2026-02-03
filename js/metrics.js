// ========================================
// MÉTRICAS - ProtheticFlow
// ========================================

console.log('📊 metrics.js carregado');

// Proteger rota e obter usuário
let currentUser = null;
let unsubscribe = null;

const initMetrics = async () => {
  currentUser = await window.ProtheticAuth?.protectRoute();
  
  if (!currentUser) {
    console.log('❌ Usuário não autenticado');
    return;
  }

  // Apenas usuários Gerência podem acessar
  if (currentUser.role !== 'management') {
    window.ProtheticAuth.showNotification('Acesso negado: área restrita à Gerência', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
    return;
  }

  console.log('✅ Métricas iniciadas para:', currentUser.name);

  // Elementos do DOM
  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const periodFilter = document.getElementById('periodFilter');

  // Definir nome do usuário
  if (userName) {
    userName.textContent = currentUser.name;
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.ProtheticAuth.logout();
    });
  }

  // ========================================
  // FIREBASE
  // ========================================

  const db = window.FirebaseApp.db;

  // ========================================
  // FILTROS DE PERÍODO
  // ========================================

  const filterByPeriod = (cases, period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return cases.filter(c => {
          const caseDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          return caseDate >= today;
        });

      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return cases.filter(c => {
          const caseDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          return caseDate >= weekAgo;
        });

      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return cases.filter(c => {
          const caseDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          return caseDate >= monthStart;
        });

      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return cases.filter(c => {
          const caseDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          return caseDate >= yearStart;
        });

      default:
        return cases;
    }
  };

  // ========================================
  // CÁLCULOS DE MÉTRICAS
  // ========================================

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateMetrics = (cases) => {
    // Casos com valor definido
    const casesWithValue = cases.filter(c => c.value && c.value > 0);

    // Faturamento total
    const totalRevenue = casesWithValue.reduce((sum, c) => sum + c.value, 0);

    // Ticket médio
    const averageTicket = casesWithValue.length > 0 
      ? totalRevenue / casesWithValue.length 
      : 0;

    // Casos em andamento (não concluídos)
    const activeCases = cases.filter(c => c.status !== 'concluido');
    const pendingRevenue = activeCases
      .filter(c => c.value && c.value > 0)
      .reduce((sum, c) => sum + c.value, 0);

    // Casos concluídos
    const completedCases = cases.filter(c => c.status === 'concluido');
    const completionRate = cases.length > 0 
      ? ((completedCases.length / cases.length) * 100).toFixed(1)
      : 0;

    return {
      totalRevenue,
      averageTicket,
      pendingRevenue,
      activeCases: activeCases.length,
      completedCases: completedCases.length,
      totalCases: cases.length,
      completionRate,
      casesWithValue: casesWithValue.length
    };
  };

  // ========================================
  // RENDERIZAÇÃO DE MÉTRICAS
  // ========================================

  const renderFinancialMetrics = (metrics) => {
    const totalRevenueEl = document.getElementById('totalRevenue');
    const revenueChangeEl = document.getElementById('revenueChange');
    const averageTicketEl = document.getElementById('averageTicket');
    const ticketCasesEl = document.getElementById('ticketCases');
    const pendingRevenueEl = document.getElementById('pendingRevenue');
    const pendingCasesEl = document.getElementById('pendingCases');

    if (totalRevenueEl) totalRevenueEl.textContent = formatMoney(metrics.totalRevenue);
    if (revenueChangeEl) revenueChangeEl.textContent = `${metrics.casesWithValue} casos com valor definido`;

    if (averageTicketEl) averageTicketEl.textContent = formatMoney(metrics.averageTicket);
    if (ticketCasesEl) ticketCasesEl.textContent = `Baseado em ${metrics.casesWithValue} casos`;

    if (pendingRevenueEl) pendingRevenueEl.textContent = formatMoney(metrics.pendingRevenue);
    if (pendingCasesEl) pendingCasesEl.textContent = `${metrics.activeCases} casos em andamento`;
  };

  const renderSummary = (metrics) => {
    const summaryTotalEl = document.getElementById('summaryTotal');
    const summaryCompletedEl = document.getElementById('summaryCompleted');
    const summaryActiveEl = document.getElementById('summaryActive');
    const summaryRateEl = document.getElementById('summaryRate');

    if (summaryTotalEl) summaryTotalEl.textContent = metrics.totalCases;
    if (summaryCompletedEl) summaryCompletedEl.textContent = metrics.completedCases;
    if (summaryActiveEl) summaryActiveEl.textContent = metrics.activeCases;
    if (summaryRateEl) summaryRateEl.textContent = metrics.completionRate + '%';
  };

  // ========================================
  // FATURAMENTO POR TIPO
  // ========================================

  const renderRevenueByType = (cases) => {
    const container = document.getElementById('revenueByType');

    const typeLabels = {
      'coroa': 'Coroa',
      'ponte': 'Ponte',
      'protese-total': 'Prótese Total',
      'protese-parcial': 'Prótese Parcial',
      'implante': 'Implante'
    };

    const colors = {
      'coroa': 'success',
      'ponte': '',
      'protese-total': 'warning',
      'protese-parcial': 'info',
      'implante': 'error'
    };

    // Agrupar por tipo
    const byType = {};
    cases.filter(c => c.value && c.value > 0).forEach(c => {
      if (!byType[c.type]) {
        byType[c.type] = 0;
      }
      byType[c.type] += c.value;
    });

    // Encontrar valor máximo
    const maxValue = Math.max(...Object.values(byType), 1);

    // Ordenar por valor
    const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      if (container) {
        container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">📊</div><p>Nenhum caso com valor definido</p></div>';
      }
      return;
    }

    if (container) {
      container.innerHTML = sorted.map(([type, value]) => {
        const percentage = (value / maxValue * 100).toFixed(0);
        return `
          <div class="chart-bar">
            <div class="chart-bar-header">
              <span class="chart-bar-label">${typeLabels[type] || type}</span>
              <span class="chart-bar-value">${formatMoney(value)}</span>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill ${colors[type] || ''}" style="width: ${percentage}%">
                ${percentage}%
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  // ========================================
  // CASOS POR STATUS
  // ========================================

  const renderCasesByStatus = (cases) => {
    const container = document.getElementById('casesByStatus');

    const statusLabels = {
      'escaneamento': 'Escaneamento',
      'planejamento': 'Planejamento',
      'impressao': 'Impressão',
      'teste': 'Teste',
      'concluido': 'Concluído'
    };

    const colors = {
      'escaneamento': '',
      'planejamento': 'warning',
      'impressao': 'info',
      'teste': 'error',
      'concluido': 'success'
    };

    // Agrupar por status
    const byStatus = {};
    cases.forEach(c => {
      if (!byStatus[c.status]) {
        byStatus[c.status] = 0;
      }
      byStatus[c.status]++;
    });

    const maxValue = Math.max(...Object.values(byStatus), 1);

    // Ordenar na ordem lógica do workflow
    const order = ['escaneamento', 'planejamento', 'impressao', 'teste', 'concluido'];
    const sorted = order.filter(status => byStatus[status]).map(status => [status, byStatus[status]]);

    if (sorted.length === 0) {
      if (container) {
        container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">📊</div><p>Nenhum caso registrado</p></div>';
      }
      return;
    }

    if (container) {
      container.innerHTML = sorted.map(([status, count]) => {
        const percentage = (count / maxValue * 100).toFixed(0);
        return `
          <div class="chart-bar">
            <div class="chart-bar-header">
              <span class="chart-bar-label">${statusLabels[status]}</span>
              <span class="chart-bar-value">${count} casos</span>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill ${colors[status] || ''}" style="width: ${percentage}%">
                ${percentage}%
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  // ========================================
  // TOP CASOS
  // ========================================

  const renderTopCases = (cases) => {
    const container = document.getElementById('topCases');

    const casesWithValue = cases
      .filter(c => c.value && c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    if (casesWithValue.length === 0) {
      if (container) {
        container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">🏆</div><p>Nenhum caso com valor</p></div>';
      }
      return;
    }

    const typeLabels = {
      'coroa': 'Coroa',
      'ponte': 'Ponte',
      'protese-total': 'Prótese Total',
      'protese-parcial': 'Prótese Parcial',
      'implante': 'Implante'
    };

    const rankClasses = ['gold', 'silver', 'bronze', '', ''];

    if (container) {
      container.innerHTML = casesWithValue.map((c, index) => `
        <a href="case-detail.html?id=${c.id}" class="top-case-item">
          <span class="top-case-rank ${rankClasses[index]}">${index + 1}</span>
          <div class="top-case-info">
            <div class="top-case-name">${c.patientName}</div>
            <div class="top-case-type">${typeLabels[c.type] || c.type}</div>
          </div>
          <div class="top-case-value">${formatMoney(c.value)}</div>
        </a>
      `).join('');
    }
  };

  // ========================================
  // CASOS RECENTES
  // ========================================

  const renderRecentCases = (cases) => {
    const container = document.getElementById('recentCases');

    const recent = [...cases]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 5);

    if (recent.length === 0) {
      if (container) {
        container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">🕐</div><p>Nenhum caso criado</p></div>';
      }
      return;
    }

    const statusLabels = {
      'escaneamento': 'Escaneamento',
      'planejamento': 'Planejamento',
      'impressao': 'Impressão',
      'teste': 'Teste',
      'concluido': 'Concluído'
    };

    const formatDate = (timestamp) => {
      let date;
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    if (container) {
      container.innerHTML = recent.map(c => `
        <a href="case-detail.html?id=${c.id}" class="recent-case-item">
          <div class="recent-case-name">${c.patientName}</div>
          <div class="recent-case-meta">
            <span class="recent-case-badge ${c.status}">${statusLabels[c.status]}</span>
            <span>•</span>
            <span>${formatDate(c.createdAt)}</span>
          </div>
        </a>
      `).join('');
    }
  };

  // ========================================
  // TEMPO MÉDIO (PLACEHOLDER)
  // ========================================

  const renderAverageTimes = () => {
    // Por enquanto, placeholder
    const timeScanning = document.getElementById('timeScanning');
    const timePlanning = document.getElementById('timePlanning');
    const timePrinting = document.getElementById('timePrinting');
    const timeTesting = document.getElementById('timeTesting');
    const timeTotal = document.getElementById('timeTotal');

    if (timeScanning) timeScanning.textContent = '2-3 dias';
    if (timePlanning) timePlanning.textContent = '3-5 dias';
    if (timePrinting) timePrinting.textContent = '1-2 dias';
    if (timeTesting) timeTesting.textContent = '1-2 dias';
    if (timeTotal) timeTotal.textContent = '7-12 dias';
  };

  // ========================================
  // CARREGAR MÉTRICAS (REAL-TIME)
  // ========================================

  let allCases = [];

  const loadMetrics = (period = 'month') => {
    console.log('🔄 Carregando métricas...');

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

        const filteredCases = filterByPeriod(allCases, period);
        console.log('Casos filtrados:', filteredCases.length);

        const metrics = calculateMetrics(filteredCases);

        renderFinancialMetrics(metrics);
        renderSummary(metrics);
        renderRevenueByType(filteredCases);
        renderCasesByStatus(filteredCases);
        renderTopCases(filteredCases);
        renderRecentCases(filteredCases);
        renderAverageTimes();

        console.log('✅ Métricas carregadas!');
      }, (error) => {
        console.error('❌ Erro ao carregar métricas:', error);
        window.ProtheticAuth?.showNotification('Erro ao carregar métricas', 'error');
      });
  };

  // Filtro de período
  if (periodFilter) {
    periodFilter.addEventListener('change', (e) => {
      if (unsubscribe) unsubscribe();
      loadMetrics(e.target.value);
    });
  }

  // Carregar ao iniciar
  loadMetrics('month');

  // Limpar listener ao sair
  window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMetrics);
} else {
  initMetrics();
}
