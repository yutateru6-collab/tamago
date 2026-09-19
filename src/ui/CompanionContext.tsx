import { createContext, useContext, type ReactNode } from 'react';
export const COMPANIONS = [
  {id:'original',name:'工房の青い子',image:'/art/workshop-idle.jpg'},
  {id:'chestnut',name:'木の実色の子',image:'/art/companion-chestnut.webp'},
  {id:'owl',name:'こもれびのフクロウ',image:'/art/companion-owl.webp'},
] as const;
export type CompanionId = typeof COMPANIONS[number]['id'];
export const COMPANION_KEY='tamago.sandbox.companion.v1';
const Context=createContext<CompanionId>('original');
export function useCompanion() {const id=useContext(Context);return COMPANIONS.find(c=>c.id===id)!;}
export function CompanionProvider({id,children}:{id:CompanionId;children:ReactNode}) {return <Context.Provider value={id}>{children}</Context.Provider>;}
