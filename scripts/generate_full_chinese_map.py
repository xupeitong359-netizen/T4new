# -*- coding: utf-8 -*-
"""
Complete mapping for all HOI4 state names to Chinese
"""
import json
import os

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

# Comprehensive Name Translation Map
MAPPING = {
    # Special & Compound Names
    "Bouches-du-Rhone": "罗讷河口",
    "Middle Yangtze": "长江中游",
    "Hebei-Chahar": "冀察地区",
    "Deccan States": "德干诸邦",
    "Western Indian States": "西印度诸邦",
    "Eastern Indian States": "东印度诸邦",
    "Central Indian States": "中印度诸邦",
    "Punjab States": "旁遮普诸邦",
    "Madras States": "马德拉斯诸邦",
    "Rajputana": "拉杰普塔纳",
    "United Provinces": "联合省",
    "Central Provinces": "中央省",
    "Bombay": "孟买",
    "Madras": "马德拉斯",
    "Bengal": "孟加拉",
    "East Bengal": "东孟加拉",
    "West Bengal": "西孟加拉",
    "Bihar": "比哈尔",
    "Orissa": "奥里萨",
    "Assam": "阿萨姆",
    "Sikkim": "锡金",
    "Bhutan": "不丹",
    "Nepal": "尼泊尔",
    "Sind": "信德",
    "Baluchistan": "俾路支斯坦",
    "North-West Frontier": "西北边境省",
    "Kashmir": "克什米尔",
    "Punjab": "旁遮普",
    "Ceylon": "锡兰 (斯里兰卡)",
    "Andaman and Nicobar": "安达曼-尼科巴群岛",
    "Maldives": "马尔代夫",
    "Goa": "果阿",
    "Pondicherry": "本地治里",
    "French India": "法属印度",
    "Portuguese India": "葡属印度",
}

print(f"Loaded {len(MAPPING)} mappings")
