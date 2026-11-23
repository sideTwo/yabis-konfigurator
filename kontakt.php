<?php
// Anfrage-Formular Yabis Fliesenwelt (3 Schritte, Fotos als Anhang).
// Grundlage: _vorlagen/statische-webseite/kontakt.php · Standard: Brain/04 Standards/Kontaktformular-Standard.md
// Läuft erst auf dem Hosting (ALL-INKL). Auf GitHub Pages gibt es kein PHP – die Seite bietet dann WhatsApp an.
declare(strict_types=1);

$EMPFAENGER = 'info@yabisfliesenwelt.de';
$ABSENDER   = 'website@yabisfliesenwelt.de';   // Postfach der Kundendomain im KAS anlegen – sonst SPF-Fehler/Spam
$BETREFF    = 'Neue Anfrage über die Website';
$DANKE_SEITE = 'danke.html';
$MAX_PRO_STUNDE = 5;                   // bei Spam zuerst auf 2 senken
$SPEICHER   = __DIR__ . '/.formular-tmp';
$TOKEN_PFLICHT = false;                // Formularseite heißt index.html – Token erst, wenn sie .php heißt

$MAX_DATEIEN = 5;
$MAX_BYTES   = 20 * 1024 * 1024;       // zusammen; PHP-Limits upload_max_filesize/post_max_size im KAS prüfen
$ERLAUBT = [
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
    'image/heic' => 'heic', 'image/heif' => 'heif', 'application/pdf' => 'pdf',
];

$BEREICHE = ['bad' => 'Badezimmer', 'wohnen' => 'Wohnen & Vinyl', 'kueche' => 'Küchenwand', 'balkon' => 'Balkon',
             'treppe' => 'Treppenhaus', 'eingang' => 'Außenbereich', 'mehrere' => 'Mehrere Bereiche / Materialliste'];
$KUNDE = ['private' => 'Privatkunde', 'trade' => 'Gewerbekunde'];
$MATERIAL = ['pickup' => 'Abholung in Duisburg', 'delivery' => 'Lieferung anfragen'];

session_start();
$istAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']);

function antwort(bool $ok, string $text, int $code = 200): void {
    global $istAjax, $DANKE_SEITE;
    if ($istAjax) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'text' => $text], JSON_UNESCAPED_UNICODE);
    } elseif ($ok) { header('Location: ' . $DANKE_SEITE, true, 303); }
    else { http_response_code($code); header('Content-Type: text/plain; charset=utf-8'); echo $text; }
    exit;
}
// Erkannte Bots sehen „Erfolg“, nie eine Fehlermeldung
function stillSchlucken(): void { antwort(true, 'Wir melden uns bei Ihnen.'); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { antwort(false, 'Methode nicht erlaubt.', 405); }
// Zu große Uploads leeren $_POST komplett
if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    antwort(false, 'Die Dateien sind zu groß. Bitte weniger oder kleinere Fotos anhängen oder die Anfrage per WhatsApp senden.', 413);
}

// Zeilenumbrüche raus – sonst Mail-Header-Injection
function feld(string $n, int $max = 200): string {
    $w = $_POST[$n] ?? '';
    if (!is_string($w)) { return ''; }
    return mb_substr(trim(str_replace(["\r", "\n", "\t"], ' ', $w)), 0, $max);
}
function text(string $n, int $max): string {
    $w = $_POST[$n] ?? '';
    return is_string($w) ? mb_substr(trim(str_replace("\r", '', $w)), 0, $max) : '';
}
function wahl(string $n, array $werte): string { $w = feld($n, 40); return $werte[$w] ?? ''; }

$name      = feld('name', 100);
$firma     = feld('company', 120);
$telefon   = feld('telefon', 50);
$email     = feld('email', 150);
$rueckweg  = in_array(feld('reply', 20), ['Rückruf', 'WhatsApp', 'E-Mail'], true) ? feld('reply', 20) : '';
$bereiche  = [];
foreach ((array)($_POST['room'] ?? []) as $v) {
    if (is_string($v) && isset($BEREICHE[$v]) && !in_array($BEREICHE[$v], $bereiche, true)) { $bereiche[] = $BEREICHE[$v]; }
}
$bereich   = implode(', ', $bereiche);
$kunde     = wahl('customerType', $KUNDE);
$material  = wahl('delivery', $MATERIAL);
$termin    = feld('date', 60);
$menge     = feld('quantity', 100);
$plz       = feld('postcode', 5);
$ort       = feld('city', 100);
$adresse   = feld('address', 200);
$nachricht = text('message', 2000);
$warenkorb = text('warenkorb', 8000);
$vorhanden = [];
foreach ((array)($_POST['have'] ?? []) as $v) {
    if (is_string($v) && count($vorhanden) < 6) { $vorhanden[] = mb_substr(trim($v), 0, 60); }
}

