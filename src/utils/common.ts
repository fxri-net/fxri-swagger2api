import fs from "node:fs"
import url from "node:url"
import path from "node:path"
/** 数据集合 */
const datas = {
  /** 参数 */
  param: process.argv.filter((_item, index) => index > 1)
}
/**
 * 获取参数
 * @param name 参数名称
 * @param type 类型，key:键名、布尔型，value:键值，array:数组
 * @param param 参数
 * @return 选中的参数
 */
export function getParam(name: string | string[], type = "value" as "key" | "value" | "array", param: { [key: string]: any } = {}) {
  // 处理名称
  if (!Array.isArray(name)) name = [name]
  // 配置数据
  let data: boolean | string | string[]
  // 查询参数
  datas.param.forEach((item, index) => {
    // 查询索引
    if (!name.includes(item)) {
      // 空值
      return
    } else if (["value"].includes(type)) {
      // 取键值
      data = datas.param[index + 1]
    } else if (["array"].includes(type)) {
      // 取数组
      data = Array.from({ length: param.length ?? 1 }).map((_item2, index2) => datas.param[index + index2 + 1])
    } else {
      // 取键名
      data = !["false"].includes(datas.param[index + 1])
    }
  })
  // 返回参数
  return data
}
/**
 * 获取参数键名
 * @param name 参数名称
 * @return 选中的参数
 */
export function getPKey(name: string | string[]) {
  return getParam(name, "key") as boolean
}
/**
 * 获取参数键值
 * @param name 参数名称
 * @return 选中的参数
 */
export function getPValue(name: string | string[]) {
  return getParam(name, "value") as string
}
/**
 * 获取参数数组
 * @param name 参数名称
 * @param param 参数
 * @return 选中的参数
 */
export function getPArray(name: string | string[], param: { [key: string]: any } = {}) {
  return (getParam(name, "array", param) ?? []) as string[]
}
/**
 * 保存文件
 * @param file 文件地址
 * @param data 数据
 * @return 无返回数据
 */
export function saveFile(file, data) {
  // 获取目录
  const dir = path.dirname(file)
  // 创建目录
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  // 写入文件
  fs.writeFileSync(file, data)
}
/** 获取当前文件 */
export function getFilename() {
  return typeof require !== "undefined" && typeof module !== "undefined" ? __filename : url.fileURLToPath(import.meta.url)
}
/** 获取当前目录 */
export function getDirname() {
  return typeof require !== "undefined" && typeof module !== "undefined" ? __dirname : path.dirname(getFilename())
}
