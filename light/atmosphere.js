import {rad,clamp,planck,cmf} from './physics.js';
import {dustData} from './dust-tables.js';
const PI=Math.PI,N0=2.68678e25,kB=1.380649e-23,u=1.6605390666e-27;
const gases=[[29.06,.0077,.030,28.014],[26.63,.00507,.054,31.998],[43.9,.0064,.09,44.01],[13.58,.00752,.02,2.016]];
// Keep wavelength-resolved Mie forward scattering. Approximate the broad
// side/back hemisphere by HG to avoid sphere-specific opposition resonances.
// The 20–60 degree transition is a declared model choice, not measured Mars data.
// Normalize the complete angular distribution to preserve scattered energy.
const mineralPhase=dustData.tables.map(table=>table.map(row=>{
 let norm=0,moment=0;
 for(let j=1;j<720;j++){const t=j*PI/720,w=row[j+2]*Math.sin(t);norm+=w;moment+=w*Math.cos(t);}
 const g=Math.max(0,Math.min(.95,moment/norm));
 const phase=Array.from({length:721},(_,j)=>{
  const theta=j/4,t=theta*PI/180,hg=(1-g*g)/(4*PI*(1+g*g-2*g*Math.cos(t))**1.5);
  let w=Math.max(0,Math.min(1,(theta-20)/40));w=w*w*(3-2*w);
  return (1-w)*row[j+2]/row[1]+w*hg;
 });
 let area=0;for(let j=1;j<720;j++)area+=phase[j]*Math.sin(j*PI/720)*2*PI*PI/720;
 return phase.map(v=>v/area);
}));
export function gasSigma(nm,i){if(i===3){const a=nm*10;return (8.14e-13/a**4+1.28e-6/a**6+1.61/a**8)*1e-4;}const [A,B,d]=gases[i],n=1+A*1e-5*(1+B/(nm/1000)**2),F=(6+3*d)/(6-7*d);return 24*PI**3/(nm*1e-9)**4/N0**2*((n*n-1)/(n*n+2))**2*F;}
export function configuration(p){let f=[Math.max(0,100-p.oxygen-p.co2-p.hydrogen),p.oxygen,p.co2,p.hydrogen];let sum=f.reduce((a,b)=>a+b,0);f=f.map(x=>x/sum);let mass=f.reduce((s,v,i)=>s+v*gases[i][3],0)*u;const mars=p.planet==='mars',R=mars?3389.5:p.planet==='custom'?(p.planetRadius||6371):6371,g=mars?3.71:p.planet==='custom'?(p.gravity||9.81):9.81,H=kB*p.airT/(mass*g)/1000;return {f,mass,R,g,H,Hd:p.dustH,pressure:10**p.logP,top:Math.max(100,14*H,14*p.dustH)};}
function dist(pt,d,R){let b=pt.reduce((s,v,i)=>s+v*d[i],0),rr=pt.reduce((s,v)=>s+v*v,0);return -b+Math.sqrt(Math.max(0,b*b+R*R-rr));}
function columns(pt,d,q,n=24){let b=pt.reduce((s,v,i)=>s+v*d[i],0),r2=pt.reduce((s,v)=>s+v*v,0);if(b<0&&b*b>=r2-q.R*q.R)return null;let len=dist(pt,d,q.R+q.top),g=0,a=0;for(let i=0;i<n;i++){let lo=(i/n)**2*len,hi=((i+1)/n)**2*len,s=(lo+hi)/2,z=Math.hypot(...pt.map((v,j)=>v+s*d[j]))-q.R;g+=Math.exp(-z/q.H)*(hi-lo);a+=Math.exp(-z/q.Hd)*(hi-lo)}return [g,a];}
let lastKey='',lastQ;
export function atmosphere(p,elevation=p.view,azimuth=p.azimuth||0){
 const q=configuration(p),v=[Math.cos(rad(elevation))*Math.cos(rad(azimuth+(p.sunAz||0))),Math.cos(rad(elevation))*Math.sin(rad(azimuth+(p.sunAz||0))),Math.sin(rad(elevation))],s=[Math.cos(rad(p.sun))*Math.cos(rad(p.sunAz||0)),Math.cos(rad(p.sun))*Math.sin(rad(p.sunAz||0)),Math.sin(rad(p.sun))],origin=[0,0,q.R+p.alt],cos=v.reduce((a,b,i)=>a+b*s[i],0),theta=Math.acos(clamp(cos,-1,1))*180/PI;
 const len=dist(origin,v,q.R+q.top),directCol=columns(origin,s,q),ray=[];let outG=0,outD=0;
 for(let i=0;i<32;i++){let lo=(i/32)**2*len,hi=((i+1)/32)**2*len,t=(lo+hi)/2,pt=origin.map((x,j)=>x+t*v[j]),z=Math.hypot(...pt)-q.R,dg=Math.exp(-z/q.H),dd=Math.exp(-z/q.Hd),ds=hi-lo;ray.push({incoming:columns(pt,s,q),g:outG+dg*ds/2,d:outD+dd*ds/2,dg,dd,ds});outG+=dg*ds;outD+=dd*ds;}
 let ri=dustData.radii.indexOf(Number(p.radius));if(ri<0)ri=1;const table=dustData.tables[ri],reference=table[17][0],angular=clamp(theta*4,0,720),j=Math.floor(angular),frac=angular-j;
 let skySamples=[],direct=[],source=[],sum=0;
 for(let nm of dustData.lambda)sum+=planck(nm,p.T);
 dustData.lambda.forEach((nm,i)=>{const E=planck(nm,p.T)/sum,aero=aerosolOptics(p,nm,cos,table,i,reference,j,frac),ext=aero.ext,dcross=aero.dcross;
 const gas=q.f.reduce((a,f,k)=>a+f*gasSigma(nm,k),0)*q.pressure/(q.mass*q.g)/(q.H*1000)*1000,phase=3*(1+cos*cos)/(16*PI);let I=0;
 for(const r of ray)if(r.incoming)I+=Math.exp(-gas*(r.incoming[0]+r.g)-ext*(r.incoming[1]+r.d))*(gas*r.dg*phase+dcross*r.dd)*r.ds;
 skySamples.push([nm,E*I]);direct.push([nm,directCol?E*Math.exp(-gas*directCol[0]-ext*directCol[1]):0]);source.push([nm,E]);});
 return {skySamples,direct,source,theta,q,path:directCol,relative:skySamples.reduce((a,v)=>a+v[1],0),gasTau550:q.f.reduce((a,f,k)=>a+f*gasSigma(550,k),0)*q.pressure/(q.mass*q.g),meanMass:q.mass/u,warning:p.dust>.3};
}
// HG is a configurable bulk aerosol approximation, not a Mie size retrieval.
export function aerosolOptics(p,nm,cos,table,index,reference,j,frac){
 if(p.aerosol==='haze'){
  const ext=p.dust/(p.dustH||1)*(550/nm)**(p.angstrom??1.3),g=clamp(p.asymmetry??.7,0,.95),omega=clamp(p.albedo??.95,0,1);
  const phase=(1-g*g)/(4*PI*(1+g*g-2*g*cos)**1.5);
  return {ext,dcross:ext*omega*phase};
 }
 const ri=dustData.radii.indexOf(Number(p.radius)),row=mineralPhase[ri<0?1:ri][index],a=Math.acos(Math.max(-1,Math.min(1,cos)))*720/PI,k=Math.floor(a),f=a-k,phase=row[k]*(1-f)+row[Math.min(720,k+1)]*f;return {ext:table[index][0]/reference*p.dust/p.dustH,dcross:table[index][1]/reference*p.dust/p.dustH*phase};
}
export function selectedSky(p){const solved=getTransfer(p);if(solved)return solved;let key=JSON.stringify(p);if(key!==lastKey){lastKey=key;lastQ=atmosphere(p)}return lastQ;}
export function skyLinearRGB(samples){let xyz=[0,0,0];for(const [l,v]of samples){const c=cmf(l);c.forEach((x,i)=>xyz[i]+=x*v)}const [x,y,z]=xyz;return [3.2406*x-1.5372*y-.4986*z,-.9689*x+1.8758*y+.0415*z,.0557*x-.204*y+1.057*z].map(v=>Math.max(0,v));}
export function displaySkyRGB(rgb,exposure=1){const peak=Math.max(...rgb);if(peak===0||exposure<=0)return [0,0,0];const brightness=Math.min(1,Math.log1p(exposure*peak)/Math.log1p(exposure*10)),gain=brightness/peak;return rgb.map(v=>{v*=gain;return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))});}
export function exposureRGB(samples,exposure=1){return displaySkyRGB(skyLinearRGB(samples),exposure);}

