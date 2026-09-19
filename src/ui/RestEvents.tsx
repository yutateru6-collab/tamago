import { useState } from 'react';
import { BottomSheet } from '../mobile';
import type { World } from '../domain/model';
import { REST_EVENTS, restEventState, type RestEventId } from '../domain/restEvents';
import { LivingArt } from './LivingArt';
import './rest-events.css';

function EventIcon({id,finished=false}:{id:RestEventId;finished?:boolean}) {
  return <img className={`event-icon ${finished?'event-served':''}`} src={`/art/event-${id}.webp`} alt="" draggable={false}/>;
}
export function RestEvents({world,busy,onEvent,onAway}:{world:World;busy:boolean;onEvent:(id:RestEventId)=>void;onAway:()=>void}) {
  return <section className="rest-events" aria-label="休んだあとの、お楽しみ"><h2>休んだあとの、お楽しみ</h2>
    <p>30分ずつ、分けて休んでも大丈夫。</p>
    <div className="rest-event-list">{REST_EVENTS.map(event=>{
      const state=restEventState(world,event.id);
      return <article className="rest-event-card" key={event.id} data-rest-event={event.id}>
        <EventIcon id={event.id}/><div><span className="event-interval">合計{event.minutes}分ごと</span><h3>{event.name}</h3>
          <p>{state.available>0?`いま ${state.available}回 楽しめます`:`あと${state.remaining}分の休息で、楽しめます`}</p>
          {state.available>0?<button className="event-button" disabled={busy} onClick={()=>onEvent(event.id)}>{event.name}を楽しむ</button>
            :<progress aria-label={`${event.name}までの休息`} value={state.progress} max={event.minutes}/>}
        </div>
      </article>;
    })}</div>
    <details className="event-details"><summary>お楽しみが増えるしくみ</summary><p>「休めた」と伝えた30分が、3つのお楽しみに共通でたまります。回復や制作中でも同じです。ためた回数に期限はなく、あとで楽しめます。途中でやめても減りません。</p><p>この機能で記録した休息：合計{world.restEvents?.minutes??0}分</p><button className="text-link" disabled={busy} onClick={onAway}>{world.quietSession?'お約束のつづきを見る':'次の30分を休む'}</button></details>
  </section>;
}

export function RestEventSheet({world,id,expected,busy,error,enjoy,close}:{world:World;id:RestEventId;expected:number;busy:boolean;error:string;enjoy:()=>Promise<boolean>;close:()=>void}) {
  const [finished,setFinished]=useState(false);
  const event=REST_EVENTS.find(e=>e.id===id)!;
  const state=restEventState(world,id);
  const changed=state.enjoyed!==expected;
  return <BottomSheet open onOpenChange={open=>{if(!open)close();}} title={event.name} description={finished?'この子と過ごした時間を、記録に残しました。':event.invitation} snap={0.9}>
    <div className={`sheet-body rest-event-sheet ${finished?'event-finished':''}`}>
      <div className="event-vignette"><LivingArt world={world}/><div className="event-tableau"><EventIcon id={id} finished={finished}/></div>{finished&&<div className="event-reaction" aria-hidden="true"><span>✦</span><span>❧</span><span>✦</span></div>}</div>
      {finished?<><p className="event-result" role="status">{event.result}</p><button className="primary" onClick={close}>住処へ戻る</button></>
      :<><p className="event-result">{changed?'ほかの画面で記録が変わりました。一度閉じて確認してね。':`ためていたお楽しみを1回使います。残り ${state.available}回。`}</p>{error&&<p role="alert" className="error">{error}</p>}<button className="primary" disabled={busy||changed||state.available<1} onClick={async()=>{if(await enjoy())setFinished(true);}}>{event.action}</button><button className="text-link" onClick={close}>またあとで楽しむ</button></>}
    </div>
  </BottomSheet>;
}
