import json,re
from slk import *
from zh import *
from abilmap import A,SUMMONS
import extract  # rebuild raw
raw=json.load(open('roster_raw.json'))
B=parse_slk('blocks/b129.bin')
ZA={'poison':'毒/减速','crit':'暴击','bash':'重击','evade':'闪避','aura':'光环','summon':'召唤','bonus':'法力附伤','surge':'能量弹','selfbuff':'自我强化','manashield':'法力护盾','massheal':'群体治疗','deathheal':'死亡治疗','reflect':'反伤','deathburst':'死亡爆炸','castslow':'减速术','armred':'减甲','fan':'刀扇','insanity':'疯狂','haunt':'缠绕','fury':'狂怒','mend':'治疗波','guardian':'守护灵','nova':'震地','sphere':'水之护盾','geyser':'风暴喷泉','flat':'附加伤害','frostnova':'霜冻新星','breath':'冰霜吐息','frostarmor':'霜甲','mirage':'幻象','procbolt':'几率技能','mine':'自爆','rockets':'集束火箭','overclock':'超频','multishot':'多重射击','defend':'防御姿态','heal':'治疗','harden':'硬化皮肤','finisher':'斩杀','procslow':'残废','pulverize':'粉碎','ls':'吸血','entangle':'缠绕根须','net':'投网','deathspawn':'死亡分裂'}
def S(u):
    b=B.get(u,{})
    return {'manaMax':b.get('manaN'),'mana0':b.get('mana0'),'manaRegen':b.get('regenMana'),'hpRegen':b.get('regenHP')}
def clean(l,race,tier,parent=None):
    s=l['stats'];f=l.get('fighter') or l['tower']
    o={'id':l['tower'],'fighter':f,'en':l['name'],'zh':U.get(l['name'],l['name']),'race':race,'tier':tier,'gold':l['gold'],'food':l['food'],
       'hp':s['hp'],'armor':s['armor'],'armorType':s['armorType'],'attackType':s['attackType'],'dmg':[s['dmgMin'],s['dmgMax']],'cd':s['cooldown'],'range':s['range'],'move':s['move'],'fly':s['movetp']=='fly',
       'weapon':s['weapon'],'model':s['model'],'modelScale':s['modelScale']}
    o.update(S(f))
    if s['weapon']=='msplash': o['splash']={k:s.get(k) for k in ('Farea1','Harea1','Qarea1','Hfact1','Qfact1') if s.get(k) is not None}
    if s['weapon']=='mbounce': o['bounce']={'targets':s.get('targCount1'),'range':s.get('Farea1'),'loss':s.get('damageLoss1')}
    o['abilitiesRaw']=[{'id':a['id'],'code':a['code'],'name':a['name'],'tip':a['tip'].split('","')[0]} for a in s['abilities'] if a['name']!='Sell']
    o['fx']=A.get(f,[])
    o['tooltip']=l['tooltip']
    if parent: o['from']=parent
    o['upgrades']=[x['tower'] for x in l['upgrades']]
    out=[o]
    for x in l['upgrades']: out+=clean(x,race,tier,l['tower'])
    return out
R={'version':'Legion TD Mega 3.41','source':raw['source'],'confidence':'high: costs/stats/abilities read directly from the map object data; entries with est=true are interpretations','races':{},'units':{}}
for name,b in raw['builders'].items():
    zr=RACE.get(name,name)
    if name=='Prophet':
        R['races'][name]={'zh':zr,'builder':b['id'],'desc':b['desc'],'pool':b['pool'],'rule':'可建造所有种族的兵种(85个基础兵)；单机版实现：每阶从全种族随机给出1个，可花费金/木重随(Change Tower: 5次, 50/100/150..金木 递增)'};continue
    lines=[]
    for t,l in enumerate(b['lines'],1):
        us=clean(l,name,t);lines.append(l['tower'])
        for u in us: R['units'][u['id']]=u
    R['races'][name]={'zh':zr,'builder':b['id'],'desc':b['desc'],'lines':lines}
