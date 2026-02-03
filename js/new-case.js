// ========================================
// CRIAR NOVO CASO - ProtheticFlow
// ========================================

console.log('📝 new-case.js carregado');

// Proteger rota e obter usuário
let currentUser = null;

const initNewCase = async () => {
  currentUser = await window.ProtheticAuth?.protectRoute();
  
  if (!currentUser) {
    console.log('❌ Usuário não autenticado');
    return;
  }

  console.log('✅ New Case iniciado para:', currentUser.name);

  // Elementos do DOM
  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const metricsLink = document.getElementById('metricsLink');
  const newCaseForm = document.getElementById('newCaseForm');
  const photoPreview = document.getElementById('photoPreview');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const patientPhoto = document.getElementById('patientPhoto');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const valueRow = document.getElementById('valueRow');

  // Definir nome do usuário
  if (userName) {
    userName.textContent = currentUser.name;
  }

  // Ocultar link de Métricas e campo de Valor se for usuário Operacional
  if (currentUser.role === 'operational') {
    if (metricsLink) metricsLink.style.display = 'none';
    if (valueRow) valueRow.style.display = 'none';
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
  // UPLOAD DE FOTO
  // ========================================

  let photoBase64 = null;

  if (uploadPhotoBtn && patientPhoto) {
    uploadPhotoBtn.addEventListener('click', () => {
      patientPhoto.click();
    });
  }

  if (photoPreview && patientPhoto) {
    photoPreview.addEventListener('click', () => {
      if (!photoBase64) {
        patientPhoto.click();
      }
    });
  }

  if (patientPhoto && photoPreviewImg && removePhotoBtn) {
    patientPhoto.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          window.ProtheticAuth.showNotification('Por favor, selecione uma imagem válida', 'error');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          window.ProtheticAuth.showNotification('A imagem deve ter no máximo 5MB', 'error');
          return;
        }

        const result = await window.R2Upload.uploadPhoto(file);
        
        if (result.success) {
          photoBase64 = result.data;
          photoPreviewImg.src = photoBase64;
          photoPreviewImg.classList.remove('hidden');
          removePhotoBtn.classList.remove('hidden');
        } else {
          window.ProtheticAuth.showNotification('Erro ao processar foto', 'error');
        }
      }
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
  // MÁSCARAS DE INPUT
  // ========================================

  const phoneMask = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
  };

  const phoneInput = document.getElementById('patientPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = phoneMask(e.target.value);
    });
  }

  const cpfMask = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
  };

  const cpfInput = document.getElementById('patientCPF');
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      e.target.value = cpfMask(e.target.value);
    });
  }

  const moneyMask = (value) => {
    value = value.replace(/\D/g, '');
    value = (Number(value) / 100).toFixed(2);
    value = value.replace('.', ',');
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return 'R$ ' + value;
  };

  const caseValueInput = document.getElementById('caseValue');
  if (caseValueInput) {
    caseValueInput.addEventListener('input', (e) => {
      e.target.value = moneyMask(e.target.value);
    });
  }

  // ========================================
  // SUBMISSÃO DO FORMULÁRIO
  // ========================================

  if (newCaseForm) {
    newCaseForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      console.log('📋 Formulário submetido!');

      // Coletar dados
      const patientName = document.getElementById('patientName').value.trim();
      const patientPhone = document.getElementById('patientPhone').value.trim();
      const patientEmail = document.getElementById('patientEmail').value.trim();
      const patientCPF = document.getElementById('patientCPF').value.trim();
      const caseType = document.getElementById('caseType').value;
      const caseStatus = document.getElementById('caseStatus').value;
      const caseValueRaw = caseValueInput ? caseValueInput.value : '';
      const firstConsultation = document.getElementById('firstConsultation').value;
      const scanDate = document.getElementById('scanDate').value;
      const testDate = document.getElementById('testDate').value;
      const deliveryDate = document.getElementById('deliveryDate').value;
      const caseNotes = document.getElementById('caseNotes').value.trim();

      // Validações
      if (!patientName || patientName.length < 3) {
        window.ProtheticAuth.showNotification('Nome do paciente deve ter pelo menos 3 caracteres', 'error');
        return;
      }

      if (!patientPhone || patientPhone.length < 14) {
        window.ProtheticAuth.showNotification('Digite um telefone válido', 'error');
        return;
      }

      if (!caseType) {
        window.ProtheticAuth.showNotification('Selecione o tipo de prótese', 'error');
        return;
      }

      // Converter valor
      let caseValue = null;
      if (caseValueRaw && currentUser.role === 'management') {
        const cleanValue = caseValueRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        caseValue = parseFloat(cleanValue);
        if (isNaN(caseValue)) caseValue = null;
      }

      // Preparar dados do caso
      const newCase = {
        patientName: patientName,
        patientPhone: patientPhone,
        patientEmail: patientEmail || null,
        patientCPF: patientCPF || null,
        patientPhoto: photoBase64 || null,
        type: caseType,
        status: caseStatus,
        value: caseValue,
        firstConsultation: firstConsultation || null,
        scanDate: scanDate || null,
        testDate: testDate || null,
        deliveryDate: deliveryDate || null,
        notes: caseNotes || null,
        timeline: [{
          action: 'created',
          description: 'Caso criado',
          date: firebase.firestore.FieldValue.serverTimestamp(),
          user: currentUser.name,
          userId: currentUser.id
        }],
        files: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.id,
        createdByName: currentUser.name
      };

      console.log('✅ Caso preparado:', newCase);

      try {
        // Salvar no Firestore
        const docRef = await db.collection('cases').add(newCase);
        
        console.log('💾 Caso salvo no Firebase! ID:', docRef.id);
        window.ProtheticAuth.showNotification('Caso criado com sucesso!', 'success');
        
        // Redirecionar
        setTimeout(() => {
          console.log('🔄 Redirecionando para dashboard...');
          window.location.href = 'dashboard.html';
        }, 500);
        
      } catch (error) {
        console.error('❌ Erro ao criar caso:', error);
        window.ProtheticAuth.showNotification('Erro ao criar caso. Tente novamente.', 'error');
      }
    });
  }

  // ========================================
  // DEFINIR DATA MÍNIMA
  // ========================================

  const today = new Date().toISOString().split('T')[0];
  ['firstConsultation', 'scanDate', 'testDate', 'deliveryDate'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.setAttribute('min', today);
  });

  console.log('✅ new-case.js configurado!');
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewCase);
} else {
  initNewCase();
}
