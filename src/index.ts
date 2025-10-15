import axios from "axios"
import { execSync } from "node:child_process"
import os from "node:os"
import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"
import { generateApi } from "swagger-typescript-api"
import { Defines, getDirname, getPArray, getPKey, getPValue, isUrl, saveFile } from "./utils"
import { glob } from "glob"
/** 配置集合 */
const confs = {
  /** 文件集合 */
  files: [],
  /** 参数 */
  param: {} as { url?: string; output?: string; name?: string }
} as Defines["confs"]
/** 数据集合 */
const datas = {
  /** 用户目录 */
  home: os.homedir(),
  /** 枚举 */
  enum: {} as { [key: string]: number }
} as Defines["datas"]
/** 退出 */
function onExit(message?: string) {
  message && console.log(message)
  process.exit()
}
/** 加载参数 */
async function onLoadParam() {
  /** 参数 */
  datas.param = {
    config: getPValue(["--config", "-c"]),
    configScan: getPKey(["--config-scan", "-cs"]),
    configAll: getPKey(["--config-all", "-ca"]),
    quick: getPKey(["--quick", "-q"]),
    replaceTags: getPArray(["--replace-tags", "-rt"], { length: 2 }),
    convertGet: getPKey(["--convert-get", "-cg"]),
    removeParam: getPKey(["--remove-param", "-rp"]),
    removePrefixIndex: getPValue(["--remove-prefix-index", "-rpi"]),
    removeDts: getPKey(["--remove-dts", "-rd"]),
    extractRequestQuery: getPValue(["--extract-request-query", "-erq"]),
    extractResponseRaw: getPKey(["--extract-response-raw", "-err"]),
    template: path.resolve(getDirname(), "./templates")
  }
  /** 配置 */
  datas.config = {
    templates: getPValue(["--templates", "-t"]) ?? datas.param.template, // 路径到包含模板的文件夹
    defaultResponseAsSuccess: getPKey(["--default-as-success", "-d"]), // 将“默认”响应状态码也用作成功响应
    generateResponses: getPKey(["--responses", "-r"]), // 生成有关请求响应的附加信息
    generateUnionEnums: getPKey("--union-enums"), // 生成所有“枚举”类型为联合类型 (T1 | T2 | TN)
    addReadonly: getPKey("--add-readonly"), // 生成只读属性
    generateRouteTypes: getPKey("--route-types"), // 生成 API 路由的类型定义
    generateClient: !getPKey("--no-client"), // 不要生成API类
    enumNamesAsValues: getPKey("--enum-names-as-values"), // 使用'x-enumNames'中的值作为枚举值（而不仅仅是作为键）
    extractRequestParams: getPKey("--extract-request-params"), // 提取请求参数到数据合同
    extractRequestBody: getPKey("--extract-request-body"), // 将请求体类型提取到数据契约
    extractResponseBody: getPKey("--extract-response-body"), // 将响应体类型提取到数据契约
    extractResponseError: getPKey("--extract-response-error"), // 提取响应错误类型到数据合同
    modular: getPKey("--modular"), // 生成http客户端、数据契约和路由的分离文件
    toJS: getPKey("--js"), // 生成带有声明文件的js api模块
    moduleNameIndex: Number(getPValue("--module-name-index") ?? 0), // 确定用于路由分离的路径索引
    moduleNameFirstTag: getPKey("--module-name-first-tag"), // 根据第一个标签拆分路线
    httpClientType: getPKey("--axios") ? "axios" : "fetch", // 生成 axios http 客户端
    unwrapResponseData: getPKey("--unwrap-response-data"), // 从响应中提取数据项
    disableThrowOnError: getPKey("--disable-throw-on-error"), // 当 response.ok 不为真时，不要抛出错误（默认：false）
    singleHttpClient: getPKey("--single-http-client"), // 能够将HttpClient实例传递给Api构造函数（默认：false）
    silent: getPKey("--silent") ?? true, // 仅将错误输出到控制台
    defaultResponseType: getPValue("--default-response") ?? "void", // 默认类型为无响应模式
    typePrefix: getPValue("--type-prefix") ?? "", // 数据合同名称前缀
    typeSuffix: getPValue("--type-suffix") ?? "", // 数据合同名称后缀
    cleanOutput: getPKey("--clean-output"), // 在生成API之前清理输出文件夹。 警告：可能会导致数据丢失（默认：false）
    ...(getPValue("--api-class-name") ? { apiClassName: getPValue("--api-class-name") } : {}), // API类名
    patch: getPKey("--patch"), // 修正Swagger源定义中的小错误（默认：false）
    debug: getPKey("--debug"), // 此工具内进程的附加信息（默认：false）
    anotherArrayType: getPKey("--another-array-type"), // 生成数组类型为 Array<Type>（默认为 Type[]）（默认：false）
    sortTypes: getPKey("--sort-types"), // 排序字段和类型（默认：false）
    extractEnums: getPKey("--extract-enums") // 从内联接口提取所有枚举类型 将内容提取到 typescript 枚举构造中（默认：false）
  } as Parameters<typeof generateApi>["0"]
}
/** 加载配置 */
async function onLoadConfig() {
  // 疏理文件
  if (datas.param.config) {
    // 指定配置文件
    confs.files = datas.param.config.split(",")
  } else if (datas.param.configScan ?? true) {
    // 扫描配置文件
    confs.files = glob.sync(["./**/saconfig*.json"], { ignore: "node_modules/**" })
  }
  // 默认文件
  if (confs.files.length == 0) confs.files = ["saconfig.json"]
  // 选择文件
  if (!datas.param.configAll && confs.files.length > 1) {
    confs.files = (
      await prompts({
        type: "multiselect",
        name: "files",
        message: "选择配置文件",
        hint: "可多选，空格键勾选，回车完成",
        choices: confs.files.map((item) => ({ title: item.replace(/\\/g, "/"), value: item }))
      }).then((res) => (res.files?.length != 0 ? res : onExit("结束：至少选择一个配置文件")))
    )["files"]
  }
  // 检查配置
  if (!(confs.files?.length > 0)) onExit("结束：手动退出")
}
/** 输入参数 */
async function onInputParam() {
  try {
    // 初始化配置
    confs.param = {}
    // 读取配置文件
    confs.param = JSON.parse(fs.readFileSync(confs.file, "utf-8"))
  } catch (error) {}
  // 检查快速模式
  if (!datas.param.quick || [confs.param.url, confs.param.output, confs.param.name].includes(undefined)) {
    // 输入配置
    confs.param = await prompts([
      { name: "url", type: "text", message: "Swagger docs 地址:", initial: confs.param.url ?? "https://example.com/v3/api-docs" },
      { name: "output", type: "text", message: "输出地址:", initial: confs.param.output ?? "./src/api" },
      { name: "name", type: "text", message: "文件名:", initial: confs.param.name ?? "index" }
    ])
  }
  // 检查配置
  if ([confs.param.url, confs.param.output, confs.param.name].includes(undefined)) onExit("结束：手动退出")
  // 疏理文档
  datas.docFile = path.resolve(`${confs.param.output}/${confs.param.name}-${new Date().getTime()}.json`)
}
/** 加载文档 */
async function onLoadDoc(index = 0) {
  // 疏理文件
  confs.file = confs.files[index]
  // 输入配置
  await onInputParam()
  // 检查地址
  if (isUrl(confs.param.url)) {
    // 请求文档
    await axios
      .get(confs.param.url)
      .then((res) => onGenerateApi(res.data))
      .catch((err) => console.log("失败：", err))
  } else {
    try {
      // 读取文档
      await onGenerateApi(JSON.parse(fs.readFileSync(path.resolve(confs.param.url), "utf8")))
    } catch (error) {
      console.log("失败：", error)
    }
  }
  // 加载下一个文档
  confs.files[index + 1] && onLoadDoc(index + 1)
}
/** 生成接口 */
async function onGenerateApi(data: Defines["data"]) {
  // 检查格式
  if (typeof data?.paths != "object") return console.log("失败：缺少paths字段")
  // 处理数据
  Object.entries(data.paths).forEach((item) => {
    Object.keys(item[1]).forEach((item2) => {
      // 配置标签
      if (datas.param.replaceTags.length) {
        // 替换标签
        data.paths[item[0]][item2].tags = data.paths[item[0]][item2].tags?.map((item) =>
          item.replace(new RegExp(`^${datas.param.replaceTags[0]}$`, "g"), datas.param.replaceTags[1] ?? "")
        )
      }
      // 配置操作id
      let id = `${item[0]}/${item2}`
      // 转换无{.+}get为query
      if (datas.param.convertGet) {
        id = id.replace(/([^\}]\/)get$/g, "$1query")
      }
      // 移除参数
      if (datas.param.removeParam) {
        id = id.replace(/\/\{.+?\}/g, "")
      }
      // 移除前缀索引
      if (datas.param.removePrefixIndex) {
        let ids = id.split("/")
        ids = ids.slice(0, 1).concat(ids.slice(Number(datas.param.removePrefixIndex) + 2))
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
  saveFile(datas.docFile, JSON.stringify(data))
  // 生成接口
  console.log("执行：", confs.file)
  await generateApi({
    fileName: `${confs.param.name}.ts`, // 输出类型的 API 文件名称（默认："Api.ts"）
    output: path.resolve(confs.param.output), // TypeScript API 文件的输出路径（默认："./"）
    input: datas.docFile, // 路径/链接到Swagger方案
    ...datas.config,
    ...{ param: datas.param }
  })
  console.log("完成：", path.resolve(confs.param.output, `${confs.param.name}${!datas.config.toJS ? ".ts" : ".js"}`))
  if (datas.config.toJS) {
    console.log("完成：", path.resolve(confs.param.output, `${confs.param.name}.d.ts`))
  }
  // 删除文档
  fs.unlinkSync(datas.docFile)
  // 移除使用--js参数时生成的d.ts文件
  if (datas.param.removeDts) {
    console.log("清理：", path.resolve(confs.param.output, `${confs.param.name}.d.ts`))
    execSync(`npx rimraf ${path.resolve(confs.param.output, `${confs.param.name}.d.ts`)}`, { cwd: datas.home }).toString()
  }
  // 保存配置
  saveFile(confs.file, JSON.stringify(confs.param, null, 2))
}
/** 主线 */
async function onMain() {
  // 加载参数
  await onLoadParam()
  // 加载配置
  await onLoadConfig()
  // 加载文档
  onLoadDoc()
}
// 导出方法
export { onMain as generateApi }
