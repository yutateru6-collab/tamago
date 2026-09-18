import { useEffect, useId, useRef, useState } from 'react';
import type { World } from '../domain/model';
import { conditionOf } from '../domain/engine';

// A neutral displacement field leaves the illustration still. Only the soft fields
// over the ear and tail deform pixels; there is no duplicated, sliding cut-out.
const field = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1086" height="1448"><defs><radialGradient id="ear"><stop stop-color="#80ff80"/><stop offset="1" stop-color="#808080"/></radialGradient><radialGradient id="tail"><stop stop-color="#ff8080"/><stop offset="1" stop-color="#808080"/></radialGradient></defs><path fill="#808080" d="M0 0h1086v1448H0z"/><ellipse cx="366" cy="736" rx="140" ry="150" fill="url(#ear)"/><ellipse cx="321" cy="1016" rx="151" ry="144" fill="url(#tail)"/></svg>`)}`;
const eyes = { recovering: [[567,824,22,25],[630,798,14,20]], thriving: [[592,789,22,26],[653,765,14,22]], weary: [[566,797,21,25],[623,763,14,21]] };
export function LivingArt({world}: {world:World}) {
  const condition=conditionOf(world);
  const id=`creature-${useId().replace(/[^a-zA-Z0-9]/g,'')}`;
  const displacement=useRef<SVGFEDisplacementMapElement>(null);
  const lids=useRef<SVGGElement>(null);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [choice,setChoice]=useState<boolean|null>(()=>{try{const value=localStorage.getItem('tamago-character-motion');return value==='on'?true:value==='off'?false:null;}catch{return null;}});
  const running=choice??!reduced;
  useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
  useEffect(()=>{
    let frame=0, start=0, last=0;
    const reset=()=>{displacement.current?.setAttribute('scale','0');if(lids.current){lids.current.style.opacity='0';lids.current.dataset.blink='open';}};
    reset();
    if(!running)return;
    // Drive the actual attributes, avoiding SVG SMIL playback/invalidation differences.
    // performance time keeps this independent of the persisted 30-minute clock.
    const tick=(now:number)=>{
      if(!start)start=now;
      if(now-last>=1000/30){
        last=now;
        const seconds=(now-start)/1000;
        const sway=Math.sin(seconds*Math.PI*2/2.8);
        displacement.current?.setAttribute('scale',(sway*(sway>0?112:64)).toFixed(2));
        const phase=seconds%3.8;
        const close=(from:number,to:number)=>phase<from||phase>to?0:Math.min(1,(phase-from)/.09,(to-phase)/.09);
        const blink=Math.max(close(.65,1.13),close(1.38,1.68));
        if(lids.current){lids.current.style.opacity=String(blink);lids.current.dataset.blink=blink>.95?'closed':'open';}
      }
      frame=requestAnimationFrame(tick);
    };
    const resume=()=>{cancelAnimationFrame(frame);if(!document.hidden){start=0;frame=requestAnimationFrame(tick);}else reset();};
    document.addEventListener('visibilitychange',resume);
    window.addEventListener('pageshow',resume);
    resume();
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);reset();};
  },[running,condition]);
  const toggle=()=>{const next=!running;setChoice(next);try{localStorage.setItem('tamago-character-motion',next?'on':'off');}catch{/* Playback still works when storage is unavailable. */}};
  return <div className="living-art" data-motion={running?'playing':'paused'}>

    <img className="scene-art" src={`/art/${condition}.png`} alt="木漏れ日の住処で、耳と尻尾をゆっくり動かす小さな生き物。" />
    <svg className="creature-motion" viewBox="0 0 1086 1448" aria-hidden="true">
      <defs>
        <filter id={id} x="0" y="0" width="1086" height="1448" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={field} x="0" y="0" width="1086" height="1448" result="parts"/>
          <feDisplacementMap ref={displacement} in="SourceGraphic" in2="parts" scale="0" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <radialGradient id={`${id}-lid`}><stop stopColor={condition==='weary'?'#b2b5a4':'#b1d3bc'}/><stop offset="1" stopColor="#e4ecd0"/></radialGradient>
      </defs>
      <image href={`/art/${condition}.png`} width="1086" height="1448" filter={`url(#${id})`}/>
      <g ref={lids} className="eyelids" data-blink="open" style={{opacity:0}}>{eyes[condition].map(([x,y,rx,ry],i)=><g key={i} transform={`rotate(-20 ${x} ${y})`}><ellipse cx={x} cy={y} rx={rx+3} ry={ry+3} fill={`url(#${id}-lid)`}/><path d={`M ${x-rx+3} ${y} Q ${x} ${y+14} ${x+rx-3} ${y}`} fill="none" stroke="#4b4c3c" strokeWidth="4" strokeLinecap="round"/></g>)}</g>
    </svg>
    <button className="motion-toggle" onClick={toggle} aria-label={running?'キャラの動きを止める':'キャラの動きを再生する'} aria-pressed={running}><span aria-hidden="true">{running?'Ⅱ':'▷'}</span>動き：{running?'オン':'オフ'}</button>
  </div>;
}
