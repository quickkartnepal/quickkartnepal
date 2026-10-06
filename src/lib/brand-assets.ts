// Asset paths are served by Lovable, not by an external Vercel/Netlify host.
export function brandAssetUrl(path: string): string {
  return new URL(path, "https://nextokart.lovable.app").href;
}