# TokHive

**Tok(en)Hive** 是一个开放的 **AI Token 市场**，旨在连接两类用户：

* **Provider**：AI 订阅额度存在大量闲置，希望将剩余额度变现的用户；
* **Consumer**：希望在保证模型质量和服务真实性的前提下，以更低成本使用 AI 的用户。

TokHive 通过自动化的供需撮合和请求调度机制，让闲置的 AI 订阅额度能够重新进入市场流通。

对于 Provider，未使用的订阅额度可以转化为收益；对于 AI 用户，则可以用更低的价格获得**真实、可验证的原厂模型 Token**。

---

## 为什么需要 TokHive

随着 AI 技术快速发展，越来越多的开发者、企业和个人开始通过 AI 提升工作效率。

与此同时，AI 使用成本也在快速增长。一方面，高性能模型需要消耗大量算力；另一方面，新一代模型能力不断增强，Token 价格也持续提高。对于按量付费用户而言，一个复杂的编程、研究或 Agent 任务，可能就需要消耗数美元甚至数十美元。

而目前主流 AI 厂商普遍同时提供另一种收费模式：**AI 订阅**。

订阅模式通常具有以下几个特点：

1. **预付费 + 固定额度**

   用户通常按月支付固定费用，并获得一定周期内的模型使用额度。

2. **实际 Token 单价更低**

   对于能够充分使用订阅额度的用户而言，折算后的 Token 成本通常明显低于 API 按量计费。

3. **高峰期不足，闲置期浪费**

   工作繁忙时，用户可能很快耗尽额度；但在夜间、周末、节假日或工作空闲期，大量订阅额度又无法得到充分利用。

对于大多数用户而言，很难做到全天候持续使用 AI，因此订阅额度天然存在大量闲置。

TokHive 希望解决的，就是这个**AI 算力资源在时间和用户之间分布不均衡的问题**。

通过开放 AI Token 市场，TokHive 自动连接拥有闲置额度的 Provider 与存在 Token 需求的 Consumer，让原本无法利用的订阅额度重新产生价值。

与此同时，TokHive 会通过安全隔离、可信执行和 Web Proof 等技术，尽可能保障 Provider 的账号凭证安全，以及 Consumer 的请求数据和服务真实性。

---

## 闲置 Token 变现

拥有闲置 AI 订阅额度的用户，可以安装 TokHive Provider 客户端，并将自己的 AI 账号接入 TokHive 网络。

当网络中产生 AI 请求时，TokHive 会根据 Provider 的状态、模型能力、剩余额度、网络质量以及价格等因素进行自动调度。

请求完成后，平台按照实际贡献的 Token 数量进行结算。

Provider 获得的收益可以：

* 直接变现；
* 或保留在 TokHive 中，用于未来购买其他 AI Token 服务。

TokHive 的一个重要设计原则是：

> **账号凭证属于 Provider，TokHive 不应该获得其明文访问权限。**

AI 请求尽可能通过 Provider 自己的 PC、服务器或 VPC 发出，从而保留 Provider 原有的网络环境，降低因为共享服务而产生的账号风险。

对于 Access Token、OAuth Token 或 API Key 等敏感凭证，TokHive 会通过加密、权限隔离和可信执行环境进行保护。敏感信息不会直接暴露给 Consumer 或普通的 Hub 服务，而只会在经过验证的可信环境中被使用。

TokHive 的 Provider 客户端以及关键 TEE 组件将保持开源，使任何人都可以审查关键代码和安全机制。

---

## AI 用户受益

对于 AI 用户而言，接入 TokHive 非常简单。

TokHive 将提供兼容主流 AI API 生态的接口，例如：

* Chat Completions API
* Responses API
* Messages API

对于现有应用而言，通常只需要修改：

```text
base_url
API Key
```

即可将请求切换到 TokHive，无需大规模修改已有业务代码。

### 更低的 Token 成本

TokHive 的 Token 来源主要是 Provider 的闲置订阅额度。

由于订阅额度本身的折算成本通常就低于 API 按量计费，而 Provider 出售的又是原本可能被浪费的闲置额度，因此 TokHive 有机会进一步降低 Token 的市场价格。

在部分模型和供给充足的情况下，AI 用户的实际使用成本有望相比原厂 API **降低 80%～90%**。

---

## 可验证的原厂模型

价格低并不是 TokHive 唯一关注的问题。

AI 中转服务存在一个长期难以解决的信任问题：

> **用户如何确认自己购买的真的是所宣称的原厂模型？**

一个服务商完全可能宣称自己提供的是某个昂贵的旗舰模型，实际上却在后台将请求替换成更便宜的模型、开源模型，甚至完全不同的上游服务。

传统中转服务解决这个问题的方法通常只有一句：

