# Brand Tokens

Ниже зафиксирована цветовая система калькулятора для использования в UI, PDF и будущих экранах.

## Core (default)

| Token | Value | Usage |
|---|---|---|
| `--brand-cyan` | `#6BAEC3` | Основной бренд-акцент |
| `--brand-orange` | `#D68642` | Дополнительный акцент |
| `--brand-green` | `#A7C257` | Поддерживающий акцент |
| `--brand-cyan-dark` | `#4F97AC` | Темный акцент/градиент |
| `--brand-beige` | `#DDBB92` | Мягкие фоны |
| `--brand-olive` | `#C2CE9A` | Мягкие фоны/панели |
| `--action-bg` | `#2F6F82` | Primary button BG |
| `--action-bg-hover` | `#255B6A` | Primary button hover |
| `--action-fg` | `#FFFFFF` | Primary button text |
| `--secondary-bg` | `#EDF5F8` | Secondary button BG |
| `--secondary-fg` | `#264D5A` | Secondary button text |
| `--secondary-border` | `#BFD4DE` | Secondary button border |
| `--table-head-bg` | `#E9F1F4` | Table header background |
| `--table-sticky-bg` | `#F3F7F8` | Sticky column background |
| `--table-key-bg` | `rgba(107, 174, 195, 0.14)` | Key metrics cells |
| `--table-key-head-bg` | `rgba(107, 174, 195, 0.24)` | Key metrics headers |

## Sun

| Token | Value |
|---|---|
| `--action-bg` | `#3A7586` |
| `--action-bg-hover` | `#2F6271` |
| `--secondary-bg` | `#F5ECE2` |
| `--secondary-fg` | `#534639` |
| `--secondary-border` | `#D8C8B5` |

## Leaf

| Token | Value |
|---|---|
| `--action-bg` | `#3F6F3D` |
| `--action-bg-hover` | `#345A32` |
| `--secondary-bg` | `#EEF4E2` |
| `--secondary-fg` | `#365135` |
| `--secondary-border` | `#C9D6AF` |

## Board (presentation)

| Token | Value | Purpose |
|---|---|---|
| `--action-bg` | `#1F4F5E` | Контраст для демонстраций/презентаций |
| `--action-bg-hover` | `#173F4B` | Hover для demo-режима |
| `--table-head-bg` | `#E3E8EB` | Более строгая таблица |
| `--table-key-bg` | `rgba(95, 159, 179, 0.18)` | Выделение ключевых KPI |

## Status Tokens

| Token | Value | Semantics |
|---|---|---|
| `--ok` | `#237A2B` | Положительные показатели |
| `--warn` | `#A86B00` | Пограничные показатели |
| `--error` | `#B3261E` | Негативные показатели |

## Accessibility Notes

- Для primary-кнопок используется темный фон (`--action-bg`) с белым текстом для стабильной читаемости.
- Текст на цветных подложках не должен опускаться ниже `--ink-700`.
- В таблицах ключевые метрики выделяются не только цветом, но и весом шрифта.
