const language=new URLSearchParams(location.search).get('lang')==='en'?'en':'uk';
document.documentElement.lang=language;
for(const button of document.querySelectorAll('[data-light-language]')){button.setAttribute('aria-pressed',String(button.dataset.lightLanguage===language));button.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('lang',button.dataset.lightLanguage);location.assign(url);});}
if(language==='en'){
 const {english}=await import('./english-labels.js');
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){if(!['SCRIPT','STYLE'].includes(node.parentElement?.tagName))node.nodeValue=english(node.nodeValue);}
 for(const el of document.querySelectorAll('[aria-label]'))el.setAttribute('aria-label',english(el.getAttribute('aria-label')));
 document.title='Light — INSCIENCE LAB';
 for(const el of document.querySelectorAll('meta[name=description],meta[property="og:description"]'))el.content='Explore light with ten interactive experiments: waves and photons, interference, diffraction, polarisation, atomic and molecular spectra, planetary skies and stellar colours.';
 document.querySelector('meta[property="og:title"]').content=document.title;
 document.querySelector('meta[property="og:locale"]').content='en_GB';
 for(const a of document.querySelectorAll('.lab-network a[href]')){const url=new URL(a.href);url.searchParams.set('lang','en');a.href=url;}
}
document.querySelector('link[rel=canonical]').href='https://inscience-lab.github.io/light/?lang='+language;
await import(language==='en'?'./app-en.js?v=en1':'./app.js?v=fonts1');
