# -*- coding: utf-8 -*-
"""
Build complete 1048 state translation dictionary and write to TypeScript & JSON
"""
import json
import os

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Total states: {len(all_states)}")
