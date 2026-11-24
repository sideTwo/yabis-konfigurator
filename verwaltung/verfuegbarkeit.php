<?php
// Schnelles Umstellen der Verfügbarkeit direkt aus der Artikelliste
declare(strict_types=1);
require __DIR__ . '/lib.php';
$benutzer = login_pflicht();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Location: index.php'); exit; }
token_pruefen();

$id = (string)($_POST['id'] ?? '');
$q = db()->prepare('SELECT name, verfuegbarkeit, lieferzeit FROM artikel WHERE id = ?');
$q->execute([$id]);
$a = $q->fetch();
$q->closeCursor();
if (!$a) { merke_meldung('fehler', 'Diesen Artikel gibt es nicht mehr.'); header('Location: index.php'); exit; }

try {
    $neu = (string)($_POST['verfuegbarkeit'] ?? '');
    // Lieferzeit bleibt erhalten, solange der Artikel „Auf Bestellung“ bleibt
    [$neu, $lieferzeit] = verfuegbarkeit_aus_eingabe($neu, $neu === 'bestellung' ? (string)$a['lieferzeit'] : '');
    if ($neu !== $a['verfuegbarkeit']) {
        sicherung();
        db()->prepare('UPDATE artikel SET verfuegbarkeit = ?, lieferzeit = ?, geaendert_am = ?, geaendert_von = ? WHERE id = ?')
            ->execute([$neu, $lieferzeit, jetzt(), $benutzer, $id]);
        protokoll($benutzer, $id, 'Artikel geändert', 'Verfügbarkeit: ' . verfuegbarkeit_text((string)$a['verfuegbarkeit'], (string)$a['lieferzeit']) . ' → ' . verfuegbarkeit_text($neu, $lieferzeit));
        exportieren();
    }
    merke_meldung('ok', '„' . $a['name'] . '“: ' . verfuegbarkeit_text($neu, $lieferzeit) . '. Der Shop zeigt es sofort.');
} catch (InvalidArgumentException $e) {
    merke_meldung('fehler', $e->getMessage());
}
header('Location: index.php#a-' . rawurlencode($id));