> “请相信我们不会这样做。”

TokHive 希望采用完全不同的方式。

平台将引入 **Web Proof** 技术，对关键 AI 请求建立可验证证明，使系统能够验证：

* 请求确实发送到了指定的 AI 服务商；
* 请求的目标服务和关键参数没有被偷偷替换；
* 返回结果确实来自指定的上游服务；
* 请求和响应在关键环节没有被篡改。

换句话说：

**TokHive 不要求用户相信平台，而是尽可能让服务本身可以被验证。**

---

## 高可用服务

去中心化供给网络天然会面临 Provider 数量动态变化的问题。

例如某个时间段在线 Provider 较少，或者某个模型暂时没有足够的共享额度。

因此 TokHive 不会完全依赖 Provider 网络，而会采用**多源流动性**设计。

服务来源可以包括：

* TokHive Provider 网络；
* 官方 API 服务；
* 其他经过验证的原厂服务源。

当 Provider 网络供给充足时，系统优先使用价格更低的共享 Token；当共享供给不足时，则可以自动切换到原厂服务源。

通过这种方式，在保持低成本优势的同时，提高整体服务的稳定性和可用性。

---

## 系统架构

TokHive 主要由三个角色组成：

### Consumer

AI Token 的使用者。

Consumer 通过标准 AI API 接入 TokHive，无需感知底层请求究竟由哪个 Provider 执行。

### Hub

TokHive 的中心调度服务。

主要负责：

* Provider 状态管理；
* 请求路由；
* 模型匹配；
* 鉴权；
* 用量统计；
* 计费与结算；
* Provider 与 Consumer 的连接管理。

Hub 负责协调网络，但按照 TokHive 的安全设计，**不应该获得 Provider 敏感凭证的明文权限**。

### Provider

AI 额度的贡献者。

Provider 运行 TokHive 客户端，通过自己的 AI 订阅账号执行被分配的请求，并根据实际贡献获得收益。

![TokHive Architecture](./tokenhive_architecture_en_v3.png)

---

## 平台优势

TokHive 的核心优势可以概括为三个方面。

### 1. 可验证的原厂模型服务

TokHive 将通过 [Web Proof 技术](./web-proof.md)，验证 AI 请求确实由指定的上游模型服务执行。

这解决了 AI 中转市场一个非常核心的问题：

**用户购买的是“某个模型的名字”，还是货真价实的原厂模型服务？**

TokHive 希望将这种信任从平台承诺转化为**可验证的技术证明**。

### 2. 极具竞争力的 Token 价格

TokHive 不是简单地采购 API Token 后加价转售，而是通过重新利用原本会被浪费的订阅额度来获得 Token 供给。

因此其成本结构天然不同于传统 API 中转服务。

随着 Provider 网络规模扩大，TokHive 有机会提供比普通 API 中转服务，甚至部分“订阅转 API”服务更具竞争力的价格。

### 3. Provider 账号安全

Provider 的账号和凭证始终是整个系统中最敏感的资产之一。

TokHive 将通过：

* Provider 本地请求出口；
* 敏感凭证隔离；
* 加密传输；
* TEE 可信执行环境；
* Remote Attestation；
* 开源客户端与关键可信代码；

尽可能减少 Consumer、Hub 或其他第三方接触 Provider 凭证的机会，从架构层面降低账号泄露和滥用风险。

### 4. 用户数据隐私

可选的端到端加密（End-to-End Encryption）方案，确保用户请求数据在传输和处理过程中的隐私安全。即是是 Hive 平台也看不到用户的 prompt 数据.

---

## 路线图

### Phase 1：基础设施

建立 TokHive 的基础网络，包括：

* Hub 中心调度服务；
* Provider 客户端；
* Provider 连接池；
* AI 请求路由；
* API 鉴权；
* Token 用量统计；
* 计费与结算系统。

完成 Provider → Hub → Consumer 的基础服务闭环。

### Phase 2：安全与可验证服务

引入 Web Proof、TEE 和 Remote Attestation 等安全机制。

重点解决：

* Provider 凭证保护；
* 上游 AI 服务真实性验证；
* 模型替换检测；
* 请求篡改检测；
* Consumer 对服务结果的可验证性。

逐步实现 **Verifiable AI Token Service**。

### Phase 3：多模型与多服务源

扩展 TokHive 支持的 AI 服务生态，例如：

* OpenAI
* Anthropic
* Google
* Kimi
* 其他主流 AI 服务商

同时建设 Provider Network + 官方 API 等多种 Token 流动性来源，提高平台整体的模型覆盖率、稳定性和可用性。

最终，TokHive 希望构建一个开放、高效、低成本，并且**可验证的 AI Token 市场**：

> **让闲置 Token 产生价值，让真实的原厂 Token 更便宜。**
