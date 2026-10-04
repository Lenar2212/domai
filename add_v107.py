from pathlib import Path
p=Path('/mnt/data/DomAI_v107_work/frontend/index.html')
s=p.read_text(encoding='utf-8')
css=r'''<style>
.domai107{margin:28px 0;padding:24px;border:1px solid #dbe3ee;border-radius:18px;background:linear-gradient(180deg,#f8fbff,#fff);box-shadow:0 8px 28px rgba(15,23,42,.07)}
.domai107 h2{margin:0 0 8px}.domai107 .muted{color:#64748b}.d107grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.d107card{padding:16px;border:1px solid #dbe3ee;border-radius:14px;background:#fff}.d107card h3{margin:0 0 8px}.d107input{width:100%;box-sizing:border-box;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin:5px 0 10px}.d107btn{border:0;border-radius:10px;padding:11px 15px;cursor:pointer;background:#0f172a;color:#fff;margin:4px}.d107btn.alt{background:#e2e8f0;color:#0f172a}.d107btn.good{background:#166534}.d107status{padding:10px;border-radius:10px;background:#f1f5f9;margin:10px 0;min-height:20px}.d107price{font-size:28px;font-weight:800}.d107tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#e0f2fe;font-size:12px}.d107table{width:100%;border-collapse:collapse;margin-top:10px}.d107table th,.d107table td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}.d107warn{padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-top:14px}.d107success{padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-top:14px}.d107hidden{display:none!important}.d107nav{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
</style>'''
html=r'''
<section id="domai107" class="domai107">
  <h2>DomAI — коммерческий запуск</h2>
  <p class="muted">Регистрация → проект → инженерные сети → предварительный результат → тариф → оплата → получение пакета.</p>
  <div id="d107Auth">
    <div class="d107grid">
      <div class="d107card"><h3>Войти</h3><input class="d107input" id="d107LoginEmail" type="email" placeholder="E-mail"><input class="d107input" id="d107LoginPass" type="password" placeholder="Пароль"><button class="d107btn" onclick="d107Login()">Войти</button></div>
      <div class="d107card"><h3>Создать аккаунт</h3><input class="d107input" id="d107RegEmail" type="email" placeholder="E-mail"><input class="d107input" id="d107RegPass" type="password" placeholder="Пароль, минимум 8 символов"><button class="d107btn good" onclick="d107Register()">Зарегистрироваться</button></div>
    </div>
  </div>
  <div id="d107App" class="d107hidden">
    <div class="d107status" id="d107UserStatus"></div>
    <div class="d107nav"><button class="d107btn alt" onclick="d107Refresh()">Обновить</button><button class="d107btn alt" onclick="d107Logout()">Выйти</button><button class="d107btn" onclick="d107NewProject()">Создать проект</button><button class="d107btn good" onclick="d107Download()">Получить платный пакет</button></div>
    <div class="d107grid">
      <div class="d107card"><h3>Мой проект</h3><input class="d107input" id="d107ProjectName" value="Новый проект DomAI" placeholder="Название проекта"><div id="d107Projects"></div></div>
      <div class="d107card"><h3>Мой тариф</h3><div id="d107Entitlement">—</div><div id="d107Orders"></div></div>
    </div>
    <h3 style="margin-top:22px">Тарифы</h3><div id="d107Plans" class="d107grid"></div>
    <div id="d107Admin" class="d107card d107hidden" style="margin-top:16px"><h3>Панель владельца</h3><div id="d107AdminStats"></div><div id="d107AdminOrders"></div></div>
    <div class="d107warn"><b>Статус продукта:</b> DomAI выдаёт предварительные/концептуальные материалы. Для строительства, газа, электрики, несущих конструкций и официального согласования требуется проверка и выпуск документации квалифицированным специалистом.</div>
  </div>
  <div id="d107Status" class="d107status"></div>
</section>
<script>
(function(){
const $=id=>document.getElementById(id); let tok=localStorage.getItem('domai107_token')||'';
async function req(path,opt={}){opt.headers=Object.assign({'Content-Type':'application/json'},opt.headers||{});if(tok)opt.headers.Authorization='Bearer '+tok;const r=await fetch(path,opt);let x={};try{x=await r.json()}catch(e){}if(!r.ok)throw new Error(x.error||('HTTP '+r.status));return x}
function status(t,ok=false){$('d107Status').className='d107status '+(ok?'d107success':'');$('d107Status').textContent=t}
function setAuth(){ $('d107Auth').classList.toggle('d107hidden',!!tok); $('d107App').classList.toggle('d107hidden',!tok); }
window.d107Login=async()=>{try{const x=await req('/api/login',{method:'POST',body:JSON.stringify({email:$('d107LoginEmail').value,password:$('d107LoginPass').value})});tok=x.token;localStorage.setItem('domai107_token',tok);setAuth();await d107Refresh();status('Вход выполнен.',true)}catch(e){status(e.message)}};
window.d107Register=async()=>{try{const x=await req('/api/register',{method:'POST',body:JSON.stringify({email:$('d107RegEmail').value,password:$('d107RegPass').value})});tok=x.token;localStorage.setItem('domai107_token',tok);setAuth();await d107Refresh();status('Аккаунт создан.',true)}catch(e){status(e.message)}};
window.d107Logout=()=>{tok='';localStorage.removeItem('domai107_token');setAuth();status('Вы вышли из аккаунта.')};
window.d107NewProject=async()=>{try{const name=$('d107ProjectName').value||'Новый проект DomAI';const p={source:'DomAI v107',conceptual:true,house:{width_m:10,depth_m:10,floors:1},site:{width_m:20,depth_m:30},engineering:{systems:['electric','gas','water','sewer','heating']}};const x=await req('/api/projects',{method:'POST',body:JSON.stringify({name,project:p})});status('Проект создан #'+x.id,true);await d107Refresh()}catch(e){status(e.message)}};
window.d107Download=async()=>{try{const r=await fetch('/api/download/project',{headers:{Authorization:'Bearer '+tok}});if(!r.ok){let x={};try{x=await r.json()}catch(e){}throw new Error(x.error||'Нет доступа к платному пакету')}const b=await r.blob();const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='DomAI_project';a.click();status('Пакет проекта подготовлен.',true)}catch(e){status(e.message)}};
async function buy(plan){try{const x=await req('/api/order',{method:'POST',body:JSON.stringify({plan,return_url:location.origin+location.pathname})});if(x.payment_url&&x.payment_url!=='/'){location.href=x.payment_url;return}status(x.message||('Заказ #'+x.order_id+' создан. Статус: '+x.status),x.status==='paid');await d107Refresh()}catch(e){status(e.message)}}
async function renderPlans(){const ps=await req('/api/plans');$('d107Plans').innerHTML=Object.entries(ps).map(([id,p])=>`<div class="d107card"><span class="d107tag">${p.period==='month'?'ежемесячно':'разово'}</span><h3>${p.name}</h3><div class="d107price">${Number(p.price_rub).toLocaleString('ru-RU')} ₽</div><div>${p.projects} проектов</div><button class="d107btn" onclick="d107Buy('${id}')">Выбрать</button></div>`).join('')}
window.d107Buy=buy;
window.d107Refresh=async()=>{try{const me=await req('/api/me');$('d107UserStatus').innerHTML=`Аккаунт: <b>${me.user.email}</b> · ID ${me.user.id}`;const e=me.entitlement||{};$('d107Entitlement').innerHTML=`<b>${e.plan||'free'}</b> · до проектов: ${e.projects||1}`;const ps=await req('/api/projects');$('d107Projects').innerHTML=ps.length?'<table class="d107table"><tr><th>ID</th><th>Название</th><th>Обновлён</th></tr>'+ps.slice(0,10).map(p=>`<tr><td>${p.id}</td><td>${p.name}</td><td>${p.updated_at||''}</td></tr>`).join('')+'</table>':'Проектов пока нет.';const os=await req('/api/orders');$('d107Orders').innerHTML=os.length?'<h4>Заказы</h4><table class="d107table"><tr><th>ID</th><th>Тариф</th><th>Сумма</th><th>Статус</th></tr>'+os.slice(0,10).map(o=>`<tr><td>${o.id}</td><td>${o.plan}</td><td>${o.amount_rub} ₽</td><td>${o.status}</td></tr>`).join('')+'</table>':'';await renderPlans();if(me.user.is_admin){$('d107Admin').classList.remove('d107hidden');const st=await req('/api/admin/stats');$('d107AdminStats').innerHTML=`<p>Пользователей: <b>${st.users||0}</b> · Проектов: <b>${st.projects||0}</b> · Заказов: <b>${st.orders||0}</b></p>`;const ao=await req('/api/admin/orders');$('d107AdminOrders').innerHTML='<table class="d107table"><tr><th>ID</th><th>E-mail</th><th>Тариф</th><th>Сумма</th><th>Статус</th></tr>'+ao.slice(0,20).map(o=>`<tr><td>${o.id}</td><td>${o.email}</td><td>${o.plan}</td><td>${o.amount_rub} ₽</td><td>${o.status}</td></tr>`).join('')+'</table>'}}catch(e){tok='';localStorage.removeItem('domai107_token');setAuth();status('Войдите в аккаунт.')}};
setAuth();if(tok)d107Refresh();
})();
</script>
'''
marker='</body>'
if 'id="domai107"' not in s:
    s=s.replace(marker,css+html+marker)
p.write_text(s,encoding='utf-8')
