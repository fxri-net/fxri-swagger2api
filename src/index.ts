import axios from "axios"
import { execSync } from "node:child_process"
import os from "node:os"
import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"
import { generateApi } from "swagger-typescript-api"
import { getParamKey, getParamValue, isUrl, saveFile } from "./utils"
/** 定义集合 */
type Defines = {
  /** 配置集合 */
  confs: {
    /** 文件 */
    file: string
    /** 参数 */
    param: { url?: string; output?: string; name?: string }
  }
  /** 数据集合 */
  datas: {
    /** 用户目录 */
    home: string
    /** 文件 */
    file: string
    /** 枚举 */
    enum: { [key: string]: number }
  }
  /** 数据 */
  data: { paths: { [key: string]: { [key: string]: any } }; [key: string]: any }
}
/** 配置集合 */
let confs: Defines["confs"]
/** 数据集合 */
let datas: Defines["datas"]
/** 初始化参数 */
async function onInit() {
  /** 配置集合 */
  confs = {
    /** 文件 */
    file: path.resolve(getParamValue(["--config", "-c"]) ?? ".swaggerrc"),
    /** 参数 */
    param: {} as { url?: string; output?: string; name?: string }
  }
  try {
    confs.param = JSON.parse(fs.readFileSync(confs.file, "utf-8"))
  } catch (error) {}
  // 检查快速模式
  if (!getParamKey(["--quick", "-q"]) || [confs.param.url, confs.param.output, confs.param.name].includes(undefined)) {
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
  datas = {
    /** 用户目录 */
    home: os.homedir(),
    // /** 脚本 */
    // script: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../node_modules/.bin/swagger-typescript-api"),
    /** 文件 */
    file: path.resolve(`${confs.param.output}/${confs.param.name}-${new Date().getTime()}.json`),
    /** 枚举 */
    enum: {} as { [key: string]: number }
  }
}
/** 加载文档 */
function onLoad(url = confs.param.url) {
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
/** 生成接口 */
async function onGenerate(data: Defines["data"]) {
  // 检查格式
  if (typeof data?.paths != "object") return console.log("失败：缺少paths字段")
  // 处理数据
  Object.entries(data.paths).forEach((item) => {
    Object.keys(item[1]).forEach((item2) => {
      // 配置操作id
      let id = `${item[0]}/${item2}`
      // 转换无{.+}get为query
      if (getParamKey(["--convert-get", "-cg"])) {
        id = id.replace(/([^\}]\/)get$/g, "$1query")
      }
      // 移除参数
      if (getParamKey(["--remove-param", "-rp"])) {
        id = id.replace(/\/\{.+?\}/g, "")
      }
      // 移除前缀索引
      if (getParamValue(["--remove-prefix-index", "-rpi"])) {
        let ids = id.split("/")
        ids = ids.slice(0, 1).concat(ids.slice(Number(getParamValue(["--remove-prefix-index", "-rpi"])) + 2))
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
  const rd = getParamKey(["--remove-d.ts", "-rd"])
  // 生成接口
  console.log("执行：")
  await generateApi({
    fileName: `${confs.param.name}.ts`, // 输出类型的 API 文件名称（默认："Api.ts"）
    output: path.resolve(confs.param.output), // TypeScript API 文件的输出路径（默认："./"）
    input: datas.file, // 路径/链接到Swagger方案
    templates: getParamValue(["--templates", "-t"]), // 路径到包含模板的文件夹
    defaultResponseAsSuccess: getParamKey(["--default-as-success", "-d"]), // 将“默认”响应状态码也用作成功响应
    generateResponses: getParamKey(["--responses", "-r"]), // 生成有关请求响应的附加信息
    generateUnionEnums: getParamKey("--union-enums"), // 生成所有“枚举”类型为联合类型 (T1 | T2 | TN)
    addReadonly: getParamKey("--add-readonly"), // 生成只读属性
    generateRouteTypes: getParamKey("--route-types"), // 生成 API 路由的类型定义
    generateClient: getParamKey("--no-client"), // 不要生成API类
    enumNamesAsValues: getParamKey("--enum-names-as-values"), // 使用'x-enumNames'中的值作为枚举值（而不仅仅是作为键）
    extractRequestParams: getParamKey("--extract-request-params"), // 提取请求参数到数据合同
    extractRequestBody: getParamKey("--extract-request-body"), // 将请求体类型提取到数据契约
    extractResponseBody: getParamKey("--extract-response-body"), // 将响应体类型提取到数据契约
    extractResponseError: getParamKey("--extract-response-error"), // 提取响应错误类型到数据合同
    modular: getParamKey("--modular"), // 生成http客户端、数据契约和路由的分离文件
    toJS: getParamKey("--js"), // 生成带有声明文件的js api模块
    moduleNameIndex: Number(getParamValue("--module-name-index") ?? 0), // 确定用于路由分离的路径索引
    moduleNameFirstTag: getParamKey("--module-name-first-tag"), // 根据第一个标签拆分路线
    httpClientType: getParamKey("--axios") ? "axios" : "fetch", // 生成 axios http 客户端
    unwrapResponseData: getParamKey("--unwrap-response-data"), // 从响应中提取数据项
    disableThrowOnError: getParamKey("--disable-throw-on-error"), // 当 response.ok 不为真时，不要抛出错误（默认：false）
    singleHttpClient: getParamKey("--single-http-client"), // 能够将HttpClient实例传递给Api构造函数（默认：false）
    silent: getParamKey("--silent"), // 仅将错误输出到控制台
    defaultResponseType: getParamValue("--default-response") ?? "void", // 默认类型为无响应模式
    typePrefix: getParamValue("--type-prefix"), // 数据合同名称前缀
    typeSuffix: getParamValue("--type-suffix"), // 数据合同名称后缀
    cleanOutput: getParamKey("--clean-output"), // 在生成API之前清理输出文件夹。 警告：可能会导致数据丢失（默认：false）
    apiClassName: getParamValue("--api-class-name "), // API类名
    patch: getParamKey("--patch"), // 修正Swagger源定义中的小错误（默认：false）
    debug: getParamKey("--debug"), // 此工具内进程的附加信息（默认：false）
    anotherArrayType: getParamKey("--another-array-type"), // 生成数组类型为 Array<Type>（默认为 Type[]）（默认：false）
    sortTypes: getParamKey("--sort-types"), // 排序字段和类型（默认：false）
    extractEnums: getParamKey("--extract-enums") // 从内联接口提取所有枚举类型 将内容提取到 typescript 枚举构造中（默认：false）
  })
  // 删除文档
  fs.unlinkSync(datas.file)
  // 移除使用--js参数时生成的d.ts文件
  if (rd) {
    console.log("清理：", path.resolve(confs.param.output, `${confs.param.name}.d.ts`))
    execSync(`npx rimraf ${path.resolve(confs.param.output, `${confs.param.name}.d.ts`)}`, { cwd: datas.home }).toString()
  }
  // 保存配置
  saveFile(confs.file, JSON.stringify(confs.param, null, 4))
}
/** 运行 */
async function onRun() {
  // 初始化参数
  await onInit()
  // 加载文档
  onLoad()
}
// 执行脚本
onRun()
