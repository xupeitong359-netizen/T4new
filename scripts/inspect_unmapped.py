import json

# Let's inspect unique unmapped names
with open('./all_states.json', 'r', encoding='utf-8') as f:
    states = json.load(f)

print(f"Total states: {len(states)}")
