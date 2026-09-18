import type { World } from '../domain/model';
import { homeState } from '../domain/home';

export function HabitatLayers({world}: {world: World}) {
  const home = homeState(world);
  const shelf = world.built.includes('shelf');
  const buildingShelf = world.crafting?.recipeId === 'shelf';
  const progress = buildingShelf ? world.crafting!.minutes / 60 : 0;
  const garden = world.built.includes('garden');
  const hammock = world.built.includes('hammock');
  const label = home.stage === 'empty' ? '飾りをしまった住処。休息で修繕できます。' : home.stage === 'damaged' ? '家具が傷み、飾りが減った住処。' : home.stage === 'faded' ? '植物がしおれ、少し寂しくなった住処。' : 'お手入れされた住処。';
  return <div className="habitat-layers" data-home-stage={home.stage} role="img" aria-label={label}>
    <img className="home-clean-plate" src="/art/home-empty.jpg" alt=""/>
    {shelf && home.stage !== 'empty' && <div className="home-shelf" data-testid="home-shelf">
      <img className="shelf-timber" src="/art/home-shelf.webp" alt=""/>
      {Array.from({length:home.treasureCount},(_,index)=><img key={index} className={`home-treasure treasure-${index}`} src="/art/home-treasure.webp" alt=""/>)}
    </div>}
    {buildingShelf && <div className="home-shelf shelf-in-progress" data-testid="home-shelf-progress" style={{clipPath:`inset(${progress >= .5 ? 47 : 74}% 0 0 0)`}}><img src="/art/home-shelf.webp" alt=""/></div>}
    {garden && home.stage !== 'empty' && <img className="home-plant" data-testid="home-plant" src={home.stage === 'warm'?'/art/home-plant.webp':'/art/home-plant-wilt.webp'} alt=""/>}
    {hammock && home.stage !== 'empty' && <img className="home-hammock" data-testid="home-hammock" src="/art/home-hammock.webp" alt=""/>}
    {!shelf && !buildingShelf && world.expeditionMinutes > 0 && <div className="home-found-wood" data-testid="home-found-wood"><img src="/art/home-shelf.webp" alt=""/></div>}
    <div className="home-atmosphere"/>
    <span className="home-scene-note">{buildingShelf?`小さな棚を制作中 · ${Math.floor(progress*100)}%`:home.wear>0?'少し休んだら、お手入れのつづき':shelf?`棚の宝物 ${home.treasureCount}こ`:world.expeditionMinutes>0?'木のかけらを見つけたところ':'ここから、暮らしをつくろう'}</span>
  </div>;
}
