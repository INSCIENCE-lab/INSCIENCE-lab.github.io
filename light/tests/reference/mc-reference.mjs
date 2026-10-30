// Spherical backward path tracer with next-event estimation to a directional Sun.
// Independent reference work; not imported by the live application.
import{referenceOptics as D}from './reference-optics.js';
import{planck,cmf}from '../../physics.js';
const pi=Math.PI,dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],length=a=>Math.hypot(...a),add=(p,v,t)=>p.map((x,i)=>x+v[i]*t),unit=v=>v.map(x=>x/length(v));
function interpolate(xs,ys,x){let i=0;while(i<xs.length-2&&xs[i+1]<x)i++;let f=(x-xs[i])/(xs[i+1]-xs[i]);return ys[i]*(1-f)+ys[i+1]*f;}
function trap(a,x){let s=0;for(let i=1;i<a.length;i++)s+=(a[i]+a[i-1])*.5*(x[i]-x[i-1]);return s;}
export function model(nm,{dust=.2,scale=1,ground=.15,R=3389.5}={}){
 const phases=Array.from({length:181},(_,j)=>interpolate(D.lambda,D.phase.map(r=>r[j]),nm));
 // CDF in increasing cos(theta), normalize the tabulated angular quadrature.
 const mus=Array.from({length:181},(_,j)=>Math.cos((180-j)*pi/180)),ps=phases.slice().reverse();const norm=2*pi*trap(ps,mus);for(let i=0;i<ps.length;i++)ps[i]/=norm;
 const cdf=[0];for(let i=1;i<ps.length;i++)cdf.push(cdf.at(-1)+(ps[i]+ps[i-1])*.5*(mus[i]-mus[i-1])*2*pi);cdf[cdf.length-1]=1;
 const ext550=interpolate(D.lambda,D.scattering,550)+interpolate(D.lambda,D.absorption,550);
 const z=D.density.map((_,i)=>i/(D.density.length-1)*D.densityTopKm*scale),densityIntegral=trap(D.density,z),sc=interpolate(D.lambda,D.scattering,nm),ab=interpolate(D.lambda,D.absorption,nm),factor=dust/(ext550*densityIntegral);
 const beta0=(sc+ab)*factor,omega=sc/(sc+ab),top=D.densityTopKm*scale;
 return {R,top,ground,beta0,omega,density:h=>{if(h<0)return 1;if(h>=top)return 0;let a=h/top*(D.density.length-1),i=Math.floor(a),f=a-i;return D.density[i]*(1-f)+D.density[i+1]*f},phase:cos=>interpolate(mus,ps,Math.max(-1,Math.min(1,cos))),sample:r=>{let i=0;while(i<cdf.length-2&&cdf[i+1]<r)i++;let area=(r-cdf[i])/(2*pi),width=mus[i+1]-mus[i],slope=(ps[i+1]-ps[i])/width,denom=ps[i]+Math.sqrt(Math.max(0,ps[i]*ps[i]+2*slope*area));return mus[i]+(denom>0?2*area/denom:0)}};
}
function sphere(p,v,r){const b=dot(p,v),q=dot(p,p)-r*r,disc=b*b-q;if(disc<0)return Infinity;const d=Math.sqrt(disc);const t0=-b-d,t1=-b+d;return t0>1e-7?t0:t1>1e-7?t1:Infinity;}
function transmission(p,s,m,steps=32){let out=sphere(p,s,m.R+m.top),g=sphere(p,s,m.R);if(g<out)return 0;let tau=0;for(let i=0;i<steps;i++){const a=(i/steps)**2*out,b=((i+1)/steps)**2*out;const h=length(add(p,s,(a+b)/2))-m.R;tau+=m.beta0*m.density(h)*(b-a);}return Math.exp(-tau);}
function around(v,cos,phi){const a=Math.abs(v[2])<.9?[0,0,1]:[0,1,0],u=unit([a[1]*v[2]-a[2]*v[1],a[2]*v[0]-a[0]*v[2],a[0]*v[1]-a[1]*v[0]]),w=[v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]],sin=Math.sqrt(Math.max(0,1-cos*cos));return v.map((x,i)=>cos*x+sin*(Math.cos(phi)*u[i]+Math.sin(phi)*w[i]));}
function rng(seed){let x=seed||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return(x+.5)/4294967296;};}
export function estimate(m,sun,view,azimuth,N=10000,seed=1,maxOrder=64){
 const r=rng(seed),s=[Math.cos(sun*pi/180),0,Math.sin(sun*pi/180)],initial=[Math.cos(view*pi/180)*Math.cos(azimuth*pi/180),Math.cos(view*pi/180)*Math.sin(azimuth*pi/180),Math.sin(view*pi/180)];let sum=0,sum2=0,cut=0;
 for(let n=0;n<N;n++){
  let p=[0,0,m.R+1e-5],v=initial.slice(),weight=1,L=0,order=0;
  for(let steps=0;steps<10000;steps++){
   const out=sphere(p,v,m.R+m.top),ground=sphere(p,v,m.R),limit=Math.min(out,ground),free=m.beta0>0?-Math.log(r())/m.beta0:Infinity;
   if(free>=limit){if(ground<out){p=add(p,v,ground);const normal=unit(p),mu=dot(normal,s);if(mu>0)L+=weight*m.ground/pi*mu*transmission(add(p,normal,1e-5),s,m);weight*=m.ground;if(weight<1e-5)break;v=around(normal,Math.sqrt(r()),2*pi*r());p=add(p,normal,1e-5);order++;}else break;
   }else{p=add(p,v,free);if(r()>m.density(length(p)-m.R))continue;if(r()>m.omega)break;order++;L+=weight*m.phase(dot(v,s))*transmission(p,s,m);if(order>=maxOrder){cut++;break;}v=around(v,m.sample(r()),2*pi*r());}
   if(order>10){if(r()>.8)break;weight/=.8;}
  }
  sum+=L;sum2+=L*L;
 }
 const mean=sum/N;return {mean,stderr:Math.sqrt(Math.max(0,sum2/N-mean*mean)/N),cut};
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){for(const sun of[2,45])for(const angle of[0,30,90]){console.time('case');let rows=[];for(const nm of[440,550,680])rows.push({nm,...estimate(model(nm),sun,sun,angle,10000,1)});console.timeEnd('case');console.log({sun,angle,rows});}}
