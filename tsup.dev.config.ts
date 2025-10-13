import { defineConfig } from "tsup"
import { copy } from "esbuild-plugin-copy"

export default defineConfig({
  entry: ["src/cli.ts"], // 入口文件
  outDir: "dist", // 输出目录
  splitting: false, // 是否开启代码分割
  esbuildPlugins: [copy({ assets: [{ from: "./src/templates/**/*", to: "./templates" }] })], // 带上模板文件
  clean: true, // 是否清理dist目录
  dts: false, // 是否生成.d.ts类型文件
  format: ["esm"], // 输出ESM格式
  minify: process.env.NODE_ENV === "production",
  target: "node20" // Node.js版本目标
})
