# -*- coding: utf-8 -*-
"""
Translate all 1048 province names to Chinese in hoi4_fixed_map.json and src/app/lib/provinceTranslations.ts
"""
import json
import re

# Load map
with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data['features']
print(f"Total features to translate: {len(features)}")
