# TEE zkTLS 技术原理介绍

TEE zkTLS 的核心目标，是将普通 HTTPS 请求转化为**第三方可以验证的可信数据证明**。

普通 TLS 只能保证：

> Client 可以确认自己正在和真实 Server 通信，并确认收到的数据没有被篡改。

但是 Client 无法简单地把一段 HTTP Response 交给第三方，然后证明：

> “这段数据确实来自 `api.example.com`，并且没有被我修改过。”

TEE zkTLS 通过 **TLS + Trusted Execution Environment（TEE）+ Remote Attestation + 数字签名**解决这个问题。

其核心思想可以概括为：

> **让经过 Remote Attestation 验证的可信程序在 TEE 内执行 TLS 请求，并让 TEE 对 TLS 会话结果签名。**

因此第三方不需要信任用户本身，只需要信任：

**CPU/TEE 硬件信任根 + 被验证过的 TEE 程序。**

---

# 1. TEE 特性简介

TEE（Trusted Execution Environment，可信执行环境）是一块由 CPU 或 Hypervisor 提供安全隔离的执行区域。

典型实现包括：

- Intel SGX
- Intel TDX
- AMD SEV-SNP
- AWS Nitro Enclaves

以 AWS Nitro Enclaves 为例，Enclave 的 CPU 和内存与宿主机隔离，宿主机无法直接访问 Enclave 内的内存。

TEE 对 zkTLS 最重要的是三个能力。

## 1.1 隔离执行

假设：

```text
Host OS
 ├── Network
 ├── Application
 └── TEE
      ├── TLS Client
      ├── Proof Logic
      └── Signing Key
```

即使 Host OS 被控制，攻击者原则上也不能直接读取或修改：

```text
TLS session key
response plaintext
proof private key
TEE internal state
```

因此可以把 TLS 验证和证明逻辑放入一个相对可信的环境。

---

## 1.2 Measurement

TEE 启动时会对运行代码进行密码学 Measurement，例如计算：

```text
measurement = HASH(
    program
    + runtime
    + configuration
)
```

因此：

```text
正确程序：

measurement =
0x91ab83...

被修改后的程序：

measurement =
0x482f21...
```

只要代码发生变化，Measurement 通常也会变化。

Verifier 可以预先保存一个可信值：

```text
EXPECTED_MEASUREMENT
```

然后检查：

```text
measurement == EXPECTED_MEASUREMENT
```

从而确认：

> 当前 TEE 运行的确实是经过审核的 zkTLS 程序，而不是攻击者修改后的程序。

例如 Nitro Enclaves 会通过 PCR 保存 Enclave Image、Kernel、Application 等组件的 Measurement。

---

## 1.3 Remote Attestation

仅仅由程序自己声称：

```text
“我是运行在 TEE 里面的。”
```

当然没有意义。

因此 TEE 硬件提供 **Remote Attestation（远程证明）**。

TEE 可以生成类似：

```text
Attestation Report
{
    measurement
    TCB_version
    public_key
    nonce
    ...
}
```

然后由硬件信任根或厂商 Attestation Infrastructure 对其签名。

Verifier 可以通过 Intel、AMD、AWS 等平台的信任链验证这个 Report。

Intel 对 Remote Attestation 的描述就是：远程方可以确认特定软件确实运行于 SGX Enclave，并获得其软件身份和 TCB 状态。

IETF RATS 架构也将这一过程抽象成：

```text
Attester
    ↓ Evidence
Verifier
    ↓ Attestation Result
Relying Party
```



因此 TEE 的信任关系本质上是：

```text
Hardware Root of Trust
        ↓
Remote Attestation
        ↓
Measurement
        ↓
Trusted Program
        ↓
Program Output
```

---

# 2. TLS 技术简介

TLS（Transport Layer Security）是 HTTPS 的安全基础。

TLS 1.3 主要提供三个安全属性：

```text
Authentication
Confidentiality
Integrity
```

也就是：

```text
确认 Server 身份
+
防止第三方读取数据
+
防止数据被篡改
```

RFC 8446 明确定义 TLS 的主要目标包括身份认证、机密性和完整性。

一次简化的 TLS 连接可以表示为：

```text
Client                              Server

ClientHello (key_share)
       --------------------------->

                    ServerHello (key_share)
                    [ECDHE 完成，派生 Handshake Traffic Keys]

                    {EncryptedExtensions}
                    {Certificate}
                    {CertificateVerify}
                    {Finished}
       <---------------------------

验证 Server Certificate

      {Finished}
       --------------------------->

      derive Application Traffic Keys

Encrypted HTTP Request
       --------------------------->

Encrypted HTTP Response
       <---------------------------
```

