(function () {
  /* 用 IIFE 隔离作用域，避免变量污染全局 */
  var GAP = 20;          /* 和 CSS gap 保持一致 */
  var SPEED = 80;        /* px/s，调这个改速度 */
  var TIMEOUT = 2000;    /* shields.io 最长等待时间 ms */

  var container = document.currentScript.previousElementSibling.previousElementSibling;
  /* currentScript 指向本 <script> 标签，往前找到 .mq-container */
  /* 结构是: .mq-container -> <style> -> <script>，所以要 prev x2 */
  var track = container.querySelector('.mq-track');

  var imgs = Array.from(track.querySelectorAll('img'));
  var loaded = 0;
  var done = false;

  function setup() {
    if (done) return;
    done = true;

    /* 克隆一份 badges 拼在后面，实现无缝循环 */
    var origItems = Array.from(track.children);
    origItems.forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    /* 计算原始内容宽度（只算前半段） */
    var totalW = origItems.reduce(function (sum, el) {
      return sum + el.offsetWidth;
    }, 0) + GAP * (origItems.length - 1);

    /* 偏移量 = -(原始宽度 + 1个gap)，滚完后刚好对齐克隆起点 */
    var shift = -(totalW + GAP);
    var duration = Math.abs(shift) / SPEED;

    track.style.setProperty('--mq-shift', shift + 'px');
    track.style.animation = 'mq-scroll ' + duration + 's linear infinite';

    track.addEventListener('mouseenter', function () {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', function () {
      track.style.animationPlayState = 'running';
    });
  }

  /* 等所有图片加载完再量宽度 */
  if (imgs.length === 0) {
    setup();
  } else {
    var timer = setTimeout(setup, TIMEOUT); /* 超时兜底 */
    imgs.forEach(function (img) {
      function onLoad() {
        if (++loaded >= imgs.length) {
          clearTimeout(timer);
          setup();
        }
      }
      if (img.complete) { onLoad(); }
      else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
    });
  }
})();