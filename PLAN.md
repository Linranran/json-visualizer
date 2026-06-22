# JSON 可视化网页实现方案

## 目标

实现一个纯前端 JSON 可视化工具，支持 JSON 格式化、压缩、转义、去转义、树形查看、搜索、展开/折叠和复制，作为本地静态页面即可运行。

## 功能范围

第一版包含：

- JSON 格式化
- JSON 压缩
- JSON 校验与错误提示
- JSON 去转义，支持多层转义字符串
- JSON 转义，便于嵌入字符串字段或日志
- 格式化文本结果展示
- 树形结构可视化
- 展开全部 / 折叠全部
- key/value 搜索与命中高亮
- 复制结果
- 清空输入与结果
- 输入字符数、输出字符数、JSON 类型、节点数量统计

暂不包含：

- Monaco / CodeMirror 编辑器
- JSON Schema 校验
- jq 查询语法
- 文件上传下载
- 在线分享链接
- 多 Tab 历史记录

## 页面结构

```text
┌─────────────────────────────────────────────────────────────┐
│ 标题、说明、状态统计                                         │
├─────────────────────────────────────────────────────────────┤
│ 工具栏：格式化 压缩 去转义 转义 展开 折叠 复制 清空 搜索       │
├───────────────────────────────┬─────────────────────────────┤
│ JSON 输入区                    │ 输出区                      │
│ textarea                       │ Tab: 格式化文本 / 树形视图   │
└───────────────────────────────┴─────────────────────────────┘
```

## 技术方案

使用纯静态资源：

- `index.html`：页面结构
- `styles.css`：布局、主题、树形样式、错误提示
- `script.js`：JSON 处理逻辑和交互

不引入第三方依赖，降低运行和部署成本。

## 核心流程

```text
用户输入
  ↓
点击操作按钮
  ↓
解析 / 格式化 / 压缩 / 去转义 / 转义
  ↓
更新文本输出
  ↓
如果结果是对象或数组，渲染树形视图
  ↓
更新统计、错误状态、搜索高亮
```

## 去转义策略

对输入做多轮 `JSON.parse`：

1. 初始值是输入字符串。
2. 如果当前值是字符串，尝试继续 `JSON.parse`。
3. 如果解析结果变成对象或数组，停止并格式化输出。
4. 如果解析失败，返回当前字符串。
5. 最多解析 5 层，避免异常输入造成循环。

## 树形视图

树节点展示：

- object 显示字段数：`object {5}`
- array 显示长度：`array [10]`
- string / number / boolean / null 使用不同颜色
- 可展开和收起对象、数组节点
- 搜索命中时高亮节点，并自动展开父节点

## 验证用例

### 普通对象

```json
{"name":"张三","age":18}
```

### 数组

```json
[{"id":1},{"id":2}]
```

### 被转义 JSON

```json
"{\"name\":\"张三\",\"age\":18}"
```

### 多层转义 JSON

```json
"\"{\\\"name\\\":\\\"张三\\\"}\""
```

### 非法 JSON

```json
{"name":"张三",}
```

### Unicode 和中文

```json
{"text":"你好","unicode":"你好"}
```

## 试水上线计划：.com 域名 + Cloudflare Pages

### 目标

用最低成本把当前 JSON 可视化工具上线为一个可公开访问的静态网站，先验证访问、收录和搜索流量，不建设后端服务。

### 推荐方案

```text
.com 域名
+ GitHub 仓库
+ Cloudflare Pages 静态托管
+ Cloudflare 免费 HTTPS / CDN
```

当前工具是纯前端实现，JSON 处理都在用户浏览器内完成，不需要服务器、数据库或后端 API。

### 你需要完成的事情

#### 1. 准备域名

- 注册一个 `.com` 域名。
- 优先选择短、好拼、无横杠、含 `json` / `tool` / `dev` / `data` 关键词的名称。
- 购买前检查续费价格，不只看首年优惠价。
- 购买前简单搜索域名历史，避免买到被滥用过的域名。

