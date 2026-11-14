(() => {
'use strict';
const configNode=document.getElementById('site-config');
if(!configNode) return;
const config=JSON.parse(configNode.textContent);
const isDemo=document.documentElement.hasAttribute('data-demo');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const q=(selector,root=document)=>root.querySelector(selector);
const qa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const header=q('.site-header');
const toast=q('#toast');
let toastTimeout;
function notify(message){if(!toast)return;toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove('visible'),5200)}

// A prior manual choice always wins over country and browser-language detection.
qa('[data-language-control]').forEach(control=>{
 const trigger=q('.lang-trigger',control);
 trigger?.addEventListener('click',e=>{e.stopPropagation();control.classList.toggle('is-open');trigger.setAttribute('aria-expanded',String(control.classList.contains('is-open')))});
 qa('[data-locale]',control).forEach(button=>button.addEventListener('click',()=>{
   const lang=button.dataset.locale;
   if(!['fa','ar','en'].includes(lang))return;
   document.cookie='tmk_locale='+lang+'; Path=/; Max-Age=31536000; SameSite=Lax';
   try{localStorage.setItem('tmk_locale',lang)}catch(e){}
   if(isDemo){location.href=lang==='fa'?'index.html':'demo-'+lang+'.html';return}
   const path=location.pathname;
   const next=/^\/(fa|ar|en)(?=\/|$)/.test(path)?path.replace(/^\/(fa|ar|en)/,'/'+lang):'/'+lang+'/';
   location.href=next+location.search+location.hash;
 }));
});
document.addEventListener('click',e=>{qa('[data-language-control].is-open').forEach(el=>{if(!el.contains(e.target)){el.classList.remove('is-open');q('.lang-trigger',el)?.setAttribute('aria-expanded','false')}})});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){qa('[data-language-control].is-open').forEach(el=>{el.classList.remove('is-open');q('.lang-trigger',el)?.setAttribute('aria-expanded','false')})}});

