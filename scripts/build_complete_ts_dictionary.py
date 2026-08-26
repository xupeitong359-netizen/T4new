# -*- coding: utf-8 -*-
"""
Generate complete src/app/lib/provinceTranslations.ts and update src/app/assets/hoi4_fixed_map.json
"""
import json
import re

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Loaded {len(all_states)} states from all_states.json")
