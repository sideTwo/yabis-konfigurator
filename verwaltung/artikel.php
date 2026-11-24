<?php
// Artikel bearbeiten oder neu anlegen
declare(strict_types=1);
require __DIR__ . '/lib.php';
$benutzer = login_pflicht();

$id = (string)($_GET['id'] ?? '');
$a = null;
if ($id !== '') {
    $q = db()->prepare('SELECT * FROM artikel WHERE id = ?');
    $q->execute([$id]);
    $a = $q->fetch() ?: null;
    $q->closeCursor();
    if (!$a) { http_response_code(404); kopf('Nicht gefunden', $benutzer); echo '<p>Diesen Artikel gibt es nicht. <a href="index.php">Zur Liste</a></p>'; fuss(); exit; }
}
$neu = $a === null;
$fehler = '';
$werte = $a ?? ['name' => '', 'art' => 'Fliesen', 'oberflaeche' => 'Oberfläche auf Anfrage', 'beschreibung' => '', 'formate' => '', 'preis_cent' => null,
                'waehrung' => 'EUR', 'sichtbar' => 1, 'foto' => '', 'ki_bild' => '', 'intern_hersteller' => '', 'preis_datum' => ''];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    token_pruefen();
    try {
        $name = trim((string)($_POST['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 120) { throw new InvalidArgumentException('Bitte einen Namen eingeben (höchstens 120 Zeichen).'); }
        $art = (string)($_POST['art'] ?? '');
        if (!in_array($art, ARTEN, true) && $art !== ($a['art'] ?? null)) { throw new InvalidArgumentException('Bitte eine Art auswählen.'); }
        $oberflaeche = (string)($_POST['oberflaeche'] ?? '');
        if (!in_array($oberflaeche, OBERFLAECHEN, true) && $oberflaeche !== ($a['oberflaeche'] ?? null)) { throw new InvalidArgumentException('Bitte eine Oberfläche auswählen.'); }
        $formate = [];
        foreach ((array)($_POST['formate'] ?? []) as $f) { if (in_array($f, STANDARDFORMATE, true)) { $formate[] = $f; } }
        $weitere = trim((string)($_POST['weitere_formate'] ?? ''));
        foreach (preg_split('~[;,\s]+~', mb_strtolower(str_replace(['×', ' x '], 'x', $weitere))) ?: [] as $f) {
            if ($f === '') { continue; }
            if (!preg_match('~^(\d{2,3})x(\d{2,3})$~', $f)) { throw new InvalidArgumentException("„{$f}“ ist kein Format. Bitte so schreiben: 30x60."); }
            $formate[] = $f;
        }
        $formate = implode(';', array_values(array_unique($formate)));
        $preis = preis_aus_eingabe((string)($_POST['preis'] ?? ''));
        $beschreibung = trim(str_replace("\r", '', (string)($_POST['beschreibung'] ?? '')));
        if (mb_strlen($beschreibung) > 2000) { throw new InvalidArgumentException('Die Beschreibung ist länger als 2000 Zeichen.'); }
        $sichtbar = isset($_POST['sichtbar']) ? 1 : 0;
        $hersteller = mb_substr(trim((string)($_POST['intern_hersteller'] ?? '')), 0, 120);

        $zielId = $neu ? neue_id($name) : $id;
        $foto = $werte['foto'];
        if (($_FILES['foto']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) { $foto = bild_speichern($_FILES['foto'], $zielId); }

        $preisGeaendert = $neu || $preis !== ($a['preis_cent'] === null ? null : (int)$a['preis_cent']);
        $daten = [
            'name' => $name, 'art' => $art, 'oberflaeche' => $oberflaeche, 'beschreibung' => $beschreibung, 'formate' => $formate,
            'preis_cent' => $preis, 'waehrung' => $preisGeaendert && $preis !== null ? 'EUR' : $werte['waehrung'],
            'preis_datum' => $preisGeaendert ? date('d.m.Y') : $werte['preis_datum'],
            'sichtbar' => $sichtbar, 'foto' => $foto, 'intern_hersteller' => $hersteller,
            'geaendert_am' => jetzt(), 'geaendert_von' => $benutzer,
        ];

        $aenderungen = [];
        foreach (['name' => 'Name', 'art' => 'Art', 'oberflaeche' => 'Oberfläche', 'formate' => 'Formate', 'preis_cent' => 'Preis', 'sichtbar' => 'Sichtbar', 'foto' => 'Foto', 'beschreibung' => 'Beschreibung'] as $k => $label) {
            $alt = $a[$k] ?? null; $neuWert = $daten[$k];
            if ((string)$alt !== (string)$neuWert) {
                $aenderungen[] = $k === 'preis_cent' ? 'Preis: ' . ($alt === null ? 'auf Anfrage' : preis_anzeige((int)$alt)) . ' → ' . ($neuWert === null ? 'auf Anfrage' : preis_anzeige($neuWert))
                    : ($k === 'beschreibung' ? 'Beschreibung geändert' : "$label: " . ($k === 'sichtbar' ? ($alt ? 'ja' : 'nein') . ' → ' . ($neuWert ? 'ja' : 'nein') : "$alt → $neuWert"));
            }
        }

        sicherung();
        if ($neu) {
            $max = (int)db()->query('SELECT COALESCE(MAX(sortierung), 0) FROM artikel')->fetchColumn();
            db()->prepare('INSERT INTO artikel (id, name, art, oberflaeche, beschreibung, formate, preis_cent, waehrung, preis_datum, sichtbar, sortierung, foto, intern_hersteller, quelle, geaendert_am, geaendert_von)
                VALUES (:id, :name, :art, :oberflaeche, :beschreibung, :formate, :preis_cent, :waehrung, :preis_datum, :sichtbar, :sortierung, :foto, :intern_hersteller, \'\', :geaendert_am, :geaendert_von)')
                ->execute($daten + ['id' => $zielId, 'sortierung' => $max + 1]);
            protokoll($benutzer, $zielId, 'Artikel angelegt', $name);
        } else {
            $set = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($daten)));
            db()->prepare("UPDATE artikel SET $set WHERE id = :id")->execute($daten + ['id' => $zielId]);
            protokoll($benutzer, $zielId, 'Artikel geändert', $aenderungen ? implode(' · ', $aenderungen) : 'keine Änderung');
        }
        exportieren();
        merke_meldung('ok', $neu ? "„{$name}“ ist angelegt und im Shop." : "„{$name}“ ist gespeichert. Der Shop zeigt die Änderung sofort.");
        header('Location: artikel.php?id=' . rawurlencode($zielId)); exit;
    } catch (Throwable $e) {
        // Eigene Meldungen zeigen, technische Fehler (Datenbank, Dateien) nur ins Fehlerprotokoll
        $eigene = ($e instanceof InvalidArgumentException || $e instanceof RuntimeException) && !($e instanceof PDOException);
        $fehler = $eigene ? $e->getMessage() : 'Speichern ist fehlgeschlagen. Bitte noch einmal versuchen oder Bilal Bescheid geben.';
        if (!$eigene) { error_log('Verwaltung: ' . $e->getMessage()); }
        $werte = array_merge($werte, [
            'name' => (string)($_POST['name'] ?? ''), 'art' => (string)($_POST['art'] ?? ''), 'oberflaeche' => (string)($_POST['oberflaeche'] ?? ''),
            'beschreibung' => (string)($_POST['beschreibung'] ?? ''), 'sichtbar' => isset($_POST['sichtbar']) ? 1 : 0,
            'intern_hersteller' => (string)($_POST['intern_hersteller'] ?? ''),
        ]);
        $preisEingabe = (string)($_POST['preis'] ?? '');
    }
}

$formate = array_map(fn($f) => $f[0] . 'x' . $f[1], formate_liste((string)$werte['formate']));
$weitere = implode(', ', array_diff($formate, STANDARDFORMATE));
$bild = $werte['foto'] ?: $werte['ki_bild'];
kopf($neu ? 'Neuer Artikel' : $werte['name'], $benutzer);
echo meldung();
echo '<p class="zurueck"><a href="index.php">← Alle Artikel</a></p>';
echo '<h1>' . ($neu ? 'Neuer Artikel' : h($werte['name'])) . '</h1>';
if ($fehler) { echo '<p class="meldung fehler" role="alert">' . h($fehler) . '</p>'; }
echo '<form class="artikel" method="post" enctype="multipart/form-data">' . token_feld();
echo '<div class="spalten"><div class="karte">';
echo '<label>Name<input name="name" value="' . h($werte['name']) . '" required maxlength="120"></label>';
echo '<div class="zwei"><label>Art<select name="art">';
$arten = in_array($werte['art'], ARTEN, true) ? ARTEN : array_merge([$werte['art']], ARTEN);
foreach ($arten as $o) { echo '<option' . ($o === $werte['art'] ? ' selected' : '') . '>' . h($o) . '</option>'; }
echo '</select></label><label>Oberfläche<select name="oberflaeche">';
$ofl = in_array($werte['oberflaeche'], OBERFLAECHEN, true) ? OBERFLAECHEN : array_merge([$werte['oberflaeche']], OBERFLAECHEN);
foreach ($ofl as $o) { echo '<option' . ($o === $werte['oberflaeche'] ? ' selected' : '') . '>' . h($o) . '</option>'; }
echo '</select></label></div>';
echo '<fieldset><legend>Formate im Katalog</legend><div class="haken">';
foreach (STANDARDFORMATE as $f) { echo '<label class="haken-feld"><input type="checkbox" name="formate[]" value="' . $f . '"' . (in_array($f, $formate, true) ? ' checked' : '') . '>' . str_replace('x', ' × ', $f) . ' cm</label>'; }
echo '</div><label>Weitere Formate <span>optional, z. B. 30x60, 80x80</span><input name="weitere_formate" value="' . h($weitere) . '"></label>'
   . '<p class="hinweis">Ohne Haken steht im Shop „Format auf Anfrage“. Der Preis eines anderen Formats kommt aus den <a href="formatpreise.php">Formatpreisen</a>.</p></fieldset>';
$preisWert = $preisEingabe ?? preis_anzeige($werte['preis_cent'] === null ? null : (int)$werte['preis_cent']);
echo '<label>Preis pro m² in Euro, inkl. MwSt. <span>leer lassen für „Preis auf Anfrage“</span><input name="preis" inputmode="decimal" value="' . h($preisWert) . '" placeholder="z. B. 39,90"></label>';
if ($werte['waehrung'] !== 'EUR') { echo '<p class="hinweis warnung">Im WhatsApp-Katalog stand hier eine unklare Währung. Der Shop zeigt „Preis auf Anfrage“, bis ein Preis in Euro eingetragen ist.</p>'; }
if ($werte['preis_datum']) { echo '<p class="hinweis">Preis zuletzt geändert am ' . h($werte['preis_datum']) . '.</p>'; }
echo '<label>Beschreibung<textarea name="beschreibung" rows="6" maxlength="2000">' . h($werte['beschreibung']) . '</textarea></label>';
echo '<label class="haken-feld gross"><input type="checkbox" name="sichtbar" value="1"' . ((int)$werte['sichtbar'] ? ' checked' : '') . '>Im Shop zeigen <span>Haken weg = ausgeblendet, z. B. wenn ausverkauft</span></label>';
echo '</div><div class="karte">';
echo '<p class="feldname">Foto</p>' . ($bild ? '<img class="vorschau" id="foto-vorschau" src="../' . h($bild) . '" alt="Aktuelles Foto">' : '<img class="vorschau" id="foto-vorschau" alt="" hidden>');
echo '<label class="hochladen">Neues Foto wählen<input type="file" name="foto" id="foto" accept="image/jpeg,image/png,image/webp"></label>'
   . '<p class="hinweis">Am besten ein gerades Foto der Fliese bei Tageslicht. Wird automatisch verkleinert.</p>';
echo '<label>Hersteller <span>nur intern, erscheint nie im Shop</span><input name="intern_hersteller" value="' . h($werte['intern_hersteller']) . '" maxlength="120"></label>';
if (!$neu) { echo '<p class="hinweis">Artikelnummer: ' . h($id) . ($a['geaendert_von'] ? ' · zuletzt geändert ' . h(date('d.m.Y H:i', strtotime($a['geaendert_am']))) . ' von ' . h($a['geaendert_von']) : '') . '</p>'; }
echo '</div></div><div class="speichern"><button class="knopf haupt" type="submit">' . ($neu ? 'Artikel anlegen' : 'Speichern') . '</button><a href="index.php">Abbrechen</a></div></form>';
fuss();
