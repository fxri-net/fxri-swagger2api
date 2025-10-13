import { generateApi } from "swagger-typescript-api"
/** 定义集合 */
export type Defines = {
  /** 配置集合 */
  confs: {
    /** 文件集合 */
    files: string[]
    /** 文件 */
    file: string
    /** 参数 */
    param: { url?: string; output?: string; name?: string }
  }
  /** 数据集合 */
  datas: {
    /** 用户目录 */
    home: string
    /** 文档 */
    docFile: string
    /** 配置 */
    config: Parameters<typeof generateApi>["0"]
    /** 参数 */
    param: {
      /** 指定配置文件 */
      config: string
      /** 扫描全部配置文件 */
      configScan: boolean
      /** 加载全部配置文件 */
      configAll: boolean
      /** 快速模式 */
      quick: boolean
      /** 转换无{.+}get为query */
      convertGet: boolean
      /** 移除{.+}参数 */
      removeParam: boolean
      /** 移除前缀索引 */
      removePrefixIndex: string
      /** 移除使用--js参数时生成的d.ts文件 */
      removeDts: boolean
      /** 提取响应，将AxiosResponse返回值转移到raw字段，根部字段自己定义 */
      extractResponseRaw: boolean
    }
    /** 枚举 */
    enum: { [key: string]: number }
  }
  /** 数据 */
  data: { paths: { [key: string]: { [key: string]: any } }; [key: string]: any }
}
