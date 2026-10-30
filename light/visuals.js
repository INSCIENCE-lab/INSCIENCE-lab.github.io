import {sunCameraRay,sampleSkyRGB,skyDisplay} from './sky-camera.js';
import {atmosphere,selectedSky,exposureRGB,dayPosition,gasSigma,skyLinearRGB,displaySkyRGB,getTransfer} from './atmosphere.js';
import * as P from './physics.js';
export function art(id,hero=false){let content='',col='#FF4E29';if(id==='wave'||hero){for(let j=0;j<8;j++){let pts=Array.from({length:101},(_,i)=>{let x=30+i*4.4;return `${x},${145+Math.sin(i*.13+j*.22)*45+j*5}`}).join(' ');content+=`<polyline points="${pts}" fill="none" stroke="${j%2?'#FFB19D':col}" stroke-width="${j===0?2:1}" opacity="${1-j*.09}"/>`}content+='<circle cx="370" cy="135" r="5" fill="#f4d5ac"/><path d="M30 250H470" stroke="#6E4A3E"/><text x="30" y="70" fill="#FF4E29" font-size="13" letter-spacing="3">ХВИЛЯ. ФОТОН. ВІДКРИТТЯ.</text><text x="30" y="280" fill="#E2C4B9" font-size="11">380 нм</text><text x="430" y="280" fill="#E2C4B9" font-size="11">780 нм</text>';for(let i=0;i<88;i++)content+=`<rect x="${30+i*5}" y="244" width="5" height="8" fill="hsl(${270-i*3.1} 65% 65%)"/>`}
else if(id==='interference'||id==='diffraction'){for(let i=0;i<15;i++)content+=`<path d="M${160+i*10} 30 Q${210+i*10} 150 ${160+i*10} 270" fill="none" stroke="${col}" opacity="${.9-i*.045}"/>`;for(let i=0;i<17;i++)content+=`<rect x="430" y="${40+i*13}" width="8" height="${3+6*Math.cos(i*1.2)**2}" fill="${col}" opacity="${.3+.7*Math.cos(i*1.2)**2}"/>`;content+='<path d="M150 20V126M150 136V160M150 170V280" stroke="#A57C6E" stroke-width="5"/>'}
else if(id==='atom'||id==='molecule'){for(let i=0;i<5;i++)content+=`<path d="M100 ${65+i*i*10}H300" stroke="${col}" opacity="${1-i*.12}"/>`;content+='<path d="M220 75V200l-8-15m8 15 8-15" fill="none" stroke="#f2cc98" stroke-width="3"/>';for(let i=0;i<6;i++)content+=`<path d="M${350+i*12} 90V230" stroke="hsl(${i*40+10} 65% 65%)" stroke-width="3"/>`}
else if(id==='blackbody'||id==='sky'){content+='<circle cx="190" cy="155" r="63" fill="#f4d8a7"/><circle cx="190" cy="155" r="85" fill="none" stroke="#D6876D"/><path d="M310 230Q340 20 360 100T470 215" fill="none" stroke="#FF4E29" stroke-width="3"/>';if(id==='sky')content+='<path d="M0 250Q250 160 500 250V300H0" fill="#3e566f"/>'}
else if(id==='polarization'){for(let i=0;i<3;i++)content+=`<g transform="translate(${120+i*125},150) rotate(${i*45})"><ellipse rx="30" ry="85" fill="#FF4E2955" stroke="${col}"/><path d="M0-70V70" stroke="${col}" stroke-width="2"/></g>`;content+='<path d="M40 150H465" stroke="#f4d8a7" stroke-width="2"/>'}
else if(id==='refraction'){content+='<path d="M210 60 100 260H350Z" fill="#FF4E2944" stroke="#FF4E29"/><path d="M20 150 160 150 285 180" fill="none" stroke="white" stroke-width="3"/>';for(let i=0;i<6;i++)content+=`<path d="M285 180L470 ${140+i*18}" stroke="hsl(${270-i*50} 70% 65%)" stroke-width="2"/>`}
else{content+='<path d="M190 60V250M400 60V250" stroke="#FFD1C3" stroke-width="8"/>';for(let i=0;i<5;i++)content+=`<path d="M40 ${80+i*23}H180" stroke="#FF4E29"/><circle cx="${220+i*33}" cy="${100+i*20}" r="4" fill="#f4d8a7"/>`}
content=content.replace(/(<text[^>]*fill=")[^"]+/g,'$1#ffffff');return `<svg viewBox="0 0 500 320" aria-hidden="true">${content}</svg>`}
export function setup(canvas){let box=canvas.getBoundingClientRect(),w=box.width||600,h=box.height||300,d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d)}let c=canvas.getContext('2d');c._darkLabels=false;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);return {c,w,h};}
function line(c,pts,color,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function text(c,s,x,y,color='#F5D8CD',size=11){if(c._darkLabels){color='#ffffff';size=Math.max(size,11);let width=c.canvas.width/(c.getTransform().a||1);c.font=`${size}px NAMU, sans-serif`;let words=String(s).split(' '),rows=[''];let available=Math.max(70,width-Math.max(12,x)-12);for(let word of words){let i=rows.length-1,next=rows[i]?(rows[i]+' '+word):word;if(c.measureText(next).width>available&&rows[i])rows.push(word);else rows[i]=next}if(rows.length>1){rows.forEach((row,i)=>textLine(c,row,x,y+i*(size+5),color,size));return}}textLine(c,s,x,y,color,size)}
function textLine(c,s,x,y,color,size){c.fillStyle=color;if(c._darkLabels){let width=c.canvas.width/(c.getTransform().a||1);c.font=`${size}px NAMU, sans-serif`;x=Math.max(10,Math.min(x,width-c.measureText(String(s)).width-12));c.save();c.fillStyle='#181513';c.fillRect(x-3,y-size-2,c.measureText(String(s)).width+6,size+7);c.restore()}let parts=String(s).split(/(E₀,ref|Bλ,ₘₐₓ|Bλ|λₘₐₓ|Kₘₐₓ|Kmax|Iвх|Iвих|n1|n2|R☉|L☉)/g);for(let part of parts){let match={'E₀,ref':['E','0,ref'],'Bλ':['B','λ'],'Bλ,ₘₐₓ':['B','λ,max'],'λₘₐₓ':['λ','max'],'Kₘₐₓ':['K','max'],'Kmax':['K','max'],'Iвх':['I','вх'],'Iвих':['I','вих'],'n1':['n','1'],'n2':['n','2'],'R☉':['R','☉'],'L☉':['L','☉']}[part];c.font=`${size}px NAMU, sans-serif`;if(match){c.fillText(match[0],x,y);x+=c.measureText(match[0]).width;c.font=`${size*.72}px NAMU, sans-serif`;c.fillText(match[1],x,y+size*.25);x+=c.measureText(match[1]).width}else{c.fillText(part,x,y);x+=c.measureText(part).width}}}
function dot(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=col;c.fill()}
function arrow(c,x1,y1,x2,y2,col){line(c,[[x1,y1],[x2,y2]],col,2);let a=Math.atan2(y2-y1,x2-x1);line(c,[[x2-8*Math.cos(a-.4),y2-8*Math.sin(a-.4)],[x2,y2],[x2-8*Math.cos(a+.4),y2-8*Math.sin(a+.4)]],col,2)}
export function fmt(x,d=3){if(!Number.isFinite(x))return '—';if(x!==0&&(Math.abs(x)>=1e5||Math.abs(x)<.001))return x.toExponential(2).replace('.',',');return x.toLocaleString('uk-UA',{maximumFractionDigits:d});}
export function drawScene(canvas,e,p,t,photons){let {c,w,h}=setup(canvas),cx=w/2,cy=h/2,col=P.colour(p.lambda||550),pad=25; c._darkLabels=true;c.fillStyle='#181513';c.fillRect(0,0,w,h);for(let i=0;i<25;i++)dot(c,(i*173%w),(i*73%h),.6,'#483027');if(e.id!=='sky')text(c,['wave','interference','photoelectric','atom','molecule','polarization'].includes(e.id)?'СХЕМА · ЧАС АНІМАЦІЇ УМОВНИЙ':'СХЕМА',18,24,'#D4AD9F',9);
if(e.id==='wave'){let origin=[w*.15,h*.64],ang=P.rad(p.angle),proj=(x,y,z)=>[origin[0]+x*w*.69+y*Math.cos(ang)*w*.12,origin[1]-z*h*.24-y*Math.sin(ang)*h*.2];for(let axis of [[1.05,0,0],[0,1.3,0],[0,0,1.4]]){let pt=proj(...axis);arrow(c,...origin,...pt,'#B48574')}let a=p.amp/2;let ep=[],bp=[];for(let i=0;i<=150;i++){let x=i/150,phase=2*Math.PI*(1650*x/p.lambda-.4*t*550/p.lambda);ep.push(proj(x,0,a*Math.sin(phase)));bp.push(proj(x,a*Math.sin(phase),0));if(i%10===0){line(c,[proj(x,0,0),ep.at(-1)],'#FF4E2966');line(c,[proj(x,0,0),bp.at(-1)],'#7bcac466')}}line(c,ep,'#FF4E29',2);line(c,bp,'#7bcac4',2);text(c,'E — електричне поле',20,h-40,'#FF4E29');text(c,'B — магнітне поле',20,h-20,'#7bcac4');text(c,'x → · довжина ділянки 1,65 мкм',20,h-64);text(c,p.lambda<380?'Ультрафіолет · колір умовний':p.lambda>780?'Інфрачервоне · колір умовний':'Видимий діапазон',20,49);}
if(e.id==='interference')drawInterference(c,w,h,p,t,photons);
if(e.id==='diffraction'){let width=Math.min(w*.65,h*.7),left=cx-width/2,top=cy-width/2+15;let im=c.createImageData(Math.ceil(width),Math.ceil(width));let rgb=P.spectralRGB([[p.lambda,1]]);for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){let u=(x-im.width/2)/(im.width/2),v=(y-im.height/2)/(im.height/2);let theta=P.rad(15)*(p.kind==='circle'?Math.hypot(u,v):u),val=P.diffraction(theta,p),gain=val**.45,j=(y*im.width+x)*4;for(let k=0;k<3;k++)im.data[j+k]=Math.round(rgb[k]*gain);im.data[j+3]=255}let off=document.createElement('canvas');off.width=im.width;off.height=im.height;off.getContext('2d').putImageData(im,0,0);c.drawImage(off,left,top,width,width);text(c,'−15°',left,h-17);text(c,'0°',cx-8,h-17);text(c,'+15°',left+width-30,h-17);text(c,'Слабкі смуги підсилено: I⁰·⁴⁵.',18,47,'#E2C4B9',w<450?8:10);}
if(e.id==='polarization')drawPolarization3D(c,w,h,p,t);
if(e.id==='refraction'){if(!p.prism){let q=P.refraction(p),len=Math.min(w*.37,h*.38);c.fillStyle='#FF4E2933';c.fillRect(0,cy,w,h/2);line(c,[[0,cy],[w,cy]],'#BC8A79');c.setLineDash([5,5]);line(c,[[cx,40],[cx,h-25]],'#A57C6E');c.setLineDash([]);let a=P.rad(p.angle);arrow(c,cx-len*Math.sin(a),cy-len*Math.cos(a),cx,cy,col);arrow(c,cx,cy,cx+len*Math.sin(a),cy-len*Math.cos(a),'#FFD1C3');if(q.theta!==null){let b=P.rad(q.theta);arrow(c,cx,cy,cx+len*Math.sin(b),cy+len*Math.cos(b),col)}else text(c,'Повне внутрішнє відбиття',20,h-30,'#f2cc98');text(c,`n₁ = ${fmt(q.n1)}`,20,70);text(c,`n₂ = ${fmt(q.n2)}`,20,h-50);text(c,'Нормаль',cx+8,60)}else drawPrism(c,w,h,p);}
if(e.id==='photoelectric'){let q=P.photo(p),x1=w*.25,x2=w*.78;line(c,[[x1,85],[x1,h-80]],'#EEAA94',7);line(c,[[x2,85],[x2,h-80]],'#FFD3C4',7);text(c,'Фотокатод',x1-40,h-45);text(c,'Анод',x2-17,h-45);for(let j=0;j<Math.ceil(p.intensity*6/100);j++){let phase=(t*.7+j*.17)%1;line(c,[[15+phase*(x1-30),130+j*18],[30+phase*(x1-30),125+j*18]],col,2)}if(q.current>0){for(let i=0;i<Math.floor(q.current/8)+1;i++){let v=(t*.5+i*.19)%1;dot(c,x1+10+v*(x2-x1-20),cy+Math.sin(i*5)*60,3,'#7bcac4')}}else text(c,p.intensity===0?'Потік фотонів нульовий':q.e<=q.w?'Фотону бракує енергії':'Електрони зупинені полем',20,h-64,'#f2cc98',w<450?10:12);text(c,`E = ${fmt(q.e)} еВ`,20,50,col);text(c,`Kₘₐₓ = ${fmt(q.ke)} еВ`,20,70,'#7bcac4');text(c,`U = ${fmt(p.voltage)} В`,w*.55,h-20);}
if(e.id==='atom')drawAtomTransition(c,w,h,p,t);
if(e.id==='molecule'&&p.view==='levels')drawMolecularLevels(c,w,h,p,t);
if(e.id==='molecule'&&p.view!=='levels')drawMolecularMotion(c,w,h,p,t);
if(e.id==='sky'){drawAtmosphere(c,w,h,p);}
if(e.id==='blackbody'){let q=P.star(p),schematic=p.starColourMode!=='calculated',rgb=schematic?P.stellarClassColours[q.cls]:`rgb(${q.rgb.join(',')})`,r=Math.min(h*.19,w*.15)*(0.65+.15*Math.sqrt(p.radius));c.shadowBlur=30;c.shadowColor=rgb;dot(c,w*.27,cy-15,r,rgb);c.shadowBlur=0;text(c,`${p.T} К`,w*.60,cy-40,'#ffffff',22);text(c,`Клас ≈ ${q.cls}`,w*.60,cy-10,'#ffffff',16);text(c,schematic?P.stellarClassNames[q.cls]:'Чорне тіло',w*.60,cy+17,'#ffffff',12);text(c,`λₘₐₓ = ${fmt(q.peak,1)} нм`,20,h-86);text(c,q.peak>=380&&q.peak<=780?'Максимум у видимому · колір дає весь спектр':q.peak>780?'Максимум в інфрачервоному діапазоні':'Максимум в ультрафіолетовому діапазоні',20,h-62,'#ffffff',11);text(c,schematic?'Умовний колір класу · не точний видимий відтінок':'Колір чорного тіла · яскравість нормовано',20,h-24,'#ffffff',11);}
}
export function photonBand(nm){return nm<380?'Ультрафіолет':nm<=780?'Видиме світло':nm<2500?'Близьке інфрачервоне':nm<25000?'Середнє інфрачервоне':nm<1e6?'Далеке ІЧ / субміліметрове':'Мікрохвильове'}
function drawMolecularMotion(c,w,h,p,t){
 const q=P.molecule(p),cycle=t,event=3.2,after=cycle>=event,absorb=p.transition==='electronic',fluor=p.transition==='fluorescence',rot=p.transition==='rotation',vib=p.transition==='vibration',cx=w*.38,cy=h*.52,r0=Math.min(72,w*.22),shownJ=after?Math.max(0,p.J-1):p.J;
 const title=rot?`Обертання: J = ${p.J} → ${p.J-1}`:vib?`Коливання: v = 1 → 0; J = ${p.J} → ${p.J-1}`:fluor?'Флуоресценція: поглинання й випромінювання':'Електронний перехід: поглинання';
 text(c,title,18,48,'white',11);
 text(c,`E фотона = ${fmt(absorb?q.inE:q.outE,5)} еВ`,18,69,'white',11);
 text(c,rot?`Стан молекули: J = ${shownJ}`:vib?`Стан: v = ${after?0:1}, J = ${shownJ}`:fluor?(cycle<1.5?'Поглинання 3,10 еВ':cycle<event?'0,70 еВ → оточення':'Випромінювання 2,40 еВ'):(after?`Стан: v = ${p.v}, J = ${p.J}`:`Початковий стан: v = 0, J = ${p.J-1}`),18,90,'white',11);
 let angle=0,bond=r0;
 if(rot){let u=Math.sqrt(p.J*(p.J+1))*.55,l=Math.sqrt(Math.max(0,(p.J-1)*p.J))*.55;angle=u*Math.min(cycle,event)+l*Math.max(0,cycle-event)}
 if(vib){angle=.25*Math.sin(t*.5);bond=r0+(after?0:Math.min(18,w*.05)*Math.sin(cycle*6))}
 const dx=Math.cos(angle)*bond,dy=Math.sin(angle)*bond,pts=[[cx-dx*.6,cy-dy*.6],[cx+dx*.4,cy+dy*.4]];
 line(c,pts,'#FF4E29',5);dot(c,...pts[0],13,'#FF8F73');dot(c,...pts[1],18,'#FFD1C3');
 c.setLineDash([3,4]);if(rot){c.beginPath();c.ellipse(cx,cy,r0*.6,r0*.6,0,0,Math.PI*2);c.strokeStyle='#ffffff55';c.stroke()}if(vib){for(let pt of pts){c.beginPath();c.ellipse(pt[0],pt[1],after?17:25,22,0,0,Math.PI*2);c.strokeStyle='#ffffff55';c.stroke()}}c.setLineDash([]);
 dot(c,cx,cy,2,'#fff');
 if(absorb||fluor){c.beginPath();c.ellipse(cx,cy,bond*.85,45,0,0,Math.PI*2);c.strokeStyle=after&&!fluor?'#f4d5ac':'#FF4E2977';c.lineWidth=2;c.stroke()}
 const photon=(progress,incoming,nm)=>{let x1=incoming?w-25:cx+bond*.5,x2=incoming?cx+bond*.5:w-22,y1=cy-45,y2=cy-45,x=x1+(x2-x1)*progress,y=y1+(y2-y1)*progress,col=nm>=380&&nm<=780?P.colour(nm):'#f4d5ac';let pulse=[];for(let k=0;k<=22;k++){let z=(k/22-.5)*28;pulse.push([x+z,y+Math.sin(k/22*4*Math.PI)*6*Math.exp(-z*z/220)])}line(c,pulse,col,2.5);arrow(c,x+(incoming?18:-18),y+17,x+(incoming?-5:5),y+17,col)};
 if(absorb&&cycle<event)photon(cycle/event,true,q.lambda);
 if(!absorb&&!fluor&&cycle>=event&&cycle<6.5)photon((cycle-event)/3.3,false,q.lambda);
 if(fluor){if(cycle<1.5)photon(cycle/1.5,true,P.H*P.C/(q.inE*P.EV)*1e9);if(cycle>=event&&cycle<6.5)photon((cycle-event)/3.3,false,q.lambda)}
 text(c,absorb?'Фотон → молекула':after?'Молекула → фотон':'Молекула до переходу',18,h-77,'white',11);
 text(c,`λ = ${fmt(q.lambda,1)} нм`,18,h-55,'white',11);
 text(c,photonBand(q.lambda),18,h-35,'white',11);
 text(c,q.lambda>=380&&q.lambda<=780?'Колір фотонної позначки наближений':'Невидимий діапазон: колір позначки умовний',18,h-15,'white',11);
}
export function chartData(e,p,t){let pts=[],other=[],xlabel=e.axis[0],ylabel=e.axis[1],marker=null;const sample=(a,b,n,fn)=>Array.from({length:n+1},(_,i)=>{let x=a+(b-a)*i/n;return [x,fn(x)]});if(e.id==='wave'){pts=sample(0,1.65,660,x=>p.amp*Math.sin(2*Math.PI*(x*1000/p.lambda-.4*t*550/p.lambda)));xlabel='Координата x, мкм';ylabel='E / E₀,ref';}if(e.id==='interference'){let extent=.015;pts=sample(-extent*1e3,extent*1e3,600,x=>P.fringe(x/1e3,p))}if(e.id==='diffraction')pts=sample(-15,15,4000,x=>P.diffraction(P.rad(x),p));if(e.id==='polarization'){let key=Number(p.count||1)===1?'first':'angle';pts=sample(0,180,180,x=>P.polarization({...p,[key]:x}).intensity*(p.mode==='water'?100:1));marker=[p[key],P.polarization(p).intensity*(p.mode==='water'?100:1)];xlabel=Number(p.count||1)===1?'Кут першого фільтра, град':'Кут останнього фільтра, град';ylabel=p.mode==='water'?'Відблиск після фільтрів, % від освітлення':'Вихідна інтенсивність / початкова'}if(e.id==='refraction'){pts=sample(380,750,150,x=>P.index(x,p.material));if(!p.prism)marker=[p.lambda,P.index(p.lambda,p.material)]}if(e.id==='photoelectric'){let q=P.photo(p);pts=sample(0,7,180,x=>Math.max(0,x-q.w));marker=[q.e,q.ke]}if(e.id==='atom'){let q=P.atom(p),width=q.lambda*.003;pts=sample(q.lambda*.8,q.lambda*1.2,700,x=>p.kind==='emission'?Math.exp(-(((x-q.lambda)/width)**2)):1-.8*Math.exp(-(((x-q.lambda)/width)**2)));xlabel='Довжина хвилі, нм · масштаб біля вибраної лінії'}if(e.id==='molecule'){let lines=P.molecularLines(p),centers=lines.map(q=>Math.log10(q[0])),min=Math.min(...centers)-.015,max=Math.max(...centers)+.015,sigma=p.transition==='electronic'?.0005:p.transition==='vibration'?.0002:.001;pts=sample(min,max,1000,x=>lines.reduce((a,[l,v])=>a+v*Math.exp(-(((x-Math.log10(l))/sigma)**2)),0));xlabel='log₁₀(λ / нм)';ylabel=p.transition==='electronic'?'Лінії поглинання · сили умовні':'Лінії випромінювання · сили умовні'}if(e.id==='sky'){let q=p.mode==='simulation'?selectedSky(p):P.sky(p);if(p.mode==='simulation'&&p.skyPlot==='tau'){pts=q.skySamples.map(([x])=>[x,q.q.f.reduce((a,f,k)=>a+f*gasSigma(x,k),0)*q.q.pressure/(q.q.mass*q.q.g)]);ylabel='Вертикальна оптична товщина газу'}else if(p.mode==='simulation'&&p.skyPlot!=='shape'){pts=q.skySamples;pts=q.skySamples.map(([x,y],i)=>[x,y/(q.binWidths?.[i]||q.binWidth||10)]);ylabel='Світло неба, відн./ср/нм'}else{let max=Math.max(...q.skySamples.map(q=>q[1]),1e-40),max2=Math.max(...q.direct.map(q=>q[1]),1e-40);pts=q.skySamples.map(([x,y])=>[x,y/max]);other=q.direct.map(([x,y])=>[x,y/max2]);ylabel='Нормовані спектри: небо / зоря'}}if(e.id==='blackbody'){let max=P.planck(P.star(p).peak,p.T);pts=sample(100,2500,600,x=>p.normal?P.planck(x,p.T)/max:P.planck(x,p.T)*1e-9);marker=[P.star(p).peak,p.normal?1:max*1e-9];ylabel=p.normal?'Bλ / Bλ,ₘₐₓ':'Bλ, Вт·м⁻²·ср⁻¹·нм⁻¹'}return {pts,other,xlabel,ylabel,marker,visibleBand:e.id==='blackbody',fixedY:e.id==='wave'?[-2.1,2.1]:null};}
export function drawChart(canvas,data,hover=null){let {c,w,h}=setup(canvas),{pts,other=[],xlabel='',ylabel='',marker=null}=data;if(!pts.length){text(c,'Запиши щонайменше два виміри для порівняння.',20,80,'#71635D');return null}let all=pts.concat(other).filter(q=>q.every(Number.isFinite));if(!all.length)return null;let xmin=Math.min(...all.map(q=>q[0])),xmax=Math.max(...all.map(q=>q[0])),ymin=Math.min(0,...all.map(q=>q[1])),ymax=Math.max(...all.map(q=>q[1]));if(data.fixedY){[ymin,ymax]=data.fixedY;}if(xmin===xmax){xmin-=1;xmax+=1}if(ymax===ymin)ymax=ymin+1;let left=w<450?49:67,right=16,top=35,bottom=40,ww=w-left-right,hh=h-top-bottom;let X=x=>left+(x-xmin)/(xmax-xmin)*ww,Y=y=>top+hh-(y-ymin)/(ymax-ymin)*hh;
if(data.visibleBand){for(let l=380;l<780;l+=4){c.fillStyle=P.colour(l);c.globalAlpha=.13;c.fillRect(X(l),top,Math.max(1,X(l+4)-X(l)),hh);c.globalAlpha=1;}text(c,'Видиме: 380–780 нм',left,top+14,'#51413A',10);}
for(let i=0;i<=4;i++){let x=left+i*ww/4,y=top+i*hh/4;line(c,[[x,top],[x,top+hh]],'#EAD8D1');line(c,[[left,y],[left+ww,y]],'#EAD8D1');text(c,fmt(xmin+i*(xmax-xmin)/4,2),x-10,h-22,'#71635D',9);text(c,fmt(ymax-i*(ymax-ymin)/4,5),3,y+3,'#71635D',9)}text(c,ylabel,4,15,'#FF4E29',10);text(c,xlabel,Math.max(left,w-xlabel.length*5.4-12),h-4,'#71635D',9);line(c,pts.filter(q=>q.every(Number.isFinite)).map(([x,y])=>[X(x),Y(y)]),'#FF4E29',2);if(other.length)line(c,other.map(([x,y])=>[X(x),Y(y)]),'#be7b35',1.5);if(data.scatter)for(let [x,y]of pts)if(Number.isFinite(x)&&Number.isFinite(y))dot(c,X(x),Y(y),4,'#FF4E29');if(marker)dot(c,X(marker[0]),Y(marker[1]),4,'#bd7839');if(hover!==null){let value=xmin+(hover-left)/ww*(xmax-xmin),nearest=pts.reduce((a,b)=>Math.abs(b[0]-value)<Math.abs(a[0]-value)?b:a);if(nearest.every(Number.isFinite)){line(c,[[X(nearest[0]),top],[X(nearest[0]),top+hh]],'#D6876D');dot(c,X(nearest[0]),Y(nearest[1]),4,'#FF4E29');return nearest}}return null;}

