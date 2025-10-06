import axios from "axios"
import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import prompts from "prompts"
/** 定义集合 */
type Defines = {
  /** 数据 */
  data: { paths: { [key: string]: { [key: string]: any } }; [key: string]: any }
  [key: string]: any
}
/** 数据集合 */
let datas = {
  ...(await prompts([
    { name: "url", type: "text", message: "Swagger docs 地址:", initial: "https://example.com/v3/api-docs" },
    { name: "output", type: "text", message: "输出地址:", initial: "./src/api" },
    { name: "name", type: "text", message: "文件名:", initial: "index" }
  ])),
  /** 枚举 */
  enum: {} as { [key: string]: number }
}
// 请求文档
axios.get(datas.url).then((res: Defines) => {
  // 检查格式
  if (typeof res.data?.paths != "object") return console.log("文档格式错误，缺少paths字段")
  // 处理数据
  Object.entries(res.data.paths).forEach((item) => {
    Object.keys(item[1]).forEach((item2) => {
      res.data.paths[item[0]][item2].operationId = `${item[0]}/${item2}`
        .replace(/([^\}]\/)get$/, "$1query")
        .replace(/\/\{.+?\}/, "")
        .replace(/^\/[^\/]*/, "")
      const last = res.data.paths[item[0]][item2].operationId.split("/")
      if (typeof datas.enum[last.slice(-1)] == "number") {
        datas.enum[last.slice(-1)]++
      } else {
        datas.enum[last.slice(-1)] = 1
      }
    })
  })
  // 文件名称
  const file = `${datas.output}/${datas.name}.json`
  // 保存文档
  writeFileSync(file, JSON.stringify(res.data))
  // 生成文档
  console.log(execSync(`swagger-typescript-api generate --axios -n ${datas.name}.ts -o ${datas.output} -p ${file}`).toString())
})
