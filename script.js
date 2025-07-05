import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const backendURL = 'https://webbuy-backend-1.onrender.com';
const adminKey = '1738';

document.getElementById('signup-btn').addEventListener('click', () => {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert('Sign up successful!');
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('user-dashboard').style.display = 'block';
      fetchOrders();
    })
    .catch(error => alert(error.message));
});

document.getElementById('user-login-btn').addEventListener('click', () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('user-dashboard').style.display = 'block';
      fetchOrders();
    })
    .catch(error => alert(error.message));
});

document.getElementById('admin-login-btn').addEventListener('click', () => {
  const password = document.getElementById('login-password').value;

  if (password === adminKey) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    fetchAdminOrders();
    fetchExchangeRate();
  } else {
    alert('Invalid admin key.');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => {
    location.reload();
  });
});

document.getElementById('admin-logout-btn').addEventListener('click', () => {
  location.reload();
});

document.getElementById('show-login').addEventListener('click', () => {
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
});

document.getElementById('show-signup').addEventListener('click', () => {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
});

document.getElementById('process-links-btn').addEventListener('click', async () => {
  const links = document.getElementById('single-links').value.trim().split('\n');
  const cartLink = document.getElementById('cart-link').value.trim();

  if (links.length === 0 && cartLink === '') return alert('Please provide at least one link.');

  const response = await fetch(`${backendURL}/process-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ links, cartLink })
  });

  const result = await response.json();

  if (result.success) {
    displayCart(result.items, result.total);
  } else {
    alert('Error processing links.');
  }
});

document.getElementById('checkout-btn').addEventListener('click', async () => {
  const cartLink = document.getElementById('cart-link').value.trim();

  const response = await fetch(`${backendURL}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: auth.currentUser.email, cartLink })
  });

  const result = await response.json();

  if (result.success) {
    alert('Order placed successfully.');
    fetchOrders();
  } else {
    alert('Error placing order.');
  }
});

document.getElementById('update-rate-btn').addEventListener('click', async () => {
  const newRate = document.getElementById('new-rate').value;

  const response = await fetch(`${backendURL}/update-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newRate })
  });

  const result = await response.json();

  if (result.success) {
    alert('Rate updated successfully.');
    fetchExchangeRate();
  } else {
    alert('Error updating rate.');
  }
});

async function fetchOrders() {
  const response = await fetch(`${backendURL}/user-orders?email=${auth.currentUser.email}`);
  const result = await response.json();

  const historyDiv = document.getElementById('order-history');
  historyDiv.innerHTML = '';

  result.orders.forEach(order => {
    const p = document.createElement('p');
    p.textContent = `Order: ${order.link} - Total: MWK ${order.total}`;
    historyDiv.appendChild(p);
  });
}

async function fetchAdminOrders() {
  const response = await fetch(`${backendURL}/admin-orders`);
  const result = await response.json();

  const adminOrdersDiv = document.getElementById('admin-orders');
  adminOrdersDiv.innerHTML = '';

  result.orders.forEach(order => {
    const p = document.createElement('p');
    p.textContent = `User: ${order.email} | Order: ${order.link} | Total: MWK ${order.total}`;
    adminOrdersDiv.appendChild(p);
  });
}

async function fetchExchangeRate() {
  const response = await fetch(`${backendURL}/rate`);
  const result = await response.json();
  document.getElementById('rate-display').textContent = result.rate;
}

function displayCart(items, total) {
  const cartDiv = document.getElementById('cart-display');
  cartDiv.innerHTML = '';

  items.forEach(item => {
    const p = document.createElement('p');
    p.textContent = `Item: ${item.name} | Price: MWK ${item.price}`;
    cartDiv.appendChild(p);
  });

  document.getElementById('total-amount').textContent = total;
  document.getElementById('checkout-section').style.display = 'block';
  document.getElementById('payment-section').style.display = 'block';
}

fetchExchangeRate();
