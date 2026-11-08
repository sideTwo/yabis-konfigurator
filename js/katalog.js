(() => {
  'use strict';
  const { PRODUKTE, MAIL, TELEFON: WHATSAPP } = window.YK;
  const $ = s => document.querySelector(s);
  const node = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
  let korb = [];
  try { const data = JSON.parse(localStorage.getItem('yk-merkliste')); if (Array.isArray(data)) korb = data; } catch {}
  const save = () => { try { localStorage.setItem('yk-merkliste', JSON.stringify(korb)); } catch { $('#korb-status').textContent = 'Ihr Browser kann die Auswahl nicht dauerhaft speichern. Sie bleibt in dieser geöffneten Seite verfügbar.'; } };
  const quantity = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const field = (title, control) => { const label = node('label', title); label.append(control); return label; };
  function renderProducts() {
    const query = $('#suche').value.trim().toLocaleLowerCase('de');
    const area = $('#bereich').value;
    const products = PRODUKTE.filter(p => (!area || p.bereiche.includes(area)) && `${p.name} ${p.oberflaeche}`.toLocaleLowerCase('de').includes(query));
    $('#treffer').textContent = `${products.length} Beispielmuster`;
    $('#produktliste').replaceChildren();
    for (const p of products) {
      const card = node('article', '', 'produkt-karte');
      const texture = node('div', '', 'produkt-textur');
      if (p.textur.startsWith('holz:')) { const [,a,b] = p.textur.split(':'); texture.style.background = `repeating-linear-gradient(90deg,${a} 0 30px,${b} 30px 32px)`; }
      else texture.style.backgroundImage = `url("${p.textur}")`;
      card.append(texture, node('small', p.platzhalter ? 'Beispielmuster · Platzhaltertextur' : 'Beispielmuster'), node('h3', p.name), node('small', `${p.oberflaeche} · Preis auf Anfrage`));
      const form = node('form'), format = node('select'), amount = node('input');
      for (const [i,f] of p.formate.entries()) { const option = node('option', `${f[0]} × ${f[1]} cm`); option.value = i; format.append(option); }
      Object.assign(amount, {type:'number', min:'0.01', step:'0.01', required:true, placeholder:'z. B. 80'});
      const button = node('button', 'In den Anfragekorb', 'knopf knopf--rand'); button.type = 'submit';
      form.append(field('Format', format), field('Ihre Fläche (m²)', amount), button);
      form.addEventListener('submit', e => {
        e.preventDefault(); if (!quantity(amount.value)) return;
        korb.push({raum:'Katalog', flaeche:'Kundenfläche', produkt:p.id, name:p.name, format:p.formate[Number(format.value)], verband:'Nach Absprache', fuge:null, m2:Number(amount.value)});
        save(); renderCart(); $('#korb-status').textContent = `${p.name} wurde zum Anfragekorb hinzugefügt.`;
        button.textContent = 'Hinzugefügt ✓'; setTimeout(() => button.textContent = 'In den Anfragekorb', 1800);
      });
      card.append(form); $('#produktliste').append(card);
    }
    if (!products.length) $('#produktliste').append(node('p', 'Keine passenden Muster. Ändern Sie Suche oder Bereich.'));
  }
  function renderCart() {
    $('[data-anzahl]').textContent = korb.length;
    $('#korb').replaceChildren();
    if (!korb.length) $('#korb').append(node('p', 'Ihr Anfragekorb ist noch leer. Sie können unten auch direkt eine Anfrage schreiben.'));
    korb.forEach((p,i) => {
      const row = node('div', '', 'korb-posten'), description = node('div');
      description.append(node('strong', p.name), node('small', `${p.format.join(' × ')} cm · ${p.raum} · ${p.verband}${p.fuge ? ' · Fuge '+p.fuge : ''}`));
      const amount = node('input'); Object.assign(amount,{type:'number',min:'0.01',step:'0.01',value:p.m2,required:true});
      amount.addEventListener('input', () => { p.m2 = Number(amount.value); save(); });
      const remove = node('button','Entfernen','knopf knopf--leise'); remove.type='button'; remove.setAttribute('aria-label',`${p.name} entfernen`);
      remove.addEventListener('click', () => { korb.splice(i,1); save(); renderCart(); });
      row.append(description,field('Ihre Fläche (m²)',amount),remove); $('#korb').append(row);
    });
  }
  $('#suche').addEventListener('input',renderProducts); $('#bereich').addEventListener('change',renderProducts);
  addEventListener('storage', e => { if(e.key==='yk-merkliste') { try { const data=JSON.parse(e.newValue); korb=Array.isArray(data)?data:[]; renderCart(); } catch {} } });
  $('#kontaktformular').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target); const error = $('#kontakt-fehler'); error.textContent='';
    if (!korb.length && !f.get('nachricht').trim()) { error.textContent='Bitte wählen Sie ein Produkt oder beschreiben Sie Ihre Anfrage.'; return; }
    if (korb.some(p => !quantity(p.m2))) { error.textContent='Bitte geben Sie für alle Positionen eine Fläche größer als 0 m² an.'; return; }
    if (f.get('weg')==='Lieferung' && !/^\d{5}$/.test(f.get('plz'))) { error.textContent='Bitte geben Sie eine fünfstellige Liefer-PLZ ein.'; return; }
    const items = korb.map((p,i) => `${i+1}. ${p.name}, ${p.format.join(' × ')} cm, ${p.m2} m² ohne Verschnitt; ${p.raum}/${p.flaeche}, ${p.verband}${p.fuge ? ', Fuge '+p.fuge : ''}`).join('\n');
    const text = `Hallo Yabi’s, ich bitte um ein unverbindliches Angebot.\n\n${items}\n\n${f.get('nachricht')}\n\n${f.get('kundentyp')}\nFirma: ${f.get('firma') || '–'}\nName: ${f.get('name')}\nKontakt: ${f.get('rueckkontakt')}\n${f.get('weg')}${f.get('weg')==='Lieferung' ? ' nach '+f.get('plz') : ''}\n\nBitte Verfügbarkeit, Lieferzeit und gegebenenfalls Verschnitt/Verpackungseinheiten bestätigen.`;
    if (e.submitter?.value==='mail') location.href=`mailto:${MAIL}?subject=${encodeURIComponent('Produktanfrage Yabi’s Fliesenwelt')}&body=${encodeURIComponent(text)}`;
    else window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,'_blank','noopener');
  });
  renderProducts(); renderCart();
})();
