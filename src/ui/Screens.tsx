import { ArrowRightIcon, CheckIcon, MoonIcon } from '@radix-ui/react-icons';
import { DESTINATIONS, MATERIAL_NAMES, RECIPES } from '../domain/catalog';
import { conditionOf } from '../domain/engine';
import type { Material, World } from '../domain/model';
import { Scene } from './Scene';

export function Home({world, onAway, onSettings}: {world: World; onAway: () => void; onSettings: () => void}) {
  const condition = conditionOf(world);
  const recipe = RECIPES.find(r => r.id === world.crafting?.recipeId);
  const title = condition === 'weary' ? '灯りが、弱くなっています。' : condition === 'thriving' ? '小さな灯りが、ともった。' : '少しずつ、暮らしが育つ。';
  return <><Scene world={world} onSettings={onSettings}/><section className="paper home-paper">
    <p className="eyebrow">この子の、小さな暮らし</p><h2>{title}</h2>
    <p>{condition === 'weary' ? '休む時間が、この子と住処の回復につながります。' : '拾う、直す、飾る。あなたが離れている間の物語。'}</p>
    <button className="primary" onClick={onAway}><MoonIcon/>スマホを置く<ArrowRightIcon/></button>
    <p className="next">{recipe ? `制作中：${recipe.name}` : `次の楽しみ：${DESTINATIONS.find(d => d.id === world.destination)?.name}`}</p>
    <button className="text-link" onClick={onSettings}>試作モード・端末の使用時間は未計測</button>
  </section></>;
}
export function Explore({world, travel}: {world: World; travel: (id:string) => void}) {
  return <section className="paper inner-screen"><p className="eyebrow">この子の、小さな冒険</p><h1>探索</h1>
    <img className="wide-art" src="/art/thriving.png" alt="住処の外につながる、水音のする廃坑"/>
    <p className="intro">次は、どこへ行こう。<br/>離れている時間に、探索が進みます。</p>
    {DESTINATIONS.map((d,i) => <article className={`choice-card ${world.destination===d.id?'selected':''}`} key={d.id}>
      <span className="eyebrow">小さな冒険 {String(i+1).padStart(2,'0')}</span><h2>{d.name}</h2><p>{d.description}</p>
      <p className="muted">見つかるもの：{Object.keys(d.rewards).map(k=>MATERIAL_NAMES[k as Material]).join('・')}</p>
      <button className={world.destination===d.id?'secondary':'primary'} disabled={world.destination===d.id || world.expeditionMinutes>0} onClick={()=>travel(d.id)}>{world.destination===d.id ? '次の行き先に選択中' : '次の行き先にする'}</button>
    </article>)}
    {world.expeditionMinutes>0 && <p className="muted">この探索を終えてから、次の行き先を選べます。</p>}
  </section>;
}
export function Habitat({world, craft}: {world: World; craft:(id:string)=>void}) {
  return <section className="paper inner-screen"><p className="eyebrow">拾ったものに、もう一度いのちを</p><h1>住処づくり</h1>
    <div className="inventory" aria-label="持ちもの">{Object.entries(world.inventory).map(([k,n])=><span key={k}>{MATERIAL_NAMES[k as Material]}<strong>{n}</strong></span>)}</div>
    {RECIPES.map(r=>{const built=world.built.includes(r.id), active=world.crafting?.recipeId===r.id;
      const missing=Object.entries(r.cost).some(([k,n])=>world.inventory[k as Material]<n);
      return <article className="choice-card" key={r.id}><p className="eyebrow">{built?'この子がつくったもの':active?'この子が制作中':'次につくるもの'}</p><h2>{r.name}</h2><p>{r.description}</p>
        <div className="materials">{Object.entries(r.cost).map(([k,n])=><span key={k}>{MATERIAL_NAMES[k as Material]} × {n}</span>)}</div>
        <button className={built?'secondary':'primary'} disabled={built || !!world.crafting || missing} onClick={()=>craft(r.id)}>{built?<><CheckIcon/>できあがり</>:active?'離れている間に制作中':world.crafting?'ほかの制作が終わるのを待つ':missing?'探索で材料を集めよう':'これをつくろう'}</button>
      </article>;
    })}<p className="muted">制作と探索は、ひとつずつ。元気がないときは、まず休みます。</p></section>;
}
export function Journal({world}: {world: World}) {
  return <section className="paper inner-screen"><p className="eyebrow">この子と、積み重ねた日々</p><h1>成長の記録</h1>
    <img className="wide-art" src={`/art/${conditionOf(world)}.png`} alt="いまのこの子と住処"/>
    <h2>思い出のアルバム</h2><p>発見も、できあがったものも、ここに。</p>
    {world.memories.length===0?<article className="choice-card"><h3>はじまりの巣</h3><p>まだ何もない、小さな寝床。ここから暮らしが始まります。</p></article>:world.memories.map(m=><article className="memory" key={m.id}><span className="eyebrow">{m.kind==='craft'?'ものづくり':m.kind==='growth'?'成長':'探索'}</span><h3>{m.title}</h3><p>{m.detail}</p></article>)}
  </section>;
}
