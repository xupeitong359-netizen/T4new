# -*- coding: utf-8 -*-
"""
Run comprehensive translation on hoi4_fixed_map.json
"""
import json
import os
import re

with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)

print(f"Total features: {len(geojson_data['features'])}")
