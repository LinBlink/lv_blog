+++
date = '2026-06-16T15:38:37+08:00'
draft = true
title = 'MyBatis-Plus 学习'
categories = ["编程"]
tags = ["学习笔记"]
+++

## 1. 简介
MyBatis-Plus（简称 MP）是一个 MyBatis 的增强工具，在 MyBatis 的基础上只做增强不做改变，为简化开发、提高效率而生。

**核心特点：**
- **无侵入**：引入 MP 不会对现有 MyBatis 工程产生影响，犹如丝般顺滑。
- **损耗小**：启动即会自动注入基本 CRUD，性能基本无损耗。
- **强大的 CRUD 操作**：内置通用 Mapper、通用 Service，仅通过少量配置即可实现单表大部分 CRUD 操作。
- **支持 Lambda 形式调用**：通过 Lambda 表达式，安全高效的编写查询条件，防止字段名误写。
- **内置代码生成器**：通过少量配置即可生成 Mapper、Service、Controller 等代码。
- **内置分页插件**：基于 MyBatis 物理分页，开发者无需关心具体操作，配置后即可使用。

**官网**：[https://baomidou.com/](https://baomidou.com/)

## 2. 基本用法

### 2.1 引入依赖
在 Maven 项目 `pom.xml` 中添加：
```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.3.1</version> <!-- 请按最新版本 -->
</dependency>
```
如果是传统 Spring 项目，可引入 `mybatis-plus` 核心依赖并自行配置。通常 Spring Boot 项目直接使用 starter。

### 2.2 定义实体类
```java
@Data
public class User {
    private Long id;
    private String name;
    private Integer age;
    private String email;
}
```

### 2.3 编写 Mapper 接口
继承 `BaseMapper<T>` 即可获得 CRUD 能力：
```java
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```
此时 `UserMapper` 已经拥有了 `insert`、`deleteById`、`updateById`、`selectById`、`selectList` 等大量方法，无需编写 XML。

### 2.4 扫描 Mapper
Spring Boot 启动类需添加 `@MapperScan` 扫描 Mapper 包：
```java
@SpringBootApplication
@MapperScan("com.example.mapper")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 3. 常用注解

### 3.1 @TableName
- **作用**：当表名与实体类名不一致时，指定映射的表名。
- **属性**：
  - `value`：表名
  - `schema`：模式
  - `keepGlobalPrefix`：是否保持全局表前缀（默认 false）
  - `autoResultMap`：是否自动构建 ResultMap（配合 typeHandler 使用，如 JSON 处理器）
```java
@TableName("t_user")
public class User { ... }
```

### 3.2 @TableId
- **作用**：标识主键字段。
- **属性**：
  - `value`：主键字段名（若与属性名不一致）
  - `type`：主键生成策略，使用 `IdType` 枚举，常用如下：
    - `AUTO`：数据库自增，需数据库支持自增主键。
    - `INPUT`：用户自定义输入。
    - `ASSIGN_ID`（默认）：雪花算法生成 Long 型 ID。
    - `ASSIGN_UUID`：以 UUID 形式生成（去除中划线）。
```java
public class User {
    @TableId(value = "user_id", type = IdType.AUTO)
    private Long id;
    // ...
}
```
> **注意**：若实体类主键属性名就叫 `id` 且表主键列也为 `id`，可不加此注解；默认主键策略为 `ASSIGN_ID`。

### 3.3 @TableField
- **作用**：标识非主键的普通字段。
- **属性**：
  - `value`：指定数据库列名（当字段名与列名不一致时）。
  - `exist`：是否为数据库字段（`false` 表示不是，该字段不会参与 SQL 生成）。
  - `condition`：自定义查询条件规则（一般不常用）。
  - `fill`：字段自动填充策略（配合 `MetaObjectHandler`）。
  - `select`：是否进行 select 查询（默认 true）。
  - `typeHandler`：指定类型处理器（如 JSON 处理）。

**常见使用场景：**
1. **属性名以 `is` 开头的布尔字段**  
   若实体中有 `Boolean isAdult`，MP 默认会自动去掉 `is` 前缀寻找数据库 `adult` 列，此时需手动指定列名：
   ```java
   @TableField("is_adult")
   private Boolean isAdult;
   ```

2. **数据库关键字冲突**  
   比如实体属性为 `order`，与 MySQL 关键字冲突，可加 `value` 反引号或改名：
   ```java
   @TableField("`order`")
   private Integer order;
   ```

3. **数据库不存在的字段**  
   比如用于业务逻辑的临时字段：
   ```java
   @TableField(exist = false)
   private String remark; // 该字段不会保存到数据库
   ```

## 4. 默认约定
MP 遵循“约定优于配置”原则：
- 默认类名转下划线作为表名（如 `UserInfo` → `user_info`）。
- 主键策略默认为 `ASSIGN_ID`（雪花算法）。
- 字段名转下划线映射列名（如 `createTime` → `create_time`）。
- 若属性名为 `id`，且类型为 `Long`，会自动识别为主键。
这些约定可以通过配置或注解覆盖。

## 5. 常见配置
在 `application.yml` 中进行常用配置：
```yaml
mybatis-plus:
  # 类型别名包扫描，通常配了这个即可，无需单独配置 type-aliases-package 在 mybatis 下
  type-aliases-package: com.example.entity

  # Mapper XML 文件位置（多目录使用逗号分隔）
  mapper-locations: classpath*:/mapper/**/*.xml

  # MyBatis 原生配置
  configuration:
    # 下划线转驼峰（默认开启）
    map-underscore-to-camel-case: true
    # 缓存开启（默认开启）
    cache-enabled: true

  # 全局配置
  global-config:
    db-config:
      # 全局主键策略（优先级：注解 > 全局配置）
      id-type: assign_id
      # 全局字段更新策略（not_null：只更新非空字段；ignored：所有字段）
      update-strategy: not_null
      # 逻辑删除配置（后面细讲）
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
```

**全局配置优先级低于注解**：例如实体类中用 `@TableId(type = IdType.AUTO)` 指明了自增，即使全局配置了 `assign_id` 也会以注解为准。

## 6. 核心功能

### 6.1 条件构造器
条件构造器是 MP 中最强大的功能之一，用于动态生成 WHERE 条件。主要有：
- `QueryWrapper<T>`：查询条件构造，可返回实体对象。
- `UpdateWrapper<T>`：更新条件构造，可设置 set 子句。
- `LambdaQueryWrapper<T>` / `LambdaUpdateWrapper<T>`：通过 Lambda 表达式引用字段，防止硬编码字符串出错。

**常用方法举例：**
```java
// 普通 QueryWrapper 示例
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.select("id", "name")                   // 指定查询列
       .like("name", "张")                     // name like '%张%'
       .between("age", 18, 30)                // age between 18 and 30
       .eq("email", "test@baomidou.com")      // email = ?
       .orderByDesc("id");                    // order by id desc
List<User> users = userMapper.selectList(wrapper);

// Lambda 形式，更安全
LambdaQueryWrapper<User> lambdaQ = new LambdaQueryWrapper<>();
lambdaQ.like(User::getName, "张")
       .between(User::getAge, 18, 30);
List<User> lambdaUsers = userMapper.selectList(lambdaQ);

// 更新部分字段
LambdaUpdateWrapper<User> lambdaU = new LambdaUpdateWrapper<>();
lambdaU.eq(User::getId, 1)
       .set(User::getAge, 25)
       .set(User::getEmail, "new@email.com");
userMapper.update(null, lambdaU);  // 第一个参数为实体，可为 null
```

### 6.2 自定义 SQL
当需要编写复杂的 SQL，但又想利用 MP 的条件构造器动态拼接 WHERE 条件时，可以结合自定义 XML 和 `${ew.customSqlSegment}`。

**Mapper 接口**：
```java
@Mapper
public interface UserMapper extends BaseMapper<User> {
    // 参数必须用 @Param("ew") 接收 Wrapper，第二个参数可自定义
    List<User> selectByMyWhere(@Param("ew") Wrapper<User> wrapper, @Param("minAge") Integer minAge);
}
```

**XML 映射文件**：
```xml
<select id="selectByMyWhere" resultType="com.example.entity.User">
    SELECT * FROM user
    ${ew.customSqlSegment}
    AND age > #{minAge}
</select>
```

**调用时**：
```java
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.like(User::getName, "王");
List<User> list = userMapper.selectByMyWhere(wrapper, 20);
```
`${ew.customSqlSegment}` 将自动替换为由 Wrapper 生成的 WHERE 条件字符串，且正确处理 `where` 关键字，非常方便。

### 6.3 Service 接口
MP 提供了 `IService<T>` 和 `ServiceImpl<M extends BaseMapper<T>, T>`，封装了更高层级的业务逻辑。

**定义 Service 接口**：
```java
public interface IUserService extends IService<User> {
    // 自定义方法
}
```

**实现类**：
```java
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {
    // 实现自定义方法
}
```

**常见操作**：
- `save(entity)`：新增
- `saveBatch(list)`：批量新增
- `removeById(id)`：根据ID删除
- `removeBatchByIds(ids)`：批量删除（多条 SQL 逐条执行）
- `updateById(entity)`：根据ID更新
- `updateBatchById(list)`：批量更新
- `getById(id)`：查询
- `list()`：查询列表
- `page(page, wrapper)`：分页查询

**removeByIds 与 removeByBatchIds 的区别？**  
其实 `removeByIds` 在内部默认调用 `removeBatchByIds`，两者在功能上无本质区别（均通过多 ID 执行 `DELETE FROM table WHERE id IN (?,?,...)` 一条 SQL）。但在老版本可能前者逐条删除，较新版本已合并为一条 IN 语句。使用上无需纠结，直接用 `removeByIds` 即可。

**Lambda 更新**：  
`lambdaUpdate()` 返回一个 `LambdaUpdateChainWrapper`，链式操作非常清晰：
```java
userService.lambdaUpdate()
           .eq(User::getId, 1)
           .set(User::getAge, 28)
           .update();  // 执行更新
```

**批量新增及效率优化**：  
IService 的 `saveBatch(list)` 默认会一次性提交多条 INSERT 语句，但底层 JDBC 驱动可能仍是一条条发送给数据库。为提高 MySQL 批量插入性能，需要在 JDBC 连接 URL 后添加参数：
```
jdbc:mysql://localhost:3306/db?rewriteBatchedStatements=true
```
开启后，驱动会将多条 SQL 合并成一条较长的 SQL 发送，从而显著提升性能。

**这样配置的缺点？**
- 对于极其大量的数据批量插入，合成的 SQL 长度可能会超过 MySQL 的 `max_allowed_packet` 限制，导致执行失败。
- 一旦发生错误，很难定位是哪一条数据出错，不利于调试。
- 批量操作可能长时间持有表锁，影响并发。
- 若插入的数据包含自增主键回填需求，批量回填在某些驱动版本下可能不可用或顺序混乱。

因此推荐：控制每批次大小（如 1000 条）并配合 `rewriteBatchedStatements` 使用。

### 6.4 分页插件
MP 分页功能通过插件实现，需先配置 `MybatisPlusInterceptor` 并添加分页内部拦截器。

**配置类**：
```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

**使用分页查询**：
```java
Page<User> page = new Page<>(1, 10); // 当前页码，每页条数
Page<User> result = userMapper.selectPage(page, null);  // 可传 QueryWrapper
List<User> records = result.getRecords();
long total = result.getTotal();
```

**Service 层分页**：
```java
IPage<User> page = userService.page(new Page<>(1, 10),
    new LambdaQueryWrapper<User>().like(User::getName, "李"));
```
分页结果中除了数据，还自动包含了总数、页码等信息，可直接用于前端。

**通用分页实体与 MP 转换**：  
实际项目通常会有一个统一响应类，需要把 `IPage` 转成自定义分页对象，可编写工具方法：
```java
public class PageUtils {
    public static <T> CommonPage<T> convert(IPage<T> page) {
        CommonPage<T> result = new CommonPage<>();
        result.setList(page.getRecords());
        result.setTotal(page.getTotal());
        result.setCurrent(page.getCurrent());
        result.setSize(page.getSize());
        return result;
    }
}
```

## 7. 扩展功能

### 7.1 代码生成器
MP 提供强大的代码生成器，可快速生成 Entity、Mapper、Service、Controller 等。**推荐使用官方新版**。

引入依赖（可能需要单独添加生成器模块）：
```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-generator</artifactId>
    <version>3.5.3</version>
</dependency>
<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity-engine-core</artifactId>
    <version>2.3</version>
</dependency>
```

示例配置（生成代码）：
```java
public class CodeGenerator {
    public static void main(String[] args) {
        FastAutoGenerator.create("jdbc:mysql://localhost:3306/test", "root", "password")
            .globalConfig(builder -> {
                builder.author("baomidou")       // 设置作者
                       .outputDir("D://");        // 输出目录
            })
            .packageConfig(builder -> {
                builder.parent("com.example");    // 父包名
            })
            .strategyConfig(builder -> {
                builder.addInclude("user");       // 需要生成的表名
            })
            .templateEngine(new VelocityTemplateEngine())
            .execute();
    }
}
```
可根据实际需要调整策略，例如开启 Lombok、设置父类等。

### 7.2 静态工具 Db
从 MP 3.5.3 版本开始，提供了静态工具类 `Db`，可直接进行 CRUD 操作，无需注入 Mapper 或 Service。

**简单使用**：
```java
// 查询列表
List<User> users = Db.lambdaQuery(User.class).like(User::getName, "李").list();
// 插入
User user = new User();
user.setName("王五");
Db.save(user);
```

**使用场景：解决循环依赖**  
在 Spring 中，如果 Service A 需要依赖 Service B，而 B 又依赖 A，就会产生循环依赖。此时如果一个 Service 在方法中只是临时需要某个表的数据，可通过 `Db` 静态工具直接操作数据库，从而**避免注入另一个 Service**，有效解开循环依赖链。

> **Spring 如何解决循环依赖？**  
> Spring 主要通过**三级缓存**机制解决单例 Bean 的循环依赖：  
> - `singletonObjects`：一级缓存，存放完全初始化好的 Bean。  
> - `earlySingletonObjects`：二级缓存，存放早期引用（原始对象，未完成属性注入）。  
> - `singletonFactories`：三级缓存，存放可生成早期引用的 ObjectFactory。  
> 当 A 创建过程中需要 B，B 创建时又需要 A，Spring 可通过三级缓存获取 A 的早期引用并提前暴露给 B，从而完成创建。但这要求 Bean 是**单例且非构造器注入**，构造器注入无法解决。而 `Db` 工具则提供了一种代码层面的解耦方式。

### 7.3 逻辑删除
逻辑删除即在表中标记数据已删除，而非物理删除，方便数据恢复与审计。

**全局配置**（前面已提及）：
```yaml
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted     # 实体字段名
      logic-delete-value: 1           # 删除后的值
      logic-not-delete-value: 0       # 未删除时的值
```

**实体类加注解**：
```java
@Data
public class User {
    @TableLogic
    private Integer deleted;
}
```
执行 `userMapper.deleteById(1L);` 实际会生成 `UPDATE user SET deleted=1 WHERE id=1 AND deleted=0`；查询时自动拼接 `deleted=0`。

**实际工作推荐做法**：  
对于需要保留历史数据的核心业务，推荐使用逻辑删除，并结合数据迁移定时将已逻辑删除的“冷数据”移至归档库，降低业务表体积，维持性能。

### 7.4 枚举处理器
将 Java 枚举与数据库字段智能映射，省去手动转换。

**1. 定义枚举并使用 `@EnumValue` 标记数据库存储值**
```java
public enum GenderEnum {
    MALE(1, "男"),
    FEMALE(2, "女");

    @EnumValue          // 存入数据库的值
    private final int code;
    private final String desc;
    // 构造器、getter 略
}
```

**2. 全局配置枚举处理器**：
```yaml
mybatis-plus:
  configuration:
    default-enum-type-handler: com.baomidou.mybatisplus.core.handlers.MybatisEnumTypeHandler
```

**3. 实体类属性使用枚举类型**：
```java
public class User {
    private GenderEnum gender;
}
```
插入或查询时，`gender` 会自动与数据库 `int` 类型互相转换。

**4. 返回值处理 `@JsonValue`**（前后端交互）：
若需要返回给前端时显示为 JSON 字符串（如 "男"），可在枚举中标注 `@JsonValue`：
```java
public enum GenderEnum {
    MALE(1, "男"),
    FEMALE(2, "女");

    @EnumValue
    private final int code;
    @JsonValue
    private final String desc;
}
```
序列化 JSON 时，`MALE` 会展示为 `"男"`。

### 7.5 JSON 处理器
实体属性可以直接映射 JSON 字段，常用于存储扩展信息。

**实体类**：
```java
@Data
@TableName(value = "user", autoResultMap = true)   // 必须开启自动结果映射
public class User {
    private Long id;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> extra;       // JSON 字段
}
```
数据库 `extra` 字段类型为 `json` 或 `varchar`。插入时 Map 自动序列化为 JSON 字符串，查询时反序列化回 Map。

**注意**：`@TableName(autoResultMap = true)` 不可省略，否则查询时不会调用 typeHandler 处理该字段。

### 7.6 插件功能
MP 的插件体系基于拦截器，可以添加多种功能。

**初始化核心拦截器**：
```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // 1. 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));

        // 2. 乐观锁插件
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());

        // 3. 防止全表更新与删除插件
        interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());

        return interceptor;
    }
}
```

- **分页插件**：详见 6.4。
- **乐观锁插件**：在实体字段上添加 `@Version`，更新时自动比对版本号。
- **防全表更新删除**：当执行 `update` 或 `delete` 没有 `where` 条件时，会阻断并抛出异常，有效防止误操作。
