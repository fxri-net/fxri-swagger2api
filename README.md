# @fxri/swagger2api

基于 swagger-typescript-api，将 Swagger 文档自动转为 TypeScript 格式的 API 文件

## ✨ 特性

- 🚀 **快速生成** - 从 Swagger JSON 快速生成 TypeScript 接口代码
- 📁 **特性区别** - 利用现有参数拼接了新的 operationId 字段，避免了重名接口会出现【_n】后缀的情况，
- 📝 **拼接规则** - 将接口地址与请求方法拼接作为唯一ID，将不带【{.+}】参数的【get】改为【query】作区分，然后移除【{.+}】参数，并移除地址的第一个参数
- 🔧 **CLI 工具** - 更多参数可查看 swagger-typescript-api 官方文档

## 📦 安装

```bash
# 全局安装
pnpm install -g @fxri/swagger2api

# 项目依赖
pnpm install @fxri/swagger2api
```

## 🚀 快速开始

### 1. 生成接口代码

```bash
npx @fxri/swagger2api
```

### 2. 配置文件说明

工具在脚本执行目录生成配置文件，作为生成接口时的默认参数，生成代码结束后，如果参数有改动，则会更新配置文件：

```json
{
    "url": "https://example.com/v3/api-docs",
    "output": "./src/api",
    "name": "index"
}
```

## ⚙️ 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | string | - | Swagger JSON 文件路径或 URL |
| `output` | string | `'./src/api'` | 生成代码的输出目录 |
| `name` | string | `'index'` | 接口文件名称，后缀为ts |
| `config` | string | `'.swaggerrc'` | 配置文件 |

## 🔧 CLI 命令

```bash
# 生成接口代码
npx @fxri/swagger2api [--config <path>]
```

## 📝 PNPM 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "api": "@fxri/swagger2api",
  }
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 版权信息

作者：唐启云 <tqy@fxri.net>

版权：Copyright © 2025 方弦研究所. All rights reserved.

网站：[方弦研究信息网](https://fxri.net:444/)

协议：MIT License