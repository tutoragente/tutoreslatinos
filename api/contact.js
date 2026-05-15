import nodemailer from 'nodemailer';

export const config = { api: { bodyParser: false } };

function parseFormData(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      resolve(Object.fromEntries(params.entries()));
    });
    req.on('error', reject);
  });
}

// multipart/form-data parser (for FormData without files)
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      const boundary = req.headers['content-type']?.split('boundary=')[1];
      if (!boundary) return resolve({});
      const parts = body.split('--' + boundary).slice(1, -1);
      const result = {};
      for (const part of parts) {
        const [rawHeaders, ...rest] = part.split('\r\n\r\n');
        const value = rest.join('\r\n\r\n').replace(/\r\n$/, '');
        const nameMatch = rawHeaders.match(/name="([^"]+)"/);
        if (nameMatch) result[nameMatch[1]] = value;
      }
      resolve(result);
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Método no permitido.' });

  const contentType = req.headers['content-type'] ?? '';
  const data = contentType.includes('multipart/form-data')
    ? await parseMultipart(req)
    : await parseFormData(req);

  const { nombre = '', empresa = '', correo = '', mensaje = '' } = data;

  if (!nombre.trim() || !empresa.trim() || !correo.trim()) {
    return res.status(422).json({ ok: false, message: 'Por favor completa todos los campos requeridos.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo.trim())) {
    return res.status(422).json({ ok: false, message: 'Correo electrónico inválido.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_API_KEY,
    },
  });

  try {
    await transporter.sendMail({
      from: `SIBET IA <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO,
      replyTo: correo.trim(),
      subject: `Nuevo diagnóstico gratuito de ${nombre.trim()}`,
      text: `Nombre: ${nombre.trim()}\nEmpresa: ${empresa.trim()}\nCorreo: ${correo.trim()}\n\nMensaje:\n${mensaje.trim()}`,
    });

    return res.status(200).json({ ok: true, message: '¡Mensaje enviado! Te contactaremos pronto.' });
  } catch (err) {
    console.error('SMTP error:', err);
    return res.status(500).json({ ok: false, message: 'Error al enviar el mensaje. Intenta de nuevo.' });
  }
}
