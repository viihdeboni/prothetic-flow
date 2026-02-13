// ========================================
// UPLOAD PARA CLOUDFLARE R2 (via API Vercel)
// ========================================

console.log('📤 r2-upload.js carregado');

window.R2Upload = {
  /**
   * Envia um arquivo único para o endpoint /api/upload
   * usando FormData (sem base64)
   * @param {File} file - Arquivo para upload
   * @returns {Promise<{success: boolean, url: string, fileName: string}>}
   */
  uploadFile: async (file) => {
    try {
      console.log(`📤 Iniciando upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

      // Cria FormData com o arquivo
      const formData = new FormData();
      formData.append("file", file);

      // Chama o endpoint /api/upload (serverless function da Vercel)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // Lê o resultado
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro desconhecido no upload");
      }

      console.log("✅ Upload concluído:", result.url);
      return {
        success: true,
        url: result.url,
        fileName: result.fileName,
        originalFile: file,
      };
    } catch (error) {
      console.error("❌ Erro no upload R2:", error);
      return {
        success: false,
        error: error.message,
        originalFile: file,
      };
    }
  },

  /**
   * Envia múltiplos arquivos para o R2, um por vez
   * e exibe progresso no console e UI (opcional)
   * @param {File[]} files - Lista de arquivos
   * @param {Function} [onProgress] - Callback (current, total, fileName)
   * @returns {Promise<Array>}
   */
  uploadMultiple: async (files, onProgress) => {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Mostra progresso
        if (onProgress) {
          onProgress(i + 1, files.length, file.name);
        } else {
          console.log(`📦 (${i + 1}/${files.length}) Enviando: ${file.name}`);
        }

        // Faz upload do arquivo
        const result = await window.R2Upload.uploadFile(file);
        results.push(result);
      } catch (error) {
        console.error(`❌ Falha ao enviar ${file.name}:`, error);
        results.push({
          success: false,
          error: error.message,
          originalFile: file,
        });
      }
    }

    console.log("✅ Todos os uploads concluídos:", results);
    return results;
  },
};

console.log("✅ R2Upload pronto para uso!");
