/* ==========================================================================
   PID Controller Simulation - Robotics Control Systems Lab
   ========================================================================== */

(function() {
  const canvas = document.getElementById('pid-canvas');
  const ctx = canvas.getContext('2d');
  const graphCanvas = document.getElementById('pid-graph');
  const graphCtx = graphCanvas.getContext('2d');

  // PID Parameters
  let Kp = 0.05;
  let Ki = 0.0001;
  let Kd = 0.35;

  // Simulation State
  let robot = {
    x: 100,
    y: 100,
    heading: 0,
    speed: 4.5,
    radius: 12,
    trail: []
  };

  let errorHistory = [];
  const maxErrorPoints = 150;
  let integral = 0;
  let lastError = 0;
  let simulationId = null;
  let isRunning = true;
  let trackType = 'peanut'; // 'peanut' or 'sine'
  let trackPoints = [];

  // DOM Elements
  const kpSlider = document.getElementById('pid-kp');
  const kiSlider = document.getElementById('pid-ki');
  const kdSlider = document.getElementById('pid-kd');
  
  const valKp = document.getElementById('val-kp');
  const valKi = document.getElementById('val-ki');
  const valKd = document.getElementById('val-kd');

  const statError = document.getElementById('stat-error');
  const statControl = document.getElementById('stat-control');

  const btnRestart = document.getElementById('btn-restart-sim');
  const btnToggleTrack = document.getElementById('btn-toggle-sim-track');

  const presetTuned = document.getElementById('preset-tuned');
  const presetOscillating = document.getElementById('preset-oscillating');
  const presetSluggish = document.getElementById('preset-sluggish');

  // Initialize Track
  function generateTrack() {
    trackPoints = [];
    const numPoints = 300;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (trackType === 'peanut') {
      const rx = 240;
      const ry = 95;
      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2;
        const x = cx + rx * Math.cos(t);
        // Peanut shape curve using sine frequency multiples
        const y = cy + ry * Math.sin(t) + 35 * Math.sin(2 * t);
        trackPoints.push({ x, y });
      }
    } else { // 'sine' wave track
      const amplitude = 70;
      const frequency = 2.5;
      for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * (canvas.width - 80) + 40;
        const y = cy + amplitude * Math.sin((x / canvas.width) * Math.PI * 2 * frequency);
        trackPoints.push({ x, y });
      }
    }

    // Precalculate normals and tangents for error sign detection
    for (let i = 0; i < trackPoints.length; i++) {
      const p = trackPoints[i];
      const nextP = trackPoints[(i + 1) % trackPoints.length];
      
      const dx = nextP.x - p.x;
      const dy = nextP.y - p.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      p.tx = dx / len; // normalized tangent x
      p.ty = dy / len; // normalized tangent y
      
      p.nx = p.ty;     // normal x (corrected sign for negative feedback)
      p.ny = -p.tx;    // normal y
    }
  }

  // Find nearest track point and compute signed crosstrack error
  function getCrosstrackError(rx, ry) {
    let minD2 = Infinity;
    let nearestIdx = 0;

    for (let i = 0; i < trackPoints.length; i++) {
      const p = trackPoints[i];
      const dx = rx - p.x;
      const dy = ry - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < minD2) {
        minD2 = d2;
        nearestIdx = i;
      }
    }

    const p = trackPoints[nearestIdx];
    const vx = rx - p.x;
    const vy = ry - p.y;
    
    // Project vector (vx, vy) onto the normal of the track
    // If dot product is positive, the robot is on the left side of the track direction.
    // If negative, it is on the right side.
    const signedError = vx * p.nx + vy * p.ny;
    return {
      error: signedError,
      nearestPoint: p,
      index: nearestIdx
    };
  }

  // Preset Handlers
  function applyPreset(p) {
    presetTuned.classList.remove('active');
    presetOscillating.classList.remove('active');
    presetSluggish.classList.remove('active');

    if (p === 'tuned') {
      Kp = 0.05; Ki = 0.0001; Kd = 0.35;
      presetTuned.classList.add('active');
    } else if (p === 'oscillating') {
      Kp = 0.08; Ki = 0.0001; Kd = 0.02; // low derivative damping, moderate proportional overshoot
      presetOscillating.classList.add('active');
    } else if (p === 'sluggish') {
      Kp = 0.012; Ki = 0.0000; Kd = 0.65; // low proportional gain makes it slow to correct
      presetSluggish.classList.add('active');
    }

    // Update Sliders
    kpSlider.value = Kp;
    kiSlider.value = Ki;
    kdSlider.value = Kd;

    // Update value displays
    valKp.textContent = Kp.toFixed(3);
    valKi.textContent = Ki.toFixed(5);
    valKd.textContent = Kd.toFixed(2);

    resetState();
  }

  function resetState() {
    integral = 0;
    lastError = 0;
    errorHistory = [];
    robot.trail = [];
    
    // Position robot near the start of the track
    if (trackPoints.length > 0) {
      robot.x = trackPoints[0].x;
      robot.y = trackPoints[0].y; // Start exactly on the track to prevent immediate spin-out
      // Face along the direction of the track tangent
      robot.heading = Math.atan2(trackPoints[0].ty, trackPoints[0].tx);
    }
  }

  // PID Loop Update (run at ~60fps)
  function updateSimulation() {
    if (!isRunning) return;

    const ctData = getCrosstrackError(robot.x, robot.y);
    const error = ctData.error;
    
    // Euler integral integration
    integral += error;
    // Derivative (rate of change of error)
    const derivative = error - lastError;
    lastError = error;

    // Output PID Steering value
    const steeringSignal = (Kp * error) + (Ki * integral) + (Kd * derivative);
    
    // Bind steering rate of change to make it physically realistic (steering saturation)
    const maxSteering = 0.15; // rad per frame
    const clampedSteering = Math.max(-maxSteering, Math.min(maxSteering, steeringSignal));

    // Update robot states (Differential drive kinematics)
    robot.heading += clampedSteering;
    robot.x += robot.speed * Math.cos(robot.heading);
    robot.y += robot.speed * Math.sin(robot.heading);

    // Save trail for rendering
    robot.trail.push({ x: robot.x, y: robot.y });
    if (robot.trail.length > 80) {
      robot.trail.shift();
    }

    // Record error to graph
    errorHistory.push(error);
    if (errorHistory.length > maxErrorPoints) {
      errorHistory.shift();
    }

    // UI Stats Updates
    statError.textContent = error.toFixed(2) + ' px';
    statControl.textContent = steeringSignal.toFixed(3) + ' rad/s';

    // Wrap around for non-loop tracks like sine wave
    if (trackType === 'sine') {
      const endX = trackPoints[trackPoints.length - 1].x;
      const startX = trackPoints[0].x;
      if (robot.x > endX || robot.x < startX - 15) {
        resetState();
      }
    }
  }

  // Draw Simulation elements
  function drawSimulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Track Line (dashed guide)
    ctx.beginPath();
    ctx.strokeStyle = '#20304a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < trackPoints.length; i++) {
      if (i === 0) ctx.moveTo(trackPoints[i].x, trackPoints[i].y);
      else ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    if (trackType === 'peanut') {
      ctx.closePath();
    }
    ctx.stroke();

    // Draw Active Sensor Path
    ctx.beginPath();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < trackPoints.length; i++) {
      if (i === 0) ctx.moveTo(trackPoints[i].x, trackPoints[i].y);
      else ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    if (trackType === 'peanut') {
      ctx.closePath();
    }
    ctx.stroke();

    // Draw Robot Trail
    if (robot.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 255, 135, 0.4)';
      ctx.lineWidth = 4;
      ctx.moveTo(robot.trail[0].x, robot.trail[0].y);
      for (let i = 1; i < robot.trail.length; i++) {
        ctx.lineTo(robot.trail[i].x, robot.trail[i].y);
      }
      ctx.stroke();
    }

    // Draw Robot
    ctx.save();
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.heading);

    // Glowing shadow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff87';

    // Chassis
    ctx.fillStyle = '#101524';
    ctx.strokeStyle = '#00ff87';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, robot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Heading indicator wheel
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.rect(robot.radius - 6, -3, 8, 6);
    ctx.fill();

    // Side wheels
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.rect(-6, -robot.radius - 2, 12, 4);
    ctx.rect(-6, robot.radius - 2, 12, 4);
    ctx.fill();

    ctx.restore();

    // Draw Sensor Line (visualizes the error projection)
    const ctData = getCrosstrackError(robot.x, robot.y);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 95, 86, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(robot.x, robot.y);
    ctx.lineTo(ctData.nearestPoint.x, ctData.nearestPoint.y);
    ctx.stroke();

    // Sensor dots on track
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(ctData.nearestPoint.x, ctData.nearestPoint.y, 4, 0, Math.PI*2);
    ctx.fill();

    // Draw Graph
    drawGraph();
  }

  // Draw scrolling error history graph
  function drawGraph() {
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    const midY = graphCanvas.height / 2;

    // Zero-line
    graphCtx.beginPath();
    graphCtx.strokeStyle = '#20304a';
    graphCtx.lineWidth = 1;
    graphCtx.moveTo(0, midY);
    graphCtx.lineTo(graphCanvas.width, midY);
    graphCtx.stroke();

    if (errorHistory.length < 2) return;

    graphCtx.beginPath();
    graphCtx.strokeStyle = '#ff5f56';
    graphCtx.lineWidth = 2;
    
    const dx = graphCanvas.width / maxErrorPoints;
    const scaleY = (graphCanvas.height / 2) / 60; // scale factor (fits 60px error max)

    for (let i = 0; i < errorHistory.length; i++) {
      const x = i * dx;
      const y = midY + errorHistory[i] * scaleY;
      
      if (i === 0) {
        graphCtx.moveTo(x, y);
      } else {
        graphCtx.lineTo(x, y);
      }
    }
    graphCtx.stroke();
  }

  // Main Loop
  function tick() {
    updateSimulation();
    drawSimulation();
    simulationId = requestAnimationFrame(tick);
  }

  // Event Listeners for sliders
  kpSlider.addEventListener('input', function(e) {
    Kp = parseFloat(e.target.value);
    valKp.textContent = Kp.toFixed(3);
    presetTuned.classList.remove('active');
    presetOscillating.classList.remove('active');
    presetSluggish.classList.remove('active');
  });

  kiSlider.addEventListener('input', function(e) {
    Ki = parseFloat(e.target.value);
    valKi.textContent = Ki.toFixed(5);
    presetTuned.classList.remove('active');
    presetOscillating.classList.remove('active');
    presetSluggish.classList.remove('active');
  });

  kdSlider.addEventListener('input', function(e) {
    Kd = parseFloat(e.target.value);
    valKd.textContent = Kd.toFixed(2);
    presetTuned.classList.remove('active');
    presetOscillating.classList.remove('active');
    presetSluggish.classList.remove('active');
  });

  // Buttons Listeners
  btnRestart.addEventListener('click', function() {
    resetState();
  });

  btnToggleTrack.addEventListener('click', function() {
    trackType = (trackType === 'peanut') ? 'sine' : 'peanut';
    btnToggleTrack.textContent = (trackType === 'peanut') ? 'Change Track (Sine)' : 'Change Track (Peanut)';
    generateTrack();
    resetState();
  });

  presetTuned.addEventListener('click', () => applyPreset('tuned'));
  presetOscillating.addEventListener('click', () => applyPreset('oscillating'));
  presetSluggish.addEventListener('click', () => applyPreset('sluggish'));

  // Start Simulation
  generateTrack();
  resetState();
  tick();

  // Export properties globally to allow interaction if needed
  window.PIDSIM = {
    setGains: function(p, i, d) {
      Kp = p; Ki = i; Kd = d;
      kpSlider.value = p; kiSlider.value = i; kdSlider.value = d;
      valKp.textContent = p.toFixed(3); valKi.textContent = i.toFixed(5); valKd.textContent = d.toFixed(2);
      resetState();
    }
  };
})();
