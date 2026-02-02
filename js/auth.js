// ========================================
// SISTEMA DE AUTENTICAÇÃO - ProtheticFlow
// ========================================

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
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
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
};

// ========================================
// LOGIN
// ========================================

if (loginForm) {
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

// APENAS verificar, NÃO declarar novamente
const checkCurrentUser = getCurrentUser();
if (checkCurrentUser && window.location.pathname.includes('index.html')) {
    window.location.href = 'dashboard.html';
}

// Exportar funções para uso em outras páginas
window.ProtheticAuth = {
    getCurrentUser,
    logout,
    showNotification
};
