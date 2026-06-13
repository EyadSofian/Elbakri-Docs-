<?php
// Copy this file to config.php on the server and fill in cPanel database values.

declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_NAME = 'cpaneluser_elbakri_docs';
const DB_USER = 'cpaneluser_elbakri_user';
const DB_PASS = 'change-me';

// Optional lightweight gate. If set, requests must include X-Elbakri-Token.
// Because browser apps cannot hide tokens, protect the /api folder with cPanel
// Directory Privacy or publish the app behind a private domain for real security.
const ELBAKRI_API_TOKEN = '';
