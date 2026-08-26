# -*- coding: utf-8 -*-
"""
Database builder for translating all 1048 HOI4 states
"""
import json
import re

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Total states to process: {len(all_states)}")
