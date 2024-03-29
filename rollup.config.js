import typescript from '@rollup/plugin-typescript';
import pkg from './package.json'

export default {
  input: './src/index.ts',
  output: [
    // cjs  => common.js
    // esm
    {
      format: 'cjs',
      file: pkg.main
    },
    {
      format: 'es',
      file: pkg.module
    }
  ],
  plugins: [
    typescript()
  ]
}
