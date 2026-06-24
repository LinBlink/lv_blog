---
title: "欢迎来到我的博客"
layout: "home" # 让它作为首页渲染
---

<style>
.magic-text {
  background: linear-gradient(
    90deg,
    #ff4d4f,
    #ff7a45,
    #ffa940,
    #73d13d,
    #40a9ff,
    #9254de
  );
  background-size: 300% 300%;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  font-weight: bold;
  position: relative;

  animation: gradientFlow 6s ease infinite,
             subtleFloat 3s ease-in-out infinite;
}

/* 🌈 彩虹流动 */
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 🌊 轻微漂浮（让文字更“活”） */
@keyframes subtleFloat {
  0%, 100% {
    transform: translateY(0px) scale(1);
    filter: brightness(1);
  }
  50% {
    transform: translateY(-2px) scale(1.02);
    filter: brightness(1.15);
  }
}

/* ✨ 额外加一层“扫光效果”（可选但很加分） */
.magic-text::after {
  content: "";
  position: absolute;
  top: 0;
  left: -60%;
  width: 50%;
  height: 100%;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.5),
    transparent
  );

  transform: skewX(-20deg);
  animation: shine 3.5s infinite;
}

@keyframes shine {
  0%,100% {
    left: -60%;
  }
  80% {
    left: 160%;
  }
}

.magic-text {
  position: relative;
  display: inline-block;
  will-change: transform, filter;
}

/* 🌬️ 风吹主动画 */
.magic-text {
  animation:
    gradientFlow 6s ease infinite,
    subtleFloat 3s ease-in-out infinite,
    windBlow 2.8s ease-in-out infinite;
}

/* 🌪️ 风吹：左右扰动 + 轻微拉伸 */
@keyframes windBlow {
  0% {
    transform: translateX(0px) skewX(0deg);
    filter: blur(0px);
  }

  20% {
    transform: translateX(-2px) skewX(-2deg);
    filter: blur(0.3px);
  }

  40% {
    transform: translateX(3px) skewX(2deg);
    filter: blur(0px);
  }

  60% {
    transform: translateX(-1px) skewX(-1deg);
    filter: blur(0.2px);
  }

  80% {
    transform: translateX(2px) skewX(1deg);
    filter: blur(0px);
  }

  100% {
    transform: translateX(0px) skewX(0deg);
    filter: blur(0px);
  }
}

.magic-text::before {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;

  width: 100%;
  height: 100%;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  opacity: 0.15;
  filter: blur(1px);

  animation: windGhost 2.8s ease-in-out infinite;
}

@keyframes windGhost {
  0% {
    transform: translateX(0px);
  }
  50% {
    transform: translateX(6px);
  }
  100% {
    transform: translateX(0px);
  }
}
</style>

## 是什么<span class="magic-text">大仙风</span>把你给刮来了🍃？
快来看看有没有你感兴趣的东西，我亲爱的朋友😉。

<div style="text-align:right">
📑<a href="/posts/work/resume">我的简历</a>
🧔<a href="/tags/面试官">面试官专用入口</a>
</div>

<div style="display:flex;gap:10px;justify-content: center;margin-top:20px">
<a href="https://github.com/linblink"><img alt="Bailin Wang" loading="lazy" src="https://img.shields.io/badge/LOCRIAN__V-181717?style=for-the-badge&amp;logo=github&amp;logoColor=white"></a>
<a href="https://musescore.com/locrianfifth"><img alt="MuseScore" loading="lazy" src="https://img.shields.io/badge/MuseScore-2E68B2?style=for-the-badge&amp;logoColor=white"></a>
</div>


<!-- ===================== WHAT I AM CAPABLE ===================== -->



<div class="mq-container" onclick="window.open('/posts/work/resume','_self')" style="cursor:pointer;">
  <div class="mq-track">
<!-- ========== 需要改变 ========== -->
<!-- 
<img alt="目的地澳大利亚" loading="lazy" src="https://img.shields.io/badge/目的地-澳大利亚_🦘-00843D?style=for-the-badge">
<img alt="PTE 备考" loading="lazy" src="https://img.shields.io/badge/PTE-备考中-blue?style=for-the-badge&logo=duolingo">
<img alt="签证积分" loading="lazy" src="https://img.shields.io/badge/签证积分-计算中-yellow?style=for-the-badge&logo=gov.uk">
<img alt="AWS SAA 认证" loading="lazy" src="https://img.shields.io/badge/AWS-SAA_认证-FF9900?style=for-the-badge&logo=amazonaws"> -->

