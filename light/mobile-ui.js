// DOM text stays legible at every canvas size and device pixel ratio.
const copy={
 uk:{loading:'Обчислюю світло в атмосфері…',old:'Показано попередній результат. Нова сцена та значення ще обчислюються.',first:'Перша сцена ще обчислюється. Можна читати пояснення нижче.',zoom:'Масштаб зображення',open:'Розгорнути сцену',close:'Згорнути сцену',reset:'Початковий масштаб',hint:'Збільшену сцену можна гортати пальцем. У режимі призми перетягуй саму призму.',manual:'Обери положення зорі повзунком і дочекайся розрахунку. Панорама нерухома.'},
 en:{loading:'Calculating light in the atmosphere…',old:'The previous result is shown. The new scene and values are still being calculated.',first:'The first scene is being calculated. You can read the explanation below.',zoom:'Image scale',open:'Expand scene',close:'Collapse scene',reset:'Reset scale',hint:'Swipe to explore the enlarged scene. In prism mode, drag the prism itself.',manual:'Choose the stellar position with the slider, then wait for the calculation. The panorama is fixed.'},
 it:{loading:'Calcolo della luce nell’atmosfera…',old:'È visualizzato il risultato precedente. Il calcolo della nuova scena e dei valori è ancora in corso.',first:'Calcolo della prima scena in corso. Puoi leggere la spiegazione qui sotto.',zoom:'Scala dell’immagine',open:'Espandi la scena',close:'Riduci la scena',reset:'Ripristina la scala',hint:'Scorri per esplorare la scena ingrandita. Nella modalità prisma, trascina il prisma stesso.',manual:'Scegli la posizione della stella con il cursore e attendi il calcolo. Il panorama è fisso.'},
 es:{loading:'Calculando la luz en la atmósfera…',old:'Se muestra el resultado anterior. El cálculo de la nueva escena y de los valores sigue en curso.',first:'Se está calculando la primera escena. Puedes leer la explicación más abajo.',zoom:'Escala de la imagen',open:'Ampliar la escena',close:'Reducir la escena',reset:'Restablecer la escala',hint:'Desliza para explorar la escena ampliada. En el modo prisma, arrastra el propio prisma.',manual:'Elige la posición de la estrella con el control deslizante y espera al cálculo. El panorama permanece fijo.'}
};
const words=()=>copy[document.documentElement.lang]||copy.uk;
export const skyManualNote=()=>words().manual;
let resizeObserver,classObserver;
export function setSkyPending(pending,message){
 const grid=document.querySelector('.skyViewportGrid');if(!grid)return;
 let notice=document.getElementById('skyComputeNotice');
 if(!notice){notice=document.createElement('div');notice.id='skyComputeNotice';notice.className='skyComputeNotice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');grid.before(notice);}
 const t=words();notice.hidden=!pending;
 if(message&&/Не вдалося|Помилка|could not|error/i.test(message)){notice.textContent=message;document.getElementById('status').textContent=message;grid.setAttribute('aria-busy','false');return;}grid.setAttribute('aria-busy',String(pending));
 if(pending){
  const hasResult=grid.dataset.ready==='true';
  notice.textContent=t.loading+' '+(hasResult?t.old:t.first);
  document.getElementById('status').textContent=t.loading;
  grid.classList.toggle('skyPreviousResult',hasResult);
 }
}
export function markSkyReady(){const grid=document.querySelector('.skyViewportGrid');if(!grid)return;grid.dataset.ready='true';grid.classList.remove('skyPreviousResult');setSkyPending(false);}
export function installSceneTools(id){
 resizeObserver?.disconnect();classObserver?.disconnect();document.body.classList.remove('scene-is-expanded');
 const canvas=document.getElementById('scene');if(!canvas)return;
 const t=words(),sky=id==='sky';
 const content=sky?document.querySelector('.skyViewportGrid'):canvas;
 const workbench=document.createElement('div');workbench.className='sceneWorkbench';content.before(workbench);
 const toolbar=document.createElement('div');toolbar.className='sceneToolbar';
 const expand=document.createElement('button');expand.type='button';expand.textContent=t.open;expand.setAttribute('aria-expanded','false');toolbar.append(expand);workbench.append(toolbar);
 let viewport=content,scale=1,baseHeight=0;
 if(!sky){viewport=document.createElement('div');viewport.className='sceneViewport';viewport.tabIndex=0;viewport.setAttribute('aria-label',t.hint);viewport.append(canvas);}
 workbench.append(viewport);
 const redraw=()=>window.dispatchEvent(new Event('resize'));
 const collapse=()=>{workbench.classList.remove('is-expanded');document.body.classList.remove('scene-is-expanded');expand.textContent=t.open;expand.setAttribute('aria-expanded','false');redraw();};
 expand.onclick=()=>{if(workbench.classList.contains('is-expanded')){collapse();return;}workbench.classList.add('is-expanded');document.body.classList.add('scene-is-expanded');expand.textContent=t.close;expand.setAttribute('aria-expanded','true');expand.focus({preventScroll:true});redraw();};
 workbench.addEventListener('keydown',ev=>{if(ev.key==='Escape'){collapse();expand.focus({preventScroll:true});}});
 if(!sky){
  const label=document.createElement('label');label.className='sceneScale';label.textContent=t.zoom+' ';
  const slider=document.createElement('input');slider.type='range';slider.min='1';slider.max='3';slider.step='.25';slider.value='1';slider.setAttribute('aria-label',t.zoom);
  const out=document.createElement('output');out.textContent='1×';label.append(slider,out);toolbar.prepend(label);
  const reset=document.createElement('button');reset.type='button';reset.textContent=t.reset;toolbar.append(reset);
  const apply=()=>{const prism=canvas.classList.contains('pannable');label.hidden=prism;reset.hidden=prism;if(prism){scale=1;slider.value='1';}canvas.style.width=(scale*100)+'%';canvas.style.height='';baseHeight=canvas.getBoundingClientRect().height;if(scale!==1)canvas.style.height=(baseHeight*scale)+'px';out.textContent=scale+'×';requestAnimationFrame(redraw);};
  slider.oninput=()=>{scale=Number(slider.value);apply();};reset.onclick=()=>{scale=1;slider.value='1';apply();};
  resizeObserver=new ResizeObserver(()=>{if(canvas.isConnected)apply();else resizeObserver?.disconnect();});resizeObserver.observe(viewport);classObserver=new MutationObserver(apply);classObserver.observe(canvas,{attributes:true,attributeFilter:['class']});
 }
 if(sky){const note=document.getElementById('skyMotionNote');if(note)note.textContent=t.manual;}
}
