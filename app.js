/* ==========================================================================
   GROUNDWORK 3D — MAIN JAVASCRIPT APPLICATION CONTROLLER
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. WEB AUDIO SYNTHESIZER ENGINE (Procedural SFX)
   -------------------------------------------------------------------------- */
let audioCtx = null;
let audioEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'ping') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'teleport') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.warn("Web Audio autoplay prevented.", e);
  }
}

function toggleAudio() {
  audioEnabled = !audioEnabled;
  document.getElementById('audioToggleBtn').textContent = audioEnabled ? '🔊 Audio: ON' : '🔇 Audio: MUTED';
  showToast(audioEnabled ? 'Audio synthesis active' : 'Audio synthesis muted');
}

/* --------------------------------------------------------------------------
   2. THREE.JS FULLSCREEN BACKGROUND DYNAMIC WAVE PARTICLES
   -------------------------------------------------------------------------- */
const bgCanvas = document.getElementById('webgl-canvas');
const bgScene = new THREE.Scene();
const bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
bgCamera.position.set(0, 7, 24);
bgCamera.lookAt(0, 0, 0);

const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
bgRenderer.setSize(window.innerWidth, window.innerHeight);
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const pCount = 1200;
const bgGeom = new THREE.BufferGeometry();
const bgPos = new Float32Array(pCount * 3);

let pIdx = 0;
for (let x = -30; x <= 30; x += 2) {
  for (let z = -30; z <= 30; z += 2) {
    bgPos[pIdx * 3] = x;
    bgPos[pIdx * 3 + 1] = 0;
    bgPos[pIdx * 3 + 2] = z;
    pIdx++;
  }
}
bgGeom.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));

const bgMat = new THREE.PointsMaterial({
  color: 0x2C7A53,
  size: 0.16,
  transparent: true,
  opacity: 0.38
});
const bgMesh = new THREE.Points(bgGeom, bgMat);
bgScene.add(bgMesh);

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) - 0.5;
  mouseY = (e.clientY / window.innerHeight) - 0.5;
});

const bgClock = new THREE.Clock();
function animateBackground() {
  requestAnimationFrame(animateBackground);
  const t = bgClock.getElapsedTime() * 0.7;
  const positions = bgGeom.attributes.position.array;

  let index = 0;
  for (let x = -30; x <= 30; x += 2) {
    for (let z = -30; z <= 30; z += 2) {
      positions[index * 3 + 1] = Math.sin(x * 0.25 + t) * 1.2 + Math.cos(z * 0.25 + t) * 1.2;
      index++;
    }
  }
  bgGeom.attributes.position.needsUpdate = true;

  bgCamera.position.x += (mouseX * 4 - bgCamera.position.x) * 0.05;
  bgCamera.position.y += (-mouseY * 3 + 7 - bgCamera.position.y) * 0.05;
  bgCamera.lookAt(0, 0, 0);

  bgRenderer.render(bgScene, bgCamera);
}
animateBackground();

/* --------------------------------------------------------------------------
   3. THREE.JS INTERACTIVE 3D EARTH GLOBE & COORDINATE PIN ENGINE
   -------------------------------------------------------------------------- */
const globeCanvas = document.getElementById('globe-canvas');
const globeScene = new THREE.Scene();
const globeCamera = new THREE.PerspectiveCamera(45, globeCanvas.clientWidth / globeCanvas.clientHeight, 0.1, 100);
globeCamera.position.set(0, 0, 5.2);

const globeRenderer = new THREE.WebGLRenderer({ canvas: globeCanvas, alpha: true, antialias: true });
globeRenderer.setSize(globeCanvas.clientWidth, globeCanvas.clientHeight);
globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Ambient & Directional Lighting
const globeAmbient = new THREE.AmbientLight(0xffffff, 0.6);
globeScene.add(globeAmbient);
const globeSun = new THREE.DirectionalLight(0xE8B446, 1.2);
globeSun.position.set(5, 3, 5);
globeScene.add(globeSun);

