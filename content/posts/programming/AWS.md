+++
date = '2026-06-18T12:48:03+08:00'
draft = true
title = 'AWS 学习'
categories = ["编程"]
tags = ["学习笔记"]
+++

> 面向系统架构师认证，结合 Java 后端视角整理。核心思路：**每个服务解决什么痛点、何时选它、和类似服务怎么区分**。

## 一、存储 Storage

### 1.1 三种存储类型对比

| 类型 | 代表服务 | 访问单元 | 典型场景 |
|------|----------|----------|----------|
| **块存储** | EBS, EC2 Instance Store | 数据块（Block） | 数据库、OS 磁盘 |
| **文件存储** | EFS, FSx | 文件/目录树 | 多实例共享、NFS/SMB挂载 |
| **对象存储** | S3 | 对象（Object + Key） | 静态资源、备份、数据湖 |

```
块存储  → 像本地硬盘，OS看到的是裸设备，自己格式化挂载
文件存储 → 像 NAS，多台机器可以同时 mount 同一个目录
对象存储 → 像 HTTP PUT/GET 的 Key-Value，无目录概念，靠前缀模拟
```

---

### 1.2 Amazon S3

**核心功能速查：**

| 功能 | 说明 | 常见考点 |
|------|------|----------|
| **Versioning** | 同一 Key 保留多个历史版本 | 开启后才能用 CRR / MFA Delete |
| **CRR（跨区域复制）** | 异步复制到另一 Region | 灾备 DR、降低延迟 |
| **Transfer Acceleration** | 通过 CloudFront 边缘节点加速上传 | 上传到遥远 Region 时使用 |
| **Lifecycle Policy** | 对象按年龄自动迁移存储类 | 节省成本核心手段 |
| **S3 File Gateway** | 本地 SMB/NFS 映射到 S3 | 混合云文件迁移 |
| **Intelligent-Tiering** | 自动在 Standard ↔ IA 间切换 | 访问模式不可预测时使用 |

**S3 存储类选择决策树：**

```
访问频率高？ → S3 Standard
  ↓ 否
访问频率低但偶尔需要立即取回？ → S3 Standard-IA
  ↓
只需单 AZ 且可接受丢失风险？ → S3 One Zone-IA（比 IA 便宜20%）
  ↓
极少访问（档案级）？
  → Glacier Instant Retrieval  ← 毫秒取回
  → Glacier Flexible Retrieval ← 分钟~小时
  → Glacier Deep Archive       ← 12~48小时，最便宜
```

**S3 CRR 配置要点：**
```
1. 源 Bucket 和目标 Bucket 都必须开启 Versioning
2. 在源 Bucket 配置 Replication Rule（选目标 Bucket/Region）
3. 创建/指定 IAM Role（授权 S3 读源 + 写目标）
4. 目标 Bucket 可跨账号，存储类可以降级（节省成本）
5. 已有对象不会被复制，只复制规则创建后的新对象
```

---

### 1.3 Amazon EBS vs EFS vs Instance Store

| 特性 | EBS | EFS | Instance Store |
|------|-----|-----|----------------|
| **类型** | 块存储 | 文件存储（NFS） | 块存储（物理本地） |
| **持久化** | ✅ 持久 | ✅ 持久 | ❌ 实例停止即消失 |
| **多实例挂载** | ❌（默认单挂）Multi-Attach 有限支持 | ✅ 同时挂载数千个 |
| **跨 AZ** | ❌ 只能同一 AZ | ✅ 跨 AZ/Region | ❌ 物理绑定 |
| **性能** | 高（可选 io2 Block Express） | 中（NFS 协议开销） | 极高（本地 NVMe） |
| **典型场景** | 数据库、单实例应用 | 多实例共享、CMS | 临时缓存、大数据计算 |

