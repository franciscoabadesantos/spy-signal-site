# Marketing hero asset sources

This page records the source candidates for the photo-based hero. Keep a dated screenshot/PDF of each asset page and license page in private project records before committing any flattened production `.webp` exports.

## Current interim remote sources

The homepage currently references these remote Pexels CDN images as an implementation preview. Before production, download the originals, retouch/grade them, export flattened web assets, and switch the component to local files.

### Desktop base

- Platform: Pexels
- Creator: Elena Golovchenko
- Asset ID: 10922371
- Page: `https://www.pexels.com/photo/a-lit-lamp-on-a-computer-desk-10922371/`
- Download noted in research: `https://images.pexels.com/photos/10922371/pexels-photo-10922371.jpeg?cs=srgb&dl=pexels-elgolovchenko-10922371.jpg&fm=jpg`
- Intended local export: `public/marketing/hero-desktop.webp`
- Reason: strongest free dark/premium desktop mood match, with a dark monitor and warm lamp.
- License notes: Pexels standard license allows commercial use and modification, but do not resell the unmodified image, do not use it as a trademark/service mark, do not imply endorsement, and review any visible third-party rights.

### Mobile base

- Platform: Pexels
- Creator: juliane Monari
- Asset ID: 30768276
- Page: `https://www.pexels.com/photo/cozy-home-office-setup-with-warm-lighting-30768276/`
- Download noted in research: `https://images.pexels.com/photos/30768276/pexels-photo-30768276.jpeg?cs=srgb&dl=pexels-julianemonarifotografia-30768276.jpg&fm=jpg`
- Intended local export: `public/marketing/hero-mobile.webp`
- Reason: strongest free vertical/mobile crop with lamp, mug, wall space, and warm workspace atmosphere.
- License notes: same Pexels standard-license cautions as above; replace/obscure any visible third-party UI or protected content before final export.

## Production handoff checklist

1. Download the original selected source images.
2. Save screenshots/PDFs of the asset pages and the Pexels license page with the download date.
3. Clean visible UI, marks, book covers, artwork, logos, and other potentially protected content.
4. Apply the final dark grade and export `hero-desktop.webp` and `hero-mobile.webp`.
5. Update `components/marketing/HomePage.tsx` to use the local `/marketing/hero-desktop.webp` and `/marketing/hero-mobile.webp` paths instead of remote URLs.
6. Keep source PSD/Figma files and original downloads outside the public repo unless you deliberately want to publish them.