// Base Earth Sphere
const earthRadius = 1.9;
const earthGeom = new THREE.SphereGeometry(earthRadius, 64, 64);
const earthMat = new THREE.MeshPhongMaterial({
  color: 0x0f291e,
  emissive: 0x06110c,
  specular: 0x2C7A53,
  shininess: 25,
  wireframe: false
});
const earthSphere = new THREE.Mesh(earthGeom, earthMat);
globeScene.add(earthSphere);

// Wireframe Atmosphere Grid
const atmoGeom = new THREE.SphereGeometry(earthRadius * 1.008, 36, 36);
const atmoMat = new THREE.MeshBasicMaterial({
  color: 0x41b37b,
  wireframe: true,
  transparent: true,
  opacity: 0.18
});
const atmoSphere = new THREE.Mesh(atmoGeom, atmoMat);
globeScene.add(atmoSphere);

// Coordinate Helper: Converts Latitude/Longitude to 3D Sphere Vector
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Beacon Pins Group
const beaconsGroup = new THREE.Group();
globeScene.add(beaconsGroup);

const causeColorMap = {
  env: 0x41b37b,
  edu: 0xE8B446,
  health: 0xe056fd,
  relief: 0xC45D37
};

function renderGlobeBeacons(campaigns) {
  while (beaconsGroup.children.length > 0) {
    beaconsGroup.remove(beaconsGroup.children[0]);
  }

  campaigns.forEach((c) => {
    const lat = c.lat || 20;
    const lng = c.lng || 78;
    const pos = latLngToVector3(lat, lng, earthRadius * 1.02);

    const pinGeom = new THREE.SphereGeometry(0.045, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: causeColorMap[c.cause] || 0xE8B446 });
    const pinMesh = new THREE.Mesh(pinGeom, pinMat);
    pinMesh.position.copy(pos);
    pinMesh.userData = c;

    // Glowing Pulse Halo Ring
    const ringGeom = new THREE.RingGeometry(0.05, 0.08, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: causeColorMap[c.cause] || 0xE8B446,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.copy(pos);
    ringMesh.lookAt(0, 0, 0);

    const pinContainer = new THREE.Group();
    pinContainer.add(pinMesh);
    pinContainer.add(ringMesh);
    pinContainer.userData = c;

    beaconsGroup.add(pinContainer);
  });
}

// Raycaster Click to Select Globe Pin
const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

globeCanvas.addEventListener('click', (e) => {
  const rect = globeCanvas.getBoundingClientRect();
  mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouseVec, globeCamera);
  const intersects = raycaster.intersectObjects(beaconsGroup.children, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target.parent && !target.userData.title) {
      target = target.parent;
    }
    if (target.userData && target.userData.title) {
      const camp = target.userData;
      document.getElementById('hudCoords').textContent = `${camp.lat.toFixed(2)}° N, ${camp.lng.toFixed(2)}° E`;
      document.getElementById('hudSector').textContent = `${camp.title.slice(0, 22)}...`;
      document.getElementById('hudStatus').textContent = camp.spots;
      playSound('ping');
    }
  }
});

let globeTargetRotY = 0;
let globeTargetRotX = 0;

function teleportGlobeTo(lat, lng) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  globeTargetRotY = -theta + Math.PI / 2;
  globeTargetRotX = phi - Math.PI / 2;
  playSound('teleport');
  document.getElementById('globeSection').scrollIntoView({ behavior: 'smooth' });
}

function animateGlobe() {
  requestAnimationFrame(animateGlobe);

  earthSphere.rotation.y += 0.0015;
  atmoSphere.rotation.y += 0.0018;
  beaconsGroup.rotation.y += 0.0015;

  if (globeTargetRotY !== 0) {
    earthSphere.rotation.y += (globeTargetRotY - earthSphere.rotation.y) * 0.05;
    beaconsGroup.rotation.y = earthSphere.rotation.y;
  }

  globeRenderer.render(globeScene, globeCamera);
}
animateGlobe();

