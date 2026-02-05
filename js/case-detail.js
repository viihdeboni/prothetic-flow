// ========================================
// DETALHES DO CASO - ProtheticFlow
// ========================================

console.log('📄 case-detail.js carregado');

// ========================================
// INICIALIZAR
// ========================================

const initCaseDetail = async () => {
  // Pegar ID do caso da URL
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  if (!caseId) {
    alert('Caso não encontrado');
    window.location.href = 'dashboard.html';
    return;
  }

  console.log('📋 Caso ID:', caseId);

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

  // ========================================
  // ELEMENTOS DO DOM
  // ========================================

  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const metricsLink = document.getElementById('metricsLink');
  const valueCard = document.getElementById('valueCard');
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteCaseBtn = document.getElementById('deleteCaseBtn');
  const statusSelect = document.getElementById('statusSelect');
  const uploadFileBtn = document.getElementById('uploadFileBtn');
  const fileInput = document.getElementById('fileInput');
  const saveNotesBtn = document.getElementById('saveNotesBtn');
  const notesTextarea = document.getElementById('notesTextarea');
  const notification = document.getElementById('notification');

  // Nome do usuário
  if (userName) userName.textContent = currentUser.name;

  // Ocultar elementos para Operacional
  if (currentUser.role === 'operational') {
    if (metricsLink) metricsLink.style.display = 'none';
    if (valueCard) valueCard.style.display = 'none';
  }

  // ========================================
  // NOTIFICAÇÃO
  // ========================================

  const showNotification = (message, type = 'info') => {
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    setTimeout(() => notification.classList.remove('active'), 3000);
  };

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }

  // ========================================
  // FORMATAÇÃO
  // ========================================

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    
    let date;
    if (dateValue.toDate) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return '';
    }
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return '';
    
    let date;
    if (dateValue.toDate) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return '';
    }
    
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
  // ARCADAS - TABS
  // ========================================

  let currentArcada = 'todos';

  const tabTodos = document.getElementById('tabTodos');
  const tabMandibula = document.getElementById('tabMandibula');
  const tabMaxila = document.getElementById('tabMaxila');
  const tabOutros = document.getElementById('tabOutros');

  const switchArcadaTab = (arcada) => {
    currentArcada = arcada;
    
    // Atualizar tabs
    [tabTodos, tabMandibula, tabMaxila, tabOutros].forEach(tab => {
      if (tab) tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-arcada="${arcada}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Recarregar arquivos filtrados
    loadFiles();
  };

  if (tabTodos) tabTodos.addEventListener('click', () => switchArcadaTab('todos'));
  if (tabMandibula) tabMandibula.addEventListener('click', () => switchArcadaTab('mandibula'));
  if (tabMaxila) tabMaxila.addEventListener('click', () => switchArcadaTab('maxila'));
  if (tabOutros) tabOutros.addEventListener('click', () => switchArcadaTab('outros'));

  // ========================================
  // CARREGAR CASO (REAL-TIME)
  // ========================================

  let currentCase = null;

  const renderCaseDetails = () => {
    console.log('🎨 Renderizando caso:', currentCase);

    // Breadcrumb
    const breadcrumb = document.getElementById('breadcrumbPatient');
    if (breadcrumb) breadcrumb.textContent = currentCase.patientName;

    // Foto
    const patientPhoto = document.getElementById('patientPhoto');
    const photoPlaceholder = document.querySelector('.photo-placeholder-detail');
    
    if (currentCase.patientPhoto) {
      if (patientPhoto) {
        patientPhoto.src = currentCase.patientPhoto;
        patientPhoto.style.display = 'block';
      }
      if (photoPlaceholder) photoPlaceholder.style.display = 'none';
    } else {
      if (patientPhoto) patientPhoto.style.display = 'none';
      if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
    }

    // Info principal
    const patientNameEl = document.getElementById('patientName');
    const caseIdEl = document.getElementById('caseId');
    const caseTypeEl = document.getElementById('caseType');

    if (patientNameEl) patientNameEl.textContent = currentCase.patientName;
    if (caseIdEl) caseIdEl.textContent = '#' + currentCase.id.slice(0, 8);
    if (caseTypeEl) caseTypeEl.textContent = getTypeLabel(currentCase.type);

    // Status
    if (statusSelect) statusSelect.value = currentCase.status;

    // Contato
    const phoneEl = document.getElementById('patientPhone');
    const emailEl = document.getElementById('patientEmail');
    const cpfEl = document.getElementById('patientCPF');

    if (phoneEl) phoneEl.textContent = currentCase.patientPhone || 'Não informado';
    if (emailEl) emailEl.textContent = currentCase.patientEmail || 'Não informado';
    if (cpfEl) cpfEl.textContent = currentCase.patientCPF || 'Não informado';

    // Datas
    const setDate = (elementId, itemId, value) => {
      const el = document.getElementById(elementId);
      const item = document.getElementById(itemId);
      if (value) {
        if (el) el.textContent = formatDate(value);
        if (item) item.style.display = 'flex';
      } else {
        if (item) item.style.display = 'none';
      }
    };

    setDate('firstConsultation', 'firstConsultationItem', currentCase.firstConsultation);
    setDate('scanDate', 'scanDateItem', currentCase.scanDate);
    setDate('testDate', 'testDateItem', currentCase.testDate);
    setDate('deliveryDate', 'deliveryDateItem', currentCase.deliveryDate);

    // Valor
    if (currentUser.role === 'management') {
      const valueEl = document.getElementById('caseValue');
      if (valueEl) {
        valueEl.textContent = currentCase.value ? formatMoney(currentCase.value) : 'Não definido';
      }
    }

    // Observações
    if (notesTextarea) {
      notesTextarea.value = currentCase.notes || '';
    }

    // Arquivos
    loadFiles();

    // Timeline
    loadTimeline();
  };

  const loadFiles = () => {
    const filesList = document.getElementById('filesList');
    if (!filesList) return;

    if (!currentCase.files || currentCase.files.length === 0) {
      filesList.innerHTML = '<div class="empty-message">Nenhum arquivo anexado ainda</div>';
      return;
    }

    // Filtrar por arcada
    let filteredFiles = currentCase.files;
    if (currentArcada !== 'todos') {
      filteredFiles = currentCase.files.filter(f => f.arcada === currentArcada);
    }

    if (filteredFiles.length === 0) {
      filesList.innerHTML = `<div class="empty-message">Nenhum arquivo nesta categoria</div>`;
      return;
    }

    const arcadaLabels = {
      'mandibula': 'Mandíbula',
      'maxila': 'Maxila',
      'outros': 'Outros'
    };

    filesList.innerHTML = filteredFiles.map((file, index) => {
      const realIndex = currentCase.files.indexOf(file);
      return `
        <div class="file-item">
          <div class="file-info">
            <div class="file-icon">${getFileIcon(file.originalName || file.name)}</div>
            <div class="file-details">
              <div class="file-name">
                ${file.originalName || file.name}
                ${file.arcada && file.arcada !== 'outros' ? `<span class="file-arcada-badge ${file.arcada}">${arcadaLabels[file.arcada]}</span>` : ''}
              </div>
              <div class="file-meta">${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}</div>
            </div>
          </div>
          <div class="file-actions">
            <button class="file-action-btn delete" onclick="deleteFile(${realIndex})">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  };

  const loadTimeline = () => {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;
    
    if (!currentCase.timeline || currentCase.timeline.length === 0) {
      timeline.innerHTML = '<div class="empty-message">Nenhuma atividade registrada</div>';
      return;
    }

    const sortedTimeline = [...currentCase.timeline].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    timeline.innerHTML = sortedTimeline.map(item => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-action">${item.description}</div>
          <div class="timeline-meta">
            <span>${item.user || 'Sistema'}</span>
            <span>${formatDateTime(item.date)}</span>
          </div>
        </div>
      </div>
    `).join('');
  };

  const addTimelineItem = async (description) => {
    try {
      const newItem = {
        action: 'update',
        description: description,
        date: new Date().toISOString(),
        user: currentUser.name,
        userId: currentUser.id
      };

      await db.collection('cases').doc(caseId).update({
        timeline: firebase.firestore.FieldValue.arrayUnion(newItem),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Timeline atualizada');
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  // Carregar caso
  db.collection('cases').doc(caseId).onSnapshot((doc) => {
    if (!doc.exists) {
      showNotification('Caso não encontrado', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
      return;
    }

    currentCase = {
      id: doc.id,
      ...doc.data()
    };

    console.log('✅ Caso carregado:', currentCase);
    renderCaseDetails();
  });

  // ========================================
  // MUDANÇA DE STATUS
  // ========================================

  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      const oldStatus = currentCase.status;

      if (newStatus === oldStatus) return;

      const labels = {
        'escaneamento': 'Escaneamento',
        'planejamento': 'Planejamento',
        'impressao': 'Impressão',
        'teste': 'Teste',
        'concluido': 'Concluído'
      };

      try {
        await db.collection('cases').doc(caseId).update({
          status: newStatus,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await addTimelineItem(`Status alterado para: ${labels[newStatus]}`);
        showNotification('Status atualizado!', 'success');
      } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao atualizar status', 'error');
        statusSelect.value = oldStatus;
      }
    });
  }

  // ========================================
  // ARQUIVOS
  // ========================================

  if (uploadFileBtn && fileInput) {
    uploadFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      // Perguntar arcada
      const arcada = prompt('Para qual arcada são esses arquivos?\n\n1 - Mandíbula\n2 - Maxila\n3 - Outros\n\nDigite o número:');
      
      let arcadaValue = 'outros';
      if (arcada === '1') arcadaValue = 'mandibula';
      else if (arcada === '2') arcadaValue = 'maxila';

      showNotification('Processando arquivos...', 'info');

      try {
        const newFiles = files.map(file => ({
          name: `${Date.now()}-${file.name}`,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: '#',
          arcada: arcadaValue,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.name,
          uploadedById: currentUser.id
        }));

        await db.collection('cases').doc(caseId).update({
          files: firebase.firestore.FieldValue.arrayUnion(...newFiles),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const arcadaLabel = arcadaValue === 'mandibula' ? 'Mandíbula' : arcadaValue === 'maxila' ? 'Maxila' : 'Outros';
        await addTimelineItem(`${newFiles.length} arquivo(s) adicionado(s) - ${arcadaLabel}`);
        showNotification('Arquivo(s) adicionado(s)!', 'success');
        fileInput.value = '';
      } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao adicionar arquivos', 'error');
      }
    });
  }

  window.deleteFile = async (index) => {
    if (!confirm('Deseja realmente excluir este arquivo?')) return;

    try {
      const fileName = currentCase.files[index].originalName;
      const newFiles = currentCase.files.filter((_, i) => i !== index);

      await db.collection('cases').doc(caseId).update({
        files: newFiles,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await addTimelineItem(`Arquivo removido: ${fileName}`);
      showNotification('Arquivo excluído!', 'success');
    } catch (error) {
      console.error('❌ Erro:', error);
      showNotification('Erro ao excluir arquivo', 'error');
    }
  };

  // ========================================
  // OBSERVAÇÕES
  // ========================================

  if (saveNotesBtn && notesTextarea) {
    saveNotesBtn.addEventListener('click', async () => {
      const notes = notesTextarea.value.trim();

      try {
        await db.collection('cases').doc(caseId).update({
          notes: notes,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await addTimelineItem('Observações atualizadas');
        showNotification('Observações salvas!', 'success');
      } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao salvar observações', 'error');
      }
    });
  }

  // ========================================
  // EXCLUIR CASO
  // ========================================

  if (deleteCaseBtn && deleteModal) {
    deleteCaseBtn.addEventListener('click', () => {
      deleteModal.classList.add('active');
    });
  }

  if (closeDeleteModal && deleteModal) {
    closeDeleteModal.addEventListener('click', () => {
      deleteModal.classList.remove('active');
    });
  }

  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener('click', () => {
      deleteModal.classList.remove('active');
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
      }
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      console.log('🗑️ Excluindo caso:', caseId);

      try {
        await db.collection('cases').doc(caseId).delete();
        
        console.log('✅ Caso excluído');
        showNotification('Caso excluído completamente!', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao excluir caso', 'error');
      }
    });
  }

  console.log('✅ case-detail.js pronto!');
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseDetail);
} else {
  initCaseDetail();
}
