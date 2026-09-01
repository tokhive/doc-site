# Web-Proof 技术

`Web Proof` 是一类技术的统称，用来在请求普通 HTTPS 网站/API 返回的数据时，同时生成第三方可以验证的证明. 很多时候这项技术也被叫做 `zkTLS`. 这项技术最大的特点是 Prover 可以在不暴露原始数据的前提下, 向第三方证明它从某网站获取了特定的数据。

这项技术正好适合来解决大模型中转站存在的一大问题: 上游模型来源不透明、难以验证实际调用模型是否与宣称一致的问题。

Web Proof 技术对于 TokHive 平台更加重要, 因为 TokHive 是一个去中心化的平台, Provider 由贡献者提供, 模型服务以次充好的可能性更大. 因此我们从初始架构设计就引入了 Web-Proof 验证机制。

## Web Proof 技术简介

Web Proof 是一种加密证明技术, 最早来源于 Web3 行业. 目前主要有三种技术路线:

| 模式          | 原理                                      | 性能 | 信任模型                   |
| ----------- | --------------------------------------- | -: | ---------------------- |
| **MPC-TLS** | Client + Notary 共同参与 TLS 密钥计算           | 较慢 | 密码学保证最强                |
| **Proxy**   | Notary 位于 TLS 网络路径上，结合 ZK 验证 transcript |  快 | 增加网络路径假设               |
| **TEE**     | TLS 会话或验证逻辑在可信硬件中执行                     | 最快 | 信任 CPU/云厂商 Attestation |

## TokHive 的选择

TokHive 采用 **TEE (Trusted Execution Environment)** 模式作为 Web-Proof 的实现方案,主要原因包括:

- **性能优势**: 相比 MPC-TLS 和 Proxy 模式, TEE 能够在本地硬件中高效执行 TLS 握手和证明生成, 减少网络延迟
- **安全性**: 通过硬件根的信任链(如 AMD SEV, Intel SGX, ARM TrustZone)确保密钥和证明数据不被暴露
- **可验证性**: 支持远程 attestation, 第三方可以验证证明是由受保护的硬件环境生成的
- **成本效率**: 避免了需要额外 Notary 服务器或复杂密码学计算的成本

## 核心原理

核心技术实现基于 **TLS + Trusted Execution Environment (TEE) + Remote Attestation + 数字签名**. 核心原理是: **让经过 Remote Attestation 验证的可信程序在 TEE 内执行 TLS 请求，并让 TEE 对 TLS 会话结果签名。**. 整个 TLS 会话握手和终止都在 TEE 内部完成, 外部只能看到加密后的数据, 无法看到原文, 也无法对数据进行篡改, 并且 TEE 会给出数字签名, 来验证请求.

![tee-tls](./tee-tls.png)

关于 TEE-TLS 的详细说明见 [TEE-zkTLS 技术原理](./TEE-zkTLS-Technical-Principles-zh.md).

### FAQs

1. Web-Proof 能实现用户 prompt 的隐私保护么?

MPC-TLS 有隐私保护的能力, 但性能非常差, 不适合大规模生产环境. 目前 TokHive 选择的 TEE 模式, 虽然无法提供端到端的隐私保护, 但在保证模型来源真实性的同时, 充分保护了 Provider 的 API Key 或 Oauth Token.