// Orthographic projection of transverse fields. B = k-hat cross E / c.
export function polarizationField(p,x,t,stage=0){
 const q=P.polarization(p),ph=2*Math.PI*(x/2-t*.45);let y,z;
 if(p.mode==='water'||p.input==='unpolarized'){
  const [I,Q]=q.stokes;
  // Incoherent orthogonal components: a smooth illustrative realization.
  y=Math.sqrt(Math.max(0,I+Q))*Math.cos(ph);
  z=Math.sqrt(Math.max(0,I-Q))*Math.cos(ph*1.317+.73);
 }else{
  const a=P.rad(p.inputAngle||0),b=p.input==='linear'?0:p.input==='circular'?1:Number(p.ellipticity??.5),n=Math.sqrt(2/(1+b*b));
  y=n*(Math.cos(ph)*Math.cos(a)-b*Math.sin(ph)*Math.sin(a));
  z=n*(Math.cos(ph)*Math.sin(a)+b*Math.sin(ph)*Math.cos(a));
 }
 for(const st of q.stages.slice(0,stage)){const a=P.rad(st.angle),v=y*Math.cos(a)+z*Math.sin(a);y=v*Math.cos(a);z=v*Math.sin(a)}
 return {E:[0,y,z],cB:[0,-z,y]};
}
function drawPolarization3D(c,w,h,p,t){
 const water=p.mode==='water',detail=water&&p.waterBeam==='detail';if(detail)p={...p,mode:'lab',input:'unpolarized'};
 const q=P.polarization(p),count=q.stages.length,scale=Math.min((w-58)/8.8,(h-220)/3.2),yaw=P.rad(p.camera??35),oy=h*.52,fieldScale=Math.min(w*.22,(h-220)/3.2);
 const project=(x,y,z)=>[w/2+(x-4)*scale*Math.cos(yaw)+z*fieldScale*Math.sin(yaw),oy-y*fieldScale*.9+(z*fieldScale*Math.cos(yaw)-(x-4)*scale*Math.sin(yaw))*.28];
 const fieldAt=(x,stage)=>{const f=polarizationField(p,x,t,stage),norm=1/Math.sqrt(Math.max(q.stokes[0],1e-30));return {E:f.E.map(v=>v*norm),cB:f.cB.map(v=>v*norm)}},pos=Array.from({length:count},(_,i)=>count===1?3.2:2.2+i*3.7/(count-1));
 const colors={E:'#FF4E29',cB:'#7bcac4'};
 const safeArrow=(a,b,col)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<2)return;const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),tip=Math.min(6,len*.3);line(c,[a,b],col,1.4);line(c,[[b[0]-tip*Math.cos(angle-.45),b[1]-tip*Math.sin(angle-.45)],b,[b[0]-tip*Math.cos(angle+.45),b[1]-tip*Math.sin(angle+.45)]],col,1.4)};
 // Axis and transverse reference frame use the same 3D projection as the fields.
 safeArrow(project(0,0,0),project(8.2,0,0),'#E2C4B9');
 c.setLineDash([3,5]);for(const x of [0,8]){line(c,[project(x,-.85,0),project(x,.85,0)],'#6E4A3E');line(c,[project(x,0,-.85),project(x,0,.85)],'#6E4A3E')}c.setLineDash([]);
 const bounds=[0,...pos,8];
 for(let stage=0;stage<bounds.length-1;stage++){
  if((stage?q.stages[stage-1].intensity:q.stokes[0])<1e-14)continue;const start=bounds[stage]+(stage?.06:0),end=bounds[stage+1]-(stage<count?.06:0);
  for(const key of ['cB','E']){
   let curve=[];for(let i=0;i<=100;i++){const x=start+(end-start)*i/100,v=fieldAt(x,stage)[key],tip=project(x,v[1]*.55,v[2]*.55);curve.push(tip);if(i%20===10)safeArrow(project(x,0,0),tip,colors[key]+'99')}
   line(c,curve,colors[key],2);
  }
 }
 // A polarizer is a plane transverse to propagation, with its transmission axis.
 q.stages.forEach((st,i)=>{
  const x=pos[i],a=P.rad(st.angle),ring=Array.from({length:65},(_,j)=>{const u=j/64*2*Math.PI;return project(x,.95*Math.cos(u),.95*Math.sin(u))});
  c.beginPath();ring.forEach((v,j)=>j?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle='#FF4E2922';c.fill();c.strokeStyle='#EEAA94';c.lineWidth=1.5;c.stroke();
  line(c,[project(x,-.87*Math.cos(a),-.87*Math.sin(a)),project(x,.87*Math.cos(a),.87*Math.sin(a))],'#FFE7DF',2.5);
  const pt=project(x,-1.2,0);text(c,`${i+1}: ${st.angle}°`,pt[0]-18,pt[1]+8,'#fff',11);
 });
 const name={linear:'лінійне',circular:'колове',elliptical:'еліптичне',unpolarized:'неполяризоване'}[p.input];
 text(c,`3D · вхід: ${water?(detail?'світло від підводної деталі':'лише відблиск від води'):name}`,18,48);
 text(c,`Після фільтрів: ${fmt(100*q.intensity/Math.max(q.stokes[0],1e-30),3)} % світла перед ними`,18,69);text(c,water?(detail?'Цей потік у моделі неполяризований.':'Світло від риби тут не показано.'):'Один масштаб поля до й після фільтрів.',18,90);text(c,water?'0°: вісь p · 90°: вісь s':'Поле E визначає напрям поляризації.',18,111);
 if(q.intensity<1e-14)text(c,water?'Ця складова повністю погашена':'Після фільтрів: світло не проходить',18,h-65);
 else text(c,q.intensity/q.stokes[0]<.005?'Після фільтрів дуже слабке поле · дивись відсоток':'Стрілка осі показує напрям поширення →',18,h-65);
 line(c,[[18,h-45],[36,h-45]],colors.E,3);text(c,'E',43,h-41);
 line(c,[[82,h-45],[100,h-45]],colors.cB,3);text(c,'cB',107,h-41);
 text(c,'E ⟂ B; обидва поперек поширення. cB — масштаб для B.',18,h-17,'#fff',10);
}

