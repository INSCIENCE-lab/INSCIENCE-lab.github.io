import assert from 'node:assert/strict';
import {atmosphere,exposureRGB,fixedAtmosphere,configuration,aerosolOptics} from '../atmosphere.js';
import {dustData} from '../dust-tables.js';
const p={...fixedAtmosphere('mars'),planet:'mars',T:5800,sunAz:0,alt:0};
for(const dust of [.15,.2,.3]){
 const day=atmosphere({...p,dust,sun:45},30,90),dawn=atmosphere({...p,dust,sun:0,sunAz:-90},1,0),dusk=atmosphere({...p,dust,sun:0,sunAz:90},1,0),opposite=atmosphere({...p,dust,sun:0},1,180);
 const D=exposureRGB(day.skySamples,316),A=exposureRGB(dawn.skySamples,316),B=exposureRGB(dusk.skySamples,316);
 assert(D[0]>D[1]&&D[1]>D[2],`day warm ${D}`);
 assert(A[2]>A[0]+15,`dawn blue ${A}`);assert(B[2]>B[0]+15,`dusk blue ${B}`);
 assert.deepEqual(dawn.skySamples,dusk.skySamples);assert(opposite.relative<dawn.relative*.05);
 console.log({dust,dayRGB:D,dawnRGB:A,duskRGB:B,oppositeRelative:opposite.relative/dawn.relative});
}
// Complete hybrid phase function conserves scattered energy over solid angle.
for(let ri=0;ri<3;ri++)for(const i of [7,17,27]){
 const table=dustData.tables[ri],ref=table[17][0],q={...p,radius:dustData.radii[ri],dust:1,dustH:1};let total=0;
 for(let j=1;j<720;j++){const t=j*Math.PI/720;total+=aerosolOptics(q,dustData.lambda[i],Math.cos(t),table,i,ref,0,0).dcross*Math.sin(t)*2*Math.PI*Math.PI/720;}
 assert(Math.abs(total/(table[i][1]/ref)-1)<1e-8);
}
// Fixed planets ignore a stray custom-gravity value; the exoplanet uses it.
for(const gravity of [2,9.8,30]){assert.equal(configuration({...p,planet:'earth',gravity}).g,9.81);assert.equal(configuration({...p,planet:'mars',gravity}).g,3.71);assert.equal(configuration({...p,planet:'custom',gravity}).g,gravity);}
console.log('Mars qualitative day/dawn/dusk checks, antisolar contrast, angular energy normalization, and planet-specific free-fall acceleration passed. This is not a photometric validation against rover observations.');
