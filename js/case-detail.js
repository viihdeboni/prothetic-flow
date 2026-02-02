// ========================================
// DETALHES DO CASO - ProtheticFlow
// ========================================

// Verificar autenticação
const currentUser = window.ProtheticAuth?.getCurrentUser();
if (!currentUser) {
    window.location.href = 'index.html';
}

// Pegar ID do caso da URL
const urlParams = new URLSearchParams(window.location.search);
const caseId = urlParams.get('id');

if (!caseId) {
    window.location.href = 'dashboard.html';
}

// Elementos do DOM
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const metricsLink = document.getElementById('metricsLink');
const valueCard = document.getElementById('valueCard');
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteCaseBtn = document.getElementById('deleteCaseBtn');
const editCaseBtn = document.getElementById('editCaseBtn');
const statusSelect = document.getElementById('statusSelect');
const uploadFileBtn = document.getElementById('uploadFileBtn');
const fileInput = document.getElementById('fileInput');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const notesTextarea = document.getElementById('notesTextarea');

// Definir nome do usuário
userName.textContent = currentUser.name;

// Ocultar elementos para usuário Operacional
if (currentUser.role === 'operational') {
    metricsLink.style.display = 'none';
    valueCard.style.display = 'none';
}

// Logout
logoutBtn.addEventListener('click', () => {
    window.ProtheticAuth.logout();
});

// ========================================
// GERENCIAMENTO DE CASOS
// ========================================

const getCases = () => JSON.parse(localStorage.getItem('protheticflow_cases') || '[]');

const saveCases = (cases) => {
    localStorage.setItem('protheticflow_cases', JSON.stringify(cases));
};

const getCaseById = (id) => {
    const cases = getCases();
    return cases.find(c => c.id === id);
};

const updateCase = (id, updates) => {
    const cases = getCases();
    const index = cases.findIndex(c => c.id === id);
    if (index !== -1) {
        cases[index] = { ...cases[index], ...updates, updatedAt: new Date().toISOString() };
        saveCases(cases);
        return cases[index];
    }
    return null;
};

const deleteCase = (id) => {
    const cases = getCases();
    const filtered = cases.filter(c => c.id !== id);
    saveCases(filtered);
};

// ========================================
// FUNÇÕES DE FORMATAÇÃO
// ========================================

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatMoney = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const getTypeLabel = (type) => {
    const labels = {
        'coroa': '🦷 Coroa',
        'ponte': '🦷 Ponte',
        'protese-total': '🦷 Prótese Total',
        'protese-parcial': '🦷 Prótese Parcial',
        'implante': '🦷 Implante'
    };
    return labels[type] || type;
};

const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'stl': '🔷',
        'ply': '🔷'
    };
    return icons[ext] || '📎';
};

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ========================================
// CARREGAR DETALHES DO CASO
// ========================================

let currentCase = null;