> ⚠️ **EBS 孤岛效应**：EBS 只能在**同一 AZ** 内挂载。跨 AZ 迁移需先做 Snapshot，再从 Snapshot 在目标 AZ 创建新 EBS。

---

### 1.4 AWS DataSync vs Storage Gateway

| 服务 | 定位 | 典型用途 |
|------|------|----------|
| **DataSync** | 高速数据迁移/同步工具 | 一次性迁移 + 定时增量同步；NFS/SMB → S3/EFS/FSx |
| **S3 File Gateway** | 长期混合云存储桥接 | 本地应用继续用 NFS/SMB，数据透明存到 S3 |

```
迁移场景（临时）   → DataSync（快、省带宽、自动校验）
持续混合云存储    → Storage Gateway（长期共存）
```

---

### 1.5 Amazon FSx 类型速查

| 类型 | 适用场景 | 协议 |
|------|----------|------|
| **FSx for Windows** | Windows 应用、AD 集成 | SMB |
| **FSx for Lustre** | HPC、机器学习、高性能计算 | Lustre（可直接接 S3） |
| **FSx for NetApp ONTAP** | 企业级 NAS 迁移上云 | NFS/SMB/iSCSI |
| **FSx for OpenZFS** | ZFS 文件系统迁移 | NFS |

---

## 二、数据库 Database

### 2.1 数据库选型速查

| 需求 | 推荐服务 | 理由 |
|------|----------|------|
| 关系型、低流量 | RDS（MySQL/PostgreSQL） | 标准托管，成本合理 |
| 关系型、高性能/高可用 | **Aurora** | 性能 5x MySQL，自动多副本 |
| NoSQL、超低延迟 | **DynamoDB** | 单位毫秒，完全 Serverless |
| DynamoDB 加速 | **DAX** | 微秒级内存缓存，对应用透明 |
| 数据仓库 OLAP | **Redshift** | 列式存储，PB 级分析查询 |
| 内存缓存 | ElastiCache | Redis / Memcached 托管 |

---

### 2.2 Amazon Aurora 解决了什么痛点

```
传统 RDS MySQL 痛点          Aurora 解法
─────────────────────────────────────────────
扩展困难               →  存储自动扩展（最大 128TB）
高可用难（容易挂）     →  6 副本跨 3 AZ，1 写 + 最多 15 读副本
高并发支撑差          →  Aurora Serverless v2 自动扩缩容
运维成本高            →  全托管，自动 patching/backup
存储利用率低          →  Log-structured 存储，物理空间共享
启动慢，弹性差        →  Aurora Serverless 秒级冷启动
```

**Aurora vs RDS 选择：**
- 需要 **高可用、大并发、读扩展** → Aurora
- 普通应用、成本敏感 → RDS

---

### 2.3 DynamoDB 核心概念

```
Table（表）
  └── Item（行，最大 400KB）
        └── Attribute（列，动态schema）

主键类型：
  Partition Key（哈希键）  → 决定数据分布在哪个分区
  Partition Key + Sort Key → 组合主键，同一分区内按 Sort Key 排序

读写容量模式：
  Provisioned → 手动设置 RCU/WCU（适合稳定流量，省钱）
  On-Demand  → 按请求计费（适合变化流量，无需预估）
```

**DAX（DynamoDB Accelerator）：**
```
应用 → DAX（内存缓存，微秒响应）→ DynamoDB
           ↑ 缓存命中直接返回
           ↓ Miss 才回源 DynamoDB

适合：读多写少，相同 Query 反复执行
不适合：强一致性读、写密集型场景
```

---

## 三、消息队列 Messaging

### 3.1 SNS vs SQS vs EventBridge