// 1 – Honigtopf
if (feld('webseite') !== '') { stillSchlucken(); }
// 2 – Zeitprüfung
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0 && (time() - $ts) < 3) { stillSchlucken(); }
// 3 – Sitzungstoken
if ($TOKEN_PFLICHT) {
    $token = feld('token', 64);
    if (empty($_SESSION['form_token']) || !hash_equals($_SESSION['form_token'], $token)) { stillSchlucken(); }
}
// 4 – Ratenbremse: IP nur gehasht, Löschung nach 1 Stunde
function rateLimit(string $ordner, int $max): bool {
    if (!is_dir($ordner)) {
        @mkdir($ordner, 0700, true);
        @file_put_contents($ordner . '/.htaccess', "Require all denied\n");
    }
    $datei = $ordner . '/' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '0') . date('YmdH')) . '.cnt';
    foreach (glob($ordner . '/*.cnt') ?: [] as $alt) {
        if (filemtime($alt) < time() - 3600) { @unlink($alt); }
    }
    $n = (int)@file_get_contents($datei);
    if ($n >= $max) { return false; }
    @file_put_contents($datei, (string)($n + 1), LOCK_EX);
    return true;
}
// 5 – Inhaltsfilter (Ein-Wort-Nachrichten bleiben erlaubt: Bereich und Auswahl geben genug Zusammenhang)
$alles = mb_strtolower($name . ' ' . $firma . ' ' . $nachricht);
if (preg_match_all('~https?://|www\.~i', $alles) > 1) { stillSchlucken(); }
if (preg_match('~\[url|<a\s+href~i', $alles)) { stillSchlucken(); }
foreach (['seo service','guest post','backlink','crypto','casino','viagra','binary option','loan offer','bitcoin'] as $w) {
    if (str_contains($alles, $w)) { stillSchlucken(); }
}

// Prüfung
$fehler = [];
if ($name === '')      $fehler[] = 'Bitte geben Sie Ihren Namen an.';
if ($nachricht === '') $fehler[] = 'Bitte schreiben Sie kurz, was Sie vorhaben.';
if ($email === '' && $telefon === '') $fehler[] = 'Bitte hinterlassen Sie Telefon oder E-Mail.';
if ($rueckweg === 'E-Mail' && $email === '') $fehler[] = 'Für eine Antwort per E-Mail brauchen wir Ihre E-Mail-Adresse.';
if ($rueckweg !== 'E-Mail' && $rueckweg !== '' && $telefon === '') $fehler[] = 'Für Rückruf oder WhatsApp brauchen wir Ihre Telefonnummer.';
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $fehler[] = 'Die E-Mail-Adresse sieht nicht richtig aus.';
if ($material === 'Lieferung anfragen' && (!preg_match('~^\d{5}$~', $plz) || $ort === '')) $fehler[] = 'Bitte Liefer-PLZ und Lieferort angeben.';

// Anhänge prüfen
$anhaenge = [];
$dateien = $_FILES['fotos'] ?? null;
if (is_array($dateien) && is_array($dateien['name'] ?? null)) {
    $summe = 0;
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    foreach ($dateien['name'] as $i => $original) {
        $err = (int)($dateien['error'][$i] ?? UPLOAD_ERR_NO_FILE);
        if ($err === UPLOAD_ERR_NO_FILE) { continue; }
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) { $fehler[] = 'Eine Datei ist zu groß.'; break; }
        if ($err !== UPLOAD_ERR_OK || !is_uploaded_file($dateien['tmp_name'][$i])) { $fehler[] = 'Eine Datei konnte nicht hochgeladen werden.'; break; }
        if (count($anhaenge) >= $MAX_DATEIEN) { $fehler[] = "Bitte höchstens $MAX_DATEIEN Dateien anhängen."; break; }
        $mime = (string)$finfo->file($dateien['tmp_name'][$i]);
        if (!isset($ERLAUBT[$mime])) { $fehler[] = 'Bitte nur Fotos (JPG, PNG, WebP, HEIC) oder PDF anhängen.'; break; }
        $summe += (int)$dateien['size'][$i];
        if ($summe > $MAX_BYTES) { $fehler[] = 'Die Dateien sind zusammen größer als 20 MB.'; break; }
        $basis = preg_replace('~[^A-Za-z0-9_-]+~', '-', pathinfo((string)$original, PATHINFO_FILENAME)) ?: 'datei';
        $anhaenge[] = ['name' => mb_substr(trim($basis, '-'), 0, 60) . '.' . $ERLAUBT[$mime], 'mime' => $mime, 'pfad' => $dateien['tmp_name'][$i]];
    }
}
if ($fehler) { antwort(false, implode(' ', array_unique($fehler)), 422); }

