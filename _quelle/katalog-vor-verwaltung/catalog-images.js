(() => {
  'use strict';
  const images = [
  {
    "id": "bercy-terra",
    "photo": "bilder/katalog/hersteller-2026-11-18/bercy-terra.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-bercy/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/11/BERCY_TERRA_60x120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "habitat-perla",
    "photo": "bilder/katalog/hersteller-2026-11-18/habitat-perla.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-habitat/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/10/HABITAT-PERLA-60x120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "bianco-mare",
    "photo": "bilder/katalog/hersteller-2026-11-18/bianco-mare.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/lab-bianco-mare/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/02/LAB-BIANCO-MARE-60X120.jpg",
    "format": "60x120",
    "finish": null
  },
  {
    "id": "concept-pearl",
    "photo": "bilder/katalog/hersteller-2026-11-18/concept-pearl.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-concept-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/08/GV-LAB-CONCEPT-PEARL-120X120.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "sense-pearl",
    "photo": "bilder/katalog/hersteller-2026-11-18/sense-pearl.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-sense-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/08/GV-LAB-SENSE-PEARL-120x120-1.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "halley-silver",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-silver.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-SILVER-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "halley-light",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-light.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-LIGHT-60X120.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "halley-white",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-white.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-WHITE-60x120-1.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "habitat-gris",
    "photo": "bilder/katalog/hersteller-2026-11-18/habitat-gris.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-habitat/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/10/HABITAT-GRIS-60x120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "bergamo-gris",
    "photo": "bilder/katalog/hersteller-2026-11-18/bergamo-gris.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-bergamo/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/02/BERGAMO_GRIS_60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "habitat-marfil",
    "photo": "bilder/katalog/hersteller-2026-11-18/habitat-marfil.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-habitat/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/10/HABITAT-MARFIL-60x120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "montiver-grey",
    "photo": "bilder/katalog/hersteller-2026-11-18/montiver-grey.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-montiver/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/09/MONTIVER-GREY-60X120_08.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "wonder-gris",
    "photo": "bilder/katalog/hersteller-2026-11-18/wonder-gris.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-wonder/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/07/WONDER-GRIS-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "wonder-base",
    "photo": "bilder/katalog/hersteller-2026-11-18/wonder-base.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-wonder/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/07/WONDER-BASE-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "montiver-mud",
    "photo": "bilder/katalog/hersteller-2026-11-18/montiver-mud.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-montiver/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/09/MONTIVER-MUD-60X120_08.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "ice-white",
    "photo": "bilder/katalog/hersteller-2026-11-18/ice-white.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-ice/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/04/ICE_WHITE_Brillo_60X120.jpg",
    "format": "60x120",
    "finish": null
  },
  {
    "id": "sena-blanco",
    "photo": "bilder/katalog/hersteller-2026-11-18/sena-blanco.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/lab-sena/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/08/LAB-SENA-BLANCO-60x120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "soul-light",
    "photo": "bilder/katalog/hersteller-2026-11-18/soul-light.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-soul/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/04/SOUL-LIGHT-60X120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "halley-mud",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-mud.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-MUD-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "concept-blue",
    "photo": "bilder/katalog/hersteller-2026-11-18/concept-blue.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-concept-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/09/GV-LAB-CONCEPT-BLUE-120X120.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "luxe-blue",
    "photo": "bilder/katalog/hersteller-2026-11-18/luxe-blue.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/luxe-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/07/LUXE_BLUE_60X120.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "concept-grey",
    "photo": "bilder/katalog/hersteller-2026-11-18/concept-grey.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-concept-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/08/GV-LAB-CONCEPT-GREY-120X120-1.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "halley-taupe",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-taupe.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-TAUPE-60X120.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "concept-white",
    "photo": "bilder/katalog/hersteller-2026-11-18/concept-white.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-concept-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/08/GV-LAB-CONCEPT-WHITE-120X120.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "isea-pearl",
    "photo": "bilder/katalog/hersteller-2026-11-18/isea-pearl.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-isea/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/09/ESS_ISEA_PEARL_60X120_02-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "isea-sand",
    "photo": "bilder/katalog/hersteller-2026-11-18/isea-sand.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-isea/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/09/ESS_ISEA_SAND_60X120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "soul-base",
    "photo": "bilder/katalog/hersteller-2026-11-18/soul-base.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-soul/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/04/SOUL_BASE_60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "halley-argent",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-argent.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-ARGENT-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "stonehill-light",
    "photo": "bilder/katalog/hersteller-2026-11-18/stonehill-light.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-stonehill-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/03/GV_LAB_STONEHILL_LIGHT_60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "stonehill-pearl",
    "photo": "bilder/katalog/hersteller-2026-11-18/stonehill-pearl.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-stonehill-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/03/GV-LAB-STONEHILL-PEARL-120X120.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "bercy-salvia",
    "photo": "bilder/katalog/hersteller-2026-11-18/bercy-salvia.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-bercy/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/11/BERCY_SALVIA_60x120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "bercy-grigio",
    "photo": "bilder/katalog/hersteller-2026-11-18/bercy-grigio.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-bercy/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/11/BERCY_GRIGIO_60x120-2.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "bianco-siberia-greige",
    "photo": "bilder/katalog/hersteller-2026-11-18/bianco-siberia-greige.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/bianco-siberia/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/02/BIANCO-SIBERIA-GREIGE-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "isea-white",
    "photo": "bilder/katalog/hersteller-2026-11-18/isea-white.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-isea/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/09/ESS_ISEA_WHITE_60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "royal-gold",
    "photo": "bilder/katalog/hersteller-2026-11-18/royal-gold.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/royal/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/03/ROYAL_60x120.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "soul-cement",
    "photo": "bilder/katalog/hersteller-2026-11-18/soul-cement.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-soul/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2023/04/SOUL_CEMENT_60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "wonder-mud",
    "photo": "bilder/katalog/hersteller-2026-11-18/wonder-mud.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-wonder/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/07/WONDER-MUD-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "halley-white-2",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-white-2.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-WHITE-60x120-1.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "stonehill-greige",
    "photo": "bilder/katalog/hersteller-2026-11-18/stonehill-greige.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-stonehill-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/03/GV-LAB-STONEHILL-GREIGE-120X120.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "concept-mud",
    "photo": "bilder/katalog/hersteller-2026-11-18/concept-mud.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/gv-lab-concept-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/09/GV-LAB-Concept-Mud_120x120-2.jpg",
    "format": "120x120",
    "finish": "Matt"
  },
  {
    "id": "halley-light-2",
    "photo": "bilder/katalog/hersteller-2026-11-18/halley-light-2.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/halley/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/11/HALLEY-LIGHT-60X120.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "habitat-marengo",
    "photo": "bilder/katalog/hersteller-2026-11-18/habitat-marengo.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-habitat/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2026/10/HABITAT-MARENGO-60x120-1.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "start-light",
    "photo": "bilder/katalog/hersteller-2026-11-18/start-light.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/start-2/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2025/04/START-LIGHT-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "montiver-pearl",
    "photo": "bilder/katalog/hersteller-2026-11-18/montiver-pearl.webp",
    "brand": "Prissmacer",
    "page": "https://www.prissmacer.es/serie/ess-montiver/",
    "source": "https://www.prissmacer.es/wp-content/uploads/2024/09/MONTIVER-PEARL-60X120.jpg",
    "format": "60x120",
    "finish": "Matt"
  },
  {
    "id": "onice-supreme-marfil-pul",
    "photo": "bilder/katalog/hersteller-2026-11-18/onice-supreme-marfil-pul.webp",
    "brand": "Roca Tiles",
    "page": "https://rocatileusa.com/collections/onice-supreme",
    "source": "https://rocatileusa.com/uploads/2025/Roca%20Collections/Onice%20Supreme/web-ONICE_SUPREME_BG_PULIDO_CARA06_60X120.png",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "taj-mahal-beige",
    "photo": "bilder/katalog/hersteller-2026-11-18/taj-mahal-beige.webp",
    "brand": "Roca Tiles",
    "page": "https://www.rocatiles.com/export/products/taj-mahal-beige-pulido-F6E0E54041-en/",
    "source": "https://www.rocatiles.com/wp-content/uploads/2025/10/F6E0E54041-scaled.jpg",
    "format": "60x120",
    "finish": "Poliert"
  },
  {
    "id": "ganges-visgraat",
    "photo": "bilder/katalog/hersteller-2026-11-18/ganges-visgraat.webp",
    "brand": "EKOFLOORS",
    "page": "https://ekofloors.nl/pvc-vloeren/pvc-herringbone-plak/ganges-visgraat-plak/",
    "source": "https://ekofloors.nl/wp-content/uploads/2025/04/Ganges-visgraat-plak-1540x1154.jpg",
    "format": null,
    "finish": null
  },
  {
    "id": "donau-visgraat",
    "photo": "bilder/katalog/hersteller-2026-11-18/donau-visgraat.webp",
    "brand": "EKOFLOORS",
    "page": "https://ekofloors.nl/pvc-vloeren/pvc-herringbone-klik/donau-visgraat-klik/",
    "source": "https://ekofloors.nl/wp-content/uploads/2023/12/Donau-visgraat-plak-topshot-1.jpg",
    "format": null,
    "finish": null
  },
  {
    "id": "rijn-visgraat",
    "photo": "bilder/katalog/hersteller-2026-11-18/rijn-visgraat.webp",
    "brand": "EKOFLOORS",
    "page": "https://ekofloors.nl/pvc-vloeren/pvc-herringbone-klik/rijn-visgraat-klik/",
    "source": "https://ekofloors.nl/wp-content/uploads/2023/12/Rijn-visgraat-klik-topshot.jpg",
    "format": null,
    "finish": null
  },
  {
    "id": "seine-kingsize-plak",
    "photo": "bilder/katalog/hersteller-2026-11-18/seine-kingsize-plak.webp",
    "brand": "EKOFLOORS",
    "page": "https://ekofloors.nl/pvc-vloeren/pvc-plak/seine-kingsize-plak/",
    "source": "https://ekofloors.nl/wp-content/uploads/2023/12/Seine-achtergrond-foto-website.jpg",
    "format": null,
    "finish": null
  }
];
  const byId = new Map(images.map(image => [image.id,image]));
  for (const product of window.YabisCatalog || []) {
    const image = byId.get(product.id);
    if (!image) continue;
    product.photo = image.photo;
    product.texture = image.photo;
    product.manufacturerImage = image;
  }
})();