function drawPrism(c,w,h,p){
 if(p.prismView==='entry'||p.prismView==='exit'){drawPrismBoundary(c,w,h,p);return}
 const q=P.prism(550,p.material,p.prismAngle,p.apex),A=P.rad(q.apex),S=Math.tan(A/2),entry=q.entry,dir=a=>[Math.cos(a),Math.sin(a)],add=(v,d,n)=>[v[0]+d[0]*n,v[1]+d[1]*n];
 const rays=Array.from({length:31},(_,i)=>P.prism(400+i*10,p.material,p.prismAngle,p.apex));
 const incoming=add(entry,dir(q.inputDirection),-1.15),vertices=[[0,-1],[-S,0],[S,0],[0,-1]];
 const points=[...vertices,incoming,...rays.flatMap(r=>[r.exit,add(r.exit,dir(r.tir?2*(-A/2)+Math.PI-r.insideDirection:r.outputDirection),r.tir?.22:1.3)])];
 const minX=Math.min(...points.map(v=>v[0]))-.1,maxX=Math.max(...points.map(v=>v[0]))+.1,minY=Math.min(...points.map(v=>v[1]))-.15,maxY=Math.max(...points.map(v=>v[1]))+.15;
 const scale=Math.min((w-44)/(maxX-minX),(h-155)/(maxY-minY))*(p.prismZoom||1),x0=w/2-(minX+maxX)/2*scale,y0=(h+30)/2-(minY+maxY)/2*scale;
 const at=v=>[x0+v[0]*scale+(p.panX||0)*w,y0+v[1]*scale+(p.panY||0)*h];
 c.save();c.beginPath();c.rect(10,88,w-20,h-150);c.clip();
 line(c,vertices.map(at),'#EEAA94',2);arrow(c,...at(incoming),...at(entry),'#fff');
 for(const r of rays){let end=add(r.exit,dir(r.tir?2*(-A/2)+Math.PI-r.insideDirection:r.outputDirection),r.tir?.22:1.3);line(c,[entry,r.exit,end].map(at),P.colour(400+rays.indexOf(r)*10),1.2)}

 c.setLineDash([4,4]);for(const [v,a]of [[entry,A/2],[q.exit,-A/2]])line(c,[add(v,dir(a),-.3),add(v,dir(a),.32)].map(at),'#ffffff99');c.setLineDash([]);
 // Mark the incident angle from the outward normal to the incoming ray.
 const ep=at(entry);c.beginPath();c.arc(...ep,Math.min(24,scale*.2),A/2+Math.PI,q.inputDirection+Math.PI,true);c.strokeStyle='#fff';c.lineWidth=1;c.stroke();
 c.restore();if((p.prismZoom||1)===1)text(c,'i',ep[0]-25,ep[1]-12);const nn1=at(add(entry,dir(A/2),-.3)),nn2=at(add(q.exit,dir(-A/2),.32));if((p.prismZoom||1)===1){text(c,'N₁',nn1[0]-8,nn1[1]-7);text(c,'N₂',nn2[0]+4,nn2[1]-6);}text(c,`i = ${q.incidence}° · A = ${q.apex}° · білий промінь`,18,48);
 text(c,`Геометричний вид · масштаб ${fmt(p.prismZoom||1,1)}×`,18,69);
 text(c,q.tir?'Друга грань: повне внутрішнє відбиття':`e = ${fmt(q.emergence,1)}° · δ = ${fmt(q.deviation,2)}°`,18,h-53);
 const b=rays[0],r=rays.at(-1),span=Math.abs(b.deviation-r.deviation);
 if(Number.isFinite(span)&&span>1e-8){const x=18,y=h-35,W=w-36;for(let j=0;j<100;j++){let d=P.prism(400+j*3,p.material,p.prismAngle,p.apex).deviation,d2=P.prism(403+j*3,p.material,p.prismAngle,p.apex).deviation,l=(b.deviation-d)/span*W,l2=(b.deviation-d2)/span*W;c.fillStyle=P.colour(400+j*3);c.fillRect(x+l,y,Math.max(1,l2-l),6)}text(c,`400 → 700 нм · Δδ = ${fmt(span)}° · шкала збільшена`,18,h-13,'#fff',10)}
 else text(c,'Пунктир — нормалі до граней',18,h-16);
}

