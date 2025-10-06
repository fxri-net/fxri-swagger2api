import axios from "axios"
import { execSync } from "node:child_process"
import fs from "node:fs"
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
let confs = { file: path.resolve(getParam("--config") ?? ".swaggerrc"), param: {} as { url?: string; output?: string; name?: string } }
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
  /** 文件 */
  file: `${confs.param.output}/${confs.param.name}.json`,
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
  // 保存配置
  saveFile(confs.file, JSON.stringify(confs.param, null, 4))
  // 生成文档
  console.log("执行：", execSync(`swagger-typescript-api generate --axios -n ${confs.param.name}.ts -o ${confs.param.output} -p ${datas.file}`).toString())
}
/** 运行 */
function onRun(url = confs.param.url) {
  // 检查地址
  if (isUrl(url)) {
    // 请求文档
    axios
      .get(url)
      .then((res) => onGenerate(res.data))
      .catch((err) => console.log("失败：", err.status ? `接口异常，状态码${err.status}` : err))
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