/* --------------------------------------------------------------------------
   4. THREE.JS 3D HOLOGRAPHIC HONOR MEDAL STUDIO
   -------------------------------------------------------------------------- */
const medalCanvas = document.getElementById('medal-canvas');
const medalScene = new THREE.Scene();
const medalCamera = new THREE.PerspectiveCamera(45, medalCanvas.clientWidth / medalCanvas.clientHeight, 0.1, 100);
medalCamera.position.z = 4.2;

const medalRenderer = new THREE.WebGLRenderer({ canvas: medalCanvas, alpha: true, antialias: true });
medalRenderer.setSize(medalCanvas.clientWidth, medalCanvas.clientHeight);
medalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const mLight1 = new THREE.DirectionalLight(0xE8B446, 1.8);
mLight1.position.set(2, 4, 3);
medalScene.add(mLight1);

const mLight2 = new THREE.DirectionalLight(0x41b37b, 1.2);
mLight2.position.set(-3, -2, 2);
medalScene.add(mLight2);

// Multi-faceted Star Medal Geometry
const medalGeom = new THREE.OctahedronGeometry(1.2, 0);
const medalMat = new THREE.MeshStandardMaterial({
  color: 0xE8B446,
  metalness: 0.85,
  roughness: 0.2,
  wireframe: false
});
const medalMesh = new THREE.Mesh(medalGeom, medalMat);
medalScene.add(medalMesh);

// Outer Honor Ring
const mRingGeom = new THREE.TorusGeometry(1.5, 0.06, 16, 64);
const mRingMat = new THREE.MeshStandardMaterial({ color: 0x41b37b, metalness: 0.9, roughness: 0.1 });
const mRingMesh = new THREE.Mesh(mRingGeom, mRingMat);
medalScene.add(mRingMesh);

let isDraggingMedal = false;
let prevMedalMouse = { x: 0, y: 0 };

