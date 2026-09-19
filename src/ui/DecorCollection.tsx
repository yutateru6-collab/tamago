import type { World } from '../domain/model';
import { DECOR, ownsDecor, decorState } from '../domain/decor';

export function DecorCollection({world,arrange,busy}: {world:World; arrange:(id:string,slot:string|null)=>void; busy:boolean}) {
  return <section className="decor-collection" aria-label="模様がえ"><h2>この場所に、少しずつ。</h2><p>できたものは、この子が飾ってくれます。置き場所を変えたり、しまったりしても、手に入れたものは残ります。</p>
    {DECOR.map(item=>{
      const owned=ownsDecor(world,item), state=decorState(world,item);
      const slot=world.decor?.placements[item.id]??item.defaultSlot;
      return <article className="decor-row" key={item.id}><h3>{item.name}</h3>
        {!owned?<p className="muted">{item.recipe?'制作すると、住処に置けます。':`探索${item.discoveries}回の思い出。棚ができると飾れます。`}</p>:<><p className="muted">{state.hidden?'大切にしまっています。':item.parent&&!state.visible?'棚を飾ると、一緒に並びます。':'いつもの住処に飾っています。'}</p><div className="decor-controls">
          {Object.keys(item.slots).map((key,index)=><button key={key} className="secondary" disabled={busy} aria-pressed={!state.hidden&&slot===key} onClick={()=>arrange(item.id,key)}>{Object.keys(item.slots).length===1?'飾る':index===0?'いつもの場所':'少し手前に'}</button>)}
          <button className="secondary" disabled={busy} aria-pressed={state.hidden} onClick={()=>arrange(item.id,null)}>しまう</button>
        </div></>}
      </article>;
    })}
  </section>;
}
