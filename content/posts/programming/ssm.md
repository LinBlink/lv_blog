+++
date = '2026-06-18T12:40:44+08:00'
draft = true
title = 'SSM框架 学习'
categories = ["编程"]
tags = ["学习笔记"]
+++

## 一、Spring IoC 容器

### 1.1 容器体系结构

```
BeanFactory（顶层接口）
    └── ApplicationContext（常用接口，扩展了BF）
            ├── ClassPathXmlApplicationContext（XML配置）
            ├── FileSystemXmlApplicationContext（文件路径XML）
            └── AnnotationConfigApplicationContext（注解配置）
```

**BeanFactory vs ApplicationContext 核心区别：**

| 特性 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| Bean 初始化时机 | **懒加载**（第一次 getBean 时） | **饿加载**（容器启动时） |
| 功能 | 基础 IoC | IoC + 事件发布 + 国际化 + AOP等 |
| 使用场景 | 资源极度受限的嵌入式 | 99% 的业务场景 |

> **ApplicationContext 为什么没有 close()？**  
> `ApplicationContext` 接口本身不定义 `close()`，是为了保持接口的通用性（不是所有容器都能/需要被关闭，如 Web 容器）。但其实现类 `AbstractApplicationContext` 实现了 `Closeable`，可以强转后调用，或用 `ConfigurableApplicationContext` 接口接收。

---

### 1.2 延迟加载（Lazy Loading）

```java
// 注解方式：@Lazy 让 Bean 在第一次被使用时才初始化
@Bean
@Lazy
public HeavyService heavyService() {
    return new HeavyService();
}

// XML方式：
// <bean id="heavyService" class="..." lazy-init="true"/>
```

> **适用场景**：初始化代价高、启动时不一定用到的 Bean（如某些连接池、第三方SDK客户端）。

---

### 1.3 依赖注入方式

#### 构造器注入（推荐）

```java
@Component
public class UserService {
    private final UserMapper userMapper;  // final 保证不可变

    // Spring 4.3+ 单构造器可省略 @Autowired
    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }
}
```

```xml
<!-- XML 构造器注入 -->
<bean id="userService" class="com.example.UserService">
    <!-- 引用类型 -->
    <constructor-arg name="userMapper" ref="userMapper"/>
    <!-- 简单类型 -->
    <constructor-arg name="maxRetry" value="3"/>
</bean>
```

#### Setter 注入

```java
@Component
public class OrderService {
    private UserService userService;

    // XML方式需要有 setter
    public void setUserService(UserService userService) {
        this.userService = userService;
    }
}
```

```xml
<!-- XML setter 注入 -->
<bean id="orderService" class="com.example.OrderService">
    <property name="userService" ref="userService"/>
    <property name="timeout" value="3000"/>
</bean>
```

#### 集合注入

```xml
<bean id="dataConfig" class="com.example.DataConfig">
    <!-- List -->
    <property name="servers">
        <list>
            <value>192.168.1.1</value>
            <value>192.168.1.2</value>
        </list>
    </property>
    <!-- Map -->
    <property name="params">
        <map>
            <entry key="timeout" value="3000"/>
            <entry key="retry" value="3"/>
        </map>
    </property>
    <!-- Properties -->
    <property name="jdbcProps">
        <props>
            <prop key="url">jdbc:mysql://localhost:3306/db</prop>
        </props>
    </property>
</bean>
```

---

## 二、Spring 注解开发

### 2.1 核心注解速查

| 注解 | 作用 | 等价XML |
|------|------|---------|
| `@Component` | 通用Bean声明 | `<bean>` |
| `@Service` | Service层 | `<bean>` |
| `@Repository` | DAO层 | `<bean>` |
| `@Controller` | MVC控制层 | `<bean>` |
| `@Configuration` | 配置类 | `<beans>` |
| `@ComponentScan` | 开启组件扫描 | `<context:component-scan>` |
| `@Bean` | 方法产生Bean | `<bean>` |
| `@Import` | 导入其他配置类 | `<import>` |
| `@Scope("prototype")` | 作用范围 | `scope="prototype"` |

