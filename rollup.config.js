import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default {
  input: "assets/js/app.js",
  output: {
    file: "dist/js/bundle.js",
    format: "iife",
    name: "ConfidentlyRoutine",
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      presets: ["@babel/preset-env"],
    }),
    terser(),
  ],
};
