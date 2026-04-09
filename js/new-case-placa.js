// ========================================
// CRIAR NOVO CASO DE PLACA - ProtheticFlow
// ========================================

console.log('🦴 new-case-placa.js carregado');

const initNewCasePlaca = async () => {
  while (!window.FirebaseApp?.auth || !window.FirebaseApp?.db) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const auth = window.FirebaseApp.auth;
  const db   = window.FirebaseApp.db;

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
  const newCaseForm         = document.getElementById('newCaseForm');
  const photoPreview        = document.getElementById('photoPreview');
  const photoPreviewImg     = document.getElementById('photoPreviewImg');
  const patientPhoto        = document.getElementById('patientPhoto');
  const uploadPhotoBtn      = document.getElementById('uploadPhotoBtn');
  const removePhotoBtn      = document.getElementById('removePhotoBtn');
  const prosthesesContainer = document.getElementById('prosthesesContainer');
  const addProsthesisBtn    = document.getElementById('addProsthesisBtn');
  const prosthesisSummary   = document.getElementById('prosthesisSummary');
  const notification        = document.getElementById('notification');

  if (userNameEl) userNameEl.textContent = currentUser.name;
  if (currentUser.role === 'operational' && metricsLink) metricsLink.style.display = 'none';

  // ========================================
  // NOTIFICAÇÃO
  // ========================================

  const showNotification = (message, type = 'info') => {
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    setTimeout(() => notification.classList.remove('active'), 3000);
  };

  // ========================================
  // LOGOUT
  // ========================================

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }

  // ========================================
  // UPLOAD DE FOTO
  // ========================================

  let photoBase64 = null;

  if (uploadPhotoBtn && patientPhoto) {
    uploadPhotoBtn.addEventListener('click', () => patientPhoto.click());
  }

  if (photoPreview && patientPhoto) {
    photoPreview.addEventListener('click', () => { if (!photoBase64) patientPhoto.click(); });
  }

  if (patientPhoto && photoPreviewImg && removePhotoBtn) {
    patientPhoto.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { showNotification('Selecione uma imagem válida', 'error'); return; }
      if (file.size > 5 * 1024 * 1024) { showNotification('A imagem deve ter no máximo 5MB', 'error'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        photoBase64 = ev.target.result;
        photoPreviewImg.src = photoBase64;
        photoPreviewImg.classList.remove('hidden');
        removePhotoBtn.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });

    removePhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoBase64 = null;
      photoPreviewImg.src = '';
      photoPreviewImg.classList.add('hidden');
      patientPhoto.value = '';
      removePhotoBtn.classList.add('hidden');
    });
  }

  // ========================================
  // MÁSCARAS
  // ========================================

  const phoneInput = document.getElementById('patientPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/^(\d{2})(\d)/, '($1) $2');
      v = v.replace(/(\d)(\d{4})$/, '$1-$2');
      e.target.value = v;
    });
  }

  const cpfInput = document.getElementById('patientCPF');
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  // ========================================
  // GERENCIAR PLACAS
  // ========================================

  let prosthesesCount = 0;
  let prosthesesData  = [];

  const generateId = () => 'prot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const updateSummary = () => {
    const count = prosthesesData.length;
    if (prosthesisSummary) {
      prosthesisSummary.textContent = count === 1 ? '1 placa' : `${count} placas`;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'placa-funcional':     'Placa Funcional',
      'placa-miorrelaxante': 'Placa Miorrelaxante',
      'placa-clareamento':   'Placa de Clareamento',
    };
    return labels[type] || type;
  };

  const createProsthesisCard = (prosthesisId, number) => {
    const card = document.createElement('div');
    card.className = 'prosthesis-card';
    card.dataset.prosthesisId = prosthesisId;

    const showValueField = currentUser.role === 'management';

    card.innerHTML = `
      <div class="prosthesis-card-header">
        <div class="prosthesis-number">
          <span>🦴</span>
          <span>Placa ${number}</span>
        </div>
        ${prosthesesData.length > 1 ? `
          <button type="button" class="remove-prosthesis-btn" data-prosthesis-id="${prosthesisId}">
            🗑️ Remover
          </button>
        ` : ''}
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tipo de Placa *</label>
          <select class="prosthesis-type" required>
            <option value="">Selecione o tipo...</option>
            <option value="placa-funcional">Placa Funcional</option>
            <option value="placa-miorrelaxante">Placa Miorrelaxante</option>
            <option value="placa-clareamento">Placa de Clareamento</option>
          </select>
        </div>

        <div class="form-group">
          <label>Arcada *</label>
          <select class="prosthesis-arcada" required>
            <option value="">Selecione a arcada...</option>
            <option value="mandibula">Mandíbula (Inferior)</option>
            <option value="maxila">Maxila (Superior)</option>
            <option value="ambas">Ambas</option>
            <option value="outros">Outros</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Status Inicial *</label>
          <select class="prosthesis-status" required>
            <option value="escaneamento">Escaneamento</option>
            <option value="planejamento">Planejamento</option>
            <option value="impressao">Impressão</option>
            <option value="teste">Teste</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>

        ${showValueField ? `
          <div class="form-group">
            <label>Valor (R$)</label>
            <input type="text" class="prosthesis-value" placeholder="R$ 0,00">
          </div>
        ` : '<div></div>'}
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Data da Primeira Consulta</label>
          <input type="date" class="prosthesis-first-consultation">
        </div>

        <div class="form-group">
          <label>Data do Escaneamento</label>
          <input type="date" class="prosthesis-scan-date">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Data do Teste</label>
          <input type="date" class="prosthesis-test-date">
        </div>

        <div class="form-group">
          <label>Data de Entrega Prevista</label>
          <input type="date" class="prosthesis-delivery-date">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group full-width">
          <label>Observações Específicas</label>
          <textarea class="prosthesis-notes" rows="3" placeholder="Observações específicas desta placa..."></textarea>
        </div>
      </div>
    `;

    // Máscara de valor
    const valueInput = card.querySelector('.prosthesis-value');
    if (valueInput) {
      valueInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        v = (Number(v) / 100).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        e.target.value = 'R$ ' + v;
      });
    }

    // Botão remover
    const removeBtn = card.querySelector('.remove-prosthesis-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => removeProsthesis(prosthesisId));
    }

    return card;
  };

  const addProsthesis = () => {
    prosthesesCount++;
    const id = generateId();
    prosthesesData.push({ id, number: prosthesesCount });
    const card = createProsthesisCard(id, prosthesesCount);
    prosthesesContainer.appendChild(card);
    updateSummary();
    updateRemoveButtons();
  };

  const removeProsthesis = (prosthesisId) => {
    if (prosthesesData.length <= 1) {
      showNotification('Você precisa ter pelo menos uma placa', 'error');
      return;
    }
    prosthesesData = prosthesesData.filter(p => p.id !== prosthesisId);
    document.querySelector(`[data-prosthesis-id="${prosthesisId}"]`)?.remove();
    prosthesesData.forEach((p, i) => {
      p.number = i + 1;
      const card = document.querySelector(`[data-prosthesis-id="${p.id}"]`);
      if (card) {
        const el = card.querySelector('.prosthesis-number span:last-child');
        if (el) el.textContent = `Placa ${p.number}`;
      }
    });
    updateSummary();
    updateRemoveButtons();
  };

  const updateRemoveButtons = () => {
    const cards = prosthesesContainer.querySelectorAll('.prosthesis-card');
    cards.forEach(card => {
      const removeBtn = card.querySelector('.remove-prosthesis-btn');
      const header    = card.querySelector('.prosthesis-card-header');
      if (prosthesesData.length <= 1) {
        removeBtn?.remove();
      } else if (!removeBtn && header) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'remove-prosthesis-btn';
        btn.dataset.prosthesisId = card.dataset.prosthesisId;
        btn.innerHTML = '🗑️ Remover';
        btn.addEventListener('click', () => removeProsthesis(card.dataset.prosthesisId));
        header.appendChild(btn);
      }
    });
  };

  const collectProsthesesData = () => {
    const prostheses = [];
    const cards = prosthesesContainer.querySelectorAll('.prosthesis-card');
    cards.forEach((card, index) => {
      const type   = card.querySelector('.prosthesis-type').value;
      const arcada = card.querySelector('.prosthesis-arcada').value;
      const status = card.querySelector('.prosthesis-status').value;
      const valueInput          = card.querySelector('.prosthesis-value');
      const firstConsultation   = card.querySelector('.prosthesis-first-consultation').value;
      const scanDate            = card.querySelector('.prosthesis-scan-date').value;
      const testDate            = card.querySelector('.prosthesis-test-date').value;
      const deliveryDate        = card.querySelector('.prosthesis-delivery-date').value;
      const notes               = card.querySelector('.prosthesis-notes').value.trim();

      if (!type || !arcada) throw new Error(`Preencha todos os campos obrigatórios da Placa ${index + 1}`);

      let value = null;
      if (valueInput && currentUser.role === 'management') {
        const clean = valueInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        value = parseFloat(clean);
        if (isNaN(value)) value = null;
      }

      prostheses.push({
        id: card.dataset.prosthesisId,
        type,
        arcada,
        status,
        value,
        firstConsultation: firstConsultation || null,
        scanDate:          scanDate          || null,
        testDate:          testDate          || null,
        deliveryDate:      deliveryDate      || null,
        notes:             notes             || null,
        timeline: [{
          action:      'created',
          description: `Placa criada - ${getTypeLabel(type)}`,
          date:        new Date().toISOString(),
          user:        currentUser.name,
          userId:      currentUser.id
        }],
        files: []
      });
    });
    return prostheses;
  };

  // Primeira placa automática
  addProsthesis();

  if (addProsthesisBtn) {
    addProsthesisBtn.addEventListener('click', addProsthesis);
  }

  // ========================================
  // SUBMISSÃO
  // ========================================

  if (newCaseForm) {
    newCaseForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const patientName  = document.getElementById('patientName').value.trim();
        const patientPhone = document.getElementById('patientPhone').value.trim();
        const patientEmail = document.getElementById('patientEmail').value.trim();
        const patientCPF   = document.getElementById('patientCPF').value.trim();

        if (!patientName || patientName.length < 3) {
          showNotification('Nome do paciente deve ter pelo menos 3 caracteres', 'error');
          return;
        }
        if (!patientPhone || patientPhone.length < 14) {
          showNotification('Digite um telefone válido', 'error');
          return;
        }

        const prostheses = collectProsthesesData();
        if (prostheses.length === 0) {
          showNotification('Adicione pelo menos uma placa', 'error');
          return;
        }

        const newCase = {
          patientName,
          patientPhone,
          patientEmail:  patientEmail  || null,
          patientCPF:    patientCPF    || null,
          patientPhoto:  photoBase64   || null,
          prostheses,
          createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
          createdBy:     currentUser.id,
          createdByName: currentUser.name
        };

        // Sanitizar undefined
        const sanitized = JSON.parse(JSON.stringify(newCase));
        // Restaurar server timestamps (são objetos especiais, não sobrevivem ao JSON.parse)
        sanitized.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        sanitized.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        showNotification('Salvando caso...', 'info');
        await db.collection('cases').add(sanitized);
        showNotification('Caso criado com sucesso!', 'success');

        setTimeout(() => { window.location.href = 'placas.html'; }, 500);

      } catch (error) {
        console.error('❌ Erro ao criar caso de placa:', error);
        showNotification(error.message || 'Erro ao criar caso. Tente novamente.', 'error');
      }
    });
  }

  console.log('✅ new-case-placa.js pronto!');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewCasePlaca);
} else {
  initNewCasePlaca();
}
