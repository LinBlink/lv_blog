+++
date = '2026-06-18T12:46:51+08:00'
draft = true
title = 'Spring Cloud 学习'
categories = ["编程"]
tags = ["学习笔记"]
+++

## 1. 服务拆分与远程调用

### 1.1 为什么要拆分服务？

单体应用随业务增长面临：部署慢、扩展性差、技术栈固化等问题。微服务将其拆分为**独立部署、独立扩缩容**的小服务，每个服务只负责一个业务域。

**拆分原则：**
- 单一职责：每个服务只做一件事
- 高内聚低耦合：服务内部紧密，服务之间松散
- 数据独立：每个服务拥有独立数据库

### 1.2 用户登录流程（微服务视角）

```
Client → Gateway（鉴权） → 业务微服务A → 微服务B（OpenFeign）
                ↓
           Nacos（服务发现）
```

### 1.3 RestTemplate — 微服务间原始调用

`RestTemplate` 是 Spring 提供的 HTTP 客户端，可用于微服务间调用，但**代码繁琐、不支持负载均衡**，是 OpenFeign 出现前的过渡方案。

```java
// 注册为 Bean，并开启负载均衡
@Bean
@LoadBalanced
public RestTemplate restTemplate() {
    return new RestTemplate();
}

// 调用方式（服务名替代 IP:Port）
String url = "http://user-service/api/users/" + userId;
User user = restTemplate.getForObject(url, User.class);
```

> ⚠️ RestTemplate 已逐渐被 OpenFeign 取代，生产中优先选择 OpenFeign。

---

## 2. 服务治理 — Nacos 注册中心

### 2.1 解决的问题

微服务实例 IP / 端口动态变化，调用方无法硬编码地址。注册中心提供：
- **服务注册**：服务启动时向注册中心上报自己的地址
- **服务发现**：调用方从注册中心查询目标服务地址，并实现负载均衡
- **健康检查**：注册中心自动剔除不健康的实例

### 2.2 Nacos 部署（Docker）

```bash
docker run -d \
  --name nacos \
  -e MODE=standalone \
  -p 8848:8848 \
  nacos/nacos-server:v2.1.0
```

访问控制台：`http://localhost:8848/nacos`，默认账号密码均为 `nacos`。

### 2.3 Nacos 命名空间

Nacos 通过**命名空间（Namespace）** 实现环境隔离，不同命名空间的服务互不可见。

| 命名空间 | 用途 |
|---------|------|
| public（默认） | 所有环境共用 |
| dev | 开发环境 |
| test | 测试环境 |
| prod | 生产环境 |

### 2.4 服务注册

**引入依赖：**

```xml
<!--Spring Cloud Alibaba 依赖管理-->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2021.0.5.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!--Nacos 服务发现依赖-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

**配置 Nacos 地址（application.yml）：**

```yaml
spring:
  application:
    name: user-service        # 服务名，注册到 Nacos 的标识
  cloud:
    nacos:
      server-addr: localhost:8848
      discovery:
        namespace: dev        # 命名空间 ID（非名称）
        group: DEFAULT_GROUP
```

### 2.5 服务发现与负载均衡

Spring Cloud LoadBalancer（Spring 官方）或 Ribbon（Netflix，已停维）会拦截带 `@LoadBalanced` 注解的 RestTemplate / Feign 请求，从注册中心拉取实例列表并选择一个。

默认策略为**轮询（RoundRobin）**，可自定义为随机、权重等。

---

## 3. OpenFeign 声明式 HTTP 客户端

### 3.1 解决的问题

`RestTemplate` 需要手动拼接 URL、处理参数，代码重复且难以维护。OpenFeign 允许开发者**像调用本地方法一样调用远程服务**，接口即契约。

### 3.2 基础使用

**引入依赖：**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

**启动类开启 Feign：**

```java
@SpringBootApplication
@EnableFeignClients
public class OrderApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
```

**定义 FeignClient 接口：**

```java
@FeignClient(value = "user-service")   // 对应 spring.application.name
public interface UserClient {

    @GetMapping("/api/users/{id}")
    User getUserById(@PathVariable("id") Long id);

    @PostMapping("/api/users")
    User createUser(@RequestBody UserDTO dto);
}
```

**调用方注入即用：**

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final UserClient userClient;

    public OrderVO getOrder(Long orderId) {
        Order order = orderMapper.selectById(orderId);
        User user = userClient.getUserById(order.getUserId()); // 像调用本地方法
        return buildVO(order, user);
    }
}
```

### 3.3 引入 OkHttp 连接池

