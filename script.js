// Backend URL
const backendBaseUrl = 'https://webbuy-backend.onrender.com';

let exchangeRate = 3000;
let currentUser = '';
let userCart = {}, paidUsers = {}, allPaidItems = {}, userTracking = {};

// Firebase Auth
const auth = firebase.auth();

// Recaptcha
window.onload = () => {
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size:'invisible' });
};

// User OTP functions
function sendOTP() {
  const phone = document.getElementById('phoneNumber').value.trim();
  if (!phone.startsWith('+')) return alert('Include country code');
  auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
    .then(res => {
      window.confirmationResult = res;
      document.getElementById('otp').style.display='block';
      document.getElementById('verify-btn').style.display='block';
      alert('OTP sent');
    }).catch(e=>alert(e.message));
}
function verifyOTP() {
  const code = document.getElementById('otp').value.trim();
  window.confirmationResult.confirm(code)
    .then(result => {
      currentUser = result.user.phoneNumber;
      document.getElementById('auth-section').style.display='none';
      document.getElementById('order-section').style.display='block';
      if (!userCart[currentUser]) userCart[currentUser]=[];
    }).catch(e=>alert('Invalid OTP'));
}

// Admin email login
function adminLogin() {
  const email = document.getElementById('adminEmail').value;
  const pass = document.getElementById('adminPassword').value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      document.getElementById('auth-section').style.display='none';
      document.getElementById('admin-section').style.display='block';
    }).catch(e=>alert('Admin login failed'));
}

// Process both link types
function processLinks() {
  if (!currentUser) return alert('Please login first');
  const single = document.getElementById('links').value.trim().split('\n').filter(l=>l);
  const carts  = document.getElementById('cartLinks').value.trim().split('\n').filter(l=>l);
  const container = document.getElementById('cart');
  container.innerHTML=''; userCart[currentUser]=[];
  // handle single links
  single.forEach((link,i)=> fetchItem(link,i));
  // handle cart links
  carts.forEach(link=> {
    fetch(${backendBaseUrl}/api/fetch-cart?url=${encodeURIComponent(link)})
      .then(r=>r.json()).then(data=>{
        data.items.forEach((it,i)=> fetchItem(it.link, i, it.image, it.price));
      }).catch(()=>alert('Cart fetch failed'));
  });
}
// Fetch single item or passed item
function fetchItem(link, idx, imgOverride, priceOverride) {
  fetch(${backendBaseUrl}/api/fetch-product?url=${encodeURIComponent(link)})
    .then(r=>r.json()).then(data=>{
      const usd = priceOverride||data.priceUSD||0;
      const mwk = usd*exchangeRate;
      const img = imgOverride||data.image;
      const item={link,priceUSD:usd,priceMWK:mwk,image:img,paid:false};
      userCart[currentUser].push(item);
      renderItem(item,userCart[currentUser].length-1);
      updateTotal();
    }).catch(()=>alert('Product fetch failed'));
}
function renderItem(item,i) {
  const div=document.createElement('div'); div.className='cart-item';
  div.innerHTML=`
    <img src="${item.image}" />
    <div>
      <p><strong>Item ${i+1}</strong></p>
      <p>$${item.priceUSD}→MWK ${item.priceMWK.toLocaleString()}</p>
      <a href="${item.link}" target="_blank">View</a><br>
      <label><input type="checkbox" onchange="markPaid('${currentUser}',${i},this)">Paid</label>
    </div>`;
  document.getElementById('cart').appendChild(div);
}
function updateTotal(){
  const t=userCart[currentUser].reduce((s,i)=>s+i.priceMWK,0);
  document.getElementById('total-mwk').textContent=t.toLocaleString();
  document.getElementById('checkout').style.display='block';
}

// Mark as paid
function markPaid(user,i,cb){
  const item=userCart[user][i]; item.paid=cb.checked;
  if(cb.checked) {
    (paidUsers[user]||(paidUsers[user]=[])).push(item);
    (allPaidItems[user]||(allPaidItems[user]=[])).push(item);
  } else {
    paidUsers[user]=paidUsers[user].filter(x=>x!==item);
    allPaidItems[user]=allPaidItems[user].filter(x=>x!==item);
  }
  updateAdminViews();
}

// Checkout
function checkout(){
  document.getElementById('payment-info').style.display='block';
  const li=document.createElement('li');
  const paid=paidUsers[currentUser]||[];
  li.innerHTML=`<strong>${currentUser}</strong><br>
    Items: ${paid.length}<br>
    Total Paid: MWK ${paid.reduce((s,i)=>s+i.priceMWK,0).toLocaleString()}<br>
    Status: ${userTracking[currentUser]||'Not Updated'}`;
  document.getElementById('order-history').appendChild(li);
  if(![...document.getElementById('tracking-user').options].some(o=>o.value===currentUser)){
    const opt=new Option(currentUser,currentUser);
    document.getElementById('tracking-user').add(opt);
  }
}

// Admin views
function updateAdminViews(){
  const ul=document.getElementById('all-paid-cart'); ul.innerHTML='';
  for(const u in allPaidItems) allPaidItems[u].forEach(it=>{
    const li=document.createElement('li');
    li.innerHTML=<strong>${u}</strong>: MWK ${it.priceMWK.toLocaleString()}<br><a href="${it.link}" target="_blank">View</a>;
    ul.appendChild(li);
  });
}

// Admin rate update
function adminUpdateRate(){
  const r=+document.getElementById('admin-rate').value;
  if(!r) return alert('Enter valid rate');
  exchangeRate=r; alert('Rate updated');
}

// Tracking
function updateTracking(){
  const u=document.getElementById('tracking-user').value;
  const s=document.getElementById('tracking-status').value;
  if(!u) return alert('Select user');
  userTracking[u]=s; alert(${u} is now ${s});
}
