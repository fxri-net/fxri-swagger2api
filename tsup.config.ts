import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/bin/index.ts"], // 入口文件
  splitting: false, // 关闭代码分割
  clean: true, // 清理dist目录
  dts: true, // 生成.d.ts类型文件
  format: ["cjs", "esm"], // 输出CommonJS和ESM双格式
  minify: process.env.NODE_ENV === "production",
  target: "node20" // Node.js版本目标
})
