import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { fileName, fileType } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, error: 'Nome do arquivo ausente' });
    }

    // Configurações do R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const objectKey = `${Date.now()}-${fileName}`;

    // Gera URL assinada (válida por 1 hora)
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // URL pública final (usando domínio custom)
    const publicUrl = `https://direct.protheticflow.win/${objectKey}`;

    return res.status(200).json({
      success: true,
      uploadUrl,      // URL assinada para fazer PUT
      publicUrl,      // URL pública final
      fileName: objectKey,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar URL de upload:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
