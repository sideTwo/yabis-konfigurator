/* Aligned room photographs; independent floor/wall masks preserve the room.
   Material lighting is photographic; grout is projected separately. */
(() => {
  'use strict';
  const shop = window.YabisShop;
  const $ = id => document.getElementById(id);
  const key = 'yabis-still-v1', grid = window.YabisTileGrid;
  const renderer = window.YabisRoomPreview;
  const canvas = $('room-preview'), ctx = canvas.getContext('2d');
  const plates = new Map();
  let base;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  const state = {floor: shop.find(saved.floor)?.id || 'habitat-perla', wall: shop.find(saved.wall)?.id || 'habitat-perla', wallHeight: saved.wallHeight === 'full' ? 'full' : '120'};
  for (const surface of ['floor','wall']) {
    state[`${surface}Format`] = grid.format(saved[`${surface}Format`]);
    state[`${surface}Grout`] = Object.hasOwn(grid.grouts,saved[`${surface}Grout`]) ? saved[`${surface}Grout`] : 'light';
  }
  const linked = shop.find(new URLSearchParams(location.search).get('product'));
  if (linked) state.floor = linked.id;
  const heightName = () => state.wallHeight === 'full' ? 'Raumhoch' : '1,20 m · Dusche raumhoch';
  const imageKey = (product, wallHeight) => `${product}-${wallHeight}`;
  function save() {
    const fields = {};
    for (const surface of ['floor', 'wall']) {
      fields[`${surface}Area`] = $(`${surface}-area`).value;
      fields[`${surface}Waste`] = $(`${surface}-waste`).value;
      fields[`${surface}Included`] = $(`include-${surface}`).checked;
    }
    try { localStorage.setItem(key, JSON.stringify({...state, ...fields})); } catch {}
  }
  function draw() {
    const floorImage = plates.get(imageKey(state.floor, '120'));
    const wallImage = plates.get(imageKey(state.wall, state.wallHeight));
    if (!base || !floorImage || !wallImage) return;
    renderer.render(ctx, {base, floor: floorImage, wall: wallImage, wallHeight: state.wallHeight});
    grid.draw(ctx, state, renderer, base);
    canvas.hidden = false; $('room-fallback').hidden = true;
    $('stage').setAttribute('aria-busy', 'false'); $('image-status').hidden = true; $('save-image').disabled = false;
    canvas.setAttribute('aria-label', `Badezimmer: Boden ${shop.find(state.floor).name}, ${state.floorFormat.join(' × ')} cm, Fuge ${grid.grouts[state.floorGrout].label}; Wand ${shop.find(state.wall).name}, ${state.wallFormat.join(' × ')} cm, Fuge ${grid.grouts[state.wallGrout].label}, ${heightName()}`);
  }
  function updateSelection() {
    for (const surface of ['floor', 'wall']) {
      $(`${surface}-name`).textContent = shop.find(state[surface]).name;
      $(`${surface}-format`).value = state[`${surface}Format`].join(',');
      $(`${surface}-grout`).value = state[`${surface}Grout`];
      $(`${surface}-spec`).textContent = `${state[`${surface}Format`].join(' × ')} cm · ${grid.grouts[state[`${surface}Grout`]].label}`;
      for (const button of $(`${surface}-materials`).querySelectorAll('button'))
        button.setAttribute('aria-pressed', String(button.dataset.product === state[surface]));
    }
    $('wall-height').value = state.wallHeight;
    $('wall-height-name').textContent = heightName();
    $('height-note').textContent = state.wallHeight === '120' ? 'Darüber bleibt die Wand weiß gestrichen. Mit Metall-Abschlussprofil; Dusche immer raumhoch gefliest.' : 'Alle Wandflächen bis zur Decke gefliest. Dusche immer raumhoch gefliest.';
    $('product-sources').replaceChildren();
    for (const id of new Set([state.floor, state.wall])) {
      const p = shop.find(id), block = document.createElement('div'); block.className = 'source-product';
      const image = new Image(); image.src = `../${p.photo}`; image.alt = `Originales Yabis-Katalogfoto: ${p.name}`; image.loading = 'lazy';
      const text = document.createElement('div'), name = document.createElement('strong'); name.textContent = p.name;
      const link = document.createElement('a'); link.href = p.source; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Yabis-Katalog ↗';
      const texture = document.createElement('a'); texture.href = `../${p.texture}`; texture.target = '_blank'; texture.rel = 'noopener'; texture.textContent = 'Verwendetes Herstellermuster ↗';
      text.append(name, link, texture); block.append(image, text); $('product-sources').append(block);
    }
    updateQuantities(); draw(); save();
  }
  $('wall-height').addEventListener('change', () => {
    state.wallHeight = $('wall-height').value === 'full' ? 'full' : '120';
    updateSelection();
  });
  for (const surface of ['floor', 'wall']) {
    $(`${surface}-format`).addEventListener('change', () => {
      state[`${surface}Format`] = grid.format($(`${surface}-format`).value); updateSelection();
    });
    $(`${surface}-grout`).addEventListener('change', () => {
      state[`${surface}Grout`] = $(`${surface}-grout`).value; updateSelection();
    });
    for (const p of shop.products) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'material'; button.dataset.product = p.id;
      button.setAttribute('aria-label', `${surface === 'floor' ? 'Boden' : 'Wand'}: ${p.name}`);
      const image = new Image(); image.src = `../${p.texture}`; image.alt = ''; image.className = 'swatch';
      const name = document.createElement('strong'); name.textContent = p.name;
      const detail = document.createElement('small'); detail.textContent = p.color + ' · ' + (p.id === 'bianco-mare' ? 'Marmoroptik' : p.finish);
      button.append(image, name, detail);
      button.addEventListener('click', () => { state[surface] = p.id; updateSelection(); });
      $(`${surface}-materials`).append(button);
    }
    const area = $(`${surface}-area`), waste = $(`${surface}-waste`), include = $(`include-${surface}`);
    if (shop.validArea(saved[`${surface}Area`])) area.value = saved[`${surface}Area`];
    if (['0','5','10','15'].includes(String(saved[`${surface}Waste`]))) waste.value = saved[`${surface}Waste`];
    if (typeof saved[`${surface}Included`] === 'boolean') include.checked = saved[`${surface}Included`];
    for (const field of [area, waste, include]) field.addEventListener('input', updateQuantities);
  }
  function updateQuantities() {
    for (const surface of ['floor', 'wall']) {
      const included = $(`include-${surface}`).checked;
      $(`${surface}-area`).disabled = !included; $(`${surface}-waste`).disabled = !included;
      const q = shop.calculate($(`${surface}-area`).value, $(`${surface}-waste`).value, state[`${surface}Format`]);
      $(`${surface}-quantity`).textContent = !included ? 'Wird nicht angefragt.' : q ? `${shop.de(q.total)} m² inkl. Verschnitt · rechnerisch ${q.pieces} Fliesen` : 'Bitte Ihre Fläche eintragen.';
    }
    $('cart-status').textContent = ''; $('to-cart').hidden = true; save();
  }
  function updateBasket() { $('basket-count').textContent = shop.getCart().length; }
  window.addEventListener('yabis-cart-change', updateBasket);
  window.addEventListener('storage', event => { if (event.key === shop.key) updateBasket(); });
  $('request-selection').addEventListener('submit', event => {
    event.preventDefault();
    const selected = ['floor','wall'].filter(s => $(`include-${s}`).checked);
    if (!selected.length) { $('cart-status').textContent = 'Bitte Boden oder Wand für die Anfrage auswählen.'; return; }
    try {
      const items = selected.map(surface => shop.item({product: state[surface], area: Number($(`${surface}-area`).value), waste: Number($(`${surface}-waste`).value), format: state[`${surface}Format`], surface: surface === 'floor' ? 'Boden (ohne Duschwanne)' : 'Wand', pattern: 'Kreuzfuge', grout: grid.grouts[state[`${surface}Grout`]].label, wallHeight: surface === 'wall' ? state.wallHeight : null}));
      shop.add(items);
      $('cart-status').textContent = `${items.length === 2 ? 'Boden und Wand wurden' : 'Ihre Auswahl wurde'} in den Anfragekorb übernommen.`; $('to-cart').hidden = false;
    } catch (error) { $('cart-status').textContent = error.message; }
  });
  $('save-image').addEventListener('click', () => {
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url;
      a.download = `Yabis-Bad-Boden-${state.floor}-${state.floorFormat.join('x')}-${state.floorGrout}-Wand-${state.wall}-${state.wallFormat.join('x')}-${state.wallGrout}-${state.wallHeight === '120' ? '120cm' : 'raumhoch'}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png');
  });
  updateQuantities(); updateSelection(); updateBasket();
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(src)); image.src = src;
    });
  }
  Promise.all([
    loadImage('assets/konfiguration/basis-weiss.png').then(image => { base = image; }),
    ...shop.products.flatMap(p => ['120', 'full'].map(wallHeight => loadImage(`assets/konfiguration-fugenlos/${p.id}-${wallHeight}.png`).then(image => { plates.set(imageKey(p.id, wallHeight), image); })))
  ]).then(draw).catch(() => {
    $('image-status').textContent = 'Ein Materialbild konnte nicht geladen werden. Bitte die Seite neu laden.';
    $('stage').setAttribute('aria-busy', 'false');
  });
})();
