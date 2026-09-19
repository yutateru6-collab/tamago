import type { World } from '../domain/model';
import { LivingArt } from './LivingArt';
export function WorldPreview({world,compact=false}:{world:World;compact?:boolean}) {
  return <div className={`world-preview${compact?' compact':''}`} aria-label="いまの住処"><LivingArt world={world}/></div>;
}
