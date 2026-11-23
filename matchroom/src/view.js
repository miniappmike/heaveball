const fieldTemplates=[
 {id:'park-red',name:'Park · red clay',surface:'park',grass:'#3c7139',stripe:'#447a3e',runway:'#47823f',center:'#36713d',zone:'#9c503a'},
 {id:'park-tan',name:'Park · tan clay',surface:'park',grass:'#3c6a35',stripe:'#43743a',runway:'#4c8a44',center:'#3b7436',zone:'#c9a96b'},
 {id:'park-brown',name:'Park · brown clay',surface:'park',grass:'#3d6e33',stripe:'#467a39',runway:'#6b934a',center:'#3b773c',zone:'#987658'},
 {id:'turf-tan',name:'All-weather · tan',surface:'turf',grass:'#377944',stripe:'#3c8249',runway:'#346d3c',center:'#478c4d',zone:'#a9906d'},
 {id:'turf-red',name:'All-weather · red',surface:'turf',grass:'#33964d',stripe:'#3a9d51',runway:'#779b48',center:'#85ad40',zone:'#aa5b49'}
];

if(!window.heaveballReady){
const el=id=>document.getElementById(id),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),colors=['#ff805d','#69bafa'];
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
function scout(){let p=roster()[+el('roster').value],h=Math.round(p.height);el('build').textContent=p.role+' · '+Math.floor(h/12)+'′'+h%12+'″ · '+Math.round(p.weight)+' lb';el('cards').replaceChildren(...traits.map((name,i)=>{let line=document.createElement('span'),num=document.createElement('b');num.textContent=p.ratings[i];line.append(name,num);return line}))}
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
function fresh(){shownHighlights=-1;closeStats();finalStats=null;el('final-box').hidden=true;wall=performance.now();breakUntil=0;callAge=Infinity;boxDirty=true;el('feed').replaceChildren();sim=match(report);playing=false;carry=0;rosterOptions();briefing()}
function briefing(){
 const average=values=>values.reduce((sum,v)=>sum+v,0)/values.length;
 const squads=teams.map((_,i)=>sim.players.filter(p=>p.team===i));
 const ratings=squads.map(rows=>traits.map((_,j)=>average(rows.map(p=>p.ratings[j]))));
 const overall=ratings.map(average);
 el('averages').innerHTML=traits.map((label,trait)=>'<li><dl class="rating-card"><dt>'+label+'</dt><dd>'+
   ratings.map((row,team)=>'<span class="rating-value '+(team?'blue':'red')+'" style="--rating:'+row[trait]+'%">'+
     '<span class="sr-only">'+teams[team]+' </span>'+row[trait].toFixed(1)+'</span>').join('')+'</dd></dl></li>').join('');
 el('ember-overall').textContent=overall[0].toFixed(1);
 el('harbor-overall').textContent=overall[1].toFixed(1);
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
   const win=.5*(1+erf(Math.abs(edge)/(W.sd*Math.SQRT2)));
   el('spread').textContent=margin?teams[edge>0?0:1]+' −'+margin:'Pick’em';
   el('spread-detail').textContent=(margin?teams[edge>0?0:1]+' win '+Math.round(win*100)+'%':'50/50')+' · Total '+(Math.round((points[0]+points[1])*2)/2);
 };
 forecast();
 const options=teams.map((name,team)=>{
   const fieldset=document.createElement('fieldset'),legend=document.createElement('legend');
   fieldset.className='tactic-team';
   legend.className=team?'blue':'red';
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
fieldPicker.addEventListener('change',()=>{selectedField=fieldTemplates.find(t=>t.id===fieldPicker.value)||fieldTemplates[0];try{localStorage.setItem('heaveball-field',selectedField.id)}catch{}});
// Field textures load on first use. The build may embed the default one so the page draws without sibling files.
function fieldImage(template){
 if(!template.image){template.image=new Image();template.image.src=(typeof fieldImages!=='undefined'&&fieldImages[template.id])||'fields/'+template.id+'.webp'}
 return template.image;
}
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
 disc(p.x,p.y,.76,flagged?'#ff3b3b':colors[p.team],flagged?'#fff':'#12271e');
 ctx.save();ctx.translate(p.x,p.y);ctx.font='bold .84px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 if(sim.tackled===p){ctx.beginPath();ctx.arc(0,0,.6,0,Math.PI*2);ctx.strokeStyle='#000';ctx.lineWidth=.16;ctx.stroke()}ctx.fillStyle='#101c16';ctx.fillText(p.jersey,0,0);ctx.restore();
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
// Score bar: a flat broadcast strip in the Matchroom style (dark card, Bebas Neue, shield crests, mint accent).
const barFont='"Bebas Neue","Oswald","Arial Narrow",Impact,sans-serif';
document.fonts?.load?.('20px "Bebas Neue"').catch(()=>{});
function shield(x,y,w,h,team){
 ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w,y+h*.14);ctx.lineTo(x+w,y+h*.62);ctx.lineTo(x+w/2,y+h);ctx.lineTo(x,y+h*.62);ctx.lineTo(x,y+h*.14);ctx.closePath();
 const g=ctx.createLinearGradient(x,y,x+w,y+h);
 if(team){g.addColorStop(0,'#8fd0ff');g.addColorStop(1,'#2f63a3')}else{g.addColorStop(0,'#ff9c7f');g.addColorStop(1,'#b8452e')}
 ctx.fillStyle=g;ctx.fill();
 ctx.fillStyle='#fff';ctx.font=Math.round(h*.62)+'px '+barFont;ctx.textAlign='center';ctx.fillText(team?'H':'E',x+w/2,y+h*.5);
}
function drawThinBar(v){
 const w=canvas.width/v.dpr,h=v.bar/v.dpr,poss=sim.team,live=!sim.done,narrow=w<640,tiny=w<440,mid=narrow?null:w/2;
 const ink='#f2f5f3',muted='#99a49d',mint='#2fe39a',teamInk=['#ff7f5c','#5db4ff'];
 ctx.save();ctx.setTransform(v.dpr,0,0,v.dpr,0,0);ctx.textBaseline='middle';
 ctx.fillStyle='#171c19';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(0,h-1,w,1);
 const cy=h/2+1,big=Math.round(h*.68),label=Math.round(h*.46),pad=narrow?10:16;
 // Center group: crest, abbreviation, score, divider, score, abbreviation, crest.
 ctx.font=big+'px '+barFont;
 const scoreW=Math.max(ctx.measureText(String(sim.score[0])).width,ctx.measureText(String(sim.score[1])).width,ctx.measureText('00').width);
 ctx.font=label+'px '+barFont;const abbrW=ctx.measureText('HAR').width;
 const crestW=tiny?0:h*.5,gap=narrow?6:9,bw=scoreW+16,dash=narrow?9:11;
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
 ctx.textAlign='right';ctx.fillText('EMB',lpc-bw/2-7,cy);
 ctx.textAlign='left';ctx.fillText('HAR',rpc+bw/2+7,cy);
 if(!tiny){
   const ch=h*.62,cw=crestW;
   shield(lpc-bw/2-7-abbrW-gap-cw,(h-ch)/2,cw,ch,0);
   shield(rpc+bw/2+7+abbrW+gap,(h-ch)/2,cw,ch,1);
 }
 // Left: possession or ruling.
 if(!narrow){
   const strategy=sim.conservative?' · RUN CLOCK':sim.urgent?' · HURRY-UP':'';
   const status=sim.penaltyPending?'FREE RUN LANE':sim.done?'FINAL':teams[poss].toUpperCase()+' BALL'+strategy;
   const maxWidth=lpc-bw/2-7-abbrW-gap-crestW-pad-20;
   if(!sim.done&&!sim.penaltyPending){ctx.beginPath();ctx.arc(pad+4,cy-1,4,0,Math.PI*2);ctx.fillStyle=teamInk[poss];ctx.fill()}
   ctx.font=label+'px '+barFont;ctx.textAlign='left';ctx.fillStyle=sim.penaltyPending?'#ffd47d':ink;
   ctx.fillText(status,pad+(sim.done||sim.penaltyPending?0:14),cy,Math.max(80,maxWidth));
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
 disc(p.x,p.y,.76,colors[p.team],'#12271e');
 ctx.save();ctx.translate(p.x,p.y);ctx.font='bold .84px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='#101c16';ctx.fillText(p.jersey,0,0);ctx.restore();
}
// Benches sit behind each end line, one per team on each half. Coach boxes are white outlines beside a team bench.
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
   disc(c.x,c.y,.7,colors[c.team],'#12271e');
   ctx.font='bold .62px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#101c16';ctx.fillText('HC',c.x,c.y+.02);
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
const image=fieldImage(t);if(image.complete&&image.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,50,34)}else{rect(0,0,50,34,t.grass)}
drawFieldLines();
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
 el('control').textContent='Current possession '+Math.floor(sim.posAge/60)+':'+String(Math.floor(sim.posAge)%60).padStart(2,'0')+' · Ember / Harbor · Possession '+share(sim.possession);
 el('points').textContent=sim.score.join(' – ');el('clock').textContent=sim.done?'FULL TIME':statsMode==='half'?'HALFTIME':stamp(sim)+' · '+teams[sim.team]+(sim.urgent?' · Hurry-up':sim.conservative?' · Protecting lead':'')+(sim.press?' · '+teams[1-sim.team]+' pressing':'');el('toggle').textContent=sim.done?'Full time':playing?'Pause':'Resume';el('toggle').disabled=sim.done||!el('pregame').hidden;el('bar-toggle').textContent=el('toggle').textContent;el('bar-toggle').disabled=el('toggle').disabled}
