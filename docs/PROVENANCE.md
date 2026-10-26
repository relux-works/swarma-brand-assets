# Artwork provenance

## Decision

On 26 October 2026, the owner selected the **top-right, 02 / Quorum** concept from
the [exploration board](../references/approved-concept-board.png). The other three
directions on that board are retained for provenance only. The subsequent request
authorized preparing the asset repository.

The concept was developed after reading the supplied Russian Swarma platform paper,
version 7.0.1: its Runtime, Protocol and Chain layers, independently owned runtimes,
quorum decisions, shared project environment and persistent identity. The mark is
a visual metaphor for cooperation among independent participants. The number of
modules is not a protocol threshold or a statement about the number of owners.

## Vector construction

The concept board is a raster exploration generated with ImageGen. It is not the
production master. `source/swarma-symbol.svg` formalizes the selected silhouette:
one six-vertex upper module, two mirrored five-vertex lower modules, clipped outer
corners and an inverted triangular aperture. Coordinates are explicit; there are
no raster embeds, tracing debris, strokes, filters or external dependencies.

The lower modules retain sharp inner tips as shown in the selected reference.
Clear channels were normalized to keep all three pieces separate at small sizes.
The upper module is Relux red and the lower modules are ink or white according to
the supplied variant. This is a production interpretation of the selected raster,
not a pixel-for-pixel trace of its antialiasing or texture.

The outlined wordmark spells **Swarma**, with a capital S. It uses the same Inter
Bold 700 family as the Relux corporate wordmark, at zero added tracking. Direct
glyph outlines with pair kerning are sufficient for this fixed Latin word; the
pipeline does not provide general complex-script text shaping.

## Sources and licensing

- Family rules: [Relux product web design](https://github.com/relux-works/relux-product-web-design),
  especially the identity and typography references.
- Font binary and license copied unchanged from
  [Relux product web identity](https://github.com/relux-works/relux-product-web-identity),
  `source/fonts/Inter-Bold.ttf` and `source/fonts/LICENSE.txt`.
- Font metadata: **Inter Bold 4.001**, `git-9221beed3`, The Inter Project Authors.
  The full license is preserved as [OFL.txt](../source/fonts/OFL.txt).
- Exact master and font SHA-256 checksums appear in
  [the generated manifest](../assets/manifest.json).

No Relux Works corporate artwork was modified. The generated assets contain no
content from the supplied platform paper. The comparison board is the only raster
source reference committed to this repository.
