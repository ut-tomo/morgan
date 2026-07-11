# Morgan Fingerprint Playground

An interactive, **technically honest** teaching tool for molecular fingerprints.
It runs entirely in the browser (RDKit compiled to WebAssembly), has no backend,
and is built to be hosted on GitHub Pages — including under a repository subpath.

For a molecule entered as SMILES it shows, side by side and clearly labeled:

- the molecular graph rendered by RDKit;
- a transparent, step-by-step sequence of node-refinement states;
- the circular, atom-centered environments generated at each atom and radius;
- a sparse table of pedagogical environment identifiers and counts;
- the **real** RDKit Morgan fingerprint bit vector and its set bits;
- a comparison of two molecules with shared bits and Tanimoto similarity.

## Educational goals

The app exists to make one distinction unambiguous: the difference between the
*ideas* behind circular fingerprints and the *actual output* of a real
implementation. It never displays a reimplemented fingerprint as if it were
RDKit's, and it never claims the teaching code is byte-for-byte identical to
RDKit.

### The three modes, kept distinct

1. **Morgan 1965 mode** — the original connectivity refinement.
   - Initial value: heavy-atom degree.
   - Update: each atom's value becomes the sum of its neighbours' values.
   - These values create a *partial atom ordering* used to reduce the
     canonicalization search. They are **not** the final fingerprint.

2. **WL-like educational mode** — 1-dimensional Weisfeiler–Leman vertex
   refinement.
   - Initial label from transparent, configurable atom properties.
   - Update from a **structured signature**: the current label plus the sorted
     multiset of `(bond type, neighbour label)` tokens.
   - Integer identifiers are assigned from an **exact-tuple dictionary** — a
     lossless encoding, **no hashing**. The exact tuple is shown before its id
     is assigned.
   - After round *r*, an identifier summarizes the rooted local environment out
     to radius *r*. This is the educational analogue of a Morgan/ECFP feature.

3. **RDKit Morgan mode** — the ground truth.
   - Calls RDKit.js (`get_morgan_fp`) directly.
   - Displays exactly the returned bit vector, its length, population count, and
     set-bit indices.
   - Shows the exact parameters passed to RDKit.
   - Honestly states that this browser API does **not** expose RDKit's internal
     per-bit atom/radius provenance; the transparent provenance elsewhere in the
     UI comes from the separate educational refinement.

### What the app is careful to say (and not say)

It uses statements like: *a refined atom identifier summarizes a rooted local
environment*; *circular fingerprints collect atom/radius identifiers as
features*; *these are circular, atom-centered environments, not arbitrary
subgraphs*; *different graphs can have the same fingerprint*; *same fingerprint
does not imply graph isomorphism*; *1-WL distinguishing two graphs proves they
are non-isomorphic, but failing to distinguish them proves nothing*.

It deliberately avoids claims like "WL solves graph isomorphism", "each Morgan
bit corresponds to one subgraph", "a fingerprint uniquely identifies a
molecule", or "the educational implementation exactly equals RDKit".

It also **contrasts** the two refinement rules directly: Morgan 1965 updates an
atom from the *sum* of its neighbours' values, while 1-WL (and modern circular
fingerprints) use the *multiset* of neighbour labels. A worked example
(`{1,3}` and `{2,2}` both sum to 4 but are different multisets) shows why the
sum can merge environments the multiset keeps apart — so the two are related but
not identical. The Morgan 1965 panel additionally explains the *rest* of the
1965 procedure that this tool does not compute: partial ordering → constrained
candidate numberings → connection tables → lexicographic comparison, whose
output is a canonical connection table, not a fingerprint.

The educational sparse fingerprint offers a **count ↔ binary** toggle (multiset
vs. set), and the Compare view refines both molecules against a **single shared
identifier dictionary** so that "shared environment" counts are genuinely
comparable across molecules (identical rooted environments get the same
identifier), rather than comparing per-molecule integer ids.

### Why fingerprints can collide

The **Limitations** tab separates four genuinely different phenomena that are
too often lumped together as "hash collisions":

1. **Finite-radius limitation** — two graphs share all local environments up to
   the chosen radius (demonstrated live by the ortho-/para-xylene pair, equal at
   radius 0, different at radius 1).
2. **Refinement-expressivity limitation** — 1-WL is not a complete
   graph-isomorphism test (demonstrated by the triangular prism vs. K(3,3), a
   graph-theory example — not a claim about ordinary stable molecules).
