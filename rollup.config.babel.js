import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: './src/index.ts',
  output: {
    file: './build/rnpm.js',
    format: 'umd',
    name: 'ReactNativePopupMenu',
    sourcemap: true,
  },

  plugins: [
    resolve({ extensions }),
    babel({
      exclude: 'node_modules/**',
      extensions,
      babelHelpers: 'bundled',
      babelrc: false,
      presets: [
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: ['@babel/plugin-transform-class-properties'],
    }),
    commonjs(),
    typescript(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],

  external: ['react', 'react-dom', 'react-native'],
};