R['races']['Hybrid']['rule']='变形体: 建造后在每阶的16个种族基础兵中随机变形为其一(详见tooltip)'
for u in SUMMONS:
    st=extract.stats(u);st['zh']=U.get(st['name'],st['name']);st.update(S(u));st['fx']=A.get(u,[]);R.setdefault('summoned',{})[u]=st
R['waves']=[]
for w in raw['waves']:
    st=w['stats'];R['waves'].append({'wave':w['wave'],'id':w['unit'],'en':w['name'],'zh':WAVE.get(w['name'],w['name']),'count':w['count'],'bounty':w['bounty_each'],'bonusGold':w['waveBonusGold'],'recommendedValue':w['recommendedValue'],
      'hp':st['hp'],'armor':st['armor'],'armorType':st['armorType'],'attackType':st['attackType'],'dmg':[st['dmgMin'],st['dmgMax']],'cd':st['cooldown'],'range':st['range'],'move':st['move'],'fly':st['movetp']=='fly','boss':w['unit'].startswith('H'),'model':st['model'],'modelScale':st['modelScale'],
      'abilities':[a['name'] for a in st['abilities'] if a['name']]})
R['waves'][29]['abilitiesNote']='Magnataur Shockwave: 100 dmg line, cd 20, range 700'
for w,rw in zip(R['waves'],raw['waves']):
    st=rw['stats'];w['fx']=[]
    if st['weapon']=='mbounce': w['bounce']={'targets':st.get('targCount1'),'range':st.get('Farea1'),'loss':st.get('damageLoss1')}
    if st['weapon']=='msplash': w['splash']={k:st.get(k) for k in ('Farea1','Harea1','Qarea1','Hfact1','Qfact1') if st.get(k) is not None}
    for a in st['abilities']:
        if a['name']=='Torrent': w['fx'].append({'k':'bouncenote','name':'Torrent','targets':st.get('targCount1'),'loss':st.get('damageLoss1'),'src':'map+book','note':'Book: 攻击弹射一次（同 Oceanus 的 Deluge），伤害衰减30%（武器 mbounce 数据）'})
        if a['code']=='AOsh': w['fx'].append({'k':'lineshock','name':"Magnataur's Shockwave",'dmg':a['DataA1'],'len':a['DataC1'],'w':a['DataD1'],'cd':a['Cool1'],'rng':a['Rng1'],'src':'map'})
        if a['name']=='Lightning Attack': w['fx'].append({'k':'visual','name':'Lightning Attack','note':'Alit 攻击特效（DataA1=0.25 含义未确认，不计入数值）','est':True})
        if a['name']=='Boss Unit': w['fx'].append({'k':'bossnote','name':'Boss Unit','note':'首领：眩晕时间按30%计算，体型更大不易被推开'})

R['summons']=[]
for grp,lst in raw['summons'].items():
    for s in lst:
        st=s['stats'];R['summons'].append({'id':s['id'],'en':s['name'],'zh':U.get(s['name'],s['name']),'shop':grp,'lumber':s['lumber'],'income':s['income'],'tooltip':s['tooltip'],
          'hp':st['hp'],'armor':st['armor'],'armorType':st['armorType'],'attackType':st['attackType'],'dmg':[st['dmgMin'],st['dmgMax']],'cd':st['cooldown'],'range':st['range'],'move':st['move'],'fly':st['movetp']=='fly','model':st['model'],'modelScale':st['modelScale']})
