import { defineConfig } from "vite";
import path from "path";

const srcPath = path.resolve(__dirname, "./src");

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^src\/(.*)/,
        replacement: `${srcPath}/$1`,
      },
    ],
  },
  // optimizeDeps: {
  //   include: [`${srcPath}/vendors/fabric.js`],
  // },
  server: {
    https: false,
  },
});
