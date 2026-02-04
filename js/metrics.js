// ========================================
// MÉTRICAS - ProtheticFlow
// ========================================

console.log('📊 metrics.js carregado');

// ========================================
// INICIALIZAR
// ========================================

const initMetrics = async () => {
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
        console.log('❌ Usuário não autenticado');
        window.location.href = 'index.html';
        resolve(null);
        return;
      }

      try {
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        const userData = {
          id: authUser.uid,
          email: authUser.email,
          ...userDoc.data()
        };
        console.log('✅ Usuário:', userData);
        resolve(userData);
      } catch (error) {
        console.error('❌ Erro:', error);
        window.location.href = 'index.html';
        resolve(null);
      }
    });
  });

  if (!currentUser) return;

  // Apenas Gerência
  if (currentUser.role !== 'management') {
    alert('Acesso negado: área restrita à Gerência');
    window.location.href = 'dashboard.html';
    return;
  }

  console.log('✅ Métricas iniciadas');

  // ========================================
  // ELEMENTOS DO DOM
  // ========================================

  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const periodFilter = document.getElementById('periodFilter');

  if (userName) userName.textContent = currentUser.name;

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }

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
  // CÁLCULOS
  // ========================================

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateMetrics = (cases) => {
    const casesWithValue = cases.filter(c => c.value && c.value > 0);
    const totalRevenue = casesWithValue.reduce((sum, c) => sum + c.value, 0);
    const averageTicket = casesWithValue.length > 0 ? totalRevenue / casesWithValue.length : 0;
    const activeCases = cases.filter(c => c.status !== 'concluido');
    const pendingRevenue = activeCases.filter(c => c.value && c.value > 0).reduce((sum, c) => sum + c.value, 0);
    const completedCases = cases.filter(c => c.status === 'concluido');
    const completionRate = cases.length > 0 ? ((completedCases.length / cases.length) * 100).toFixed(1) : 0;

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
  // RENDERIZAÇÃO
  // ========================================

  const renderFinancialMetrics = (metrics) => {
    const el1 = document.getElementById('totalRevenue');
    const el2 = document.getElementById('revenueChange');
    const el3 = document.getElementById('averageTicket');
    const el4 = document.getElementById('ticketCases');
    const el5 = document.getElementById('pendingRevenue');
    const el6 = document.getElementById('pendingCases');

    if (el1) el1.textContent = formatMoney(metrics.totalRevenue);
    if (el2) el2.textContent = `${metrics.casesWithValue} casos com valor definido`;
    if (el3) el3.textContent = formatMoney(metrics.averageTicket);
    if (el4) el4.textContent = `Baseado em ${metrics.casesWithValue} casos`;
    if (el5) el5.textContent = formatMoney(metrics.pendingRevenue);
    if (el6) el6.textContent = `${metrics.activeCases} casos em andamento`;
  };

  const renderSummary = (metrics) => {
    const el1 = document.getElementById('summaryTotal');
    const el2 = document.getElementById('summaryCompleted');
    const el3 = document.getElementById('summaryActive');
    const el4 = document.getElementById('summaryRate');

    if (el1) el1.textContent = metrics.totalCases;
    if (el2) el2.textContent = metrics.completedCases;
    if (el3) el3.textContent = metrics.activeCases;
    if (el4) el4.textContent = metrics.completionRate + '%';
  };

  const renderRevenueByType = (cases) => {
    const container = document.getElementById('revenueByType');
    if (!container) return;

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

    const byType = {};
    cases.filter(c => c.value && c.value > 0).forEach(c => {
      if (!byType[c.type]) byType[c.type] = 0;
      byType[c.type] += c.value;
    });

    const maxValue = Math.max(...Object.values(byType), 1);
    const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">📊</div><p>Nenhum caso com valor definido</p></div>';
      return;
    }

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
  };

  const renderCasesByStatus = (cases) => {
    const container = document.getElementById('casesByStatus');
    if (!container) return;

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

    const byStatus = {};
    cases.forEach(c => {
      if (!byStatus[c.status]) byStatus[c.status] = 0;
      byStatus[c.status]++;
    });

    const maxValue = Math.max(...Object.values(byStatus), 1);
    const order = ['escaneamento', 'planejamento', 'impressao', 'teste', 'concluido'];
    const sorted = order.filter(s => byStatus[s]).map(s => [s, byStatus[s]]);

    if (sorted.length === 0) {
      container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">📊</div><p>Nenhum caso registrado</p></div>';
      return;
    }

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
  };

  const renderTopCases = (cases) => {
    const container = document.getElementById('topCases');
    if (!container) return;

    const casesWithValue = cases.filter(c => c.value && c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

    if (casesWithValue.length === 0) {
      container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">🏆</div><p>Nenhum caso com valor</p></div>';
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

    container.innerHTML = casesWithValue.map((c, i) => `
      <a href="case-detail.html?id=${c.id}" class="top-case-item">
        <span class="top-case-rank ${rankClasses[i]}">${i + 1}</span>
        <div class="top-case-info">
          <div class="top-case-name">${c.patientName}</div>
          <div class="top-case-type">${typeLabels[c.type] || c.type}</div>
        </div>
        <div class="top-case-value">${formatMoney(c.value)}</div>
      </a>
    `).join('');
  };

  const renderRecentCases = (cases) => {
    const container = document.getElementById('recentCases');
    if (!container) return;

    const recent = [...cases].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    }).slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '<div class="metrics-empty"><div class="metrics-empty-icon">🕐</div><p>Nenhum caso criado</p></div>';
      return;
    }

    const statusLabels = {
      'escaneamento': 'Escaneamento',
      'planejamento': 'Planejamento',
      'impressao': 'Impressão',
      'teste': 'Teste',
      'concluido': 'Concluído'
    };

    const formatDate = (dateValue) => {
      let date;
      if (dateValue?.toDate) date = dateValue.toDate();
      else if (dateValue instanceof Date) date = dateValue;
      else date = new Date(dateValue);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

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
  };

  const renderAverageTimes = () => {
    const el1 = document.getElementById('timeScanning');
    const el2 = document.getElementById('timePlanning');
    const el3 = document.getElementById('timePrinting');
    const el4 = document.getElementById('timeTesting');
    const el5 = document.getElementById('timeTotal');

    if (el1) el1.textContent = '2-3 dias';
    if (el2) el2.textContent = '3-5 dias';
    if (el3) el3.textContent = '1-2 dias';
    if (el4) el4.textContent = '1-2 dias';
    if (el5) el5.textContent = '7-12 dias';
  };

  // ========================================
  // CARREGAR MÉTRICAS
  // ========================================

  let allCases = [];

  const loadMetrics = (period = 'month') => {
    console.log('🔄 Carregando métricas...');

    db.collection('cases').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
      console.log('📦 Snapshot:', snapshot.size, 'casos');

      allCases = [];
      snapshot.forEach((doc) => {
        allCases.push({ id: doc.id, ...doc.data() });
      });

      const filtered = filterByPeriod(allCases, period);
      console.log('Casos filtrados:', filtered.length);

      const metrics = calculateMetrics(filtered);

      renderFinancialMetrics(metrics);
      renderSummary(metrics);
      renderRevenueByType(filtered);
      renderCasesByStatus(filtered);
      renderTopCases(filtered);
      renderRecentCases(filtered);
      renderAverageTimes();

      console.log('✅ Métricas carregadas!');
    });
  };

  if (periodFilter) {
    periodFilter.addEventListener('change', (e) => {
      loadMetrics(e.target.value);
    });
  }

  loadMetrics('month');

  console.log('✅ metrics.js pronto!');
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMetrics);
} else {
  initMetrics();
}