OpenFeign 默认使用 `URLConnection`，不带连接池，高并发场景性能差。推荐替换为 **OkHttp**。

```xml
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-okhttp</artifactId>
</dependency>
```

```yaml
feign:
  okhttp:
    enabled: true
  httpclient:
    ok-http:
      connection-pool-timeout: PT0.0005S
      max-connections: 200
      max-connections-per-route: 50
```

### 3.4 最佳实践 — 抽取 API 模块

**问题：** 服务提供方和消费方各自维护一份相同的 DTO / FeignClient 接口，导致重复代码。

**方案：** 新建 `xxx-api` 公共模块，将 FeignClient 接口、DTO、异常类统一放在此处。

```
项目结构：
├── user-service          # 用户服务（提供者）
├── order-service         # 订单服务（消费者）
└── hm-api               # 公共 API 模块
    └── client
        └── UserClient.java
    └── dto
        └── UserDTO.java
```

**消费方引入 API 模块依赖：**

```xml
<dependency>
    <groupId>com.hmall</groupId>
    <artifactId>hm-api</artifactId>
    <version>${project.version}</version>
</dependency>
```

**解决扫描包不一致问题：**

当 `FeignClient` 不在 `@SpringBootApplication` 的扫描包内时，需要显式指定：

```java
// 方式一：指定扫描包路径
@EnableFeignClients(basePackages = "com.hmall.api.client")

// 方式二：指定 FeignClient 类（更精确）
@EnableFeignClients(clients = {UserClient.class, ItemClient.class})
```

### 3.5 日志配置

Feign 日志级别分为 4 级：`NONE`（默认）、`BASIC`、`HEADERS`、`FULL`。

```java
// 全局配置 Bean
@Bean
public Logger.Level feignLogLevel() {
    return Logger.Level.FULL;
}
```

```yaml
# 针对特定 FeignClient 开启日志（需配合 logging.level）
logging:
  level:
    com.hmall.api.client.UserClient: DEBUG
```

---

## 4. Spring Cloud Gateway 网关

### 4.1 解决的问题

客户端直接调用各微服务面临：
- 各服务各自鉴权，逻辑重复
- 暴露内部服务地址，存在安全隐患
- 跨域、限流、日志等横切关注点分散

网关统一处理上述问题，是微服务体系的**统一入口**。

### 4.2 引入依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<!--网关也需要注册到 Nacos 以完成服务发现路由-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

> ⚠️ 网关基于 WebFlux（响应式），**不能引入** `spring-boot-starter-web`，两者冲突！

