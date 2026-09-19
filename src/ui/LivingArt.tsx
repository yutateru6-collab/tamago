import type { World } from '../domain/model';
import { homeGrowthStage, type HomeGrowthStage } from '../domain/home';
import { PaintedArt } from './PaintedArt';
import { HabitatLayers } from './HabitatLayers';
import './home-growth.css';

const HOME_GROWTH_ART: Record<Exclude<HomeGrowthStage, 0>, {src:string; alt:string}> = {
  1: { src:'/art/home-growth-1.png', alt:'木の家具や花、灯りが少し増えた滝辺の住処で、こちらを見る青い子。' },
  2: { src:'/art/home-growth-2.png', alt:'棚や寝床、本、灯りが増えて豊かになった滝辺の住処で、こちらを見る青い子。' },
  3: { src:'/art/home-growth-3.png', alt:'花や本、家具、たくさんの灯りに満ちた完成した滝辺の住処で、こちらを見る青い子。' },
};

export function LivingArt({world, homeProgression=false}: {world:World; homeProgression?:boolean}) {
  const growth = homeProgression ? homeGrowthStage(world) : 0;
  if (growth > 0) {
    const art = HOME_GROWTH_ART[growth];
    return <div className="living-art painted-art home-growth-art-stage" data-motion="still" data-home-growth-stage={growth}>
      <img className="home-growth-art" src={art.src} alt={art.alt}/>
    </div>;
  }
  return <PaintedArt><HabitatLayers world={world}/></PaintedArt>;
}