### 2.2 Bean 生命周期回调

```java
@Component
public class CacheService {

    @PostConstruct          // Bean 初始化完成（属性注入后）执行
    public void init() {
        System.out.println("缓存预热中...");
        // 连接 Redis, 加载热点数据
    }

    @PreDestroy             // Bean 销毁前执行（容器关闭时）
    public void destroy() {
        System.out.println("清理缓存连接...");
        // 释放连接资源
    }
}
```

> ⚠️ `@PreDestroy` 在 **prototype** 作用域的 Bean 上**不会触发**，容器不追踪 prototype Bean 的生命周期。

---

### 2.3 依赖注入注解

```java
@Service
public class UserService {

    // @Autowired：按类型注入（Type）
    // 如果同类型有多个Bean，再按字段名匹配
    @Autowired
    private UserMapper userMapper;

    // @Qualifier：指定注入哪个 Bean（当同类型有多个时必须加）
    @Autowired
    @Qualifier("mysqlUserMapper")
    private UserMapper specificMapper;

    // @Value：注入简单值或 SpEL 表达式
    @Value("${app.timeout:5000}")  // 读取配置，默认值5000
    private int timeout;

    @Value("#{systemProperties['os.name']}")  // SpEL表达式
    private String osName;
}
```

**`@Value` 读取 `.properties` 文件的前提步骤：**

```java
// 1. 在配置类上添加 @PropertySource
@Configuration
@ComponentScan("com.example")
@PropertySource("classpath:application.properties")  // 不支持通配符！
// 多文件写法：
// @PropertySource({"classpath:db.properties", "classpath:app.properties"})
public class SpringConfig { }

// 2. 然后才能在 Bean 中使用 @Value 读取
@Value("${jdbc.url}")
private String jdbcUrl;
```

> ⚠️ `@PropertySource` **不支持通配符**（如 `classpath*:*.properties`），需要逐一列出文件路径。

---

### 2.4 第三方 Bean 管理

**推荐方式：`@Configuration` + `@Import`**

```java
// 数据源配置类
@Configuration
public class JdbcConfig {

    @Value("${jdbc.url}")
    private String url;

    @Value("${jdbc.username}")
    private String username;

    @Value("${jdbc.password}")
    private String password;

    // 引用类型注入：直接在方法参数上声明，Spring 自动注入
    @Bean
    public DataSource dataSource() {
        DruidDataSource ds = new DruidDataSource();
        ds.setUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        return ds;
    }
}

// 主配置类：用 @Import 聚合，不用 @ComponentScan 扫描配置类
@Configuration
@ComponentScan("com.example")
@PropertySource("classpath:application.properties")
@Import({JdbcConfig.class, MyBatisConfig.class})  // 推荐
public class SpringConfig { }
```

**为什么推荐 `@Import` 而非扫描式？**
> 扫描式（让 `@Configuration` 类落在 `@ComponentScan` 包内）会让所有配置类都被"顺带"扫描进来，管理混乱。`@Import` 明确声明依赖关系，一目了然。

---

### 2.5 整合 MyBatis 完整配置

```java
@Configuration
public class MyBatisConfig {

    // DataSource 会从 Spring 容器自动注入（方法参数注入）
    @Bean
    public SqlSessionFactoryBean sqlSessionFactory(DataSource dataSource) {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        // 设置 MyBatis 全局配置（可选）
        // factory.setConfigLocation(new ClassPathResource("mybatis-config.xml"));
        // 开启驼峰命名转换
        org.apache.ibatis.session.Configuration config =
            new org.apache.ibatis.session.Configuration();
        config.setMapUnderscoreToCamelCase(true);
        factory.setConfiguration(config);
        return factory;
    }

    @Bean
    public MapperScannerConfigurer mapperScannerConfigurer() {
        MapperScannerConfigurer msc = new MapperScannerConfigurer();
        // 扫描 Mapper 接口所在包，自动生成代理对象注册到容器
        msc.setBasePackage("com.example.mapper");
        return msc;
    }
}
```

---

### 2.6 整合 JUnit 5（现代写法）

