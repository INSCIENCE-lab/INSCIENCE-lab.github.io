import assert from 'node:assert/strict';
import {sunCameraRay,sampleSkyRGB,skyDisplay} from '../sky-camera.js';
import {transferKey} from '../atmosphere.js';
for(const sun of[0,2,45,89,90])for(const sunAz of[-90,0,90])for(const fov of[10,20,40]){
 const p={sun,sunAz};const ray=sunCameraRay(p,.5,.5,fov,1.2);assert(Math.abs(ray.elevation-sun)<1e-7);
 if(sun<89)assert(Math.abs(ray.azimuth-sunAz)<1e-7);
 for(const u of[0,.5,1])for(const v of[0,.5,1]){const q=sunCameraRay(p,u,v,fov,1.2);assert(Number.isFinite(q.elevation)&&Number.isFinite(q.azimuth));assert(q.elevation>=-90&&q.elevation<=90)}
}
assert(sunCameraRay({sun:2},.5,1,20,1).elevation<0);
const q={azimuthFrame:'solar-symmetric',xs:[0,90,180],ys:[0,45,90],grid:[[[1,2,3],[2,3,4],[3,4,5]],[[2,4,6],[3,5,7],[4,6,8]],[[3,6,9],[4,7,10],[5,8,11]]]};
const p={sun:2,sunAz:-90,exposure:2.5,displayMode:'auto'};
assert.deepEqual(sampleSkyRGB(q,p,20,-85),sampleSkyRGB(q,p,20,-95));
assert.deepEqual(skyDisplay(q,{...p,sunFov:10})([1,2,3]),skyDisplay(q,{...p,sunFov:40})([1,2,3]));
assert.equal(transferKey({...p,sunFov:10}),transferKey({...p,sunFov:40}));
assert.equal(transferKey({...p,sunAz:90}),transferKey({...p,sunAz:-90}));
console.log('Solar camera centred through zenith, rays finite, horizon visible, solar-plane symmetry, shared exposure and FOV-independent physical cache passed.');
