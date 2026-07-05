import { access, copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsup';

const NATIVE_DIR = path.join(__dirname, '..', 'extraction', 'native');

/**
 * The published `contextractor` tarball must carry no `@contextractor/*`
 * runtime dependencies (the core packages are internal-only, `private: true`).
 * This bundles them into `dist` and stages the napi-rs loader plus every
 * platform `.node` prebuild under `dist/native/`, where the loader's
 * local-file branch picks the right one at runtime. Public packages
 * (crawlee, playwright, commander, …) stay external regular dependencies.
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
  // still works, and chunks sit next to cli.js so the relative
  // `./native/index.cjs` external below still resolves.
  splitting: true,
  noExternal: [/^@contextractor\//],
  banner: {
    // Bundled CJS code (e.g. @contextractor/extraction) requires external
    // modules at runtime; ESM output has no `require` without this shim. The
    // aliased import avoids colliding with source-level createRequire imports.
    js: "import { createRequire as __bundleCreateRequire } from 'node:module'; const require = __bundleCreateRequire(import.meta.url);",
  },
  esbuildPlugins: [
    {
      name: 'native-addon-redirect',
      setup(build) {
        // The napi-rs loader stays an external CJS file next to the bundle
        // (it locates its `.node` files via `__dirname`).
        build.onResolve({ filter: /^@contextractor\/extraction-native$/ }, () => ({
          path: './native/index.cjs',
          external: true,
        }));
      },
    },
  ],
  async onSuccess() {
    const outNative = path.join(__dirname, 'dist', 'native');
    await mkdir(outNative, { recursive: true });
    await copyFile(path.join(NATIVE_DIR, 'index.js'), path.join(outNative, 'index.cjs'));
    // The napi-rs prebuild triples are committed as directories under
    // `native/npm/<platform>/` — derive the list instead of hand-maintaining it.
    const npmDir = path.join(NATIVE_DIR, 'npm');
    const platforms = (await readdir(npmDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    if (platforms.length === 0) {
      throw new Error(
        `no prebuild platform directories found in ${npmDir} — the tarball would ship without native modules`,
      );
    }
    for (const platform of platforms) {
      const file = `contextractor-extraction-native.${platform}.node`;
      await copyFile(path.join(npmDir, platform, file), path.join(outNative, file));
    }
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
