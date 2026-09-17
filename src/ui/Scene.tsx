import type { World } from '../domain/model';
import { conditionOf } from '../domain/engine';
import { GearIcon } from '@radix-ui/react-icons';
export function Scene({ world, onSettings }: { world: World; onSettings?: () => void }) {
  const condition = conditionOf(world);
  const label = { weary: '元気がありません', recovering: '少しずつ、元気に', thriving: '元気いっぱい' }[condition];
  return <section className="scene" aria-label={`住処の様子：${label}`}>
    <img className="scene-art" src={`/art/${condition}.png`} alt={`${label}。廃坑の住処で暮らす、小さな生き物。`} />
    <header className="scene-header"><p className="eyebrow">すこし離れて、もっと近くに</p><h1>こもれびの巣</h1></header>
    {onSettings && <button className="settings" aria-label="設定と試作モード" onClick={onSettings}><GearIcon /></button>}
    <span className="condition-pill">{label}</span>
  </section>;
}