```java
// JUnit 4 写法（老项目）
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = SpringConfig.class)
public class UserServiceTest {
    @Autowired
    private UserService userService;

    @Test
    public void testFind() { /* ... */ }
}

// JUnit 5 写法（推荐，SpringBoot 默认）
@SpringJUnitConfig(classes = SpringConfig.class)
// 等价于 @ExtendWith(SpringExtension.class) + @ContextConfiguration
public class UserServiceTest {
    @Autowired
    private UserService userService;

    @Test
    void testFind() { /* ... */ }
}
```

---

## 三、Spring AOP

### 3.1 核心概念

```
连接点（JoinPoint）  → 程序执行的"任意可能位置"（所有方法都是连接点）
切入点（Pointcut）   → 实际被拦截的方法（连接点的子集）
通知（Advice）       → 切入点位置要执行的增强逻辑
切面（Aspect）       → 切入点 + 通知的组合（通知类）
织入（Weaving）      → 将切面应用到目标对象的过程

类比 Python 装饰器：
  @around_advice        ← 通知
  def save_user():      ← 切入点（被装饰的函数）
      pass
```

**连接点 vs 切入点区别：**
> 连接点是"理论上可以拦截的所有方法"，切入点是"你实际配置要拦截的方法"。所有切入点都是连接点，但连接点不一定是切入点。

---

### 3.2 切入点表达式

```java
// 语法：execution(访问修饰符? 返回值类型 包名.类名?.方法名(参数) 异常?)
// ? 表示可省略

// 精确匹配
@Pointcut("execution(void com.example.service.UserService.save())")

// 匹配某个类的所有方法
@Pointcut("execution(* com.example.service.UserService.*(..))")
//                   ^返回值任意  ^方法名任意  ^参数任意

// 匹配某个包下所有类的所有方法（不含子包）
@Pointcut("execution(* com.example.service.*.*(..))")

// 匹配某个包及子包下所有类的所有方法
@Pointcut("execution(* com.example.service..*.*(..))")
//                                           ^^ 双点表示含子包

// 实际项目常用写法：拦截 service 层所有方法
@Pointcut("execution(* com.example.service.impl.*.*(..))")
```

---

### 3.3 通知类型完整示例

```java
@Aspect
@Component
public class LogAspect {

    // 定义可复用的切入点
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void serviceMethods() {}

    // 前置通知：方法执行前
    @Before("serviceMethods()")
    public void before(JoinPoint jp) {
        System.out.println("方法开始：" + jp.getSignature().getName());
        Object[] args = jp.getArgs();  // 获取参数
        System.out.println("参数：" + Arrays.toString(args));
    }

    // 后置通知：方法执行后（无论是否异常）
    @After("serviceMethods()")
    public void after(JoinPoint jp) {
        System.out.println("方法结束：" + jp.getSignature().getName());
    }

    // 返回后通知：方法正常返回后（有异常不执行）
    @AfterReturning(value = "serviceMethods()", returning = "result")
    public void afterReturning(JoinPoint jp, Object result) {
        System.out.println("返回值：" + result);
    }

    // 异常通知：方法抛出异常后
    @AfterThrowing(value = "serviceMethods()", throwing = "ex")
    public void afterThrowing(JoinPoint jp, Exception ex) {
        System.out.println("异常：" + ex.getMessage());
        // 可在此发送告警通知
    }

    // 环绕通知：最强大，可控制是否执行原方法
    @Around("serviceMethods()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        // 获取方法签名
        String methodName = pjp.getSignature().getName();
        Object[] args = pjp.getArgs();

        long start = System.currentTimeMillis();
        try {
            // 执行原方法（不调用则原方法不执行）
            Object result = pjp.proceed();
            long cost = System.currentTimeMillis() - start;
            System.out.printf("[%s] 耗时: %dms%n", methodName, cost);
            return result;
        } catch (Throwable e) {
            System.out.println("[" + methodName + "] 异常: " + e.getMessage());
            throw e;  // 一定要重新抛出，否则异常被吞掉
        }
    }
}
```

