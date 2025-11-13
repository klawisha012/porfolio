<!-- components/Hero.vue -->
<script setup>
import { computed, ref } from 'vue'
import dotSrc from '../assets/dot.png'
import fullDotSrc from '../assets/full_dot.png'
import { RouterLink } from 'vue-router'

// === Темы ===
const themes = [
  {
    id: 'sunburst',
    label: 'Sunburst',
    background: '#f3b600',
    text: '#ffffff',
    buttonBorder: 'rgba(255, 255, 255, 0.9)',
    buttonText: '#ffffff',
    buttonHoverBg: '#ffffff',
    buttonHoverText: '#f3b600',
    dotBorder: 'rgba(255, 255, 255, 0.8)',
    dotStripe: 'rgba(255, 255, 255, 0.85)',
    dotActiveFill: '#ffffff',
    noiseOpacity: 0.35,
    heading: [
      { text: 'HAI,' },
      { text: "I'M" },
      { text: 'ADAM' },
    ],
    subheading: "I'm a design technologist currently working @ Squarespace in NYC",
  },
  {
    id: 'aqua',
    label: 'Aqua',
    background: '#04b7c6',
    text: '#ffffff',
    buttonBorder: 'rgba(255, 255, 255, 0.9)',
    buttonText: '#ffffff',
    buttonHoverBg: '#ffffff',
    buttonHoverText: '#04b7c6',
    dotBorder: 'rgba(255, 255, 255, 0.85)',
    dotStripe: 'rgba(255, 255, 255, 0.9)',
    dotActiveFill: '#ffffff',
    noiseOpacity: 0.32,
    heading: [
      { text: 'AHOY,' },
      { text: "I'M" },
      { text: 'ADAM' },
    ],
    subheading: 'Building immersive moments that flow seamlessly across devices.',
  },
]

const activeIndex = ref(0)
const activeTheme = computed(() => themes[activeIndex.value] ?? themes[0])

// Разбиваем заголовок на строки
const headingLines = computed(() => {
  const allWords = activeTheme.value.heading.map(h => h.text)
  const line1Words = allWords.slice(0, 2).join(' ')
  const line2Words = allWords.slice(2).join(' ')
  
  return [
    line1Words.split(''),
    line2Words.split('')
  ]
})

function setTheme(index) {
  activeIndex.value = index
}

// Анимация букв
function beforeLetterEnter(el) {
  el.style.opacity = '0'
  el.style.transform = 'scale(0) rotate(0deg)'
  el.style.transformOrigin = 'center center'
  el.style.display = 'inline-flex'
  el.style.justifyContent = 'center'
  el.style.alignItems = 'center'
  el.style.willChange = 'transform, opacity'
}

function enterLetter(el, done) {
  const allLetters = headingLines.value.flat()
  const index = allLetters.findIndex(
    (l, i) => `${l}-${activeIndex.value}-${i}` === el.dataset.key
  )
  
  const delay = index * 35
  const angle = (Math.random() - 0.5) * 540
  const distance = 20 + Math.random() * 30

  setTimeout(() => {
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `scale(1.6) translate(${distance}px, -${distance}px) rotate(${angle}deg)`

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `
          transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1),
          opacity 0.4s ease
        `
        el.style.transform = 'scale(1) translate(0px, 0px) rotate(0deg)'
      })
    })

    setTimeout(() => {
      el.style.willChange = 'auto'
      done()
    }, 650)
  }, delay)
}
</script>

