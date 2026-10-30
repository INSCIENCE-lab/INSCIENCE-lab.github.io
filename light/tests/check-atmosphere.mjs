import assert from 'node:assert/strict';import {exps,defaults}from'../content.js';import{enhance}from'../enhancements.js';import {atmosphere,configuration,gasSigma}from'../atmosphere.js';enhance(exps);const p=defaults(exps.find(e=>e.id==='sky'));
assert(gasSigma(450,0)>gasSigma(650,0));assert(Math.abs(configuration({...p,oxygen:0,co2:0,hydrogen:0}).f.reduce((a,b)=>a+b)-1)<1e-12);
for(const planet of ['earth','mars'])for(const sun of [0,2,30,90])for(const radius of [.5,1.6,3]){const q=atmosphere({...p,planet,sun,radius});for(const [l,v]of q.skySamples.concat(q.direct))assert(Number.isFinite(v)&&v>=0);q.direct.forEach(([l,v],i)=>assert(v<=q.source[i][1]+1e-12));}
const a=atmosphere({...p,dust:0,logP:-30});assert(a.relative<1e-25);const b=atmosphere({...p,exposure:0}),c=atmosphere({...p,exposure:4});assert.deepEqual(b.skySamples,c.skySamples);
const mars={...p,planet:'mars',logP:Math.log10(600),oxygen:0,co2:95,airT:210,dust:.2,sun:2,view:2};const front=atmosphere(mars),side=atmosphere({...mars,azimuth:30});const ratio=q=>q.skySamples[7][1]/q.skySamples[27][1];assert(ratio(front)>ratio(side));
console.log('Atmosphere: finite spectra, extinction bounds, gas mixture normalization, vacuum, exposure independence and directional dust colour checks passed');
const {dayPosition}=await import('../atmosphere.js');for(const lat of [10,45,75]){const start=dayPosition(0,lat),noon=dayPosition(90,lat),end=dayPosition(180,lat);assert(Math.abs(start.sun)<1e-12);assert(Math.abs(end.sun)<1e-12);assert(Math.abs(noon.sun-(90-lat))<1e-10);assert(Math.abs(start.sunAz+90)<1e-10);assert(Math.abs(end.sunAz-90)<1e-10);let prev=-91;for(let phase=0;phase<=180;phase++){let q=dayPosition(phase,lat);assert(q.sunAz>prev);prev=q.sunAz;assert(q.sun>=-1e-12&&q.sun<=90-lat+1e-10)}}console.log('Equinox arc verified: east → southern culmination → west, at 3 latitudes');
const {normaliseMix}=await import('../atmosphere.js');for(let i=0;i<100;i++){let p={oxygen:Math.random()*100,co2:Math.random()*100,hydrogen:Math.random()*100};normaliseMix(p);assert(p.oxygen+p.co2+p.hydrogen<=100+1e-10);for(const k of ['oxygen','co2','hydrogen']){p[k]=100;normaliseMix(p,k);assert(Math.abs(p[k]-100)<1e-10);assert(p.oxygen+p.co2+p.hydrogen<=100+1e-10)}}console.log('Gas composition sums and edited-species preservation passed');
const {aerosolOptics,fixedAtmosphere,exposureRGB}=await import('../atmosphere.js');
for(const g of [0,.7,.95]){let integral=0,N=100000;for(let i=0;i<N;i++){const mu=-1+(i+.5)*2/N;integral+=aerosolOptics({...p,aerosol:'haze',dust:1,dustH:1,asymmetry:g,albedo:1,angstrom:1.3},550,mu).dcross*4*Math.PI/N;}assert(Math.abs(integral-1)<2e-4);}
const haze={...p,...fixedAtmosphere('earth'),planet:'earth',sun:10,sunAz:0};assert.equal(haze.aerosol,'haze');assert.equal(fixedAtmosphere('mars').aerosol,'mineral');
const noScatter=aerosolOptics({...haze,albedo:0},450,1);assert.equal(noScatter.dcross,0);assert(noScatter.ext>0);
const clearH={...haze,planet:'custom',hydrogen:100,co2:0,oxygen:0,dust:0,sun:45,view:90,logP:4,airT:288,gravity:9.8,planetRadius:6400};const h=atmosphere(clearH);const rgb=exposureRGB(h.skySamples,316);assert(rgb[2]>rgb[0]);assert(gasSigma(450,3)/gasSigma(650,3)>4.4);assert(gasSigma(450,3)/gasSigma(650,3)<4.7);
for(const kind of ['haze','mineral']){const clear=atmosphere({...haze,aerosol:kind,dust:0}),loaded=atmosphere({...haze,aerosol:kind,dust:.3});assert.notDeepEqual(clear.skySamples,loaded.skySamples);for(const [,v]of loaded.skySamples)assert(Number.isFinite(v)&&v>=0);}
const marsDawn={...p,...fixedAtmosphere('mars'),planet:'mars',sun:0,sunAz:90,alt:0,T:5800};const blue=exposureRGB(atmosphere(marsDawn,.5,0).skySamples,316),warm=exposureRGB(atmosphere(marsDawn,15,0).skySamples,316);assert(blue[2]>blue[0]);assert(warm[0]>warm[2]);
console.log('HG phase normalization, aerosol absorption limits, physical dust effects, H2 blue clear sky and Mars narrow blue aureole verified. Full sunset image remains unvalidated.');
// A sphere-specific backward peak must not create a second solar-like glow.
const {dustData}=await import('../dust-tables.js');
for(let ri=0;ri<3;ri++)for(let i=0;i<dustData.lambda.length;i++){
 const params={...p,aerosol:'mineral',radius:dustData.radii[ri],dust:.2,dustH:10},table=dustData.tables[ri],ref=table[17][0];
 const at=theta=>aerosolOptics(params,dustData.lambda[i],Math.cos(theta*Math.PI/180),table,i,ref,0,0).dcross;
 assert(at(140)>at(160));assert(at(160)>at(180));
}
console.log('No mineral backward peak: all 3 size distributions and 41 wavelengths decrease smoothly from 140° to 180°.');
// Display overexposure must approach white instead of retaining a flat saturated disk.
const physical=atmosphere(marsDawn,.5,0).skySamples;
const over=exposureRGB(physical.map(([l,v])=>[l,v*1e8]),316);
assert(over[2]>over[0]);assert(Math.max(...over)===255);
let prev=[0,0,0];for(const exposure of [0,.01,.1,1,10,100,1000]){const rgb=exposureRGB(physical,exposure);rgb.forEach((v,i)=>{assert(v>=prev[i]);assert(v>=0&&v<=255)});prev=rgb;}
console.log('Display mapping: continuous monotonic brightness, bounded RGB, and spectral hue retention verified.');
// End-to-end gas-composition evidence at fixed surface pressure and gravity.
const conditions={...p,planet:'custom',planetRadius:6400,gravity:9.8,airT:288,logP:5,sun:45,sunAz:0,view:30,azimuth:90,dust:0,alt:0,T:5800};
const h2=atmosphere({...conditions,oxygen:0,co2:0,hydrogen:100}),co2=atmosphere({...conditions,oxygen:0,co2:100,hydrogen:0});
assert(Math.abs(h2.gasTau550-.2858301432559745)<1e-10);assert(Math.abs(co2.gasTau550-.1640133673094432)<1e-10);
assert(h2.q.H>20*co2.q.H);assert.notDeepEqual(h2.skySamples,co2.skySamples);assert(Math.abs(h2.relative/co2.relative-1)>.1);
const {chartData}=await import('../visuals.js');const skyExp=exps.find(e=>e.id==='sky');const rawParams={...conditions,oxygen:0,co2:0,hydrogen:100,mode:'simulation',skyPlot:'radiance'};assert.deepEqual(chartData(skyExp,rawParams,0).pts,h2.skySamples.map(([nm,v])=>[nm,v/10]));const gasPlot=chartData(skyExp,{...rawParams,skyPlot:'tau'},0);assert(Math.abs(gasPlot.pts.find(([nm])=>nm===550)[1]-h2.gasTau550)<1e-12);
console.log('H2 vs CO2 at fixed conditions: distinct physical spectra/optical thickness, unnormalized spectrum chart and gas-thickness chart verified.');
