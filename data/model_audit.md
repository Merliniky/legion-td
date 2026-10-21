# 模型审核 · Model audit (Legion TD Mega 3.41)

生成：`node tools/gen_audit.mjs`。共 187 个建造兵种 + 11 个召唤物 + 31 波怪。

“旧资源”= models.js 中复用的英雄冲突 HoMM3 精灵（着色）或旧程序化模型；“WC3 模型”= 原图模型文件。严重度：❌ 轮廓/物种完全不对；⚠️ 物种接近但关键特征缺失（坐骑、翅膀、多头、幽灵感等）；✅ 基本相符。

## 重做顺序

1. Mech、Element、Ghost（用户指定优先）
2. Arctic（极地）— 平均不符度 2.00，严重 2/12
3. Elf（精灵）— 平均不符度 1.85，严重 2/13
4. Demi-Human（亚人）— 平均不符度 1.69，严重 1/13
5. Orc（兽人）— 平均不符度 1.54，严重 2/13
6. Shadow（暗影）— 平均不符度 1.43，严重 2/14
7. Marine（海洋）— 平均不符度 1.43，严重 0/14
8. Beast（野兽）— 平均不符度 1.42，严重 1/12
9. Nature（自然）— 平均不符度 1.31，严重 1/13
10. Undead（亡灵）— 平均不符度 1.31，严重 1/13
11. Paladin（圣骑士）— 平均不符度 1.25，严重 0/12
12. Goblin（地精）— 平均不符度 1.15，严重 0/13
13. Hybrid（混血）— 平均不符度 1.00，严重 0/6

| 种族 | 兵种数 | 平均不符度 | 严重 | 已重做 |
|---|---|---|---|---|
| Mech 机械 | 13 | 2.31 | 7 | 13 |
| Beast 野兽 | 12 | 1.42 | 1 | 0 |
| Shadow 暗影 | 14 | 1.43 | 2 | 10 |
| Nature 自然 | 13 | 1.31 | 1 | 0 |
| Element 元素 | 12 | 1.58 | 2 | 12 |
| Ghost 幽魂 | 14 | 1.93 | 1 | 14 |
| Demi-Human 亚人 | 13 | 1.69 | 1 | 13 |
| Hybrid 混血 | 6 | 1.00 | 0 | 0 |
| Marine 海洋 | 14 | 1.43 | 0 | 10 |
| Arctic 极地 | 12 | 2.00 | 2 | 12 |
| Elf 精灵 | 13 | 1.85 | 2 | 13 |
| Goblin 地精 | 13 | 1.15 | 0 | 0 |
| Paladin 圣骑士 | 12 | 1.25 | 0 | 0 |
| Orc 兽人 | 13 | 1.54 | 2 | 13 |
| Undead 亡灵 | 13 | 1.31 | 1 | 0 |

## Mech 机械

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h00M | Peewee 小步兵 | Footman | 精灵 swordsman | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00T | Veteran 老兵 | TheCaptain | 精灵 swordsman | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00O | Infantry 步枪兵 | Rifleman | 精灵 marksman | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00X | Zeus 宙斯 | Marine | 精灵 marksman | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00Y | Pyro 火焰兵 | ChaosSpaceOrc | 精灵 marksman | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00P | Captain 队长 | BloodElfSpellThief | 精灵 crusader | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00Z | Admiral 海军上将 | Knight | 精灵 champion | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00N | Tempest 暴风飞艇 | GoblinZeppelin | 程序化 airship | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（airship） |
| h00U | Leviathan 利维坦 | UndeadAirBarge | 程序化 airship | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（airship） |
| h00Q | Cyborg 半机械人 | GolemStatue | 精灵 stoneGolem | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00W | Krogoth 克罗格斯 | IronGolem | 精灵 stoneGolem | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h00S | Neotank 新型坦克 | WarWagon | 程序化 tank | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（tank） |
| h00V | Doomsday Machine 末日机甲 | WarWagon_V1 | 程序化 tank | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（tank） |

