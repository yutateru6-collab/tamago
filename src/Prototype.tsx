import '@fontsource/zen-maru-gothic/400.css';
import '@fontsource/zen-maru-gothic/500.css';
import '@fontsource/zen-maru-gothic/700.css';
import './ui/journey.css';
import { useEffect, useRef, useState } from 'react';
import { MobileScroll, BottomSheet } from './mobile';
import { HomeIcon, GlobeIcon, BackpackIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useWorld } from './application/useWorld';
import { Home, Explore, Habitat, Journal } from './ui/Screens';
import { QuietTime } from './ui/QuietTime';
import { DeveloperPanel } from './ui/DeveloperPanel';
import { createBackup, parseBackup, SANDBOX_KEY } from './platform/storage';
import type { World } from './domain/model';
import { restEventState, type RestEventId } from './domain/restEvents';
import { RestEventSheet } from './ui/RestEvents';
import { CompanionProvider, COMPANIONS, COMPANION_KEY, type CompanionId } from './ui/CompanionContext';

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
  const [usageConfirm,setUsageConfirm]=useState(false);
  const [backupStatus,setBackupStatus]=useState('');
  const [restoreCandidate,setRestoreCandidate]=useState<World|null>(null);
  const [away,setAway]=useState(false);
  const [busy,setBusy]=useState(false);
  const [event,setEvent]=useState<{id:RestEventId;expected:number}|null>(null);
  const [companion,setCompanion]=useState<CompanionId>(()=>{
    try {const saved=sandbox?sessionStorage.getItem(COMPANION_KEY):null;return COMPANIONS.find(c=>c.id===saved)?.id??'original';}catch{return 'original';}
  });
  const [companionError,setCompanionError]=useState('');
  const contentRef=useRef<HTMLElement|null>(null);
  const chooseCompanion=(id:CompanionId)=>{try{sessionStorage.setItem(COMPANION_KEY,id);setCompanion(id);setCompanionError('');}catch{setCompanionError('このタブにキャラの選択を保存できませんでした。');}};
  useEffect(()=>{const id=requestAnimationFrame(()=>{const heading=contentRef.current?.querySelector<HTMLElement>('h1[tabindex="-1"]');heading?.focus({preventScroll:true});});return()=>cancelAnimationFrame(id);},[tab,away]);
  const unseen=app.world.memories.filter(m=>!app.world.seenMemoryIds.includes(m.id));
  const act=async(fn:()=>Promise<boolean>)=>{if(busy)return false;setBusy(true);try{return await fn();}finally{setBusy(false);}};
  const openQuiet=()=>void act(async()=>{const ok=await app.beginQuiet();if(ok){setTab('home');setAway(true);}return ok;});
  const showHome=()=>void act(async()=>{const ok=await app.acknowledge();if(ok){setAway(false);setTab('home');}return ok;});
  const blocked=!app.ready||busy;
  const exportBackup=()=>{try{const raw=createBackup(app.world);const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`tamago-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);setBackupStatus('バックアップを書き出しました。大切な場所に保存してください。');}catch{setBackupStatus('バックアップを書き出せませんでした。');}};
  const selectBackup=async(file?:File)=>{if(!file)return;try{const candidate=parseBackup(await file.text());setRestoreCandidate(candidate);setBackupStatus(`バックアップを確認しました。思い出 ${candidate.memories.length}件・完成 ${candidate.built.length}件。まだ現在の記録は変更していません。`);}catch(e){setRestoreCandidate(null);setBackupStatus(e instanceof Error?e.message:'バックアップを確認できませんでした。');}};
  const confirmRestore=()=>{if(!restoreCandidate)return;void act(async()=>{const ok=await app.restore(restoreCandidate);if(ok){setRestoreCandidate(null);setBackupStatus('バックアップを復元しました。進行中だった30分のお約束だけは安全のため終了しました。');}return ok;});};
  return <CompanionProvider id={sandbox?companion:'original'}><div className={`tamago ${sandbox?'is-sandbox':''}`}>
    {sandbox&&<div className="sandbox-banner"><span>開発者モード · 試作用の記録</span><button onClick={()=>{setAway(false);setTab('developer');}}>確認パネル</button><button onClick={()=>changeMode(false)}>通常に戻る</button></div>}
    <MobileScroll key={away?'away':tab} className="app-screen"><main ref={contentRef} className="tamago-content">
      {app.error && <div className="error" role="alert">{app.error}<button onClick={app.reload}>読み直す</button></div>}
      {companionError&&<p role="alert" className="error">{companionError}</p>}
      {away && app.world.quietSession ? <QuietTime world={app.world} busy={blocked} complete={()=>void act(async()=>{const ok=await app.completeQuiet();if(ok)setAway(false);return ok;})} cancel={()=>void act(async()=>{const ok=await app.cancelQuiet();if(ok)setAway(false);return ok;})} back={()=>setAway(false)}/>
      : sandbox&&tab==='developer'?<DeveloperPanel world={app.world} busy={blocked} preset={name=>void act(()=>app.preset(name))} rest={()=>void act(app.restNow)} simulate={(kind,minutes)=>void act(()=>app.simulate(kind,minutes))} onHome={()=>setTab('home')} companion={companion} onCompanion={chooseCompanion}/>
      : tab==='home'?<Home world={app.world} busy={blocked} onAway={openQuiet} onSettings={()=>setSettings(true)} onHabitat={()=>setTab('habitat')} onEvent={id=>setEvent({id,expected:restEventState(app.world,id).enjoyed})}/>
      : tab==='explore'?<Explore world={app.world} busy={blocked} onAway={openQuiet} travel={id=>void act(async()=>{const ok=await app.travel(id);if(ok)setTab('home');return ok;})}/>
      : tab==='habitat'?<Habitat world={app.world} busy={blocked} onAway={openQuiet} onExplore={()=>setTab('explore')} arrange={(id,slot)=>void act(()=>app.arrange(id,slot))} craft={id=>void act(async()=>{const ok=await app.craft(id);if(ok)setTab('home');return ok;})}/>
      : <Journal world={app.world}/>}
    </main></MobileScroll>
    {!away && <nav className="bottom-nav" aria-label="メインメニュー">{tabs.map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon/><span>{label}</span></button>)}</nav>}
    <BottomSheet open={settings} onOpenChange={open=>{setSettings(open);if(!open){setUsageConfirm(false);setRestoreCandidate(null);}}} title="この子との暮らし方" description="自己申告で、少しずつ暮らしを育てます。" snap={0.82}>
      <div className="sheet-body settings-sections">
        <section aria-labelledby="save-heading"><h3 id="save-heading">記録を守る</h3><p>通常の記録はこのブラウザに保存します。ブラウザのデータ削除に備えて、自分でバックアップできます。</p>
          {!sandbox?<><button className="secondary" type="button" onClick={exportBackup}>バックアップを書き出す</button><label className="secondary file-button">バックアップを読み込む<input type="file" accept="application/json,.json" onChange={e=>{void selectBackup(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/></label>
          {restoreCandidate&&<div className="restore-confirm" role="group" aria-label="バックアップの復元確認"><p>現在の記録を、このバックアップの内容に置き換えます。先に書き出しておくと安心です。</p><button className="primary" disabled={blocked} onClick={confirmRestore}>このバックアップを復元する</button><button className="text-link" onClick={()=>{setRestoreCandidate(null);setBackupStatus('復元を取り消しました。現在の記録はそのままです。');}}>復元しない</button></div>}</>:<p className="muted">開発者モードの試作データはバックアップ対象外です。通常に戻って操作してください。</p>}
          {backupStatus&&<p className="settings-status" role="status">{backupStatus}</p>}</section>
        <section aria-labelledby="usage-heading"><h3 id="usage-heading">つい、使いすぎたとき</h3><p>必要な連絡や仕事は気にしなくて大丈夫。自分で「30分、余分に見てしまった」と感じたときだけ記録できます。</p>
          {!usageConfirm?<button className="secondary" disabled={blocked} onClick={()=>setUsageConfirm(true)}>使いすぎ30分を記録する</button>:<div className="usage-confirm" role="group" aria-label="使いすぎ記録の確認"><p><strong>30分の使いすぎとして記録しますか？</strong><br/>元気と住処が少し下がります。休めば戻せます。</p><button className="primary" disabled={blocked} onClick={()=>void act(async()=>{const ok=await app.reportUsage();if(ok)setUsageConfirm(false);return ok;})}>30分を記録する</button><button className="text-link" onClick={()=>setUsageConfirm(false)}>やめる</button></div>}</section>
        <section aria-labelledby="dev-heading"><h3 id="dev-heading">開発者用の確認</h3><p>家具が増える・傷む・直る様子を、待たずに試せます。通常の進捗と分かれた試作用の住処を使います。</p>
          <button className="secondary" disabled={blocked} onClick={()=>sandbox?(setSettings(false),setTab('developer')):changeMode(true,app.world)}>開発者モードを開く</button></section>
        {entryError&&<p role="alert" className="error">{entryError}</p>}
        {app.error && <p role="alert" className="error">{app.error}</p>}
        <h3>このWeb版について</h3><p>端末全体の使用時間は計測しません。通知は届きません。休息は「休めた」と伝えたときだけ記録します。</p>
        <button className="secondary" onClick={()=>setSettings(false)}>住処に戻る</button>
      </div>
    </BottomSheet>
    {event&&<RestEventSheet key={`${event.id}:${event.expected}`} world={app.world} id={event.id} expected={event.expected} busy={blocked} error={app.error} enjoy={()=>act(()=>app.enjoy(event.id,event.expected))} close={()=>setEvent(null)}/>}
    <BottomSheet open={!settings && !event && unseen.length>0} onOpenChange={open=>{if(!open)void act(app.acknowledge);}} title="おかえり" description={sandbox?'試作用の住処で起きた変化です。通常の記録には反映しません。':'記録した休息で、この子の暮らしが進みました。'} snap={0.82}>
      <div className="sheet-body">{unseen.slice(0,3).map(m=><article className="memory" key={m.id}><h3>{m.title}</h3><p>{m.detail}</p></article>)}{unseen.length>3&&<p>ほかの変化も、記録に残しました。</p>}<p className="muted">途中までの制作も、自動で保存済みです。次は、好きなときに。</p>{app.error && <p role="alert" className="error">{app.error}</p>}<button className="primary" disabled={blocked} onClick={showHome}>住処をのぞく</button></div>
    </BottomSheet>
  </div></CompanionProvider>;
}
