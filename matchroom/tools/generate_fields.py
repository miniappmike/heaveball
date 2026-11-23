"""Generate the field textures in assets/fields (needs numpy and Pillow).

Colors are sampled from the original low-res artwork in tools/field-palettes.
Field markings are not baked in; view.js draws them as vector paths.
"""
import numpy as np,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
from PIL import Image,ImageDraw,ImageFilter
S=40;W,H=50*S,34*S
def px(img,x0,y0,x1,y1):
    a=np.asarray(img.convert('RGB')).astype(float);sx=img.width/50;sy=img.height/34
    r=a[int(y0*sy):int(y1*sy),int(x0*sx):int(x1*sx)].reshape(-1,3);l=r.sum(1)
    lo=r[l<=np.percentile(l,35)].mean(0);hi=r[l>=np.percentile(l,65)].mean(0);return lo,hi
def noise(h,w,blur,seed):
    rng=np.random.default_rng(seed);n=Image.fromarray((rng.random((h,w))*255).astype('uint8')).filter(ImageFilter.GaussianBlur(blur))
    n=np.asarray(n).astype(float);return (n-n.mean())/(n.std()+1e-6)
def build(name,surface):
    o=Image.open(HERE/'field-palettes'/(name+'.jpg'))
    g=px(o,2,2,18,10);rw=px(o,4,13,13,21);c=px(o,21,13,23.5,16);d=px(o,21,2,29,10)
    Y,X=np.mgrid[0:H,0:W]/S
    img=np.zeros((H,W,3))
    stripe=(np.floor(X/2.5)%2)[...,None]
    img[:]=g[0]+(g[1]-g[0])*stripe
    run=(Y>=12)&(Y<22)
    if surface=='park':
        u=(X+Y)/1.8;v=(X-Y)/1.8;chk=((np.floor(u)+np.floor(v))%2)[...,None]
        rv=rw[0]+(rw[1]-rw[0])*chk
    else:
        rv=rw[0]+(rw[1]-rw[0])*stripe*.6+(rw[1]-rw[0])*.2
    img[run]=rv[run]
    cz=run&(X>=20)&(X<30)
    cm=(c[0]+c[1])/2;img[cz]=(cm+(c[1]-c[0])*(stripe-.5)*(0.3 if surface=='park' else .7))[cz]
    dz=(~run)&(X>=20)&(X<30)
    dm=(d[0]+d[1])/2
    grain=noise(H,W,1.2,3)[...,None]
    if surface=='park':
        streak=np.repeat(noise(H,1,0,4)[:, :1],W,1)[...,None]*0
        rows=np.asarray(Image.fromarray(((noise(H//4,W//40,0.6,5)+3)*40).clip(0,255).astype('uint8')).resize((W,H),Image.BICUBIC)).astype(float)
        rows=((rows-rows.mean())/(rows.std()+1e-6))[...,None]
        dv=dm+(d[1]-d[0])*.35*rows
    else:
        k=(g[1]-g[0]).mean()/((g[0]+g[1])/2).mean()  # match the grass stripe contrast
        dv=dm*(1+.75*k*(stripe-.5))
    img[dz]=dv[dz]
    # grass and dirt grain
    fine=noise(H,W,.8,1)[...,None];mid=noise(H,W,6,2)[...,None]
    img+=fine*(4 if surface=='park' else 2.5)+mid*3+grain*((5 if surface=='park' else 1.5)*dz[...,None])
    im=Image.fromarray(img.clip(0,255).astype('uint8'))
    im.save(HERE.parent/'assets'/'fields'/(name+'.webp'),quality=86,method=6)
for n in ['park-red','park-tan','park-brown','turf-red','turf-tan']:build(n,n.split('-')[0])
