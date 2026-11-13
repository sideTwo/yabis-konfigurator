/* Fixed photograph: independent photographic surfaces, white paint and fixtures. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YabisRoomPreview = api;
})(typeof window === 'object' ? window : this, () => {
  'use strict';
  const width = 1672, height = 941;
  const floor = [
    [[135,941],[498,639],[707,639],[877,637],[923,641],[1008,721],[1274,721],[1274,698],[1672,941]]
  ];
  const shower = [
    [[888,80],[945,80],[945,639],[888,639]],
    [[945,80],[1008,80],[1008,100],[945,100]],
    [[1008,80],[1168,80],[1247,0],[1275,0],[1275,697],[1168,633],[1008,633]]
  ];
  const walls120 = [
    [[0,231],[498,366],[498,639],[135,941],[0,941]],
    [[498,366],[707,366],[707,639],[498,639]],
    [[1275,338],[1672,234],[1672,941],[1275,698]],
    ...shower
  ];
  const wallsFull = [
    [[0,0],[424,0],[498,80],[498,639],[135,941],[0,941]],
    [[498,80],[707,80],[707,639],[498,639]],
    [[707,80],[888,80],[888,98],[707,98]],
    [[875,98],[888,98],[888,639],[875,639]],
    [[1275,0],[1672,0],[1672,941],[1275,698]],
    ...shower
  ];
  const floorOcclusions = [
    // Measured WC silhouette: its bowl projects in front of the floor plane.
    [[1350,601],[1428,599],[1450,600],[1468,605],[1485,610],[1501,615],[1518,620],[1550,630],[1578,640],[1589,647],[1585,653],[1614,661],[1616,666],[1616,680],[1615,700],[1613,720],[1610,740],[1606,760],[1602,780],[1597,800],[1594,812],[1500,814],[1450,813],[1400,805],[1380,798],[1350,784],[1330,762],[1320,743],[1311,721],[1303,701],[1296,681],[1292,671],[1289,660],[1287,639],[1287,621],[1288,614],[1291,609],[1307,604],[1330,602]]
  ];
  function trace(ctx, polygons) {
    for (const points of polygons) {
      ctx.moveTo(...points[0]);
      for (const point of points.slice(1)) ctx.lineTo(...point);
      ctx.closePath();
    }
  }
  function layer(ctx, image, polygons, holes = []) {
    ctx.save(); ctx.beginPath();
    trace(ctx, polygons); ctx.clip();
    if (holes.length) {
      ctx.beginPath(); ctx.rect(0, 0, width, height); trace(ctx, holes);
      ctx.clip('evenodd');
    }
    ctx.drawImage(image, 0, 0, width, height); ctx.restore();
  }
  function render(ctx, {base, floor: floorImage, wall, wallHeight}) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(base, 0, 0, width, height);
    layer(ctx, wall, wallHeight === 'full' ? wallsFull : walls120);
    // The complete WC comes from one photographic plate, including the part
    // projecting across the wall/floor junction. Avoid a seam through its bowl.
    layer(ctx, wall, floorOcclusions);
    layer(ctx, floorImage, floor, floorOcclusions);
  }
  return {width, height, floor, walls120, wallsFull, floorOcclusions, render};
});
