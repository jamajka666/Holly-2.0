#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

const root = process.cwd();
const src = path.join(root, 'src', 'index.css');
const out = path.join(root, 'src', 'App.css');

async function build() {
  if (!fs.existsSync(src)) {
    console.error('Source CSS not found:', src);
    process.exit(1);
  }

  const css = fs.readFileSync(src, 'utf8');
  try {
    const result = await postcss([tailwindPostcss, autoprefixer]).process(css, { from: src, to: out });
    fs.writeFileSync(out, result.css, 'utf8');
    console.log('Wrote', out);
    if (result.map) fs.writeFileSync(out + '.map', result.map.toString(), 'utf8');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

build();
