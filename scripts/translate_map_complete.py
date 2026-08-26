# -*- coding: utf-8 -*-
"""
1048 HOI4 States Comprehensive Chinese Localizer
"""
import json
import re

with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

features = map_data.get('features', [])
print(f"Loaded {len(features)} map features")
