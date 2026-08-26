/**
 * 真实二战军事装备历史档案与视觉资产库 (MILITARY EQUIPMENT ARCHIVAL ASSETS)
 * 严格按照真实二战军械历史型号、年代与技术规格配置
 * 拒绝简陋/抽象几何 SVG，采用真实装备摄影、历史技术图纸与高精度专业侧视图
 */

export interface MilitaryEquipmentAsset {
 artKey: string;
 historicalModel: string; // 真实历史装备型号
 eraLabel: string; // 年代标定
 specSnippet: string; // 关键战技指标
 category: 'infantry' | 'support' | 'artillery' | 'armor' | 'industry' | 'air' | 'naval' | 'electronics';
 // 真实历史装备照片或专业三视图透明图 (Wikimedia Commons / 历史档案馆公共领域资产)
 imageUrl: string;
 // 备用高精度历史档案图
 backupImageUrl?: string;
 // 专业技术侧视图/蓝图线稿 (备用极高细节真实工程线)
 blueprintDetails: string;
}

export const MILITARY_EQUIPMENT_MAP: Record<string, MilitaryEquipmentAsset> = {
 // ================= 1. 步兵武器系列 (INFANTRY) =================
 rifle_bolt: {
  artKey: 'rifle_bolt',
  historicalModel: '毛瑟 Karabiner 98k 步枪 (1935)',
  eraLabel: '1936 标准制式',
  specSnippet: '7.92×57mm 毛瑟弹 · 5发内置弹仓 · 有效射程 500m',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Kar_98K_AM021488_noBG.png/640px-Kar_98K_AM021488_noBG.png',
  backupImageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '栓动旋转后拉枪机，胡桃木一体化枪托，H型上护木与刺刀座。',
 },
 rifle_semi: {
  artKey: 'rifle_semi',
  historicalModel: 'M1 加兰德半自动步枪 (1936)',
  eraLabel: '1938 半自动列装',
  specSnippet: '.30-06 斯普林菲尔德弹 · 8发漏夹供弹 · 射速 40-50发/分',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/M1_Garand_rifle_USA_noBG_new.png/640px-M1_Garand_rifle_USA_noBG_new.png',
  blueprintDetails: '长行程活塞导气式原理，回转闭锁枪机，经典八发清空漏夹抛壳鸣音。',
 },
 rifle_assault: {
  artKey: 'rifle_assault',
  historicalModel: 'StG 44 突击步枪 (1944)',
  eraLabel: '1944 突击步枪',
  specSnippet: '7.92×33mm 短弹 · 30发弧形弹匣 · 射速 500-600发/分',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sturmgewehr_44.png/640px-Sturmgewehr_44.png',
  blueprintDetails: '世界突击步枪鼻祖，冲压钢板机匣，兼具冲锋枪连发火力与步枪射程。',
 },
 smg: {
  artKey: 'smg',
  historicalModel: 'MP 40 冲锋枪 (1940)',
  eraLabel: '1938 单兵速射',
  specSnippet: '9×19mm 帕拉贝鲁姆弹 · 32发直弹匣 · 射速 500发/分',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/MP_40_AYF_2.JPG/640px-MP_40_AYF_2.JPG',
  blueprintDetails: '全金属折叠枪托与大面积冲压件，堑壕近战与装甲兵自卫主力。',
 },
 mg_squad: {
  artKey: 'mg_squad',
  historicalModel: 'MG 42 通用机枪 (1942)',
  eraLabel: '1940 班组机枪',
  specSnippet: '7.92×57mm 毛瑟弹 · 弹链供弹 · 射速 1200-1500发/分',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/MG42-1.jpg/640px-MG42-1.jpg',
  blueprintDetails: '滚柱闭锁延迟开锁，可快速更换枪管设计，二战最具威慑力的压制火网。',
 },
 manpad_at: {
  artKey: 'manpad_at',
  historicalModel: 'RPzB 54 坦克杀手 (Panzerschreck)',
  eraLabel: '1943 步兵反装甲',
  specSnippet: '88mm 空心装药破甲火箭弹 · 穿甲深度 230mm 均质装甲',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Panzerschreck_8%2C8_cm_RPzB_54.jpg/640px-Panzerschreck_8%2C8_cm_RPzB_54.jpg',
  blueprintDetails: '带防护盾板的步兵重型火箭发射筒，赋予步兵单兵击毁重型坦克的致命能力。',
 },
 night_vision: {
  artKey: 'night_vision',
  historicalModel: 'ZG 1229 吸血鬼 (Vampir) 红外夜视仪',
  eraLabel: '1944 单兵夜视',
  specSnippet: '主动红外探照大灯 + 像增强器目镜 · 探测距离 200m',
  category: 'infantry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Zielger%C3%A4t_1229.jpg/640px-Zielger%C3%A4t_1229.jpg',
  blueprintDetails: '步兵单兵夜战跨时代装备，挂载于 StG 44 突击步枪上方配合背负电池组。',
 },

 // ================= 2. 支援装备与工勤 (SUPPORT) =================
 ifv_halftrack: {
  artKey: 'ifv_halftrack',
  historicalModel: 'Sd.Kfz. 251 半履带装甲运兵车',
  eraLabel: '1940 机械化步兵',
  specSnippet: '倾斜装甲防护 · 运载 10 名全副武装掷弹兵 · 极速 52.5 km/h',
  category: 'support',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Sd.Kfz._251_Ausf._D_Saumur.jpg/640px-Sd.Kfz._251_Ausf._D_Saumur.jpg',
  blueprintDetails: '前轮转向配合后部全地形履带，伴随装甲集群伴随突击的战场铁骑。',
 },
 engineer_shovel: {
  artKey: 'engineer_shovel',
  historicalModel: '野战工兵突击破障与排雷装备组',
  eraLabel: '1936 战斗工兵',
  specSnippet: '工兵折叠锹 · 扫雷探针 · 爆破炸药包与堑壕构筑套件',
  category: 'support',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Feldspaten_WW2.jpg/640px-Feldspaten_WW2.jpg',
  blueprintDetails: '负责雷区开辟通路、反坦克三角锥爆破与前沿野战要塞坑道快速构筑。',
 },
 recon_scout: {
  artKey: 'recon_scout',
  historicalModel: 'Sd.Kfz. 222 轻型装甲侦察车',
  eraLabel: '1938 装甲侦察',
  specSnippet: '四轮驱动底盘 · 20mm KwK 30 机关炮 · 无线电远距通讯',
  category: 'support',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/SdKfz_222_Leichter_Panzersp%C3%A4hwagen.jpg/640px-SdKfz_222_Leichter_Panzersp%C3%A4hwagen.jpg',
  blueprintDetails: '多面倾斜装甲车体，开顶式防榴弹网炮塔，穿插刺探敌前沿阵地部署。',
 },
 field_hospital: {
  artKey: 'field_hospital',
  historicalModel: '野战外科移动医疗与急救站',
  eraLabel: '1938 战地医疗',
  specSnippet: '磺胺类抗菌剂 · 血浆冷藏车 · 野战手术急救帐篷组',
  category: 'support',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/WWII_Medic_Jeep_and_tent.jpg/640px-WWII_Medic_Jeep_and_tent.jpg',
  blueprintDetails: '提供第一线创伤止血救治与快速后送，极大减少战损兵员永久减员。',
 },
 maintenance_wrench: {
  artKey: 'maintenance_wrench',
  historicalModel: '野战重型重装备抢修所与吊车',
  eraLabel: '1940 军械抢修',
  specSnippet: 'FAMO 18吨重型半履带抢救车 · 6吨 Bilstein 野战吊臂',
  category: 'support',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/FAMO_Crane_repair_tank.jpg/640px-FAMO_Crane_repair_tank.jpg',
  blueprintDetails: '前线就地吊装战损坦克发动机、修复断裂履带与更换破损悬挂系统。',
 },
 logistics_depot: {
  artKey: 'logistics_depot',
  historicalModel: '欧宝闪电 3吨标准越野卡车 (Opel Blitz)',
  eraLabel: '1936 战备辎重',
  specSnippet: '3.6L 6缸汽油机 · 载重 3.3 吨 · 军用全地形箱式后斗',
  category: 'support',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Opel_Blitz_3.6-36S.jpg/640px-Opel_Blitz_3.6-36S.jpg',
  blueprintDetails: '二战闪击战主干军用卡车，维系千里战线上弹药、燃油与口粮的生命线。',
 },

 // ================= 3. 炮兵与火力压制 (ARTILLERY) =================
 howitzer_light: {
  artKey: 'howitzer_light',
  historicalModel: '10.5 cm leFH 18 师属轻型榴弹炮',
  eraLabel: '1936 轻型榴弹炮',
  specSnippet: '口径 105mm · 射程 10,675m · 射速 6-8发/分 · 分离式药筒',
  category: 'artillery',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/10.5_cm_leFH_18_MWP_04.jpg/640px-10.5_cm_leFH_18_MWP_04.jpg',
  blueprintDetails: '双脚开脚式大架，带有大型弧形防盾，步兵师级标准压制火炮基石。',
 },
 howitzer_heavy: {
  artKey: 'howitzer_heavy',
  historicalModel: '15 cm sFH 18 重型野战榴弹炮',
  eraLabel: '1938 重型压制炮',
  specSnippet: '口径 149.1mm · 弹重 43.5kg · 射程 13,325m · 强力攻坚',
  category: 'artillery',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/15_cm_sFH_18_MWP_01.jpg/640px-15_cm_sFH_18_MWP_01.jpg',
  blueprintDetails: '重达 5.5 吨的钢铁巨兽，足以彻底抹平敌军坚固永备防御工事与指挥所。',
 },
 at_gun_light: {
  artKey: 'at_gun_light',
  historicalModel: '7.5 cm Pak 40 重型反坦克炮',
  eraLabel: '1940 反坦克加农',
  specSnippet: '口径 75mm · 初速 990 m/s · 1000米穿透 132mm 装甲',
  category: 'artillery',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Pak_40_CFB_Borden_1.jpg/640px-Pak_40_CFB_Borden_1.jpg',
  blueprintDetails: '双室式炮口制退器，低矮防盾轮廓，任何中型盟军战车的致命克星。',
 },
 aa_gun: {
  artKey: 'aa_gun',
  historicalModel: '8.8 cm FlaK 36/37 防空/平射两用炮',
  eraLabel: '1940 重型高炮',
  specSnippet: '口径 88mm · 射高 9,900m · 射速 15-20发/分 · 平射破甲 150mm',
  category: 'artillery',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Flak18-36%28cropped%29.png/640px-Flak18-36%28cropped%29.png',
  blueprintDetails: '十字形折叠基座，二战最具传奇色彩的防空与地面反装甲双料王牌。',
 },
 rocket_artillery: {
  artKey: 'rocket_artillery',
  historicalModel: 'BM-13 喀秋莎多管火箭炮 (Katyusha)',
  eraLabel: '1942 火箭压制',
  specSnippet: '132mm M-13 火箭弹 · 16轨发射架 · 7秒倾泻全部齐射',
  category: 'artillery',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Katyusha_rocket_launcher_in_Saint_Petersburg.jpg/640px-Katyusha_rocket_launcher_in_Saint_Petersburg.jpg',
  blueprintDetails: '被誉为“斯大林的管风琴”，以毁灭性的密集火力覆盖令敌军阵地陷入火海。',
 },

 // ================= 4. 装甲战车与坦克 (ARMOR) =================
 tank_light: {
  artKey: 'tank_light',
  historicalModel: '二号坦克 C型 (Panzerkampfwagen II)',
  eraLabel: '1936 轻型巡航',
  specSnippet: '20mm KwK 30 机炮 · 7.92mm 同轴机枪 · 极速 40 km/h · 重8.9吨',
  category: 'armor',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Panzer_II_Ausf_C_Saumur.jpg/640px-Panzer_II_Ausf_C_Saumur.jpg',
  blueprintDetails: '波兰与法国战役初期的装甲侦察与侧翼突击主力，机动性能出色。',
 },
 tank_medium: {
  artKey: 'tank_medium',
  historicalModel: '四号坦克 G/H型 (Panzerkampfwagen IV)',
  eraLabel: '1938 主力中型',
  specSnippet: '长身管 7.5 cm KwK 40 L/48 · 80mm 正面装甲 · 重25吨',
  category: 'armor',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Panzer_IV_Ausf._G_Saumur.jpg/640px-Panzer_IV_Ausf._G_Saumur.jpg',
  blueprintDetails: '装甲师真正的中流砥柱，伴随附加装甲裙板(Schürzen)，火力防护均衡。',
 },
 tank_heavy: {
  artKey: 'tank_heavy',
  historicalModel: '虎式重型坦克 (Tiger I / Panzer VI)',
  eraLabel: '1942 突破重坦',
  specSnippet: '8.8 cm KwK 36 L/56 · 100mm 垂直装甲 · 迈巴赫 HL230 700马力',
  category: 'armor',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tiger_I_Saumur.jpg/640px-Tiger_I_Saumur.jpg',
  blueprintDetails: '交错负重轮与宽履带设计，二战最具威慑力的重装甲攻坚与防守壁垒。',
 },
 tank_modern: {
  artKey: 'tank_modern',
  historicalModel: '黑豹中型战车 (Panzer V Panther)',
  eraLabel: '1944 现代化主战',
  specSnippet: '7.5 cm KwK 42 L/70 (超长身管) · 80mm 55度大倾斜装甲 · 46 km/h',
  category: 'armor',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Panther_Ausf._A_Saumur.jpg/640px-Panther_Ausf._A_Saumur.jpg',
  blueprintDetails: '融合倾斜装甲哲学与高倍径反坦克炮，被公认为现代主战坦克(MBT)雏形。',
 },
 tank_destroyer: {
  artKey: 'tank_destroyer',
  historicalModel: '猎豹坦克歼击车 (Jagdpanther)',
  eraLabel: '1943 猎歼战车',
  specSnippet: '8.8 cm Pak 43/3 L/71 · 80mm 大倾斜一体化固定战斗室',
  category: 'armor',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Jagdpanther_Munster.jpg/640px-Jagdpanther_Munster.jpg',
  blueprintDetails: '黑豹底盘改装无炮塔猎歼车，能在 2500 米外一击必杀任何重型装甲目标。',
 },
 sp_artillery: {
  artKey: 'sp_artillery',
  historicalModel: 'M7 牧师 105mm 自行火炮 (M7 Priest)',
  eraLabel: '1942 自行火炮',
  specSnippet: 'M2A1 105mm 榴弹炮 · 谢尔曼坦克底盘 · 顶部配备 .50 机枪圆环座',
  category: 'armor',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/M7_Priest_CFB_Borden_1.jpg/640px-M7_Priest_CFB_Borden_1.jpg',
  blueprintDetails: '为装甲集群提供随叫随到的行进间曲射火力支援，具备快速转移撤收能力。',
 },

 // ================= 5. 国家工业与产能 (INDUSTRY) =================
 machine_tools: {
  artKey: 'machine_tools',
  historicalModel: '重型精密车床与万能铣床母机群',
  eraLabel: '1936 工业母机',
  specSnippet: '0.01mm 工业级公差 · 齿轮模数精密加工 · 军械制造核心基石',
  category: 'industry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lathe_Machine_Tool_WWII.jpg/640px-Lathe_Machine_Tool_WWII.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '国家重工业切削母机，生产大口径火炮炮管、坦克曲轴与战机涡轮部件。',
 },
 assembly_line: {
  artKey: 'assembly_line',
  historicalModel: '战时军工流水线 (Ford Willow Run 模式)',
  eraLabel: '1938 自动化流水',
  specSnippet: '链式传送总装台 · 模块化预制总成 · 产能呈指数级跃升',
  category: 'industry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/B-24_assembly_line_Fort_Worth.jpg/640px-B-24_assembly_line_Fort_Worth.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '将汽车流水线经验引入重型战机与装甲车制造，实现每小时下线战车奇迹。',
 },
 synthetic_fuel: {
  artKey: 'synthetic_fuel',
  historicalModel: '费托合成 (Fischer-Tropsch) 煤制油工厂',
  eraLabel: '1940 合成燃料',
  specSnippet: '高压催化裂解塔 · 煤炭水煤气转化 · 生产高辛烷值航空煤油',
  category: 'industry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Leuna_works_synthetic_oil_1945.jpg/640px-Leuna_works_synthetic_oil_1945.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '打破海上石油封锁的战略化工生命线，为战车装甲与战机提供持续动力。',
 },
 alloy_smelter: {
  artKey: 'alloy_smelter',
  historicalModel: '电弧高炉与克虏伯表面硬化装甲钢',
  eraLabel: '1942 军用特种钢',
  specSnippet: '镍铬钼合金钢 · 渗碳表面硬化处理 · 抗穿甲弹韧性 +40%',
  category: 'industry',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Blast_furnace_steel_mill.jpg/640px-Blast_furnace_steel_mill.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '重型战列舰主装甲带与重型坦克首上装甲的关键冶金铸造技术。',
 },

 // ================= 6. 航空战机与空优 (AIR) =================
 fighter_early: {
  artKey: 'fighter_early',
  historicalModel: '梅塞施密特 Bf 109E (Messerschmitt)',
  eraLabel: '1936 早期全金属单翼',
  specSnippet: 'DB 601 倒V型液冷 1100马力 · 2×20mm 航炮 + 2×7.92mm 机枪 · 560 km/h',
  category: 'air',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bf_109_G-6_profile.png/640px-Bf_109_G-6_profile.png',
  blueprintDetails: '全金属悬臂下单翼与前缘缝翼，不列颠空战与欧陆苍穹的制空王者。',
 },
 fighter_advanced: {
  artKey: 'fighter_advanced',
  historicalModel: '福克-沃尔夫 Fw 190A 百舌鸟 (Fw 190)',
  eraLabel: '1941 进阶截击机',
  specSnippet: '宝马 BMW 801 14缸星型 1700马力 · 4×20mm MG 151/20 航炮 · 656 km/h',
  category: 'air',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Focke-Wulf_Fw_190_A-8_profile.png/640px-Focke-Wulf_Fw_190_A-8_profile.png',
  blueprintDetails: '极其强悍的滚转率与毁伤火力，被称为“屠夫之鸟”，兼具高空拦截与对地轰炸。',
 },
 fighter_jet: {
  artKey: 'fighter_jet',
  historicalModel: '梅塞施密特 Me 262 飞燕 (Schwalbe)',
  eraLabel: '1944 喷气战斗机',
  specSnippet: '2×容克斯 Jumo 004 轴流喷气机 · 4×30mm MK 108 航炮 · 870 km/h',
  category: 'air',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Messerschmitt_Me_262_profile.png/640px-Messerschmitt_Me_262_profile.png',
  blueprintDetails: '世界首款投入实战的喷气式后掠翼战斗机，速度彻底碾压当时所有活塞战机。',
 },
 fighter_cas: {
  artKey: 'fighter_cas',
  historicalModel: '容克斯 Ju 87 斯图卡俯冲轰炸机 (Stuka)',
  eraLabel: '1938 俯冲支援机',
  specSnippet: '倒鸥型机翼 · 自动俯冲拉起配平 · 挂载 500kg 航弹与“耶利哥号角”风笛',
  category: 'air',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Junkers_Ju_87_Stuka_profile.png/640px-Junkers_Ju_87_Stuka_profile.png',
  blueprintDetails: '精准垂直俯冲轰炸配合尖锐警报声，二战地面步兵与装甲阵地的心理梦魇。',
 },
 bomber_strat: {
  artKey: 'bomber_strat',
  historicalModel: 'B-17 空中堡垒重型战略轰炸机',
  eraLabel: '1940 远程战略轰炸',
  specSnippet: '4×莱特 R-1820 涡轮增压发动机 · 载弹量 7,900kg · 13挺 12.7mm 自卫机枪',
  category: 'air',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/B-17_Flying_Fortress_profile.png/640px-B-17_Flying_Fortress_profile.png',
  blueprintDetails: '跨洲际航程配合诺顿瞄准具，深入敌国腹地彻底摧毁工业重镇与军工枢纽。',
 },

 // ================= 7. 海军舰艇与远洋 (NAVAL) =================
 destroyer: {
  artKey: 'destroyer',
  historicalModel: '弗莱彻级舰队驱逐舰 (Fletcher-class)',
  eraLabel: '1936 舰队驱逐舰',
  specSnippet: '排水量 2,500吨 · 5×127mm 38倍径高平两用炮 · 2×五联装 533mm 鱼雷管 · 36.5节',
  category: 'naval',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Fletcher_class_destroyer_profile.png/640px-Fletcher_class_destroyer_profile.png',
  blueprintDetails: '平甲板船型配合高功率高压锅炉，舰队防空护航、反潜深水炸弹与雷击先锋。',
 },
 submarine_ocean: {
  artKey: 'submarine_ocean',
  historicalModel: 'VII-C 型远洋破交潜艇 (Type VII U-Boat)',
  eraLabel: '1938 远洋破交潜艇',
  specSnippet: '水下排水量 871吨 · 5×533mm 鱼雷管 (14枚鱼雷) · 潜深 220米 · 狼群战术主力',
  category: 'naval',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Type_VII_submarine_profile.png/640px-Type_VII_submarine_profile.png',
  blueprintDetails: '双壳体耐压艇身与大型指挥塔围壳，在大西洋掀起绞杀盟国航运的无限制潜艇战。',
 },
 battleship: {
  artKey: 'battleship',
  historicalModel: '俾斯麦级超无畏战列舰 (Bismarck-class)',
  eraLabel: '1940 巨舰大炮战列舰',
  specSnippet: '满载排水量 50,300吨 · 4座双联装 380mm 47倍径主炮 · 主装甲带 320mm · 30节',
  category: 'naval',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Bismarck_battleship_profile.png/640px-Bismarck_battleship_profile.png',
  blueprintDetails: '穹甲防雷装甲结构与大口径高速舰炮，大洋决战中最具威慑力的大舰巨炮图腾。',
 },
 carrier: {
  artKey: 'carrier',
  historicalModel: '埃塞克斯级舰队航空母舰 (Essex-class)',
  eraLabel: '1942 全通甲板舰队航母',
  specSnippet: '标准排水量 27,100吨 · 载机量 90-100架舰载机 · 3部飞机升降机 · 33节航速',
  category: 'naval',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/USS_Enterprise_CV-6_profile.png/640px-USS_Enterprise_CV-6_profile.png',
  blueprintDetails: '全通式飞行甲板与开放式机库，夺取太平洋广袤海空制空权的核心决战兵器。',
 },

 // ================= 8. 电子雷达与工程 (ELECTRONICS) =================
 diff_engine: {
  artKey: 'diff_engine',
  historicalModel: '恩尼格玛 (Enigma) 密码机与图灵炸弹机',
  eraLabel: '1936 密码与机电计算机',
  specSnippet: '三转子互换置乱接线板 · 1.58×10^20 种密钥可能 · 战时情报破译中枢',
  category: 'electronics',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Enigma-Machine.jpg/640px-Enigma-Machine.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '开创现代密码学与计算科学雏形，实时破译敌军最高统帅部密电命令。',
 },
 radar_array: {
  artKey: 'radar_array',
  historicalModel: '维尔茨堡巨兽 (Würzburg-Riese) 防空相控雷达',
  eraLabel: '1940 甚高频雷达网',
  specSnippet: '7.5米抛物面巨型天线 · 波长 53cm (560 MHz) · 探测距离 70km 精度 100m',
  category: 'electronics',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/FuMG_65_W%C3%BCrzburg-Riese_radar.jpg/640px-FuMG_65_W%C3%BCrzburg-Riese_radar.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '联动重型高射炮连与夜间战斗机截击中队，构建早期全天候防国防空情报天网。',
 },
 atomic_reactor: {
  artKey: 'atomic_reactor',
  historicalModel: '芝加哥一号堆 (Chicago Pile-1) 重核反应堆',
  eraLabel: '1944 重核工程',
  specSnippet: '石墨慢化中子 · 纯化金属铀晶格 · 人类首次实现自持可控核裂变链式反应',
  category: 'electronics',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Chicago_Pile_1_drawing.jpg/640px-Chicago_Pile_1_drawing.jpg',
  backupImageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
  blueprintDetails: '曼哈顿工程战略起点，重核能量解锁，战争与人类能源格局的终极分水岭。',
 },
};

/**
 * 获取指定装备的官方历史档案与高清资产
 */
export function getEquipmentAsset(artKey: string): MilitaryEquipmentAsset {
 return (
  MILITARY_EQUIPMENT_MAP[artKey] || {
   artKey,
   historicalModel: '通用军事战备装备',
   eraLabel: '1936 标准制式',
   specSnippet: '标准化军品规程',
   category: 'infantry',
   imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Kar_98K_AM021488_noBG.png/640px-Kar_98K_AM021488_noBG.png',
   blueprintDetails: '战时标准化军品技术装备。',
  }
 );
}
