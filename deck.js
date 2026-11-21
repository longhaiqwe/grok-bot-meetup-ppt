/*
 * 极简暖纸网页演示交互脚本（17 页）
 * 支持：1920×1080 等比缩放、键盘/点击/触控翻页、分步揭晓(.frag)、URL 锚点(#1-#17)、
 * 4 套主题切换(1-4)、总览模式(O)、快速跳页(G/点击页码)、全屏(F)、画笔批注(P)、可选素材自动探测与本地预览。
 */
(() => {
  const THEMES = [
    ['warm', '暖纸'],
    ['light', '极简白'],
    ['dark', '夜幕'],
    ['editorial', '报刊']
  ];

  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const slides = [...stage.querySelectorAll('.slide')];
  const total = slides.length;
  const progressBar = document.querySelector('.progress i');
  const toolbar = document.querySelector('.toolbar');
  const counterEl = toolbar.querySelector('[data-counter]');
  const hintEl = toolbar.querySelector('[data-hint]');
  const prevBtn = toolbar.querySelector('[data-prev]');
  const nextBtn = toolbar.querySelector('[data-next]');

  const pad = n => String(n).padStart(2, '0');
  let cur = 0;
  let overviewActive = false;

  const CASES = [
    { id: '1', no: '01', label: '互动 · 脑筋急转弯' },
    { id: '2', no: '02', label: '学习 · 英语动画' },
    { id: '3', no: '03', label: '创作 · 画作美化' }
  ];

  // 1. 注入三案例定位条、极简右下角页码与入场延迟
  slides.forEach((slide, idx) => {
    const activeCase = slide.dataset.case;
    if (activeCase) {
      const nav = document.createElement('nav');
      nav.className = 'case-nav';
      nav.setAttribute('aria-label', '案例导航');
      nav.setAttribute('data-no-nav', '');

      CASES.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'case-tab';
        if (c.id === activeCase) btn.setAttribute('aria-current', 'step');
        btn.innerHTML = `<span>${c.no}</span>${c.label}`;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (overviewActive) return;
          const targetIdx = slides.findIndex(s => s.dataset.case === c.id);
          if (targetIdx >= 0) show(targetIdx, false);
        });
        nav.appendChild(btn);
      });
      slide.prepend(nav);
    }

    const pg = document.createElement('span');
    pg.className = 'pg-num';
    pg.textContent = `${pad(idx + 1)} / ${pad(total)}`;
    slide.appendChild(pg);

    slide.querySelectorAll('.st').forEach(group => {
      [...group.children].forEach((el, i) => el.style.setProperty('--i', i));
    });
  });

  // 1b. 生成第 3 页「18 岁前 936 个周末 + 18 岁后渐隐成年边界」点阵图
  const renderWeekendChart = () => {
    const host = stage.querySelector('[data-weekend-chart]');
    if (!host) return;

    const groups = [
      { label: '0–5 岁', sub: '', count: '已过 244', state: 'past', accent: false, rows: [50, 50, 50, 48, 46] },
      { label: '5–6 岁', sub: '', count: '44 周', state: 'left', accent: true, rows: [44] },
      { label: '小学', sub: '6–12 岁', count: '180 周', state: 'left', accent: false, rows: [40, 36, 32, 28, 24, 20] },
      { label: '初中', sub: '12–15 岁', count: '36 周', state: 'left', accent: false, rows: [16, 12, 8] },
      { label: '高中', sub: '15–18 岁', count: '12 周', state: 'left', accent: false, rows: [6, 4, 2] }
    ];
    const extraGapAfter = [0, 26, 8, 10, 10, 20];
    const x0 = 96;
    const dx = 13.8;
    const dy = 18;
    const yStart = 14;
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, text) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
      if (text !== undefined) node.textContent = text;
      return node;
    };

    const svg = el('svg', {
      class: 'dot-svg',
      viewBox: '0 0 928 462',
      role: 'img',
      'aria-label': '18 岁前 936 个周末与 18 岁后成年边界点阵图：0 到 5 岁已陪伴 244 个，5 岁之后剩余陪伴 272 个，长大不再同行 420 个；18 岁之后离家成年共同周末几乎归零'
    });

    let y = yStart;
    groups.forEach((g, gi) => {
      const yFirst = y;
      g.rows.forEach((together, ri) => {
        const cy = y;
        for (let col = 0; col < 52; col++) {
          const cx = (x0 + col * dx).toFixed(1);
          const cls = col < together ? (g.state === 'past' ? 'dot-past' : 'dot-left') : 'dot-apart';
          const r = col < together ? (g.state === 'past' ? '4.4' : '4.9') : '3.6';
          svg.appendChild(el('circle', { class: cls, cx, cy, r }));
        }
        if (ri < g.rows.length - 1) y += dy;
      });
      const yLast = y;
      const yMid = (yFirst + yLast) / 2;

      const stageCls = `dot-stage${g.state === 'past' ? ' is-past' : ''}${g.accent ? ' is-accent' : ''}`;
      if (g.sub) {
        svg.appendChild(el('text', { class: stageCls, x: 78, y: yMid - 10, 'text-anchor': 'end', 'dominant-baseline': 'central' }, g.label));
        svg.appendChild(el('text', { class: 'dot-sub', x: 78, y: yMid + 11, 'text-anchor': 'end', 'dominant-baseline': 'central' }, g.sub));
      } else {
        svg.appendChild(el('text', { class: stageCls, x: 78, y: yMid, 'text-anchor': 'end', 'dominant-baseline': 'central' }, g.label));
      }

      const countCls = `dot-count${g.state === 'past' ? ' is-past' : ''}`;
      svg.appendChild(el('text', { class: countCls, x: 822, y: yMid, 'text-anchor': 'start', 'dominant-baseline': 'central' }, g.count));

      if (gi === 0) {
        const divY = y + (dy + extraGapAfter[1]) / 2;
        svg.appendChild(el('line', { class: 'dot-divider', x1: 88, y1: divY, x2: 808, y2: divY }));
        svg.appendChild(el('text', { class: 'dot-now', x: 822, y: divY, 'text-anchor': 'start', 'dominant-baseline': 'central' }, '现在 · 5 岁'));
      }

      if (gi < groups.length - 1) {
        y += dy + extraGapAfter[gi + 1];
      }
    });

    // 18 岁成年边界 + 3 行渐隐空心点（示意成年后共同周末几乎归零）
    const adultDivY = y + (dy + extraGapAfter[5]) / 2;
    svg.appendChild(el('line', { class: 'dot-divider-adult', x1: 88, y1: adultDivY, x2: 808, y2: adultDivY }));

    let adultY = y + dy + extraGapAfter[5];
    const adultFirst = adultY;
    for (let row = 0; row < 3; row++) {
      const fadeGroup = el('g', { class: `dot-fade-${row + 1}` });
      for (let col = 0; col < 52; col++) {
        const cx = (x0 + col * dx).toFixed(1);
        fadeGroup.appendChild(el('circle', { class: 'dot-apart dot-adult', cx, cy: adultY, r: '3.6' }));
      }
      svg.appendChild(fadeGroup);
      if (row < 2) adultY += dy;
    }
    const adultMid = (adultFirst + adultY) / 2;
    svg.appendChild(el('text', { class: 'dot-stage is-past', x: 78, y: adultMid - 10, 'text-anchor': 'end', 'dominant-baseline': 'central' }, '18 岁后'));
    svg.appendChild(el('text', { class: 'dot-sub', x: 78, y: adultMid + 10, 'text-anchor': 'end', 'dominant-baseline': 'central' }, '离家 · 成年'));
    svg.appendChild(el('text', { class: 'dot-count is-past', x: 822, y: adultMid, 'text-anchor': 'start', 'dominant-baseline': 'central' }, '几乎归零'));

    host.innerHTML = '';
    host.appendChild(svg);
  };
  renderWeekendChart();

  // 2. 自动探测可选素材 + 支持本地文件临时预览
  const mountMedia = (container, type, src) => {
    container.innerHTML = '';
    if (type === 'video') {
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      container.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = container.closest('.evo-item')?.querySelector('.evo-cap')?.textContent || '演示素材';
      container.appendChild(img);
    }
  };

  document.querySelectorAll('[data-media-slot]').forEach(slot => {
    const type = slot.dataset.mediaSlot;
    const expectedSrc = slot.dataset.src;
    const accept = slot.dataset.accept || '*/*';

    if (expectedSrc && location.protocol.startsWith('http')) {
      fetch(expectedSrc, { method: 'HEAD' })
        .then(res => {
          if (res.ok) mountMedia(slot, type, expectedSrc);
        })
        .catch(() => {});
    }

    const pickBtn = slot.querySelector('[data-pick-media]');
    if (pickBtn) {
      pickBtn.addEventListener('click', e => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          mountMedia(slot, type, URL.createObjectURL(file));
        };
        input.click();
      });
    }
  });

  // 3. 画笔批注
  let isDrawing = false;
  let activeStroke = null;
  const annotations = new Map();
  const drawingOptions = document.querySelector('.drawing-options');
  const undoButton = drawingOptions.querySelector('[data-undo]');
  const clearButton = drawingOptions.querySelector('[data-clear]');
  const penCloseButton = drawingOptions.querySelector('[data-pen-close]');
  const penColor = drawingOptions.querySelector('[data-pen-color]');
  const penWidth = drawingOptions.querySelector('[data-pen-width]');
  let penButton = null;

  const updateDrawingTools = () => {
    const hasStrokes = !!annotations.get(cur)?.strokes.length;
    undoButton.disabled = clearButton.disabled = !hasStrokes;
  };

  const finishStroke = () => {
    if (!activeStroke) return;
    const { canvas, pointerId } = activeStroke;
    activeStroke = null;
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    updateDrawingTools();
  };

  const paintStroke = (ctx, stroke) => {
    ctx.strokeStyle = ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    const [first, ...rest] = stroke.points;
    if (!rest.length) {
      ctx.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(first.x, first.y);
      rest.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  };

  const redraw = annotation => {
    annotation.context.clearRect(0, 0, annotation.canvas.width, annotation.canvas.height);
    annotation.strokes.forEach(s => paintStroke(annotation.context, s));
  };

  const getAnnotation = () => {
    if (annotations.has(cur)) return annotations.get(cur);
    const canvas = document.createElement('canvas');
    canvas.className = 'drawing-canvas';
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.setAttribute('aria-hidden', 'true');
    slides[cur].appendChild(canvas);

    const annotation = { canvas, context: canvas.getContext('2d'), strokes: [] };
    annotations.set(cur, annotation);

    const getPoint = event => {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
        y: ((event.clientY - bounds.top) * canvas.height) / bounds.height
      };
    };

    canvas.addEventListener('pointerdown', event => {
      if (!isDrawing || !event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      finishStroke();
      const stroke = {
        color: penColor.value,
        width: Number(penWidth.value),
        points: [getPoint(event)]
      };
      annotation.strokes.push(stroke);
      activeStroke = { canvas, pointerId: event.pointerId, stroke };
      canvas.setPointerCapture(event.pointerId);
      paintStroke(annotation.context, stroke);
      updateDrawingTools();
    });

    canvas.addEventListener('pointermove', event => {
      if (activeStroke?.canvas !== canvas || activeStroke.pointerId !== event.pointerId) return;
      const samples = event.getCoalescedEvents?.() || [];
      (samples.length ? samples : [event]).forEach(sample => {
        const pts = activeStroke.stroke.points;
        const pt = getPoint(sample);
        paintStroke(annotation.context, {
          ...activeStroke.stroke,
          points: [pts[pts.length - 1], pt]
        });
        pts.push(pt);
      });
    });

    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
      canvas.addEventListener(type, event => {
        if (activeStroke?.pointerId === event.pointerId) finishStroke();
      });
    });

    return annotation;
  };

  const setDrawing = enabled => {
    if (enabled) setJumping(false);
    finishStroke();
    isDrawing = enabled;
    document.body.classList.toggle('drawing', enabled);
    penButton?.setAttribute('aria-pressed', String(enabled));
    drawingOptions.hidden = !enabled;
    if (enabled) getAnnotation();
    updateDrawingTools();
  };

  // 3b. 快速跳页（点击工具栏页码或按 G）
  let jumping = false;
  const jumpMenu = document.getElementById('jumpMenu');
  const jumpForm = jumpMenu?.querySelector('[data-jump-form]');
  const jumpInput = jumpMenu?.querySelector('[data-jump-input]');
  const jumpTotal = jumpMenu?.querySelector('[data-jump-total]');
  const jumpList = jumpMenu?.querySelector('[data-jump-list]');
  const jumpItems = [];

  const syncJumpList = () => {
    jumpItems.forEach((btn, idx) => {
      const active = idx === cur;
      btn.classList.toggle('is-cur', active);
      btn.setAttribute('aria-selected', String(active));
    });
  };

  function setJumping(enabled, { focusInput = false } = {}) {
    if (!jumpMenu) return;
    if (enabled && isDrawing) setDrawing(false);
    jumping = enabled;
    document.body.classList.toggle('jumping', enabled);
    counterEl.setAttribute('aria-expanded', String(enabled));
    jumpMenu.hidden = !enabled;
    if (!enabled) return;

    syncJumpList();
    if (jumpInput) {
      jumpInput.value = '';
      jumpInput.placeholder = pad(cur + 1);
      if (focusInput) {
        requestAnimationFrame(() => {
          jumpInput.focus();
          jumpInput.select();
        });
      }
    }
    requestAnimationFrame(() => {
      jumpItems[cur]?.scrollIntoView({ block: 'nearest' });
    });
    wake?.();
  }

  const jumpTo = idx => {
    setJumping(false);
    if (overviewActive) setOverview(false);
    show(idx, false);
  };

  if (jumpMenu && jumpList) {
    if (jumpInput) jumpInput.max = String(total);
    if (jumpTotal) jumpTotal.textContent = `/ ${pad(total)}`;

    slides.forEach((slide, idx) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'jump-item';
      item.setAttribute('role', 'option');

      const no = document.createElement('span');
      no.className = 'no';
      no.textContent = pad(idx + 1);

      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = slide.dataset.title || `第 ${idx + 1} 页`;

      item.append(no, title);
      item.addEventListener('click', e => {
        e.stopPropagation();
        jumpTo(idx);
      });
      jumpList.appendChild(item);
      jumpItems.push(item);
    });

    jumpMenu.addEventListener('click', e => e.stopPropagation());
    jumpForm?.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      const raw = parseInt(jumpInput?.value || '', 10);
      if (Number.isInteger(raw)) {
        jumpTo(Math.max(0, Math.min(total - 1, raw - 1)));
      } else {
        setJumping(false);
      }
    });
    jumpInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        jumpInput.blur();
        setJumping(false);
      }
    });
    counterEl.addEventListener('click', e => {
      e.stopPropagation();
      setJumping(!jumping, { focusInput: false });
    });
    document.addEventListener('pointerdown', e => {
      if (!jumping) return;
      if (e.target.closest('#jumpMenu, [data-counter]')) return;
      setJumping(false);
    });
  }

  drawingOptions.addEventListener('click', e => e.stopPropagation());
  penCloseButton?.addEventListener('click', () => setDrawing(false));
  undoButton.addEventListener('click', () => {
    finishStroke();
    const annotation = annotations.get(cur);
    if (!annotation) return;
    annotation.strokes.pop();
    redraw(annotation);
    updateDrawingTools();
  });
  clearButton.addEventListener('click', () => {
    finishStroke();
    const annotation = annotations.get(cur);
    if (!annotation) return;
    annotation.strokes.length = 0;
    redraw(annotation);
    updateDrawingTools();
  });

  // 4. 翻页与分步揭晓（.frag）
  const pauseVideosIn = slide => {
    slide?.querySelectorAll('video').forEach(v => {
      if (!v.paused) v.pause();
      if (v.hasAttribute('data-autoplay')) v.currentTime = 0;
    });
  };

  const playAutoVideosIn = slide => {
    if (overviewActive) return;
    slide?.querySelectorAll('video[data-autoplay]').forEach(v => {
      v.currentTime = 0;
      v.play().catch(() => {});
    });
  };

  const getFrags = slide => [...slide.querySelectorAll('.frag')];
  const stepKey = (el, i) => el.dataset.step ?? `i${i}`;

  const syncFragUI = () => {
    const fs = getFrags(slides[cur]);
    const hasHidden = fs.some(f => !f.classList.contains('on'));
    const hasShown = fs.some(f => f.classList.contains('on'));
    slides[cur].querySelector('.pg-num')?.setAttribute('data-more', String(hasHidden));
    prevBtn.disabled = cur === 0 && !hasShown;
    nextBtn.disabled = cur === total - 1 && !hasHidden;
  };

  const show = (index, revealAll = false) => {
    const nextIdx = Math.max(0, Math.min(total - 1, index));
    if (slides[cur] && cur !== nextIdx) pauseVideosIn(slides[cur]);
    cur = nextIdx;

    slides.forEach((s, i) => {
      s.classList.toggle('active', i === cur);
      s.classList.toggle('past', i < cur);
    });

    getFrags(slides[cur]).forEach(f => f.classList.toggle('on', revealAll));
    playAutoVideosIn(slides[cur]);

    counterEl.textContent = `${pad(cur + 1)} / ${pad(total)}`;
    progressBar.style.width = `${((cur + 1) / total) * 100}%`;
    syncFragUI();
    syncJumpList();

    const targetHash = `#${cur + 1}`;
    if (location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }

    if (isDrawing) getAnnotation();
    updateDrawingTools();
  };

  const next = () => {
    const fs = getFrags(slides[cur]);
    const firstHiddenIdx = fs.findIndex(f => !f.classList.contains('on'));
    if (firstHiddenIdx >= 0) {
      const targetStep = stepKey(fs[firstHiddenIdx], firstHiddenIdx);
      fs.forEach((f, j) => {
        if (stepKey(f, j) === targetStep) f.classList.add('on');
      });
      syncFragUI();
      return;
    }
    if (cur < total - 1) show(cur + 1, false);
  };

  const prev = () => {
    const fs = getFrags(slides[cur]);
    const shown = fs.map((f, j) => [f, j]).filter(([f]) => f.classList.contains('on'));
    if (shown.length) {
      const [lastEl, lastIdx] = shown[shown.length - 1];
      const targetStep = stepKey(lastEl, lastIdx);
      shown.forEach(([f, j]) => {
        if (stepKey(f, j) === targetStep) f.classList.remove('on');
      });
      syncFragUI();
      return;
    }
    if (cur > 0) show(cur - 1, true);
  };

  prevBtn.addEventListener('click', e => {
    e.stopPropagation();
    prev();
  });
  nextBtn.addEventListener('click', e => {
    e.stopPropagation();
    next();
  });

  // 5. 画布缩放与总览模式
  const fit = () => {
    const w = document.documentElement.clientWidth || window.innerWidth;
    const h = document.documentElement.clientHeight || window.innerHeight;
    const scale = Math.min(w / 1920, h / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  const scaleOverviewCards = () => {
    stage.querySelectorAll('.ov-frame').forEach(frame => {
      const slide = frame.querySelector('.slide');
      if (!slide) return;
      slide.style.transform = `scale(${frame.clientWidth / 1920})`;
    });
  };

  const setOverview = on => {
    if (on === overviewActive) return;
    overviewActive = on;
    if (on) {
      setDrawing(false);
      setJumping(false);
    }

    document.body.classList.toggle('overview', on);
    toolbar.querySelector('[data-ov]')?.setAttribute('aria-pressed', String(on));

    if (on) {
      slides.forEach(s => pauseVideosIn(s));
      const frag = document.createDocumentFragment();
      slides.forEach((slide, idx) => {
        const item = document.createElement('div');
        item.className = `ov-item${idx === cur ? ' is-cur' : ''}`;

        const frame = document.createElement('div');
        frame.className = 'ov-frame';
        frame.appendChild(slide);

        const label = document.createElement('div');
        label.className = 'ov-label';
        label.innerHTML = `<span>${pad(idx + 1)}</span>${slide.dataset.title || ''}`;

        item.appendChild(frame);
        item.appendChild(label);
        item.addEventListener('click', () => {
          setOverview(false);
          show(idx, false);
        });
        frag.appendChild(item);
      });
      stage.innerHTML = '';
      stage.appendChild(frag);
      scaleOverviewCards();
      requestAnimationFrame(() => {
        scaleOverviewCards();
        stage.querySelector('.ov-item.is-cur')?.scrollIntoView({ block: 'center' });
      });
    } else {
      stage.innerHTML = '';
      slides.forEach(slide => {
        slide.style.transform = '';
        stage.appendChild(slide);
      });
      fit();
      show(cur, false);
    }
  };

  // 6. 主题切换与工具条
  const setTheme = theme => {
    root.dataset.theme = theme;
    toolbar.querySelectorAll('[data-t]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.t === theme));
    });
    try {
      localStorage.setItem('grok-meetup-ppt-theme', theme);
    } catch (_) {}
  };

  THEMES.forEach(([key, name], idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.t = key;
    btn.textContent = `${idx + 1} ${name}`;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setTheme(key);
    });
    toolbar.insertBefore(btn, hintEl);
  });

  const mobileThemeBtn = document.createElement('button');
  mobileThemeBtn.type = 'button';
  mobileThemeBtn.dataset.themeNext = '';
  mobileThemeBtn.textContent = '切风格';
  mobileThemeBtn.addEventListener('click', e => {
    e.stopPropagation();
    const idx = THEMES.findIndex(item => item[0] === root.dataset.theme);
    setTheme(THEMES[(idx + 1) % THEMES.length][0]);
  });
  toolbar.insertBefore(mobileThemeBtn, hintEl);

  const sep = document.createElement('span');
  sep.className = 'sep';
  sep.setAttribute('aria-hidden', 'true');
  toolbar.insertBefore(sep, hintEl);

  const ovBtn = document.createElement('button');
  ovBtn.type = 'button';
  ovBtn.dataset.ov = '';
  ovBtn.setAttribute('aria-pressed', 'false');
  ovBtn.textContent = '总览 O';
  ovBtn.addEventListener('click', e => {
    e.stopPropagation();
    setOverview(!overviewActive);
  });
  toolbar.insertBefore(ovBtn, hintEl);

  penButton = document.createElement('button');
  penButton.type = 'button';
  penButton.dataset.pen = '';
  penButton.setAttribute('aria-pressed', 'false');
  penButton.textContent = '画笔 P';
  penButton.addEventListener('click', e => {
    e.stopPropagation();
    if (!overviewActive) setDrawing(!isDrawing);
  });
  toolbar.insertBefore(penButton, hintEl);

  const fsBtn = document.createElement('button');
  fsBtn.type = 'button';
  fsBtn.dataset.fs = '';
  fsBtn.textContent = '全屏 F';
  fsBtn.addEventListener('click', e => {
    e.stopPropagation();
    document.fullscreenElement
      ? document.exitFullscreen()
      : root.requestFullscreen?.();
  });
  toolbar.insertBefore(fsBtn, hintEl);

  const validTheme = t => THEMES.some(item => item[0] === t);
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('grok-meetup-ppt-theme');
  } catch (_) {}
  const params = new URLSearchParams(location.search);
  const queryTheme = params.get('theme');
  setTheme(validTheme(queryTheme) ? queryTheme : validTheme(savedTheme) ? savedTheme : 'warm');

  const initialPage = (parseInt(location.hash.slice(1), 10) || 1) - 1;
  const revealOnInit = params.get('reveal') === '1';
  show(initialPage, revealOnInit);
  fit();
  if (params.get('view') === 'overview') {
    setOverview(true);
  }

  window.addEventListener('resize', () => {
    if (overviewActive) scaleOverviewCards();
    else fit();
  });

  window.addEventListener('hashchange', () => {
    const idx = (parseInt(location.hash.slice(1), 10) || 1) - 1;
    if (idx !== cur) show(idx, false);
  });

  window.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea, [contenteditable]')) return;
    if (e.target.closest('button, video') && [' ', 'Enter'].includes(e.key)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const k = e.key;
    if ((k === 'p' || k === 'P') && !overviewActive) {
      e.preventDefault();
      setDrawing(!isDrawing);
      return;
    }
    if (k === 'g' || k === 'G') {
      e.preventDefault();
      setJumping(!jumping, { focusInput: !jumping });
      return;
    }
    if (k === 'o' || k === 'O') {
      e.preventDefault();
      setOverview(!overviewActive);
      return;
    }
    if (k === 'Escape') {
      if (jumping) setJumping(false);
      else if (isDrawing) setDrawing(false);
      else if (overviewActive) setOverview(false);
      return;
    }
    if (/^[1-4]$/.test(k)) {
      setTheme(THEMES[Number(k) - 1][0]);
      return;
    }
    if (k === 't' || k === 'T') {
      const idx = THEMES.findIndex(item => item[0] === root.dataset.theme);
      setTheme(THEMES[(idx + 1) % THEMES.length][0]);
      return;
    }
    if (overviewActive) return;

    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) {
      e.preventDefault();
      next();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) {
      e.preventDefault();
      prev();
    } else if (k === 'Home') {
      e.preventDefault();
      show(0, false);
    } else if (k === 'End') {
      e.preventDefault();
      show(total - 1, true);
    } else if (k === 'f' || k === 'F') {
      document.fullscreenElement
        ? document.exitFullscreen()
        : root.requestFullscreen?.();
    }
  });

  stage.addEventListener('click', e => {
    if (isDrawing || overviewActive) return;
    if (e.target.closest('video, button, a, input, select, label, [data-no-nav]')) return;
    if (window.getSelection()?.toString()) return;
    if (e.clientX < window.innerWidth * 0.28) prev();
    else next();
  });

  let touchX = null;
  window.addEventListener(
    'touchstart',
    e => {
      if (isDrawing || overviewActive || e.target.closest('.toolbar, .drawing-options, video, [data-no-nav]')) {
        touchX = null;
        return;
      }
      touchX = e.touches[0].clientX;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    e => {
      if (touchX === null || overviewActive || isDrawing) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) {
        dx < 0 ? next() : prev();
      }
    },
    { passive: true }
  );

  let idleTimer;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 2400);
  };
  window.addEventListener('mousemove', wake, { passive: true });
  window.addEventListener('touchstart', wake, { passive: true });
  wake();
})();
