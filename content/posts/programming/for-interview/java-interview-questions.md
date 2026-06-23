+++
date = '2026-06-23T08:50:54+08:00'
draft = true
title = 'Java 面试题整理'
categories = ["编程"]
tags = ["面试题"]
[cover]
  image = ""
+++

## 一、Java基础（必问，中小厂高频）
### 1. 语法&数据类型
1. 基本数据类型、包装类区别，自动装箱拆箱
2. String、StringBuilder、StringBuffer区别，常量池
3. == 和 equals、hashCode 重写规则
4. 位运算、Math、BigDecimal精度问题（金额必问）
5. 变量作用域、static关键字、final三种用法

### 2. 面向对象
1. 封装、继承、多态、抽象类&接口区别（JDK8+默认方法）
2. 方法重写重载、this/super
3. 内部类、匿名内部类、Lambda表达式、函数式接口
4. 四大函数式接口：Consumer、Supplier、Predicate、Function

### 3. 集合（重中之重，每场必问）
1. ArrayList、LinkedList底层、扩容、优缺点
2. HashMap底层（数组+链表+红黑树）、扩容、扰动函数、死链问题
3. HashSet、TreeMap、LinkedHashMap
4. ConcurrentHashMap 分段锁/Node锁区别
5. Vector、HashTable过时原因
6. 集合遍历、Iterator、fail-fast机制

### 4. 异常体系
1. Error和Exception区别，受检/非受检异常
2. try-catch-finally执行顺序、return+finally
3. 自定义异常、全局异常处理

### 5. IO & NIO（中小厂浅问）
1. BIO、NIO、AIO区别
2. 字节流/字符流、缓冲区Buffer简单概念

### 6. JVM（中小厂考基础，不深挖调优）
1. JVM内存区域：堆、栈、方法区、程序计数器、本地方法栈
2. 堆分代：年轻代Eden/S0/S1、老年代、元空间
3. 垃圾回收：GC触发时机、Minor GC、Full GC
4. 常见垃圾收集器：CMS、G1简单特点
5. 四种引用：强/软/弱/虚引用
6. OOM常见场景、简单排查思路
7. 类加载机制、双亲委派模型

## 二、多线程并发（高频核心）
1. 创建线程4种方式
2. start()和run()区别
3. 线程状态流转
4. synchronized：锁对象、锁方法、锁底层（偏向/轻量/重量级简单说）
5. volatile：可见性、禁止重排序，不保证原子性
6. Lock锁、ReentrantLock，公平/非公平锁
7. 线程池：7大参数、4种内置线程池、实际开发禁止Executors
8. 线程安全问题解决方案
9. CountDownLatch、CyclicBarrier使用场景
10. 并发工具：Atomic原子类、CAS原理、ABA问题
11. sleep()、wait()、yield()区别

## 三、Spring全家桶（面试占比最高）
### 1. Spring Core
1. IOC控制反转、DI依赖注入原理
2. Bean生命周期、循环依赖三级缓存解决方案
3. Bean作用域：singleton/prototype等
4. 注解：@Component/@Service/@Repository/@Controller、@Autowired/@Resource区别
5. AOP：动态代理（JDK/CGLIB）、切面、切点、通知、使用场景（日志、权限、事务）
6. 事务：@Transactional传播机制、隔离级别、失效场景（重点！中小厂必问）

### 2. Spring MVC
1. MVC执行完整流程
2. DispatcherServlet九大组件
3. @RequestMapping、@RequestBody、@RequestParam区别
4. 全局异常处理器、拦截器、过滤器区别
5. 参数绑定、日期转换、跨域CORS解决

### 3. Spring Boot（现在所有厂必考）
1. 自动配置原理：@EnableAutoConfiguration、SPI
2. Starter机制
3. application.yml/properties、配置优先级
4. 整合MyBatis、Redis、RabbitMQ基础配置
5. 热部署、Actuator监控简单使用
6. 启动流程

