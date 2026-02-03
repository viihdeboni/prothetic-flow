// ========================================
// UPLOAD PARA CLOUDFLARE R2 - ProtheticFlow
// ========================================

const R2Upload = {
  // Converter arquivo para Base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Upload de foto (Base64 para Firestore)
  uploadPhoto: async (file) => {
    try {
      console.log('📸 Processando foto:', file.name);
      const base64 = await R2Upload.fileToBase64(file);
      return {
        success: true,
        data: base64,
        size: file.size,
        name: file.name
      };
    } catch (error) {
      console.error('❌ Erro ao processar foto:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Simular upload de arquivo grande (STL, PDF)
  // Em produção, você usaria Cloudflare Workers ou backend
  uploadFile: async (file, folder = 'files') => {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const extension = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}-${randomStr}.${extension}`;

      console.log('📤 Upload simulado:', fileName);

      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Por enquanto, apenas retorna a referência do arquivo
      // Em produção, faria upload real para R2
      return {
        success: true,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: `${window.AppConfig.r2.publicUrl}/${fileName}`
      };

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Exportar
window.R2Upload = R2Upload;
console.log('✅ R2 Upload configurado');
