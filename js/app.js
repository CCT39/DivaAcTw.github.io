const { createApp, ref, reactive, onMounted, nextTick } = Vue;

// ==================== 常數定義 ====================
const CONFIG = {
  defaultLang: 'zh-TW',
  mobileBreakpoint: 900,
  map: {
    centre: [23.7, 121],
    zoom: 8,
    tileOpacity: 0.6
  },
  spectrum: {
    width: 250,
    height: 500,
    margin: { top: 40, bottom: 40, left: 120, right: 20 },
    barWidth: 100
  },
  marker: {
    radius: 8,
    highlightRadius: 14,
    weight: 1.5,
    highlightWeight: 3,
    fillOpacity: 0.85,
    borderColour: '#555',
    highlightBorderColour: '#333'
  },
  colours: {
    green: '#59fe4a',
    yellow: '#ffeb3b',
    red: '#f44336',
    mikuCyan: '#39c5bb',
    mikuPink: '#e12885',
    unknown: '#999',
    stroke: '#333',
    strokeHighlight: '#000',
    weakStroke: '#bbb',
    weakStrokeHighlight: '#888'
  }
};

const LANGUAGES = [
  { code: 'zh-TW', name: '正體中文' },
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' }
];

// ==================== 工具函數 ====================

/** 判斷是否為手機版 */
const isMobile = () => window.innerWidth <= CONFIG.mobileBreakpoint;

/** 建立顏色映射函數 */
const createColourScale = () => {
  const { red, yellow, green, unknown } = CONFIG.colours;
  const gradScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range([red, yellow, green]);

  return (value) => {
    if (value < 0 || value > 100 || isNaN(value)) return unknown;
    return gradScale(value);
  };
};

/** 計算不確定度 */
const uncertainty = (d) => d.max - d.min;

/** 計算標記的水平偏移量 */
const computeOffset = (index) => ((index % 7) - 3) * 10;

/** 深度清理資料，防止 XSS 攻擊 */
const deepSanitize = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, deepSanitize(value)])
    );
  }
  return obj;
};

/** 取得多語言文字 */
const getLocalizedText = (obj, currentLang, defaultLang = CONFIG.defaultLang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj[defaultLang] || '';
};

