const tokenize = (input) => {
  const tokens=[]; let i=0,line=1,col=1;
  while(i<input.length){const c=input[i]; if(/\s/.test(c)){if(c==='\n'){line++;col=1}else col++;i++;continue}
    const start={line,column:col}; if(/[0-9]/.test(c)){let s='';while(i<input.length&&/[0-9.]/.test(input[i])){s+=input[i++];col++}if((s.match(/\./g)||[]).length>1)throw Object.assign(new Error('Malformed numeric literal'),start);tokens.push({type:'number',value:Number(s),...start});continue}
    if(/[A-Za-z_]/.test(c)){let s='';while(i<input.length&&/[A-Za-z0-9_]/.test(input[i])){s+=input[i++];col++}tokens.push({type:'id',value:s,...start});continue}
    if('+-*/()'.includes(c)){tokens.push({type:c,value:c,...start});i++;col++;continue} throw Object.assign(new Error(`Unexpected character “${c}”`),start)
  } tokens.push({type:'eof',value:'',line,column:col});return tokens
};
export function parseExpression(input){const tokens=tokenize(input);let i=0,steps=[];const peek=()=>tokens[i],take=(t)=>{if(peek().type!==t)throw Object.assign(new Error(`Expected ${t}, found ${peek().value||'end of input'}`),peek());const x=tokens[i++];steps.push({action:`Match ${t}${x.value?` “${x.value}”`:''}`,stack:tokens.slice(i).map(z=>z.value||'$').join(' ')});return x};
 const node=(type,children=[],value)=>({type,...(value!==undefined?{value}:{}),children});function factor(){if(peek().type==='number'||peek().type==='id'){const x=tokens[i++];steps.push({action:`Reduce F → ${x.type==='id'?'id':'number'}`,stack:`${x.value}`});return node(x.type==='id'?'Identifier':'Number',[],x.value)}if(peek().type==='('){take('(');const e=expr();take(')');return node('Group',[e])}take('id')}
 function term(){let n=factor();while(['*','/'].includes(peek().type)){const op=tokens[i++],r=factor();steps.push({action:`Reduce T → T ${op.value} F`,stack:`${op.value}`});n=node('BinaryExpression',[n,r],op.value)}return n}function expr(){let n=term();while(['+','-'].includes(peek().type)){const op=tokens[i++],r=term();steps.push({action:`Reduce E → E ${op.value} T`,stack:`${op.value}`});n=node('BinaryExpression',[n,r],op.value)}return n}
 try{const ast=expr();if(peek().type!=='eof')throw Object.assign(new Error(`Unexpected token “${peek().value}”`),peek());steps.push({action:'Accept: input belongs to the grammar',stack:'$'});return{valid:true,ast,steps,tokens:tokens.filter(x=>x.type!=='eof')}}catch(e){steps.push({action:`Reject: ${e.message}`,stack:'error'});return{valid:false,error:{message:e.message,line:e.line||1,column:e.column||1},steps,tokens:tokens.filter(x=>x.type!=='eof')}}
}
export const expressionGrammar=["E → T E′","E′ → + T E′ | - T E′ | ε","T → F T′","T′ → * F T′ | / F T′ | ε","F → ( E ) | id | number"];