| 特性 | SNS | SQS | EventBridge |
|------|-----|-----|-------------|
| **模型** | 发布/订阅（Push） | 队列（Poll） | 事件总线（路由） |
| **消费者** | 多个订阅者同时收到 | 一个消费者处理一条消息 | 多个 Target 并行路由 |
| **持久化** | ❌（不持久，发即消失） | ✅（保留最多 14 天） | ❌（事件路由后不存储） |
| **重试** | 有限 | ✅（Visibility Timeout） | ✅（可配置重试策略） |
| **消息顺序** | ❌ | FIFO Queue 支持 | ❌ |
| **典型场景** | 通知广播、触发多个系统 | 任务队列、削峰填谷 | AWS 服务事件响应 |

---

### 3.2 SNS + SQS 扇出模式（Fan-out）⭐

**场景：** 一条消息需要**同时**分发给多个独立的消费者（微服务）

```
                    ┌── SQS Queue A ── 微服务A（发邮件）
消息生产者 → SNS Topic ┤
                    ├── SQS Queue B ── 微服务B（记录日志）
                    └── SQS Queue C ── 微服务C（更新库存）
```

**为什么不直接用 SNS？**
> SNS 直接 Push 到服务，若某微服务宕机，消息**永久丢失**。
> 加入 SQS 缓冲后，消息积压在队列，服务恢复后继续消费，**零丢失**。

**配置要点：**
```
1. 创建 SNS Topic
2. 为每个下游服务创建独立 SQS Queue
3. 每个 SQS Queue 订阅该 SNS Topic
4. 下游服务各自 Poll 自己的 SQS Queue
5. 开启 SQS DLQ（死信队列）处理消费失败消息
```

---

### 3.3 SQS 核心概念

```
Standard Queue  → 至少投递一次（At-Least-Once），近似 FIFO，高吞吐
FIFO Queue      → 精确投递一次（Exactly-Once），严格有序，300 TPS 上限

Visibility Timeout：
  消息被消费者取走后，对其他消费者不可见的时间窗口
  消费者处理完需在超时前 DeleteMessage，否则消息重新可见

DLQ（Dead Letter Queue）死信队列：
  消息超过 maxReceiveCount 次仍未被成功处理 → 转移到 DLQ
  用途：排查问题，避免毒药消息卡死队列
```

---

## 四、计算 Compute

### 4.1 EC2 核心

**Auto Scaling Group（ASG）工作原理：**
```
定义：最小/期望/最大实例数
      ↓
CloudWatch 监控指标（CPU、请求数等）
      ↓
触发 Scaling Policy（扩出 / 缩入）
      ↓
ALB 自动注册/注销实例
```

**Scaling 策略类型：**
| 策略 | 说明 |
|------|------|
| **Target Tracking** | 维持某个指标在目标值（最推荐，如 CPU=60%） |
| **Step Scaling** | 按阶梯规则扩缩（超过70%加2台，超过90%加5台） |
| **Scheduled Scaling** | 定时扩缩（每天早8点扩容，晚10点缩容） |
| **Predictive Scaling** | ML 预测未来流量，提前扩容 |

---

### 4.2 AWS Lambda

**核心限制（SAA 常考）：**

```
最大执行时间：15 分钟
内存：128MB ~ 10,240MB
临时存储（/tmp）：最大 10GB
并发数：默认 1000/Region（可申请提升）
部署包大小：50MB（zip），250MB（解压后）
```

**Lambda 适用场景判断：**
```
✅ 适合 Lambda：
  - 事件触发型（S3上传、API请求、定时任务）
  - 执行时间 < 15分钟
  - 无状态处理
  - 流量变化大（不想管服务器）

❌ 不适合 Lambda：
  - 长时间运行任务（>15分钟）→ 用 Fargate / EC2
  - 需要持久化本地状态 → 用 EC2 + EBS
  - 高频持续负载（冷启动成本高）→ 用 EC2 + ASG
```

**Lambda + API Gateway 典型架构（Serverless）：**
```
用户请求 → Route 53 → API Gateway
                           ↓
                       Lambda 函数
                           ↓
                   DynamoDB / S3 / RDS
```

---

## 五、网络与连接 Networking

