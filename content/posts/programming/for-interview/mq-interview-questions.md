+++
date = '2026-06-23T13:21:54+08:00'
draft = true
title = '消息中间件 面试题整理'
categories = ["编程"]
tags = ["面试题"]
[cover]
  image = ""
+++

# RabbitMQ

## RabbitMQ 如何保证消息不丢失
- 哪些情况会丢失
  - publisher -> exchange
    - 生产者确认机制
      - ack publish-confirm
      - nack publish-confirm
      - ack publish-return
      - 消息失败之后如何处理
        - 回调方法
        - 记录日志
        - 保存到数据库中然后定时重发
  - exchange -> queue
    - 消息持久化
      - 交换机持久化
      - 队列持久化
      - 消息持久化
  - queue
  - queue -> consumer
    - 消费者确认机制

# Kafka