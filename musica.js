// Pokémon Incanto: musica dei menu, suonata dal browser con Web Audio (nessun file audio).
// - "Jingle Bells" (James Lord Pierpont, 1857: pubblico dominio), arrangiamento nostro con campanelli, basso e sonagli.
// - "Centro Ristoro": melodia ORIGINALE, lenta e dolce, nello spirito di un centro di cura (non è la musica dei giochi).
// Uso: Musica.want('natale'|'centro'|null), Musica.toggle(), Musica.isOn(). La musica parte solo dopo un tocco/clic
// (regola dei browser) e tace da sola quando è aperta la lotta (che ha la sua musica).
(function(){
  const NOTE={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
  const hz=n=>{ const m=/^([A-G][#b]?)(-?\d)$/.exec(n); return 440*Math.pow(2,(NOTE[m[1]]+12*(+m[2]+1)-69)/12); };
  // "E5:1 G5:.5 -:1" → [{n,d}] (- = pausa)
  const seq=s=>s.trim().split(/\s+/).map(x=>{ const [n,d]=x.split(':'); return {n:n==='-'?null:n,d:+d}; });
  function lay(events,line,inst,vol,start){ let t=start||0; for(const x of line){ if(x.n) events.push({t,d:x.d,n:x.n,i:inst,v:vol}); t+=x.d; } return t; }
  // accordi: "C:4 F:4" → basso sulle battute 1 e 3, e (se pad) accordo tenuto
  const CH={C:['C','E','G'],F:['F','A','C'],G:['G','B','D'],G7:['G','B','F'],D7:['D','F#','C'],Am:['A','C','E'],Dm:['D','F','A'],Bb:['Bb','D','F'],Gm:['G','Bb','D'],Em:['E','G','B'],Csus:['C','F','G']};
  function chords(events,s,{bass=.5,pad=0,arp=0,boct=2,poct=4,aoct=5}={}){ let t=0;
    for(const x of s.trim().split(/\s+/)){ const [c,d]=x.split(':'), L=+d, ch=CH[c];
      for(let b=0;b<L;b+=2) events.push({t:t+b,d:Math.min(2,L-b)*.9,n:ch[0]+boct,i:'bass',v:bass*(b%4?.8:1)});
      if(pad) for(const k of ch) events.push({t,d:L,n:k+poct,i:'pad',v:pad});
      if(arp) for(let b=0;b<L;b+=.5){ const k=ch[(b*2)%3|0]; events.push({t:t+b,d:.45,n:k+(aoct+((b*2)%4===3?1:0)),i:'box',v:arp}); }
      t+=L; }
    return t; }

  // ---------- Jingle Bells (ritornello + strofa), Do maggiore, 132 bpm ----------
  function natale(){ const ev=[];
    const chorus='E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5 E5:1 D5:1 D5:1 E5:1 D5:2 G5:2 '+
      'E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5 G5:1 G5:1 F5:1 D5:1 C5:4';
    const verse='G4:1 E5:1 D5:1 C5:1 G4:3 G4:.5 G4:.5 G4:1 E5:1 D5:1 C5:1 A4:4 A4:1 F5:1 E5:1 D5:1 B4:4 G5:1 G5:1 F5:1 D5:1 E5:4 '+
      'G4:1 E5:1 D5:1 C5:1 G4:4 G4:1 E5:1 D5:1 C5:1 A4:3 A4:1 A4:1 F5:1 E5:1 D5:1 G5:1 G5:1 G5:1 G5:1 A5:1 G5:1 F5:1 D5:1 C5:2 G5:2';
    let t=lay(ev,seq(verse),'bell',.5); lay(ev,seq(chorus),'bell',.55,t);
    chords(ev,'C:4 C:4 C:4 F:4 F:4 G:4 G7:4 C:4 C:4 C:4 C:4 F:4 F:4 C:2 G:2 G7:4 C:4 '+
              'C:4 C:4 C:4 C:4 F:4 C:4 D7:4 G:4 C:4 C:4 C:4 C:4 F:4 C:4 G7:4 C:4',{bass:.45,pad:.07});
    const L=128; for(let b=0;b<L;b+=.5) ev.push({t:b,d:.1,n:null,i:'sleigh',v:b%1?.10:.16});
    return {bpm:132,len:L,ev}; }

  // ---------- Centro Ristoro: melodia originale, Fa maggiore, 80 bpm ----------
  function centro(){ const ev=[];
    const mel='A4:2 C5:1 D5:1 F5:3 E5:1 D5:1 C5:1 Bb4:1 D5:1 C5:4 A4:1 C5:1 F5:1 A5:1 G5:2 E5:2 F5:1 D5:1 Bb4:1 G4:1 C5:3 -:1 '+
              'D5:2 F5:2 E5:2 C5:2 C5:1 E5:1 A5:1 G5:1 F5:4 Bb4:1 D5:1 G5:1 F5:1 E5:2 G5:2 F5:3 C5:1 F5:4';
    lay(ev,seq(mel),'piano',.42);
    chords(ev,'F:4 Dm:4 Bb:4 C:4 F:4 Am:4 Bb:4 Csus:2 C:2 Bb:4 C:4 Am:4 Dm:4 Gm:4 C:4 F:4 F:4',{bass:.32,pad:.06,arp:.07,boct:2,poct:4,aoct:5});
    return {bpm:80,len:64,ev}; }

  const SONGS={natale,centro};
  let ctx=null, master=null, noise=null, cur=null, song=null, t0=0, done=0, timer=null, wanted=null;
  let on=(()=>{ try{ return localStorage.getItem('incanto-music')!=='0'; }catch(e){ return true; } })();
  function ensure(){ if(ctx) return true; const A=window.AudioContext||window.webkitAudioContext; if(!A) return false;
    ctx=new A(); master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const b=ctx.createBuffer(1,ctx.sampleRate*.3,ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; noise=b; return true; }
  function env(g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
  function play(e,when,spb){ const v=e.v, dur=e.d*spb;
    if(e.i==='sleigh'){ const s=ctx.createBufferSource(); s.buffer=noise; const f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000; const g=ctx.createGain(); env(g,when,.003,v*.5,.08); s.connect(f); f.connect(g); g.connect(master); s.start(when); s.stop(when+.12); return; }
    const f=hz(e.n), g=ctx.createGain(); g.connect(master);
    const osc=(type,freq,gain)=>{ const o=ctx.createOscillator(), og=ctx.createGain(); o.type=type; o.frequency.value=freq; og.gain.value=gain; o.connect(og); og.connect(g); o.start(when); o.stop(when+dur+1.6); };
    if(e.i==='bell'){ osc('sine',f,1); osc('sine',f*2.01,.35); osc('triangle',f*3.98,.08); env(g,when,.005,v*.55,Math.max(.5,dur*1.4)); }
    else if(e.i==='box'){ osc('sine',f,1); osc('sine',f*3,.12); env(g,when,.004,v*.5,.6); }
    else if(e.i==='piano'){ osc('triangle',f,1); osc('sine',f*2,.25); env(g,when,.02,v*.5,Math.max(.6,dur*.95)); }
    else if(e.i==='bass'){ osc('triangle',f,1); env(g,when,.01,v*.6,Math.max(.25,dur*.8)); }
    else if(e.i==='pad'){ osc('sine',f,1); osc('sine',f*1.003,.6); g.gain.setValueAtTime(0.0001,when); g.gain.exponentialRampToValueAtTime(v*.5,when+.4); g.gain.setValueAtTime(v*.5,when+Math.max(.5,dur-.3)); g.gain.exponentialRampToValueAtTime(0.0001,when+dur+.4); } }
  // pianifica le note dei prossimi 0,4 s (la canzone gira in loop)
  function tick(){ if(!ctx||!song) return; const busy=!!(window.Lotta&&window.Lotta.isOpen&&window.Lotta.isOpen());
    const target=(on&&!busy&&!document.hidden)?1:0; master.gain.setTargetAtTime(target*.16,ctx.currentTime,.25); if(!target) { t0=ctx.currentTime+.1; done=0; return; }
    const spb=60/song.bpm, now=ctx.currentTime, horizon=now+.4;
    while(true){ const loopStart=t0+Math.floor(done/song.ev.length)*song.len*spb, e=song.ev[done%song.ev.length], when=loopStart+e.t*spb;
      if(when>horizon) break; if(when>=now-.05) play(e,when,spb); done++; } }
  function start(name){ if(!ensure()) return; cur=name; song=SONGS[name](); song.ev.sort((a,b)=>a.t-b.t); t0=ctx.currentTime+.15; done=0;
    if(!timer) timer=setInterval(tick,100); tick(); }
  function stop(){ cur=null; song=null; if(master&&ctx) master.gain.setTargetAtTime(0,ctx.currentTime,.15); }
  function want(name){ wanted=name; if(!on){ return; } if(!name){ stop(); return; } if(name===cur) return; if(!ctx) return; // parte al primo tocco
    if(cur){ master.gain.setTargetAtTime(0,ctx.currentTime,.2); setTimeout(()=>{ if(wanted===name) start(name); },350); } else start(name); }
  // sblocco al primo tocco/clic (regola dei browser per l'audio)
  function unlock(){ if(!on) return; if(!ensure()) return; if(ctx.state==='suspended') ctx.resume(); if(wanted&&wanted!==cur) start(wanted); }
  ['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));
  document.addEventListener('visibilitychange',()=>{ if(ctx&&!document.hidden&&ctx.state==='suspended') ctx.resume(); });
  function toggle(){ on=!on; try{ localStorage.setItem('incanto-music',on?'1':'0'); }catch(e){}
    if(on){ unlock(); } else stop(); return on; }
  window.Musica={want,toggle,isOn:()=>on,current:()=>cur};
})();