### 5.1 CloudFront vs Global Accelerator

| 对比维度 | CloudFront（CDN） | Global Accelerator |
|----------|-------------------|--------------------|
| **核心能力** | **缓存内容**，减少回源 | **优化路径**，减少网络跳数 |
| **协议** | HTTP/HTTPS | 所有协议（TCP/UDP） |
| **缓存** | ✅ 有缓存 | ❌ 无缓存，透传 |
| **IP 地址** | 动态（DNS解析） | 静态 Anycast IP（2个） |
| **适用场景** | 静态资源、网站加速 | 游戏、VoIP、金融交易、全球 API |

```
记忆口诀：
CloudFront = 内容缓存（把东西搬到离用户近的地方）
Global Accelerator = 网络提速（走 AWS 高速公路而非公网）
```

---

### 5.2 VPC 核心组件

```
VPC（Virtual Private Cloud）
├── Subnet（子网）
│   ├── Public Subnet  → 有 Internet Gateway 路由，实例可有公网 IP
│   └── Private Subnet → 无直接公网访问，通过 NAT Gateway 出网
├── Internet Gateway（IGW） → VPC 出公网的门
├── NAT Gateway  → Private 子网实例出公网（单向）
├── Route Table  → 控制流量走向
├── Security Group（SG） → 实例级，有状态防火墙
└── Network ACL（NACL）  → 子网级，无状态防火墙
```

**SG vs NACL 关键区别：**

| 特性 | Security Group | Network ACL |
|------|---------------|-------------|
| **作用级别** | 实例（ENI） | 子网 |
| **状态** | **有状态**（出去的回来自动放行） | **无状态**（进出都要显式写规则） |
| **规则** | 只有 Allow | Allow + Deny |
| **评估** | 所有规则取并集 | 按编号顺序，第一个匹配即生效 |

> ⚠️ **NACL 无状态**是高频考点：如果只配了入站规则允许 HTTP，但没有配出站规则允许响应端口，流量会被拦截。

---

### 5.3 VPC Endpoints

```
问题：VPC 内的 EC2 访问 S3，流量默认走公网 → 有安全风险 + 流量费用

解决：VPC Endpoint（内网直通，不过公网）

类型：
  Gateway Endpoint  → S3、DynamoDB（免费，配置在 Route Table）
  Interface Endpoint → 其他 AWS 服务（收费，部署 ENI 到子网）
```

---

### 5.4 连接方案对比

| 场景 | 推荐方案 |
|------|----------|
| 本地数据中心 ↔ AWS（低延迟，高安全） | **AWS Direct Connect**（专线，物理连接）|
| 本地数据中心 ↔ AWS（加密隧道） | **Site-to-Site VPN**（走公网但加密，成本低）|
| 开发者笔记本 ↔ VPC 内资源 | **Client VPN** |
| 不同 VPC 内网互通 | **VPC Peering** 或 **Transit Gateway** |
| 多个 VPC / On-Prem 星型互联 | **Transit Gateway**（Hub-Spoke 拓扑）|

---

### 5.5 Route 53 路由策略

| 策略 | 说明 | 场景 |
|------|------|------|
| **Simple** | 直接解析，无特殊逻辑 | 单端点 |
| **Weighted** | 按权重分流（A:70%, B:30%） | 灰度发布、A/B测试 |
| **Latency** | 路由到延迟最低的 Region | 全球多 Region 部署 |
| **Failover** | 主备切换，健康检查触发 | 灾备 DR |
| **Geolocation** | 按用户地理位置路由 | 合规要求（欧洲用户只访问欧洲） |
| **Geoproximity** | 按距离 + 偏置权重路由 | 精细流量偏移 |
| **Multi-Value** | 返回多个健康 IP | 简单客户端负载均衡 |

---

## 六、安全与权限 Security & IAM

### 6.1 IAM 核心概念

