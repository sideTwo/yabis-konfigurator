<?php
// Wer hat wann was geändert
declare(strict_types=1);
require __DIR__ . '/lib.php';
$benutzer = login_pflicht();
$eintraege = db()->query('SELECT p.*, a.name AS artikelname FROM protokoll p LEFT JOIN artikel a ON a.id = p.artikel ORDER BY p.nr DESC LIMIT 300')->fetchAll();
$sicherungen = count(glob(SICHERUNGEN . '/katalog-*.sqlite') ?: []);
kopf('Protokoll', $benutzer);
echo '<h1>Protokoll</h1><p class="hinweis">Die letzten 300 Änderungen. Vor jedem Speichern wird automatisch eine Sicherung angelegt (' . $sicherungen . ' vorhanden, die ältesten werden gelöscht).</p>';
echo '<div class="tabelle-rahmen"><table class="tabelle protokoll"><thead><tr><th scope="col">Zeit</th><th scope="col">Wer</th><th scope="col">Was</th><th scope="col">Artikel</th><th scope="col">Details</th></tr></thead><tbody>';
foreach ($eintraege as $e) {
    echo '<tr><td>' . h(date('d.m.Y H:i', strtotime($e['zeit']))) . '</td><td>' . h($e['benutzer']) . '</td><td>' . h($e['aktion']) . '</td><td>'
       . ($e['artikel'] !== '' ? '<a href="artikel.php?id=' . rawurlencode($e['artikel']) . '">' . h($e['artikelname'] ?: $e['artikel']) . '</a>' : '') . '</td><td>' . h($e['details']) . '</td></tr>';
}
echo '</tbody></table></div>';
fuss();
