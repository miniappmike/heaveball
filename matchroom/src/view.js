const fieldTemplates=[
 {id:'park-red',name:'Park · red clay',surface:'park',grass:'#3c7139',stripe:'#447a3e',runway:'#47823f',center:'#36713d',zone:'#9c503a'},
 {id:'park-tan',name:'Park · tan clay',surface:'park',grass:'#3c6a35',stripe:'#43743a',runway:'#4c8a44',center:'#3b7436',zone:'#c9a96b'},
 {id:'park-brown',name:'Park · brown clay',surface:'park',grass:'#3d6e33',stripe:'#467a39',runway:'#6b934a',center:'#3b773c',zone:'#987658'},
 {id:'turf-tan',name:'All-weather · tan',surface:'turf',grass:'#377944',stripe:'#3c8249',runway:'#346d3c',center:'#478c4d',zone:'#a9906d'},
 {id:'turf-red',name:'All-weather · red',surface:'turf',grass:'#33964d',stripe:'#3a9d51',runway:'#779b48',center:'#85ad40',zone:'#aa5b49'}
];

if(!window.heaveballReady){
const el=id=>document.getElementById(id),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),colors=['#ff805d','#69bafa'];
// Club branding. Jerseys (kit) use the club's primary colour unless it clashes with the field or the home kit;
// then the club's next logo colour, then white or black. colors[team], the colour of the club's names and text,
// follows the jersey actually worn (so Roxbury in its orange kit reads orange, not green), lightened just enough
// to read on the dark site (4.5:1). A plain black or white jersey uses its coloured trim, or else the club's
// primary, so names never turn grey. The decorative glows and crest rings stay the club's primary.
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mixColor=(a,b,t)=>{const x=hexRgb(a),y=hexRgb(b);return toHex(x.map((v,i)=>v+(y[i]-v)*t))};
const luminance=h=>{const [r,g,b]=hexRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
// Perceptual distance ("redmean"). Against the grass, about 100 or less disappears.
const colorGap=(a,b)=>{const [r1,g1,b1]=hexRgb(a),[r2,g2,b2]=hexRgb(b),m=(r1+r2)/2;return Math.sqrt((2+m/256)*(r1-r2)**2+4*(g1-g2)**2+(2+(255-m)/256)*(b1-b2)**2)};
const fieldClash=100,kitClash=120,kitFamily=230,darkInk='#101c16';
const hue=h=>{const [r,g,b]=hexRgb(h).map(v=>v/255),mx=Math.max(r,g,b),d=mx-Math.min(r,g,b);if(!d)return null;
 return 60*(mx===r?((g-b)/d+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4)};
// Two kits clash when they are nearly the same colour, or fairly close and within 40 degrees of hue.
function kitsClash(a,b){
 const gap=colorGap(a,b);if(gap<kitClash)return true;if(gap>=kitFamily)return false;
 const x=hue(a),y=hue(b);if(x===null||y===null)return false;const d=Math.abs(x-y);return Math.min(d,360-d)<40;
}
function readable(hex,bg='#151917'){let c=hex;for(let t=.05;contrast(c,bg)<4.5&&t<=1;t+=.05)c=mixColor(hex,'#ffffff',t);return c}
function chooseKits(field){
 const pitch=[field.grass,field.stripe,field.runway,field.center];
 const clear=(c,others)=>pitch.every(p=>colorGap(c,p)>=fieldClash)&&others.every(o=>!kitsClash(c,o));
 const pick=(club,others)=>club.kit.concat('#f4f4f0','#16181a').find(c=>clear(c,others))||club.kit[0];
 const fills=[pick(matchup[0],[])];fills.push(pick(matchup[1],fills));
 return fills.map((fill,team)=>{
   const ink=contrast(fill,'#ffffff')>=contrast(fill,darkInk)?'#ffffff':darkInk;
   // Trim: the club colour that stands out most against the jersey, or the number colour.
   const trim=matchup[team].kit.filter(c=>c!==fill).sort((a,b)=>contrast(b,fill)-contrast(a,fill))[0];
   return {fill,ink,trim:trim&&contrast(trim,fill)>=2?trim:ink,dark:luminance(fill)<.06};
 });
}
let kits=[],kitKey='';
function kit(team){const key=matchup[0].id+'|'+matchup[1].id+'|'+selectedField.id;if(key!==kitKey){kitKey=key;kits=chooseKits(selectedField)}return kits[team]}
const crestCache={},markCache={};
// Marks: the club's full logo with no background (a light keyline where its edge is dark), for the pregame
// matchup, the score card and the canvas score bar.
function markImage(club){
 if(!markCache[club.id]){const image=markCache[club.id]=new Image();image.src=(typeof markImages!=='undefined'&&markImages[club.id])||'marks/'+club.id+'.webp'}
 return markCache[club.id];
}
function crestImage(club){
 if(!crestCache[club.id]){const image=crestCache[club.id]=new Image();image.src=(typeof crestImages!=='undefined'&&crestImages[club.id])||'crests/'+club.id+'.webp'}
 return crestCache[club.id];
}
function syncTeamColors(){
 // Colourfulness on an absolute scale, so near-black and near-white count as plain (relative saturation does not).
 const style=document.documentElement.style,chroma=c=>{const v=hexRgb(c);return (Math.max(...v)-Math.min(...v))/255};
 matchup.forEach((club,team)=>{
   const k=kit(team);
   colors[team]=readable([k.fill,k.trim,club.kit[0]].find(c=>chroma(c)>=.2)||club.kit[0]);
   style.setProperty('--team'+team,colors[team]);style.setProperty('--team'+team+'-primary',club.kit[0]);
 });
}
function applyBranding(){
 syncTeamColors();
 for(const node of document.querySelectorAll('[data-team]')){
   const club=matchup[+node.dataset.team];
   if(node.tagName==='IMG'){node.src=(node.dataset.art==='mark'?markImage(club):crestImage(club)).src;continue}
   const field=node.dataset.field;
   node.textContent=field==='short'?club.short:field==='meta'?club.home+' · Est. '+club.since:field==='history'?club.history:club.name;
 }
 el('handbook').textContent=matchup[0].name+' vs '+matchup[1].name;
 document.title=matchup[0].short+' vs '+matchup[1].short+' · Heaveball Matchroom';
}
// Pregame club pickers: Random club or a fixed club per side. New rosters keep fixed clubs and redraw random ones;
// choosing the club already on the other side swaps the two.
const clubPickers=[el('home-club'),el('away-club')];
for(const picker of clubPickers){picker.replaceChildren(new Option('Random club',''),...clubs.map(c=>new Option(c.name,c.id)));picker.dataset.last=''}
clubPickers.forEach((picker,i)=>picker.onchange=()=>{
 const other=clubPickers[1-i];
 if(picker.value&&picker.value===other.value){other.value=picker.dataset.last;other.dataset.last=other.value}
 picker.dataset.last=picker.value;fresh();
});
// Momentum setting (pregame), remembered per browser.
let momentumOn=true;
try{momentumOn=localStorage.getItem('heaveball-momentum')!=='off'}catch{}
const tackleDuration=2000,fixedStep=.04,halftimeDuration=15000,scoringDuration=3500,penaltyDuration=3500,stoppageDuration=3500;
let sim,playing=false,carry=0,wall=performance.now(),speed=1,backgroundTimer=0;
let statsMode=null,statsPage=0,statsDeadline=0,frozenTime=null,finalStats=null;
function stamp(s){let n=s.overtime?Math.floor(s.time):Math.ceil(s.time);return (s.overtime?'OT':'H'+s.half)+' · '+Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
let tackleBreak=false,boxDirty=true,breakUntil=0,callAge=Infinity,lastFrame=performance.now(),shownHighlights=-1;
const playerNamePattern=new RegExp('\\b('+names.join('|')+')\\b','g');
function report(s,msg){
 boxDirty=true;
 const row=document.createElement('p'),time=document.createElement('time'),message=document.createElement('span');
 time.textContent=stamp(s);
 row.append(time,message);
 let end=0;
 for(const match of msg.matchAll(playerNamePattern)){
   const player=s.players.concat(s.bench).find(p=>p.name===match[0]);
   if(!player)continue;
   const name=document.createElement('span');
   name.style.color=colors[player.team];name.textContent=player.name;
   message.append(msg.slice(end,match.index),name);
   end=match.index+player.name.length;
 }
 message.append(msg.slice(end));
 el('feed').prepend(row);
 if(el('feed').children.length>80)el('feed').lastChild.remove();
}
function scout(){let p=roster()[+el('roster').value],h=Math.round(p.height);el('build').textContent=p.role+' · '+Math.floor(h/12)+'′'+h%12+'″ · '+Math.round(p.weight)+' lb';el('cards').replaceChildren(...traits.map((name,i)=>{let line=document.createElement('span'),num=document.createElement('b');num.textContent=(p.base||p.ratings)[i];line.append(name,num);return line}))}
const roster=()=>sim.players.concat(sim.bench);
// Substitutions move players between field slots and bench seats, so the list is rebuilt after each one.
let shownSubs=0;
function rosterOptions(){
 const chosen=roster()[+el('roster').value]?.name;
 shownSubs=sim.subEvents;
 const list=roster();
 el('roster').replaceChildren(...list.map((p,i)=>new Option(teams[p.team]+' #'+p.jersey+' · '+p.name+(p.bench?' · bench':''),i)));
 const keep=list.findIndex(p=>p.name===chosen);if(keep>=0)el('roster').value=keep;
 scout();
}
function fresh(){shownHighlights=-1;closeStats();finalStats=null;el('final-box').hidden=true;wall=performance.now();breakUntil=0;callAge=Infinity;boxDirty=true;el('feed').replaceChildren();sim=match(report,clubPickers.map(p=>p.value),{momentum:momentumOn});applyBranding();playing=false;carry=0;rosterOptions();briefing()}
function briefing(){
 const average=values=>values.reduce((sum,v)=>sum+v,0)/values.length;
 const squads=teams.map((_,i)=>sim.players.filter(p=>p.team===i));
 const ratings=squads.map(rows=>traits.map((_,j)=>average(rows.map(p=>p.ratings[j]))));
 const overall=ratings.map(average);
 el('averages').innerHTML=traits.map((label,trait)=>'<li><dl class="rating-card"><dt>'+label+'</dt><dd>'+
   ratings.map((row,team)=>'<span class="rating-value t'+team+'" style="--rating:'+row[trait]+'%">'+
     '<span class="sr-only">'+teams[team]+' </span>'+row[trait].toFixed(1)+'</span>').join('')+'</dd></dl></li>').join('');
 el('overall-0').textContent=overall[0].toFixed(1);
 el('overall-1').textContent=overall[1].toFixed(1);
 // Spread model refitted on 339 simulated full matches after the fatigue, defensive-pressure and Carrier pressure changes (see summary.md, "Spread forecast").
 // Expected team points = base + own trait averages + opponent trait averages + own playbook + opponent defense + own defense tempo.
 const forecast=()=>{
   // Base raised 0.6 from the fit to account for the first-half hurry-up and coach adjustments (about +1.3 combined).
   const W={base:29.9,
     own:[.065,.165,-.024,-.03,.114,.072,-.038,-.068,.091,-.042,.187,.047],
     opp:[-.002,-.057,-.096,.069,-.176,-.044,-.004,.031,-.057,-.11,-.183,-.09],
     playbook:[0,1.39,4.85,-2.13,-.398],
     oppDefense:[0,-.521,1.31,2.58,2.61,2.72,-3.46,.007],
     ownDefense:[0,-.613,.531,2.69,-.928,5.2,-2.43,-.676],sd:11.8};
   const points=[0,1].map(t=>{const o=1-t;let v=W.base+W.playbook[playbooks.indexOf(sim.playbooks[t])]+W.oppDefense[sim.defenses[o]]+W.ownDefense[sim.defenses[t]];
     for(let j=0;j<12;j++)v+=W.own[j]*(ratings[t][j]-70)+W.opp[j]*(ratings[o][j]-70);return Math.max(0,v)});
   const edge=points[0]-points[1],margin=Math.round(Math.abs(edge)*2)/2;
   const erf=x=>{const t=1/(1+.3275911*Math.abs(x)),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return x<0?-y:y};
   // Momentum surges widen results beyond what ratings predict (residual SD 12.1 → 13.2 in 400-match checks).
   const sd=W.sd*(sim.momentumOn?1.09:1);
   const win=.5*(1+erf(Math.abs(edge)/(sd*Math.SQRT2)));
   el('spread').textContent=margin?teams[edge>0?0:1]+' −'+margin:'Pick’em';
   el('spread-detail').textContent=(margin?teams[edge>0?0:1]+' win '+Math.round(win*100)+'%':'50/50')+' · Total '+(Math.round((points[0]+points[1])*2)/2);
 };
 forecast();
 const options=teams.map((name,team)=>{
   const fieldset=document.createElement('fieldset'),legend=document.createElement('legend');
   fieldset.className='tactic-team';
   legend.className='t'+team;
   legend.textContent=name;
   const coach=document.createElement('p'),c=sim.coaches[team];
   coach.className='coach-line';
   coach.textContent='Head coach '+c.name+' · Adaptability '+c.adaptability;
   coach.title='Adaptability sets how quickly the coach notices a losing matchup during the game and how often they pick the right counter.';
   fieldset.append(legend,coach);
   for(const type of ['offense','defense']){
     const defending=type==='defense',choices=defending?defenses:playbooks;
     const label=document.createElement('label'),select=document.createElement('select'),description=document.createElement('small');
     select.id=type+'-'+team;description.id=type+'-description-'+team;
     label.htmlFor=select.id;label.textContent=defending?'Defense':'Offense';
     select.setAttribute('aria-label',name+' '+type);
     select.setAttribute('aria-describedby',description.id);
     select.replaceChildren(...choices.map((scheme,i)=>new Option(scheme.name,i)));
     select.value=defending?sim.defenses[team]:playbooks.indexOf(sim.playbooks[team]);
     const describe=()=>{
       const scheme=choices[select.value];
       description.textContent=scheme.blurb||scheme.description||[...new Set(scheme.calls)].join(' · ');
       description.title=scheme.description||'';
     };
     describe();
     select.onchange=()=>{
       const choice=Number(select.value);
       if(defending)sim.defenses[team]=choice;
       else if(sim.playbooks[team]!==playbooks[choice]){
         if(team===sim.team)el('feed').replaceChildren();
         sim.setPlaybook(team,choice);
       }
       describe();
       forecast();
     };
     fieldset.append(label,select,description);
   }
   return fieldset;
 });
 el('tactics').replaceChildren(...options);
 el('pregame').hidden=false;draw()
}

el('reroll').onclick=fresh;
const momentumToggle=el('momentum-toggle');momentumToggle.checked=momentumOn;
momentumToggle.addEventListener('change',()=>{momentumOn=momentumToggle.checked;sim.setMomentum(momentumOn);briefing();try{localStorage.setItem('heaveball-momentum',momentumOn?'on':'off')}catch{}});
el('start').onclick=()=>{el('pregame').hidden=true;wall=performance.now();playing=true;scheduleBackground()};
const syncSpeeds=()=>document.querySelectorAll('#speeds button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.speed===el('pace').value)));
el('pace').onchange=()=>{advance(performance.now());speed=Number(el('pace').value);syncSpeeds()};
el('speeds').onclick=e=>{const b=e.target.closest('button[data-speed]');if(!b)return;el('pace').value=b.dataset.speed;el('pace').onchange()};
el('bar-toggle').onclick=()=>el('toggle').click();
syncSpeeds();
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function disc(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.12;ctx.stroke()}}
let selectedField=fieldTemplates[0];
const fieldPicker=el('field-picker');
for(const template of fieldTemplates){const option=document.createElement('option');option.value=template.id;option.textContent=template.name;fieldPicker.append(option)}
try{selectedField=fieldTemplates.find(t=>t.id===localStorage.getItem('heaveball-field'))||selectedField}catch{}
fieldPicker.value=selectedField.id;
fieldPicker.addEventListener('change',()=>{selectedField=fieldTemplates.find(t=>t.id===fieldPicker.value)||fieldTemplates[0];try{localStorage.setItem('heaveball-field',selectedField.id)}catch{}
 // The field can change which kit a club wears, so the team text colours follow.
 syncTeamColors();boxDirty=true});
// Field textures load on first use. The build may embed the default one so the page draws without sibling files.
function fieldImage(template){
 if(!template.image){template.image=new Image();template.image.src=(typeof fieldImages!=='undefined'&&fieldImages[template.id])||'fields/'+template.id+'.webp'}
 return template.image;
}
// Field branding: the home club's colours on the clay strips and, on all-weather fields, the center turf.
// Grass and runways always keep their greens. Every pixel keeps its texture: the brand colour is scaled by how
// light or dark the original pixel is against its zone's average, so grain, rows and mowing stripes survive.
// Brand colours are muted slightly and held inside the brightness range of real clay and turf, so players and
// the ball stay readable on them. One branded copy is kept, for the current field and home club.
let clubField=true,brandedField={key:'',canvas:null};
try{clubField=localStorage.getItem('heaveball-club-field')!=='off'}catch{}
const saturation=h=>{const c=hexRgb(h),mx=Math.max(...c),mn=Math.min(...c);return mx?(mx-mn)/mx:0};
const greens=fieldTemplates.flatMap(t=>[t.grass,t.stripe,t.runway]);
// Clay: the club's most characteristic colour that is not lost against grass. Center turf: its next such colour.
function fieldPalette(club){
 const safe=c=>greens.every(g=>colorGap(c,g)>=110);
 const clay=club.kit.find(c=>saturation(c)>=.35&&safe(c))||club.kit.find(safe)||club.kit[0];
 return {clay,zone:club.kit.find(c=>c!==clay&&safe(c))||clay};
}
function surfaceTone(hex,lo,hi){
 // Vivid colours are muted more, the way coloured clay and infill read against the logo they come from.
 let c=mixColor(hex,'#808078',.16+.24*saturation(hex));
 for(let i=0;i<24&&luminance(c)>hi;i++)c=mixColor(c,'#000000',.07);
 for(let i=0;i<24&&luminance(c)<lo;i++)c=mixColor(c,'#ffffff',.07);
 return c;
}
function fieldSurface(template){
 const image=fieldImage(template);
 if(!image.complete||!image.naturalWidth)return null;
 if(!clubField)return image;
 const club=matchup[0],key=template.id+'|'+club.id;
 if(brandedField.key===key)return brandedField.canvas;
 const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;
 const g=surface.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
 const k=surface.width/venue.field.width,{x,width,gap}=venue.strip,{clay,zone}=fieldPalette(club);
 const paint=(rects,hex)=>{
   const target=hexRgb(hex);
   const blocks=rects.map(r=>r.map(v=>Math.round(v*k))).map(([a,b,w,h])=>[a,b,g.getImageData(a,b,w,h)]);
   let sum=0,n=0;
   for(const [,,img] of blocks){const d=img.data;for(let i=0;i<d.length;i+=4){sum+=d[i]*.299+d[i+1]*.587+d[i+2]*.114;n++}}
   const mean=sum/n;
   for(const [a,b,img] of blocks){
     const d=img.data;
     for(let i=0;i<d.length;i+=4){const f=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)/mean;d[i]=target[0]*f;d[i+1]=target[1]*f;d[i+2]=target[2]*f}
     g.putImageData(img,a,b);
   }
 };
 paint([[x,0,width,gap[0]],[x,gap[1],width,venue.field.height-gap[1]]],surfaceTone(clay,.07,.22));
 if(template.surface==='turf')paint([[x,gap[0],width,gap[1]-gap[0]]],surfaceTone(zone,.05,.17));
 brandedField={key,canvas:surface};
 return surface;
}
const clubFieldToggle=el('club-field');
clubFieldToggle.checked=clubField;
clubFieldToggle.addEventListener('change',()=>{clubField=clubFieldToggle.checked;try{localStorage.setItem('heaveball-club-field',clubField?'on':'off')}catch{}});
function drawBall(ball){
 const height=Math.max(0,(ball.z??ballRadius)-ballRadius);
 const x=ball.x,y=ball.y-height*.67;
 const shadowX=ball.x+height*.32,shadowY=ball.y+height*.13;
 const blur=.34+height*.16;
 const shadow=ctx.createRadialGradient(shadowX,shadowY,0,shadowX,shadowY,blur);
 shadow.addColorStop(0,'rgba(5,15,11,'+(.64/(1+height*.44))+')');
 shadow.addColorStop(1,'rgba(5,15,11,0)');
 ctx.fillStyle=shadow;ctx.fillRect(shadowX-blur,shadowY-blur,2*blur,2*blur);
 const radius=ballRadius*(1+Math.min(height,5)*.046);
 const light=ctx.createRadialGradient(x-radius*.38,y-radius*.46,radius*.06,x,y,radius*1.02);
 light.addColorStop(0,'#fff');
 light.addColorStop(.52,'#f7f8f8');
 light.addColorStop(.88,'#d5dcdf');
 light.addColorStop(1,'#aab7bd');
 disc(x,y,radius,light,'#223039');
}
function drawStamina(p,carrier){
 const energy=clamp(p.energy,0,1);
 const low=energy<.35;
 if(p!==carrier&&!low)return;
 const width=1.42,height=.25,x=p.x-width/2,y=p.y+.96;
 ctx.fillStyle='#14201a';
 ctx.fillRect(x-.06,y-.06,width+.12,height+.12);
 ctx.fillStyle=low?'#ff575e':energy<.7?'#ffcf4d':'#38e394';
 ctx.fillRect(x,y,width*energy,height);
}
function drawPlayer(p){
 const flagged=sim.penaltyPending&&sim.penalized===p;
 if(flagged)disc(p.x,p.y,1.25,'rgba(255,40,40,.45)','#ff2a2a');
 else if(p.blocked>0)disc(p.x,p.y,1,"#8a7546","#f5d688");
 const k=kit(p.team);
 disc(p.x,p.y,.76,flagged?'#ff3b3b':k.fill,flagged?'#fff':k.trim);
 ctx.save();ctx.translate(p.x,p.y);ctx.font='bold .84px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 // The tackled player's inner ring is black, or white on a dark jersey.
 if(sim.tackled===p){ctx.beginPath();ctx.arc(0,0,.6,0,Math.PI*2);ctx.strokeStyle=k.dark&&!flagged?'#fff':'#000';ctx.lineWidth=.16;ctx.stroke()}ctx.fillStyle=flagged?darkInk:k.ink;ctx.fillText(p.jersey,0,0);ctx.restore();
}
// Canvas layout: the canvas matches its on-screen size and the venue (field, benches, coach boxes) fills it below a thin score bar.
// Inline, the canvas height follows its width; in full screen it fills the screen.
function layoutView(){
 const expanded=el('field').classList.contains('expanded'),dpr=Math.min(2,window.devicePixelRatio||1),barCss=38;
 const v=venue.view;
 if(!expanded){const h=Math.round(canvas.clientWidth*v.height/v.width)+barCss+'px';if(canvas.style.height!==h)canvas.style.height=h}
 else if(canvas.style.height)canvas.style.height='';
 const W=Math.max(1,Math.round(canvas.clientWidth*dpr)),H=Math.max(1,Math.round(canvas.clientHeight*dpr));
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
 const bar=Math.round(barCss*dpr),s=Math.min(W/v.width,(H-bar)/v.height);
 return {s,ox:(W-v.width*s)/2-v.x*s,oy:bar+(H-bar-v.height*s)/2-v.y*s,dpr,bar};
}
// Score bar: a flat broadcast strip in the Matchroom style (dark card, Bebas Neue, club crests, mint accent).
const barFont='"Bebas Neue","Oswald","Arial Narrow",Impact,sans-serif';
document.fonts?.load?.('20px "Bebas Neue"').catch(()=>{});
// A club mark fitted inside a w×h box, keeping its shape.
function drawMark(x,y,w,h,team,align){
 const image=markImage(matchup[team]);
 if(!image.complete||!image.naturalWidth)return;
 const s=Math.min(w/image.naturalWidth,h/image.naturalHeight),dw=image.naturalWidth*s,dh=image.naturalHeight*s;
 ctx.drawImage(image,align==='right'?x+w-dw:x,y+(h-dh)/2,dw,dh);
}
function drawThinBar(v){
 const w=canvas.width/v.dpr,h=v.bar/v.dpr,poss=sim.team,live=!sim.done,narrow=w<640,tiny=w<440,mid=narrow?null:w/2;
 const ink='#f2f5f3',muted='#99a49d',mint='#2fe39a',abbr=matchup.map(c=>c.abbr);
 ctx.save();ctx.setTransform(v.dpr,0,0,v.dpr,0,0);ctx.textBaseline='middle';
 ctx.fillStyle='#171c19';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(0,h-1,w,1);
 // Momentum: a thin strip along the bottom edge that grows from the middle toward the club with momentum
 // (home to the left), in that club's colour. Ticks mark the dead zone where neither club gains anything.
 // During a surge the strip thickens, pulses and shrinks toward the middle as the surge's time runs out.
 if(sim.momentumOn){
   const half=w/2,lean=sim.momentum,len=Math.abs(lean)/100*half,surge=sim.surge,mh=surge?5:3;
   ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(0,h-mh,w,mh);
   if(len>=.5){
     ctx.globalAlpha=surge?.7+.3*Math.sin(performance.now()/160):Math.abs(lean)<momentumDeadZone?.45:1;
     ctx.fillStyle=colors[lean>0?0:1];ctx.fillRect(lean>0?half-len:half,h-mh,len,mh);ctx.globalAlpha=1;
   }
   ctx.fillStyle='rgba(255,255,255,.35)';
   for(const x of [half-half*momentumDeadZone/100,half,half+half*momentumDeadZone/100])ctx.fillRect(Math.round(x)-.5,h-mh-(x===half?2:0),1,mh+(x===half?2:0));
 }
 const cy=h/2+1,big=Math.round(h*.68),label=Math.round(h*.46),pad=narrow?10:16;
 // Center group: crest, abbreviation, score, divider, score, abbreviation, crest.
 ctx.font=big+'px '+barFont;
 const scoreW=Math.max(ctx.measureText(String(sim.score[0])).width,ctx.measureText(String(sim.score[1])).width,ctx.measureText('00').width);
 ctx.font=label+'px '+barFont;const abbrW=Math.max(...abbr.map(a=>ctx.measureText(a).width));
 const crestW=tiny?0:h*1.3,gap=narrow?6:9,bw=scoreW+16,dash=narrow?9:11;
 const extent=dash+bw+7+abbrW+(tiny?0:gap+crestW);
 const cx=mid??pad+extent;
 const lpc=cx-dash-bw/2,rpc=cx+dash+bw/2;
 const scoreBox=(team,x)=>{
   const has=live&&poss===team,bx=x-bw/2,by=5,bh=h-11;
   ctx.beginPath();ctx.roundRect(bx,by,bw,bh,bh/2);ctx.fillStyle=has?'rgba(47,227,154,.16)':'#232926';ctx.fill();
   if(has){ctx.lineWidth=1.2;ctx.strokeStyle=mint;ctx.stroke()}
   ctx.fillStyle=ink;ctx.font=big+'px '+barFont;ctx.textAlign='center';ctx.fillText(sim.score[team],x,cy);
 };
 ctx.fillStyle=muted;ctx.font=label+'px '+barFont;ctx.textAlign='center';ctx.fillText('–',cx,cy);
 scoreBox(0,lpc);scoreBox(1,rpc);
 ctx.font=label+'px '+barFont;ctx.fillStyle=ink;
 ctx.textAlign='right';ctx.fillText(abbr[0],lpc-bw/2-7,cy);
 ctx.textAlign='left';ctx.fillText(abbr[1],rpc+bw/2+7,cy);
 if(!tiny){
   const mh=h*.74;
   drawMark(lpc-bw/2-7-abbrW-gap-crestW,(h-mh)/2,crestW,mh,0,'right');
   drawMark(rpc+bw/2+7+abbrW+gap,(h-mh)/2,crestW,mh,1,'left');
 }
 // Left: possession or ruling.
 if(!narrow){
   const status=sim.penaltyPending?'FREE RUN LANE':sim.done?'FINAL':teams[poss].toUpperCase()+' BALL';
   if(!sim.done&&!sim.penaltyPending){ctx.beginPath();ctx.arc(pad+4,cy-1,4,0,Math.PI*2);ctx.fillStyle=colors[poss];ctx.fill()}
   ctx.font=label+'px '+barFont;ctx.textAlign='left';ctx.fillStyle=sim.penaltyPending?'#ffd47d':ink;
   ctx.fillText(status,pad+(sim.done||sim.penaltyPending?0:14),cy);
   if(sim.surge&&!sim.done){
     const x=pad+(sim.penaltyPending?0:14)+ctx.measureText(status).width+10,tag=teams[sim.surge.team].toUpperCase()+' SURGE',tw=ctx.measureText(tag).width+16,ph=h-11;
     ctx.beginPath();ctx.roundRect(x,5,tw,ph,ph/2);ctx.fillStyle=colors[sim.surge.team];ctx.globalAlpha=.85+.15*Math.sin(performance.now()/160);ctx.fill();ctx.globalAlpha=1;
     ctx.fillStyle='#0c0f0d';ctx.textAlign='center';ctx.fillText(tag,x+tw/2,cy);ctx.textAlign='left';
   }
 }
 // Right: clock, period and the possession clock pill.
 let r=w-pad;
 if(live){
   const secs=Math.floor(sim.posAge),txt='POSS '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');
   ctx.font=label+'px '+barFont;const tw=ctx.measureText(txt).width+18,ph=h-11;
   ctx.beginPath();ctx.roundRect(r-tw,5,tw,ph,ph/2);ctx.fillStyle=mint;ctx.fill();
   ctx.fillStyle='#04200f';ctx.textAlign='center';ctx.fillText(txt,r-tw/2,cy);r-=tw+(narrow?8:12);
 }
 const n=sim.overtime?Math.floor(sim.time):Math.ceil(sim.time),clock=sim.done?'0:00':Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
 const period=sim.overtime?'OT':sim.half===1?'1ST':'2ND';
 ctx.font=label+'px '+barFont;ctx.textAlign='right';
 if(!tiny||!live){ctx.fillStyle=muted;ctx.fillText(period,r,cy);r-=ctx.measureText(period).width+8}
 ctx.fillStyle=ink;ctx.fillText(clock,r,cy);r-=ctx.measureText(clock).width;
 ctx.restore();
}
// Shockwave call popup: white rings burst from the center ring, then the call pill pops in and pulses.
function drawCallout(){
 if(!sim.call||callAge>=3500)return;
 const boundaryTone=['#eef2f0','#1a201d','238,242,240'];
 const tones={Turnover:['#ff4d4d','#fff','255,77,77'],Penalty:['#ffd23f','#2a2100','255,210,63'],'Center!':['#2f8cff','#fff','47,140,255'],'Takeaway!':['#ffa31a','#2a1600','255,163,26'],'Ball Out of Bounds':boundaryTone,'No Possession Zone':boundaryTone},[bg,fg,glow]=tones[sim.call];
 const t=callAge/1000,cx=25,cy=16.2;
 ctx.save();
 for(const delay of [0,.18,.36]){
   const p=(t-delay)/1.1;if(p<0||p>1)continue;
   ctx.beginPath();ctx.arc(25,17,2*(1+8*p),0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,'+(.9*(1-p))+')';ctx.lineWidth=.4;ctx.stroke();
 }
 const k=Math.min(1,Math.max(0,(t-.1)/.4)),c1=2.6,scale=k?1+(c1+1)*Math.pow(k-1,3)+c1*Math.pow(k-1,2):0;
 if(scale>0){
   const txt=sim.call.toUpperCase();
   ctx.translate(cx,cy);ctx.scale(scale,scale);
   ctx.font='5px '+barFont;ctx.textAlign='center';ctx.textBaseline='middle';
   const textWidth=Math.min(40,ctx.measureText(txt).width);
   const w=textWidth+5,h=6;
   if(t>.6){const q=((t-.6)%2.8)/1.4,p=q>1?2-q:q;ctx.beginPath();ctx.roundRect(-w/2-1.8*p,-h/2-1.8*p,w+3.6*p,h+3.6*p,h/2+1.8*p);ctx.fillStyle='rgba('+glow+','+(.7*(1-p))+')';ctx.fill()}
   ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=2;ctx.shadowOffsetY=.6;
   ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,h/2);ctx.fillStyle=bg;ctx.fill();
   ctx.shadowColor='transparent';ctx.fillStyle=fg;ctx.fillText(txt,0,.35,textWidth);
   const {player,detail}=sim.callSub;
   const lead=player?teams[player.team]+' #'+player.jersey+' ':'';
   const name=player?.name||'';
   const tail=player?' '+detail:detail.replace(/^· /,'');
   const parts=[lead,name,tail];
   let size=1.5;
   ctx.font='600 '+size+'px Inter,system-ui,sans-serif';
   const width=parts.reduce((sum,text)=>sum+ctx.measureText(text).width,0);
   size*=Math.min(1,42/width);
   ctx.font='600 '+size+'px Inter,system-ui,sans-serif';
   const widths=parts.map(text=>ctx.measureText(text).width);
   const tw=widths.reduce((sum,w)=>sum+w,0),by=h/2+2.1,bh=size*1.9;
   ctx.beginPath();ctx.roundRect(-tw/2-1.1,by-bh/2,tw+2.2,bh,bh/2);ctx.fillStyle='rgba(10,14,12,.82)';ctx.fill();
   let x=-tw/2;
   ctx.textAlign='left';
   for(const [i,text] of parts.entries()){
     ctx.fillStyle=i===1&&player?colors[player.team]:'#fff';
     ctx.fillText(text,x,by+size*.06);
     x+=widths[i];
   }
 }
 ctx.restore();
}
// Surround outside the field: natural park grass or all-weather turf, matching the field's surface.
// The tileable textures come from tools/generate_surrounds.py; each tile covers 12 yards.
const surroundTiles={},surroundTextures={},surroundFallback={park:'#5f8a3c',turf:'#457c4d'};
function surroundPattern(surface){
 if(!surroundTextures[surface]){
   const image=surroundTextures[surface]=new Image();
   image.src=(typeof surroundImages!=='undefined'&&surroundImages[surface])||'surrounds/'+surface+'.webp';
 }
 const image=surroundTextures[surface];
 if(!surroundTiles[surface]&&image.complete&&image.naturalWidth){
   const p=surroundTiles[surface]=ctx.createPattern(image,'repeat');
   p.setTransform?.(new DOMMatrix().scaleSelf(12/image.naturalWidth));
 }
 return surroundTiles[surface]||surroundFallback[surface];
}
function drawSurround(surface){
 const v=venue.view,p=surroundPattern(surface);
 ctx.save();
 ctx.fillStyle=p;ctx.fillRect(v.x,v.y,v.width,v.height);
 ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(-.25,-.25,venue.field.width+.5,venue.field.height+.5);
 ctx.restore();
}
function drawSeated(p){
 const k=kit(p.team);
 disc(p.x,p.y,.76,k.fill,k.trim);
 ctx.save();ctx.translate(p.x,p.y);ctx.font='bold .84px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle=k.ink;ctx.fillText(p.jersey,0,0);ctx.restore();
}
// Benches sit behind each end line, one per team on each half. Coach boxes are white outlines beside a team bench.
// The home club's crest is painted at center field, under the field lines and the ring.
function drawCenterCrest(){
 const image=crestImage(matchup[0]),size=7.6;
 if(!image.complete||!image.naturalWidth)return;
 ctx.save();ctx.globalAlpha=.3;ctx.drawImage(image,center.x-size/2,center.y-size/2,size,size);ctx.restore();
}
function drawSideline(){
 const {length,depth}=venue.bench;
 ctx.save();
 for(const b of venue.benches){
   const x=b.x-depth/2+b.side*.25,y=b.y-length/2;
   ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+.18,y+.22,depth,length);
   ctx.fillStyle='#9b6a3c';ctx.fillRect(x,y,depth,length);
   ctx.fillStyle='#7a5130';for(let i=1;i<3;i++)ctx.fillRect(x+i*depth/3-.04,y,.08,length);
   ctx.fillStyle='#555d63';ctx.fillRect(x-.08,y-.12,depth+.16,.18);ctx.fillRect(x-.08,y+length-.06,depth+.16,.18);
 }
 for(const p of sim.bench)drawSeated(p);
 const size=venue.coachBox.size;
 for(const c of venue.coachBoxes){
   ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=.16;ctx.strokeRect(c.x-size/2,c.y-size/2,size,size);
   const k=kit(c.team);disc(c.x,c.y,.7,k.fill,k.trim);
   ctx.font='bold .62px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=k.ink;ctx.fillText('HC',c.x,c.y+.02);
 }
 ctx.restore();
}
// The referee: a black-and-white striped disc that works the dirt strip.
function drawReferee(){
 const r=sim.referee,rad=venue.referee.radius*1.4;
 ctx.save();
 ctx.beginPath();ctx.arc(r.x+.12,r.y+.16,rad,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fill();
 ctx.beginPath();ctx.arc(r.x,r.y,rad,0,Math.PI*2);ctx.clip();
 ctx.fillStyle='#f4f4f0';ctx.fillRect(r.x-rad,r.y-rad,2*rad,2*rad);
 ctx.fillStyle='#151515';for(let i=-3;i<=3;i+=2)ctx.fillRect(r.x+i*rad/4,r.y-rad,rad/4,2*rad);
 ctx.restore();
 ctx.beginPath();ctx.arc(r.x,r.y,rad,0,Math.PI*2);ctx.strokeStyle=r.dodging?'#ffd23f':'#111';ctx.lineWidth=r.dodging?.16:.1;ctx.stroke();
}
// Field markings are vector paths so they stay sharp at any canvas size.
function drawFieldLines(){
 ctx.save();ctx.strokeStyle=ctx.fillStyle='rgba(247,249,245,.95)';ctx.lineCap='butt';
 const line=(w,pts)=>{ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(pts[0],pts[1]);ctx.lineTo(pts[2],pts[3]);ctx.stroke()};
 ctx.lineWidth=.2;ctx.strokeRect(.1,.1,49.8,33.8);
 for(const x of [20,30])line(.2,[x,0,x,34]);
 for(const y of [12,22])line(.2,[0,y,50,y]);
 ctx.lineWidth=.25;ctx.beginPath();ctx.arc(25,17,2,0,Math.PI*2);ctx.stroke();
 for(const [x,y] of [[10,6],[40,6],[10,28],[40,28]]){ctx.beginPath();ctx.arc(x,y,.35,0,Math.PI*2);ctx.fill()}
 for(const x of [1.9,48.1])line(.22,[x,15.5,x,18.5]);
 for(const x of [14.9,35.1])for(let i=0;i<4;i++)line(.18,[x,15.5+i*.8,x,15.95+i*.8]);
 ctx.restore();
}
function draw(){const t=selectedField,view=layoutView();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=el('field').classList.contains('mobile-expanded')?'#000':'#121614';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(view.s,0,0,view.s,view.ox,view.oy);
drawSurround(t.surface);drawSideline();
const surface=fieldSurface(t);if(surface){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(surface,0,0,50,34)}else{rect(0,0,50,34,t.grass)}
drawCenterCrest();drawFieldLines();
ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 1.3px monospace';ctx.fillStyle='#acc4a3';for(let [x,y,q] of [[2,2,2],[48,2,1],[2,32,3],[48,32,4]])ctx.fillText('Q'+q,x,y);
 if(sim.impact){
   const {x,y,time}=sim.impact;
   ctx.globalAlpha=Math.min(1,time*4);
   disc(x,y,1.75-time,'#bf7f4a','#ffe0a0');
   ctx.globalAlpha=1;
 }
 drawReferee();
 if(sim.contact){let {p,d}=sim.contact;disc((p.x+d.x)/2,(p.y+d.y)/2,1.6,"#a58038","#ffe27d")}
 const showStamina=el('pregame').hidden&&!sim.done&&statsMode!=='half';
 const ballCarrier=showStamina?sim.ballCarrier():null;
 for(const p of sim.players)if(!p.sidelined){
   ctx.globalAlpha=p.subbing?.6:1;drawPlayer(p);ctx.globalAlpha=1;
   if(showStamina)drawStamina(p,ballCarrier);
 }
 const ball=sim.ball();if(ball)drawBall(ball);
 drawCallout();
 drawThinBar(view);
 const share=(values)=>{let total=values[0]+values[1];return total?Math.round(100*values[0]/total)+'% / '+Math.round(100*values[1]/total)+'%':'—'};
 el('control').textContent='Current possession '+Math.floor(sim.posAge/60)+':'+String(Math.floor(sim.posAge)%60).padStart(2,'0')+' · '+teams.join(' / ')+' · Possession '+share(sim.possession)+' · Runway ball control '+share(sim.runway);
 el('points').textContent=sim.score.join(' – ');el('clock').textContent=sim.done?'FULL TIME':statsMode==='half'?'HALFTIME':stamp(sim)+' · '+teams[sim.team]+(sim.urgent?' · Hurry-up':sim.conservative?' · Protecting lead':'')+(sim.press?' · '+teams[1-sim.team]+' pressing':'');el('toggle').textContent=sim.done?'Full time':playing?'Pause':'Resume';el('toggle').disabled=sim.done||!el('pregame').hidden;el('bar-toggle').textContent=el('toggle').textContent;el('bar-toggle').disabled=el('toggle').disabled}
const statKeys=['min','pts','att','cmp','rec','tc','int','tkl','fum','to','pen','pbu','drp','hit'];
const statLabels=['Minutes played','Points','Pass attempts','Completions','Receptions','Throwing Centers','Interceptions',
  'Tackles','Fumbles','Turnovers','Penalties','Passes broken up','Drops','Big hits'];
const positions={Heaver:'H',Runner:'R',Anchor:'A'};
const cells=values=>values.map(n=>'<td>'+n+'</td>').join('');
function snapshot(){
 // Minutes are whole game-clock minutes on the field; the team total rounds the summed seconds once.
 const rows=teams.map((_,team)=>roster().filter(p=>p.team===team).map(p=>({...p,stats:{...p.stats,min:Math.round(p.stats.sec/60)}})));
 const totals=rows.map(roster=>Object.fromEntries(statKeys.map(k=>[k,k==='min'?Math.round(roster.reduce((sum,p)=>sum+p.stats.sec,0)/60):roster.reduce((sum,p)=>sum+p.stats[k],0)])));
 const possession=sim.possession.reduce((a,b)=>a+b,0);
 const share=sim.possession.map(n=>possession?Math.round(n/possession*100)+'%':'—');
 const average=sim.stints.map(a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length)+'s':'—');
 return {rows,totals,share,average,score:sim.score.slice()};
}
function playerTable(data){
 return '<thead><tr><th scope="col">Player</th><th scope="col" class="position"><abbr title="Position">POS</abbr></th>'+
   statKeys.map((k,i)=>'<th scope="col"><abbr title="'+statLabels[i]+'">'+k.toUpperCase()+'</abbr></th>').join('')+'</tr></thead>'+
   teams.map((name,i)=>'<tbody><tr><th scope="row" colspan="2">'+name+'</th>'+cells(statKeys.map(k=>data.totals[i][k]))+'</tr>'+
     data.rows[i].map(p=>'<tr><th scope="row">#'+p.jersey+' <span style="color:'+colors[p.team]+'">'+p.name+'</span></th>'+
       '<td class="position"><abbr title="'+p.role+'" aria-label="'+p.role+'">'+positions[p.role]+'</abbr></td>'+
       cells(statKeys.map(k=>p.stats[k]))+'</tr>').join('')+'</tbody>').join('');
}
function renderHighlights(){
 if(!el('highlights').open||shownHighlights===sim.highlights.length)return;
 shownHighlights=sim.highlights.length;
 const scoringOnly=el('highlight-filter').value==='scoring';
 const entries=sim.highlights.slice().reverse().filter(entry=>!scoringOnly||entry.points);
 const output=entries.map(entry=>{
   const row=document.createElement('li'),time=document.createElement('time');
   const title=document.createElement('strong'),summary=document.createElement('span');
   time.textContent=stamp(entry);
   title.className='t'+entry.team;
   title.textContent=teams[entry.team]+' '+entry.player;
   summary.textContent=entry.summary+(entry.points?' · +'+entry.points+' · '+entry.score.join(' – '):'');
   row.append(time,title,summary);
   return row;
 });
 el('highlight-list').replaceChildren(...output);
 el('highlight-empty').textContent=entries.length?'':scoringOnly?'No scoring plays yet.':'No highlights yet.';
}
el('highlights').ontoggle=renderHighlights;
el('highlight-filter').onchange=()=>{shownHighlights=-1;renderHighlights()};
function renderBox(){
 if(!el('box').open||!boxDirty)return;
 const data=snapshot();
 el('statlines').innerHTML=playerTable(data);
 el('posavg').textContent='Average possession · '+teams.map((name,i)=>name+' '+data.average[i]).join(' / ');
 boxDirty=false;
}
function teamTable(data){
 const stats=data.totals, pick=k=>stats.map(row=>row[k]);
 const summary=[
   ['Points',data.score],['Passing',stats.map(t=>t.cmp+' / '+t.att+(t.att?' ('+Math.round(100*t.cmp/t.att)+'%)':''))],
   ['Possession',data.share],['Average possession',data.average],['Tackles',pick('tkl')],['Interceptions',pick('int')],
   ['Passes broken up',pick('pbu')],['Big hits',pick('hit')],['Fumbles',pick('fum')],['Turnovers',pick('to')],['Penalties',pick('pen')]
 ];
 return '<thead><tr><th scope="col">Stat</th><th scope="col" class="t0">'+teams[0]+'</th><th scope="col" class="t1">'+teams[1]+'</th></tr></thead>'+
   '<tbody>'+summary.map(([label,values])=>'<tr><th scope="row">'+label+'</th>'+cells(values)+'</tr>').join('')+'</tbody>';
}
function leadersTable(data){
 const leaders=[['Points','pts'],['Completions','cmp'],['Receptions','rec'],['Tackles','tkl'],['Interceptions','int']];
 function names(roster,key){
   const high=Math.max(...roster.map(p=>p.stats[key]));
   return high?roster.filter(p=>p.stats[key]===high).map(p=>'#'+p.jersey+' <span style="color:'+colors[p.team]+'">'+p.name+'</span>').join(', ')+' · '+high:'—';
 }
 return '<thead><tr><th scope="col">Stat</th><th scope="col" class="t0">'+teams[0]+'</th><th scope="col" class="t1">'+teams[1]+'</th></tr></thead>'+
   '<tbody>'+leaders.map(([label,key])=>'<tr><th scope="row">'+label+'</th>'+cells(data.rows.map(roster=>names(roster,key)))+'</tr>').join('')+'</tbody>';
}
function showStatsPage(second){
 statsPage=second?1:0;
 const half=statsMode==='half';
 const detail=half?'Stat leaders':'Individual box score';
 el('stats-team').hidden=second;
 el('stats-leaders').hidden=!second||!half;
 el('stats-players').hidden=!second||half;
 el('stats-page').textContent=second?(half?'First-half stat leaders':detail):'Team stats';
 el('stats-next-label').textContent=second?'Team stats':detail;
 el('stats-arrow').textContent=second?'←':'→';
}
function showStats(mode,data,now){
 statsMode=mode;frozenTime=null;
 const half=mode==='half';
 statsDeadline=half?now+halftimeDuration:0;
 el('stats-title').textContent=half?'Halftime':'Final box score';
 el('stats-score').textContent=data.score.join(' – ');
 el('stats-team').innerHTML=teamTable(data);
 if(half)el('stats-leaders').innerHTML=leadersTable(data);
 else el('stats-lines').innerHTML=playerTable(data);
 el('stats-dismiss').textContent=half?'Start second half':'Close';
 el('stats-freeze').hidden=!half;
 el('stats-freeze').textContent='Freeze';
 el('stats-freeze').setAttribute('aria-pressed','false');
 el('stats-time').hidden=!half;
 if(half)updateStatsTime(now);
 showStatsPage(false);
 if(!el('match-stats').open)el('match-stats').showModal();
}
function closeStats(){
 if(el('match-stats').open)el('match-stats').close();
 statsMode=null;frozenTime=null;
}
function updateStatsTime(now){
 const message=frozenTime===null?'Second half starts in '+Math.max(0,Math.ceil((statsDeadline-now)/1000))+'s':'Halftime countdown frozen';
 if(el('stats-time').textContent!==message)el('stats-time').textContent=message;
}
function dismissStats(){
 if(statsMode==='half'){wall=performance.now();carry=0}
 closeStats();
}
el('stats-next').onclick=()=>showStatsPage(!statsPage);
el('stats-dismiss').onclick=dismissStats;
el('match-stats').addEventListener('cancel',event=>{event.preventDefault();dismissStats()});
el('stats-freeze').onclick=()=>{
 const now=performance.now();
 advance(now);
 if(statsMode!=='half')return;
 if(frozenTime===null)frozenTime=Math.max(0,statsDeadline-now);
 else{statsDeadline=now+frozenTime;frozenTime=null}
 const frozen=frozenTime!==null;
 el('stats-freeze').textContent=frozen?'Resume countdown':'Freeze';
 el('stats-freeze').setAttribute('aria-pressed',String(frozen));
 updateStatsTime(now);
};
el('final-box').onclick=()=>showStats('final',finalStats,performance.now());

