<!-- components/HeroHeader.vue -->
<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="hero__nav">
    <nav class="hero__menu">
      <RouterLink to="/">Home</RouterLink>
      <span>/</span>
      <RouterLink to="/about">About</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.hero__nav {
  position: absolute;
  top: 28px;
  right: 32px;
  letter-spacing: 0.12em;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 2;
}

.hero__menu {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero__menu span {
  opacity: 0.6;
}

.hero__menu a {
  position: relative;
  padding-bottom: 2px;
}

.hero__menu a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
  opacity: 0.6;
}

.hero__menu a:hover::after,
.hero__menu a:focus-visible::after {
  transform: scaleX(1);
  opacity: 1;
}

@media (max-width: 720px) {
  .hero__nav {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    top: 20px;
  }

  .hero__menu {
    gap: 4px;
  }
}
</style>