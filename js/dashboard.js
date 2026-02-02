// ========================================
// DASHBOARD - ProtheticFlow
// ========================================

// Verificar autenticação
const currentUser = window.ProtheticAuth?.getCurrentUser();
if (!currentUser) {
    window.location.href = 'index.html';
}

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
userName.textContent = currentUser.name;

// Ocultar link de Métricas se for usuário Operacional
if (currentUser.role === 'operational') {
    metricsLink.style.display = 'none';
}

// Logout
logoutBtn.addEventListener('click', () => {
    window.ProtheticAuth.logout();
});

// ========================================
// GERENCIAMENTO DE CASOS
// ========================================

// Inicializar storage de casos
if (!localStorage.getItem('protheticflow_cases')) {
    localStorage.setItem('protheticflow_cases', JSON.stringify([]));
}

const getCases = () => {
    try {
        const cases = JSON.parse(localStorage.getItem('protheticflow_cases') || '[]');
        console.log('Casos carregados:', cases); // Debug
        return cases;
    } catch (error) {
        console.error('Erro ao carregar casos:', error);
        return [];
    }
};

const saveCases = (cases) => {
    localStorage.setItem('protheticflow_cases', JSON.stringify(cases));
};

// ========================================
// RENDERIZAÇÃO DE CASOS
// ========================================

const formatDate = (dateString) => {
    if (!dateString) return 'Não definida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    console.log('Renderizando casos:', cases.length); // Debug
    
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
    
    totalCasesEl.textContent = total;
    activeCasesEl.textContent = active;
    completedCasesEl.textContent = completed;
    
    console.log('Stats:', { total, active, completed }); // Debug
};

// ========================================
// FILTROS E BUSCA
// ========================================

let allCases = [];

const applyFilters = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const typeValue = typeFilter.value;
    
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
    
    console.log('Casos filtrados:', filtered.length); // Debug
    renderCases(filtered);
};

searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
typeFilter.addEventListener('change', applyFilters);

// ========================================
// CARREGAR CASOS
// ========================================

const loadCases = () => {
    console.log('Carregando casos...'); // Debug
    loadingState.classList.remove('hidden');
    casesGrid.innerHTML = '';
    emptyState.classList.add('hidden');
    
    // Simular delay de carregamento
    setTimeout(() => {
        allCases = getCases();
        
        console.log('Total de casos:', allCases.length); // Debug
        
        // Ordenar por data de criação (mais recentes primeiro)
        allCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        updateStats(allCases);
        renderCases(allCases);
        loadingState.classList.add('hidden');
    }, 300);
};

// Carregar casos ao iniciar
console.log('Dashboard iniciado'); // Debug
loadCases();

// Recarregar casos quando a página ganhar foco (usuário voltar de outra aba)
window.addEventListener('focus', () => {
    console.log('Página ganhou foco, recarregando casos...'); // Debug
    loadCases();
});

// ========================================
// CASOS DE EXEMPLO (apenas para desenvolvimento)
// ========================================

// Descomentar para adicionar casos de teste
/*
const addSampleCases = () => {
    const sampleCases = [
        {
            id: Date.now().toString() + '1',
            patientName: 'Maria Silva',
            patientPhone: '(47) 99999-1111',
            patientEmail: 'maria@email.com',
            patientCPF: null,
            patientPhoto: null,
            type: 'coroa',
            status: 'planejamento',
            value: 1500,
            firstConsultation: '2026-02-01',
            scanDate: null,
            testDate: null,
            deliveryDate: null,
            notes: 'Paciente com sensibilidade',
            timeline: [
                {
                    action: 'created',
                    description: 'Caso criado',
                    date: new Date('2026-02-01').toISOString(),
                    user: currentUser.name
                }
            ],
            files: [],
            createdAt: new Date('2026-02-01').toISOString(),
            updatedAt: new Date('2026-02-01').toISOString(),
            createdBy: currentUser.id
        },
        {
            id: Date.now().toString() + '2',
            patientName: 'João Santos',
            patientPhone: '(47) 99999-2222',
            patientEmail: 'joao@email.com',
            patientCPF: null,
            patientPhoto: null,
            type: 'ponte',
            status: 'escaneamento',
            value: 2500,
            firstConsultation: '2026-02-02',
            scanDate: '2026-02-05',
            testDate: null,
            deliveryDate: null,
            notes: null,
            timeline: [
                {
                    action: 'created',
                    description: 'Caso criado',
                    date: new Date('2026-02-02').toISOString(),
                    user: currentUser.name
                }
            ],
            files: [],
            createdAt: new Date('2026-02-02').toISOString(),
            updatedAt: new Date('2026-02-02').toISOString(),
            createdBy: currentUser.id
        },
        {
            id: Date.now().toString() + '3',
            patientName: 'Ana Paula Oliveira',
            patientPhone: '(47) 99999-3333',
            patientEmail: 'ana@email.com',
            patientCPF: '123.456.789-00',
            patientPhoto: null,
            type: 'protese-total',
            status: 'concluido',
            value: 5000,
            firstConsultation: '2026-01-25',
            scanDate: '2026-01-26',
            testDate: '2026-01-30',
            deliveryDate: '2026-02-01',
            notes: 'Caso concluído com sucesso',
            timeline: [
                {
                    action: 'created',
                    description: 'Caso criado',
                    date: new Date('2026-01-25').toISOString(),
                    user: currentUser.name
                },
                {
                    action: 'update',
                    description: 'Status alterado para: Concluído',
                    date: new Date('2026-02-01').toISOString(),
                    user: currentUser.name
                }
            ],
            files: [],
            createdAt: new Date('2026-01-25').toISOString(),
            updatedAt: new Date('2026-02-01').toISOString(),
            createdBy: currentUser.id
        }
    ];
    
    saveCases(sampleCases);
    loadCases();
};

// Descomente a linha abaixo para adicionar casos de exemplo:
// addSampleCases();
*/
