<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Método no permitido.']);
    exit;
}

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $_ENV[$key] = $value;
    }
}

$smtpHost     = $_ENV['SMTP_HOST']    ?? '';
$smtpPort     = (int) ($_ENV['SMTP_PORT']    ?? 587);
$smtpUser     = $_ENV['SMTP_USER']    ?? '';
$smtpPassword = $_ENV['SMTP_API_KEY'] ?? '';
$toEmail      = $_ENV['SMTP_TO']      ?? '';

if (!$smtpHost || !$smtpUser || !$smtpPassword || !$toEmail) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Configuración de correo incompleta.']);
    exit;
}

// Sanitize input
$nombre  = htmlspecialchars(trim($_POST['nombre']  ?? ''), ENT_QUOTES, 'UTF-8');
$empresa = htmlspecialchars(trim($_POST['empresa'] ?? ''), ENT_QUOTES, 'UTF-8');
$correo  = filter_var(trim($_POST['correo'] ?? ''), FILTER_VALIDATE_EMAIL);
$mensaje = htmlspecialchars(trim($_POST['mensaje'] ?? ''), ENT_QUOTES, 'UTF-8');

if (!$nombre || !$empresa || !$correo) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Por favor completa todos los campos requeridos.']);
    exit;
}

$subject = "Nuevo diagnóstico gratuito de $nombre";

$body = "Nombre: $nombre\r\n"
      . "Empresa: $empresa\r\n"
      . "Correo: $correo\r\n\r\n"
      . "Mensaje:\r\n$mensaje";

// Open SMTP socket with STARTTLS
$errno = 0; $errstr = '';
$socket = fsockopen($smtpHost, $smtpPort, $errno, $errstr, 10);
if (!$socket) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => "No se pudo conectar al servidor de correo: $errstr"]);
    exit;
}

function smtpSend(mixed $socket, string $cmd): string
{
    fwrite($socket, $cmd . "\r\n");
    $response = '';
    while ($line = fgets($socket, 512)) {
        $response .= $line;
        if ($line[3] === ' ') break; // end of multi-line response
    }
    return $response;
}

function smtpExpect(mixed $socket, string $cmd, string $expect, string $errorMsg): void
{
    $response = smtpSend($socket, $cmd);
    if (!str_starts_with($response, $expect)) {
        fclose($socket);
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => $errorMsg]);
        exit;
    }
}

// Read greeting
fgets($socket, 512);

smtpExpect($socket, "EHLO sibetweb.com",          '2', 'Error EHLO.');
smtpExpect($socket, 'STARTTLS',                    '2', 'Error STARTTLS.');

// Upgrade to TLS
stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

smtpExpect($socket, "EHLO sibetweb.com",                           '2', 'Error EHLO post-TLS.');
smtpExpect($socket, 'AUTH LOGIN',                                   '3', 'Error AUTH LOGIN.');
smtpExpect($socket, base64_encode($smtpUser),                       '3', 'Error usuario SMTP.');
smtpExpect($socket, base64_encode($smtpPassword),                   '2', 'Credenciales SMTP incorrectas.');
smtpExpect($socket, "MAIL FROM:<$smtpUser>",                        '2', 'Error MAIL FROM.');
smtpExpect($socket, "RCPT TO:<$toEmail>",                           '2', 'Error RCPT TO.');
smtpExpect($socket, 'DATA',                                         '3', 'Error DATA.');

$headers = "From: SIBET IA <$smtpUser>\r\n"
         . "Reply-To: $correo\r\n"
         . "To: $toEmail\r\n"
         . "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n"
         . "MIME-Version: 1.0\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: base64\r\n";

$encodedBody = chunk_split(base64_encode($body));
smtpExpect($socket, $headers . "\r\n" . $encodedBody . "\r\n.", '2', 'Error al enviar el mensaje.');

smtpSend($socket, 'QUIT');
fclose($socket);

echo json_encode(['ok' => true, 'message' => '¡Mensaje enviado! Te contactaremos pronto.']);
