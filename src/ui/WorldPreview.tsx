import type { World } from '../domain/model';
import { LivingArt } from './LivingArt';
export function WorldPreview({world}:{world:World}) {return <div className="world-preview" aria-label="いまの住処"><LivingArt world={world}/></div>;}
