# -*- coding: utf-8 -*-
import json
import re

with open('./all_states.json', 'r', encoding='utf-8') as f:
    all_states = json.load(f)

# Built-in complete translation mappings
CN_NAME_LOOKUP = {
    # Special & Multi-word names
    "French SA": "法属南非", "French India": "法属印度", "Angara Land": "安加拉",
    "Jamaica": "牙买加", "Ordos (West)": "西鄂尔多斯", "Ordos (East)": "东鄂尔多斯",
    "Kurdistan": "库尔德斯坦", "Gabon": "加蓬", "Marshall Islands": "马绍尔群岛",
    "Altai": "阿尔泰", "Siam": "暹罗 (泰国)", "Guanzhong": "关中", "Haida Gwaii": "海达瓜伊",
    "Verkhoyansk": "维尔霍扬斯克", "Varmland": "韦姆兰", "Northern Morocco": "北摩洛哥",
    "Jura Mountains": "汝拉山脉", "East Africa": "东非", "Iraq": "伊拉克", "Moesia": "默西亚",
    "Madagascar": "马达加斯加", "Marsa Matruh": "马特鲁港", "Yemen": "也门", "Goias": "戈亚斯",
    "Phoenix Island": "菲尼克斯群岛", "Attu Island": "阿图岛", "Farah": "法拉", "Pegu": "勃固",
    "Burundi": "布隆迪", "Salamanca": "萨拉曼卡", "Chukotka": "楚科奇", "Khyber Pass": "开伯尔山口",
    "Province of Aden": "亚丁省", "Mauritanian Desert": "毛里塔尼亚沙漠", "Northwestern Canada": "加拿大西北地区",
    "South Transdanubia": "南外多瑙", "Iguacu": "伊瓜苏", "Sao Tome": "圣多美", "Formosa": "福尔摩沙省",
    "Dutch East Indies": "荷属东印度", "Aukstaitija": "奥克什泰蒂亚", "Johnston Atoll": "约翰斯顿环礁",
    "Saykhin": "赛欣", "Sagaing": "实皆", "Golog": "果洛", "Texas": "德克萨斯", "New Mexico": "新墨西哥",
    "Wello": "沃洛", "Ceylon": "锡兰", "Burgas": "布尔加斯", "Kharkov": "哈尔科夫", "Pochep": "波切普",
    "Savoy": "萨伏伊", "Kotlas": "科特拉斯", "Istanbul": "伊斯坦布尔", "Afar": "阿法尔",
    "Cumbria": "坎布里亚", "Asir-Makkah": "阿西尔-麦加", "Yanan": "延安", "Karakalpakstan": "卡拉卡尔帕克斯坦",
    "Asturias": "阿斯图里亚斯", "Newfoundland": "纽芬兰", "Tartu": "塔尔图", "Voralberg": "福拉尔贝格",
    "Argentina": "阿根廷", "Valladolid": "巴利亚多利德", "Labrador": "拉布拉多", "Mexico": "墨西哥城",
    "Ethiopia": "埃塞俄比亚", "Fyn": "菲英岛", "Centre": "中央大区", "Abkhazia": "阿布哈兹",
    "Schleswig-Holstein": "石勒苏益格-荷尔斯泰因", "Rio de Janeiro": "里约热内卢", "Uusima": "新地区",
    "Solomon Islands": "所罗门群岛", "Lwow": "利沃夫", "Yunnan": "云南", "Lisbon": "里斯本",
    "Pennsylvania": "宾夕法尼亚", "Pskov": "普斯科夫",
}

print(f"Loaded {len(CN_NAME_LOOKUP)} in CN_NAME_LOOKUP")
