// ---------- الاتصال بالسيرفر ----------
async function api(path, options = {}){
  let res;
  try {
    res = await fetch('/api' + path, {
      method: options.method || 'GET',
      headers: {'Content-Type':'application/json'},
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch(e) {
    throw new Error('مفيش اتصال بالسيرفر، تأكد إنه شغال');
  }
  let data = null;
  try { data = await res.json(); } catch(e) {}
  if(!res.ok){
    const err = new Error((data && data.message) || 'حصلت مشكلة، جرب تاني');
    err.errors = (data && data.errors) || {};
    throw err;
  }
  return data;
}

// ---------- البيانات ----------
let items = [];      // بتيجي من /api/menu
let services = [];   // بتيجي من /api/services
const moods = [
  {label:'صحصحني 😴', pick:2, text:'قهوة تركي تظبط دماغك من أول رشفة.'},
  {label:'عاوز أهدى 😌', pick:4, text:'ينسون سخن وقعدة هادية، مفيش أحسن.'},
  {label:'جو حر 🥵', pick:7, text:'كركديه مثلج هيرجعلك روحك.'},
  {label:'عاوز أتدلع 😋', pick:10, text:'أم علي سخنة بالمكسرات، دلع على أصوله.'}
];

let cart = {};          // id -> qty
let currentCat = 'الكل';

// ---------- عناصر الصفحة ----------
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ---------- التنقل بين الصفحات ----------
function showPage(name){
  $$('.page').forEach(p => p.classList.toggle('show', p.id === name));
  $$('nav button').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  $('#nav').classList.remove('open');
  window.scrollTo(0,0);
  history.replaceState(null,'','#'+name);
}
$$('nav button').forEach(b => b.onclick = () => showPage(b.dataset.page));
$$('[data-go]').forEach(b => b.onclick = () => showPage(b.dataset.go));
$('#menuToggle').onclick = () => $('#nav').classList.toggle('open');
if(['home','menu','contact'].includes(location.hash.slice(1))) showPage(location.hash.slice(1));

// ---------- المزاج ----------
moods.forEach((m,i) => {
  const b = document.createElement('button');
  b.className = 'mood'; b.textContent = m.label;
  b.onclick = () => {
    $$('.mood').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const item = items.find(x => x.id === m.pick);
    if(!item){ $('#suggest').innerHTML = '<p>الصنف ده مش متاح دلوقتي، جرب مزاج تاني.</p>'; return; }
    $('#suggest').innerHTML = `<h3>${item.emoji} ${item.name}</h3><p>${m.text}</p><br><button class="btn" id="addMood">ضيفه للطلب</button>`;
    $('#addMood').onclick = () => addToCart(item.id);
  };
  $('#moods').appendChild(b);
});

// ---------- المنيو ----------
function renderChips(){
  const cats = ['الكل', ...new Set(items.map(i => i.cat))];
  $('#chips').innerHTML = '';
  cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip' + (c === currentCat ? ' active' : '');
    b.textContent = c;
    b.onclick = () => { currentCat = c; renderChips(); renderMenu(); };
    $('#chips').appendChild(b);
  });
}
function renderMenu(){
  const list = currentCat === 'الكل' ? items : items.filter(i => i.cat === currentCat);
  $('#menuGrid').innerHTML = list.map(i => `
    <div class="card">
      <div class="emoji">${i.emoji}</div>
      <h3>${i.name}</h3>
      <div class="price">${i.price} ج</div>
      <button onclick="addToCart(${i.id})">أضف للطلب</button>
    </div>`).join('');
}
async function loadMenu(){
  $('#menuGrid').innerHTML = '<p>جاري تحميل المنيو...</p>';
  try {
    items = await api('/menu');
    renderChips(); renderMenu(); updateCart();
  } catch(e) {
    $('#menuGrid').innerHTML = `<p>${e.message}</p>`;
  }
}

// ---------- السلة ----------
function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  updateCart();
  toast('تمت الإضافة ✔');
}
function changeQty(id, d){
  cart[id] += d;
  if(cart[id] <= 0) delete cart[id];
  updateCart();
}
function updateCart(){
  const ids = Object.keys(cart);
  let total = 0, count = 0;
  $('#cartItems').innerHTML = ids.length ? ids.map(id => {
    const it = items.find(x => x.id == id);
    if(!it) return '';
    total += it.price * cart[id]; count += cart[id];
    return `<div class="row"><span>${it.emoji} ${it.name}</span>
      <span class="qty"><button onclick="changeQty(${id},-1)">−</button> ${cart[id]} <button onclick="changeQty(${id},1)">+</button></span>
      <strong>${it.price * cart[id]} ج</strong></div>`;
  }).join('') : '<p>الطلب فاضي، ضيف حاجة من المنيو.</p>';
  $('#total').textContent = total;
  $('#cartCount').textContent = count;
}
function toggleCart(open){
  $('#drawer').classList.toggle('open', open);
  $('#overlay').classList.toggle('show', open);
}
$('#openCart').onclick = () => toggleCart(true);
$('#closeCart').onclick = $('#overlay').onclick = () => toggleCart(false);
$('#checkout').onclick = async () => {
  if(!Object.keys(cart).length) return toast('الطلب فاضي!');
  const name = $('#cName').value.trim();
  const phone = $('#cPhone').value.trim();
  if(name.length < 2){ $('#cName').focus(); return toast('اكتب اسمك الأول'); }
  if(!/^01[0125][0-9]{8}$/.test(phone)){ $('#cPhone').focus(); return toast('رقم الموبايل لازم يبدأ بـ 01 ويكون 11 رقم'); }

  const btn = $('#checkout');
  btn.disabled = true;
  try {
    const r = await api('/orders', {method:'POST', body:{
      name, phone,
      notes: $('#cNotes').value.trim(),
      items: Object.entries(cart).map(([id, qty]) => ({id:+id, qty}))
    }});
    cart = {}; updateCart(); toggleCart(false);
    $('#cNotes').value = '';
    toast(`تم تأكيد طلبك رقم ${r.orderId}، جاري التحضير ☕`);
  } catch(e) {
    toast(e.message);
  } finally {
    btn.disabled = false;
  }
};

