import fs from "node:fs"
import url from "node:url"
import path from "node:path"
/** 数据集合 */
const datas = {
  /** 参数 */
  param: process.argv.filter((_item, index) => index > 1),
  /** 已使用 */
  used: {} as { [key: number]: boolean }
}
/**
 * 获取参数
 * @param name 参数名称
 * @param next true取索引值，false取索引键
 * @param use 配置已使用
 * @return 选中的参数
 */
export function getParam(name: string | string[], next = true, use = true) {
  // 处理名称
  if (!Array.isArray(name)) name = [name]
  // 配置数据
  let data: boolean | string
  // 查询参数
  datas.param.forEach((item, index) => {
    // 查询索引
    if (!name.includes(item)) {
      // 空值
      return
    } else if (next) {
      // 取索引值
      data = datas.param[index + 1]
      // 配置已使用
      use && Object.assign(datas.used, { [index + 1]: true })
    } else if (["true", "false"].includes(datas.param[index + 1])) {
      // 取索引键，但存在索引值的话，则取索引值
      data = datas.param[index + 1].toLowerCase() == "true"
      // 配置已使用
      use && Object.assign(datas.used, { [index + 1]: true })
    } else {
      // 取索引键
      data = true
    }
    // 配置已使用
    use && Object.assign(datas.used, { [index]: true })
  })
  // 返回参数
  return data
}
/**
 * 获取参数索引键
 * @param name 参数名称
 * @param use 配置已使用
 * @return 选中的参数
 */
export function getParamKey(name: string | string[], use = true) {
  return getParam(name, false, use) as boolean
}
/**
 * 获取参数索引值
 * @param name 参数名称
 * @param use 配置已使用
 * @return 选中的参数
 */
export function getParamValue(name: string | string[], use = true) {
  return getParam(name, true, use) as string
}
/**
 * 获取参数列表
 * @param used 是否已使用
 * @return 参数数组
 */
export function getParamList(used?: boolean) {
  return typeof used == "boolean" ? datas.param.filter((_item, index) => (used ? datas.used[index] : !datas.used[index])) : datas.param
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
