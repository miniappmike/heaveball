const fieldTemplates=[
 {id:'park-red',name:'Park · red clay',surface:'park',grass:'#3c7139',stripe:'#447a3e',runway:'#47823f',center:'#36713d',zone:'#9c503a'},
 {id:'park-tan',name:'Park · tan clay',surface:'park',grass:'#3c6a35',stripe:'#43743a',runway:'#4c8a44',center:'#3b7436',zone:'#c9a96b'},
 {id:'park-brown',name:'Park · brown clay',surface:'park',grass:'#3d6e33',stripe:'#467a39',runway:'#6b934a',center:'#3b773c',zone:'#987658'},
 {id:'turf-tan',name:'All-weather · tan',surface:'turf',grass:'#377944',stripe:'#3c8249',runway:'#346d3c',center:'#478c4d',zone:'#a9906d'},
 {id:'turf-red',name:'All-weather · red',surface:'turf',grass:'#33964d',stripe:'#3a9d51',runway:'#779b48',center:'#85ad40',zone:'#aa5b49'}
];

if(!window.heaveballReady){
const el=id=>document.getElementById(id),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),colors=['#ff805d','#69bafa'];
const fixedStep=.04,halftimeDuration=15000,scoringDuration=5000,penaltyDuration=3000,stoppageDuration=2000;
let sim,playing=false,carry=0,wall=performance.now(),speed=1,backgroundTimer=0;
let statsMode=null,statsPage=0,statsDeadline=0,frozenTime=null,finalStats=null;
function stamp(s){let n=s.overtime?Math.floor(s.time):Math.ceil(s.time);return (s.overtime?'OT':'H'+s.half)+' · '+Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
let boxDirty=true,breakUntil=0,shownHighlights=-1;
function report(s,msg){boxDirty=true;let row=document.createElement('p'),t=document.createElement('time');t.textContent=stamp(s)+'  ';row.append(t,msg);el('feed').prepend(row);if(el('feed').children.length>80)el('feed').lastChild.remove()}
function scout(){let p=sim.players[+el('roster').value],h=Math.round(p.height);el('build').textContent=p.role+' · '+Math.floor(h/12)+'′'+h%12+'″ · '+Math.round(p.weight)+' lb';el('cards').replaceChildren(...traits.map((name,i)=>{let line=document.createElement('span'),num=document.createElement('b');num.textContent=p.ratings[i];line.append(name,num);return line}))}
function fresh(){shownHighlights=-1;closeStats();finalStats=null;el('final-box').hidden=true;wall=performance.now();breakUntil=0;boxDirty=true;el('feed').replaceChildren();sim=match(report);playing=false;carry=0;el('roster').replaceChildren(...sim.players.map((p,i)=>new Option(teams[p.team]+' #'+p.jersey+' · '+p.name,i)));scout();briefing()}
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
 // Spread model fitted on 960 simulated full matches (see summary.md, "Spread forecast").
 // Expected team points = base + own trait averages + opponent trait averages + own playbook + opponent defense + own defense tempo.
 const forecast=()=>{
   const W={base:21.59,
     own:[.012,.42,.061,.027,.045,.058,.086,-.039,.055,-.041,.142,.074],
     opp:[.06,-.077,-.085,.029,-.101,.034,-.043,-.04,-.013,-.046,-.072,-.102],
     playbook:[0,2.035,1.37,3.686,3.089],
     oppDefense:[0,4.09,-6.302,-4.576,7.715,-13.087,3.179,-1.915],
     ownDefense:[0,-2.426,-.52,.1,.234,1.337,-.046,-.307],sd:11.6};
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
   fieldset.append(legend);
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
       description.textContent=scheme.description||[...new Set(scheme.calls)].join(' · ');
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
for(const template of fieldTemplates){template.image=new Image();template.image.src='fields/'+template.id+'.jpg'}
const dirtTexture=new Image();
dirtTexture.src="dirt.png";
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
 light.addColorStop(0,'#fffce0');
 light.addColorStop(.47,'#f7d978');
 light.addColorStop(.82,'#cf8c32');
 light.addColorStop(1,'#735022');
 disc(x,y,radius,light,'#2f2816');
 const heading=Math.atan2(ball.vy||0,ball.vx||0)+.46;
 const cos=Math.cos(heading),sin=Math.sin(heading),rotation=ball.spin||0;
 ctx.lineWidth=.038;ctx.strokeStyle='#805219';
 for(const offset of [0,Math.PI/2]){
   ctx.beginPath();
   let visible=false;
   for(let i=0;i<=40;i++){
     const along=i*Math.PI/20,ax=Math.cos(along);
     const ay=Math.sin(along)*Math.cos(rotation+offset);
     const towardViewer=Math.sin(along)*Math.sin(rotation+offset);
     if(towardViewer<.04){visible=false;continue}
     const sx=x+radius*(ax*cos-ay*sin),sy=y+radius*(ax*sin+ay*cos);
     if(visible)ctx.lineTo(sx,sy);
     else ctx.moveTo(sx,sy);
     visible=true;
   }
   ctx.stroke();
 }
}
function drawPlayer(p){
 if(p.blocked>0)disc(p.x,p.y,1,"#8a7546","#f5d688");
 if(p.scramblePose&&p.scramblePose!=='dive'){
   const fall=p.scramblePose==='fall';
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.scrambleAngle||0);
   ctx.beginPath();ctx.ellipse(0,0,fall?.98:.88,fall?.48:.58,0,0,Math.PI*2);
   ctx.fillStyle=colors[p.team];ctx.fill();ctx.strokeStyle='#12271e';ctx.lineWidth=.12;ctx.stroke();
   ctx.strokeStyle='#f3dfac';ctx.lineWidth=.13;ctx.lineCap='round';ctx.beginPath();
   if(p.scramblePose==='shove'){ctx.moveTo(.25,-.30);ctx.lineTo(.90,-.72);ctx.moveTo(.25,.30);ctx.lineTo(.90,.72)}
   else{ctx.moveTo(-.55,-.26);ctx.lineTo(.55,.26)}
   ctx.stroke();ctx.restore();
 }else disc(p.x,p.y,.76,colors[p.team],'#12271e');
 ctx.save();ctx.translate(p.x,p.y);ctx.font='bold .84px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='#101c16';ctx.fillText(p.jersey,0,0);ctx.restore();
}
// Canvas layout: the canvas matches its on-screen size and the field fills it below a thin score bar.
// Inline, the canvas height follows its width; in full screen it fills the screen.
function layoutView(){
 const expanded=el('field').classList.contains('expanded'),dpr=Math.min(2,window.devicePixelRatio||1),barCss=32;
 if(!expanded){const h=Math.round(canvas.clientWidth*36/52.5)+barCss+'px';if(canvas.style.height!==h)canvas.style.height=h}
 else if(canvas.style.height)canvas.style.height='';
 const W=Math.max(1,Math.round(canvas.clientWidth*dpr)),H=Math.max(1,Math.round(canvas.clientHeight*dpr));
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
 const bar=Math.round(barCss*dpr),s=Math.min(W/52.5,(H-bar)/36);
 return {s,ox:(W-50*s)/2,oy:bar+(H-bar-36*s)/2+s,dpr,bar};
}
function drawThinBar(v){
 const w=canvas.width/v.dpr,h=v.bar/v.dpr,poss=sim.team,live=!sim.done,narrow=w<640,tiny=w<460,bw=narrow?(tiny?74:96):Math.min(150,w*.2),mid=narrow?8+bw+4:w/2;
 ctx.save();ctx.setTransform(v.dpr,0,0,v.dpr,0,0);
 let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2a2f35');g.addColorStop(1,'#111417');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#0b0d10';ctx.fillRect(0,h-1,w,1);ctx.textBaseline='middle';
 const block=(team,dir)=>{
   const x=mid+dir*4,c=team?['#0d1d38','#2f63a3']:['#3a120b','#b8452e'],x0=dir<0?x-bw:x;
   g=ctx.createLinearGradient(x0,0,x0+bw,0);g.addColorStop(dir<0?0:1,c[1]);g.addColorStop(dir<0?1:0,c[0]);
   ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x0,3,bw,h-7,4);ctx.fill();
   const sb=30,sx=dir<0?x-sb-2:x+2;
   g=ctx.createLinearGradient(0,5,0,h-6);g.addColorStop(0,'#fbfbfa');g.addColorStop(1,'#b3b7ba');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(sx,5,sb,h-11,3);ctx.fill();
   ctx.fillStyle='#121416';ctx.font='800 16px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(sim.score[team],sx+sb/2,h/2-1);
   const lx=dir<0?x0+13:x0+bw-13;if(!tiny){ctx.beginPath();ctx.arc(lx,h/2-2,8,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.14)';ctx.fill();
   ctx.setLineDash([2,1.5]);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='800 9px system-ui,sans-serif';ctx.fillText(team?'H':'E',lx,h/2-1.5)}
   ctx.fillStyle='#f4f4f0';ctx.font='800 14px system-ui,sans-serif';ctx.textAlign=dir<0?'right':'left';ctx.fillText(team?'HAR':'EMB',dir<0?sx-6:sx+sb+6,h/2-1);
   if(live&&poss===team){ctx.fillStyle='#f2d21b';ctx.fillRect(x0+2,h-4,bw-4,2)}
 };
 block(0,-1);block(1,1);
 const n=sim.overtime?Math.floor(sim.time):Math.ceil(sim.time),clock=sim.done?'0:00':Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
 ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle=sim.penaltyPending?'#ffd47d':'#f4f4f0';
 if(!narrow)ctx.fillText(sim.penaltyPending?'FREE RUN LANE':sim.done?'FINAL':teams[poss].toUpperCase()+' BALL',10,h/2-1);
 let rx=w-10;
 if(live){const secs=Math.floor(sim.posAge),txt='POSS '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');ctx.font='800 11px system-ui,sans-serif';
   const tw=ctx.measureText(txt).width+12;g=ctx.createLinearGradient(0,5,0,h-6);g.addColorStop(0,'#e0482a');g.addColorStop(1,'#9a210f');ctx.fillStyle=g;
   ctx.beginPath();ctx.roundRect(rx-tw,5,tw,h-11,3);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(txt,rx-tw/2,h/2-1);rx-=tw+10}
 ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='right';ctx.fillStyle='#f4f4f0';ctx.fillText(clock+'  '+(sim.overtime?'OT':sim.half===1?'1ST':'2ND'),rx,h/2-1);
 ctx.restore();
}
function draw(){const t=selectedField,view=layoutView();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1c2c23';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(view.s,0,0,view.s,view.ox,view.oy);
if(t.image.complete&&t.image.naturalWidth){ctx.drawImage(t.image,0,0,50,34)}else{rect(0,0,50,34,t.grass)}
ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 1.3px monospace';ctx.fillStyle='#acc4a3';for(let [x,y,q] of [[2,2,2],[48,2,1],[2,32,3],[48,32,4]])ctx.fillText('Q'+q,x,y);
 if(sim.impact){
   const {x,y,time}=sim.impact;
   ctx.globalAlpha=Math.min(1,time*4);
   disc(x,y,1.75-time,'#bf7f4a','#ffe0a0');
   ctx.globalAlpha=1;
 }
 if(sim.contact){let {p,d}=sim.contact;disc((p.x+d.x)/2,(p.y+d.y)/2,1.6,"#a58038","#ffe27d")}
 for(let p of sim.players)if(!p.sidelined)drawPlayer(p);
 drawBall(sim.ball());
 drawThinBar(view);
 const share=(values)=>{let total=values[0]+values[1];return total?Math.round(100*values[0]/total)+'% / '+Math.round(100*values[1]/total)+'%':'—'};
 el('control').textContent='Current possession '+Math.floor(sim.posAge/60)+':'+String(Math.floor(sim.posAge)%60).padStart(2,'0')+' · Ember / Harbor · Possession '+share(sim.possession)+' · Runway ball control '+share(sim.runway);
 el('points').textContent=sim.score.join(' – ');el('clock').textContent=sim.done?'FULL TIME':statsMode==='half'?'HALFTIME':stamp(sim)+' · '+teams[sim.team]+(sim.urgent?' · Hurry-up':sim.conservative?' · Protecting lead':'')+(sim.press?' · '+teams[1-sim.team]+' pressing':'');el('toggle').textContent=sim.done?'Full time':playing?'Pause':'Resume';el('toggle').disabled=sim.done||!el('pregame').hidden;el('bar-toggle').textContent=el('toggle').textContent;el('bar-toggle').disabled=el('toggle').disabled}