**通知执行顺序（正常情况）：**
```
Around(前) → Before → 目标方法 → Around(后) → AfterReturning → After
```
**通知执行顺序（异常情况）：**
```
Around(前) → Before → 目标方法(抛异常) → AfterThrowing → After
```

---

### 3.4 AOP 底层代理机制

```java
// Spring AOP 两种代理方式：
// 1. JDK 动态代理：目标类实现了接口 → 代理接口
// 2. CGLIB 代理：目标类没有接口 → 继承目标类生成子类

// Spring Boot 默认使用 CGLIB（无论是否有接口）
// 原因：避免"必须面向接口"的约束，使用更灵活

// CGLIB 注意：
// final 类/方法无法被 CGLIB 代理（无法继承/重写）
```

---

## 四、Spring 事务

### 4.1 基本使用

```java
// 1. 配置事务管理器（整合MyBatis时用DataSourceTransactionManager）
@Bean
public PlatformTransactionManager transactionManager(DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
}

// 2. 开启事务注解支持
@Configuration
@EnableTransactionManagement  // 开启 @Transactional 注解支持
public class SpringConfig { }

// 3. 在 Service 方法上使用
@Service
public class AccountService {

    // 写在接口上：降低耦合（推荐），实现类自动继承
    // 写在实现类上：更明确，但耦合接口实现
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        accountMapper.deduct(fromId, amount);
        // 如果这里抛出异常，上面的 deduct 会自动回滚
        accountMapper.add(toId, amount);
    }
}
```

---

### 4.2 事务传播行为

**场景：A 方法（事务管理员）调用 B 方法（事务协调员）**

| 传播行为 | 说明 | 场景 |
|----------|------|------|
| **REQUIRED**（默认） | 有事务就加入，没有就新建 | 99% 场景 |
| **REQUIRES_NEW** | 无论如何都新建独立事务，与调用方事务隔离 | 日志记录（主流程回滚，日志仍要保存） |
| `SUPPORTS` | 有事务就加入，没有就不用事务执行 | 只读查询 |
| `NOT_SUPPORTED` | 不使用事务（挂起当前事务） | 不需要事务的操作 |
| `MANDATORY` | 必须在已有事务中执行，否则抛异常 | 强制要求调用方开启事务 |
| `NEVER` | 不能在事务中执行，否则抛异常 | - |
| `NESTED` | 在当前事务中创建保存点（嵌套事务） | 部分回滚 |

```java
@Service
public class OrderService {

    @Autowired
    private LogService logService;

    @Transactional
    public void createOrder(Order order) {
        orderMapper.insert(order);

        // 即使 createOrder 最终回滚，日志仍然写入成功
        logService.writeLog("创建订单: " + order.getId());

        // 模拟异常触发回滚
        if (order.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("金额不能为负");
        }
    }
}

@Service
public class LogService {

    // REQUIRES_NEW：开启独立事务，不受外层事务影响
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeLog(String message) {
        logMapper.insert(new Log(message, LocalDateTime.now()));
    }
}
```

---

### 4.3 @Transactional 注意事项

```java
// ❌ 错误：方法不是 public 的，@Transactional 不生效
@Transactional
private void internalTransfer() { }

// ❌ 错误：同一类内部调用，绕过代理，事务不生效
@Service
public class UserService {
    public void doA() {
        this.doB();  // 直接调用，不经过 AOP 代理！
    }

    @Transactional
    public void doB() { }
}

// ✅ 正确：注入自身代理（或通过 AopContext.currentProxy()）
@Service
public class UserService {
    @Autowired
    private UserService self;  // 注入代理对象

    public void doA() {
        self.doB();  // 通过代理调用，事务生效
    }
}

// ❌ 错误：异常被 catch 了，Spring 不知道要回滚
@Transactional
public void save(User user) {
    try {
        userMapper.insert(user);
    } catch (Exception e) {
        log.error("保存失败", e);
        // 没有 rethrow，事务不会回滚！
    }
}

// ✅ 正确：或者手动标记回滚
@Transactional
public void save(User user) {
    try {
        userMapper.insert(user);
    } catch (Exception e) {
        log.error("保存失败", e);
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    }
}
```

