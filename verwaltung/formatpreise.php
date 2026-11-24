<?php
// Formatpreise: Preis pro m² je Format und Oberfläche, wenn ein Kunde ein anderes Format als das Katalogformat wählt
declare(strict_types=1);
require __DIR__ . '/lib.php';
$benutzer = login_pflicht();

$fehler = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    token_pruefen();
    try {
        $neu = [];
        foreach ((array)($_POST['preis'] ?? []) as $format => $zeile) {
            if (!in_array($format, STANDARDFORMATE, true) || !is_array($zeile)) { continue; }
            foreach ($zeile as $oberflaeche => $eingabe) {
                if (!in_array($oberflaeche, FORMATPREIS_OBERFLAECHEN, true)) { continue; }
                try { $cent = preis_aus_eingabe((string)$eingabe); }
                catch (InvalidArgumentException) { throw new InvalidArgumentException('Bitte Preise als Zahl eingeben, z. B. 39,90 (' . str_replace('x', ' × ', $format) . ", $oberflaeche)."); }
                if ($cent !== null) { $neu[] = [$format, $oberflaeche, $cent]; }
            }
        }
        $alt = db()->query("SELECT format || ' ' || oberflaeche AS k, preis_cent FROM formatpreise")->fetchAll(PDO::FETCH_KEY_PAIR);
        sicherung();
        db()->beginTransaction();
        db()->exec('DELETE FROM formatpreise');
        $ins = db()->prepare('INSERT INTO formatpreise (format, oberflaeche, preis_cent) VALUES (?, ?, ?)');
        $diff = [];
        foreach ($neu as $r) {
            $ins->execute($r);
            $k = $r[0] . ' ' . $r[1];
            if (!isset($alt[$k]) || (int)$alt[$k] !== $r[2]) { $diff[] = "$k: " . (isset($alt[$k]) ? preis_anzeige((int)$alt[$k]) : '–') . ' → ' . preis_anzeige($r[2]); }
            unset($alt[$k]);
        }
        foreach ($alt as $k => $v) { $diff[] = "$k: " . preis_anzeige((int)$v) . ' → entfernt'; }
        protokoll($benutzer, '', 'Formatpreise geändert', $diff ? implode(' · ', $diff) : 'keine Änderung');
        db()->commit();
        exportieren();
        merke_meldung('ok', 'Formatpreise gespeichert. Der Shop rechnet ab sofort damit.');
        header('Location: formatpreise.php'); exit;
    } catch (Throwable $e) {
        if (db()->inTransaction()) { db()->rollBack(); }
        $fehler = $e instanceof InvalidArgumentException ? $e->getMessage() : 'Speichern ist fehlgeschlagen. Bitte noch einmal versuchen.';
    }
}

$preise = [];
foreach (db()->query('SELECT * FROM formatpreise') as $r) { $preise[$r['format']][$r['oberflaeche']] = (int)$r['preis_cent']; }
kopf('Formatpreise', $benutzer);
echo meldung();
echo '<h1>Formatpreise</h1><p class="hinweis lang">Wählt ein Kunde ein anderes Format als das Katalogformat des Artikels, rechnet der Shop mit diesen Preisen pro m², inkl. MwSt. '
   . 'Im Katalogformat gilt immer der Preis am Artikel. Leere Felder: Der Shop nimmt den Preis am Artikel als Richtwert. Für Vinyl gelten keine Formatpreise.</p>';
if ($fehler) { echo '<p class="meldung fehler" role="alert">' . h($fehler) . '</p>'; }
echo '<form method="post">' . token_feld() . '<div class="tabelle-rahmen"><table class="tabelle"><thead><tr><th scope="col">Format</th>';
foreach (FORMATPREIS_OBERFLAECHEN as $o) { echo '<th scope="col">' . h($o) . '</th>'; }
echo '</tr></thead><tbody>';
foreach (STANDARDFORMATE as $f) {
    echo '<tr><th scope="row">' . str_replace('x', ' × ', $f) . ' cm</th>';
    foreach (FORMATPREIS_OBERFLAECHEN as $o) {
        $wert = isset($preise[$f][$o]) ? preis_anzeige($preise[$f][$o]) : '';
        echo '<td><input name="preis[' . $f . '][' . h($o) . ']" value="' . h($wert) . '" inputmode="decimal" placeholder="–" aria-label="' . h(str_replace('x', ' × ', $f) . ' cm, ' . $o) . '"></td>';
    }
    echo '</tr>';
}
echo '</tbody></table></div><div class="speichern"><button class="knopf haupt" type="submit">Formatpreise speichern</button></div></form>';
fuss();
