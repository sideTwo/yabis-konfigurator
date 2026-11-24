<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
sitzung();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    token_pruefen();
    $_SESSION = [];
    session_destroy();
}
header('Location: index.php');
