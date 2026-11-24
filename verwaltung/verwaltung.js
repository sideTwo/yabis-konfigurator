// Verwaltung: Liste filtern, Fotovorschau, Warnung bei ungespeicherten Änderungen
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const liste = $('liste');
  if (liste) {
    const eintraege = [...liste.children];
    const filtern = () => {
      const text = $('suche').value.trim().toLowerCase(), art = $('filter-art').value, sichtbar = $('filter-sichtbar').value, preis = $('filter-preis').value;
      let n = 0;
      for (const li of eintraege) {
        const ok = (!text || li.dataset.text.includes(text)) && (!art || li.dataset.art === art) && (!sichtbar || li.dataset.sichtbar === sichtbar) && (!preis || li.dataset.preis === preis);
        li.hidden = !ok; if (ok) n++;
      }
      $('treffer').textContent = n + ' von ' + eintraege.length + ' Artikeln';
    };
    for (const id of ['suche', 'filter-art', 'filter-sichtbar', 'filter-preis']) $(id).addEventListener('input', filtern);
    filtern();
  }
  const foto = $('foto');
  if (foto) foto.addEventListener('change', () => {
    const datei = foto.files && foto.files[0], bild = $('foto-vorschau');
    if (!datei) return;
    bild.src = URL.createObjectURL(datei); bild.hidden = false; bild.alt = 'Neues Foto (noch nicht gespeichert)';
  });
  const form = document.querySelector('form.artikel');
  if (form) {
    let geaendert = false;
    form.addEventListener('input', () => { geaendert = true; });
    form.addEventListener('submit', () => { geaendert = false; });
    addEventListener('beforeunload', e => { if (geaendert) { e.preventDefault(); e.returnValue = ''; } });
  }
})();
