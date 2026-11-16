const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
test('Echte Canvas-Pixel: acht Raumkombinationen und alle Formate/Fugenfarben ohne Lecks',{skip:!process.env.YABIS_CANVAS_PACKAGE},async()=>{
 const report=await require('../_dev/audit-bath.cjs').audit({repo:path.resolve(__dirname,'..'),output:process.env.YABIS_AUDIT_OUTPUT||path.resolve(__dirname,'../_dev/schirm/bad-audit')});
 const materials=require('../js/studio-core.js').materials,expected=materials.length<=4?materials.length**2*2:(materials.length*3-2)*2;
 assert.deepEqual(report.issues,[]);assert.equal(report.photoCombinations,expected);assert.equal(report.groutVariants,24);assert.equal(report.passed,true);
});
