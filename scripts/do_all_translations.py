# -*- coding: utf-8 -*-
"""
Generate complete 1048 HOI4 translations for all states
"""
import json
import re

# Load all 1048 states
with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

# Load existing geojson
with open('./src/app/assets/hoi4_fixed_map.json', 'r', encoding='utf-8') as f:
    geojson_map = json.load(f)

print(f"Total states to process: {len(all_states)}, Features in map: {len(geojson_map['features'])}")