## Element 元素

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h040 | Proton 质子 | Wisp | 程序化 wisp | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（orb） |
| h041 | Adept 精通者 | Vengeance | 程序化 wisp | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h042 | Aqua Spirit 水灵 | WaterElemental | 程序化 water | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h043 | Oceanus 海洋之灵 | SeaElemental | 程序化 water | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h044 | Watcher 守望者 | OwlSCOUT | 精灵 griffin | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h045 | Violet 紫风 | DruidoftheTalon | 精灵 harpy | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h046 | Mudman 泥人 | RockGolem | 精灵 stoneGolem | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h047 | Golem 魔像 | FleshGolem | 精灵 stoneGolem | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h048 | Disciple 门徒 | HumanMage | 精灵 mage | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h049 | Messiah 弥赛亚 | HeroArchMageGhost | 精灵 mage | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h04A | Seer of Darkness 黑暗先知 | NetherDragon | 精灵 blackDragon | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h04B | Fenix 凤凰 | phoenix | 精灵 redDragon | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |

## Ghost 幽魂

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h05N | Specter 幽灵 | Banshee | 精灵 wight | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05O | Wraith 怨灵 | BansheeGhost | 精灵 wight | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05P | Mercurial 复仇之魂 | SpiritOfVengeance | 精灵 wight | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05S | Wanderer 游魂 | Shade | 精灵 vampire | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h062 | Soul of Hero 英雄之魂 | BanditLord | 精灵 champion | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05T | Soul of Villain 恶棍之魂 | Medivh | 精灵 archangel | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05R | Phantom 魅影 | VoidWalker | 精灵 beholder | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05U | Hell Raiser 地狱嚎叫者 | VoidWalker | 精灵 beholder | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05V | Outcast 流放者 | Revenant | 精灵 blackKnight | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05W | Forsaken One 被遗忘者 | RevenantOfTheWaves | 精灵 blackKnight | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h05X | Apparition 幽灵飞龙 | SpiritWyvern | 精灵 wyvern | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h05Y | Gravekeeper 守墓者 | SpiritWyvern | 精灵 wyvern | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h05Z | Dark Priest 黑暗牧师 | Priest | 精灵 monk | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h060 | Meridian 子午之灵 | spiritwalker | 精灵 monk | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |

## Arctic 极地

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h0BC | Tuskarr 海象人 | tuskar | 精灵 orc | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BD | Tuskarr Spearman 海象人投矛手 | tuskarRanged | 精灵 orc | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BE | Frost Wolf 霜狼 | WhiteWolf | 精灵 cerberus | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h0BG | Pandaren 熊猫人 | FurbolgPanda | 精灵 behemoth | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BH | Ice Troll 冰巨魔 | IceTrollShadowPriest | 精灵 troglodyte | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BI | Ice Troll Shaman 冰巨魔萨满 | WitchDoctor | 精灵 troglodyte | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BJ | Polar Bear 北极熊 | PolarBear | 精灵 behemoth | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h0BK | Magnataur 猛犸人 | MagnataurBlue | 精灵 behemoth | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h0BM | Wandigoo 温迪戈 | Wendigo | 精灵 gog | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BL | Ancient Wandigoo 远古温迪戈 | WendigoShaman | 精灵 gog | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BO | Young Frost Dragon 冰霜幼龙 | AzureDragonWelp | 精灵 greenDragon | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h0BP | Azure Dragon 蓝龙 | AzureDragon | 精灵 greenDragon | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（flyer） |

## Elf 精灵

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h08F | Colt 幼角鹰 | Hippogryph | 精灵 griffin | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h08I | Rider 角鹰骑士 | RiddenHippogryph | 精灵 royalGriffin | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h08H | Novice 见习者 | HighElfPeasant | 精灵 woodElf | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h08L | Crusader 十字军 | BloodElfLieutenant | 精灵 crusader | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h08N | Sentry 哨兵 | watcher | 精灵 woodElf | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h08P | Nightsaber 夜刃女猎手 | Huntress | 精灵 woodElf | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h08Q | Prisoner 囚徒 | IllidanEvilCaged | 精灵 blackKnight | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h08S | Maverick 龙鹰浪人 | BloodElfDragonHawk | 精灵 wyvern | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h08V | Druid 德鲁伊 | DruidoftheTalon | 精灵 woodElf | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h08Y | Ascendant 升腾者 | Sorceress_V1 | 精灵 mage | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h08Z | Sword Mage 剑法师 | BloodElfSpellThief | 精灵 zealot | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h090 | Moon Guard 月之守卫 | assassin | 精灵 zealot | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h093 | Warden 守望者典狱长 | herowarden | 精灵 zealot | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |

