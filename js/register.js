// ========================================
// CADASTRO - ProtheticFlow
// ========================================

console.log('📝 register.js carregado');

// Elementos do DOM
const registerForm = document.getElementById('registerForm');
const notification = document.getElementById('notification');
const logo = document.getElementById('logo');

// Firebase
const auth = window.FirebaseApp?.auth;
const db = window.FirebaseApp?.db;

// ========================================
// NOTIFICAÇÕES
// ========================================

const showNotification = (message, type = 'info') => {
  if (!notification) return;
  
  notification.textContent = message;
  notification.className = `notification ${type} active`;
  
  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
};

// ========================================
// VALIDAÇÃO DE SENHA
// ========================================

const passwordInput = document.getElementById('registerPassword');
const passwordConfirmInput = document.getElementById('registerPasswordConfirm');

if (passwordConfirmInput && passwordInput) {
  passwordConfirmInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const confirm = passwordConfirmInput.value;
    
    if (confirm && password !== confirm) {
      passwordConfirmInput.setCustomValidity('As senhas não coincidem');
    } else {
      passwordConfirmInput.setCustomValidity('');
    }
  });
}

// ========================================
// CADASTRO
// ========================================

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const role = document.getElementById('registerRole').value;
    
    console.log('📝 Tentando cadastro:', email);

    // Validações
    if (!name || name.length < 3) {
      showNotification('Nome deve ter pelo menos 3 caracteres', 'error');
      return;
    }
    
    if (!email || !email.includes('@')) {
      showNotification('Digite um e-mail válido', 'error');
      return;
    }
    
    if (password.length < 6) {
      showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }
    
    if (password !== passwordConfirm) {
      showNotification('As senhas não coincidem', 'error');
      return;
    }
    
    if (!role) {
      showNotification('Selecione o tipo de acesso', 'error');
      return;
    }
    
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('✅ Usuário criado no Auth:', user.uid);
      
      // Salvar dados adicionais no Firestore
      await db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        role: role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Dados salvos no Firestore');
      
      showNotification('Conta criada com sucesso! Redirecionando...', 'success');
      
      // Redirecionar para dashboard após 1.5 segundos
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      
      let message = 'Erro ao criar conta';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está cadastrado';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido';
      } else if (error.code === 'auth/weak-password') {
        message = 'Senha muito fraca';
      }
      
      showNotification(message, 'error');
    }
  });
}

// ========================================
// PLACEHOLDER DA LOGO
// ========================================

if (logo) {
  logo.addEventListener('error', function() {
    this.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: white;
      font-weight: 700;
      margin: 0 auto 1rem;
    `;
    placeholder.textContent = 'PF';
    this.parentNode.insertBefore(placeholder, this);
  });
}

// ========================================
// VERIFICAR SE JÁ ESTÁ LOGADO
// ========================================

auth.onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes('register.html')) {
    console.log('✅ Usuário já logado, redirecionando...');
    window.location.href = 'dashboard.html';
  }
});

console.log('✅ Register configurado');