> ⚠️ **`@Transactional` 默认只回滚 `RuntimeException` 和 `Error`**，受检异常（`IOException` 等）不触发回滚。
> 需要回滚受检异常：`@Transactional(rollbackFor = Exception.class)`

---

## 五、SpringMVC

### 5.1 基本工作流程

```
HTTP请求
   ↓
DispatcherServlet（前端控制器，核心）
   ↓
HandlerMapping（根据URL找到对应的Controller方法）
   ↓
HandlerAdapter（调用Controller方法，处理参数绑定）
   ↓
Controller 方法执行 → 返回 ModelAndView 或 @ResponseBody 数据
   ↓
ViewResolver（解析视图名，@ResponseBody 跳过此步）
   ↓
渲染响应 → 返回给客户端
```

---

### 5.2 请求参数接收

```java
@RestController  // = @Controller + @ResponseBody
@RequestMapping("/users")
public class UserController {

    // 1. 普通参数：名称匹配自动绑定
    @GetMapping
    public List<User> list(String name, Integer age) { }

    // 2. POJO 参数：自动绑定同名字段
    @PostMapping
    public User create(UserCreateDTO dto) { }

    // 3. 数组参数：同名多个值
    @GetMapping("/batch")
    public List<User> batch(String[] ids) { }

    // 4. 集合参数：必须加 @RequestParam
    @GetMapping("/list")
    public List<User> list(@RequestParam List<String> ids) { }

    // 5. JSON 参数：必须加 @RequestBody，需要 jackson-databind
    @PostMapping("/json")
    public Result createFromJson(@RequestBody UserCreateDTO dto) { }

    // 6. 路径参数
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) { }

    // 7. 日期参数：指定格式
    @GetMapping("/born")
    public List<User> byBirth(
        @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate birthDate) { }
}
```

**三个参数注解的区别：**

| 注解 | 取值来源 | 典型场景 |
|------|----------|----------|
| `@RequestParam` | URL 查询参数（`?key=value`） | 分页参数、过滤条件 |
| `@RequestBody` | 请求体（JSON/XML） | POST/PUT 提交数据 |
| `@PathVariable` | URL 路径段（`/users/{id}`） | RESTful 资源ID |

---

### 5.3 表现层统一响应封装

```java
// 统一响应体
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private Integer code;     // 业务状态码
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> fail(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}

// Controller 使用
@GetMapping("/{id}")
public Result<User> getById(@PathVariable Long id) {
    User user = userService.getById(id);
    return Result.success(user);
}
```

---

### 5.4 全局异常处理

```java
// 自定义业务异常
public class BusinessException extends RuntimeException {
    private final Integer code;

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}

// 自定义系统异常
public class SystemException extends RuntimeException {
    private final Integer code;
    public SystemException(Integer code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}

// 全局异常处理器
@RestControllerAdvice  // = @ControllerAdvice + @ResponseBody
public class GlobalExceptionHandler {

    // 处理业务异常（预期内的，如参数校验失败、业务规则冲突）
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    // 处理系统异常（预期外的，如数据库连接失败）
    @ExceptionHandler(SystemException.class)
    public Result<Void> handleSystem(SystemException e) {
        log.error("系统异常: ", e);
        return Result.fail(500, "系统繁忙，请稍后重试");
    }

    // 处理所有未捕获异常（兜底）
    @ExceptionHandler(Exception.class)
    public Result<Void> handleAll(Exception e) {
        log.error("未知异常: ", e);
        return Result.fail(500, "服务器内部错误");
    }
}
```

---

### 5.5 拦截器（Interceptor）

#### 拦截器 vs 过滤器

| 对比项 | 拦截器（Interceptor） | 过滤器（Filter） |
|--------|----------------------|-----------------|
| 规范 | Spring MVC | Servlet |
| 作用范围 | Controller 请求 | 所有请求（包括静态资源） |
| 访问 Spring Bean | ✅ 可以 | ❌ 较难 |
| 粒度 | 更细（方法级别） | 较粗（URL级别） |
| 典型用途 | 登录检查、权限校验、日志 | 编码处理、跨域、限流 |