```
用户（User）       → 对应具体的人或程序，有 AK/SK
用户组（Group）    → 用户的集合，在组上附加策略
角色（Role）       → 临时身份，EC2/Lambda/跨账号 assume role
策略（Policy）     → 权限的 JSON 定义文档
```

**策略类型：**

| 类型 | 附加到 | 说明 |
|------|--------|------|
| **Identity-based Policy** | User/Group/Role | 主体有哪些权限 |
| **Resource-based Policy** | S3 Bucket / KMS Key 等 | 谁可以访问这个资源 |
| **SCP（Service Control Policy）** | AWS Organizations OU | 整个账号/OU 的最大权限边界 |

**Instance Profile（实例配置文件）：**
```
问题：EC2 上的应用需要访问 S3，但不能把 AK/SK 写死在代码里

解决：
  1. 创建 IAM Role，附加 S3 访问权限策略
  2. 创建 Instance Profile，关联该 Role
  3. 启动 EC2 时绑定 Instance Profile
  4. 应用通过 169.254.169.254（元数据接口）自动获取临时凭证

Java SDK 会自动从 Instance Metadata 读取临时凭证，无需任何配置
```

---

### 6.2 AWS Secrets Manager vs Parameter Store

| 特性 | Secrets Manager | Parameter Store |
|------|----------------|-----------------|
| **定位** | 专为敏感凭据设计 | 配置参数+敏感信息 |
| **自动轮换** | ✅（集成 Lambda 定时换密码） | ❌（不支持自动轮换） |
| **费用** | 按密钥收费（每个/月） | 标准参数免费，高级参数收费 |
| **典型用途** | DB密码、API Key、OAuth Token | 应用配置、Feature Flag、少量密钥 |
| **版本管理** | ✅ | ✅ |
| **跨 Region 复制** | ✅ | ❌ |

> **记忆口诀：** 需要自动换密码 → Secrets Manager；普通配置/偶尔用的密钥 → Parameter Store（省钱）

---

### 6.3 安全服务矩阵

| 服务 | 功能 | 类比 |
|------|------|------|
| **GuardDuty** | 威胁检测（异常行为、恶意 IP） | 入侵检测系统 IDS |
| **Inspector** | 漏洞扫描（EC2/容器/Lambda） | 自动化漏洞扫描器 |
| **Security Hub** | 聚合多账号安全发现 | SIEM 聚合面板 |
| **Macie** | S3 数据分类，发现 PII 数据 | 数据安全分类 DLP |
| **Shield** | DDoS 防护（Standard 免费，Advanced 收费） | Anti-DDoS |
| **WAF** | Web 应用防火墙（SQL注入、XSS等） | WAF |
| **Firewall Manager** | 多账号统一安全规则管理 | 集中安全策略 |
| **Network Firewall** | VPC 级深度包检测防火墙 | 进阶 NACL + IPS |
| **KMS** | 密钥管理，加密/解密服务 | HSM 密钥管理 |
| **CloudHSM** | 专用硬件安全模块 | 物理 HSM |

---

### 6.4 AWS Organizations & SCP

```
Management Account（根账号）
└── Root
    ├── OU（研发部门）
    │   ├── Member Account A（Dev环境）
    │   └── Member Account B（Test环境）
    └── OU（生产部门）
        └── Member Account C（Prod环境）

SCP（Service Control Policy）作用于 OU 或账号：
  - 不授予权限，只限制权限上限
  - 即使 IAM Policy 允许，SCP 拒绝则无法执行
  - 用途：禁止生产账号使用非授权 Region，禁止删除 CloudTrail
```

---

## 七、分析 Analytics

### 7.1 分析服务全景

