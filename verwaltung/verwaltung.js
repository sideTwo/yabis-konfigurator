// Verwaltung: Liste filtern, Fotovorschau, Warnung bei ungespeicherten Änderungen
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = id => document.getElementById(id);
  const liste = $('liste');
  if (liste) {
    const eintraege = [...liste.children];
    const filtern = () => {
      const text = $('suche').value.trim().toLowerCase(), art = $('filter-art').value, sichtbar = $('filter-sichtbar').value, preis = $('filter-preis').value, verf = $('filter-verfuegbarkeit').value;
      let n = 0;
      for (const li of eintraege) {
        const ok = (!text || li.dataset.text.includes(text)) && (!art || li.dataset.art === art) && (!sichtbar || li.dataset.sichtbar === sichtbar) && (!preis || li.dataset.preis === preis) && (!verf || li.dataset.verfuegbarkeit === verf);
        li.hidden = !ok; if (ok) n++;
      }
      $('treffer').textContent = n + ' von ' + eintraege.length + ' Artikeln';
    };
    for (const id of ['suche', 'filter-art', 'filter-sichtbar', 'filter-preis', 'filter-verfuegbarkeit']) $(id).addEventListener('input', filtern);
    filtern();
    // Verfügbarkeit in der Liste: Auswahl speichert sofort
    for (const form of liste.querySelectorAll('form.schnell')) form.querySelector('select').addEventListener('change', () => form.requestSubmit ? form.requestSubmit() : form.submit());
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
