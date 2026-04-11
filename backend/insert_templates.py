import sqlite3
from datetime import datetime

conn = sqlite3.connect('lms.db')
cursor = conn.cursor()

now = datetime.now().isoformat()

templates = [
    ('Протокол кариеса', '<h2>Протокол лечения кариеса</h2><h3>1. Подготовка</h3><ul><li>Анамнез</li><li>Осмотр полости рта</li><li>Рентгенологическое исследование</li></ul><h3>2. Анестезия</h3><ul><li>Проводниковая / инфильтрационная анестезия</li></ul>', 1, now, now),
    ('Протокол имплантации', '<h2>Протокол имплантации</h2><h3>1. Подготовка</h3><ul><li>Клиническое обследование</li><li>3D-томография</li><li>Планирование имплантации</li></ul><h3>2. Хирургический этап</h3><ul><li>Разрез и отслойка лоскута</li><li>Подготовка ложа</li><li>Установка имплантата</li></ul>', 1, now, now),
    ('Протокол удаления', '<h2>Протокол удаления зуба</h2><h3>Показания</h3><ul><li>Показание 1</li><li>Показание 2</li></ul><h3>Этапы</h3><ol><li>Анестезия</li><li>Отслойка слизистой</li><li>Удаление зуба</li><li>Обработка лунки</li></ol>', 1, now, now),
    ('Протокол пломбирования', '<h2>Протокол пломбирования</h2><h3>Этап 1: Препарирование</h3><ul><li>Удаление кариозных тканей</li><li>Формирование полости</li></ul><h3>Этап 2: Пломбирование</h3><ul><li>Протравливание</li><li>Нанесение адгезива</li><li>Внесение композита</li><li>Полировка</li></ul>', 1, now, now),
    ('Цитата', '<blockquote class="blockquote"><p>Текст цитаты</p><cite>— Автор</cite></blockquote>', 1, now, now),
    ('Спойлер', '<details class="accordion"><summary>Нажмите для раскрытия</summary><div class="accordion-content">Скрытое содержимое</div></details>', 1, now, now),
    ('Разделитель', '<hr class="separator"/>', 1, now, now),
    ('Инфобокс', '<div class="alert alert-info"><strong>💡</strong> Важная информация</div>', 1, now, now),
    ('Предупреждение', '<div class="alert alert-warning"><strong>⚠️</strong> Предупреждение</div>', 1, now, now),
    ('Успех', '<div class="alert alert-success"><strong>✅</strong> Успех</div>', 1, now, now),
]

for t in templates:
    cursor.execute('INSERT INTO templates (title, content, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', t)

conn.commit()
print('OK')
conn.close()