const loadCaseDetails = () => {
    currentCase = getCaseById(caseId);

    if (!currentCase) {
        window.ProtheticAuth.showNotification('Caso não encontrado', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return;
    }

    // Breadcrumb
    document.getElementById('breadcrumbPatient').textContent = currentCase.patientName;

    // Foto do paciente
    const patientPhoto = document.getElementById('patientPhoto');
    if (currentCase.patientPhoto) {
        patientPhoto.src = currentCase.patientPhoto;
        patientPhoto.style.display = 'block';
        document.querySelector('.photo-placeholder-detail').style.display = 'none';
    }

    // Informações principais
    document.getElementById('patientName').textContent = currentCase.patientName;
    document.getElementById('caseId').textContent = '#' + currentCase.id.slice(0, 8);
    document.getElementById('caseType').textContent = getTypeLabel(currentCase.type);

    // Status
    statusSelect.value = currentCase.status;

    // Contato
    document.getElementById('patientPhone').textContent = currentCase.patientPhone || '';
    document.getElementById('patientEmail').textContent = currentCase.patientEmail || '';
    document.getElementById('patientCPF').textContent = currentCase.patientCPF || '';

    // Datas
    const setDate = (elementId, itemId, value) => {
        const el = document.getElementById(elementId);
        const item = document.getElementById(itemId);
        if (value) {
            el.textContent = formatDate(value);
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    };

    setDate('firstConsultation', 'firstConsultationItem', currentCase.firstConsultation);
    setDate('scanDate', 'scanDateItem', currentCase.scanDate);
    setDate('testDate', 'testDateItem', currentCase.testDate);
    setDate('deliveryDate', 'deliveryDateItem', currentCase.deliveryDate);

    // Valor (apenas Gerência)
    if (currentUser.role === 'management') {
        document.getElementById('caseValue').textContent = currentCase.value ? formatMoney(currentCase.value) : '';
    }

    // Observações
    notesTextarea.value = currentCase.notes || '';

    // Arquivos
    loadFiles();

    // Timeline
    loadTimeline();
};

// ========================================
// TIMELINE
// ========================================

const loadTimeline = () => {
    const timeline = document.getElementById('timeline');
    
    if (!currentCase.timeline || currentCase.timeline.length === 0) {
        timeline.innerHTML = '<div class="empty-message">Nenhuma atividade registrada</div>';
        return;
    }

    // Ordenar timeline (mais recente primeiro)
    const sortedTimeline = [...currentCase.timeline].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    timeline.innerHTML = sortedTimeline.map(item => `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-action">${item.description}</div>
                <div class="timeline-meta">
                    <span>${item.user}</span>
                    <span>${formatDateTime(item.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
};

const addTimelineItem = (description) => {
    if (!currentCase.timeline) {
        currentCase.timeline = [];
    }

    currentCase.timeline.push({
        action: 'update',
        description: description,
        date: new Date().toISOString(),
        user: currentUser.name
    });

    updateCase(caseId, { timeline: currentCase.timeline });
    loadTimeline();
};

// ========================================
// MUDANÇA DE STATUS
// ========================================

statusSelect.addEventListener('change', (e) => {
    const newStatus = e.target.value;
    const oldStatus = currentCase.status;

    if (newStatus !== oldStatus) {
        const statusLabels = {
            'escaneamento': 'Escaneamento',
            'planejamento': 'Planejamento',
            'impressao': 'Impressão',
            'teste': 'Teste',
            'concluido': 'Concluído'
        };

        currentCase.status = newStatus;
        updateCase(caseId, { status: newStatus });
        addTimelineItem(`Status alterado para: ${statusLabels[newStatus]}`);
        window.ProtheticAuth.showNotification('Status atualizado com sucesso!', 'success');
    }
});

// ========================================
// ARQUIVOS
// ========================================

const loadFiles = () => {
    const filesList = document.getElementById('filesList');

    if (!currentCase.files || currentCase.files.length === 0) {
        filesList.innerHTML = '<div class="empty-message">Nenhum arquivo anexado ainda</div>';
        return;
    }

    filesList.innerHTML = currentCase.files.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-icon">${getFileIcon(file.name)}</div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}</div>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-action-btn delete" onclick="deleteFile(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
};

uploadFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    if (!currentCase.files) {
        currentCase.files = [];
    }

    // Simular upload (em produção, enviaria para servidor)
    files.forEach(file => {
        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            window.ProtheticAuth.showNotification(`Arquivo ${file.name} muito grande (máx 10MB)`, 'error');
            return;
        }

        currentCase.files.push({
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.name
        });
    });

    updateCase(caseId, { files: currentCase.files });
    addTimelineItem(`${files.length} arquivo(s) adicionado(s)`);
    loadFiles();
    window.ProtheticAuth.showNotification('Arquivo(s) adicionado(s) com sucesso!', 'success');

    // Limpar input
    fileInput.value = '';
});

window.deleteFile = (index) => {
    if (confirm('Deseja realmente excluir este arquivo?')) {
        const fileName = currentCase.files[index].name;
        currentCase.files.splice(index, 1);
        updateCase(caseId, { files: currentCase.files });
        addTimelineItem(`Arquivo removido: ${fileName}`);
        loadFiles();
        window.ProtheticAuth.showNotification('Arquivo excluído com sucesso!', 'success');
    }
};

// ========================================
// OBSERVAÇÕES
// ========================================

saveNotesBtn.addEventListener('click', () => {
    const notes = notesTextarea.value.trim();
    currentCase.notes = notes;
    updateCase(caseId, { notes });
    addTimelineItem('Observações atualizadas');
    window.ProtheticAuth.showNotification('Observações salvas com sucesso!', 'success');
});

// ========================================
// EDITAR CASO
// ========================================

editCaseBtn.addEventListener('click', () => {
    // Por enquanto, só mostra mensagem (pode implementar modal de edição depois)
    window.ProtheticAuth.showNotification('Funcionalidade de edição em desenvolvimento', 'info');
});

// ========================================
// EXCLUIR CASO
// ========================================

deleteCaseBtn.addEventListener('click', () => {
    deleteModal.classList.add('active');
});

closeDeleteModal.addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
    }
});

confirmDeleteBtn.addEventListener('click', () => {
    deleteCase(caseId);
    window.ProtheticAuth.showNotification('Caso excluído com sucesso!', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
});

// ========================================
// INICIALIZAR
// ========================================

loadCaseDetails();
