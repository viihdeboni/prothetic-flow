// ========================================
// UPLOAD PARA CLOUDFLARE R2
// ========================================

console.log('📤 r2-upload.js carregado');

window.R2Upload = {
  /**
   * Fazer upload de arquivo para R2
   * @param {File} file - Arquivo para upload
   * @returns {Promise<{success: boolean, url: string, fileName: string}>}
   */
  uploadFile: async (file) => {
    try {
      console.log('📤 Iniciando upload para R2:', file.name);

      // Converter arquivo para base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Chamar API de upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          fileType: file.type
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro no upload');
      }

      console.log('✅ Upload concluído:', result.url);
      return result;

    } catch (error) {
      console.error('❌ Erro no upload R2:', error);
      throw error;
    }
  },

  /**
   * Upload de múltiplos arquivos
   * @param {File[]} files - Array de arquivos
   * @param {Function} onProgress - Callback de progresso
   * @returns {Promise<Array>}
   */
  uploadMultiple: async (files, onProgress) => {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        if (onProgress) {
          onProgress(i + 1, files.length, files[i].name);
        }

        const result = await window.R2Upload.uploadFile(files[i]);
        results.push({
          ...result,
          originalFile: files[i]
        });

      } catch (error) {
        console.error(`❌ Erro ao fazer upload de ${files[i].name}:`, error);
        results.push({
          success: false,
          error: error.message,
          originalFile: files[i]
        });
      }
    }

    return results;
  }
};

console.log('✅ R2Upload pronto!');
