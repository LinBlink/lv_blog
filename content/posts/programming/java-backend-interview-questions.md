+++
date = '2026-06-19T23:19:24+08:00'
draft = true
title = 'Java后端 面试题整理'
categories = ["编程"]
tags = [""]
+++

# Spring

## 谈谈 SpringIOC 的理解，原理和实现？

## spring 三级缓存依赖流程
```mermaid
sequenceDiagram
    participant Spring as Spring容器
    participant L3 as 三级缓存<br/>singletonFactories
    participant L2 as 二级缓存<br/>earlySingletonObjects
    participant L1 as 一级缓存<br/>singletonObjects

    Note over Spring: 开始创建 A

    Spring->>Spring: ① new A 空壳对象
    Spring->>L3: ② 存入 A 的 ObjectFactory lambda

    Note over Spring: 给 A 注入属性，发现需要 B

    Spring->>Spring: ③ new B 空壳对象
    Spring->>L3: ④ 存入 B 的 ObjectFactory lambda

    Note over Spring: 给 B 注入属性，发现需要 A

    Spring->>L1: ⑤ getBean(A)，查一级缓存
    L1-->>Spring: ❌ 没有

    Spring->>L2: 查二级缓存
    L2-->>Spring: ❌ 没有

    Spring->>L3: 查三级缓存
    L3-->>Spring: ✅ 找到 A 的 lambda！

    Spring->>Spring: ⑥ 执行 lambda<br/>（需要代理则生成代理 A）
    Spring->>L2: ⑦ 早期引用放入二级缓存
    Spring->>L3: 删除三级缓存中的 A

    Note over Spring: B 拿到 A 的早期引用，B 完成初始化

    Spring->>L1: ⑧ B 放入一级缓存 ✅
    Spring->>L3: 删除三级缓存中的 B

    Note over Spring: 回到 A 的流程，B 已就绪，A 完成初始化

    Spring->>L1: ⑨ A 放入一级缓存 ✅
    Spring->>L2: 删除二级缓存中的 A

    Note over L1: 最终：一级缓存中有完整的 A 和 B ✅
```

| 情况 | 三级缓存 | lambda 执行 | 二级缓存 |
|------|---------|------------|---------|
| 无循环依赖，无 AOP | 存了 lambda | ❌ 不执行 | 不经过 |
| 无循环依赖，有 AOP | 存了 lambda | ❌ 不执行 | 不经过 |
| 有循环依赖，无 AOP | 存了 lambda | ✅ 执行 | 存原始对象 |
| 有循环依赖，有 AOP | 存了 lambda | ✅ 执行 | 存代理对象 |
