<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const NUMBER_FIELDS = [
    'invoice' => ['invoicePrefix', 'nextInvoiceNumber', 'INV-2026'],
    'voucher' => ['voucherPrefix', 'nextVoucherNumber', 'VCH-2026'],
    'payment' => ['paymentPrefix', 'nextPaymentNumber', 'PAY-2026'],
    'creditNote' => ['creditNotePrefix', 'nextCreditNoteNumber', 'CN-2026'],
    'debitNote' => ['debitNotePrefix', 'nextDebitNoteNumber', 'DN-2026'],
    'refund' => ['refundPrefix', 'nextRefundNumber', 'RF-2026'],
    'adjustment' => ['adjustmentPrefix', 'nextAdjustmentNumber', 'ADJ-2026'],
];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['error' => 'Method not allowed'], 405);
    }

    $body = read_json_body();
    $kind = (string) ($body['kind'] ?? '');
    if (!array_key_exists($kind, NUMBER_FIELDS)) {
        json_response(['error' => 'Unknown number kind'], 400);
    }

    [$prefixField, $numberField, $defaultPrefix] = NUMBER_FIELDS[$kind];
    $pdo = db();

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT payload FROM ' . STORE_TABLE . ' WHERE collection_name = ? FOR UPDATE');
    $stmt->execute(['settings']);
    $row = $stmt->fetch();

    $settings = default_settings();
    if ($row) {
        $decoded = json_decode((string) $row['payload'], true);
        if (is_array($decoded)) {
            $settings = array_replace_recursive($settings, $decoded);
        }
    }

    $prefix = (string) ($settings[$prefixField] ?? $defaultPrefix);
    $current = (int) ($settings[$numberField] ?? 1);
    if ($current < 1) {
        $current = 1;
    }

    $number = sprintf('%s-%04d', $prefix, $current);
    $settings[$prefixField] = $prefix;
    $settings[$numberField] = $current + 1;
    write_collection($pdo, 'settings', $settings);
    $pdo->commit();

    json_response([
        'number' => $number,
        'settings' => $settings,
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['error' => $error->getMessage()], 500);
}
