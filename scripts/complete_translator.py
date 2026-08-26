# -*- coding: utf-8 -*-
"""
Complete translator script for all 1048 HOI4 states
"""
import json
import re

with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)

features = geojson_data.get('features', [])
print(f"Total features in map: {len(features)}")