#### 拦截器实现

```java
// 1. 实现 HandlerInterceptor 接口
@Component
public class LoginInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    // 请求处理前：返回 false 则中断请求链
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {
        String token = request.getHeader("Authorization");
        if (token == null || !jwtUtil.verify(token)) {
            response.setStatus(401);
            response.getWriter().write("{\"code\":401,\"message\":\"请先登录\"}");
            return false;  // 中断，不再继续
        }
        return true;  // 放行
    }

    // 请求处理后（Controller执行后）：可修改ModelAndView
    @Override
    public void postHandle(HttpServletRequest req, HttpServletResponse res,
                           Object handler, ModelAndView mv) { }

    // 视图渲染完成后：用于资源清理
    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                Object handler, Exception ex) {
        // 清理 ThreadLocal 等资源
    }
}

// 2. 注册拦截器
@Configuration
public class WebConfig extends WebMvcConfigurationSupport {

    @Autowired
    private LoginInterceptor loginInterceptor;

    @Override
    protected void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/**")           // 拦截所有
                .excludePathPatterns(             // 放行
                    "/users/login",
                    "/users/register",
                    "/swagger-ui/**"
                );
    }
}
```

#### 多拦截器执行顺序

```
注册顺序：Interceptor1 → Interceptor2 → Interceptor3

正常执行：
pre1 → pre2 → pre3 → [Controller] → post3 → post2 → post1
                                  → after3 → after2 → after1

pre3 返回 false（pre3 之前的已执行）：
pre1 → pre2 → pre3(false) → after2 → after1
（注意：after 只执行 preHandle 返回 true 的拦截器）

pre2 返回 false：
pre1 → pre2(false) → after1

pre1 返回 false：
pre1(false) → （什么都不执行）
```

---

## 六、Maven 工程管理

### 6.1 依赖冲突解决规则

```
优先级（从高到低）：
1. 特殊优先：同一 pom.xml 中配置了相同依赖不同版本 → 后声明的覆盖先声明的
2. 路径优先：依赖传递路径短的优先
   A → B → C → log4j:1.1  （路径长度3）
   A → D → log4j:1.2       （路径长度2）  ← 优先使用 1.2
3. 声明优先：路径相同时，pom.xml 中先声明的 dependency 优先
```

**主动解决冲突：**

```xml
<!-- 方法1：排除传递依赖 -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.20</version>
    <exclusions>
        <exclusion>
            <!-- 排除 spring-core 带来的旧版 commons-logging -->
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 方法2：在父pom统一锁定版本（dependencyManagement） -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.2.15</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

---

### 6.2 依赖范围（scope）

| scope | 编译 | 测试 | 运行时 | 说明 |
|-------|------|------|--------|------|
| `compile`（默认） | ✅ | ✅ | ✅ | 全范围，会打包进jar/war |
| `test` | ❌ | ✅ | ❌ | 仅测试，如 JUnit |
| `provided` | ✅ | ✅ | ❌ | 运行时由容器提供，如 servlet-api |
| `runtime` | ❌ | ✅ | ✅ | 只运行时需要，如 JDBC 驱动 |

**`javax.servlet-api` 为什么必须用 `provided`？**
> Tomcat 容器本身已经包含了 Servlet API 的实现。如果打包进 war，会与 Tomcat 自带的版本冲突，导致 `ClassCastException` 或类加载错误。`provided` 表示"编译时需要，运行时由容器提供，打包时排除"。

---

### 6.3 继承与聚合

```xml
<!-- 父工程 pom.xml（packaging 必须是 pom） -->
<groupId>com.example</groupId>
<artifactId>parent</artifactId>
<version>1.0.0</version>
<packaging>pom</packaging>

<!-- 聚合：父工程管理多个子模块（mvn package 自动按序构建所有模块） -->
<modules>
    <module>common</module>
    <module>service</module>
    <module>web</module>
</modules>

<!-- 依赖管理：声明版本，子模块继承时不必写版本号 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.7.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