建议注册商：

- Cloudflare Registrar：适合直接托管到 Cloudflare，价格透明。
- Namecheap / Porkbun / Spaceship：适合海外注册，管理灵活。
- 阿里云 / 腾讯云：适合未来做国内备案和国内服务器。

试水阶段建议优先：Cloudflare Registrar 或其他可方便接入 Cloudflare DNS 的注册商。

#### 2. 准备代码仓库

- 注册或使用已有 GitHub 账号。
- 创建仓库，例如：`json-visualizer`。
- 上传上线所需文件：

```text
index.html
styles.css
script.js
```

- `PLAN.md` 可以保留在仓库中作为项目说明。
- `.claude/launch.json` 只用于本地预览，不需要上线。

#### 3. 接入 Cloudflare Pages

- 注册或登录 Cloudflare。
- 进入 Pages，选择连接 GitHub 仓库。
- 选择当前项目仓库。
- 构建配置：

```text
Framework preset: None
Build command: 留空
Output directory: / 或留空，按 Cloudflare Pages 页面提示填写
```

- 部署完成后，Cloudflare 会生成一个临时域名，例如：

```text
项目名.pages.dev
```

先用这个临时域名确认页面能正常访问。

#### 4. 绑定自定义域名

- 在 Cloudflare Pages 项目中添加 Custom Domain。
- 输入购买的 `.com` 域名或子域名，例如：

```text
example.com
www.example.com
```

- 按 Cloudflare 提示配置 DNS。
- 如果域名 DNS 已托管在 Cloudflare，通常会自动生成记录。
- 等待 HTTPS 证书签发完成后，用浏览器访问域名验证。

#### 5. 上线前补充基础 SEO 文件

正式提交收录前建议增加：

```text
robots.txt
sitemap.xml
favicon.ico 或 favicon.svg
```

页面内建议补充：

- 更明确的 `title`
- `meta description`
- `meta keywords`
- Open Graph 信息
- 页面正文中的功能说明
- 常见问题 FAQ
- 隐私说明：强调 JSON 数据只在浏览器本地处理，不上传服务器

#### 6. 提交搜索引擎收录

如果要验证自然搜索流量，需要提交：

- Google Search Console
- 百度搜索资源平台
- Bing Webmaster Tools

提交内容：

- 站点域名
- `sitemap.xml`
- 首页 URL
- JSON 工具页 URL

#### 7. 后续观测指标

试水阶段重点看：

- 是否被搜索引擎收录
- 关键词是否有展现
- 每日访问量
- 用户停留时间
- 常用入口关键词
- 哪些功能按钮使用最多

如果要统计访问，可以后续接入：

- Cloudflare Web Analytics
- Google Analytics
- 百度统计

第一阶段建议先用 Cloudflare Web Analytics，配置简单且不需要复杂后端。

### 成本预估

```text
域名：约 60～100 元/年，取决于注册商和后缀价格
Cloudflare Pages：免费额度足够试水
HTTPS/CDN：Cloudflare 免费提供
服务器：不需要
数据库：不需要
```

### 上线验收清单

- [ ] `.com` 域名已购买
- [ ] GitHub 仓库已创建
- [ ] 静态文件已上传
- [ ] Cloudflare Pages 部署成功
- [ ] `pages.dev` 临时域名可访问
- [ ] 自定义域名已绑定
- [ ] HTTPS 可正常访问
- [ ] JSON 格式化功能正常
- [ ] 去转义功能正常
- [ ] 树形视图功能正常
- [ ] 移动端页面可用
- [ ] `robots.txt` 已添加
- [ ] `sitemap.xml` 已添加
- [ ] 隐私说明已添加
- [ ] 搜索引擎站长平台已提交

### 暂不投入的事项

试水阶段暂不做：

- 后端服务
- 用户登录
- 云端保存
- 会员系统
- 广告系统
- 数据库
- 国内服务器备案

等页面有稳定访问后，再考虑广告、更多工具页和开发者工具矩阵。
