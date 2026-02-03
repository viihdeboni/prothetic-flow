// ========================================
// INICIALIZAÇÃO DO FIREBASE - ProtheticFlow
// ========================================

// Inicializar Firebase
firebase.initializeApp(window.AppConfig.firebase);

// Serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar Firestore para trabalhar offline
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Múltiplas abas abertas, persistência desabilitada');
    } else if (err.code == 'unimplemented') {
      console.warn('Navegador não suporta persistência');
    }
  });

console.log('✅ Firebase inicializado!');

// Exportar para uso global
window.FirebaseApp = {
  auth,
  db
};