const menuButton=q('.menu-toggle');
const mobileMenu=q('#mobile-nav');
menuButton?.addEventListener('click',()=>{const opening=mobileMenu.hidden;mobileMenu.hidden=!opening;menuButton.setAttribute('aria-expanded',String(opening));menuButton.setAttribute('aria-label',opening?'Close menu':'Open menu')});
qa('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.hidden=true;menuButton?.setAttribute('aria-expanded','false')}));
const links=qa('.desktop-nav a');
const sections=qa('main section[id]');
let scrollQueued=false;
function updateHeader(){header?.classList.toggle('scrolled',window.scrollY>30);scrollQueued=false}
window.addEventListener('scroll',()=>{if(!scrollQueued){requestAnimationFrame(updateHeader);scrollQueued=true}},{passive:true});updateHeader();
if('IntersectionObserver' in window){
 const activeSection=new IntersectionObserver(entries=>{entries.forEach(ent=>{if(ent.isIntersecting){const id=ent.target.id;links.forEach(l=>l.classList.toggle('nav-active',l.getAttribute('href')==='#'+id))}})},{rootMargin:'-20% 0px -65% 0px'});
 sections.forEach(s=>activeSection.observe(s));
 if(!reduced){document.documentElement.classList.add('js-motion');const appear=new IntersectionObserver(entries=>{entries.forEach(ent=>{if(ent.isIntersecting){ent.target.classList.add('in-view');appear.unobserve(ent.target)}})},{threshold:.07,rootMargin:'0px 0px -25px 0px'});qa('.reveal').forEach((el,i)=>{const peers=el.parentElement?.querySelectorAll(':scope > .reveal')||[];if(peers.length>1){const pos=Array.from(peers).indexOf(el);el.style.setProperty('--reveal-delay',Math.min(pos%4,3)*85+'ms')}if(el.getBoundingClientRect().top<window.innerHeight-20)el.classList.add('in-view');else appear.observe(el)})}
}
// Persisted dark/light appearance with an accessible toggle.
const themeRoot=document.documentElement;
const sysDark=window.matchMedia('(prefers-color-scheme: dark)');
let storedTheme=null;
try{const stored=localStorage.getItem('tmk_theme');if(stored==='dark'||stored==='light')storedTheme=stored}catch(e){}
const themeText={fa:['تغییر به حالت تیره','تغییر به حالت روشن'],ar:['التبديل إلى الوضع الداكن','التبديل إلى الوضع الفاتح'],en:['Switch to dark theme','Switch to light theme']};
function applyTheme(theme){
 themeRoot.dataset.theme=theme;
 const labels=themeText[document.documentElement.lang]||themeText.en;
 qa('.theme-toggle').forEach(b=>{
  b.setAttribute('aria-pressed',String(theme==='light'));
  const label=theme==='light'?labels[0]:labels[1];
  b.setAttribute('aria-label',label);b.setAttribute('title',label);
 });
 const meta=q('meta[name="theme-color"]');if(meta)meta.content=theme==='light'?'#f3f6fb':'#0b1120';
}
applyTheme(storedTheme||(sysDark.matches?'dark':'light'));
sysDark.addEventListener?.('change',e=>{if(!storedTheme)applyTheme(e.matches?'dark':'light')});
qa('.theme-toggle').forEach(button=>button.addEventListener('click',()=>{
 const next=themeRoot.dataset.theme==='light'?'dark':'light';
 if(!reduced){themeRoot.classList.add('theme-anim');setTimeout(()=>themeRoot.classList.remove('theme-anim'),260)}
 applyTheme(next);storedTheme=next;
 try{localStorage.setItem('tmk_theme',next)}catch(e){}
}));

const cards=qa('.project-card');
const filterButtons=qa('.filter-btn');
const slider=q('#projects-scroll');
const sliderProgress=q('.projects-progress span');
let activeFilter='all';
for(const button of filterButtons){
 const cat=button.dataset.filter;
 const total=cards.filter(card=>cat==='all'||(card.dataset.categories||card.dataset.category||'').split(/\s+/).includes(cat)).length;
 const number=q('span',button);if(number)number.textContent=String(total).padStart(2,'0');
}
function updateSliderProgress(){
 if(!slider)return;
 const available=Math.max(0,slider.scrollWidth-slider.clientWidth);
 const progress=available?Math.min(1,Math.abs(slider.scrollLeft)/available):0;
 if(sliderProgress)sliderProgress.style.transform=`scaleX(${available?Math.max(.12,progress):1})`;
 qa('.project-arrow').forEach(b=>{
  const start=progress<.015,end=progress>.985;
  b.disabled=b.dataset.direction==='prev'?start:end;
 });
}
function filterProjects(){
 cards.forEach(card=>{
  const categories=(card.dataset.categories||card.dataset.category||'').split(/\s+/);
  card.classList.toggle('is-hidden',activeFilter!=='all'&&!categories.includes(activeFilter));
 });
 if(slider)slider.scrollTo({left:0,behavior:'instant'});
 requestAnimationFrame(updateSliderProgress);
}
filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
 activeFilter=btn.dataset.filter;
 filterButtons.forEach(other=>{const on=other===btn;other.classList.toggle('active',on);other.setAttribute('aria-pressed',String(on))});
 filterProjects();
}));
slider?.addEventListener('scroll',updateSliderProgress,{passive:true});
window.addEventListener('resize',updateSliderProgress,{passive:true});
qa('.project-arrow').forEach(btn=>btn.addEventListener('click',()=>{
 if(!slider)return;
 const first=cards.find(card=>!card.classList.contains('is-hidden'));
 const step=first?first.getBoundingClientRect().width+parseFloat(getComputedStyle(slider).columnGap||22):slider.clientWidth*.75;
 const rtl=document.documentElement.dir==='rtl';
 slider.scrollBy({left:(btn.dataset.direction==='next'?1:-1)*(rtl?-step:step),behavior:reduced?'instant':'smooth'});
}));
filterProjects();
if(!reduced && window.matchMedia('(pointer:fine)').matches){
 const glow=q('.pointer-light');const orb=q('.hero-art');let targetX=-800,targetY=-800,mouseX=-800,mouseY=-800,frame=0;
 document.addEventListener('pointermove',e=>{targetX=e.clientX;targetY=e.clientY},{passive:true});
 const animate=()=>{mouseX+=(targetX-mouseX)*.13;mouseY+=(targetY-mouseY)*.13;if(glow)glow.style.transform=`translate3d(${mouseX-280}px,${mouseY-280}px,0)`;frame=requestAnimationFrame(animate)};
 frame=requestAnimationFrame(animate);
 orb?.addEventListener('pointermove',e=>{const bounds=orb.getBoundingClientRect();const x=(e.clientX-bounds.left)/bounds.width-.5;const y=(e.clientY-bounds.top)/bounds.height-.5;orb.style.transform=`translate(${x*12}px,${y*12}px)`},{passive:true});
 orb?.addEventListener('pointerleave',()=>{orb.style.transform=''},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame)}else{frame=requestAnimationFrame(animate)}});
}