```xml
<!-- 子工程 pom.xml -->
<parent>
    <groupId>com.example</groupId>
    <artifactId>parent</artifactId>
    <version>1.0.0</version>
    <relativePath>../parent/pom.xml</relativePath>
</parent>

<artifactId>service</artifactId>
<!-- 无需写 groupId 和 version，继承自父工程 -->

<dependencies>
    <!-- 无需写版本，由父工程 dependencyManagement 管理 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

---

### 6.4 多环境配置

```xml
<!-- pom.xml 中定义 profiles -->
<profiles>
    <profile>
        <id>dev</id>
        <properties>
            <profile.active>dev</profile.active>
        </properties>
        <activation>
            <activeByDefault>true</activeByDefault>  <!-- 默认激活 -->
        </activation>
    </profile>
    <profile>
        <id>prod</id>
        <properties>
            <profile.active>prod</profile.active>
        </properties>
    </profile>
</profiles>
```

```bash
# 构建时指定环境
mvn package -P prod

# 跳过测试
mvn package -DskipTests
# 或
mvn package -Dmaven.test.skip=true  # 连编译测试代码都跳过
```

---

## 七、SSM 整合原理深挖

### 7.1 Spring 双容器架构（重点）

```
Tomcat 启动
    ↓
发现 AbstractAnnotationConfigDispatcherServletInitializer
    ↓
创建两个 Spring 容器（父子关系）：

┌─────────────────────────────────────────────────────┐
│  Root ApplicationContext（父容器）                    │
│  读取 SpringConfig                                   │
│  包含：Service, Mapper代理, DataSource, 事务管理器   │
│  职责：业务逻辑 + 数据访问层                          │
└─────────────────────────────────────────────────────┘
              ↑（子容器可以访问父容器，反之不行）
┌─────────────────────────────────────────────────────┐
│  Servlet ApplicationContext（子容器/MVC容器）         │
│  读取 SpringMvcConfig                                │
│  包含：Controller, ViewResolver, HandlerMapping      │
│  职责：接收 HTTP 请求，分发处理                        │
└─────────────────────────────────────────────────────┘
```

**为什么这样设计？**
> 层级隔离：Controller 可以注入 Service（子访问父），但 Service 不能注入 Controller（防止业务层与表现层耦合）。也支持不同协议共享同一个业务容器（如同时支持 HTTP + WebSocket）。

---

### 7.2 Bean 加载控制（防止重复扫描）

```java
// SpringConfig：只扫描非 Controller 的组件
@Configuration
@ComponentScan(value = "com.example",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ANNOTATION,
        classes = Controller.class
    )
)
public class SpringConfig { }

// SpringMvcConfig：只扫描 Controller
@Configuration
@ComponentScan("com.example.controller")
@EnableWebMvc
public class SpringMvcConfig { }
```

> ⚠️ 如果两个配置都扫描了相同的包，Service 会被创建两次（父容器一次，子容器一次），导致事务等 AOP 增强失效（因为子容器的 Service 没有经过父容器的事务代理）。

---

### 7.3 @EnableWebMvc 做了什么

```java
// @EnableWebMvc 本质：
// @Import(DelegatingWebMvcConfiguration.class)
// 它向容器注册了一套完整的 MVC 组件：

// 启用 @RequestMapping 路由映射
// 启用 @Controller / @ResponseBody 注解处理
// 启用 JSON 自动转换（需要 jackson-databind 在 classpath）
// 注册参数绑定转换器（@DateTimeFormat 等）
// 注册 DispatcherServlet 相关组件（HandlerAdapter 等）
// 启用静态资源处理、视图解析等
```

---

### 7.4 WebMvcConfigurer vs WebMvcConfigurationSupport

```java
// 方式1：实现 WebMvcConfigurer（推荐，非侵入式）
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) { }

    @Override
    public void addCorsMappings(CorsRegistry registry) { }
    // 只覆盖需要的方法，其他保持 @EnableWebMvc 默认配置
}

