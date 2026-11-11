import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const dataDir=process.env.DATA_DIR||path.join(root,'data');
fs.mkdirSync(dataDir,{recursive:true});
const storeFile=path.join(dataDir,'viral-store.json');
const defaults={settings:{brand:'TheWorldIsCrazzy',handle:'@exclusiveclips28',dailyStories:2,languages:['en','es'],networks:['tiktok','facebook','youtube'],mode:'review',timezone:'America/Bogota',generationEnabled:false,publishingEnabled:false},ideas:[],posts:[],audit:[]};
const read=()=>{try{return JSON.parse(fs.readFileSync(storeFile,'utf8'))}catch{return structuredClone(defaults)}};
const write=s=>{const tmp=storeFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(s,null,2),{mode:0o600});fs.renameSync(tmp,storeFile)};
if(!fs.existsSync(storeFile))write(defaults);
const port=Number(process.env.PORT||3000);
const token=process.env.ADMIN_TOKEN||'';
const json=(res,status,obj)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj))};
const audit=(s,action,id)=>s.audit.push({at:new Date().toISOString(),action,id});
const safeText=(s,max=2000)=>String(s??'').slice(0,max).trim();
const topics=['¿Qué pasaría si la Luna desapareciera durante una noche?','La ciudad que podría existir debajo del océano','¿Cómo se vería la Tierra sin seres humanos?','Una tormenta imposible sobre una megaciudad','El día en que los océanos cambiaron de color','La última ciudad en un planeta congelado'];
function makeIdea(topic){return {id:crypto.randomUUID(),topic:safeText(topic,180),category:'fiction',status:'draft',createdAt:new Date().toISOString(),versions:{en:{title:'What if: '+safeText(topic,140),hook:'Imagine waking up to a world that should not exist.',scenes:['Cinematic establishing shot; clearly fictional simulation','Escalating environmental change with consistent geography','Human-scale reaction without false real-world footage claims','Reveal consequences and end with a thought-provoking question'],narration:'What would happen if this impossible scenario became reality? This is a fictional simulation, not a real event.',disclosure:'AI-generated fictional simulation'},es:{title:safeText(topic,140),hook:'Imagina despertar en un mundo que no debería existir.',scenes:['Plano general cinematográfico; simulación claramente ficticia','Cambio ambiental progresivo con geografía coherente','Reacción a escala humana sin presentarlo como metraje real','Consecuencias y pregunta final'],narration:'¿Qué pasaría si este escenario imposible se volviera realidad? Esta es una simulación ficticia, no un hecho real.',disclosure:'Simulación ficticia generada con IA'}}};}
function auth(req){if(!token)return false;const bearer=req.headers.authorization||'';return bearer.length===7+token.length&&crypto.timingSafeEqual(Buffer.from(bearer),Buffer.from('Bearer '+token))}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/api/health')return json(res,200,{ok:true,service:'kccorp-viral-engine',version:'0.2.0'});
 if(u.pathname==='/'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'"});return fs.createReadStream(path.join(root,'public','index.html')).pipe(res)}
 if(u.pathname==='/app.js'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8'});return fs.createReadStream(path.join(root,'public','app.js')).pipe(res)}
 if(!u.pathname.startsWith('/api/'))return json(res,404,{error:'not_found'});
 if(!auth(req))return json(res,401,{error:'unauthorized',hint:token?'Supply ADMIN_TOKEN as Bearer token':'Configure ADMIN_TOKEN on server before use'});
 let body={};if(req.method==='POST'){try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>15000)throw Error('body_too_large')}body=JSON.parse(raw||'{}')}catch{return json(res,400,{error:'invalid_json_or_too_large'})}}
 const s=read();
 if(u.pathname==='/api/state'&&req.method==='GET')return json(res,200,s);
 if(u.pathname==='/api/ideas'&&req.method==='POST'){
  const topic=safeText(body.topic,180);if(topic.length<10)return json(res,400,{error:'topic_too_short'});
  const idea=makeIdea(topic);s.ideas.unshift(idea);audit(s,'idea_created',idea.id);write(s);return json(res,201,idea);
 }
 if(u.pathname==='/api/plan'&&req.method==='POST'){
  const count=Math.min(2,Math.max(1,Number(body.count)||2));const used=new Set(s.ideas.map(i=>i.topic));const selected=topics.filter(t=>!used.has(t)).slice(0,count);for(const t of selected){const i=makeIdea(t);s.ideas.unshift(i);audit(s,'idea_planned',i.id)}write(s);return json(res,200,{created:selected.length,ideas:s.ideas.slice(0,selected.length)});
 }
 const match=u.pathname.match(/^\/api\/ideas\/([a-f0-9-]+)\/(approve|reject)$/);
 if(match&&req.method==='POST'){
  const idea=s.ideas.find(i=>i.id===match[1]);if(!idea)return json(res,404,{error:'not_found'});
  if(!['draft','approved'].includes(idea.status))return json(res,409,{error:'invalid_transition'});
  idea.status=match[2]==='approve'?'approved':'rejected';idea.reviewedAt=new Date().toISOString();audit(s,'idea_'+idea.status,idea.id);write(s);return json(res,200,idea);
 }
 if(u.pathname==='/api/connections'&&req.method==='GET')return json(res,200,{tiktok:{connected:false,publication:'disabled'},facebook:{connected:false,publication:'disabled'},youtube:{connected:false,publication:'disabled'},note:'OAuth credentials and official platform approval are required. No tokens stored by this MVP.'});
 if(u.pathname==='/api/publish'&&req.method==='POST')return json(res,403,{error:'publication_disabled',message:'Publishing intentionally disabled until OAuth, platform permissions, manual review and explicit enablement are implemented.'});
 if(u.pathname==='/api/generate'&&req.method==='POST')return json(res,403,{error:'generation_disabled',message:'Real generation intentionally disabled until xAI credentials, budget approval, and production worker are configured.'});
 return json(res,404,{error:'not_found'});
});
server.listen(port,'0.0.0.0',()=>console.log(`Viral Engine listening on ${port}`));