function drawPrismBoundary(c,w,h,p){
 const entryView=p.prismView==='entry',ref=P.prism(550,p.material,p.prismAngle,p.apex),b=P.prism(400,p.material,p.prismAngle,p.apex),r=P.prism(700,p.material,p.prismAngle,p.apex),zoom=Number(p.prismZoom||1),factor=20,cx=w*.46+(p.panX||0)*w,cy=h*.54+(p.panY||0)*h,normal=-.32,L=Math.min(w*.43,h*.32)*zoom;
 const dir=a=>[Math.cos(a),Math.sin(a)],point=(a,len)=>[cx+Math.cos(a)*len,cy+Math.sin(a)*len],incoming=entryView?-P.rad(ref.incidence):P.rad(ref.r2),outref=entryView?-P.rad(ref.r1):ref.tir?null:P.rad(ref.emergence),exitBase=ref.emergence??Array.from({length:31},(_,i)=>P.prism(400+i*10,p.material,p.prismAngle,p.apex)).find(q=>!q.tir)?.emergence??0;
 c.save();c.beginPath();c.rect(10,88,w-20,h-150);c.clip();
 const tangent=normal+Math.PI/2;line(c,[point(tangent,-h*2),point(tangent,h*2)],'#EEAA94',2);
 c.setLineDash([4,5]);line(c,[point(normal,-w*2),point(normal,w*2)],'#ffffff99');c.setLineDash([]);
 // Entry has one white ray; at exit each wavelength has its own internal incidence.
 if(entryView)arrow(c,...point(normal+incoming,-L),cx,cy,'#fff');
 for(let nm=400;nm<=700;nm+=10){const q=P.prism(nm,p.material,p.prismAngle,p.apex),col=P.colour(nm);if(!entryView){const a=normal+P.rad(ref.r2)+factor*P.rad(q.r2-ref.r2);line(c,[point(a,-L),[cx,cy]],col,1.2)}
  if(!q.tir||entryView){const out=entryView?normal-P.rad(ref.r1)-factor*P.rad(q.r1-ref.r1):normal+P.rad(exitBase)+factor*P.rad(q.emergence-exitBase);line(c,[[cx,cy],point(out,L)],col,1.3)}else{const inc=normal+P.rad(ref.r2)+factor*P.rad(q.r2-ref.r2),a=2*normal+Math.PI-inc;line(c,[[cx,cy],point(a,L*.65)],col,1.2)}
 }
 c.restore();
 text(c,entryView?'Вхід: повітря → призма':'Вихід: призма → повітря',18,48);text(c,'Пунктир — нормаль; суцільна — грань',18,h-73,'#fff',10);
 text(c,`Різниця напрямів ×20 · масштаб ${fmt(zoom,1)}×`,18,69);
 text(c,entryView?`r₁: 400 нм ${fmt(b.r1,2)}°; 700 нм ${fmt(r.r1,2)}°`:(b.tir||r.tir?'Є повне внутрішнє відбиття':`e: 400 нм ${fmt(b.emergence,2)}°; 700 нм ${fmt(r.emergence,2)}°`),18,h-52);
 text(c,entryView?'Кольори розходяться вже на першій грані.':'Кожен колір заломлюється повторно.',18,h-32);
 text(c,'Числові кути — без візуального підсилення.',18,h-12,'#fff',10);
}

