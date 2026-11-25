// Controllo dei messaggi della lotta: gioca molte lotte casuali con il simulatore e i set del gioco
// e raccoglie ogni tipo di messaggio, con un esempio. Uso: node controlla-messaggi.js . 600 > messaggi.json
// Poi, in anteprima, ogni esempio si passa alla lotta con __lottaFeed(riga) per vedere cosa scrive.
const fs=require('fs'),vm=require('vm'),path=require('path');
const dir=process.argv[2], N=+process.argv[3]||100;
vm.runInThisContext(fs.readFileSync(path.join(dir,'lib/pkmn-sim.js'),'utf8').replace(/^var PkmnSim/m,'globalThis.PkmnSim'));
vm.runInThisContext(fs.readFileSync(path.join(dir,'set-data.js'),'utf8').replace(/^const SET_DATA/m,'globalThis.SET_DATA'));
let MEGA={}; try{ vm.runInThisContext(fs.readFileSync(path.join(dir,'mega-data.js'),'utf8').replace(/^const MEGA_DATA/m,'globalThis.MEGA_DATA').replace(/^const MEGA_UBER/m,'globalThis.MEGA_UBER')); MEGA=globalThis.MEGA_UBER||globalThis.MEGA_DATA||{}; }catch(e){}
const {BattleStreams,Teams,Dex}=globalThis.PkmnSim;
const R=a=>a[Math.random()*a.length|0];
const EVK={HP:'hp',Atk:'atk',Def:'def',SpA:'spa',SpD:'spd',Spe:'spe'};
function setTxt(name,s,tera){ const ev=Object.entries(s.evs||{}).map(([k,v])=>v+' '+k).join(' / ');
  return `${name}${s.strumento?' @ '+s.strumento:''}\nAbility: ${s.abilita}\n${ev?'EVs: '+ev+'\n':''}${tera&&s.tera?'Tera Type: '+s.tera+'\n':''}${s.natura?s.natura+' Nature\n':''}${(s.mosse||[]).map(m=>'- '+m).join('\n')}`; }
function team(fmt){ const names=Object.keys(SET_DATA).filter(n=>SET_DATA[n][fmt]&&SET_DATA[n][fmt].length); const out=[], used=new Set();
  while(out.length<6){ const n=R(names), sp=Dex.species.get(n); if(used.has(sp.num)) continue; used.add(sp.num); out.push(setTxt(n,R(SET_DATA[n][fmt]),true)); }
  // a volte una Mega
  const mk=Object.keys(MEGA); if(mk.length&&Math.random()<.5){ const n=R(mk), sp=Dex.species.get(n); if(!used.has(sp.num)){ const s=R(MEGA[n]); out[0]=setTxt(n,{...s,strumento:s.strumento||s.item,abilita:s.abilita||s.ability,mosse:s.mosse||s.moves,evs:s.evs,natura:s.natura||s.nature},false); } }
  return out.join('\n\n'); }
function choose(rq){
  if(rq.wait) return null;
  if(rq.teamPreview) return 'team '+[1,2,3,4,5,6].sort(()=>Math.random()-.5).join('');
  const pk=rq.side.pokemon;
  if(rq.forceSwitch){ const used=new Set(); return rq.forceSwitch.map((f,i)=>{ if(!f) return 'pass'; const c=pk.map((p,j)=>j).filter(j=>!pk[j].active&&!pk[j].condition.endsWith(' fnt')&&!used.has(j)); if(!c.length) return 'pass'; const j=R(c); used.add(j); return 'switch '+(j+1); }).join(', '); }
  const used=new Set(); let mega=false, tera=false;
  return rq.active.map((a,i)=>{ const me=pk[i]; if(!me||me.condition.endsWith(' fnt')) return 'pass';
    const sw=pk.map((p,j)=>j).filter(j=>!pk[j].active&&!pk[j].condition.endsWith(' fnt')&&!used.has(j));
    if(sw.length&&!a.trapped&&Math.random()<.12){ const j=R(sw); used.add(j); return 'switch '+(j+1); }
    const mv=a.moves.map((m,k)=>({m,k})).filter(x=>!x.m.disabled&&(x.m.pp===undefined||x.m.pp>0)); if(!mv.length) return 'move 1';
    const x=R(mv); let c='move '+(x.k+1);
    if(rq.active.length>1&&['normal','any','adjacentFoe','adjacentAlly','adjacentAllyOrSelf'].includes(x.m.target)){ c+=' '+(x.m.target==='adjacentAlly'?-(i===0?2:1):x.m.target==='adjacentAllyOrSelf'?-(i+1):R([1,2])); }
    if(a.canMegaEvo&&!mega){ mega=true; c+=' mega'; } else if(a.canTerastallize&&!tera&&Math.random()<.3){ tera=true; c+=' terastallize'; }
    return c; }).join(', '); }