seen=set();R['summons']=[s for s in R['summons'] if not (s['id'] in seen or seen.add(s['id']))]
k=raw['king'];R['king']={'id':'h00K','hp':k['hp'],'mana':k['mana'],'regen':k['regen'],'armor':k['armor'],'armorType':'hero','attackType':'hero','dmg':[k['dmgMin'],k['dmgMax']],'cd':k['cooldown'],'range':k['range'],
 'upgrades':{'hp':{'lumber':80,'income':3,'max':20,'perLevel':'+(425+25×等级) HP (A05P AIml 负值技巧，Ilif -450/-475/…/-925；具体累计方式为推算)','est':True},
             'attack':{'lumber':80,'income':3,'max':30,'perLevel':'+10 攻击 (A05O AIat 10/20/30…300)'},
             'regen':{'lumber':80,'income':3,'max':20,'perLevel':'+5 HP/秒 (R002 rhpr base 5 mod 5)'}},
 'note':'国王击杀漏怪的赏金平分给本队玩家。另有 R006/R007 (国王护甲/攻速) 由脚本在特定时点+2，触发条件未完全确认'}
R['economy']={'startGold':270,'startLumber':90,'startNote':'JASS: x3模式(默认 -aphgggmmcbx3) 开局270金/90木；非x3模式100金/30木','upgradeCost':'单位所列金币为总价值，升级时支付差价（与Mega Book出兵顺序吻合）','startFood':'Town 7 (h023 fmade)','foodCeiling':200,
 'wisp':{'gold':50,'food':1,'max':7,'harvest':'每次2木（Awha DataA1=2），间隔按《Mega Book》收入数据校准为约3秒/次（第5关25-35收入、第10关110-120收入）','est':True},
 'lumberjack':{'R003':'等级1-8: 金/木 60+20×(n-1)，每级每次采集+1木','R00H':'等级9-15: 200金/200木，每级+1木'},
 'farm':{'gold':24,'lumber':80,'food':8,'levels':10,'note':'农场可连续升级10次，每级+8人口'},
 'income':'每回合结束: 关卡奖励 bonusGold(Yv, 第10/20关×2) + 收入(ox: 购买的召唤兵/国王升级累计 income)；击杀赏金即时获得',
 'prepTime':'第i关前准备时间 = 40 + i/2 秒',
 'sell':'出售返还总价值50%，当回合新建的兵返还100%',
 'leak':'漏怪走向国王；3.41: 漏怪超过150后赏金为0(据3.41更新日志)'}
R['damageTable']=raw['damageTable']
R['waveAttackArmorLists']={'note':'JASS 波次说明字符串中的攻击/护甲类型列表，与SLK一致'}
json.dump(R,open('/workspace/legion-td/data/roster_mega.json','w'),ensure_ascii=False,indent=1)
print(len(R['units']),'units',len(R['summons']),'summons',len(R['waves']),'waves')
for s in R['summons']:
    b=B[s['id']];s['bounty']=(b.get('bountyplus') or 0)+(b.get('bountydice') or 0);s['stockMax']=b.get('stockMax');s['stockRegen']=b.get('stockRegen')
