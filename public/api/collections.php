<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

try {
    $pdo = db();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $collection = validate_collection((string) ($_GET['collection'] ?? ''));
        $value = read_collection($pdo, $collection);
        json_response([
            'collection' => $collection,
            'exists' => $value !== null,
            'value' => $value,
        ]);
    }

    if ($method === 'PUT' || $method === 'POST') {
        $body = read_json_body();
        $collection = validate_collection((string) ($body['collection'] ?? ''));
        if (!array_key_exists('value', $body)) {
            json_response(['error' => 'Missing value'], 400);
        }
        write_collection($pdo, $collection, $body['value']);
        json_response(['ok' => true, 'collection' => $collection]);
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (Throwable $error) {
    json_response(['error' => $error->getMessage()], 500);
}
