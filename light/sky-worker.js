import {makeMedium,firstOrder,estimate,estimateSpectrum,wavelengths,transmission,prepareTransmission} from './transfer.js';
import {configuration,gasSigma,skyLinearRGB} from './atmosphere.js';
const D=Math.PI/180;
export function solveSky(p,progress=()=>{},cached=null){
 const source=wavelengths(p),media=source.map(([nm])=>prepareTransmission(makeMedium(p,nm))),q=configuration(p),width=180,center=90,maxElev=90;
 const offsets=[-12,-7,-4,-2,-1,-.5,0,.5,1,2,4,7,12],knots=(a,b,n,c)=>[...new Set([...Array.from({length:n+1},(_,i)=>a+(b-a)*i/n),...offsets.map(d=>c+d).filter(x=>x>a&&x<b)])].sort((a,b)=>a-b);
 const xs=knots(0,180,24,0),ys=knots(0,maxElev,14,p.sun),bx=Array.from({length:13},(_,i)=>center-width/2+width*i/12),by=Array.from({length:8},(_,i)=>maxElev*i/7);
 const raw=cached?null:by.map(e=>bx.map(a=>{const r=estimateSpectrum(media,p.sun,e,a,1024,321,{background:true});return {values:r.means.map((x,k)=>x*source[k][1]),error:r.errors.reduce((v,x,k)=>v+x*source[k][1],0)}}));
 // Variance-guided display denoising, with the same weights for every band.
 // The selected spectrum below stays unfiltered and reports its sampling error.
 const background=cached?null:raw.map((row,j)=>row.map((cell,i)=>{const signal=cell.values.reduce((a,b)=>a+b,0),strength=Math.min(.8,Math.max(0,(cell.error/Math.max(signal,1e-20)-.1)/.3));if(strength===0)return cell.values;let total=0,average=source.map(()=>0);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const other=raw[Math.max(0,Math.min(by.length-1,j+dy))][Math.max(0,Math.min(bx.length-1,i+dx))],value=other.values.reduce((a,b)=>a+b,0),difference=Math.abs(value-signal),allowed=2*(cell.error+other.error)+.05*Math.max(value,signal);if(difference>allowed)continue;const weight=Math.exp(-.5*(dx*dx+dy*dy))/Math.max(1e-25,other.error**2+(.03*value)**2);total+=weight;for(let k=0;k<average.length;k++)average[k]+=weight*other.values[k];}return total?cell.values.map((v,k)=>v*(1-strength)+strength*average[k]/total):cell.values;}));
 progress('Обчислюю розсіювання на шляху до ока…');
 const bracket=(list,v)=>{v=Math.max(list[0],Math.min(list.at(-1),v));let i=0;while(i<list.length-2&&list[i+1]<v)i++;return[i,(v-list[i])/(list[i+1]-list[i])]},bg=(e,a,k)=>{let [i,u]=bracket(bx,a),[j,v]=bracket(by,e);return (background[j][i][k]*(1-u)+background[j][i+1][k]*u)*(1-v)+(background[j+1][i][k]*(1-u)+background[j+1][i+1][k]*u)*v};
 const grid=cached?cached.grid:ys.map(e=>xs.map(a=>skyLinearRGB(source.map(([nm,f],k)=>[nm,firstOrder(media[k],p.sun,e,a)*f+bg(e,a,k)]))));
 if(!grid.flat(2).every(Number.isFinite))throw new Error("Нечислове значення у сітці переносу");
 const errors=[];let cut=0;
 const spectral=estimateSpectrum(media,p.sun,p.view,p.azimuth,4096,8971,{background:true});cut=spectral.cut;const skySamples=source.map(([nm,f],k)=>{errors.push([nm,spectral.errors[k]*f]);return[nm,(firstOrder(media[k],p.sun,p.view,p.azimuth,128)+spectral.means[k])*f]});
 if(!skySamples.flat().every(Number.isFinite))throw new Error("Нечислове значення у спектрі");
 const s=[Math.cos(p.sun*D),0,Math.sin(p.sun*D)],direct=source.map(([nm,f],k)=>[nm,f*transmission([0,0,q.R+(p.alt||0)+1e-5],s,media[k],128)]);
 const theta=Math.acos(Math.max(-1,Math.min(1,Math.sin(p.sun*D)*Math.sin(p.view*D)+Math.cos(p.sun*D)*Math.cos(p.view*D)*Math.cos(p.azimuth*D))))/D;
 return {azimuthFrame:'solar-symmetric',xs,ys,grid,source,direct,skySamples,errors,cut,q,theta,meanMass:q.mass/1.6605390666e-27,gasTau550:q.f.reduce((a,f,k)=>a+f*gasSigma(550,k),0)*q.pressure/(q.mass*q.g),relative:skySamples.reduce((a,v)=>a+v[1],0),stderr:errors.reduce((sum,v)=>sum+v[1],0),path:0,multiple:true,binWidth:400/14,binWidths:source.map((_,i)=>(400/14)*(i===0||i===source.length-1?.5:1))};
}
if(typeof self!=='undefined')self.onmessage=ev=>{try{self.postMessage({id:ev.data.id,result:solveSky(ev.data.params,message=>self.postMessage({id:ev.data.id,message}),ev.data.cached)})}catch(e){self.postMessage({id:ev.data.id,error:e.message})}};