medalCanvas.addEventListener('mousedown', (e) => {
  isDraggingMedal = true;
  prevMedalMouse = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mouseup', () => isDraggingMedal = false);
window.addEventListener('mousemove', (e) => {
  if (!isDraggingMedal) return;
  const dx = e.clientX - prevMedalMouse.x;
  const dy = e.clientY - prevMedalMouse.y;
  medalMesh.rotation.y += dx * 0.01;
  medalMesh.rotation.x += dy * 0.01;
  mRingMesh.rotation.y += dx * 0.01;
  prevMedalMouse = { x: e.clientX, y: e.clientY };
});

function animateMedal() {
  requestAnimationFrame(animateMedal);
  if (!isDraggingMedal) {
    medalMesh.rotation.y += 0.01;
    medalMesh.rotation.x += 0.005;
    mRingMesh.rotation.z += 0.008;
  }
  medalRenderer.render(medalScene, medalCamera);
}
animateMedal();

/* --------------------------------------------------------------------------
   5. DATA STORE & SIMULATED BACKEND ENGINE (LocalStorage Persistence)
   -------------------------------------------------------------------------- */
const DEFAULT_CAMPAIGNS = [
  { id: 'c1', cause: 'env', label: 'Environment', cls: 'env', org: 'Coastal Roots Trust', title: 'Sundarbans Mangrove Reforestation', desc: 'Plant and monitor 15,000 salt-resistant mangrove saplings along tidal flats to buffer cyclone surges.', spots: '40 Spots Open', hours: '6 hrs/session', rawHours: 6, lat: 21.90, lng: 89.18, skill: 'Tree Planting' },
  { id: 'c2', cause: 'relief', label: 'Disaster Relief', cls: 'relief', org: 'Riverline Aid Network', title: 'Assam Flood Emergency Operations', desc: 'Coordinate supply line logistics, distribution of water purification units, and temporary camps.', spots: '60 Spots · Urgent', hours: '8 hrs/session', rawHours: 8, lat: 26.20, lng: 92.93, skill: 'Logistics' },
  { id: 'c3', cause: 'edu', label: 'Education', cls: 'edu', org: 'Lantern Literacy', title: 'Delhi STEM Mentorship Labs', desc: 'Facilitate weekend computer labs, robotics kits, and reading modules for primary grade students.', spots: '15 Spots Open', hours: '3 hrs/session', rawHours: 3, lat: 28.61, lng: 77.20, skill: 'Teaching' },
  { id: 'c4', cause: 'health', label: 'Healthcare', cls: 'health', org: 'Open Hands Mobile Clinics', title: 'Rural Primary Care Triage', desc: 'Assist medical officers with patient intake, vitals registration, and essential medicine packs.', spots: '20 Spots Open', hours: '8 hrs/session', rawHours: 8, lat: 19.07, lng: 72.87, skill: 'Medical' },
  { id: 'c5', cause: 'env', label: 'Environment', cls: 'env', org: 'Second Harvest Network', title: 'Urban Food Waste Composting', desc: 'Divert market produce waste into decentralized organic micro-farm beds across municipal wards.', spots: '25 Spots Open', hours: '4 hrs/session', rawHours: 4, lat: 12.97, lng: 77.59, skill: 'Tree Planting' },
  { id: 'c6', cause: 'edu', label: 'Education', cls: 'edu', org: 'Bright Path Labs', title: 'Cybersecurity & Code Mentorship', desc: 'Mentor adolescents in basic programming, computational thinking, and digital safety standards.', spots: '10 Spots Open', hours: '2 hrs/session', rawHours: 2, lat: 17.38, lng: 78.48, skill: 'Software' }
];

function getCampaigns() {
  const data = localStorage.getItem('gw_campaigns_db');
  return data ? JSON.parse(data) : DEFAULT_CAMPAIGNS;
}

function saveCampaigns(data) {
  localStorage.setItem('gw_campaigns_db', JSON.stringify(data));
}

function getUser() {
  return JSON.parse(localStorage.getItem('gw_user_session')) || null;
}

function setUser(u) {
  if (u) localStorage.setItem('gw_user_session', JSON.stringify(u));
  else localStorage.removeItem('gw_user_session');
  renderUserInterface();
}

/* --------------------------------------------------------------------------
   6. USER INTERFACE & STATE SYNCHRONIZATION
   -------------------------------------------------------------------------- */
function renderUserInterface() {
  const user = getUser();
  const badge = document.getElementById('navUserBadge');
  const loginBtn = document.getElementById('loginBtn');
  const passName = document.getElementById('passName');
  const passHours = document.getElementById('passHours');
  const passCount = document.getElementById('passCount');
  const passMissionList = document.getElementById('passMissionList');

  if (user) {
    badge.style.display = 'inline-flex';
    loginBtn.style.display = 'none';
    document.getElementById('avatarInitial').textContent = user.avatar || user.name[0];
    document.getElementById('navUserName').textContent = user.name;
    document.getElementById('navUserRole').textContent = user.role || 'VOLUNTEER';

    passName.textContent = user.name;
    passHours.textContent = `${user.hours || 0} hrs`;
    const applied = user.applied || [];
    passCount.textContent = applied.length;

    if (applied.length > 0) {
      passMissionList.innerHTML = applied.map(t => `<div style="padding:4px 0; border-bottom:1px solid var(--line); font-weight:600; color:var(--pine);">✓ ${t}</div>`).join('');
    } else {
      passMissionList.innerHTML = `<em>No field missions joined yet. Browse the live board!</em>`;
    }
  } else {
    badge.style.display = 'none';
    loginBtn.style.display = 'inline-flex';
    passName.textContent = 'Prince Singh (Demo)';
    passHours.textContent = '28 hrs';
    passCount.textContent = '4';
  }

  renderCampaigns();
  renderGlobeBeacons(getCampaigns());
  renderApplicantQueue();
}

/* --------------------------------------------------------------------------
   7. CAMPAIGN BOARD RENDERING & FILTERING
   -------------------------------------------------------------------------- */
let activeFilter = 'all';
let searchKeyword = '';

function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCampaigns();
}

function handleSearch(val) {
  searchKeyword = val.toLowerCase();
  renderCampaigns();
}

function renderCampaigns() {
  const grid = document.getElementById('campGrid');
  const camps = getCampaigns();
  const user = getUser();
  const userApplied = user ? (user.applied || []) : [];

  const filtered = camps.filter(c => {
    const matchFilter = (activeFilter === 'all' || c.cause === activeFilter);
    const matchSearch = c.title.toLowerCase().includes(searchKeyword) || c.org.toLowerCase().includes(searchKeyword) || c.desc.toLowerCase().includes(searchKeyword);
    return matchFilter && matchSearch;
  });

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#777;">No active missions match your search query.</div>`;
    return;
  }

  filtered.forEach(c => {
    const isApplied = userApplied.includes(c.title);
    const card = document.createElement('div');
    card.className = 'camp-card';
    card.innerHTML = `
      <div class="camp-top ${c.cls}">
        <span class="camp-cause">${c.label}</span>
        <span class="camp-org">${c.org}</span>
      </div>
      <div class="camp-body">
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
        <div style="font-size:11.5px; font-weight:700; color:var(--leaf); margin-bottom:12px;">
          📍 ${c.lat ? c.lat.toFixed(2) : 20}° N, ${c.lng ? c.lng.toFixed(2) : 78}° E
        </div>
        <div class="camp-footer">
          <span><strong>${c.spots}</strong></span>
          <span>${c.hours}</span>
        </div>
        <button class="apply-action-btn ${isApplied ? 'applied' : ''}" onclick="applyToMission('${c.id}')">
          ${isApplied ? '✓ Application Registered' : 'Apply for Deployment'}
        </button>
      </div>
    `;

    // 3D Tilt Effect on mousemove
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${py * -7}deg) rotateY(${px * 7}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = 'rotateX(0) rotateY(0) translateY(0)');

    grid.appendChild(card);
  });
}

