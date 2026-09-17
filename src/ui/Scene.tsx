import { LivingArt } from './LivingArt';
import type { World } from '../domain/model';
import { conditionOf } from '../domain/engine';
import { GearIcon } from '@radix-ui/react-icons';
export function Scene({ world, onSettings }: { world: World; onSettings?: () => void }) {
  const condition = conditionOf(world);
  const label = { weary: 'まずは、ひとやすみ', recovering: '少しずつ、元気に', thriving: '元気いっぱい' }[condition];
  return <section className={`scene ${condition}`} aria-label={`住処の様子：${label}`}>
    <div className="art-stage">
      <LivingArt world={world}/>
      <div className="sunbeam"/><div className="motes" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} style={{left:`${12+i*12}%`,animationDelay:`${-i*1.7}s`}}/>)}</div>
    </div>
    <header className="scene-header"><p className="eyebrow">スマホを休めると、この子の暮らしが育つ。</p><h1>こもれびの巣</h1></header>
    {onSettings && <button className="settings" aria-label="設定と試作モード" onClick={onSettings}><GearIcon /></button>}
    <span className="condition-pill"><span/> {label}</span>
    <div className="scene-caption">休む → 元気に　／　使いすぎを記録 → 疲れる</div>
  </section>;
}
