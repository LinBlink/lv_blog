+++
date = '2026-06-18T12:51:05+08:00'
draft = true
title = 'ElasticSearch 学习'
categories = ["编程"]
tags = ["学习笔记"]
+++

## 1. 基础篇
### 1.1 起源：Lucene
- **Lucene**：Apache 开源的 Java 全文搜索引擎类库。
- 优势：易扩展、高性能（纯 Java，可嵌入）。
- 缺点：使用复杂，需处理索引创建、查询解析等底层细节，无分布式支持。
- Elasticsearch 基于 Lucene 构建，提供分布式、易用的 RESTful API。

### 1.2 技术栈（ELK）
- **Elasticsearch**：存储、搜索和分析引擎。
- **Logstash**：服务器端数据处理管道，采集、转换数据后发送至 ES。
- **Kibana**：可视化平台，制作图表、仪表板，管理 ES。
- **Beats**：轻量型数据采集器，发送到 Logstash 或 ES。

### 1.3 使用 Docker 安装
**Elasticsearch**（单节点）：
```bash
docker run -d --name es \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  -e "discovery.type=single-node" \
  -v es-data:/usr/share/elasticsearch/data \
  -v es-plugins:/usr/share/elasticsearch/plugins \
  --privileged \
  --network testNet \
  -p 9200:9200 -p 9300:9300 \
  elasticsearch:7.12.1
```
- 9200：HTTP API 端口
- 9300：内部节点通信端口
- `discovery.type=single-node`：单节点模式（测试用）

**Kibana**：
```bash
docker run -d --name kibana \
  -e ELASTICSEARCH_HOSTS=http://es:9200 \
  --network=testNet \
  -p 5601:5601 \
  kibana:7.12.1
```

### 1.4 倒排索引（Inverted Index）
- **正向索引**：文档 ID → 文档内容。适合根据 ID 精确查找，但做模糊搜索需遍历所有文档，效率低。
- **倒排索引**：
  - **文档（Document）**：ES 中存储的一条 JSON 数据。
  - **词条（Term）**：文档经过分词后的最小单元。
  - 结构：词条 → 文档 ID 列表（及位置、频率等）。
  - 优点：快速定位包含某个词条的所有文档，实现高效全文搜索。

### 1.5 分词器（Analyzer）
将文本拆分为词条（term）的组件，由三部分组成：
- Character Filter：预处理（如去除 HTML 标签）。
- Tokenizer：按规则分词。
- Token Filter：对词条再加工（转小写、去除停用词）。

**IK 分词器**：最常用的中文分词插件。
- 安装：下载对应版本 zip 放到 `plugins/ik` 目录，重启 ES。
- 两种模式：
  - `ik_smart`：最粗粒度拆分。
  - `ik_max_word`：最细粒度拆分。
- 自定义词典：修改 `IKAnalyzer.cfg.xml`，添加 `ext.dic`（新词）、`stopword.dic`（停用词）。

### 1.6 基础概念
- **索引（Index）**：相同类型文档的集合，类似数据库中的“表”。
- **文档（Document）**：ES 存储的基本单元，序列化为 JSON。
- **映射（Mapping）**：定义文档字段的类型、分词器等，类似数据库中的“Schema”。

**Mapping 常用字段类型**：
- 字符串：`text`（分词）、`keyword`（精确匹配，不分词）。
- 数值：`long`, `integer`, `short`, `byte`, `double`, `float`。
- 日期：`date`。
- 布尔：`boolean`。
- 地理：`geo_point`（经纬度）、`geo_shape`（区域）。
- 对象：`object`（嵌套字段）。
- 数组：不专门定义，ES 自动支持。

---

## 2. 索引库操作（RESTful API）
所有操作通过 HTTP API 发送 JSON 格式数据。

### 2.1 创建索引（Create）
```json
PUT /索引名
{
  "settings": {
    "number_of_shards": 3,    // 分片数
    "number_of_replicas": 2   // 副本数
  },
  "mappings": {
    "properties": {
      "字段名": {
        "type": "text",          // 字段类型
        "analyzer": "ik_max_word" // 分词器
      }
    }
  }
}
```

### 2.2 查看索引（Read）
```bash
GET /索引名
GET /索引名/_mapping
GET /_cat/indices?v   # 查看所有索引
```

### 2.3 修改索引（Update）
- **全量修改文档**：PUT 请求带全量 JSON 数据，相当于先删除旧文档再创建。
- **局部更新文档**：POST 请求使用 `_update` API。
```json
POST /索引名/_update/文档ID
{
  "doc": {
    "字段": "新值"
  }
}
```

**Mapping 更新限制**：字段类型一旦创建，多数不可修改（如 text 改为 keyword），但可增加新字段。若需修改类型，需重建索引。

### 2.4 删除索引（Delete）
```bash
DELETE /索引名
```

