<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'

// === Динамическая загрузка PDF.js ===
let getDocument = null
let workerSrc = null

const loadPdfJs = async () => {
  if (getDocument) return
  try {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs')
    getDocument = pdfjs.getDocument
    workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs'
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  } catch (err) {
    console.error('Failed to load PDF.js:', err)
  }
}

// === ДАННЫЕ ===
const baseItems = [
  { id: 1, src: '/src/assets/1.png', pdf: '/src/assets/sql.pdf', url: 'https://stepik.org/certificate/db4c43320c216e8439820bf044b2d5df299e4a37.pdf', title: 'SQL' },
  { id: 2, src: '/src/assets/2.png', pdf: '/src/assets/start.pdf', url: 'https://stepik.org/certificate/7a3e48e147b8ba3365bf4ad34c7e983ac671f5d9.pdf', title: 'Python for beginners' },
  { id: 3, src: '/src/assets/3.png', pdf: '/src/assets/oop.pdf', url: 'https://stepik.org/certificate/78de96b23f1bdcd3ea08ad131f5e5b723a605c93.pdf', title: 'OOP' },
  { id: 4, src: '/src/assets/4.png', pdf: '/src/assets/mid.pdf', url: 'https://stepik.org/certificate/ccd514a0bbbe71e7889ab2368b1a5f7e38831855.pdf', title: 'Python for advanced' },
  { id: 5, src: '/src/assets/5.png', pdf: '/src/assets/prof.pdf', url: 'https://stepik.org/certificate/78ea48a735f9288efa9212fbb82d55b88b83143e.pdf', title: 'Python for professionals' },
]

const GAP_PX = 80
const ITEM_WIDTH = 300
const TOTAL_ITEM_WIDTH = ITEM_WIDTH + GAP_PX
const REPEATS = 50
const infiniteItems = ref([])
const baseLength = baseItems.length
const centerItemIndex = REPEATS * baseLength + Math.floor(baseLength / 2)
const currentIndex = ref(centerItemIndex)

let isAnimating = false
let lastClickTime = 0
const animationDuration = ref(1200)
const MIN_DURATION = 300
const DECAY_RATE = 0.98

const containerRef = ref(null)
const trackRef = ref(null)
const containerWidth = ref(0)

// PDF Preview
const hoveredPdf = ref('')
const pdfCanvasRef = ref(null)
const pdfLoading = ref(false)
const pdfRendered = ref(false)
const pdfCache = new Map()

let hoverTimeout = null
const HOVER_DELAY = 650

// === Инициализация ===
const generateInfiniteItems = () => {
  const items = []
  for (let r = -REPEATS; r <= REPEATS; r++) {
    baseItems.forEach((item) => {
      items.push({
        ...item,
        id: item.id + r * 1000,
        _originalId: item.id,
        _repeat: r
      })
    })
  }
  infiniteItems.value = items
}

const updateDimensions = async () => {
  await nextTick()
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
  }
}

const translateX = computed(() => {
  const offset = currentIndex.value * TOTAL_ITEM_WIDTH
  return containerWidth.value / 2 - ITEM_WIDTH / 2 - offset
})

const setAnimationDuration = (ms) => {
  if (trackRef.value) {
    trackRef.value.style.transitionDuration = `${ms}ms`
  }
}

// === КЛАССЫ ===
const getItemClasses = (item) => {
  const total = infiniteItems.value.length
  const itemIndex = infiniteItems.value.findIndex(i => i.id === item.id)
  if (itemIndex === -1) return {}

  const normalizedCurrent = ((currentIndex.value % total) + total) % total
  const distance = Math.min(
    Math.abs(normalizedCurrent - itemIndex),
    total - Math.abs(normalizedCurrent - itemIndex)
  )

  return {
    'is-center': distance < 0.1,
    'is-near': distance >= 0.1 && distance < 1.1,
    'is-far': distance >= 1.1
  }
}

