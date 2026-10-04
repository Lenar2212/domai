# DomAI v110 — COMMERCIAL LAUNCH READY

Добавлено поверх v109:
- реквизиты продавца через server secrets без хранения их в frontend-коде;
- динамическая подстановка реквизитов в юридические страницы;
- `/api/public-config` и `/api/launch-gates`;
- `/api/health` показывает готовность продаж;
- платные заказы блокируются, пока реквизиты продавца не заполнены;
- возврат из YooKassa принудительно строится от текущего HTTPS host;
- защита от повторной активации заказа webhook;
- футер показывает фактические реквизиты после настройки;
- Render env-переменные для продавца;
- версия интерфейса v110.

Перед продажами обязательно заполнить: DOMAI_SELLER_NAME, DOMAI_SELLER_INN, DOMAI_SELLER_STATUS, DOMAI_SELLER_EMAIL, DOMAI_SELLER_ADDRESS, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY и DOMAI_ADMIN_BOOTSTRAP_KEY.

Инженерные результаты DomAI остаются предварительными/концептуальными и требуют профессиональной проверки перед строительством.
