import type { World } from '../domain/model';
import { PaintedArt } from './PaintedArt';

export function LivingArt(_props: {world:World}) {
  return <PaintedArt/>;
}