const statKeys=['pts','att','cmp','rec','tc','int','tkl','fum','to','pen','pbu','drp','hit'];
const statLabels=['Points','Pass attempts','Completions','Receptions','Throwing Centers','Interceptions',
  'Tackles','Fumbles','Turnovers','Penalties','Passes broken up','Drops','Big hits'];
const positions={Heaver:'H',Runner:'R',Anchor:'A'};
const cells=values=>values.map(n=>'<td>'+n+'</td>').join('');
function snapshot(){
 const rows=teams.map((_,team)=>sim.players.filter(p=>p.team===team).map(p=>({...p,stats:{...p.stats}})));
 const totals=rows.map(roster=>Object.fromEntries(statKeys.map(k=>[k,roster.reduce((sum,p)=>sum+p.stats[k],0)])));
 const possession=sim.possession.reduce((a,b)=>a+b,0);
 const share=sim.possession.map(n=>possession?Math.round(n/possession*100)+'%':'—');
 const average=sim.stints.map(a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length)+'s':'—');
 return {rows,totals,share,average,score:sim.score.slice()};
}
function playerTable(data){
 return '<thead><tr><th scope="col">Player</th><th scope="col" class="position"><abbr title="Position">POS</abbr></th>'+
   statKeys.map((k,i)=>'<th scope="col"><abbr title="'+statLabels[i]+'">'+k.toUpperCase()+'</abbr></th>').join('')+'</tr></thead>'+
   teams.map((name,i)=>'<tbody><tr><th scope="row" colspan="2">'+name+'</th>'+cells(statKeys.map(k=>data.totals[i][k]))+'</tr>'+
     data.rows[i].map(p=>'<tr><th scope="row">#'+p.jersey+' '+p.name+'</th>'+
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
   return high?roster.filter(p=>p.stats[key]===high).map(p=>'#'+p.jersey+' '+p.name).join(', ')+' · '+high:'—';
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
   const scores=sim.scoreEvents,penalties=sim.penaltyEvents,stoppages=sim.stoppageEvents,priorHalftime=sim.halftime;
   sim.step(fixedStep);
   if(sim.done){
     finalStats=snapshot();
     el('final-box').hidden=false;
     showStats('final',finalStats,wall);
   }else if(sim.halftime&&!priorHalftime)showStats('half',snapshot(),wall);
   else if(sim.penaltyEvents!==penalties)breakUntil=wall+penaltyDuration;
   else if(sim.scoreEvents!==scores)breakUntil=wall+scoringDuration;
   else if(sim.stoppageEvents!==stoppages)breakUntil=wall+stoppageDuration;
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
function frame(){
 if(!document.hidden){
   const now=performance.now();
   advance(now);draw();renderBox();renderHighlights();
   if(now<breakUntil&&!sim.done)el('clock').textContent=stamp(sim)+(sim.penaltyPending?' · Penalty · free run lane pending':sim.stoppagePending?' · Stoppage':' · Scoring break');
 }
 requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
 advance(performance.now());
 scheduleBackground();
});
const field=el('field'), expand=el('expand');
function fieldMode(on){
 field.classList.toggle('expanded',on);expand.textContent=on?'Exit':'Full screen';expand.setAttribute('aria-label',on?'Exit full screen':'Full screen');expand.setAttribute('aria-pressed',String(on));
}
expand.onclick=async()=>{
 if(field.classList.contains('expanded')){
   fieldMode(false);
   if(document.fullscreenElement)await document.exitFullscreen();
   else if(document.webkitFullscreenElement)document.webkitExitFullscreen();
 }else{
   fieldMode(true);
   try{if(field.requestFullscreen)await field.requestFullscreen();else field.webkitRequestFullscreen?.()}catch{/* The viewport layout also works in embedded browsers. */}
   try{await screen.orientation?.lock?.('landscape')}catch{/* Not every browser allows orientation lock. */}
 }
};
function syncFullscreen(){fieldMode(Boolean(document.fullscreenElement||document.webkitFullscreenElement))}
document.addEventListener('fullscreenchange',syncFullscreen);
document.addEventListener('webkitfullscreenchange',syncFullscreen);
document.addEventListener('keydown',e=>{if(e.key==='Escape')fieldMode(false)});
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