// 方式2：继承 WebMvcConfigurationSupport（侵入式，慎用）
@Configuration
public class WebConfig extends WebMvcConfigurationSupport {
    // 继承此类后，@EnableWebMvc 的自动配置会被禁用！
    // 必须手动配置所有需要的 MVC 组件，否则很多默认功能失效
}
```

**为什么 `WebMvcConfigurationSupport` 有侵入性？**
> 继承它意味着接管了整个 MVC 配置，`@EnableWebMvc` 失效，Spring Boot 的 `WebMvcAutoConfiguration` 也失效。如果不小心遗漏某些配置，会导致 JSON 转换不工作、静态资源 404 等问题。

---

## 八、高频 QA 答疑

### Q1：Spring 和 Spring Boot 的版本关系？

```
Spring Boot 3.x → Spring Framework 6.x（要求 JDK 17+）
Spring Boot 2.x → Spring Framework 5.x（支持 JDK 8+）
Spring Boot 1.x → Spring Framework 4.x

查询对应关系：https://spring.io/projects/spring-boot#learn
（Release Notes 中有明确说明）
```

### Q2：AOP 切入点（Pointcut）和连接点（JoinPoint）的区别？

```
连接点（JoinPoint）= 候选人（所有方法执行点）
切入点（Pointcut）= 选中的候选人（通过表达式过滤后实际拦截的方法）

例：一个 Service 类有 100 个方法（100个连接点）
   你配置 execution(* com.example.service.*.save*(..))
   → 只有 save 开头的 5 个方法是切入点
```

### Q3：`spring-jdbc` 和 `mybatis-spring` 如何配合？

```
spring-jdbc 提供：
  - DataSourceTransactionManager（事务管理器）
  - JdbcTemplate（可选）
  - 整合事务的基础设施

mybatis-spring 提供：
  - SqlSessionFactoryBean（创建 MyBatis 核心对象并注册到 Spring）
  - MapperScannerConfigurer（扫描 Mapper 接口，生成代理 Bean）
  - SqlSessionTemplate（线程安全的 SqlSession）

关系：mybatis-spring 把 MyBatis 的 DataSource 指向 Spring 管理的 DataSource，
      使 MyBatis 的操作参与到 Spring 的事务管理中。
```

### Q4：编译时和运行时的区别？

```
编译时：javac 将 .java → .class 的过程
  - 语法检查
  - 类型检查
  - 注解处理（如 Lombok 在编译时生成代码）
  - 编译期异常（受检异常 Checked Exception）

运行时：JVM 加载并执行 .class 的过程
  - 动态代理（Spring AOP 在运行时生成代理类）
  - 反射
  - 类加载
  - 运行时异常（RuntimeException 及其子类）
```

### Q5：`default` 和 `protected` 的区别？

```java
// default（包访问权限，不写修饰符）
class DefaultClass {
    void defaultMethod() {}  // 只有同包的类可以访问
}

// protected
class Base {
    protected void protectedMethod() {}
}

// 关键区别：不同包的子类
// ✅ protected 可以跨包继承
package com.other;
import com.example.Base;
class Sub extends Base {
    void test() {
        protectedMethod();  // ✅ 可以访问
    }
}

// ❌ default 不能跨包继承
package com.other;
import com.example.DefaultClass;
class Sub extends DefaultClass {
    void test() {
        defaultMethod();  // ❌ 编译错误：不可见
    }
}

// 记忆：
// 同包内：default 和 protected 都可以访问
// 不同包子类：只有 protected 可以访问（default 不行）
// 不同包非子类：default 和 protected 都不可以访问
```

### Q6：`@Value` 和直接赋值的区别？

```java
// 直接赋值：硬编码，无法外部配置
private int timeout = 5000;

// @Value：运行时从配置文件/环境变量读取，支持外部化配置
@Value("${app.timeout:5000}")  // 默认值5000
private int timeout;

// @Value 的其他用法：
@Value("${server.port}")          // 读取application.properties
@Value("#{T(Math).PI}")           // SpEL表达式
@Value("#{systemProperties['java.home']}")  // 系统属性
@Value("${MY_ENV_VAR}")           // 环境变量
```