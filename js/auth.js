// ========================================
// SISTEMA DE AUTENTICAÇÃO - ProtheticFlow
// ========================================

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const registerModal = document.getElementById('registerModal');
const showRegisterBtn = document.getElementById('showRegister');
const closeRegisterBtn = document.getElementById('closeRegister');
const cancelRegisterBtn = document.getElementById('cancelRegister');
const notification = document.getElementById('notification');
const logo = document.getElementById('logo');

// ========================================
// GERENCIAMENTO DE USUÁRIOS (LocalStorage)
// ========================================

// Inicializar storage se não existir
if (!localStorage.getItem('protheticflow_users')) {
    localStorage.setItem('protheticflow_users', JSON.stringify([]));
}

// Funções de gerenciamento de usuários
const getUsers = () => JSON.parse(localStorage.getItem('protheticflow_users') || '[]');

const saveUser = (user) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('protheticflow_users', JSON.stringify(users));
};

const findUserByEmail = (email) => {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

const setCurrentUser = (user) => {
    localStorage.setItem('protheticflow_current_user', JSON.stringify(user));
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('protheticflow_current_user') || 'null');
};

const logout = () => {
    localStorage.removeItem('protheticflow_current_user');
    window.location.href = 'index.html';
};

// ========================================
// NOTIFICAÇÕES
// ========================================

const showNotification = (message, type = 'info') => {
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
};

// ========================================
// MODAL DE CADASTRO
// ========================================

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.classList.add('active');
});

closeRegisterBtn.addEventListener('click', () => {
    registerModal.classList.remove('active');
    registerForm.reset();
});

cancelRegisterBtn.addEventListener('click', () => {
    registerModal.classList.remove('active');
    registerForm.reset();
});

// Fechar modal ao clicar fora
registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
        registerModal.classList.remove('active');
        registerForm.reset();
    }
});

// ========================================
// LOGIN
// ========================================

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = findUserByEmail(email);
    
    if (!user) {
        showNotification('E-mail não encontrado', 'error');
        return;
    }
    
    if (user.password !== password) {
        showNotification('Senha incorreta', 'error');
        return;
    }
    
    // Login bem-sucedido
    setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    });
    
    showNotification('Login realizado com sucesso!', 'success');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 500);
});

// ========================================
// CADASTRO
// ========================================

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const role = document.getElementById('registerRole').value;
    
    // Validações
    if (password !== passwordConfirm) {
        showNotification('As senhas não coincidem', 'error');
        return;
    }
    
    if (findUserByEmail(email)) {
        showNotification('Este e-mail já está cadastrado', 'error');
        return;
    }
    
    if (!role) {
        showNotification('Selecione o tipo de acesso', 'error');
        return;
    }
    
    // Criar novo usuário
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        role: role,
        createdAt: new Date().toISOString()
    };
    
    saveUser(newUser);
    
    showNotification('Cadastro realizado com sucesso!', 'success');
    
    // Fechar modal e limpar formulário
    setTimeout(() => {
        registerModal.classList.remove('active');
        registerForm.reset();
    }, 1000);
});

// ========================================
// PLACEHOLDER DA LOGO
// ========================================

// Se a imagem da logo não carregar, mostra ícone
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

// ========================================
// VERIFICAR SE JÁ ESTÁ LOGADO
// ========================================

const currentUser = getCurrentUser();
if (currentUser && window.location.pathname.includes('index.html')) {
    window.location.href = 'dashboard.html';
}

// Exportar funções para uso em outras páginas
window.ProtheticAuth = {
    getCurrentUser,
    logout,
    showNotification
};