function applyToMission(id) {
  let user = getUser();
  if (!user) {
    openAuthModal('signup');
    showToast('Please sign in or create your passport to apply.');
    return;
  }

  const camps = getCampaigns();
  const target = camps.find(c => c.id === id);
  if (!target) return;

  if (!user.applied) user.applied = [];
  if (user.applied.includes(target.title)) {
    showToast('You are already registered for this mission.');
    return;
  }

  user.applied.push(target.title);
  user.hours = (user.hours || 0) + (target.rawHours || 4);
  setUser(user);
  playSound('success');
  showToast(`Application confirmed for "${target.title}"!`);
}

/* --------------------------------------------------------------------------
   8. AI SMART MATCHMAKER ALGORITHM
   -------------------------------------------------------------------------- */
function calculateMatches() {
  const skill = document.getElementById('matchSkill').value;
  const hours = parseInt(document.getElementById('matchHours').value);
  const cause = document.getElementById('matchCause').value;
  const camps = getCampaigns();

  const results = camps.map(c => {
    let score = 50; // base score
    if (c.skill === skill) score += 30;
    if (cause === 'all' || c.cause === cause) score += 20;
    if (Math.abs(c.rawHours - hours) <= 2) score += 10;
    return { ...c, score: Math.min(score, 99) };
  }).sort((a, b) => b.score - a.score);

  const container = document.getElementById('matchList');
  container.innerHTML = '';
  results.slice(0, 3).forEach(m => {
    container.innerHTML += `
      <div style="background:#fff; border-radius:14px; padding:16px; border:1px solid var(--line);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; font-weight:700; color:var(--leaf);">${m.label}</span>
          <span style="font-size:12px; font-weight:800; color:var(--gold-2);">${m.score}% MATCH</span>
        </div>
        <h4 style="font-size:15px; margin-bottom:6px; color:var(--pine);">${m.title}</h4>
        <p style="font-size:12.5px; color:#666; margin-bottom:12px;">${m.desc.slice(0, 80)}...</p>
        <button class="btn btn-solid" style="padding:6px 14px; font-size:12px; width:100%;" onclick="teleportGlobeTo(${m.lat}, ${m.lng})">
          Teleport on 3D Globe ↗
        </button>
      </div>
    `;
  });

  document.getElementById('matchResults').style.display = 'block';
  playSound('success');
}