const statKeys=['min','pts','att','cmp','rec','tc','int','tkl','fum','to','pen','pbu','drp','hit'];
const statLabels=['Minutes played','Points','Pass attempts','Completions','Receptions','Throwing Centers','Interceptions',
  'Tackles','Fumbles','Turnovers','Penalties','Passes broken up','Drops','Big hits'];
const positions={Heaver:'H',Runner:'R',Anchor:'A'};
const cells=values=>values.map(n=>'<td>'+n+'</td>').join('');
function snapshot(){
 const rows=teams.map((_,team)=>roster().filter(p=>p.team===team).map(p=>({...p,stats:{...p.stats}})));
 const totals=rows.map(roster=>Object.fromEntries(statKeys.map(k=>[k,roster.reduce((sum,p)=>sum+p.stats[k],0)])));
 const possession=sim.possession.reduce((a,b)=>a+b,0);
 const share=sim.possession.map(n=>possession?Math.round(n/possession*100)+'%':'—');
 const average=sim.stints.map(a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length)+'s':'—');
 return {rows,totals,share,average,score:sim.score.slice()};
}
function playerStat(key,value){
 if(key!=='min')return value;
 const seconds=Math.floor(value+1e-6);
 return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}
function playerTable(data){
 return '<thead><tr><th scope="col">Player</th><th scope="col" class="position"><abbr title="Position">POS</abbr></th>'+
   statKeys.map((k,i)=>'<th scope="col"><abbr title="'+statLabels[i]+'">'+k.toUpperCase()+'</abbr></th>').join('')+'</tr></thead>'+
   teams.map((name,i)=>'<tbody><tr><th scope="row" colspan="2">'+name+'</th>'+cells(statKeys.map(k=>playerStat(k,data.totals[i][k])))+'</tr>'+
     data.rows[i].map(p=>'<tr><th scope="row">#'+p.jersey+' <span style="color:'+colors[p.team]+'">'+p.name+'</span></th>'+
       '<td class="position"><abbr title="'+p.role+'" aria-label="'+p.role+'">'+positions[p.role]+'</abbr></td>'+
       cells(statKeys.map(k=>playerStat(k,p.stats[k])))+'</tr>').join('')+'</tbody>').join('');
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
   title.className=entry.team?'blue':'red';
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
 return '<thead><tr><th scope="col">Stat</th><th scope="col" class="red">Ember</th><th scope="col" class="blue">Harbor</th></tr></thead>'+
   '<tbody>'+summary.map(([label,values])=>'<tr><th scope="row">'+label+'</th>'+cells(values)+'</tr>').join('')+'</tbody>';
}
function leadersTable(data){
 const leaders=[['Points','pts'],['Completions','cmp'],['Receptions','rec'],['Tackles','tkl'],['Interceptions','int']];
 function names(roster,key){
   const high=Math.max(...roster.map(p=>p.stats[key]));
   return high?roster.filter(p=>p.stats[key]===high).map(p=>'#'+p.jersey+' <span style="color:'+colors[p.team]+'">'+p.name+'</span>').join(', ')+' · '+high:'—';
 }
 return '<thead><tr><th scope="col">Stat</th><th scope="col" class="red">Ember</th><th scope="col" class="blue">Harbor</th></tr></thead>'+
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
   const second=Math.ceil(sim.time);
   tackleBreak=false;sim.step(fixedStep);
   if(Math.ceil(sim.time)!==second)boxDirty=true;
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
     const image=fieldImage(selectedField),key=[sim.players.reduce((a,p)=>a+p.x*3.1+p.y,0).toFixed(3),playing,statsMode,frozenTime,sim.time,sim.posAge,sim.done,sim.half,sim.callEvents,selectedField.id,image.complete,typeof surroundPattern(selectedField.surface),
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
