from slk import *
import re,json
S=parse_txt('blocks/b086.bin');B=parse_slk('blocks/b129.bin');W=parse_slk('blocks/b132.bin');UA=parse_slk('blocks/b128.bin');UI=parse_slk('blocks/b131.bin');UD=parse_slk('blocks/b130.bin')
AS=parse_txt('blocks/b100.bin');AD=parse_slk('blocks/b136.bin');AB=parse_slk('blocks/b134.bin')
J=open('map.j').read()
cl=lambda s:re.sub(r'\|c[0-9a-fA-F]{8}|\|r','',s or '').replace('|n','\n').strip('"').strip()
ARM={'small':'light','medium':'medium','large':'heavy','normal':'fortified','fort':'fortified','none':'unarmored','hero':'hero','divine':'divine'}
# tower -> fighter mapping
pairs={};lines=J.split('\n')
for i,l in enumerate(lines):
    m=re.match(r"set Cv\[xv\]='(\w{4})'",l)
    if m:
        m2=re.match(r"set cv\[xv\]='(\w{4})'",lines[i+1])
        if m2: pairs[m2.group(1)]=m.group(1)
def abil(a):
    s=AS.get(a,{});d=AD.get(a,{})
    o={'id':a,'name':cl(s.get('Name')),'tip':cl(s.get('Ubertip') or s.get('Tip')),'code':d.get('code'),'levels':d.get('levels')}
    for k in ['DataA1','DataB1','DataC1','DataD1','DataE1','Area1','Dur1','HeroDur1','Cool1','Rng1','Cost1','targs1','BuffID1']:
        if d.get(k) not in (None,'_','-',''): o[k]=d[k]
    return o
def stats(u):
    b=B.get(u,{});w=W.get(u,{});ui=UI.get(u,{});ud=UD.get(u,{})
    d1,s1,p1=w.get('dice1') or 0,w.get('sides1') or 0,w.get('dmgplus1') or 0
    o={'id':u,'name':cl(S.get(u,{}).get('Name')),'hp':b.get('HP'),'mana':b.get('manaN'),'regen':b.get('regenHP'),'armor':b.get('def'),'armorType':ARM.get(b.get('defType'),b.get('defType')),
       'move':b.get('spd'),'range':w.get('rangeN1'),'attackType':w.get('atkType1'),'weapon':w.get('weapTp1'),'cooldown':w.get('cool1'),'dmgMin':p1+d1,'dmgMax':p1+d1*s1,
       'targets':w.get('targs1'),'acquire':w.get('acquire'),'model':ui.get('file'),'modelScale':ui.get('modelScale'),'movetp':ud.get('movetp'),'level':b.get('level')}
    if w.get('weapsOn')==0: o['noAttack']=True
    for k in ['Farea1','Harea1','Qarea1','Hfact1','Qfact1','targCount1','damageLoss1']:
        if w.get(k) not in (None,'_','-',''): o[k]=w[k]
    al=UA.get(u,{}).get('abilList')
    o['abilities']=[abil(a) for a in (al or '').split(',') if a and a!='_']
    return o
def tower(t,seen):
    if t in seen: return None
    seen.add(t);s=S.get(t,{});b=B.get(t,{})
    o={'tower':t,'name':cl(s.get('Name')),'gold':b.get('goldcost'),'lumber':b.get('lumbercost'),'food':b.get('fused'),'tooltip':cl(s.get('Ubertip')),
       'fighter':pairs.get(t)}
    if o['fighter']: o['stats']=stats(o['fighter'])
    else: o['stats']=stats(t);o['note']='no fighter mapping; stats from tower object'
    ups=[x for x in (s.get('Upgrade') or '').split(',') if x]
    o['upgrades']=[tower(x,seen) for x in ups]
    o['upgrades']=[x for x in o['upgrades'] if x]
    return o
builders={}
for k,v in S.items():
    if k.startswith('u0') and 'Builds' in v and v['Builds']:
        builders[k]={'id':k,'name':cl(v['Name']),'desc':cl(v.get('Ubertip')),'towers':v['Builds'].split(',')}
out={'source':'Legion TD Mega 3.41 (2011-10-23) war3map, epicwar.com/maps/188026 — extracted from optimized object data (SLK/TXT) and war3map.j','builders':{}}
for k,b in builders.items():
    if b['name'] in ('Prophet','Hybrid'):
        out['builders'][b['name']]={'id':k,'desc':b['desc'],'pool':b['towers'],'special':True};continue
    seen=set();out['builders'][b['name']]={'id':k,'desc':b['desc'],'lines':[tower(t,seen) for t in b['towers']]}
