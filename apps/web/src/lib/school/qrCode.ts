/**
 * QR Code encoder (ISO/IEC 18004) for class invite links.
 *
 * Byte mode, error-correction level M (about 15 % of the symbol can be
 * covered or blurred), versions 1-10: up to 213 bytes, plenty for a link.
 * Written in-house after Project Nayuki's reference design, so the app needs
 * no extra package. tests/school_qr.test.mjs decodes every symbol again with
 * an independent reader (layout, format bits, Reed-Solomon syndromes, data).
 */

export type QrMatrix=boolean[][];

// Level M, indexed by version (index 0 unused).
const ECC_PER_BLOCK=[-1,10,16,26,18,24,16,18,22,22,26];
const BLOCKS=[-1,1,1,1,2,2,4,4,4,5,5];
export const QR_MAX_VERSION=10;
const ECL_M_BITS=0; // format bits for level M are 00

export function rawDataModules(version:number):number{
 let result=(16*version+128)*version+64;
 if(version>=2){
  const align=Math.floor(version/7)+2;
  result-=(25*align-10)*align-55;
  if(version>=7)result-=36;
 }
 return result;
}
export function dataCodewords(version:number):number{
 return Math.floor(rawDataModules(version)/8)-ECC_PER_BLOCK[version]*BLOCKS[version];
}
export function alignmentPositions(version:number):number[]{
 if(version===1)return [];
 const count=Math.floor(version/7)+2;
 const step=Math.floor((version*8+count*3+5)/(count*4-4))*2;
 const result=[6];
 for(let pos=version*4+17-7;result.length<count;pos-=step)result.splice(1,0,pos);
 return result;
}

/** Multiplication in GF(2^8) with the QR polynomial x^8+x^4+x^3+x^2+1. */
export function gfMultiply(x:number,y:number):number{
 let z=0;
 for(let i=7;i>=0;i--){
  z=(z<<1)^((z>>>7)*0x11d);
  z^=((y>>>i)&1)*x;
 }
 return z&0xff;
}
function rsDivisor(degree:number):number[]{
 const result=new Array<number>(degree).fill(0);
 result[degree-1]=1;
 let root=1;
 for(let i=0;i<degree;i++){
  for(let j=0;j<result.length;j++){
   result[j]=gfMultiply(result[j],root);
   if(j+1<result.length)result[j]^=result[j+1];
  }
  root=gfMultiply(root,0x02);
 }
 return result;
}
function rsRemainder(data:readonly number[],divisor:readonly number[]):number[]{
 const result=divisor.map(()=>0);
 for(const byte of data){
  const factor=byte^(result.shift() as number);
  result.push(0);
  divisor.forEach((coef,i)=>{result[i]^=gfMultiply(coef,factor);});
 }
 return result;
}

/** Split into blocks, add error correction, interleave. */
function withErrorCorrection(data:readonly number[],version:number):number[]{
 const blockCount=BLOCKS[version],eccLength=ECC_PER_BLOCK[version];
 const raw=Math.floor(rawDataModules(version)/8);
 const shortBlocks=blockCount-raw%blockCount;
 const shortLength=Math.floor(raw/blockCount);
 const divisor=rsDivisor(eccLength);
 const blocks:number[][]=[];
 for(let i=0,k=0;i<blockCount;i++){
  const block=data.slice(k,k+shortLength-eccLength+(i<shortBlocks?0:1));
  k+=block.length;
  const ecc=rsRemainder(block,divisor);
  if(i<shortBlocks)block.push(0);
  blocks.push(block.concat(ecc));
 }
 const result:number[]=[];
 for(let i=0;i<blocks[0].length;i++){
  blocks.forEach((block,j)=>{if(i!==shortLength-eccLength||j>=shortBlocks)result.push(block[i]);});
 }
 return result;
}

const MASKS:((x:number,y:number)=>boolean)[]=[
 (x,y)=>(x+y)%2===0,
 (_x,y)=>y%2===0,
 (x)=>x%3===0,
 (x,y)=>(x+y)%3===0,
 (x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,
 (x,y)=>x*y%2+x*y%3===0,
 (x,y)=>(x*y%2+x*y%3)%2===0,
 (x,y)=>((x+y)%2+x*y%3)%2===0
];

/** Penalty rules N1-N4 of the standard, used to pick the clearest mask. */
function penalty(m:QrMatrix):number{
 const size=m.length;
 let score=0;
 const line=(get:(i:number)=>boolean)=>{
  let run=1;
  for(let i=1;i<size;i++){
   if(get(i)===get(i-1))run++;
   else{if(run>=5)score+=run-2;run=1;}
  }
  if(run>=5)score+=run-2;
  const pattern=[true,false,true,true,true,false,true];
  for(let i=0;i+7<=size;i++){
   if(!pattern.every((dark,k)=>get(i+k)===dark))continue;
   const lightBefore=[1,2,3,4].every(k=>i-k<0||!get(i-k));
   const lightAfter=[0,1,2,3].every(k=>i+7+k>=size||!get(i+7+k));
   if(lightBefore||lightAfter)score+=40;
  }
 };
 for(let y=0;y<size;y++)line(x=>m[y][x]);
 for(let x=0;x<size;x++)line(y=>m[y][x]);
 for(let y=0;y+1<size;y++)for(let x=0;x+1<size;x++){
  const c=m[y][x];
  if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])score+=3;
 }
 let dark=0;
 for(const row of m)for(const cell of row)if(cell)dark++;
 score+=10*Math.floor(Math.abs(100*dark/(size*size)-50)/5);
 return score;
}