3. **Environment-identifier collision** — a practical implementation *hashes*
   structured environments, so distinct environments can share an id. The
   educational mode avoids this with an exact dictionary, so you can tell this
   apart from the other causes. Demonstrated live with a small toy hash
   (`FNV-1a(signature) mod M`) applied to aspirin's real environment
   signatures, showing two distinct signatures landing in the same bucket
   *before* any bit-folding.
4. **Bit-folding collision** — distinct identifiers fold onto the same
   fixed-length bit (demonstrated live by shrinking aspirin's fingerprint length
   and watching the population count drop).

## How RDKit.js is loaded

- The RDKit WebAssembly runtime (`RDKit_minimal.js` + `RDKit_minimal.wasm`) is
  copied out of `node_modules/@rdkit/rdkit/dist` into `public/rdkit/` by
  `scripts/copy-rdkit.mjs` (run automatically via the `pre*` npm scripts).
- `src/rdkit/loader.ts` injects the script and initialises the module, pointing
  `locateFile` at a **base-path-aware** URL (`import.meta.env.BASE_URL`), so the
  wasm loads correctly whether the site is served from `/` or `/<repo>/`.
- Everything RDKit-related lives behind an adapter boundary in `src/rdkit/`.
  UI components consume it through the `RdkitProvider` context and typed
  functions — they never touch the global module.
- Every WASM-backed `JSMol` object is deleted in a `finally` block; only plain
  data is returned into React state.

## Project structure

```
src/
  rdkit/          adapter boundary: loader, molecule parsing, fingerprint, drawing, types
  refinement/     pure logic: graph, atom invariants, Morgan 1965, WL refinement,
                  circular environments, feature aggregation, types
  similarity/     Tanimoto
  examples/       molecule presets + graph-theory counterexamples
  model/          orchestration (analyzeAll) + React hooks
  components/     presentational + interactive components
  pages/          Explore / Compare / Limitations
  tests/          Vitest unit + RDKit-backed tests
e2e/              Playwright end-to-end tests
scripts/          copy-rdkit.mjs
```

## Local development

```bash
npm install
npm run dev        # copies RDKit assets, then starts Vite on http://localhost:5173
```

## Testing

```bash
npm run typecheck  # tsc project references, strict mode
npm test           # Vitest unit tests (incl. tests that call the real RDKit.js)
npm run test:e2e   # Playwright: builds under a subpath, serves it, drives Chromium
```

Unit tests cover: permutation invariance of the educational refinement;
deterministic signature encoding; radius progression; count and binary
aggregation; Tanimoto (including the all-zero case); Morgan 1965 neighbour-sum
rounds; that alternative SMILES for the same molecule give identical RDKit
fingerprints; that changing the radius changes the output; and that the
small-vector bit-folding example is *actually* a collision (verified against
live RDKit output, not asserted).

## GitHub Pages deployment

`.github/workflows/deploy.yml` installs dependencies, type-checks, runs unit
tests, builds the Vite site, and deploys `dist/` to GitHub Pages.

The Vite `base` path is read from the `BASE_PATH` environment variable
(`vite.config.ts`). The workflow sets it to `/<repository-name>/` automatically,
so the site works at `https://<owner>.github.io/<repo>/`. Locally `BASE_PATH` is
unset and the base is `/`.

To enable it: in the repository settings, set **Pages → Build and deployment →
Source** to **GitHub Actions**, then push to `main`.

## Known limitations

- The educational WL-like refinement is a teaching model. It is intentionally
  lossless (exact dictionary) and is **not** guaranteed to reproduce RDKit's
  internal identifiers or bits.
- RDKit.js does not expose complete per-bit atom/radius provenance in this API,
  so bit-level provenance shown in the app comes only from the educational side
  and is labeled as such.
- The heavy-atom graph is derived from RDKit's commonchem JSON; hydrogens are
  implicit.
- The initial "RDKit-inspired" invariant is inspired by, but not verified
  identical to, RDKit's default connectivity invariants.

## Attribution and licenses

- [RDKit](https://www.rdkit.org/) and [RDKit.js](https://github.com/rdkit/rdkit-js)
  — BSD 3-Clause License. The RDKit WebAssembly runtime is redistributed at
  build time from the `@rdkit/rdkit` npm package.
- Morgan, H. L. (1965). *The Generation of a Unique Machine Description for
  Chemical Structures.* J. Chem. Doc. 5(2), 107–113.
- Weisfeiler, B.; Leman, A. (1968). The 1-dimensional Weisfeiler–Leman
  refinement.
- Rogers, D.; Hahn, M. (2010). *Extended-Connectivity Fingerprints.* J. Chem.
  Inf. Model. 50(5), 742–754.
- This application's own code is released under the MIT License (see
  `package.json`).
