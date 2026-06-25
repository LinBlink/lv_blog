+++
date = '2026-06-24T19:01:02+08:00'
draft = true
title = 'Nacos 一些常用配置'
categories = ["编程"]
tags = [""]
[cover]
  image = "https://loremflickr.com/500/200/programmer"
+++

# bootstrap 配置

## bootstrap.yaml
```yaml
server:
  port: 10888
  tomcat:
    uri-encoding: UTF-8
spring:
  profiles:
    active: dev
  application:
    name: archive-service
  cloud:
    nacos:
      config:
        file-extension: yaml
        shared-configs:
          - data-id: shared-spring.yaml
            refresh: false
          - data-id: shared-redis.yaml
            refresh: false
          - data-id: shared-mybatis.yaml
            refresh: false
          - data-id: shared-logs.yaml
            refresh: false
          - data-id: shared-feign.yaml
            refresh: false
          - data-id: shared-logs.yaml # 共享日志配置
            refresh: false
#          - data-id: shared-feign.yaml # 共享feign配置
#            refresh: false

lia:
  jdbc:
    database: tb_archive
```

## bootstrap-dev.yaml
```yaml
spring:
  cloud:
    nacos:
      server-addr: 192.168.2.115:8848 # nacos注册中心
      discovery:
        namespace: f923fb34-cb0a-4c06-8fca-ad61ea61a3f0
        group: DEFAULT_GROUP
        ip: 192.168.2.115
logging:
  level:
    asia.liminality: debug
```


# nacos 配置

## shared-spring.yaml
```yaml
spring:
  jackson:
    default-property-inclusion: non_null
  main:
    allow-bean-definition-overriding: true
  mvc:
    pathmatch:
      #解决异常：swagger Failed to start bean 'documentationPluginsBootstrapper'; nested exception is java.lang.NullPointerException
      #因为Springfox使用的路径匹配是基于AntPathMatcher的，而Spring Boot 2.6.X使用的是PathPatternMatcher
      matching-strategy: ant_path_matcher
```

## shared-redis.yaml
```yaml
spring:
  redis:
    host: ${lia.redis.host:192.168.2.115}
    password: ${lia.redis.password:github}
    lettuce:
      pool:
        max-active: ${lia.redis.pool.max-active:8}
        max-idle: ${lia.redis.pool.max-idle:8}
        min-idle: ${lia.redis.pool.min-idle:1}
        max-wait: ${lia.redis.pool.max-wait:300}
```

## shared-mybatis.yaml
```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://${lia.jdbc.host:192.168.2.115}:${lia.jdbc.port:5432}/${lia.jdbc.database}?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai
    username: ${lia.jdbc.username:postgres}
    password: ${lia.jdbc.password:github}
mybatis-plus:
  configuration:
    default-enum-type-handler: com.baomidou.mybatisplus.core.handlers.MybatisEnumTypeHandler
  global-config:
    db-config:
      logic-delete-field: deletedAt
      logic-not-delete-value: "null"
      logic-delete-value: "now()"
      id-type: assign_id
      insert-strategy: ignored
      update-strategy: ignored
      select-strategy: not_null
```


## shared-logs.yaml
```yaml
logging:
  pattern:
    dateformat: HH:mm:ss.SSS
    console: "%clr(%d{${LOG_DATEFORMAT_PATTERN}}){faint}-[${hostname}][%X{requestId:-sys}] %clr(${LOG_LEVEL_PATTERN:-%5p}) %clr(${PID:- }){magenta} %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} %clr(:){faint} %m%n"
    file: "%d{${LOG_DATEFORMAT_PATTERN}}-[${hostname}][%X{requestId:-sys}]-${LOG_LEVEL_PATTERN:-%5p} ${PID:- } --- [%15.15t] %-40.40logger{39} : %m%n"
  file:
    path: "logs/${spring.application.name}"
```

## shared-feign.yaml
```yaml
feign:
  client:
    config:
      default: # default全局的配置
        loggerLevel: BASIC # 日志级别，BASIC就是基本的请求和响应信息
  httpclient:
    enabled: true # 开启feign对HttpClient的支持
    max-connections: 200 # 最大的连接数
    max-connections-per-route: 50 # 每个路径的最大连接数
  sentinel:
    enabled: true
```


