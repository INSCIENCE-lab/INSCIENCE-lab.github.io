import {installTransfer,transferKey,getTransfer} from './atmosphere.js';
let worker,timer,key='',serial=0;const scenes=new Map();
const sceneKey=p=>{let{view,azimuth,exposure,skyPlot,displayMode,dayPhase,skyView,sunFov,sunAz,...q}=p;return JSON.stringify(q)};
export function requestSky(p,done,status){
 const k=transferKey(p);if(getTransfer(p))return true;if(k===key){status('Розрахунок триває…');return false;}key=k;const id=++serial;clearTimeout(timer);worker?.terminate();status('Розраховую повторні розсіювання…');
 timer=setTimeout(()=>{worker=new Worker(new URL('./sky-worker.js',import.meta.url),{type:'module'});worker.onmessage=e=>{if(e.data.id!==serial)return;if(e.data.error){status('Не вдалося завершити розрахунок: '+e.data.error);key='';return}if(e.data.message){status(e.data.message);return}installTransfer(k,e.data.result);scenes.set(sceneKey(p),e.data.result);if(scenes.size>8)scenes.delete(scenes.keys().next().value);worker.terminate();worker=null;done()};worker.onerror=e=>{status('Помилка розрахунку: '+e.message);key=''};worker.postMessage({id,params:{...p},cached:scenes.get(sceneKey(p))||null})},180);return false;
}
