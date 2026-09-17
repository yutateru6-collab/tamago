import { LivingArt } from './LivingArt';
import { useEffect, useState } from 'react';
import type { World } from '../domain/model';
export function QuietTime({world, busy, complete, cancel, back}: {world:World; busy:boolean; complete:()=>void; cancel:()=>void; back:()=>void}) {
  const [now,setNow]=useState(Date.now());
  const [cancelOpen,setCancelOpen]=useState(false);
  useEffect(()=>{const tick=()=>setNow(Date.now());const timer=window.setInterval(tick,1000);document.addEventListener('visibilitychange',tick);window.addEventListener('pageshow',tick);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick);window.removeEventListener('pageshow',tick);};},[]);
  const session=world.quietSession;
  if(!session) return null;
  const remaining=Math.max(0,Math.ceil((session.endsAt-now)/1000));
  const progress=Math.min(1,Math.max(0,(now-session.startedAt)/1800000));
  return <section className="quiet-screen">
    <button className="text-link quiet-back" onClick={back}>‹ 住処へ戻る</button>
    <p className="eyebrow">この子と、30分のお約束</p><h1>{remaining?'あとは、スマホを置いて。':'おかえり。休めたかな？'}</h1>
    <div className="quiet-vignette"><LivingArt world={world}/><div className="quiet-story"><span className="story-light"/><p>{remaining?`${session.purpose}、ゆっくり進めているよ。`:'待っていてくれて、ありがとう。'}</p></div></div>
    <div className="quiet-clock" role="timer" aria-label="お約束の残り時間"><span className="clock-leaf" aria-hidden="true">☾</span><div><span>{remaining?'お約束まで、あと':'お約束の時間が過ぎました'}</span><strong>{remaining?`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`:'30分'}</strong></div><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17"/><circle className="clock-progress" cx="20" cy="20" r="17" strokeDasharray="107" strokeDashoffset={107*(1-progress)}/></svg></div>
    {remaining>0?<><h2>あなたにも、ひとやすみ。</h2><div className="quiet-rituals">
      <div><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 22h23v10a10 10 0 0 1-10 8h-3a10 10 0 0 1-10-8zM33 24h3a5 5 0 0 1 0 10h-4M8 42h29M17 16c-6-5 5-7 0-12M26 16c-6-5 5-7 0-12"/></svg><span>お茶を淹れる</span></div>
      <div><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 14C17 9 10 9 5 11v27c7-2 13-1 19 3 6-4 12-5 19-3V11c-5-2-12-2-19 3v27M11 18l7 2M11 25l7 2M30 20l7-2M30 27l7-2"/></svg><span>本をひらく</span></div>
      <div><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 7h32v35H8zM24 7v35M8 25h32M13 37l7-8 8 8M30 35l5-6M30 14h1"/><circle cx="17" cy="16" r="3"/></svg><span>外をながめる</span></div>
    </div><p className="quiet-reassurance">画面を閉じて、大丈夫。<br/>戻ったら、つづきから見られます。</p><p className="quiet-tip">{new Date(session.endsAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})} ごろに、またね <span>· 通知は届きません</span></p></>:<><button className="primary" disabled={busy} onClick={complete}>30分、スマホを休めた</button><p className="honesty-note">自己申告として記録し、この子が少し回復します。</p></>}
    {cancelOpen?<div className="cancel-confirm"><p>今回はここまでにする？<br/>元気も、持ちものも減りません。</p><button className="secondary" disabled={busy} onClick={cancel}>今回はおしまいにする</button><button className="text-link" onClick={()=>setCancelOpen(false)}>お約束をつづける</button></div>:<button className="text-link" onClick={()=>setCancelOpen(true)}>{remaining?'途中でやめる（罰はありません）':'今回は休めなかった'}</button>}
  </section>;
}
