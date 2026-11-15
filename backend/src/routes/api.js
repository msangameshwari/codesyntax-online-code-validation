import {Router} from 'express';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import multer from 'multer';import AdmZip from 'adm-zip';import path from 'node:path';import {auth,admin} from '../middleware/auth.js';import {User,Submission,NetworkLog,ProjectUpload} from '../models/index.js';import {lex} from '../analyzers/lexer.js';import {parseExpression,expressionGrammar} from '../parsers/expression.js';import {getLanguageCatalog} from '../services/validator.js';import validationRouter from './validation.js';
const r=Router();const safe=u=>({id:u._id,name:u.name,email:u.email,role:u.role});
r.post('/auth/register',async(req,res)=>{try{const{name,email,password}=req.body;if(!name||!/^\S+@\S+\.\S+$/.test(email||'')||(password||'').length<8)return res.status(400).json({error:'Enter a name, valid email, and password of at least 8 characters'});if(await User.exists({email:email.toLowerCase()}))return res.status(409).json({error:'Email is already registered'});const user=await User.create({name,email,password:await bcrypt.hash(password,12)});const token=jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'2h'});res.status(201).json({user:safe(user),token})}catch(e){res.status(400).json({error:e.message})}});
r.post('/auth/login',async(req,res)=>{const user=await User.findOne({email:(req.body.email||'').toLowerCase()}).select('+password');if(!user||!user.active||!await bcrypt.compare(req.body.password||'',user.password))return res.status(401).json({error:'Invalid email or password'});res.json({user:safe(user),token:jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'2h'})})});r.get('/auth/profile',auth,(req,res)=>res.json({user:safe(req.user)}));
r.get('/languages',async(q,s)=>s.json(await getLanguageCatalog()));
r.use('/validate',validationRouter);
r.post('/submissions',auth,async(req,res)=>{const d=await Submission.create({...req.body,student:req.user.id});res.status(201).json(d)});r.get('/submissions',auth,async(req,res)=>{const q={...(req.user.role==='admin'?{}:{student:req.user.id})};if(req.query.language)q.language=req.query.language;if(req.query.status)q.status=req.query.status;const docs=await Submission.find(q).sort({createdAt:-1}).limit(100);res.json(docs)});r.get('/submissions/:id',auth,async(req,res)=>{const d=await Submission.findOne({_id:req.params.id,...(req.user.role==='admin'?{}:{student:req.user.id})});return d?res.json(d):res.status(404).json({error:'Submission not found'})});r.delete('/submissions/:id',auth,async(req,res)=>{const d=await Submission.findOneAndDelete({_id:req.params.id,...(req.user.role==='admin'?{}:{student:req.user.id})});return d?res.json({deleted:true}):res.status(404).json({error:'Submission not found'})});
r.post('/lexer/analyze',auth,(req,res)=>res.json({tokens:lex(req.body.source||'')}));r.post('/parser/parse',auth,(req,res)=>res.json({...parseExpression(req.body.expression||''),grammar:expressionGrammar}));r.post('/parser/validate',auth,(req,res)=>{const p=parseExpression(req.body.expression||'');res.json({valid:p.valid,error:p.error,steps:p.steps,grammar:expressionGrammar})});r.post('/ast/generate',auth,(req,res)=>{const p=parseExpression(req.body.expression||'');res.json({supported:true,kind:'Abstract syntax tree',...p})});
r.get('/network/logs',auth,async(req,res)=>res.json(await NetworkLog.find().sort({createdAt:-1}).limit(100)));r.get('/network/status',async(req,res)=>res.json({status:'ok',service:'CodeSyntax API',timestamp:new Date().toISOString(),uptime:process.uptime()}));
r.get('/dashboard/stats',auth,async(req,res)=>{const filter=req.user.role==='admin'?{}:{student:req.user.id};const [total,valid,invalid,languages]=await Promise.all([Submission.countDocuments(filter),Submission.countDocuments({...filter,status:'valid'}),Submission.countDocuments({...filter,status:'invalid'}),Submission.aggregate([{$match:filter},{$group:{_id:'$language',count:{$sum:1}}}])]);res.json({total,valid,invalid,languages})});
r.get('/admin/students',auth,admin,async(req,res)=>res.json(await User.find({role:'student'}).select('name email active createdAt')));r.patch('/admin/students/:id',auth,admin,async(req,res)=>{const u=await User.findByIdAndUpdate(req.params.id,{active:!!req.body.active},{new:true});res.json(safe(u))});r.get('/admin/submissions',auth,admin,async(req,res)=>res.json(await Submission.find().populate('student','name email').sort({createdAt:-1}).limit(200)));r.get('/admin/stats',auth,admin,async(req,res)=>{const [students,total,valid,invalid,languages]=await Promise.all([User.countDocuments({role:'student'}),Submission.countDocuments(),Submission.countDocuments({status:'valid'}),Submission.countDocuments({status:'invalid'}),Submission.aggregate([{$group:{_id:'$language',count:{$sum:1}}}])]);res.json({students,total,valid,invalid,languages})});
const zipUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
const allowedExt=/\.(js|jsx|ts|tsx|json|html|css|py|c|h|cpp|hpp|java|php|cs|go|sql|md|yml|yaml|xml|txt|env\.example)$/i;
const allowedNames=new Set(['dockerfile','.gitignore','.npmrc','.nvmrc','makefile']);
const extensionLanguage={'.js':'JavaScript','.jsx':'JavaScript','.ts':'TypeScript','.tsx':'TypeScript','.html':'HTML','.css':'CSS','.py':'Python','.c':'C','.cpp':'C++','.java':'Java','.php':'PHP','.cs':'C#','.go':'Go','.sql':'SQL','.json':'JSON'};
r.post('/projects/upload',auth,zipUpload.single('file'),async(req,res)=>{
 if(!req.file)return res.status(400).json({error:'Attach one ZIP file'});
 if(!req.file.originalname.toLowerCase().endsWith('.zip'))return res.status(415).json({error:'Only ZIP archives are accepted'});
 try{
  const entries=new AdmZip(req.file.buffer).getEntries();
  if(entries.length>1500)return res.status(413).json({error:'Archive contains too many entries (limit 1500)'});
  let expanded=0;const files=[],dirs=new Set(),exts=new Set(),tree={};
  for(const entry of entries){
   const normalized=path.posix.normalize(entry.entryName.replaceAll('\\','/'));
   if(normalized.startsWith('../')||normalized==='..'||path.posix.isAbsolute(normalized)||/^[a-z]:\//i.test(normalized))return res.status(400).json({error:'Unsafe archive path rejected'});
   if(entry.isDirectory){dirs.add(normalized);continue}
   const size=entry.header.size||0,compressed=entry.header.compressedSize||0;expanded+=size;
   if(expanded>50*1024*1024)return res.status(413).json({error:'Expanded archive exceeds 50 MB'});
   if(size>1024*1024&&compressed===0||compressed>0&&size/compressed>150)return res.status(413).json({error:'Archive compression ratio exceeds safety limit'});
   const segments=normalized.split('/').filter(Boolean);if(!segments.length)continue;
   let cursor=tree;for(let index=0;index<segments.length-1;index++){const part=segments[index];cursor[part]??={};cursor=cursor[part];dirs.add(segments.slice(0,index+1).join('/'))}cursor[segments.at(-1)]=null;
   const ext=path.posix.extname(normalized).toLowerCase(),base=path.posix.basename(normalized).toLowerCase();
   if(ext)exts.add(ext);
   if(!allowedExt.test(normalized)&&!allowedNames.has(base))return res.status(415).json({error:`Unsupported archive file type: ${ext||'(no extension)'}`});
   files.push({path:normalized,size});
  }
  const packageEntry=entries.find(entry=>path.posix.basename(entry.entryName)==='package.json'&&!entry.isDirectory);let packageInfo=null;
  if(packageEntry){try{const j=JSON.parse(packageEntry.getData().toString('utf8'));packageInfo={name:j.name||null,dependencies:Object.keys(j.dependencies||{}),devDependencies:Object.keys(j.devDependencies||{})}}catch{packageInfo={error:'package.json is invalid JSON'}}}
  const hasFrontend=files.some(f=>/\b(src|app|pages)\/(App\.(jsx|tsx)|main\.(jsx|tsx))$/i.test(f.path)||/\bindex\.html$/i.test(f.path));
  const hasBackend=files.some(f=>/\b(server|app|index)\.(js|ts)$/i.test(f.path)&&/(server|backend|api)\//i.test(f.path));
  const report={projectName:path.basename(req.file.originalname,'.zip'),totalFiles:files.length,totalFolders:dirs.size,files,tree,hasFrontend,hasBackend,languages:[...new Set([...exts].map(x=>extensionLanguage[x]).filter(Boolean))],packageInfo,missing:[...(!packageInfo?['package.json']:[]),...(!files.some(f=>/readme/i.test(f.path))?['README']:[])],note:'Files were inspected in memory; no archive contents were extracted or executed.'};
  const saved=await ProjectUpload.create({student:req.user.id,name:report.projectName,report});res.status(201).json({_id:saved.id,...report});
 }catch(e){res.status(400).json({error:`Invalid ZIP archive: ${e.message}`})}
});
r.get('/projects',auth,async(req,res)=>res.json(await ProjectUpload.find({student:req.user.id}).sort({createdAt:-1})));
r.get('/projects/:id/report',auth,async(req,res)=>{const p=await ProjectUpload.findOne({_id:req.params.id,student:req.user.id});p?res.json(p.report):res.status(404).json({error:'Project report not found'})});
r.delete('/projects/:id',auth,async(req,res)=>{await ProjectUpload.deleteOne({_id:req.params.id,student:req.user.id});res.json({deleted:true})});
export default r;
