(() => {
  let data=JSON.parse(JSON.stringify(window.PORTFOLIO));
  let folder=null, modified=false;
  const pending=new Map(),urls=new Map();
  const status=document.querySelector('#status');
  const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  const button=(text,action)=>{const b=make('button',text);b.type='button';b.onclick=action;return b;};
  function field(label,value,change){const wrap=make('label');wrap.className='field';wrap.append(make('span',label));const input=make('input');input.value=value||'';input.oninput=()=>{change(input.value);dirty();};wrap.append(input);return wrap;}
  function dirty(){modified=true;status.textContent='Unsaved changes. Save when you are ready.';}
  function uniquePath(file){
    const base=file.name.replace(/[^a-zA-Z0-9._ -]/g,'_');
    const used=new Set([data.hero.src,...data.sections.flatMap(s=>[...s.items.flatMap(i=>[i.src,i.poster]),...(s.software||[]).map(i=>i.src)])]);
    let name=base,n=1;while(used.has('assets/'+name)||pending.has('assets/'+name)){const dot=base.lastIndexOf('.');name=(dot<0?base:base.slice(0,dot))+'-'+n+++(dot<0?'':base.slice(dot));}return 'assets/'+name;
  }
  function stage(file,item,key='src'){const path=uniquePath(file);pending.set(path,file);urls.set(path,URL.createObjectURL(file));item[key]=path;dirty();render();}
  function card(item,list,index,type,single=false){
    const root=make('div');root.className='card';
    const thumb=make('div');thumb.className='thumb';
    if(item.src&&type==='image'){const img=make('img');img.src=urls.get(item.src)||item.src;img.alt=item.alt||'';thumb.append(img);}else thumb.append(make('span',type==='model'?'3D model · GLB':type==='video'?'Video': 'No image selected'));
    root.append(thumb);
    const picker=make('input');picker.type='file';picker.accept=type==='model'?'.glb':type==='video'?'video/*':'image/*';picker.setAttribute('aria-label','Choose '+type);picker.onchange=()=>{if(picker.files[0])stage(picker.files[0],item);};root.append(picker);
    const name=make('p',item.src||'Choose a file');name.className='file-name';root.append(name);
    root.append(field('Description',item.alt,v=>item.alt=v));
    if(type==='video'){const label=make('label','Poster image (optional)');const poster=make('input');poster.type='file';poster.accept='image/*';poster.onchange=()=>{if(poster.files[0])stage(poster.files[0],item,'poster');};root.append(label,poster);if(item.poster)root.append(make('p',item.poster));}
    const actions=make('div');actions.className='actions';
    if(!single){const up=button('Move up',()=>{[list[index-1],list[index]]=[list[index],list[index-1]];dirty();render();});up.disabled=index===0;const down=button('Move down',()=>{[list[index],list[index+1]]=[list[index+1],list[index]];dirty();render();});down.disabled=index===list.length-1;actions.append(up,down);}
    actions.append(button(single?'Clear':'Remove',()=>{if(single){item.src='';item.alt='';}else list.splice(index,1);dirty();render();}));root.append(actions);return root;
  }
  function collection(host,list,type,single=false){const cards=make('div');cards.className='cards';list.forEach((item,i)=>cards.append(card(item,list,i,type,single)));host.append(cards);if(!single){const picker=make('input');picker.type='file';picker.multiple=true;picker.hidden=true;picker.accept=type==='model'?'.glb':type==='video'?'video/*':'image/*';picker.onchange=()=>{for(const file of picker.files){const path=uniquePath(file);pending.set(path,file);urls.set(path,URL.createObjectURL(file));list.push({src:path,alt:''});}dirty();render();};const add=button('Add '+(type==='model'?'3D models':type==='video'?'videos':'images'),()=>picker.click());add.className='add';host.append(add,picker);}}
  function render(){
    const profile=document.querySelector('#profile');profile.replaceChildren();const fields=make('div');fields.className='fields';Object.entries({name:'Name and role',headline:'Main headline',intro:'Introduction',email:'Contact email'}).forEach(([key,label])=>fields.append(field(label,data.profile[key],v=>data.profile[key]=v)));profile.append(fields);
    const hero=document.querySelector('#hero');hero.replaceChildren();collection(hero,[data.hero],'image',true);
    const sections=document.querySelector('#sections');sections.replaceChildren();
    data.sections.forEach(section=>{const panel=make('section');panel.className='panel';panel.id='edit-'+section.id;panel.append(make('h2',section.id==='tanker'?'Tanker — one composite image':section.title||section.id));panel.append(field(section.type==='story'?'Story text':'Heading',section.title,v=>section.title=v));if(section.subtitle!==undefined)panel.append(field('Subtitle',section.subtitle,v=>section.subtitle=v));
      const single=['feature','story'].includes(section.type);if(single&&!section.items.length)section.items.push({src:'',alt:''});
      collection(panel,section.items,section.type==='models'?'model':section.type==='video'?'video':'image',single);
      if(section.type==='story'){
        const label=make('label');label.className='field';const caption=make('span','Image zoom');const value=make('output');
        const slider=make('input');slider.type='range';slider.min='100';slider.max='250';slider.step='5';slider.value=String(Math.round((Number(section.zoom)||1)*100));
        slider.setAttribute('aria-label','Exploded-view image zoom');value.textContent=slider.value+'%';
        const preview=make('div');preview.className='story-preview';const img=make('img');
        const item=section.items[0];if(item?.src){img.src=urls.get(item.src)||item.src;img.alt=item.alt||'Exploded view';preview.append(img);}
        img.style.transform='scale('+slider.value/100+')';
        slider.oninput=()=>{section.zoom=Number(slider.value)/100;value.textContent=slider.value+'%';img.style.transform='scale('+section.zoom+')';dirty();};
        label.append(caption,slider,value);panel.append(make('h3','Display size'),label,preview);
        const hint=make('p','Increase the zoom to make the product larger. The preview shows the visible crop.');hint.className='hint';panel.append(hint);
      }
      if(!['feature','story','models'].includes(section.type)){panel.append(make('h3','Software logos'));collection(panel,section.software||(section.software=[]),'image');}
      sections.append(panel);
    });
  }
  document.querySelector('#connect').onclick=async()=>{
    try{if(!window.showDirectoryPicker)throw new Error('Direct saving is available in Chrome or Edge. Use Download settings instead.');const selected=await window.showDirectoryPicker({mode:'readwrite'});const existing=await selected.getFileHandle('content.js');const source=await (await existing.getFile()).text();const parsed=JSON.parse(source.replace(/^\s*window\.PORTFOLIO\s*=\s*/, '').replace(/;\s*$/, ''));if(!parsed.sections)throw new Error('This is not a portfolio folder.');folder=selected;if(!modified){data=parsed;pending.clear();}render();status.textContent='Connected to '+folder.name+(modified?'. Your unsaved changes are ready to save.':'. Choose files, then save changes.');}catch(error){if(error.name!=='AbortError')status.textContent=error.message;}
  };
  async function writeFile(dir,name,contents){const handle=await dir.getFileHandle(name,{create:true});const stream=await handle.createWritable();await stream.write(contents);await stream.close();}
  function js(){return 'window.PORTFOLIO = '+JSON.stringify(data,null,2)+';\n';}
  function download(name,contents,type){const a=make('a');a.href=URL.createObjectURL(new Blob([contents],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  document.querySelector('#save').onclick=async()=>{
    if(!folder){await document.querySelector('#connect').onclick();if(!folder)return;}
    try{const assets=await folder.getDirectoryHandle('assets',{create:true});for(const [path,file] of pending)await writeFile(assets,path.slice(7),file);await writeFile(folder,'content.json',JSON.stringify(data,null,2));await writeFile(folder,'content.js',js());pending.clear();modified=false;status.textContent='Saved. Refresh your portfolio to see the changes.';}catch(error){status.textContent='Could not save: '+error.message;}
  };
  document.querySelector('#download').onclick=()=>{download('content.js',js(),'text/javascript');modified=false;status.textContent='Replace content.js with the downloaded file. Copy chosen media into assets. Direct folder saving also keeps content.json in sync.';};
  window.addEventListener('beforeunload',event=>{if(modified){event.preventDefault();event.returnValue='';}});
  render();
})();
