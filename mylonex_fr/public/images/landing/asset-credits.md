# Landing-page media

- **textile-production.mp4** — “Industrial Textile Factory Automated Weaving”, by Usman AbdulrasheedGambo, downloaded at 1280×720 from [Pexels](https://www.pexels.com/video/industrial-textile-factory-automated-weaving-32243781/). Used under the [Pexels License](https://www.pexels.com/license/), reviewed 17 October 2026. Illustrative footage; it does not depict a claimed MyloNex facility.
- **fabric-ribbon.png** — Original decorative artwork generated with the built-in imagegen tool for MyloNex. Layered 2D imagery, not a cloth simulation. Prompt: “One continuous rich cobalt-blue woven cotton twill strip, a vertical S-shaped ribbon with open curves, a navy underside, realistic folds, selvedges and visible fibres; product photography isolated on transparent alpha; no text, logos, plastic, cable or glowing line.”

## Brand textile refinement — 24 October 2026

These are decorative marketing assets generated/edited with the built-in imagegen tool. They do not describe purchasable catalog fabrics. Original assets remain available; no supplier/product photographs or production footage were recoloured.

Palette reference: the existing official `public/images/mylonex-clean.svg` paths use `rgb(34,60,250)` / `#223CFA`, `rgb(59,77,224)` / `#3B4DE0`, `rgb(120,216,86)` / `#78D856`, and `rgb(136,209,110)` / `#88D16E`. The logo SVG itself is reused unchanged, with its original proportions and colours.

| Asset | Dimensions | Use |
| --- | --- | --- |
| `mylonex-blue-woven-outer.webp` | 1672×941 | One continuous full-viewport texture for both clipped zipper panels, curtain, hero detail and journey swatch |
| `mylonex-pearl-woven-inner.webp` | 1672×941 | Continuous pale inner fabric underneath the separate official logo |
| `mylonex-blue-green-hero.webp` | 1122×1402 | Edited version of the existing decorative `hero1.png` composition |
| `mylonex-blue-green-ribbon.webp` | 768×1152, alpha | Existing decorative ribbon placements; blue face, navy underside and a narrow green selvedge |

Production files use WebP quality 84–86 (ribbon 85), without upscaling, and total approximately 955 KiB. Transparent ribbon pixels remain transparent. Next.js Image continues to serve responsive sizes.

Prompt set:

- **Outer:** “Photorealistic premium woven textile; one continuous blue sheet filling every edge; broad soft shallow folds, believable weight, detailed fine fibres, matte finish, restrained navy shadows. Use the source SVG blue palette under soft directional studio light. Very narrow brand-green woven selvedges near the extreme left and right edges, less than five percent of the image. Front-facing landscape composition; calm gently folded central third for a separately rendered vertical zipper. No zipper, logo, lettering, borders, watermark, card, plastic, satin gloss or overall blue-green gradient.”
- **Inner:** “Photorealistic continuous pearl-white woven sheet, pale cool neutral close to #F2F6FB/#F5F8FC, delicate cool-blue shadows, broad shallow perimeter folds, calm softly lit central half for a separately overlaid blue/green logo. Refined fibres, matte cloth, soft upper-left studio light. Edge-to-edge fabric; no logo, text, printed symbols, coloured gradient, card, frame or watermark.”
- **Hero edit:** “Preserve the existing decorative image composition, woven texture, rolls, cardboard cores, folds, light direction, depth and portrait framing. Recolour the dominant blue cloth and roll toward the actual SVG blue palette, retaining natural navy shadows and photographic highlights. Make one small neutral swatch brand green; preserve the other neutral swatches and rear roll. Blue remains dominant. No neon/plastic finish, gradient lighting, text, logo or watermark.”
- **Ribbon:** “One long photorealistic woven cloth ribbon in a relaxed vertical S-shaped twist, fully visible on true transparent alpha. Blue face, navy underside, narrow brand-green woven selvedge along one edge (about three percent of width), realistic matte fibres and soft studio highlights. No floor, exterior cast shadow, glow, backdrop, logo, text, zipper or watermark.” A background-extraction refinement preserved the silhouette and textile detail while keeping pixels outside the physical ribbon transparent and softening the lighting.
