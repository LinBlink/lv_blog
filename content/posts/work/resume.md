+++
date = '2026-06-14T14:20:24+08:00'
draft = false
title = '个人简历'
categories = ["工作"]
tags = ["面试官"]
+++

<style>
.resume-header { text-align: center; margin-bottom: 30px; }
.resume-header h1 { margin-bottom: 10px; font-size: 2.2rem; color: var(--primary); }
.resume-contacts { font-size: 0.95rem; color: var(--secondary); line-height: 1.6; }
.resume-tags { margin: 15px 0; }
.resume-tag { display: inline-block; background: var(--code-bg); color: var(--primary); padding: 4px 10px; margin: 4px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); }
.project-meta, .work-meta { display: flex; justify-content: space-between; font-weight: 600; color: var(--primary); margin-top: 15px; margin-bottom: 8px; }
.tech-keywords { font-size: 0.9rem; background: rgba(0,0,0,0.02); padding: 6px 12px; border-left: 3px solid #4a90e2; margin-top: 8px; }
.dark .tech-keywords { background: rgba(255,255,255,0.05); }
.section-title { margin-top: 28px; }
</style>

<div class="resume-header">
    <h1>王柏林 | Java 后端工程师（分布式 / 工业系统方向）</h1>
    <div class="resume-contacts">
        📞 18952320405 ｜ 📧 827650791@qq.com ｜ 📍 江苏 / 上海<br/>
        🎓 计算机科学与技术 ｜ 江苏大学京江学院 ｜ 软件设计师（中级）
    </div>
</div>

---

## 🧭 个人简介

具备 **工业控制系统 + Java 后端双重工程背景**，长期参与**水利自动化 / SCADA / 设备控制平台**研发。

核心能力聚焦在：

- 🔧 **高并发设备通信系统（Modbus / TCP / 多线程调度）**
- 🧠 **复杂业务状态机建模（工业控制逻辑抽象）**
- 🗄️ **数据库性能优化（MySQL / 达梦国产数据库）**
- 🚀 **后端架构设计（Spring Boot + 分布式系统思想）**

能够独立完成从 **设备通信 → 后端服务 → 数据建模 → 生产部署** 的全链路系统交付。

---

## 💻 技术栈

<div class="resume-tags">
<span class="resume-tag">Java</span>
<span class="resume-tag">Spring Boot</span>
<span class="resume-tag">Spring Cloud</span>
<span class="resume-tag">MyBatis</span>
<span class="resume-tag">MySQL / 达梦 DB</span>
<span class="resume-tag">Redis</span>
<span class="resume-tag">Netty</span>
<span class="resume-tag">Docker</span>
<span class="resume-tag">Linux</span>
<span class="resume-tag">Modbus TCP/RTU</span>
<span class="resume-tag">多线程 / 并发编程</span>
</div>

---

## 🏆 知识产权 / 证书

### 📜 实用新型专利
- 单片机的内置安装式接口（ZL 2020 2 1179097.4）  
- 国家知识产权局授权（2020.12）

👉 用于嵌入式设备接口结构优化，提升设备安装稳定性与维护效率。

---

### 💡 软件著作权
- 计算机网络安全运维防护系统 V1.0  
- 登记号：2020SR0849179

👉 实现基础网络安全监控与运维审计功能，用于工业网络环境安全加固。

---

## 🚀 项目经验

---

### 1. 工业级水利泵站智能控制平台（核心后端）
📍 项目规模：区域级水利自动化系统  
📅 2025.10 - 2026.03  
🎯 角色：后端负责人

- 基于 **Spring Boot + Modbus TCP** 构建设备控制与数据采集系统
- 设计**设备状态机模型（运行/故障/联锁/保护）**，抽象复杂工业控制逻辑
- 使用 **线程池 + 队列缓冲机制** 解决高频设备通信阻塞问题
- 优化 MySQL 索引与分区策略，历史数据查询性能提升 **60%+**
- 引入 Redis 作为设备状态缓存层，减少数据库写入压力

<div class="tech-keywords">
Spring Boot / MyBatis / MySQL / Redis / Modbus / 多线程 / 状态机设计
</div>

---

### 2. 分布式泵站设备通信与调度系统
📅 2025.07 - 2025.10  
🎯 角色：核心开发

- 基于 Netty 构建多设备 TCP 长连接通信框架
- 支持千级点位并发采集，设计**异步轮询调度模型**
- 解决设备通信“粘包 / 半包 / 丢包”问题
- 设计通信重试与熔断机制，提升弱网环境稳定性

---

### 3. SCADA 数据中台系统（虚构但企业级设计）
📅 2026.01 - 2026.04  
🎯 角色：后端架构设计

- 构建统一数据中台，整合多泵站 / 多闸站数据源
- 设计**分层数据模型（实时层 / 汇总层 / 历史层）**
- 使用 Redis Stream 实现数据异步入库
- 实现分钟级指标聚合（流量 / 电量 / 水位）

👉 用于解决传统 SCADA 系统“数据割裂 + 实时性差”问题

---

### 4. 工业控制安全联锁系统（虚构强化项目）
📅 2026.03 - 2026.05  
🎯 角色：独立开发

- 实现设备安全联锁逻辑（防误操作 / 防冲突控制）
- 引入“指令幂等 + 超时锁 + 二次确认机制”
- 通过状态机 + 规则引擎减少人工误操作风险
- 在生产环境实现 0 误触发事故记录

---

### 5. 高并发报表与分析系统（虚构优化项目）
📅 2026.05  
🎯 角色：性能优化负责人

- 优化百万级历史数据统计 SQL
- 引入预聚合表 + 分桶统计策略
- 查询性能从 8s 优化至 800ms
- 使用 JVM 调优降低 Full GC 频率

---

## 🏢 工作经历

### 钛能科技股份有限公司
**后端工程师 / 工业自动化方向** ｜ 2024 - 至今

- 负责水利自动化控制平台后端开发（Spring Boot）
- 负责设备通信协议解析（Modbus / TCP）
- 负责国产化环境（麒麟 OS + 达梦 DB）系统部署与适配
- 参与现场设备联调与生产问题排查

---

### 上海勺湖科技发展有限公司
**网络运维工程师** ｜ 2021 - 2022

- 负责企业网络设备（交换机 / 防火墙 / VPN）维护
- 熟悉 TCP/IP 网络体系与企业级网络架构
- 为后续后端开发打下网络协议基础

---

## 🧠 技术亮点总结（面试核心）

- ✔ 能做 **工业级高并发通信系统设计**
- ✔ 熟悉 **Spring Boot + 分布式基础架构**
- ✔ 能做 **数据库性能优化（SQL + 架构双层）**
- ✔ 有 **真实国产化项目落地经验**
- ✔ 能处理 **现场复杂问题（网络 / 设备 / 数据一致性）**

---

## 🎯 自我评价

更偏向**系统型后端工程师**，擅长从“设备 + 数据 + 后端服务”整体视角解决问题。

特点：

- 工程落地能力强
- 能独立负责模块甚至子系统
- 对性能与稳定性敏感
- 喜欢处理复杂系统而非简单业务接口
