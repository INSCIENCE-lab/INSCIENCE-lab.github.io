import assert from 'node:assert/strict';
import * as P from '../physics.js';
import {exps,defaults} from '../content.js';
import {enhance} from '../enhancements.js';
import {chartData,polarizationField,atomEvent} from '../visuals.js';
enhance(exps);
const near=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
let seed=42,random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
for(const e of exps)for(let i=0;i<60;i++){
 const p=defaults(e);for(const f of e.fields)if(f.options){const v=f.options[Math.floor(random()*f.options.length)][0];p[f.key]=isNaN(+v)?v:+v;}else p[f.key]=Math.min(f.max,f.min+Math.round(random()*(f.max-f.min)/f.step)*f.step);
 const out=P.outputs(e.id,p,0),data=chartData(e,p,0);
 for(const [key,v]of Object.entries(out))assert(Number.isFinite(v)||(e.id==='refraction'&&/заломлення|Відхилення|розділення/.test(key)),`${e.id}: ${key}`);
 assert(data.pts.every(point=>point.every(Number.isFinite)),e.id+' chart is finite');
}
const e=id=>exps.find(x=>x.id===id);
// A fixed physical coordinate must show twice as many periods when lambda halves.
for(const lambda of [200,400,550,800,1600]){const p={...defaults(e('wave')),lambda},d=chartData(e('wave'),p,0);assert.deepEqual(d.fixedY,[-2.1,2.1]);near(d.pts.at(-1)[0],1.65);near(d.pts[200][1],p.amp*Math.sin(2*Math.PI*d.pts[200][0]*1000/lambda));}
// Grating zero is distinct from single-slit envelope zero.
for(const n of [2,5,12])for(const spacing of [25,30,50]){const p={...defaults(e('diffraction')),kind:'grating',n,spacing},o=P.outputs('diffraction',p,0);assert(o['Кут першого мінімуму (град)']<o['Кут мінімуму огинаючої (град)']);assert(P.diffraction(P.rad(o['Кут першого мінімуму (град)']),p)<1e-20);near(P.diffraction(0,p),1);}
// Two orthogonal analyzer outputs sum to the incident intensity.
const pol=defaults(e('polarization'));
for(const input of ['linear','circular','elliptical','unpolarized'])for(let first=0;first<=180;first+=15){const p={...pol,input,inputAngle:37,count:1,first};near(P.polarization(p).intensity+P.polarization({...p,first:first+90}).intensity,1);for(const stage of [0,1]){const f=polarizationField(p,.4,.7,stage);near(f.E.reduce((a,v,i)=>a+v*f.cB[i],0),0);near(Math.hypot(...f.E),Math.hypot(...f.cB));}}
for(const metal of Object.keys(P.works))for(const lambda of [180,450,750]){const q=P.photo({metal,lambda,intensity:100,voltage:0});assert(q.current>=0&&q.current<=100);near(P.photo({metal,lambda,intensity:0,voltage:0}).current,0);near(P.photo({metal,lambda,intensity:100,voltage:q.ke+.1}).current,0);}
for(const species of Object.keys(P.atomicSpecies))if(species!=='H')for(const [atomicLine,table] of P.atomicSpecies[species].lines){const q=P.atom({species,atomicLine});near(P.H*P.C/(q.lambda*1e-9)/P.EV,q.de);assert(Math.abs(q.lambda/table-1)<.0005);}
near(P.atom({upper:3,lower:2}).lambda,656.4696,1e-6);
assert.equal(atomEvent({upper:3,lower:2,kind:'emission'},100).level,2);
for(const transition of ['rotation','vibration','electronic','fluorescence'])for(let J=1;J<=10;J++){const q=P.molecule({transition,J,v:2});near(P.H*P.C/(q.lambda*1e-9)/P.EV,q.de);if(transition==='electronic'){near(q.outE,0);near(q.de,(3.1+.22*2+.00024*J*(J+1))-.00024*(J-1)*J);}else if(transition==='fluorescence')near(q.inE,q.outE+q.loss);else near(q.inE,0);}
// Integrated Planck radiance must recover Stefan–Boltzmann surface flux.
for(const T of [2500,5800,40000]){let integral=0;const lo=Math.log(1),hi=Math.log(1e8),n=20000,step=(hi-lo)/n;for(let i=0;i<n;i++){const nm=Math.exp(lo+(i+.5)*step);integral+=Math.PI*P.planck(nm,T)*nm*1e-9*step;}near(integral,P.SIGMA*T**4,2e-6);}
for(let T=2500;T<=40000;T+=100){const q=P.star({T,radius:1});assert(P.stellarClassColours[q.cls]);assert(!(q.rgb[1]>q.rgb[0]&&q.rgb[1]>q.rgb[2]));assert.deepEqual(q.rgb,P.star({T,radius:2}).rgb);}
for(const gas of ['air','co2','hydrogen']){const p={...defaults(e('sky')),gas};assert.deepEqual(P.sky({...p,pressure:0,haze:0}).skyRGB,[0,0,0]);assert(P.sky({...p,sun:0}).path>P.sky({...p,sun:90}).path);}
console.log('Audit passed: 600 parameter sets across 10 experiments; wave scale, grating minima, polarization, photoelectric limits, tabulated atoms, molecular energy balance, integrated Planck law and stellar colours.');

// Glare extinction is not extinction of the independently modelled underwater signal.
{const p={mode:'water',count:1,first:0,incidence:Math.atan(1.333)*180/Math.PI};
const q=P.waterLight(p);near(q.glareAfter,0);near(q.detailTransmission,.5);near(q.detailAfter,.01);near(q.totalAfter,.01);
for(const count of [1,2,3])for(const incidence of [0,53,85])for(const first of [0,45,90]){const x=P.waterLight({...p,count,incidence,first,angle:90,middle:45});near(x.totalAfter,x.glareAfter+x.detailAfter);assert(x.totalAfter<=x.totalBefore+1e-14);}
const crossed=P.waterLight({...p,count:2,angle:90});near(crossed.totalAfter,0);
}
console.log('Independent water glare/detail channels and total extinction verified');
