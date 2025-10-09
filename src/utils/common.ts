import fs from "node:fs"
import path from "node:path"
/** 数据集合 */
let datas = {
  /** 参数 */
  param: process.argv.filter((_item, index) => index > 1),
  /** 已使用 */
  used: {} as { [key: number]: boolean }
}
/** 获取参数 */
export function getParam(name: string | string[], next = true, use = true) {
  // 处理名称
  if (!Array.isArray(name)) name = [name]
  // 查询索引
  const index = datas.param.findLastIndex((item) => name.includes(item))
  // 配置已使用
  use && index >= 0 && Object.assign(datas.used, { [index]: true, [index + 1]: next })
  // 返回参数
  return index >= 0 ? datas.param[index + Number(next)] : undefined
}
/** 获取参数列表 */
export function getParamList(used?: boolean) {
  return typeof used == "boolean" ? datas.param.filter((_item, index) => (used ? datas.used[index] : !datas.used[index])) : datas.param
}
/** 保存文件 */
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
