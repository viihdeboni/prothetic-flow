// ========================================
// MÉTRICAS - ProtheticFlow
// ========================================

// Verificar autenticação e permissão
const currentUser = window.ProtheticAuth?.getCurrentUser();
if (!currentUser) {
    window.location.href = 'index.html';
}

// Apenas usuários Gerência podem acessar
if (currentUser.role !== 'management') {
    window.ProtheticAuth.showNotification('Acesso negado: área restrita à Gerência', 'error');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

console.log('Métricas iniciadas para:', currentUser.name);

// Elementos do DOM
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const periodFilter = document.getElementById('periodFilter');

// Definir nome do usuário
userName.textContent = currentUser.name;

// Logout
logoutBtn.addEventListener('click', () => {
    window.ProtheticAuth.logout();
});

// ========================================
// GERENCIAMENTO DE CASOS
// ========================================

const getCases = () => {
    try {
        return JSON.parse(localStorage.getItem('protheticflow_cases') || '[]');
    } catch (error) {
        console.error('Erro ao carregar casos:', error);
        return [];
    }
};

// ========================================
// FILTROS DE PERÍODO
// ========================================

const filterByPeriod = (cases, period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
        case 'today':
            return cases.filter(c => {
                const caseDate = new Date(c.createdAt);
                return caseDate >= today;
            });

        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return cases.filter(c => new Date(c.createdAt) >= weekAgo);

        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return cases.filter(c => new Date(c.createdAt) >= monthStart);

        case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return cases.filter(c => new Date(c.createdAt) >= yearStart);

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
    document.getElementById('totalRevenue').textContent = formatMoney(metrics.totalRevenue);
    document.getElementById('revenueChange').textContent = `${metrics.casesWithValue} casos com valor definido`;

    document.getElementById('averageTicket').textContent = formatMoney(metrics.averageTicket);
    document.getElementById('ticketCases').textContent = `Baseado em ${metrics.casesWithValue} casos`;

    document.getElementById('pendingRevenue').textContent = formatMoney(metrics.pendingRevenue);
    document.getElementById('pendingCases').textContent = `${metrics.activeCases} casos em andamento`;
};

const renderSummary = (metrics) => {
    document.getElementById('summaryTotal').textContent = metrics.totalCases;
    document.getElementById('summaryCompleted').textContent = metrics.completedCases;
    document.getElementById('summaryActive').textContent = metrics.activeCases;
    document.getElementById('summaryRate').textContent = metrics.completionRate + '%';
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
};

// ========================================
// CASOS RECENTES
// ========================================

const renderRecentCases = (cases) => {
    const container = document.getElementById('recentCases');

    const recent = cases
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
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

// ========================================
// TEMPO MÉDIO (PLACEHOLDER)
// ========================================

const renderAverageTimes = (cases) => {
    // Por enquanto, placeholder
    // Em uma implementação completa, calcularia baseado na timeline
    document.getElementById('timeScanning').textContent = '2-3 dias';
    document.getElementById('timePlanning').textContent = '3-5 dias';
    document.getElementById('timePrinting').textContent = '1-2 dias';
    document.getElementById('timeTesting').textContent = '1-2 dias';
    document.getElementById('timeTotal').textContent = '7-12 dias';
};

// ========================================
// CARREGAR MÉTRICAS
// ========================================

const loadMetrics = () => {
    console.log('Carregando métricas...');

    const allCases = getCases();
    const period = periodFilter.value;
    const filteredCases = filterByPeriod(allCases, period);

    console.log('Casos filtrados:', filteredCases.length);

    const metrics = calculateMetrics(filteredCases);

    renderFinancialMetrics(metrics);
    renderSummary(metrics);
    renderRevenueByType(filteredCases);
    renderCasesByStatus(filteredCases);
    renderTopCases(filteredCases);
    renderRecentCases(filteredCases);
    renderAverageTimes(filteredCases);

    console.log('Métricas carregadas!');
};

// Filtro de período
periodFilter.addEventListener('change', loadMetrics);

// Carregar ao iniciar
loadMetrics();

// Recarregar quando a página ganhar foco
window.addEventListener('focus', loadMetrics);
