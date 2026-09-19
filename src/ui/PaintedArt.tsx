import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCompanion } from './CompanionContext';

export function PaintedArt({children}: {children?: ReactNode}) {
  const companion=useCompanion();
  const video=useRef<HTMLVideoElement>(null);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [choice,setChoice]=useState<boolean|null>(()=>{
    try { const value=localStorage.getItem('tamago-character-motion'); return value==='on'?true:value==='off'?false:null; }
    catch { return null; }
  });
  const [playing,setPlaying]=useState(false);
  const [failed,setFailed]=useState(false);
  const running=choice??!reduced;
  const animated=companion.id==='original'?running&&playing:running;
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
  },[running,failed,companion.id]);
  const toggle=()=>{
    const next=!animated;setChoice(next);
    try {localStorage.setItem('tamago-character-motion',next?'on':'off');}catch{/* Playback also works without storage. */}
    if(next)void video.current?.play().catch(()=>setPlaying(false));
  };
  return <div className="living-art painted-art" data-motion={animated?'playing':'paused'} data-companion={companion.id}>
    <img className="scene-art" src="/art/home-base.webp" alt="滝と木漏れ日、小さな灯り。これから暮らしをつくる住処。"/>
    {companion.id==='original'?<><img className="original-companion" src="/art/workshop-idle.jpg" alt="木漏れ日の工房で、穏やかに過ごす青い子。"/>
    <video ref={video} className="painted-video" aria-label="工房の青い子の原画アニメ" src="/art/workshop-idle.mp4" poster="/art/workshop-idle.jpg" muted loop playsInline preload="metadata" hidden={failed||!running} onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setPlaying(false);}}/></>:<img className={`variant-companion ${companion.id}`} src={companion.image} alt={`${companion.name}。同じ住処で過ごす試作キャラクター。`}/>}
    {children}
    {failed&&companion.id==='original'?<span className="motion-toggle" role="status">静止画で表示中</span>:<button className="motion-toggle" onClick={toggle} aria-label={animated?'キャラの動きを止める':'キャラの動きを再生する'} aria-pressed={animated}><span aria-hidden="true">{animated?'Ⅱ':'▷'}</span>動き：{animated?'オン':'オフ'}</button>}
  </div>;
}
