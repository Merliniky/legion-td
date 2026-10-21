import struct
def parse(path,leveled=True):
    b=open(path,'rb').read();o=0
    def i32():
        nonlocal o;v=struct.unpack_from('<i',b,o)[0];o+=4;return v
    def raw4():
        nonlocal o;v=b[o:o+4].decode('latin1');o+=4;return v
    def cstr():
        nonlocal o;e=b.index(b'\0',o);v=b[o:e].decode('utf8','replace');o=e+1;return v
    ver=i32();out={}
    for tbl in range(2):
        n=i32()
        for _ in range(n):
            orig=raw4();new=raw4();key=new if new!='\0\0\0\0' else orig
            mc=i32();mods=[]
            for _ in range(mc):
                mid=raw4();t=i32()
                lv=dp=0
                if leveled: lv=i32();dp=i32()
                if t==0:v=i32()
                elif t in(1,2):v=round(struct.unpack_from('<f',b,o)[0],4);o+=4
                else:v=cstr()
                i32();mods.append((mid,lv,dp,v))
            out[key]={'orig':orig,'mods':mods}
    return out
if __name__=='__main__':
    import sys
    d=parse('war3map.w3a');print(len(d))
    for k in sys.argv[1:]:
        print(k,d.get(k))