注意：在 TLS 1.3 中，(EC)DHE 的密钥交换参数（`key_share`）是在 `ClientHello` / `ServerHello` 中直接携带的，握手流量密钥在 `ServerHello` 之后即可派生；此后的 `Certificate`、`CertificateVerify`、`Finished`（图中用 `{}` 表示）实际上已经是**用握手流量密钥加密**发送的，而不是明文先发再做密钥交换。这与 TLS 1.2 中 `ServerKeyExchange`/`ClientKeyExchange` 作为独立明文消息、在证书交换之后才协商密钥的流程不同，这里按 TLS 1.3 的真实顺序表示。

其中有两个步骤对 zkTLS 特别重要。

## 2.1 Server Authentication

Server 会提供：

```text
Certificate
```

Client 验证：

```text
Certificate Chain
        ↓
Trusted CA
        ↓
hostname == api.example.com
```

因此 TLS Client 可以确认：

> 当前连接的 Server 确实拥有 `api.example.com` 对应证书的私钥。

---

## 2.2 TLS Record Integrity

TLS 1.3 使用 AEAD，例如：

```text
AES-GCM
ChaCha20-Poly1305
```

保护 TLS Record。

可以抽象成：

```text
ciphertext, tag =
    AEAD_Encrypt(
        session_key,
        nonce,
        plaintext,
        associated_data
    )
```

解密时：

```text
plaintext =
    AEAD_Decrypt(
        session_key,
        nonce,
        ciphertext,
        tag,
        associated_data
    )
```

其中 `nonce` 通常由固定 IV 与 TLS Record 序号（sequence number）派生，`associated_data`（AAD）则是 TLS Record Header（type / version / length）。AAD 的意义在于：即使 Record Header 本身不加密，也会被计入完整性校验，一旦被篡改，认证 Tag 同样会校验失败。

如果攻击者修改任何 Ciphertext：

```text
AEAD verification failed
```

TLS Record 会被拒绝。

因此只要 TLS Session Key 和 TLS 验证逻辑可信：

> Response 就不能在网络中被静默修改。

TLS 1.3 明确要求 Record Layer 使用 AEAD，以同时提供加密和完整性认证。

---

# 3. TEE zkTLS 的工作原理

TEE zkTLS 的关键，就是：

> **把 TLS Client 的关键安全逻辑放进 TEE。**

典型架构：

```text
                     Internet

                        │
                        │ TLS
                        ▼

                 ┌─────────────┐
                 │ HTTPS Server│
                 │ api.xxx.com │
                 └─────────────┘
                        ▲
                        │
                encrypted TLS
                        │
┌───────────────────────┼───────────────────────┐
│ Host Machine          │                       │
│                       │                       │
│             ┌─────────┴──────────┐            │
│             │        TEE         │            │
│             │                    │            │
│             │ TLS Client         │            │
│             │ Certificate Verify │            │
│             │ HTTP Parser        │            │
│             │ Proof Generator    │            │
│             │ Signing Key        │            │
│             │                    │            │
│             └────────────────────┘            │
│                                               │
└───────────────────────────────────────────────┘
```

Host 可以负责：

```text
TCP
socket
packet forwarding
```

但安全敏感逻辑在 TEE：

```text
TLS Handshake
Certificate Verification
TLS Key Derivation
TLS Record Authentication
HTTP Request Verification
HTTP Response Processing
Proof Generation
```

这样 Host 即使是不可信的，也无法伪造一个合法 TLS Response。

---

# 4. 如何生成证明和验证

假设 User 希望证明：

```text
POST https://api.example.com/v1/query
```

返回：

```json
{
  "balance": 100
}
```

TEE 可以按照下面的流程工作。

## Step 1：Verifier 验证 TEE

TEE 首先生成一个 Key Pair：

```text
TEE_private_key
TEE_public_key
```

并要求 Attestation 把：

```text
TEE_public_key
```

绑定进去。

例如：

```text
Attestation {
    measurement: HASH(zkTLS-program)
    public_key: TEE_public_key
    nonce: verifier_nonce
}
```

Verifier 验证：

```text
Vendor Attestation Signature
        ↓
TEE Hardware
        ↓
Measurement
        ↓
TEE_public_key
```

因此建立：

```text
TEE_public_key
        │
        │ belongs to
        ▼
Trusted zkTLS Program
```

AWS Nitro Attestation Document 就支持绑定 `public_key`、`user_data` 和 `nonce` 等信息。

---

## Step 2：TEE 建立 TLS

TEE：

```text
connect(api.example.com)
```

执行 TLS Handshake，并验证：

```text
Certificate Chain
hostname
CertificateVerify
Finished
```

