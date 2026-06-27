+++
date = '2026-06-26T09:51:37+08:00'
draft = true
title = 'Spring Boot 常用代码片段'
categories = ["未分类"]
tags = [""]
[cover]
  image = "https://devtool.tech/api/placeholder/600/199?text=Spring Boot 常用代码片段🐱&color=black&fontSize=30&fontFamily=%E5%BE%AE%E8%BD%AF%E9%9B%85%E9%BB%91"
+++

# 通用

## 启动类
```java
@MapperScan("asia.liminality.user.mapper")
@SpringBootApplication
@Slf4j
public class UserApplication {
    public static void main(String[] args) throws UnknownHostException {
        ConfigurableApplicationContext app = SpringApplication.run(UserApplication.class, args);
        Environment env = app.getEnvironment();
        String protocol = "http";
        if (env.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }
        log.info("--/\n---------------------------------------------------------------------------------------\n\t" +
                        "Application '{}' is running! Access URLs:\n\t" +
                        "Local: \t\t{}://localhost:{}\n\t" +
                        "External: \t{}://{}:{}\n\t" +
                        "Profile(s): \t{}" +
                        "\n---------------------------------------------------------------------------------------",
                env.getProperty("spring.application.name"),
                protocol,
                env.getProperty("server.port"),
                protocol,
                InetAddress.getLocalHost().getHostAddress(),
                env.getProperty("server.port"),
                env.getActiveProfiles());

    }
}
```

## domain
### DTO
#### Result
```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }

    public static <T> Result<T> failure(String message) {
        return new Result<>(500, message, null);
    }

    public static <T> Result<T> failure(int code, String message) {
        return new Result<>(code, message, null);
    }

    public static <T> Result<T> failure(String message, T data) {
        return new Result<>(500, message, data);
    }
}
```

# Spring Cloud Gateway
## AuthGlobalFilter
```java
@Slf4j
@RequiredArgsConstructor
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    private static final List<String> WHITE_LIST = List.of(
            "/auth/user/login",
            "/auth/user/register"
    );

    // 判断是否在白名单内
    private boolean isWhiteList(String path){
        return WHITE_LIST.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> reject(ServerWebExchange exchange){
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        ServerHttpRequest request = exchange.getRequest();

        String path = request.getPath().toString();

        if (isWhiteList(path)) {
            return chain.filter(exchange);
        }

        String token = request.getHeaders().getFirst("Authorization");

        // 令牌为空，拒绝访问
        if( token == null || token.isEmpty() ){
            return reject( exchange );
        }

        // 验证令牌
        try {
            Integer userId = jwtUtil.parseToken(token);
            // TODO userId 塞入请求头
            log.info("🚪 塞入请求头");
        } catch (Exception e) {
            return reject(exchange);
        }

        return chain.filter( exchange );
    }

    // 过滤器优先级，越小越靠前
    @Override
    public int getOrder() {
        return -1;
    }
}
```