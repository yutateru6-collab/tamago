import '@fontsource/zen-maru-gothic/400.css';
import '@fontsource/zen-maru-gothic/500.css';
import '@fontsource/zen-maru-gothic/700.css';
import { useState } from 'react';
import { MobileScroll, BottomSheet } from './mobile';
import { HomeIcon, GlobeIcon, BackpackIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useWorld } from './application/useWorld';
import { Home, Explore, Habitat, Journal } from './ui/Screens';
import { QuietTime } from './ui/QuietTime';

const tabs = [{ id:'home', label:'ホーム', Icon:HomeIcon },{ id:'explore',label:'探索',Icon:GlobeIcon },{id:'habitat',label:'住処',Icon:BackpackIcon},{id:'journal',label:'記録',Icon:ReaderIcon}] as const;
type Tab = typeof tabs[number]['id'];
export default function Prototype() {
  const app = useWorld();
  const [tab,setTab]=useState<Tab>('home');
  const [settings,setSettings]=useState(false);
  const [away,setAway]=useState(false);
  const [busy,setBusy]=useState(false);
  const unseen=app.world.memories.filter(m=>!app.world.seenMemoryIds.includes(m.id));
  const act=async(fn:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);try{await fn();}finally{setBusy(false);}};
  return <div className="tamago">
    <MobileScroll key={away?'away':tab} className="app-screen"><main className="tamago-content">
      {app.error && <div className="error" role="alert">{app.error}<button onClick={app.reload}>読み直す</button></div>}
      {away && app.world.quietSession ? <QuietTime world={app.world} busy={busy} complete={()=>void act(async()=>{if(await app.completeQuiet())setAway(false);})} cancel={()=>void act(async()=>{if(await app.cancelQuiet())setAway(false);})} back={()=>setAway(false)}/>
      : tab==='home'?<Home world={app.world} onAway={()=>void act(async()=>{if(await app.beginQuiet())setAway(true);})} onSettings={()=>setSettings(true)} onHabitat={()=>setTab('habitat')}/>
      : tab==='explore'?<Explore world={app.world} travel={id=>void act(()=>app.travel(id))}/>
      : tab==='habitat'?<Habitat world={app.world} craft={id=>void act(()=>app.craft(id))}/>
      : <Journal world={app.world}/>}
    </main></MobileScroll>
    {!away && <nav className="bottom-nav" aria-label="メインメニュー">{tabs.map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon/><span>{label}</span></button>)}</nav>}
    <BottomSheet open={settings} onOpenChange={setSettings} title="この子との暮らし方" description="自己申告で、少しずつ暮らしを育てます。" snap={0.82}>
      <div className="sheet-body"><h3>つい、使いすぎたとき</h3><p>必要な連絡や仕事は気にしなくて大丈夫。自分で「30分、余分に見てしまった」と感じたときだけ記録できます。元気と住処が少し下がりますが、休めば戻ります。</p><button className="secondary" disabled={!app.ready||busy} onClick={()=>void act(app.reportUsage)}>使いすぎ30分を記録する</button><h3>変化をすぐに試す</h3><p>ここでは仮の時間で、キャラと住処の変化を試せます。アプリを閉じただけでは、回復したことにしません。</p>
        <div className="demo-actions"><button className="primary" disabled={!app.ready||busy} onClick={()=>void act(()=>app.simulate('away',120))}>離れた時間を試す（2時間）</button>
        <button className="secondary" disabled={!app.ready||busy} onClick={()=>void act(()=>app.simulate('usage',120))}>使いすぎた状態を試す（2時間）</button></div>
        <p className="muted">数値は仮調整です。探索・制作の結果は、このブラウザに保存されます。</p>
        {app.error && <p role="alert" className="error">{app.error}</p>}
        <h3>本番に向けて</h3><p>端末の計測許可とOS連携は次の段階です。許可がない時間や、不明な時間を悪化の理由にはしません。</p>
        <button className="secondary" onClick={()=>setSettings(false)}>住処に戻る</button>
      </div>
    </BottomSheet>
    <BottomSheet open={!settings && unseen.length>0} onOpenChange={open=>{if(!open)void act(app.acknowledge);}} title="おかえり" description="記録した休息で、この子の暮らしが進みました。" snap={0.82}>
      <div className="sheet-body">{unseen.slice(0,3).map(m=><article className="memory" key={m.id}><h3>{m.title}</h3><p>{m.detail}</p></article>)}{unseen.length>3&&<p>ほかの変化も、記録に残しました。</p>}<p className="muted">変化は自動で保存済みです。</p><button className="primary" disabled={busy} onClick={()=>void act(app.acknowledge)}>住処をのぞく</button></div>
    </BottomSheet>
  </div>;
}
