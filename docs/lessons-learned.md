# 纸片人男友项目经验教训总结

## 目录

1. [项目概述与架构](#项目概述与架构)
2. [Cloudflare Turnstile 人机验证问题](#cloudflare-turnstile-人机验证问题)
3. [Cloudflare R2 图像存储配置问题](#cloudflare-r2-图像存储配置问题)
4. [Edge TTS 语音合成问题](#edge-tts-语音合成问题)
5. [数据库连接与字段问题](#数据库连接与字段问题)
6. [前端渲染与数据同步问题](#前端渲染与数据同步问题)
7. [部署平台选择问题](#部署平台选择问题)
8. [环境变量配置最佳实践](#环境变量配置最佳实践)
9. [部署与调试流程](#部署与调试流程)
10. [安全检查清单](#安全检查清单)

---

## 项目概述与架构

### 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 16 (App Router) | React + TypeScript |
| 样式 | Tailwind CSS 3 | 原子化 CSS |
| 数据库 | Neon (PostgreSQL) | 海外云数据库 |
| ORM | Prisma | 数据库建模与迁移 |
| 语音合成 | Edge TTS (WebSocket) | 微软免费 TTS 服务 |
| 图像生成 | Pollinations AI | 免费图像生成 API |
| 图像存储 | Cloudflare R2 | S3 兼容对象存储 |
| 部署 | Vercel | Next.js 官方部署平台 |

### 网站页面结构

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `/` | 角色选择界面 |
| 聊天界面 | `/` (选择角色后) | 与虚拟男友对话 |
| 登录 | `/login` | 用户登录 |
| 注册 | `/register` | 用户注册 |

### API 接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/chat` | POST | 发送消息，调用 LLM |
| `/api/chat/save` | POST | 保存聊天记录到数据库 |
| `/api/chat/load` | POST | 加载聊天记录 |
| `/api/image` | POST | 生成图片并上传到 R2 |
| `/api/tts` | POST | 生成语音音频 |
| `/api/auth/login` | POST | 用户登录验证 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/r2-health` | GET | R2 存储健康检查 |

---

## Cloudflare Turnstile 人机验证问题

### 问题背景

在用户注册页面集成 Cloudflare Turnstile 人机验证时遇到了一系列问题，最终决定暂时移除该模块。

### 遇到的问题

1. **Invalid site key 错误 (error 400020)**
   - 原因：测试密钥 `1x00000000000000000000AA` 仅在 localhost 生效
   - 部署到 vercel.app 域名时需要配置真实密钥并添加允许的域名

2. **Content Security Policy 阻止 'eval'**
   - Turnstile 脚本使用 eval，与项目的 CSP 策略冲突

3. **组件渲染问题**
   - react-turnstile 库与 Next.js App Router 存在兼容性问题

4. **资源加载 400 错误**
   - 环境变量中的 site key 和 secret key 位数不一致（6个A vs 7个A）

### 解决方案

暂时移除 Turnstile 模块，改为仅验证必填字段和邮箱唯一性：
- 移除 `app/register/page.tsx` 中的 Turnstile 脚本和组件
- 移除 `app/api/auth/register/route.ts` 中的服务端验证逻辑

### 经验教训

- Turnstile 测试密钥仅在 localhost 有效，生产环境需要真实密钥
- 需要在 Cloudflare 控制台配置允许的域名列表
- 环境变量需要仔细核对，位数不一致会导致验证失败
- CSP 策略需要为 Turnstile 脚本添加例外

---

## Cloudflare R2 图像存储配置问题

### 问题背景

图像生成后无法上传到 R2 存储桶，图片来源始终显示为"临时链接"，R2 存储桶为空但操作计数非零。

### 遇到的问题

#### 问题一：本地网络 DNS 解析失败

```
getaddrinfo ENOTFOUND xxx.r2.cloudflarestorage.com
```

- 原因：本地网络环境无法解析 R2 API 端点
- 影响：本地测试时 R2 上传失败，回退到 Pollinations 临时链接
- 解决：部署到 Vercel 云端环境，利用其网络访问 R2 API

#### 问题二：使用了错误类型的密钥（致命错误）

```
Credential access key has length 53, should be 32
```

- 原因：使用了 Cloudflare API Token（`cfut_xxx` 格式，53字符），而非 R2 专用 Access Key（32字符十六进制）
- 影响：S3 客户端认证失败，R2 连接一直无法建立
- 解决：从 Cloudflare R2 控制台生成正确的 32 位 Access Key

#### 问题三：Vercel 环境变量缺失

- 原因：本地 `.env.local` 配置正确，但 Vercel 环境变量未同步
- 影响：部署后所有 R2 相关功能失效
- 解决：通过 Vercel CLI 或控制台手动配置

#### 问题四：前端-后端字段名不匹配

- 原因：后端返回 `imageUrl`，前端期望 `imageUri`
- 影响：图片无法显示，出现缺损图标
- 解决：修改后端返回字段名为 `imageUri`

### 解决方案

从 Cloudflare R2 控制台生成正确的认证密钥：

1. 登录 Cloudflare 控制台 → R2 → 选择存储桶
2. 点击 Settings → R2 API Tokens → Create API Token
3. 选择 Object Read & Write 权限
4. 记录生成的 Access Key ID 和 Secret Access Key

### 正确的 R2 配置清单

| 变量名 | 值 | 来源 |
|--------|-----|------|
| R2_ACCESS_KEY_ID | 32字符十六进制 | R2 存储桶 → Settings → R2 API Tokens |
| R2_SECRET_ACCESS_KEY | 44字符 | 同上 |
| R2_ENDPOINT | `https://xxx.r2.cloudflarestorage.com` | R2 存储桶 → Settings → Endpoints |
| R2_BUCKET_NAME | 存储桶名称 | 存储桶列表 |
| R2_PUBLIC_URL | `https://pub-xxx.r2.dev` | 存储桶 → Settings → Public Access |

### 经验教训

**致命错误（导致5小时浪费）：**

1. **混淆了 Cloudflare API Token 和 R2 Access Key**
   - Cloudflare API Token 是管理整个 Cloudflare 账户的令牌（`cfut_xxx` 格式）
   - R2 Access Key 是专门用于 S3 兼容 API 的 32 位密钥
   - 两者完全不同，不能混用

2. **本地 `.env.local` 不会自动同步到 Vercel**
   - 本地配置的正确变量在 Vercel 上不存在
   - 需要通过 CLI 或 Vercel 控制台单独设置

3. **没有使用健康检查端点早发现问题**
   - `/api/r2-health` 端点可以快速诊断配置问题
   - 部署后应立即调用验证

**重要教训：**

4. **环境变量更新后必须重新部署**
   - Vercel 在构建时读取环境变量
   - 更新变量后需要 `vercel --prod` 触发重新构建

5. **错误信息要仔细读**
   - `getaddrinfo ENOTFOUND` → Endpoint 格式不对
   - `Credential access key has length 53, should be 32` → 密钥长度错误

6. **不要假设配置正确**
   - 每次部署后都应该调用 `/api/r2-health` 验证连接状态

7. **前端后端字段名必须一致**
   - 后端返回 `imageUri`，前端才能正确解析

---

## Edge TTS 语音合成问题

### 问题背景

语音合成功能需要可靠的 TTS 服务，最初尝试使用火山引擎 TTS，后切换到 Edge TTS。

### 遇到的问题

#### 问题一：火山引擎 TTS 500 错误

- 原因：网络环境解析到内网 IP（10.8.6.227），无法访问外部服务
- 影响：语音合成完全失败
- 解决：切换到 Edge TTS WebSocket 协议

#### 问题二：Edge TTS REST 端点已废弃

- 原因：`https://edge.microsoft.com/tts` 需要 `Sec-MS-GEC` token 认证，REST 端点无法生成
- 影响：语音合成返回 403 错误
- 解决：使用 WebSocket 协议 `speech.platform.bing.com`

#### 问题三：WebSocket 握手失败

- 原因：缺少必要的请求头（User-Agent、Origin、Cookie）
- 影响：WebSocket 连接被拒绝
- 解决：严格对齐 edge-tts 源码中的请求头配置

### 经验教训

- TTS 服务选择需要考虑网络环境的可达性
- 废弃的 API 端点需要及时切换到最新协议
- WebSocket 连接需要完整的请求头配置，缺失会导致 403 错误
- 需要实现 TTS 优先级回退链：Edge TTS → 浏览器 Web Speech API

---

## 数据库连接与字段问题

### 问题背景

聊天记录需要持久化存储，使用 Neon PostgreSQL 数据库。

### 遇到的问题

#### 问题一：数据库连接超时

```
Error: Neon database connection timeout
```

- 原因：Neon 数据库位于海外，国内网络延迟高
- 影响：聊天记录保存失败（`/api/chat/save` 返回 500 错误）
- 解决：暂无完美解决方案，建议考虑更换国内数据库服务

#### 问题二：数据库字段缺失

- 原因：Prisma Schema 中缺少 `imagePrompt` 和 `imageSource` 字段
- 影响：图片提示词和来源信息无法持久化，聊天记录不完整
- 解决：添加缺失字段并运行 Prisma 迁移

#### 问题三：Prisma 迁移失败

- 原因：环境变量 `DATABASE_URL` 未加载
- 影响：数据库 Schema 更新失败
- 解决：使用 PowerShell 直接设置环境变量后执行迁移

### 经验教训

- 海外数据库在国内网络环境下可能不稳定，需考虑延迟问题
- 数据库 Schema 需要与前端 TypeScript 类型保持同步
- Prisma 迁移需要确保环境变量正确加载
- 建议定期检查数据库字段与前端类型定义的一致性

---

## 前端渲染与数据同步问题

### 问题背景

聊天界面需要实时显示消息、图片和语音，涉及复杂的状态管理。

### 遇到的问题

#### 问题一：React 无限渲染

- 原因：`useCallback` 依赖项配置不当，导致组件频繁重新渲染
- 影响：界面卡顿，性能下降
- 解决：优化依赖项数组，使用 `useMemo` 缓存计算结果

#### 问题二：图片来源标签不显示

- 原因：`imageSource` 字段未传递到消息组件
- 影响：用户无法区分图片是来自 R2 存储还是临时链接
- 解决：修改 `ChatContext.tsx` 和 `MessageBubble.tsx`，正确传递和显示 `imageSource`

#### 问题三：图片标签被遮挡

- 原因：CSS z-index 层级问题
- 影响：图片来源标签被其他元素遮挡
- 解决：添加 `z-10` 样式确保标签可见

### 经验教训

- React Hooks 的依赖项需要仔细管理，避免不必要的重渲染
- 数据从后端到前端的传递路径需要完整，任何环节缺失都会导致功能异常
- CSS 层级问题需要通过 z-index 明确控制

---

## 部署平台选择问题

### 问题背景

项目最初考虑部署到 Cloudflare Pages，后确认不适合动态网站。

### 遇到的问题

#### 问题一：Cloudflare Pages 不支持动态网站

- 原因：Cloudflare Pages 主要面向静态网站，不适合包含大量 API 调用、LLM 交互的动态应用
- 影响：部署后 API 路由无法正常工作
- 解决：切换到 Vercel 部署

#### 问题二：Cloudflare Pages CLI 仅生成预览版本

- 原因：CLI 部署不会自动推广到生产环境
- 影响：生产域名无法访问新部署的版本
- 解决：需要手动在 Cloudflare 控制台点击"Promote to Production"

#### 问题三：Vercel 环境变量配置复杂

- 原因：Vercel 环境变量需要单独配置，不会从 `.env.local` 自动同步
- 影响：部署后功能因缺少配置而失效
- 解决：使用 Vercel CLI 批量配置环境变量

### 经验教训

- 动态网站（包含 API、数据库、LLM 调用）应选择 Vercel 而非 Cloudflare Pages
- Cloudflare Pages 适合静态站点或边缘计算场景
- Vercel 是 Next.js 的官方部署平台，对 Next.js 支持最佳
- 环境变量需要在部署平台单独配置

---

## 环境变量配置最佳实践

### Vercel CLI 操作命令

```bash
# 添加环境变量到 Production
vercel env add R2_ENDPOINT production --value "xxx" --yes

# 添加环境变量到 Preview
vercel env add R2_ENDPOINT preview --value "xxx" --yes --non-interactive

# 查看所有环境变量
vercel env ls

# 部署到生产环境
vercel --prod
```

### 配置验证流程

1. **部署前**：确认本地 `.env.local` 配置正确
2. **部署中**：使用 `vercel env ls` 确认 Vercel 环境变量已配置
3. **部署后**：调用 `/api/r2-health` 验证连接状态

### 完整环境变量清单

| 变量名 | 用途 | 是否敏感 |
|--------|------|----------|
| DATABASE_URL | 数据库连接字符串 | 是 |
| NEXT_PUBLIC_GLM_API_KEY | GLM API 密钥 | 是 |
| NEXT_PUBLIC_GLM_API_BASE | GLM API 地址 | 否 |
| NEXT_PUBLIC_POLLINATIONS_BASE | 图像生成 API 地址 | 否 |
| NEXT_PUBLIC_AZURE_SPEECH_KEY | Azure TTS 密钥 | 是 |
| NEXT_PUBLIC_AZURE_SPEECH_REGION | Azure 区域 | 否 |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Turnstile 站点密钥 | 否 |
| TURNSTILE_SECRET_KEY | Turnstile 密钥 | 是 |
| R2_ACCESS_KEY_ID | R2 Access Key | 是 |
| R2_SECRET_ACCESS_KEY | R2 Secret Key | 是 |
| R2_ENDPOINT | R2 API 端点 | 否 |
| R2_BUCKET_NAME | R2 存储桶名称 | 否 |
| R2_PUBLIC_URL | R2 公共访问地址 | 否 |

---

## 部署与调试流程

### 标准部署流程

```
1. 修改代码
2. git add . && git commit -m "描述" && git push origin master
3. 等待 Vercel 自动部署（或手动 vercel --prod）
4. 验证 /api/r2-health 端点
5. 在聊天界面测试图片生成功能
```

### 常用调试命令

```bash
# 检查 R2 连接状态
Invoke-RestMethod -Uri "https://your-domain.vercel.app/api/r2-health" | ConvertTo-Json

# 检查 Vercel 项目配置
vercel env ls

# 重新部署
vercel --prod
```

### 健康检查端点返回值说明

| 字段 | 含义 |
|------|------|
| `connection.status` | `connected` = 正常, `failed` = 连接失败, `unknown` = 配置不完整 |
| `config` | 各环境变量是否已配置 |
| `bucket.objectCount` | 存储桶中文件数量 |
| `publicUrl.accessible` | 公共访问 URL 是否可访问 |

---

## 安全检查清单

### .gitignore 配置

项目 `.gitignore` 文件已包含以下关键条目：

```
# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# dependencies
/node_modules

# next.js
/.next/
/out/
```

### 敏感信息保护原则

1. **绝对不提交环境变量文件到 GitHub**：`.env*` 已加入 `.gitignore`
2. **绝对不硬编码 API Key**：所有密钥都通过环境变量获取
3. **后端中间层保护**：R2 上传通过 Next.js API 路由完成，前端不直接使用密钥
4. **密码加密存储**：用户密码使用 bcryptjs 哈希后存储
5. **不导出敏感客户端**：R2 S3 客户端不导出，仅在后端使用

### 安全检查项

| 检查项 | 状态 | 说明 |
|--------|------|------|
| .env.local 是否在 .gitignore | ✅ | 已配置 |
| API Key 是否硬编码 | ✅ | 全部使用环境变量 |
| 密码是否加密存储 | ✅ | 使用 bcryptjs |
| R2 密钥是否暴露在前端 | ✅ | 通过后端 API 路由上传 |
| 数据库连接字符串是否安全 | ✅ | 通过环境变量配置 |

---

## 总结

### 核心教训

1. **使用正确的密钥类型**：R2 需要专用的 32 位 Access Key，不是 Cloudflare API Token
2. **环境变量需要双向同步**：本地 `.env.local` 和 Vercel 控制台都需要配置
3. **健康检查是第一道防线**：部署后立即验证，避免问题扩散
4. **错误信息是最好的老师**：仔细阅读错误日志，通常会直接指出问题所在
5. **动态网站选择正确的部署平台**：Vercel 是 Next.js 的最佳选择

### 预防措施

1. 在项目中维护一份完整的环境变量配置清单
2. 添加部署后自动验证脚本
3. 在 R2 配置变更时，使用健康检查端点确认配置正确
4. 定期核对本地和云端环境变量的一致性
5. 数据库 Schema 与前端类型定义保持同步
6. 敏感信息绝对不提交到 GitHub

### 待解决问题

1. **Neon 数据库连接超时**：海外数据库延迟高，建议考虑国内数据库服务
2. **Turnstile 人机验证**：需要在生产环境正确配置后重新启用

---

*最后更新：2026年7月5日*