/* --------------------------------------------------------------------------
   9. NGO COMMAND CENTER: APPLICANTS & EMERGENCY DISPATCH
   -------------------------------------------------------------------------- */
function renderApplicantQueue() {
  const queue = document.getElementById('applicantQueue');
  const demoApplicants = [
    { name: 'Dr. Ritu Sharma', role: 'Medical Volunteer', mission: 'Rural Primary Care Triage', hours: '8 hrs' },
    { name: 'Aditya Verma', role: 'Field Logistics', mission: 'Assam Flood Emergency Operations', hours: '8 hrs' },
    { name: 'Sneha Patel', role: 'Environmental Scientist', mission: 'Sundarbans Mangrove Reforestation', hours: '6 hrs' }
  ];

  queue.innerHTML = demoApplicants.map((a, i) => `
    <div class="applicant-row">
      <div>
        <strong>${a.name}</strong> (${a.role})<br>
        <small style="color:#666;">Mission: ${a.mission} · ${a.hours}</small>
      </div>
      <button class="btn btn-solid" style="padding:6px 14px; font-size:11.5px; background:var(--leaf);" onclick="approveApplicant(this)">
        Approve & Mint
      </button>
    </div>
  `).join('');
}

function approveApplicant(btn) {
  btn.textContent = '✓ Approved';
  btn.style.background = '#2e7d32';
  btn.disabled = true;
  playSound('success');
  showToast('Volunteer hours accredited to on-chain passport.');
}

function dispatchEmergencyAlert() {
  const text = document.getElementById('emergencyInput').value.trim();
  if (!text) return;
  document.getElementById('emergencyText').textContent = text;
  document.getElementById('emergencyBanner').style.display = 'flex';
  playSound('ping');
  showToast('Emergency broadcast transmitted across global banner!');
}

function dismissEmergency() {
  document.getElementById('emergencyBanner').style.display = 'none';
}

/* --------------------------------------------------------------------------
   10. OFFICIAL CANVAS QR & SHA-256 CERTIFICATE GENERATION
   -------------------------------------------------------------------------- */
function generateOfficialCertificate() {
  const user = getUser();
  const name = user ? user.name : 'Prince Singh';
  const hours = user ? user.hours || 28 : 28;

  document.getElementById('certUserName').textContent = name;
  document.getElementById('certHours').textContent = `${hours} verified service hours`;

  // Draw procedural QR pattern onto Canvas
  const qrCanvas = document.getElementById('certQrCanvas');
  const ctx = qrCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 130, 130);
  ctx.fillStyle = '#09130e';

  // Deterministic Pattern Grid
  const str = name + hours;
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      if ((r < 3 && c < 3) || (r < 3 && c > 9) || (r > 9 && c < 3) || (r * c + str.length) % 3 === 0) {
        ctx.fillRect(c * 10, r * 10, 8, 8);
      }
    }
  }

  // Simulated Audit Checksum
  document.getElementById('certHash').textContent = 'SHA256:' + Array.from(str).map(c => c.charCodeAt(0).toString(16)).join('') + '8f9214bc90a';
  document.getElementById('certModal').classList.add('active');
  playSound('success');
}

