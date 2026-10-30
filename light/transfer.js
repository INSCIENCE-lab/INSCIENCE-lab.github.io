// Spherical, scalar, elastic radiative transfer. Backward Monte Carlo with
// null collisions and next-event estimation; no hand-coloured atmosphere.
import {referenceOptics as D} from './reference-optics.js';
import {configuration,gasSigma} from './atmosphere.js';
import {dustData} from './dust-tables.js';
import {planck} from './physics.js';
const PI=Math.PI;
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const len=a=>Math.hypot(...a),add=(p,v,t)=>p.map((x,i)=>x+v[i]*t),unit=v=>{let n=len(v);return v.map(x=>x/n)};
export function interpolate(xs,ys,x){let lo=0,hi=xs.length-1;while(hi-lo>1){let m=(lo+hi)>>1;if(xs[m]<=x)lo=m;else hi=m}let f=Math.max(0,Math.min(1,(x-xs[lo])/(xs[hi]-xs[lo])));return ys[lo]*(1-f)+ys[hi]*f;}
const uniform=(array,x,max)=>{if(x<0)return array[0];if(x>=max)return 0;let a=x/max*(array.length-1),i=Math.floor(a),f=a-i;return array[i]*(1-f)+array[i+1]*f;};
const trap=(a,x)=>{let v=0;for(let i=1;i<a.length;i++)v+=(a[i]+a[i-1])*.5*(x[i]-x[i-1]);return v;};
function angular(theta,values){const mus=theta.map(v=>Math.cos(v*PI/180)).reverse(),phase=values.slice().reverse(),norm=2*PI*trap(phase,mus);for(let i=0;i<phase.length;i++)phase[i]/=norm;let cdf=[0];for(let i=1;i<phase.length;i++)cdf.push(cdf.at(-1)+(phase[i]+phase[i-1])*.5*(mus[i]-mus[i-1])*2*PI);cdf[cdf.length-1]=1;return {phase:c=>interpolate(mus,phase,c),sample:r=>{let i=0,j=cdf.length-1;while(j-i>1){const m=(i+j)>>1;if(cdf[m]<r)i=m;else j=m}const area=(r-cdf[i])/(2*PI),slope=(phase[i+1]-phase[i])/(mus[i+1]-mus[i]),den=phase[i]+Math.sqrt(Math.max(0,phase[i]**2+2*slope*area));return Math.max(-1,Math.min(1,mus[i]+(den>0?2*area/den:0)));}};}
const marsAngular=D.lambda.map((_,i)=>angular(Array.from({length:181},(_,j)=>j),D.phase[i]));
const gammaAngular=dustData.tables.map(table=>table.map(row=>angular(dustData.angles,row.slice(2))));
function hg(g){return {phase:c=>(1-g*g)/(4*PI*(1+g*g-2*g*c)**1.5),sample:r=>Math.abs(g)<1e-5?2*r-1:Math.max(-1,Math.min(1,(1+g*g-((1-g*g)/(1-g+2*g*r))**2)/(2*g)))}}
const rayleigh={phase:c=>3*(1+c*c)/(16*PI),sample:r=>{let c=2*r-1;for(let i=0;i<6;i++)c-=(c*c*c+3*c+4-8*r)/(3*c*c+3);return c;}};
export function makeMedium(p,nm){
 const q=configuration(p),components=[];
 const gas=q.f.reduce((a,f,i)=>a+f*gasSigma(nm,i),0)*q.pressure/(q.mass*q.g)/q.H;
 components.push({beta:gas,omega:1,density:h=>Math.exp(-Math.max(0,h)/q.H),...rayleigh});
 if(p.aerosol==='haze'){
  const g=Math.max(0,Math.min(.95,p.asymmetry??.7));components.push({beta:p.dust/q.Hd*(550/nm)**(p.angstrom??1.3),omega:p.albedo??.95,density:h=>Math.exp(-Math.max(0,h)/q.Hd),...hg(g)});
 }else if(Number(p.radius)===1.4){
  const max=D.densityTopKm*q.Hd/10,integral=5.039242869747804*q.Hd/10;
  const sc=interpolate(D.lambda,D.scattering,nm),ab=interpolate(D.lambda,D.absorption,nm),reference=interpolate(D.lambda,D.scattering,550)+interpolate(D.lambda,D.absorption,550),factor=p.dust/(reference*integral);
  let i=0;while(i<D.lambda.length-2&&D.lambda[i+1]<nm)i++;const f=(nm-D.lambda[i])/(D.lambda[i+1]-D.lambda[i]);
  components.push({beta:(sc+ab)*factor,omega:sc/(sc+ab),density:h=>uniform(D.density,h,max),phase:c=>marsAngular[i].phase(c)*(1-f)+marsAngular[i+1].phase(c)*f,sample:r=>{ // Sample the same wavelength mixture using a remapped uniform variate.
   if(r<1-f)return marsAngular[i].sample(r/(1-f));return marsAngular[i+1].sample((r-(1-f))/f);
  }});
 }else{
  let ri=dustData.radii.indexOf(Number(p.radius));if(ri<0)ri=1;const table=dustData.tables[ri],idx=Math.max(0,Math.min(40,Math.round((nm-380)/10))),row=table[idx],reference=table[17][0];components.push({beta:row[0]/reference*p.dust/q.Hd,omega:row[1]/row[0],density:h=>Math.exp(-Math.max(0,h)/q.Hd),...gammaAngular[ri][idx]});
 }
 const ozone=Math.max(0,p.ozone??(p.planet==='earth'?300:0));
 components.push({beta:interpolate(D.lambda,D.ozoneAbsorption,nm)*ozone/300,omega:0,density:h=>uniform(D.ozoneDensity,h,80),phase:()=>0,sample:r=>2*r-1});
 return {R:q.R,top:Math.max(100,q.top),alt:p.alt||0,ground:p.ground??.15,components,majorant:components.reduce((a,c)=>a+c.beta,0),q};
}
function sphere(p,v,r){let b=dot(p,v),d=b*b-dot(p,p)+r*r;if(d<0)return Infinity;d=Math.sqrt(d);let a=-b-d,c=-b+d;return a>1e-7?a:c>1e-7?c:Infinity;}
const coeff=(m,h)=>m.components.reduce((a,c)=>a+c.beta*c.density(h),0);
export function transmission(p,s,m,steps=32){if(len(p)>=m.R+m.top&&dot(p,s)>=0)return 1;if(m.lookup){const radius=len(p),height=radius-m.R,mu=dot(p,s)/radius;if(mu>=0&&height>=0&&height<m.top){const table=m.lookup,bracket=(xs,x)=>{let i=0,j=xs.length-1;while(j-i>1){const mid=(i+j)>>1;if(xs[mid]<=x)i=mid;else j=mid}return[i,Math.max(0,Math.min(1,(x-xs[i])/(xs[i+1]-xs[i])))]},[i,u]=bracket(table.mu,mu),[j,v]=bracket(table.h,height),t=table.tau;return Math.exp(-((t[j][i]*(1-u)+t[j][i+1]*u)*(1-v)+(t[j+1][i]*(1-u)+t[j+1][i+1]*u)*v))}}const out=sphere(p,s,m.R+m.top),g=sphere(p,s,m.R);if(g<out)return 0;let tau=0;for(let i=0;i<steps;i++){let a=(i/steps)**2*out,b=((i+1)/steps)**2*out;tau+=coeff(m,len(add(p,s,(a+b)/2))-m.R)*(b-a)}return Math.exp(-tau);}
function around(v,c,phi){const a=Math.abs(v[2])<.9?[0,0,1]:[0,1,0],u=unit([a[1]*v[2]-a[2]*v[1],a[2]*v[0]-a[0]*v[2],a[0]*v[1]-a[1]*v[0]]),w=[v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]],s=Math.sqrt(Math.max(0,1-c*c));return v.map((x,i)=>c*x+s*(Math.cos(phi)*u[i]+Math.sin(phi)*w[i]));}
const direction=(e,a=0)=>[Math.cos(e*PI/180)*Math.cos(a*PI/180),Math.cos(e*PI/180)*Math.sin(a*PI/180),Math.sin(e*PI/180)];
function rng(seed){let x=seed||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return(x+.5)/4294967296;};}
export function firstOrder(m,sun,view,azimuth,steps=64){const s=direction(sun),v=direction(view,azimuth),o=[0,0,m.R+m.alt+1e-5],distance=sphere(o,v,m.R+m.top);let I=0,tau=0;const cosine=dot(s,v);for(let i=0;i<steps;i++){const a=(i/steps)**2*distance,b=((i+1)/steps)**2*distance,mid=(a+b)/2,p=add(o,v,mid),h=len(p)-m.R;const ext=coeff(m,h),scatter=m.components.reduce((sum,c)=>sum+c.beta*c.density(h)*c.omega*c.phase(cosine),0);I+=Math.exp(-tau-ext*(b-a)/2)*transmission(p,s,m)*scatter*(b-a);tau+=ext*(b-a)}return I;}
export function estimate(m,sun,view,azimuth,N=512,seed=1,{background=false,maxOrder=64}={}){
 const r=rng(seed),s=direction(sun),initial=direction(view,azimuth);let sum=0,sum2=0,cut=0;
 for(let n=0;n<N;n++){
  let p=[0,0,m.R+m.alt+1e-5],v=initial.slice(),weight=1,L=0,order=0;
  for(let steps=0;steps<20000;steps++){
   const out=sphere(p,v,m.R+m.top),ground=sphere(p,v,m.R),distance=Math.min(out,ground),free=m.majorant>0?-Math.log(r())/m.majorant:Infinity;
   if(free>=distance){if(ground>=out)break;p=add(p,v,ground);const normal=unit(p),mu=dot(normal,s);if(mu>0)L+=weight*m.ground/PI*mu*transmission(add(p,normal,1e-5),s,m);weight*=m.ground;if(weight<1e-6)break;v=around(normal,Math.sqrt(r()),2*PI*r());p=add(p,normal,1e-5);order++;
   }else{
    p=add(p,v,free);let h=len(p)-m.R,target=r()*m.majorant,component=null;
    for(const c of m.components){target-=c.beta*c.density(h);if(target<0){component=c;break;}}
    if(!component)continue;if(r()>component.omega)break;order++;if(!background||order>1)L+=weight*component.phase(dot(v,s))*transmission(p,s,m);if(order>=maxOrder){cut++;break;}const old=v,solar=r()<.5;v=around(solar?s:old,component.sample(r()),2*PI*r());const physical=component.phase(dot(old,v)),proposal=.5*(physical+component.phase(dot(s,v)));weight*=proposal>0?physical/proposal:0;
   }
   if(order>10){if(r()>.8)break;weight/=.8;}
  }
  sum+=L;sum2+=L*L;
 }
 const mean=sum/N;return {mean,stderr:Math.sqrt(Math.max(0,sum2/N-mean*mean)/N),cut};
}
export function wavelengths(p,n=15){const ls=Array.from({length:n},(_,i)=>380+i*400/(n-1)),values=ls.map((l,i)=>planck(l,p.T)*(i===0||i===n-1?.5:1)),total=values.reduce((a,b)=>a+b,0);return ls.map((l,i)=>[l,values[i]/total]);}
// Accelerate repeated solar transmittances on the outward hemisphere. Inward
// and grazing shadow paths retain direct spherical quadrature.
export function prepareTransmission(m){
 const h=Array.from({length:49},(_,i)=>m.top*(i/48)**2),mu=Array.from({length:97},(_,i)=>(i/96)**2),tau=h.map(z=>mu.map(c=>-Math.log(Math.max(1e-300,transmission([0,0,m.R+z+1e-6],[Math.sqrt(1-c*c),0,c],m,64)))));
 m.lookup={h,mu,tau};return m;
}
// Spectral tracking: all wavelengths share one geometric path. Likelihood
// ratios at real/null events preserve the transport integral for each band.
// A random hero wavelength proposes events; its extinction is NOT substituted
// for the other wavelengths. This avoids independent coloured noise per band.
export function estimateSpectrum(media,sun,view,azimuth,N=1024,seed=1,{background=true,maxOrder=64}={}){
 const r=rng(seed),s=direction(sun),initial=direction(view,azimuth),K=media.length,M=1.25*Math.max(...media.map(m=>m.majorant)),sum=Array(K).fill(0),sum2=Array(K).fill(0);let cut=0;
 for(let n=0;n<N;n++){
  const hero=Math.min(K-1,Math.floor(r()*K)),mh=media[hero];let p=[0,0,mh.R+mh.alt+1e-5],v=initial.slice(),weights=Array(K).fill(1),L=Array(K).fill(0),order=0;
  for(let step=0;step<20000;step++){
   const out=sphere(p,v,mh.R+mh.top),ground=sphere(p,v,mh.R),distance=Math.min(out,ground),free=M>0?-Math.log(r())/M:Infinity;
   if(free>=distance){if(ground>=out)break;p=add(p,v,ground);const normal=unit(p),mu=dot(normal,s);for(let k=0;k<K;k++){if(mu>0)L[k]+=weights[k]*media[k].ground/PI*mu*transmission(add(p,normal,1e-5),s,media[k]);weights[k]*=media[k].ground;}if(Math.max(...weights)<1e-12)break;v=around(normal,Math.sqrt(r()),2*PI*r());p=add(p,normal,1e-5);order++;
   }else{
    p=add(p,v,free);const h=len(p)-mh.R,densities=mh.components.map(c=>c.density(h)),rates=media.map(m=>m.components.map((c,j)=>c.beta*densities[j])),ext=rates.map(a=>a.reduce((x,y)=>x+y,0));let target=r()*M,index=-1;
    for(let j=0;j<rates[hero].length;j++){target-=rates[hero][j];if(target<0){index=j;break;}}
    if(index<0){const proposal=1-ext[hero]/M;for(let k=0;k<K;k++)weights[k]*=(1-ext[k]/M)/proposal;continue;}
    const hc=mh.components[index];for(let k=0;k<K;k++)weights[k]*=rates[k][index]*media[k].components[index].omega/rates[hero][index];order++;
    if(!background||order>1){const cosine=dot(v,s);for(let k=0;k<K;k++)L[k]+=weights[k]*media[k].components[index].phase(cosine)*transmission(p,s,media[k]);}
    if(order>=maxOrder){cut++;break;}if(Math.max(...weights)<1e-12)break;
    const old=v;v=around(r()<.5?s:old,hc.sample(r()),2*PI*r());const a=dot(old,v),b=dot(s,v),proposal=.5*(hc.phase(a)+hc.phase(b));for(let k=0;k<K;k++)weights[k]*=media[k].components[index].phase(a)/proposal;
   }
   if(order>8){const probability=Math.min(.95,Math.max(.1,Math.max(...weights)));if(r()>probability)break;weights=weights.map(w=>w/probability);}
  }
  for(let k=0;k<K;k++){sum[k]+=L[k];sum2[k]+=L[k]*L[k];}
 }
 return {means:sum.map(x=>x/N),errors:sum.map((x,k)=>Math.sqrt(Math.max(0,sum2[k]/N-(x/N)**2)/N)),cut};
}
