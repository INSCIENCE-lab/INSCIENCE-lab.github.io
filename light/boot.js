async function start(){
const requested=new URLSearchParams(location.search).get('lang');
const language=['uk','en','it','es'].includes(requested)?requested:'uk';
document.documentElement.lang=language;
document.querySelector('[data-light-language]')?.parentElement.setAttribute('aria-label',({uk:'Мова',en:'Language',it:'Lingua',es:'Idioma'})[language]);
const loading=document.getElementById('lightLoading');if(loading)loading.textContent={uk:'Завантажуємо досліди…',en:'Loading experiments…',it:'Caricamento degli esperimenti…',es:'Cargando los experimentos…'}[language];
for(const button of document.querySelectorAll('[data-light-language]')){button.setAttribute('aria-pressed',String(button.dataset.lightLanguage===language));button.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('lang',button.dataset.lightLanguage);location.assign(url);});}
if(language!=='uk'){
 const {english}=await import('./english-labels.js?v=audit2');
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){if(!['SCRIPT','STYLE'].includes(node.parentElement?.tagName))node.nodeValue=english(node.nodeValue);}
 for(const el of document.querySelectorAll('[aria-label]'))el.setAttribute('aria-label',english(el.getAttribute('aria-label')));
 document.title='Light — INSCIENCE LAB';
 for(const el of document.querySelectorAll('meta[name=description],meta[property="og:description"]'))el.content='Explore light with ten interactive experiments: waves and photons, interference, diffraction, polarisation, atomic and molecular spectra, planetary skies and stellar colours.';
 document.querySelector('meta[property="og:title"]').content=document.title;
 document.querySelector('meta[property="og:locale"]').content={en:'en_GB',it:'it_IT',es:'es_ES'}[language];
 for(const a of document.querySelectorAll('.inscience-network a[href]')){const url=new URL(a.href);url.searchParams.set('lang',language);a.href=url;}
}
document.querySelector('link[rel=canonical]').href='https://inscience-lab.github.io/light/?lang='+language;
if(language==='it'||language==='es'){const {installLanguage}=await import('./romance.js?v=audit2');installLanguage(language);}
await import(language!=='uk'?'./app-en.js?v=audit2':'./app.js?v=audit2');

document.getElementById('lightLoading')?.remove();
}
start().catch(error=>{console.error('Light Lab startup failed',error);const lang=new URLSearchParams(location.search).get('lang')||'uk';const box=document.getElementById('lightLoading');if(!box)return;box.textContent=({uk:'Не вдалося завантажити досліди. Перевір з’єднання.',en:'Experiments could not load. Check your connection.',it:'Impossibile caricare gli esperimenti. Controlla la connessione.',es:'No se pudieron cargar los experimentos. Comprueba la conexión.'})[lang];const button=document.createElement('button');button.textContent=({uk:'Повторити',en:'Retry',it:'Riprova',es:'Reintentar'})[lang];button.onclick=()=>location.reload();box.append(document.createElement('br'),button);});
