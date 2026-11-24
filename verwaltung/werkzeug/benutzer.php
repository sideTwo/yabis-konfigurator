<?php
// Zugang für die Verwaltung anlegen oder Passwort ändern.
// Aufruf: php verwaltung/werkzeug/benutzer.php <name>
// Das Passwort wird abgefragt (oder mit --zufall erzeugt und einmal angezeigt). Es landet nur als Hash in der Datenbank.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../lib.php';

$name = $argv[1] ?? '';
if ($name === '' || str_starts_with($name, '--')) { fwrite(STDERR, "Aufruf: php verwaltung/werkzeug/benutzer.php <name> [--zufall]\n"); exit(1); }
if (in_array('--zufall', $argv, true)) {
    $zeichen = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $passwort = '';
    for ($i = 0; $i < 16; $i++) { $passwort .= $zeichen[random_int(0, strlen($zeichen) - 1)]; }
} else {
    fwrite(STDOUT, "Passwort (mind. 10 Zeichen): ");
    $passwort = trim((string)fgets(STDIN));
}
benutzer_setzen($name, $passwort);
protokoll('Werkzeug', '', 'Zugang gesetzt', $name);
echo "Zugang für „{$name}“ gespeichert." . (in_array('--zufall', $argv, true) ? " Passwort: $passwort\n" : "\n");