const form=q('#inquiry-form');
form?.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!form.reportValidity())return;
 const feedback=q('.form-feedback',form);
 const submit=q('.form-submit',form);
 if(q('[name="_honey"]',form)?.value)return;
 const setStatus=(message,state)=>{if(feedback){feedback.textContent=message;feedback.dataset.state=state}if(state==='success'||state==='error')notify(message)};
 const original=submit.textContent;
 submit.disabled=true;
 submit.textContent=config.formSending || 'Sending…';
 setStatus(config.formSending||'Sending…','sending');
 try{
   const data=new FormData(form);
   const payload=Object.fromEntries(data.entries());
   payload._url=location.href;
   const endpoint=form.dataset.emailEndpoint;
   if(!endpoint)throw new Error('No form endpoint configured');
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
   const result=await response.json();
   if(!response.ok || !([true,'true'].includes(result.success)))throw new Error(result.message||'Submit failed');
   form.reset();
   setStatus(config.formSuccess||'Message submitted.','success');
 }catch(err){
   console.error('Inquiry submission failed',err);
   setStatus(config.formError||'Unable to send. Please try again.','error');
 }finally{submit.disabled=false;submit.textContent=original}
});

// Detail modals: never fabricate galleries, benchmark metrics or external links.
const ui=config.ui||{};
const make=(tag,cls,textContent)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(textContent!==undefined)el.textContent=textContent;return el};
function showModal(dialog){
 if(!dialog)return;
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 document.body.classList.add('modal-open');
}
function closeModal(dialog){if(!dialog)return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');document.body.classList.remove('modal-open')}
function fillGallery(container,images,placeholders=2){
 container.replaceChildren();
 if(Array.isArray(images)&&images.length){
  images.forEach((image,index)=>{
   if(!image?.src)return;
   const figure=make('figure','gallery-figure');
   const pic=document.createElement('img');pic.src=image.src;pic.loading='lazy';pic.alt=image.alt||'';
   figure.append(pic);if(image.caption)figure.append(make('figcaption','',image.caption));
   container.append(figure);
  });
 }
 if(!container.childElementCount){
  for(let i=0;i<placeholders;i++){
   const placeholder=make('div','gallery-placeholder');
   placeholder.append(make('span','gallery-placeholder-icon','▧'));
   placeholder.append(make('span','',ui.placeholder||'Screenshot not uploaded'));
   container.append(placeholder);
  }
 }
}
function setDialogRoles(dialog,items){
 const roles=q('.dialog-roles',dialog);roles.replaceChildren();
 (items||[]).forEach(item=>roles.append(make('li','',item)));
}
const projectDialog=q('#project-dialog');
qa('.project-visual').forEach(link=>link.addEventListener('click',e=>{
 e.preventDefault();
 const card=link.closest('.project-card');const slug=card?.dataset.project;
 const project=(config.projects||[]).find(x=>x.slug===slug);
 const detail=(config.projectDetails||{})[slug];
 if(!project||!detail||!projectDialog)return;
 q('.dialog-kicker',projectDialog).textContent=ui.project_popup||'Case study';
 q('.dialog-title',projectDialog).textContent=project.title;
 q('.dialog-description',projectDialog).textContent=detail.intro||project.description||'';
 q('.dialog-role-title',projectDialog).textContent=ui.project_role||'My role';
 q('.dialog-gallery-title',projectDialog).textContent=ui.project_gallery||'Gallery';
 q('.dialog-gallery-note',projectDialog).textContent=ui.gallery_hint||'';
 q('.dialog-compare-title',projectDialog).textContent=ui.before_after||'Before and after';
 setDialogRoles(projectDialog,detail.roles);
 qa('.dialog-extra',projectDialog).forEach(n=>n.remove());
 const toArr=v=>Array.isArray(v)?v.filter(x=>x&&x.src):(v&&v.src?[v]:[]);
 const galleryBox=q('.dialog-gallery',projectDialog);
 const gallerySection=galleryBox.closest('.dialog-section');
 const galleryImages=toArr(detail.gallery);
 gallerySection.hidden=!!detail.noGallery;
 fillGallery(galleryBox,galleryImages);
 const galleryNote=q('.dialog-gallery-note',projectDialog);
 galleryNote.hidden=galleryImages.length>0;
 const compare=q('.compare-grid',projectDialog);compare.replaceChildren();
 const compareSection=compare.closest('.dialog-section');
 const beforeImgs=toArr(detail.before),afterImgs=toArr(detail.after);
 const cats=card.dataset.categories||'';
 const legacyCompare=('before' in detail)&&!('seo' in detail)&&!('speed' in detail)&&/(speed|seo)/.test(cats);
 compareSection.hidden=!(beforeImgs.length||afterImgs.length||legacyCompare);
 for(const [key,label,imgs] of [['before',ui.before||'Before',beforeImgs],['after',ui.after||'After',afterImgs]]){
  const item=make('div','compare-item');item.append(make('strong','',label));
  if(imgs.length){imgs.forEach(image=>{const img=make('img');img.src=image.src;img.alt=image.alt||label;img.loading='lazy';item.append(img)})}
  else item.append(make('div','compare-empty',ui.placeholder||'Pending screenshot'));
  compare.append(item);
 }
 const actions=q('.dialog-actions',projectDialog);
 const addSection=(title,images,count)=>{
  const sec=make('div','dialog-section dialog-extra');sec.append(make('h3','',title));
  const box=make('div','dialog-gallery');fillGallery(box,toArr(images),count||2);sec.append(box);actions.before(sec);return sec;
 };
 if('seo' in detail)addSection(ui.seo_title||'SEO results',detail.seo,2);
 if('speed' in detail)addSection(ui.speed_title||'Speed results',detail.speed,2);
 qa('.dialog-instagram',actions).forEach(n=>n.remove());
 const ig=detail.instagram;
 if(ig){
  const sec=addSection(ui.instagram_title||'Instagram',ig.image?[ig.image]:[],1);
  if(ig.handle)sec.append(make('p','dialog-gallery-note',ig.handle));
  const btn=make('a','btn btn-secondary dialog-instagram');
  if(ig.url&&/^https:\/\//i.test(ig.url)){btn.href=ig.url;btn.target='_blank';btn.rel='noopener noreferrer';btn.textContent=(ui.instagram_btn||'Instagram')+(ig.handle?' '+ig.handle:'')}
  else{btn.setAttribute('aria-disabled','true');btn.setAttribute('tabindex','-1');btn.classList.add('is-disabled');btn.textContent=ui.instagram_pending||'Instagram link pending'}
  actions.append(btn);
 }
 const website=q('.dialog-website',projectDialog);
 if(detail.website&&/^https:\/\//i.test(detail.website)){
  website.href=detail.website;website.removeAttribute('aria-disabled');website.classList.remove('is-disabled');website.textContent=ui.website||'View website';
  website.removeAttribute('tabindex');
 }else{
  website.removeAttribute('href');website.setAttribute('aria-disabled','true');website.setAttribute('tabindex','-1');website.classList.add('is-disabled');website.textContent=ui.website_pending||'Link pending';
 }
 showModal(projectDialog);
}));
const pluginDialog=q('#plugin-dialog');
qa('[data-plugin-open]').forEach(button=>button.addEventListener('click',()=>{
 const details=(config.pluginDetails||{})[button.dataset.pluginOpen];
 if(!details||!pluginDialog)return;
 q('.dialog-kicker',pluginDialog).textContent=ui.plugin_popup||'Plugin';
 q('.dialog-title',pluginDialog).textContent=details.title;
 q('.dialog-description',pluginDialog).textContent=details.intro+' '+details.description;
 q('.dialog-role-title',pluginDialog).textContent=ui.plugin_features||'Features';
 q('.dialog-gallery-title',pluginDialog).textContent=ui.plugin_gallery||'Gallery';
 setDialogRoles(pluginDialog,details.features);
 fillGallery(q('.dialog-gallery',pluginDialog),details.gallery);
 const more=q('.plugin-detail-page',pluginDialog);more.textContent=ui.plugin_more||'Learn more';
 if(details.moreUrl){more.href=details.moreUrl;more.removeAttribute('aria-disabled')}
 else{more.removeAttribute('href');more.setAttribute('aria-disabled','true')}
 const download=q('.plugin-download',pluginDialog);
 download.textContent=ui.download||'Download plugin';download.disabled=!details.downloadUrl;
 download.onclick=()=>{if(details.downloadUrl&&/^(https?:\/\/|assets\/)/.test(details.downloadUrl)){window.open(details.downloadUrl,'_blank','noopener,noreferrer')}};
 q('.dialog-footnote',pluginDialog).textContent=details.downloadUrl?'':ui.download_pending||'Download not published';
 showModal(pluginDialog);
}));
for(const dialog of [projectDialog,pluginDialog]){
 if(!dialog)continue;
 q('.dialog-close',dialog)?.addEventListener('click',()=>closeModal(dialog));
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeModal(dialog)});
 dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
}
const year=q('#year');if(year)year.textContent=String(new Date().getFullYear());
})();
