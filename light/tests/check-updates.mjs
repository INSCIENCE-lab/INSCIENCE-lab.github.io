import assert from 'node:assert/strict';
import * as P from '../physics.js';
import {exps,defaults} from '../content.js';
import {enhance} from '../enhancements.js';
enhance(exps);const e=exps.find(e=>e.id==='polarization'),p=defaults(e),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
for(let input of ['unpolarized','linear','circular','elliptical'])for(let count of [1,2,3])for(let angle of [0,45,90,180]){let q=P.polarization({...p,input,count,angle,first:angle});assert.ok(q.intensity>=0&&q.intensity<=1+1e-12);for(let i=1;i<q.stages.length;i++)assert.ok(q.stages[i].intensity<=q.stages[i-1].intensity+1e-12)}
near(P.polarization({...p,count:1}).intensity,.5);
near(P.polarization({...p,count:2,first:0,angle:90}).intensity,0);
near(P.polarization({...p,count:3,first:0,middle:45,angle:90}).intensity,.125);
for(let first of [0,30,90])near(P.polarization({...p,input:'circular',count:1,first}).intensity,.5);
near(P.polarization({...p,input:'linear',inputAngle:30,count:1,first:30}).intensity,1);
near(P.polarization({...p,input:'elliptical',ellipticity:1,count:1}).intensity,.5);
let b=P.polarization({...p,mode:'water'}).brewster;
near(P.polarization({...p,mode:'water',count:1,incidence:b,first:0}).intensity,0);
near(P.polarization({...p,mode:'water',count:1,incidence:b,first:90}).intensity,P.polarization({...p,mode:'water',incidence:b}).rs/2);
for(let mat of ['water','glass']){assert.ok(P.prism(400,mat).deviation>P.prism(700,mat).deviation);assert.ok(Number.isFinite(P.prism(400,mat).deviation))}
for(let upper=2;upper<=10;upper++)for(let lower=1;lower<=9;lower++){let q=P.atom({upper,lower});assert.ok(q.de>0&&Number.isFinite(q.lambda))}
for(let e of exps){assert.ok(e.theory.length>=4);assert.ok(!JSON.stringify(e.theory).includes('Eγ'));assert.ok(!JSON.stringify(e.theory).match(/σR|Iпрям|τR|kBT|Kmax/))}
console.log('Updated polarization, Fresnel, dispersion, atom and notation checks passed');