export function atomEvent(p,t){const q=P.atom(p),emission=p.kind==='emission',event=1,done=5;return {...q,emission,changed:t>=event,level:t>=event?(emission?q.lower:q.upper):(emission?q.upper:q.lower),progress:emission?P.clamp((t-event)/(done-event),0,1):P.clamp(t/event,0,1),showPhoton:emission?t>=event:t<event,complete:t>=done,visible:q.lambda>=380&&q.lambda<=780};}
function drawAtomTransition(c,w,h,p,t){
 const q=atomEvent(p,t),left=w*.12,right=w*.43,base=h-92,top=92,Y=n=>q.tabled?(n===2?top:base):base-(1-1/n**2)*(base-top),x=left+18,from=q.emission?q.upper:q.lower,to=q.emission?q.lower:q.upper;
 for(let n=1;n<=(q.tabled?2:10);n++){const y=Y(n);line(c,[[left,y],[right,y]],n===q.upper||n===q.lower?'#FFD1C3':'#956E60',n===q.upper||n===q.lower?2:1)}
 text(c,q.tabled?'Нижній стан':'n = 1',left-5,base+17);
 if(!q.changed)arrow(c,right-10,Y(from),right-10,Y(to),'#FFD1C3');
 dot(c,x,Y(q.level),6,'#FF4E29');
 text(c,q.tabled?`${q.species.name} · ${q.species.symbol}`:'Гідроген (водень) · H I',18,48);
 text(c,q.tabled?(q.changed?'Кінцевий стан атома':q.emission?'Підготовлений збуджений атом':'Підготовлений нижній стан'):`Електрон: n = ${q.level} · ${q.level===1?'основний стан':'збуджений стан'}`,18,68);
 const tx=w*.5; text(c,`ΔE = ${fmt(q.de,3)} еВ`,tx,96);text(c,`λ = ${fmt(q.lambda,1)} нм`,tx,116);
 text(c,q.visible?'Видиме світло':q.lambda<380?'Ультрафіолет':'Інфрачервоне',tx,136);
 const source=[right+8,h*.65],target=[w*.85,h*.65],v=q.emission?q.progress:1-q.progress,px=source[0]+(target[0]-source[0])*v,py=source[1]+(target[1]-source[1])*v,color=q.visible?P.colour(q.lambda):'#FFD1C3',spacing=q.visible?22*q.lambda/550:22;
 if(q.showPhoton){let packet=[];for(let i=0;i<=100;i++){let z=(i/100-.5)*Math.min(70,w*.22),amp=10*Math.exp(-z*z/500);packet.push([px+z,py+amp*Math.sin(2*Math.PI*z/spacing)])}line(c,packet,color,3);if(v>.5){const yy=py-24;line(c,[[px-spacing/2,yy],[px+spacing/2,yy]],color,1);line(c,[[px-spacing/2,yy-3],[px-spacing/2,yy+3]],color);line(c,[[px+spacing/2,yy-3],[px+spacing/2,yy+3]],color)}}
 text(c,q.emission?(q.changed?'Фотон випромінено':'Фотон з’явиться під час переходу'):(q.changed?'Фотон поглинуто':'Фотон наближається до атома'),18,h-49);
 text(c,q.visible?'Колір і крок хвильки відповідають λ.':'Невидимий діапазон: колір і хвилька умовні.',18,h-29,'#fff',10);
 text(c,'Хвилька — умовне позначення фотона.',18,h-10,'#fff',10);
}