async function battle(fmt,fid){ const st=new BattleStreams.BattleStream(); const S=BattleStreams.getPlayerStreams(st); const lines=[];
  const t1=team(fmt), t2=team(fmt);
  const pl=(sid,stream)=>(async()=>{ for await(const ch of stream){ for(const l of ch.split('\n')){ if(l.startsWith('|request|')){ const rq=JSON.parse(l.slice(9)); setTimeout(()=>{ const c=choose(rq); if(c) stream.write(c); },0); } else if(l.startsWith('|error|')){ const rq=null; lines.push(l); setTimeout(()=>stream.write('default'),0); } } } })();
  pl('p1',S.p1); pl('p2',S.p2);
  const done=(async()=>{ for await(const ch of S.omniscient){ for(const l of ch.split('\n')) lines.push(l); if(/\|(win|tie)\|/.test(ch)) break; } })();
  S.omniscient.write(`>start {"formatid":"${fid}"}\n>player p1 {"name":"A","team":"${Teams.pack(Teams.import(t1))}"}\n>player p2 {"name":"B","team":"${Teams.pack(Teams.import(t2))}"}`);
  await Promise.race([done,new Promise(r=>setTimeout(r,8000))]); return lines; }
(async()=>{ const K={};
  const add=(key,ex)=>{ if(!K[key]) K[key]={n:0,ex}; K[key].n++; };
  for(let i=0;i<N;i++){ const dbl=i%2===1; const L=await battle(dbl?'doppio':'singolo',dbl?'gen9doublescustomgame':'gen9nationaldexag');
    for(const l of L){ const p=l.split('|'); const k=p[1]; if(!k||['','t:','gametype','player','teamsize','gen','tier','rule','clearpoke','poke','teampreview','start','upkeep','j','c','raw','debug','split','timestamp'].includes(k)) continue;
      const eff=x=>String(x||'').replace(/^(move|ability|item): /,'').replace(/\d+/g,'#');
      let key=k;
      if(['-start','-end','-activate','-singleturn','-singlemove','-fieldstart','-fieldend','-fieldactivate','-sidestart','-sideend','-prepare','cant','-fail','-block','-immune','-message','-hint','-enditem','-item','-ability','-transform','-formechange','detailschange','-weather','-clearallboost','-curestatus','-status'].includes(k)) key+=' '+eff(k.startsWith('-side')||k==='-curestatus'||k==='-status'||k==='cant'||k==='-block'||k==='-prepare'?p[3]:p[k==='-weather'||k.startsWith('-field')?2:3]);
      const fr=p.find(x=>x&&x.startsWith('[from]')); if(fr) key+=' '+eff(fr);
      const tags=p.filter(x=>/^\[(still|silent|msg|eat|spread|miss|upkeep|notarget|zeffect|anim|consumed|damage|broken|weak|of|wisher|block|fromitem|identify|partiallytrapped)/.test(x)).map(x=>x.split(']')[0]+']').filter(x=>x!=='[of]');
      if(tags.length) key+=' '+[...new Set(tags)].join('');
      add(key,l.slice(0,160)); } }
  console.log(JSON.stringify(Object.entries(K).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,v.n,v.ex]))); })();