// === PDF РЕНДЕРИНГ ===
const renderPdfPreview = async (url) => {
  if (!pdfCanvasRef.value || !url || !getDocument) return
  if (pdfCache.has(url)) {
    const img = pdfCache.get(url)
    const canvas = pdfCanvasRef.value
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    pdfRendered.value = true
    pdfLoading.value = false
    return
  }

  pdfLoading.value = true
  pdfRendered.value = false

  try {
    const loadingTask = getDocument(url)
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const canvas = pdfCanvasRef.value
    const ctx = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: 1 })
    const container = canvas.parentElement
    const scale = Math.min(
      (container.offsetWidth * 0.9) / viewport.width,
      (container.offsetHeight * 0.9) / viewport.height
    )
    const scaledViewport = page.getViewport({ scale })
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise

    const img = new Image()
    img.src = canvas.toDataURL()
    pdfCache.set(url, img)
    pdfRendered.value = true
  } catch (err) {
    console.error('PDF render error:', err)
  } finally {
    pdfLoading.value = false
  }
}

const showPdfPreview = (pdfUrl) => {
  clearTimeout(hoverTimeout)
  hoverTimeout = setTimeout(() => {
    hoveredPdf.value = pdfUrl
  }, HOVER_DELAY)
}

const hidePdfPreview = () => {
  clearTimeout(hoverTimeout)
  hoveredPdf.value = ''
  pdfRendered.value = false
}

const openPdf = (url) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

// === НАВИГАЦИЯ ===
const next = () => {
  if (isAnimating) return
  isAnimating = true

  const now = Date.now()
  const timeSinceLast = now - lastClickTime
  lastClickTime = now

  if (timeSinceLast < 400) {
    animationDuration.value = Math.max(MIN_DURATION, animationDuration.value * 0.7)
  } else {
    animationDuration.value = Math.min(1200, animationDuration.value / DECAY_RATE)
  }

  setAnimationDuration(animationDuration.value)
  currentIndex.value += 1

  nextTick(() => {
    isAnimating = false
  })
}

const prev = () => {
  if (isAnimating) return
  isAnimating = true

  const now = Date.now()
  const timeSinceLast = now - lastClickTime
  lastClickTime = now

  if (timeSinceLast < 400) {
    animationDuration.value = Math.max(MIN_DURATION, animationDuration.value * 0.7)
  } else {
    animationDuration.value = Math.min(1200, animationDuration.value / DECAY_RATE)
  }

  setAnimationDuration(animationDuration.value)
  currentIndex.value -= 1

  nextTick(() => {
    isAnimating = false
  })
}

// === МОНТИРОВАНИЕ ===
onMounted(async () => {
  await loadPdfJs()
  generateInfiniteItems()
  await updateDimensions()
  setAnimationDuration(1200)
  window.addEventListener('resize', updateDimensions)

  nextTick(() => {
    const x = containerWidth.value / 2 - ITEM_WIDTH / 2 - currentIndex.value * TOTAL_ITEM_WIDTH
    if (trackRef.value) {
      trackRef.value.style.transform = `translateX(${x}px)`
    }
  })
})

watch(hoveredPdf, (newUrl) => {
  if (newUrl && getDocument) {
    nextTick(() => renderPdfPreview(newUrl))
  }
})
</script>

