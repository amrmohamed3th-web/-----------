
// ---------- البيانات ----------
const items = [
  {id:1, name:'شاي بنعناع', cat:'ساخن', price:20, emoji:'🍵'},
  {id:2, name:'قهوة تركي', cat:'ساخن', price:35, emoji:'☕'},
  {id:3, name:'سحلب بالمكسرات', cat:'ساخن', price:45, emoji:'🥛'},
  {id:4, name:'ينسون', cat:'ساخن', price:18, emoji:'🌿'},
  {id:5, name:'عصير ليمون', cat:'بارد', price:30, emoji:'🍋'},
  {id:6, name:'قصب', cat:'بارد', price:25, emoji:'🥤'},
  {id:7, name:'كركديه مثلج', cat:'بارد', price:28, emoji:'🧊'},
  {id:8, name:'بسبوسة', cat:'حلويات', price:40, emoji:'🍰'},
  {id:9, name:'كنافة', cat:'حلويات', price:55, emoji:'🧁'},
  {id:10, name:'أم علي', cat:'حلويات', price:50, emoji:'🍮'}
];
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
$('#checkout').onclick = () => {
  if(!Object.keys(cart).length) return toast('الطلب فاضي!');
  cart = {}; updateCart(); toggleCart(false);
  toast('تم تأكيد طلبك، جاري التحضير ☕');
};

// ---------- الفورم ----------
$('#form').onsubmit = e => {
  e.preventDefault();
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
  $('#ok').style.display = valid ? 'block' : 'none';
  if(valid) e.target.reset();
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
  timer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- خدماتنا ----------
const services = [
  {icon:'🪑', bg:'#cfe4ec', title:'حجز الترابيزات والقعدات', on:true,
    points:['احجز قبلها بيوم على الأقل','قعدات للعائلات والصحاب','ركن هادي للشغل']},
  {icon:'🎉', bg:'#fbe7bb', title:'تجهيز المناسبات والحفلات', on:true,
    points:['مشروبات وحلويات لحد 50 شخص','أسعار خاصة للكميات','تجهيز في نفس اليوم']},
  {icon:'🛵', bg:'#f7d3da', title:'توصيل لحد الباب', on:true,
    points:['التوصيل داخل المحلة الكبرى','مدة التوصيل من 30 لـ 45 دقيقة','دفع عند الاستلام']},
  {icon:'📦', bg:'#dfe3e6', title:'اشتراك القهوة الشهري', on:false, points:[]}
];
function renderServices(){
  $('#services').innerHTML = services.map((s,i) => `
    <div class="card">
      <div class="band" style="background:${s.bg}">${s.icon}</div>
      <h3>${s.title}</h3>
      ${s.on ? `<button onclick="openService(${i})">التفاصيل</button>` : `<button disabled>غير متوفرة حالياً</button>`}
    </div>`).join('');
}
function openService(i){
  const s = services[i];
  $('#svcBox').innerHTML = `
    <div class="big">${s.icon}</div>
    <h2>${s.title}</h2>
    <ul>${s.points.map(p => `<li>${p}</li>`).join('')}</ul>
    <button class="btn" onclick="showPage('contact');closeService()">تواصل معانا</button>
    <button class="btn outline" style="color:var(--tile);border-color:var(--tile)" onclick="closeService()">إغلاق</button>`;
  $('#svcModal').classList.add('show');
}
function closeService(){ $('#svcModal').classList.remove('show'); }
$('#svcModal').onclick = e => { if(e.target.id === 'svcModal') closeService(); };
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeService(); });

// ---------- آراء العملاء ----------
const defaultReviews = [
  {name:'أحمد سمير', job:'مهندس', color:'#1c5d73', stars:5,
    text:'الشاي بالنعناع عندهم حاجة تانية، والقعدة هادية ومناسبة للشغل.'},
  {name:'منى خالد', job:'مدرسة', color:'#d94f6a', stars:5,
    text:'الأم علي والكنافة طازة كل مرة، والخدمة سريعة وبشوشة.'},
  {name:'محمود علي', job:'طالب جامعي', color:'#c98a0c', stars:4,
    text:'مكان حلو للمذاكرة مع الصحاب، والأسعار معقولة جداً.'}
];
const avatarColors = ['#1c5d73','#d94f6a','#c98a0c','#4a7c59','#7b4fa3','#c4552d'];

// الآراء المحفوظة في المتصفح (لو التخزين مش شغال هتفضل لحد ما تقفل الصفحة)
let savedReviews = [];
try { savedReviews = JSON.parse(localStorage.getItem('ahwaReviews')) || []; } catch(e) {}
let reviews = [...savedReviews.slice().reverse(), ...defaultReviews];   // الأحدث الأول

// منع أي كود HTML في اللي بيكتبه الزائر
function esc(t){
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function renderReviews(newIndex){
  $('#testimonials').innerHTML = reviews.map((r,i) => `
    <div class="tcard ${i === newIndex ? 'new' : ''}">
      <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p>${esc(r.text)}</p>
      <div class="who">
        <div class="av" style="background:${r.color}">${esc(r.name[0])}</div>
        <div><strong>${esc(r.name)}</strong><small>${esc(r.job || 'زبون')}</small></div>
      </div>
    </div>`).join('');
  $('#dots').innerHTML = reviews.map(() => '<span></span>').join('');
  updateDots();
}

// نقط السلايدر على الموبايل
const track = $('#testimonials');
function updateDots(){
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
$('#reviewForm').onsubmit = e => {
  e.preventDefault();
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

  const review = {
    name: name.value.trim(),
    job: $('#rJob').value.trim(),
    color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    stars: rating,
    text: text.value.trim()
  };
  savedReviews.push(review);
  reviews.unshift(review);
  try { localStorage.setItem('ahwaReviews', JSON.stringify(savedReviews)); } catch(err) {}

  renderReviews(0);
  e.target.reset(); rating = 5; renderStarPick();
  toast('شكراً على رأيك 🤍');
  // نوصّل الزائر للكارت الجديد
  track.scrollTo({left:0});
  track.scrollIntoView({behavior:'smooth', block:'center'});
};

renderReviews();

// ---------- ظهور الأقسام مع السكرول ----------
const io = new IntersectionObserver(list => {
  list.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
}, {threshold:.15});
$$('.reveal').forEach(el => io.observe(el));

renderServices();
renderChips(); renderMenu(); updateCart();
