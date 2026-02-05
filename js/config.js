// ========================================
// CONFIGURAÇÕES - ProtheticFlow
// ========================================

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDirEdtjCtq2pKSOF-Etiq8uyQ27hC_3M0",
  authDomain: "prothetic-flow.firebaseapp.com",
  projectId: "prothetic-flow",
  storageBucket: "prothetic-flow.firebasestorage.app",
  messagingSenderId: "338158356990",
  appId: "1:338158356990:web:d5a7caf20b6864b5c618af"
};

// CLOUDFLARE R2 CONFIG
const r2Config = {
  publicUrl: "https://pub-d96a9d0000b54150ad43b4b133f0d179.r2.dev",
  bucketName: "prothetic-flow-files"
};

// Exportar configurações
window.AppConfig = {
  firebase: firebaseConfig,
  r2: r2Config
};

console.log('✅ Configurações carregadas');

// ========================================
// 🔒 SENHA MESTRA PARA CRIAR CONTA DE GERÊNCIA
// ========================================
window.AppConfig.managementPassword = "Admin2026Oi";
