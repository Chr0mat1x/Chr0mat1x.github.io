(function(){
  var reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MONO='"JetBrains Mono","Cascadia Mono",Consolas,"Courier New",monospace';
  var SANS='"Segoe UI",-apple-system,Roboto,Helvetica,Arial,sans-serif';

  function cols(el){
    var cs=getComputedStyle(document.body);
    var inv=!!(el.closest&&el.closest('.invert'));
    function v(n,d){var x=cs.getPropertyValue(n);return (x&&x.trim())||d;}
    return {
      ink:   inv? v('--invink','#f7f6f2') : v('--ink','#111'),
      paper: inv? v('--inv','#111')       : v('--paper','#f7f6f2'),
      mut:   inv? '#b9b7b1'               : v('--mut','#6a6a6a'),
      faint: inv? '#6f6d68'               : v('--faint','#9a9a9a'),
      hair:  inv? '#4a4a47'               : v('--hair','#d8d5cd'),
      soft:  inv? '#1b1b1a'               : v('--soft','#eceae4')
    };
  }
  function rr(ctx,x,y,w,h,r){
    r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  function txt(ctx,s,x,y,font,fill,align,base){
    ctx.font=font; ctx.fillStyle=fill;
    ctx.textAlign=align||'left'; ctx.textBaseline=base||'middle';
    ctx.fillText(s,x,y);
  }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function fnt(px){return px+'px '+MONO;}

  /* ---- string index strip ------------------------------------------ */
  function indices(ctx,W,H,t,C){
    var s='Python', n=s.length, pad=W*0.03;
    var bw=Math.min(H*0.34,(W-pad*2)/(n+2.2));
    var gap=bw*0.16, tot=n*bw+(n-1)*gap, x0=(W-tot)/2, by=H*0.12, bh=bw;
    var step=Math.floor(t/650)%(n*2), neg=step>=n, idx=neg?step-n:step;
    var boxI=neg? n-1-idx : idx, val=neg? -(idx+1) : idx, ch=s[boxI];
    for(var i=0;i<n;i++){
      var x=x0+i*(bw+gap), on=(i===boxI);
      ctx.lineWidth=on?2:1; ctx.strokeStyle=on?C.ink:C.hair;
      if(on){ctx.fillStyle=C.soft; rr(ctx,x,by,bw,bh,3); ctx.fill();}
      rr(ctx,x,by,bw,bh,3); ctx.stroke();
      txt(ctx,s[i],x+bw/2,by+bh/2+1,fnt(bw*0.54),on?C.ink:C.faint,'center');
      txt(ctx,String(i),x+bw/2,by+bh+bw*0.30,fnt(bw*0.30),on?C.ink:C.faint,'center');
      txt(ctx,String(i-n),x+bw/2,by+bh+bw*0.62,fnt(bw*0.30),on?C.ink:C.faint,'center');
    }
    txt(ctx,'s['+val+'] = "'+ch+'"',pad,H*0.90,fnt(Math.max(11,H*0.16)),C.ink,'left');
    txt(ctx,'индексы от 0 · с конца от −1',W-pad,H*0.90,Math.max(10,H*0.13)+'px '+SANS,C.faint,'right');
  }

  /* ---- slice highlighter ------------------------------------------- */
  function slices(ctx,W,H,t,C){
    var s='Программирование', n=s.length, pad=W*0.03;
    var steps=[
      {l:'s[0:4]',    sel:[0,1,2,3]},
      {l:'s[4:]',     sel:[4,5,6,7,8,9,10,11,12,13,14,15]},
      {l:'s[0:8:2]',  sel:[0,2,4,6]},
      {l:'s[::-1]',   sel:[15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0]},
      {l:'s[-4:]',    sel:[12,13,14,15]}
    ];
    var per=2300, k=Math.floor(t/per)%steps.length, st=steps[k];
    var prog=clamp((t-k*per)/1300,0,1);
    var gapr=0.14, bw=Math.min(H*0.29,(W-pad*2)/(n*(1+gapr))), gap=bw*gapr, tot=n*bw+(n-1)*gap, x0=(W-tot)/2, by=H*0.05;
    var out=''; for(var q=0;q<st.sel.length;q++) out+=s[st.sel[q]];
    var reveal=Math.round(out.length*prog);
    for(var i=0;i<n;i++){
      var x=x0+i*(bw+gap), on=st.sel.indexOf(i)>=0;
      ctx.lineWidth=on?2:1; ctx.strokeStyle=on?C.ink:C.hair;
      if(on){ctx.fillStyle=C.soft; rr(ctx,x,by,bw,bw,3); ctx.fill();}
      rr(ctx,x,by,bw,bw,3); ctx.stroke();
      txt(ctx,s[i],x+bw/2,by+bw/2+1,fnt(bw*0.52),on?C.ink:C.faint,'center');
    }
    var ry=by+bw+H*0.14, fs=fnt(Math.max(11,H*0.15));
    txt(ctx,st.l,pad,ry,fs,C.ink,'left');
    txt(ctx,'конец не входит',W-pad,ry,Math.max(10,H*0.12)+'px '+SANS,C.faint,'right');
    txt(ctx,'"'+out.slice(0,reveal)+'"',W/2,by+bw+H*0.40,fnt(Math.max(12,H*0.17)),C.ink,'center');
  }

  /* ---- concat / repeat --------------------------------------------- */
  function repeat(ctx,W,H,t,C){
    var per=2200, mode=Math.floor(t/per)%2, p=clamp((t%per)/1500,0,1);
    var label, unit, times, res;
    if(mode===0){ label='"ха" * 3'; unit='ха'; times=3; res='хахаха'; }
    else        { label='"При" + "вет"'; unit='При'; times=1; res='Привет'; }
    var fs=Math.max(12,H*0.20);
    txt(ctx,label,W/2,H*0.14,fnt(Math.max(11,H*0.17)),C.ink,'center');
    var bw=fs*1.5, gap=bw*0.18;
    var nshow = times===3 ? 1+Math.floor(p*3.999) : 1;
    var tot=bw*nshow+(nshow-1)*gap, x0=(W-tot)/2;
    for(var i=0;i<nshow;i++){
      var x=x0+i*(bw+gap);
      ctx.lineWidth=1.5; ctx.strokeStyle=C.hair;
      rr(ctx,x,H*0.34,bw,fs*1.5,4); ctx.stroke();
      txt(ctx,unit,x+bw/2,H*0.34+fs*0.75,fnt(fs*0.72),C.ink,'center');
    }
    txt(ctx,'↓',W/2,H*0.62,fnt(fs*0.7),C.faint,'center');
    var rv=Math.round(res.length*p);
    txt(ctx,'"'+res.slice(0,rv)+'"',W/2,H*0.84,fnt(fs*1.05),C.ink,'center');
  }

  /* ---- method cascade (divider) ------------------------------------ */
  function cascade(ctx,W,H,t,C){
    var steps=[
      {s:'"  Python  "', m:'исходная строка'},
      {s:'"Python"',     m:'.strip() — убрали пробелы'},
      {s:'"PYTHON"',     m:'.upper() — верхний регистр'},
      {s:'"JYTHON"',     m:'.replace("P","J")'},
      {s:'"JYTHON!"',    m:'+ "!" — склейка'}
    ];
    var per=1500, k=Math.floor(t/per)%steps.length, st=steps[k];
    var prog=clamp((t-k*per)/700,0,1);
    var fs=Math.max(15,Math.min(H*0.30,W*0.045));
    txt(ctx,'цепочка методов',W/2,H*0.14,Math.max(9,H*0.11)+'px '+SANS,C.faint,'center');
    txt(ctx,st.s.slice(0,Math.max(1,Math.round(st.s.length*prog))),W/2,H*0.46,fnt(fs),C.ink,'center');
    txt(ctx,'↓',W/2,H*0.68,fnt(Math.max(12,H*0.16)),C.faint,'center');
    txt(ctx,st.m,W/2,H*0.86,Math.max(10,H*0.13)+'px '+SANS,C.mut,'center');
    var dotR=Math.max(2,H*0.028), gapx=dotR*4, totw=(steps.length-1)*gapx;
    for(var i=0;i<steps.length;i++){
      ctx.beginPath(); ctx.arc(W/2-totw/2+i*gapx,H*0.05,dotR,0,Math.PI*2);
      ctx.fillStyle=(i===k)?C.ink:C.hair; ctx.fill();
    }
  }

  /* ---- string methods demo ----------------------------------------- */
  function methods(ctx,W,H,t,C){
    var steps=[
      {s:'"  Python  "', m:'.strip()'},
      {s:'"Python"',     m:'.upper()'},
      {s:'"PYTHON"',     m:'.lower()'},
      {s:'"python"',     m:'.title()'},
      {s:'"Python"',     m:'.count("y")  →  1'}
    ];
    var per=1400, k=Math.floor(t/per)%steps.length, st=steps[k];
    var prog=clamp((t-k*per)/600,0,1);
    var fs=Math.max(13,Math.min(H*0.30,W*0.045));
    txt(ctx,'методы строк',W/2,H*0.14,Math.max(9,H*0.11)+'px '+SANS,C.faint,'center');
    txt(ctx,st.s.slice(0,Math.max(1,Math.round(st.s.length*prog))),W/2,H*0.46,fnt(fs),C.ink,'center');
    txt(ctx,'↓',W/2,H*0.66,fnt(Math.max(11,H*0.15)),C.faint,'center');
    txt(ctx,st.m,W/2,H*0.85,fnt(Math.max(10,H*0.14)),C.mut,'center');
  }

  /* ---- f-string substitution --------------------------------------- */
  function fstring(ctx,W,H,t,C){
    var names=['Аня','Борис','Вера'];
    var per=1900, k=Math.floor(t/per)%names.length, p=clamp((t%per)/900,0,1);
    var fs=Math.max(11,H*0.17);
    txt(ctx,'f-строка подставляет значения',W/2,H*0.12,Math.max(9,H*0.11)+'px '+SANS,C.faint,'center');
    var tmpl='f"Привет, {name}!"';
    var tw=ctx.measureText(tmpl).width;
    txt(ctx,tmpl,W/2,H*0.36,fnt(fs),C.ink,'center');
    var open=tmpl.indexOf('{'), close=tmpl.indexOf('}')+1;
    var cw=ctx.measureText('0').width;
    var sx=W/2-tw/2+open*cw, ex=W/2-tw/2+close*cw;
    ctx.lineWidth=1.5; ctx.strokeStyle=C.ink;
    ctx.strokeRect(sx-2,H*0.36-fs*0.72,ex-sx+4,fs*1.44);
    txt(ctx,'name = "'+names[k]+'"',W/2,H*0.58,Math.max(10,H*0.13)+'px '+SANS,C.mut,'center');
    txt(ctx,'↓',W/2,H*0.70,fnt(fs*0.8),C.faint,'center');
    var res='Привет, '+names[k]+'!';
    var rv=Math.round(res.length*p);
    txt(ctx,'"'+res.slice(0,rv)+'"',W/2,H*0.87,fnt(fs*1.1),C.ink,'center');
  }

  /* ---- proposition switches ---------------------------------------- */
  function bits(ctx,W,H,t,C){
    var combos=[[0,0],[0,1],[1,0],[1,1]];
    var c=combos[Math.floor(t/1700)%4];
    var labs=['A · «идёт дождь»','B · «светит солнце»'];
    var swW=Math.min(W*0.19,170), swH=Math.max(15,H*0.16), x0=W*0.05;
    for(var k=0;k<2;k++){
      var y=H*(0.22+0.32*k), on=c[k]===1;
      txt(ctx,labs[k],x0,y+swH/2,Math.max(9,H*0.11)+'px '+SANS,C.mut,'left');
      var tx=x0+Math.min(W*0.24,215);
      ctx.lineWidth=1.5; ctx.strokeStyle=C.hair;
      if(on){ctx.fillStyle=C.ink; rr(ctx,tx,y,swW,swH,swH/2); ctx.fill();}
      rr(ctx,tx,y,swW,swH,swH/2); ctx.stroke();
      var kx=on? tx+swW-swH/2 : tx+swH/2;
      ctx.beginPath(); ctx.arc(kx,y+swH/2,swH*0.34,0,Math.PI*2);
      ctx.fillStyle=on?C.paper:C.ink; ctx.fill();
      txt(ctx,on?'1':'0',tx+swW+14,y+swH/2,fnt(Math.max(11,H*0.14)),C.ink,'left');
    }
    var v=c[0]&&c[1], rx=W-W*0.05;
    txt(ctx,'«дождь» И «солнце»',rx,H*0.32,Math.max(9,H*0.11)+'px '+SANS,C.mut,'right');
    txt(ctx,v?'ИСТИНА':'ЛОЖЬ',rx,H*0.66,fnt(Math.max(14,H*0.21)),C.ink,'right');
  }

  /* ---- truth-table fill -------------------------------------------- */
  function truthfill(ctx,W,H,t,C){
    var rows=[[0,0],[0,1],[1,0],[1,1]];
    var ops=[['A→B',function(a,b){return (!a||b)?1:0;}],
             ['A↔B',function(a,b){return a===b?1:0;}],
             ['A⊕B',function(a,b){return a!==b?1:0;}]];
    var colsN=2+ops.length, pad=W*0.03, cw=(W-pad*2)/colsN;
    var hh=H*0.20, rh=(H*0.72-hh)/rows.length, x0=pad, y0=H*0.04;
    var shown=Math.floor(t/850)%(rows.length+1);
    for(var c=0;c<colsN;c++){
      var x=x0+c*cw, lab=c<2?['A','B'][c]:ops[c-2][0];
      ctx.lineWidth=1; ctx.strokeStyle=C.hair; ctx.fillStyle=C.soft;
      ctx.fillRect(x,y0,cw,hh); ctx.strokeRect(x,y0,cw,hh);
      txt(ctx,lab,x+cw/2,y0+hh/2,fnt(Math.max(10,H*0.14)),C.ink,'center');
    }
    for(var r=0;r<rows.length;r++){
      var y=y0+hh+r*rh, cur=(r===shown);
      for(var c2=0;c2<colsN;c2++){
        var x2=x0+c2*cw;
        ctx.lineWidth=cur?2:1; ctx.strokeStyle=cur?C.ink:C.hair;
        if(cur){ctx.fillStyle=C.soft; ctx.fillRect(x2,y,cw,rh);}
        ctx.strokeRect(x2,y,cw,rh);
        var val, ink=C.ink;
        if(c2<2){ val=rows[r][c2]; }
        else { val=ops[c2-2][1](rows[r][0],rows[r][1]); ink=(val===1)?C.ink:C.mut; }
        if(r<=shown){ txt(ctx,String(val),x2+cw/2,y+rh/2,fnt(Math.max(10,H*0.14)),ink,'center'); }
        else { txt(ctx,'·',x2+cw/2,y+rh/2,fnt(Math.max(10,H*0.14)),C.hair,'center'); }
      }
    }
  }

  /* ---- NOT / AND / OR panels --------------------------------------- */
  function gates(ctx,W,H,t,C){
    var combos=[[0,0],[0,1],[1,0],[1,1]];
    var c=combos[Math.floor(t/1500)%4];
    var defs=[['НЕ','¬A',[c[0]]],['И','A∧B',[c[0],c[1]]],['ИЛИ','A∨B',[c[0],c[1]]]];
    var out=[1-c[0], (c[0]&&c[1])?1:0, (c[0]||c[1])?1:0];
    var pad=W*0.04, cw=(W-pad*2)/3;
    for(var k=0;k<3;k++){
      var x=pad+k*cw, w=cw*0.86, ox=x+(cw-w)/2;
      ctx.lineWidth=1.5; ctx.strokeStyle=C.hair;
      rr(ctx,ox,H*0.06,w,H*0.72,6); ctx.stroke();
      txt(ctx,defs[k][0],ox+w/2,H*0.20,fnt(Math.max(12,H*0.17)),C.ink,'center');
      txt(ctx,defs[k][1],ox+w/2,H*0.40,fnt(Math.max(10,H*0.13)),C.mut,'center');
      txt(ctx,String(out[k]),ox+w/2,H*0.62,fnt(Math.max(14,H*0.22)),C.ink,'center');
      var ins=defs[k][2];
      for(var j=0;j<ins.length;j++){
        var bx=ox+w*0.16+j*(w*0.26);
        ctx.lineWidth=1.5; ctx.strokeStyle=ins[j]?C.ink:C.hair;
        if(ins[j]){ctx.fillStyle=C.ink; ctx.fillRect(bx,H*0.80,w*0.18,w*0.18);}
        ctx.strokeRect(bx,H*0.80,w*0.18,w*0.18);
      }
    }
  }

  /* ---- NOR / NAND gate --------------------------------------------- */
  function norgate(ctx,W,H,t,C,mode){
    var combos=[[0,0],[0,1],[1,0],[1,1]];
    var c=combos[Math.floor(t/1500)%4];
    var isNor = mode==='nor';
    var res = isNor ? ((c[0]||c[1])?0:1) : ((c[0]&&c[1])?0:1);
    var sym = isNor?'↓':'|', name = isNor?'ИЛИ-НЕ (NOR)':'И-НЕ (NAND)';
    var fs=Math.max(26,Math.min(H*0.62,W*0.10));
    txt(ctx,sym,W*0.18,H*0.50,fnt(fs),C.ink,'center');
    txt(ctx,name,W*0.18,H*0.88,Math.max(9,H*0.12)+'px '+SANS,C.mut,'center');
    var gx=W*0.42, gw=W*0.24, gy=H*0.18, gh=H*0.60;
    ctx.lineWidth=1.5; ctx.strokeStyle=C.ink; rr(ctx,gx,gy,gw,gh,8); ctx.stroke();
    txt(ctx,'= ¬(A '+(isNor?'∨':'∧')+' B)',gx+gw/2,gy+gh*0.5,fnt(Math.max(10,H*0.14)),C.ink,'center');
    for(var j=0;j<2;j++){
      var by=gy+gh*(0.30+0.40*j);
      txt(ctx,j===0?'A':'B',gx-gw*0.24,by,fnt(Math.max(10,H*0.14)),C.mut,'center');
      ctx.lineWidth=1.5; ctx.strokeStyle=c[j]?C.ink:C.hair;
      if(c[j]){ctx.fillStyle=C.ink; ctx.fillRect(gx-gw*0.14,by-H*0.09,gw*0.20,H*0.18);}
      ctx.strokeRect(gx-gw*0.14,by-H*0.09,gw*0.20,H*0.18);
    }
    txt(ctx,String(res),W*0.82,H*0.50,fnt(Math.max(18,H*0.28)),C.ink,'center');
    txt(ctx,'результат',W*0.82,H*0.78,Math.max(9,H*0.12)+'px '+SANS,C.faint,'center');
  }

  /* ---- title: falling code glyphs ---------------------------------- */
  function codefall(ctx,W,H,t,C){
    var glyphs='"\'[]{}()=:+-*#abcxyz0123';
    var fs=Math.max(11,H*0.16);
    var cw=fs*0.72, rh=fs*1.5;
    var n=Math.floor(W/cw);
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,H); ctx.clip();
    for(var c=0;c<n;c++){
      var seed=(c*2654435761)%1000;
      var sp=0.02+((seed%37)/37)*0.05;
      var off=((t*sp+seed)%rh);
      for(var r=0;r<Math.floor(H*0.80/rh);r++){
        var y=r*rh+off+rh*0.5;
        var g=glyphs[(c*7+r*13+Math.floor((t*sp+seed)/rh))%glyphs.length];
        var k=((c*3+r*5+Math.floor(t/700))%9);
        ctx.globalAlpha=k===0?0.26:(k===1?0.12:0.05);
        txt(ctx,g,c*cw+cw*0.15,y,fnt(fs),C.ink,'left');
      }
    }
    ctx.globalAlpha=1; ctx.restore();
    txt(ctx,'str · index · slice · format · loop',W/2,H*0.94,
        Math.max(10,H*0.11)+'px '+SANS,C.faint,'center');
  }

  /* ---- title: truth values flipping -------------------------------- */
  function truthgrid(ctx,W,H,t,C){
    var n=Math.max(10,Math.floor(W/(H*0.14)));
    var s=Math.min(H*0.14,W/n), x0=(W-n*s)/2, y0=(H-s)/2;
    for(var c=0;c<n;c++){
      var on=((c*7+Math.floor(t/620))%5)<2;
      ctx.lineWidth=1; ctx.strokeStyle=on?C.ink:C.hair;
      if(on){ctx.fillStyle=C.ink; ctx.fillRect(x0+c*s,y0,s*0.92,s*0.92);}
      ctx.strokeRect(x0+c*s,y0,s*0.92,s*0.92);
      txt(ctx,on?'1':'0',x0+c*s+s*0.46,y0+s*0.46,fnt(s*0.5),on?C.paper:C.faint,'center');
    }
    txt(ctx,'¬ ∧ ∨ → ↓ |',W/2,y0+H*0.20,fnt(Math.max(12,H*0.16)),C.ink,'center');
  }

  var DRAWS={
    indices:indices, slices:slices, repeat:repeat, cascade:cascade, methods:methods,
    fstring:fstring, bits:bits, truthfill:truthfill, gates:gates,
    codefall:codefall, truthgrid:truthgrid,
    nor:function(c,w,h,t,C){norgate(c,w,h,t,C,'nor');},
    nand:function(c,w,h,t,C){norgate(c,w,h,t,C,'nand');}
  };

  function fit(cv){
    var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var w=Math.max(1,Math.round(r.width)), h=Math.max(1,Math.round(r.height));
    if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){
      cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    }
    var ctx=cv.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx:ctx,w:w,h:h};
  }
  var cvs=[];
  function active(cv){var s=cv.closest('.slide');return s&&s.classList.contains('active');}
  function loop(ts){
    for(var i=0;i<cvs.length;i++){
      var cv=cvs[i];
      if(!active(cv)) continue;
      var d=DRAWS[cv.getAttribute('data-viz')];
      if(!d) continue;
      if(cv.__t0==null) cv.__t0=ts;
      var t = reduced? 5200 : (ts-cv.__t0);
      var g=fit(cv);
      g.ctx.clearRect(0,0,g.w,g.h);
      try{ d(g.ctx,g.w,g.h,t,cols(cv)); }catch(e){}
    }
    requestAnimationFrame(loop);
  }
  function boot(){
    cvs=[].slice.call(document.querySelectorAll('canvas.viz'));
    if(cvs.length) requestAnimationFrame(loop);
  }
  window.__VIZ=DRAWS; window.__VIZCOLS=cols;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
