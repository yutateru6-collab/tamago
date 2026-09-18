import { ArrowRightIcon, CheckIcon, MoonIcon } from '@radix-ui/react-icons';
import { DESTINATIONS, MATERIAL_NAMES, RECIPES, RULES } from '../domain/catalog';
import { conditionOf } from '../domain/engine';
import { homeState } from '../domain/home';
import type { Material, World } from '../domain/model';
import { Scene } from './Scene';
import { LifeStatus } from './LifeStatus';
import { ProjectArt } from './ProjectArt';

type RestActions = { onAway: () => void; busy: boolean };
export function Home({world, onAway, onSettings, onHabitat, busy}: {world: World; onSettings: () => void; onHabitat: () => void} & RestActions) {
  const recipe = RECIPES.find(r => r.id === world.crafting?.recipeId);
  const home = homeState(world);
  const destination = DESTINATIONS.find(d => d.id === world.destination)!;
  const resting = world.vitality < RULES.workThreshold;
  const firstProject = !world.quietSession && !resting && home.wear === 0 && !world.crafting && !world.built.includes('shelf') && world.inventory.wood >= 2;
  const request = resting ? '少し眠って、元気を取り戻したいな。' : home.wear > 0 ? '少し休んだら、住処をお手入れできそう。' : recipe ? `「${recipe.name}」を、少しずつ作りたいな。` : `「${destination.name}」を、探検してみたいな。`;
  return <><Scene world={world} onSettings={onSettings}/><section className="paper home-paper">
    <div className="request-heading"><span className="request-star">✦</span><span>この子から、あなたへ</span><span className="time-tag">30 MIN</span></div>
    <h2>{request}</h2><p className="request-copy">30分だけ、スマホを置いて<br/>そっと見守ってくれる？</p>
    <button className="primary" disabled={busy} onClick={onAway}><MoonIcon/>{world.quietSession ? 'お約束のつづきを見る' : '30分、協力する'}<ArrowRightIcon/></button>
    <p className="honesty-note">自己申告で育てるWeb版 · ほかのアプリの使用は計測しません</p>
    {firstProject && <aside className="first-project" aria-label="はじめての住処づくり">
      <div className="project-heading"><ProjectArt recipeId="shelf"/><div><span className="eyebrow">はじめての、ものづくり</span><h3>木は、もうそろっています。</h3><p>探索のかわりに、小さな棚から始めても大丈夫。</p></div></div>
      <button className="secondary" disabled={busy} onClick={onHabitat}>集めた木で、小さな棚をつくろう</button>
      <small>つくるものを選ぶ → 30分休む → 戻って変化を見る</small>
    </aside>}
    <LifeStatus world={world}/>
    <div className="world-stats">{[{label:'この子の元気',value:world.vitality},{label:'住処の心地よさ',value:world.habitat}].map(s => <div key={s.label}><span>{s.label}<b>{Math.round(s.value)}<small> / 100</small></b></span><meter min="0" max="100" value={s.value} aria-label={s.label}/></div>)}</div>
    <details className="how-it-works"><summary>どうすると、元気になるの？</summary><div className="rule-row"><span>☀</span><p><b>スマホを休む → 元気が戻る</b><br/>30分のお約束のあと「休めた」と伝えると、元気と住処が回復。元気が戻ると、お手入れ・制作・探索も進みます。</p></div><div className="rule-row"><span>☾</span><p><b>使いすぎを記録 → 少し疲れる</b><br/>自分で使いすぎを記録したときだけ、元気と住処が悪化します。途中でやめても罰はありません。また休めば回復します。</p></div><p className="muted">30分では探索や制作が終わらないこともあります。進み具合は引き継ぎます。住処の傷みには一日ごとの上限があり、完成した実績は消えません。</p><button className="text-link" onClick={onSettings}>使いすぎの記録・変化を試す</button></details>
  </section></>;
}
export function Explore({world, travel, onAway, busy}: {world: World; travel: (id: string) => void} & RestActions) {
  return <section className="paper inner-screen"><p className="eyebrow">この子の、小さな冒険</p><h1>探索</h1>
    <img className="wide-art" src="/art/thriving.png" alt="住処の外につながる、水音のする廃坑"/>
    <p className="intro">欲しい材料から、行き先を選ぼう。<br/>選んだあとは、30分のお約束へ。</p>
    {(world.crafting || homeState(world).wear > 0 || world.vitality < RULES.workThreshold) && <p className="journey-notice">元気の回復・お手入れ・制作があるときは、そちらが先。残った休息時間で探索が進みます。</p>}
    {DESTINATIONS.map((d, i) => <article className={`choice-card ${world.destination === d.id ? 'selected' : ''}`} key={d.id}>
      <span className="eyebrow">小さな冒険 {String(i + 1).padStart(2, '0')}{world.destination === d.id ? ' · 次の行き先に選択中' : ''}</span><h2>{d.name}</h2><p>{d.description}</p>
      <p className="muted">探索1回の作業時間：{d.minutes}分</p>
      <div className="materials" aria-label={`${d.name}で見つかる材料`}>{Object.entries(d.rewards).map(([k, n]) => <span key={k}>{MATERIAL_NAMES[k as Material]} × {n}</span>)}</div>
      {world.destination === d.id && <p className="muted">記録した探索 {Math.floor(world.expeditionMinutes)} / {d.minutes}分</p>}
      {world.destination === d.id ? <button className="primary" disabled={busy} onClick={onAway}>{world.quietSession ? 'お約束のつづきを見る' : 'この行き先で、30分のお約束へ'}</button> : <button className="secondary" disabled={busy || world.expeditionMinutes > 0} onClick={() => travel(d.id)}>次の行き先にする</button>}
    </article>)}
    {world.expeditionMinutes > 0 && <p className="muted">この探索を終えてから、次の行き先を選べます。途中の進み具合は失われません。</p>}
  </section>;
}
export function Habitat({world, craft, onAway, onExplore, busy}: {world: World; craft: (id: string) => void; onExplore: () => void} & RestActions) {
  const home = homeState(world);
  return <section className="paper inner-screen"><p className="eyebrow">拾ったものに、もう一度いのちを</p><h1>住処づくり</h1>
    <p className="intro">つくるものを選んだら、ひとやすみ。<br/>戻ったときに、できたぶんだけ暮らしが育ちます。</p>
    {home.wear > 0 && <aside className="journey-notice" aria-label="住処のお手入れ"><h2>また、飾れるように。</h2><p>つくったものは消えていません。元気が戻ると、制作より先にお手入れが進みます。修繕に材料は使いません。</p><button className="secondary" disabled={busy} onClick={onAway}>お手入れのために休む</button></aside>}
    <div className="inventory" aria-label="持ちもの">{Object.entries(world.inventory).map(([k, n]) => <span key={k}>{MATERIAL_NAMES[k as Material]}<strong>{n}</strong></span>)}</div>
    {RECIPES.map(r => {
      const built = world.built.includes(r.id), active = world.crafting?.recipeId === r.id;
      const missing = Object.entries(r.cost).some(([k, n]) => world.inventory[k as Material] < n);
      const minutes = active ? world.crafting!.minutes : built ? r.minutes : 0;
      return <article className={`choice-card project-card ${active ? 'selected' : ''}`} key={r.id} data-recipe={r.id}>
        <div className="project-heading"><ProjectArt recipeId={r.id}/><div><p className="eyebrow">{built ? 'この子がつくったもの' : active ? '制作のつづき' : '次につくるもの'}</p><h2>{r.name}</h2><p>{r.description}</p></div></div>
        {active ? <div className="recipe-progress"><div><span>保存された進み具合</span><b>{Math.floor(minutes / r.minutes * 100)}%</b></div><progress aria-label={`${r.name}の制作進捗`} max={r.minutes} value={minutes}/><small>{Math.floor(minutes)} / {r.minutes}分 · 途中から続けられます</small></div> : !built && <p className="muted">制作の作業時間：{r.minutes}分<br/>元気の回復やお手入れが必要なときは、その時間が先に入ります。</p>}
        <div className="materials" aria-label={`${r.name}の材料`}>{Object.entries(r.cost).map(([k, n]) => <span key={k} data-short={!built && !active && world.inventory[k as Material] < n ? 'true' : undefined}>{MATERIAL_NAMES[k as Material]} {built || active ? `× ${n}（確保済み）` : `${world.inventory[k as Material]} / ${n}${world.inventory[k as Material] < n ? ` · あと${n - world.inventory[k as Material]}` : ' · そろった'}`}</span>)}</div>
        {built ? <button className="secondary" disabled><CheckIcon/>{home.wear > 0 ? 'お手入れで戻せます' : 'できあがり'}</button>
          : active ? <button className="primary" disabled={busy} onClick={onAway}>{world.quietSession ? 'お約束のつづきを見る' : '制作のために、30分休む'}</button>
          : world.crafting ? <button className="secondary" disabled={busy} onClick={onAway}>いまの制作を進める</button>
          : missing ? <button className="secondary" onClick={onExplore}>足りない材料を探しにいく<ArrowRightIcon/></button>
          : <button className="primary" disabled={busy} onClick={() => craft(r.id)}>これをつくろう</button>}
      </article>;
    })}<p className="muted">制作と探索は、ひとつずつ。材料は制作を始めるときだけ使います。休息のお約束をやめても、制作の進み具合は残ります。</p></section>;
}
export function Journal({world}: {world: World}) {
  return <section className="paper inner-screen"><p className="eyebrow">この子と、積み重ねた日々</p><h1>成長の記録</h1>
    <img className="wide-art" src={`/art/${conditionOf(world)}.png`} alt="いまのこの子と住処"/>
    <h2>思い出のアルバム</h2><p>発見も、できあがったものも、ここに。</p>
    {world.memories.length === 0 ? <article className="choice-card"><h3>はじまりの巣</h3><p>まだ何もない、小さな寝床。ここから暮らしが始まります。</p></article> : world.memories.map(m => <article className="memory" key={m.id}><span className="eyebrow">{m.kind === 'craft' ? 'ものづくり' : m.kind === 'growth' ? '成長' : '探索'}</span><h3>{m.title}</h3><p>{m.detail}</p></article>)}
  </section>;
}
