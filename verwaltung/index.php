<?php
// Anmeldung und Artikelliste
declare(strict_types=1);
require __DIR__ . '/lib.php';
sitzung();

$fehler = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['anmelden'])) {
    token_pruefen();
    $name = (string)($_POST['name'] ?? '');
    if (gesperrt($name)) {
        $fehler = 'Zu viele Fehlversuche. Bitte in ' . SPERRE_MINUTEN . ' Minuten erneut versuchen.';
    } elseif (anmelden($name, (string)($_POST['passwort'] ?? ''))) {
        header('Location: index.php'); exit;
    } else {
        $fehler = 'Name oder Passwort stimmt nicht.';
    }
}

$benutzer = angemeldet();
if (!$benutzer) {
    kopf('Anmelden');
    echo '<section class="karte anmelden"><h1>Anmelden</h1>';
    if ($fehler) { echo '<p class="meldung fehler" role="alert">' . h($fehler) . '</p>'; }
    echo '<form method="post">' . token_feld() . '<input type="hidden" name="anmelden" value="1">'
       . '<label>Name<input name="name" autocomplete="username" required autofocus></label>'
       . '<label>Passwort<input name="passwort" type="password" autocomplete="current-password" required></label>'
       . '<button class="knopf haupt" type="submit">Anmelden</button></form></section>';
    fuss(); exit;
}

$artikel = db()->query('SELECT id, name, art, oberflaeche, formate, preis_cent, waehrung, sichtbar, foto, ki_bild, verfuegbarkeit, lieferzeit FROM artikel ORDER BY sortierung, rowid')->fetchAll();
$sichtbar = count(array_filter($artikel, fn($a) => (int)$a['sichtbar']));
kopf('Artikel', $benutzer);
echo meldung();
echo '<div class="leiste"><div><h1>Artikel</h1><p class="hinweis">' . count($artikel) . ' Artikel, davon ' . $sichtbar . ' im Shop sichtbar. Änderungen sind nach dem Speichern sofort im Shop.</p></div>'
   . '<a class="knopf haupt" href="artikel.php">+ Neuer Artikel</a></div>';
echo '<div class="filter"><label>Suchen<input type="search" id="suche" placeholder="Name, Art, Oberfläche …"></label>'
   . '<label>Art<select id="filter-art"><option value="">Alle</option>';
foreach (ARTEN as $a) { echo '<option>' . h($a) . '</option>'; }
echo '</select></label><label>Anzeige<select id="filter-sichtbar"><option value="">Alle</option><option value="1">Im Shop sichtbar</option><option value="0">Ausgeblendet</option></select></label>'
   . '<label>Preis<select id="filter-preis"><option value="">Alle</option><option value="ohne">Ohne Preis</option></select></label>'
   . '<label>Verfügbarkeit<select id="filter-verfuegbarkeit"><option value="">Alle</option>';
$verfOptionen = '';
foreach (VERFUEGBARKEIT as $k => [$text]) { $verfOptionen .= '<option value="' . $k . '">' . h($text) . '</option>'; }
echo $verfOptionen . '</select></label></div>';
echo '<p class="hinweis" id="treffer" aria-live="polite"></p><ul class="liste" id="liste">';
foreach ($artikel as $a) {
    $bild = $a['foto'] ?: $a['ki_bild'];
    $formate = implode(', ', array_map(fn($f) => $f[0] . ' × ' . $f[1], formate_liste($a['formate']))) ?: 'Format offen';
    $preis = $a['preis_cent'] === null ? 'Preis auf Anfrage' : preis_anzeige((int)$a['preis_cent']) . ' € / m²';
    echo '<li data-text="' . h(mb_strtolower($a['name'] . ' ' . $a['art'] . ' ' . $a['oberflaeche'] . ' ' . $a['id'])) . '" data-art="' . h($a['art']) . '" data-sichtbar="' . (int)$a['sichtbar'] . '" data-preis="' . ($a['preis_cent'] === null ? 'ohne' : 'mit') . '" data-verfuegbarkeit="' . h($a['verfuegbarkeit']) . '" id="a-' . h($a['id']) . '">'
       . '<a href="artikel.php?id=' . rawurlencode($a['id']) . '">'
       . ($bild ? '<img src="../' . h($bild) . '" alt="" loading="lazy" width="64" height="64">' : '<span class="ohne-bild" aria-hidden="true"></span>')
       . '<span class="name">' . h($a['name']) . '<small>' . h(implode(' · ', array_filter([$a['art'], $a['oberflaeche'], $formate]))) . '</small></span>'
       . '<span class="preis">' . h($preis) . '</span>'
       . ((int)$a['sichtbar'] ? '' : '<span class="marke-aus">Ausgeblendet</span>')
       . '</a>'
       . '<form class="schnell" method="post" action="verfuegbarkeit.php">' . token_feld() . '<input type="hidden" name="id" value="' . h($a['id']) . '">'
       . '<label class="schnell-feld verf-' . h($a['verfuegbarkeit']) . '"><span class="sr-only">Verfügbarkeit von ' . h($a['name']) . '</span><select name="verfuegbarkeit">'
       . str_replace('value="' . h($a['verfuegbarkeit']) . '"', 'value="' . h($a['verfuegbarkeit']) . '" selected', $verfOptionen)
       . '</select></label><button class="knopf klein" type="submit">Ändern</button></form>'
       . ($a['verfuegbarkeit'] === 'bestellung' && $a['lieferzeit'] !== '' ? '<p class="lieferzeit-info">Lieferzeit: ' . h($a['lieferzeit']) . '</p>' : '')
       . '</li>';
}
echo '</ul>';
fuss();