// ---------- الفورم ----------
$('#form').onsubmit = async e => {
  e.preventDefault();
  const form = e.target;
  const fields = [
    {el:$('#name'), ok:v => v.trim().length >= 3, msg:'اكتب اسمك (3 حروف على الأقل)'},
    {el:$('#phone'), ok:v => /^01[0125][0-9]{8}$/.test(v.trim()), msg:'رقم الموبايل لازم يبدأ بـ 01 ويكون 11 رقم'},
    {el:$('#msg'), ok:v => v.trim().length >= 5, msg:'اكتب رسالتك (5 حروف على الأقل)'}
  ];
  let valid = true;
  fields.forEach(f => {
    const good = f.ok(f.el.value);
    f.el.classList.toggle('bad', !good);
    f.el.nextElementSibling.textContent = good ? '' : f.msg;
    if(!good) valid = false;
  });
  $('#ok').style.display = 'none';
  if(!valid) return;

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api('/contact', {method:'POST', body:{
      name: $('#name').value, phone: $('#phone').value, message: $('#msg').value
    }});
    $('#ok').style.display = 'block';
    form.reset();
  } catch(err) {
    // أخطاء السيرفر على الخانات (لو فيه)
    const map = {name:$('#name'), phone:$('#phone'), message:$('#msg')};
    let shown = false;
    Object.entries(err.errors || {}).forEach(([k, m]) => {
      if(map[k]){ map[k].classList.add('bad'); map[k].nextElementSibling.textContent = m; shown = true; }
    });
    if(!shown) toast(err.message);
  } finally {
    btn.disabled = false;
  }
};

// ---------- هل مفتوح دلوقتي؟ ----------
const h = new Date().getHours();
const isOpen = h >= 8 || h < 2;
$('#openNow').textContent = isOpen ? '🟢 إحنا فاتحين دلوقتي' : '🔴 مقفول دلوقتي، هنفتح 8 الصبح';

