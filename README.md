# ann-happy-birthday

Интерактивный сайт-поздравление с днём рождения. Статический сайт на нативном HTML, CSS и JavaScript.

## Структура проекта

```
├── index.html              Главная страница (все слайды)
├── css/style.css           Стили, анимации, адаптивность
├── js/app.js               Логика презентации и навигации
└── assets/
    ├── images/             Фотографии и картинки
    ├── fonts/              Кастомные шрифты
    └── audio/              Музыка и звуки
```

## Запуск

Открыть `index.html` в браузере, либо запустить через любой локальный сервер:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```

## Навигация

- **Кнопки** — клик по кнопкам на слайдах
- **Свайп** — свайп влево/вправо на мобильных
- **Клавиатура** — стрелки влево/вправо, пробел

## Добавление слайдов

Добавить новую секцию в `index.html` внутри `.presentation`:

```html
<section class="slide" data-slide="N">
  <div class="slide__content">
    <h2 class="slide__title">Заголовок</h2>
    <p class="slide__text">Текст</p>
    <button class="slide__btn" data-action="next">Дальше</button>
  </div>
</section>
```

Элементы с атрибутом `data-animate="fade-in-up"` автоматически анимируются при появлении слайда.
