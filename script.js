// Backend URL for Render
const backendBaseUrl = 'https://webbuy-backend.onrender.com';

let exchangeRate = 3000;
let currentUser = '';
let userCart = {};
let paidUsers = {};
let allPaidItems = {};
let userTracking = {};

// Firebase Auth Init
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function sendOTP() {
  const phone = document.getElementById('phone').value;
  const appVerifier = window.recaptchaVerifier;

  auth.signInWithPhoneNumber(phone, appVerifier)
    .then(confirmationResult => {
      window.confirmationResult = confirmationResult;
      alert('OTP sent!');
    }).catch(error => {
      alert(error.message);
    });
}

function verifyOTP() {
  const code = document.getElementById('otp').value;
  confirmationResult.confirm(code)
    .then(result => {
      const user = result.user;
      currentUser = user.phoneNumber;
      document.getElementById('auth').style.display = 'none';
      document.getElementById('order-section').style.display = 'block';
      if (!userCart[currentUser]) userCart[currentUser] = [];
    }).catch(error => {
      alert('Invalid OTP');
    });
}

function processLinks() {
  const linksInput = document.getElementById('links').value.trim();
  const links = linksInput.split('\n').map(link => link.trim()).filter(Boolean);

  if (links.length === 0) return alert('Paste at least one product link');

  const cartContainer = document.getElementById('cart');
  cartContainer.innerHTML = '';
  userCart[currentUser] = [];

  Promise.all(links.map(link => fetch(${backendBaseUrl}/api/fetch-product?url=${encodeURIComponent(link)})
    .then(res => res.json())
    .then(data => {
      const priceUSD = data.price || (10 + Math.random() * 40).toFixed(2);
      const priceMWK = priceUSD * exchangeRate;

      const item = {
        link,
        priceUSD,
        priceMWK,
        image: data.image || 'https://via.placeholder.com/60',
        paid: false
      };

      userCart[currentUser].push(item);

      const i = userCart[currentUser].length;
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <img src="${item.image}" alt="Product" />
        <div>
          <p><strong>Item ${i}</strong></p>
          <p>$${item.priceUSD} → MWK ${item.priceMWK.toLocaleString()}</p>
          <a href="${item.link}" target="_blank">View Item</a><br>
          <label>
            <input type="checkbox" onchange="markPaid('${currentUser}', ${i - 1}, this)">
            Mark as Paid
          </label>
        </div>
      `;
      cartContainer.appendChild(itemDiv);
    })
    .catch(err => {
      alert("Error fetching link: " + link);
    })
  )).then(() => {
    const total = userCart[currentUser].reduce((sum, item) => sum + item.priceMWK, 0);
    document.getElementById('total-mwk').textContent = total.toLocaleString();
    document.getElementById('checkout').style.display = 'block';
  });
}

function markPaid(user, index, checkbox) {
  const item = userCart[user][index];
  item.paid = checkbox.checked;

  if (item.paid) {
    if (!paidUsers[user]) paidUsers[user] = [];
    if (!paidUsers[user].includes(item)) paidUsers[user].push(item);

    if (!allPaidItems[user]) allPaidItems[user] = [];
    if (!allPaidItems[user].includes(item)) allPaidItems[user].push(item);
  } else {
    paidUsers[user] = paidUsers[user]?.filter(i => i !== item);
    allPaidItems[user] = allPaidItems[user]?.filter(i => i !== item);
  }

  updateAdminViews();
}

function checkout() {
  document.getElementById('payment-info').style.display = 'block';

  const log = document.getElementById('order-history');
  const li = document.createElement('li');
  li.innerHTML = `
    <strong>${currentUser}</strong><br>
    Items: ${paidUsers[currentUser]?.length || 0}<br>
    Total Paid: MWK ${(
      paidUsers[currentUser]?.reduce((sum, i) => sum + i.priceMWK, 0) || 0
    ).toLocaleString()}
    <br>Status: ${userTracking[currentUser] || 'Not Updated'}
  `;
  log.appendChild(li);

  if (!document.getElementById('tracking-user').querySelector(option[value="${currentUser}"])) {
    const opt = document.createElement('option');
    opt.value = currentUser;
    opt.textContent = currentUser;
    document.getElementById('tracking-user').appendChild(opt);
  }
}

function updateAdminViews() {
  const allPaidContainer = document.getElementById('all-paid-cart');
  allPaidContainer.innerHTML = '';

  Object.keys(allPaidItems).forEach(user => {
    allPaidItems[user].forEach((item, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${user}</strong>: MWK ${item.priceMWK.toLocaleString()}<br>
        <a href="${item.link}" target="_blank">View</a>
      `;
      allPaidContainer.appendChild(li);
    });
  });
}

function adminUpdateRate() {
  const newRate = parseFloat(document.getElementById('admin-rate').value);
  if (isNaN(newRate) || newRate <= 0) return alert("Enter a valid rate");
  exchangeRate = newRate;
  alert("Exchange rate updated to " + exchangeRate);
}

function updateTracking() {
  const user = document.getElementById('tracking-user').value;
  const status = document.getElementById('tracking-status').value;

  if (!user) return alert("Choose a user");
  userTracking[user] = status;
  alert(Tracking updated: ${user} is now ${status});
}
