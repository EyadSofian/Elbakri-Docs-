<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Missing API config.php. Copy config.example.php to config.php and fill in database credentials.',
    ]);
    exit;
}

require_once $configPath;

const STORE_TABLE = 'elbakri_app_store';

const ALLOWED_COLLECTIONS = [
    'invoices',
    'vouchers',
    'statements',
    'clients',
    'suppliers',
    'templates',
    'settings',
    'payments',
    'creditNotes',
    'debitNotes',
    'refunds',
    'adjustments',
];

function require_api_token(): void
{
    if (!defined('ELBAKRI_API_TOKEN') || ELBAKRI_API_TOKEN === '') {
        return;
    }

    $provided = $_SERVER['HTTP_X_ELBAKRI_TOKEN'] ?? '';
    if (!hash_equals(ELBAKRI_API_TOKEN, $provided)) {
        json_response(['error' => 'Unauthorized'], 401);
    }
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(['error' => 'Invalid JSON request body'], 400);
    }
    return $data;
}

function validate_collection(string $collection): string
{
    if (!in_array($collection, ALLOWED_COLLECTIONS, true)) {
        json_response(['error' => 'Unknown collection'], 400);
    }
    return $collection;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    ensure_store_table($pdo);
    return $pdo;
}

function ensure_store_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS ' . STORE_TABLE . " (
            collection_name VARCHAR(64) NOT NULL PRIMARY KEY,
            payload LONGTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CHECK (JSON_VALID(payload))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function default_settings(): array
{
    return [
        'name' => 'ELBAKRI OVERSEAS',
        'tagline' => 'Travel & Tourism',
        'established' => '1982',
        'address' => 'Cairo, Egypt',
        'phone' => '+20 100 000 0000',
        'email' => 'info@elbakrioverseas.com',
        'website' => 'www.elbakrioverseas.com',
        'taxId' => '',
        'commercialRegister' => '',
        'defaultCurrency' => 'USD',
        'defaultBank' => [
            'bankName' => '',
            'accountNumber' => '',
            'iban' => '',
            'swift' => '',
            'notes' => '',
        ],
        'invoicePrefix' => 'INV-2026',
        'voucherPrefix' => 'VCH-2026',
        'nextInvoiceNumber' => 1,
        'nextVoucherNumber' => 1,
        'paymentPrefix' => 'PAY-2026',
        'nextPaymentNumber' => 1,
        'creditNotePrefix' => 'CN-2026',
        'nextCreditNoteNumber' => 1,
        'debitNotePrefix' => 'DN-2026',
        'nextDebitNoteNumber' => 1,
        'refundPrefix' => 'RF-2026',
        'nextRefundNumber' => 1,
        'adjustmentPrefix' => 'ADJ-2026',
        'nextAdjustmentNumber' => 1,
    ];
}

function read_collection(PDO $pdo, string $collection): ?array
{
    $stmt = $pdo->prepare('SELECT payload FROM ' . STORE_TABLE . ' WHERE collection_name = ?');
    $stmt->execute([$collection]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    $value = json_decode((string) $row['payload'], true);
    return is_array($value) ? $value : null;
}

function write_collection(PDO $pdo, string $collection, mixed $value): void
{
    $payload = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        json_response(['error' => 'Could not encode collection JSON'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO ' . STORE_TABLE . ' (collection_name, payload)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([$collection, $payload]);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    json_response(['ok' => true]);
}

require_api_token();
