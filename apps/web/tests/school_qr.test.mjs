import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeQr,qrPath} from '../src/lib/school/qrCode.ts';

// An independent reader built from the standard's tables (nothing is shared
// with the encoder): function areas, block layout for level M, GF(256) by
// log tables, Reed-Solomon syndromes, then the byte-mode payload.
const EXP=new Array(512),LOG=new Array(256);
{let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&0x100)x^=0x11d;}for(let i=255;i<512;i++)EXP[i]=EXP[i-255];}
const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
const ALIGN={2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]};
// [blocks, codewords per block, data codewords per block] for level M
const BLOCKS_M={1:[[1,26,16]],2:[[1,44,28]],3:[[1,70,44]],4:[[2,50,32]],5:[[2,67,43]],6:[[4,43,27]],
 7:[[4,49,31]],8:[[2,60,38],[2,61,39]],9:[[3,58,36],[2,59,37]],10:[[4,69,43],[1,70,44]]};
const TOTAL_CODEWORDS={1:26,2:44,3:70,4:100,5:134,6:172,7:196,8:242,9:292,10:346};
const MASK=[(r,c)=>(r+c)%2===0,(r)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,
 (r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r+c)%2+(r*c)%3)%2===0];

function reserved(size,version){
 const f=Array.from({length:size},()=>new Array(size).fill(false));
 const mark=(x0,y0,w,h)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)f[y][x]=true;};
 mark(0,0,9,9);mark(size-8,0,8,9);mark(0,size-8,9,8);
 mark(6,0,1,size);mark(0,6,size,1);
 const pos=ALIGN[version]??[];const last=pos[pos.length-1];
 for(const cy of pos)for(const cx of pos){
  if((cx===6&&cy===6)||(cx===6&&cy===last)||(cx===last&&cy===6))continue;
  mark(cx-2,cy-2,5,5);
 }
 if(version>=7){mark(size-11,0,3,6);mark(0,size-11,6,3);}
 return f;
}
function bch(value,bits,poly,len){let r=value<<len;for(let i=bits+len-1;i>=len;i--)if((r>>>i)&1)r^=poly<<(i-len);return r;}