function drawMolecularLevels(c,w,h,p,t){
 const q=P.molecule(p),small=w<450,ox=22,ow=small?w-44:w*.31,ot=100,ob=small?250:h-88,dx=small?22:w*.43,dy=small?300:100,dw=small?w-44:w*.53,dh=small?h-375:h-175,emission=p.transition!=='electronic',fluor=p.transition==='fluorescence',event=fluor?3:1.5,after=t>=event;
 text(c,'Загальна схема → збільшена ділянка',18,48);
 text(c,emission?'Випромінювання фотона':'Поглинання фотона',18,69);
 // Overview: groups are schematic, with magnification chosen by transition type.
 const high=ot+25,low=ob-25;
 for(const y of [high,low])for(let v=0;v<3;v++){let yy=y-v*8;line(c,[[ox+12,yy],[ox+ow-12,yy]],'#C56D51',1);for(let j=0;j<4;j++)line(c,[[ox+ow*.52,yy-j*1.6],[ox+ow-12,yy-j*1.6]],'#FF8F73',.7)}
 const focusY=p.transition==='rotation'?low-4:p.transition==='vibration'?low-12:(high+low)/2,rx=p.transition==='rotation'?ow*.21:ow*.43,ry=p.transition==='rotation'?16:p.transition==='vibration'?30:(low-high)/2+16,fx=ox+ow*(p.transition==='rotation'?.62:.5);
 c.beginPath();c.ellipse(fx,focusY,rx,ry,0,0,Math.PI*2);c.strokeStyle='#FFD1C3';c.lineWidth=2;c.stroke();
 c.setLineDash([3,4]);line(c,[[fx+rx,focusY],[dx,dy+30]],'#E2C4B9');c.setLineDash([]);
 text(c,'Групи енергетичних рівнів',ox,ob+2,'#fff',10);
 c.strokeStyle='#6E4A3E';c.lineWidth=1;c.strokeRect(dx,dy,dw,dh);
 text(c,'Збільшено · масштаби умовні',dx+10,dy+22,'#fff',10);
 const x1=dx+15,x2=dx+dw*.56,top=dy+65,bottom=dy+dh-38,x=dx+dw*.28;
 line(c,[[x1,top],[x2,top]],'#FFD1C3',2);line(c,[[x1,bottom],[x2,bottom]],'#FFD1C3',2);
 let startLabel,endLabel;
 if(p.transition==='rotation'){startLabel=`J = ${p.J}`;endLabel=`J = ${Math.max(0,p.J-1)}`}
 else if(p.transition==='vibration'){startLabel=`v = 1; J = ${p.J}`;endLabel=`v = 0; J = ${Math.max(0,p.J-1)}`}
 else if(fluor){startLabel='3,10 еВ';endLabel='0 еВ'}
 else{startLabel=`v = ${p.v}; J = ${p.J}`;endLabel=`v = 0; J = ${p.J-1}`}
 text(c,startLabel,x1,top-9,'#fff',11);text(c,endLabel,x1,bottom+20,'#fff',11);
 let finalY=emission?bottom:top,startY=emission?top:bottom;
 if(fluor){const middle=top+(bottom-top)*.7/3.1;line(c,[[x1,middle],[x2,middle]],'#FFD1C3',2);arrow(c,x,top,x,middle,'#FF4E29');text(c,'−0,70 еВ',dx+dw*.60,top+14,'#fff',10);text(c,'оточенню',dx+dw*.60,top+31,'#fff',10);startY=middle;arrow(c,x1+3,bottom,x1+3,top,'#E2C4B9');text(c,'2,40 еВ',x2+8,middle+10,'#fff',10)}
 arrow(c,x,startY,x,finalY,'#FF4E29');dot(c,x+(fluor?8:0),fluor?(t<1?bottom:t<2?top:t<3?startY:bottom):(after?finalY:startY),5,'#FF4E29');
 // A packet is an illustrative photon glyph, not an electron trajectory.
 const show=emission?t>=event:t<event,progress=emission?P.clamp((t-event)/2.5,0,1):1-P.clamp(t/event,0,1),px=x2+12+progress*(dw*.34-20),py=(startY+finalY)/2+22,visible=q.lambda>=380&&q.lambda<=780,col=visible?P.colour(q.lambda):'#FFD1C3',spacing=visible?20*q.lambda/550:18;
 if(show){let packet=[];for(let i=0;i<=80;i++){let z=(i/80-.5)*Math.min(58,dw*.3);packet.push([px+z,py+9*Math.exp(-z*z/350)*Math.sin(2*Math.PI*z/spacing)])}line(c,packet,col,2.5)}
 text(c,`ΔE = ${fmt(emission?q.outE:q.inE,5)} еВ · λ = ${fmt(q.lambda,1)} нм`,18,h-51,'#fff',11);
 text(c,`${photonBand(q.lambda)}${visible?'':' · колір умовний'}`,18,h-31,'#fff',11);
 text(c,after?(emission?'Кінцевий стан · фотон випромінено':'Кінцевий стан · фотон поглинуто'):'Початковий стан · перехід показано стрілкою',18,h-11,'#fff',10);
}

