import json
import re

# Load all states
with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Loaded {len(all_states)} states")