// Equinox (declination 0): diurnal rotation at a chosen northern latitude.
export function dayPosition(phase,latitude=45){const H=rad(phase-90),phi=rad(latitude);return {sun:Math.max(0,Math.round(Math.asin(clamp(Math.cos(phi)*Math.cos(H),-1,1))*180/PI*1e10)/1e10),sunAz:Math.atan2(Math.sin(H),Math.sin(phi)*Math.cos(H))*180/PI};}

export function normaliseMix(p,edited){const keys=['oxygen','co2','hydrogen'];for(const k of keys)p[k]=clamp(Number(p[k])||0,0,100);let sum=keys.reduce((a,k)=>a+p[k],0);if(sum>100){const others=keys.filter(k=>k!==edited),target=edited?100-p[edited]:100,total=others.reduce((a,k)=>a+p[k],0);for(const k of others)p[k]=total?p[k]/total*target:0;}return p;}
export function fixedAtmosphere(planet){return planet==='custom'?{}:planet==='mars'?{logP:Math.log10(600),airT:210,gravity:3.71,oxygen:0,co2:95,hydrogen:0,dust:.2,dustH:10,radius:1.4,ozone:0,ground:.15,displayMode:'auto',aerosol:'mineral',exposure:2.5}:{logP:Math.log10(101325),airT:288,gravity:9.81,oxygen:21,co2:0,hydrogen:0,dust:.05,dustH:1.2,radius:1.6,ozone:300,ground:.15,displayMode:'auto',aerosol:'haze',angstrom:1.3,asymmetry:.7,albedo:.95,exposure:2.5};}

const transferCache=new Map();
export function transferKey(p){const {exposure,skyPlot,displayMode,dayPhase,skyView,sunFov,sunAz,...physical}=p;return JSON.stringify(physical)}
export function installTransfer(key,value){transferCache.set(key,value);if(transferCache.size>8)transferCache.delete(transferCache.keys().next().value)}
export function getTransfer(p){return transferCache.get(transferKey(p))}
