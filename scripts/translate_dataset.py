# -*- coding: utf-8 -*-
"""
Comprehensive 1048 States Translator
"""
import json
import re

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

# Comprehensive lookup of state names & IDs
# We will ensure 100% of the 1048 states are translated
print(f"Total states to translate: {len(all_states)}")
