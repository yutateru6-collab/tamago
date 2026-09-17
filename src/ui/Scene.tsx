import { useId } from 'react';
import type { World } from '../domain/model';
import { conditionOf } from '../domain/engine';
import { GearIcon } from '@radix-ui/react-icons';
// Eyelids share the artwork's coordinate space so they stay aligned at every viewport size.
const eyes = { recovering: [[567,824,22,25],[630,798,14,20]], thriving: [[592,789,22,26],[653,765,14,22]], weary: [[566,797,21,25],[623,763,14,21]] };
export function Scene({ world, onSettings }: { world: World; onSettings?: () => void }) {
  const condition = conditionOf(world);
  const id = useId().replace(/:/g,'');
  const label = { weary: 'まずは、ひとやすみ', recovering: '少しずつ、元気に', thriving: '元気いっぱい' }[condition];
  return <section className={`scene ${condition}`} aria-label={`住処の様子：${label}`}>
    <div className="art-stage">
      <img className="scene-art" src={`/art/${condition}.png`} alt={`${label}。廃坑の住処で暮らす、小さな生き物。`} />
      <svg className="creature-motion" viewBox="0 0 1086 1448" aria-hidden="true">
        <defs><radialGradient id={id}><stop stopColor={condition==='weary'?'#b2b5a4':'#b1d3bc'}/><stop offset="1" stopColor={condition==='weary'?'#dbdac1':'#e4ecd0'}/></radialGradient></defs>
        <g className="eyelids">{eyes[condition].map(([x,y,rx,ry],i)=><g key={i} transform={`rotate(-20 ${x} ${y})`}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id})`}/><path d={`M ${x-rx+3} ${y} Q ${x} ${y+14} ${x+rx-3} ${y}`} fill="none" stroke="#4b4c3c" strokeWidth="4" strokeLinecap="round"/></g>)}</g>
      </svg>
      <div className="sunbeam"/><div className="motes" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} style={{left:`${12+i*12}%`,animationDelay:`${-i*1.7}s`}}/>)}</div>
    </div>
    <header className="scene-header"><p className="eyebrow">スマホを休めると、この子の暮らしが育つ。</p><h1>こもれびの巣</h1></header>
    {onSettings && <button className="settings" aria-label="設定と試作モード" onClick={onSettings}><GearIcon /></button>}
    <span className="condition-pill"><span/> {label}</span>
    <div className="scene-caption">休む → 元気に　／　使いすぎを記録 → 疲れる</div>
  </section>;
}
