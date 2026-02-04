// ========================================
// DETALHES DO CASO - ProtheticFlow
// ========================================

console.log('📄 case-detail.js carregado');

// Proteger rota e obter usuário
let currentUser = null;
let currentCase = null;
let caseId = null;
let unsubscribe = null;

const initCaseDetail = async () => {
  currentUser = await window.ProtheticAuth?.protectRoute();
  
  if (!currentUser) {
    console.log('❌ Usuário não autenticado');
    return;
  }

  // Pegar ID do caso da URL
  const urlParams = new URLSearchParams(window.location.search);
  caseId = urlParams.get('id');

  if (!caseId) {
    window.ProtheticAuth.showNotification('Caso não encontrado', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    return;
  }

  console.log('✅ Case Detail iniciado para:', currentUser.name, '| Caso:', caseId);

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
  const statusSelect = document.getElementById('statusSelect');
  const uploadFileBtn = document.getElementById('uploadFileBtn');
  const fileInput = document.getElementById('fileInput');
  const saveNotesBtn = document.getElementById('saveNotesBtn');
  const notesTextarea = document.getElementById('notesTextarea');

  // Definir nome do usuário
  if (userName) {
    userName.textContent = currentUser.name;
  }

  // Ocultar elementos para usuário Operacional
  if (currentUser.role === 'operational') {
    if (metricsLink) metricsLink.style.display = 'none';
    if (valueCard) valueCard.style.display = 'none';
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
  // FUNÇÕES DE FORMATAÇÃO
  // ========================================

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
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
  // CARREGAR DETALHES DO CASO (REAL-TIME)
  // ========================================

  const loadCaseDetails = () => {
    console.log('🔄 Carregando detalhes do caso:', caseId);

    // Escutar mudanças em tempo real
    unsubscribe = db.collection('cases').doc(caseId).onSnapshot((doc) => {
      if (!doc.exists) {
        console.error('❌ Caso não encontrado');
        window.ProtheticAuth.showNotification('Caso não encontrado', 'error');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
        return;
      }

      currentCase = {
        id: doc.id,
        ...doc.data()
      };

      console.log('✅ Caso carregado:', currentCase);

      renderCaseDetails();
    }, (error) => {
      console.error('❌ Erro ao carregar caso:', error);
      window.ProtheticAuth.showNotification('Erro ao carregar caso', 'error');
    });
  };

  // ========================================
  // RENDERIZAR DETALHES
  // ========================================

  const renderCaseDetails = () => {
    // Breadcrumb
    document.getElementById('breadcrumbPatient').textContent = currentCase.patientName;

    // Foto do paciente
    const patientPhoto = document.getElementById('patientPhoto');
    const photoPlaceholder = document.querySelector('.photo-placeholder-detail');
    
    if (currentCase.patientPhoto) {
      patientPhoto.src = currentCase.patientPhoto;
      patientPhoto.style.display = 'block';
      if (photoPlaceholder) photoPlaceholder.style.display = 'none';
    } else {
      patientPhoto.style.display = 'none';
      if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
    }

    // Informações principais
    document.getElementById('patientName').textContent = currentCase.patientName;
    document.getElementById('caseId').textContent = '#' + currentCase.id.slice(0, 8);
    document.getElementById('caseType').textContent = getTypeLabel(currentCase.type);

    // Status
    if (statusSelect) {
      statusSelect.value = currentCase.status;
    }

    // Contato
    document.getElementById('patientPhone').textContent = currentCase.patientPhone || '';
    document.getElementById('patientEmail').textContent = currentCase.patientEmail || '';
    document.getElementById('patientCPF').textContent = currentCase.patientCPF || '';

    // Datas
    const setDate = (elementId, itemId, value) => {
      const el = document.getElementById(elementId);
      const item = document.getElementById(itemId);
      if (value) {
        if (el) el.textContent = formatDate(value);
        if (item) item.classList.remove('hidden');
      } else {
        if (item) item.classList.add('hidden');
      }
    };

    setDate('firstConsultation', 'firstConsultationItem', currentCase.firstConsultation);
    setDate('scanDate', 'scanDateItem', currentCase.scanDate);
    setDate('testDate', 'testDateItem', currentCase.testDate);
    setDate('deliveryDate', 'deliveryDateItem', currentCase.deliveryDate);

    // Valor (apenas Gerência)
    if (currentUser.role === 'management') {
      const valueEl = document.getElementById('caseValue');
      if (valueEl) {
        valueEl.textContent = currentCase.value ? formatMoney(currentCase.value) : '';
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

  // ========================================
  // TIMELINE
  // ========================================

  const loadTimeline = () => {
    const timeline = document.getElementById('timeline');
    
    if (!currentCase.timeline || currentCase.timeline.length === 0) {
      if (timeline) {
        timeline.innerHTML = '<div class="empty-message">Nenhuma atividade registrada</div>';
      }
      return;
    }

    // Ordenar timeline (mais recente primeiro)
    const sortedTimeline = [...currentCase.timeline].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });

    if (timeline) {
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
    }
  };

  const addTimelineItem = async (description) => {
    try {
      const newTimelineItem = {
        action: 'update',
        description: description,
        date: new Date().toISOString(), // ← MUDOU AQUI!
        user: currentUser.name,
        userId: currentUser.id
      };

      await db.collection('cases').doc(caseId).update({
        timeline: firebase.firestore.FieldValue.arrayUnion(newTimelineItem),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Timeline atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar timeline:', error);
    }
  };

  // ========================================
  // MUDANÇA DE STATUS
  // ========================================

  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
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

        try {
          await db.collection('cases').doc(caseId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          await addTimelineItem(`Status alterado para: ${statusLabels[newStatus]}`);
          window.ProtheticAuth.showNotification('Status atualizado com sucesso!', 'success');
        } catch (error) {
          console.error('❌ Erro ao atualizar status:', error);
          window.ProtheticAuth.showNotification('Erro ao atualizar status', 'error');
          statusSelect.value = oldStatus;
        }
      }
    });
  }

  // ========================================
  // ARQUIVOS
  // ========================================

  const loadFiles = () => {
    const filesList = document.getElementById('filesList');

    if (!currentCase.files || currentCase.files.length === 0) {
      if (filesList) {
        filesList.innerHTML = '<div class="empty-message">Nenhum arquivo anexado ainda</div>';
      }
      return;
    }

    if (filesList) {
      filesList.innerHTML = currentCase.files.map((file, index) => `
        <div class="file-item">
          <div class="file-info">
            <div class="file-icon">${getFileIcon(file.originalName || file.name)}</div>
            <div class="file-details">
              <div class="file-name">${file.originalName || file.name}</div>
              <div class="file-meta">${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}</div>
            </div>
          </div>
          <div class="file-actions">
            <button class="file-action-btn delete" onclick="window.deleteFile(${index})">🗑️</button>
          </div>
        </div>
      `).join('');
    }
  };

  if (uploadFileBtn && fileInput) {
    uploadFileBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);

      if (files.length === 0) return;

      window.ProtheticAuth.showNotification('Processando arquivos...', 'info');

      try {
        const newFiles = [];

        for (const file of files) {
          // Validar tamanho (máximo 100MB para STL)
          if (file.size > 100 * 1024 * 1024) {
            window.ProtheticAuth.showNotification(`Arquivo ${file.name} muito grande (máx 100MB)`, 'error');
            continue;
          }

          // Simular upload (em produção, usaria R2)
          const result = await window.R2Upload.uploadFile(file, 'cases');

          if (result.success) {
            newFiles.push({
              name: result.fileName,
              originalName: result.originalName,
              size: result.size,
              type: result.type,
              url: result.url,
              uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
              uploadedBy: currentUser.name,
              uploadedById: currentUser.id
            });
          }
        }

        if (newFiles.length > 0) {
          await db.collection('cases').doc(caseId).update({
            files: firebase.firestore.FieldValue.arrayUnion(...newFiles),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          await addTimelineItem(`${newFiles.length} arquivo(s) adicionado(s)`);
          window.ProtheticAuth.showNotification('Arquivo(s) adicionado(s) com sucesso!', 'success');
        }

        fileInput.value = '';
      } catch (error) {
        console.error('❌ Erro ao adicionar arquivos:', error);
        window.ProtheticAuth.showNotification('Erro ao adicionar arquivos', 'error');
      }
    });
  }

  window.deleteFile = async (index) => {
    if (!confirm('Deseja realmente excluir este arquivo?')) return;

    try {
      const fileName = currentCase.files[index].originalName || currentCase.files[index].name;
      const newFiles = currentCase.files.filter((_, i) => i !== index);

      await db.collection('cases').doc(caseId).update({
        files: newFiles,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await addTimelineItem(`Arquivo removido: ${fileName}`);
      window.ProtheticAuth.showNotification('Arquivo excluído com sucesso!', 'success');
    } catch (error) {
      console.error('❌ Erro ao excluir arquivo:', error);
      window.ProtheticAuth.showNotification('Erro ao excluir arquivo', 'error');
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
        window.ProtheticAuth.showNotification('Observações salvas com sucesso!', 'success');
      } catch (error) {
        console.error('❌ Erro ao salvar observações:', error);
        window.ProtheticAuth.showNotification('Erro ao salvar observações', 'error');
      }
    });
  }

  // ========================================
  // EXCLUIR CASO COMPLETO
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
      console.log('🗑️ Excluindo caso completo:', caseId);

      try {
        // Excluir do Firestore
        await db.collection('cases').doc(caseId).delete();

        console.log('✅ Caso excluído do Firebase');
        
        // Em produção, aqui você também excluiria os arquivos do R2
        // Por enquanto, apenas marca como excluído
        
        window.ProtheticAuth.showNotification('Caso excluído completamente!', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } catch (error) {
        console.error('❌ Erro ao excluir caso:', error);
        window.ProtheticAuth.showNotification('Erro ao excluir caso', 'error');
      }
    });
  }

  // ========================================
  // INICIALIZAR
  // ========================================

  loadCaseDetails();

  // Limpar listener ao sair
  window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseDetail);
} else {
  initCaseDetail();
}
