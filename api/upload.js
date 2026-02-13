// ========================================
// GERA URL ASSINADA PARA UPLOAD DIRETO AO CLOUDFLARE R2
// ========================================

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { fileName, fileType } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, error: "Nome do arquivo ausente" });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_NAME;
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;

    const objectKey = `${Date.now()}-${fileName}`;
    const r2Url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(objectKey)}`;

    // Header Authorization (Basic)
    const authHeader = `Basic ${Buffer.from(`${accessKey}:${secretKey}`).toString("base64")}`;

    // Retorna URL e cabeçalhos para o front
    return res.status(200).json({
      success: true,
      uploadUrl: r2Url,
      authHeader,
      fileName: objectKey,
      fileType,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar URL de upload:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