### 4.3 路由配置

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-route                          # 路由 ID，唯一
          uri: lb://user-service                  # lb:// 表示负载均衡到 Nacos 中的服务
          predicates:
            - Path=/api/users/**                  # 路径断言
          filters:
            - StripPrefix=1                       # 去掉路径前缀
        - id: order-route
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
            - Method=GET,POST                     # 方法断言
            - Header=X-Request-Id, \d+            # 请求头断言（正则）
          filters:
            - AddRequestHeader=X-Source, gateway  # 添加请求头
```

**常用路由断言工厂（Predicate）：**

| 断言工厂 | 说明 |
|---------|------|
| `Path` | 路径匹配 |
| `Method` | HTTP 方法匹配 |
| `Header` | 请求头匹配（支持正则） |
| `Query` | 请求参数匹配 |
| `After/Before/Between` | 时间断言 |
| `RemoteAddr` | IP 地址断言 |

### 4.4 网关请求处理流程

```
Client Request
    ↓
HttpWebHandlerAdapter
    ↓
DispatcherHandler
    ↓
RoutePredicateHandlerMapping  ← 匹配路由
    ↓
FilteringWebHandler
    ↓
[Global Filters] → [GatewayFilter Chain] → NettyRoutingFilter（实际转发）
    ↓
Proxied Service
```

### 4.5 网关登录校验 — 自定义 GlobalFilter

```java
@Component
@RequiredArgsConstructor
@Order(-1)   // 优先级，数字越小越先执行
public class AuthGlobalFilter implements GlobalFilter {

    private final JwtTool jwtTool;

    // 白名单路径（不需要鉴权）
    private static final List<String> WHITE_LIST = List.of(
        "/api/users/login",
        "/api/users/register"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // 1. 白名单放行
        if (isWhitePath(path)) {
            return chain.filter(exchange);
        }

        // 2. 获取 Token
        String token = getTokenFromRequest(request);
        if (token == null) {
            return unauthorized(exchange);
        }

        // 3. 解析 Token
        Long userId;
        try {
            userId = jwtTool.parseToken(token);
        } catch (Exception e) {
            return unauthorized(exchange);
        }

        // 4. 将用户 ID 传递给下游微服务
        ServerWebExchange mutatedExchange = exchange.mutate()
            .request(builder -> builder.header("X-User-Id", userId.toString()))
            .build();

        return chain.filter(mutatedExchange);
    }

    private boolean isWhitePath(String path) {
        return WHITE_LIST.stream().anyMatch(path::startsWith);
    }

    private String getTokenFromRequest(ServerHttpRequest request) {
        List<String> headers = request.getHeaders().get("Authorization");
        if (headers == null || headers.isEmpty()) return null;
        String auth = headers.get(0);
        return auth.startsWith("Bearer ") ? auth.substring(7) : null;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }
}
```

### 4.6 微服务中获取当前用户 — MVC 拦截器

在 `common` 模块中编写拦截器，从请求头获取网关传递的用户 ID，并存入 `UserContext`（ThreadLocal）：

```java
public class UserInfoInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response, Object handler) {
        String userIdStr = request.getHeader("X-User-Id");
        if (StringUtils.hasText(userIdStr)) {
            UserContext.setUser(Long.parseLong(userIdStr));
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        UserContext.removeUser(); // 防止内存泄漏！
    }
}
```

```java
// ThreadLocal 工具类
public class UserContext {
    private static final ThreadLocal<Long> TL = new ThreadLocal<>();
    public static void setUser(Long userId) { TL.set(userId); }
    public static Long getUser() { return TL.get(); }
    public static void removeUser() { TL.remove(); }
}
```

**避免网关引入 MVC 自动配置问题：**

将 `MvcConfig`（注册拦截器的配置类）通过 `spring.factories` 自动装配，并在网关模块中排除：

```java
// common 模块：resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.hmall.common.config.MvcConfig
```

```yaml
# 网关模块 application.yml 中排除
spring:
  autoconfigure:
    exclude:
      - com.hmall.common.config.MvcConfig
```

### 4.7 OpenFeign 传递用户 — RequestInterceptor

微服务 A 通过 Feign 调用微服务 B 时，需要将当前用户 ID 带过去：

```java
@Bean
public RequestInterceptor userInfoRequestInterceptor() {
    return template -> {
        Long userId = UserContext.getUser();
        if (userId != null) {
            template.header("X-User-Id", userId.toString());
        }
    };
}
```

> 所有 OpenFeign 发出的请求都会先经过 `RequestInterceptor`，自动携带用户信息。

---

## 5. 配置管理 — Nacos Config

### 5.1 存在意义

| 痛点 | Nacos Config 解决方案 |
|------|----------------------|
| 多服务相同配置重复写 | **配置共享**：多服务读同一份配置 |
| 修改配置需重启服务 | **配置热更新**：运行中动态生效 |
| 不同环境配置混乱 | 通过 Namespace + Group 隔离 |

### 5.2 引入依赖

```xml
<!--Nacos 配置中心-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<!--引导上下文，用于在应用启动前加载 Nacos 配置-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```

### 5.3 bootstrap.yml vs application.yml

| 对比项 | bootstrap.yml | application.yml |
|-------|---------------|-----------------|
| 加载时机 | **应用启动前**（引导阶段） | 应用启动时 |
| 用途 | 连接配置中心、加密密钥等 | 业务配置 |
| 优先级 | 低（被 application.yml 覆盖） | 高 |

```yaml
# bootstrap.yml — 拉取 Nacos 共享配置
spring:
  application:
    name: user-service
  profiles:
    active: dev
  cloud:
    nacos:
      server-addr: localhost:8848
      config:
        file-extension: yaml
        shared-configs:
          - data-id: shared-jdbc.yaml      # 数据库共享配置
            group: DEFAULT_GROUP
            refresh: true
          - data-id: shared-redis.yaml     # Redis 共享配置
            group: DEFAULT_GROUP
            refresh: true
        # 服务自己的配置：user-service-dev.yaml（自动识别）
```

### 5.4 配置热更新

在需要热更新的配置属性对应的 Bean 上添加注解：

```java
// 方式一：@RefreshScope（整个 Bean 刷新）
@Component
@RefreshScope
public class CartProperties {
    @Value("${cart.max-amount:100}")
    private Integer maxAmount;
}

// 方式二：@ConfigurationProperties（推荐，更安全）
@Component
@ConfigurationProperties(prefix = "cart")
@Data
public class CartProperties {
    private Integer maxAmount = 100;
    // Nacos 中配置变更后自动刷新，无需 @RefreshScope
}
```

### 5.5 动态路由

网关路由规则也可存放在 Nacos 中，实现不重启网关动态更新路由：

```java
@Component
@RequiredArgsConstructor
public class DynamicRouteLoader implements ApplicationRunner {

    private final RouteDefinitionWriter writer;
    private final NacosConfigManager nacosConfigManager;

    private static final String DATA_ID = "gateway-routes.json";
    private static final String GROUP = "DEFAULT_GROUP";

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 首次拉取
        loadRoutes();
        // 监听变化
        nacosConfigManager.getConfigService().addListener(DATA_ID, GROUP,
            new Listener() {
                @Override
                public void receiveConfigInfo(String configInfo) {
                    loadRoutes();
                }
                @Override
                public Executor getExecutor() { return null; }
            });
    }

    private void loadRoutes() {
        // 解析 JSON 并注册路由定义
        // ...
    }
}
```

---

## 6. 微服务保护 — Sentinel

### 6.1 雪崩问题（Cascading Failure）

```
服务 D 宕机 → 线程在 C 中堆积等待 D → C 也耗尽线程 → B 也... → 整个系统崩溃
```

**四种保护手段：**

| 手段 | 场景 | 工具 |
|------|------|------|
| **请求限流** | 预防流量激增 | Sentinel 流控规则 |
| **线程隔离** | 避免故障服务拖垮调用方 | Sentinel 隔离 / Hystrix 舱壁模式 |
| **服务熔断** | 异常比例过高时快速失败 | Sentinel 断路器 |
| **Fallback** | 降级时的兜底逻辑 | FallbackFactory |

### 6.2 引入 Sentinel

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8090   # Sentinel 控制台地址
      eager: true                  # 提前初始化，避免首次请求看不到资源
```

**启动 Sentinel 控制台：**

```bash
java -Dserver.port=8090 \
     -Dcsp.sentinel.dashboard.server=localhost:8090 \
     -Dproject.name=sentinel-dashboard \
     -jar sentinel-dashboard.jar
```

### 6.3 请求限流（流控）

流控规则在 Sentinel 控制台中配置，核心参数：

| 参数 | 说明 |
|------|------|
| QPS（Queries Per Second） | 每秒请求数阈值 |
| 并发线程数 | 同时处理的线程数阈值 |
| 流控模式 | 直接 / 关联 / 链路 |
| 流控效果 | 快速失败 / 排队等待（匀速） / 预热 |

**排队等待（漏桶算法）适合削峰填谷场景。**

### 6.4 线程隔离

Sentinel 采用**信号量隔离**（非线程池隔离），资源开销小：

在控制台对某个簇点资源配置「并发线程数」流控，超出阈值的请求直接走 Fallback，不会无限堆积。

> **簇点资源名称重复问题：** 当不同路径的 OpenFeign 调用映射到相同方法时，Sentinel 的簇点链路会出现重名，需保证 `requestUri` 唯一或通过注解自定义资源名。

### 6.5 Fallback（降级兜底）

让 OpenFeign 调用纳入 Sentinel 管理，并编写降级逻辑：

```yaml
feign:
  sentinel:
    enabled: true
```

```java
// 1. 实现 FallbackFactory
@Component
public class UserClientFallbackFactory implements FallbackFactory<UserClient> {

    @Override
    public UserClient create(Throwable cause) {
        log.error("UserClient 调用失败", cause);
        return new UserClient() {
            @Override
            public User getUserById(Long id) {
                // 返回默认值或空对象，避免 NPE
                return User.builder().id(id).name("未知用户").build();
            }
        };
    }
}
```

```java
// 2. 在 FeignClient 中引用 Factory
@FeignClient(value = "user-service", fallbackFactory = UserClientFallbackFactory.class)
public interface UserClient {
    @GetMapping("/api/users/{id}")
    User getUserById(@PathVariable("id") Long id);
}
```

```java
// 3. 将 Factory 注册为 Bean（若在 hm-api 模块中，需确保被扫描）
@Bean
public UserClientFallbackFactory userClientFallbackFactory() {
    return new UserClientFallbackFactory();
}
```

### 6.6 服务熔断（断路器）

Sentinel 断路器基于三种状态机：

```
正常 ──────────────────────────────────────────► Closed（关闭，正常请求）
                      ↓ 异常比例/慢调用比例超阈值
              Open（打开，快速失败，不再调用下游）
                      ↓ 熔断时长结束
             Half-Open（半开，放一个探测请求）
                ↓ 成功                ↓ 失败
             Closed                 Open
```

**在控制台配置熔断规则：**
- **慢调用比例：** RT 超过阈值的请求占比触发熔断
- **异常比例：** 异常请求占总请求比例触发熔断
- **异常数：** 统计窗口内异常数超阈值触发熔断

### 6.7 Tomcat 线程数配置

配合 Sentinel 线程隔离，合理控制 Tomcat 线程池大小：

```yaml
server:
  port: 8082
  tomcat:
    threads:
      max: 25           # 最大工作线程数
      min-spare: 5      # 最小空闲线程数
    accept-count: 25    # 等待队列大小
    max-connections: 100
```

---

## 7. 分布式事务 — Seata

### 7.1 问题背景

```
订单服务（扣库存）→ 库存服务（扣库存）→ 积分服务（加积分）
```

三个操作跨三个数据库，本地 `@Transactional` 只能保证单个数据库的原子性，微服务架构中需要**分布式事务**保证跨服务的一致性。

**分布式事务核心概念：**
- **全局事务（Global Transaction）：** 跨多个服务/数据库的一次完整业务操作
- **分支事务（Branch Transaction）：** 全局事务中每个服务内的本地事务
- **TC（Transaction Coordinator）：** 事务协调者，维护全局和分支事务状态
- **TM（Transaction Manager）：** 事务发起方，定义全局事务的开始和结束
- **RM（Resource Manager）：** 各微服务，管理分支事务

### 7.2 Seata 部署（Docker）

**第一步：准备 TC 存储的数据库表**

```sql
CREATE DATABASE IF NOT EXISTS `seata`;
USE `seata`;

CREATE TABLE IF NOT EXISTS `global_table` (
    `xid` VARCHAR(128) NOT NULL,
    `transaction_id` BIGINT,
    `status` TINYINT NOT NULL,
    `application_id` VARCHAR(32),
    `transaction_service_group` VARCHAR(32),
    `transaction_name` VARCHAR(128),
    `timeout` INT,
    `begin_time` BIGINT,
    `application_data` VARCHAR(2000),
    `gmt_create` DATETIME,
    `gmt_modified` DATETIME,
    PRIMARY KEY (`xid`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- branch_table、lock_table、distributed_lock 同理（见官方文档）
```

**第二步：启动 Seata Server**

```bash
docker run --name seata \
  -p 8099:8099 \
  -p 7099:7099 \
  -e SEATA_IP=192.168.184.129 \
  -v ./seata:/seata-server/resources \
  --privileged=true \
  --network testNet \
  -d seataio/seata-server:1.5.2
```

- `7099`：Web 控制台
- `8099`：微服务注册端口

### 7.3 微服务集成 Seata

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
</dependency>
```

```yaml
seata:
  registry:
    type: nacos
    nacos:
      server-addr: localhost:8848
      namespace: ""
      group: DEFAULT_GROUP
      application: seata-server   # Seata Server 在 Nacos 中的服务名
  tx-service-group: hmall         # 事务组名称
  service:
    vgroup-mapping:
      hmall: default              # 事务组 → 集群映射
  data-source-proxy-mode: AT      # AT 模式（默认）
```

**事务发起方加注解：**

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    @GlobalTransactional(name = "create-order", rollbackFor = Exception.class)
    public void createOrder(OrderDTO dto) {
        // 1. 扣减库存（远程调用 → Seata RM 注册分支事务）
        itemClient.deductStock(dto.getItemId(), dto.getNum());
        // 2. 扣减余额（远程调用 → Seata RM 注册分支事务）
        userClient.deductBalance(dto.getUserId(), dto.getAmount());
        // 3. 创建订单（本地操作 → Seata RM 注册分支事务）
        save(buildOrder(dto));
    }
}
```

### 7.4 XA 模式 vs AT 模式

#### XA 模式

```
一阶段：TM 通知各 RM 执行 SQL 但不提交 → 锁定资源
二阶段：所有分支成功 → TM 通知提交；任一失败 → TM 通知全部回滚
```

```yaml
seata:
  data-source-proxy-mode: XA
```

```java
// 开启 XA 支持
@Bean
@ConfigurationProperties(prefix = "spring.datasource")
public DataSource dataSource(DruidDataSourceWrapper druidDataSourceWrapper) {
    return new DataSourceProxyXA(druidDataSourceWrapper);
}
```

**特点：**
- ✅ **强一致性**（二阶段结束前数据不可见）
- ❌ 资源锁定时间长，吞吐量低

#### AT 模式（推荐）

```
一阶段：记录 undo log（快照）→ 直接提交本地事务（释放锁）
二阶段成功：删除 undo log
二阶段失败：通过 undo log 反向补偿回滚
```

**每个参与 AT 模式的数据库需要创建 undo_log 表：**

```sql
CREATE TABLE IF NOT EXISTS `undo_log` (
    `branch_id`     BIGINT NOT NULL COMMENT 'branch transaction id',
    `xid`           VARCHAR(128) NOT NULL COMMENT 'global transaction id',
    `context`       VARCHAR(128) NOT NULL COMMENT 'serialization',
    `rollback_info` LONGBLOB NOT NULL COMMENT 'rollback info',
    `log_status`    INT(11) NOT NULL COMMENT '0:normal,1:defense',
    `log_created`   DATETIME(6) NOT NULL,
    `log_modified`  DATETIME(6) NOT NULL,
    UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;
```

**特点：**
- ✅ 吞吐量高（一阶段即释放锁）
- ⚠️ **最终一致性**（存在短暂数据不一致窗口）

#### 两种模式对比

| 对比项 | XA | AT |
|-------|----|----|
| 一致性 | 强一致 | 最终一致 |
| 锁粒度 | 数据库锁（长时间） | 行锁（短时间） |
| 性能 | 低 | 高 |
| 适用场景 | 金融核心交易 | 电商、一般业务 |

### 7.5 @GlobalTransactional vs @Transactional

| 注解 | 范围 | 协调者 |
|------|------|--------|
| `@Transactional` | 单个服务的本地事务 | 本地数据库 |
| `@GlobalTransactional` | 跨服务的全局事务 | Seata TC |

两者可以共存：`@GlobalTransactional` 在 TM 侧控制全局，`@Transactional` 在 RM 侧控制本地。

---

## 8. 消息队列 — RabbitMQ

### 8.1 同步调用 vs 异步调用

| 对比项 | 同步（OpenFeign） | 异步（MQ） |
|-------|-----------------|----------|
| 耦合度 | 高（强依赖对方可用性） | 低（通过 Broker 解耦） |
| 性能 | 串行，吞吐低 | 并行，吞吐高 |
| 可靠性 | 调用方等待响应 | 消息持久化，可重试 |
| 适用场景 | 核心业务（需要即时结果） | 边缘业务（日志、通知、积分） |

### 8.2 RabbitMQ 核心概念

```
Publisher → Exchange → [Binding] → Queue → Consumer
```

| 概念 | 说明 |
|------|------|
| **Publisher** | 消息发送方 |
| **Exchange** | 交换机，负责路由 |
| **Queue** | 消息队列，消息存储 |
| **Consumer** | 消息消费方 |
| **Virtual Host** | 虚拟主机，数据隔离单元 |
| **Binding Key** | 队列绑定到交换机的规则 |

### 8.3 Spring AMQP 快速上手

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    virtual-host: /hmall
    username: hmall
    password: 123456
```

**发送消息：**

```java
@Service
@RequiredArgsConstructor
public class PayService {
    private final RabbitTemplate rabbitTemplate;

    public void notifyPaySuccess(Long orderId) {
        rabbitTemplate.convertAndSend(
            "pay.direct",     // exchange
            "pay.success",    // routing key
            orderId           // message body（使用 JSON 转换器时会自动序列化）
        );
    }
}
```

**消费消息：**

```java
@Component
@Slf4j
public class PayMessageListener {

    @RabbitListener(queues = "pay.queue")
    public void onPaySuccess(Long orderId) {
        log.info("收到支付成功消息，订单 ID: {}", orderId);
        // 更新订单状态
    }
}
```

### 8.4 三种交换机类型

#### FanoutExchange（广播）

```java
// 声明方式（Consumer 侧）
@Bean
public FanoutExchange fanoutExchange() {
    return new FanoutExchange("hmall.fanout");
}

@Bean
public Queue fanoutQueue1() {
    return QueueBuilder.durable("fanout.queue1").build();
}

@Bean
public Binding binding1(Queue fanoutQueue1, FanoutExchange fanoutExchange) {
    return BindingBuilder.bind(fanoutQueue1).to(fanoutExchange);
}
```

#### DirectExchange（定向路由）

```java
// 基于注解声明（更简洁，推荐）
@RabbitListener(bindings = @QueueBinding(
    value = @Queue(name = "direct.queue1", durable = "true"),
    exchange = @Exchange(name = "hmall.direct", type = ExchangeTypes.DIRECT),
    key = {"red", "blue"}
))
public void listenDirectQueue1(String message) {
    log.info("direct.queue1 收到消息: {}", message);
}
```

#### TopicExchange（主题路由，通配符）

| 通配符 | 含义 |
|-------|------|
| `*` | 匹配一个单词 |
| `#` | 匹配零个或多个单词 |

```java
@RabbitListener(bindings = @QueueBinding(
    value = @Queue(name = "topic.queue1", durable = "true"),
    exchange = @Exchange(name = "hmall.topic", type = ExchangeTypes.TOPIC),
    key = "china.#"   // 匹配所有以 china. 开头的 routing key
))
public void listenTopicQueue1(String message) {
    log.info("topic.queue1 收到消息: {}", message);
}
```

### 8.5 消息转换器（JSON）

默认使用 JDK 序列化：**安全性差、体积大、可读性差**。推荐替换为 Jackson JSON：

```xml
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
</dependency>
```

```java
// Publisher 和 Consumer 都需要配置
@Bean
public MessageConverter jacksonMessageConverter() {
    Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
    converter.setCreateMessageIds(true); // 自动生成消息 ID，用于幂等判断
    return converter;
}
```

### 8.6 消费者消息推送限制（预取计数）

默认 RabbitMQ 将所有消息均匀分配给消费者，不考虑消费者的处理能力。

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1   # 同一时刻最多投递 1 条消息给消费者，处理完才能接收下一条
```

> **效果：** 处理快的消费者会自动处理更多消息（能者多劳），避免消息堆积。

### 8.7 消息可靠性保障

#### 发送者确认机制

```yaml
spring:
  rabbitmq:
    publisher-confirm-type: correlated  # 异步回调确认（推荐）
    publisher-returns: true             # 开启路由失败回调
    template:
      mandatory: true
```

```java
@PostConstruct  // Bean 初始化后执行
public void init() {
    // 路由失败时回调（消息到达 Exchange 但未路由到 Queue）
    rabbitTemplate.setReturnsCallback(returnedMessage -> {
        log.error("消息路由失败: exchange={}, routingKey={}, message={}",
            returnedMessage.getExchange(),
            returnedMessage.getRoutingKey(),
            returnedMessage.getMessage());
        // 重新发送或记录日志
    });
}

public void sendWithConfirm(String exchange, String key, Object msg) {
    CorrelationData cd = new CorrelationData(UUID.randomUUID().toString());
    cd.getFuture().addCallback(
        confirm -> {
            if (confirm.isAck()) {
                log.info("消息成功到达 Exchange，ID: {}", cd.getId());
            } else {
                log.error("消息未到达 Exchange，原因: {}，ID: {}", confirm.getReason(), cd.getId());
                // 重发逻辑
            }
        },
        throwable -> log.error("消息发送异常", throwable)
    );
    rabbitTemplate.convertAndSend(exchange, key, msg, cd);
}
```

**什么时候可以确认消息发送到了队列？**
1. `ConfirmCallback.onSuccess` 收到 `ACK` → 消息已到达 Exchange
2. `ReturnsCallback` **没有**被触发 → 消息路由到 Queue 成功

#### MQ 数据持久化

```java
// 交换机持久化（默认 durable=true）
@Bean
public DirectExchange payExchange() {
    return ExchangeBuilder.directExchange("pay.direct").durable(true).build();
}

// 队列持久化
@Bean
public Queue payQueue() {
    return QueueBuilder.durable("pay.queue").build();
}
```

```java
// 消息持久化（Spring AMQP 默认 persistent）
rabbitTemplate.convertAndSend(exchange, key, msg, message -> {
    message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
    return message;
});
```

#### 惰性队列（Lazy Queue）

将消息直接写入磁盘而非内存，适合消息堆积场景：

```java
// Bean 方式
@Bean
public Queue lazyQueue() {
    return QueueBuilder.durable("lazy.queue")
        .lazy()   // 设置为惰性队列
        .build();
}

// 注解方式
@RabbitListener(bindings = @QueueBinding(
    value = @Queue(
        name = "lazy.queue",
        durable = "true",
        arguments = @Argument(name = "x-queue-mode", value = "lazy")
    ),
    ...
))
```

### 8.8 消费者可靠性

#### 消费者确认机制

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: auto  # 推荐：环绕增强，自动 ack/nack
        # none：立即 ack，不安全
        # manual：手动 ack，灵活但代码侵入性强
```

`auto` 模式下：
- 方法正常执行 → 自动 `ack`
- 抛出异常 → 自动 `nack`，消息重新入队
- 抛出 `AmqpRejectAndDontRequeueException` → 直接丢弃

#### 失败重试策略

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          enabled: true
          initial-interval: 1000ms  # 初始重试间隔
          multiplier: 1.0           # 间隔倍数
          max-attempts: 3           # 最大重试次数
          stateless: true           # 无状态重试
```

**重试耗尽后的处理策略：**

```java
@Bean
public MessageRecoverer republishMessageRecoverer(RabbitTemplate rabbitTemplate) {
    // 推荐：重试耗尽后将失败消息投递到指定"死信交换机"
    return new RepublishMessageRecoverer(rabbitTemplate, "error.direct", "error");
}
```

| 策略 | 说明 |
|------|------|
| `RejectAndDontRequeueRecover` | 直接丢弃（默认） |
| `ImmediateRequeueMessageRecover` | 重新入队（可能导致死循环） |
| `RepublishMessageRecover` | 发送到错误队列（推荐） |

### 8.9 业务幂等性

由于消息可能被重复消费，业务逻辑需要保证幂等性：

```java
@RabbitListener(queues = "pay.queue")
public void onPaySuccess(Message message) {
    String msgId = message.getMessageProperties().getMessageId();

    // 方式一：利用消息 ID + Redis 去重
    Boolean isFirst = redisTemplate.opsForValue()
        .setIfAbsent("pay:msg:" + msgId, "1", 30, TimeUnit.MINUTES);
    if (Boolean.FALSE.equals(isFirst)) {
        log.warn("重复消息，忽略: {}", msgId);
        return;
    }

    Long orderId = (Long) rabbitTemplate.getMessageConverter().fromMessage(message);

    // 方式二：业务状态判断
    Order order = orderService.getById(orderId);
    if (order.getStatus() != OrderStatus.UNPAID) {
        log.warn("订单状态已更新，忽略重复消息: {}", orderId);
        return;
    }

    orderService.updateStatus(orderId, OrderStatus.PAID);
}
```

### 8.10 延迟消息

#### 方式一：死信交换机（TTL + DLX）

```java
@Bean
public Queue ttlQueue() {
    return QueueBuilder.durable("ttl.queue")
        .ttl(30000)                          // 消息存活 30 秒
        .deadLetterExchange("dlx.direct")    // 过期后转发到死信交换机
        .deadLetterRoutingKey("dlx.order")
        .build();
}
```

> ⚠️ 缺点：队列头部消息未过期会阻塞后续消息，即使后续消息已过期。

#### 方式二：RabbitMQ 延迟消息插件（推荐）

安装 `rabbitmq_delayed_message_exchange` 插件后：

```java
@Bean
public DirectExchange delayedExchange() {
    return ExchangeBuilder.directExchange("delayed.exchange")
        .delayed()   // 声明为延迟交换机
        .durable(true)
        .build();
}

// 发送时指定延迟时间
rabbitTemplate.convertAndSend("delayed.exchange", "delay.key", orderId, message -> {
    message.getMessageProperties().setDelayLong(30 * 60 * 1000L); // 延迟 30 分钟
    return message;
});
```

### 8.11 面试高频题

**Q：如何保证支付服务与交易服务之间的订单状态一致性？**

> 1. 支付成功后，支付服务通过 MQ 发送消息通知交易服务同步订单状态
> 2. 可靠性保障：生产者确认（ConfirmCallback + ReturnCallback）+ 消费者确认（auto 模式）+ 消费者失败重试 + MQ 持久化（交换机/队列/消息）
> 3. 幂等性保障：交易服务更新订单前先判断当前状态，防止重复消费导致异常

**Q：如果交易服务消息处理失败，有没有兜底方案？**

> 1. **MQ 侧：** 失败重试 + `RepublishMessageRecoverer` 将失败消息投递到错误队列，人工或定时任务处理
> 2. **业务侧：** 定时任务扫描长时间未支付/状态未同步的订单，主动向支付服务查询支付结果（补偿机制）
> 3. **监控侧：** 对错误队列和消费延迟配置告警

---

## 总结

| 问题 | 解决方案 |
|------|---------|
| 微服务之间 HTTP 调用繁琐 | **OpenFeign** |
| 服务实例动态变化，无法硬编码地址 | **Nacos 注册中心** |
| 各微服务各自鉴权，重复逻辑 | **Spring Cloud Gateway** |
| 配置分散，修改需重启 | **Nacos Config** |
| 服务雪崩 / 流量激增 | **Sentinel** |
| 跨服务数据一致性 | **Seata** |
| 服务间强耦合、同步调用性能差 | **RabbitMQ** |