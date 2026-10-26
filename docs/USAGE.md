# Swarma identity usage

## Composition

Use the horizontal lockup as the default logo. Use the symbol where space is
limited and the product name is already clear. The stacked composition is intended
for centered placements. Use a plated avatar on platforms that control the
surrounding background.

The three separated modules and the triangular aperture are essential parts of
Quorum. Keep the upper module red, preserve the lower modules and their spacing,
and preserve the mark's orientation. Do not mirror it in right-to-left interfaces.

## Colors and surfaces

| Color | sRGB | Use |
| --- | --- | --- |
| Relux red | `#F60D10` | Upper module in full-color artwork |
| Relux ink | `#181A18` | Lower modules and wordmark on light surfaces |
| White | `#FFFFFF` | Lower modules and wordmark on dark surfaces; white artwork |

- The default SVG is transparent, red and ink.
- The `-dark.svg` variant is transparent, red and white; it does not add a background.
- The `-mono.svg` variant is entirely ink.
- The `-white.svg` variant is entirely white.
- Avatars add a white or ink plate. Do not add another plate or border.

Use a supplied variant rather than a CSS filter or fill replacement. The master
colors are identity colors; they do not prescribe accessible UI text or button colors.
Print consumers can use the vector SVGs; all supplied color values are sRGB.

## Clear space and size

The symbol master uses a `120 × 120` view box. Its visible horizontal bounds are
`10…110`, and its vertical bounds are `14…94`. Preserve the canvas and its padding.
Reserve at least 12 additional master units around the canvas when adjacent to
other logos, text or controls. At a 120 px rendered symbol width, this means 12 px.
Scale this space proportionally. For lockups, use the same 12-unit measure from
their 120-unit symbol height.

Recommended display minima:

| Asset | Minimum |
| --- | --- |
| Symbol | 24 CSS px wide for ordinary UI; the supplied favicon supports 16 px |
| Horizontal lockup | 160 CSS px wide |
| Stacked lockup | 140 CSS px wide |
| Wordmark alone | 100 CSS px wide |

Do not crop the aperture, close the gaps, rotate a module, stretch a lockup, change
letter spacing, recreate the wordmark with live text, or add gradients, shadows,
strokes, textures or animation to the artwork.

## Web integration

Copy the exact files from the pinned repository revision into the site's public
asset directory. Supply accessible naming in the consuming page:

```html
<a href="/" aria-label="Swarma home" dir="ltr">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/brand/swarma-lockup-horizontal-dark.svg">
    <img src="/brand/swarma-lockup-horizontal.svg" alt="Swarma" width="344" height="120">
  </picture>
</a>
```

For a site with its own theme switch, select the asset from the active site theme.
The media-query example is appropriate when the page follows the system theme.

```html
<link rel="icon" href="/brand/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/svg+xml" href="/brand/favicon-dark.svg" media="(prefers-color-scheme: dark)">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" sizes="180x180">
```

For an app manifest, use `icon-192.png` and `icon-512.png` with `purpose: "any"`,
and `icon-maskable-512.png` with `purpose: "maskable"`. These files have a white
plate. Choose the actual app name, scope and start URL in the application project.

## Relux Works relationship

Swarma has its own product mark. Keep the approved Relux Works logo separate and
unchanged when expressing operator ownership. Do not combine either mark's
components into a hybrid. The typography and fixed corporate palette establish
family resemblance; the Quorum geometry identifies Swarma.