## Demi-Human 亚人

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h06J | Goblin Scientist 地精科学家 | GoblinSapper | 精灵 goblin | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h078 | Dwarven Engineer 矮人工程师 | MortarTeam | 精灵 dwarf | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06I | Mutant 变异炼金师 | HeroGoblinAlchemist | 精灵 hobgoblin | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06K | Servant 苦工 | Peon | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06L | Slavemaster 奴隶主 | WolfRider | 精灵 wolfRider | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h06M | Tribesman 部落人 | HeadHunter | 精灵 troglodyte | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06N | Alpha Male 头狼猎手 | HeadHunter_V1 | 精灵 troglodyte | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06O | Medicine Man 巫医 | WitchDoctor | 精灵 goblin | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06P | Oracle 先知萨满 | Shaman | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06Q | Harlot 魅魔 | Demoness | 精灵 medusa | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06R | Mistress 魔女 | DemonessBlue | 精灵 medusa | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06S | Minotaur 牛头人 | Tauren | 精灵 minotaur | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h06T | Bigfoot 大脚怪 | Sasquatch | 精灵 minotaur | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |

## Orc 兽人

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h0BF | Orc Warrior 兽人战士 | Grunt | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BS | Blood Orc Warrior 血兽人战士 | ChaosGrunt | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BU | Wolverine 金刚狼 | ChaosOrcRange | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BV | Orc Warlock 兽人术士 | ChaosWarlockGreen | 精灵 goblin | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BW | Blood Orc Warlock 血兽人术士 | ChaosWarlock | 精灵 goblin | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0BX | Raider 狼骑 | WolfRider | 精灵 wolfRider | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h0C0 | Blood Raider 血狼骑 | ChaosWolfRider | 精灵 wolfRider | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h0C4 | Young Witch Doctor 年轻巫医 | OrcWarlockRed | 精灵 hobgoblin | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0C2 | Elder Witch Doctor 长老巫医 | OrcWarlockGuldan | 精灵 hobgoblin | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0C5 | Wyvern 双足飞龙 | RiderlessWyvern | 精灵 wyvern | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h0C8 | Wind rider 风骑士 | WyvernRider | 精灵 wyvern | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h0C9 | Orc Warchief 兽人酋长 | ChaosWarlord | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h0CC | Thrall 萨尔 | Thrall | 精灵 orc | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |

## Shadow 暗影

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h01P | Bone Warrior 骷髅战士 | Skeleton | 精灵 skeleton | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h01Q | Skeletor 骷髅勇士 | SkeletonOrc | 精灵 skeleton | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h01R | Fire Archer 火焰弓箭手 | SkeletonArcher | 精灵 skeleton | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h01S | Dark Mage 骷髅黑法师 | SkeletonMage | 精灵 lich | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h01T | Carrion Spitter 腐尸吐吐虫 | CryptFiend | 程序化 spider | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01U | Nightcrawler 夜行蛛 | NerubianSpiderLord | 程序化 spider | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01V | Gateguard 守门恶魔 | Felgaurd | 精灵 pitFiend | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h01W | Harbinger 先驱者 | FelgaurdBlue | 精灵 pitFiend | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h01X | Overseer 监视者 | ObsidianStatue | 程序化 statue | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01Y | Keeper of Souls 灵魂守护者 | ObsidianStatue | 程序化 statue | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01Z | Nightmare 梦魇 | FacelessOne | 精灵 beholder | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h020 | Doppelganger 幻影分身 | FacelessOne | 精灵 beholder | ❌ 严重不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h021 | Lord of Death 死亡领主 | EredarWarlock | 精灵 efreet | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h022 | Hades 冥王 | DoomGuard | 精灵 devil | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |

