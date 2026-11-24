<?php
// Einmalig (2026-11-24, Bilals Entscheidung): 18 Artikel standen im WhatsApp-Katalog in Rand (ZAR) statt Euro.
// Die Beträge (39,90 / 44,90) werden als Europreise übernommen.
// Aufruf: php verwaltung/werkzeug/rand-als-euro.php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../lib.php';

$quelle = file_get_contents(WEBORDNER . '/_quelle/katalog-vor-verwaltung/catalog-products.js');
preg_match('~window\.YabisCatalog\s*=\s*(\[.*\]);~s', $quelle, $m);
$alt = array_column(json_decode($m[1], true, 512, JSON_THROW_ON_ERROR), null, 'id');

$offen = db()->query("SELECT id, name FROM artikel WHERE waehrung <> 'EUR' AND preis_cent IS NULL")->fetchAll();
if (!$offen) { echo "Keine Artikel mit Fremdwährung offen.\n"; exit; }
sicherung();
db()->beginTransaction();
$upd = db()->prepare("UPDATE artikel SET preis_cent = ?, waehrung = 'EUR', geaendert_am = ?, geaendert_von = 'Bilal (Werkzeug)' WHERE id = ?");
foreach ($offen as $a) {
    $roh = (string)($alt[$a['id']]['catalogSourcePrice'] ?? '');
    if (!preg_match('~(\d{1,4}),(\d{2})~', $roh, $p)) { echo "Übersprungen (kein Betrag): {$a['name']}\n"; continue; }
    $cent = (int)$p[1] * 100 + (int)$p[2];
    $upd->execute([$cent, jetzt(), $a['id']]);
    protokoll('Bilal (Werkzeug)', $a['id'], 'Artikel geändert', 'Preis: auf Anfrage → ' . preis_anzeige($cent) . ' (im WhatsApp-Katalog in Rand statt Euro, als Euro übernommen)');
    echo "{$a['name']}: " . preis_anzeige($cent) . " €\n";
}
db()->commit();
exportieren();
