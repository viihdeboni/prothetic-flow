// ========================================
// API DE UPLOAD PARA CLOUDFLARE R2
// ========================================

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Configuração do R2
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = async (req, res) => {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, fileType } = req.body;

    if (!fileName || !fileData || !fileType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Converter base64 para buffer
    const base64Data = fileData.replace(/^data:.+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Nome único para o arquivo
    const uniqueFileName = `${Date.now()}-${fileName}`;

    // Upload para R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'prothetic-flow-files',
      Key: uniqueFileName,
      Body: buffer,
      ContentType: fileType,
    });

    await R2.send(command);

    // URL pública do arquivo
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName
    });

  } catch (error) {
    console.error('Erro no upload R2:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
