// ========================================
// UPLOAD DIRETO PARA CLOUDFLARE R2 (USANDO DOMÍNIO PÚBLICO)
// ========================================

console.log("📤 r2-upload.js carregado");

window.R2Upload = {
  uploadFile: async (file) => {
    try {
      console.log(`📤 Iniciando upload direto para R2: ${file.name}`);

      // 1️⃣ Solicita URL assinada
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Falha ao obter URL de upload");

      // 2️⃣ Faz o upload diretamente para o R2
      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: {
          "Authorization": data.authHeader,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!put.ok) {
        throw new Error(`Upload falhou: ${put.status} ${put.statusText}`);
      }

      // 3️⃣ URL final pública
      const finalUrl = `https://files.protheticflow.win/${data.fileName}`;

      console.log("✅ Upload concluído:", finalUrl);

      return {
        success: true,
        url: finalUrl,
        fileName: data.fileName,
        originalFile: file,
      };
    } catch (error) {
      console.error("❌ Erro no upload R2:", error);
      return { success: false, error: error.message };
    }
  },

  uploadMultiple: async (files, onProgress) => {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        onProgress?.(i + 1, files.length, file.name);
        const result = await window.R2Upload.uploadFile(file);
        results.push(result);
      } catch (error) {
        console.error(`❌ Falha no upload de ${file.name}:`, error);
        results.push({ success: false, error: error.message, originalFile: file });
      }
    }

    console.log("📦 Uploads finalizados:", results);
    return results;
  },
};

console.log("✅ R2Upload pronto para upload direto!");