function drawInterference(c,w,h,p,t,photons){
 const wave=p.mode==='wave',left=22,right=w-22,W=right-left,col=P.colour(p.lambda),wall=w*.34,screen=w*.87,center=108,sep=12+12*p.d;
 text(c,'1. Установка · вигляд зверху, не в масштабі',18,48,'#fff',11);
 dot(c,w*.12,center,6,'#fff');arrow(c,w*.15,center,wall-12,center,'#fff');
 for(const [a,b]of [[70,center-sep-4],[center-sep+4,center+sep-4],[center+sep+4,150]])line(c,[[wall,a],[wall,b]],'#EEAA94',4);
 line(c,[[screen,68],[screen,151]],'#FFD1C3',4);
 text(c,'Джерело',18,173);text(c,'Дві щілини',wall-24,173);text(c,'Екран',screen-25,173);
 if(wave&&!p.path){c.save();c.beginPath();c.rect(wall+4,66,screen-wall-8,88);c.clip();for(let i=0;i<14;i++)for(const y of[center-sep,center+sep]){const r=(i*18*p.lambda/550+t*25)%(W*.65);c.beginPath();c.arc(wall,y,r,-Math.PI/2,Math.PI/2);c.strokeStyle=col;c.globalAlpha=.33;c.stroke()}c.restore();}
 if(!wave)text(c,'Шлях окремого фотона не намальовано.',18,196,'#fff',11);
 else text(c,p.path?'Без узгодженої фази: дрібні смуги зникають.':'Хвильові внески додаються на екрані.',18,196,'#fff',11);
 const y=244,H=h-440,X=x=>left+(x/.015+1)*W/2;
 text(c,wave?'2. Екран спереду · розрахована інтенсивність':`2. Екран спереду · ${photons.length.toLocaleString('uk-UA')} попадань`,18,225,'#fff',11);
 c.fillStyle='#080B0D';c.fillRect(left,y,W,H);
 if(wave||p.prediction){for(let i=0;i<Math.ceil(W);i++){const x=(i/W*2-1)*.015,v=P.fringe(x,p);c.fillStyle=col;c.globalAlpha=wave?v**.65:.16*v;c.fillRect(left+i,y,1.2,H)}c.globalAlpha=1;}
 c.save();c.beginPath();c.rect(left,y,W,H);c.clip();
 if(!wave){for(const q of photons)dot(c,X(q.x),y+5+q.jitter*(H-10),w<450?1.15:1.25,col);if(photons.length){const q=photons.at(-1);c.strokeStyle='#fff';c.lineWidth=1;c.beginPath();c.arc(X(q.x),y+5+q.jitter*(H-10),4,0,Math.PI*2);c.stroke();}}
 c.restore();c.strokeStyle='#6E4A3E';c.strokeRect(left,y,W,H);
 for(const x of [-15,-10,-5,0,5,10,15]){const px=X(x/1000);line(c,[[px,y+H],[px,y+H+4]],'#fff');text(c,String(x),px-(x===-15?0:x===15?16:6),y+H+19,'#fff',10)}
 text(c,'x, мм',w-55,y+H+38,'#fff',10);
 if(!wave&&photons.length===0)text(c,'Натисни «+1» або запусти накопичення.',left+8,y+H*.52,'#fff',11);
 const bins=60,counts=new Array(bins).fill(0);for(const q of photons)counts[Math.min(bins-1,Math.max(0,Math.floor((q.x/.015+1)*bins/2)))]++;
 const total=Array.from({length:bins*8},(_,i)=>P.fringe(-.015+(i+.5)*.03/(bins*8),p)).reduce((a,b)=>a+b,0),expected=counts.map((_,i)=>{let sum=0;for(let j=0;j<8;j++)sum+=P.fringe(-.015+(i*8+j+.5)*.03/(bins*8),p);return wave?sum/8:photons.length*sum/total;});
 const hy=h-83,HH=48,max=wave?1:Math.max(1,...counts,...(p.prediction?expected:[]));
 text(c,wave?'3. Розрахований профіль яскравості':'3. Події в смужках по 0,5 мм',18,h-142,'#fff',11);
 if(wave||p.prediction){line(c,expected.map((v,i)=>[left+(i+.5)*W/bins,hy-v/max*HH]),'#FFD1C3',1.5);}
 if(!wave){for(let i=0;i<bins;i++){c.fillStyle=col;c.fillRect(left+i*W/bins,hy-counts[i]/max*HH,Math.max(1,W/bins-1),counts[i]/max*HH);}text(c,`Найвищий стовпчик: ${Math.max(0,...counts)}`,18,h-41,'#fff',10);}
 line(c,[[left,hy],[right,hy]],'#6E4A3E');
 text(c,wave?'Це прогноз для багатьох реєстрацій.':p.prediction?'Точки й стовпчики — події; світла лінія — прогноз.':'Одна точка — одна подія. Смуги виникають поступово.',18,h-16,'#fff',10);
}

