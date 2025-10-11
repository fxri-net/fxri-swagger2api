import axios from "axios"
import { execSync } from "node:child_process"
import os from "node:os"
import fs from "node:fs"
import url from "node:url"
import path from "node:path"
import prompts from "prompts"
import { getParam, getParamList, isUrl, saveFile } from "./utils/index.js"
/** 定义集合 */
type Defines = {
  /** 数据 */
  data: { paths: { [key: string]: { [key: string]: any } }; [key: string]: any }
  [key: string]: any
}
/** 配置集合 */
const confs = {
  /** 文件 */
  file: path.resolve((getParam(["--config", "-c"]) as string) ?? ".swaggerrc"),
  /** 参数 */
  param: {} as { url?: string; output?: string; name?: string }
}
try {
  confs.param = JSON.parse(fs.readFileSync(confs.file, "utf-8"))
} catch (error) {}
// 检查快速模式
if (!getParam(["--quick", "-q"], false) || [confs.param.url, confs.param.output, confs.param.name].includes(undefined)) {
  // 输入配置
  confs.param = await prompts([
    { name: "url", type: "text", message: "Swagger docs 地址:", initial: confs.param.url ?? "https://example.com/v3/api-docs" },
    { name: "output", type: "text", message: "输出地址:", initial: confs.param.output ?? "./src/api" },
    { name: "name", type: "text", message: "文件名:", initial: confs.param.name ?? "index" }
  ])
}
// 检查配置
if ([confs.param.url, confs.param.output, confs.param.name].includes(undefined)) {
  console.log("失败：手动退出")
  process.exit()
}
/** 数据集合 */
const datas = {
  /** 用户目录 */
  home: os.homedir(),
  /** 脚本 */
  script: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../node_modules/.bin/swagger-typescript-api"),
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
      // 配置操作id
      let id = `${item[0]}/${item2}`
      // 转换无{.+}get为query
      if (getParam(["--convert-get", "-cg"], false)) {
        id = id.replace(/([^\}]\/)get$/g, "$1query")
      }
      // 移除参数
      if (getParam(["--remove-param", "-rp"], false)) {
        id = id.replace(/\/\{.+?\}/g, "")
      }
      // 移除前缀索引
      if (getParam(["--remove-prefix-index", "-rpi"])) {
        let ids = id.split("/")
        ids = ids.slice(0, 1).concat(ids.slice(Number(getParam(["--remove-prefix-index", "-rpi"])) + 2))
        id = ids.join("/")
      }
      // 配置操作id
      data.paths[item[0]][item2].operationId = id
      // 统计请求方式
      const method = id.split("/").slice(-1)[0]
      typeof datas.enum[method] == "number" ? datas.enum[method]++ : (datas.enum[method] = 1)
    })
  })
  console.log("就绪：", ...Object.entries(datas.enum).map((item) => item.join("-")))
  // 保存文档
  saveFile(datas.file, JSON.stringify(data))
  // 获取移除文件参数
  const rd = getParam(["--remove-d.ts", "-rd"], false)
  // 生成接口
  const param = ["generate", "-n", `${confs.param.name}.ts`, "-o", path.resolve(confs.param.output), "-p", datas.file, ...getParamList(false)]
  console.log("执行：", execSync(`${datas.script} ${param.join(" ")}`, { cwd: datas.home }).toString())
  // 删除文档
  fs.unlinkSync(datas.file)
  // 移除使用--js参数时生成的d.ts文件
  if (rd) {
    console.log("移除：", path.resolve(confs.param.output, `${confs.param.name}.d.ts`))
    execSync(`npx rimraf ${path.resolve(confs.param.output, `${confs.param.name}.d.ts`)}`, { cwd: datas.home }).toString()
  }
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