<!-- ========== 后端 ========== -->
<img alt="JVM" loading="lazy" src="https://img.shields.io/badge/JVM-深度理解-brightgreen?style=for-the-badge&logo=openjdk">
<img alt="Spring Boot" loading="lazy" src="https://img.shields.io/badge/Spring_Boot-熟练运用-6DB33F?style=for-the-badge&logo=springboot">
<img alt="Spring 框架" loading="lazy" src="https://img.shields.io/badge/Spring_IoC/AOP-熟练运用-6DB33F?style=for-the-badge&logo=spring">
<img alt="Spring Security" loading="lazy" src="https://img.shields.io/badge/Spring_Security-掌握-critical?style=for-the-badge&logo=springsecurity">
<img alt="Redis" loading="lazy" src="https://img.shields.io/badge/Redis-无师自通-red?style=for-the-badge&logo=redis">
<img alt="Kafka" loading="lazy" src="https://img.shields.io/badge/Kafka-熟练运用-black?style=for-the-badge&logo=apachekafka">
<img alt="MyBatis" loading="lazy" src="https://img.shields.io/badge/MyBatis-掌握-blue?style=for-the-badge&logo=databricks">
<img alt="Elasticsearch" loading="lazy" src="https://img.shields.io/badge/Elasticsearch-掌握-005571?style=for-the-badge&logo=elasticsearch">
<img alt="RabbitMQ" loading="lazy" src="https://img.shields.io/badge/RabbitMQ-熟练运用-FF6600?style=for-the-badge&logo=rabbitmq">
<img alt="Nacos" loading="lazy" src="https://img.shields.io/badge/Nacos-掌握-blue?style=for-the-badge&logo=alibabacloud">
<img alt="Java 后端开发" loading="lazy" src="https://img.shields.io/badge/Java-后端开发-orange?style=for-the-badge&logo=openjdk">
<!-- ========== 前端  ========== -->
<img alt="JavaScript 精通" loading="lazy" src="https://img.shields.io/badge/JavaScript-精通-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
<img alt="Vue.js 掌握" loading="lazy" src="https://img.shields.io/badge/Vue.js-掌握-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white">
<img alt="React 掌握" loading="lazy" src="https://img.shields.io/badge/React-掌握-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img alt="Vite 掌握" loading="lazy" src="https://img.shields.io/badge/Vite-掌握-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img alt="Axios 掌握" loading="lazy" src="https://img.shields.io/badge/Axios-掌握-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
<img alt="TypeScript 了解" loading="lazy" src="https://img.shields.io/badge/TypeScript-了解-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img alt="Webpack 了解" loading="lazy" src="https://img.shields.io/badge/Webpack-掌握-8DD6F9?style=for-the-badge&logo=webpack&logoColor=black">
<!-- ==================== 专业证书 ==================== -->
<img alt="软考系统架构师" loading="lazy" src="https://img.shields.io/badge/软考-系统架构师-8B0000?style=for-the-badge&logo=checkmarx&logoColor=white">
<!-- ==================== 语言能力 ==================== -->
<img alt="英语六级 520" loading="lazy" src="https://img.shields.io/badge/英语-CET6-1E90FF?style=for-the-badge&logo=duolingo&logoColor=white">
<!-- ==================== 艺术特长 ==================== -->

<!-- TESLA -->
<img alt="Tesla Model 3" loading="lazy" src="https://img.shields.io/badge/Tesla-Model_3-CC0000?style=for-the-badge&logo=tesla&logoColor=white">

<!-- 兴趣爱好 -->

<img alt="复古游戏" loading="lazy" src="https://img.shields.io/badge/Retro_Gaming-永不过时-FF6B35?style=for-the-badge&logo=steam&logoColor=white">

<img alt="钢琴八级" loading="lazy" src="https://img.shields.io/badge/钢琴-中音八级-8A2BE2?style=for-the-badge&logo=musicbrainz&logoColor=white">

<img alt="Linux" loading="lazy" src="https://img.shields.io/badge/Linux-日常主力-FCC624?style=for-the-badge&logo=linux&logoColor=black">

<img alt="Stack Overflow" loading="lazy" src="https://img.shields.io/badge/Stack_Overflow-日常打酱油-F58025?style=for-the-badge&logo=stackoverflow&logoColor=white">

<img alt="Open Source" loading="lazy" src="https://img.shields.io/badge/Open_Source-感谢所有开源作者-3DA639?style=for-the-badge&logo=opensourceinitiative&logoColor=white">

<img alt="Self Hosted" loading="lazy" src="https://img.shields.io/badge/Self_Hosted-热爱自部署-0A0A0A?style=for-the-badge&logo=serverless&logoColor=white">



  </div>
</div>

<link rel="stylesheet" href="/homepage/homepage.css">
</link>
<script src="/homepage/homepage.js">
</script>

---