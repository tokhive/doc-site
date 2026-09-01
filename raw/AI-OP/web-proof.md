# Web-Proof 技术

`Web Proof` 是一类用于证明 Web 数据真实性的技术统称。它允许用户在访问普通 HTTPS 网站或 API 的同时，生成一份可由第三方独立验证的证明，用来证明某些数据**确实来自指定的网站或服务端，并且在传输过程中未被篡改**。

这类技术通常也被称为 `zkTLS`。其一个典型能力是：Prover 可以证明自己从某个网站获得了特定数据，而无需向验证者披露完整的原始数据。

这一技术非常适合解决 AI 中转服务中长期存在的一个核心问题：

> **上游模型来源不透明，用户难以验证实际调用的模型是否与服务商宣称的一致。**

对于 TokHive 而言，Web Proof 尤其重要。TokHive 是一个开放的 Provider 网络，模型服务由不同贡献者提供，因此相比传统中心化服务，更需要解决 Provider 替换上游服务、使用低价模型冒充高价模型等作弊问题。

因此，TokHive 从最初的架构设计阶段就将 **Web-Proof 验证机制**作为核心组件之一。

---

## Web Proof 技术简介

Web Proof 最早在 Web3、Oracle 和可验证数据等领域得到广泛研究和应用。

目前主流实现大致可以分为三种技术路线：

| 模式                 | 基本原理                                            | 性能 | 信任模型                          |
| ------------------ | ----------------------------------------------- | -: | ----------------------------- |
| **MPC-TLS**        | Client 与 Notary 通过 MPC 等密码学协议共同参与 TLS 会话        | 较慢 | 主要依赖密码学安全假设                   |
| **Proxy / Notary** | 引入位于 TLS 通信路径中的 Notary，对 TLS transcript 进行验证或证明 | 较快 | 需要额外的网络路径与 Notary 假设          |
| **TEE**            | 在可信执行环境中完成 TLS 请求、验证和证明生成                       | 最快 | 信任硬件 TEE 与 Remote Attestation |

三种方案本质上是在 **性能、信任假设和密码学强度**之间进行不同取舍。

---

## TokHive 的选择

TokHive 采用 **TEE（Trusted Execution Environment，可信执行环境）**作为 Web-Proof 的主要实现方案。

主要原因包括：

* **性能优势**

  与 MPC-TLS 相比，TEE 不需要对 TLS 加解密过程执行大量 MPC 或零知识计算，可以接近普通 HTTPS 请求的性能，更适合 AI Streaming、SSE 和大规模 Token 请求场景。

* **安全隔离**

  TLS 密钥、Provider 的 API Key / OAuth Token，以及关键验证逻辑都可以运行在受硬件保护的可信环境中。

  即使 Host OS、Hypervisor 或普通应用进程被攻击，也无法直接读取 TEE 内部受保护的数据。

* **可验证性**

  TEE 支持 **Remote Attestation**。

  第三方可以验证：

  * 当前运行的是否是预期的 TEE 环境；
  * 执行的是否是指定版本的 TokHive 代码；
  * 证明是否由真实可信的 TEE 实例生成。

* **成本效率**

  TEE 不需要每个 TLS 请求都进行复杂的 MPC 或 ZK 运算，也不需要额外的在线 Notary 共同参与 TLS 密钥计算，因此更加适合高并发、长连接和 Streaming AI 请求。

---

## 核心原理

TokHive 的 Web-Proof 机制主要基于：

**TLS + Trusted Execution Environment + Remote Attestation + Digital Signature**

核心思想可以概括为：

> **让经过 Remote Attestation 验证的可信程序在 TEE 中执行真实的 HTTPS 请求，并由 TEE 对请求和响应的关键数据生成可验证证明。**

典型流程如下：

1. TokHive 的可信程序运行在 TEE 中；
2. 验证者通过 Remote Attestation 确认该 TEE 正在运行预期版本的 TokHive 代码；
3. TEE 内部建立到目标 AI Provider 的 TLS 连接；
4. Provider 的 API Key / OAuth Token 仅在 TEE 内部被使用；
5. TEE 验证 TLS 连接的目标域名、证书以及请求内容；
6. AI Provider 返回响应；
7. TEE 根据请求、响应以及 TLS 会话信息生成 Proof；
8. TEE 使用受保护的密钥对 Proof 进行数字签名；
9. Consumer 或第三方验证者可以验证该证明。

因此，验证者可以确认：

> **这次请求确实发送到了指定的 AI Provider，并且返回结果来自该服务，而不是由 TokHive Provider 在本地伪造或替换。**

同时，Provider 的敏感凭证始终被限制在可信执行环境内部。

![TEE TLS Architecture](./tee-tls.png)

关于 TEE-TLS 的详细技术原理，请参考：

[TEE-zkTLS 技术原理](./TEE-zkTLS-Technical-Principles-zh.md)

---

## FAQs

### 1. Web-Proof 能保护用户 Prompt 的隐私吗？

这取决于采用哪一种 Web-Proof 技术路线。

**MPC-TLS** 可以实现更强的密码学隐私保护。例如，可以让不同参与方在无法直接获得完整 TLS 明文的情况下共同完成验证。

但这种方案需要大量 MPC 计算和网络交互，性能开销较高，目前并不适合 TokHive 所面向的大规模 AI Streaming 请求场景。

TokHive 当前采用的 **TEE Web-Proof** 方案主要解决两个问题：

1. **验证模型服务的真实性**
2. **保护 Provider 的 API Key / OAuth Token**

它并不等价于 Consumer 到 AI Provider 之间的密码学意义上的端到端隐私系统。

因此，TokHive 当前 Web-Proof 的核心目标并不是隐藏用户 Prompt，而是：

> **在尽可能接近普通 HTTPS 性能的前提下，实现 Provider 凭证保护和 AI 上游服务真实性验证。**
