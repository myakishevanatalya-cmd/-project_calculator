# Публикация калькулятора по ссылке (GitHub Pages)

## 1. Загрузить проект в GitHub
```bash
git remote add origin https://github.com/<your-org-or-user>/<repo>.git
git push -u origin master
```

Если основная ветка у вас `main`, используйте `main` вместо `master`.

## 2. Включить Pages в репозитории
1. Откройте `Settings` -> `Pages`.
2. В `Build and deployment` выберите `Source: GitHub Actions`.
3. Сохраните.

В репозитории уже есть workflow:
- `.github/workflows/deploy-pages.yml`

После push GitHub автоматически развернет сайт.

## 3. Получить ссылку
1. Откройте вкладку `Actions`.
2. Дождитесь зеленого статуса workflow `Deploy Static Site to GitHub Pages`.
3. Готовая ссылка будет в `Environments` -> `github-pages` или в `Pages`.

Обычно формат ссылки:
`https://<user-or-org>.github.io/<repo>/`

## Где сохраняются расчеты сейчас
- Сохранение карточек (`Сохранить черновик`) — в `localStorage` браузера.
- Это значит:
  - у каждого коллеги свои локальные сохранения;
  - между пользователями данные автоматически не синхронизируются.
- Экспорт:
  - `Excel/PDF` сохраняются в папку загрузок пользователя (обычно `Downloads`).

## Если нужна общая база для всех коллег
Следующий шаг: подключить облачное хранилище (например, Supabase/Firebase), чтобы сохраненные расчеты были едиными для всей команды.
