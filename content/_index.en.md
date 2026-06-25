---
title: "Welcome to My Blog"
layout: "home" # Rendition as homepage

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

## What kind of <span class="magic-text">Ethereal Wind</span> blew you in🍃!

Come on in and see if anything catches your eye, my dear friend😉. 

英文博客还没有维护，所以这里连个蛋🥚都没有。

<div style="text-align:right">
📑<a href="/en/posts/work/resume">My Resume</a>
🧔<a href="/en/tags/interviewer">Interviewer's Portal</a>
</div>



<div style="display:flex;gap:10px;justify-content: center;margin-top:20px">
<a href="https://github.com/linblink"><img alt="Bailin Wang" loading="lazy" src="https://img.shields.io/badge/LOCRIAN__V-181717?style=for-the-badge&amp;logo=github&amp;logoColor=white"></a>
<a href="https://musescore.com/locrianfifth"><img alt="MuseScore" loading="lazy" src="https://img.shields.io/badge/MuseScore-2E68B2?style=for-the-badge&amp;logoColor=white"></a>
</div>


<!-- ===================== 粘贴进MD的内容从这里开始 ===================== -->



<div class="mq-container" onclick="window.open('/en/posts/work/resume','_self')" style="cursor:pointer;">
  <div class="mq-track">
  
<!-- 
<img alt="AWS SAA Certified" loading="lazy" src="https://img.shields.io/badge/AWS-SAA_Certified-FF9900?style=for-the-badge&logo=amazonaws">
<img alt="Destination Australia" loading="lazy" src="https://img.shields.io/badge/Destination-Australia_🦘-00843D?style=for-the-badge">
<img alt="PTE Preparation" loading="lazy" src="https://img.shields.io/badge/PTE-Preparing-blue?style=for-the-badge&logo=duolingo">
<img alt="Visa Points" loading="lazy" src="https://img.shields.io/badge/Visa_Points-Calculating-yellow?style=for-the-badge&logo=gov.uk"> 
-->

<!-- ========== Tech Stack & Goals ========== -->
<img alt="Java Backend Development" loading="lazy" src="https://img.shields.io/badge/Java-Backend_Dev-orange?style=for-the-badge&logo=openjdk">

<img alt="JVM" loading="lazy" src="https://img.shields.io/badge/JVM-Deep_Understanding-brightgreen?style=for-the-badge&logo=openjdk">
<img alt="Spring Boot" loading="lazy" src="https://img.shields.io/badge/Spring_Boot-Proficient-6DB33F?style=for-the-badge&logo=springboot">
<img alt="Spring Framework" loading="lazy" src="https://img.shields.io/badge/Spring_IoC/AOP-Proficient-6DB33F?style=for-the-badge&logo=spring">
<img alt="Spring Security" loading="lazy" src="https://img.shields.io/badge/Spring_Security-Competent-critical?style=for-the-badge&logo=springsecurity">
<img alt="Redis" loading="lazy" src="https://img.shields.io/badge/Redis-Self_Taught-red?style=for-the-badge&logo=redis">
<img alt="Kafka" loading="lazy" src="https://img.shields.io/badge/Kafka-Proficient-black?style=for-the-badge&logo=apachekafka">
<img alt="MyBatis" loading="lazy" src="https://img.shields.io/badge/MyBatis-Competent-blue?style=for-the-badge&logo=databricks">
<img alt="Elasticsearch" loading="lazy" src="https://img.shields.io/badge/Elasticsearch-Competent-005571?style=for-the-badge&logo=elasticsearch">
<img alt="RabbitMQ" loading="lazy" src="https://img.shields.io/badge/RabbitMQ-Proficient-FF6600?style=for-the-badge&logo=rabbitmq">
<img alt="Nacos" loading="lazy" src="https://img.shields.io/badge/Nacos-Competent-blue?style=for-the-badge&logo=alibabacloud">

<!-- ========== Frontend ========== -->
<img alt="JavaScript Expert" loading="lazy" src="https://img.shields.io/badge/JavaScript-Expert-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
<img alt="Vue.js Competent" loading="lazy" src="https://img.shields.io/badge/Vue.js-Competent-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white">
<img alt="React Competent" loading="lazy" src="https://img.shields.io/badge/React-Competent-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img alt="Axios Competent" loading="lazy" src="https://img.shields.io/badge/Axios-Competent-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
<img alt="TypeScript Familiar" loading="lazy" src="https://img.shields.io/badge/TypeScript-Familiar-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img alt="Webpack Competent" loading="lazy" src="https://img.shields.io/badge/Webpack-Competent-8DD6F9?style=for-the-badge&logo=webpack&logoColor=black">
  </div>
</div>


<link rel="stylesheet" href="/homepage/homepage.css">
</link>
<script src="/homepage\homepage.js">
</script>

---