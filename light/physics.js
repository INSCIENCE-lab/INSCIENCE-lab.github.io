import {selectedSky} from './atmosphere.js';
export const C=299792458,H=6.62607015e-34,K=1.380649e-23,EV=1.602176634e-19,SIGMA=5.670374419e-8;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const rad=d=>d*Math.PI/180;
export function planck(nm,T){let l=nm*1e-9;return 2*H*C*C/(l**5*Math.expm1(H*C/(l*K*T)));}
export function cmf(l){const g=(m,a,b)=>{let t=(l-m)*(l<m?a:b);return Math.exp(-t*t/2)};return [1.056*g(599.8,.0264,.0323)+.362*g(442,.0624,.0374)-.065*g(501.1,.049,.0382),.821*g(568.8,.0213,.0247)+.286*g(530.9,.0613,.0322),1.217*g(437,.0845,.0278)+.681*g(459,.0385,.0725)];}
export function spectralRGB(samples){let xyz=[0,0,0];for(let [l,v]of samples){let q=cmf(l);q.forEach((x,i)=>xyz[i]+=x*v)}let [x,y,z]=xyz;let rgb=[3.2406*x-1.5372*y-.4986*z,-.9689*x+1.8758*y+.0415*z,.0557*x-.204*y+1.057*z];let m=Math.max(...rgb,1e-40);return rgb.map(v=>Math.round(255*(clamp(v/m,0,1)<=.0031308?12.92*clamp(v/m,0,1):1.055*clamp(v/m,0,1)**(1/2.4)-.055)));}
export function colour(nm){if(nm<380||nm>780)return '#FFD1C3';return `rgb(${spectralRGB([[nm,1]]).join(',')})`;}
export const sinc=x=>Math.abs(x)<1e-7?1:Math.sin(x)/x;
export function fringe(x,p){let s=x/Math.hypot(p.L,x),beta=Math.PI*p.a*1e-6*s/(p.lambda*1e-9),phi=Math.PI*p.d*1e-3*s/(p.lambda*1e-9);return sinc(beta)**2*(p.path?0.5:Math.cos(phi)**2);}
export function besselJ1(x){if(Math.abs(x)>15){let a=Math.abs(x),z=a-3*Math.PI/4,p=1+15/(128*a*a)-14175/(98304*a**4),q=3/(8*a)-315/(3072*a**3)+1091475/(3932160*a**5);return Math.sign(x)*Math.sqrt(2/(Math.PI*a))*(Math.cos(z)*p-Math.sin(z)*q)}if(Math.abs(x)<1e-6)return x/2;let term=x/2,sum=term;for(let j=1;j<70;j++){term*=-(x*x/4)/(j*(j+1));sum+=term;if(Math.abs(term)<1e-15)break}return sum;}
export function diffraction(theta,p){let b=Math.PI*p.width*1e-6*Math.sin(theta)/(p.lambda*1e-9);if(p.kind==='circle')return Math.abs(b)<1e-7?1:(2*besselJ1(b)/b)**2;if(p.kind==='grating'){let ph=Math.PI*p.spacing*1e-6*Math.sin(theta)/(p.lambda*1e-9);let n=Number(p.n);return sinc(b)**2*(Math.abs(Math.sin(ph))<1e-8?1:(Math.sin(n*ph)/(n*Math.sin(ph)))**2)}return sinc(b)**2;}
export function index(nm,mat){let l=nm/1000;return mat==='water'?1.322+.003/l**2:mat==='glass'?1.5046+.0042/l**2:1;}
export function refraction(p){let n=index(p.lambda,p.material),n1=p.reverse?n:1,n2=p.reverse?1:n,q=n1/n2*Math.sin(rad(p.angle));return {n1,n2,theta:q>1?null:Math.asin(q)*180/Math.PI,critical:n1>n2?Math.asin(n2/n1)*180/Math.PI:null};}
// Stokes convention: Q positive along p; V sign fixes handedness only.
export function polarization(p){
 let a=rad(p.inputAngle||0),b=p.input==='circular'?1:(p.ellipticity??.5),q=(1-b*b)/(1+b*b),stokes=p.input==='linear'?[1,Math.cos(2*a),Math.sin(2*a),0]:p.input==='circular'||p.input==='elliptical'?[1,q*Math.cos(2*a),q*Math.sin(2*a),2*b/(1+b*b)]:[1,0,0,0];
 let n=1.333,i=rad(p.incidence??53),r=Math.asin(Math.sin(i)/n),ci=Math.cos(i),cr=Math.cos(r),rs=((ci-n*cr)/(ci+n*cr))**2,rp=((n*ci-cr)/(n*ci+cr))**2;
 if(p.mode==='water')stokes=[(rs+rp)/2,(rp-rs)/2,0,0];
 let input=stokes.slice(),angles=(p.count??(p.third?3:2))===1?[p.first??0]:(p.count??(p.third?3:2))===2?[p.first??0,p.angle]:[p.first??0,p.middle,p.angle],stages=[];
 for(let angle of angles){let a=rad(angle),out=Math.max(0,(stokes[0]+stokes[1]*Math.cos(2*a)+stokes[2]*Math.sin(2*a))/2);if(out<1e-14)out=0;stokes=[out,out*Math.cos(2*a),out*Math.sin(2*a),0];stages.push({angle,intensity:out})}
 return {stages,intensity:stokes[0],stokes:input,glareBefore:input[0],glareAfter:stokes[0],rs,rp,brewster:Math.atan(n)*180/Math.PI};
}
export function prism(nm,material,incidence=50,apex=60){
 const n=index(nm,material),i=rad(incidence),A=rad(apex),r1=Math.asin(Math.sin(i)/n),r2=A-r1,s=n*Math.sin(r2),tir=Math.abs(s)>1,e=tir?null:Math.asin(s);
 const H=1,S=Math.tan(A/2),entry=[-.35*S,-.65],inside=A/2-r1,d=[Math.cos(inside),Math.sin(inside)],edge=[S,1],v=[.35*S,.65-1];
 // Intersection with the right face from apex (0,-1) to (S,0).
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],to=[-entry[0],-1-entry[1]],distance=cross(to,edge)/cross(d,edge),exit=[entry[0]+distance*d[0],entry[1]+distance*d[1]];
 return {n,incidence,apex,r1:r1*180/Math.PI,r2:r2*180/Math.PI,emergence:e===null?null:e*180/Math.PI,tir,deviation:tir?NaN:(i+e-A)*180/Math.PI,entry,exit,inputDirection:A/2-i,insideDirection:inside,outputDirection:tir?null:-A/2+e};
}
export const works={cesium:2.14,sodium:2.28,zinc:4.3};
export function photo(p){let e=H*C/(p.lambda*1e-9)/EV,w=works[p.metal],ke=Math.max(0,e-w),stopped=p.voltage>=ke;return {e,w,ke,cutoff:H*C/(w*EV)*1e9,current:e>w&&!stopped?p.intensity*(1-p.voltage/ke):0};}
export const atomicSpecies={
 H:{name:'Гідроген (водень)',symbol:'H I',lines:[]},
 He:{name:'Гелій',symbol:'He I',source:'helium',lines:[['yellow',587.56148,169086.7666,186101.5463,'1s2p ³P°₂','1s3d ³D₃'],['red',667.81517,171134.8970,186104.9668,'1s2p ¹P°₁','1s3d ¹D₂']]},
 O:{name:'Оксиген (кисень)',symbol:'O I',source:'oxygen',lines:[['red',777.194,73768.200,86631.454,'3s ⁵S°₂','3p ⁵P₃'],['uv',130.2168,0,76794.978,'2p⁴ ³P₂','3s ³S°₁']]},
 N:{name:'Нітроген (азот)',symbol:'N I',source:'nitrogen',lines:[['red',744.229,83317.830,96750.840,'3s ⁴P₃/₂','3p ⁴S°₃/₂'],['uv',119.9550,0,83364.620,'2p³ ⁴S°₃/₂','3s ⁴P₅/₂']]},
 Fe:{name:'Залізо',symbol:'Fe I',source:'iron',lines:[['violet',404.58125,11976.238,36686.174,'a ³F₄','y ³F°₄'],['blue',438.35449,11976.238,34782.419,'a ³F₄','z ⁵G°₅']]},
 Na:{name:'Натрій',symbol:'Na I',source:'sodium',lines:[['d2',588.9950,0,16973.368,'3s ²S₁/₂','3p ²P°₃/₂'],['d1',589.5924,0,16956.172,'3s ²S₁/₂','3p ²P°₁/₂']]},
 Ne:{name:'Неон',symbol:'Ne I',source:'neon',lines:[['yellow',585.24879,135888.7173,152970.7328,'3s ²[1/2]°₁','3p ²[1/2]₀'],['red',640.2248,134041.8400,149657.0393,'3s ²[3/2]°₂','3p ²[5/2]₃']]}
};
export function atomSource(species){const a=atomicSpecies[species];return a?.source?'https://physics.nist.gov/PhysRefData/Handbook/Tables/'+a.source+'table3'+(species==='Fe'?'_a':'')+'.htm':null;}
export const HYDROGEN_E0 = H*C*10973731.568157/EV/(1+1/1836.152673426);
export function atom(p){if(p.species&&p.species!=='H'&&atomicSpecies[p.species]){const species=atomicSpecies[p.species],l=species.lines.find(x=>x[0]===p.atomicLine)||species.lines[0],de=(l[3]-l[2])*100*H*C/EV;return {upper:2,lower:1,de,lambda:1e7/(l[3]-l[2]),lambdaTable:l[1],medium:l[1]<200?'вакуум':'повітря',lowerCm:l[2],upperCm:l[3],eLower:l[2]*100*H*C/EV,eUpper:l[3]*100*H*C/EV,lowerLabel:l[4],upperLabel:l[5],species,tabled:true}}let upper=Math.max(2,Math.round(p.upper)),lower=clamp(Math.round(p.lower),1,upper-1),de=HYDROGEN_E0*(1/lower**2-1/upper**2);return {upper,lower,de,lambda:de>0?H*C/(de*EV)*1e9:Infinity};}
export function molecule(p){const vib=.22,rot=.00024,el=3.1,fluor=p.transition==='fluorescence',absorb=p.transition==='electronic',de=p.transition==='rotation'?2*rot*p.J:p.transition==='vibration'?vib+2*rot*p.J:fluor?2.4:el+vib*p.v+2*rot*p.J;return {de,inE:fluor?3.1:absorb?de:0,outE:absorb?0:de,loss:fluor?.7:0,lambda:H*C/(de*EV)*1e9};}
export function molecularLines(p){let vals=[];if(p.transition==='fluorescence')return [[H*C/(2.4*EV)*1e9,1]];if(p.transition==='rotation')for(let j=1;j<=10;j++)vals.push([H*C/(2*.00024*j*EV)*1e9,j===p.J?1:.45]);else if(p.transition==='vibration')for(let j=1;j<=10;j++)for(let sign of [-1,1])vals.push([H*C/((.22+sign*2*.00024*j)*EV)*1e9,j===p.J&&sign===1?1:.4]);else for(let v=0;v<=4;v++)for(let j=1;j<=10;j++)vals.push([H*C/((3.1+.22*v+2*.00024*j)*EV)*1e9,v===p.v&&j===p.J?1:.22]);return vals;}
export const stellarClassColours={O:'#9BB5FF',B:'#BACDFF',A:'#F2F3FF',F:'#FFF4DC',G:'#FFE5A0',K:'#FFA252',M:'#F05238'};
export const stellarClassNames={O:'блакитна',B:'блакитно-біла',A:'біла',F:'жовтувато-біла',G:'жовта',K:'помаранчева',M:'червона'};
export function star(p){let samples=[];for(let l=380;l<=780;l+=2)samples.push([l,planck(l,p.T)]);return {rgb:spectralRGB(samples),peak:2.897771955e6/p.T,flux:SIGMA*p.T**4,lum:4*Math.PI*(p.radius*6.957e8)**2*SIGMA*p.T**4,cls:p.T>=30000?'O':p.T>=10000?'B':p.T>=7500?'A':p.T>=6000?'F':p.T>=5200?'G':p.T>=3700?'K':'M'};}
// Homogeneous spherical atmospheric shell: single scattering, Rayleigh phase function.
// Effective vertical columns; not a climate model or multiple-scattering solver.
export function sky(p){let R=6371,top=80,obs=R+p.alt,view=rad(p.view),sun=rad(p.sun);let v=[Math.cos(view),Math.sin(view)],s=[Math.cos(sun),Math.sin(sun)];let origin=[0,obs];const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];const out=(pt,dir)=>{let b=dot(pt,dir);return -b+Math.sqrt(b*b+(R+top)**2-dot(pt,pt))};const blocked=(pt,dir)=>{let b=dot(pt,dir),disc=b*b-(dot(pt,pt)-R*R);return b<0&&disc>=0};let len=out(origin,v),sunlen=out(origin,s);let cossc=dot(v,s),phase=.75*(1+cossc*cossc);let factor={air:1,co2:2.5,hydrogen:.2}[p.gas],column=p.pressure;let skySamples=[],direct=[];let n=48;
 for(let l=380;l<=780;l+=5){let spectrum=planck(l,p.T),tau=.1*factor*column*(550/l)**4,aerosol=p.haze*.1*(550/l)**1.3,alpha=(tau+aerosol)/top;let skyI=0;for(let j=0;j<n;j++){let d=(j+.5)*len/n,pt=[v[0]*d,obs+v[1]*d];if(!blocked(pt,s)){let ls=out(pt,s);skyI+=Math.exp(-alpha*(ls+d))*(tau/top)*phase*(len/n)/(4*Math.PI)}}skySamples.push([l,spectrum*skyI]);direct.push([l,blocked(origin,s)?0:spectrum*Math.exp(-alpha*sunlen)])}
 return {skySamples,direct,skyRGB:spectralRGB(skySamples),sunRGB:spectralRGB(direct),path:sunlen,tau550:.1*factor*column,relative:skySamples.reduce((a,q)=>a+q[1],0)/direct.reduce((a,q)=>a+planck(q[0],p.T),0)};}
