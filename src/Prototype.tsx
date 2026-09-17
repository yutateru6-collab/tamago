import { useState } from 'react';
import { MobileScroll, BottomSheet } from './mobile';
import { HomeIcon, GlobeIcon, BackpackIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useWorld } from './application/useWorld';
import { Home, Explore, Habitat, Journal } from './ui/Screens';
import { Scene } from './ui/Scene';

const tabs = [{ id:'home', label:'ホーム', Icon:HomeIcon },{ id:'explore',label:'探索',Icon:GlobeIcon },{id:'habitat',label:'住処',Icon:BackpackIcon},{id:'journal',label:'記録',Icon:ReaderIcon}] as const;
type Tab = typeof tabs[number]['id'];
export default function Prototype() {
  const app = useWorld();
  const [tab,setTab]=useState<Tab>('home');
  const [settings,setSettings]=useState(false);
  const [away,setAway]=useState(false);
  const [busy,setBusy]=useState(false);
  const unseen=app.world.memories.filter(m=>!app.world.seenMemoryIds.includes(m.id));
  const act=async(fn:()=>Promise<void>)=>{if(busy)return;setBusy(true);try{await fn();}finally{setBusy(false);}};
  return <div className="tamago">
    <MobileScroll key={away?'away':tab} className="app-screen"><main className="tamago-content">
      {app.error && <div className="error" role="alert">{app.error}<button onClick={app.reload}>読み直す</button></div>}
      {away ? <><Scene world={app.world}/><section className="paper home-paper"><h2>あとは、画面を閉じて。</h2><p>この子は休み、住処を整えます。</p><p className="demo-notice">現在は試作モードです。実際の放置時間は反映しません。「変化を試す」から体験できます。</p><button className="primary" onClick={()=>{setAway(false);setSettings(true);}}>変化を試す</button><button className="text-link" onClick={()=>setAway(false)}>ホームに戻る</button></section></>
      : tab==='home'?<Home world={app.world} onAway={()=>setAway(true)} onSettings={()=>setSettings(true)}/>
      : tab==='explore'?<Explore world={app.world} travel={id=>void act(()=>app.travel(id))}/>
      : tab==='habitat'?<Habitat world={app.world} craft={id=>void act(()=>app.craft(id))}/>
      : <Journal world={app.world}/>}
    </main></MobileScroll>
    {!away && <nav className="bottom-nav" aria-label="メインメニュー">{tabs.map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon/><span>{label}</span></button>)}</nav>}
    <BottomSheet open={settings} onOpenChange={setSettings} title="試作モード" description="スマホ全体の使用時間は、まだ計測していません。" snap={0.82}>
      <div className="sheet-body"><p>ここでは仮の時間で、キャラと住処の変化を試せます。アプリを閉じただけでは、回復したことにしません。</p>
        <div className="demo-actions"><button className="primary" disabled={!app.ready||busy} onClick={()=>void act(()=>app.simulate('away',120))}>離れた時間を試す（2時間）</button>
        <button className="secondary" disabled={!app.ready||busy} onClick={()=>void act(()=>app.simulate('usage',120))}>使いすぎた状態を試す（2時間）</button></div>
        <p className="muted">数値は仮調整です。探索・制作の結果は、このブラウザに保存されます。</p>
        {app.error && <p role="alert" className="error">{app.error}</p>}
        <h3>本番に向けて</h3><p>端末の計測許可とOS連携は次の段階です。許可がない時間や、不明な時間を悪化の理由にはしません。</p>
        <button className="secondary" onClick={()=>setSettings(false)}>住処に戻る</button>
      </div>
    </BottomSheet>
    <BottomSheet open={!settings && unseen.length>0} onOpenChange={open=>{if(!open)void act(app.acknowledge);}} title="おかえり" description="離れていた間に、この子の暮らしが進みました。" snap={0.82}>
      <div className="sheet-body">{unseen.slice(0,3).map(m=><article className="memory" key={m.id}><h3>{m.title}</h3><p>{m.detail}</p></article>)}{unseen.length>3&&<p>ほかの変化も、記録に残しました。</p>}<p className="muted">変化は自動で保存済みです。</p><button className="primary" disabled={busy} onClick={()=>void act(app.acknowledge)}>住処をのぞく</button></div>
    </BottomSheet>
  </div>;
}
