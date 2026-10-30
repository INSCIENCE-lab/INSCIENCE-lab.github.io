import * as base from './physics.js';
import {english} from './english-labels.js';
export * from './physics.js';
export const atomicSpecies=Object.fromEntries(Object.entries(base.atomicSpecies).map(([k,v])=>[k,{...v,name:english(v.name)}]));
export const stellarClassNames=Object.fromEntries(Object.entries(base.stellarClassNames).map(([k,v])=>[k,english(v)]));
export function atom(p){const q=base.atom(p);return q.tabled?{...q,medium:english(q.medium),species:atomicSpecies[p.species]}:q;}
export function outputs(...args){return Object.fromEntries(Object.entries(base.outputs(...args)).map(([k,v])=>[english(k),v]));}