/** The QR symbol for `text`, or null when it does not fit version 10-M. */
export function encodeQr(text:string):QrMatrix|null{
 const bytes=[...new TextEncoder().encode(text)];
 let version=1;
 while(version<=QR_MAX_VERSION&&4+(version<10?8:16)+8*bytes.length>8*dataCodewords(version))version++;
 if(version>QR_MAX_VERSION)return null;

 const capacity=8*dataCodewords(version);
 const bits:number[]=[];
 const put=(value:number,length:number)=>{for(let i=length-1;i>=0;i--)bits.push((value>>>i)&1);};
 put(0b0100,4);
 put(bytes.length,version<10?8:16);
 for(const byte of bytes)put(byte,8);
 put(0,Math.min(4,capacity-bits.length));
 put(0,(8-bits.length%8)%8);
 for(let pad=0xec;bits.length<capacity;pad^=0xec^0x11)put(pad,8);
 const data:number[]=[];
 for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((n,b)=>(n<<1)|b,0));
 const codewords=withErrorCorrection(data,version);

 const size=version*4+17;
 const modules:QrMatrix=Array.from({length:size},()=>new Array<boolean>(size).fill(false));
 const fixed:QrMatrix=Array.from({length:size},()=>new Array<boolean>(size).fill(false));
 const set=(x:number,y:number,dark:boolean)=>{modules[y][x]=dark;fixed[y][x]=true;};

 for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
 const finder=(cx:number,cy:number)=>{
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const x=cx+dx,y=cy+dy;
   if(x<0||y<0||x>=size||y>=size)continue;
   const d=Math.max(Math.abs(dx),Math.abs(dy));
   set(x,y,d!==2&&d!==4);
  }
 };
 finder(3,3);finder(size-4,3);finder(3,size-4);
 const align=alignmentPositions(version);
 const last=align.length-1;
 for(let i=0;i<=last;i++)for(let j=0;j<=last;j++){
  if((i===0&&j===0)||(i===0&&j===last)||(i===last&&j===0))continue;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)
   set(align[i]+dx,align[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 }
 const drawFormat=(mask:number)=>{
  const value=(ECL_M_BITS<<3)|mask;
  let rem=value;
  for(let i=0;i<10;i++)rem=(rem<<1)^((rem>>>9)*0x537);
  const word=((value<<10)|rem)^0x5412;
  const bit=(i:number)=>((word>>>i)&1)!==0;
  for(let i=0;i<=5;i++)set(8,i,bit(i));
  set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));
  for(let i=9;i<15;i++)set(14-i,8,bit(i));
  for(let i=0;i<8;i++)set(size-1-i,8,bit(i));
  for(let i=8;i<15;i++)set(8,size-15+i,bit(i));
  set(8,size-8,true);
 };
 drawFormat(0);
 if(version>=7){
  let rem=version;
  for(let i=0;i<12;i++)rem=(rem<<1)^((rem>>>11)*0x1f25);
  const word=(version<<12)|rem;
  for(let i=0;i<18;i++){
   const dark=((word>>>i)&1)!==0;
   const a=size-11+i%3,b=Math.floor(i/3);
   set(a,b,dark);set(b,a,dark);
  }
 }

 let i=0;
 for(let right=size-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let vert=0;vert<size;vert++){
   for(let j=0;j<2;j++){
    const x=right-j;
    const upward=((right+1)&2)===0;
    const y=upward?size-1-vert:vert;
    if(!fixed[y][x]&&i<codewords.length*8){
     modules[y][x]=((codewords[i>>>3]>>>(7-(i&7)))&1)!==0;
     i++;
    }
   }
  }
 }

 const applyMask=(mask:number)=>{
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)
   if(!fixed[y][x]&&MASKS[mask](x,y))modules[y][x]=!modules[y][x];
 };
 let best=0,bestScore=Infinity;
 for(let mask=0;mask<8;mask++){
  applyMask(mask);drawFormat(mask);
  const score=penalty(modules);
  if(score<bestScore){best=mask;bestScore=score;}
  applyMask(mask);
 }
 applyMask(best);drawFormat(best);
 return modules;
}

/** One SVG path for the dark modules (1 unit per module, no quiet zone). */
export function qrPath(matrix:QrMatrix):string{
 const parts:string[]=[];
 matrix.forEach((row,y)=>{
  let x=0;
  while(x<row.length){
   if(!row[x]){x++;continue;}
   let end=x;
   while(end<row.length&&row[end])end++;
   parts.push(`M${x} ${y}h${end-x}v1h${x-end}z`);
   x=end;
  }
 });
 return parts.join('');
}
