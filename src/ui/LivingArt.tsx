import type { World } from '../domain/model';
import { PaintedArt } from './PaintedArt';
import { HabitatLayers } from './HabitatLayers';
import './living-home.css';
export function LivingArt({world, showSlots=false}: {world:World; showSlots?:boolean}) {
  return <PaintedArt><HabitatLayers world={world} showSlots={showSlots}/></PaintedArt>;
}