function drawMarsSky(c,w,h,p){
 const sunset=p.marsTime==='sunset',top=64,bottom=h-80,sy=sunset?bottom-22:top+70,sx=w*.48;
 // Observational teaching illustration only. These colours are not a radiative-transfer calculation.
 const bg=c.createLinearGradient(0,top,0,bottom);bg.addColorStop(0,sunset?'#776c69':'#a97951');bg.addColorStop(1,sunset?'#c68c60':'#d4a774');c.fillStyle=bg;c.fillRect(0,top,w,bottom-top+12);
 if(sunset){const r=Math.min(w*.39,(bottom-top)*.8),halo=c.createRadialGradient(sx,sy,3,sx,sy,r);halo.addColorStop(0,'rgba(148,191,229,.98)');halo.addColorStop(.36,'rgba(126,172,215,.9)');halo.addColorStop(1,'rgba(126,172,215,0)');c.fillStyle=halo;c.fillRect(0,top,w,bottom-top);}
 dot(c,sx,sy,sunset?10:14,'#fff3dc');c.fillStyle='#704a35';c.beginPath();c.moveTo(0,bottom);c.quadraticCurveTo(w*.35,bottom-20,w*.7,bottom+3);c.lineTo(w,bottom-6);c.lineTo(w,h);c.lineTo(0,h);c.fill();
 text(c,'Марс · '+(sunset?'захід Сонця':'день'),18,46,'#fff',14);
 text(c,sunset?'Блакитне сяйво біля Сонця':'Пил надає небу рудого відтінку',18,h-49,'#fff',12);
 text(c,'Кольори умовні · пояснювальна схема',18,h-23,'#fff',11);
}

function drawAtmosphere(c,w,h,p){
 const top=48,horizon=h-56,span=horizon-top,viewWidth=200,center=0,maxElev=90;
 const X=a=>(a-center+viewWidth/2)/viewWidth*w,Y=e=>horizon-e/maxElev*span;
 const solved=getTransfer(p);if(!solved)return;
 const display=skyDisplay(solved,p);
 const off=document.createElement('canvas');off.width=Math.min(700,Math.round(w));off.height=Math.min(350,Math.round(horizon-top));const ctx=off.getContext('2d'),im=ctx.createImageData(off.width,off.height);
 for(let y=0;y<off.height;y++)for(let x=0;x<off.width;x++){const e=(horizon-(top+(y+.5)/off.height*(horizon-top)))/span*maxElev,a=center-viewWidth/2+(x+.5)/off.width*viewWidth,rgb=display(sampleSkyRGB(solved,p,e,a)),j=(y*off.width+x)*4;for(let k=0;k<3;k++)im.data[j+k]=rgb[k];im.data[j+3]=255;}
 ctx.putImageData(im,0,0);c.drawImage(off,0,top,w,horizon-top);
 // A stationary horizon and ground give an observer's frame of reference.
 c.fillStyle='#382C24';c.fillRect(0,horizon,w,h-horizon);line(c,[[0,horizon],[w,horizon]],'#D8C0A6',1);
 c.setLineDash([3,5]);line(c,Array.from({length:91},(_,i)=>{const q=dayPosition(i*2,p.latitude);return [X(q.sunAz),Y(q.sun)]}),'#ffffff66',1);c.setLineDash([]);
 const q=selectedSky(p);c.save();c.beginPath();c.rect(0,top,w,horizon-top);c.clip();dot(c,X(p.sunAz||0),Y(p.sun),Math.max(2,w*.266/viewWidth),'rgb('+display(skyLinearRGB(q.direct).map(x=>x/6.8e-5)).join(',')+')');c.restore();let x=X(p.azimuth+(p.sunAz||0)),y=Y(p.view);if(x>=0&&x<=w){c.strokeStyle='white';c.lineWidth=1.5;c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.stroke()}
 text(c,'Панорама 200° · камера на поверхні',12,30,'#fff',w<450?9:11);for(const [a,label]of[[-90,'Схід'],[0,'Південь'],[90,'Захід']])if(X(a)>0&&X(a)<w)text(c,label,Math.max(10,X(a)-15),horizon+17,'#fff',10);text(c,'Пунктир — денна дуга · коло — напрям спектра',12,h-10,'#fff',w<450?8:10);
}

export function drawSunCloseup(canvas,p){
 const {c,w,h}=setup(canvas),q=getTransfer(p);if(!q)return;const display=skyDisplay(q,p),fov=Number(p.sunFov||20),aspect=w/h;
 const off=document.createElement('canvas');off.width=Math.min(600,Math.round(w));off.height=Math.min(500,Math.round(h));const ctx=off.getContext('2d'),im=ctx.createImageData(off.width,off.height);
 for(let y=0;y<off.height;y++)for(let x=0;x<off.width;x++){const ray=sunCameraRay(p,(x+.5)/off.width,(y+.5)/off.height,fov,aspect),rgb=ray.elevation<0?[56,44,36]:display(sampleSkyRGB(q,p,ray.elevation,ray.azimuth)),j=(y*off.width+x)*4;for(let k=0;k<3;k++)im.data[j+k]=rgb[k];im.data[j+3]=255;}
 ctx.putImageData(im,0,0);c.drawImage(off,0,0,w,h);
 const solar=display(skyLinearRGB(q.direct).map(x=>x/6.8e-5)),radius=Math.max(1.2,w/2*Math.tan(.266*Math.PI/180)/Math.tan(fov*Math.PI/360));
 // At the geometric horizon only the upper half of the solar disk is visible.
 c.save();c.beginPath();c.rect(0,0,w,p.sun===0?h/2:h);c.clip();dot(c,w/2,h/2,radius,'rgb('+solar.join(',')+')');c.restore();
 c.fillStyle='#181513bb';c.fillRect(8,8,Math.min(w-16,255),26);c.fillStyle='white';c.font='11px NAMU, sans-serif';c.fillText('У напрямку Сонця · поле '+fov+'°',15,26);
 canvas.dataset.solarCenter='0.5,0.5';canvas.dataset.exposure='shared-with-panorama';
}
