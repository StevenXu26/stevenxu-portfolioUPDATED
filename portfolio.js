(() => {
  const data = window.PORTFOLIO;
  if (!data?.sections) return;
  const element = (tag, cls, text) => { const node = document.createElement(tag); if(cls)node.className=cls; if(text)node.textContent=text; return node; };
  const photo = (item, eager=false) => {
    const figure = element('figure');
    const image = element('img'); image.src=item.src; image.alt=item.alt||''; image.loading=eager?'eager':'lazy'; image.decoding='async';
    image.addEventListener('error',()=>{image.remove();figure.append(element('p','media-error','Image unavailable.'));});
    figure.append(image);return figure;
  };
  document.querySelector('#name').textContent=data.profile.name;
  document.querySelector('#headline').textContent=data.profile.headline;
  const contact=document.querySelector('#contact');contact.textContent=data.profile.email;contact.href='mailto:'+data.profile.email;
  const main=document.querySelector('main');
  if(data.hero?.src){const hero=photo(data.hero,true);hero.className='hero';main.append(hero);}
  const intro=element('div','intro');intro.append(element('span','triangle'),element('p','',data.profile.intro));main.append(intro);
  let viewerLibrary;
  function loadViewer() {
    if(viewerLibrary)return viewerLibrary;
    viewerLibrary=new Promise((resolve,reject)=>{
      if(customElements.get('model-viewer')){resolve();return;}
      const script=element('script');script.type='module';script.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js';
      script.onload=()=>customElements.whenDefined('model-viewer').then(resolve);
      script.onerror=()=>reject(new Error('Viewer library could not load. Check your internet connection.'));
      document.head.append(script);
    });return viewerLibrary;
  }
  data.sections.forEach(section=>{
    const items=(section.items||[]).filter(item=>item.src);
    if(!items.length && !section.title)return;
    const root=element('section',`section ${section.theme} ${section.type==='gallery'?'image-section':section.type}`);root.id=section.id;
    if(section.title && section.type!=='story')root.append(element('h2','',section.title));
    if(['gallery','documents'].includes(section.type)){
      const grid=element('div','gallery');items.forEach(item=>grid.append(photo(item)));root.append(grid);
      if(section.subtitle)root.append(element('h3','',section.subtitle));
    }else if(section.type==='feature'){
      items.forEach(item=>root.append(photo(item)));
    }else if(section.type==='story'){
      if(section.title)root.append(element('p','',section.title));
      root.style.setProperty('--image-zoom',String(Math.min(2.5,Math.max(1,Number(section.zoom)||1))));
      items.forEach(item=>root.append(photo(item)));
    }else if(section.type==='video'){
      items.forEach(item=>{const wrap=element('div','video-wrap');const video=element('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=item.src;if(item.poster)video.poster=item.poster;video.setAttribute('aria-label',item.alt||'Product animation');video.addEventListener('error',()=>wrap.append(element('p','media-error','Animation unavailable.')),{once:true});wrap.append(video);root.append(wrap);});
    }else if(section.type==='models'){
      const grid=element('div','models-grid');root.append(grid);
      items.forEach(item=>{
        const slot=element('div','model-slot');const status=element('p','model-status','Loading 3D model…');slot.append(status);grid.append(slot);
        if(location.protocol==='file:'){status.textContent='Open the website with Start-Preview.cmd to view interactive 3D models.';return;}
        loadViewer().then(()=>{
          const viewer=element('model-viewer');viewer.setAttribute('alt',item.alt||'Interactive 3D machine');viewer.setAttribute('camera-controls','');viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('shadow-intensity','1');viewer.setAttribute('environment-image','neutral');viewer.setAttribute('interaction-prompt','none');viewer.setAttribute('camera-orbit','35deg 65deg auto');
          viewer.addEventListener('load',()=>{status.textContent='';});
          viewer.addEventListener('error',()=>{status.textContent='This model could not load. Check the GLB file and its path.';});
          const progress=element('span');progress.slot='progress-bar';progress.hidden=true;viewer.append(progress);
          viewer.src=item.src;slot.prepend(viewer);
        }).catch(error=>{status.textContent=error.message;});
      });
      if(items.length)root.append(element('p','model-instructions','Drag to rotate · Scroll or pinch to zoom'));
    }
    const software=element('div','software');(section.software||[]).filter(i=>i.src).forEach(item=>{const image=element('img');image.src=item.src;image.alt=item.alt||'Software';image.loading='lazy';software.append(image);});root.append(software);
    main.append(root);
  });
})();