if (!rateLimit($SPEICHER, $MAX_PRO_STUNDE)) {
    antwort(false, 'Es wurden bereits mehrere Anfragen gesendet. Bitte später erneut versuchen oder anrufen: +49 178 678 77 24.', 429);
}

// Mailtext
$zeilen = [
    'Ich plane als' => $kunde, 'Bereich' => $bereich, 'Name' => $name, 'Firma' => $firma,
    'Telefon' => $telefon, 'E-Mail' => $email, 'Rückmeldung' => $rueckweg,
    'Wann' => $termin, 'Menge' => $menge, 'Vorhanden' => implode(', ', $vorhanden), 'Material' => $material,
    'Lieferort' => trim($plz . ' ' . $ort . ($adresse !== '' ? ' · ' . $adresse : '')),
    'Anhänge' => $anhaenge ? count($anhaenge) . ' Datei(en)' : '',
];
$text = "Neue Anfrage über die Website\n" . str_repeat('-', 40) . "\n\n";
foreach ($zeilen as $k => $v) { if ($v !== '') { $text .= str_pad($k . ':', 15) . $v . "\n"; } }
$text .= "\nWas der Kunde vorhat:\n" . $nachricht . "\n";
if ($warenkorb !== '') { $text .= "\nAus dem Anfragekorb:\n" . $warenkorb . "\n"; }
$text .= "\n" . str_repeat('-', 40) . "\nUnverbindliche Anfrage, keine Bestellung.\nGesendet am " . date('d.m.Y \u\m H:i') . " Uhr\n";

$header = ['From: ' . mb_encode_mimeheader('Website Yabis Fliesenwelt') . ' <' . $ABSENDER . '>', 'MIME-Version: 1.0'];
if ($email !== '') { $header[] = 'Reply-To: ' . mb_encode_mimeheader($name) . ' <' . $email . '>'; }

if ($anhaenge) {
    $grenze = 'yabis-' . bin2hex(random_bytes(12));
    $header[] = 'Content-Type: multipart/mixed; boundary="' . $grenze . '"';
    $inhalt = "--$grenze\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($text)) . "\r\n";
    foreach ($anhaenge as $a) {
        $inhalt .= "--$grenze\r\nContent-Type: {$a['mime']}; name=\"{$a['name']}\"\r\nContent-Transfer-Encoding: base64\r\n"
                 . "Content-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n"
                 . chunk_split(base64_encode((string)file_get_contents($a['pfad']))) . "\r\n";
    }
    $inhalt .= "--$grenze--\r\n";
} else {
    $header[] = 'Content-Type: text/plain; charset=UTF-8';
    $header[] = 'Content-Transfer-Encoding: 8bit';
    $inhalt = $text;
}

$betreff = $BETREFF . ($bereich !== '' ? ': ' . $bereich : '') . ($name !== '' ? ' – ' . $name : '');
$ok = @mail($EMPFAENGER, mb_encode_mimeheader($betreff), $inhalt, implode("\r\n", $header), '-f' . $ABSENDER);
unset($_SESSION['form_token']);   // kein Doppelversand

if (!$ok) { antwort(false, 'Die Anfrage konnte gerade nicht gesendet werden. Senden Sie sie bitte per WhatsApp oder rufen Sie uns an: +49 178 678 77 24.', 500); }
antwort(true, 'Wir melden uns bei Ihnen' . ($rueckweg !== '' ? ' per ' . $rueckweg : '') . '.');
