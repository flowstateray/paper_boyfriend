# 纸片人男友项目经验教训总结

## 目录

1. [Cloudflare Turnstile 人机验证问题](#cloudflare-turnstile-人机验证问题)
2. [Cloudflare R2 图像存储配置问题](#cloudflare-r2-图像存储配置问题)
3. [环境变量配置最佳实践](#环境变量配置最佳实践)
4. [部署与调试流程](#部署与调试流程)

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

## 总结

### 今天的核心教训

1. **使用正确的密钥类型**：R2 需要专用的 32 位 Access Key，不是 Cloudflare API Token
2. **环境变量需要双向同步**：本地 `.env.local` 和 Vercel 控制台都需要配置
3. **健康检查是第一道防线**：部署后立即验证，避免问题扩散
4. **错误信息是最好的老师**：仔细阅读错误日志，通常会直接指出问题所在

### 预防措施

1. 在项目中维护一份完整的环境变量配置清单
2. 添加部署后自动验证脚本
3. 在 R2 配置变更时，使用健康检查端点确认配置正确
4. 定期核对本地和云端环境变量的一致性

---

*最后更新：2026年7月5日*