from abilmap import A as AM
SUMFX={'h04S':[{'k':'bash','ch':0.2,'dmg':0,'stun':1,'name':'Maul'}],'h04T':[{'k':'aura','st':'regen','v':3,'r':400,'who':'ally','name':'Healing Aura'}],
 'h04V':[{'k':'aura','st':'dmg','v':0.04,'r':500,'who':'ally','name':'Battle Drums'}],'h04W':[{'k':'aura','st':'arm','v':3,'r':500,'who':'ally','name':'Resilience Aura'}],
 'h04Y':[{'k':'kingx','x':2,'name':'Double damage vs. King'}],'h055':[{'k':'kingx','x':2,'name':'Double damage vs. King'}],
 'h050':[{'k':'aura','st':'ms','v':-0.25,'r':400,'who':'enemy','name':'Frost Aura','est':True}],'h051':[{'k':'poison','ms':0.3,'as':0.15,'dps':0,'dur':3,'name':'Cold Attack','est':True}],
 'h052':[{'k':'armred','v':3,'dur':5,'name':'Corruption','est':True}],'h053':[{'k':'regen','v':10,'name':'Hotblood','est':True}],
 'h056':[{'k':'overclock','as':0.4,'ms':0.4,'dur':10,'cd':15,'name':'Blood Rush','est':True}],'h057':[{'k':'aura','st':'ls','v':0.15,'r':500,'who':'ally','melee':True,'name':'Fresh Meat','est':True}],
 'h059':[{'k':'aura','st':'arm','v':3,'r':500,'who':'ally','name':'Resilience Aura'},{'k':'immune','name':'Spell Immunity'}],
 'h05B':[{'k':'poison','ms':0.3,'as':0,'dps':20,'dur':5,'name':'Kraken Poison','est':True},{'k':'aura','st':'regen','v':10,'r':400,'who':'ally','name':'Healing Aura'},{'k':'immune','name':'Spell Immunity'}],
 'h05A':[{'k':'bash','ch':0.25,'dmg':120,'stun':1,'name':'Bash'},{'k':'aura','st':'burn','v':10,'r':400,'who':'enemy','name':'Immolation'},{'k':'immune','name':'Spell Immunity'}],
 'h0BR':[{'k':'aura','st':'ms','v':0.15,'r':600,'who':'ally','name':'Swiftness Aura'},{'k':'aura','st':'dmg','v':0.10,'r':600,'who':'ally','name':'Command Aura'},{'k':'immune','name':'Spell Immunity'}],
 'h04R':[],'h04Z':[]}

R['king']['abilities']=[
 {'k':'immolation','wave':5,'dps':12,'r':300,'name':'Permanent Immolation','zh':'永久献祭','src':'book'},
 {'k':'shockwave','wave':9,'dmg':90,'w':150,'len':800,'mana':200,'cd':12,'name':'Shockwave','zh':'震荡波','src':'book','est':True},
 {'k':'warstomp','wave':13,'dmg':45,'stun':1.25,'r':300,'mana':250,'cd':10,'name':'War Stomp','zh':'战争践踏','src':'book','est':True},
 {'k':'kaura','wave':17,'st':'dmg','v':0.15,'r':900,'name':'Command Aura','zh':'命令光环','src':'book'},
 {'k':'kaura','wave':21,'st':'arm','v':5,'r':900,'name':'Devotion Aura','zh':'专注光环','src':'book'},
 {'k':'kaura','wave':25,'st':'as','v':0.10,'ms':0.15,'r':900,'name':'Endurance Aura','zh':'耐久光环','src':'book'}]
R['king']['abilityNote']='《Legion TD Mega Book 3.41》: 国王在第5关获得第一个技能，之后随游戏进行获得其余技能；具体解锁关卡未能从地图脚本确认（技能来自法术书A051/A052），此处按每4关解锁一个估计。满级国王约18750HP、364-374攻击、~100回复。'
R['king']['lateGame']={'asPerWave':0.03,'armPerWave':0.2,'from':6,'note':'R006/R007 由脚本随时间提升国王护甲/攻速；Book称后期攻速约0.4，此处按每关+3%攻速、+0.2护甲估计','est':True}
R['modes']={'X3':{'countMul':1,'bountyMul':1,'zh':'X3（原版常用：每关36只螃蟹等）','src':'map JASS + book'},
            'X1':{'countMul':1/3,'bountyMul':3,'zh':'X1（数量1/3，赏金×3 以保持经济，赏金倍率为估计）','est':True}}
R['bookNotes']={'creepHpDiff':'Book 列出的前期怪物HP略高于物体数据（如螃蟹34 vs 30、蝎子63 vs 55），疑为难度/HP修正科技(R004)所致；本作采用地图物体数据。'}
for s in R['summons']: s['fx']=SUMFX.get(s['id'],[])
json.dump(R,open('/workspace/legion-td/data/roster_mega.json','w'),ensure_ascii=False,indent=1)
print('summons patched')
