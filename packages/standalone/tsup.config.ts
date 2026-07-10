import { access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsup';

/**
 * The published `contextractor` tarball must carry no `@contextractor/*`
 * runtime dependencies (the core packages are internal-only, `private: true`),
 * so this bundles them into `dist`. Public packages (crawlee, playwright,
 * commander, turndown, `trafilaturacore`, …) stay external regular
 * dependencies.
 *
 * `trafilaturacore` is one of those externals: it is an ordinary published npm
 * package that carries its own native addon inside `trafilaturacore/dist/native/`.
 * Nothing here stages a `.node` file — Contextractor ships no Rust of its own.
 */
export default defineConfig({
  entry: { cli: 'src/cli.ts', index: 'src/index.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // Typings are produced by `tsc -p tsconfig.dts.json` + api-extractor (see
  // the build script): tsup's dts pipelines cannot inline the internal
  // @contextractor/* packages into a self-contained dist/index.d.ts.
  dts: false,
  clean: true,
  sourcemap: false,
  // Splitting dedupes the code shared by the two entries into chunks emitted
  // into the dist/ root (without it, cli.js and index.js each carry the full
  // bundle). cli.ts's own top-level code — the `isMainEntry(import.meta.url)`
  // check — stays in the dist/cli.js entry chunk, so the bin-path comparison
  // still works.
  splitting: true,
  noExternal: [/^@contextractor\//],
  banner: {
    // Bundled code may reach CJS-only externals (turndown, domino) at runtime;
    // ESM output has no `require` without this shim. The aliased import avoids
    // colliding with source-level createRequire imports.
    js: "import { createRequire as __bundleCreateRequire } from 'node:module'; const require = __bundleCreateRequire(import.meta.url);",
  },
  async onSuccess() {
    // Ship the third-party attribution NOTICE and the Apache-2.0 LICENSE text in
    // the published tarball. `dist` is already in the package `files` allowlist, so
    // copying them here is enough (and the PyPI wheel, which vendors this dist tree,
    // carries them too). The NOTICE points at "(see LICENSE)", so both must ship.
    // After the engine un-nest, NOTICE/LICENSE sit at the workspace root in BOTH
    // repos — the public `contextractor` mirror and the `tools` source-of-truth
    // engine workspace (`projects/contextractor-engine/`) — two levels up from this
    // `standalone` package, so a single resolution works in both.
    const resolveDoc = async (name: string) => {
      const candidate = path.join(__dirname, '..', '..', name); // workspace root
      try {
        await access(candidate);
        return candidate;
      } catch {
        throw new Error(`tsup: could not locate ${name} at the workspace root (${candidate})`);
      }
    };
    await copyFile(await resolveDoc('NOTICE'), path.join(__dirname, 'dist', 'NOTICE'));
    await copyFile(await resolveDoc('LICENSE'), path.join(__dirname, 'dist', 'LICENSE'));
  },
});
