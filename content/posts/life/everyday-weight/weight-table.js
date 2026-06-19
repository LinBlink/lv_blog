const lang = document.documentElement.lang;

let date_txt = "日期";
let weight_txt = "体重";
let diff_txt = "和前一天比较";

switch (lang) {
  case "en":
      date_txt = "Date";
      weight_txt = "Weight";
      diff_txt = "Compare to Yesterday";
    break;
}

// 🐷 从服务器读取体重记录文件
// fetch() 会发起一个 HTTP 请求，返回一个 Promise
fetch("/posts/life/everyday-weight/weight.json")

  // 📦 第一步：把服务器返回的数据解析成 JSON 对象
  .then((response) => response.json())

  // 🎯 第二步：解构出我们关心的数据
  // records = 体重记录数组
  // goal    = 目标体重
  // unit    = 单位（kg / lb）
  .then(({ records, goal, unit }) => {

    // 🏠 获取用于显示表格的容器节点
    const container = document.getElementById("weightTable");


    // 📊 生成所有表格行
    const rows = records

      // 🧬 slice() 创建数组副本
      // 避免 reverse() 直接修改原始 records 数据
      .slice()

      // 🔄 按时间倒序显示
      // 最新体重放在最上面
      .reverse()

      // ✨ 将每条记录转换成 HTML 表格行
      .map(
        ({ date, weight },index,arr) => {

        // 🎯 计算距离目标体重的差值
        // toFixed(1) 保留 1 位小数
        const prevWeight =
          index < arr.length - 1
            ? arr[index + 1].weight
            : null;

        // 📈 计算相较前一天的变化
        const diff =
          prevWeight != null
            ? (weight - prevWeight).toFixed(1)
            : 0;
        const lang = "zh";



        // 🏗️ 返回一行 HTML
        return `
          <tr>

            <!-- 📅 日期 -->
            <td>${date}</td>

            <!-- ⚖️ 当前体重 -->
            <td>${weight} ${unit}</td>

            <!-- 🎯 比较前一天体重 -->
            <!-- 正数显示 + 号，负数直接显示 -->
            <td>${diff > 0 ? "+" : ""}${diff} ${unit}</td>

          </tr>
        `;
      })

      // 🧵 把所有表格行拼接成一个字符串
      .join("");

    


    // 🎨 将完整表格插入页面
    container.innerHTML = `
      <table style="width:fit-content">

        <!-- 🏷️ 表头 -->
        <thead>
          <tr>
            <th>${date_txt}</th>
            <th>${weight_txt}</th>
            <th>${diff_txt}</th>
          </tr>
        </thead>

        <!-- 📈 体重数据 -->
        <tbody>
          ${rows}
        </tbody>

      </table>
    `;
  })

  // 🚨 捕获请求或解析过程中的异常
  .catch((error) => {
    console.error("体重数据加载失败：", error);
  });