import {fixedAtmosphere,normaliseMix} from './atmosphere.js';

const tunable = {
 earth:['dust','dustH','ozone','ground'],
 mars:['dust','dustH','ground'],
 custom:['T','logP','airT','oxygen','co2','hydrogen','planetRadius','gravity','dust','dustH','ground','aerosol','radius','angstrom','asymmetry','albedo'],
};
const shared = ['planet','dayPhase','latitude','view','azimuth','alt','skyPlot','sunFov','displayMode','exposure'];
const customDefaults = {...fixedAtmosphere('earth'),T:5800,planetRadius:6400,gravity:9.8,ozone:0};
const settingsKey='light-sky-planet-settings';

export function skyFieldVisible(key,p){
 if(key==='radius')return p.planet==='custom'&&p.aerosol==='mineral';
 if(['angstrom','asymmetry','albedo'].includes(key))return p.planet==='custom'&&p.aerosol==='haze';
 return shared.includes(key)||tunable[p.planet].includes(key);
}

function settings(){
 try{return JSON.parse(sessionStorage.getItem(settingsKey))||{};}catch{return {};}
}
export function rememberSky(p){
 const profiles=settings();
 profiles[p.planet]=Object.fromEntries(tunable[p.planet].map(k=>[k,p[k]]));
 try{sessionStorage.setItem(settingsKey,JSON.stringify(profiles));}catch{}
}

export function useSkyPlanet(p,planet,legacy){
 if(!Object.hasOwn(tunable,planet))planet='earth';
 const defaults=planet==='custom'?customDefaults:{...fixedAtmosphere(planet),T:5800};
 const saved=settings()[planet]??legacy??{};
 // Camera, pointing and graph controls survive planet switches. Atmosphere
 // controls start from a planet-specific preset and restore only editable keys.
 const physical={...defaults};
 for(const k of tunable[planet]){
  if(k==='radius'&&[.5,1.6,3].includes(Number(saved[k])))physical[k]=Number(saved[k]);
  else if(k==='aerosol'&&['haze','mineral'].includes(saved[k]))physical[k]=saved[k];
  else if(k!=='radius'&&k!=='aerosol'&&Number.isFinite(saved[k]))physical[k]=saved[k];
 }
 delete physical.exposure;
 delete physical.displayMode;
 Object.assign(p,physical,{planet,mode:'simulation',skyView:'panorama'});
 return normaliseMix(p);
}
