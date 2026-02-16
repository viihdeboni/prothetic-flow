// ========================================
// GERA URL ASSINADA PARA UPLOAD DIRETO AO CLOUDFLARE R2
// ========================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { fileName, fileType } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, error: "Nome do arquivo ausente" });
    }

    // Configurações do R2
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = "https://direct.protheticflow.win";

    // Cria nome único para o arquivo
    const objectKey = `${Date.now()}-${fileName}`;
    const uploadUrl = `${publicUrl}/${encodeURIComponent(objectKey)}`;

    // Gera header de autenticação (Basic Auth)
    const authHeader = `Basic ${Buffer.from(`${accessKey}:${secretKey}`).toString("base64")}`;

    return res.status(200).json({
      success: true,
      uploadUrl,
      authHeader,
      fileName: objectKey,
      fileType,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar URL de upload:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
