import { useState } from 'react';
import type { World } from '../domain/model';
import { LivingArt } from './LivingArt';
import { homeState } from '../domain/home';
import { COMPANIONS, type CompanionId } from './CompanionContext';

export function DeveloperPanel({world,busy,preset,rest,simulate,onHome,companion,onCompanion}: {world:World;busy:boolean;preset:(name:string)=>void;rest:()=>void;simulate:(kind:'away'|'usage',minutes:number)=>void;onHome:()=>void;companion:CompanionId;onCompanion:(id:CompanionId)=>void}) {
  const [slots,setSlots]=useState(false);
  return <section className="paper inner-screen sandbox-screen"><p className="eyebrow">開発者用 · 試作用の住処</p><h1>暮らしの変化を試す</h1>
    <p className="sandbox-notice">通常の記録には反映しません。このタブ専用の試作データです。状態を選ぶと、この試作データだけが切り替わります。</p>
    <div className="sandbox-preview"><LivingArt world={world} showSlots={slots}/></div>
    <button className="secondary" aria-pressed={slots} onClick={()=>setSlots(!slots)}>配置枠を{slots?'隠す':'見る'}</button>
    <h2>同じ暮らしを、別の子でも</h2><div className="companion-options">{COMPANIONS.map(c=><button key={c.id} aria-pressed={companion===c.id} onClick={()=>onCompanion(c.id)}><img className={c.id==='original'?'original-choice':''} src={c.image} alt=""/>{c.name}</button>)}</div><p>追加の2体は、ゆっくり揺れる試作です。ホーム・探索・住処・記録・お楽しみで共通の子を表示します。通常版は今の青い子のままです。</p>
    <h2>見た目を選ぶ</h2><div className="sandbox-grid">{[
      ['initial','初期の住処'],['half','棚の制作50%'],['shelf','棚が完成'],['finds','探索の宝物と手帖'],['full','家具がすべて完成'],['faded','植物がしおれる'],['damaged','家具が傷む'],['empty','大きく傷む'],
    ].map(([id,label])=><button key={id} disabled={busy} className="secondary" onClick={()=>preset(id)}>{label}</button>)}</div>
    <h2>休んだあとの、お楽しみ</h2><div className="sandbox-grid">{[['rest30','休息30分・おやつ'],['rest60','休息60分・お茶'],['rest120','休息120分・ピクニック']].map(([id,label])=><button key={id} disabled={busy} className="secondary" onClick={()=>preset(id)}>{label}</button>)}</div><p>状態を選び「この状態でホームを見る」からお楽しみを試せます。30分の休息ボタンでも、通常と同じように回数がたまります。</p>
    <h2>イベントを進める</h2><div className="sandbox-actions">
      <button disabled={busy} className="primary" onClick={rest}>30分の休息を完了する</button>
      <button disabled={busy} className="secondary" onClick={()=>simulate('away',120)}>離れた時間を試す（2時間）</button>
      <button disabled={busy} className="secondary" onClick={()=>simulate('usage',120)}>使いすぎた状態を試す（2時間）</button>
      <p>回復 → 修繕 → 制作 → 探索の順で、通常と同じ進行処理を動かします。2時間の使いすぎも、一日の傷み上限はそのままです。</p>
    </div>
    <p role="status">完成家具 {world.built.length}個 · 探索 {world.expeditionCount}回 · 傷み {Math.round(homeState(world).wear)} / 100</p>
    <button className="primary" onClick={onHome}>この状態でホームを見る</button><p>ホームから制作・探索・模様がえ・帰還報告も試せます。上の「確認パネル」で戻れます。</p>
  </section>;
}