function read(m){
 const size=m.length,version=(size-17)/4;
 assert.ok(Number.isInteger(version)&&version>=1&&version<=10,'size '+size);
 // finder patterns with light separators
 for(const [ox,oy] of [[0,0],[size-7,0],[0,size-7]]){
  for(let y=-1;y<=7;y++)for(let x=-1;x<=7;x++){
   const X=ox+x,Y=oy+y;if(X<0||Y<0||X>=size||Y>=size)continue;
   const d=Math.max(Math.abs(x-3),Math.abs(y-3));
   assert.equal(m[Y][X],d!==2&&d<=3,`finder at ${X},${Y}`);
  }
 }
 for(let i=8;i<size-8;i++){assert.equal(m[6][i],i%2===0,'timing row');assert.equal(m[i][6],i%2===0,'timing column');}
 assert.equal(m[size-8][8],true,'dark module');
 // format information, both copies
 let a=0,b=0;
 const firstCopy=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
 firstCopy.forEach(([x,y],i)=>{if(m[y][x])a|=1<<i;});
 for(let i=0;i<8;i++)if(m[8][size-1-i])b|=1<<i;
 for(let i=8;i<15;i++)if(m[size-15+i][8])b|=1<<i;
 assert.equal(a,b,'format copies agree');
 const format=a^0x5412,fdata=format>>>10;
 assert.equal(format&0x3ff,bch(fdata,5,0x537,10),'format BCH');
 assert.equal(fdata>>>3,0,'level M');
 const mask=fdata&7;
 if(version>=7){
  let v1=0,v2=0;
  for(let i=0;i<18;i++){if(m[Math.floor(i/3)][size-11+i%3])v1|=1<<i;if(m[size-11+i%3][Math.floor(i/3)])v2|=1<<i;}
  assert.equal(v1,v2,'version copies agree');
  assert.equal(v1>>>12,version);assert.equal(v1&0xfff,bch(version,6,0x1f25,12),'version BCH');
 }
 // data modules in zigzag order, unmasked
 const f=reserved(size,version);
 let free=0;for(const row of f)for(const c of row)if(!c)free++;
 assert.equal(Math.floor(free/8),TOTAL_CODEWORDS[version],'codeword capacity');
 const bits=[];
 let up=true;
 for(let col=size-1;col>0;col-=2){
  if(col===6)col--;
  for(let k=0;k<size;k++){
   const r=up?size-1-k:k;
   for(const c of [col,col-1]){if(!f[r][c])bits.push((m[r][c]?1:0)^(MASK[mask](r,c)?1:0));}
  }
  up=!up;
 }
 const words=[];for(let i=0;i+8<=bits.length&&words.length<TOTAL_CODEWORDS[version];i+=8)words.push(bits.slice(i,i+8).reduce((n,x)=>n*2+x,0));
 // de-interleave
 const blocks=BLOCKS_M[version].flatMap(([n,total,data])=>Array.from({length:n},()=>({total,data,bytes:[]})));
 let k=0;
 const maxData=Math.max(...blocks.map(x=>x.data));
 for(let i=0;i<maxData;i++)for(const blk of blocks)if(i<blk.data)blk.bytes.push(words[k++]);
 const ecc=blocks[0].total-blocks[0].data;
 for(let i=0;i<ecc;i++)for(const blk of blocks)blk.bytes.push(words[k++]);
 assert.equal(k,TOTAL_CODEWORDS[version]);
 for(const blk of blocks){
  for(let j=0;j<ecc;j++){
   let s=0;for(const byte of blk.bytes)s=mul(s,EXP[j])^byte;
   assert.equal(s,0,`syndrome ${j} of a block`);
  }
 }
 const data=blocks.flatMap(blk=>blk.bytes.slice(0,blk.data));
 const stream=data.flatMap(byte=>Array.from({length:8},(_,i)=>(byte>>>(7-i))&1));
 let p=0;const take=n=>{let v=0;for(let i=0;i<n;i++)v=v*2+stream[p++];return v;};
 assert.equal(take(4),0b0100,'byte mode');
 const length=take(version<10?8:16);
 const payload=Array.from({length},()=>take(8));
 return {version,mask,text:new TextDecoder().decode(new Uint8Array(payload))};
}

test('QR invite codes read back exactly: layout, format, error correction and data',()=>{
 const samples=['a','https://ventra.example/school#davet=0d3f5a1c-1b2c-4d5e-8f90-abcdef123456',
  'http://127.0.0.1:3218/school#davet=aaaaaaaa-bbbb-4ccc-8ddd-000000000777','Okul · Çağrı Şükrü İğde ÖĞRETMEN'];
 for(let n=1;n<=213;n+=7)samples.push(Array.from({length:n},(_,i)=>String.fromCharCode(33+(i*37+n)%90)).join(''));
 const versions=new Set(),masks=new Set();
 for(const text of samples){
  const m=encodeQr(text);
  assert.ok(m,'encodes '+text.length+' bytes');
  const out=read(m);
  assert.equal(out.text,text);
  versions.add(out.version);masks.add(out.mask);
 }
 assert.deepEqual([...versions].sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10],'every version is exercised');
 assert.ok(masks.size>=4,'several masks are chosen: '+[...masks]);
});

test('QR: a link of this app fits comfortably; too much text is refused, not cut',()=>{
 const link='https://ventra-okul.example.com/school#davet=0d3f5a1c-1b2c-4d5e-8f90-abcdef123456';
 const m=encodeQr(link);
 assert.ok(m.length<=49,'version 8 or lower for a typical link: '+m.length);
 assert.equal(encodeQr('x'.repeat(213)).length,57);
 assert.equal(encodeQr('x'.repeat(214)),null);
 const path=qrPath(encodeQr('a'));
 assert.match(path,/^M\d+ \d+h\d+v1h-\d+z/);
});