// ==================== Vue App ====================
createApp({
  setup() {
    // ==================== 響應式資料 ====================
    const currentLang = ref(localStorage.getItem('language') || CONFIG.defaultLang);
    const i18n = reactive({});
    const isPopupOpen = ref(false);
    const lastUpdated = ref('');
    const map = ref(null);
    const markers = reactive({});
    const storeData = ref([]);
    const members = reactive({});

    // 手機版狀態
    const activeTab = ref('map');
    const mobilePopupData = ref(null);
    const mobilePopupHtml = ref('');

    // ==================== 手機版 UI ====================

    /** 切換手機版 Tab */
    const switchTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'map' && map.value) {
        nextTick(() => map.value.invalidateSize());
      }
    };

    /** 開啟手機版底部彈出面板 */
    const openMobilePopup = (data, html) => {
      mobilePopupData.value = data;
      mobilePopupHtml.value = html;
      isPopupOpen.value = true;
    };

    /** 關閉手機版底部彈出面板 */
    const closeMobilePopup = () => {
      mobilePopupData.value = null;
      mobilePopupHtml.value = '';
      isPopupOpen.value = false;
    };

    // ==================== 語言相關 ====================

    /** 更新光譜標籤 */
    const updateSpectrumLabels = () => {
      const topLabel = document.getElementById('spectrumLabelTop');
      const bottomLabel = document.getElementById('spectrumLabelBottom');
      if (topLabel) topLabel.textContent = i18n.spectrumLabels?.top || 'Freely傾向';
      if (bottomLabel) bottomLabel.textContent = i18n.spectrumLabels?.bottom || 'DYE傾向';
    };

    /** 載入語言文件 */
    const loadLanguage = async (lang) => {
      try {
        const response = await fetch(`i18n/${lang}.json`);
        const data = await response.json();

        // 清空並重新填充i18n
        Object.keys(i18n).forEach(key => delete i18n[key]);
        Object.assign(i18n, data);

        currentLang.value = lang;
        localStorage.setItem('language', lang);

        // 更新已打開的popup內容
        if (map.value?._popup?.isOpen()) {
          map.value._popup.update();
        }

        updateSpectrumLabels();

        // 重新繪製圖表以更新所有文字
        if (map.value && storeData.value.length > 0) {
          await nextTick();
          d3.select('#spectrum').selectAll('svg').remove();
          await loadData();
        }
      } catch (err) {
        console.error(`Failed to load language file: ${lang}`, err);
      }
    };

    // ==================== 地圖相關 ====================

    /** 初始化Leaflet地圖 */
    const initMap = () => {
      const { centre, zoom, tileOpacity } = CONFIG.map;

      map.value = L.map('map', { zoomControl: false }).setView(centre, zoom);
      L.control.zoom({ position: 'bottomright' }).addTo(map.value);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap 貢獻者',
        opacity: tileOpacity
      }).addTo(map.value);

      // 監聽popup開關事件
      map.value.on('popupopen', () => { isPopupOpen.value = true; });
      map.value.on('popupclose', () => { isPopupOpen.value = false; });
    };

    // ==================== 資料載入 ====================

    /** 載入資料 */
    const loadData = async () => {
      try {
        const response = await fetch('data.json');
        const input = await response.json();
        const sanitized = deepSanitize(input);

        // 載入成員資料
        if (sanitized.metadata?.members) {
          Object.keys(members).forEach(key => delete members[key]);
          Object.assign(members, sanitized.metadata.members);
        }

        // 載入最後更新日期
        lastUpdated.value = sanitized.metadata?.lastUpdated || '';

        initChartAndMap(sanitized);
      } catch (err) {
        console.warn(i18n.dataLoadError || 'Loading data.json failed, loading dummy data for preview styling.');
      }
    };

    // ==================== 圖表與地圖繪製 ====================

    /** 建立Popup HTML內容 */
    const createPopupHtml = (d) => {
      const machineTypeLabel = i18n.popup?.machineType || '機台類型';
      const notTestedLabel = i18n.popup?.notTested || '未知';
      const watchVideoLabel = i18n.popup?.watchVideo || '觀看影片';

      const desc = getLocalizedText(d.desc, currentLang.value);
      const typeText = getLocalizedText(d.type, currentLang.value);

      // 處理判定資料節錄
      let evidencesHtml = '';
      if (d.evidences?.length > 0) {
        const evidencesList = d.evidences
          .map(ev => getLocalizedText(ev, currentLang.value))
          .filter(Boolean);

        if (evidencesList.length > 0) {
          evidencesHtml = `
            <div style="margin-top:8px; text-align:left;">
              <div style="font-size:0.85em; font-weight:bold; color:#666; margin-bottom:4px;">
                ${i18n.popup?.evidences || '判定資料節錄'}：
              </div>
              <ul style="margin:0; padding-left:20px; font-size:0.85em; color:#555;">
                ${evidencesList.map(ev => `<li>${ev}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      }

      return `
        <div style="text-align:center; padding:5px;">
          <strong style="font-size:1.1em; color:${CONFIG.colours.mikuCyan};">${d.nickname}</strong>
          <hr style="margin:5px 0; opacity:0.3;">
          <div style="margin-bottom:4px;">
            <span>${d.store}${d.position}</span><br />
            <span class="text-muted">${d.enStore}${d.enPosition}</span><br />
            <span class="text-muted small">Keychip ID: ${d.ids.keychip}</span><br />
            <span class="text-muted small">Main ID: ${d.ids.main}</span>
          </div>
          <div style="background:#f5f5f5; padding:4px; border-radius:4px; display:inline-block; font-size:0.9em;">
            ${machineTypeLabel}：<span style="color:${CONFIG.colours.mikuPink}; font-weight:bold;">
              ${typeText || notTestedLabel}
            </span>
          </div>
          ${desc ? `<div style="margin-top:8px; font-size:0.9em; text-align:left; color:#555;">${desc}</div>` : ''}
          ${evidencesHtml}
          ${d.video ? `
            <div style="margin-top:8px;">
              <a href="${d.video}" target="_blank" style="color:${CONFIG.colours.mikuCyan}; text-decoration:none; font-weight:bold;">
                <i class="fa-solid fa-video"></i> ${watchVideoLabel}
              </a>
            </div>
          ` : ''}
        </div>
      `;
    };

    /** 處理點擊事件（光譜或地圖標記） */
    const handleMarkerClick = (d, latLng) => {
      const html = createPopupHtml(d);
      if (isMobile()) {
        openMobilePopup(d, html);
      } else {
        L.popup().setLatLng(latLng).setContent(html).openOn(map.value);
      }
    };

    /** 建立 SVG 漸層 */
    const createGradient = (svg) => {
      const { green, yellow, red } = CONFIG.colours;
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'grad')
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%');

      const stops = [
        { offset: '0%', colour: red },
        { offset: '10%', colour: red },
        { offset: '44.44%', colour: yellow },
        { offset: '54.44%', colour: yellow },
        { offset: '90%', colour: green },
        { offset: '100%', colour: green }
      ];

      stops.forEach(({ offset, colour }) => {
        grad.append('stop').attr('offset', offset).attr('stop-color', colour);
      });
    };

    /** 繪製光譜條 */
    const drawSpectrumBar = (svg, innerH) => {
      const { margin, barWidth } = CONFIG.spectrum;
      const barX = margin.left + 15;

      svg.append('rect')
        .attr('x', barX)
        .attr('y', margin.top)
        .attr('width', barWidth)
        .attr('height', innerH)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', 'url(#grad)')
        .style('opacity', 0.8)
        .style('stroke', '#ddd')
        .style('stroke-width', 1);
    };

    /** 繪製光譜標籤 */
    const drawSpectrumLabels = (svg, rangeLabels, yScale, innerH) => {
      const { margin, barWidth } = CONFIG.spectrum;
      const barX = margin.left + 15;

      // 範圍標籤
      rangeLabels.forEach(r => {
        const mid = (r.from + r.to) / 2;
        const labelText = r.labelKey && i18n.rangeLabels?.[r.labelKey]
          ? i18n.rangeLabels[r.labelKey]
          : r.label;

        svg.append('text')
          .attr('x', margin.left)
          .attr('y', margin.top + yScale(mid) + 4)
          .attr('dy', '0.35em')
          .attr('class', 'range-label')
          .attr('data-label-key', r.labelKey || '')
          .style('font-size', '13px')
          .style('font-weight', '500')
          .style('fill', '#555')
          .style('text-anchor', 'end')
          .text(labelText);
      });

      // 頂部標籤
      svg.append('text')
        .attr('x', barX + barWidth / 2)
        .attr('y', margin.top - 12)
        .attr('text-anchor', 'middle')
        .attr('class', 'spectrum-label-top')
        .attr('id', 'spectrumLabelTop')
        .text(i18n.spectrumLabels?.top || 'Freely傾向');

      // 底部標籤
      svg.append('text')
        .attr('x', barX + barWidth / 2)
        .attr('y', margin.top + innerH + 24)
        .attr('text-anchor', 'middle')
        .attr('class', 'spectrum-label-bottom')
        .attr('id', 'spectrumLabelBottom')
        .text(i18n.spectrumLabels?.bottom || 'DYE傾向');
    };

    /** 繪製光譜標記 */
    const drawSpectrumMarkers = (svg, data, yScale, col, options) => {
      const { margin } = CONFIG.spectrum;
      const { isWeak, strokeColour } = options;

      const opacityScale = d3.scaleLinear().domain([0, 20]).range([1, 0.7]);
      const strokeWidthScale = d3.scaleSqrt().domain([0, 20]).range([3, 1]);

      const className = isWeak ? 'range-weak' : 'range';
      const opacityMultiplier = isWeak ? 0.4 : 1;
      const strokeWidthMultiplier = isWeak ? 0.7 : 1;

      const rects = svg.selectAll(`.${className}`)
        .data(data)
        .enter()
        .append('rect')
        .attr('class', className)
        .attr('x', d => margin.left + 60 + computeOffset(d.index))
        .attr('width', 10)
        .attr('y', d => margin.top + yScale(d.max))
        .attr('height', d => Math.max(2, yScale(d.min) - yScale(d.max)))
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', d => col((d.min + d.max) / 2))
        .attr('opacity', d => opacityScale(uncertainty(d)) * opacityMultiplier)
        .attr('stroke', strokeColour)
        .attr('stroke-width', d => strokeWidthScale(uncertainty(d)) * strokeWidthMultiplier);

      if (isWeak) {
        rects.attr('stroke-dasharray', '2,2');
      }

      // 加入標題提示
      rects.append('title').text(d => {
        const typeText = getLocalizedText(d.type, currentLang.value);
        const prefix = isWeak ? getRareLabel() + ' ' : '';
        return `${prefix}${d.nickname}：${typeText}`;
      });

      return { opacityScale, strokeWidthScale };
    };

    /** 取得「少見」標籤 */
    const getRareLabel = () => {
      const labels = { 'zh-TW': '（少見）', 'en': '(Rare)', 'ja': '（レア）' };
      return labels[currentLang.value] || '（少見）';
    };

    /** 調整重疊位置 */
    const createPositionAdjuster = () => {
      const usedPositions = [];

      return (lat, lng) => {
        let newLat = lat;
        let newLng = lng;

        for (const pos of usedPositions) {
          const dist = Math.sqrt((lat - pos.lat) ** 2 + (lng - pos.lng) ** 2);
          if (dist < 0.0003) {
            newLng += 0.5 * 0.001;
          }
        }

        usedPositions.push({ lat: newLat, lng: newLng });
        return [newLat, newLng];
      };
    };

    /** 初始化圖表與地圖 */
    const initChartAndMap = (input) => {
      // 清除舊的地圖標記
      Object.values(markers).forEach(marker => map.value.removeLayer(marker));
      Object.keys(markers).forEach(key => delete markers[key]);

      // 準備資料
      const data = input.data.map((x, i) => ({
        ...x,
        id: `${x.ids.keychip}/${x.ids.main}`,
        index: i
      }));
      storeData.value = data;

      // 設定尺寸與比例尺
      const { width, height, margin } = CONFIG.spectrum;
      const innerH = height - margin.top - margin.bottom;
      const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);
      const col = createColourScale();

      // 建立 SVG
      const svg = d3.select('#spectrum')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      // 繪製元素
      createGradient(svg);
      drawSpectrumBar(svg, innerH);
      drawSpectrumLabels(svg, input.range, yScale, innerH);

      // 平坦化 ranges 資料
      const flattenRanges = (rangesKey, isWeak = false) =>
        data.flatMap(d => (d[rangesKey] || []).map(r => ({
          ...d, min: r.min, max: r.max, isWeak
        })));

      const flattened = flattenRanges('ranges', false);
      const flattenedWeak = flattenRanges('weakRanges', true);

      // 繪製光譜標記
      const { opacityScale, strokeWidthScale } = drawSpectrumMarkers(svg, flattened, yScale, col, {
        isWeak: false,
        strokeColour: CONFIG.colours.stroke
      });

      drawSpectrumMarkers(svg, flattenedWeak, yScale, col, {
        isWeak: true,
        strokeColour: CONFIG.colours.weakStroke
      });

      // Highlight / Reset 函數
      const highlight = (id) => {
        // 地圖標記
        if (markers[id]) {
          markers[id].setStyle({
            radius: CONFIG.marker.highlightRadius,
            weight: CONFIG.marker.highlightWeight,
            opacity: 1,
            fillOpacity: 1,
            color: CONFIG.marker.highlightBorderColour
          });
          markers[id].bringToFront();
        }

        // 光譜標記
        svg.selectAll('.range')
          .transition().duration(100)
          .attr('opacity', d => d.id === id ? 1 : 0.2)
          .attr('stroke-width', d => d.id === id ? 3 : 0)
          .attr('stroke', d => d.id === id ? CONFIG.colours.strokeHighlight : 'none');

        svg.selectAll('.range-weak')
          .transition().duration(100)
          .attr('opacity', d => d.id === id ? 0.7 : 0.1)
          .attr('stroke-width', d => d.id === id ? 2 : 0)
          .attr('stroke', d => d.id === id ? CONFIG.colours.weakStrokeHighlight : 'none')
          .attr('stroke-dasharray', d => d.id === id ? '3,3' : '2,2');
      };

      const reset = () => {
        // 地圖標記
        Object.values(markers).forEach(m => {
          m.setStyle({
            radius: CONFIG.marker.radius,
            weight: CONFIG.marker.weight,
            opacity: 1,
            fillOpacity: CONFIG.marker.fillOpacity,
            color: CONFIG.marker.borderColour
          });
        });

        // 光譜標記
        svg.selectAll('.range')
          .transition().duration(100)
          .attr('opacity', d => opacityScale(uncertainty(d)))
          .attr('stroke-width', d => strokeWidthScale(uncertainty(d)))
          .attr('stroke', CONFIG.colours.stroke);

        svg.selectAll('.range-weak')
          .transition().duration(100)
          .attr('opacity', d => opacityScale(uncertainty(d)) * 0.4)
          .attr('stroke-width', d => strokeWidthScale(uncertainty(d)) * 0.7)
          .attr('stroke', CONFIG.colours.weakStroke)
          .attr('stroke-dasharray', '2,2');
      };

      // 綁定光譜標記事件
      svg.selectAll('.range, .range-weak')
        .on('mouseover', (e, d) => highlight(d.id))
        .on('mouseout', reset)
        .on('click', (event, d) => handleMarkerClick(d, markers[d.id].getLatLng()));

      // 建立地圖標記
      const adjustPosition = createPositionAdjuster();

      data.forEach(d => {
        const avg = d.ranges.reduce((sum, r) => sum + (r.min + r.max) / 2, 0) / d.ranges.length;
        const [latAdj, lngAdj] = adjustPosition(d.lat, d.lng);

        const m = L.circleMarker([latAdj, lngAdj], {
          radius: CONFIG.marker.radius,
          color: CONFIG.marker.borderColour,
          weight: CONFIG.marker.weight,
          fillColor: col(avg),
          fillOpacity: CONFIG.marker.fillOpacity
        }).addTo(map.value);

        m.on('click', () => handleMarkerClick(d, m.getLatLng()));
        m.on('mouseover', () => highlight(d.id));
        m.on('mouseout', reset);

        markers[d.id] = m;
      });
    };

    // ==================== 生命週期 ====================
    onMounted(async () => {
      initMap();
      await loadLanguage(currentLang.value);
      await loadData();
    });

    // ==================== 回傳 ====================
    return {
      activeTab,
      closeMobilePopup,
      currentLang,
      i18n,
      isPopupOpen,
      languages: LANGUAGES,
      members,
      lastUpdated,
      loadLanguage,
      mobilePopupData,
      mobilePopupHtml,
      switchTab
    };
  }
}).mount('#app');