```
数据采集层：
  Kinesis Data Streams → 实时数据流入（自定义消费）
  Kinesis Firehose     → 数据直接投递到 S3/Redshift/ES（无需代码）
  AWS Glue             → ETL 服务，数据转换清洗

存储层：
  S3         → 数据湖（Data Lake）
  Redshift   → 数据仓库（Data Warehouse）

查询分析层：
  Athena        → 直接 SQL 查 S3（无服务器，按扫描量计费）
  Redshift       → 复杂 OLAP 分析
  EMR           → 托管 Hadoop/Spark 集群（大规模数据处理）

可视化层：
  QuickSight → BI 看板，对接 Athena/Redshift/S3
```

### 7.2 Kinesis 三兄弟

| 服务 | 定位 | 类比 |
|------|------|------|
| **Kinesis Data Streams** | 实时数据流，消费者自定义代码处理 | Kafka（自己写消费者） |
| **Kinesis Data Firehose** | 流式数据直接投递到目的地，全托管 | Kafka + Fluentd（自动写入） |
| **Kinesis Data Analytics** | 在流数据上执行 SQL/Flink 查询 | Flink（实时分析） |

### 7.3 Athena 使用场景

```
典型场景：
  S3 存了大量 JSON/CSV/Parquet 日志
  → 不想搭 Spark 集群
  → 直接在 Athena 写 SQL 查询
  → 按扫描数据量计费（Parquet 列式格式可大幅降低扫描量）

成本优化：
  原始 JSON → 转换为 Parquet（Glue ETL）
  → 同样查询成本可降低 ~87%
```

---

## 八、管理与治理 Management

### 8.1 CloudWatch 核心

```
CloudWatch 组件：
  Metrics    → 监控数字指标（CPU、网络、自定义指标）
  Logs       → 日志收集存储（Log Group > Log Stream）
  Alarms     → 基于指标触发告警（通知 SNS / 触发 ASG）
  Dashboards → 可视化面板
  Events     → 已被 EventBridge 替代

Log Group 层级：
  Log Group（/aws/lambda/my-function）
    └── Log Stream（2024/01/01/[$LATEST]abc123）
              └── Log Events（具体一条日志）
```

### 8.2 CloudTrail vs CloudWatch vs Config

| 服务 | 回答的问题 | 数据类型 |
|------|-----------|---------|
| **CloudWatch** | 系统**现在**表现如何？（CPU多少？） | 指标、日志 |
| **CloudTrail** | **谁**在**什么时间**做了**什么操作**？ | API 调用审计日志 |
| **AWS Config** | 资源配置**变更历史**是什么？是否合规？ | 配置快照、合规规则 |

> **记忆：** CloudTrail = 人的操作记录；Config = 资源的状态记录；CloudWatch = 系统运行监控

### 8.3 AWS SSM（Systems Manager）

```
核心功能：
  Session Manager  → 无需 SSH/RDP，浏览器直接连 EC2（无需开22端口）
  Run Command      → 批量远程执行命令（不用逐台 SSH）
  Patch Manager    → 自动化补丁管理
  Parameter Store  → 配置参数存储
  Automation       → 定义运维操作 Runbook，自动化执行
```

---

## 九、架构设计模式 Patterns

### 9.1 高可用架构设计原则

```
核心原则：消除单点故障（SPOF）

多 AZ 部署：
  EC2 → 跨 AZ 的 ASG + ALB
  RDS → Multi-AZ（同步复制，自动故障转移）
  ElastiCache → Multi-AZ with auto-failover
  
多 Region 部署（更高级别）：
  Route 53 Failover/Latency 路由
  S3 CRR（数据复制）
  Aurora Global Database（< 1秒 RPO）
```

### 9.2 解耦架构模式

```
紧耦合（反模式）：
  A服务 → HTTP同步调用 → B服务
  问题：B挂了A也挂，B慢了A也慢

松耦合（推荐）：
  A服务 → SQS Queue → B服务（异步处理）
  优点：B挂了消息积压，B恢复后继续消费；峰值流量被队列缓冲

扇出解耦：
  一条消息 → SNS Topic → N个 SQS → N个消费者
```

