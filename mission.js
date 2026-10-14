/* ==========================================================================
   Mission rail: the page as an RViz-style Nav2 mission.
   Sections are waypoints, scroll position drives a robot along the plan,
   and a HUD shows its pose. Clicking a waypoint sets a "2D Goal Pose".
   ========================================================================== */

(function () {
  const SECTIONS = [
    { id: 'home', topic: '/home' },
    { id: 'about', topic: '/about' },
    { id: 'skills', topic: '/skills' },
    { id: 'architecture', topic: '/robot_stack' },
    { id: 'experience', topic: '/experience' },
    { id: 'projects', topic: '/projects' },
    { id: 'pid-lab', topic: '/control_lab' },
    { id: 'github', topic: '/github/activity' },
    { id: 'contact', topic: '/contact' }
  ].filter(s => document.getElementById(s.id));
  if (SECTIONS.length < 2) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAIL_W = 52;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- DOM ----------------------------------------------------------------
  const rail = document.createElement('nav');
  rail.className = 'mission-rail';
  rail.setAttribute('aria-label', 'Mission waypoints');
  rail.innerHTML = `<svg class="mission-svg" width="${RAIL_W}" aria-hidden="true">
      <path class="mission-plan"/>
      <path class="mission-travelled"/>
      <g class="mission-goal" style="display:none"><path d="M0,0 L-6,-14 L6,-14 z"/></g>
      <g class="mission-waypoints"></g>
      <g class="mission-robot">
        <rect x="-8" y="-6" width="16" height="12" rx="3"/>
        <line class="tf-x" x1="0" y1="0" x2="13" y2="0"/>
        <line class="tf-y" x1="0" y1="0" x2="0" y2="-9"/>
      </g>
    </svg>
    <ol class="mission-links"></ol>`;
  document.body.appendChild(rail);

  const hud = document.createElement('div');
  hud.className = 'mission-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = '<span class="hud-item hud-frame"><span class="hud-key">Fixed Frame</span> map</span>' +
    '<span class="hud-item hud-odom"><span class="hud-key">/odom</span> <span class="hud-pose"></span></span>' +
    '<span class="hud-item"><span class="hud-key">goal</span> <span class="hud-goal"></span></span>';
  document.body.appendChild(hud);

  const svg = rail.querySelector('.mission-svg');
  const plan = rail.querySelector('.mission-plan');
  const travelled = rail.querySelector('.mission-travelled');
  const wpGroup = rail.querySelector('.mission-waypoints');
  const robot = rail.querySelector('.mission-robot');
  const goal = rail.querySelector('.mission-goal');
  const links = rail.querySelector('.mission-links');
  const hudPose = hud.querySelector('.hud-pose');
  const hudGoal = hud.querySelector('.hud-goal');

  // Accessible, clickable waypoint list laid over the SVG markers
  SECTIONS.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${s.id}" class="mission-link" data-index="${i}"><span class="mission-label">${s.topic}</span></a>`;
    links.appendChild(li);
  });

  let samples = [];   // [{ len, x, y }] along the plan, y increasing
  let totalLen = 0;
  let waypointYs = [];
  let goalIndex = null;

  function sectionProgress(el) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    return Math.min(1, Math.max(0, top / max));
  }

  // ---- Layout: rebuild the plan whenever page height changes -------------
  function layout() {
    const h = rail.clientHeight;
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${RAIL_W} ${h}`);
    const pad = 10;
    const usable = h - pad * 2;

    // Waypoint y from where each section starts in the scroll range; keep a minimum gap
    waypointYs = [];
    SECTIONS.forEach((s, i) => {
      let y = pad + sectionProgress(document.getElementById(s.id)) * usable;
      if (i > 0) y = Math.max(y, waypointYs[i - 1] + 14);
      waypointYs.push(Math.min(y, h - pad));
    });
    const pts = waypointYs.map((y, i) => ({ x: i % 2 === 0 ? 16 : 36, y }));

    // Smooth plan: vertical-tangent cubic segments between waypoints
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
      d += ` C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
    }
    // Extend straight down to the end of the rail so the robot can reach the bottom
    d += ` L${pts[pts.length - 1].x},${h - pad}`;
    plan.setAttribute('d', d);
    travelled.setAttribute('d', d);
    totalLen = plan.getTotalLength();
    travelled.style.strokeDasharray = `${totalLen} ${totalLen}`;

    samples = [];
    const N = 300;
    for (let i = 0; i <= N; i++) {
      const len = (totalLen * i) / N;
      const p = plan.getPointAtLength(len);
      samples.push({ len, x: p.x, y: p.y });
    }

    wpGroup.innerHTML = '';
    pts.forEach((p, i) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', p.x);
      c.setAttribute('cy', p.y);
      c.setAttribute('r', 4);
      c.setAttribute('class', 'mission-wp');
      c.dataset.index = i;
      wpGroup.appendChild(c);
      const link = links.children[i].firstElementChild;
      link.style.top = `${p.y - 10}px`;
      link.style.left = `${p.x - 10}px`;
    });
    update();
  }

  // Sample whose y is closest to the target y (samples are y-monotonic)
  function sampleAtY(y) {
    let lo = 0, hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].y < y) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  // ---- Per-frame update ---------------------------------------------------
  function update() {
    if (!samples.length) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const h = rail.clientHeight, pad = 10;
    const idx = sampleAtY(pad + progress * (h - pad * 2));
    const s = samples[idx];
    const prev = samples[Math.max(0, idx - 2)], next = samples[Math.min(samples.length - 1, idx + 2)];
    const heading = Math.atan2(next.y - prev.y, next.x - prev.x);

    robot.setAttribute('transform', `translate(${s.x},${s.y}) rotate(${(heading * 180) / Math.PI})`);
    travelled.style.strokeDashoffset = `${totalLen - s.len}`;

    // Active waypoint = last one the robot has passed
    let active = 0;
    waypointYs.forEach((y, i) => { if (s.y >= y - 2) active = i; });
    wpGroup.querySelectorAll('.mission-wp').forEach((c, i) => {
      c.classList.toggle('is-visited', i <= active);
      c.classList.toggle('is-active', i === active);
    });
    links.querySelectorAll('.mission-link').forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });

    if (goalIndex !== null && active === goalIndex) clearGoal();

    // HUD: metres down the page as -y, sideways offset as x, heading as theta (ROS: 0 = +x)
    const x = ((s.x - RAIL_W / 2) / 10).toFixed(2);
    const y = (-window.scrollY / 100).toFixed(2);
    const theta = (-heading).toFixed(2);
    hudPose.textContent = `x ${x}  y ${y}  θ ${theta}`;
    const target = goalIndex !== null ? goalIndex : Math.min(active + 1, SECTIONS.length - 1);
    const label = goalIndex !== null ? 'navigating ▸' : (active === SECTIONS.length - 1 ? 'reached ✓' : 'next ▸');
    hudGoal.textContent = `${active + 1}/${SECTIONS.length}  ${label} ${SECTIONS[target].topic}`;
  }

  // ---- 2D Goal Pose: clicking a waypoint or nav link drops a goal marker --
  let goalTimer;
  function clearGoal() {
    goalIndex = null;
    goal.style.display = 'none';
    clearTimeout(goalTimer);
  }

  function setGoal(i) {
    if (!waypointYs.length) return;
    goalIndex = i;
    // Fallback in case the scroll is interrupted before arrival
    clearTimeout(goalTimer);
    goalTimer = setTimeout(() => { clearGoal(); update(); }, 4000);
    const wp = wpGroup.children[i];
    goal.setAttribute('transform', `translate(${wp.getAttribute('cx')},${wp.getAttribute('cy') - 5})`);
    goal.style.display = '';
    update();
  }

  links.addEventListener('click', e => {
    const a = e.target.closest('.mission-link');
    if (!a) return;
    e.preventDefault();
    const i = +a.dataset.index;
    setGoal(i);
    document.getElementById(SECTIONS[i].id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  document.querySelectorAll('.nav-link[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      const i = SECTIONS.findIndex(s => '#' + s.id === a.getAttribute('href'));
      if (i >= 0) setGoal(i);
    });
  });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });

  // Page height changes as images, videos and the heatmap load
  let layoutTimer;
  const relayout = () => { clearTimeout(layoutTimer); layoutTimer = setTimeout(layout, 120); };
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(document.body);
  layout();
})();
