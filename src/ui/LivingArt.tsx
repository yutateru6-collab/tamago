import { useId } from 'react';
import type { World } from '../domain/model';
import { conditionOf } from '../domain/engine';

// A neutral displacement field leaves the illustration still. Only the soft fields
// over the ear and tail deform pixels; there is no duplicated, sliding cut-out.
const field = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1086" height="1448"><defs><radialGradient id="ear"><stop stop-color="#80ff80"/><stop offset="1" stop-color="#808080"/></radialGradient><radialGradient id="tail"><stop stop-color="#ff8080"/><stop offset="1" stop-color="#808080"/></radialGradient></defs><path fill="#808080" d="M0 0h1086v1448H0z"/><ellipse cx="366" cy="736" rx="140" ry="150" fill="url(#ear)"/><ellipse cx="321" cy="1016" rx="151" ry="144" fill="url(#tail)"/></svg>`)}`;
const eyes = { recovering: [[567,824,22,25],[630,798,14,20]], thriving: [[592,789,22,26],[653,765,14,22]], weary: [[566,797,21,25],[623,763,14,21]] };
export function LivingArt({world}: {world:World}) {
  const condition=conditionOf(world);
  const id=`creature-${useId().replace(/[^a-zA-Z0-9]/g,'')}`;
  return <div className="living-art">
    <img className="scene-art" src={`/art/${condition}.png`} alt="木漏れ日の住処で、耳と尻尾をゆっくり動かす小さな生き物。" />
    <svg className="creature-motion" viewBox="0 0 1086 1448" aria-hidden="true">
      <defs>
        <filter id={id} x="0" y="0" width="1086" height="1448" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={field} x="0" y="0" width="1086" height="1448" result="parts"/>
          <feDisplacementMap in="SourceGraphic" in2="parts" scale="0" xChannelSelector="R" yChannelSelector="G"><animate attributeName="scale" values="0;72;0;-36;0" keyTimes="0;.3;.5;.8;1" dur="4.8s" repeatCount="indefinite"/></feDisplacementMap>
        </filter>
        <radialGradient id={`${id}-lid`}><stop stopColor={condition==='weary'?'#b2b5a4':'#b1d3bc'}/><stop offset="1" stopColor="#e4ecd0"/></radialGradient>
      </defs>
      <image href={`/art/${condition}.png`} width="1086" height="1448" filter={`url(#${id})`}/>
      <g className="eyelids">{eyes[condition].map(([x,y,rx,ry],i)=><g key={i} transform={`rotate(-20 ${x} ${y})`}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-lid)`}/><path d={`M ${x-rx+3} ${y} Q ${x} ${y+14} ${x+rx-3} ${y}`} fill="none" stroke="#4b4c3c" strokeWidth="4" strokeLinecap="round"/></g>)}</g>
    </svg>
  </div>;
}
