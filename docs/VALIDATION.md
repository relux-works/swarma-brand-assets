# Validation record

## Checks

Run `npm run verify` to rebuild and validate. Run `npm run check` to inspect the
existing export set without writing files.

The validator checks:

- All 18 production SVGs contain explicit filled paths only, use approved colors,
  and match the current source and layout definitions.
- The 66 generated artwork files are present, match their manifest hashes and
  byte counts, and leave no uncataloged files in the asset directories. The
  manifest itself is a separate generated file.
- The master and bundled font match the manifest checksums.
- Transparent SVG exports contain artwork and retain clear outer margins.
- The three modules have comparable visual weight; the central aperture remains
  transparent and the upper red module stays above it.
- At 16, 24, 32, 48, 120 and 512 px, rasterizing the symbol yields three separate
  4-connected components at a 50% alpha threshold. This checks those exact raster
  sizes and renderer; it does not prove perception in every browser or display.
- PNG header dimensions agree with the manifest. The ICO contains precisely the
  16, 32 and 48 px exported PNG frames at valid directory offsets.
- Raster logo names map back to the corresponding SVG and match its render bytes.
  PNG favicons match the plated avatar; their foreground has three separated
  components at 16, 32 and 48 px.

Seven in-memory negative controls accompany valid positive controls. They prove
rejection of a script element, live SVG text, an unapproved color, a wrong-color
master, a missing export, a modified export and deliberately joined lower modules.
No source files or exports are mutated by these controls.

CI performs the same checks on Linux and rejects differences between rebuilt and
committed assets. Renderer binaries and outlining library versions are pinned.

## Visual review

The exported color, dark, monochrome and white symbols and lockups were inspected
against the selected top-right concept. The primary preview is composed from the
same geometry and outlines as the exports. The stacked composition and small-size
symbol proof were also inspected. The final master preserves the selected upper
module, pointed lower modules and open central triangle.

## Revision discipline

The GitHub pull request records the reviewed commit and hosted check results.
The manifest records exact artifact bytes. Any artwork or tool change requires a
fresh build, validation and visual review; old evidence does not approve new bytes.
