import type { World } from '../domain/model';
import { PaintedArt } from './PaintedArt';
import { HabitatLayers } from './HabitatLayers';

export function LivingArt({world}: {world:World}) {
  return <PaintedArt><HabitatLayers world={world}/></PaintedArt>;
}
