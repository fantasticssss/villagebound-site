(function () {
  'use strict';

  const SUPABASE_URL = 'https://gqaydqnzhoqihbzimify.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_QyWjseNpmoQOsqcFAq5_7w_3t4_b8GK';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window.villageboundSupabase = db;

  const originalFetch = window.fetch.bind(window);
  const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
  const failure = (error) => json({ error: error?.message || 'Не удалось выполнить запрос' }, 400);

  async function publicIdeas(url) {
    const sort = url.searchParams.get('sort') || 'popular';
    const category = url.searchParams.get('category') || null;
    const { data, error } = await db.rpc('get_public_ideas', {
      p_category: category,
      p_sort: sort
    });
    return error ? failure(error) : json({ ideas: data || [] });
  }

  async function submitIdea(options) {
    const body = JSON.parse(options.body || '{}');
    if (body.website) return json({ message: 'Предложение отправлено на проверку.' });
    const { error } = await db.from('ideas').insert({
      nickname: String(body.nickname || '').trim(),
      category: String(body.category || '').trim(),
      body: String(body.body || '').trim(),
      visibility: body.visibility === 'private' ? 'private' : 'public'
    });
    return error ? failure(error) : json({ message: 'Предложение отправлено на проверку.' });
  }

  async function voteIdea(path, options) {
    const ideaId = path.split('/')[3];
    const body = JSON.parse(options.body || '{}');
    const { error } = await db.rpc('vote_idea', {
      p_idea: ideaId,
      p_voter: body.voterId,
      p_value: Number(body.value)
    });
    return error ? failure(error) : json({ ok: true });
  }

  async function publicQuestions() {
    const { data, error } = await db.from('questions')
      .select('id,nickname,question,answer,created_at,answered_at')
      .eq('status', 'published')
      .order('answered_at', { ascending: false, nullsFirst: false });
    return error ? failure(error) : json({ questions: data || [] });
  }

  async function submitQuestion(options) {
    const body = JSON.parse(options.body || '{}');
    if (body.website) return json({ message: 'Вопрос отправлен разработчику.' });
    const { error } = await db.from('questions').insert({
      nickname: String(body.nickname || '').trim(),
      question: String(body.question || '').trim()
    });
    return error ? failure(error) : json({ message: 'Вопрос отправлен разработчику.' });
  }

  async function publicPolls() {
    const { data, error } = await db.rpc('get_public_polls');
    return error ? failure(error) : json({ polls: data || [] });
  }

  async function votePoll(path, options) {
    const pollId = path.split('/')[3];
    const body = JSON.parse(options.body || '{}');
    const { error } = await db.rpc('vote_poll', {
      p_poll: pollId,
      p_option: Number(body.optionId),
      p_voter: body.voterId
    });
    if (error) return failure(error);
    return publicPolls();
  }

  window.fetch = async function (input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, options);
    try {
      const method = (options.method || 'GET').toUpperCase();
      if (url.pathname === '/api/ideas' && method === 'GET') return publicIdeas(url);
      if (url.pathname === '/api/ideas' && method === 'POST') return submitIdea(options);
      if (/^\/api\/ideas\/[^/]+\/vote$/.test(url.pathname) && method === 'POST') return voteIdea(url.pathname, options);
      if (url.pathname === '/api/questions' && method === 'GET') return publicQuestions();
      if (url.pathname === '/api/questions' && method === 'POST') return submitQuestion(options);
      if (url.pathname === '/api/polls' && method === 'GET') return publicPolls();
      if (/^\/api\/polls\/[^/]+\/vote$/.test(url.pathname) && method === 'POST') return votePoll(url.pathname, options);
      return json({ error: 'Неизвестный запрос' }, 404);
    } catch (error) {
      return failure(error);
    }
  };
})();
