// src/main.js

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Предполагаем, что этот файл существует

// 1. Создаем экземпляр приложения
const app = createApp(App)

// 2. Добавляем плагины (Vue Router) ДО монтирования
app.use(router)

// 3. Монтируем приложение в DOM
app.mount('#app')