+++
date = '2026-06-25T09:06:35+08:00'
draft = true
title = 'Swagger2和Swagger3注解对比表'
categories = ["编程"]
tags = ["后端开发"]
[cover]
  image = "https://loremflickr.com/500/200/swagger"
+++

在 Spring Boot 生态中，Swagger 2.0（通常使用 `Foxfire` 依赖）和 Swagger 3.0（通常使用 `Springdoc-openapi` 依赖，基于 OpenAPI 3 规范）的注解发生了很大变化。

以下是 Swagger 2.0 与 Swagger 3.0（OpenAPI 3）的常用注释完整对应表：

### 1. 核心注解对应表

| 功能描述            | Swagger 2.0 注解 (io.swagger.annotations) | Swagger 3.0 注解 (io.swagger.v3.oas.annotations) | 备注说明                                         |
| ------------------- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| **标记控制器类**    | `@Api(tags = "用户接口")`                 | `@Tag(name = "用户接口")`                        | 3.0 中移除了 `description` 属性，统一使用 `name` |
| **标记接口方法**    | `@ApiOperation(value = "获取用户")`       | `@Operation(summary = "获取用户")`               | 3.0 中 `value` 变更为 `summary`                  |
| **入参实体类**      | `@ApiModel(value = "用户对象")`           | `@Schema(description = "用户对象")`              | 3.0 极大简化，统一使用 `@Schema`                 |
| **实体类属性**      | `@ApiModelProperty(value = "姓名")`       | `@Schema(description = "姓名")`                  | 同上，合并为了 `@Schema`                         |
| **忽略某个属性**    | `@ApiModelProperty(hidden = true)`        | `@Schema(hidden = true)`                         |                                                  |
| **忽略整个类/方法** | `@ApiIgnore`                              | `@Hidden`                                        | 用于不想暴露在文档中的接口或参数                 |

---

### 2. 请求参数注解对应表

对于方法入参（如 URL 路径参数、Query 参数等），3.0 引入了更具结构化的配置：

| 功能描述         | Swagger 2.0 注解              | Swagger 3.0 注解                     |
| ---------------- | ----------------------------- | ------------------------------------ |
| **单个容器参数** | `@ApiImplicitParam`           | `@Parameter`                         |
| **多个容器参数** | `@ApiImplicitParams({ ... })` | `@Parameters({ ... })`               |
| **普通方法参数** | `@ApiParam(value = "用户ID")` | `@Parameter(description = "用户ID")` |

> **💡 注意（`@Parameter` 的使用变化）：**
> 在 3.0 中，如果是获取路径参数（`@PathVariable`）或查询参数（`@RequestParam`），可以直接在参数前加 `@Parameter`：
> ```java
> // Swagger 3.0 示例
> @GetMapping("/{id}")
> public User getUser(@Parameter(description = "用户ID", example = "1") @PathVariable Long id)
> 
> ```
> 
> 

---

### 3. 响应状态码注解对应表

| 功能描述         | Swagger 2.0 注解                               | Swagger 3.0 注解                                             |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| **单个通用响应** | `@ApiResponse(code = 404, message = "未找到")` | `@ApiResponse(responseCode = "404", description = "未找到")` |
| **多个通用响应** | `@ApiResponses({ ... })`                       | `@ApiResponses({ ... })` (名称未变，内部组件变了)            |

---

### 4. 依赖迁移对比 (补充)

除了注解组件包路径从 `io.swagger.annotations.*` 变更为 `io.swagger.v3.oas.annotations.*` 之外，如果你在做项目升级，Maven 依赖也需要同步修改：

* **Swagger 2.x (Springfox):**
```xml
<dependency>
    <groupId>io.springfox</groupId>
    <artifactId>springfox-swagger2</artifactId>
    <version>2.x.x</version>
</dependency>

```


* **Swagger 3.x (Springdoc):**
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>3.x.x (对应 Spring Boot 3)</version>
</dependency>

```