<template>
  <section
    id="home"
    class="hero"
    :style="{
      '--hero-bg': activeTheme.background,
      '--hero-text': activeTheme.text,
      '--hero-button-border': activeTheme.buttonBorder,
      '--hero-button-text': activeTheme.buttonText,
      '--hero-button-hover-bg': activeTheme.buttonHoverBg,
      '--hero-button-hover-text': activeTheme.buttonHoverText,
      '--hero-dot-border': activeTheme.dotBorder,
      '--hero-dot-stripe': activeTheme.dotStripe,
      '--hero-dot-active': activeTheme.dotActiveFill,
      '--hero-noise-opacity': activeTheme.noiseOpacity,
    }"
  >
    <div class="hero__content">
      <h1 class="hero__title">
        <template v-for="(lineLetters, lineIndex) in headingLines" :key="lineIndex">
          <div class="hero__title-line">
            <transition-group
              name="letter-explode"
              tag="span"
              appear
              @before-enter="beforeLetterEnter"
              @enter="enterLetter"
            >
              <span
                v-for="(letter, idx) in lineLetters"
                :key="`${letter}-${activeIndex}-${lineIndex}-${idx}`"
                class="hero__letter"
                :data-index="idx"
                :data-key="`${letter}-${activeIndex}-${lineIndex}-${idx}`"
              >
                {{ letter === ' ' ? '\u00A0' : letter }}
              </span>
            </transition-group>
          </div>
        </template>
      </h1>

      <p class="hero__subtitle">
        {{ activeTheme.subheading }}
      </p>

      <div class="hero__cta">
        <span class="hero__theme-name">{{ activeTheme.label }}</span>

        <div class="hero__dots" role="group" aria-label="Color themes">
          <button
            v-for="(theme, index) in themes"
            :key="theme.id"
            :class="['hero__dot', { 'hero__dot--active': index === activeIndex }]"
            type="button"
            :aria-label="`Switch to theme ${index + 1}`"
            :aria-pressed="index === activeIndex"
            @click="setTheme(index)"
          >
            <img
              :src="index === activeIndex ? fullDotSrc : dotSrc"
              alt=""
              :class="['hero__dot-image', { 'hero__dot-image--active': index === activeIndex }]"
            />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero__theme-name {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.9;
  padding-bottom: 8px;
}

.hero {
  position: relative;
  min-height: 100vh;
  background-color: var(--hero-bg);
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 0),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 0);
  background-position: 0 0, 25px 25px;
  background-size: 50px 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 24px;
  color: var(--hero-text);
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Cfilter id="n" x="0" y="0"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="4" stitchTiles="stitch" /%3E%3C/filter%3E%3Crect width="120" height="120" filter="url(%23n)" opacity="0.15"%3E%3C/rect%3E%3C/svg%3E');
  background-size: 180px 180px;
  mix-blend-mode: soft-light;
  opacity: var(--hero-noise-opacity, 0.32);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.18) 100%);
  opacity: 0.18;
  pointer-events: none;
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 820px;
}

.hero__title {
  display: block;
  text-align: center;
  font-family: 'Special Elite', 'Courier New', monospace;
  font-size: clamp(3.5rem, 11vw, 8rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
  line-height: 1;
  position: relative;
  perspective: 1000px;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.hero__title-line {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0.28em;
  line-height: 1.1;
  margin: 0;
}

.hero__letter {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-family: inherit;
  font-size: inherit;
  line-height: 1;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  transform-origin: center center;
  backface-visibility: hidden;
  will-change: transform, opacity;
}

.hero__subtitle {
  margin: 20px auto 44px;
  max-width: 620px;
  font-size: clamp(1rem, 2vw, 1.45rem);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeUp 0.6s ease forwards;
  animation-delay: 0.5s;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero__cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.hero__dots {
  display: flex;
  gap: 14px;
}

.hero__dot {
  width: 64px;
  height: 64px;
  border: none;
  background: none;
  padding: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0.7;
}

.hero__dot-image {
  width: 80px;
  height: 80px;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.18));
  transition: transform 0.2s ease;
}

.hero__dot:hover,
.hero__dot--active {
  opacity: 1;
}

.hero__dot:hover .hero__dot-image {
  transform: scale(1.05);
}

@media (max-width: 720px) {
  .hero__subtitle {
    font-size: 1rem;
    letter-spacing: 0.05em;
  }
}
</style>