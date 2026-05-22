import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/server.js',
    external: [
      'sqlite3',
      'better-sqlite3',
      'mssql', 
      'express',
      'cors',
      'multer'
    ],
    format: 'esm',
  });
}

build().catch(() => process.exit(1));