function advance(now){
 if(!playing||sim.done){wall=now;return}
 // Keep real time in reserve when the browser throttles or suspends the tab.
 let steps=2400;
 while(wall<now&&steps>0&&!sim.done){
   if(statsMode==='half'){
     if(frozenTime!==null||now<statsDeadline){wall=now;updateStatsTime(now);return}
     wall=Math.max(wall,statsDeadline);
     closeStats();
   }
   if(wall<breakUntil){wall=Math.min(now,breakUntil);continue}
   const stepTime=(fixedStep-carry)*1000/speed;
   if(wall+stepTime>now){
     carry+=(now-wall)*speed/1000;wall=now;break;
   }
   wall+=stepTime;carry=0;steps--;
   const tackles=sim.tackleEvents,calls=sim.callEvents,scores=sim.scoreEvents,penalties=sim.penaltyEvents,stoppages=sim.stoppageEvents,priorHalftime=sim.halftime;
   tackleBreak=false;sim.step(fixedStep);
   if(sim.callEvents!==calls)callAge=0;
   if(sim.done){
     finalStats=snapshot();
     el('final-box').hidden=false;
     showStats('final',finalStats,wall);
   }else if(sim.halftime&&!priorHalftime)showStats('half',snapshot(),wall);
   else if(sim.penaltyEvents!==penalties)breakUntil=wall+penaltyDuration;
   else if(sim.scoreEvents!==scores)breakUntil=wall+scoringDuration;
   else if(sim.stoppageEvents!==stoppages)breakUntil=wall+stoppageDuration;
   else if(sim.tackleEvents!==tackles){breakUntil=wall+tackleDuration;tackleBreak=true}
 }
}
function scheduleBackground(){
 clearTimeout(backgroundTimer);
 if(document.hidden&&playing&&!sim.done){
   backgroundTimer=setTimeout(()=>{
     const now=performance.now();
     advance(now);
     scheduleBackground();
   },750);
 }
}
let lastDrawKey='';
function frame(){
 if(!document.hidden){
   const now=performance.now();
   // The popup clock only runs during playback, so a paused game keeps the call on screen.
   if(playing&&statsMode!=='half')callAge+=now-lastFrame;lastFrame=now;
   // A drawing error must never stop the animation loop, or the field freezes while the log keeps going.
   try{
     advance(now);
     // While nothing on the field can change (paused, halftime screen, idle pregame), skip the redraw to save battery.
     const image=fieldImage(selectedField),key=[sim.players.reduce((a,p)=>a+p.x*3.1+p.y,0).toFixed(3),playing,statsMode,frozenTime,sim.time,sim.posAge,sim.done,sim.half,sim.callEvents,selectedField.id,image.complete,typeof surroundPattern(selectedField.surface),matchup.map(c=>c.id+crestImage(c).complete+markImage(c).complete).join(),clubField,
       canvas.clientWidth,canvas.clientHeight,window.devicePixelRatio,el('field').className,el('pregame').hidden].join('|');
     if(playing||key!==lastDrawKey){draw();lastDrawKey=key}
     if(sim.subEvents!==shownSubs){rosterOptions();boxDirty=true}
     renderBox();renderHighlights();
   }catch(e){console.error(e)}
   if(now<breakUntil&&!sim.done)el('clock').textContent=stamp(sim)+(sim.penaltyPending?' · Penalty · free run lane pending':sim.stoppagePending?' · Stoppage':tackleBreak?' · Tackle':' · Scoring break');
 }
 requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
 advance(performance.now());
 scheduleBackground();
});
const field=el('field'), expand=el('expand');
const mobileScreen=matchMedia('(pointer: coarse), (max-width: 760px)');
function fullscreenElement(){
 return document.fullscreenElement||document.webkitFullscreenElement;
}
function fieldMode(on,mobile=false){
 field.classList.toggle('expanded',on);
 field.classList.toggle('mobile-expanded',on&&mobile);
 expand.textContent=on?'Exit':'Full screen';
 expand.setAttribute('aria-label',on?'Exit full screen':'Full screen');
 expand.setAttribute('aria-pressed',String(on));
}
expand.onclick=async()=>{
 if(field.classList.contains('expanded')){
   if(fullscreenElement()){
     if(document.exitFullscreen)await document.exitFullscreen();
     else document.webkitExitFullscreen?.();
   }else fieldMode(false);
   return;
 }
 const mobile=mobileScreen.matches;
 const target=mobile?document.documentElement:field;
 fieldMode(true,mobile);
 if(mobile)field.scrollIntoView({block:'start'});
 try{
   if(target.requestFullscreen)await target.requestFullscreen();
   else target.webkitRequestFullscreen?.();
 }catch{/* The viewport layout also works when native fullscreen is unavailable. */}
 if(mobile){
   if(field.classList.contains('mobile-expanded'))field.scrollIntoView({block:'start'});
 }else{
   try{await screen.orientation?.lock?.('landscape')}catch{/* Some browsers disallow orientation lock. */}
 }
};
function syncFullscreen(){
 if(!fullscreenElement())fieldMode(false);
 else if(field.classList.contains('mobile-expanded'))field.scrollIntoView({block:'start'});
}
document.addEventListener('fullscreenchange',syncFullscreen);
document.addEventListener('webkitfullscreenchange',syncFullscreen);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!fullscreenElement())fieldMode(false);
});
el('toggle').onclick=()=>{
 const now=performance.now();
 advance(now);
 playing=!playing;wall=now;
 scheduleBackground();
};el('fresh').onclick=()=>{
 fresh();
 window.scrollTo(0,0);
 el('start').focus({preventScroll:true});
};
el('roster').onchange=scout;fresh();requestAnimationFrame(frame);

window.heaveballReady=true;
}
