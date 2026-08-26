# -*- coding: utf-8 -*-
"""
Automatic 1048 State Translator using standard HOI4 dictionary & geographic rules
"""
import json
import re

with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)

features = geojson_data.get('features', [])
print(f"Total map features: {len(features)}")
