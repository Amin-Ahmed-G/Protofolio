/* ==========================================================================
   enhancements.js — Portfolio Enhancement Engine
   Covers:
     1. Unified skill + project data store
     2. Slide-in detail panel system (history.pushState deep-links)
     3. Project debug drawer (slide-up on hover/tap) + card 3D tilt
     4. Skills progress bar animation (IntersectionObserver)
     5. FSM Visualizer (SVG state diagram + canvas robot dot)
     6. Terminal: whoami typewriter, projects → scroll links, tab-complete, matrix
     7. Micro-interactions: button glow, section header fade
   ========================================================================== */

(function () {
  'use strict';

  /* =========================================================================
     1. DATA STORE
     ========================================================================= */
  const SKILLS = {
    ros2: {
      name: 'ROS 2 (Humble / Jazzy)',
      level: 'Intermediate',
      what: 'The middleware framework used in almost all modern robotics software — manages communication between nodes (sensors, planners, controllers) over a publish-subscribe network built on DDS.',
      usedIn: ['amr-leader-follower', 'cafe-butler', 'roboshield', 'mecanum-bot', 'two-wheel-bot'],
      example: 'Debugged a stale TF transform that caused the follower robot to silently lose position — traced the race condition between the diff_drive_controller odometry reset and the AMCL re-initialization sequence.'
    },
    gazebo: {
      name: 'Gazebo (Harmonic, Classic)',
      level: 'Intermediate',
      what: 'Physics-accurate robot simulator — used to model world environments, robot kinematics (URDF/SDF), and sensor plugins (LiDAR, IMU, cameras) before deploying to real hardware.',
      usedIn: ['amr-leader-follower', 'cafe-butler', 'mecanum-bot', 'two-wheel-bot'],
      example: 'Built a 10m × 10m café world with custom keepout zone costmaps, dual GPU LiDAR plugins, and waypoint markers — then validated the Nav2 stack against it before any physical deployment.'
    },
    nav2: {
      name: 'Nav2 & Navigation Stack',
      level: 'Intermediate',
      what: 'The ROS 2 navigation framework — provides path planning (NavFn, Smac), local control (DWB), localization (AMCL), and costmap management. The standard stack for autonomous mobile robots.',
      usedIn: ['amr-leader-follower', 'cafe-butler', 'two-wheel-bot'],
      example: 'Configured keepout zone costmaps for the café butler to prevent the robot from attempting to navigate through table areas — required understanding how the inflation layer and keepout plugin interact at the costmap update frequency.'
    },
    slam: {
      name: 'SLAM (SLAM Toolbox)',
      level: 'Intermediate',
      what: 'Simultaneous Localization and Mapping — builds a map of the environment while tracking where the robot is within it, using sensor data like LiDAR scans.',
      usedIn: ['amr-leader-follower', 'mecanum-bot', 'two-wheel-bot'],
      example: 'Discovered that SLAM produced distorted maps with the mecanum bot because standard odometry assumed differential drive — had to rebuild the odometry model to account for holonomic lateral drift.'
    },
    moveit: {
      name: 'MoveIt (Motion Planning)',
      level: 'Familiar',
      what: 'Robot arm motion planning framework for ROS 2 — handles inverse kinematics, collision checking, and trajectory execution for manipulator arms.',
      usedIn: [],
      example: 'Studied MoveIt 2 joint trajectory planning for coursework — primarily familiar with the planning pipeline and URDF joint configuration, not production deployment.'
    },
    cpp: {
      name: 'C / C++ (Embedded Focus)',
      level: 'Intermediate',
      what: 'Primary systems language for embedded firmware and ROS 2 nodes — used for low-latency control loops, hardware register access, and performance-critical robotics algorithms.',
      usedIn: ['amr-leader-follower', 'stm32-line-follower'],
      example: 'Wrote a sub-1ms PID control loop in embedded C on STM32 — required careful loop timing and interrupt-driven ADC reads to maintain stability at high speeds.'
    },
    python: {
      name: 'Python',
      level: 'Intermediate',
      what: 'Primary scripting and ROS 2 node language — used for state machines, data pipelines, WebSocket servers, and rapid prototyping of control logic.',
      usedIn: ['cafe-butler', 'amr-leader-follower', 'mecanum-bot', 'two-wheel-bot'],
      example: 'Implemented a 7-state FSM with action clients for the café butler — each state handles Nav2 goal sending, waiting on feedback, and branching on success/failure/timeout.'
    },
    rust: {
      name: 'Rust',
      level: 'Intermediate',
      what: 'Systems language with compile-time memory safety — used for building network-level tooling where both performance and reliability under concurrent access are required.',
      usedIn: ['roboshield'],
      example: 'Wrote the RoboShield v2 gateway and GUI console in Rust on rclrs: the rule engine checks a 6-joint command in 1.37 µs median, 7x faster than the Python version. Earlier, v1 used Rust for RTPS packet capture and parsing.'
    },
    bash: {
      name: 'Bash Scripting',
      level: 'Intermediate',
      what: 'Linux shell automation — used for ROS 2 launch scripts, workspace setup, deployment pipelines, and environment configuration.',
      usedIn: ['amr-leader-follower', 'cafe-butler'],
      example: 'Wrote launch scripts that source ROS 2 workspace overlays, set ROS_DOMAIN_ID, and start the full nav stack in the correct dependency order — avoids manual sequencing every session.'
    },
    codesys: {
      name: 'CODESYS Ladder Logic',
      level: 'Intermediate',
      what: 'IEC 61131-3 standard PLC programming environment — used to write industrial motor control logic in Ladder Diagram, Function Block, and Structured Text languages.',
      usedIn: ['motor-control-plc'],
      example: 'Designed a motor control program with start/stop latching using seal-in logic, NC emergency-stop override, and TON timer-based activation — structured around real PLC safety conventions, not just simulation.'
    },
    stm32: {
      name: 'STM32 & ARM Cortex-M',
      level: 'Intermediate',
      what: 'ARM Cortex-M microcontroller family — used for real-time embedded firmware where deterministic timing and hardware peripheral access matter.',
      usedIn: ['stm32-line-follower'],
      example: 'Implemented a PID loop that runs under 1ms per tick using timer interrupts and DMA-triggered ADC reads — loop jitter was visible in the robot behaviour before fixing the interrupt priorities.'
    },
    esp32: {
      name: 'ESP32 & Raspberry Pi',
      level: 'Intermediate',
      what: 'IoT microcontroller (ESP32) and Linux SBC (Raspberry Pi) — used for sensor integration, wireless communication, and lightweight compute at the edge.',
      usedIn: ['temp-sensor-pcb'],
      example: 'Designed the ESP32 footprint and UART programming header on the temperature sensor PCB — routed power and signal traces separately to avoid noise coupling from the switching regulator.'
    },
    pid: {
      name: 'PID Control Tuning',
      level: 'Intermediate',
      what: 'Proportional-Integral-Derivative control — the standard closed-loop feedback algorithm used to drive a system toward a target while minimizing error, overshoot, and oscillation.',
      usedIn: ['stm32-line-follower'],
      example: 'Tuned Kp, Ki, Kd on a physical line follower by observing oscillation patterns at increasing speeds — the derivative term was the critical addition that damped the sensor-noise-induced instability.'
    },
    protocols: {
      name: 'UART, I2C, SPI, CAN',
      level: 'Intermediate',
      what: 'Embedded serial communication protocols — used to interface microcontrollers with sensors, motor drivers, displays, and other peripherals at the hardware level.',
      usedIn: ['stm32-line-follower', 'temp-sensor-pcb'],
      example: 'Used I2C to read a 6-DOF IMU on the STM32 platform — had to handle clock stretching and address conflicts before the sensor data was reliable enough for control input.'
    },
    sensors: {
      name: 'Sensors & Instrumentation',
      level: 'Intermediate',
      what: 'Integration of LiDAR, IMU, encoders, and analog sensors into robotics systems — covers hardware interfacing, calibration, and ROS 2 driver configuration.',
      usedIn: ['cafe-butler', 'amr-leader-follower', 'stm32-line-follower'],
      example: 'Integrated dual LiDAR plugins (standard + low-plane) in Gazebo for the café butler — required careful coordinate frame alignment in the URDF to avoid the nav stack treating the second LiDAR scan as phantom obstacles.'
    },
    solidworks: {
      name: 'SolidWorks / Fusion 360',
      level: 'Intermediate',
      what: '3D CAD tools — used to model robot chassis, motor mounts, and mechanical assemblies before fabrication or simulation.',
      usedIn: [],
      example: 'Designed mounting assemblies for JAKA cobots at Robonetics — components were modeled and verified for clearance in SolidWorks before any physical assembly.'
    },
    easyeda: {
      name: 'EasyEDA / KiCad (PCB Layout)',
      level: 'Intermediate',
      what: 'PCB design tools — used for schematic capture, component placement, trace routing, and generating Gerber files for fabrication.',
      usedIn: ['temp-sensor-pcb'],
      example: 'Designed a 2-layer board with the AMS1117 regulator, LM35 sensor, and USB power input — separated analog and digital ground planes to reduce ADC noise, and added a thermal pad after noticing the regulator ran hot under load.'
    },
    linux: {
      name: 'Linux (Ubuntu / Hyprland)',
      level: 'Intermediate',
      what: 'Primary development OS — Ubuntu 24.04 with a custom Hyprland tiling WM configuration optimized for low idle RAM overhead during heavy ROS 2 and Gazebo workloads.',
      usedIn: ['amr-leader-follower', 'cafe-butler', 'roboshield'],
      example: 'Tuned the workstation to ~600MB idle RAM — necessary to leave enough headroom for Gazebo Harmonic simulations that routinely push 8GB+ under full nav stack load.'
    },
    docker: {
      name: 'Docker & Git Workflow',
      level: 'Intermediate',
      what: 'Containerization (Docker) and version control (Git) — used to isolate ROS 2 environments, manage dependency conflicts between ROS distributions, and maintain reproducible builds.',
      usedIn: ['roboshield'],
      example: 'Discovered that RoboShield v1 packet capture broke in Docker bridge networking — the bridge MTU and shared-memory RTPS transport behaved differently from the host network, a silent failure that only appeared under container deployment.'
    },
    stm32ide: {
      name: 'STM32CubeIDE & CODESYS',
      level: 'Intermediate',
      what: 'Development environments for embedded (STM32CubeIDE with HAL/LL libraries) and industrial PLC (CODESYS runtime and simulator) programming.',
      usedIn: ['stm32-line-follower', 'motor-control-plc'],
      example: 'Used STM32CubeIDE debugger to step through the PID loop and catch a timer overflow bug that caused the derivative term to spike every 65536 ticks — invisible without live register inspection.'
    }
  };

  const PROJECTS = {
    'amr-leader-follower': {
      title: 'AMR Leader-Follower Robot System',
      badge: 'Swarm & AMRs',
      summary: 'Multi-robot formation control with Nav2, AMCL, and a custom C++ breadcrumb pure-pursuit follower with potential-field obstacle avoidance.',
      problem: 'Leader-follower AMR formation requires the follower to track a moving target whose position is estimated through sensor fusion — it breaks differently than single-robot navigation because the localization error compounds across two independent stacks.',
      built: 'Leader robot runs the full Nav2 stack with SLAM. Follower localizes against the shared map with AMCL and runs a custom C++ controller: lookahead pure pursuit along a breadcrumb trail of the leader\'s TF poses, plus repulsive/tangential potential-field obstacle avoidance from its own LiDAR. EKF sensor fusion (robot_localization) smooths the follower\'s wheel odometry. Web dashboard provides live telemetry via rosbridge WebSocket.',
      broke: 'The follower kept losing localization on sharp turns — its AMCL particle filter was tuned too tight for the odometry drift it was actually seeing. Retuned the covariance model around real sensor noise instead of simulation defaults, and now validate localization tuning against physical drift patterns before any integration test.',
      skills: ['ros2', 'nav2', 'slam', 'cpp', 'python', 'sensors', 'linux'],
      repo: 'https://github.com/Amin-Ahmed-G/amr_leader_follower',
      video: 'videos/amr_leader_follower.mp4'
    },
    'cafe-butler': {
      title: 'Café Butler — Autonomous Multi-Table Delivery System',
      badge: 'Autonomous Delivery',
      summary: 'FSM-driven delivery robot that navigates a café, collects orders from the kitchen, and routes them to multiple tables.',
      problem: 'Multi-stop delivery requires sequencing navigation goals, handling mid-delivery failures, and recovering without manual intervention — single-goal nav stack wrappers break down as soon as the task graph has more than one node.',
      built: '7-state Python FSM drives the entire task lifecycle: IDLE → MOVE_TO_KITCHEN → COLLECT_ORDER → MOVE_TO_TABLE → DELIVER_ORDER → RETURN_TO_HOME → ERROR. Nav2 stack with AMCL handles localization. Nearest-neighbour route optimisation minimises travel distance. Dual LiDAR with keepout costmaps handles obstacle avoidance. Live WebSocket dashboard shows FSM state and delivery metrics in real time.',
      broke: 'The robot could hang indefinitely mid-delivery if a kitchen confirmation signal was missed — there was no timeout built into that state. Added a timeout-and-retry path before escalating to an error state, which is now the default pattern I build into every state machine from day one.',
      skills: ['ros2', 'nav2', 'python', 'gazebo', 'sensors', 'bash', 'linux'],
      repo: 'https://github.com/Amin-Ahmed-G/cafe-butler-robot',
      video: 'videos/cafe_butler_robot.mp4'
    },
    'roboshield': {
      title: 'RoboShield v2: ROS 2 Robot Command Firewall',
      badge: 'Robot Security',
      summary: 'Inline gateway that inspects every command before it reaches the robot, and clamps, drops, or locks down.',
      problem: 'Most ROS 2 robots trust every message on the network: anything that can publish to /joint_commands can move the arm, whether it is a buggy script, a typo, or someone else on the WiFi. SROS2 controls who can talk, but nothing checks what they say before the robot acts on it.',
      built: 'A gateway board (a NanoPi in my setup) joins two ROS 2 domains in one process: the laptop on domain 10 over WiFi with SROS2 enforced, the robot on domain 20 over its own Ethernet, with ip_forward off and a default-drop nftables ruleset. Each command is checked for schema and joint names, NaN/inf, per-joint position/velocity/effort limits (clamped), step jumps, token-bucket rate limits, and stale or replayed stamps. Repeated incidents trigger LOCKDOWN until an operator re-arms, and it boots locked. The Rust gateway checks each message\'s publisher and drops non-allowlisted nodes one by one, so the real operator keeps control during spoofing. Incidents are tagged with MITRE ATT&CK for ICS and can stream as CEF/JSON syslog to a SIEM. A Rust GUI console turns every debug command into a button and runs an 8-attack self-test. Measured on a laptop: 1.37 µs per 6-joint rule check, +0.5 ms median end-to-end, 8/8 attacks caught, flood to lockdown in about 10 ms. v1 was a passive RTPS packet watchdog in Rust (kept on the roboshield-v1-nids branch).',
      broke: 'rclrs exposed no endpoint GID, so the gateway could not tell which node sent a given message and spoofed commands could not be dropped individually. I vendored rclrs 0.7.0 with a one-field patch to map publisher GIDs to node names. That exposed a discovery race: a message can arrive before its node info, showing up as _NODE_NAME_UNKNOWN_. The gateway now fails closed with a 2 s grace period before raising an alarm.',
      skills: ['rust', 'ros2', 'python', 'linux'],
      repo: 'https://github.com/Amin-Ahmed-G/robotshield',
      gallery: [
        { src: 'images/roboshield/attack_timeline.webp', alt: 'Attack timeline: an overreach attack is clamped at the joint limit, then a 600 msg/s flood triggers lockdown and zero messages reach the robot' },
        { src: 'images/roboshield/v1_vs_v2.webp', alt: 'Comparison of RoboShield v1, a passive network tap, with v2, an inline firewall that clamps, drops or locks down' },
        { src: 'images/roboshield/selftest.webp', alt: 'Console self-test: 8 of 8 attack types detected, maximum robot position 1.000 rad against a 1.0 rad limit' },
        { src: 'images/roboshield/latency.webp', alt: 'Median command latency: 0.60 ms with no firewall, 1.12 ms through the Rust gateway, 1.56 ms through Python' }
      ]
    },
    'two-wheel-bot': {
      title: 'Two-Wheel Differential Bot',
      badge: 'Simulation',
      summary: 'Autonomous differential drive robot with LiDAR and camera, built to validate navigation logic across drive kinematics.',
      problem: 'A navigation stack tuned for one robot platform often hides assumptions about kinematics, sensor placement, and TF frames that aren\'t obvious until you run it on a different platform.',
      built: 'Differential drive robot in ROS 2 (Humble / Jazzy) / Gazebo Harmonic. Joint state broadcaster, diff_drive_controller via gz_ros2_control, 360° LiDAR plugin, and camera plugin. SLAM Toolbox builds the map, Nav2 handles navigation, and a Python node republishes the map→base_footprint transform as a /robot_pose topic.',
      broke: 'The navigation stack lost position without any warning when the drive controller reset odometry without republishing the transform. Added a watchdog that flags stale transforms immediately instead of letting navigation fail silently — a small addition that prevents a very hard-to-diagnose bug.',
      skills: ['ros2', 'gazebo', 'nav2', 'slam', 'python', 'linux'],
      repo: 'https://github.com/Amin-Ahmed-G/two_wheel_robot',
      video: 'videos/two_wheel_robot.mp4'
    },
    'mecanum-bot': {
      title: 'Mecanum Bot Simulator',
      badge: 'Simulation',
      summary: '4-wheel holonomic drive robot simulation with SLAM Toolbox mapping and scripted waypoint driving.',
      problem: 'Holonomic drive kinematics (the ability to move laterally) introduces odometry drift patterns that standard differential-drive models don\'t capture — SLAM and localisation break if you ignore this.',
      built: '4-wheel mecanum drive robot in ROS 2 (Humble / Jazzy) / Gazebo Harmonic. The ros2_control mecanum_drive_controller (via gz_ros2_control) handles wheel kinematics. SLAM Toolbox builds the map, saved with nav2_map_server. A Python waypoint follower drives the robot through holonomic paths using the controller\'s odometry feedback.',
      broke: 'SLAM produced distorted maps because the odometry model didn\'t account for the sideways drift a holonomic drive introduces. Rebuilt the odometry around a model that actually reflects mecanum kinematics rather than treating it like a standard differential drive.',
      skills: ['ros2', 'gazebo', 'slam', 'python'],
      repo: 'https://github.com/Amin-Ahmed-G/mecanum_bot'
    },
    'stm32-line-follower': {
      title: 'STM32 Line Follower Robot',
      badge: 'Hardware',
      summary: 'Physical differential robot with STM32 microcontroller, PID control, and high-speed sensor fusion.',
      problem: 'Line following at speed requires sensor reads and control output within a hard real-time budget — software delays that are invisible at low speed cause visible instability at high speed.',
      built: 'STM32 ARM Cortex-M microcontroller with a custom sensor array. Interrupt-driven ADC reads via DMA for minimal latency. PID motor control loop running under 1ms per tick. Dual H-bridge motor drivers with encoder feedback. Competed in university line-follower race.',
      broke: 'Sensor cross-talk at higher speeds introduced enough noise to destabilize the control loop. Added a moving-average filter ahead of the control calculation — a one-line fix that took real testing at speed to catch.',
      skills: ['cpp', 'stm32', 'pid', 'protocols', 'sensors', 'stm32ide']
    },
    'temp-sensor-pcb': {
      title: 'Temperature Sensor PCB',
      badge: 'Hardware Design',
      summary: 'Custom 2-layer PCB with ESP32, LM35 sensor, AMS1117 regulator, USB power — fabrication-ready Gerbers.',
      problem: 'Purpose-built sensor hardware that fits a specific form factor, power budget, and interface requirement can\'t be solved with a dev board — it requires going through the full design-to-fabrication loop.',
      built: 'Designed in EasyEDA: ESP32 module footprint, AMS1117-3.3 linear regulator with appropriate decoupling caps, LM35 analog temperature sensor with ADC routing, USB Type-A power input with filtering, UART programming header. Separated analog and digital ground planes. Generated fabrication-ready Gerber files for JLCPCB.',
      broke: 'The voltage regulator ran hotter than expected under USB power because the thermal pad was undersized. Now runs a thermal simulation before finalising any board layout, instead of catching it after fabrication.',
      skills: ['esp32', 'easyeda', 'protocols'],
      repo: 'https://github.com/Amin-Ahmed-G/temp-sensor-pcb'
    },
    'motor-control-plc': {
      title: 'CODESYS Motor Control PLC',
      badge: 'Automation',
      summary: 'Industrial motor control in PLC Ladder Logic — latching, emergency stop, timer-based activation.',
      problem: 'Industrial PLC programs must handle real-world failure modes (power loss, stuck contactors, operator intervention) through deterministic logic — the same control logic that runs safety-critical machinery.',
      built: 'Written in CODESYS Ladder Diagram following IEC 61131-3 conventions. Start/stop latching with seal-in logic. Normally-closed emergency stop with override. TON timer-based activation sequences. Structured to match industrial commissioning practice, not just simulator defaults.',
      broke: null, // no specific debug story for PLC — honest
      skills: ['codesys', 'stm32ide'],
      repo: 'https://github.com/Amin-Ahmed-G/motor-control-plc'
    }
  };

  /* =========================================================================
     2. SLIDE-IN DETAIL PANEL SYSTEM
     ========================================================================= */
  let panelTriggerEl = null;

  function createPanelDOM() {
    const backdrop = document.createElement('div');
    backdrop.id = 'detail-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const panel = document.createElement('aside');
    panel.id = 'detail-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'detail-panel-title');
    panel.setAttribute('tabindex', '-1');

    panel.innerHTML = `
      <div class="detail-panel-inner">
        <button class="detail-close-btn" id="detail-close-btn" aria-label="Close panel">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div id="detail-panel-content"></div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    backdrop.addEventListener('click', closePanel);
    document.getElementById('detail-close-btn').addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
      if (panel.classList.contains('open')) trapFocus(e, panel);
    });

    return { backdrop, panel };
  }

  function trapFocus(e, container) {
    if (e.key !== 'Tab') return;
    const focusable = container.querySelectorAll('a,button,input,[tabindex]:not([tabindex="-1"])');
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }

  const { backdrop: panelBackdrop, panel: detailPanel } = createPanelDOM();
  const detailContent = document.getElementById('detail-panel-content');

  function openPanel(type, id) {
    const content = type === 'skill' ? renderSkillPanel(id) : renderProjectPanel(id);
    if (!content) return;
    detailContent.innerHTML = content;
    panelBackdrop.classList.add('active');
    detailPanel.classList.add('open');
    document.body.classList.add('panel-open');
    detailPanel.focus();
    history.pushState({ panel: type, id }, '', `#${type}/${id}`);
    attachPanelLinks();
    bindRosGraph(detailContent);
  }

  function closePanel(restoreHistory) {
    panelBackdrop.classList.remove('active');
    detailPanel.classList.remove('open');
    document.body.classList.remove('panel-open');
    if (panelTriggerEl) panelTriggerEl.focus();
    if (history.state && history.state.panel) history.pushState({}, '', window.location.pathname);
  }

  function attachPanelLinks() {
    detailContent.querySelectorAll('[data-open-skill]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openPanel('skill', el.dataset.openSkill);
      });
    });
    detailContent.querySelectorAll('[data-open-project]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openPanel('project', el.dataset.openProject);
      });
    });
  }

  // Handle browser back button
  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.panel) {
      openPanel(e.state.panel, e.state.id);
    } else {
      panelBackdrop.classList.remove('active');
      detailPanel.classList.remove('open');
      document.body.classList.remove('panel-open');
    }
  });

  // Deep-link on page load
  (function () {
    const hash = window.location.hash;
    const m = hash.match(/^#(skill|project)\/(.+)$/);
    if (m) setTimeout(() => openPanel(m[1], m[2]), 400);
  })();

  /* =========================================================================
     3. PANEL RENDER TEMPLATES
     ========================================================================= */
  function skillTag(id) {
    const s = SKILLS[id];
    if (!s) return '';
    return `<button class="panel-tag clickable" data-open-skill="${id}" title="Open ${s.name} detail">${s.name}</button>`;
  }

  function projectTag(id) {
    const p = PROJECTS[id];
    if (!p) return '';
    return `<button class="panel-tag clickable project-tag" data-open-project="${id}" title="Open ${p.title} detail">${p.title}</button>`;
  }

  function renderSkillPanel(id) {
    const s = SKILLS[id];
    if (!s) return null;
    const usedInTags = s.usedIn.map(projectTag).join('');
    return `
      <div class="panel-category-badge">SKILL</div>
      <h2 id="detail-panel-title" class="panel-title">${s.name}</h2>
      <span class="panel-level-badge level-${s.level.toLowerCase()}">${s.level}</span>

      <div class="panel-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-circle-info"></i> What it is</h3>
        <p class="panel-body-text">${s.what}</p>
      </div>

      <div class="panel-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-code-branch"></i> Where I've used it</h3>
        ${usedInTags || '<p class="panel-body-text panel-muted">Primarily studied / coursework — not yet in a shipped project.</p>'}
      </div>

      <div class="panel-section panel-example-box">
        <h3 class="panel-section-title"><i class="fa-solid fa-terminal"></i> Concrete example</h3>
        <p class="panel-body-text">${s.example}</p>
      </div>
    `;
  }

  function renderProjectPanel(id) {
    const p = PROJECTS[id];
    if (!p) return null;
    const skillTags = p.skills.map(skillTag).join('');
    const repoLink = p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener noreferrer" class="panel-action-btn"><i class="fa-brands fa-github"></i> GitHub Repo</a>` : '';
    const brokeSection = p.broke ? `
      <div class="panel-section panel-broke-box">
        <h3 class="panel-section-title"><i class="fa-solid fa-bug"></i> What broke</h3>
        <p class="panel-body-text">${p.broke}</p>
      </div>` : '';

    return `
      <div class="panel-category-badge project-badge-label">${p.badge}</div>
      <h2 id="detail-panel-title" class="panel-title">${p.title}</h2>
      <p class="panel-summary">${p.summary}</p>

      <div class="panel-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-crosshairs"></i> The problem</h3>
        <p class="panel-body-text">${p.problem}</p>
      </div>

      <div class="panel-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-screwdriver-wrench"></i> What I built</h3>
        <p class="panel-body-text">${p.built}</p>
      </div>

      ${brokeSection}

      ${rosGraphSection(p, id)}

      ${gallerySection(p)}

      <div class="panel-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-tags"></i> Skills used</h3>
        <div class="panel-tags-row">${skillTags}</div>
      </div>

      <div class="panel-actions">${repoLink}</div>
    `;
  }

  /* =========================================================================
     4. WIRE UP CLICKABLE SKILLS & PROJECTS
     ========================================================================= */
  function attachDataTriggers() {
    document.querySelectorAll('[data-skill-id]').forEach(el => {
      el.classList.add('skill-clickable');
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Open detail for ${el.dataset.skillId}`);
      el.addEventListener('click', function () {
        panelTriggerEl = el;
        openPanel('skill', el.dataset.skillId);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });

    document.querySelectorAll('[data-project-id]').forEach(el => {
      el.classList.add('project-clickable');
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Open detail for ${el.dataset.projectId}`);
      el.addEventListener('click', function () {
        panelTriggerEl = el;
        openPanel('project', el.dataset.projectId);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
  }
  attachDataTriggers();

  /* =========================================================================
     5. PROJECT CARD — 3D TILT + DEBUG DRAWER
     ========================================================================= */
  document.querySelectorAll('.project-card').forEach(card => {
    let tapOpen = false;

    // 3D tilt on mousemove
    card.addEventListener('mousemove', function (e) {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = -dy * 6;
      const rotY = dx * 6;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      if (tapOpen) { card.classList.remove('drawer-open'); tapOpen = false; }
    });

    card.addEventListener('mouseenter', function () {
      card.classList.add('drawer-open');
    });

    // Mobile tap toggle
    card.addEventListener('touchend', function (e) {
      const drawer = card.querySelector('.project-debug-drawer');
      if (!drawer) return;
      if (!tapOpen) {
        e.preventDefault();
        card.classList.add('drawer-open');
        tapOpen = true;
      }
    }, { passive: false });
  });

  /* =========================================================================
     6. SKILLS PROGRESS BARS — INTERSECTIONOBSERVER
     ========================================================================= */
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  if (skillBars.length) {
    const barObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bars = entry.target.querySelectorAll('.skill-bar-fill');
          bars.forEach((bar, i) => {
            setTimeout(() => {
              bar.style.width = (bar.dataset.pct || '60') + '%';
            }, i * 60);
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const skillsSection = document.getElementById('skills');
    if (skillsSection) barObserver.observe(skillsSection);
  }

  /* =========================================================================
     7. FSM VISUALIZER
     ========================================================================= */
  const fsmSection = document.getElementById('fsm-viz-panel');
  if (fsmSection) {
    initFSMViz();
  }

  function initFSMViz() {
    const STATES = [
      { id: 'IDLE', label: 'IDLE', x: 160, y: 60 },
      { id: 'MOVE_TO_KITCHEN', label: 'MOVE_TO\nKITCHEN', x: 320, y: 60 },
      { id: 'COLLECT_ORDER', label: 'COLLECT\nORDER', x: 480, y: 60 },
      { id: 'MOVE_TO_TABLE', label: 'MOVE_TO\nTABLE', x: 480, y: 180 },
      { id: 'DELIVER_ORDER', label: 'DELIVER\nORDER', x: 320, y: 180 },
      { id: 'RETURN_TO_HOME', label: 'RETURN\nHOME', x: 160, y: 180 },
      { id: 'ERROR', label: 'ERROR', x: 320, y: 300 }
    ];
    const TRANSITIONS = [
      { from: 'IDLE', to: 'MOVE_TO_KITCHEN', label: 'order recv' },
      { from: 'MOVE_TO_KITCHEN', to: 'COLLECT_ORDER', label: 'arrived' },
      { from: 'COLLECT_ORDER', to: 'MOVE_TO_TABLE', label: 'confirmed' },
      { from: 'MOVE_TO_TABLE', to: 'DELIVER_ORDER', label: 'arrived' },
      { from: 'DELIVER_ORDER', to: 'MOVE_TO_TABLE', label: 'next table' },
      { from: 'DELIVER_ORDER', to: 'RETURN_TO_HOME', label: 'all done' },
      { from: 'RETURN_TO_HOME', to: 'IDLE', label: 'home' },
      { from: 'COLLECT_ORDER', to: 'ERROR', label: 'timeout×2' },
      { from: 'DELIVER_ORDER', to: 'ERROR', label: 'timeout×2' },
      { from: 'ERROR', to: 'IDLE', label: 'recovered' }
    ];

    const svg = document.getElementById('fsm-svg');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const R = 36;

    // Draw edges first
    TRANSITIONS.forEach(t => {
      const from = STATES.find(s => s.id === t.from);
      const to = STATES.find(s => s.id === t.to);
      if (!from || !to) return;

      const g = document.createElementNS(NS, 'g');
      g.classList.add('fsm-edge');
      g.dataset.from = t.from;
      g.dataset.to = t.to;

      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;

      const x1 = from.x + ux * R, y1 = from.y + uy * R;
      const x2 = to.x - ux * R, y2 = to.y - uy * R;

      // Curved offset for self-loops and parallel edges
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const perp = { x: -uy * 22, y: ux * 22 };

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${x1},${y1} Q${mx + perp.x},${my + perp.y} ${x2},${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('class', 'fsm-path');
      path.setAttribute('marker-end', 'url(#fsm-arrow)');

      const labelEl = document.createElementNS(NS, 'text');
      labelEl.setAttribute('x', mx + perp.x * 0.5);
      labelEl.setAttribute('y', my + perp.y * 0.5 - 4);
      labelEl.setAttribute('class', 'fsm-edge-label');
      labelEl.textContent = t.label;

      g.appendChild(path);
      g.appendChild(labelEl);
      svg.appendChild(g);

      g.addEventListener('click', () => {
        triggerTransition(t.from, t.to, t.label);
      });
    });

    // Draw nodes
    STATES.forEach(s => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('fsm-node');
      g.dataset.id = s.id;

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', s.x);
      circle.setAttribute('cy', s.y);
      circle.setAttribute('r', R);
      circle.setAttribute('class', 'fsm-circle');
      if (s.id === 'ERROR') circle.classList.add('fsm-error');

      const lines = s.label.split('\n');
      lines.forEach((line, i) => {
        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', s.x);
        text.setAttribute('y', s.y + (i - (lines.length - 1) / 2) * 13);
        text.setAttribute('class', 'fsm-label');
        text.textContent = line;
        g.appendChild(text);
      });

      g.insertBefore(circle, g.firstChild);
      svg.insertBefore(g, svg.firstChild);

      g.addEventListener('click', () => {
        activateState(s.id);
      });
    });

    // Set initial active state
    let currentState = 'IDLE';
    activateState('IDLE');

    function activateState(id) {
      currentState = id;
      document.querySelectorAll('.fsm-node').forEach(n => {
        n.classList.toggle('fsm-active', n.dataset.id === id);
      });
    }

    function triggerTransition(fromId, toId, label) {
      if (currentState !== fromId) {
        activateState(fromId);
        setTimeout(() => doTransition(fromId, toId, label), 300);
      } else {
        doTransition(fromId, toId, label);
      }
    }

    function doTransition(fromId, toId, label) {
      const edge = document.querySelector(`.fsm-edge[data-from="${fromId}"][data-to="${toId}"]`);
      if (edge) {
        edge.classList.add('fsm-edge-active');
        setTimeout(() => edge.classList.remove('fsm-edge-active'), 600);
      }
      setTimeout(() => activateState(toId), 300);
      appendLog(`[FSM] Transition: ${fromId} → ${toId} | trigger: ${label}`);
      moveRobotDot(toId);
    }

    // FSM log
    const fsmLog = document.getElementById('fsm-log');
    function appendLog(msg) {
      if (!fsmLog) return;
      const line = document.createElement('div');
      line.className = 'fsm-log-line';
      line.textContent = `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] ${msg}`;
      fsmLog.appendChild(line);
      fsmLog.scrollTop = fsmLog.scrollHeight;
    }

    // Canvas robot dot
    const canvas = document.getElementById('fsm-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const waypoints = {
        IDLE: { x: 40, y: 100 },
        MOVE_TO_KITCHEN: { x: 140, y: 100 },
        COLLECT_ORDER: { x: 220, y: 100 },
        MOVE_TO_TABLE: { x: 220, y: 55 },
        DELIVER_ORDER: { x: 140, y: 55 },
        RETURN_TO_HOME: { x: 40, y: 55 },
        ERROR: { x: 130, y: 145 }
      };
      const labels = {
        IDLE: 'Base', MOVE_TO_KITCHEN: 'Kitchen', COLLECT_ORDER: 'Kitchen',
        MOVE_TO_TABLE: 'Table', DELIVER_ORDER: 'Table', RETURN_TO_HOME: 'Base', ERROR: '⚠'
      };

      let robotPos = { ...waypoints['IDLE'] };
      let targetPos = { ...waypoints['IDLE'] };
      let animFrame;

      function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw waypoints
        Object.entries({ Base: { x: 40, y: 75 }, Kitchen: { x: 220, y: 75 }, 'Table 1': { x: 140, y: 30 }, 'Table 2': { x: 140, y: 75 }, 'Table 3': { x: 140, y: 120 } }).forEach(([name, pos]) => {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(82,214,138,0.1)';
          ctx.strokeStyle = 'rgba(82,214,138,0.4)';
          ctx.lineWidth = 1;
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(148,163,184,0.8)';
          ctx.font = '9px Geist Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(name, pos.x, pos.y + 20);
        });

        // Robot dot
        robotPos.x += (targetPos.x - robotPos.x) * 0.08;
        robotPos.y += (targetPos.y - robotPos.y) * 0.08;
        ctx.beginPath();
        ctx.arc(robotPos.x, robotPos.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#52d68a';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#52d68a';
        ctx.fill();
        ctx.shadowBlur = 0;

        animFrame = requestAnimationFrame(drawCanvas);
      }
      drawCanvas();

      window.addEventListener('beforeunload', () => cancelAnimationFrame(animFrame));

      window._moveFSMDot = function (stateId) {
        const wp = waypoints[stateId];
        if (wp) targetPos = { ...wp };
      };
    }

    function moveRobotDot(stateId) {
      if (window._moveFSMDot) window._moveFSMDot(stateId);
    }

    // Auto-run demo sequence
    const autoBtn = document.getElementById('fsm-auto-btn');
    if (autoBtn) {
      let autoSeq = null;
      const sequence = [
        ['IDLE', 'MOVE_TO_KITCHEN', 'order recv'],
        ['MOVE_TO_KITCHEN', 'COLLECT_ORDER', 'arrived'],
        ['COLLECT_ORDER', 'MOVE_TO_TABLE', 'confirmed'],
        ['MOVE_TO_TABLE', 'DELIVER_ORDER', 'arrived'],
        ['DELIVER_ORDER', 'RETURN_TO_HOME', 'all done'],
        ['RETURN_TO_HOME', 'IDLE', 'home']
      ];
      autoBtn.addEventListener('click', function () {
        clearTimeout(autoSeq);
        activateState('IDLE');
        sequence.forEach(([from, to, label], i) => {
          setTimeout(() => triggerTransition(from, to, label), (i + 1) * 1200);
        });
      });
    }
  }

  /* =========================================================================
     8. TERMINAL ENHANCEMENTS — WHOAMI TYPEWRITER + TAB COMPLETE + MATRIX
     ========================================================================= */
  const terminalScreen = document.getElementById('terminal-screen');
  const terminalInput = document.getElementById('terminal-input');

  if (terminalInput && terminalScreen) {

    // Typewriter helper
    function typeWriter(text, className, onDone) {
      const div = document.createElement('div');
      div.className = className || 'cmd-out';
      terminalScreen.appendChild(div);
      let i = 0;
      function nextChar() {
        if (i < text.length) {
          div.textContent += text[i++];
          terminalScreen.scrollTop = terminalScreen.scrollHeight;
          setTimeout(nextChar, 28);
        } else if (onDone) onDone();
      }
      nextChar();
    }

    // Expose whoami to terminal.js command handler
    window.TERMINAL_EXTRAS = {
      whoami: function () {
        const bio = 'Amin Ahmed G — Robotics & Automation Engineer, Anna University.\nBuilding ROS 2 navigation stacks, DDS/RTPS security tooling, and IEC 61131-3 PLC programs. Open to robotics software and ICS security roles.';
        typeWriter(bio, 'cmd-out typewriter-out');
      },
      matrix: function () {
        triggerMatrix();
      },
      openProject: function (id) {
        openPanel('project', id);
      }
    };

    // Tab completion
    terminalInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const raw = terminalInput.value;
      // Complete file paths for shell commands (e.g. 'cat proj' -> 'cat projects/')
      const m = raw.match(/^(ls|cd|cat|tree|open)\s+(.*)$/);
      if (m && window.TERMINAL_FS) {
        const opts = window.TERMINAL_FS.complete(m[2]);
        if (opts.length === 1) terminalInput.value = `${m[1]} ${opts[0]}`;
        else if (opts.length > 1) terminalInput.value = `${m[1]} ${longestCommonPrefix(opts)}`;
        return;
      }
      const val = raw.trim().toLowerCase();
      if (!val) return;
      const CMDS = ['help', 'whoami', 'ros2', 'cafe-launch', 'fsm', 'tf', 'metrics',
        'skills', 'projects', 'contact', 'about', 'diagnostics', 'clear', 'pid',
        'karthikesh', 'call', 'matrix', 'sudo', 'colcon build', 'ros2 node list',
        'ros2 topic list', 'ros2 topic echo /scan', 'ros2 action list', 'ros2 pkg list', 'ros2 launch ',
        'ls', 'cd ', 'pwd', 'cat ', 'tree', 'echo ', 'date', 'uname -a', 'hostname', 'uptime', 'history', 'neofetch', 'open '];
      const matches = CMDS.filter(c => c.startsWith(val));
      if (matches.length === 1) {
        terminalInput.value = matches[0];
      } else if (matches.length > 1) {
        const common = longestCommonPrefix(matches);
        terminalInput.value = common;
      }
    });

    function longestCommonPrefix(strs) {
      if (!strs.length) return '';
      let prefix = strs[0];
      for (let i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) !== 0) prefix = prefix.slice(0, -1);
      }
      return prefix;
    }
  }

  // Matrix rain effect
  function triggerMatrix() {
    const overlay = document.createElement('div');
    overlay.id = 'matrix-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.appendChild(canvas);

    const msg = document.createElement('div');
    msg.className = 'matrix-msg';
    msg.textContent = '[ PERMISSION GRANTED ]';
    overlay.appendChild(msg);

    document.body.appendChild(overlay);

    const ctx = canvas.getContext('2d');
    const cols = Math.floor(canvas.width / 14);
    const drops = Array(cols).fill(1);
    const chars = 'アイウエオカキクケコサシスセソABCDEFGH01234567ΩΔΨ∑∇∈';

    function draw() {
      ctx.fillStyle = 'rgba(23,24,27,0.07)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#52d68a';
      ctx.font = '13px Geist Mono, monospace';
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = i % 3 === 0 ? '#f5b041' : '#52d68a';
        ctx.fillText(char, i * 14, y * 14);
        if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }

    const interval = setInterval(draw, 40);
    setTimeout(() => {
      clearInterval(interval);
      overlay.classList.add('matrix-fade-out');
      setTimeout(() => overlay.remove(), 500);
    }, 2500);

    overlay.addEventListener('click', () => {
      clearInterval(interval);
      overlay.remove();
    });
  }

  /* =========================================================================
     9. BUTTON GLOW MICRO-INTERACTION
     ========================================================================= */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('btn-glow-ready');
  });

  /* =========================================================================
     10. SECTION HEADER FADE-IN (supplement existing scroll-reveal)
     ========================================================================= */
  const headers = document.querySelectorAll('.section-title');
  const headerObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('header-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  headers.forEach(h => { h.classList.add('header-hidden'); headerObs.observe(h); });

  /* =========================================================================
     11. LIVE 12-MONTH CONTRIBUTION HEATMAP (real GitHub data, fetched once)
     ========================================================================= */
  const GH_USER = 'Amin-Ahmed-G';
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Groups a flat day list (oldest first) into Sun-Sat weeks, padding the first week.
  function buildWeeks(days) {
    const weeks = [];
    let week = [];
    const firstDow = new Date(days[0].date + 'T00:00:00').getDay();
    for (let i = 0; i < firstDow; i++) week.push(null);
    days.forEach(day => {
      week.push(day);
      if (week.length === 7) { weeks.push(week); week = []; }
    });
    if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
    return weeks;
  }

  function renderHeatmap(container, days) {
    const weeks = buildWeeks(days);

    const monthSpans = [];
    weeks.forEach(week => {
      const first = week.find(Boolean);
      const m = new Date(first.date + 'T00:00:00').getMonth();
      const last = monthSpans[monthSpans.length - 1];
      if (last && last.month === m) last.span++;
      else monthSpans.push({ month: m, span: 1 });
    });

    let html = '<table role="grid" aria-readonly="true" class="ContributionCalendar-grid">';
    html += '<caption class="sr-only">GitHub contribution graph, last 12 months</caption>';
    html += '<thead><tr><td class="ContributionCalendar-corner"><span class="sr-only">Day of Week</span></td>';
    monthSpans.forEach(ms => {
      // Skip the label on a 1-week sliver so it doesn't collide with its neighbour
      html += `<td class="ContributionCalendar-label" colspan="${ms.span}"><span aria-hidden="true">${ms.span > 1 ? MONTH_NAMES[ms.month] : ''}</span></td>`;
    });
    html += '</tr></thead><tbody>';

    const dayLabels = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };
    for (let d = 0; d < 7; d++) {
      html += `<tr><td class="ContributionCalendar-label"><span aria-hidden="true">${dayLabels[d] || ''}</span></td>`;
      weeks.forEach(week => {
        const cell = week[d];
        if (!cell) { html += '<td class="ContributionCalendar-day is-empty"></td>'; return; }
        const tip = cell.count > 0 ? `${cell.count} contribution${cell.count > 1 ? 's' : ''}` : 'No contributions';
        html += `<td class="ContributionCalendar-day" data-date="${cell.date}" data-level="${cell.level}" data-tip="${tip}"></td>`;
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    container.removeAttribute('aria-busy');
  }

  function renderHeatmapFallback(container) {
    container.innerHTML = `<p class="heatmap-fallback">Live contribution data is unavailable right now. <a href="https://github.com/${GH_USER}" target="_blank" rel="noopener noreferrer">View activity on GitHub →</a></p>`;
    container.removeAttribute('aria-busy');
  }

  function updateHeatmapStat(repos, total) {
    const statElem = document.querySelector('.hud-table-stat');
    if (!statElem) return;
    const parts = [];
    if (repos != null) parts.push(`${repos} Public Repos`);
    if (total != null) parts.push(`${total} Contributions (12 mo)`);
    if (parts.length) statElem.innerHTML = `<i class="fa-brands fa-github"></i> ${parts.join(' &bull; ')}`;
  }

  function initHeatmapTooltip(container) {
    const tooltip = document.createElement('div');
    tooltip.className = 'heatmap-hud-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);

    const hide = () => tooltip.classList.remove('visible');
    container.addEventListener('mouseleave', hide);
    window.addEventListener('scroll', hide, { passive: true });

    // Delegated, so it survives re-renders without re-binding
    container.addEventListener('mouseover', e => {
      const cell = e.target.closest('.ContributionCalendar-day[data-date]');
      if (!cell) { hide(); return; }
      tooltip.innerHTML = `<span class="tip-date">${cell.dataset.date}</span> &bull; ${cell.dataset.tip}`;
      const rect = cell.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 6}px`;
      tooltip.classList.add('visible');
    });
  }

  function initHeatmap() {
    const container = document.querySelector('.github-calendar-container');
    if (!container) return;
    initHeatmapTooltip(container);

    const repoState = { repos: null, total: null };

    fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => {
        if (!data || !Array.isArray(data.contributions) || !data.contributions.length) throw new Error('empty');
        renderHeatmap(container, data.contributions);
        repoState.total = data.total && data.total.lastYear;
        updateHeatmapStat(repoState.repos, repoState.total);
      })
      .catch(() => renderHeatmapFallback(container));

    fetch(`https://api.github.com/users/${GH_USER}`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(user => {
        if (typeof user.public_repos !== 'number') return;
        repoState.repos = user.public_repos;
        const statVal = document.querySelector('.gh-stat-highlight .gh-stat-val');
        if (statVal) statVal.textContent = user.public_repos;
        updateHeatmapStat(repoState.repos, repoState.total);
      })
      .catch(() => {});
  }

  initHeatmap();

  /* =========================================================================
     12. ROS 2 PACKAGE METADATA + rqt_graph-STYLE NODE GRAPHS
     Node/topic names are taken from each repo's launch files and source.
     ========================================================================= */
  const ROS = {
    'amr-leader-follower': {
      distro: 'Jazzy',
      pkgs: ['amr_leader_follower'],
      launch: 'ros2 launch amr_leader_follower leader_follower.launch.py',
      nodes: ['/ros_gz_bridge', '/slam_toolbox', '/leader/bt_navigator', '/leader/diff_drive_controller',
        '/follower/amcl', '/follower/ekf_filter_node', '/follower_controller', '/follower/diff_drive_controller'],
      topics: [
        { name: '/leader/scan', type: 'sensor_msgs/msg/LaserScan', from: ['/ros_gz_bridge'], to: ['/slam_toolbox', '/leader/bt_navigator'] },
        { name: '/leader/diff_drive_controller/odom', type: 'nav_msgs/msg/Odometry', from: ['/leader/diff_drive_controller'], to: ['/leader/bt_navigator'] },
        { name: '/map', type: 'nav_msgs/msg/OccupancyGrid', from: ['/slam_toolbox'], to: ['/follower/amcl'] },
        { name: '/follower/diff_drive_controller/odom', type: 'nav_msgs/msg/Odometry', from: ['/follower/diff_drive_controller'], to: ['/follower/ekf_filter_node'] },
        { name: '/tf', type: 'tf2_msgs/msg/TFMessage', from: ['/follower/amcl', '/follower/ekf_filter_node'], to: ['/follower_controller'] },
        { name: '/follower/scan', type: 'sensor_msgs/msg/LaserScan', from: ['/ros_gz_bridge'], to: ['/follower_controller'] },
        { name: '/follower/diff_drive_controller/cmd_vel', type: 'geometry_msgs/msg/TwistStamped', from: ['/follower_controller'], to: ['/follower/diff_drive_controller'] }
      ],
      actions: []
    },
    'cafe-butler': {
      distro: 'Jazzy',
      pkgs: ['cafe_butler_bringup', 'cafe_butler_description', 'cafe_butler_fsm', 'cafe_butler_metrics', 'cafe_butler_dashboard'],
      launch: 'ros2 launch cafe_butler_bringup full_system.launch.py open_dashboard:=true',
      nodes: ['/ros_gz_bridge', '/map_server', '/amcl', '/rosbridge_websocket', '/cafe_operator_node', '/cafe_butler_fsm',
        '/bt_navigator', '/velocity_smoother', '/cafe_butler_metrics_logger'],
      topics: [
        { name: '/new_order', type: 'std_msgs/msg/String', from: ['/rosbridge_websocket', '/cafe_operator_node'], to: ['/cafe_butler_fsm'] },
        { name: '/kitchen_confirm', type: 'std_msgs/msg/String', from: ['/rosbridge_websocket', '/cafe_operator_node'], to: ['/cafe_butler_fsm'] },
        { name: '/table_confirm', type: 'std_msgs/msg/String', from: ['/rosbridge_websocket', '/cafe_operator_node'], to: ['/cafe_butler_fsm'] },
        { name: '/cancel_order', type: 'std_msgs/msg/String', from: ['/rosbridge_websocket', '/cafe_operator_node'], to: ['/cafe_butler_fsm'] },
        { name: '/fsm_status', type: 'std_msgs/msg/String', from: ['/cafe_butler_fsm'], to: ['/rosbridge_websocket', '/cafe_operator_node'] },
        { name: '/fsm_events', type: 'std_msgs/msg/String', from: ['/cafe_butler_fsm'], to: ['/cafe_butler_metrics_logger'] },
        { name: '/map', type: 'nav_msgs/msg/OccupancyGrid', from: ['/map_server'], to: ['/amcl'] },
        { name: '/scan', type: 'sensor_msgs/msg/LaserScan', from: ['/ros_gz_bridge'], to: ['/amcl', '/bt_navigator'] },
        { name: '/odom', type: 'nav_msgs/msg/Odometry', from: ['/ros_gz_bridge'], to: ['/cafe_butler_fsm', '/cafe_butler_metrics_logger', '/velocity_smoother'] },
        { name: '/amcl_pose', type: 'geometry_msgs/msg/PoseWithCovarianceStamped', from: ['/amcl'], to: ['/rosbridge_websocket'] },
        { name: '/cmd_vel', type: 'geometry_msgs/msg/Twist', from: ['/velocity_smoother', '/cafe_butler_fsm'], to: ['/ros_gz_bridge'] }
      ],
      actions: [
        { name: '/navigate_to_pose', type: 'nav2_msgs/action/NavigateToPose', from: ['/cafe_butler_fsm'], to: ['/bt_navigator'] }
      ]
    },
    'mecanum-bot': {
      distro: 'Jazzy',
      pkgs: ['mecanum_bot'],
      launch: 'ros2 launch mecanum_bot mecanum_sim.launch.py',
      nodes: ['/ros_gz_bridge', '/slam_toolbox', '/waypoint_follower', '/mecanum_drive_controller', '/robot_state_publisher', '/rviz2'],
      topics: [
        { name: '/scan', type: 'sensor_msgs/msg/LaserScan', from: ['/ros_gz_bridge'], to: ['/slam_toolbox', '/rviz2'] },
        { name: '/map', type: 'nav_msgs/msg/OccupancyGrid', from: ['/slam_toolbox'], to: ['/rviz2'] },
        { name: '/mecanum_drive_controller/reference', type: 'geometry_msgs/msg/TwistStamped', from: ['/waypoint_follower'], to: ['/mecanum_drive_controller'] },
        { name: '/mecanum_drive_controller/odometry', type: 'nav_msgs/msg/Odometry', from: ['/mecanum_drive_controller'], to: ['/waypoint_follower'] },
        { name: '/tf', type: 'tf2_msgs/msg/TFMessage', from: ['/robot_state_publisher', '/slam_toolbox'], to: ['/rviz2'] }
      ],
      actions: []
    },
    'two-wheel-bot': {
      distro: 'Jazzy',
      pkgs: ['two_wheel_robot'],
      launch: 'ros2 launch two_wheel_robot two_wheel_navigation.launch.py',
      nodes: ['/ros_gz_bridge', '/slam_toolbox', '/bt_navigator', '/diff_drive_controller', '/tf_to_pose_publisher'],
      topics: [
        { name: '/scan', type: 'sensor_msgs/msg/LaserScan', from: ['/ros_gz_bridge'], to: ['/slam_toolbox', '/bt_navigator'] },
        { name: '/map', type: 'nav_msgs/msg/OccupancyGrid', from: ['/slam_toolbox'], to: ['/bt_navigator'] },
        { name: '/tf', type: 'tf2_msgs/msg/TFMessage', from: ['/slam_toolbox', '/diff_drive_controller'], to: ['/tf_to_pose_publisher'] },
        { name: '/robot_pose', type: 'geometry_msgs/msg/PoseStamped', from: ['/tf_to_pose_publisher'], to: [] },
        { name: '/camera/image_raw', type: 'sensor_msgs/msg/Image', from: ['/ros_gz_bridge'], to: [] }
      ],
      actions: []
    },
    'roboshield': {
      distro: 'Jazzy',
      pkgs: ['monitor_py'],
      launch: 'ros2 launch monitor_py bench.launch.py',
      nodes: ['/attack_sim_node', '/firewall_node', '/robot_sim_node', '/firewall_dashboard'],
      topics: [
        { name: '/joint_commands (domain 10, WiFi)', type: 'sensor_msgs/msg/JointState', from: ['/attack_sim_node'], to: ['/firewall_node'] },
        { name: '/joint_commands (domain 20, robot)', type: 'sensor_msgs/msg/JointState', from: ['/firewall_node'], to: ['/robot_sim_node'] },
        { name: '/joint_states (domain 20, robot)', type: 'sensor_msgs/msg/JointState', from: ['/robot_sim_node'], to: ['/firewall_node'] },
        { name: '/joint_states (domain 10, WiFi)', type: 'sensor_msgs/msg/JointState', from: ['/firewall_node'], to: ['/attack_sim_node'] },
        { name: '/firewall/events', type: 'diagnostic_msgs/msg/DiagnosticStatus', from: ['/firewall_node'], to: ['/firewall_dashboard'] },
        { name: '/firewall/status', type: 'std_msgs/msg/String', from: ['/firewall_node'], to: ['/firewall_dashboard'] }
      ],
      actions: []
    }
  };
  Object.keys(ROS).forEach(id => { if (PROJECTS[id]) PROJECTS[id].ros = ROS[id]; });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* --- rqt_graph-style SVG: ellipses = nodes, boxes = topics/actions --- */
  function renderRosGraph(ros, maxWidth) {
    const edges = [];
    const channels = ros.topics.concat(ros.actions.map(a => Object.assign({ action: true }, a)));
    const vertices = new Map();
    ros.nodes.forEach(n => vertices.set(n, { id: n, kind: 'node' }));
    channels.forEach(c => {
      const key = 'ch:' + c.name;
      vertices.set(key, { id: key, kind: c.action ? 'action' : 'topic', label: c.name, type: c.type });
      c.from.forEach(n => edges.push({ from: n, to: key, action: !!c.action }));
      c.to.forEach(n => edges.push({ from: key, to: n, action: !!c.action }));
    });

    // Longest-path layering; DFS back-edges are ignored so feedback loops don't explode ranks
    const out = new Map();
    edges.forEach(e => { if (!out.has(e.from)) out.set(e.from, []); out.get(e.from).push(e.to); });
    const state = new Map();
    const order = [];
    function visit(v) {
      if (state.get(v) === 2) return;
      if (state.get(v) === 1) return; // back edge
      state.set(v, 1);
      (out.get(v) || []).forEach(visit);
      state.set(v, 2);
      order.push(v);
    }
    vertices.forEach((_, k) => visit(k));
    order.reverse();
    const pos = new Map(order.map((v, i) => [v, i]));
    const rank = new Map(order.map(v => [v, 0]));
    order.forEach(v => (out.get(v) || []).forEach(w => {
      if (pos.get(w) > pos.get(v)) rank.set(w, Math.max(rank.get(w), rank.get(v) + 1));
    }));

    const ranks = [];
    vertices.forEach((v, k) => {
      const r = rank.get(k);
      (ranks[r] = ranks[r] || []).push(v);
    });

    // Top-down layout: each rank becomes one or more rows, wrapped to fit maxWidth
    const CHAR_W = 6.4, H_GAP = 14, ROW_GAP = 30, PAD = 12;
    const labelOf = v => v.kind === 'node' ? v.id : v.label;
    vertices.forEach(v => {
      v.w = labelOf(v).length * CHAR_W + (v.kind === 'node' ? 30 : 18);
      v.h = v.kind === 'node' ? 30 : 24;
    });
    const usable = Math.max(240, maxWidth - PAD * 2);
    const rows = [];
    ranks.forEach(rk => {
      if (!rk) return;
      let row = [], rowW = 0;
      rk.forEach(v => {
        if (row.length && rowW + H_GAP + v.w > usable) { rows.push(row); row = []; rowW = 0; }
        rowW += (row.length ? H_GAP : 0) + v.w;
        row.push(v);
      });
      if (row.length) rows.push(row);
    });
    const rowWidth = row => row.reduce((sum, v) => sum + v.w, 0) + H_GAP * (row.length - 1);
    const width = Math.max(...rows.map(rowWidth)) + PAD * 2;
    let y = PAD;
    rows.forEach(row => {
      let x = (width - rowWidth(row)) / 2;
      row.forEach(v => {
        v.cx = x + v.w / 2;
        v.cy = y + 15;
        x += v.w + H_GAP;
      });
      y += 30 + ROW_GAP;
    });
    const height = y - ROW_GAP + PAD;

    let svg = `<svg class="ros-graph" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" role="img" aria-label="ROS 2 node and topic graph">`;
    svg += '<defs><marker id="ros-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>';
    edges.forEach(e => {
      const a = vertices.get(e.from), b = vertices.get(e.to);
      if (!a || !b) return;
      let d;
      if (b.cy > a.cy) {
        const y1 = a.cy + a.h / 2, y2 = b.cy - b.h / 2, my = (y1 + y2) / 2;
        d = `M${a.cx},${y1} C${a.cx},${my} ${b.cx},${my} ${b.cx},${y2}`;
      } else {
        // Feedback edge (target above or beside source): loop out along the right side
        const x1 = a.cx + a.w / 2, x2 = b.cx + b.w / 2;
        const bulge = Math.min(width - 2, Math.max(x1, x2) + 28);
        d = `M${x1},${a.cy} C${bulge},${a.cy} ${bulge},${b.cy} ${x2},${b.cy}`;
      }
      svg += `<path class="ros-edge${e.action ? ' is-action' : ''}" data-from="${escapeHtml(e.from)}" data-to="${escapeHtml(e.to)}" d="${d}" marker-end="url(#ros-arrow)"/>`;
    });
    vertices.forEach((v, k) => {
      const label = escapeHtml(labelOf(v));
      if (v.kind === 'node') {
        svg += `<g class="ros-v ros-node" data-id="${escapeHtml(k)}" tabindex="0"><title>node ${label}</title>` +
          `<ellipse cx="${v.cx}" cy="${v.cy}" rx="${v.w / 2}" ry="${v.h / 2}"/>` +
          `<text x="${v.cx}" y="${v.cy}">${label}</text></g>`;
      } else {
        const t = escapeHtml(v.type);
        svg += `<g class="ros-v ros-${v.kind}" data-id="${escapeHtml(k)}" tabindex="0"><title>${label} [${t}]</title>` +
          `<rect x="${v.cx - v.w / 2}" y="${v.cy - 12}" width="${v.w}" height="24" rx="${v.kind === 'action' ? 12 : 3}"/>` +
          `<text x="${v.cx}" y="${v.cy}">${label}</text></g>`;
      }
    });
    svg += '</svg>';
    return svg;
  }

  function bindRosGraph(root) {
    const holder = root.querySelector('.ros-graph-scroll');
    if (!holder) return;
    holder.innerHTML = renderRosGraph(PROJECTS[holder.dataset.project].ros, holder.clientWidth || 400);
    const svg = holder.querySelector('.ros-graph');
    const info = root.querySelector('.ros-graph-info');
    const defaultInfo = info ? info.innerHTML : '';
    const vs = svg.querySelectorAll('.ros-v');
    const es = svg.querySelectorAll('.ros-edge');
    function focusVertex(g) {
      const id = g.dataset.id;
      const linked = new Set([id]);
      es.forEach(e => {
        const hit = e.dataset.from === id || e.dataset.to === id;
        e.classList.toggle('is-hot', hit);
        if (hit) { linked.add(e.dataset.from); linked.add(e.dataset.to); }
      });
      vs.forEach(v => v.classList.toggle('is-dim', !linked.has(v.dataset.id)));
      if (info) info.textContent = g.querySelector('title').textContent;
    }
    function reset() {
      es.forEach(e => e.classList.remove('is-hot'));
      vs.forEach(v => v.classList.remove('is-dim'));
      if (info) info.innerHTML = defaultInfo;
    }
    vs.forEach(g => {
      g.addEventListener('mouseenter', () => focusVertex(g));
      g.addEventListener('focus', () => focusVertex(g));
      g.addEventListener('mouseleave', reset);
      g.addEventListener('blur', reset);
    });
  }

  function gallerySection(p) {
    if (!p.gallery || !p.gallery.length) return '';
    const items = p.gallery.map(g =>
      `<a class="panel-gallery-item" href="${g.src}" target="_blank" rel="noopener"><img src="${g.src}" alt="${escapeHtml(g.alt)}" loading="lazy" decoding="async" width="900" height="1125"></a>`).join('');
    return `
      <div class="panel-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-chart-line"></i> Results</h3>
        <div class="panel-gallery">${items}</div>
        <p class="ros-graph-info">Click an image to open it full size.</p>
      </div>`;
  }

  function rosGraphSection(p, id) {
    const ros = p.ros;
    if (!ros || !ros.nodes) return '';
    return `
      <div class="panel-section ros-graph-section">
        <h3 class="panel-section-title"><i class="fa-solid fa-diagram-project"></i> Node graph (rqt_graph)</h3>
        <div class="ros-graph-scroll" data-project="${id}"></div>
        <p class="ros-graph-info">Hover a node or topic to trace its connections. Ellipses are nodes, boxes are topics, rounded boxes are actions.</p>
      </div>`;
  }

  /* --- Package metadata strip on project cards --- */
  function rosMetaHtml(ros) {
    const counts = `<span class="ros-meta-chip">ROS 2 ${ros.distro}</span><span class="ros-meta-counts">${ros.pkgs.length} pkg${ros.pkgs.length > 1 ? 's' : ''} &middot; ${ros.nodes.length} nodes &middot; ${ros.topics.length} topics${ros.actions.length ? ` &middot; ${ros.actions.length} action${ros.actions.length > 1 ? 's' : ''}` : ''}</span>`;
    return `<div class="ros-meta">${counts}
      <div class="ros-launch"><code>${escapeHtml(ros.launch)}</code>
        <button type="button" class="ros-copy-btn" aria-label="Copy launch command" title="Copy command"><i class="fa-regular fa-copy"></i></button>
      </div></div>`;
  }

  Object.keys(ROS).forEach(id => {
    const tech = document.querySelector(`#${id} .project-info .project-tech`);
    if (!tech) return;
    tech.insertAdjacentHTML('afterend', rosMetaHtml(ROS[id]));
    const btn = tech.nextElementSibling.querySelector('.ros-copy-btn');
    btn.addEventListener('click', e => {
      e.stopPropagation(); // card itself opens the detail panel
      const cmd = ROS[id].launch;
      const done = () => {
        const utils = window.portfolioUtils;
        if (utils && utils.showToast) utils.showToast('Launch command copied', 'fa-solid fa-terminal');
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(cmd).then(done).catch(() => {});
    });
    btn.addEventListener('keydown', e => e.stopPropagation());
  });

  /* --- Architecture section: chips open the project panel --- */
  document.querySelectorAll('.arch-section [data-open-project]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      panelTriggerEl = el;
      openPanel('project', el.dataset.openProject);
    });
  });

  window.PORTFOLIO_DATA = { SKILLS, PROJECTS, openPanel };

})();
