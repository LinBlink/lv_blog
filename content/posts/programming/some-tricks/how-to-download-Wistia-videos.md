+++
date = '2026-06-23T20:26:17+08:00'
draft = false
title = 'Wistia视频下载方法'
categories = ["奇淫巧技"]
tags = [""]
[cover]
  image = ""
+++


## 自动插件（不维护）

此处粘贴Wistia播放器右键获取的视频链接：

<textarea id="input"></textarea>

<br>
<button onclick="parseVideo()">解析视频</button>

<div class="result" id="output"></div>


## 手动方法
1. **在正在播放的视频上右键**
   选择“复制链接（Copy link）”。

2. **从链接里找视频 ID**
   你会看到类似：

   ```
   wvideo=tra6gsm6rl
   ```

   这里的 `tra6gsm6rl` 就是视频的 ID。

   如果链接里没有，也可以：
   打开网页源代码（view source），搜索：

   ```
   hashedId=tra6gsm6rl
   ```

3. **打开嵌入页面**
   在浏览器里访问：

   ```
   http://fast.wistia.net/embed/iframe/ + 视频ID
   ```

   比如：

   ```
   http://fast.wistia.net/embed/iframe/tra6gsm6rl
   ```

4. **找真实视频文件地址**
   在打开的页面源代码里搜索：

   * 优先找：

     ```
     "type":"original"
     ```

     然后往下看一行，会有类似：

     ```
     "url":"http://embed.wistia.com/deliveries/xxxxx.bin"
     ```

   * 如果没有 original，就找：

     ```
     "type":"hd_mp4_video"
     ```

5. **下载视频**
   把找到的链接复制出来，把后缀从：

   ```
   .bin
   ```

   改成：

   ```
   .mp4
   ```

   然后直接打开或下载就行。



转载自：https://gist.github.com/szepeviktor/2a8a3ce8b32e2a67ca416ffd077553c5



<style>
   textarea {
  width: 100%;
  height: 140px;
  padding: 10px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1.5px solid #d0cfc8;
  border-radius: 8px;
  background: #fff;
  color: #1a1a1a;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.6;
}

textarea::placeholder {
  color: #aaa;
}

textarea:hover {
  border-color: #b0afa8;
}

textarea:focus {
  border-color: #534AB7;
  box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.12);
}

.md-content button {
  margin-top: 10px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  font-weight: 500;
  border: 1.5px solid #d0cfc8;
  border-radius: 8px;
  background: #fff;
  color: #1a1a1a;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  outline: none;
}

.md-content button:hover {
  background: #f5f4f0;
  border-color: #999;
}

.md-content button:active {
  transform: scale(0.98);
  background: #eeede8;
}

.md-content button:focus-visible {
  box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.18);
  border-color: #534AB7;
}
</style>

<script>
async function parseVideo() {
  const input = document.getElementById("input").value;
  const output = document.getElementById("output");

  function extractVideoId(text) {
    let m = text.match(/wvideo=([a-zA-Z0-9]+)/);
    if (m) return m[1];

    m = text.match(/hashedId=([a-zA-Z0-9]+)/);
    if (m) return m[1];

    return null;
  }

  function extractVideoUrl(html) {
    let m = html.match(/"type":"original".*?"url":"(https?:\/\/[^"]+)"/);
    if (m) return m[1].replace(".bin", ".mp4");

    m = html.match(/"type":"hd_mp4_video".*?"url":"(https?:\/\/[^"]+)"/);
    if (m) return m[1].replace(".bin", ".mp4");

    return null;
  }

  output.innerHTML = "⏳ 解析中...";

  const videoId = extractVideoId(input);

  if (!videoId) {
    output.innerHTML = "❌ 没找到 wvideo 或 hashedId";
    return;
  }

  const embedUrl = `https://fast.wistia.net/embed/iframe/${videoId}`;

  try {
    const res = await fetch(embedUrl);
    const html = await res.text();

    const videoUrl = extractVideoUrl(html);

    if (!videoUrl) {
      output.innerHTML = "❌ 没找到视频直链";
      return;
    }

    output.innerHTML = `
      <div><span class="label">Video ID：</span>${videoId}</div>
      <div style="margin-top:10px"><span class="label">MP4 直链：</span></div>
      <div>${videoUrl}</div>
      <br>
      <button onclick="navigator.clipboard.writeText('${videoUrl}')">📋 复制链接</button>
    `;

  } catch (e) {
    output.innerHTML = "❌ 请求失败：" + e.message;
  }
}
</script>