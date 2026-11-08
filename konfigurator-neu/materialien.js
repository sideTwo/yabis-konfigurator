// Example decors for the bathroom demo. `base` selects the matching filmed
// material; grading changes only its tiled surfaces and retains photographed light.
window.BadMaterials={
  floor:[
    {id:'stein',base:'stein',name:'Greige · Original',detail:'Steinoptik · Ruhig',swatch:'../bilder/muster/stein-grau.webp'},
    {id:'marmor',base:'marmor',name:'Marmoroptik · Hell',detail:'Heller Stein · Geadert',swatch:'../bilder/muster/marmor-hell.webp'},
    {id:'silber',base:'stein',name:'Steinoptik · Silbergrau',detail:'Kühles Grau · Matt',swatch:'assets/muster-silber.webp',grade:{gain:[1.04,1.06,1.08],gamma:.72,saturation:.2,highlights:.85,albedo:.48}},
    {id:'mocca',base:'marmor',name:'Marmoroptik · Mocca',detail:'Warmes Braun · Geadert',swatch:'assets/muster-mocca.webp',grade:{gain:[.78,.57,.43],gamma:1.03,saturation:.55,highlights:.65,albedo:.42}}
  ],
  wall:[
    {id:'original',base:'original',name:'Anthrazit · Dunkel',detail:'Steinoptik · Dunkel',swatch:'../bilder/muster/beton-dunkel.webp'},
    {id:'hell',base:'hell',name:'Beige · Hell',detail:'Steinoptik · Warm',swatch:'../bilder/muster/marmor-hell.webp'},
    {id:'warmgrau',base:'hell',name:'Steinoptik · Warmgrau',detail:'Dezentes Grau · Matt',swatch:'assets/muster-warmgrau.webp',grade:{gain:[.87,.9,.91],gamma:.98,saturation:.25,highlights:.8,albedo:.54}},
    {id:'terracotta',base:'hell',name:'Steinoptik · Terrakotta',detail:'Warmer Erdton · Matt',swatch:'assets/muster-terracotta.webp',grade:{gain:[1.02,.68,.49],gamma:1.02,saturation:.35,highlights:.55,albedo:.48}}
  ]
};
