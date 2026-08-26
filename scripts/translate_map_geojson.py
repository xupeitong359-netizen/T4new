# -*- coding: utf-8 -*-
"""
Update hoi4_fixed_map.json and src/app/lib/provinceTranslations.ts with 100% Chinese province names
"""
import json
import re

with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total features: {len(data['features'])}")
