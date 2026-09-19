import '@fontsource/zen-maru-gothic/400.css';
import '@fontsource/zen-maru-gothic/500.css';
import '@fontsource/zen-maru-gothic/700.css';
import './ui/journey.css';
import { useState } from 'react';
import { MobileScroll, BottomSheet } from './mobile';
import { HomeIcon, GlobeIcon, BackpackIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useWorld } from './application/useWorld';
import { Home, Explore, Habitat, Journal } from './ui/Screens';
import { QuietTime } from './ui/QuietTime';
import { DeveloperPanel } from './ui/DeveloperPanel';
import { SANDBOX_KEY } from './platform/storage';
import type { World } from './domain/model';

const tabs = [{ id:'home', label:'ホーム', Icon:HomeIcon },{ id:'explore',label:'探索',Icon:GlobeIcon },{id:'habitat',label:'住処',Icon:BackpackIcon},{id:'journal',label:'記録',Icon:ReaderIcon}] as const;
type Tab = typeof tabs[number]['id'] | 'developer';
export default function Prototype() {
  const [sandbox,setSandbox]=useState(()=>new URLSearchParams(location.search).get('dev')==='1');
  const [entryError,setEntryError]=useState('');
  const changeMode=(enabled:boolean,world?:World)=>{
    try {
      if(enabled&&world&&!sessionStorage.getItem(SANDBOX_KEY)) sessionStorage.setItem(SANDBOX_KEY,JSON.stringify({...world,seenMemoryIds:world.memories.map(m=>m.id)}));
      const url=new URL(location.href);
      if(enabled)url.searchParams.set('dev','1');else url.searchParams.delete('dev');
      history.replaceState(null,'',url);
      setEntryError('');setSandbox(enabled);
    } catch {setEntryError('試作用の保存領域を使えません。通常の記録は変更していません。');}
  };
  return <WorldApp key={sandbox?'sandbox':'personal'} sandbox={sandbox} changeMode={changeMode} entryError={entryError}/>;
}
function WorldApp({sandbox,changeMode,entryError}:{sandbox:boolean;changeMode:(enabled:boolean,world?:World)=>void;entryError:string}) {
  const app = useWorld(sandbox);
  const [tab,setTab]=useState<Tab>(sandbox?'developer':'home');
  const [settings,setSettings]=useState(false);
  const [away,setAway]=useState(false);
  const [busy,setBusy]=useState(false);
  const unseen=app.world.memories.filter(m=>!app.world.seenMemoryIds.includes(m.id));
  const act=async(fn:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);try{await fn();}finally{setBusy(false);}};
  const openQuiet=()=>void act(async()=>{if(await app.beginQuiet()){setTab('home');setAway(true);}});
  const showHome=()=>void act(async()=>{if(await app.acknowledge()){setAway(false);setTab('home');}});
  const blocked=!app.ready||busy;
  return <div className={`tamago ${sandbox?'is-sandbox':''}`}>
    {sandbox&&<div className="sandbox-banner"><span>開発者モード · 試作用の記録</span><button onClick={()=>{setAway(false);setTab('developer');}}>確認パネル</button><button onClick={()=>changeMode(false)}>通常に戻る</button></div>}
    <MobileScroll key={away?'away':tab} className="app-screen"><main className="tamago-content">
      {app.error && <div className="error" role="alert">{app.error}<button onClick={app.reload}>読み直す</button></div>}
      {away && app.world.quietSession ? <QuietTime world={app.world} busy={blocked} complete={()=>void act(async()=>{if(await app.completeQuiet())setAway(false);})} cancel={()=>void act(async()=>{if(await app.cancelQuiet())setAway(false);})} back={()=>setAway(false)}/>
      : sandbox&&tab==='developer'?<DeveloperPanel world={app.world} busy={blocked} preset={name=>void act(()=>app.preset(name))} rest={()=>void act(app.restNow)} simulate={(kind,minutes)=>void act(()=>app.simulate(kind,minutes))} onHome={()=>setTab('home')}/>
      : tab==='home'?<Home world={app.world} busy={blocked} onAway={openQuiet} onSettings={()=>setSettings(true)} onHabitat={()=>setTab('habitat')}/>
      : tab==='explore'?<Explore world={app.world} busy={blocked} onAway={openQuiet} travel={id=>void act(async()=>{if(await app.travel(id))setTab('home');})}/>
      : tab==='habitat'?<Habitat world={app.world} busy={blocked} onAway={openQuiet} onExplore={()=>setTab('explore')} arrange={(id,slot)=>void act(()=>app.arrange(id,slot))} craft={id=>void act(async()=>{if(await app.craft(id))setTab('home');})}/>
      : <Journal world={app.world}/>}
    </main></MobileScroll>
    {!away && <nav className="bottom-nav" aria-label="メインメニュー">{tabs.map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon/><span>{label}</span></button>)}</nav>}
    <BottomSheet open={settings} onOpenChange={setSettings} title="この子との暮らし方" description="自己申告で、少しずつ暮らしを育てます。" snap={0.82}>
      <div className="sheet-body"><h3>つい、使いすぎたとき</h3><p>必要な連絡や仕事は気にしなくて大丈夫。自分で「30分、余分に見てしまった」と感じたときだけ記録できます。元気と住処が少し下がりますが、休めば戻ります。</p><button className="secondary" disabled={blocked} onClick={()=>void act(app.reportUsage)}>使いすぎ30分を記録する</button>
        <h3>開発者用の確認</h3><p>家具が増える・傷む・直る様子を、待たずに試せます。通常の進捗と分かれた試作用の住処を使います。</p>
        <button className="secondary" disabled={blocked} onClick={()=>sandbox?(setSettings(false),setTab('developer')):changeMode(true,app.world)}>開発者モードを開く</button>
        {entryError&&<p role="alert" className="error">{entryError}</p>}
        {app.error && <p role="alert" className="error">{app.error}</p>}
        <h3>記録について</h3><p>通常の記録はこのブラウザに保存します。端末全体の使用時間は計測しません。通知は届きません。ブラウザのデータ削除で記録も消えます。</p>
        <button className="secondary" onClick={()=>setSettings(false)}>住処に戻る</button>
      </div>
    </BottomSheet>
    <BottomSheet open={!settings && unseen.length>0} onOpenChange={open=>{if(!open)void act(app.acknowledge);}} title="おかえり" description={sandbox?'試作用の住処で起きた変化です。通常の記録には反映しません。':'記録した休息で、この子の暮らしが進みました。'} snap={0.82}>
      <div className="sheet-body">{unseen.slice(0,3).map(m=><article className="memory" key={m.id}><h3>{m.title}</h3><p>{m.detail}</p></article>)}{unseen.length>3&&<p>ほかの変化も、記録に残しました。</p>}<p className="muted">途中までの制作も、自動で保存済みです。次は、好きなときに。</p>{app.error && <p role="alert" className="error">{app.error}</p>}<button className="primary" disabled={blocked} onClick={showHome}>住処をのぞく</button></div>
    </BottomSheet>
  </div>;
}
