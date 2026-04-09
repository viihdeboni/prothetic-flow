// ========================================
// AGENDA - ProtheticFlow
// ========================================

console.log('📅 agenda.js carregado');

const initAgenda = async () => {
  // Aguardar Firebase
  while (!window.FirebaseApp?.auth || !window.FirebaseApp?.db) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const auth = window.FirebaseApp.auth;
  const db   = window.FirebaseApp.db;

  // Auth
  const currentUser = await new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged(async (authUser) => {
      unsub();
      if (!authUser) { window.location.href = 'index.html'; resolve(null); return; }
      try {
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        resolve({ id: authUser.uid, email: authUser.email, ...userDoc.data() });
      } catch {
        window.location.href = 'index.html';
        resolve(null);
      }
    });
  });
  if (!currentUser) return;

  // ========================================
  // ELEMENTOS DO DOM
  // ========================================

  const userNameEl          = document.getElementById('userName');
  const logoutBtn           = document.getElementById('logoutBtn');
  const metricsLink         = document.getElementById('metricsLink');
  const newAppointmentBtn   = document.getElementById('newAppointmentBtn');
  const calendarGrid        = document.getElementById('calendarGrid');
  const calMonthLabel       = document.getElementById('calMonthLabel');
  const prevMonthBtn        = document.getElementById('prevMonth');
  const nextMonthBtn        = document.getElementById('nextMonth');
  const appointmentsList    = document.getElementById('appointmentsList');
  const appointmentsEmpty   = document.getElementById('appointmentsEmpty');
  const appointmentsDayTitle = document.getElementById('appointmentsDayTitle');
  const appointmentsCount   = document.getElementById('appointmentsCount');
  const notification        = document.getElementById('notification');

  // Modal agendamento
  const appointmentModal = document.getElementById('appointmentModal');
  const modalTitle       = document.getElementById('modalTitle');
  const closeModal       = document.getElementById('closeModal');
  const cancelModal      = document.getElementById('cancelModal');
  const appointmentForm  = document.getElementById('appointmentForm');
  const apptDate         = document.getElementById('apptDate');
  const apptTime         = document.getElementById('apptTime');
  const apptPatient      = document.getElementById('apptPatient');
  const apptCase         = document.getElementById('apptCase');
  const apptStatus       = document.getElementById('apptStatus');
  const apptNotes        = document.getElementById('apptNotes');

  // Modal delete
  const deleteModal       = document.getElementById('deleteModal');
  const closeDeleteModal  = document.getElementById('closeDeleteModal');
  const cancelDelete      = document.getElementById('cancelDelete');
  const confirmDelete     = document.getElementById('confirmDelete');
  const deletePatientName = document.getElementById('deletePatientName');

  if (userNameEl) userNameEl.textContent = currentUser.name;
  if (currentUser.role === 'operational' && metricsLink) metricsLink.style.display = 'none';

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }

  // ========================================
  // ESTADO
  // ========================================

  let currentViewDate  = new Date();  // mês/ano do calendário
  let selectedDate     = null;        // dia clicado (string YYYY-MM-DD)
  let allAppointments  = [];          // todos agendamentos carregados
  let editingId        = null;        // id do agendamento em edição
  let deletingId       = null;        // id do agendamento a excluir
  let allCases         = [];          // casos para vincular

  // ========================================
  // NOTIFICAÇÕES
  // ========================================

  const showNotification = (msg, type = 'success') => {
    if (!notification) return;
    notification.textContent = msg;
    notification.className = `notification ${type} active`;
    setTimeout(() => { notification.className = 'notification'; }, 3500);
  };

  // ========================================
  // FORMATAR DATA
  // ========================================

  const toDateStr = (date) => {
    // Retorna YYYY-MM-DD no fuso local
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateBR = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const MONTHS_PT = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  const WEEKDAYS_PT = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

  const formatDayTitle = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return `${WEEKDAYS_PT[date.getDay()]}, ${d} de ${MONTHS_PT[m - 1]}`;
  };

  // ========================================
  // STATUS BADGE
  // ========================================

  const STATUS_CONFIG = {
    agendado:   { label: 'Agendado',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    confirmado: { label: 'Confirmado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    realizado:  { label: 'Realizado',  color: '#6d28d9', bg: 'rgba(139,92,246,0.1)' },
    cancelado:  { label: 'Cancelado',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
    faltou:     { label: 'Faltou',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  };

  const getStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
    return `<span class="appt-status-badge" style="color:${cfg.color};background:${cfg.bg}">${cfg.label}</span>`;
  };

  // ========================================
  // CALENDÁRIO
  // ========================================

  const buildCalendar = () => {
    const year  = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    calMonthLabel.textContent = `${MONTHS_PT[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = toDateStr(new Date());

    // Agrupar appointments por data
    const apptsByDate = {};
    allAppointments.forEach(a => {
      if (!apptsByDate[a.date]) apptsByDate[a.date] = [];
      apptsByDate[a.date].push(a);
    });

    let html = '';

    // Células vazias antes do dia 1
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day cal-day-empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday    = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const appts      = apptsByDate[dateStr] || [];
      const hasAppts   = appts.length > 0;

      const classes = [
        'cal-day',
        isToday    ? 'cal-day-today'    : '',
        isSelected ? 'cal-day-selected' : '',
        hasAppts   ? 'cal-day-has-appts' : '',
      ].filter(Boolean).join(' ');

      let dotsHtml = '';
      if (hasAppts) {
        const max = Math.min(appts.length, 3);
        for (let i = 0; i < max; i++) {
          const cfg = STATUS_CONFIG[appts[i].status] || { color: '#3b82f6' };
          dotsHtml += `<span class="cal-dot" style="background:${cfg.color}"></span>`;
        }
      }

      html += `
        <div class="${classes}" data-date="${dateStr}">
          <span class="cal-day-num">${d}</span>
          <div class="cal-dots">${dotsHtml}</div>
        </div>
      `;
    }

    calendarGrid.innerHTML = html;

    // Eventos de clique nos dias
    calendarGrid.querySelectorAll('.cal-day[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        selectedDate = el.dataset.date;
        buildCalendar();         // re-renderiza pra atualizar selected
        renderDayAppointments();
      });
    });
  };

  prevMonthBtn.addEventListener('click', () => {
    currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
    buildCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
    buildCalendar();
  });

  // ========================================
  // LISTA DO DIA
  // ========================================

  const renderDayAppointments = () => {
    if (!selectedDate) {
      appointmentsDayTitle.textContent = 'Selecione um dia';
      appointmentsCount.textContent = '';
      appointmentsList.innerHTML = '';
      appointmentsList.appendChild(appointmentsEmpty);
      appointmentsEmpty.classList.remove('hidden');
      return;
    }

    const dayAppts = allAppointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    appointmentsDayTitle.textContent = formatDayTitle(selectedDate);
    appointmentsCount.textContent = dayAppts.length > 0 ? `${dayAppts.length} agendamento(s)` : '';

    if (dayAppts.length === 0) {
      appointmentsList.innerHTML = '';
      appointmentsList.appendChild(appointmentsEmpty);
      appointmentsEmpty.classList.remove('hidden');
      return;
    }

    appointmentsEmpty.classList.add('hidden');

    appointmentsList.innerHTML = dayAppts.map(a => {
      const linkedCase = a.caseId ? allCases.find(c => c.id === a.caseId) : null;
      const caseLink = linkedCase
        ? `<a href="case-detail.html?id=${linkedCase.id}" class="appt-case-link">🦷 ${linkedCase.patientName}</a>`
        : '';
      return `
        <div class="appt-card" data-id="${a.id}">
          <div class="appt-time-col">
            <span class="appt-time">${a.time || '--:--'}</span>
          </div>
          <div class="appt-info-col">
            <div class="appt-patient">${a.patientName}</div>
            ${caseLink}
            ${a.notes ? `<div class="appt-notes">${a.notes}</div>` : ''}
          </div>
          <div class="appt-actions-col">
            ${getStatusBadge(a.status)}
            <div class="appt-btns">
              <button class="appt-btn appt-btn-edit" data-id="${a.id}" title="Editar">✏️</button>
              <button class="appt-btn appt-btn-delete" data-id="${a.id}" title="Excluir">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Eventos editar/excluir
    appointmentsList.querySelectorAll('.appt-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    appointmentsList.querySelectorAll('.appt-btn-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
  };

  // ========================================
  // MODAL AGENDAMENTO
  // ========================================

  const openNewModal = () => {
    editingId = null;
    modalTitle.textContent = 'Novo Agendamento';
    appointmentForm.reset();
    apptDate.value = selectedDate || toDateStr(new Date());
    appointmentModal.classList.add('active');
  };

  const openEditModal = (id) => {
    const appt = allAppointments.find(a => a.id === id);
    if (!appt) return;
    editingId = id;
    modalTitle.textContent = 'Editar Agendamento';
    apptDate.value    = appt.date    || '';
    apptTime.value    = appt.time    || '';
    apptPatient.value = appt.patientName || '';
    apptCase.value    = appt.caseId  || '';
    apptStatus.value  = appt.status  || 'agendado';
    apptNotes.value   = appt.notes   || '';
    appointmentModal.classList.add('active');
  };

  const closeAppointmentModal = () => {
    appointmentModal.classList.remove('active');
    editingId = null;
  };

  newAppointmentBtn.addEventListener('click', openNewModal);
  closeModal.addEventListener('click', closeAppointmentModal);
  cancelModal.addEventListener('click', closeAppointmentModal);
  appointmentModal.addEventListener('click', (e) => {
    if (e.target === appointmentModal) closeAppointmentModal();
  });

  // ========================================
  // SALVAR AGENDAMENTO
  // ========================================

  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      date:        apptDate.value,
      time:        apptTime.value,
      patientName: apptPatient.value.trim(),
      caseId:      apptCase.value || null,
      status:      apptStatus.value,
      notes:       apptNotes.value.trim() || null,
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Sanitizar undefined
    const sanitized = JSON.parse(JSON.stringify(data));

    try {
      if (editingId) {
        await db.collection('appointments').doc(editingId).update(sanitized);
        showNotification('Agendamento atualizado!', 'success');
      } else {
        sanitized.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('appointments').add(sanitized);
        showNotification('Agendamento criado!', 'success');
      }
      closeAppointmentModal();
      // Seleciona o dia salvo no calendário
      selectedDate = data.date;
      const [y, m] = data.date.split('-').map(Number);
      currentViewDate = new Date(y, m - 1, 1);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      showNotification('Erro ao salvar. Tente novamente.', 'error');
    }
  });

  // ========================================
  // MODAL DELETE
  // ========================================

  const openDeleteModal = (id) => {
    const appt = allAppointments.find(a => a.id === id);
    if (!appt) return;
    deletingId = id;
    deletePatientName.textContent = appt.patientName;
    deleteModal.classList.add('active');
  };

  const closeDeleteModalFn = () => {
    deleteModal.classList.remove('active');
    deletingId = null;
  };

  closeDeleteModal.addEventListener('click', closeDeleteModalFn);
  cancelDelete.addEventListener('click', closeDeleteModalFn);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModalFn();
  });

  confirmDelete.addEventListener('click', async () => {
    if (!deletingId) return;
    try {
      await db.collection('appointments').doc(deletingId).delete();
      showNotification('Agendamento excluído.', 'success');
      closeDeleteModalFn();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      showNotification('Erro ao excluir. Tente novamente.', 'error');
    }
  });

  // ========================================
  // CARREGAR CASOS (para o select)
  // ========================================

  const loadCases = async () => {
    try {
      const snap = await db.collection('cases').orderBy('createdAt', 'desc').get();
      allCases = [];
      snap.forEach(doc => allCases.push({ id: doc.id, ...doc.data() }));

      // Preencher select
      apptCase.innerHTML = '<option value="">— Sem caso vinculado —</option>';
      allCases.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.patientName;
        apptCase.appendChild(opt);
      });
    } catch (err) {
      console.error('Erro ao carregar casos:', err);
    }
  };

  // ========================================
  // CARREGAR AGENDAMENTOS (REAL-TIME)
  // ========================================

  const loadAppointments = () => {
    db.collection('appointments')
      .orderBy('date', 'asc')
      .onSnapshot((snapshot) => {
        allAppointments = [];
        snapshot.forEach(doc => allAppointments.push({ id: doc.id, ...doc.data() }));
        buildCalendar();
        renderDayAppointments();
      }, (err) => {
        console.error('Erro ao carregar agenda:', err);
      });
  };

  // ========================================
  // INICIALIZAR
  // ========================================

  selectedDate = toDateStr(new Date()); // começa no dia de hoje
  await loadCases();
  loadAppointments();

  console.log('✅ Agenda pronta!');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgenda);
} else {
  initAgenda();
}