<template>
  <section class="about">
    <!-- Обертка -->
    <div ref="containerRef" class="about__track-wrapper">

      <!-- PNG — кликабельные, с превью -->
      <div
        ref="trackRef"
        class="about__track about__track--images"
        :style="{ transform: `translateX(${translateX}px)` }"
      >
        <div
          v-for="item in infiniteItems"
          :key="`img-${item.id}`"
          class="about__item"
          :class="getItemClasses(item)"
          @mouseenter="showPdfPreview(item.pdf)"
          @mouseleave="hidePdfPreview"
          @click="openPdf(item.url)"
        >
          <img :src="item.src" alt="" class="about__image" />
        </div>
      </div>

      <!-- ТЕКСТ — ТОЛЬКО ВИЗУАЛЬНЫЙ, НЕ КЛИКАБЕЛЬНЫЙ -->
      <div
        class="about__track about__track--labels"
        :style="{ transform: `translateX(${translateX}px)` }"
      >
        <div
          v-for="item in infiniteItems"
          :key="`label-${item.id}`"
          class="about__label"
          :class="getItemClasses(item)"
        >
          <span class="about__label-text">{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- ПРЕВЬЮ PDF (только от PNG) -->
    <transition name="pdf-fade">
      <div v-if="hoveredPdf" class="about__pdf-preview">
        <div class="pdf-container">
          <canvas
            ref="pdfCanvasRef"
            class="pdf-canvas"
            :class="{ rendered: pdfRendered }"
          ></canvas>
          <div v-if="pdfLoading" class="pdf-loader">
            <div class="spinner"></div>
          </div>
          <div v-if="!pdfLoading && !pdfRendered && hoveredPdf" class="pdf-error">
            Не удалось загрузить PDF
          </div>
        </div>
      </div>
    </transition>

    <!-- Управление -->
    <div class="about__footer">
      <div class="about__arrows">
        <span class="about__arrow about__arrow--left" @click="prev">&lt;</span>
        <span class="about__arrow about__arrow--right" @click="next">&gt;</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  --bg: #f3b600;
  background: var(--bg);
  color: #fff;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.about__track-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

/* === ДВА ОТДЕЛЬНЫХ ГОРИЗОНТАЛЬНЫХ ТРЕКА === */
.about__track {
  display: flex;
  gap: 80px;
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  width: 100%;
}

.about__track--images {
  padding-top: 20px;
}

.about__track--labels {
  padding-bottom: 20px;
}

/* === PNG — КЛИКАБЕЛЬНЫЕ === */
.about__item {
  flex-shrink: 0;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 
    opacity 0.3s ease,
    filter 0.3s ease,
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0.3;
  filter: grayscale(100%) blur(1px);
  z-index: 1;
}

.about__item.is-center {
  opacity: 1;
  filter: grayscale(0%) blur(0);
  z-index: 3;
  transform: scale(1.25);
}

.about__item.is-near {
  opacity: 0.75;
  filter: grayscale(50%) blur(0.5px);
  z-index: 2;
  transform: scale(1.05);
}

.about__item.is-far {
  opacity: 0.50;
  filter: grayscale(100%) blur(1px);
  z-index: 1;
  transform: scale(0.9);
}

.about__item:hover {
  opacity: 1;
  filter: grayscale(0%) blur(0);
  z-index: 4;
  transform: scale(1.35) !important;
}

/* УБРАНА ОБВОДКА У КАРТИНКИ */
.about__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  backface-visibility: hidden;
  pointer-events: none;
}

/* === ТЕКСТ — ТОЛЬКО ВИЗУАЛЬНЫЙ === */
.about__label {
  flex-shrink: 0;
  width: 300px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none; /* Не реагирует на мышь */
}

.about__label.is-center {
  opacity: 1;
}

.about__label.is-near {
  opacity: 0.6;
}

.about__label.is-far {
  opacity: 0.3;
}

.about__label-text {
  font-family: 'Special Elite', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

/* ПРЕВЬЮ PDF */
.about__pdf-preview {
  position: absolute;
  bottom: 18vh;
  left: 50%;
  transform: translateX(-50%);
  width: 60vw;
  max-width: 800px;
  height: 60vh;
  max-height: 500px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 100px rgba(0, 0, 0, 0.5), 0 0 0 5px rgba(255, 255, 255, 0.7);
  z-index: 20;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pdf-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f9f9fb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.4s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}

.pdf-canvas.rendered {
  opacity: 1;
}

.pdf-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(3px);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e0e0e0;
  border-top-color: #f3b600;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

.pdf-error {
  color: #999;
  font-size: 0.95rem;
  text-align: center;
  padding: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pdf-fade-enter-active,
.pdf-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.pdf-fade-enter-from,
.pdf-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(30px) scale(0.95);
}

.about__footer {
  text-align: center;
  padding-bottom: 6vh;
  z-index: 10;
}

.about__arrows {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
}

.about__arrow {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid rgba(255, 255, 255, .7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;
  user-select: none;
}

.about__arrow:hover {
  background: rgba(255, 255, 255, .1);
  transform: scale(1.1);
}

.about__arrow:active {
  transform: scale(0.95);
}

/* === Адаптив === */
@media (max-width: 768px) {
  .about__track { gap: 40px; }
  .about__item, .about__label { width: 200px; }
  .about__item { height: 200px; }
  .about__label { height: 36px; }
  .about__item.is-center { transform: scale(1.18); }
  .about__item:hover { transform: scale(1.28) !important; }
  .about__label-text { font-size: 0.85rem; }
  .about__pdf-preview {
    width: 90vw;
    height: 50vh;
    bottom: 12vh;
    padding: 12px;
  }
  .about__arrow { width: 1.8rem; height: 1.8rem; font-size: 1rem; }
}
</style>