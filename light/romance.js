import {dictionaries,theories,models} from './romance-data.js?v=audit2';
import {exps} from './english-content.js?v=audit2';
export function installLanguage(language){
 const dictionary={...dictionaries[language]};
 for(const e of exps){const m=models[language][e.id];dictionary[e.note]=m.note;dictionary[e.observe]=m.task;dictionary[e.task]=m.task;dictionary[e.limit]=m.note;
 const equations=e.theory.flatMap(([,body])=>[...body.matchAll(/<div class="formula">[\s\S]*?<\/div>/g)].map(m=>m[0].replace(/(\d)\.(?=\d)/g,'$1,')));
 const references=e.theory.filter(([title])=>title==='Research references');
 e.theory=[...theories[language][e.id],...(equations.length?[[language==='it'?'Equazioni':'Ecuaciones',equations.join('').replaceAll('<sub>in</sub>',language==='it'?'<sub>ing</sub>':'<sub>ent</sub>')]]:[]),...references];}
 const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const keys=Object.keys(dictionary).sort((a,b)=>b.length-a.length);
 const pattern=new RegExp('(?<![A-Za-z])(?:'+keys.map(escaped).join('|')+')(?![A-Za-z])','g');
 const translate=value=>String(value).replace(pattern,m=>dictionary[m]);
 const originals=new WeakMap();
 const translateText=node=>{if(['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentElement?.tagName)||node.parentElement?.closest('[data-brand-managed],[data-inscience-home]')||/^https?:\/\//.test(node.nodeValue.trim()))return;const current=node.nodeValue,previous=originals.get(node);const source=previous&&current===previous.result?previous.source:current;const result=translate(source);originals.set(node,{source,result});if(result!==current)node.nodeValue=result;};
 const localise=root=>{if(root.nodeType===Node.TEXT_NODE){translateText(root);return;}if(root.nodeType!==Node.ELEMENT_NODE&&root!==document)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())translateText(n);const elements=[...(root.querySelectorAll?.('[aria-label],[title],[placeholder]')||[])];if(root.matches?.('[aria-label],[title],[placeholder]'))elements.push(root);for(const el of elements)for(const attr of ['aria-label','title','placeholder'])if(el.hasAttribute(attr)){const s=el.getAttribute(attr),t=translate(s);if(t!==s)el.setAttribute(attr,t);}};
 localise(document);
 const observer=new MutationObserver(changes=>{for(const change of changes){if(change.type==='characterData')translateText(change.target);else if(change.type==='attributes')localise(change.target);else for(const node of change.addedNodes)localise(node);}});
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
 for(const name of ['fillText','strokeText','measureText']){const original=CanvasRenderingContext2D.prototype[name];CanvasRenderingContext2D.prototype[name]=function(text,...args){return original.call(this,translate(text),...args);};}
 for(const el of document.querySelectorAll('meta[name=description],meta[property="og:description"]'))el.content=language==='it'?'Dieci esperimenti interattivi sulla luce: onde e fotoni, interferenza, diffrazione, polarizzazione, spettri atomici e molecolari, colori del cielo e delle stelle.':'Diez experimentos interactivos sobre la luz: ondas y fotones, interferencia, difracción, polarización, espectros atómicos y moleculares, colores del cielo y las estrellas.';
 document.querySelector('meta[property="og:title"]').content=translate(document.title);
 window.lightExportText=translate;
 const confirm=window.confirm.bind(window);window.confirm=text=>confirm(translate(text));
 return translate;
}
