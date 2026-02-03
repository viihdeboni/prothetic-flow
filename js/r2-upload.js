// ========================================
// UPLOAD PARA CLOUDFLARE R2 - ProtheticFlow
// ========================================

const R2Upload = {
  // Upload de arquivo
  uploadFile: async (file, folder = 'files') => {
    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const extension = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}-${randomStr}.${extension}`;

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);

      // Por enquanto, vamos simular o upload e retornar URL mock
      // Em produção, você usaria um Worker ou API intermediária
      console.log('📤 Upload simulado:', fileName);

      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Retornar URL do arquivo
      const fileUrl = `${window.AppConfig.r2.publicUrl}/${fileName}`;

      return {
        success: true,
        url: fileUrl,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      };

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Converter arquivo para Base64 (para fotos pequenas)
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Upload de foto (usa Base64 para salvar no Firestore)
  uploadPhoto: async (file) => {
    try {
      // Para fotos, salvamos como Base64 no Firestore mesmo
      const base64 = await R2Upload.fileToBase64(file);
      return {
        success: true,
        data: base64,
        size: file.size
      };
    } catch (error) {
      console.error('❌ Erro ao processar foto:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Deletar arquivo (marca como deletado no sistema)
  deleteFile: async (fileUrl) => {
    try {
      console.log('🗑️ Arquivo marcado para exclusão:', fileUrl);
      // Em produção, você faria uma chamada para Worker/API para deletar do R2
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      return { success: false, error: error.message };
    }
  }
};

// Exportar
window.R2Upload = R2Upload;
console.log('✅ R2 Upload configurado');
