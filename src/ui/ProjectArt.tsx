// Existing furniture assets only. Character artwork and motion are deliberately unchanged.
const artwork: Record<string, string> = {
  shelf: '/art/home-shelf.webp',
  hammock: '/art/home-hammock.webp',
  garden: '/art/home-plant.webp',
};
export function ProjectArt({recipeId}: {recipeId: string}) {
  const src = artwork[recipeId];
  return src ? <img className="project-art" src={src} alt="" loading="lazy"/> : null;
}
