// ========================================
// API DE UPLOAD DIRETO PARA CLOUDFLARE R2 (Vercel + R2)
// ========================================

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configuração do cliente S3 (Cloudflare R2 usa API compatível)
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const contentType = req.headers["content-type"] || "";

    // 🔹 Caso 1: Recebendo arquivo binário via multipart/form-data
    if (contentType.startsWith("multipart/form-data")) {
      const formidable = await import("formidable");
      const form = formidable.default({ multiples: false });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Erro no parse do form:", err);
          return res.status(500).json({ success: false, error: "Erro ao processar o arquivo" });
        }

        const file = files.file?.[0] || files.file;
        if (!file) {
          return res.status(400).json({ success: false, error: "Nenhum arquivo enviado" });
        }

        const fs = await import("fs");
        const buffer = fs.readFileSync(file.filepath);
        const fileName = `${Date.now()}-${file.originalFilename}`;

        const uploadParams = {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: file.mimetype || "application/octet-stream",
        };

        await r2.send(new PutObjectCommand(uploadParams));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${encodeURIComponent(fileName)}`;
        return res.status(200).json({ success: true, url: publicUrl, fileName });
      });

      return;
    }

    // 🔹 Caso 2: Recebendo JSON simples (por compatibilidade)
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, error: "Campos ausentes" });
    }

    // Cria URL temporária de upload (opcional)
    const uploadUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${encodeURIComponent(fileName)}`;
    const authHeader = `Basic ${Buffer.from(`${process.env.R2_ACCESS_KEY_ID}:${process.env.R2_SECRET_ACCESS_KEY}`).toString("base64")}`;

    return res.status(200).json({
      success: true,
      uploadUrl,
      authHeader,
    });

  } catch (error) {
    console.error("❌ Erro no upload R2:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false, // Importante: permite receber arquivos grandes via form-data
  },
};
