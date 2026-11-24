<?php
// Verwaltung Yabis Fliesenwelt – Pfade und Grundeinstellungen.
// Die Datenbank liegt bewusst AUSSERHALB des öffentlichen Ordners.
// Auf ALL-INKL: Ordner eine Ebene über dem Webordner (z. B. /www/htdocs/w0…/_yabis-verwaltung).
declare(strict_types=1);

const WEBORDNER = __DIR__ . '/..';

// Speicherort von Datenbank und Sicherungen. Über die Umgebungsvariable YABIS_VERWALTUNG änderbar.
define('DATENORDNER', getenv('YABIS_VERWALTUNG') ?: dirname(__DIR__, 2) . '/_yabis-verwaltung');
define('DATENBANK', DATENORDNER . '/katalog.sqlite');
define('SICHERUNGEN', DATENORDNER . '/sicherungen');
const MAX_SICHERUNGEN = 60;

// Öffentliche Dateien, die beim Speichern neu erzeugt werden
const EXPORT_DATEI = WEBORDNER . '/daten/katalog.js';
const BILDORDNER = WEBORDNER . '/bilder/katalog/eigene';
const BILDPFAD = 'bilder/katalog/eigene';

// Login-Bremse
const MAX_FEHLVERSUCHE = 5;
const SPERRE_MINUTEN = 15;

// Auswahllisten
const ARTEN = ['Fliesen', 'Marmoroptik', 'Vinyl', 'Holzoptik'];
const OBERFLAECHEN = ['Matt', 'Poliert', 'Lappato (Teilpoliert)', 'Seidenmatt', ''];   // '' = keine Angabe
const STANDARDFORMATE = ['60x120', '120x120', '60x60'];
const FORMATPREIS_OBERFLAECHEN = ['Poliert', 'Matt', 'Lappato (Teilpoliert)', 'Seidenmatt'];

// Verfügbarkeit: Schlüssel => [Text im Shop, Erklärung für die Verwaltung]. Neu und unbekannt = „anfrage“.
const VERFUEGBARKEIT = [
    'sofort'     => ['Sofort verfügbar', 'Liegt da oder kommt sicher kurzfristig'],
    'bestellung' => ['Auf Bestellung', 'Muss erst bestellt werden, Lieferzeit optional angeben'],
    'anfrage'    => ['Verfügbarkeit auf Anfrage', 'Unklar, Yabis prüft bei Anfrage'],
    'nicht'      => ['Zurzeit nicht lieferbar', 'Gerade nicht zu bekommen, bleibt aber im Shop sichtbar'],
];
