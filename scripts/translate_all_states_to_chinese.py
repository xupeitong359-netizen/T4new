# -*- coding: utf-8 -*-
"""
Exhaustive 1048 HOI4 States Translator to Simplified Chinese
"""
import json
import re

# Load all 1048 states
with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Total states to translate: {len(all_states)}")
