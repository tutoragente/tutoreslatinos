<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

function sendJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    if (!is_array($data)) {
        sendJson(['ok' => false, 'message' => 'JSON invalido.'], 400);
    }

    return $data;
}

function normalizeReminder(?string $value): ?string
{
    if ($value === null || trim($value) === '') {
        return null;
    }

    return str_replace('T', ' ', substr($value, 0, 16)) . ':00';
}

function normalizeTags(mixed $tags): string
{
    if (!is_array($tags)) {
        return json_encode([], JSON_UNESCAPED_UNICODE);
    }

    $clean = [];
    foreach ($tags as $tag) {
        $tag = strtolower(trim((string) $tag));
        if ($tag !== '' && !in_array($tag, $clean, true)) {
            $clean[] = $tag;
        }
    }

    return json_encode($clean, JSON_UNESCAPED_UNICODE);
}

function formatNote(array $row): array
{
    $tags = json_decode((string) $row['tags'], true);

    return [
        'id' => $row['uuid'],
        'topic' => $row['topic'],
        'title' => $row['title'],
        'description' => $row['description'] ?? '',
        'tags' => is_array($tags) ? $tags : [],
        'priority' => (string) $row['priority'],
        'reminder' => $row['reminder'] ? substr(str_replace(' ', 'T', $row['reminder']), 0, 16) : '',
        'favorite' => (bool) $row['favorite'],
        'archived' => (bool) $row['archived'],
        'createdAt' => str_replace(' ', 'T', $row['created_at']),
        'updatedAt' => str_replace(' ', 'T', $row['updated_at']),
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    if ($method === 'GET') {
        $statement = $pdo->query('SELECT * FROM notes ORDER BY updated_at DESC');
        $notes = array_map('formatNote', $statement->fetchAll());
        sendJson(['ok' => true, 'notes' => $notes]);
    }

    if ($method === 'POST') {
        $data = readJsonBody();
        $uuid = $data['id'] ?? null;

        if (!$uuid || empty(trim((string) ($data['title'] ?? '')))) {
            sendJson(['ok' => false, 'message' => 'El titulo es obligatorio.'], 422);
        }

        $statement = $pdo->prepare(
            'INSERT INTO notes (uuid, topic, title, description, tags, priority, reminder, favorite, archived)
             VALUES (:uuid, :topic, :title, :description, :tags, :priority, :reminder, :favorite, :archived)'
        );
        $statement->execute([
            ':uuid' => $uuid,
            ':topic' => $data['topic'] ?? 'Trabajo',
            ':title' => trim((string) $data['title']),
            ':description' => $data['description'] ?? '',
            ':tags' => normalizeTags($data['tags'] ?? []),
            ':priority' => (int) ($data['priority'] ?? 2),
            ':reminder' => normalizeReminder($data['reminder'] ?? null),
            ':favorite' => !empty($data['favorite']) ? 1 : 0,
            ':archived' => !empty($data['archived']) ? 1 : 0,
        ]);

        $select = $pdo->prepare('SELECT * FROM notes WHERE uuid = :uuid');
        $select->execute([':uuid' => $uuid]);
        sendJson(['ok' => true, 'note' => formatNote($select->fetch())], 201);
    }

    if ($method === 'PUT') {
        if (!$id) {
            sendJson(['ok' => false, 'message' => 'Falta el id de la nota.'], 400);
        }

        $data = readJsonBody();
        $statement = $pdo->prepare(
            'UPDATE notes
             SET topic = :topic,
                 title = :title,
                 description = :description,
                 tags = :tags,
                 priority = :priority,
                 reminder = :reminder,
                 favorite = :favorite,
                 archived = :archived
             WHERE uuid = :uuid'
        );
        $statement->execute([
            ':uuid' => $id,
            ':topic' => $data['topic'] ?? 'Trabajo',
            ':title' => trim((string) ($data['title'] ?? '')),
            ':description' => $data['description'] ?? '',
            ':tags' => normalizeTags($data['tags'] ?? []),
            ':priority' => (int) ($data['priority'] ?? 2),
            ':reminder' => normalizeReminder($data['reminder'] ?? null),
            ':favorite' => !empty($data['favorite']) ? 1 : 0,
            ':archived' => !empty($data['archived']) ? 1 : 0,
        ]);

        $select = $pdo->prepare('SELECT * FROM notes WHERE uuid = :uuid');
        $select->execute([':uuid' => $id]);
        $note = $select->fetch();

        if (!$note) {
            sendJson(['ok' => false, 'message' => 'Nota no encontrada.'], 404);
        }

        sendJson(['ok' => true, 'note' => formatNote($note)]);
    }

    if ($method === 'DELETE') {
        if (!$id) {
            sendJson(['ok' => false, 'message' => 'Falta el id de la nota.'], 400);
        }

        $statement = $pdo->prepare('DELETE FROM notes WHERE uuid = :uuid');
        $statement->execute([':uuid' => $id]);
        sendJson(['ok' => true]);
    }

    sendJson(['ok' => false, 'message' => 'Metodo no permitido.'], 405);
} catch (Throwable $exception) {
    sendJson([
        'ok' => false,
        'message' => 'Error en el API.',
        'error' => $exception->getMessage(),
    ], 500);
}