### 2.5 批量操作（Bulk）
一条请求完成多个文档的增删改。
```json
POST /_bulk
{"index":{"_index":"idx","_id":"1"}}
{"title":"Doc 1"}
{"delete":{"_index":"idx","_id":"2"}}
{"update":{"_index":"idx","_id":"3"}}
{"doc":{"title":"Updated"}}
```

**从数据库表设计 Mapping 的实践**：
- MySQL 的 `varchar` → 需全文搜索用 `text`，需精确查询/排序用 `keyword`。
- 数字类型对应 `integer/long/float`。
- 日期类型统一用 `date`，可指定格式。
- 涉及经纬度查询用 `geo_point`。
- 不需要搜索的字段设置 `index: false` 节省空间。

---

## 3. Java REST 客户端
官方推荐 `Java High Level REST Client`（7.x 版本），`Elasticsearch Java API Client`（8.x+ 推荐）。此处以 7.x 高级客户端为例。

**引入依赖**：
```xml
<dependency>
    <groupId>org.elasticsearch.client</groupId>
    <artifactId>elasticsearch-rest-high-level-client</artifactId>
    <version>7.12.1</version>
</dependency>
```

**初始化客户端**：
```java
RestHighLevelClient client = new RestHighLevelClient(
    RestClient.builder(new HttpHost("localhost", 9200, "http"))
);
```

### 3.1 索引库操作
```java
// 创建索引
CreateIndexRequest request = new CreateIndexRequest("my_index");
request.settings(Settings.builder()
    .put("index.number_of_shards", 3)
    .put("index.number_of_replicas", 2));
request.mapping("{\"properties\":{...}}", XContentType.JSON);
CreateIndexResponse response = client.indices().create(request, RequestOptions.DEFAULT);

// 删除索引
DeleteIndexRequest deleteRequest = new DeleteIndexRequest("my_index");
client.indices().delete(deleteRequest, RequestOptions.DEFAULT);

// 存在性检查
GetIndexRequest getRequest = new GetIndexRequest("my_index");
boolean exists = client.indices().exists(getRequest, RequestOptions.DEFAULT);
```

### 3.2 文档操作
```java
// 添加文档
IndexRequest indexReq = new IndexRequest("my_index").id("1");
User user = new User("张三", 25);
indexReq.source(JSON.toJSONString(user), XContentType.JSON);
IndexResponse indexResp = client.index(indexReq, RequestOptions.DEFAULT);

// 局部更新
UpdateRequest updateReq = new UpdateRequest("my_index", "1")
    .doc("age", 26);
client.update(updateReq, RequestOptions.DEFAULT);

// 批量操作
BulkRequest bulk = new BulkRequest();
bulk.add(new IndexRequest("my_index").id("1").source(...));
bulk.add(new DeleteRequest("my_index", "2"));
client.bulk(bulk, RequestOptions.DEFAULT);
```

### 3.3 查询操作
构建查询条件，执行搜索。
```java
SearchRequest searchRequest = new SearchRequest("my_index");
SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
sourceBuilder.query(QueryBuilders.matchQuery("title", "elasticsearch"));
searchRequest.source(sourceBuilder);

SearchResponse response = client.search(searchRequest, RequestOptions.DEFAULT);
SearchHit[] hits = response.getHits().getHits();
for (SearchHit hit : hits) {
    String json = hit.getSourceAsString();
    User user = JSON.parseObject(json, User.class);
}
```

---

## 4. DSL 查询语法
DSL（Domain Specific Language）基于 JSON 构建查询，是 ES 最强大的搜索方式。

### 4.1 查询分类概览
- **叶子查询**：在特定字段查询具体值。
  - **全文检索（Full Text）**：分词后匹配，有相关性算分。
  - **精确查询（Term-Level）**：不分词，直接精确匹配词条。
  - **地理查询（Geo）**：坐标查询。
- **复合查询**：组合多个叶子或复合查询，修改算分、过滤等。
- **特殊查询**：如 `script`, `exists` 等。

### 4.2 全文检索查询
适用于 `text` 字段，会分词并计算相关性分数 `_score`。

**match**：模糊匹配，分词后 OR 关系。
```json
GET /index/_search
{
  "query": {
    "match": {
      "content": "Elasticsearch 入门"
    }
  }
}
```

**match_phrase**：短语匹配，要求分词后顺序一致、连续。
```json
{ "query": { "match_phrase": { "content": "Elasticsearch 入门" } } }
```

**multi_match**：多字段匹配。
```json
{ "query": { "multi_match": { "query": "入门", "fields": ["title", "content"] } } }
```

### 4.3 精确查询
适用于 `keyword`、数字、日期、布尔，不计算相关性分数。

**term**：精确值匹配。
```json
{ "query": { "term": { "status": "active" } } }
```

**range**：范围查询。
```json
{
  "query": {
    "range": {
      "price": { "gte": 100, "lte": 500 }
    }
  }
}
```

**terms**：多值精确匹配。
```json
{ "query": { "terms": { "category": ["科技", "教育"] } } }
```

