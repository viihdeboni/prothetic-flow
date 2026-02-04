// ========================================
// CRIAR NOVO CASO - ProtheticFlow
// ========================================

console.log('📝 new-case.js carregado');

// ========================================
// INICIALIZAR
// ========================================

const initNewCase = async () => {
  // Aguardar Firebase
  while (!window.FirebaseApp?.auth || !window.FirebaseApp?.db) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Firebase pronto');

  const auth = window.FirebaseApp.auth;
  const db = window.FirebaseApp.db;

  // Esperar autenticação (UMA VEZ SÓ)
  const currentUser = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      unsubscribe(); // Parar de escutar depois da primeira vez
      
      if (!authUser) {
        console.log('❌ Usuário não autenticado, redirecionando...');
        window.location.href = 'index.html';
        resolve(null);
        return;
      }

      console.log('✅ Usuário autenticado:', authUser.uid);

      // Buscar dados do usuário
      try {
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        const userData = {
          id: authUser.uid,
          email: authUser.email,
          ...userDoc.data()
        };
        console.log('✅ Dados do usuário:', userData);
        resolve(userData);
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
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
  const newCaseForm = document.getElementById('newCaseForm');
  const photoPreview = document.getElementById('photoPreview');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const patientPhoto = document.getElementById('patientPhoto');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const valueRow = document.getElementById('valueRow');
  const notification = document.getElementById('notification');

  // Definir nome do usuário
  if (userName) {
    userName.textContent = currentUser.name;
  }

  // Ocultar elementos para Operacional
  if (currentUser.role === 'operational') {
    if (metricsLink) metricsLink.style.display = 'none';
    if (valueRow) valueRow.style.display = 'none';
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
    uploadPhotoBtn.addEventListener('click', () => {
      patientPhoto.click();
    });
  }

  if (photoPreview && patientPhoto) {
    photoPreview.addEventListener('click', () => {
      if (!photoBase64) patientPhoto.click();
    });
  }

  if (patientPhoto && photoPreviewImg && removePhotoBtn) {
    patientPhoto.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione uma imagem válida', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem deve ter no máximo 5MB', 'error');
        return;
      }

      // Converter para Base64
      const reader = new FileReader();
      reader.onload = (event) => {
        photoBase64 = event.target.result;
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
  // MÁSCARAS DE INPUT
  // ========================================

  const phoneInput = document.getElementById('patientPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
      e.target.value = value;
    });
  }

  const cpfInput = document.getElementById('patientCPF');
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
    });
  }

  const caseValueInput = document.getElementById('caseValue');
  if (caseValueInput) {
    caseValueInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = (Number(value) / 100).toFixed(2);
      value = value.replace('.', ',');
      value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      e.target.value = 'R$ ' + value;
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
        showNotification('Nome do paciente deve ter pelo menos 3 caracteres', 'error');
        return;
      }

      if (!patientPhone || patientPhone.length < 14) {
        showNotification('Digite um telefone válido', 'error');
        return;
      }

      if (!caseType) {
        showNotification('Selecione o tipo de prótese', 'error');
        return;
      }

      // Converter valor
      let caseValue = null;
      if (caseValueRaw && currentUser.role === 'management') {
        const cleanValue = caseValueRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        caseValue = parseFloat(cleanValue);
        if (isNaN(caseValue)) caseValue = null;
      }

      // Criar caso
      const newCase = {
        patientName,
        patientPhone,
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
          date: new Date().toISOString(), // ← MUDOU AQUI!
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
        console.log('💾 Salvando no Firebase...');
        const docRef = await db.collection('cases').add(newCase);
        
        console.log('✅ Caso salvo! ID:', docRef.id);
        showNotification('Caso criado com sucesso!', 'success');
        
        setTimeout(() => {
          console.log('🔄 Redirecionando...');
          window.location.href = 'dashboard.html';
        }, 500);
        
      } catch (error) {
        console.error('❌ Erro ao criar caso:', error);
        showNotification('Erro ao criar caso. Tente novamente.', 'error');
      }
    });
  }

  // Data mínima
  const today = new Date().toISOString().split('T')[0];
  ['firstConsultation', 'scanDate', 'testDate', 'deliveryDate'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.setAttribute('min', today);
  });

  console.log('✅ new-case.js pronto!');
};

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewCase);
} else {
  initNewCase();
}