如果验证成功：

```text
server_identity = api.example.com
```

TEE 才继续运行。

---

## Step 3：TEE 发送 HTTP Request

例如：

```text
POST /v1/query
Host: api.example.com
Authorization: Bearer xxx

{"user":"alice"}
```

TEE 可以计算：

```text
request_hash =
    SHA256(canonical_request)
```

这样 Proof 就能够绑定：

> 到底发送了什么请求。

---

## Step 4：TEE 验证 Response

Server 返回 TLS Ciphertext。

TEE 执行：

```text
AEAD_Decrypt()
```

如果认证 Tag 正确：

```text
Response accepted
```

否则：

```text
Response rejected
```

然后得到：

```text
HTTP/1.1 200 OK

{"balance":100}
```

并计算：

```text
response_hash =
    SHA256(response)
```

---

## Step 5：生成 zkTLS Proof

TEE 构造 Statement：

```text
ProofData {
    version,

    server_name,
    server_certificate_hash,

    request_hash,
    response_hash,

    timestamp,
    verifier_nonce,

    result
}
```

然后：

```text
signature =
    Sign(
        TEE_private_key,
        HASH(ProofData)
    )
```

最终 Proof：

```text
TEE-zkTLS-Proof
{
    AttestationReport,
    ProofData,
    Signature
}
```

注意这里所谓的 **Proof** 本质上不是 SNARK/STARK，而是：

```text
Hardware Attestation
        +
Measured Trusted Code
        +
Digital Signature
        +
TLS Security
```

---

## Step 6：Verifier 验证

Verifier 收到：

```text
AttestationReport
ProofData
Signature
```

之后执行：

```text
1. Verify AttestationReport

2. Check:
   measurement == EXPECTED_MEASUREMENT

3. Extract:
   TEE_public_key

4. Verify:
   Signature(TEE_public_key, ProofData)

5. Check:
   nonce == expected_nonce

6. Check:
   timestamp is fresh

7. Check:
   server_name == api.example.com

8. Check:
   request_hash == expected_request_hash

9. Check:
   response_hash / result
```

全部通过之后，就可以接受：

```text
api.example.com

        ↓ TLS

Trusted TEE

        ↓ Signature

ProofData
```

这条信任链。

---

# 5. 如何防止作弊和篡改

TEE zkTLS 最重要的部分并不是“生成一个签名”，而是建立一条无法轻易绕过的完整信任链。

可以把主要作弊方式分别来看。

## 5.1 用户伪造 Server

攻击者可能自己运行：

```text
fake-api.example
```

然后返回想要的数据。

但是 TEE 内部会验证：

```text
Certificate Chain
+
Hostname
+
CertificateVerify
```

攻击者没有：

```text
api.example.com private key
```

因此无法通过 TLS Server Authentication。

---

## 5.2 用户修改 TLS Response

假设 Server 返回：

```json
{"balance":10}
```

攻击者希望修改成：

```json
{"balance":1000000}
```

TLS Record 有 AEAD Integrity Protection。

修改 Ciphertext 会导致：

```text
Authentication Tag Invalid
```

TEE 不会接受。

因此网络层无法直接篡改 Response。

---

## 5.3 Host 修改 TEE 内的数据

假设 Host OS 完全恶意。

它试图修改：

```text
response = 10

→

response = 1000000
```

TEE 的核心安全目标就是保护其内存和执行状态不受 Host OS 直接访问或修改。

因此 Proof Logic 必须放在 TEE 内，而不能写成：

```text
TEE
 ↓
把 plaintext 交给 Host
 ↓
Host 生成 Proof
```

否则 Host 就可以修改数据。

---

## 5.4 Host 修改 zkTLS 程序

攻击者可能修改程序：

```text
verify_tls()
```

变成：

```text
skip_verify_tls()
```

但是代码发生变化后：

```text
Measurement
```

也发生变化。

Verifier 要求：

```text
measurement
==
approved_measurement
```

因此修改后的程序无法通过 Remote Attestation。

---

## 5.5 用户自己生成一个 TEE Signing Key

攻击者也可以自己创建：

```text
fake_private_key
fake_public_key
```

然后签：

```text
balance = 1000000
```

问题在于：

```text
fake_public_key
```

没有被绑定到合法的 Remote Attestation。

Verifier 验证的是：

```text
Hardware Attestation
        │
        └── TEE_public_key
```

而不是任意 Public Key。

所以单独伪造数字签名没有意义。

---

## 5.6 Replay Attack

攻击者可能拿以前的一份合法 Proof：

```text
balance = 100
```

反复提交。

解决方式是在 Proof 中加入：

```text
nonce
timestamp
request_id
expiry
```

