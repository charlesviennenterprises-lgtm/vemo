(function(){
  const stored = localStorage.getItem('vemo_api_base');
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const defaultBase = local ? 'http://localhost:3001' : 'https://api.myvemo.online';
  const API_BASE = (stored || window.VEMO_API_BASE || defaultBase).replace(/\/$/, '');
  const tokenKey = 'vemo_token';

  async function request(path, options={}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
    const token = localStorage.getItem(tokenKey);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${API_BASE}${path}`, {...options, headers, credentials:'include'});
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  }

  async function ensureUser(username='VEMO Creator') {
    const existing = localStorage.getItem(tokenKey);
    if (existing) {
      try { return (await request('/api/auth/me')).user; } catch (_) { localStorage.removeItem(tokenKey); }
    }
    try {
      const auto = await request('/api/auth/auto');
      if (auto.token) localStorage.setItem(tokenKey, auto.token);
      return auto.user;
    } catch (_) {
      const setup = await request('/api/auth/setup', {method:'POST', body:JSON.stringify({username})});
      if (setup.token) localStorage.setItem(tokenKey, setup.token);
      return setup.user;
    }
  }

  async function generate(params) {
    await ensureUser();
    return request('/api/generate', {method:'POST', body:JSON.stringify(params)});
  }

  async function waitForJob(jobId, onUpdate) {
    for (;;) {
      const job = await request(`/api/generate/status/${encodeURIComponent(jobId)}`);
      if (onUpdate) onUpdate(job);
      if (job.status === 'succeeded') return job;
      if (job.status === 'failed') throw new Error(job.error || 'Generation failed');
      await new Promise(r=>setTimeout(r, 2500));
    }
  }

  window.VemoAPI = {
    base: API_BASE,
    ensureUser,
    generate,
    waitForJob,
    publicSongs: (limit=24,offset=0)=>request(`/api/songs/public?limit=${limit}&offset=${offset}`),
    mySongs: async()=>{await ensureUser(); return request('/api/songs');},
    featuredSongs: ()=>request('/api/songs/public/featured'),
    song: id=>request(`/api/songs/${encodeURIComponent(id)}`),
    like: async id=>{await ensureUser(); return request(`/api/songs/${encodeURIComponent(id)}/like`,{method:'POST'});},
    playlists: async()=>{await ensureUser(); return request('/api/playlists');},
    setApiBase: base=>localStorage.setItem('vemo_api_base', String(base||'').replace(/\/$/,'')),
    logout: ()=>{localStorage.removeItem(tokenKey); return request('/api/auth/logout',{method:'POST'}).catch(()=>({success:true}));}
  };
})();
