import fs from "node:fs"
import path from "node:path"
/** 获取参数 */
export function getParam(name: string | string[]) {
  !Array.isArray(name) && (name = [name])
  const index = process.argv.findIndex((item) => name.includes(item))
  return index >= 0 ? process.argv[index + 1] : undefined
}
/** 保存文件 */
export function saveFile(file, data) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(file, data)
}