export function outputs(id,p,t){if(id==='wave')return {'Довжина хвилі (нм)':p.lambda,'Частота (ТГц)':C/(p.lambda*1e-9)/1e12,'Енергія фотона (еВ)':H*C/(p.lambda*1e-9)/EV,'Відносна інтенсивність':p.amp**2};if(id==='interference')return {[p.path?'Крок для когерентного випадку (мм)':'Крок смуг (мм)']:p.lambda*1e-9*p.L/(p.d*1e-3)*1000,'Кількість реєстрацій':p.mode==='wave'?0:Math.min(12000,Math.floor(t*p.rate+1e-8)),'Довжина хвилі (нм)':p.lambda};if(id==='diffraction'){const envelope=Math.asin((p.kind==='circle'?1.21967:1)*p.lambda/(p.width*1000))*180/Math.PI;return {'Довжина хвилі (нм)':p.lambda,'Ширина отвору (мкм)':p.width,'Кут першого мінімуму (град)':p.kind==='grating'?Math.asin(p.lambda/(p.n*p.spacing*1000))*180/Math.PI:envelope,...(p.kind==='grating'?{'Кут мінімуму огинаючої (град)':envelope}:{})};}if(id==='polarization'){let q=polarization(p);return {'Кількість поляризаторів':q.stages.length,'Кут першого (град)':p.first??0,...(q.stages.length>1?{'Кут аналізатора (град)':p.angle}:{}),...(p.mode==='water'?{'Відблиск до фільтрів (% від освітлення)':100*q.glareBefore,'Відблиск після фільтрів (% від освітлення)':100*q.intensity,'Пропускання фільтрів (% від відблиску)':100*q.intensity/q.stokes[0],'Світло від деталі після фільтрів (% від освітлення)':100*waterLight(p).detailAfter,'Разом до ока (% від освітлення)':100*waterLight(p).totalAfter,'Кут Брюстера (град)':q.brewster}:{'Пропускання I/Iвх':q.intensity})}}if(id==='refraction'){if(p.prism){let b=prism(400,p.material,p.prismAngle,p.apex),r=prism(700,p.material,p.prismAngle,p.apex);return {'Кут падіння (град)':p.prismAngle??50,'Кут призми (град)':p.apex??60,'n при 400 нм':b.n,'n при 700 нм':r.n,'Відхилення 400 нм (град)':b.deviation,'Відхилення 700 нм (град)':r.deviation,'Кутове розділення (град)':Math.abs(b.deviation-r.deviation)}}let q=refraction(p);return {'Кут падіння (град)':p.angle,'Кут заломлення (град)':q.theta??NaN,'Показник n₁':q.n1,'Показник n₂':q.n2}}if(id==='photoelectric'){let q=photo(p);return {'Енергія фотона (еВ)':q.e,'Робота виходу (еВ)':q.w,'Kmax (еВ)':q.ke,'Фотострум (умовні од.)':q.current,'Затримувальна напруга (В)':p.voltage}}if(id==='atom'){let q=atom(p);return {'Енергія переходу (еВ)':q.de,'Довжина хвилі (нм)':q.lambda,...(q.tabled?{'Енергія нижнього стану (еВ)':q.eLower,'Енергія верхнього стану (еВ)':q.eUpper}:{'Верхній рівень n':q.upper,'Нижній рівень n':q.lower})}}if(id==='molecule'){let q=molecule(p);return {'Енергія поглинання (еВ)':q.inE,'Енергія випромінювання (еВ)':q.outE,'Інші ступені вільності (еВ)':q.loss,'Довжина хвилі (нм)':q.lambda}}if(id==='sky'){if(p.mode==='simulation'){let q=selectedSky(p);return {'Тиск (Па)':q.q.pressure,'Висота зорі (град)':p.sun,'Кут розсіювання (град)':q.theta,'Масштаб висоти газу (км)':q.q.H,'Прискорення вільного падіння (м/с²)':q.q.g,'Середня маса молекули (а.о.м.)':q.meanMass,'Оптична товщина газу 550 нм':q.gasTau550,'Оптична товщина пилу 550 нм':p.dust,'Інтегральний сигнал неба (відн./ср)':q.relative}}if(p.mode==='mars')return {};let q=sky(p);return {'Температура зорі (К)':p.T,'Висота зорі (град)':p.sun,'Відносна газова колонка':p.pressure,'Шлях у моделі (км)':q.path,'Оптична товщина 550 нм':q.tau550}}let q=star(p);return {'Температура (К)':p.T,'Радіус (R☉)':p.radius,'Максимум Bλ (нм)':q.peak,'Потік з поверхні (Вт/м²)':q.flux,'Світність (Вт)':q.lum,'Світність (L☉)':q.lum/3.828e26};}

export const atomicGround={
 H:{electrons:1,configuration:'1s¹'},He:{electrons:2,configuration:'1s²'},
 O:{electrons:8,configuration:'1s² 2s² 2p⁴'},N:{electrons:7,configuration:'1s² 2s² 2p³'},
 Fe:{electrons:26,configuration:'[Ar] 3d⁶ 4s²'},Na:{electrons:11,configuration:'[Ne] 3s¹'},Ne:{electrons:10,configuration:'1s² 2s² 2p⁶'}
};

// Two independent sources reach the eye: surface glare and an assumed diffuse underwater scene.
export function waterLight(p){
 const q=polarization({...p,mode:'water'}),detailBefore=.02;
 const detailTransmission=polarization({...p,mode:'lab',input:'unpolarized'}).intensity;
 const detailAfter=detailBefore*detailTransmission;
 return {glareBefore:q.glareBefore,glareAfter:q.glareAfter,detailBefore,detailAfter,detailTransmission,totalBefore:q.glareBefore+detailBefore,totalAfter:q.glareAfter+detailAfter};
}
