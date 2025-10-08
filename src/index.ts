import axios from "axios"
import { execSync } from "node:child_process"
import os from "node:os"
import fs from "node:fs"
import url from "node:url"
import path from "node:path"
import prompts from "prompts"
import { getParam, isUrl, saveFile } from "./utils/index.js"
/** 定义集合 */
type Defines = {
  /** 数据 */
  data: { paths: { [key: string]: { [key: string]: any } }; [key: string]: any }
  [key: string]: any
}
/** 配置集合 */
let confs = {
  /** 文件 */
  file: path.resolve(getParam("--config") ?? ".swaggerrc"),
  /** 参数 */
  param: {} as { url?: string; output?: string; name?: string }
}
try {
  confs.param = JSON.parse(fs.readFileSync(confs.file, "utf-8"))
} catch (error) {}
// 输入配置
confs.param = await prompts([
  { name: "url", type: "text", message: "Swagger docs 地址:", initial: confs.param.url ?? "https://example.com/v3/api-docs" },
  { name: "output", type: "text", message: "输出地址:", initial: confs.param.output ?? "./src/api" },
  { name: "name", type: "text", message: "文件名:", initial: confs.param.name ?? "index" }
])
// 检查配置
if ([confs.param.url, confs.param.output, confs.param.name].includes(undefined)) {
  console.log("失败：手动退出")
  process.exit()
}
/** 数据集合 */
let datas = {
  /** 用户目录 */
  home: os.homedir(),
  /** 脚本 */
  script: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../node_modules/.bin/swagger-typescript-api"),
  /** 参数 */
  param: process.argv.filter((_item, index) => index > 1),
  /** 文件 */
  file: path.resolve(`${confs.param.output}/${confs.param.name}-${new Date().getTime()}.json`),
  /** 枚举 */
  enum: {} as { [key: string]: number }
}
/** 生成 */
function onGenerate(data: Defines["data"]) {
  // 检查格式
  if (typeof data?.paths != "object") return console.log("失败：缺少paths字段")
  // 处理数据
  Object.entries(data.paths).forEach((item) => {
    Object.keys(item[1]).forEach((item2) => {
      data.paths[item[0]][item2].operationId = `${item[0]}/${item2}`
        .replace(/([^\}]\/)get$/, "$1query")
        .replace(/\/\{.+?\}/, "")
        .replace(/^\/[^\/]*/, "")
      const last = data.paths[item[0]][item2].operationId.split("/")
      if (typeof datas.enum[last.slice(-1)] == "number") {
        datas.enum[last.slice(-1)]++
      } else {
        datas.enum[last.slice(-1)] = 1
      }
    })
  })
  console.log("就绪：", ...Object.entries(datas.enum).map((item) => item.join("-")))
  // 保存文档
  saveFile(datas.file, JSON.stringify(data))
  // 生成接口
  const param = ["generate", "-n", `${confs.param.name}.ts`, "-o", path.resolve(confs.param.output), "-p", datas.file, ...datas.param]
  console.log("执行：", execSync(`${datas.script} ${param.join(" ")}`, { cwd: datas.home }).toString())
  // 删除文档
  fs.unlinkSync(datas.file)
  // 保存配置
  saveFile(confs.file, JSON.stringify(confs.param, null, 4))
}
/** 运行 */
function onRun(url = confs.param.url) {
  // 检查地址
  if (isUrl(url)) {
    // 请求文档
    axios
      .get(url)
      .then((res) => onGenerate(res.data))
      .catch((err) => console.log("失败：", err))
  } else {
    try {
      // 读取文档
      onGenerate(JSON.parse(fs.readFileSync(path.resolve(url), "utf8")))
    } catch (error) {
      console.log("失败：", error)
    }
  }
}
// 执行脚本
onRun()
