import json

# Comprehensive dictionary for all 1048 HOI4 states
with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

print(f"Total states to translate: {len(all_states)}")

# Let's inspect the names and IDs
missing = []
for s in all_states:
    state_id = s['id']
    name = s['name']
    owner = s['owner']

print(f"Sample: {all_states[:5]}")
