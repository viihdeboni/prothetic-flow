// ========================================
// SISTEMA DE AUTENTICAÇÃO - ProtheticFlow
// ========================================

console.log('🔐 auth.js carregado');

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const notification = document.getElementById('notification');
const logo = document.getElementById('logo');
const registerModal = document.getElementById('registerModal');
const showRegisterModal = document.getElementById('showRegisterModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const cancelRegister = document.getElementById('cancelRegister');

// ========================================
// AGUARDAR FIREBASE ESTAR PRONTO
// ========================================

const waitForFirebase = () => {
  return new Promise((resolve) => {
    const checkFirebase = () => {
      if (window.FirebaseApp?.auth && window.FirebaseApp?.db) {
        resolve();
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
};

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
// GERENCIAMENTO DE USUÁRIOS
// ========================================

const getCurrentUser = () => {
  return window.FirebaseApp?.auth.currentUser;
};

const getCurrentUserData = async () => {
  const user = window.FirebaseApp?.auth.currentUser;
  if (!user) return null;

  try {
    const userDoc = await window.FirebaseApp.db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      return {
        id: user.uid,
        email: user.email,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error);
    return null;
  }
};

const logout = async () => {
  try {
    await window.FirebaseApp.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    showNotification('Erro ao sair', 'error');
  }
};

// ========================================
// LOGIN
// ========================================

const initLogin = async () => {
  // Aguardar Firebase estar pronto
  await waitForFirebase();
  
  console.log('✅ Firebase pronto, configurando login');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      console.log('🔐 Tentando login:', email);
      
      try {
        const userCredential = await window.FirebaseApp.auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login bem-sucedido:', userCredential.user.uid);
        
        const userData = await getCurrentUserData();
        
        if (!userData) {
          throw new Error('Dados do usuário não encontrados');
        }
        
        console.log('✅ Dados do usuário:', userData);
        showNotification('Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 500);
        
      } catch (error) {
        console.error('❌ Erro no login:', error);
        
        let message = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
          message = 'E-mail não encontrado';
        } else if (error.code === 'auth/wrong-password') {
          message = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
          message = 'E-mail inválido';
        } else if (error.code === 'auth/too-many-requests') {
          message = 'Muitas tentativas. Tente novamente mais tarde';
        } else if (error.code === 'auth/invalid-credential') {
          message = 'E-mail ou senha incorretos';
        }
        
        showNotification(message, 'error');
      }
    });
  }

  // ========================================
  // MODAL DE CADASTRO
  // ========================================

  if (showRegisterModal && registerModal) {
    showRegisterModal.addEventListener('click', (e) => {
      e.preventDefault();
      registerModal.classList.add('active');
    });
  }

  if (closeRegisterModal && registerModal) {
    closeRegisterModal.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }

  if (cancelRegister && registerModal) {
    cancelRegister.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }

  if (registerModal) {
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) {
        registerModal.classList.remove('active');
      }
    });
  }

  // ========================================
  // MOSTRAR/OCULTAR CAMPO DE SENHA MESTRA
  // ========================================

  const registerRole = document.getElementById('registerRole');
  const managementPasswordGroup = document.getElementById('managementPasswordGroup');
  const managementPasswordInput = document.getElementById('managementPassword');

  if (registerRole && managementPasswordGroup) {
    registerRole.addEventListener('change', (e) => {
      if (e.target.value === 'management') {
        managementPasswordGroup.classList.remove('hidden');
        if (managementPasswordInput) {
          managementPasswordInput.required = true;
        }
      } else {
        managementPasswordGroup.classList.add('hidden');
        if (managementPasswordInput) {
          managementPasswordInput.required = false;
          managementPasswordInput.value = '';
        }
      }
    });
  }

  // ========================================
  // CADASTRO COM VALIDAÇÃO DE SENHA MESTRA
  // ========================================

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 Formulário de cadastro submetido');

      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const role = document.getElementById('registerRole').value;

      // Validações
      if (!name || name.length < 3) {
        showNotification('Nome deve ter pelo menos 3 caracteres', 'error');
        return;
      }

      if (!email || !email.includes('@')) {
        showNotification('Digite um e-mail válido', 'error');
        return;
      }

      if (!password || password.length < 6) {
        showNotification('Senha deve ter pelo menos 6 caracteres', 'error');
        return;
      }

      if (!role) {
        showNotification('Selecione o tipo de conta', 'error');
        return;
      }

      // ⚠️ VALIDAR SENHA MESTRA PARA GERÊNCIA
      if (role === 'management') {
        const managementPassword = document.getElementById('managementPassword').value;
        
        if (!managementPassword) {
          showNotification('Digite a senha de gerência', 'error');
          return;
        }

        if (managementPassword !== window.AppConfig.managementPassword) {
          showNotification('❌ Senha de gerência incorreta! Apenas administradores podem criar contas de gerência.', 'error');
          return;
        }
      }

      console.log('✅ Validações passaram');

      try {
        showNotification('Criando conta...', 'info');

        // Criar usuário no Firebase Auth
        const userCredential = await window.FirebaseApp.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ Usuário criado no Auth:', user.uid);

        // Salvar dados adicionais no Firestore
        await window.FirebaseApp.db.collection('users').doc(user.uid).set({
          name: name,
          email: email,
          role: role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Dados salvos no Firestore');

        showNotification('Conta criada com sucesso!', 'success');

        // Fechar modal
        if (registerModal) {
          registerModal.classList.remove('active');
        }

        // Redirecionar para dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);

      } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        
        let errorMessage = 'Erro ao criar conta. Tente novamente.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este e-mail já está cadastrado';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'E-mail inválido';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Senha muito fraca';
        }
        
        showNotification(errorMessage, 'error');
      }
    });
  }

  // ========================================
  // VERIFICAR SE JÁ ESTÁ LOGADO
  // ========================================

  window.FirebaseApp.auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('index.html')) {
      console.log('✅ Usuário já logado, redirecionando...');
      window.location.href = 'dashboard.html';
    }
  });
};

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
// PROTEÇÃO DE ROTAS
// ========================================

const protectRoute = async () => {
  await waitForFirebase();
  
  return new Promise((resolve) => {
    window.FirebaseApp.auth.onAuthStateChanged(async (user) => {
      const publicPages = ['index.html', 'register.html'];
      const isPublicPage = publicPages.some(page => window.location.pathname.includes(page));
      
      if (!user && !isPublicPage) {
        console.log('❌ Usuário não autenticado, redirecionando...');
        window.location.href = 'index.html';
        resolve(null);
      } else if (user) {
        const userData = await getCurrentUserData();
        console.log('✅ Usuário autenticado:', userData);
        resolve(userData);
      } else {
        resolve(null);
      }
    });
  });
};

// Exportar funções
window.ProtheticAuth = {
  getCurrentUser,
  getCurrentUserData,
  logout,
  showNotification,
  protectRoute
};

// Inicializar login quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}

console.log('✅ ProtheticAuth configurado');