// ---------- Toast ----------
let timer;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ---------- خدماتنا ----------
function renderServices(){
  $('#services').innerHTML = services.map((s,i) => `
    <div class="card">
      <div class="band" style="background:${esc(s.bg)}">${s.icon}</div>
      <h3>${esc(s.title)}</h3>
      ${s.on ? `<button onclick="openService(${i})">التفاصيل</button>` : `<button disabled>غير متوفرة حالياً</button>`}
    </div>`).join('');
}
async function loadServices(){
  try { services = await api('/services'); renderServices(); } catch(e) {}
}
function openService(i){
  const s = services[i];
  $('#svcBox').innerHTML = `
    <div class="big">${s.icon}</div>
    <h2>${esc(s.title)}</h2>
    <ul>${s.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    <button class="btn" onclick="showPage('contact');closeService()">تواصل معانا</button>
    <button class="btn outline" style="color:var(--tile);border-color:var(--tile)" onclick="closeService()">إغلاق</button>`;
  $('#svcModal').classList.add('show');
}
function closeService(){ $('#svcModal').classList.remove('show'); }
$('#svcModal').onclick = e => { if(e.target.id === 'svcModal') closeService(); };
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeService(); });

// ---------- آراء العملاء ----------
let reviews = [];   // بتيجي من /api/reviews (الأحدث الأول)

// منع أي كود HTML في اللي بيكتبه الزائر
function esc(t){
  const d = document.createElement('div');
  d.textContent = t == null ? '' : t;
  return d.innerHTML;
}

function renderReviews(newIndex){
  $('#testimonials').innerHTML = reviews.map((r,i) => `
    <div class="tcard ${i === newIndex ? 'new' : ''}">
      <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p>${esc(r.text)}</p>
      <div class="who">
        <div class="av" style="background:${esc(r.color)}">${esc(r.name[0])}</div>
        <div><strong>${esc(r.name)}</strong><small>${esc(r.job || 'زبون')}</small></div>
      </div>
    </div>`).join('');
  $('#dots').innerHTML = reviews.map(() => '<span></span>').join('');
  updateDots();
}
async function loadReviews(){
  try { reviews = await api('/reviews'); renderReviews(); } catch(e) {}
}

// نقط السلايدر على الموبايل
const track = $('#testimonials');
function updateDots(){
  if(!reviews.length) return;
  const w = track.scrollWidth / reviews.length;
  const i = Math.min(reviews.length - 1, Math.max(0, Math.round(Math.abs(track.scrollLeft) / w)));
  $$('#dots span').forEach((d,k) => d.classList.toggle('on', k === i));
}
track.addEventListener('scroll', updateDots);

// اختيار النجوم
let rating = 5;   // 5 نجوم مختارة من الأول
function renderStarPick(){
  $('#starPick').innerHTML = [1,2,3,4,5].map(n =>
    `<button type="button" class="${n <= rating ? 'on' : ''}" data-n="${n}" role="radio" aria-checked="${n === rating}" aria-label="${n} من 5">★</button>`).join('');
  $$('#starPick button').forEach(b => b.onclick = () => { rating = +b.dataset.n; renderStarPick(); });
}
renderStarPick();

// إرسال الرأي
$('#reviewForm').onsubmit = async e => {
  e.preventDefault();
  const form = e.target;
  const name = $('#rName'), text = $('#rText');
  const nameOk = name.value.trim().length >= 2;
  const textOk = text.value.trim().length >= 3;
  name.classList.toggle('bad', !nameOk);
  name.nextElementSibling.textContent = nameOk ? '' : 'اكتب اسمك (حرفين على الأقل)';
  text.classList.toggle('bad', !textOk);
  text.nextElementSibling.textContent = textOk ? '' : 'اكتب رأيك (3 حروف على الأقل)';
  $('#starErr').textContent = rating ? '' : 'اختار عدد النجوم';
  if(!nameOk){ name.focus(); return; }
  if(!textOk){ text.focus(); return; }
  if(!rating) return;

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const review = await api('/reviews', {method:'POST', body:{
      name: name.value.trim(),
      job: $('#rJob').value.trim(),
      stars: rating,
      text: text.value.trim()
    }});
    reviews.unshift(review);
    renderReviews(0);
    form.reset(); rating = 5; renderStarPick();
    toast('شكراً على رأيك 🤍');
    // نوصّل الزائر للكارت الجديد
    track.scrollTo({left:0});
    track.scrollIntoView({behavior:'smooth', block:'center'});
  } catch(err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
  }
};

// ---------- ظهور الأقسام مع السكرول ----------
const io = new IntersectionObserver(list => {
  list.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
}, {threshold:.15});
$$('.reveal').forEach(el => io.observe(el));

// ---------- تشغيل ----------
updateCart();
loadMenu();
loadServices();
loadReviews();