## Marine 海洋

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h07J | Hatchling 鱼人幼崽 | MurgulSlave | 精灵 lizardman | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07L | Swamprunner 沼泽奔行者 | MurlocMutant | 精灵 lizardman | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07N | Fangtooth 尖牙鱼人 | MurgulReaver | 精灵 lizardman | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07M | Defiler 毒牙鱼人 | MurgulBloodGill | 精灵 lizardman | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07O | Egg Sack 蛋壳 | EggSack1 | 程序化 egg | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07P | Sky Dragon 飞蛇 | WindSerpent | 精灵 serpentFly | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（flyer） |
| h07Q | Bottom Feeder 鳌虾 | Lobstrokkred | 程序化 crab | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07R | King Claw 蟹王 | Lobstrokkgreen | 程序化 crab | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07S | Mermaid 美人鱼 | NagaSiren | 精灵 naga | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07T | Highborne 上层精灵 | NagaSummoner | 精灵 naga | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07U | Komodo 巨蜥 | SnapDragon | 精灵 basilisk | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（quad） |
| h07V | Trident 三叉戟 | NagaMyrmidon | 精灵 naga | ✅ 基本相符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07W | Sea Giant 海巨人 | SeaGiantGreen | 精灵 giant | ⚠️ 部分不符 | **已重做**：ToonKit 程序化卡通模型（humanoid） |
| h07X | Hydra 九头蛇 | Hydra | 精灵 hydra | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## Beast 野兽

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h010 | Gnoll Warrior 豺狼人战士 | Gnoll | 精灵 gnoll | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h011 | Gnoll Savage 豺狼人野蛮人 | Gnoll | 精灵 gnoll | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h012 | Ogre Basher 食人魔棒槌手 | Ogre | 精灵 ogre | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h013 | Ogre Pulverizer 食人魔粉碎者 | OgreLord | 精灵 ogre | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h014 | Harpy 鹰身人 | Harpy | 精灵 harpy | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h015 | Medusa 美杜莎 | HarpyWitch | 精灵 medusa | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h016 | Troll Fighter 巨魔斗士 | ForestTroll | 精灵 troglodyte | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h017 | Troll Champion 巨魔勇士 | ForestTrollTrapper | 精灵 troglodyte | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h018 | Grizzly 灰熊 | GrizzlyBear | 精灵 behemoth | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h019 | Greymane 灰鬃熊德 | DruidoftheClaw | 精灵 behemoth | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01A | Spawn of Dragon 龙人 | DragonSpawnBlue | 精灵 lizardman | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01B | Dragon Aspect 红龙守护者 | RedDragon | 精灵 redDragon | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## Nature 自然

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h01C | Ent 树人 | Ent | 程序化 tree | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01D | Guardian 守护古树 | AncientProtector | 程序化 ancient | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01E | Ranger 游侠 | Archer | 精灵 woodElf | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01F | Meliai 树精 | Dryad | 精灵 woodElf | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h01H | Sprite 精灵龙 | FaerieDragon | 精灵 serpentFly | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h01G | Thunderbird 雷鸟 | Chimaera | 精灵 griffin | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h01I | Tree of Travel 旅行之树 | AncientOfLore | 程序化 ancient | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01J | Tree of Time 时间之树 | AncientOfWonder | 程序化 ancient | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01K | Halfbreed 混血熊人 | DruidoftheClaw | 精灵 behemoth | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01L | Goliath 山岭巨人 | MountainGiant | 精灵 giant | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01M | Yggdrasil 世界树 | TreeofLife | 程序化 tree | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01N | Tree of Life 生命之树 | TreeofLife | 程序化 tree | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h01O | Tree of Knowledge 智慧之树 | CorruptedTreeofLife | 程序化 tree | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## Undead 亡灵

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h0CF | Acolyte 侍僧 | Acolyte | 精灵 monk | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CH | Revenant 亡魂 | RevenantOfTheWaves | 精灵 wight | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0CI | Ghoul 食尸鬼 | Ghoul | 精灵 walkingDead | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CK | Frenzy Ghoul 狂暴食尸鬼 | Ghoul | 精灵 walkingDead | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CO | Meat Wagon 绞肉车 | MeatWagon | 程序化 wagon | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CP | War Machine 战争机器 | InfernalCannonCannon | 程序化 wagon | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CQ | Necromancer 死灵法师 | Necromancer | 精灵 lich | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CS | Necrolyte 克尔苏加德 | Kelthuzad | 精灵 lich | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CV | Ghost 幽灵巫妖 | KelThuzadGhost | 精灵 lich | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0CW | Zombie 僵尸 | Zombie | 精灵 walkingDead | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0CY | The Butcher 屠夫 | AbominationCIN | 精灵 gog | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0D0 | Guardian of Death 死亡守护者 | PitLord | 精灵 pitFiend | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0D2 | Death Dragon 骨龙 | FrostWyrm | 精灵 boneDragon | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## Paladin 圣骑士

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h09L | Peasant 农民 | Peasant | 精灵 pikeman | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09H | Militia 民兵 | Militia | 精灵 halberdier | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09W | Archer 弓箭手 | HighElfArcher | 精灵 archer | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09M | Elite Archer 神弓 | SylvanusWindrunner | 精灵 marksman | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h09N | Footman 步兵 | Footman | 精灵 swordsman | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09O | Guard 近卫军 | TheCaptain | 精灵 crusader | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09R | Priest 牧师 | Priest_V1 | 精灵 monk | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09S | High Priest 高阶牧师 | HumanMage | 精灵 monk | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h09T | Knight 骑士 | Knight | 精灵 cavalier | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h09U | Cavalier 骑兵统帅 | LordGarithos | 精灵 champion | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0A3 | Dragon Hawk 龙鹰 | WindSerpent | 精灵 serpentFly | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0A0 | Royal Griffin 皇家狮鹫 | GryphonRider | 精灵 royalGriffin | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |

