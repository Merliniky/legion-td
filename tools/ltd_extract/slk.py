import re,json,sys
def parse_slk(path):
    rows={};y=0;cols={}
    for line in open(path,encoding='latin-1').read().split('\n'):
        if not line.startswith('C;'):continue
        parts=line.rstrip('\r').split(';');x=None;val=None
        for p in parts[1:]:
            if p.startswith('X'):x=int(p[1:])
            elif p.startswith('Y'):y=int(p[1:])
            elif p.startswith('K'):
                val=line.split(';K',1)[1].rstrip('\r')
                if val.startswith('"')and val.endswith('"'):val=val[1:-1]
                else:
                    try:val=float(val) if '.' in val else int(val)
                    except:pass
        if x is None or val is None:continue
        rows.setdefault(y,{})[x]=val
    hdr=rows.pop(1);out={}
    for y,r in rows.items():
        d={hdr[x]:v for x,v in r.items() if x in hdr}
        k=r.get(1)
        if k is not None:out[k]=d
    return out
def parse_txt(path):
    out={};cur=None
    for line in open(path,encoding='utf-8',errors='replace').read().split('\n'):
        line=line.rstrip('\r')
        m=re.match(r'^\[(.+)\]$',line)
        if m:cur=out.setdefault(m.group(1),{});continue
        if cur is not None and '=' in line:
            k,v=line.split('=',1);cur[k]=v
    return out
if __name__=='__main__':
    for f in sys.argv[1:]:
        t=parse_slk(f) if open(f,'rb').read(2)==b'ID' else parse_txt(f)
        print(f,len(t),list(t.values())[0].keys().__len__(), list(list(t.values())[0].keys())[:12])