function closeCertModal() {
  document.getElementById('certModal').classList.remove('active');
}

/* --------------------------------------------------------------------------
   11. AUTHENTICATION & CAMPAIGN MODAL LOGIC
   -------------------------------------------------------------------------- */
let authTab = 'login';

function openAuthModal(tab = 'login') {
  authTab = tab;
  switchAuthTab(tab);
  document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tab) {
  authTab = tab;
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('nameField').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = tab === 'login' ? 'Sign In' : 'Create Passport';
}

function loginWithGoogle() {
  const googleUser = {
    name: 'Prince Kumar Singh',
    email: 'prince@google.com',
    avatar: 'P',
    role: 'VOLUNTEER',
    applied: ['Sundarbans Mangrove Reforestation'],
    hours: 32
  };
  setUser(googleUser);
  closeAuthModal();
  playSound('success');
  showToast('Authenticated via Google OAuth 2.0');
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const name = authTab === 'signup' ? document.getElementById('authName').value : email.split('@')[0];
  const user = {
    name: name || 'Volunteer',
    email: email,
    avatar: (name || 'V')[0].toUpperCase(),
    role: 'VOLUNTEER',
    applied: [],
    hours: 0
  };
  setUser(user);
  closeAuthModal();
  playSound('success');
  showToast(authTab === 'signup' ? 'Passport created successfully!' : 'Welcome back!');
}

function handleQuickSignup(e) {
  e.preventDefault();
  const name = document.getElementById('quickName').value;
  const email = document.getElementById('quickEmail').value;
  const user = {
    name: name,
    email: email,
    avatar: name[0].toUpperCase(),
    role: 'VOLUNTEER',
    applied: [],
    hours: 0
  };
  setUser(user);
  playSound('success');
  showToast(`Welcome aboard, ${name}! Your impact passport is ready.`);
}

function logout() {
  setUser(null);
  showToast('Logged out of session');
}

function openCampaignModal() {
  document.getElementById('campaignModal').classList.add('active');
}

function closeCampaignModal() {
  document.getElementById('campaignModal').classList.remove('active');
}

function handleCreateCampaign(e) {
  e.preventDefault();
  const title = document.getElementById('newCampTitle').value;
  const org = document.getElementById('newCampOrg').value;
  const cause = document.getElementById('newCampCause').value;
  const spots = document.getElementById('newCampSpots').value;
  const lat = parseFloat(document.getElementById('newCampLat').value) || 20.0;
  const lng = parseFloat(document.getElementById('newCampLng').value) || 78.0;
  const hours = document.getElementById('newCampHours').value;
  const desc = document.getElementById('newCampDesc').value;

  const labels = { env: 'Environment', edu: 'Education', health: 'Healthcare', relief: 'Disaster Relief' };

  const newCamp = {
    id: 'c_' + Date.now(),
    cause: cause,
    label: labels[cause] || 'General',
    cls: cause,
    org: org,
    title: title,
    desc: desc,
    spots: `${spots} · Open`,
    hours: hours,
    rawHours: parseInt(hours) || 4,
    lat: lat,
    lng: lng,
    skill: 'Logistics'
  };

  const camps = getCampaigns();
  camps.unshift(newCamp);
  saveCampaigns(camps);

  closeCampaignModal();
  renderUserInterface();
  teleportGlobeTo(lat, lng);
  showToast('New coordinate beacon deployed to 3D Globe!');
}

/* --------------------------------------------------------------------------
   12. NOTIFICATION TOAST & GENERAL HELPERS
   -------------------------------------------------------------------------- */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3600);
}

function scrollToCampaigns() {
  document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' });
}

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('gw_campaigns_db')) {
    saveCampaigns(DEFAULT_CAMPAIGNS);
  }
  renderUserInterface();
});
