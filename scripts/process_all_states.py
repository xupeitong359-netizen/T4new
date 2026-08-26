# -*- coding: utf-8 -*-
import json
import os

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Total states to process: {len(all_states)}")
