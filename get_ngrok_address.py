#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Отримання глобальної адреси від ngrok
"""

import requests
import json
import sys
import os

def get_ngrok_address():
    """Отримує публічну адресу від ngrok"""
    try:
        response = requests.get('http://localhost:4040/api/tunnels', timeout=3)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get('tunnels', [])
            
            if tunnels:
                for tunnel in tunnels:
                    public_url = tunnel['public_url']
                    proto = tunnel['proto']
                    
                    print(f'✅ ngrok тунель активний')
                    print(f'🌍 Глобальна адреса: {public_url}')
                    print(f'📡 Протокол: {proto}')
                    
                    # Збереження в файл
                    try:
                        with open('public_url.txt', 'w', encoding='utf-8') as f:
                            f.write(public_url)
                        print(f'💾 Адреса збережена в public_url.txt')
                    except Exception as e:
                        print(f'⚠️  Не вдалося зберегти адресу: {e}')
                    
                    # Тест доступності
                    try:
                        test_response = requests.get(f'{public_url}/health', timeout=5)
                        if test_response.status_code == 200:
                            print(f'✅ Глобальний доступ працює!')
                        else:
                            print(f'⚠️  Глобальний доступ: {test_response.status_code}')
                    except:
                        print(f'⚠️  Глобальний доступ може бути недоступний (це нормально для ngrok free)')
                    
                    return True
                    
            print('❌ ngrok тунелі не знайдено')
            return False
        else:
            print(f'❌ ngrok API недоступний: {response.status_code}')
            return False
            
    except requests.exceptions.ConnectionError:
        print('❌ ngrok не працює - немає з\'єднання з API')
        return False
    except requests.exceptions.Timeout:
        print('❌ ngrok API не відповідає (timeout)')
        return False
    except Exception as e:
        print(f'❌ ngrok не працює: {e}')
        return False

if __name__ == "__main__":
    success = get_ngrok_address()
    sys.exit(0 if success else 1)
