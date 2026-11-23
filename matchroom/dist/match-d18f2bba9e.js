const rand=Math.random, clamp=(n,a,b)=>Math.min(b,Math.max(a,n)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const tackling=11;
const traits=['Arm Strength','Throw Accuracy','Strength','Speed','Jump','Hands','Reaction','Discipline','IQ','Kicking','Agility','Tackling'];
const teams=['Ember','Harbor'], names=['Reed','Ellis','Cruz','Park','Quinn','Cole','Lee','Lane','Silva','Hart','Fox','West','Shaw','Bell','Khan','Avery','Gale','Lowe','Page','Frost'];
const center={x:25,y:17}, blue=p=>Math.abs(p.x-25)<=5&&Math.abs(p.y-17)<=5;
const ringRadius=2;
const ringLimit=3;
const LAPSE=.058,DIRT_SLIP=.7,RING_CLEAR=1.75,BACK_BLOCK=.0011;
const pileStallLimit=4.5;
const pileProgressYards=.65;
const pileLossYards=1.25;
const handPassSpeed=rating=>1.5*.98*(8+rating*.12);
const playbooks=[
   {name:'Patient passing',blurb:'Methodical ball movement that wears a defense down',description:'Pros: protects the ball, controls possession and makes the defense defend repeated reads. Cons: creates fewer chances, can stall against pressure and may run out of time when trailing.',baseline:.45,hold:.88,risk:1.05,runBias:-.07,calls:['Short outlets','Far switch','Block away']},
   {name:'Balanced',blurb:'Even mix of runs and throws that keeps defenses guessing',description:'Pros: answers most coverages and mixes passing, blocks and runs without a clear tell. Cons: has no single dominant pressure point and depends heavily on good reads.',baseline:.50,hold:1,risk:1,runBias:0,calls:['Far switch','Drive and kick','Anchor leak','Last-step handoff','Quick swing']},
   {name:'Runway power',blurb:'Downhill runs behind big Anchor blocks',description:'Pros: creates direct ring chances, uses size and blocking, and punishes light fronts. Cons: produces short, physical possessions and more tackle or fumble risk against strong contain.',baseline:.72,hold:.86,risk:1,runBias:.2,calls:['Runway power','Drive and kick','Short outlets','Last-step handoff']},
   {name:'Quick swing',blurb:'Rapid-fire passes that rotate through every quadrant',description:'Pros: releases the ball quickly, stretches all four quadrants and pulls packed defenses away from the ring. Cons: adds catch and deflection chances and can be disrupted by switching coverage.',baseline:.44,hold:.8,risk:.85,runBias:-.02,calls:['Quick swing','Quick swing','Quick swing','Far switch']},
   {name:'Free flow',blurb:'Improvised attack that lets athletes hunt open space',description:'Pros: stays unpredictable, lets athletes attack space and can change the point of attack mid-possession. Cons: is volatile, asks for fast shared reads and can create spacing mistakes or turnovers.',baseline:.60,hold:.83,risk:1.05,runBias:.07,calls:['Drive and kick','Quick swing','Anchor leak','Block away','Last-step handoff']}
 ];
const defenses=[
 {name:'Balanced',blurb:'Sound marking with help always waiting at the ring',description:'Pros: has help at the ring and sound receiver matches with few obvious weaknesses. Cons: does not fully erase elite runners, stars or rapid ball movement.',guards:2,depth:4.6,width:2.7,shade:.38,cushion:1.6,read:1},
 {name:'Ring guard',blurb:'Three defenders wall off the ring',description:'Pros: makes ring scores extremely difficult and creates defensive points with athletic tacklers. Cons: concedes outlets, lowers its own possession share and makes offensive chances scarce; opponents must patiently dissect it.',guards:3,depth:3.05,width:1.45,shade:.57,cushion:1.95,read:1.1,deflect:.12,tackle:.18,takeaway:.07,swingWeak:.06,ownTempo:.25,ownRisk:1.8,ownRun:-.32,ownCreation:.35},
 {name:'Receiver denial',blurb:'Tight coverage that takes away easy catches',description:'Pros: smothers eligible receivers, lowers easy completions and forces carriers to hold or run. Cons: leaves only one ring helper and is vulnerable to blocks, handoffs and athletic mismatches.',guards:1,depth:3.4,width:1.6,shade:.12,cushion:1.45,read:.9,deflect:.025,runWeak:.08},
 {name:'Star focus',blurb:'Extra attention on the other side\'s best playmakers',description:'Pros: keeps the ball away from the best Runner and Heaver and brackets the star nearest the play. Cons: secondary players and far-side outlets get better chances, especially after quick reversals.',guards:1,depth:3.7,width:1.8,shade:.22,cushion:1.6,read:.92,stars:true,swingWeak:.04},
 {name:'Passing-lane zone',blurb:'Defenders read the throw and jump passing lanes',description:'Pros: produces tips and interceptions by crowding anticipated throwing lanes. Cons: short outlets, patient overloads and quick swings can open seams between zones.',guards:2,depth:5.9,width:3.3,shade:.49,cushion:1.8,read:.87,lanes:true,deflect:.12,takeaway:.04,swingWeak:.03,laneStep:.05,laneReach:.5},
 {name:'Carrier pressure',blurb:'An all-out press on the ball, gambling for turnovers',description:'Pros: shortens reads, forces hurried throws and can create immediate turnovers. Cons: a clean outlet or handoff beats the press and leaves less help at the ring.',guards:1,depth:6.8,width:2.1,shade:.29,cushion:2.8,read:.95,press:true,rush:.20,runWeak:.06,rushRead:3.2,pressGap:1.9},
 {name:'Runway contain',blurb:'Seals the runway and funnels runners into tacklers',description:'Pros: funnels runs into tacklers and is strongest against power attacks and direct ring drives. Cons: gives up deeper quadrant outlets and can be stretched by disciplined passing.',guards:3,depth:4.6,width:2.9,shade:.39,cushion:1.5,read:1,contain:true,tackle:.07,deflect:-.02,swingWeak:.04},
 {name:'Switch coverage',blurb:'Defenders trade assignments to stay with every cut',description:'Pros: handles cuts, blocks and quick swings without losing assignments. Cons: offers fewer aggressive takeaways and can lose power matchups or break down after a slow read.',guards:2,depth:4.75,width:2.6,shade:.25,cushion:1.55,read:.54,switches:true,deflect:-.015,tackle:-.02,swingWeak:-.09}
];
// Calibrated against a ten-yard run from rest with Speed and Agility at 60.
const fieldSecondsPerSecond=.63;
const playerSpeedMultiplier=1.02;
const ballSpeedMultiplier=.98;
// Field units are yards. Height is measured from the turf to the ball's center.
const ballRadius=.31,gravity=10.73;
// A softball-sized rubber ball on turf skips and rebounds, but sheds vertical energy quickly.
const grass={restitution:.30,grip:.28,roll:4.20};
const runwayTurf={restitution:.34,grip:.24,roll:3.05};
const dirt={restitution:.22,grip:.32,roll:4.90};
function turfAt(x,y){
 if(Math.abs(y-17)<=5)return runwayTurf;
 return Math.abs(x-25)<5?dirt:grass;
}
function arcFlight(start,end,duration,f,startHeight,endHeight,arc){
 const dx=end.x-start.x,dy=end.y-start.y;
 return {x:start.x+dx*f,y:start.y+dy*f,
   z:startHeight+(endHeight-startHeight)*f+4*arc*f*(1-f),
   vx:dx/duration,vy:dy/duration,
   vz:(endHeight-startHeight+4*arc*(1-2*f))/duration};
}
function flightAt(flight,t){
 const f=clamp(t/flight.duration,0,1);
 const startHeight=flight.startHeight??1.45,endHeight=flight.endHeight??1.4;
 let motion;
 if(flight.bounceF){
   const bounce=flight.bouncePoint,bounceF=flight.bounceF;
   if(f<=bounceF){
     const local=f/bounceF;
     motion=arcFlight(flight.start,bounce,flight.duration*bounceF,local,startHeight,ballRadius,flight.firstArc);
   }else{
     const local=(f-bounceF)/(1-bounceF);
     motion=arcFlight(bounce,flight.end,flight.duration*(1-bounceF),local,ballRadius,endHeight,flight.secondArc);
   }
 }else{
   const arc=flight.arcHeight??Math.min(flight.kicker?5.8:2.2,gravity*flight.duration**2/8);
   motion=arcFlight(flight.start,flight.end,flight.duration,f,startHeight,endHeight,arc);
 }
 motion.spin=t*(flight.kicker?21:flight.passType==='line'?24:flight.passType==='lob'?11:16);
 return motion;
}
function advanceLooseBall(ball,dt){
 const airborne=ball.z>ballRadius+1e-8||ball.vz>0;
 const groundTime=airborne?(ball.vz+Math.sqrt(ball.vz**2+2*gravity*Math.max(0,ball.z-ballRadius)))/gravity:0;
 const airTime=Math.min(dt,groundTime);
 if(airTime>0){
   const airDrag=Math.exp(-airTime*.17);
   ball.x+=ball.vx*(1-airDrag)/.17;ball.y+=ball.vy*(1-airDrag)/.17;
   ball.z=Math.max(ballRadius,ball.z+ball.vz*airTime-.5*gravity*airTime**2);
   ball.vz-=gravity*airTime;
   ball.vx*=airDrag;ball.vy*=airDrag;
   ball.spin+=ball.omega*airTime;
 }
 if(airborne&&groundTime<=dt){
   const turf=turfAt(ball.x,ball.y);
   if(noPossession(ball))ball.dirtContact={x:ball.x,y:ball.y,z:ballRadius};
   const pace=Math.hypot(ball.vx,ball.vy);
   const tangent=pace>0?clamp(ball.omega*ballRadius/pace,-1,1):0;
   const grip=1-turf.grip*(1-tangent*.36);
   ball.vx*=grip;ball.vy*=grip;
   ball.omega=ball.omega*.55+pace/ballRadius*.45;
   ball.z=ballRadius;
   const rebound=-ball.vz*turf.restitution;
   ball.vz=rebound>.46?rebound:0;
   if(ball.vz>0&&dt>airTime+1e-8){advanceLooseBall(ball,dt-airTime);return}
 }
 const rollTime=dt-airTime;
 if(rollTime>0){
   const pace=Math.hypot(ball.vx,ball.vy);
   if(pace>0){
     const resistance=turfAt(ball.x,ball.y).roll;
     const moving=Math.min(rollTime,pace/resistance);
     const distance=pace*moving-.5*resistance*moving**2;
     ball.x+=ball.vx/pace*distance;ball.y+=ball.vy/pace*distance;
     const remaining=Math.max(0,pace-resistance*moving);
     ball.vx*=remaining/pace;ball.vy*=remaining/pace;
     ball.spin+=distance/ballRadius;ball.omega=remaining/ballRadius;
   }else ball.omega=0;
 }
}
function reboundVelocity(flight,actor,nx,ny,nz,restitution){
 const length=Math.hypot(nx,ny,nz)||1;
 nx/=length;ny/=length;nz/=length;
 const vx=flight.vx-actor.vx,vy=flight.vy-actor.vy,vz=flight.vz;
 const toward=Math.min(0,vx*nx+vy*ny+vz*nz);
 const impulse=-(1+restitution)*toward;
 const outgoingX=(vx+nx*impulse)*.48+actor.vx,outgoingY=(vy+ny*impulse)*.48+actor.vy;
 const limit=Math.min(1,9.4/(Math.hypot(outgoingX,outgoingY)||1));
 return {vx:outgoingX*limit,vy:outgoingY*limit,vz:clamp((vz+nz*impulse)*.46,-7,3.1)};
}
function topSpeed(rating){return (2+rating*.055)*playerSpeedMultiplier}
function acceleration(rating){return (3+rating*.09)*playerSpeedMultiplier}
function deflectionSkill(p){
 const height=p.height-72,jump=p.ratings[4]-60,reaction=p.ratings[6]-60;
 return height*.006+jump*.0009+reaction*.0019;
}
function laneDeflection(p,pass,ambush,scheme={}){
 const gap=dist(p,pass);
 const reachHeight=p.height/36+.39+p.ratings[4]*.0115;
 if(pass.z>reachHeight)return null;
 const closing=gap?Math.max(0,((pass.x-p.x)*p.vx+(pass.y-p.y)*p.vy)/gap):0;
 // Faster players can close more ground during the time left to react.
 const timeWindow=.019+(p.ratings[6]-20)*.00055;
 const step=Math.min(.32,timeWindow*(topSpeed(p.ratings[3])*.49+closing*.51));
 const reach=.8+p.ratings[4]*.007+(p.height-72)*.012+step+(ambush?.35:0)+(scheme.laneReach||0);
 if(gap>reach)return null;
 const position=(reach-gap)*.42+Math.min(.5,reachHeight-pass.z)*.14;
 const swingEffect=pass.quickSwing?(scheme.swingWeak||0):0;
 const chance=clamp(.115+deflectionSkill(p)+position*.125+(scheme.deflect||0)-swingEffect,.025,.38);
 return {chance,priority:position+chance};
}

function ballAt(p){return {x:p.x+.53,y:p.y-.45}}
function noPossession(p){return Math.abs(p.x-25)<5&&Math.abs(p.y-17)>5}
function pathCrossesNoPossession(from,to){
 for(let step=1;step<20;step++){
   const f=step/20;
   if(noPossession({x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f}))return true;
 }
 return false;
}
function legalX(p,x){
 if(p.role==='Anchor'||p.lapse>0)return x;
 return p.side<0?Math.min(x,center.x+5):Math.max(x,center.x-5);
}
function movePlayer(p,x,y){
 p.x=legalX(p,x);p.y=y;
}
function insideRing(p){return dist(ballAt(p),center)<=ringRadius}
function guardPosition(x,y,p){
 const guardRadius=ringRadius+.8;
 let dx=x-center.x,dy=y-center.y;
 if(dx*dx+dy*dy>=guardRadius*guardRadius)return {x,y};
 let depth=Math.hypot(dx,dy);
 if(depth<.1){
   dx=p.x-center.x;dy=p.y-center.y;depth=Math.hypot(dx,dy);
   if(depth<.1){dx=p.side;dy=0;depth=1}
 }
 return {x:center.x+dx*guardRadius/depth,y:center.y+dy*guardRadius/depth};
}
function player(team,i,name){
 const role=i<4?(team===0?i<2:i>=2)?'Heaver':i===2||i===0?'Heaver':'Runner':i===4?'Runner':'Anchor';
 const ranges={Heaver:[68,76,170,220],Runner:[67,76,155,240],Anchor:[71,77,200,260]}[role];
 const [low,high,light,heavy]=ranges,h=rand(),height=low+(high-low)*(h+rand())/2,weight=light+(heavy-light)*((rand()<.5?h:rand())+rand())/2;
 const fav={Heaver:[0,1],Runner:[5,10],Anchor:[2,tackling]}[role];
 const ratings=traits.map((_,j)=>{let mode=fav.includes(j)?75:60,u=rand();return Math.round(u<(mode-20)/80?20+Math.sqrt(u*80*(mode-20)):100-Math.sqrt((1-u)*80*(100-mode)))});
 let side=i<4?([1,-1,-1,1][i]):(i<6?team*2-1:1-team*2);
 let hx=25+side*(i<4?13:i===4?17:i===5?10:i===6?7:12),hy=i<4?(i<2?7:27)+(team?1.6:-1.6):17+(i%3-1)*2;
 return {energy:1,team,i,name,role,height,weight,ratings,side,hx,hy,x:hx,y:hy,vx:0,vy:0,
   scrambleTime:0,scramblePose:null,scrambleAngle:0};
}
function match(report){
 let pool=names.slice(),players=Array.from({length:16},(_,i)=>player(i>>3,i%8,pool.splice(Math.floor(rand()*pool.length),1)[0]));
 for(const team of [0,1]){
   const available=['00',...Array.from({length:100},(_,number)=>String(number))];
   for(const athlete of players.filter(p=>p.team===team)){
     const usual=available.filter(jersey=>{
       const number=Number(jersey);
       return athlete.role==='Heaver'||(athlete.role==='Anchor'?number>=30:number<=40||(number>=80&&number<=89));
     });
     const exceptions=available.filter(n=>!usual.includes(n));
     const pool=exceptions.length&&rand()<.1?exceptions:usual;
     const jersey=pool[Math.floor(rand()*pool.length)];
     available.splice(available.indexOf(jersey),1);
     athlete.jersey=jersey;
   }
 }
 // Fit the actual integer ratings to the roster target while preserving skill order.
 const home=55+Math.floor(rand()*36);
 const away=rand()<.85?clamp(home+Math.floor(rand()*11)-5,55,90):55+Math.floor(rand()*36);
 for(const [team,target] of [home,away].entries()){
   const squad=players.filter(p=>p.team===team);
   let delta=target*squad.length*traits.length-squad.reduce((sum,p)=>sum+p.ratings.reduce((a,b)=>a+b,0),0);
   while(delta){for(const p of squad)for(let j=0;j<p.ratings.length&&delta;j++){
     const step=Math.sign(delta);if(p.ratings[j]+step>=20&&p.ratings[j]+step<=100){p.ratings[j]+=step;delta-=step}
   }}
 }
 for(const p of players)p.stats={pts:0,att:0,cmp:0,rec:0,tc:0,int:0,tkl:0,fum:0,to:0,pen:0,pbu:0,drp:0,hit:0};
 let s={tackleEvents:0,tackled:null,callEvents:0,call:null,penalized:null,scoreEvents:0,penaltyEvents:0,stoppageEvents:0,penaltyPending:false,stoppagePending:false,scramblePursuers:[],highlights:[],stints:[[],[]],posAge:0,players,score:[0,0],half:1,time:1200,overtime:false,done:false},opening=Math.floor(rand()*2),carrier,pass,age,hold,cutter,run,worth,scoringPassYards=null,scoringThrower=null,cool=0;
 let retreat=null,nextRead=0,nextOutletRead=0;
 let buildup=0, neutralUntil=0, openingCall=null, plan="", previous=null;
 let cornerReturn=null,anchorLeak=null,relay=null,blueTrap=null,swing=null;
 const intensityRoll=rand();
 const quietGame=intensityRoll<.075;
 const physicalGame=intensityRoll>=.91;
 const contactIntensity=physicalGame?1.30+(intensityRoll-.91)*2.3:.92+intensityRoll*.22;
 const hitTarget=physicalGame?14+(intensityRoll-.91)*53:9;
 let bigHits=0;
 function bigHitChance(chance){
   if(bigHits>=20)return 0;
   if(quietGame)return chance*.035;
   const elapsed=s.overtime?2400:(s.half-1)*1200+1200-s.time;
   const expected=hitTarget*elapsed/2400;
   const pace=Math.exp(clamp((expected-bigHits)*.39,-2,1.25));
   return Math.min(.72,chance*contactIntensity*pace);
 }
 // Spread two or three rescue opportunities through regulation.
 const rescueCount=rand()<.5?2:3;
 const rescueTimes=Array.from({length:rescueCount},(_,i)=>(i+.45+rand()*.3)*2200/rescueCount);
 const quadrantCenters=[{x:40,y:6},{x:10,y:6},{x:10,y:28},{x:40,y:28}];
 const nearestQuadrant=spot=>quadrantCenters.reduce((best,q,i)=>dist(q,spot)<dist(quadrantCenters[best],spot)?i:best,0);
 s.playbooks=teams.map(()=>playbooks[Math.floor(rand()*playbooks.length)]);
 s.defenses=teams.map(()=>Math.floor(rand()*defenses.length));
 const stars=teams.map((_,team)=>['Runner','Heaver'].map(role=>{
   const weights=role==='Runner'?[[3,.34],[10,.27],[5,.17],[2,.13],[8,.09]]:
     [[1,.42],[0,.29],[8,.19],[7,.10]];
   const rating=p=>weights.reduce((sum,[trait,weight])=>sum+p.ratings[trait]*weight,0);
   return players.filter(p=>p.team===team&&p.role===role).reduce((a,b)=>rating(a)>=rating(b)?a:b);
 }));
 const defensiveAssignments=new Map();
 let defenseReadAt=0,lastDefense=null;

 function goalSide(threat,gap){
   const depth=dist(threat,center);
   const fraction=depth?Math.min(1,gap/depth):0;
   return {x:threat.x+(center.x-threat.x)*fraction,y:threat.y+(center.y-threat.y)*fraction};
 }
 function lanePosition(focus,depth,shoulder){
   const distance=dist(focus,center);
   const dx=distance>.01?(focus.x-center.x)/distance:1;
   const dy=distance>.01?(focus.y-center.y)/distance:0;
   return {x:center.x+depth*dx-shoulder*dy,y:center.y+depth*dy+shoulder*dx};
 }
 function readDefense(off,focus,active,scheme){
   const selection=s.defenses[1-off];
   if(lastDefense?.off===off&&lastDefense.selection===selection&&s.posAge<defenseReadAt)return;
   if(lastDefense?.off!==off||lastDefense.selection!==selection){
     lastDefense={off,selection};
   }
   defenseReadAt=s.posAge+scheme.read;
   const oldAssignments=new Map(defensiveAssignments);
   defensiveAssignments.clear();
   const remaining=players.filter(p=>p.team!==off&&active(p)&&p!==blueTrap);
   const receivers=players.filter(p=>p.team===off&&p!==carrier&&active(p)&&!noPossession(p));
   const pair=(value,assignment)=>{
     let best=null, highest=-Infinity;
     for(const p of remaining){
       const score=value(p);
       if(score>highest){best=p;highest=score}
     }
     if(best){
       defensiveAssignments.set(best,assignment);
       remaining.splice(remaining.indexOf(best),1);
     }
     return best;
   };
   if(carrier&&(scheme.press||s.press)){
     pair(p=>p.blocked||legalX(p,carrier.x)!==carrier.x?-Infinity:
       -dist(p,goalSide(carrier,1.05))+p.ratings[3]*.025,{press:true});
   }
   // Reserve the inside help before handing out the off-ball marks.
   for(let slot=0;slot<scheme.guards;slot++){
     const shoulder=(slot-(scheme.guards-1)/2)*scheme.width;
     const spot=lanePosition(focus,scheme.depth,shoulder);
     pair(p=>-dist(p,spot)+(p.role==='Anchor'?2:0)+p.ratings[6]*.015+
       (oldAssignments.get(p)?.shoulder===shoulder?1:0)-(p.blocked?2:0),{shoulder});
   }
   const threat=q=>4.4-.27*dist(q,center)-.065*dist(q,focus)+q.ratings[5]*.028+
     (q.role==='Runner'?q.ratings[10]*.017:0)+(blue(q)?1.5:0)+(q===cutter?1:0);
   const mark=(q,extra={})=>pair(p=>{
     if(legalX(p,q.x)!==q.x)return -Infinity;
     const hold=oldAssignments.get(p)?.mark===q?(scheme.switches?.25:1.5):0;
     return -dist(p,goalSide(q,scheme.cushion))+hold+judgment(p)*1.3-(p.blocked?2:0);
   },{mark:q,...extra});
   const marked=new Set();
   if(scheme.stars){
     const available=stars[off].filter(q=>receivers.includes(q)).sort((a,b)=>threat(b)-threat(a));
     for(const q of available)if(mark(q,{star:true}))marked.add(q);
     const top=available.find(q=>marked.has(q)&&dist(q,focus)<15);
     if(top)mark(top,{star:true,bracket:true});
   }
   for(const q of receivers.sort((a,b)=>threat(b)-threat(a))){
     if(!remaining.length)break;
     if(!marked.has(q))mark(q);
   }
 }

 function defend(p,focus,off,scheme){
   const assignment=defensiveAssignments.get(p);
   const depth=dist(focus,center);
   if(assignment?.press&&carrier&&legalX(p,carrier.x)===carrier.x){
     return goalSide(carrier,run?.65:(scheme.press?scheme.pressGap??1.05:1.05));
   }
   const shoulder=assignment?.shoulder;
   const closing=carrier&&(run||blue(carrier))&&depth<13;
   const mark=p.helpTime>0&&p.helpTarget?.team===off&&!p.helpTarget.edgeTime&&
     !noPossession(p.helpTarget)&&p.helpTarget!==carrier?p.helpTarget:assignment?.mark;
   if(shoulder!==undefined||!mark||mark===carrier||mark.edgeTime>0||noPossession(mark)){
     const base=scheme.depth+2*(tendency[off].drive-.4);
     const targetDepth=closing?clamp(depth-(scheme.contain?2.2:1.25),ringRadius+.8,base+2):
       clamp(base,ringRadius+.8,Math.max(ringRadius+.8,depth*.74));
     return lanePosition(focus,targetDepth,shoulder??(p.i-3.5)*1.7);
   }
   const star=p.helpTime<=0&&assignment?.star;
   const goal=goalSide(mark,star?1:scheme.cushion+tendency[off].block*.6);
   if(star&&assignment.bracket){
     return {x:goal.x+(focus.x-mark.x)*.16,y:goal.y+(focus.y-mark.y)*.16};
   }
   const lane=lanePosition(focus,clamp(depth*.68,ringRadius+.8,8),(p.i-3.5)*1.35);
   const shade=star?.07:scheme.shade*clamp((dist(mark,center)-2)/11,0,1);
   const spot={x:goal.x+(lane.x-goal.x)*shade,y:goal.y+(lane.y-goal.y)*shade};
   // Passing-lane zone markers keep their ring-side shade and lean slightly into the throwing lane.
   if(scheme.lanes){
     const d=dist(focus,mark)||1,step=Math.min(scheme.laneStep??99,(scheme.laneCut??.26)*d);
     return {x:spot.x+(focus.x-mark.x)/d*step,y:spot.y+(focus.y-mark.y)/d*step};
   }
   return spot;
 }
 const callBias={'Short outlets':-.16,'Quick swing':-.03,'Far switch':-.05,'Block away':.02,'Anchor leak':.09,'Last-step handoff':.15,'Drive and kick':.13,'Runway power':.20};
 // IQ governs recognition. Discipline governs how reliably a player acts on that read.
 function judgment(p){return (p.ratings[8]*.56+p.ratings[7]*.44-20)/80}
 function aggression(team){
   if(urgent(team))return .95;
   if(conservative(team))return .12;
   const defensiveIdentity=defenses[s.defenses[team]];
   return clamp(s.playbooks[team].baseline+(callBias[plan]||0)+(defensiveIdentity.ownTempo||0),.10,1);
 }
 let patient=false,attackAt=90;
 // Defenders retain a fading read of each offense across possessions.
 const tendency=[{drive:.4,block:.3},{drive:.4,block:.3}];
 let reviewAt=0,bestDepth=50,lastGain=0,blockFor=null,blockAnchor=null,decoy=null;
 function nearestDefender(p,off){return players.filter(q=>q.team!==off&&!(q.edgeTime>0)).reduce((a,b)=>dist(a,p)<dist(b,p)?a:b)}
 function shortRunSupport(p){
   const depth=dist(p,center);
   if(depth<=ringRadius||depth>12||p.energy<.3)return 0;
   const dx=(center.x-p.x)/depth,dy=(center.y-p.y)/depth;
   let blockers=0,defenders=0;
   for(const q of players){
     if(q===p||q.blocked)continue;
     const x=q.x-p.x,y=q.y-p.y;
     const along=x*dx+y*dy;
     if(along<0||along>depth||Math.abs(x*dy-y*dx)>3.5)continue;
     if(q.team!==p.team)defenders++;
     else if(q.role==='Anchor')blockers++;
   }
   // An even count leaves the carrier as the extra body on a short approach.
   return blockers>0&&blockers>=defenders?blockers-defenders+1:0;
 }
 function readShape(off){
   if(swing)return;
   const depth=dist(carrier,center);
   if(depth<bestDepth-1.5){bestDepth=depth;lastGain=s.posAge}
   if(s.posAge<reviewAt)return;
   reviewAt=s.posAge+4+rand()*3;
   const entry={x:carrier.x<25?18:32,y:17};
   const laneSpace=clearance(entry,off)+(rand()-.5)*4*(1-judgment(carrier)),stalled=s.posAge-lastGain>12;
   const memory=tendency[off];
   memory.drive=.88*memory.drive+.12*(run||Math.abs(carrier.y-17)<=5?1:0);
   memory.block*=.96;
   const covered=clearance(carrier,off)<2.8;
   const circulating=circulate(off);
   if(circulating&&covered&&!run&&!retreat&&age>1&&Math.abs(carrier.y-17)>5&&Math.abs(carrier.x-25)>=5){
     readTime=Math.min(readTime,age+.85);
   }
   if(!circulating&&!conservative(off)&&!retreat&&!run&&!anchorLeak&&(!relay||relay.used)&&(stalled||covered)&&s.posAge>15){
     const lead=players[off*8+5],opponent=nearestDefender(entry,off);
     const next=laneSpace>4?'Drive and kick':lead.ratings[2]>opponent.ratings[2]+6?'Runway power':memory.block>.45?'Anchor leak':'Block away';
     if(next!==plan&&!cornerReturn){
       plan=next;
       anchorLeak=plan==='Anchor leak'
         ?{player:players.find(p=>p.team===off&&p.role==='Anchor'&&p!==carrier),released:false}
         :null;
     }
     lastGain=s.posAge;bestDepth=depth;
     if(covered)readTime=Math.min(readTime,age+3);
   }
   if(!conservative(off)&&!retreat&&!run){
     const support=shortRunSupport(carrier);
     const style=s.playbooks[off],identity=defenses[s.defenses[off]];
     const attackChance=.34+.32*judgment(carrier)+.16*(1-depth/12)+.07*(support-1)+
       (style.runBias||0)+(identity.ownRun||0);
     if(support>=(circulating?2:1)&&rand()<attackChance){
       run=true;log(carrier.name+' attacks the ring behind the blockers');
     }else if(!circulating&&laneSpace>5&&depth<12&&s.posAge>15&&
       rand()<clamp(.08+.25*aggression(off)+(identity.ownRun||0),.01,.55)){
       run=true;log(carrier.name+' attacks the open lane');
     }
   }
   const receivers=players.filter(q=>q.team===off&&q.i<5&&q!==carrier&&!noPossession(q));
   blockFor=receivers.sort((a,b)=>clearance(a,off)-clearance(b,off))[0];
   const anchors=players.filter(q=>q.team===off&&q.role==='Anchor'&&q!==carrier);
   anchors.sort((a,b)=>dist(a,blockFor||carrier)-dist(b,blockFor||carrier));
   blockAnchor=anchors[0];decoy=anchors[1];
 }

 function urgent(team){
   return !s.overtime&&s.half===2&&s.time<=300&&s.score[1-team]-s.score[team]>=5;
 }
 function conservative(team){
   return !s.overtime&&s.half===2&&s.time<=120&&s.score[team]-s.score[1-team]>=5;
 }
 function circulate(team){
   return !s.overtime&&!lane&&!urgent(team)&&!cornerReturn&&
     (conservative(team)||buildup>0&&s.posAge<neutralUntil);
 }
 function protect(team){
   return circulate(team)||!urgent(team)&&s.posAge<attackAt*(1.45-aggression(team));
 }
 let scoringRestart=null,secondHalfPending=false;
 function highlight(p,summary,points=0){
   s.highlights.push({team:p.team,player:'#'+p.jersey+' '+p.name,summary,points,
     score:points?s.score.slice():null,half:s.half,time:s.time,overtime:s.overtime});
 }
 function highlightTurnover(p,summary){
   if(s.overtime||s.half===2&&s.time<=300&&Math.abs(s.score[0]-s.score[1])<=5)highlight(p,summary);
 }
 function points(p,n,summary){
   const prior=s.score[p.team]-s.score[1-p.team];
   p.stats.pts+=n;s.score[p.team]+=n;call(n===1?'Takeaway!':'Center!');s.scoreEvents++;s.scoringSpot=ballAt(p);
   if(s.overtime)summary+=' to win in sudden death';
   else if(prior<0&&prior+n===0)summary+=' to tie the game';
   else if(prior<=0&&prior+n>0&&s.score[1-p.team]>0)summary+=' to take the lead';
   highlight(p,summary,n);
 }
 function finishStint(){if(s.team!==undefined&&s.posAge>0)s.stints[s.team].push(s.posAge);s.posAge=0}
 let loose=null,stationary=false,origin=center,lastChoice=[-1,-1],readTime=0;
 s.possession=[0,0];s.runway=[0,0];
 function spaceRoute(p,off){
   let best,score=-Infinity;
   for(let i=0;i<8;i++){
     let runway=i===0&&Math.abs(p.y-17)>5, q={x:25+p.side*((i===1?1:5.8)+rand()*17),y:runway?14+rand()*6:rand()<.5?2+rand()*9:23+rand()*9};
     let spacing=12;
     for(const mate of players)if(mate!==p&&mate.team===off)spacing=Math.min(spacing,dist(q,mate.route||mate));
     let value=Math.min(8,clearance(q,off))*.65+spacing*.8-dist(p,q)*.16+(runway?3:0)+rand()*3;
     if(value>score){score=value;best=q}
   }
   p.route=best;p.routeTime=2+rand()*3;
 }
 function spill(p,kind,x,y){
   cornerReturn=swing=null;
   loose={x,y,vx:(rand()-.5)*3,vy:(rand()-.5)*3,z:ballRadius,vz:0,spin:0,omega:0,kind,last:p.team,originTeam:p.team,responsible:p.stats?p:pass?.thrower,wait:.18,bobbles:0};
   pass=null;carrier=null;s.contact=null;pile=null;stationary=false;
 }
 let pile=null, lane=null, whistle=0, boundaryRestart=null,pendingLane=null,delayedRestart=null;
// Flag a stoppage now; the view holds playback (wall-clock, speed-independent) and the next step performs the reset.
function restartAfterPause(team,side,index){stoppage();delayedRestart={team,side,index}}
 function stoppage(){s.stoppageEvents++;s.stoppagePending=true}
 function boundaryContact(p,d){
   const sides=[
     {distance:p.x,x:-1,y:0,leverage:d.x-p.x},
     {distance:50-p.x,x:1,y:0,leverage:p.x-d.x},
     {distance:p.y,x:0,y:-1,leverage:d.y-p.y},
     {distance:34-p.y,x:0,y:1,leverage:p.y-d.y}
   ];
   return sides.filter(side=>side.distance<=5.4&&side.leverage>.22)
     .reduce((a,b)=>!a||b.distance<a.distance?b:a,null);
 }
 function tryBoundaryPush(p,d,edge,kind){
   if(!edge||p.edgeTime>0||kind==='block'&&edge.distance>4.2)return false;
   const drive=(d.vx*edge.x+d.vy*edge.y)*d.weight-(p.vx*edge.x+p.vy*edge.y)*p.weight;
   const power=(d.ratings[2]-p.ratings[2])*.0012+drive*.000045;
   const contact=clamp(.21+.055*(3.25-edge.distance)+power,.075,.44);
   const chance=contact*(kind==='pile' ? .29 : kind==='block' ? .55 : 1);
   if(rand()>=chance)return false;
   const spot={x:p.x,y:p.y};
   const exit={x:p.x+edge.x*(edge.distance+.68),y:p.y+edge.y*(edge.distance+.68)};
   p.vx=p.vy=0;
   if(kind==='block'){
     movePlayer(p,exit.x,exit.y);p.edgeTime=.55;
     log(p.name+' is pushed out of bounds off the ball by '+d.name);
   }else{
     d.stats.tkl++;p.stats.to++,call('Turnover');
     const contactText=kind==='pile'?' from the pile':'';
     log(p.name+' is pushed out of bounds'+contactText+' by '+d.name+' · turnover');
     highlightTurnover(d,'Forced a turnover by driving '+p.name+' out of bounds');
     s.contact=pile=null;
     boundaryRestart={player:p,spot,exit,team:1-p.team,index:nearestQuadrant(spot),wait:.85};
   }
   return true;
 }
 function deadNoPossession(ball,lastTeam,responsible){
   const grounded=ball.z===undefined||ball.z<=ballRadius+1e-6;
   if(!grounded||!noPossession(ball))return false;
   if(responsible?.team===lastTeam)responsible.stats.to++,call('Turnover');
   const awarded=1-lastTeam;
   log('No-possession zone · ball out of bounds · '+teams[awarded]+' quadrant reset');
   outOfBounds('Ball hits the dirt',awarded);
   restartAfterPause(awarded,undefined,nearestQuadrant(ball));
   return true;
 }
 function freeLane(team){
   s.penaltyPending=false;s.penalized=null;
   restart(team);
   const runner=players[team*8+4],side=runner.side;
   const anchor=players[team*8+5],primary=players[(1-team)*8+6],help=players[(1-team)*8+7];
   for(const [p,depth,y] of [[runner,23,17],[anchor,13.5,20],[primary,8,17],[help,11,20]]){
     p.x=p.hx=center.x+side*depth;p.y=p.hy=y;
   }
   lane={anchor,primary,help,blockAttempted:false,challenged:false,grip:null};
   buildup=0;assign(runner);run=true;stationary=false;whistle=hold;hold=0;
   log(teams[team]+' takes a free run lane · '+anchor.name+' leads the block, '+primary.name+' has the one-on-one');
 }
 function laneBlock(p,help){
   if(lane.blockAttempted||dist(p,help)>=1.65)return;
   lane.blockAttempted=true;
   const power=p.ratings[2]-help.ratings[2];
   if(rand()<clamp(.76+power*.006,.40,.94)){
     help.screened=help.blocked=clamp(3.1+power*.027,2.1,4.1);
     log(p.name+' blocks '+help.name+' out of the lane');
   }else log(help.name+' slips '+p.name+'’s block');
 }
 function tackleLane(p,d){
   lane.challenged=true;
   const {form,strength,drive,impact}=contactMatchup(p,d);
   const balance=p.ratings[10]-d.ratings[10];
   const lungeChance=clamp(.43+(form-d.ratings[2])*.005+(impact-3)*.07,.20,.75);
   if(rand()<lungeChance){
     log(d.name+' lunges to stop '+p.name+' at the spot');
     const finish=clamp(.24+(form-65)*.004+strength*.002+drive*.05-balance*.003,.09,.53);
     if(rand()<finish){showImpact(p,d);stopCarrier(p,d);return}
     log(p.name+' stays up through the lunge');
   }else{
     log(d.name+' grabs for '+p.name+' to wait for help');
     const holdChance=clamp(.66+(form-65)*.004+strength*.004+drive*.06-balance*.003,.32,.88);
     if(rand()<holdChance){
       lane.grip={d,left:clamp(2.2+strength*.027+(form-65)*.018-balance*.02,1,3.8),x:d.x-p.x,y:d.y-p.y};
       s.contact={p,d};p.jukeTime=0;p.vx*=.22;p.vy*=.22;
       log(d.name+' holds up '+p.name+' · waiting for help');
       return;
     }
     log(p.name+' slips the grab');
   }
   d.blocked=1.15;
 }
 function advanceLaneGrip(p,dt){
   const grip=lane.grip,helper=grip.d===lane.primary?lane.help:lane.primary;
   movePlayer(grip.d,p.x+grip.x,p.y+grip.y);
   if(!helper.blocked&&dist(helper,p)<1.55){
     log(helper.name+' joins '+grip.d.name+' to finish the tackle');
     stopCarrier(p,grip.d);
     return;
   }
   grip.left-=dt;
   if(grip.left<=0||dist(grip.d,center)<ringRadius){
     lane.grip=s.contact=null;
     grip.d.blocked=1.05;
     log(p.name+' breaks free before help arrives');
   }
 }
 function penalize(p,why){
   p.stats.pen++;log('Penalty · '+p.name+' '+why);
   pendingLane=1-p.team;s.penaltyEvents++;s.penaltyPending=true;s.penalized=p;call('Penalty');
   s.contact=pile=null;
 }
 // Restricted play: a non-Anchor past their own half's edge of the center zone, or a carrier holding the ball on the dirt.
 function restrictedPenalty(active,dt){
   if(lane)return false;
   // A carrier working the dirt edge can drift a step onto it; low IQ and Discipline make it likelier.
   if(carrier&&!carrier.sidelined&&!pile&&Math.abs(carrier.x-center.x)<6.5&&Math.abs(carrier.y-center.y)>3.5&&!(Math.abs(carrier.x-center.x)<5&&Math.abs(carrier.y-center.y)<=5&&Math.abs(carrier.y-center.y)<3.5)){
     const f=(200-carrier.ratings[7]-carrier.ratings[8])/100;
     if(rand()<dt*DIRT_SLIP*f*f*f){const dy=Math.sign(carrier.y-center.y)||1;movePlayer(carrier,clamp(carrier.x,center.x-4.6,center.x+4.6),center.y+dy*5.4)}
   }
   for(const p of players){
     if(!active(p)||p.role==='Anchor')continue;
     const limit=p.side<0?p.x-(center.x+5):(center.x-5)-p.x;
     if(limit>.3){p.lapse=0;penalize(p,'crosses past their own half · free run lane');return true}
   }
   if(carrier&&!carrier.sidelined&&noPossession(carrier)){penalize(carrier,'possesses the ball in the no-possession zone · free run lane');return true}
   return false;
 }
 function ringPenalty(dt,active){
   for(const p of players){
     const engaged=p.screened>0||pile&&(p===pile.p||p===pile.d)||lane?.grip&&(p===carrier||p===lane.grip.d);
     p.ringTime=active(p)&&!engaged&&dist(p,center)<=ringRadius?p.ringTime+dt:0;
     p.screened=Math.max(0,p.screened-dt*fieldSecondsPerSecond);
     if(p.ringTime>ringLimit+1e-9){
       penalize(p,'stays unblocked in the ring for more than three seconds · free run lane');
       return true;
     }
   }
   return false;
 }
 function stopCarrier(p,d){
   d.stats.tkl++;
   const turnover=s.overtime||!lane&&Math.abs(p.y-17)<=5&&worth!==3;
   const stopped=d.name+' stops '+p.name+(blue(p)?' in the center zone':'');
   if(!lane&&rand()<.014+(100-p.ratings[5])*.0007){
     log(stopped);p.stats.fum++;log(p.name+' fumbles on contact');spill(p,'fumble',p.x,p.y);return
   }
   if(turnover){p.stats.to++,call('Turnover');highlightTurnover(d,'Stopped '+p.name+' and won possession')}
   swing=null;
   log(stopped+(turnover?' · turnover':' · quadrant restart'));s.tackled=p;if(turnover)stoppage();else s.tackleEvents++;
   if(!lane&&Math.abs(p.y-17)>5&&Math.abs(p.x-25)>=5){
     assign(p);stationary=true;run=false;readTime=0;hold=1.5;return
   }
   const spot=blue(p)&&turnover?origin:p;
   restart(turnover?1-p.team:p.team,lane?p.side:undefined,lane?undefined:nearestQuadrant(spot));
 }
 function contactMatchup(p,d){
   const gap=dist(p,d);
   const x=gap>.01?(p.x-d.x)/gap:-p.side,y=gap>.01?(p.y-d.y)/gap:0;
   const defenderSpeed=Math.max(0,d.vx*x+d.vy*y);
   const runnerSpeed=Math.max(0,-p.vx*x-p.vy*y);
   const closing=Math.max(0,(d.vx-p.vx)*x+(d.vy-p.vy)*y);
   const weight=d.weight-p.weight,height=d.height-p.height,strength=d.ratings[2]-p.ratings[2];
   const drive=(d.weight*defenderSpeed-p.weight*runnerSpeed)/1000;
   const form=d.ratings[tackling];
   const impact=defenderSpeed*.78+closing*.23+weight*.029+height*.14+strength*.016+(form-60)*.019;
   return {x,y,defenderSpeed,runnerSpeed,weight,height,strength,drive,form,impact};
 }
 function showImpact(p,d){
   s.impact={x:(p.x+d.x)/2,y:(p.y+d.y)/2,time:.46};
 }
 function jarBall(p,d,contact,spot,kind){
   const flight=pass;
   const thrower=flight?.thrower;
   spill(p,kind,spot.x,spot.y);
   if(thrower)loose.responsible=thrower;
   const speed=clamp(contact.impact*.85,3.6,10);
   const sideways=(rand()-.5)*speed;
   Object.assign(loose,{vx:contact.x*speed-contact.y*sideways+p.vx*.28+(flight?.vx??0)*.12,
     vy:contact.y*speed+contact.x*sideways+p.vy*.28+(flight?.vy??0)*.12,
     z:spot.z??1.2,vz:.75+speed*.11+(flight?.vz??0)*.10,spin:flight?.spin??0,omega:sideways*6,wait:.28});
   showImpact(p,d);
 }
 function tackleCarrier(p,d,active){
   const contact=contactMatchup(p,d);
   const {weight,height,strength,drive,form,impact,runnerSpeed,defenderSpeed,x,y}=contact;
   const failedJuke=p.missedJuke?.defender===d&&age<p.missedJuke.until;
   const supported=players.some(q=>q!==d&&q.team===d.team&&active(q)&&!q.blocked&&dist(q,p)<2.35);
   const truckPower=-drive-weight*.009-strength*.009;
   if(runnerSpeed>3.4&&truckPower>1.05&&(!supported||truckPower>1.8)&&
       rand()<clamp(.29+(truckPower-1.05)*.32-(supported?.18:0),.12,.80)){
     movePlayer(d,clamp(d.x-x*.85,.7,49.3),clamp(d.y-y*.85,s.overtime?12.5:.7,s.overtime?21.5:33.3));
     d.vx=-2.2*x;d.vy=-2.2*y;d.blocked=.8;
     showImpact(p,d);
     log(p.name+' runs through '+d.name);
     return;
   }
   const carrierControl=p.ratings[2]*.26+p.ratings[5]*.34+p.ratings[6]*.16+p.ratings[8]*.24;
   const stripSkill=d.ratings[2]*.29+d.ratings[5]*.28+d.ratings[6]*.20+d.ratings[8]*.23;
   const stripChance=clamp(.003+(stripSkill-carrierControl)*.00034+(supported?.004:0),.001,.038);
   if(!lane&&rand()<stripChance){
     p.stats.fum++;
     log(d.name+' strips '+p.name+' · ball ripped free');
     jarBall(p,d,{...contact,impact:Math.max(3.2,contact.impact)},ballAt(p),'fumble');return;
   }
   const leverage=clamp(weight*.0022+height*.012,-.17,.18);
   const technique=(form-60)*.0036;
   const tacklingScheme=defenses[s.defenses[d.team]];
   const attackingIdentity=defenses[s.defenses[p.team]];
   let finish=.21+strength*.0044+drive*.11+leverage+technique+(supported?.18:0)+(failedJuke?.19:0)+
     (tacklingScheme.tackle||0)-(plan==='Runway power'&&(tacklingScheme.runWeak||0)||0)+
     (1-(attackingIdentity.ownCreation??1))*.14;
   const hit=defenderSpeed>1.4&&impact>2.85&&
     rand()<bigHitChance(clamp(.055+(impact-2.85)*.13+(failedJuke?.065:0),.055,.55));
   if(hit){
     d.stats.hit++;bigHits++;showImpact(p,d);
     log(d.name+' lands a big hit on '+p.name);
     if(!lane&&rand()<clamp(.10+(impact-4)*.049+(72-p.ratings[5])*.004,.045,.56)){
       p.stats.fum++;log(p.name+' fumbles on the hit · ball loose');
       jarBall(p,d,contact,ballAt(p),'fumble');return;
     }
     finish+=.15;
   }
   const edge=boundaryContact(p,d);
   const wrap=clamp(.28+technique+(supported?.18:0)+(failedJuke?.09:0)+leverage*.5,.10,.65);
   if(!hit&&dist(d,center)>=ringRadius&&
      (Math.abs(p.y-17)<=5?rand()<wrap:edge&&edge.distance<=4.2&&rand()<wrap*.36)){
     startPile(p,d);return;
   }
   if(rand()<clamp(finish,.07,.88)){
     if(!tryBoundaryPush(p,d,edge,'contact'))stopCarrier(p,d);
   }else log(p.name+' breaks the tackle');
 }
 function startPile(p,d){
   const teamProfile=team=>{
     const roster=players.filter(q=>q.team===team&&!q.sidelined);
     return roster.reduce((sum,q)=>sum+q.ratings[2]*.68+q.weight*.10+q.height*.18+
       q.ratings[8]*.04+(team===d.team?q.ratings[tackling]*.11:0),0)/roster.length;
   };
   const attackProfile=teamProfile(p.team),defenseProfile=teamProfile(d.team);
   const mismatch=Math.min(1,Math.abs(attackProfile-defenseProfile)/45);
   const limit=clamp(25-23*mismatch,2,25);
   const distance=dist(p,center);
   s.contact={p,d};
   pile={p,d,time:0,limit,tackleProgress:0,escapeProgress:0,
     progressDistance:distance,closestDistance:distance,stallTime:0};
   log(d.name+' wraps up '+p.name+' · pile drive');
 }
 function clearance(q,team){
   return Math.min(...players.filter(d=>d.team!==team&&!d.sidelined&&!(d.edgeTime>0)).map(d=>dist(q,d)));
 }
 function passingLane(from,to,active){
   const dx=to.x-from.x,dy=to.y-from.y,lengthSquared=dx*dx+dy*dy||1;
   let clearance=6;
   for(const d of players)if(d.team!==from.team&&active(d)){
     const x=d.x-from.x,y=d.y-from.y;
     const along=(x*dx+y*dy)/lengthSquared;
     if(along>.12&&along<.9)clearance=Math.min(clearance,Math.hypot(x-along*dx,y-along*dy));
   }
   return clearance;
 }
 function swingSpot(p){
   return {x:center.x+p.side*13,y:p.i<2?6:28};
 }
 function quickOutlet(p,active,sequence){
   const origin=nearestQuadrant(p);
   const maxRange=16+p.ratings[0]*.25;
   let best=null,bestValue=-Infinity;
   for(const q of players){
     if(q.team!==p.team||q===p||!active(q)||q.blocked||q.y<1.5||q.y>32.5)continue;
     const quadrant=nearestQuadrant(q);
     if(sequence&&(q.i>=4||q.i!==quadrant||(sequence.visited&(1<<quadrant))))continue;
     if(!sequence&&(Math.abs(q.x-25)<6.4||Math.abs(q.y-17)<6.4))continue;
     if(!sequence&&q===previous)continue;
     const gap=dist(p,q),separation=clearance(q,p.team),lane=passingLane(p,q,active);
     if(gap>(sequence?maxRange:Math.min(23,maxRange))||gap<3.5||separation<(sequence?1.4:2.9)||lane<(sequence?1.1:2.4))continue;
     const adjacent=(Math.abs(origin-quadrant)%2===1);
     const score=Math.min(7,separation)+Math.min(4,lane)*1.3-gap*.11+q.ratings[5]*.018+
       (sequence&&adjacent?2.6:0);
     if(score>bestValue){best=q;bestValue=score}
   }
   return best;
 }
 function choosePassType(p,target,active,movement,scheme){
   const gap=dist(p,target),lane=passingLane(p,target,active),separation=clearance(target,p.team);
   const crossHalf=Math.sign(p.x-center.x)!==Math.sign(target.x-center.x);
   const intendedBounce={x:p.x+(target.x-p.x)*.55,y:p.y+(target.y-p.y)*.55};
   const bounceSafe=!crossHalf&&!pathCrossesNoPossession(p,target)&&!noPossession(intendedBounce)&&gap>=5&&gap<=18;
   const pressure=players.some(q=>q.team!==p.team&&active(q)&&!q.blocked&&dist(p,q)<3.2);
   if(gap<=4)return {type:'underhand',crossHalf,pressure};
   const quick=movement==='quick swing'||movement==='quick outlet'||urgent(p.team);
   const weights=[
     ['lob',1+Math.max(0,2.5-lane)*.08+Math.max(0,gap-16)*.008+
       (target.height-70)*.005+(scheme.lanes?.05:0)],
     ['bounce',bounceSafe?clamp(.20+(72-target.ratings[5])*.006+separation*.012-(quick?.09:0),.08,.52):0],
     ['line',gap<=21?clamp(.08+(p.ratings[0]-55)*.004+(quick?.24:0)+(pressure?.08:0),.04,.52):0]
   ];
   let roll=rand()*weights.reduce((sum,[,weight])=>sum+weight,0),type='lob';
   for(const [candidate,weight] of weights){roll-=weight;if(roll<=0){type=candidate;break}}
   const longThrow=clamp((gap-16)/12,0,1);
   const shortHopChance=.0005+longThrow*clamp(.012+Math.max(0,76-p.ratings[0])*.0017+
     Math.max(0,80-p.ratings[1])*.0025+gap*.0012+(pressure?.035:0),.012,.27);
   const overthrowChance=clamp(.01+Math.max(0,82-p.ratings[1])*.0021+
     Math.max(0,p.ratings[0]-p.ratings[1])*.0015+gap*.0008+(pressure?.02:0),.01,.22);
   if(type!=='bounce'){
     if(rand()<shortHopChance)type='shortHop';
     else if(rand()<overthrowChance)type='overthrow';
   }
   return {type,crossHalf,pressure};
 }
 function passProfile(type,start,end,duration){
   if(type==='underhand')return {duration:Math.max(.4,dist(start,end)/4.5),arcHeight:clamp(dist(start,end)*.06,.08,.24),endHeight:1.25};
   if(type==='line')return {duration:duration*.72,arcHeight:.52,endHeight:1.32};
   if(type==='lob')return {duration:duration*1.08,arcHeight:3.9,endHeight:1.42};
   if(type==='overthrow')return {duration:duration*1.06,arcHeight:4.15,endHeight:2.55};
   if(type==='bounce'||type==='shortHop'){
     const bounceF=type==='bounce'?.54:.79;
     return {duration:duration*(type==='bounce'?1.28:1.08),bounceF,
       bouncePoint:{x:start.x+(end.x-start.x)*bounceF,y:start.y+(end.y-start.y)*bounceF},
       firstArc:type==='bounce'?.72:.54,secondArc:type==='bounce'?.56:.24,
       endHeight:type==='bounce'?1.02:.68};
   }
   return {duration:duration*1.08,arcHeight:3.9,endHeight:1.42};
 }
 function loosePursuers(active){
   const estimate=p=>{
     const gap=dist(p,loose),speed=Math.max(2.4,topSpeed(p.ratings[3]));
     const reactionDelay=(100-p.ratings[6])*.008+(100-p.ratings[8])*.0035;
     return {p,gap,eta:gap/speed+reactionDelay};
   };
   const ranked=players.filter(active).map(estimate).sort((a,b)=>a.eta-b.eta);
   const chosen=new Set();
   for(const team of [0,1]){
     const club=ranked.filter(entry=>entry.p.team===team);
     const first=club[0];
     if(first&&first.gap<=11.5)chosen.add(first.p);
     const second=club[1];
     if(second&&second.gap<=4.75&&second.eta<first.eta+1.05)chosen.add(second.p);
   }
   if(!chosen.size&&ranked[0])chosen.add(ranked[0].p);
   for(const entry of ranked){
     if(chosen.size>=4)break;
     if(entry.gap<=3.25)chosen.add(entry.p);
   }
   s.scramblePursuers=[...chosen].map(p=>p.team*8+p.i);
   return chosen;
 }
 function settleLooseBall(active){
   const reach=1.2;
   const nearby=[];
   for(const p of players)if(active(p)){
     const gap=dist(p,loose);
     if(gap<2)nearby.push({p,gap});
   }
   if(!nearby.length||!nearby.some(entry=>entry.gap<reach))return null;
   const contested=nearby.some(entry=>entry.p.team!==nearby[0].p.team);
   let winner=null,best=-Infinity,runnerUp=-Infinity;
   for(const {p,gap} of nearby){
     if(gap>=reach)continue;
     const [,,strength,,,hands,reaction]=p.ratings;
     const contact=contested?(loose.kind==='fumble'?strength*.027:strength*.013):0;
     const rating=contact+hands*.035+reaction*.029-gap*4-(p.blocked?1.5:0)+(contested?rand()*2:0);
     if(rating>best){runnerUp=best;best=rating;winner=p}
     else runnerUp=Math.max(runnerUp,rating);
   }
   if(!winner)return null;
   const traffic=clamp(.18+(nearby.length-2)*.065+Math.max(0,2-(best-runnerUp))*.09,0,.58);
   const bodies=nearby.filter(entry=>entry.gap<1.75);
   for(const {p} of bodies){
     const toward=Math.atan2(loose.y-p.y,loose.x-p.x);
     p.scrambleAngle=toward+(p===winner?0:(rand()-.5)*1.1);
     p.scramblePose=p===winner?'dive':p.team===winner.team?'shove':rand()<.58?'fall':'shove';
     p.scrambleTime=.42+rand()*.48;
     if(p.scramblePose==='fall')p.blocked=Math.max(p.blocked||0,.35+rand()*.42);
   }
   if(contested&&loose.bobbles<3&&rand()<traffic){
     const reachAngle=Math.atan2(loose.y-winner.y,loose.x-winner.x)+(rand()-.5)*.65;
     const push=.55+rand()*.9;
     loose.vx=loose.vx*.16+winner.vx*.12+Math.cos(reachAngle)*push;
     loose.vy=loose.vy*.16+winner.vy*.12+Math.sin(reachAngle)*push;
     loose.z=ballRadius;loose.vz=.06+rand()*.20;loose.omega+=(rand()-.5)*8;
     loose.bobbles++;loose.wait=.22+rand()*.18;loose.last=winner.team;loose.scramble=true;
     log('The ball is still loose under the scramble');
     return null;
   }
   return {player:winner,contested:contested||loose.bobbles>0};
 }
 function assign(p,points=2,passYards=null,thrower=null){
   scoringPassYards=passYards;scoringThrower=thrower;
   if(carrier&&carrier.team===p.team)previous=carrier;
   if(s.team!==p.team||s.posAge===0){
     cornerReturn=anchorLeak=relay=openingCall=swing=null;
     blueTrap=null;
     buildup=2+Math.floor(rand()*3);
     neutralUntil=26+rand()*17-10*aggression(p.team);
     finishStint();reviewAt=0;lastGain=0;bestDepth=50;blockFor=blockAnchor=decoy=null;patient=rand()<.11*(1-aggression(p.team));
     attackAt=patient?150+rand()*120:39+rand()*68;
   }
   const style=s.playbooks[p.team],identity=defenses[s.defenses[p.team]];
   origin={x:p.x,y:p.y};stationary=false;readTime=(urgent(p.team)? .65 : conservative(p.team)? 7.5+rand()*3 :
     patient?9+rand()*4:4.4+(1-aggression(p.team))*5+rand()*3)*style.hold;
   retreat=null;nextRead=.65;nextOutletRead=0;p.angle=null;p.missedJuke=null;carrier=p;pass=null;age=0;worth=points;s.team=p.team;
   if(s.overtime){run=true;return}
   const outlets=players.filter(q=>q.team===p.team&&q!==p&&!(q.edgeTime>0)&&!noPossession(q));
   const outletValue=q=>q.role==='Anchor' ? -.85 : 0;
   const designedRun=plan==='Drive and kick'||plan==='Runway power'||plan==='Last-step handoff';
   run=!protect(p.team)&&((designedRun&&rand()<clamp(.9+(style.runBias||0)+(identity.ownRun||0),.05,1))||
     (urgent(p.team)?shortRunSupport(p)>0||rand()<.42:rand()<clamp(.26+(style.runBias||0)+(identity.ownRun||0),.05,.65)));
   if(buildup>0&&protect(p.team)){
     // Switch the point of attack or use a short same-half outlet.
     const options=outlets.map(q=>({q,value:Math.min(6,clearance(q,p.team))+outletValue(q)+
       ((plan==='Far switch')===(q.side!==p.side)?3:0)+(q===previous?-2:0)+rand()*3}));
     cutter=options.sort((a,b)=>b.value-a.value)[0]?.q;
   }else{
     const creation=identity.ownCreation??1;
     cutter=outlets
       .map(q=>({q,value:clearance(q,p.team)-dist(q,center)*.25+outletValue(q)+rand()*4-
         (1-creation)*Math.max(0,12-dist(q,center))}))
       .sort((a,b)=>b.value-a.value)[0]?.q;
   }
 }
 function tryBlock(p,threat,focus){
   if(!threat.ratings||threat.team===p.team||dist(p,threat)>=1.65||dist(threat,focus)>=7||p.blocked||threat.blocked)return false;
   const behind=(p.x-threat.x)*threat.vx+(p.y-threat.y)*threat.vy<-.18;
   if(!lane&&!s.overtime&&behind&&rand()<(105-p.ratings[7])*BACK_BLOCK){
     penalize(p,'blocks in the back · free run lane');return true
   }
   p.blocked=.9;
   if(rand()<clamp(.52+(p.ratings[2]-threat.ratings[2])*.007,.18,.88)){
     threat.screened=threat.blocked=1.25;threat.ringTime=0;
     if(threat!==carrier)tryBoundaryPush(threat,p,boundaryContact(threat,p),'block');
   }
   return false;
 }
 function restartOvertime(team){
   const runner=players[team*8+4], side=runner.side;
   for(const club of [0,1]){
     const homeSide=players[club*8+4].side;
     const heaver=players.filter(p=>p.team===club&&p.role==='Heaver'&&p.side===homeSide)
       .reduce((a,b)=>a.ratings[5]+a.ratings[3]>b.ratings[5]+b.ratings[3]?a:b);
     for(const p of players.filter(p=>p.team===club)){
       const blocking=p.role==='Anchor';
       const sidelines=!blocking&&p!==heaver&&p.i!==4;
       const attack=club===team;
       const depth=blocking?(attack?17:10)-(p.i-5)*2.3:attack?(p===runner?21:23):5;
       const x=25+side*depth*(blocking||attack?1:-1);
       const y=blocking?[17,14.4,19.6][p.i-5]:p===heaver?19:17;
       Object.assign(p,{sidelined:sidelines,edgeTime:0,ringExit:null,ringTime:0,screened:0,
         x,y,hx:x,hy:y,vx:0,vy:0,blocked:0,jukeTime:0,jukeWait:0,helpTime:0,
         scrambleTime:0,scramblePose:null,scrambleAngle:0});
     }
   }
   plan='Three-on-three runway';
   finishStint();
   assign(runner);
   hold=1.5;
   log(teams[team]+' sets up · '+plan);
 }
 function restart(team,side,index){
   loose=null;s.contact=s.impact=null;s.scramblePursuers=[];pile=null;lane=null;cool=0;
   defensiveAssignments.clear();defenseReadAt=0;
   cornerReturn=anchorLeak=relay=blueTrap=swing=null;
   if(s.overtime){restartOvertime(team);return}
   const slots=[0,1,2,3].filter(i=>!side||Math.sign(quadrantCenters[i].x-25)===side);
   index=index??slots[Math.floor(rand()*slots.length)];
   const attack=players.filter(p=>p.team===team);
   for(const p of attack.filter(p=>p.i<4)){
     p.hx=25+p.side*(10+rand()*9);
     p.hy=p.i<2?4+rand()*6:24+rand()*6;
     if(p.i===index){p.hx=quadrantCenters[index].x;p.hy=quadrantCenters[index].y}
     const d=players.find(q=>q.team!==team&&q.i===p.i);
     const gap=Math.hypot(25-p.hx,17-p.hy);
     d.hx=p.hx+3*(25-p.hx)/gap;d.hy=p.hy+3*(17-p.hy)/gap;
   }
   for(const p of players){
     if(p.i===4){p.hx=25+p.side*(p.team===team?23:10);p.hy=17}
     if(p.i>=5){
       p.hx=25+p.side*5;
       // Three Anchors on each seam, spread across the runway width.
       p.hy=p.i===5?17:p.i===6?14:20;
     }
     Object.assign(p,{x:p.hx,y:p.hy,vx:0,vy:0,edgeTime:0,ringExit:null,ringTime:0,screened:0,
       blocked:0,helpTime:0,helpTarget:null,route:null,routeTime:0,jukeTime:0,jukeWait:0,
       scrambleTime:0,scramblePose:null,scrambleAngle:0})
   }

   const calls=s.playbooks[team].calls;
   plan=conservative(team)?'Short outlets':calls[Math.floor(rand()*calls.length)];
   openingCall=null;previous=null;
   assign(attack[index]);stationary=true;run=false;hold=1.5;
   if(!conservative(team))readTime=urgent(team)? 0 : 1.6+1.8*(1-aggression(team));
   const defender=players[(1-team)*8+6];
   const coach=s.playbooks[1-team];
   const trapChance=.08+.27*coach.baseline+.17*judgment(defender)+(urgent(1-team)?.22:0);
   const protectingLead=conservative(1-team);
   if(!protectingLead&&rand()<trapChance)blueTrap=defender;
   if(plan==='Anchor leak'||plan==='Last-step handoff')openingCall=plan;
   if(plan!=='Quick swing'&&!conservative(team)&&rand()<.05){
     const candidates=attack.filter(p=>p.i<4&&p!==carrier&&p.side===carrier.side);
     const outlet=candidates[0];
     const spot={x:25+outlet.side*20,y:outlet.i<2?3.2:30.8};
     cornerReturn={passer:carrier,outlet,spot,phase:'outlet'};
     anchorLeak=relay=openingCall=null;
     plan='Corner boomerang';run=false;stationary=true;readTime=2.5;
   }
   if(plan==='Quick swing'){
     swing={visited:1<<index};
     readTime=.80+(1-judgment(carrier))*.5;
   }
   log(teams[team]+' sets up · '+plan);
   if(blueTrap)log(teams[1-team]+' calls the one-point ambush');
 }
 function activateOpeningCall(off){
   if(openingCall==='Anchor leak'){
     const outlets=players.filter(p=>p.team===off&&p.role==='Anchor'&&p!==carrier&&!(p.edgeTime>0));
     if(outlets.length){
       anchorLeak={player:outlets.reduce((a,b)=>a.ratings[5]>b.ratings[5]?a:b),released:false};
       readTime=Math.max(readTime,age+2.8);
       anchorLeak.releaseAt=age+1.25;
     }
   }else{
     const side=carrier.x<center.x?-1:1;
     const trailers=players.filter(p=>p.team===off&&p.i<5&&p!==carrier&&p.side===side&&!(p.edgeTime>0));
     if(trailers.length){
       relay={player:trailers.reduce((a,b)=>a.ratings[5]+a.ratings[3]>b.ratings[5]+b.ratings[3]?a:b),used:false};
       stationary=false;run=true;
     }
   }
   openingCall=null;
 }
 function log(msg){report(s,msg)}
 function call(text,sub){s.call=text;s.callSub=sub||null;s.callEvents++}
 function outOfBounds(why,team){call('Out of bounds',why+' · '+teams[team]+(team===s.team?' retains':' gains')+' possession')}
 function rescueKick(off){
   const kicker=pass.target;
   const roll=rand();
   const returnsInBounds=.355+.04*(kicker.ratings[9]-20)/80;
   const reachedEdge=(kicker.y<0||kicker.y>34)&&dist(kicker,pass)<2;
   if(!reachedEdge||roll>=returnsInBounds){
     if(pass.thrower)pass.thrower.stats.to++,call('Turnover');
     log(kicker.name+' misses the airborne save · ball out');
     stoppage();restart(1-off,undefined,nearestQuadrant(pass));
     return;
   }

   // Even with three attempts, the game-level chance of a five-point look stays below 2%.
   const lookForFive=roll<.0055;
   const looseLanding=!lookForFive&&rand()<.18;
   const quadrantPlayers=players.filter(q=>q!==kicker&&!blue(q)&&!noPossession(q)&&Math.abs(q.y-17)>5);
   const target=lookForFive
     ?players.filter(q=>q!==kicker).reduce((a,b)=>dist(a,center)<dist(b,center)?a:b)
     :quadrantPlayers.reduce((a,b)=>!a||dist(a,pass)>dist(b,pass)?b:a,null);
   const landing=target||quadrantCenters[nearestQuadrant(pass)];
   const end=lookForFive?{...center}:{x:clamp(landing.x,.8,49.2),y:clamp(landing.y,.8,33.2)};
   const start={x:pass.x,y:pass.y};
   log(kicker.name+(lookForFive?' kicks the airborne save toward the blue':' kicks the airborne save back in bounds'));
   pass={start,end,target:target||null,kicker,looseLanding,lookForFive,startHeight:.77,endHeight:looseLanding?ballRadius:1.4,elapsed:0,duration:Math.max(.35,dist(start,end)/15)};
   Object.assign(pass,flightAt(pass,0));
 }
 function intercept(p,inFlight,contested=false){
   pass.thrower.stats.to++,call('Turnover');p.stats.int++;assign(p);cool=.6;
   log(p.name+(inFlight?' intercepts in the passing lane':contested?' wins a contested interception':' intercepts'));
   if(blue(p)){points(p,1,'Intercepted a pass in the center zone');log('Center interception · 1 point');scoringRestart={team:p.team,index:nearestQuadrant(p)}}
   else highlightTurnover(p,'Intercepted a pass to take possession');
 }
 function catchContest(p){
   return (p.height-72)*.015+(p.ratings[4]-60)*.002+(p.ratings[6]-60)*.0018+(p.ratings[5]-60)*.0022;
 }
 function looseFromPass(actor,mode){
   const flight=pass,motion=flightAt(flight,flight.elapsed??flight.duration);
   const {x,y,z}=motion;
   const speed=Math.hypot(motion.vx,motion.vy)||1,dx=motion.vx/speed,dy=motion.vy/speed;
   const source=flight.thrower||flight.kicker;
   if(mode==='bat'||mode==='tip'){
     actor.stats.pbu++;
     log(actor.name+(mode==='bat'?' bats down the pass':' tips the pass')+' · ball live');
   }else if(actor){
     if(!flight.kicker&&actor.team===source.team)actor.stats.drp++;
     log(actor.name+' drops it off the body · ball live');
   }else{
     log('Incomplete · ball skips on');
   }
   spill(actor||source,mode==='bat'||mode==='tip'?'deflection':flight.kicker?'save':'drop',x,y);
   loose.responsible=source;
   loose.z=z;loose.spin=motion.spin;
   if(mode==='rebound'){
     const gap=dist(motion,actor);
     const nx=gap>.12?(x-actor.x)/gap:-dx,ny=gap>.12?(y-actor.y)/gap:-dy;
     const bounce=reboundVelocity(motion,actor,nx,ny,.23,.55);
     Object.assign(loose,bounce,{vz:Math.max(.55,bounce.vz),omega:(dx*ny-dy*nx)*speed*1.3});
   }else if(mode==='tip'||mode==='bat'){
     const sign=(actor.x-x)*dy-(actor.y-y)*dx<0?-1:1;
     const bat=mode==='bat',normalX=-dx*(bat?.72:.56)-dy*sign*(bat?.23:.78);
     const normalY=-dy*(bat?.72:.56)+dx*sign*(bat?.23:.78);
     const bounce=reboundVelocity(motion,actor,normalX,normalY,bat?-.68:.27,bat?.24:.5);
     Object.assign(loose,bounce,{vz:bat?Math.min(-2.4,bounce.vz):Math.max(.8,bounce.vz),
       omega:sign*(bat?11:19)});
   }else{
     const skip=Math.min(speed*.43,9);
     Object.assign(loose,{vx:dx*skip,vy:dy*skip,vz:Math.min(-.75,motion.vz),omega:12});
   }
 }
 function score(p,n){
   if(n===3&&scoringThrower?.team===p.team)scoringThrower.stats.tc++;
   const passDetail=scoringPassYards===null?'a pass':'a '+scoringPassYards+'-yard pass';
   const summaries={1:'Recovered a fumble in the center zone',2:'Carried the ball through the ring',
     3:scoringThrower?'Caught '+passDetail+' from '+scoringThrower.name+' at the ring':
       'Caught '+passDetail+' in the center zone and broke the ring line',5:'Caught an airborne save kick in the center zone'};
   points(p,n,summaries[n]);
   const distance=n===3&&scoringPassYards!==null?' · '+scoringPassYards+'-yard pass':'';
   log(teams[p.team]+' #'+p.jersey+' '+p.name+' scores '+n+distance);
   if(s.overtime){finishStint();s.done=true;log('Sudden death · final whistle');return}
   const opponent=1-p.team;
   const options=[0,1,2,3].filter(i=>i!==lastChoice[p.team]);
   const difficulty=i=>{
     const marks=players[p.team*8+i].ratings, thrower=players[opponent*8+i].ratings;
     return (marks[6]+marks[3])*.24-(thrower[1]*.5+thrower[0]*.25+thrower[8]*.25);
   };
   const i=options.reduce((a,b)=>difficulty(a)>difficulty(b)?a:b);
   lastChoice[p.team]=i;
   log(teams[p.team]+' sends the restart to Q'+(i+1));
   scoringRestart={team:opponent,index:i};
 }
 restart(opening);log(teams[opening]+' opens possession');
 s.setPlaybook=(team,choice)=>{
   if(s.posAge!==0||s.playbooks[team]===playbooks[choice])return;
   s.playbooks[team]=playbooks[choice];
   if(team===opening){
     restart(opening);log(teams[opening]+' opens possession');
   }
 };
 s.step=dt=>{
   if(!s.penaltyPending)for(const p of players){
     if(p.role==='Anchor')continue;
     if(p.lapse>0){p.lapse-=dt;continue}
     const focus=(200-p.ratings[7]-p.ratings[8])/100;
     if(rand()<dt*LAPSE*focus*focus*focus)p.lapse=.5+rand()*.6;
   }
   stepInner(dt);
 };
 const stepInner=dt=>{
 if(s.done)return;
 if(pendingLane!==null){const team=pendingLane;pendingLane=null;freeLane(team);return}
 s.stoppagePending=false;
 if(secondHalfPending){
   secondHalfPending=false;s.half=2;s.time=1200;
   restart(1-opening);log('Second half begins');
   return;
 }
 if(boundaryRestart){
   boundaryRestart.wait-=dt;
   const {player,spot,exit,wait}=boundaryRestart;
   const progress=clamp((.85-wait)/.45,0,1);
   movePlayer(player,spot.x+(exit.x-spot.x)*progress,spot.y+(exit.y-spot.y)*progress);
   if(wait<=0){
     const {team,index}=boundaryRestart;boundaryRestart=null;restartAfterPause(team,undefined,index);
   }
   return;
 }
 if(delayedRestart){const r=delayedRestart;delayedRestart=null;restart(r.team,r.side,r.index);return}
 if(scoringRestart){restart(scoringRestart.team,undefined,scoringRestart.index);scoringRestart=null;s.scoringSpot=null}
 if(whistle>0){whistle-=dt;return}
 if(s.overtime)s.time+=dt;
 else if((s.time-=dt)<=0){
   finishStint();
   for(const athlete of players)athlete.energy=1;
   if(s.half===1){
     s.time=0;s.halftime=true;secondHalfPending=true;log('Halftime');return;
   }
   else if(s.score[0]===s.score[1]){
     s.overtime=true;s.time=0;
     log('Sudden death · runway only · next score wins');
     restart(Math.floor(rand()*2));
   }else{s.time=0;s.done=true;log('Final whistle');return}
 }
 const hurry=urgent(s.team), safe=conservative(s.team);
 if(carrier&&hurry)readTime=Math.min(readTime,age+.65);
 if(carrier&&safe&&Math.abs(carrier.y-17)>5&&!pile&&!lane){
   if(!s.conservative||s.coachingTeam!==s.team)readTime=Math.max(readTime,age+4);
   run=false;cornerReturn=anchorLeak=relay=openingCall=swing=null;
 }
 s.urgent=hurry;s.conservative=safe;s.press=urgent(1-s.team);s.coachingTeam=s.team;
 s.posAge+=dt;s.possession[s.team]+=dt; if(carrier&&Math.abs(carrier.y-17)<=5&&!blue(carrier))s.runway[s.team]+=dt;
 if(hold>0){hold=Math.max(0,hold-dt);return}
 let focus=carrier||pass||loose,off=s.team;
 const active=p=>!p.sidelined&&!(p.edgeTime>0)&&(!lane||(p.team===off?(p.i===4||p.i===5):p.i>=6));
 if(ringPenalty(dt,active)||restrictedPenalty(active,dt))return;
 const gameDt=dt;
 dt*=fieldSecondsPerSecond;age+=dt;cool-=dt;
 if(s.impact&&(s.impact.time-=dt)<=0)s.impact=null;
 const scheme=defenses[s.defenses[1-off]];
 if(carrier&&scheme.rush)readTime=Math.min(readTime,age+(scheme.rushRead??Math.max(.38,1.45-scheme.rush*3.2)));
 if(!lane&&!s.overtime)readDefense(off,focus,active,scheme);
 if(openingCall&&carrier&&!pile&&!lane&&!s.overtime&&!circulate(off)&&!conservative(off)&&
    (!run||openingCall==='Last-step handoff')&&Math.abs(carrier.y-17)>5&&Math.abs(carrier.x-25)>=5){
   activateOpeningCall(off);
 }
 if(carrier&&!stationary&&!pile&&!lane&&!s.overtime)readShape(off);
 if(anchorLeak&&carrier&&!anchorLeak.released&&age>(anchorLeak.releaseAt??1.25)){
   anchorLeak.released=true;log(anchorLeak.player.name+' slips off the lead block');
 }
 if(cornerReturn&&carrier&&(cornerReturn.phase==='return'?age>6:age>6.5)){
   cornerReturn=null;readTime=0;
 }
 if(pile){
   let {p,d}=pile;
   let support=players.filter(q=>q!==p&&q!==d&&active(q)&&dist(q,p)<3.1);
   const bodyForce=q=>q.weight*(.34+q.ratings[2]/72)*(1+(q.height-72)*.006);
   const attackForce=bodyForce(p)+support.filter(q=>q.team===p.team).reduce((sum,q)=>sum+bodyForce(q)*.52,0);
   const defendForce=bodyForce(d)+support.filter(q=>q.team===d.team).reduce((sum,q)=>sum+bodyForce(q)*.52,0);
   const forceEdge=(attackForce-defendForce)/(attackForce+defendForce||1);
   const shove=.44*Math.sin(pile.time*5)*clamp(1-Math.abs(forceEdge)*5,0,1);
   const step=dt*clamp(.07+forceEdge*2.15+shove,-.68,1.25);
   const gap=dist(p,center)||1;
   let dx=(25-p.x)/gap*step,dy=(17-p.y)/gap*step;
   movePlayer(p,p.x+dx,p.y+dy);movePlayer(d,d.x+dx,d.y+dy);
   pile.time+=dt;
   if(deadNoPossession(ballAt(p),p.team,p))return;
   if(worth>0&&insideRing(p)){score(p,worth);return}
   // Use actual position after movement so rocking or field limits cannot mask a stall.
   const distance=dist(p,center);
   pile.closestDistance=Math.min(pile.closestDistance,distance);
   pile.stallTime+=gameDt;
   if(pile.progressDistance-distance>=pileProgressYards){
     pile.progressDistance=distance;
     pile.stallTime=0;
   }
   const stalled=pile.stallTime+1e-9>=pileStallLimit;
   const drivenBack=distance-pile.closestDistance>=pileLossYards;
   if(pile.time>=2){
     const defenders=support.filter(q=>q.team===d.team),attackers=support.filter(q=>q.team===p.team);
     const tackleSkill=(d.ratings[tackling]*.58+d.ratings[8]*.24+d.ratings[2]*.18)+
       defenders.reduce((sum,q)=>sum+(q.ratings[tackling]*.55+q.ratings[8]*.25+q.ratings[2]*.2)*.18,0);
     const ballControl=p.ratings[2]*.47+p.ratings[5]*.30+p.ratings[8]*.15+p.ratings[10]*.08+
       attackers.reduce((sum,q)=>sum+q.ratings[2]*.13,0);
     pile.tackleProgress+=dt*clamp(.025+(tackleSkill-ballControl)*.0012-forceEdge*.08,.006,.19);
     const fumbleRate=clamp(.0015+(defendForce-attackForce)*.000012+(72-p.ratings[5])*.00012,.0004,.018);
     if(!lane&&rand()<fumbleRate*dt){
       p.stats.fum++;log(p.name+' loses the ball inside the pile · ball loose');
       spill(p,'fumble',p.x,p.y);
       Object.assign(loose,{vx:(rand()-.5)*6,vy:(rand()-.5)*6,vz:.65+rand()*.75,omega:(rand()-.5)*18});return;
     }
     const freeMate=players.filter(q=>q.team===p.team&&q!==p&&active(q)&&!q.blocked&&q.role!=='Anchor'&&
       dist(q,p)<2.15&&clearance(q,p.team)>2.4).sort((a,b)=>dist(a,p)-dist(b,p))[0];
     if(freeMate&&rand()<dt*clamp(.0007+(p.ratings[8]+p.ratings[5]-100)*.000012,.0003,.0022)){
       log(p.name+' slips a hidden handoff to '+freeMate.name);
       s.contact=pile=null;assign(freeMate);run=true;cool=.35;return;
     }
     const losing=forceEdge<-.05||stalled||drivenBack;
     if(losing){
       pile.escapeProgress+=dt*clamp(.015+(p.ratings[8]+p.ratings[10]-100)*.0009-forceEdge*.08,.006,.12);
       if(pile.escapeProgress>=1){
         log(p.name+' pulls out of the pile for a quadrant reset');stoppage();
         s.contact=pile=null;restart(p.team,undefined,nearestQuadrant(p));return;
       }
     }
     const wildPassRate=clamp(.00045+(p.ratings[8]-60)*.000008+(losing ? .00045 : 0),.0002,.0014);
     if(rand()<dt*wildPassRate){
       p.stats.att++;log(p.name+' tries to throw out of the pile · wild ball');
       spill(p,'drop',p.x,p.y);
       loose.responsible=p;Object.assign(loose,{vx:(25-p.x)*.32+(rand()-.5)*8,vy:(rand()-.5)*9,
         z:1.15,vz:2+rand()*2.6,omega:(rand()-.5)*24});return;
     }
   }
   if(stalled||drivenBack||pile.tackleProgress>=1){
     s.contact=pile=null;
     if(!tryBoundaryPush(p,d,boundaryContact(p,d),'pile'))stopCarrier(p,d);
     return;
   }
   if(dist(d,center)<ringRadius){
     // Contact can carry a defender across the line, but they must keep moving through.
     s.contact=pile=null;cool=.45;
   }else if(pile.time>=pile.limit){
     s.contact=null;pile=null;
     if(forceEdge>-.015){cool=.86;log(p.name+' powers free of the pile')}
     else if(!tryBoundaryPush(p,d,boundaryContact(p,d),'pile'))stopCarrier(p,d);
     return;
   }
 }
 const scramblePursuers=loose?loosePursuers(active):null;
 for(let p of players){
 p.scrambleTime=Math.max(0,(p.scrambleTime||0)-dt);
 if(p.scrambleTime===0)p.scramblePose=null;
 if(p.edgeTime>0){
   p.edgeTime=Math.max(0,p.edgeTime-dt);
   if(p.edgeTime===0){
     movePlayer(p,clamp(p.x,.7,49.3),clamp(p.y,s.overtime?12.5:.7,s.overtime?21.5:33.3));
   }
   continue;
 }
 if(!active(p)||pile&&(p===pile.p||p===pile.d)||p===lane?.grip?.d)continue;
 p.blocked=Math.max(0,(p.blocked||0)-dt);p.helpTime=Math.max(0,(p.helpTime||0)-dt);
 let tx=p.hx,ty=p.hy;
 p.jukeWait=Math.max(0,p.jukeWait-dt);p.jukeTime=Math.max(0,p.jukeTime-dt);
 if(pile&&p.role==='Anchor'){tx=pile.p.x;ty=pile.p.y}
 else if(loose&&scramblePursuers.has(p)){
   tx=loose.x+loose.vx*.18;ty=loose.y+loose.vy*.18;
   if(dist(p,loose)<1.7&&loose.z<.72&&p.scrambleTime<=0){
     p.scramblePose=dist(p,loose)<1.05?'dive':'shove';
     p.scrambleAngle=Math.atan2(loose.y-p.y,loose.x-p.x);
     p.scrambleTime=.28+.30*(1-judgment(p));
   }
 }
 else if(loose){tx=p.x;ty=p.y}
 else if(p===carrier&&stationary){tx=p.x;ty=p.y;p.vx=0;p.vy=0}
 else if(p===carrier&&retreat){tx=retreat.x;ty=Math.abs(p.x-25)<6.2?clamp(p.y,14,20):retreat.y}
 else if(p===carrier&&p.jukeTime>0){tx=p.jukeX;ty=p.jukeY}
 else if(p===carrier){if(worth===0&&blue(p)){tx=25+p.side*7;ty=17}else if(run||blue(p)||Math.abs(p.y-17)<=5){tx=25;ty=Math.abs(p.y-17)>4.5?p.hy<17?14:20:17;if(Math.abs(p.y-17)>4.5)tx=25+(p.x<25?-1:1)*7.5}else{if(!p.angle||dist(p,p.angle)<1){
 const depth=clamp(12-s.posAge*.045,7.5,12);
 const choices=Array.from({length:5},()=>({x:25+(p.x<25?-1:1)*(depth+rand()*10),y:p.y<17?6+rand()*4.8:23.2+rand()*4.8}));
 p.angle=choices.sort((a,b)=>(Math.min(5,clearance(b,off))-.65*dist(b,center))-(Math.min(5,clearance(a,off))-.65*dist(a,center)))[0]
 }tx=p.angle.x;ty=p.angle.y}}
 else if(pass&&p===pass.target){tx=pass.end.x;ty=pass.end.y}
 else if(lane){
   if(p===lane.anchor){
     tx=lane.help.hx;ty=lane.help.hy;
     laneBlock(p,lane.help);
   }else if((p===lane.primary&&dist(p,focus)<5)||(lane.challenged&&!p.blocked)){
     tx=focus.x;ty=focus.y;
   }
 }
 else if(s.overtime){
   const side=focus.x<center.x?-1:1;
   const depth=Math.abs(focus.x-center.x);
   if(p.team===off&&p.role==='Anchor'){
     const threat=players[(1-off)*8+p.i];
     tx=threat.x+side*.45;ty=threat.y;
     if(tryBlock(p,threat,focus))return;
   }else if(p.team===off){tx=focus.x+side*1.35;ty=focus.y<17?18.3:15.7}
   else if(p.role==='Anchor'){
     tx=center.x+side*clamp(depth-.8-(p.i-5)*1.25,0,10);
     ty=[focus.y,14.8+(focus.y-17)*.13,19.2+(focus.y-17)*.13][p.i-5];
   }else{tx=center.x-side*1.4;ty=p.i===4?15.4:18.6}
 }
 else if(cornerReturn&&p===cornerReturn.outlet&&cornerReturn.phase==='outlet'){
   tx=cornerReturn.spot.x;ty=cornerReturn.spot.y;
 }
 else if(cornerReturn&&p===cornerReturn.passer&&cornerReturn.phase!=='outlet'){
   tx=Math.abs(p.y-17)>4?25+p.side*6:25+p.side*1.5;ty=17;
 }
 else if(anchorLeak&&p===anchorLeak.player&&carrier&&p.team===off){
   const side=carrier.x<center.x?-1:1;
   if(anchorLeak.released){
     tx=Math.abs(p.y-17)>4?center.x+side*6:center.x-side*2;
     ty=17;
   }else{
     const threat=nearestDefender(carrier,off);
     tx=(carrier.x+threat.x)/2;ty=(carrier.y+threat.y)/2;
     if(tryBlock(p,threat,focus))return;
   }
 }
 else if(relay&&!relay.used&&carrier&&p===relay.player){
   const side=carrier.x<center.x?-1:1;
   tx=carrier.x+side*1.3;ty=clamp(carrier.y+(carrier.y<17?1.3:-1.3),13,21);
 }
 else if(p===blueTrap&&carrier&&p.team!==off&&!run&&Math.abs(carrier.y-17)>5){
   const side=carrier.x<center.x?-1:1;
   tx=center.x+side*3.8;ty=center.y+(carrier.y<17?-3.8:3.8);
 }
 else if(p===blueTrap&&pass&&!pass.wide&&!pass.kicker&&p.team!==off&&blue(pass.end)){
   tx=pass.end.x;ty=pass.end.y;
 }
 else if(swing&&p.team===off&&p.i<4){
   const spot=swingSpot(p);
   tx=spot.x;ty=spot.y;
 }
 else if(!lane&&p.team===off&&p===cutter&&(!protect(off)||s.posAge>attackAt*(1.45-aggression(off))-8)){
   // Round the dirt strip, then cut behind the defenders shading the passer.
   const side=p.x<25?-1:1;
   tx=Math.abs(p.y-17)>4.6?25+side*6.5:25-(focus.x<25?-1:1)*1.6;
   ty=Math.abs(p.y-17)>4.6?17:17+(focus.y<17?1:-1)*.5;
 }
 else if(!lane&&p.team===off&&blockFor&&p===blockAnchor&&carrier&&!pile&&plan!=='Drive and kick'&&plan!=='Runway power'){
   const mark=nearestDefender(blockFor,off);
   const gap=dist(mark,blockFor)||1;
   tx=blockFor.x+(mark.x-blockFor.x)/gap*1.1;ty=blockFor.y+(mark.y-blockFor.y)/gap*1.1;
   if(dist(mark,p)<1.55&&dist(mark,blockFor)<4&&!mark.blocked&&!p.blocked){
     p.blocked=.85;mark.screened=mark.blocked=.55+p.ratings[2]/140;mark.ringTime=0;
     tendency[off].block=Math.min(1,tendency[off].block+.13);
     if(mark!==carrier)tryBoundaryPush(mark,p,boundaryContact(mark,p),'block');
     const help=players.filter(q=>q.team!==off&&q!==mark&&active(q)&&!q.blocked&&
       defensiveAssignments.get(q)?.shoulder===undefined&&legalX(q,blockFor.x)===blockFor.x)
       .sort((a,b)=>dist(a,blockFor)-dist(b,blockFor))[0];
     if(help&&dist(help,blockFor)<9){
       const original=defensiveAssignments.get(help)?.mark;
       const switchIsSound=!original||dist(original,center)>dist(blockFor,center)+1||clearance(original,off)<2;
       const trustRead=.5+.46*judgment(help);
       const switchChance=switchIsSound?trustRead:1-trustRead;
       if(rand()<clamp(tendency[off].block+(scheme.switches?.48:0),0,1)*switchChance){
       help.helpTarget=blockFor;help.helpTime=2+help.ratings[8]/40;
       }
     }
   }
 }
 else if(!lane&&p.team===off&&p===decoy&&!pile&&carrier){
   tx=25+(focus.x<25?1:-1)*3;ty=17+(focus.y<17?2:-2)
 }
 else if(!lane&&p.team===off&&p.i<5){
   p.routeTime-=dt;
   if(!p.route||p.routeTime<=0||dist(p,p.route)<.9)spaceRoute(p,off);
   tx=p.route.x;ty=p.route.y;
   if(p===blockFor&&blockAnchor&&dist(p,blockAnchor)<3){
     tx=25+p.side*6.5;ty=p.y<17?13.5:20.5;
   }
   if(protect(off)&&p===cutter&&!(p===blockFor&&plan==='Block away')){tx=25+p.side*(8+2*Math.sin(s.posAge*.25));ty=p.y<17?10:24}

 }
 else if(p.team!==off){
   const spot=defend(p,focus,off,scheme);
   tx=spot.x;ty=spot.y;
 }
 else if(p.role==='Anchor'&&p.team===off){let threat=players.filter(q=>q.team!==off&&active(q)&&!q.blocked).sort((a,b)=>dist(a,focus)-dist(b,focus))[0]||focus;
 tx=(focus.x+threat.x)/2;ty=(focus.y+threat.y)/2;
 if(tryBlock(p,threat,focus))return;
 }
 const leavingRing=p.team!==off&&dist(p,center)<=ringRadius;
 if(!leavingRing)p.ringExit=null;
 if(p.team!==off&&!loose){
   if(pass?.target===p&&pass.lookForFive&&pass.duration-pass.elapsed<.58&&!pass.saveExit){
     // Meet a live save on the run, with a destination past the ring.
     pass.saveExit=guardPosition(2*center.x-p.x,2*center.y-p.y,p);
   }
   const spot=p.ringExit||(pass?.target===p&&pass.saveExit)||guardPosition(tx,ty,p);
   if(leavingRing)p.ringExit=spot;
   tx=spot.x;ty=spot.y;
 }
 // Off-ball players clear the circle as the count approaches the limit.
 if(p!==carrier&&p.ringTime>RING_CLEAR-.6*judgment(p)){
   const exit=guardPosition(p.x,p.y,p);
   tx=exit.x;ty=exit.y;
 }
 tx=legalX(p,tx);
 let dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),v=Math.min(topSpeed(p.ratings[3]),d*2*playerSpeedMultiplier),a=acceleration(p.ratings[10])*dt;
 const effort=Math.hypot(p.vx,p.vy)/topSpeed(p.ratings[3]);
 p.energy=clamp(p.energy+dt*(effort>.45?-.018*effort:.024),0,1);
 if(p===carrier){v*=.28+.72*p.energy;if(p.energy<.24&&!stationary)readTime=Math.min(readTime,1)}
 if(p===carrier&&lane?.grip)v*=.22;
 if(p.blocked>0)v*=leavingRing ? .5 : .12;
 const dvx=dx/(d||1)*v-p.vx,dvy=dy/(d||1)*v-p.vy,k=Math.min(1,a/(Math.hypot(dvx,dvy)||1));
 p.vx+=dvx*k;p.vy+=dvy*k;
 const outsideCatch=pass?.wide&&pass.target===p;
 movePlayer(p,clamp(p.x+p.vx*dt,.7,49.3),
   clamp(p.y+p.vy*dt,s.overtime?12.5:outsideCatch?-2:.7,s.overtime?21.5:outsideCatch?36:33.3));
 if(p===carrier&&deadNoPossession(ballAt(p),p.team,p))return;


 }
 if(stationary&&carrier){
   for(const q of players)if(q.team!==off&&dist(q,carrier)<1){
     const dx=q.x-carrier.x,dy=q.y-carrier.y,gap=Math.hypot(dx,dy);
     movePlayer(q,carrier.x+(gap?dx/gap:1),carrier.y+(gap?dy/gap:0));
   }
 }
 if(pile)return;
 if(loose){
   loose.dirtContact=null;
   advanceLooseBall(loose,dt*ballSpeedMultiplier);
   loose.wait-=dt;
   if(loose.dirtContact&&deadNoPossession(loose.dirtContact,loose.last,loose.responsible))return;
   if(deadNoPossession(loose,loose.last,loose.responsible))return;
   if(loose.x<0||loose.x>50||loose.y<0||loose.y>34){
     const awarded=1-loose.last;
     if(loose.responsible?.team===off&&awarded!==off)loose.responsible.stats.to++,call('Turnover');
     log('Loose ball out · last-touch ruling');restartAfterPause(awarded,undefined,nearestQuadrant(loose));return
   }
   const recovery=loose.wait<=0&&!(loose.z>1.45)&&settleLooseBall(active);
   if(recovery){
     const {player:q,contested}=recovery;
     const {kind,originTeam,responsible}=loose,spot=loose;
     if(kind==='fumble'&&q.team!==originTeam){
       responsible.stats.to++,call('Turnover');
       if(!blue(spot))highlightTurnover(q,'Recovered an opponent’s fumble to take possession');
     }
     loose=null;log(q.name+' recovers the '+kind+(contested?' · won the scramble':''));
     if(kind==='drop'||kind==='save'||kind==='deflection'){assign(q,blue(q)?0:2);cool=.6}
     else {if(kind==='fumble'&&q.team!==originTeam&&blue(spot)&&s.overtime){score(q,1)}else if(kind==='fumble'&&q.team!==originTeam&&blue(spot)){points(q,1,'Recovered a fumble in the center zone');log('Center fumble recovery · 1 point');scoringRestart={team:q.team,index:nearestQuadrant(spot)}}else if(kind==='fumble'){restartAfterPause(q.team,undefined,nearestQuadrant(spot))}else {stoppage();restart(q.team,undefined,nearestQuadrant(spot))}}
   }
   return
 }
 if(pass){const priorF=pass.elapsed/pass.duration;pass.elapsed+=dt*ballSpeedMultiplier;const f=Math.min(1,pass.elapsed/pass.duration);Object.assign(pass,flightAt(pass,pass.elapsed));
 if(pass.bounceF&&priorF<pass.bounceF&&f>=pass.bounceF&&
    deadNoPossession({...pass.bouncePoint,z:ballRadius},(pass.kicker||pass.thrower).team,pass.thrower||pass.kicker))return;
 if(f>=1&&pass.wide){
   if(pass.rescue)rescueKick(off);
   else{pass.thrower.stats.to++,call('Turnover');log('Ball out of bounds');outOfBounds('Pass sails out of bounds',1-off);restartAfterPause(1-off,undefined,nearestQuadrant(pass))}
   return;
 }
 // A defender in the flight path can jump the pass before it reaches the receiver.
 if(!pass.wide&&!pass.kicker&&f>.15&&f<.87&&!noPossession(pass)){
   let defender=null,bestRead=null;
   const inBlue=blue(pass);
   for(const q of players){
     if(q.team===off||!active(q)||q.blocked||noPossession(q))continue;
     const read=laneDeflection(q,pass,q===blueTrap&&inBlue,scheme);
     if(read&&(!bestRead||read.priority>bestRead.priority)){
       defender=q;bestRead=read;
     }
   }
   if(defender){
     const accuracy=pass.thrower.ratings[1];
     const ambush=defender===blueTrap&&inBlue?.11:0;
     const inMiddle=dist(pass,center)<13;
     const chance=inMiddle?clamp(.15+(75-accuracy)*.004+(defender.ratings[6]-70)*.003+ambush+
       (scheme.takeaway||0)-(pass.quickSwing?(scheme.swingWeak||0)*.35:0),.02,.36+ambush):0;
     if(pass.laneRoll<chance){intercept(defender,true);return}
     const disruption=bestRead.chance*(inMiddle?1:.52);
     if(pass.laneRoll<chance+disruption){
       looseFromPass(defender,rand()<.55?'bat':'tip');return;
     }
   }
 }
 if(f>=1){
   const target=pass.target,save=!!pass.kicker;
   if(pass.looseLanding){
     log('Airborne save lands in bounds · ball live');
     const landing=pass,kicker=pass.kicker;
     spill(kicker,'save',landing.x,landing.y);
     Object.assign(loose,{vx:landing.vx*.62,vy:landing.vy*.62,z:landing.z,vz:landing.vz,spin:landing.spin,omega:19});return;
   }
   const eligible=players.filter(q=>active(q)&&q!==pass.kicker&&q.y>=0&&q.y<=34&&
     (!save||(pass.lookForFive?blue(q):!blue(q)&&Math.abs(q.y-17)>5&&!noPossession(q)))&&
     pass.z<=q.height/36+.39+q.ratings[4]*.0115&&
     dist(q,pass)<1.5+q.ratings[4]*.012+(save?0:(q.height-72)*.014));
   const catchPosition=q=>dist(q,pass)-(q===target ? .65 : 0);
   eligible.sort((a,b)=>catchPosition(a)-catchPosition(b));
   let q=eligible[0];
   const opponent=q&&eligible.find(other=>other.team!==q.team&&dist(other,q)<2.2);
   const contested=!save&&Boolean(opponent);
   const defender=contested?(q.team===off?opponent:q):null;
   const receiver=contested?(q.team===off?q:opponent):null;
   const contestEdge=contested?clamp(catchContest(defender)-catchContest(receiver),-.25,.25):0;
   if(contested){
     q=catchPosition(defender)-contestEdge<catchPosition(receiver)?defender:receiver;
   }
   const hands=q?.ratings[5]??50;
   let catchChance=.88+(hands-50)*.002;
   if(!save&&q?.team===off){
     const nearby=players.filter(player=>player!==q&&active(player)&&!player.blocked&&dist(player,pass)<2.4);
     const defenderNearby=nearby.some(player=>player.team!==off);
     const traffic=nearby.length>=2;
     const accuracy=pass.thrower.ratings[1];
     if(contested||defenderNearby||traffic){
       const dropRisk=(contested?.18:traffic?.12:.07)+(traffic?.04:0);
       const difficulty=({underhand:-.04,bounce:-.02,line:.06,shortHop:.13,overthrow:.10}[pass.passType]||0);
       catchChance=1-clamp(dropRisk+difficulty+(70-hands)*.002+(70-accuracy)*.001,.035,.48);
     }else{
       const difficulty=pass.passType==='shortHop'||pass.passType==='overthrow'?.003:0;
       catchChance=1-clamp(.006+(70-hands)*.00009+(70-accuracy)*.00005+difficulty,.002,.015);
     }
   }
   const cleanCatch=clamp(catchChance,.10,.998);
   const roll=q?rand():1;
   if(contested){
     const skill=deflectionSkill(defender);
     const tipWindow=clamp(.04+contestEdge*.08+skill*.19,.012,.084);
     const lateTipWindow=clamp(.12+skill*.26,.075,.18);
     if(roll>=cleanCatch-tipWindow&&roll<=cleanCatch+lateTipWindow){
       looseFromPass(defender,rand()<.53?'tip':'bat');return;
     }
   }
   if(!q||roll>cleanCatch){
     if(q&&dist(q,pass)<1.4+q.ratings[4]*.004){
       const rebound=rand()<clamp(.62-dist(q,pass)*.2,.25,.64);
       if(rebound){looseFromPass(q,'rebound');return}
       if(!save&&q.team===off)q.stats.drp++;
       log(q.name+' cannot hold it · through the hands');
     }
     looseFromPass(null,'skip');return;
   }
   if(!save&&q.team!==off){intercept(q,false,contested);return}
   if(!save){
     let hitter=null,hardest=null,catchForce=3.25;
     for(const d of players)if(d.team!==off&&active(d)&&!d.blocked&&dist(d,q)<1.65){
       const contact=contactMatchup(q,d);
       // A receiver driving into a set defender can create the collision as well.
       const force=contact.impact+contact.runnerSpeed*.46;
       if((contact.defenderSpeed>1.1||contact.runnerSpeed>2.25)&&force>catchForce){
         hitter=d;hardest=contact;catchForce=force;
       }
     }
     if(hitter&&rand()<bigHitChance(clamp(.14+(catchForce-3.25)*.084+(72-hands)*.003,.05,.50))){
       hitter.stats.hit++;bigHits++;hitter.stats.pbu++;
       log(hitter.name+' lands a big hit on '+q.name+' at the catch · incomplete');
       jarBall(q,hitter,{...hardest,impact:catchForce},pass,'deflection');return;
     }
   }
   const inside=blue(q);
   if(!save){q.stats.rec++;pass.thrower.stats.cmp++}
   const scoringCatch=inside&&!save;
   if(pass.circulating&&buildup>0)buildup--;
   const swingBridge=q.role==='Anchor'&&blue(q);
   if(swing&&(!pass.quickSwing||noPossession(q)||(!swingBridge&&(inside||Math.abs(q.y-17)<=5))))swing=null;
   let swingFinished=false;
   if(swing){
     if(swingBridge)swing.bridge=true;
     else swing.visited|=1<<nearestQuadrant(q);
     swingFinished=swing.visited===15;
     if(swingFinished){
       swing=null;plan='Block away';buildup=0;
       attackAt=Math.min(attackAt,s.posAge+14);
     }
   }
   const returnPass=cornerReturn?.phase==='outbound'&&q===cornerReturn.outlet;
   if(cornerReturn&&!returnPass)cornerReturn=null;
   const ringCatch=scoringCatch&&dist(pass,center)<=ringRadius;
   assign(q,scoringCatch?3:2,scoringCatch?Math.round(dist(pass.start,pass)):null,ringCatch?pass.thrower:null);cool=.6;
   if(swing){run=false;readTime=.39+(1-judgment(q))*.48}
   if(returnPass){cornerReturn.phase='return';run=false;readTime=1.1}
   log(q.name+(save?' catches the airborne save':q.team!==off?' intercepts':contested?' secures it through contact':' takes the pass'));
   if(swingFinished)log(teams[q.team]+' swings the ball through all four quadrants');
   if(save&&inside)score(q,5);
   else if(inside&&insideRing(q))score(q,worth)
 }
 return}
 let p=carrier;if(worth===0&&!blue(p))worth=2;if(worth>0&&blue(p)&&insideRing(p)){score(p,worth);return}
 if(lane?.grip){advanceLaneGrip(p,dt);return}
 const plannedProbe=plan==='Drive and kick';
 if(run&&!stationary&&!lane&&!s.overtime&&!retreat&&worth===2&&age>=nextRead&&(plannedProbe||!relay)){
   nextRead=age+.6;
   const entry={x:25+(p.x<25?-6:6),y:17};
   const ahead={x:(p.x+entry.x)/2,y:(p.y+entry.y)/2};
   const space=Math.min(clearance(entry,off),clearance(ahead,off));
   const tooCrowded=space<(plannedProbe?2.8:2.2)&&!shortRunSupport(p);
   if(dist(p,center)>(plannedProbe?3:8)&&(p.energy<(plannedProbe?.3:.25)||tooCrowded)){
     const side=p.role==='Anchor'?Math.sign(p.x-center.x)||p.side:p.side;
     const exits=[9,25].map(y=>({x:25+side*7.5,y}));
     retreat=exits.sort((a,b)=>clearance(b,off)-clearance(a,off)+(dist(p,a)-dist(p,b))*.4)[0];
     run=false;readTime=age+.5;log(p.name+' pulls out to find an outlet')
   }
 }
 const canThrow=!s.overtime&&!run&&Math.abs(p.y-17)>5&&Math.abs(p.x-25)>=5&&(!retreat||dist(p,retreat)<2);
 let quickTarget=null;
 if(canThrow&&age>=nextOutletRead){
   if(swing&&age>=readTime){
     quickTarget=quickOutlet(p,active,swing);
     if(!quickTarget&&age>=2.65){
       swing=null;plan='Far switch';
       log(teams[off]+' resets as the swing lanes close');
     }
   }else if(!swing&&!conservative(off)&&!patient&&!cornerReturn&&!anchorLeak&&!relay&&
      !openingCall&&(buildup>0||retreat)&&age>=1.05&&age<readTime){
     quickTarget=quickOutlet(p,active,null);
   }
   nextOutletRead=age+.18;
 }
 if(canThrow&&(quickTarget||!swing&&age>readTime)){
 let target=quickTarget||cutter, movement=quickTarget?(swing?'quick swing':'quick outlet'):null;
 const circulating=circulate(off)&&!anchorLeak;
 if(!quickTarget&&(protect(off)||retreat||cutter?.edgeTime>0||!cutter||clearance(cutter,off)<1.2)){
   const options=players.filter(q=>q.team===off&&q!==p&&active(q)&&!noPossession(q)&&q.y>=0&&q.y<=34);
   const safe=options.filter(q=>Math.abs(q.y-17)>6.8&&Math.abs(q.x-25)>6.8);
   if(protect(off)&&safe.length)options.splice(0,options.length,...safe);
   const carrierSpace=circulating?clearance(p,off):0;
   if(options.length){
     const value=q=>(q===blockFor&&plan==='Block away'?1.8:0)+(blue(q)&&clearance(q,off)>2?5:0)-.19*dist(q,center)+Math.min(8,clearance(q,off))+q.ratings[5]*.024-dist(p,q)*.045+(q===previous?-1:0)+(q===cutter?1:0)+(Math.abs(q.y-17)>5&&circulating?2:0)-
       (q.role==='Anchor' ? .9 : 0)-(conservative(off)?dist(p,q)*.22:0);
     const ranked=options.map(q=>{
       const gap=dist(p,q)||1;
       const lane=passingLane(p,q,active);
       const read=judgment(p);
       const separation=clearance(q,off);
       const swing=circulating&&!conservative(off)&&carrierSpace>=2.8&&gap<30&&q.side!==p.side&&lane>=2.1&&separation>=3;
       const reset=circulating&&q.side===p.side&&gap<15&&lane>=1.35&&separation>=2;
       const move=swing?'swing':reset?'reset':null;
       const outlet=circulating?Math.min(5,lane)*.6-gap*.095+(swing?2.1:reset?1.8:0):0;
       return {q,move,score:value(q)+outlet+read*Math.min(4,lane)+(rand()-.5)*7*(1-read)}
     });
     const choice=ranked.reduce((a,b)=>a.score>b.score?a:b);
     target=choice.q;movement=choice.move;
   }
 }
 if(!target)return;
 if(cornerReturn?.phase==='outlet'){
   if(dist(cornerReturn.outlet,cornerReturn.spot)>2.2)return;
   target=cornerReturn.outlet;cornerReturn.phase='outbound';
 }else if(cornerReturn?.phase==='return'){
   if(!blue(cornerReturn.passer))return;
   target=cornerReturn.passer;cornerReturn=null;
   log(p.name+' looks for the boomerang return');
 }else if(anchorLeak?.released&&anchorLeak.player!==p){
   if(blue(anchorLeak.player)&&clearance(anchorLeak.player,off)>1.3){
     target=anchorLeak.player;
     log(p.name+' looks for the leaking Anchor');
   }else if(age<(anchorLeak.releaseAt??1.25)+3.95)return;
   anchorLeak=null;
 }
 stationary=false;previous=p;
 const closeSafe=dist(p,target)<=4&&players.every(q=>q.team===off||!active(q)||q.blocked||
   dist(q,p)>=3.2&&dist(q,target)>=3.2);
 if(closeSafe&&dist(p,target)<=1.65&&rand()<.58){
   log(p.name+' gives safely to '+target.name);
   assign(target);run=false;cool=.24;return;
 }
 let passType=choosePassType(p,target,active,movement,scheme).type;
 const accuracyGap=100-p.ratings[1];
 const errorScale={underhand:.25,bounce:.72,line:1.18,lob:.82,shortHop:.94,overthrow:.95}[passType];
 let end={x:target.x+(rand()-.5)*accuracyGap*.07*errorScale,
   y:target.y+(rand()-.5)*accuracyGap*.07*errorScale};
 if(circulating&&Math.abs(target.y-17)>5){
   end.y=target.y<17?Math.min(10.5,end.y):Math.max(23.5,end.y);
 }
 if(passType==='overthrow'){
   const gap=dist(p,target)||1,extra=1.25+accuracyGap*.045+rand()*1.2;
   end.x+=((target.x-p.x)/gap)*extra;
   end.y+=((target.y-p.y)/gap)*extra;
 }
 const elapsed=(s.half-1)*1200+1200-s.time;
 const rescue=rescueTimes.length>0&&elapsed>=rescueTimes[0]&&!conservative(off)&&!cornerReturn&&!anchorLeak&&!relay&&!swing;
 const strategyRisk=s.playbooks[off].risk*(defenses[s.defenses[off]].ownRisk||1);
 const wide=rescue||rand()<(110-p.ratings[1])*(protect(off)?.000055:.00048)*strategyRisk;
 if(rescue)rescueTimes.shift();
 if(wide){
   const low=target.y<17;
   if(rescue){
     passType='lob';
     const edge={x:clamp(target.x,.8,49.2),y:low?0:34};
     const rescuers=players.filter(q=>q.team===off&&q!==p&&active(q)&&!noPossession(q)&&legalX(q,edge.x)===edge.x);
     if(rescuers.length)target=rescuers.reduce((a,b)=>dist(a,edge)-a.ratings[9]*.025<dist(b,edge)-b.ratings[9]*.025?a:b);
     log(target.name+' attempts an airborne rescue');
   }
   end={x:clamp(target.x,.8,49.2),y:low?-1:35};
 }
 // Use a single interception roll per throw across its flight.
 const start={x:p.x,y:p.y};
 const baseDuration=Math.max(.04,dist(p,end)/handPassSpeed(p.ratings[0]));
 const profile=passProfile(passType,start,end,baseDuration);
 p.stats.att++;pass={thrower:p,wide,rescue,passType,quickSwing:Boolean(swing&&!wide),circulating:circulating&&!wide,
   laneRoll:rand(),start,end,x:p.x,y:p.y,target,elapsed:0,...profile,
   duration:Math.max(profile.duration,rescue?dist(target,end)/(topSpeed(target.ratings[3])*.75)+.55:0)};
 Object.assign(pass,flightAt(pass,0));carrier=null;
 if(!wide&&movement==='quick swing')log(p.name+' swings quickly to '+target.name+' in Q'+(nearestQuadrant(target)+1));
 else if(!wide&&movement==='quick outlet')log(p.name+' finds '+target.name+' before the defense can close');
 else if(!wide&&movement==='swing')log(p.name+' changes the point of attack through '+target.name);
 else if(!wide&&movement==='reset')log(p.name+' resets through '+target.name);
 else if(passType==='shortHop')log(p.name+' leaves '+target.name+' a difficult short throw');
 else if(passType==='overthrow')log(p.name+' sends it beyond '+target.name);
 else log(p.name+' connects with '+target.name);
 return}
 if(stationary)return;
 const pressure=players.filter(q=>q.team!==off&&active(q)&&!q.blocked&&(!lane||lane.challenged||q===lane.primary)&&dist(p,q)<3.5)
   .reduce((nearest,q)=>!nearest||dist(p,q)<dist(p,nearest)?q:nearest,null);
 if(relay&&!relay.used&&relay.player!==p&&run&&pressure&&Math.abs(p.y-17)<=5&&worth===2&&
    dist(p,pressure)<2.6&&dist(p,relay.player)<2.05&&!relay.player.blocked&&!noPossession(relay.player)){
   const support=relay.player;
   relay.used=true;
   log(p.name+' makes a last-step handoff to '+support.name);
   assign(support);run=true;cool=.25;return;
 }
 if(pressure&&(run||Math.abs(p.y-17)<=5)&&p.jukeWait<=0){
   p.jukeWait=2+rand()*2;
   const chance=clamp(.44+(p.ratings[10]+p.ratings[3]-pressure.ratings[6]-pressure.ratings[10])*.006,.12,.78);
   if(rand()<chance){
     let dx=25-p.x,dy=17-p.y,gap=Math.hypot(dx,dy)||1;
     let options=[-1,1].map(k=>({x:clamp(p.x+dx/gap-k*dy/gap*3,.8,49.2),y:clamp(p.y+dy/gap+k*dx/gap*3,.8,33.2)}));
     let cut=clearance(options[0],off)>clearance(options[1],off)?options[0]:options[1];
     p.jukeX=cut.x;p.jukeY=cut.y;p.jukeTime=.8;pressure.blocked=.7;p.missedJuke=null;
     if(lane)lane.challenged=true;
     log(p.name+' jukes past '+pressure.name)
   }else p.missedJuke={defender:pressure,until:age+.95};
 }
 if(!lane&&age>1.4&&pressure&&!blue(p)&&Math.abs(p.y-17)<=5){
   const support=players.find(q=>q.team===off&&q!==p&&active(q)&&dist(q,p)<1.8&&
     clearance(q,off)>dist(p,pressure)+(q.role==='Anchor' ? 1 : .8));
   if(support&&!noPossession(support)){if(support===relay?.player)relay.used=true;log(p.name+' hands off to '+support.name);assign(support);cool=.6;return}
 }
 if(pressure&&!pressure.blocked&&dist(p,pressure)<1.38&&cool<=0){
   cool=.86;
   if(lane)tackleLane(p,pressure);
   else tackleCarrier(p,pressure,active);
 }
 };
 s.ball=()=>s.scoringSpot?{...s.scoringSpot,z:.82}:carrier?
   {...(stationary?{x:carrier.x,y:carrier.y}:ballAt(carrier)),z:1.03,spin:Math.atan2(carrier.vy,carrier.vx)}:(pass||loose);
 return s;
}