### 4. Spring Cloud（有微服务业务才问，小单体厂少问）
1. 注册中心Nacos/Eureka
2. Feign远程调用、负载均衡
3. Gateway网关、熔断Sentinel
4. 配置中心Nacos

## 四、持久层：MyBatis / MyBatis-Plus
1. MyBatis执行流程
2. #{} 和 ${} 区别，SQL注入
3. 一级缓存、二级缓存
4. 多表关联、一对多、多对一
5. 分页插件、逆向工程
6. MyBatis-Plus常用注解、CRUD封装、条件构造器Wrapper
7. 逻辑删除、乐观锁实现

## 五、数据库 MySQL（中小厂必考，业务核心）
### 1. 基础SQL
1. 内连接、左/右连接、子查询、exists/in区别
2. 聚合函数、分组group by、having
3. union、union all区别

### 2. 索引（重中之重）
1. InnoDB MyISAM区别
2. B+树索引原理，为什么不用二叉树、哈希
3. 主键索引、普通索引、联合索引最左匹配原则
4. 索引失效场景（高频）
5. 覆盖索引、回表查询

### 3. 事务&锁
1. ACID四大特性
2. 四大隔离级别、脏读/不可重复读/幻读
3. MVCC原理、undo log、redo log作用
4. 行锁、表锁、意向锁、死锁产生与解决

### 4. 调优&实战
1. 慢查询排查、explain执行计划关键字段
2. 大表优化：分库分表简单思路（MyCat/Sharding-JDBC浅问）
3. 分页深偏移优化、count统计优化
4. 避免null、避免select *、字段类型选择

## 六、缓存 Redis（几乎所有后端必问）
1. 五种基础数据结构使用场景（String/List/Set/ZSet/Hash）
2. Redis持久化：RDB、AOF区别
3. 过期淘汰策略、内存满了怎么办
4. 缓存三大问题：缓存穿透、击穿、雪崩（必背解决方案）
5. Redis分布式锁（Redisson）
6. 主从复制、哨兵、集群简单概念
7. Redis单线程为什么快

## 七、中间件（看公司业务，有则问，无则简单了解）
### 1. MQ（RabbitMQ/RocketMQ/Kafka）
1. 消息队列作用：解耦、削峰、异步
2. 交换机、队列、死信队列
3. 消息丢失、重复消费、消息积压解决方案
4. 如何保证消息最终一致性

### 2. Elasticsearch（做搜索/报表才问）
分词、倒排索引、简单CRUD、分页

## 八、计算机网络（基础简答）
1. HTTP1.1 / HTTP2 / HTTPS区别
2. TCP三次握手四次挥手
3. TCP滑动窗口、拥塞控制、粘包拆包
4. Cookie和Session区别、JWT令牌
5. GET/POST区别

## 九、开发工具&工程化
1. Maven/Gradle：依赖冲突、依赖范围、打包
2. Git常用命令、分支规范
3. Linux基础命令：查日志、进程、端口、文件操作
4. Docker基础：镜像、容器、简单打包部署（中小厂现在基本都问一点）

## 十、系统设计&业务场景（中小厂最爱，区分能不能干活）
1. 分布式ID生成方案
2. 接口限流、防重复提交
3. 定时任务：Quartz、XXL-Job、@Scheduled
4. 上传文件、图片存储方案
5. 高并发下单、库存扣减（超卖解决方案）
6. 接口统一返回封装、全局异常、参数校验
7. 分页、导出Excel、导入数据处理

## 十一、算法（中小厂难度低，只考简单）
1. 数组、字符串：两数之和、反转字符串、去重
2. 链表：反转链表、判断环
3. 排序：冒泡、快排、二分查找
4. 简单递归，基本不考动态规划、hard题

# 中小厂八股侧重点总结
1. 优先背：Java集合、线程池、Spring事务、MySQL索引、Redis缓存三大问题、MyBatis
2. 弱化：JVM深度调优、底层源码逐行分析、复杂分布式理论
3. 加分项：能结合项目说业务场景解决方案（面试官最爱）

需要我把这份清单整理一份**高频必背精简版**（去掉冷门内容，只留80%面试会考的）吗？