+++
date = '2026-06-19T23:19:24+08:00'
draft = true
title = 'MySQL 面试题整理'
categories = ["编程"]
tags = [""]
+++
 
> 面试题从互联网各个角落收集而来

## 如何定位慢查询？

- 方案1
  - 开源工具
    - Arthas
  - 运维工具
    - Prometheus
    - Skywalking
- 方案2
  - MySQL自带慢日志(mysql性能损耗)
    - 开启慢日志方法
      - /etc/my.conf
        - slow_query_log
        - long_query_time

## SQL语句执行很慢，如何分析

- 慢的原因
  - 聚合查询
  - 多表查询
  - 表数据量过大查询
  - 深度分页查询
- 如何分析慢
  - explain， desc 命令
    - 如何分析执行结果？
      - extra 的额外优化建议
        - using where; using index 查找使用了索引，需要的数据在索引列都能找到，不需要回表查询数据
        - using index condition 查找使用了索引
      - type
        - index，all 需要优化

## 了解过索引吗？什么是索引？

索引（index）是帮助 MySQL 高效获取数据的数据结构（有序）。在数据之外，数据库系统还维护着满足特定查找算法的数据结构（如 B+ 树），这些数据结构以某种方式引用（指向）数据，这样就可以在这些数据结构上实现高级查找算法，这种数据结构就是索引。

## 索引的底层数据结构了解过吗？

- 二叉搜索树
- 红黑树
- 


## 深入问题

为什么 InnoDB 主键建议自增？
为什么非自增主键会导致页分裂？
为什么 MyISAM 和 InnoDB 索引结构不同？
为什么 B+树适合磁盘而红黑树不适合？