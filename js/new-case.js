// ========================================
// CRIAR NOVO CASO - ProtheticFlow
// ========================================

console.log('new-case.js iniciado'); // Debug

// Verificar autenticação
const currentUser = window.ProtheticAuth?.getCurrentUser();
if (!currentUser) {
    console.log('Usuário não autenticado, redirecionando...');
    window.location.href = 'index.html';
}

console.log('Usuário atual:', currentUser); // Debug

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

// Verificar se elementos existem
if (!userName || !logoutBtn || !newCaseForm) {
    console.error('Elementos essenciais não encontrados!');
}

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
    patientPhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                window.ProtheticAuth.showNotification('Por favor, selecione uma imagem válida', 'error');
                return;
            }

            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                window.ProtheticAuth.showNotification('A imagem deve ter no máximo 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                photoBase64 = event.target.result;
                photoPreviewImg.src = photoBase64;
                photoPreviewImg.classList.remove('hidden');
                removePhotoBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
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

// Máscara de telefone
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

// Máscara de CPF
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

// Máscara de valor monetário
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
// GERENCIAMENTO DE CASOS
// ========================================

const getCases = () => {
    try {
        const cases = JSON.parse(localStorage.getItem('protheticflow_cases') || '[]');
        console.log('Casos no localStorage:', cases);
        return cases;
    } catch (error) {
        console.error('Erro ao obter casos:', error);
        return [];
    }
};

const saveCases = (cases) => {
    try {
        localStorage.setItem('protheticflow_cases', JSON.stringify(cases));
        console.log('Casos salvos:', cases);
        return true;
    } catch (error) {
        console.error('Erro ao salvar casos:', error);
        return false;
    }
};

const addCase = (caseData) => {
    const cases = getCases();
    cases.push(caseData);
    return saveCases(cases);
};

// ========================================
// SUBMISSÃO DO FORMULÁRIO
// ========================================

if (newCaseForm) {
    newCaseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        console.log('Formulário submetido!');

        // Coletar dados do formulário
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

        console.log('Dados coletados:', { 
            patientName, 
            patientPhone, 
            caseType,
            caseStatus 
        });

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

        // Converter valor monetário para número
        let caseValue = null;
        if (caseValueRaw && currentUser.role === 'management') {
            const cleanValue = caseValueRaw
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
                .trim();
            caseValue = parseFloat(cleanValue);
            
            if (isNaN(caseValue)) {
                caseValue = null;
            }
        }

        // Criar objeto do caso
        const newCase = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
            timeline: [
                {
                    action: 'created',
                    description: 'Caso criado',
                    date: new Date().toISOString(),
                    user: currentUser.name
                }
            ],
            files: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        console.log('Novo caso criado:', newCase);

        try {
            const success = addCase(newCase);
            
            if (success) {
                console.log('Caso salvo com sucesso no localStorage!');
                window.ProtheticAuth.showNotification('Caso criado com sucesso!', 'success');
                
                // Redirecionar após 800ms
                setTimeout(() => {
                    console.log('Redirecionando para dashboard...');
                    window.location.href = 'dashboard.html';
                }, 800);
            } else {
                throw new Error('Falha ao salvar caso');
            }
        } catch (error) {
            console.error('Erro ao criar caso:', error);
            window.ProtheticAuth.showNotification('Erro ao criar caso. Tente novamente.', 'error');
        }
    });
} else {
    console.error('Formulário não encontrado!');
}

// ========================================
// DEFINIR DATA MÍNIMA (hoje)
// ========================================

const today = new Date().toISOString().split('T')[0];
const firstConsultationInput = document.getElementById('firstConsultation');
const scanDateInput = document.getElementById('scanDate');
const testDateInput = document.getElementById('testDate');
const deliveryDateInput = document.getElementById('deliveryDate');

if (firstConsultationInput) firstConsultationInput.setAttribute('min', today);
if (scanDateInput) scanDateInput.setAttribute('min', today);
if (testDateInput) testDateInput.setAttribute('min', today);
if (deliveryDateInput) deliveryDateInput.setAttribute('min', today);

console.log('new-case.js carregado completamente!');