### 4.4 地理查询（Geo）
需要字段类型为 `geo_point`。
```json
// 矩形范围
{
  "query": {
    "geo_bounding_box": {
      "location": {
        "top_left": { "lat": 40, "lon": 116 },
        "bottom_right": { "lat": 39, "lon": 117 }
      }
    }
  }
}
// 距离范围（圆心半径）
{
  "query": {
    "geo_distance": {
      "distance": "10km",
      "location": { "lat": 39.9, "lon": 116.4 }
    }
  }
}
```

### 4.5 复合查询（Compound Queries）
**bool 查询**：组合多个条件，包含 `must`（AND）、`should`（OR）、`must_not`（NOT）、`filter`（过滤，不计算分数）。
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "手机" } }
      ],
      "filter": [
        { "range": { "price": { "gte": 1000, "lte": 3000 } } },
        { "term": { "brand": "华为" } }
      ],
      "must_not": [
        { "term": { "status": "下架" } }
      ],
      "should": [
        { "term": { "feature": "5G" } },
        { "term": { "feature": "快充" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```
- `filter` 不参与算分，性能更好，建议首选用于过滤条件。

### 4.6 排序和分页
**排序**：
```json
{
  "query": { "match_all": {} },
  "sort": [
    { "price": "desc" },
    { "_score": "desc" }
  ]
}
```
对 `text` 字段排序需打开 `fielddata` 或使用 `keyword` 子字段。

**分页**：
```json
{
  "query": { "match_all": {} },
  "from": 0,  // 起始偏移量
  "size": 10  // 每页文档数
}
```

**深度分页问题**：
- 随着 `from` 增大，ES 需要从每个分片取 `from+size` 条数据在协调节点排序，内存与耗时急剧增加。
- 解决方案：
  - **search_after**：利用上一页的最后一条文档的排序值，实时查询下一页，无 `from` 开销，但不支持跳页。
  - **scroll**：生成数据快照，适合遍历所有数据（如导出），但非实时。
  - 限制分页深度（如 `max_result_window: 10000`）。

### 4.7 高亮显示（Highlight）
```json
{
  "query": { "match": { "content": "elasticsearch" } },
  "highlight": {
    "fields": {
      "content": {
        "pre_tags": ["<em>"],
        "post_tags": ["</em>"]
      }
    }
  }
}
```
响应中会额外返回 `highlight` 字段，包含高亮片段。

### 4.8 数据聚合（Aggregations）
聚合可从数据中提取统计、分组等分析信息。

**聚合分类**：
- **Bucket（桶聚合）**：分组，如 `terms`, `range`, `date_histogram`。
- **Metric（指标聚合）**：计算统计值，如 `avg`, `sum`, `max`, `min`, `stats`。
- **Pipeline（管道聚合）**：对其他聚合结果再次计算。

**DSL 聚合示例**：
```json
{
  "size": 0,  // 不返回文档，只关心聚合结果
  "aggs": {
    "brand_group": {
      "terms": { "field": "brand" },
      "aggs": {
        "avg_price": { "avg": { "field": "price" } }
      }
    }
  }
}
```
含义：按品牌分组，计算每组的平均价格。

**Java 客户端实现聚合**：
```java
SearchRequest searchRequest = new SearchRequest("items");
SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
sourceBuilder.query(QueryBuilders.matchAllQuery());

// 聚合构建
TermsAggregationBuilder aggregation = AggregationBuilders
    .terms("brand_group")
    .field("brand.keyword")
    .subAggregation(AggregationBuilders.avg("avg_price").field("price"));
sourceBuilder.aggregation(aggregation);
searchRequest.source(sourceBuilder);

SearchResponse response = client.search(searchRequest, RequestOptions.DEFAULT);
Aggregations aggs = response.getAggregations();
Terms brandTerms = aggs.get("brand_group");
for (Terms.Bucket bucket : brandTerms.getBuckets()) {
    String brand = bucket.getKeyAsString();
    Avg avgPrice = bucket.getAggregations().get("avg_price");
    System.out.println(brand + ":" + avgPrice.getValue());
}
```

---

## 5. ES 核心原理补充
### 5.1 分片与副本
- **分片（Shard）**：索引被水平拆分为多个分片，每个分片是一个独立的 Lucene 索引。
  - 优势：分布式存储，并行搜索，水平扩展容量和吞吐。
- **副本（Replica）**：每个主分片的拷贝，提供高可用，分担查询压力。
  - 分片数在索引创建后不可修改（可通过 `_split`/`_shrink` API 调整）。
  - 副本数可动态调整。

### 5.2 写入与搜索流程
- **写入**：文档被路由到某个主分片，主分片写入后转发给副本，全部完成才返回确认。
- **搜索**：协调节点将请求转发给相关分片（主或副本），每个分片返回结果，协调节点汇总排序。

### 5.3 优化建议
- 避免字段过多、深度聚合。
- 使用 `filter` 代替 `must` 减少评分计算。
- 合理设计 Mapping，用 `keyword` 代替 `text` 做精确搜索。
- 冷热分离，结合索引生命周期管理（ILM）。
