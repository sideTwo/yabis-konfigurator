<?php
// Einmaliger Import des bisherigen Katalogs (_quelle/katalog-vor-verwaltung/*.js) in die Datenbank.
// Aufruf: php verwaltung/werkzeug/import.php [--ersetzen]
// Ab dann ist die Datenbank die einzige Quelle. Ein erneuter Import überschreibt Yabis Änderungen nur mit --ersetzen.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../lib.php';

$ersetzen = in_array('--ersetzen', $argv, true);
$anzahl = (int)db()->query('SELECT COUNT(*) FROM artikel')->fetchColumn();
if ($anzahl > 0 && !$ersetzen) { fwrite(STDERR, "Die Datenbank enthält schon $anzahl Artikel. Abbruch (mit --ersetzen erzwingen).\n"); exit(1); }

function json_aus_js(string $datei, string $muster): array {
    $text = file_get_contents($datei);
    if (!preg_match($muster, $text, $m)) { throw new RuntimeException("Daten in $datei nicht gefunden"); }
    return json_decode($m[1], true, 512, JSON_THROW_ON_ERROR);
}

$js = WEBORDNER . '/_quelle/katalog-vor-verwaltung';
$produkte = json_aus_js("$js/catalog-products.js", '~window\.YabisCatalog\s*=\s*(\[.*\]);~s');
$bilder = json_aus_js("$js/catalog-images.js", '~const images\s*=\s*(\[.*?\]);\s*const byId~s');
$ki = json_aus_js("$js/catalog-reconstructions.js", '~new Set\((\[.*?\])\)~s');
$bildNach = array_column($bilder, null, 'id');
$kiIds = array_flip($ki);

if ($ersetzen) { sicherung(); db()->exec('DELETE FROM artikel'); db()->exec('DELETE FROM formatpreise'); }
$ins = db()->prepare('INSERT INTO artikel (id, name, art, oberflaeche, farbe, beschreibung, formate, preis_cent, waehrung, preis_datum, einheit, sichtbar, sortierung,
  foto, foto_oberflaeche, foto_verlegt, verlegt_format, ki_bild, quelle, intern_hersteller, intern_hersteller_seite, intern_bildquelle, geaendert_am, geaendert_von)
  VALUES (:id, :name, :art, :oberflaeche, :farbe, :beschreibung, :formate, :preis_cent, :waehrung, :preis_datum, :einheit, 1, :sortierung,
  :foto, :foto_oberflaeche, :foto_verlegt, :verlegt_format, :ki_bild, :quelle, :hersteller, :hersteller_seite, :bildquelle, :am, :von)');

db()->beginTransaction();
foreach ($produkte as $i => $p) {
    $b = $bildNach[$p['id']] ?? null;
    $ins->execute([
        'id' => $p['id'], 'name' => $p['name'], 'art' => $p['kind'] ?: 'Fliesen', 'oberflaeche' => $p['finish'] ?: 'Oberfläche auf Anfrage',
        'farbe' => $p['color'] ?? '', 'beschreibung' => $p['description'] ?? '', 'formate' => formate_text($p['formats'] ?? []),
        'preis_cent' => $p['catalogPriceCents'], 'waehrung' => $p['catalogCurrency'] ?? 'EUR', 'preis_datum' => $p['catalogPriceDate'] ?? '',
        'einheit' => $p['catalogUnit'], 'sortierung' => $i,
        'foto' => $b['photo'] ?? '', 'foto_oberflaeche' => $b['surface'] ?? '', 'foto_verlegt' => $b['installation'] ?? '',
        'verlegt_format' => $b['installationFormat'] ?? '',
        'ki_bild' => isset($kiIds[$p['id']]) ? 'bilder/katalog/ki-produktbilder-2026-11-18/' . $p['id'] . '.webp' : '',
        'quelle' => $p['source'] ?? '', 'hersteller' => $p['brand'] ?: ($b['brand'] ?? ''), 'hersteller_seite' => $b['page'] ?? '',
        'bildquelle' => $b['source'] ?? '', 'am' => jetzt(), 'von' => 'Import',
    ]);
}
// Formatpreise laut Yabis (WhatsApp 23./24.11.2026)
$fp = db()->prepare('INSERT OR REPLACE INTO formatpreise (format, oberflaeche, preis_cent) VALUES (?, ?, ?)');
foreach ([['120x120', 'Poliert', 5290], ['120x120', 'Matt', 4790], ['120x120', 'Lappato (Teilpoliert)', 4790],
          ['60x120', 'Poliert', 4490], ['60x120', 'Matt', 3990], ['60x120', 'Lappato (Teilpoliert)', 3990]] as $r) { $fp->execute($r); }
protokoll('Import', '', 'Katalog importiert', count($produkte) . ' Artikel aus _quelle/katalog-vor-verwaltung');
db()->commit();
exportieren();
echo count($produkte) . " Artikel importiert, " . count($bilder) . " mit Herstellerbild, " . count($ki) . " mit KI-Ansicht. Export: daten/katalog.js\n";