## Goblin 地精

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h0A8 | Small Land Mine 小型地雷 | GoblinLandMine | 程序化 mine | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AT | Medium Land Mine 中型地雷 | GoblinLandMine | 程序化 mine | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AU | Ultra Land Mine 超级地雷 | GoblinLandMine | 程序化 mine | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AB | Machine Turret 机枪塔 | GoblinMobileTurret | 程序化 turret | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AA | Machine Robot 机器人 | GoblinDrillbot3000_A_005 | 程序化 robot | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AE | Geomancer 狗头人地卜师 | KoboldGeomancer | 精灵 gremlin | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0AF | Clockwreck 发条机器人 | HeroTinkerRobot | 程序化 robot | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AH | Flying Machine 飞行器 | Gyrocopter_V1 | 程序化 gyro | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AJ | Helicopter 直升机 | Minicopter | 程序化 copter | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AL | Goblin Alchemist 地精炼金术士 | HeroGoblinAlchemist | 精灵 goblin | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0AO | Goblin Blaster 地精爆破手 | IronGolem | 精灵 stoneGolem | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AR | Steamroller 蒸汽压路机 | GoblinSteamRoller | 程序化 roller | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h0AQ | Assault Tank 突击坦克 | GoblinAssaultTank | 程序化 tank | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## Hybrid 混血

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h07D | Morph [Tier 1] 变形体·一阶 | QuestionMark | 程序化 morph | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07E | Morph [Tier 2] 变形体·二阶 | QuestionMark | 程序化 morph | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07G | Morph [Tier 3] 变形体·三阶 | QuestionMark | 程序化 morph | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07F | Morph [Tier 4] 变形体·四阶 | QuestionMark | 程序化 morph | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07H | Morph [Tier 5] 变形体·五阶 | QuestionMark | 程序化 morph | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07I | Morph [Tier 6] 变形体·六阶 | QuestionMark | 程序化 morph | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## 召唤物 Summons

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| n001 | undefined 恶魔仆从 | felhound | 精灵 hellHound | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| n002 | undefined 狂热者 | FelstalkerPurple | 精灵 hellHound | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| n003 | undefined 地狱火 | Infernal | 精灵 stoneGolem | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| u005 | undefined 恶魔 | Kelthuzad | 精灵 lich | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| n00Q | undefined 狼 | TimberWolf | 精灵 cerberus | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| n00R | undefined 血狼 | Spiritwolf | 精灵 cerberus | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| u011 | undefined 火焰弓箭手 | BurningArcher | 精灵 skeleton | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h07Y | undefined 小九头蛇 | Hydra | 精灵 hydra | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| n004 | undefined 小鬼 | zergling | 精灵 imp | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0AD | undefined 狗头人地卜师 | KoboldGeomancer | 精灵 gremlin | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h0AG | undefined 发条机器人 | HeroTinkerRobot | 程序化 robot | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |

## 波次怪 Wave creeps

| id | 兵种 | WC3 模型 | 旧资源 | 旧资源符合度 | 处理 |
|---|---|---|---|---|---|
| h002 | Crab 螃蟹 | SpiderCrabCreep | 程序化 crab | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h000 | Murloc 鱼人 | MurlocFlesheater_V1 | 精灵 lizardman | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h005 | Scorpion 蝎子 | Archnathid | 精灵 manticore | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h001 | Quilbeast 箭猪 | QuillBeast | 精灵 behemoth | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h00I | Hawk 鹰 | WarEagle | 精灵 griffin | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h003 | Rock Golem 岩石傀儡 | RockGolem | 精灵 stoneGolem | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h004 | Satyr 萨特 | satyrhellcaller | 精灵 gnoll | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h007 | Acolyte 侍僧 | Acolyte | 精灵 monk | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h008 | Zombie 僵尸 | Zombie | 精灵 walkingDead | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| H05I | Draenei Chieftain 德莱尼酋长 | DranaiAkama | 精灵 giant | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h00A | Clockwerk Goblin 发条地精 | HeroTinkerRobot | 程序化 robot | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h00B | Siren 海妖 | NagaSiren | 精灵 naga | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h00C | Couatl 羽蛇 | WindSerpent | 精灵 serpentFly | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h00D | Tuskar Warrior 海象战士 | tuskar | 精灵 orc | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h00E | Centaur 半人马 | Centaur | 精灵 centaur | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h00F | Salamander 火蜥蜴 | ThunderLizardVizier | 精灵 basilisk | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h00G | Flesh Golem 血肉傀儡 | FleshGolem | 精灵 stoneGolem | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h00H | Sludge Flinger 淤泥投掷者 | SludgeMonster | 精灵 gog | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h00J | Giant Spider 巨型蜘蛛 | Spider | 程序化 spider | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| H05J | Dragon Turtle 龙龟 | DragonSeaTurtle | 精灵 basilisk | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h03P | Hippogryph 角鹰兽 | Hippogryph | 精灵 griffin | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h03Q | Mammoth 猛犸 | Mammoth | 精灵 behemoth | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h03R | Wildkin 枭兽 | Owlbear | 精灵 minotaur | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h03T | Revenant 亡魂 | Revenant | 精灵 wight | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h03U | Succubus 魅魔 | Demoness | 精灵 medusa | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h03S | Myrmidon 娜迦战士 | NagaMyrmidon | 精灵 naga | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h03V | Doom Guard 末日守卫 | DoomGuard | 精灵 pitFiend | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| h03W | Juggernaut 主宰 | InfernalCannonCannon | 精灵 stoneGolem | ❌ 严重不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h006 | Frost Wyrm 冰霜巨龙 | FrostWyrm | 精灵 boneDragon | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
| H05K | Magnataur 猛犸人 | Magnataur | 精灵 behemoth | ⚠️ 部分不符 | ToonKit 程序化重做（按 WC3 轮廓/配色） |
| h05L | Legion Lord 军团领主 | Mannoroth | 精灵 devil | ✅ 基本相符 | 保留，后续统一换 ToonKit 时顺带做 |
