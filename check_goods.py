import pandas as pd
import os

GOODS_FILE = "goods.xlsx"

print("=== ПЕРЕВІРКА ФАЙЛУ ТОВАРІВ ===")

if os.path.exists(GOODS_FILE):
    try:
        df = pd.read_excel(GOODS_FILE)
        print(f"✅ Файл існує, рядків: {len(df)}")
        print(f"Колонки: {list(df.columns)}")
        print("\nПерші 5 рядків:")
        print(df.head())
    except Exception as e:
        print(f"❌ Помилка читання файлу: {e}")
else:
    print("❌ Файл goods.xlsx не існує")

print("\n=== ПЕРЕВІРКА ЗАВЕРШЕНА ===")