例如：

```text
Verifier
   │
   │ nonce = 0x83ab...
   ▼
TEE
```

TEE 必须把 nonce 包含到：

```text
ProofData
```

里。

这样旧 Proof 的 nonce 不匹配：

```text
old_nonce != current_nonce
```

Verifier 直接拒绝。

---

## 5.7 修改 Request

Response 真实并不代表 Request 就是预期 Request。

例如原本需要证明：

```text
GET /balance?user=Alice
```

攻击者却发送：

```text
GET /balance?user=Bob
```

因此 Proof 必须同时绑定：

```text
request_hash
+
response_hash
```

而不能只证明 Response。

完整关系应该是：

```text
Server
  +
Request
  +
Response
  +
Timestamp / Nonce
```

同时被 TEE 签名。

---

# 6. 最终信任链

最终可以把整个 TEE zkTLS 简化成下面这条链：

```text
CPU / Hypervisor Root of Trust
                │
                ▼
       Remote Attestation
                │
                ▼
      Trusted Code Measurement
                │
                ▼
        TEE Public Key
                │
                ▼
        TLS Client inside TEE
                │
                │ verify certificate
                ▼
          Real HTTPS Server
                │
                │ authenticated TLS
                ▼
          HTTP Response
                │
                ▼
        TEE Proof Generator
                │
                │ sign
                ▼
              Proof
                │
                ▼
             Verifier
```

因此 Verifier 最终信任的并不是：

```text
User
```

而是：

```text
TEE Hardware Root of Trust
        +
经过审核的 zkTLS 程序
        +
TLS 的 Server Authentication / Integrity
```

---

# 7. TEE zkTLS 与传统 zkTLS 的区别

传统 MPC zkTLS，例如 3P-TLS 一类方案，通常试图通过 MPC 让 Prover 与 Verifier/Notary 共同参与 TLS，从密码学层面避免任何单一参与方作弊。一些 zkTLS 系统使用 3-party TLS、MPC 和 ZK 来完成这一过程。

TEE zkTLS 则把问题简化成：

```text
传统 zkTLS：

Cryptography
   ↓
证明 TLS 正确执行


TEE zkTLS：

Remote Attestation
   ↓
证明可信程序正在运行
   ↓
相信可信程序正确执行 TLS
```

因此两者最大的区别实际上是**信任模型**：

```text
MPC zkTLS
    → 更偏密码学信任
    → 较高计算与通信成本

TEE zkTLS
    → 信任 CPU / TEE Vendor
    → 实现简单
    → 性能接近普通 TLS
```

---

# 8. TEE zkTLS 的安全边界

TEE zkTLS 并不是“无信任”方案。

它实际上把传统系统中：

```text
Trust the Server / Operator
```

转换成：

```text
Trust the TEE Hardware
+
Trust the Attestation Infrastructure
+
Trust the audited zkTLS code
```

因此仍然需要考虑：

```text
TEE 漏洞
Side Channel
CPU / Firmware 漏洞
Attestation Service
Rollback
TCB Version
Supply Chain
TEE Runtime 漏洞
zkTLS Program 本身的 Bug
```

生产系统通常需要检查：

```text
Measurement
TCB Version
Security Advisory
Debug Mode
Timestamp
Nonce
Certificate Policy
```

而不仅仅是：

```text
Attestation Signature == Valid
```

例如 Intel 的 Attestation 机制会暴露 TCB 状态，从而允许依赖方判断平台是否已经应用必要的安全更新。

---

# 总结

TEE zkTLS 可以用一句话描述：

> **由经过 Remote Attestation 验证的可信代码执行 HTTPS 请求，然后对“Server + Request + Response”这一事实生成硬件信任根支持的可验证签名。**

完整信任关系是：

```text
Hardware Root of Trust
        ↓
Remote Attestation
        ↓
Trusted zkTLS Code
        ↓
TLS Certificate Verification
        ↓
Authenticated TLS Session
        ↓
Request + Response
        ↓
TEE Signature
        ↓
Verifier
```

因此它解决了普通 HTTPS 无法解决的问题：

```text
普通 HTTPS：

Server ───── TLS ───── User

User知道数据是真的
但第三方不知道User有没有伪造


TEE zkTLS：

Server ── TLS ── Trusted TEE ── Proof ── Verifier

Verifier可以确认：
“可信 TEE 确实从指定 Server 获得了这份数据。”
```

这也是 TEE zkTLS 相比 MPC zkTLS 最大的工程优势：**把高成本的密码学协作替换成硬件隔离与 Remote Attestation，在接受 TEE 信任假设的前提下，可以大幅降低计算、通信和延迟成本。**