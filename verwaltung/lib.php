<?php
// Gemeinsame Funktionen der Verwaltung: Datenbank, Anmeldung, Export, Sicherung, Protokoll, Bilder.
declare(strict_types=1);
require __DIR__ . '/konfiguration.php';

if (PHP_SAPI !== 'cli' && basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }

// ---------- Datenbank ----------
function db(): PDO {
    static $pdo = null;
    if ($pdo) { return $pdo; }
    if (!is_dir(DATENORDNER)) { mkdir(DATENORDNER, 0700, true); }
    if (!is_file(DATENORDNER . '/.htaccess')) { file_put_contents(DATENORDNER . '/.htaccess', "Require all denied\n"); }
    $pdo = new PDO('sqlite:' . DATENBANK, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
    schema($pdo);
    return $pdo;
}

function schema(PDO $pdo): void {
    $pdo->exec(<<<SQL
CREATE TABLE IF NOT EXISTS artikel (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  art TEXT NOT NULL DEFAULT 'Fliesen',
  oberflaeche TEXT NOT NULL DEFAULT 'Oberfläche auf Anfrage',
  farbe TEXT NOT NULL DEFAULT '',
  beschreibung TEXT NOT NULL DEFAULT '',
  formate TEXT NOT NULL DEFAULT '',
  preis_cent INTEGER,
  waehrung TEXT NOT NULL DEFAULT 'EUR',
  preis_datum TEXT NOT NULL DEFAULT '',
  einheit TEXT,
  sichtbar INTEGER NOT NULL DEFAULT 1,
  sortierung INTEGER NOT NULL DEFAULT 0,
  foto TEXT NOT NULL DEFAULT '',
  foto_oberflaeche TEXT NOT NULL DEFAULT '',
  foto_verlegt TEXT NOT NULL DEFAULT '',
  verlegt_format TEXT NOT NULL DEFAULT '',
  ki_bild TEXT NOT NULL DEFAULT '',
  quelle TEXT NOT NULL DEFAULT '',
  intern_hersteller TEXT NOT NULL DEFAULT '',
  intern_hersteller_seite TEXT NOT NULL DEFAULT '',
  intern_bildquelle TEXT NOT NULL DEFAULT '',
  geaendert_am TEXT NOT NULL DEFAULT '',
  geaendert_von TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS formatpreise (
  format TEXT NOT NULL,
  oberflaeche TEXT NOT NULL,
  preis_cent INTEGER NOT NULL,
  PRIMARY KEY (format, oberflaeche)
);
CREATE TABLE IF NOT EXISTS benutzer (
  name TEXT PRIMARY KEY,
  passwort TEXT NOT NULL,
  angelegt_am TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS protokoll (
  nr INTEGER PRIMARY KEY AUTOINCREMENT,
  zeit TEXT NOT NULL,
  benutzer TEXT NOT NULL,
  artikel TEXT NOT NULL DEFAULT '',
  aktion TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS anmeldeversuche (
  schluessel TEXT NOT NULL,
  zeit INTEGER NOT NULL
);
SQL);
}

function jetzt(): string { return date('Y-m-d H:i:s'); }
function h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// ---------- Sitzung, Anmeldung, Formularschutz ----------
function sitzung(): void {
    if (session_status() === PHP_SESSION_ACTIVE) { return; }
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name('yabis_verwaltung');
    session_set_cookie_params(['lifetime' => 0, 'path' => dirname($_SERVER['SCRIPT_NAME'] ?? '/verwaltung/') . '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; form-action 'self'; frame-ancestors 'none'");
}

function angemeldet(): ?string { sitzung(); return $_SESSION['benutzer'] ?? null; }

function login_pflicht(): string {
    $name = angemeldet();
    if (!$name) { header('Location: index.php'); exit; }
    return $name;
}

function token(): string {
    sitzung();
    if (empty($_SESSION['token'])) { $_SESSION['token'] = bin2hex(random_bytes(32)); }
    return $_SESSION['token'];
}

function token_feld(): string { return '<input type="hidden" name="token" value="' . h(token()) . '">'; }

function token_pruefen(): void {
    $t = (string)($_POST['token'] ?? '');
    if (!hash_equals(token(), $t)) { http_response_code(400); exit('Die Seite war zu lange offen. Bitte neu laden und noch einmal speichern.'); }
}

function versuch_schluessel(string $name): string { return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'cli') . '|' . mb_strtolower($name)); }

function gesperrt(string $name): bool {
    $grenze = time() - SPERRE_MINUTEN * 60;
    db()->prepare('DELETE FROM anmeldeversuche WHERE zeit < ?')->execute([$grenze]);
    $q = db()->prepare('SELECT COUNT(*) FROM anmeldeversuche WHERE schluessel = ?');
    $q->execute([versuch_schluessel($name)]);
    return (int)$q->fetchColumn() >= MAX_FEHLVERSUCHE;
}

function anmelden(string $name, string $passwort): bool {
    $name = trim($name);
    if ($name === '' || gesperrt($name)) { return false; }
    $q = db()->prepare('SELECT passwort FROM benutzer WHERE name = ?');
    $q->execute([$name]);
    $hash = $q->fetchColumn();
    if (!$hash || !password_verify($passwort, (string)$hash)) {
        db()->prepare('INSERT INTO anmeldeversuche (schluessel, zeit) VALUES (?, ?)')->execute([versuch_schluessel($name), time()]);
        return false;
    }
    db()->prepare('DELETE FROM anmeldeversuche WHERE schluessel = ?')->execute([versuch_schluessel($name)]);
    sitzung();
    session_regenerate_id(true);
    $_SESSION['benutzer'] = $name;
    protokoll($name, '', 'Anmeldung');
    return true;
}

function benutzer_setzen(string $name, string $passwort): void {
    if (mb_strlen($passwort) < 10) { throw new RuntimeException('Das Passwort braucht mindestens 10 Zeichen.'); }
    db()->prepare('INSERT INTO benutzer (name, passwort, angelegt_am) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET passwort = excluded.passwort')
        ->execute([$name, password_hash($passwort, PASSWORD_DEFAULT), jetzt()]);
}

// ---------- Protokoll und Sicherung ----------
function protokoll(string $benutzer, string $artikel, string $aktion, string $details = ''): void {
    db()->prepare('INSERT INTO protokoll (zeit, benutzer, artikel, aktion, details) VALUES (?, ?, ?, ?, ?)')
        ->execute([jetzt(), $benutzer, $artikel, $aktion, mb_substr($details, 0, 2000)]);
}

function sicherung(): void {
    if (!is_file(DATENBANK)) { return; }
    if (!is_dir(SICHERUNGEN)) { mkdir(SICHERUNGEN, 0700, true); }
    $ziel = SICHERUNGEN . '/katalog-' . date('Ymd-His') . '.sqlite';
    if (is_file($ziel)) { return; }
    // VACUUM INTO ergibt eine saubere Kopie, geht aber nicht, solange eine Abfrage offen ist. Dann Datei kopieren
    // (ohne offene Schreibvorgänge ist die Datei in sich stimmig).
    try { db()->exec('VACUUM INTO ' . db()->quote($ziel)); }
    catch (PDOException) { if (!copy(DATENBANK, $ziel)) { throw new RuntimeException('Die Sicherung konnte nicht angelegt werden. Es wurde nichts gespeichert.'); } }
    $alle = glob(SICHERUNGEN . '/katalog-*.sqlite') ?: [];
    sort($alle);
    while (count($alle) > MAX_SICHERUNGEN) { @unlink(array_shift($alle)); }
}

// ---------- Werte umwandeln ----------
function formate_liste(string $formate): array {
    $liste = [];
    foreach (preg_split('~[;,\s]+~', $formate) ?: [] as $f) {
        if (preg_match('~^(\d{2,3})x(\d{2,3})$~', $f, $m)) { $liste[] = [(int)$m[1], (int)$m[2]]; }
    }
    return $liste;
}

function formate_text(array $liste): string {
    return implode(';', array_map(fn($f) => $f[0] . 'x' . $f[1], $liste));
}

function preis_aus_eingabe(string $eingabe): ?int {
    $eingabe = trim(str_replace(['€', ' '], '', $eingabe));
    if ($eingabe === '') { return null; }
    $eingabe = str_replace(',', '.', $eingabe);
    if (!preg_match('~^\d{1,5}(\.\d{1,2})?$~', $eingabe)) { throw new InvalidArgumentException('Bitte den Preis als Zahl eingeben, z. B. 39,90.'); }
    return (int)round((float)$eingabe * 100);
}

function preis_anzeige(?int $cent): string {
    return $cent === null ? '' : number_format($cent / 100, 2, ',', '');
}

function neue_id(string $name): string {
    $s = mb_strtolower(trim($name));
    $s = strtr($s, ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss', 'é' => 'e', 'è' => 'e', 'á' => 'a', 'à' => 'a', 'ó' => 'o', 'í' => 'i', 'ñ' => 'n']);
    $s = trim(preg_replace('~[^a-z0-9]+~', '-', $s) ?? '', '-') ?: 'artikel';
    $id = $s; $n = 2;
    $q = db()->prepare('SELECT 1 FROM artikel WHERE id = ?');
    while (true) { $q->execute([$id]); if (!$q->fetchColumn()) { return $id; } $id = $s . '-' . $n++; }
}

// ---------- Export für Shop und Raumstudio ----------
// Nur öffentliche Felder. Herstellernamen, Herstellerseiten und Bildquellen bleiben in der Datenbank.
function export_daten(): array {
    $produkte = [];
    foreach (db()->query('SELECT * FROM artikel ORDER BY sortierung, rowid') as $a) {
        $p = [
            'id' => $a['id'], 'name' => $a['name'], 'finish' => $a['oberflaeche'], 'kind' => $a['art'],
            'color' => $a['farbe'], 'description' => $a['beschreibung'], 'formats' => formate_liste($a['formate']),
            'source' => $a['quelle'], 'catalogPriceCents' => $a['preis_cent'] === null ? null : (int)$a['preis_cent'],
            'catalogCurrency' => $a['waehrung'], 'catalogPriceDate' => $a['preis_datum'], 'catalogUnit' => $a['einheit'],
        ];
        if (!(int)$a['sichtbar']) { $p['hidden'] = true; }
        if ($a['foto'] !== '') {
            $p['photo'] = $a['foto']; $p['texture'] = $a['foto'];
            $bild = ['photo' => $a['foto']];
            if ($a['foto_oberflaeche'] !== '') { $bild['surface'] = $a['foto_oberflaeche']; }
            if ($a['foto_verlegt'] !== '') { $bild['installation'] = $a['foto_verlegt']; }
            if ($a['verlegt_format'] !== '') { $bild['installationFormat'] = $a['verlegt_format']; }
            $p['manufacturerImage'] = $bild;
        }
        if ($a['ki_bild'] !== '') { $p['reconstruction'] = $a['ki_bild']; }
        $produkte[] = $p;
    }
    $preise = [];
    foreach (db()->query('SELECT * FROM formatpreise ORDER BY format, oberflaeche') as $f) {
        $preise[str_replace('x', ',', $f['format'])][$f['oberflaeche']] = (int)$f['preis_cent'];
    }
    return ['produkte' => $produkte, 'formatpreise' => $preise];
}

function exportieren(): void {
    $d = export_daten();
    $json = fn($v) => json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    $inhalt = "// Automatisch erzeugt von /verwaltung am " . date('d.m.Y H:i') . ". Nicht von Hand ändern.\n"
            . "window.YabisCatalog = " . $json($d['produkte']) . ";\n"
            . "window.YabisFormatPrices = " . $json($d['formatpreise']) . ";\n";
    if (!is_dir(dirname(EXPORT_DATEI))) { mkdir(dirname(EXPORT_DATEI), 0755, true); }
    $tmp = EXPORT_DATEI . '.tmp' . bin2hex(random_bytes(4));
    file_put_contents($tmp, $inhalt, LOCK_EX);
    rename($tmp, EXPORT_DATEI);
}

// ---------- Bilder ----------
// Fotos werden verkleinert und als WebP gespeichert. Metadaten wie GPS fallen dabei weg.
function bild_speichern(array $datei, string $id): string {
    if (($datei['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($datei['tmp_name'])) {
        throw new RuntimeException('Das Foto konnte nicht hochgeladen werden. Bitte noch einmal versuchen.');
    }
    if ($datei['size'] > 15 * 1024 * 1024) { throw new RuntimeException('Das Foto ist größer als 15 MB.'); }
    $typ = (new finfo(FILEINFO_MIME_TYPE))->file($datei['tmp_name']);
    $quelle = match ($typ) {
        'image/jpeg' => @imagecreatefromjpeg($datei['tmp_name']),
        'image/png' => @imagecreatefrompng($datei['tmp_name']),
        'image/webp' => @imagecreatefromwebp($datei['tmp_name']),
        default => throw new RuntimeException('Bitte ein Foto als JPG, PNG oder WebP hochladen. iPhone-Fotos (HEIC) vorher als JPG teilen.'),
    };
    if (!$quelle) { throw new RuntimeException('Das Foto ließ sich nicht lesen.'); }
    if ($typ === 'image/jpeg' && function_exists('exif_read_data')) {
        $o = (int)(@exif_read_data($datei['tmp_name'])['Orientation'] ?? 1);
        $quelle = match ($o) { 3 => imagerotate($quelle, 180, 0), 6 => imagerotate($quelle, -90, 0), 8 => imagerotate($quelle, 90, 0), default => $quelle };
    }
    $w = imagesx($quelle); $hgt = imagesy($quelle); $max = 1600;
    $f = min(1, $max / max($w, $hgt));
    $ziel = imagecreatetruecolor((int)round($w * $f), (int)round($hgt * $f));
    imagecopyresampled($ziel, $quelle, 0, 0, 0, 0, imagesx($ziel), imagesy($ziel), $w, $hgt);
    if (!is_dir(BILDORDNER)) { mkdir(BILDORDNER, 0755, true); }
    $name = $id . '-' . date('YmdHis') . '.webp';
    imagewebp($ziel, BILDORDNER . '/' . $name, 82);
    return BILDPFAD . '/' . $name;
}

// ---------- Seitenrahmen ----------
function kopf(string $titel, ?string $benutzer = null): void {
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<meta name="robots" content="noindex,nofollow"><title>' . h($titel) . ' · Verwaltung Yabis</title>'
       . '<link rel="stylesheet" href="verwaltung.css?v=1"></head><body><header class="kopf"><a class="marke" href="index.php">Yabis · Verwaltung</a>';
    if ($benutzer) {
        echo '<nav><a href="index.php">Artikel</a><a href="formatpreise.php">Formatpreise</a><a href="protokoll.php">Protokoll</a>'
           . '<a href="../katalog.html" target="_blank" rel="noopener">Shop ansehen</a>'
           . '<form method="post" action="abmelden.php">' . token_feld() . '<button type="submit">Abmelden</button></form></nav>';
    }
    echo '</header><main class="inhalt">';
}

function fuss(): void { echo '</main><script src="verwaltung.js?v=1"></script></body></html>'; }

function meldung(): string {
    sitzung();
    $m = $_SESSION['meldung'] ?? null; unset($_SESSION['meldung']);
    return $m ? '<p class="meldung ' . h($m[0]) . '" role="status">' . h($m[1]) . '</p>' : '';
}
function merke_meldung(string $art, string $text): void { sitzung(); $_SESSION['meldung'] = [$art, $text]; }
