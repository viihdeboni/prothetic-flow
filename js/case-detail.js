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
      'gif': '🖼️',
      'webp': '🖼️',
      'heic': '🖼️',
      'stl': '🔷',
      'ply': '🔷',
      'obj': '🔷',
      '3mf': '🔷'
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
                  <span>📅 Datas Importantes</span>
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
                  <span>📎 Arquivos</span>
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
    const customDates = prosthesis.customDates || [];
    
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
        
        ${prosthesis.photoDate ? `
          <div class="date-item">
            <div class="date-icon">📸</div>
            <div class="date-content">
              <span class="date-label">Fotos</span>
              <span class="date-value">${formatDate(prosthesis.photoDate)}</span>
            </div>
          </div>
        ` : ''}
        
        ${prosthesis.moldingDate ? `
          <div class="date-item">
            <div class="date-icon">🦷</div>
            <div class="date-content">
              <span class="date-label">Moldagem</span>
              <span class="date-value">${formatDate(prosthesis.moldingDate)}</span>
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
        
        ${customDates.map((cd, index) => `
          <div class="date-item custom-date">
            <div class="date-icon">📅</div>
            <div class="date-content">
              <span class="date-label">${cd.label}</span>
              <span class="date-value">${formatDate(cd.date)}</span>
            </div>
            <button class="delete-custom-date-btn" 
                    data-prosthesis-id="${prosthesis.id}" 
                    data-date-index="${index}">🗑️</button>
          </div>
        `).join('')}
        
        ${!prosthesis.firstConsultation && !prosthesis.photoDate && !prosthesis.moldingDate && !prosthesis.scanDate && !prosthesis.testDate && !prosthesis.deliveryDate && customDates.length === 0 ? `
          <div class="empty-message">Nenhuma data definida</div>
        ` : ''}
      </div>
      
      <button class="btn btn-secondary btn-sm add-custom-date-btn" 
              data-prosthesis-id="${prosthesis.id}" 
              style="margin-top: 1rem; width: 100%;">
        ➕ Adicionar Data Personalizada
      </button>
    `;
  };

  // ========================================
  // RENDERIZAR ARQUIVOS COM CATEGORIAS
  // ========================================

  const renderFiles = (prosthesis) => {
    const files = prosthesis.files || [];
    
    // Categorizar arquivos
    const categories = {
      fotos: files.filter(f => {
        const ext = (f.originalName || f.name).split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext);
      }),
      stl: files.filter(f => {
        const ext = (f.originalName || f.name).split('.').pop().toLowerCase();
        return ['stl', 'ply', 'obj', '3mf'].includes(ext);
      }),
      maxila: files.filter(f => f.arcada === 'maxila'),
      mandibula: files.filter(f => f.arcada === 'mandibula'),
      outros: files.filter(f => {
        const ext = (f.originalName || f.name).split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext);
        const is3D = ['stl', 'ply', 'obj', '3mf'].includes(ext);
        return !isImage && !is3D && f.arcada !== 'maxila' && f.arcada !== 'mandibula';
      })
    };

    // Contar arquivos por categoria
    const counts = {
      fotos: categories.fotos.length,
      stl: categories.stl.length,
      maxila: categories.maxila.length,
      mandibula: categories.mandibula.length,
      outros: categories.outros.length
    };

    const totalFiles = files.length;

    if (totalFiles === 0) {
      return '<div class="empty-message">Nenhum arquivo anexado</div>';
    }

    return `
      <!-- Abas de Categorias -->
      <div class="file-categories-tabs">
        <button class="file-category-tab active" data-category="todos" data-prosthesis-id="${prosthesis.id}">
          📋 Todos (${totalFiles})
        </button>
        ${counts.fotos > 0 ? `
          <button class="file-category-tab" data-category="fotos" data-prosthesis-id="${prosthesis.id}">
            📸 Fotos (${counts.fotos})
          </button>
        ` : ''}
        ${counts.stl > 0 ? `
          <button class="file-category-tab" data-category="stl" data-prosthesis-id="${prosthesis.id}">
            🔷 STL/3D (${counts.stl})
          </button>
        ` : ''}
        ${counts.maxila > 0 ? `
          <button class="file-category-tab" data-category="maxila" data-prosthesis-id="${prosthesis.id}">
            🦷 Maxila (${counts.maxila})
          </button>
        ` : ''}
        ${counts.mandibula > 0 ? `
          <button class="file-category-tab" data-category="mandibula" data-prosthesis-id="${prosthesis.id}">
            🦷 Mandíbula (${counts.mandibula})
          </button>
        ` : ''}
        ${counts.outros > 0 ? `
          <button class="file-category-tab" data-category="outros" data-prosthesis-id="${prosthesis.id}">
            📄 Outros (${counts.outros})
          </button>
        ` : ''}
      </div>

      <!-- Container de Arquivos -->
      <div class="files-list-container" data-prosthesis-id="${prosthesis.id}">
        ${renderFilesList(files, 'todos', prosthesis.id)}
      </div>
    `;
  };

  const renderFilesList = (files, category, prosthesisId) => {
    let filteredFiles = files;

    // Filtrar por categoria
    if (category === 'fotos') {
      filteredFiles = files.filter(f => {
        const ext = (f.originalName || f.name).split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext);
      });
    } else if (category === 'stl') {
      filteredFiles = files.filter(f => {
        const ext = (f.originalName || f.name).split('.').pop().toLowerCase();
        return ['stl', 'ply', 'obj', '3mf'].includes(ext);
      });
    } else if (category === 'maxila') {
      filteredFiles = files.filter(f => f.arcada === 'maxila');
    } else if (category === 'mandibula') {
      filteredFiles = files.filter(f => f.arcada === 'mandibula');
    } else if (category === 'outros') {
      filteredFiles = files.filter(f => {
        const ext = (f.originalName || f.name).split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext);
        const is3D = ['stl', 'ply', 'obj', '3mf'].includes(ext);
        return !isImage && !is3D && f.arcada !== 'maxila' && f.arcada !== 'mandibula';
      });
    }

    if (filteredFiles.length === 0) {
      return '<div class="empty-message">Nenhum arquivo nesta categoria</div>';
    }

    const arcadaLabels = {
      'mandibula': 'Mandíbula',
      'maxila': 'Maxila',
      'outros': 'Outros'
    };

    return `
      <div class="files-list">
        ${filteredFiles.map((file) => {
          const fileIndex = files.indexOf(file); // Índice real no array original
          return `
            <div class="file-item">
              <div class="file-info">
                <div class="file-icon">${getFileIcon(file.originalName || file.name)}</div>
                <div class="file-details">
                  <div class="file-name">
                    ${file.originalName || file.name}
                    ${file.arcada ? 
                      `<span class="file-arcada-badge ${file.arcada}">${arcadaLabels[file.arcada] || file.arcada}</span>` 
                      : ''}
                  </div>
                  <div class="file-meta">${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}</div>
                </div>
              </div>
              <div class="file-actions">
                <button class="file-action-btn delete delete-file-btn" 
                        data-prosthesis-id="${prosthesisId}" 
                        data-file-index="${fileIndex}">🗑️</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  // ========================================
  // TROCAR CATEGORIA DE ARQUIVOS
  // ========================================

  const switchFileCategory = (prosthesisId, category) => {
    const prostheses = currentCase.prostheses || [];
    const prosthesis = prostheses.find(p => p.id === prosthesisId);
    
    if (!prosthesis) return;

    const files = prosthesis.files || [];
    
    // Atualizar abas ativas
    document.querySelectorAll(`.file-category-tab[data-prosthesis-id="${prosthesisId}"]`).forEach(tab => {
      tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.file-category-tab[data-category="${category}"][data-prosthesis-id="${prosthesisId}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Atualizar lista de arquivos
    const container = document.querySelector(`.files-list-container[data-prosthesis-id="${prosthesisId}"]`);
    if (container) {
      container.innerHTML = renderFilesList(files, category, prosthesisId);
      
      // Re-adicionar event listeners para os botões de deletar
      container.querySelectorAll('.delete-file-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const pId = e.target.dataset.prosthesisId;
          const fileIndex = parseInt(e.target.dataset.fileIndex);
          await deleteFileFromProsthesis(pId, fileIndex);
        });
      });
    }
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

    const customDates = prosthesis.customDates || [];

    return `
      <div class="mini-calendar">
        ${renderEvent(prosthesis.firstConsultation, 'Primeira Consulta', '📋')}
        ${renderEvent(prosthesis.photoDate, 'Fotos', '📸')}
        ${renderEvent(prosthesis.moldingDate, 'Moldagem', '🦷')}
        ${renderEvent(prosthesis.scanDate, 'Escaneamento', '🔍')}
        ${renderEvent(prosthesis.testDate, 'Teste', '🧪')}
        ${renderEvent(prosthesis.deliveryDate, 'Entrega', '✅')}
        ${customDates.map(cd => renderEvent(cd.date, cd.label, '📅')).join('')}
        ${!prosthesis.firstConsultation && !prosthesis.photoDate && !prosthesis.moldingDate && !prosthesis.scanDate && !prosthesis.testDate && !prosthesis.deliveryDate && customDates.length === 0 ? `
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

    // Botões de adicionar data personalizada
    document.querySelectorAll('.add-custom-date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        openAddCustomDateModal(prosthesisId);
      });
    });

    // Botões de deletar data personalizada
    document.querySelectorAll('.delete-custom-date-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const dateIndex = parseInt(e.target.dataset.dateIndex);
        await deleteCustomDate(prosthesisId, dateIndex);
      });
    });

    // Abas de categorias de arquivos
    document.querySelectorAll('.file-category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const prosthesisId = e.target.dataset.prosthesisId;
        const category = e.target.dataset.category;
        switchFileCategory(prosthesisId, category);
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
  const editPhotoDate = document.getElementById('editPhotoDate');
  const editMoldingDate = document.getElementById('editMoldingDate');
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
    if (editPhotoDate) editPhotoDate.value = prosthesis.photoDate || '';
    if (editMoldingDate) editMoldingDate.value = prosthesis.moldingDate || '';
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
        prostheses[prosthesisIndex].photoDate = editPhotoDate.value || null;
        prostheses[prosthesisIndex].moldingDate = editMoldingDate.value || null;
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
  // MODAL DE ADICIONAR DATA PERSONALIZADA
  // ========================================

  const addCustomDateModal = document.getElementById('addCustomDateModal');
  const closeAddCustomDateModal = document.getElementById('closeAddCustomDateModal');
  const cancelAddCustomDateBtn = document.getElementById('cancelAddCustomDateBtn');
  const saveAddCustomDateBtn = document.getElementById('saveAddCustomDateBtn');
  const customDateProsthesisId = document.getElementById('customDateProsthesisId');
  const customDateLabel = document.getElementById('customDateLabel');
  const customDateValue = document.getElementById('customDateValue');

  const openAddCustomDateModal = (prosthesisId) => {
    if (customDateProsthesisId) customDateProsthesisId.value = prosthesisId;
    if (customDateLabel) customDateLabel.value = '';
    if (customDateValue) customDateValue.value = '';
    
    if (addCustomDateModal) addCustomDateModal.classList.add('active');
  };

  const closeAddCustomDateModalFunc = () => {
    if (addCustomDateModal) addCustomDateModal.classList.remove('active');
  };

  if (closeAddCustomDateModal) {
    closeAddCustomDateModal.addEventListener('click', closeAddCustomDateModalFunc);
  }

  if (cancelAddCustomDateBtn) {
    cancelAddCustomDateBtn.addEventListener('click', closeAddCustomDateModalFunc);
  }

  if (addCustomDateModal) {
    addCustomDateModal.addEventListener('click', (e) => {
      if (e.target === addCustomDateModal) {
        closeAddCustomDateModalFunc();
      }
    });
  }

  if (saveAddCustomDateBtn) {
    saveAddCustomDateBtn.addEventListener('click', async () => {
      const prosthesisId = customDateProsthesisId.value;
      const label = customDateLabel.value.trim();
      const date = customDateValue.value;

      if (!label || !date) {
        showNotification('Preencha todos os campos', 'error');
        return;
      }

      try {
        const prostheses = currentCase.prostheses || [];
        const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
        
        if (prosthesisIndex === -1) {
          showNotification('Prótese não encontrada', 'error');
          return;
        }

        // Adicionar data personalizada
        prostheses[prosthesisIndex].customDates = prostheses[prosthesisIndex].customDates || [];
        prostheses[prosthesisIndex].customDates.push({
          label: label,
          date: date
        });

        // Adicionar à timeline
        const timelineItem = {
          action: 'custom_date_add',
          description: `Data adicionada: ${label}`,
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

        showNotification('Data adicionada!', 'success');
        closeAddCustomDateModalFunc();
      } catch (error) {
        console.error('❌ Erro ao adicionar data:', error);
        showNotification('Erro ao adicionar data', 'error');
      }
    });
  }

  // ========================================
  // DELETAR DATA PERSONALIZADA
  // ========================================

  const deleteCustomDate = async (prosthesisId, dateIndex) => {
    if (!confirm('Deseja realmente excluir esta data?')) return;

    try {
      const prostheses = currentCase.prostheses || [];
      const prosthesisIndex = prostheses.findIndex(p => p.id === prosthesisId);
      
      if (prosthesisIndex === -1) {
        showNotification('Prótese não encontrada', 'error');
        return;
      }

      const customDates = prostheses[prosthesisIndex].customDates || [];
      const dateLabel = customDates[dateIndex].label;

      // Remover data
      customDates.splice(dateIndex, 1);
      prostheses[prosthesisIndex].customDates = customDates;

      // Adicionar à timeline
      const timelineItem = {
        action: 'custom_date_delete',
        description: `Data removida: ${dateLabel}`,
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

      showNotification('Data excluída!', 'success');
    } catch (error) {
      console.error('❌ Erro ao excluir data:', error);
      showNotification('Erro ao excluir data', 'error');
    }
  };

  // ========================================
  // UPLOAD DE ARQUIVOS COM MODAL
  // ========================================

  let pendingFilesUpload = null;
  let pendingProsthesisId = null;

  const uploadFilesToProsthesis = async (prosthesisId, files) => {
    if (files.length === 0) return;

    // Armazenar arquivos pendentes
    pendingFilesUpload = files;
    pendingProsthesisId = prosthesisId;

    // Abrir modal de seleção
    const selectArcadaModal = document.getElementById('selectArcadaModal');
    if (selectArcadaModal) {
      selectArcadaModal.classList.add('active');
    }
  };

  // Modal de seleção de arcada
  const selectArcadaModal = document.getElementById('selectArcadaModal');
  const closeSelectArcadaModal = document.getElementById('closeSelectArcadaModal');

  if (closeSelectArcadaModal && selectArcadaModal) {
    closeSelectArcadaModal.addEventListener('click', () => {
      selectArcadaModal.classList.remove('active');
      pendingFilesUpload = null;
      pendingProsthesisId = null;
    });
  }

  if (selectArcadaModal) {
    selectArcadaModal.addEventListener('click', (e) => {
      if (e.target === selectArcadaModal) {
        selectArcadaModal.classList.remove('active');
        pendingFilesUpload = null;
        pendingProsthesisId = null;
      }
    });
  }

  // Botões de seleção de arcada
  document.querySelectorAll('.arcada-option-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const arcada = btn.dataset.arcada;
      
      if (!pendingFilesUpload || !pendingProsthesisId) {
        return;
      }

      // Fechar modal
      if (selectArcadaModal) {
        selectArcadaModal.classList.remove('active');
      }

      showNotification('Processando arquivos...', 'info');

      try {
        const prostheses = currentCase.prostheses || [];
        const prosthesisIndex = prostheses.findIndex(p => p.id === pendingProsthesisId);
        
        if (prosthesisIndex === -1) {
          showNotification('Prótese não encontrada', 'error');
          return;
        }

        const newFiles = pendingFilesUpload.map(file => ({
          name: `${Date.now()}-${file.name}`,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: '#',
          arcada: arcada,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.name,
          uploadedById: currentUser.id
        }));

        // Adicionar arquivos
        prostheses[prosthesisIndex].files = prostheses[prosthesisIndex].files || [];
        prostheses[prosthesisIndex].files.push(...newFiles);

        // Adicionar à timeline
        const arcadaLabels = {
          'mandibula': 'Mandíbula',
          'maxila': 'Maxila',
          'outros': 'Outros'
        };

        const timelineItem = {
          action: 'files_upload',
          description: `${newFiles.length} arquivo(s) adicionado(s) - ${arcadaLabels[arcada]}`,
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
        
        // Limpar arquivos pendentes
        pendingFilesUpload = null;
        pendingProsthesisId = null;

      } catch (error) {
        console.error('❌ Erro ao adicionar arquivos:', error);
        showNotification('Erro ao adicionar arquivos', 'error');
      }
    });
  });

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
