(function () {
  var GAP = 20;
  var SPEED = 80;
  var TIMEOUT = 2000;

  var container = document.currentScript.previousElementSibling.previousElementSibling;
  var track = container.querySelector('.mq-track');
  var imgs = Array.from(track.querySelectorAll('img'));

  var loaded = 0;
  var done = false;

  // Fisher-Yates shuffle（标准版）
  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }

  function setup() {
    if (done) return;
    done = true;

    // ✅ 关键：确保拿到“最终完整DOM”（包括可能后加载插入的）
    var items = Array.from(track.children);

    // 防止重复 setup 时 clone 叠加
    items.forEach(function (el) {
      if (el.dataset.cloned === "1") return;
    });

    // shuffle
    shuffleArray(items);

    // 清空重排（避免“后加载永远排在后面”）
    track.innerHTML = "";

    // 重新按随机顺序插回
    items.forEach(function (el) {
      track.appendChild(el);
    });

    // clone 一份用于无缝滚动
    var originalItems = Array.from(track.children);

    originalItems.forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.cloned = "1";
      track.appendChild(clone);
    });

    // 计算宽度
    var totalW = originalItems.reduce(function (sum, el) {
      return sum + el.offsetWidth;
    }, 0) + GAP * (originalItems.length - 1);

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

  // 图片加载监听
  if (imgs.length === 0) {
    setup();
  } else {
    var timer = setTimeout(setup, TIMEOUT);

    imgs.forEach(function (img) {
      function onLoad() {
        if (++loaded >= imgs.length) {
          clearTimeout(timer);
          setup();
        }
      }

      if (img.complete) {
        onLoad();
      } else {
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onLoad);
      }
    });
  }
})();