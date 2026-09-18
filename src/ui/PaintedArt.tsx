import { useEffect, useRef, useState, type ReactNode } from 'react';

export function PaintedArt({children}: {children?: ReactNode}) {
  const video=useRef<HTMLVideoElement>(null);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [choice,setChoice]=useState<boolean|null>(()=>{
    try { const value=localStorage.getItem('tamago-character-motion'); return value==='on'?true:value==='off'?false:null; }
    catch { return null; }
  });
  const [playing,setPlaying]=useState(false);
  const [failed,setFailed]=useState(false);
  const running=choice??!reduced;
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(query.matches);
    query.addEventListener('change',update);
    return()=>query.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const element=video.current;
    if(!element)return;
    let active=true;
    const update=()=>{
      if(running&&!document.hidden&&!failed) {
        void element.play().catch(()=>{if(active)setPlaying(false);});
      } else element.pause();
    };
    update();
    document.addEventListener('visibilitychange',update);
    window.addEventListener('pageshow',update);
    return()=>{active=false;element.pause();document.removeEventListener('visibilitychange',update);window.removeEventListener('pageshow',update);};
  },[running,failed]);
  const toggle=()=>{
    const next=!playing;setChoice(next);
    try {localStorage.setItem('tamago-character-motion',next?'on':'off');}catch{/* Playback also works without storage. */}
    if(next)void video.current?.play().catch(()=>setPlaying(false));
  };
  return <div className="living-art painted-art" data-motion={playing?'playing':'paused'}>
    <img className="scene-art" src="/art/workshop-idle.jpg" alt="木漏れ日の工房で、穏やかに過ごす青い子。"/>
    <video ref={video} className="painted-video" aria-label="工房の青い子の原画アニメ" src="/art/workshop-idle.mp4" poster="/art/workshop-idle.jpg" muted loop playsInline preload="metadata" hidden={failed||!running} onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setPlaying(false);}}/>
    {children}
    {failed?<span className="motion-toggle" role="status">静止画で表示中</span>:<button className="motion-toggle" onClick={toggle} aria-label={playing?'キャラの動きを止める':'キャラの動きを再生する'} aria-pressed={playing}><span aria-hidden="true">{playing?'Ⅱ':'▷'}</span>動き：{playing?'オン':'オフ'}</button>}
  </div>;
}
