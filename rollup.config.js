import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  // Main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['react', 'react-dom', '@logistically/i18n'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // SSR bundle
  {
    input: 'src/ssr/index.ts',
    output: [
      {
        file: 'dist/ssr.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/ssr.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['react', 'react-dom', '@logistically/i18n'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // Context adapter
  {
    input: 'src/adapters/context.tsx',
    output: [
      {
        file: 'dist/adapters/context.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/adapters/context.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['react', 'react-dom', '@logistically/i18n'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // Zustand adapter
  {
    input: 'src/adapters/zustand.ts',
    output: [
      {
        file: 'dist/adapters/zustand.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/adapters/zustand.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['react', 'react-dom', '@logistically/i18n', 'zustand'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // Redux adapter
  {
    input: 'src/adapters/redux.ts',
    output: [
      {
        file: 'dist/adapters/redux.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/adapters/redux.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['react', 'react-dom', '@logistically/i18n', '@reduxjs/toolkit', 'react-redux'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // React Native bundle
  {
    input: 'src/react-native/index.ts',
    output: [
      {
        file: 'dist/react-native.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/react-native.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['react', 'react-native', '@logistically/i18n'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  }
];