# hybrid towers are its own ids; keep them too
for nm in ('Hybrid',):
    b=[x for x in builders.values() if x['name']==nm][0];seen=set()
    out['builders'][nm]['lines']=[tower(t,seen) for t in b['towers']]
# waves
ids=re.findall(r"set z\[xv\]='(\w{4})'",J)
def lst(name):return [int(x) for x in re.search(r'set %s="([^"]*)"'%name,J).group(1).split(',') if x]
atk={};arm={}
for n,t in [('Lv','pierce'),('mv','normal'),('Mv','magic'),('pv','siege'),('Pv','chaos')]:
    for w in lst(n):atk[w]=t
for n,t in [('Sv','light'),('tv','medium'),('Tv','heavy'),('uv','fortified'),('de','unarmored')]:
    for w in lst(n):arm[w]=t
cnt=[int(x) for x in re.search(r'set Uv=",([^"]*)"',J).group(1).split(',')]
bnt=[int(x) for x in re.search(r'set wv=",([^"]*)"',J).group(1).split(',') if x]
rec={int(re.sub(r'\$([0-9A-F]+)',lambda m:str(int(m.group(1),16)),a)):int(b) for a,b in re.findall(r'set fr\[([$0-9A-F]+)\]="(\d+)"',J)}
yv={}
for a,b in re.findall(r"set Yv\[([$0-9A-F]+)\]=(\S+)",J):
    a=int(a[1:],16) if a.startswith('$') else int(a)
    if b.startswith('$'):v=int(b[1:],16)
    elif b.startswith("'"):v=ord(b[1])
    else:v=int(b)
    yv[a]=v
waves=[]
for i,u in enumerate(ids,1):
    st=stats(u)
    waves.append({'wave':i,'unit':u,'name':st['name'],'count':cnt[i-1] if i-1<len(cnt) else None,'bounty_each':bnt[i-1] if i-1<len(bnt) else None,'attackType_listed':atk.get(i),'armorType_listed':arm.get(i),'recommendedValue':rec.get(i),'waveBonusGold':yv.get(i),'stats':st})
out['waves']=waves
# summons
def summon(u):
    s=S.get(u,{});b=B.get(u,{});st=stats(u);tip=cl(s.get('Ubertip'))
    m=re.search(r'\+(\d+) income',tip)
    return {'id':u,'name':st['name'],'lumber':b.get('lumbercost'),'gold':b.get('goldcost'),'income':int(m.group(1)) if m else None,'tooltip':tip,'stats':st}
out['summons']={'barracks':[summon(u) for u in S['h05C']['Sellunits'].split(',')],'advancedBarracks':[summon(u) for u in S['h0B0']['Sellunits'].split(',')]}
out['king']=stats('h00K');out['kingUpgrades']=[{'id':u,'name':cl(S[u]['Name']),'lumber':B[u].get('lumbercost'),'tooltip':cl(S[u].get('Ubertip'))} for u in ['u008','u009','u00A']]
out['economy']={'wisp':{'gold':B['e003'].get('goldcost'),'max':7,'tooltip':cl(S['e003'].get('Ubertip'))},'farms':[{'id':u,'name':cl(S[u]['Name']),'gold':B[u].get('goldcost'),'lumber':B[u].get('lumbercost'),'foodMade':B[u].get('fmade')} for u in ['h024','h08C','h08D','h09B','h09C','h095','h096','h097','h098','h099']],
  'town':{'gold':B['h023'].get('goldcost'),'foodMade':B['h023'].get('fmade')}}
out['damageTable']={'columns':['light','medium','heavy','fortified','fortified(normal)','hero','divine','unarmored'],
  'magic':[1.10,0.80,1.20,0.70,0.70,1.00,1.00,1.00],'normal':[0.90,1.20,0.90,0.80,0.80,1.00,1.00,1.00],'pierce':[1.30,0.90,0.80,0.70,0.70,1.00,1.00,1.00],'siege':[0.90,0.90,0.90,1.25,1.25,1.00,1.00,1.00],'chaos':[1]*8,'spells':[1]*8,'hero':[1,1,1,1,1,1,0.35,1],
  'armorFormula':'WC3 default: reduction = 0.06*armor/(1+0.06*armor)'}
json.dump(out,open('roster_raw.json','w'),ensure_ascii=False,indent=1)
print('pairs',len(pairs));
for n,b in out['builders'].items():
    def cnt_(l):return 1+sum(cnt_(x) for x in l['upgrades'])
    print(n,len(b.get('lines',[])), sum(cnt_(l) for l in b.get('lines',[])), [ (l['name'],l['gold'],[u['name'] for u in l['upgrades']]) for l in b.get('lines',[])][:6])
