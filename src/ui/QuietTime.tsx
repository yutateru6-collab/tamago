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
    <p>{remaining?`${session.purpose}の時間を、ありがとう。`:'画面を見ずに過ごせたら、教えてね。'}</p>
    <div className="quiet-clock"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88"/><circle className="clock-progress" cx="100" cy="100" r="88" strokeDasharray="553" strokeDashoffset={553*(1-progress)}/></svg><div><span className="clock-leaf">☾</span><strong>{remaining?`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`:'30分'}</strong><span>{remaining?'あと、このくらい':'お約束の時間が過ぎました'}</span></div></div>
    {remaining>0?<><h2>あなたも、自分の時間を。</h2><p>お茶を淹れる。本を開く。窓の外を見る。<br/>この画面は閉じて大丈夫。<br/>戻ってきたら、つづきから確認できます。</p><p className="quiet-tip">終わる目安：{new Date(session.endsAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})} · 通知は届きません</p></>:<><button className="primary" disabled={busy} onClick={complete}>30分、スマホを休めた</button><p className="honesty-note">自己申告として記録し、この子が少し回復します。</p></>}
    {cancelOpen?<div className="cancel-confirm"><p>今回はここまでにする？<br/>元気も、持ちものも減りません。</p><button className="secondary" disabled={busy} onClick={cancel}>今回はおしまいにする</button><button className="text-link" onClick={()=>setCancelOpen(false)}>お約束をつづける</button></div>:<button className="text-link" onClick={()=>setCancelOpen(true)}>{remaining?'途中でやめる（罰はありません）':'今回は休めなかった'}</button>}
  </section>;
}
