import { NationalFocusNode, Nation, ActiveNationalFocus } from '../types';

/**
 * 完整国家战略国策树（52 项宏大国家战略国策，涵盖政治、工业、国防、外交与前沿工程）
 */
export const NATIONAL_FOCUS_NODES: NationalFocusNode[] = [
  // ----------------------------------------------------
  // Level 0: 顶层战略决策 (Root Tier)
  // ----------------------------------------------------
  {
    id: 'decision_future',
    name: '决策国家未来',
    subtitle: '国家最高战略纲领',
    category: 'root',
    branchName: '顶层战略决策',
    tier: 0,
    iconType: 'compass_gold',
    durationDays: 70,
    costPoints: 0,
    prerequisites: [],
    effects: [
      { text: '国家稳定度: +10.00%', type: 'stability', value: '+10.00%' },
      { text: '政治点数: +5.00/日', type: 'political_power', value: '+5.00/日' },
      { text: '解锁四大主干发展路线', type: 'special', value: '4大主干' },
    ],
    description:
      '国家的未来掌握在我们手中。通过明智的决断和长远的规划，我们将引领国家走向繁荣与强大，为子孙后代铸就辉煌的立国之本。',
    colIndex: 6,
    rowIndex: 0,
  },

  // ----------------------------------------------------
  // Level 1: 四大主干支柱 (Tier 1 Main Pillars)
  // ----------------------------------------------------
  {
    id: 'consolidate_nation',
    name: '巩固国家',
    subtitle: '政治体制与宪政',
    category: 'politics',
    branchName: '巩固国家',
    tier: 1,
    iconType: 'shield_star',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['decision_future'],
    effects: [
      { text: '国家凝聚力: +15.00%', type: 'stability', value: '+15.00%' },
      { text: '政治点数: +2.00/日', type: 'political_power', value: '+2.00/日' },
      { text: '解锁政治宪政与官僚体系', type: 'special', value: '政权稳固' },
    ],
    description:
      '确立政权宪政权威，团结社会各阶层力量，整顿行政效能，为国家长治久安奠定不可动摇的政治基石。',
    colIndex: 1,
    rowIndex: 1,
  },
  {
    id: 'economic_development',
    name: '经济发展',
    subtitle: '工业财政与科技',
    category: 'economy',
    branchName: '经济发展',
    tier: 1,
    iconType: 'factory_city',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['decision_future'],
    effects: [
      { text: '民用工厂建造速度: +10.00%', type: 'economy', value: '+10.00%' },
      { text: '消费品需求比例: -5.00%', type: 'economy', value: '-5.00%' },
      { text: '解锁工业化与重工基建', type: 'special', value: '经济腾飞' },
    ],
    description:
      '大力推动国家工商业与基础设施建设，激活民间资本与生产潜力，构筑自给自足且生机勃勃的国家经济动脉。',
    colIndex: 4,
    rowIndex: 1,
  },
  {
    id: 'military_modernization',
    name: '军事现代化',
    subtitle: '国防整军与三军战备',
    category: 'military',
    branchName: '军事现代化',
    tier: 1,
    iconType: 'soldier_laurel',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['decision_future'],
    effects: [
      { text: '陆军组织度上限: +5.00%', type: 'military', value: '+5.00%' },
      { text: '军事科技研发速率: +10.00%', type: 'military', value: '+10.00%' },
      { text: '解锁海陆空全域扩军', type: 'special', value: '军备革新' },
    ],
    description:
      '全面革新海陆空三军指挥条令，引入现代战术思想与军工制造体系，打造保卫国家主权与边疆尊严的钢铁长城。',
    colIndex: 8,
    rowIndex: 1,
  },
  {
    id: 'diplomatic_strategy',
    name: '外交策略',
    subtitle: '地缘同盟与世界影响力',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 1,
    iconType: 'handshake_crest',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['decision_future'],
    effects: [
      { text: '外交威望: +20.00%', type: 'diplomacy', value: '+20.00%' },
      { text: '改善关系速率: +25.00%', type: 'diplomacy', value: '+25.00%' },
      { text: '解锁区域合作与霸权同盟', type: 'special', value: '多边结盟' },
    ],
    description:
      '在复杂多变的国际地缘棋局中运筹帷幄，灵活开展多边穿梭外交，缔结互惠经贸条约与集体安全同盟网络。',
    colIndex: 11,
    rowIndex: 1,
  },

  // ----------------------------------------------------
  // Level 2: 支柱细分 (Tier 2 Sub-Branches)
  // ----------------------------------------------------
  // 1. 政治分支 (Politics)
  {
    id: 'centralize_power',
    name: '加强中央集权',
    subtitle: '行政权力中枢',
    category: 'politics',
    branchName: '巩固国家',
    tier: 2,
    iconType: 'throne_crest',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['consolidate_nation'],
    effects: [
      { text: '政治点数获取: +15.00%', type: 'political_power', value: '+15.00%' },
      { text: '国家内政法令花费: -20.00%', type: 'political_power', value: '-20.00%' },
    ],
    description:
      '强化内阁政务公署指挥调度效能，消弭地方割据与推诿拖延，确保中央政令畅通无阻，行之必果。',
    colIndex: 0,
    rowIndex: 2,
  },
  {
    id: 'perfect_legal_system',
    name: '完善法律体系',
    subtitle: '法制与国家监察',
    category: 'politics',
    branchName: '巩固国家',
    tier: 2,
    iconType: 'scales_shield',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['consolidate_nation'],
    effects: [
      { text: '国家稳定度: +8.00%', type: 'stability', value: '+8.00%' },
      { text: '行政腐败发生率: -30.00%', type: 'stability', value: '-30.00%' },
    ],
    description:
      '制定严密的国家民商法典与监察准则，确立司法公正，保护国民基本产权，肃清行政贪腐隐患。',
    colIndex: 1,
    rowIndex: 2,
  },
  {
    id: 'cultural_identity',
    name: '弘扬国家认同',
    subtitle: '精神文化与共识',
    category: 'politics',
    branchName: '巩固国家',
    tier: 2,
    iconType: 'wreath_sun',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['consolidate_nation'],
    effects: [
      { text: '核心领土人力招募: +10.00%', type: 'stability', value: '+10.00%' },
      { text: '叛乱倾向度: -25.00%', type: 'stability', value: '-25.00%' },
    ],
    description:
      '弘扬本民族历史传统与立国精神，强化公民对国家的归属感与荣誉感，铸就坚韧不拔的社会凝聚力。',
    colIndex: 2,
    rowIndex: 2,
  },

  // 2. 经济分支 (Economy)
  {
    id: 'infrastructure_construction',
    name: '基础设施建设',
    subtitle: '交通网络与能源',
    category: 'economy',
    branchName: '经济发展',
    tier: 2,
    iconType: 'railway_bridge',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['economic_development'],
    effects: [
      { text: '基建建造速度: +20.00%', type: 'economy', value: '+20.00%' },
      { text: '陆军移动速度: +10.00%', type: 'military', value: '+10.00%' },
    ],
    description:
      '斥资铺设全国铁路干线、硬化公路与桥梁枢纽，打通内陆物流阻滞，极大提升战备调度与工商业物资流转效率。',
    colIndex: 3,
    rowIndex: 2,
  },
  {
    id: 'industrialization_push',
    name: '工业化推进',
    subtitle: '重工制造与产能',
    category: 'economy',
    branchName: '经济发展',
    tier: 2,
    iconType: 'gear_factory',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['economic_development'],
    effects: [
      { text: '工厂生产效率上限: +10.00%', type: 'economy', value: '+10.00%' },
      { text: '工业综合产出: +15.00%', type: 'economy', value: '+15.00%' },
    ],
    description:
      '引进先进蒸汽与重工制造装备，建立现代大型机械化厂房，将国家从传统农牧经济跃升为工业制造强国。',
    colIndex: 4,
    rowIndex: 2,
  },
  {
    id: 'scientific_foundation',
    name: '国家科研奠基',
    subtitle: '基础科研与学术',
    category: 'economy',
    branchName: '经济发展',
    tier: 2,
    iconType: 'flask_circuit',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['economic_development'],
    effects: [
      { text: '科研槽位研发速度: +12.00%', type: 'special', value: '+12.00%' },
      { text: '工业科技时间减免: -10.00%', type: 'economy', value: '-10.00%' },
    ],
    description:
      '成立国家最高科学研究基金会，资助大学与国家实验室，培育顶尖科学家团队，攻克核心物理与工程难题。',
    colIndex: 5,
    rowIndex: 2,
  },

  // 3. 军事分支 (Military)
  {
    id: 'army_expansion',
    name: '扩充陆军战备',
    subtitle: '陆军师团与编制',
    category: 'military',
    branchName: '军事现代化',
    tier: 2,
    iconType: 'swords_crest',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['military_modernization'],
    effects: [
      { text: '可用适龄兵源: +2.50%', type: 'military', value: '+2.50%' },
      { text: '陆军步兵装备生产: +15.00%', type: 'military', value: '+15.00%' },
    ],
    description:
      '颁布规范化兵役动员法令，组建标准常备步兵师与野战重炮旅，建立梯次有序的后备动员体系。',
    colIndex: 7,
    rowIndex: 2,
  },
  {
    id: 'naval_construction',
    name: '海军舰队建设',
    subtitle: '远洋海防与舰艇',
    category: 'military',
    branchName: '军事现代化',
    tier: 2,
    iconType: 'warship_anchor',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['military_modernization'],
    effects: [
      { text: '主力舰建造速度: +15.00%', type: 'military', value: '+15.00%' },
      { text: '近海巡逻制海权: +20.00%', type: 'military', value: '+20.00%' },
    ],
    description:
      '扩建国家核心军港与大型干船坞，批量铺设现代战列舰与驱护舰艇龙骨，打造捍卫远海航线与领海主权的远洋舰队。',
    colIndex: 8,
    rowIndex: 2,
  },
  {
    id: 'airforce_development',
    name: '空军战术发展',
    subtitle: '天际制空与航空',
    category: 'military',
    branchName: '军事现代化',
    tier: 2,
    iconType: 'fighter_wings',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['military_modernization'],
    effects: [
      { text: '战斗机生产速度: +15.00%', type: 'military', value: '+15.00%' },
      { text: '空战制空权争夺效率: +10.00%', type: 'military', value: '+10.00%' },
    ],
    description:
      '创立独立空军航空兵司令部，加紧试飞全金属单翼战机，研究空中缠斗编队与俯冲轰炸战术。',
    colIndex: 9,
    rowIndex: 2,
  },

  // 4. 外交分支 (Diplomacy)
  {
    id: 'regional_cooperation',
    name: '区域多边合作',
    subtitle: '地缘互信与自贸',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 2,
    iconType: 'peace_dove',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['diplomatic_strategy'],
    effects: [
      { text: '与邻国贸易意愿: +30.00%', type: 'diplomacy', value: '+30.00%' },
      { text: '受国际制裁风险: -40.00%', type: 'diplomacy', value: '-40.00%' },
    ],
    description:
      '倡导周边睦邻友好条约，降低边境关税壁垒，建立定期地缘安全与经贸常态化磋商机制。',
    colIndex: 10,
    rowIndex: 2,
  },
  {
    id: 'strategic_alliance',
    name: '战略同盟构建',
    subtitle: '集体防卫公约',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 2,
    iconType: 'shield_alliance',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['diplomatic_strategy'],
    effects: [
      { text: '同盟国互保响应度: +50.00%', type: 'diplomacy', value: '+50.00%' },
      { text: '同盟阵营凝聚力: +25.00%', type: 'diplomacy', value: '+25.00%' },
    ],
    description:
      '与志同道合的强国缔结不可撤销的互保防御同盟，实行联合参谋协调，构筑坚不可摧的军事阵营。',
    colIndex: 11,
    rowIndex: 2,
  },
  {
    id: 'global_influence',
    name: '全球大国威望',
    subtitle: '世界秩序发声权',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 2,
    iconType: 'globe_crown',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['diplomatic_strategy'],
    effects: [
      { text: '国际法庭与仲裁权重: +35.00%', type: 'diplomacy', value: '+35.00%' },
      { text: '外交条约签订速度: +20.00%', type: 'diplomacy', value: '+20.00%' },
    ],
    description:
      '在世界各大洲建立常设使馆与文化领事馆，派遣特使调解国际争端，树立负责任的世界级大国威望。',
    colIndex: 12,
    rowIndex: 2,
  },

  // ----------------------------------------------------
  // Level 3: 深度专精国策 (Tier 3 Deep Specialization - 24 Nodes)
  // ----------------------------------------------------
  // Politics Sub-nodes:
  {
    id: 'propaganda_department',
    name: '国家宣传统合',
    subtitle: '舆论与思想引导',
    category: 'politics',
    branchName: '巩固国家',
    tier: 3,
    iconType: 'megaphone_shield',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['centralize_power'],
    effects: [
      { text: '战争支持度: +10.00%', type: 'stability', value: '+10.00%' },
      { text: '政治点数: +1.50/日', type: 'political_power', value: '+1.50/日' },
    ],
    description:
      '统一国家广播电台、报业及出版物指导方针，向全体国民宣传爱国卫国英雄事迹，极大激发民众奉献热情。',
    colIndex: 0,
    rowIndex: 3,
  },
  {
    id: 'secret_police',
    name: '国家安全保卫局',
    subtitle: '情报反谍与治安',
    category: 'politics',
    branchName: '巩固国家',
    tier: 3,
    iconType: 'eye_lock',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['centralize_power'],
    effects: [
      { text: '外国间谍渗透阻截率: +50.00%', type: 'stability', value: '+50.00%' },
      { text: '抵抗组织破坏度: -30.00%', type: 'stability', value: '-30.00%' },
    ],
    description:
      '组建严密的内务防谍网络，监视可疑煽动行为，保护国家核心军工机密免受境外势力渗透破坏。',
    colIndex: 0,
    rowIndex: 4,
  },
  {
    id: 'independent_judiciary',
    name: '独立司法典章',
    subtitle: '司法公正与宪治',
    category: 'politics',
    branchName: '巩固国家',
    tier: 3,
    iconType: 'scales_shield',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['perfect_legal_system'],
    effects: [
      { text: '国家稳定度: +12.00%', type: 'stability', value: '+12.00%' },
      { text: '社会犯罪率: -25.00%', type: 'stability', value: '-25.00%' },
    ],
    description:
      '确立各级法官终身任职与独立审判权，颁发严谨量刑标准，令公民对国家法律正义怀有崇高敬畏与信赖。',
    colIndex: 1,
    rowIndex: 3,
  },
  {
    id: 'anticorruption_commission',
    name: '反腐肃贪委员会',
    subtitle: '财政审计与廉政',
    category: 'politics',
    branchName: '巩固国家',
    tier: 3,
    iconType: 'coin_vault',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['perfect_legal_system'],
    effects: [
      { text: '国家税收留存效率: +15.00%', type: 'economy', value: '+15.00%' },
      { text: '政府采购浪费: -20.00%', type: 'economy', value: '-20.00%' },
    ],
    description:
      '设立直接对国家元首负责的独立廉政公署，对各部委预算与军备采购展开全流程审计，杜绝蛀虫侵蚀国帑。',
    colIndex: 1,
    rowIndex: 4,
  },
  {
    id: 'nationalist_education',
    name: '国家通识教育大纲',
    subtitle: '国民教育与人才',
    category: 'politics',
    branchName: '巩固国家',
    tier: 3,
    iconType: 'torch_book',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['cultural_identity'],
    effects: [
      { text: '科技研发速率: +8.00%', type: 'special', value: '+8.00%' },
      { text: '征兵经验加成: +10.00%', type: 'military', value: '+10.00%' },
    ],
    description:
      '推行全民义务教育与职业技术学校，将近代科学思维与保家卫国观念深植于每一位青少年的心灵之中。',
    colIndex: 2,
    rowIndex: 3,
  },
  {
    id: 'cultural_export',
    name: '全球文化输出',
    subtitle: '软实力与对外辐射',
    category: 'politics',
    branchName: '巩固国家',
    tier: 3,
    iconType: 'crown_laurel',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['cultural_identity'],
    effects: [
      { text: '对外意识形态吸引力: +30.00%', type: 'diplomacy', value: '+30.00%' },
      { text: '外交同盟稳定性: +15.00%', type: 'diplomacy', value: '+15.00%' },
    ],
    description:
      '扶持本国电影、文学、艺术与哲学思潮走向世界舞台，以深厚文明魅力赢得国际社会的广泛赞誉与效仿。',
    colIndex: 2,
    rowIndex: 4,
  },

  // Economy Sub-nodes:
  {
    id: 'national_highway_grid',
    name: '国家干线铁路网络',
    subtitle: '动脉交通工程',
    category: 'economy',
    branchName: '经济发展',
    tier: 3,
    iconType: 'railway_bridge',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['infrastructure_construction'],
    effects: [
      { text: '各省份补给通达上限: +30.00%', type: 'military', value: '+30.00%' },
      { text: '资源运输损耗: -50.00%', type: 'economy', value: '-50.00%' },
    ],
    description:
      '贯通连接东西南北的重轨铁路大干线，确保战时百万重装兵团与军需物资以昼夜千里的速度平稳调度。',
    colIndex: 3,
    rowIndex: 3,
  },
  {
    id: 'electrification_project',
    name: '全国电气化大工程',
    subtitle: '能源与水利电网',
    category: 'economy',
    branchName: '经济发展',
    tier: 3,
    iconType: 'flask_circuit',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['infrastructure_construction'],
    effects: [
      { text: '工业工厂产能: +15.00%', type: 'economy', value: '+15.00%' },
      { text: '城市居民满意度: +10.00%', type: 'stability', value: '+10.00%' },
    ],
    description:
      '在各主要大江大河兴建梯级巨型水电站与火力发电基地，架设高压输电网络，照亮万家灯火与彻夜轰鸣的厂区。',
    colIndex: 3,
    rowIndex: 4,
  },
  {
    id: 'heavy_industry_cluster',
    name: '重工业钢铁联合体',
    subtitle: '冶金与机械基石',
    category: 'economy',
    branchName: '经济发展',
    tier: 3,
    iconType: 'gear_factory',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['industrialization_push'],
    effects: [
      { text: '钢铁与特种铝材产量: +40.00%', type: 'economy', value: '+40.00%' },
      { text: '军工工厂建造花费: -15.00%', type: 'economy', value: '-15.00%' },
    ],
    description:
      '在核心煤铁富集省份打造大型高炉群与连铸连轧车间，为坦克、战舰与巨型建筑提供源源不断的优质特种钢材。',
    colIndex: 4,
    rowIndex: 3,
  },
  {
    id: 'defense_industry',
    name: '战备军工统合体',
    subtitle: '军火装备量产',
    category: 'economy',
    branchName: '经济发展',
    tier: 3,
    iconType: 'factory_shield',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['industrialization_push'],
    effects: [
      { text: '军用工厂生产效率: +20.00%', type: 'military', value: '+20.00%' },
      { text: '军备生产线切换损耗: -30.00%', type: 'military', value: '-30.00%' },
    ],
    description:
      '实行国家战时军工一体化统筹管理，标准化枪炮炮弹与战车零件规格，让兵工厂昼夜不息地吐出致命武备。',
    colIndex: 4,
    rowIndex: 4,
  },
  {
    id: 'electronics_semiconductor',
    name: '无线电与电子工业',
    subtitle: '精密仪表与雷达',
    category: 'economy',
    branchName: '经济发展',
    tier: 3,
    iconType: 'flask_circuit',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['scientific_foundation'],
    effects: [
      { text: '雷达侦测范围: +35.00%', type: 'military', value: '+35.00%' },
      { text: '先进电子科技时间减免: -20.00%', type: 'special', value: '-20.00%' },
    ],
    description:
      '突破高频真空管与早期晶体管核心技术，研发全天候对空警戒雷达与军用加密电台，牢牢掌握电子战主动权。',
    colIndex: 5,
    rowIndex: 3,
  },
  {
    id: 'nuclear_research',
    name: '原子能战略预研',
    subtitle: '前沿核物理工程',
    category: 'economy',
    branchName: '经济发展',
    tier: 3,
    iconType: 'flask_circuit',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['scientific_foundation'],
    effects: [
      { text: '核物理科研速率: +50.00%', type: 'special', value: '+50.00%' },
      { text: '解锁终极战略威慑国策', type: 'special', value: '核裂变时代' },
    ],
    description:
      '秘密召集全国顶级理论物理学家，建立重水与铀浓缩离心试验设施，探索释放微观宇宙终极能量的奥秘。',
    colIndex: 5,
    rowIndex: 4,
  },

  // Military Sub-nodes:
  {
    id: 'mechanized_divisions',
    name: '装甲突击集群学说',
    subtitle: '钢铁洪流与闪击',
    category: 'military',
    branchName: '军事现代化',
    tier: 3,
    iconType: 'swords_crest',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['army_expansion'],
    effects: [
      { text: '装甲部队突破能力: +25.00%', type: 'military', value: '+25.00%' },
      { text: '坦克生产成本: -10.00%', type: 'military', value: '-10.00%' },
    ],
    description:
      '摒弃步兵支援旧思想，组建独立装甲师与机械化掷弹兵军团，以狂风暴雨般的大纵深包抄穿插撕裂敌军防线。',
    colIndex: 7,
    rowIndex: 3,
  },
  {
    id: 'special_operations_corps',
    name: '特种快速反应旅',
    subtitle: '山地空降与突袭',
    category: 'military',
    branchName: '军事现代化',
    tier: 3,
    iconType: 'helmet_target',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['army_expansion'],
    effects: [
      { text: '特种部队编制上限: +4个师', type: 'military', value: '+4个师' },
      { text: '山地/丛林/两栖地形适应: +20.00%', type: 'military', value: '+20.00%' },
    ],
    description:
      '选拔最精锐士兵进行严酷的敌后空降、敌前侦察与山地生存训练，打造在任何极端战场上一锤定音的致命尖刀。',
    colIndex: 7,
    rowIndex: 4,
  },
  {
    id: 'carrier_strike_group',
    name: '航空母舰特混舰队',
    subtitle: '海空一体化霸权',
    category: 'military',
    branchName: '军事现代化',
    tier: 3,
    iconType: 'warship_anchor',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['naval_construction'],
    effects: [
      { text: '航母舰载机出击架次: +25.00%', type: 'military', value: '+25.00%' },
      { text: '超视距海战打击范围: +40.00%', type: 'military', value: '+40.00%' },
    ],
    description:
      '将海军核心从巨炮战列舰彻底转向重型舰队航母，配属防空巡洋舰与反潜护卫舰，将制空打击范围延伸至千海里之外。',
    colIndex: 8,
    rowIndex: 3,
  },
  {
    id: 'submarine_wolfpack',
    name: '远洋潜艇狼群战术',
    subtitle: '无限制破交战',
    category: 'military',
    branchName: '军事现代化',
    tier: 3,
    iconType: 'warship_anchor',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['naval_construction'],
    effects: [
      { text: '潜艇隐蔽性: +30.00%', type: 'military', value: '+30.00%' },
      { text: '击沉敌方运输船效率: +45.00%', type: 'military', value: '+45.00%' },
    ],
    description:
      '部署长航程柴电及通气管潜艇，以分布式无线电引导多艇集中伏击，彻底扼杀敌国依赖海外贸易的生命补给线。',
    colIndex: 8,
    rowIndex: 4,
  },
  {
    id: 'strategic_bombing',
    name: '远程战略轰炸航空兵',
    subtitle: '工业摧毁与纵深',
    category: 'military',
    branchName: '军事现代化',
    tier: 3,
    iconType: 'fighter_wings',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['airforce_development'],
    effects: [
      { text: '战略轰炸对工业破坏: +35.00%', type: 'military', value: '+35.00%' },
      { text: '重型轰炸机航程: +25.00%', type: 'military', value: '+25.00%' },
    ],
    description:
      '研制四发重型高空轰炸机与高爆穿甲航空炸弹，执行跨洲际战略轰炸，将敌国后方军火枢纽与铁路桥梁化为废墟。',
    colIndex: 9,
    rowIndex: 3,
  },
  {
    id: 'close_air_support',
    name: '近距离空中对地支援',
    subtitle: '前线步空协同',
    category: 'military',
    branchName: '军事现代化',
    tier: 3,
    iconType: 'fighter_wings',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['airforce_development'],
    effects: [
      { text: '近距支援机对地面杀伤: +30.00%', type: 'military', value: '+30.00%' },
      { text: '地面部队防空伤亡减免: +15.00%', type: 'military', value: '+15.00%' },
    ],
    description:
      '配备重装甲强击机与前沿空军对空引导员，在地面步兵冲锋前夕以火箭弹与机关炮精准拔除敌军暗堡重机枪阵地。',
    colIndex: 9,
    rowIndex: 4,
  },

  // Diplomacy Sub-nodes:
  {
    id: 'customs_union',
    name: '区域统一关税同盟',
    subtitle: '多边经贸自贸区',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 3,
    iconType: 'cargo_ship',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['regional_cooperation'],
    effects: [
      { text: '对外出口商品收益: +25.00%', type: 'economy', value: '+25.00%' },
      { text: '重要战略资源进口花费: -20.00%', type: 'economy', value: '-20.00%' },
    ],
    description:
      '统一区域内成员国对外海关关税标准，互免过境过路费，形成数十国无缝流通的庞大超级单一市场。',
    colIndex: 10,
    rowIndex: 3,
  },
  {
    id: 'continental_free_trade',
    name: '大陆命运共同体',
    subtitle: '全洲际深度整合',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 3,
    iconType: 'peace_dove',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['regional_cooperation'],
    effects: [
      { text: '跨国工业技术互换: +20.00%', type: 'special', value: '+20.00%' },
      { text: '全同盟成员好感度: +40.00%', type: 'diplomacy', value: '+40.00%' },
    ],
    description:
      '推动全大陆范围内的高等教育互认、能源电网互联与货币清算协议，实现长治久安与共同繁荣。',
    colIndex: 10,
    rowIndex: 4,
  },
  {
    id: 'joint_high_command',
    name: '联合战区最高司令部',
    subtitle: '同盟三军联合作战',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 3,
    iconType: 'shield_alliance',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['strategic_alliance'],
    effects: [
      { text: '同盟联合作战效率: +20.00%', type: 'military', value: '+20.00%' },
      { text: '同盟国战时后勤补给共享: +30.00%', type: 'military', value: '+30.00%' },
    ],
    description:
      '设立多国联合将官参谋团，统一前线无线电加密频道与后勤油弹弹药规格，确保任何来犯之敌面临多国联军迎头痛击。',
    colIndex: 11,
    rowIndex: 3,
  },
  {
    id: 'mutual_security_pact',
    name: '全天候集体安全共同体',
    subtitle: '终极防御公约',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 3,
    iconType: 'shield_alliance',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['strategic_alliance'],
    effects: [
      { text: '若任一盟国遇袭将自动宣战', type: 'diplomacy', value: '集体防御' },
      { text: '敌对阵营威慑度: +50.00%', type: 'diplomacy', value: '+50.00%' },
    ],
    description:
      '确立“攻击一国即等同于攻击全体盟国”的至高集体安全原则，让任何妄图挑起战火的侵略者望而生畏。',
    colIndex: 11,
    rowIndex: 4,
  },
  {
    id: 'global_arbitration',
    name: '国际争端最高仲裁席',
    subtitle: '国际条约仲裁权',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 3,
    iconType: 'quill_scroll',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['global_influence'],
    effects: [
      { text: '迫使他国和平停战成功率: +40.00%', type: 'diplomacy', value: '+40.00%' },
      { text: '国际公信力: +30.00%', type: 'diplomacy', value: '+30.00%' },
    ],
    description:
      '主持起草国际海战与陆战公约，作为最高仲裁方调停各大洲领土争端，执掌维护世界和平之天平。',
    colIndex: 12,
    rowIndex: 3,
  },
  {
    id: 'world_order_architect',
    name: '全球新秩序奠基领袖',
    subtitle: '全球霸权体系',
    category: 'diplomacy',
    branchName: '外交策略',
    tier: 3,
    iconType: 'globe_crown',
    durationDays: 70,
    costPoints: 0,
    prerequisites: ['global_influence'],
    effects: [
      { text: '全球各国威望加成: +50.00%', type: 'diplomacy', value: '+50.00%' },
      { text: '国际阵营领导权稳固度: +100.00%', type: 'diplomacy', value: '+100%' },
    ],
    description:
      '以超绝的国力、崇高的道德威望与钢铁同盟，确立以我为核心的世界政治经济新秩序，名垂人类文明青史。',
    colIndex: 12,
    rowIndex: 4,
  },

  // ----------------------------------------------------
  // Level 4: 终极战略超级工程 (Tier 4 Ultimate Super Projects)
  // ----------------------------------------------------
  {
    id: 'nuclear_deterrence',
    name: '战略核裂变威慑',
    subtitle: '人类终极战略兵器',
    category: 'special',
    branchName: '终极战略工程',
    tier: 4,
    iconType: 'flask_circuit',
    durationDays: 90,
    costPoints: 0,
    prerequisites: ['nuclear_research', 'defense_industry'],
    effects: [
      { text: '战略威慑力: +100.00%', type: 'military', value: '+100.00%' },
      { text: '解锁战略核打击能力', type: 'special', value: '原子纪元' },
      { text: '遭遇全面侵略几率: -90.00%', type: 'stability', value: '-90.00%' },
    ],
    description:
      '成功引爆首枚原子裂变装置，掌握重塑地缘格局的终极战略神剑，彻底杜绝任何强权对我国本土发动全面入侵的企图。',
    colIndex: 5,
    rowIndex: 5,
  },
  {
    id: 'space_exploration_program',
    name: '航天火箭与卫星计划',
    subtitle: '迈向苍穹星辰',
    category: 'special',
    branchName: '终极战略工程',
    tier: 4,
    iconType: 'compass_gold',
    durationDays: 90,
    costPoints: 0,
    prerequisites: ['electronics_semiconductor', 'strategic_bombing'],
    effects: [
      { text: '全球全域视野与情报侦查: +100.00%', type: 'special', value: '卫星过境' },
      { text: '国家科研总速率: +25.00%', type: 'special', value: '+25.00%' },
      { text: '国家威望: +50.00%', type: 'diplomacy', value: '+50.00%' },
    ],
    description:
      '成功发射多级液体燃料运载火箭，将人类首颗人造地球卫星送入近地轨道，开启征服太空与深空的伟大时代。',
    colIndex: 7,
    rowIndex: 5,
  },
  {
    id: 'continental_citadel',
    name: '全域永备要塞防御带',
    subtitle: '钢铁边疆防线',
    category: 'special',
    branchName: '终极战略工程',
    tier: 4,
    iconType: 'shield_star',
    durationDays: 90,
    costPoints: 0,
    prerequisites: ['national_highway_grid', 'joint_high_command'],
    effects: [
      { text: '边境省份防御要塞等级: +3级', type: 'military', value: '+3 Forts' },
      { text: '本土防御部队要塞攻防加成: +35.00%', type: 'military', value: '+35.00%' },
    ],
    description:
      '沿着国家险要山隘与边境线构建数千座重装甲暗堡、地下弹药库与防空炮塔群，铸就寸步难移的铜墙铁壁。',
    colIndex: 9,
    rowIndex: 5,
  },
];

/**
 * 快速根据 ID 检索国策元数据的 Map
 */
export const FOCUS_NODE_MAP = new Map<string, NationalFocusNode>(
  NATIONAL_FOCUS_NODES.map((node) => [node.id, node])
);

/**
 * 依据当前国家数据，计算指定国策的实时状态
 */
export function getFocusStatus(
  focusId: string,
  completedIds: string[] = [],
  activeFocus: ActiveNationalFocus | null = null
): 'completed' | 'in_progress' | 'available' | 'locked' {
  if (completedIds.includes(focusId)) {
    return 'completed';
  }
  if (activeFocus && activeFocus.focusId === focusId) {
    return 'in_progress';
  }

  const node = FOCUS_NODE_MAP.get(focusId);
  if (!node) return 'locked';

  // Tier 0 顶层国策无前置，默认即可制定
  if (node.prerequisites.length === 0) {
    return 'available';
  }

  // 检查所有前置国策是否都已经达成
  const allPrereqsMet = node.prerequisites.every((reqId) =>
    completedIds.includes(reqId)
  );

  if (allPrereqsMet) {
    return 'available';
  }

  return 'locked';
}
