// ========================================
// PÁGINA DE CADASTRO - ProtheticFlow
// ========================================

// Elementos do DOM
const registerForm = document.getElementById('registerForm');
const notification = document.getElementById('notification');
const logo = document.getElementById('logo');
const userName = document.getElementById('userName');

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

// Gerenciar usuários no LocalStorage
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

// Mostrar notificações
const showNotification = (message, type = 'info') => {
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

// Validar força da senha
const validatePasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
};

// Verificar se senhas coincidem em tempo real
passwordConfirmInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const confirm = passwordConfirmInput.value;
    
    if (confirm && password !== confirm) {
        passwordConfirmInput.setCustomValidity('As senhas não coincidem');
    } else {
        passwordConfirmInput.setCustomValidity('');
    }
});

// ========================================
// CADASTRO
// ========================================

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
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
    
    // Verificar se e-mail já existe
    if (findUserByEmail(email)) {
        showNotification('Este e-mail já está cadastrado', 'error');
        return;
    }
    
    // Criar novo usuário
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password, // Em produção, isso deveria ser hasheado!
        role: role,
        createdAt: new Date().toISOString()
    };
    
    try {
        saveUser(newUser);
        
        showNotification('Conta criada com sucesso! Redirecionando...', 'success');
        
        // Redirecionar para login após 1.5 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        showNotification('Erro ao criar conta. Tente novamente.', 'error');
    }
});

// ========================================
// PLACEHOLDER DA LOGO
// ========================================

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

const currentUser = JSON.parse(localStorage.getItem('protheticflow_current_user') || 'null');
if (currentUser) {
    // Se já está logado, redireciona para o dashboard
    window.location.href = 'dashboard.html';
}
