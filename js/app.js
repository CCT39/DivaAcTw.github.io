const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

createApp({
  setup() {
    // ==================== data ====================
    const defaultLang = 'zh-TW';
    const languages = [
      { code: 'zh-TW', name: '正體中文' },
      { code: 'ja', name: '日本語' },
      { code: 'en', name: 'English' }
    ];
    const currentLang = ref(localStorage.getItem('language') || defaultLang);
    const i18n = reactive({});
    const isPopupOpen = ref(false);
    const lastUpdated = ref('');
    const map = ref(null);
    const markers = reactive({});
    const storeData = ref([]);
    const members = reactive({});

    // ==================== functions ====================

    /**
     * 載入語言文件
     * @param {string} lang - 語言代碼
     */
    async function loadLanguage(lang) {
      try {
        const response = await fetch(`i18n/${lang}.json`);
        const data = await response.json();
        
        // 清空並重新填充i18n
        Object.keys(i18n).forEach(key => delete i18n[key]);
        Object.assign(i18n, data);
        
        currentLang.value = lang;
        localStorage.setItem('language', lang);

        // 更新已打開的popup內容
        if (map.value) {
          const openPopup = map.value._popup;
          if (openPopup && openPopup.isOpen()) {
            openPopup.update();
          }
        }

        // 更新光譜標籤
        updateSpectrumLabels();
        
        // 如果地圖已初始化，重新繪製圖表以更新所有文字
        if (map.value && storeData.value.length > 0) {
          await nextTick();
          // 清空光譜圖並重新繪製
          d3.select('#spectrum').selectAll('svg').remove();
          await loadData();
        }
      } catch (err) {
        // note: 因為不知道來看的人是何方神聖，所以預設錯誤訊息基本都用英文寫（除非能抓到i18n才顯示對應語言），以下雷同
        console.error(`Failed to load language file: ${lang}`, err);
      }
    }

    /**
     * 更新光譜標籤
     */
    function updateSpectrumLabels() {
      const topLabel = document.getElementById('spectrumLabelTop');
      const bottomLabel = document.getElementById('spectrumLabelBottom');
      if (topLabel) topLabel.textContent = i18n.spectrumLabels?.top || 'Freely傾向'; // note: 非錯誤訊息的預設UI元素都是中文，以下雷同
      if (bottomLabel) bottomLabel.textContent = i18n.spectrumLabels?.bottom || 'DYE傾向';
    }

    /**
     * 初始化Leaflet地圖基本資料
     */
    function initMap() {
      map.value = L.map('map', { zoomControl: false }).setView([23.7, 121], 8);

      L.control.zoom({ position: 'bottomright' }).addTo(map.value);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap 貢獻者',
        opacity: 0.6
      }).addTo(map.value);

      // 監聽popup開關事件
      map.value.on('popupopen', () => {
        isPopupOpen.value = true;
      });

      map.value.on('popupclose', () => {
        isPopupOpen.value = false;
      });
    }

    /**
     * 載入資料
     */
    async function loadData() {
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
        if (sanitized.metadata?.lastUpdated) {
          lastUpdated.value = sanitized.metadata?.lastUpdated || '';
        }
        
        initChartAndMap(sanitized);
      } catch (err) {
        console.warn(i18n.dataLoadError || 'Loading data.json failed, loading dummy data for preview styling.');
      }
    }

    /**
     * 深度清理資料，防止XSS攻擊（雖然應該沒什麼好攻擊的，但是永不信任）
     * @param {*} obj - 要清理的物件
     * @returns {*} 清理後的物件
     */
    function deepSanitize(obj) {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item));
      }
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          result[key] = deepSanitize(obj[key]);
        }
        return result;
      }
      return obj;
    }

    /**
     * 初始化圖表與地圖上的資料點等
     * @param {Object} input - 清理過的資料
     */
    function initChartAndMap(input) {
      // 清除舊的地圖標記
      Object.values(markers).forEach(marker => {
        map.value.removeLayer(marker);
      });
      // 清空markers物件
      Object.keys(markers).forEach(key => delete markers[key]);

      const data = input.data.map((x, i) => ({
        ...x,
        id: x.ids.keychip + '/' + x.ids.main,
        index: i
      }));

      const width = 250, height = 500;
      const margin = { top: 40, bottom: 40, left: 120, right: 20 };
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select('#spectrum')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerH, 0]);

      const rangeLabels = input.range;

      // 漸層定義
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'grad')
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%');

      const [green, yellow, red] = ['#59fe4a', '#ffeb3b', '#f44336'];
      const gradientStops = [
        { offset: '0%', colour: red },
        { offset: '10%', colour: red },
        { offset: '10%', colour: red },
        { offset: '44.44%', colour: yellow },
        { offset: '44.44%', colour: yellow },
        { offset: '54.44%', colour: yellow },
        { offset: '54.44%', colour: yellow },
        { offset: '90%', colour: green },
        { offset: '90%', colour: green },
        { offset: '100%', colour: green }
      ];
      gradientStops.forEach(stop => {
        grad.append('stop')
          .attr('offset', stop.offset)
          .attr('stop-color', stop.colour);
      });

      // 繪製光譜條
      const barWidth = 100;
      const barX = margin.left + 15;
      const barY = margin.top;

      svg.append('rect')
        .attr('x', barX)
        .attr('y', barY)
        .attr('width', barWidth)
        .attr('height', innerH)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', 'url(#grad)')
        .style('opacity', 0.8)
        .style('stroke', '#ddd')
        .style('stroke-width', 1);

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

      // 頂部和底部標籤
      svg.append('text')
        .attr('x', barX + barWidth / 2)
        .attr('y', barY - 12)
        .attr('text-anchor', 'middle')
        .attr('class', 'spectrum-label-top')
        .attr('id', 'spectrumLabelTop')
        .text(i18n.spectrumLabels?.top || 'Freely傾向');

      svg.append('text')
        .attr('x', barX + barWidth / 2)
        .attr('y', barY + innerH + 24)
        .attr('text-anchor', 'middle')
        .attr('class', 'spectrum-label-bottom')
        .attr('id', 'spectrumLabelBottom')
        .text(i18n.spectrumLabels?.bottom || 'DYE傾向');

      // 顏色映射函數，供光譜標記或／和地圖點標記使用
      const gradScale = d3.scaleLinear()
        .domain([0, 50, 100])
        .range([red, yellow, green]);

      const col = (v) => {
        if (v < 0 || v > 100 || isNaN(v)) return '#999';
        return gradScale(v);
      };

      function computeOffset(i) {
        const shift = (i % 7) - 3;
        return shift * 10;
      }

      // 不確定度計算
      const uncertainty = d => d.max - d.min;
      const opacityScale = d3.scaleLinear().domain([0, 20]).range([1, 0.7]);
      const strokeWidthScale = d3.scaleSqrt().domain([0, 20]).range([3, 1]);

      // 將ranges和weakRanges分別平坦化
      const flattened = data.flatMap(d =>
        d.ranges.map(r => ({
          ...d,
          min: r.min,
          max: r.max,
          isWeak: false
        }))
      );
      
      const flattenedWeak = data.flatMap(d =>
        (d.weakRanges || []).map(r => ({
          ...d,
          min: r.min,
          max: r.max,
          isWeak: true
        }))
      );

      // 光譜標記 - 一般ranges（表示經測試後的機台判定種類區間，機台真正的細分類會位於這個區間內，並存在些許時間差，可能會稍微超出邊界）
      const strokeBorderColour = '#333';
      const highlightedStrokeBorderColour = '#000';
      
      svg.selectAll('.range')
        .data(flattened)
        .enter()
        .append('rect')
        .attr('class', 'range')
        .attr('x', d => margin.left + 60 + computeOffset(d.index))
        .attr('width', 10)
        .attr('y', d => margin.top + yScale(d.max))
        .attr('height', d => Math.max(2, yScale(d.min) - yScale(d.max)))
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', d => col((d.min + d.max) / 2))
        .attr('opacity', d => opacityScale(uncertainty(d)))
        .attr('stroke', strokeBorderColour)
        .attr('stroke-width', d => strokeWidthScale(uncertainty(d)))
        .on('mouseover', (e, d) => highlight(d.id))
        .on('mouseout', reset)
        .on('click', (event, d) => {
          const html = getPopupHtml(d);
          L.popup()
            .setLatLng(markers[d.id].getLatLng())
            .setContent(html)
            .openOn(map.value);
        })
        .append('title')
        .text(d => {
          const typeText = d.type && typeof d.type === 'object'
            ? (d.type[currentLang.value] || d.type[defaultLang] || '')
            : (d.type || '');
          return `${d.nickname}：${typeText}`;
        });

      // 光譜標記 - weakRanges（指比較少見但確實出現過的機台判定種類區間，同樣代表不確定性，真正的細分類位於區間內並存在時間差）
      const weakStrokeBorderColour = '#bbb';
      const weakHighlightedStrokeBorderColour = '#888';
      
      svg.selectAll('.range-weak')
        .data(flattenedWeak)
        .enter()
        .append('rect')
        .attr('class', 'range-weak')
        .attr('x', d => margin.left + 60 + computeOffset(d.index))
        .attr('width', 10)
        .attr('y', d => margin.top + yScale(d.max))
        .attr('height', d => Math.max(2, yScale(d.min) - yScale(d.max)))
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', d => col((d.min + d.max) / 2))
        .attr('opacity', d => opacityScale(uncertainty(d)) * 0.4) // 降低透明度
        .attr('stroke', weakStrokeBorderColour) // 較淺的邊框
        .attr('stroke-width', d => strokeWidthScale(uncertainty(d)) * 0.7) // 較細的邊框
        .attr('stroke-dasharray', '2,2') // 虛線效果
        .on('mouseover', (e, d) => highlight(d.id))
        .on('mouseout', reset)
        .on('click', (event, d) => {
          const html = getPopupHtml(d);
          L.popup()
            .setLatLng(markers[d.id].getLatLng())
            .setContent(html)
            .openOn(map.value);
        })
        .append('title')
        .text(d => {
          const typeText = d.type && typeof d.type === 'object'
            ? (d.type[currentLang.value] || d.type[defaultLang] || '')
            : (d.type || '');
          const rareLabel = {
            'zh-TW': '（少見）',
            'en': '(Rare)',
            'ja': '（レア）'
          }[currentLang.value] || '（少見）';
          return `${rareLabel} ${d.nickname}：${typeText}`;
        });


      // 保存資料
      storeData.value = data;

      // 地圖標記
      const usedPositions = [];
      const markerBorderColour = '#555';
      const highlightedMarkerBorderColour = '#333';
      
      data.forEach(d => {
        const avg = d.ranges
          .map(r => (r.min + r.max) / 2)
          .reduce((a, b) => a + b, 0) / d.ranges.length;

        const c = col(avg);
        const [latAdj, lngAdj] = adjustPosition(d.lat, d.lng);

        const m = L.circleMarker([latAdj, lngAdj], {
          radius: 8,
          color: markerBorderColour,
          weight: 1.5,
          fillColor: c,
          fillOpacity: 0.85
        })
          .bindPopup(() => getPopupHtml(d))
          .addTo(map.value);

        markers[d.id] = m;

        m.on('mouseover', () => highlight(d.id));
        m.on('mouseout', reset);
      });

      function highlight(id) {
        if (markers[id]) {
          markers[id].setStyle({ 
            radius: 14, 
            weight: 3, 
            opacity: 1, 
            fillOpacity: 1, 
            color: highlightedMarkerBorderColour 
          });
          markers[id].bringToFront();
        }

        // highlight一般ranges
        svg.selectAll('.range')
          .transition().duration(100)
          .attr('opacity', d => d.id === id ? 1 : 0.2)
          .attr('stroke-width', d => d.id === id ? 3 : 0)
          .attr('stroke', d => d.id === id ? highlightedStrokeBorderColour : 'none');
        
        // highlight weakRanges
        svg.selectAll('.range-weak')
          .transition().duration(100)
          .attr('opacity', d => d.id === id ? 0.7 : 0.1)
          .attr('stroke-width', d => d.id === id ? 2 : 0)
          .attr('stroke', d => d.id === id ? weakHighlightedStrokeBorderColour : 'none')
          .attr('stroke-dasharray', d => d.id === id ? '3,3' : '2,2');
      }

      function reset() {
        Object.values(markers).forEach(m => {
          m.setStyle({ 
            radius: 8, 
            weight: 1.5, 
            opacity: 1, 
            fillOpacity: 0.85, 
            color: markerBorderColour 
          });
        });

        // 重設一般ranges
        svg.selectAll('.range')
          .transition().duration(100)
          .attr('opacity', d => opacityScale(uncertainty(d)))
          .attr('stroke-width', d => strokeWidthScale(uncertainty(d)))
          .attr('stroke', strokeBorderColour);
        
        // 重設weakRanges
        svg.selectAll('.range-weak')
          .transition().duration(100)
          .attr('opacity', d => opacityScale(uncertainty(d)) * 0.4)
          .attr('stroke-width', d => strokeWidthScale(uncertainty(d)) * 0.7)
          .attr('stroke', weakStrokeBorderColour)
          .attr('stroke-dasharray', '2,2');
      }

      function adjustPosition(lat, lng) {
        let newLat = lat;
        let newLng = lng;
        for (let pos of usedPositions) {
          const dist = Math.sqrt((lat - pos.lat) ** 2 + (lng - pos.lng) ** 2);
          if (dist < 0.0003) {
            // note: 改成不是隨機長，而是一律長在右邊（目前一家店頂多2台，這招管用）
            // newLat += (Math.random() - 0.5) * 0.001;
            // newLng += (Math.random() - 0.5) * 0.001;
            newLng += 0.5 * 0.001;
          }
        }
        usedPositions.push({ lat: newLat, lng: newLng });
        return [newLat, newLng];
      }

      function getPopupHtml(d) {
        const machineTypeLabel = i18n.popup?.machineType || '機台類型';
        const notTestedLabel = i18n.popup?.notTested || '未知';
        const watchVideoLabel = i18n.popup?.watchVideo || '觀看影片';
        
        const desc = d.desc && typeof d.desc === 'object' 
          ? (d.desc[currentLang.value] || d.desc[defaultLang] || '') 
          : (d.desc || '');
        
        const typeText = d.type && typeof d.type === 'object'
          ? (d.type[currentLang.value] || d.type[defaultLang] || '')
          : (d.type || '');
        
        let evidencesHtml = '';
        if (d.evidences && Array.isArray(d.evidences) && d.evidences.length > 0) {
          const evidencesList = d.evidences
            .map(ev => {
              if (typeof ev === 'object') {
                return ev[currentLang.value] || ev[defaultLang] || '';
              }
              return ev || '';
            })
            .filter(text => text !== '');
          
          if (evidencesList.length > 0) {
            evidencesHtml = `
              <div style="margin-top:8px; text-align:left;">
                <div style="font-size:0.85em; font-weight:bold; color:#666; margin-bottom:4px;">${i18n.popup?.evidences || '判定資料節錄'}：</div>
                <ul style="margin:0; padding-left:20px; font-size:0.85em; color:#555;">
                  ${evidencesList.map(ev => `<li>${ev}</li>`).join('')}
                </ul>
              </div>
            `;
          }
        }

        return `
          <div style="text-align:center; padding:5px;">
            <strong style="font-size:1.1em; color:#39c5bb;">${d.nickname}</strong>
            <hr style="margin:5px 0; opacity:0.3;">
            <div style="margin-bottom:4px;">
              <span>${d.store}${d.position}</span><br />
              <span class="text-muted">${d.enStore}${d.enPosition}</span><br />
              <span class="text-muted small">Keychip ID: ${d.ids.keychip}</span><br />
              <span class="text-muted small">Main ID: ${d.ids.main}</span>
            </div>
            <div style="background:#f5f5f5; padding:4px; border-radius:4px; display:inline-block; font-size:0.9em;">
              ${machineTypeLabel}：<span style="color:#e12885; font-weight:bold;">${!typeText ? notTestedLabel : typeText}</span>
            </div>
            ${!desc ? '' : `<div style="margin-top:8px; font-size:0.9em; text-align:left; color:#555;">${desc}</div>`}
            ${evidencesHtml}
            ${!d.video ? '' : `<div style="margin-top:8px;"><a href="${d.video}" target="_blank" style="color:#39c5bb; text-decoration:none; font-weight:bold;"><i class="fa-solid fa-video"></i> ${watchVideoLabel}</a></div>`}
          </div>
        `;
      }
    }

    // ==================== lifecycle ====================
    onMounted(async () => {
      initMap();
      await loadLanguage(currentLang.value);
      await loadData();
    });

    // ==================== return ====================
    return {
      currentLang,
      i18n,
      isPopupOpen,
      languages,
      members,
      lastUpdated,
      loadLanguage
    };
  }
}).mount('#app');