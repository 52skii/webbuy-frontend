// Firebase configuration (replace with your own if needed)
const firebaseConfig = {
  apiKey: "AIzaSyAv5BThaF59mBCw5Q0_t56OYy2VgihCxfY",
  authDomain: "webbuy-be987.firebaseapp.com",
  projectId: "webbuy-be987",
  storageBucket: "webbuy-be987.appspot.com",
  messagingSenderId: "1060406065263",
  appId: "1:1060406065263:web:60d8a271234a541284759a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let exchangeRate = 3000;
let currentUser = null;
let isAdmin = false;
let userCart = {};
let paidUsers = {};
let allPaidItems = {};
let userTracking = {};

// ADMIN email list
const adminEmails = ["admin@webbuy.com"];

function show(sectionId) {
  document.querySelectorAll("section").forEach(s => s.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
}

// OTP LOGIN
function sendOTP() {
  const phone = document.getElementById("phone").value;
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("recaptcha", {
    size: "invisible"
  });

  auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
    .then(confirmResult => {
      window.confirmationResult = confirmResult;
      alert("OTP sent");
      document.getElementById("otp-section").style.display = "block";
    }).catch(error => alert(error.message));
}

function verifyOTP() {
  const code = document.getElementById("otp-code").value;
  confirmationResult.confirm(code).then(result => {
    const user = result.user;
    currentUser = user.phoneNumber;
    isAdmin = adminEmails.includes(user.email || "");

    document.getElementById("login-section").style.display = "none";
    if (!userCart[currentUser]) userCart[currentUser] = [];

    show("order-section");
  }).catch(err => alert("Incorrect code"));
}

// ============ USER SECTION ==============

async function processLinks() {
  const linksText = document.getElementById("links").value.trim();
  const links = linksText.split("\n").map(l => l.trim()).filter(Boolean);
  if (!links.length) return alert("Paste at least one product link");

  const cartContainer = document.getElementById("cart");
  cartContainer.innerHTML = "";
  userCart[currentUser] = [];

  for (const link of links) {
    const res = await fetch(https://webbuy-backend.onrender.com/api/fetch?url=${encodeURIComponent(link)});
    const data = await res.json();
    const item = {
      link,
      image: data.image || "https://via.placeholder.com/70",
      priceUSD: data.price || 15,
      priceMWK: (data.price || 15) * exchangeRate,
      paid: false
    };
    userCart[currentUser].push(item);

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" />
      <div>
        <p><strong>${item.link.includes("appjump") ? "Cart Link" : "Item"}</strong></p>
        <p>$${item.priceUSD} → MWK ${item.priceMWK.toLocaleString()}</p>
        <a href="${link}" target="_blank">View</a><br>
        <label>
          <input type="checkbox" onchange="markPaid('${currentUser}', ${userCart[currentUser].length - 1}, this)">
          Mark as Paid
        </label>
      </div>
    `;
    cartContainer.appendChild(div);
  }

  const total = userCart[currentUser].reduce((sum, item) => sum + item.priceMWK, 0);
  document.getElementById("total-mwk").textContent = total.toLocaleString();
  document.getElementById("checkout").style.display = "block";
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
  document.getElementById("payment-info").style.display = "block";
  const log = document.getElementById("order-history");
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${currentUser}</strong><br>
    Items: ${paidUsers[currentUser]?.length || 0}<br>
    Total Paid: MWK ${
      (paidUsers[currentUser]?.reduce((sum, i) => sum + i.priceMWK, 0) || 0).toLocaleString()
    }<br>Status: ${userTracking[currentUser] || 'Not Updated'}
  `;
  log.appendChild(li);

  if (!document.querySelector(#tracking-user option[value="${currentUser}"])) {
    const opt = document.createElement("option");
    opt.value = currentUser;
    opt.textContent = currentUser;
    document.getElementById("tracking-user").appendChild(opt);
  }
}

// ============ ADMIN SECTION ==============

function adminUpdateRate() {
  if (!isAdmin) return alert("Only admin can change the rate");
  const newRate = parseFloat(document.getElementById("admin-rate").value);
  if (isNaN(newRate) || newRate <= 0) return alert("Enter a valid rate");
  exchangeRate = newRate;
  alert(Exchange rate updated to ${exchangeRate});
}

function updateAdminViews() {
  const allPaidContainer = document.getElementById("all-paid-cart");
  allPaidContainer.innerHTML = "";

  Object.keys(allPaidItems).forEach(user => {
    allPaidItems[user].forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${user}</strong>: MWK ${item.priceMWK.toLocaleString()}<br>
        <a href="${item.link}" target="_blank">View</a>
      `;
      allPaidContainer.appendChild(li);
    });
  });
}

function updateTracking() {
  const user = document.getElementById("tracking-user").value;
  const status = document.getElementById("tracking-status").value;
  if (!user) return alert("Choose a user");

  userTracking[user] = status;
  alert(${user}'s tracking updated to ${status});
}
