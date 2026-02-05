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
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteCaseBtn = document.getElementById('deleteCaseBtn');
  const prosthesesContainer = document.getElementById('prosthesesContainer');
  const notification = document.getElementById('notification');

  // Nome do usuário
  if (userName) userName.textContent = currentUser.name;

  // Ocultar elementos para Operacional
  if (currentUser.role === 'operational') {
    if (metricsLink) metricsLink.style.display = 'none';
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

  const getArcadaLabel = (arcada) => {
    const labels = {
      'mandibula': '🦷 Mandíbula',
      'maxila': '🦷 Maxila',
      'ambas': '🦷 Ambas',
      'outros': '📄 Outros'
    };
    return labels[arcada] || arcada;
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

    if (patientNameEl) patientNameEl.textContent = currentCase.patientName;
    if (caseIdEl) caseIdEl.textContent = '#' + currentCase.id.slice(0, 8);

    // Contato
    const phoneEl = document.getElementById('patientPhone');
    const emailEl = document.getElementById('patientEmail');
    const cpfEl = document.getElementById('patientCPF');

    if (phoneEl) phoneEl.textContent = currentCase.patientPhone || 'Não informado';
    if (emailEl) emailEl.textContent = currentCase.patientEmail || 'Não informado';
    if (cpfEl) cpfEl.textContent = currentCase.patientCPF || 'Não informado';

    // Renderizar próteses
    renderProstheses();
  };

  // ========================================
  // RENDERIZAR PRÓTESES
  // ========================================

  const renderProstheses = () => {
    if (!prosthesesContainer) return;

    const prostheses = currentCase.prostheses || [];
    
    if (prostheses.length === 0) {
      prosthesesContainer.innerHTML = '<div class="empty-message">Nenhuma prótese cadastrada</div>';
      return;
    }

    prosthesesContainer.innerHTML = prostheses.map((prosthesis, index) => {
      return createProsthesisSection(prosthesis, index);
    }).join('');

    // Adicionar event listeners após renderizar
    attachProsthesisEventListeners();
  };

  const createProsthesisSection = (prosthesis, index) => {
    const showValue = currentUser.role === 'management';

    return `
      <div class="prosthesis-section" data-prosthesis-id="${prosthesis.id}">
        <!-- Header da Prótese -->
        <div class="prosthesis-header">
          <div class="prosthesis-title">
            <span class="prosthesis-number">Prótese ${index + 1}</span>
            <span class="prosthesis-type-label">${getTypeLabel(prosthesis.type)}</span>
          </div>
          <div class="prosthesis-badges">
            <span class="prosthesis-arcada-badge ${prosthesis.arcada}">
              ${getArcadaLabel(prosthesis.arcada)}
            </span>
            <select class="prosthesis-status-select" data-prosthesis-id="${prosthesis.id}">
              <option value="escaneamento" ${prosthesis.status === 'escaneamento' ? 'selected' : ''}>Escaneamento</option>
              <option value="planejamento" ${prosthesis.status === 'planejamento' ? 'selected' : ''}>Planejamento</option>
              <option value="impressao" ${prosthesis.status === 'impressao' ? 'selected' : ''}>Impressão</option>
              <option value="teste" ${prosthesis.status === 'teste' ? 'selected' : ''}>Teste</option>
              <option value="concluido" ${prosthesis.status === 'concluido' ? 'selected' : ''}>Concluído</option>
            </select>
          </div>
        </div>

        <!-- Conteúdo da Prótese -->
        <div class="prosthesis-content">
          <div class="prosthesis-grid">
            <!-- Coluna Principal -->
            <div class="prosthesis-main">
              <!-- Datas -->
              <div class="prosthesis-card">
                <div class="prosthesis-card-title">
                  📅 Datas Importantes
                  <button class="btn btn-secondary btn-sm edit-dates-btn" data-prosthesis-id="${prosthesis.id}">✏️ Editar</button>
                </div>
                ${renderDates(prosthesis)}
              </div>

              ${showValue ? `
                <!-- Valor -->
                <div class="prosthesis-card">
                  <div class="prosthesis-card-title">💰 Valor</div>
                  <div class="value-display">
                    ${prosthesis.value ? formatMoney(prosthesis.value) : 'Não definido'}
                  </div>
                </div>
              ` : ''}

              <!-- Arquivos -->
              <div class="prosthesis-card">
                <div class="prosthesis-card-title">
                  📎 Arquivos
                  <button class="btn btn-secondary btn-sm upload-file-btn" data-prosthesis-id="${prosthesis.id}">+ Adicionar</button>
                </div>
                <input type="file" class="hidden file-input" data-prosthesis-id="${prosthesis.id}" multiple>
                ${renderFiles(prosthesis)}
              </div>

              <!-- Observações -->
              <div class="prosthesis-card">
                <div class="prosthesis-card-title">📝 Observações</div>
                <textarea 
                  class="notes-textarea prosthesis-notes" 
                  data-prosthesis-id="${prosthesis.id}"
                  placeholder="Observações específicas desta prótese..."
                >${prosthesis.notes || ''}</textarea>
                <button class="btn btn-primary btn-sm save-notes-btn" data-prosthesis-id="${prosthesis.id}" style="margin-top: 0.75rem;">
                  Salvar Observações
                </button>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="prosthesis-sidebar">
              <!-- Timeline -->
              <div class="prosthesis-card">
                <div class="prosthesis-card-title">⏱️ Timeline</div>
                ${renderTimeline(prosthesis)}
              </div>

              <!-- Mini Calendário -->
              <div class="prosthesis-card">
                <div class="prosthesis-card-title">📆 Calendário</div>
                ${renderCalendar(prosthesis)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderDates = (prosthesis) => {
    return `
      <div class="dates-grid">
        ${prosthesis.firstConsultation ? `
          <div class="date-item">
            <div class="date-icon">📋</div>
            <div class="date-content">
              <span class="date-label">Primeira Consulta</span>
              <span class="date-value">${formatDate(prosthesis.firstConsultation)}</span>
            </div>
          </div>
        ` : ''}
        
        ${prosthesis.scanDate ? `
          <div class="date-item">
            <div class="date-icon">🔍</div>
            <div class="date-content">
              <span class="date-label">Escaneamento</span>
              <span class="date-value">${formatDate(prosthesis.scanDate)}</span>
            </div>
          </div>
        ` : ''}
        
        ${prosthesis.testDate ? `
          <div class="date-item">
            <div class="date-icon">🧪</div>
            <div class="date-content">
              <span class="date-label">Teste</span>
              <span class="date-value">${formatDate(prosthesis.testDate)}</span>
            </div>
          </div>
        ` : ''}
        
        ${prosthesis.deliveryDate ? `
          <div class="date-item">
            <div class="date-icon">✅</div>
            <div class="date-content">
              <span class="date-label">Entrega Prevista</span>
              <span class="date-value">${formatDate(prosthesis.deliveryDate)}</span>
            </div>
          </div>
        ` : ''}
        
        ${!prosthesis.firstConsultation && !prosthesis.scanDate && !prosthesis.testDate && !prosthesis.deliveryDate ? `
          <div class="empty-message">Nenhuma data definida</div>
        ` : ''}
      </div>
    `;
  };

  const renderFiles = (prosthesis) => {
    const files = prosthesis.files || [];
    
    if (files.length === 0) {
      return '<div class="empty-message">Nenhum arquivo anexado</div>';
    }

    return `
      <div class="files-list">
        ${files.map((file, fileIndex) => `
          <div class="file-item">
            <div class="file-info">
              <div class="file-icon">${getFileIcon(file.originalName || file.name)}</div>
              <div class="file-details">
                <div class="file-name">${file.originalName || file.name}</div>
                <div class="file-meta">${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}</div>
              </div>
            </div>
            <div class="file-actions">
              <button class="file-action-btn delete delete-file-btn" 
                      data-prosthesis-id="${prosthesis.id}" 
                      data-file-index="${fileIndex}">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const renderTimeline = (prosthesis) => {
    const timeline = prosthesis.timeline || [];
    
    if (timeline.length === 0) {
      return '<div class="empty-message">Nenhuma atividade</div>';
    }

    const sortedTimeline = [...timeline].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    return `
      <div class="timeline">
        ${sortedTimeline.map(item => `
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
        `).join('')}
      </div>
    `;
  };

  const renderCalendar = (prosthesis) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renderEvent = (dateValue, label, icon) => {
      if (!dateValue) return '';

      let date;
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        date = dateValue;
      }
      date.setHours(0, 0, 0, 0);

      const day = date.getDate();
      const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      let className = 'calendar-event has-date';
      if (date < today) {
        className += ' past';
      } else if (date.getTime() === today.getTime()) {
        className += ' today';
      } else {
        className += ' future';
      }

      return `
        <div class="${className}">
          <div class="calendar-event-date">${day} ${month}</div>
          <div class="calendar-event-label">${icon} ${label}</div>
        </div>
      `;
    };

    return `
      <div class="mini-calendar">
        ${renderEvent(prosthesis.firstConsultation, 'Primeira Consulta', '📋')}
        ${renderEvent(prosthesis.scanDate, 'Escaneamento', '🔍')}
        ${renderEvent(prosthesis.testDate, 'Teste', '🧪')}
        ${renderEvent(prosthesis.deliveryDate, 'Entrega', '✅')}
        ${!prosthesis.firstConsultation && !prosthesis.scanDate && !prosthesis.testDate && !prosthesis.deliveryDate ? `
          <div class="empty-message">Nenhuma data no calendário</div>
        ` : ''}
      </div>
    `;
  };

  // ========================================
  // EVENT LISTENERS DAS PRÓTESES
  // ========================================

  const attachProsthesisEventListeners = () => {
    // Status Select
    document.querySelectorAll('.prosthesis-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const newStatus = e.target.value;
        await updateProsthesisStatus(prosthesisId, newStatus);
      });
    });

    // Botões de editar datas
    document.querySelectorAll('.edit-dates-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        openEditDatesModal(prosthesisId);
      });
    });

    // Botões de upload
    document.querySelectorAll('.upload-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const fileInput = document.querySelector(`.file-input[data-prosthesis-id="${prosthesisId}"]`);
        if (fileInput) fileInput.click();
      });
    });

    // Inputs de arquivo
    document.querySelectorAll('.file-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          await uploadFilesToProsthesis(prosthesisId, files);
          e.target.value = ''; // Limpar input
        }
      });
    });

    // Botões de deletar arquivo
    document.querySelectorAll('.delete-file-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const fileIndex = parseInt(e.target.dataset.fileIndex);
        await deleteFileFromProsthesis(prosthesisId, fileIndex);
      });
    });

    // Botões de salvar observações
    document.querySelectorAll('.save-notes-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const textarea = document.querySelector(`.prosthesis-notes[data-prosthesis-id="${prosthesisId}"]`);
        if (textarea) {
          await saveProsthesisNotes(prosthesisId, textarea.value);
        }
      });
    });
  };

  // ========================================
  // ATUALIZAR STATUS DA PRÓTESE
  // ========================================

  const updateProsthesisStatus = async (prosthesisId, newStatus) => {
    try {
      const prostheses = currentCase.prostheses || [];
      const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
      
      if (prosthesisIndex === -1) {
        showNotification('Prótese não encontrada', 'error');
        return;
      }

      const oldStatus = prostheses[prosthesisIndex].status;
      
      if (oldStatus === newStatus) return;

      const statusLabels = {
        'escaneamento': 'Escaneamento',
        'planejamento': 'Planejamento',
        'impressao': 'Impressão',
        'teste': 'Teste',
        'concluido': 'Concluído'
      };

      // Atualizar status
      prostheses[prosthesisIndex].status = newStatus;

      // Adicionar à timeline
      const timelineItem = {
        action: 'status_change',
        description: `Status alterado para: ${statusLabels[newStatus]}`,
        date: new Date().toISOString(),
        user: currentUser.name,
        userId: currentUser.id
      };

      prostheses[prosthesisIndex].timeline = prostheses[prosthesisIndex].timeline || [];
      prostheses[prosthesisIndex].timeline.push(timelineItem);

      await db.collection('cases').doc(caseId).update({
        prostheses: prostheses,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showNotification('Status atualizado!', 'success');
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      showNotification('Erro ao atualizar status', 'error');
    }
  };

  // ========================================
  // MODAL DE EDITAR DATAS
  // ========================================

  const editDatesModal = document.getElementById('editDatesModal');
  const closeEditDatesModal = document.getElementById('closeEditDatesModal');
  const cancelEditDatesBtn = document.getElementById('cancelEditDatesBtn');
  const saveEditDatesBtn = document.getElementById('saveEditDatesBtn');
  const editProsthesisId = document.getElementById('editProsthesisId');
  const editFirstConsultation = document.getElementById('editFirstConsultation');
  const editScanDate = document.getElementById('editScanDate');
  const editTestDate = document.getElementById('editTestDate');
  const editDeliveryDate = document.getElementById('editDeliveryDate');

  const openEditDatesModal = (prosthesisId) => {
    const prostheses = currentCase.prostheses || [];
    const prosthesis = prostheses.find(p => p.id === prosthesisId);
    
    if (!prosthesis) return;

    // Preencher campos
    if (editProsthesisId) editProsthesisId.value = prosthesisId;
    if (editFirstConsultation) editFirstConsultation.value = prosthesis.firstConsultation || '';
    if (editScanDate) editScanDate.value = prosthesis.scanDate || '';
    if (editTestDate) editTestDate.value = prosthesis.testDate || '';
    if (editDeliveryDate) editDeliveryDate.value = prosthesis.deliveryDate || '';

    if (editDatesModal) editDatesModal.classList.add('active');
  };

  const closeEditDatesModalFunc = () => {
    if (editDatesModal) editDatesModal.classList.remove('active');
  };

  if (closeEditDatesModal) {
    closeEditDatesModal.addEventListener('click', closeEditDatesModalFunc);
  }

  if (cancelEditDatesBtn) {
    cancelEditDatesBtn.addEventListener('click', closeEditDatesModalFunc);
  }

  if (editDatesModal) {
    editDatesModal.addEventListener('click', (e) => {
      if (e.target === editDatesModal) {
        closeEditDatesModalFunc();
      }
    });
  }

  if (saveEditDatesBtn) {
    saveEditDatesBtn.addEventListener('click', async () => {
      const prosthesisId = editProsthesisId.value;
      
      try {
        const prostheses = currentCase.prostheses || [];
        const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
        
        if (prosthesisIndex === -1) {
          showNotification('Prótese não encontrada', 'error');
          return;
        }

        // Atualizar datas
        prostheses[prosthesisIndex].firstConsultation = editFirstConsultation.value || null;
        prostheses[prosthesisIndex].scanDate = editScanDate.value || null;
        prostheses[prosthesisIndex].testDate = editTestDate.value || null;
        prostheses[prosthesisIndex].deliveryDate = editDeliveryDate.value || null;

        // Adicionar à timeline
        const timelineItem = {
          action: 'dates_update',
          description: 'Datas atualizadas',
          date: new Date().toISOString(),
          user: currentUser.name,
          userId: currentUser.id
        };

        prostheses[prosthesisIndex].timeline = prostheses[prosthesisIndex].timeline || [];
        prostheses[prosthesisIndex].timeline.push(timelineItem);

        await db.collection('cases').doc(caseId).update({
          prostheses: prostheses,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Datas atualizadas!', 'success');
        closeEditDatesModalFunc();
      } catch (error) {
        console.error('❌ Erro ao atualizar datas:', error);
        showNotification('Erro ao atualizar datas', 'error');
      }
    });
  }

  // ========================================
  // UPLOAD DE ARQUIVOS
  // ========================================

  const uploadFilesToProsthesis = async (prosthesisId, files) => {
    if (files.length === 0) return;

    showNotification('Processando arquivos...', 'info');

    try {
      const prostheses = currentCase.prostheses || [];
      const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
      
      if (prosthesisIndex === -1) {
        showNotification('Prótese não encontrada', 'error');
        return;
      }

      const newFiles = files.map(file => ({
        name: `${Date.now()}-${file.name}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: '#',
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        uploadedById: currentUser.id
      }));

      // Adicionar arquivos
      prostheses[prosthesisIndex].files = prostheses[prosthesisIndex].files || [];
      prostheses[prosthesisIndex].files.push(...newFiles);

      // Adicionar à timeline
      const timelineItem = {
        action: 'files_upload',
        description: `${newFiles.length} arquivo(s) adicionado(s)`,
        date: new Date().toISOString(),
        user: currentUser.name,
        userId: currentUser.id
      };

      prostheses[prosthesisIndex].timeline = prostheses[prosthesisIndex].timeline || [];
      prostheses[prosthesisIndex].timeline.push(timelineItem);

      await db.collection('cases').doc(caseId).update({
        prostheses: prostheses,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showNotification('Arquivo(s) adicionado(s)!', 'success');
    } catch (error) {
      console.error('❌ Erro ao adicionar arquivos:', error);
      showNotification('Erro ao adicionar arquivos', 'error');
    }
  };

  // ========================================
  // DELETAR ARQUIVO
  // ========================================

  const deleteFileFromProsthesis = async (prosthesisId, fileIndex) => {
    if (!confirm('Deseja realmente excluir este arquivo?')) return;

    try {
      const prostheses = currentCase.prostheses || [];
      const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
      
      if (prosthesisIndex === -1) {
        showNotification('Prótese não encontrada', 'error');
        return;
      }

      const files = prostheses[prosthesisIndex].files || [];
      const fileName = files[fileIndex].originalName;

      // Remover arquivo
      files.splice(fileIndex, 1);
      prostheses[prosthesisIndex].files = files;

      // Adicionar à timeline
      const timelineItem = {
        action: 'file_delete',
        description: `Arquivo removido: ${fileName}`,
        date: new Date().toISOString(),
        user: currentUser.name,
        userId: currentUser.id
      };

      prostheses[prosthesisIndex].timeline = prostheses[prosthesisIndex].timeline || [];
      prostheses[prosthesisIndex].timeline.push(timelineItem);

      await db.collection('cases').doc(caseId).update({
        prostheses: prostheses,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showNotification('Arquivo excluído!', 'success');
    } catch (error) {
      console.error('❌ Erro ao excluir arquivo:', error);
      showNotification('Erro ao excluir arquivo', 'error');
    }
  };

  // ========================================
  // SALVAR OBSERVAÇÕES
  // ========================================

  const saveProsthesisNotes = async (prosthesisId, notes) => {
    try {
      const prostheses = currentCase.prostheses || [];
      const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
      
      if (prosthesisIndex === -1) {
        showNotification('Prótese não encontrada', 'error');
        return;
      }

      prostheses[prosthesisIndex].notes = notes.trim();

      // Adicionar à timeline
      const timelineItem = {
        action: 'notes_update',
        description: 'Observações atualizadas',
        date: new Date().toISOString(),
        user: currentUser.name,
        userId: currentUser.id
      };

      prostheses[prosthesisIndex].timeline = prostheses[prosthesisIndex].timeline || [];
      prostheses[prosthesisIndex].timeline.push(timelineItem);

      await db.collection('cases').doc(caseId).update({
        prostheses: prostheses,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showNotification('Observações salvas!', 'success');
    } catch (error) {
      console.error('❌ Erro ao salvar observações:', error);
      showNotification('Erro ao salvar observações', 'error');
    }
  };

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

  // ========================================
  // CARREGAR CASO (REAL-TIME)
  // ========================================

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

  console.log('✅ case-detail.js pronto!');
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseDetail);
} else {
  initCaseDetail();
}
