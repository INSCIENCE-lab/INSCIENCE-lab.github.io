import assert from 'node:assert/strict';
import{makeMedium,firstOrder,estimate,wavelengths}from'../transfer.js';
import{fixedAtmosphere}from'../atmosphere.js';
const p={...fixedAtmosphere('mars'),planet:'mars',radius:1.4,T:5800,alt:0,ground:0,ozone:0};
for(const nm of[440,550,680]){
 let m=makeMedium({...p,dust:.05},nm),a=firstOrder(m,45,30,90,128),b=estimate(m,45,30,90,100000,17,{maxOrder:1});
 console.log('single-order independent integration vs stochastic paths',nm,a,b);
 assert(Math.abs(a-b.mean)<4*b.stderr+a*.01);assert(b.cut>0);
 let full=estimate(m,45,30,90,10000,2),bg=estimate(m,45,30,90,10000,2,{background:true});assert(full.mean>=bg.mean);assert.equal(full.cut,0);
}
let vacuum=makeMedium({...p,dust:0,logP:-50,ground:0},550);assert(estimate(vacuum,45,45,0,1000).mean<1e-30);
let absorbing={R:3389.5,top:100,alt:0,ground:0,majorant:.01,components:[{beta:.01,omega:0,density:()=>1,phase:()=>0,sample:r=>2*r-1}]};assert.equal(estimate(absorbing,45,45,0,1000).mean,0);
let earth=makeMedium({...fixedAtmosphere('earth'),planet:'earth',alt:0,ground:0},600);assert(earth.components.some(c=>c.omega===0&&c.beta>0));assert.equal(earth.q.g,9.81);
assert.equal(makeMedium({...p,gravity:30},550).q.g,3.71);
console.log('Spherical transport tests passed: single-order benchmark, nonnegative higher orders, no truncation, vacuum, pure absorption, ozone inclusion and fixed planet gravity.');
const {prepareTransmission,transmission}=await import('../transfer.js');
for(const planet of['earth','mars']){
 const p={...fixedAtmosphere(planet),planet};const plain=makeMedium(p,550),fast=prepareTransmission(makeMedium(p,550));
 assert.equal(transmission([0,0,plain.R+plain.top+1e-6],[0,0,1],fast),1);
 for(const h of[0,.01,.1,1,4,10,20,40,70])for(const mu of[0,.001,.01,.03,.1,.5,.9]){const position=[0,0,plain.R+h+1e-5],sun=[Math.sqrt(1-mu*mu),0,mu];assert(Math.abs(transmission(position,sun,plain,128)-transmission(position,sun,fast))<.005)}
 for(const sun of[0,2,45])for(const view of[0,2,30]){const coarse=firstOrder(plain,sun,view,0,64),fine=firstOrder(plain,sun,view,0,256);assert(Math.abs(coarse/fine-1)<.01)}
}
const ref=await import('./reference/mc-reference.mjs');
for(const nm of[440,550,680]){const old=ref.estimate(ref.model(nm,{dust:.2,ground:0}),2,30,90,150000,72),fresh=estimate(makeMedium({...p,dust:.2,logP:-50,ground:0},nm),2,30,90,150000,73);console.log('Independent all-order Mars benchmark',nm,old.mean,fresh.mean);assert(Math.abs(old.mean-fresh.mean)<4*Math.hypot(old.stderr,fresh.stderr)+.02*old.mean)}
const ws=wavelengths({...p,T:5800});assert(Math.abs(ws.reduce((s,v)=>s+v[1],0)-1)<1e-14);
console.log('Outward transmittance table, atmosphere boundary, grazing quadrature convergence, spectral normalization and independent all-order benchmark passed.');
const {estimateSpectrum}=await import('../transfer.js');
const media=[440,550,680].map(nm=>makeMedium({...p,ground:0},nm)),joint=estimateSpectrum(media,2,30,90,100000,27);
for(let k=0;k<3;k++){const scalar=estimate(media[k],2,30,90,100000,28,{background:true});assert(Math.abs(scalar.mean-joint.means[k])<4*Math.hypot(scalar.stderr,joint.errors[k]));assert(Number.isFinite(joint.means[k])&&joint.means[k]>=0)}
assert.equal(joint.cut,0);console.log('Shared-path spectral likelihood ratios agree with independent scalar Monte Carlo within combined sampling uncertainty.');
