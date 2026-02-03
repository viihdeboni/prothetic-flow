// ========================================
// SISTEMA DE AUTENTICAÇÃO - ProtheticFlow
// ========================================

console.log('🔐 auth.js carregado');

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const notification = document.getElementById('notification');
const logo = document.getElementById('logo');

// Firebase
const auth = window.FirebaseApp?.auth;
const db = window.FirebaseApp?.db;

if (!auth || !db) {
  console.error('❌ Firebase não inicializado!');
}

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
  return auth.currentUser;
};

const getCurrentUserData = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
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
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    showNotification('Erro ao sair', 'error');
  }
};

// ========================================
// LOGIN
// ========================================

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    console.log('🔐 Tentando login:', email);
    
    try {
      // Login com Firebase
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log('✅ Login bem-sucedido:', userCredential.user.uid);
      
      // Buscar dados adicionais do usuário
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
  if (user && window.location.pathname.includes('index.html')) {
    console.log('✅ Usuário já logado, redirecionando...');
    window.location.href = 'dashboard.html';
  }
});

// ========================================
// PROTEÇÃO DE ROTAS
// ========================================

const protectRoute = async () => {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
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

console.log('✅ ProtheticAuth configurado');
