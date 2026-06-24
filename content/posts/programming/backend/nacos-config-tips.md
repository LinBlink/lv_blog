+++
date = '2026-06-24T19:01:02+08:00'
draft = true
title = 'Nacos 一些常用配置'
categories = ["编程"]
tags = [""]
[cover]
  image = "https://loremflickr.com/500/200/programmer"
+++

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

```


## shared-mybatis.yaml
```yaml

```

