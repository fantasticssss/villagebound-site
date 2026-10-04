(function () {
  'use strict';
  const BASE='https://gqaydqnzhoqihbzimify.supabase.co';
  const KEY='sb_publishable_QyWjseNpmoQOsqcFAq5_7w_3t4_b8GK';
  const nativeFetch=window.fetch.bind(window);
  const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8'}});
  const errorResponse=e=>response({error:e?.message||'Не удалось выполнить запрос'},400);
  async function call(path,{method='GET',body,headers={}}={}){
    const r=await nativeFetch(BASE+path,{method,headers:{apikey:KEY,'content-type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
    const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
    if(!r.ok)throw new Error(data?.message||data?.error_description||data?.hint||'Ошибка Supabase');return data;
  }
  async function ideas(url){const data=await call('/rest/v1/rpc/get_public_ideas',{method:'POST',body:{p_category:url.searchParams.get('category')||null,p_sort:url.searchParams.get('sort')||'popular'}});return response({ideas:data||[]})}
  async function addIdea(options){const b=JSON.parse(options.body||'{}');if(b.website)return response({message:'Предложение отправлено на проверку.'});await call('/rest/v1/ideas',{method:'POST',headers:{Prefer:'return=minimal'},body:{nickname:String(b.nickname||'').trim(),category:String(b.category||'').trim(),body:String(b.body||'').trim(),visibility:b.visibility==='private'?'private':'public'}});return response({message:'Предложение отправлено на проверку.'})}
  async function voteIdea(path,options){const b=JSON.parse(options.body||'{}');await call('/rest/v1/rpc/vote_idea',{method:'POST',body:{p_idea:path.split('/')[3],p_voter:b.voterId,p_value:Number(b.value)}});return response({ok:true})}
  async function questions(){const data=await call('/rest/v1/questions?select=id,nickname,question,answer,created_at,answered_at&status=eq.published&order=answered_at.desc.nullslast');return response({questions:data||[]})}
  async function addQuestion(options){const b=JSON.parse(options.body||'{}');if(b.website)return response({message:'Вопрос отправлен разработчику.'});await call('/rest/v1/questions',{method:'POST',headers:{Prefer:'return=minimal'},body:{nickname:String(b.nickname||'').trim(),question:String(b.question||'').trim()}});return response({message:'Вопрос отправлен разработчику.'})}
  async function polls(){const data=await call('/rest/v1/rpc/get_public_polls',{method:'POST',body:{}});return response({polls:data||[]})}
  async function votePoll(path,options){const b=JSON.parse(options.body||'{}');await call('/rest/v1/rpc/vote_poll',{method:'POST',body:{p_poll:path.split('/')[3],p_option:Number(b.optionId),p_voter:b.voterId}});return polls()}
  window.fetch=async function(input,options={}){const url=new URL(typeof input==='string'?input:input.url,location.origin);if(!url.pathname.startsWith('/api/'))return nativeFetch(input,options);try{const method=(options.method||'GET').toUpperCase();if(url.pathname==='/api/ideas'&&method==='GET')return ideas(url);if(url.pathname==='/api/ideas'&&method==='POST')return addIdea(options);if(/^\/api\/ideas\/[^/]+\/vote$/.test(url.pathname)&&method==='POST')return voteIdea(url.pathname,options);if(url.pathname==='/api/questions'&&method==='GET')return questions();if(url.pathname==='/api/questions'&&method==='POST')return addQuestion(options);if(url.pathname==='/api/polls'&&method==='GET')return polls();if(/^\/api\/polls\/[^/]+\/vote$/.test(url.pathname)&&method==='POST')return votePoll(url.pathname,options);return response({error:'Неизвестный запрос'},404)}catch(e){return errorResponse(e)}};
})();