### 9.3 常见架构场景解题思路

**场景1：降低数据库压力**
```
方案：
  读多写少 → ElastiCache（Redis）缓存热点数据
  读扩展   → Aurora 只读副本（最多15个）
  会话状态  → ElastiCache 存 Session（不放在 EC2 本地）
```

**场景2：处理突发流量（variable workloads）**
```
方案：
  计算层 → EC2 ASG（自动扩缩容）+ Target Tracking
  队列层 → SQS 削峰填谷（前端快速响应，后端慢慢处理）
  Lambda → 天然支持突发（并发自动扩展）
```

**场景3：本地数据迁移上云**
```
方案选择：
  数据量 < TB 级，网络够用 → AWS DataSync（在线迁移）
  数据量 TB~PB 级，网络慢  → AWS Snowball Edge（物理设备）
  持续混合云存储            → Storage Gateway
  数据库迁移                → AWS DMS（Database Migration Service）
```

**场景4：全球用户访问加速**
```
静态内容（图片/CSS/JS）→ CloudFront CDN
动态 API 加速          → Global Accelerator
多 Region 部署         → Route 53 Latency-based 路由
```

**场景5：多账号安全治理**
```
账号管理    → AWS Organizations + OU 结构
权限边界    → SCP（防止账号内 IAM 越权）
安全统一    → Firewall Manager（统一 WAF/SG 规则）
审计合规    → CloudTrail + AWS Config
威胁检测    → GuardDuty（所有账号都开）
```

---

## 十、高频考点速查

### 10.1 存储类型判断

| 关键词 | 选型 |
|--------|------|
| "共享文件系统"、"多 EC2 同时挂载" | EFS |
| "数据库磁盘"、"单实例" | EBS |
| "临时高速缓存"、"实例停止数据丢失" | Instance Store |
| "对象存储"、"静态资源" | S3 |
| "Windows 文件共享"、"SMB" | FSx for Windows |
| "HPC"、"高性能计算" | FSx for Lustre |

### 10.2 数据库类型判断

| 关键词 | 选型 |
|--------|------|
| "无 Schema"、"高并发低延迟" | DynamoDB |
| "DynamoDB 微秒级读" | DAX |
| "高可用 MySQL/PostgreSQL"、"自动扩展" | Aurora |
| "数据仓库"、"OLAP"、"PB级分析" | Redshift |
| "SQL 查询 S3" | Athena |
| "托管 Spark/Hadoop" | EMR |

### 10.3 消息队列选型

| 需求 | 选型 |
|------|------|
| 广播给多个消费者 | SNS + SQS Fan-out |
| 任务队列、削峰填谷 | SQS Standard |
| 严格顺序、不重复 | SQS FIFO |
| 实时数据流 | Kinesis Data Streams |
| AWS 服务事件触发 | EventBridge |

### 10.4 网络连接选型

| 需求 | 选型 |
|------|------|
| 本地 ↔ AWS 专线，低延迟 | Direct Connect |
| 本地 ↔ AWS VPN（快速搭建） | Site-to-Site VPN |
| VPC 内访问 S3/DynamoDB（私网） | VPC Gateway Endpoint |
| 多 VPC 内网互联 | VPC Peering / Transit Gateway |
| 全球用户 HTTP 加速（缓存） | CloudFront |
| 全球用户任意协议加速（路由） | Global Accelerator |

### 10.5 安全服务选型

| 需求 | 选型 |
|------|------|
| 检测异常 API 调用、恶意 IP | GuardDuty |
| 扫描 EC2 漏洞 | Inspector |
| S3 数据中是否有 PII 数据 | Macie |
| DDoS 防护 | Shield |
| SQL注入/XSS 防护 | WAF |
| API 调用审计 | CloudTrail |
| 资源配置合规检查 | AWS Config |
| 密钥自动轮换 | Secrets Manager |
| 应用配置参数存储 | Parameter Store |