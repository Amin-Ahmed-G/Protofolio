/* ==========================================================================
   Mock Interactive Terminal - Robotics Software Engineer Workspace
   ========================================================================== */

(function() {
  const terminalScreen = document.getElementById('terminal-screen');
  const terminalInput = document.getElementById('terminal-input');
  const presetBtns = document.querySelectorAll('.preset-cmd-btn');

  // Command History
  let history = [];
  let historyIndex = -1;

  // Print text helper
  function print(text, className = '') {
    const div = document.createElement('div');
    div.className = className;
    if (className === 'cmd-out') {
      div.textContent = text;
    } else {
      div.innerHTML = text; // allow HTML markup for colors
    }
    terminalScreen.appendChild(div);
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
  }

  // Diagnostics Boot up sequence
  const bootSequence = [
    { text: "=== AMIN AHMED &bull; ROS 2 ROBOTICS WORKSPACE v2.6 ===", delay: 40 },
    { text: "Sourcing ROS 2 Jazzy: <span class='text-green'>/opt/ros/jazzy/setup.bash</span> ... [OK]", delay: 100 },
    { text: "Sourcing Workspace: <span class='text-green'>~/cafe_butler_ws/install/setup.bash</span> ... [OK]", delay: 100 },
    { text: "ROS_DOMAIN_ID=42 | DISCOVERY_RANGE=LOCALHOST", delay: 50 },
    { text: "Detecting Active Nodes & Middleware Components:", delay: 40 },
    { text: "  * <span class='text-green'>/cafe_butler_fsm</span> [Python 7-State FSM Node]", delay: 30 },
    { text: "  * <span class='text-green'>/bt_navigator</span> [Nav2 Behavior Tree Navigator]", delay: 30 },
    { text: "  * <span class='text-green'>/amcl</span> [Adaptive Monte Carlo Localisation]", delay: 30 },
    { text: "  * <span class='text-green'>/controller_server</span> [Nav2 DWB Local Planner]", delay: 30 },
    { text: "  * <span class='text-green'>/rosbridge_websocket</span> [WebSocket Server Port 9090]", delay: 30 },
    { text: "  * <span class='text-green'>/cafe_butler_metrics_logger</span> [CSV Delivery Analytics]", delay: 30 },
    { text: "System Status: <span class='text-green'>0 ERRORS</span>, Nav2 Stack fully initialized.", delay: 80 },
    { text: "--------------------------------------------------------", delay: 40 },
    { text: "Type <span class='text-green'>'help'</span>, <span class='text-green'>'ros2'</span>, <span class='text-green'>'cafe'</span>, or <span class='text-green'>'fsm'</span> to interact with the system.", delay: 40 }
  ];

  let bootIndex = 0;
  function runBootSequence() {
    terminalScreen.innerHTML = '';
    bootIndex = 0;
    
    function nextBootItem() {
      if (bootIndex < bootSequence.length) {
        const item = bootSequence[bootIndex];
        print(item.text);
        bootIndex++;
        setTimeout(nextBootItem, item.delay);
      }
    }
    nextBootItem();
  }

  // Help text
  const helpText = `Available Commands:
  help              - Show this help menu
  call / phone      - Reach out directly via Phone (+91 8122241705)
  ros2              - Overview of the active ROS 2 graph
  ros2 node list    - Nodes in the active workspace
  ros2 topic list   - Topics (add -t for types)
  ros2 topic info T - Publishers / subscribers of topic T
  ros2 topic echo T - Stream messages (e.g. /scan, /odom)
  ros2 action list  - Action servers
  ros2 pkg list     - Packages across all my workspaces
  ros2 launch P F   - Launch a package (switches active workspace)
  colcon build      - Build every package
  cafe-launch       - Simulate launching Café Butler delivery system
  fsm               - Display 7-State Finite State Machine workflow
  tf                - Display TF2 coordinate transformation tree
  metrics           - View route optimization & delivery performance
  karthikesh        - 20-Day Robotics Training capstone details
  skills            - List engineering stack & hardware experience
  projects          - Summary of key GitHub repositories
  about             - Profile overview
  contact           - Communication & contact details
  pid [p] [i] [d]   - Tune simulation PID gains directly
  diagnostics       - Re-run system initialization check
  clear             - Clear terminal screen

Shell basics:
  ls [-a] [dir]  cd <dir>  pwd  cat <file>  tree  echo  date
  uname -a  hostname  uptime  history  neofetch
  open <resume.pdf | project | github>`;

  const ros2Text = `=== ROS 2 JAZZY CORE TELEMETRY ===

ACTIVE NODES:
  • /cafe_butler_fsm             (Python FSM Controller)
  • /amcl                        (Localization Particle Filter)
  • /planner_server              (NavFn Planner @ 20Hz)
  • /controller_server           (DWB Local Planner)
  • /rosbridge_websocket         (Port 9090)
  • /robot_state_publisher       (URDF TF Broadcaster)
  • /cafe_butler_metrics_logger  (CSV Telemetry Logger)

ACTIVE TOPICS:
  • /scan                        [sensor_msgs/msg/LaserScan] 360° LiDAR
  • /scan_low                    [sensor_msgs/msg/LaserScan] Lower plane LiDAR
  • /odom                        [nav_msgs/msg/Odometry] Differential Drive
  • /amcl_pose                   [geometry_msgs/msg/PoseWithCovarianceStamped]
  • /cmd_vel                     [geometry_msgs/msg/Twist] Velocity commands
  • /fsm_status                  [std_msgs/msg/String] JSON state feed (2Hz)
  • /new_order                   [std_msgs/msg/String] Multi-table order queue
  • /kitchen_confirm             [std_msgs/msg/String] Staff pickup signal
  • /table_confirm               [std_msgs/msg/String] Customer delivery signal`;

  const cafeText = `=== CAFÉ BUTLER SYSTEM STATUS ===
[STATUS]: RUNNING & READY
[MAP]: cafe_map.yaml (10m x 10m Gazebo Harmonic World)
[WAYPOINTS]:
  - Home:    x = -3.50, y = -1.00
  - Kitchen: x = -3.50, y = +2.20
  - Table 1: x = +1.50, y = +2.50
  - Table 2: x = +1.50, y =  0.00
  - Table 3: x = +1.50, y = -2.50

[COMMAND EXAMPLE]:
  ros2 topic pub /new_order std_msgs/String "data: '{\\"tables\\": [\\"table1\\", \\"table3\\"]}'"`;

  const fsmText = `=== CAFÉ BUTLER FINITE STATE MACHINE (FSM) ===

  [IDLE] ────▶ (Receive /new_order)
     │
     ▼
  [MOVE_TO_KITCHEN] ──▶ (Arrive) ──▶ [COLLECT_ORDER] ──▶ (Await /kitchen_confirm)
                                           │
     ┌─────────────────────────────────────┘
     ▼
  [MOVE_TO_TABLE] ──▶ (Arrive) ──▶ [DELIVER_ORDER] ──▶ (Await /table_confirm)
        │                                  │
        └─────── (Next Table in Queue) ────┘
                         │
               (All Tables Completed)
                         ▼
                [RETURN_TO_HOME] ──▶ [IDLE]

* Retry Logic: Max 2 retries per leg before entering ERROR state auto-recovery.`;

  const tfText = `=== ROS 2 TF2 FRAME TRANSFORM TREE ===

  map
   └── odom  (AMCL Drift Correction)
        └── base_link  (Robot Kinematic Center)
             ├── drivewhl_l_link  (Left Drive Wheel)
             ├── drivewhl_r_link  (Right Drive Wheel)
             ├── lidar_link        (360° GPU LiDAR, z=+0.075m)
             ├── low_lidar_link    (Lower GPU LiDAR)
             └── imu_link          (100Hz 6-DOF IMU)`;

  const metricsText = `=== DELIVERY ROUTE OPTIMIZATION METRICS ===
Algorithm: Nearest-Neighbour Greedy Heuristic (TSP)

Example Multi-Table Order: [Table 3, Table 1, Table 2]
  • Naive Route Distance:     18.42 meters
  • TSP Optimised Distance:   13.15 meters
  • Distance Saved:           5.27 meters (28.6% efficiency gain)
  • Measured Odometry:        13.38 meters (AMCL tracked)
  • Log Output:               ~/cafe_butler_ws/delivery_metrics.csv`;

  const karthikeshText = `=== KARTHIKESH ROBOTICS (KKR) — 20-DAY CAPSTONE ===
Mentors: Karthikesh Sir & Sundar Sir
Location: Chennai, India (July 2026)

Summary:
Completed an intensive 20-day robotics training program. Built the Café Butler Autonomous Delivery Robot from scratch using ROS 2 (Humble / Jazzy) & Gazebo Harmonic. 
Special thanks to mentor Sundar sir for providing the base simulation environment reference.`;

  const skillsText = `=== TECHNICAL SKILLS MATRIX ===
* Robotics Middleware: ROS 2 (Humble / Jazzy), Nav2, MoveIt 2, SLAM Toolbox, AMCL
* Simulation Tools:    Gazebo Harmonic, RViz2, URDF/Xacro, SDF, ros2_control
* Languages:           Python 3.12, C++17, C, Bash Scripting
* Embedded Systems:    STM32 (ARM Cortex-M), ESP32, PID Motor Control, UART/I2C/SPI
* Network & Security:  rosbridge WebSocket, SROS2, ROS 2 Command Firewall (RoboShield v2)
* CAD & Hardware:      SolidWorks, EasyEDA PCB Design, EasyEDA, KiCad`;

  const projectsText = `=== FEATURED GITHUB PROJECTS ===
<a href="#projects" class="text-green" style="text-decoration:underline" onclick="document.getElementById('amr-leader-follower').scrollIntoView({behavior:'smooth'});return false;">1. AMR Leader-Follower</a>    ROS 2 · Nav2 · EKF · Web Dashboard
<a href="#projects" class="text-green" style="text-decoration:underline" onclick="document.getElementById('cafe-butler').scrollIntoView({behavior:'smooth'});return false;">2. Café Butler Robot</a>      Autonomous Delivery · Python FSM · WebSocket
<a href="#projects" class="text-green" style="text-decoration:underline" onclick="document.getElementById('mecanum-bot').scrollIntoView({behavior:'smooth'});return false;">3. Mecanum Bot</a>            4-Wheel Holonomic · SLAM Toolbox · ros2_control
<a href="#projects" class="text-green" style="text-decoration:underline" onclick="document.getElementById('two-wheel-bot').scrollIntoView({behavior:'smooth'});return false;">4. Two-Wheel Differential</a> LiDAR · SLAM Toolbox · Nav2
<a href="#projects" class="text-green" style="text-decoration:underline" onclick="document.getElementById('roboshield').scrollIntoView({behavior:'smooth'});return false;">5. RoboShield v2</a>          Rust · ROS 2 Command Firewall · SROS2
<span style="color: var(--text-muted, #64748b)">Click any name above to scroll to the project card.</span>`;

  const contactText = `=== CONTACT TELEMETRY & DIRECT ACTIONS ===
* Phone:    <a href="tel:+918122241705" class="text-green" style="font-weight: bold; text-decoration: underline;">+91 8122241705</a> [Active Line]
* Email:    <a href="mailto:aminahmedg2005@gmail.com" style="color: #52d68a; text-decoration: underline;">aminahmedg2005@gmail.com</a>
* GitHub:   <a href="https://github.com/Amin-Ahmed-G" target="_blank" style="color: #52d68a; text-decoration: underline;">https://github.com/Amin-Ahmed-G</a>
* LinkedIn: <a href="https://www.linkedin.com/in/amin-ahmed-g/" target="_blank" style="color: #52d68a; text-decoration: underline;">https://www.linkedin.com/in/amin-ahmed-g/</a>
* Location: Chennai, Tamil Nadu, India

<div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
  <a href="tel:+918122241705" class="contact-action-btn call-now-btn" style="padding: 4px 10px; font-size: 0.75rem;"><i class="fa-solid fa-phone-flip"></i> Call +91 8122241705</a>
</div>`;

  const aboutText = `Amin Ahmed G is a B.E. Robotics & Automation Student at Anna University.
Focuses on building control layers, autonomous navigation stacks, and real-time firmware for mobile robotics.`;


  /* ---------- ROS 2 CLI emulation, driven by the real project graphs ---------- */
  let activeProject = 'cafe-butler';
  let echoTimer = null;

  function rosProjects() {
    const d = window.PORTFOLIO_DATA;
    if (!d) return [];
    return Object.keys(d.PROJECTS).filter(id => d.PROJECTS[id].ros && d.PROJECTS[id].ros.nodes)
      .map(id => Object.assign({ id }, d.PROJECTS[id]));
  }
  function activeRos() {
    const p = rosProjects().find(x => x.id === activeProject);
    return p ? p.ros : null;
  }
  function stopEcho() { if (echoTimer) { clearInterval(echoTimer); echoTimer = null; } }

  function echoMessage(topic, type, seq) {
    const t = (1759400000 + seq * 0.1).toFixed(1).split('.');
    const header = `header:\n  stamp:\n    sec: ${t[0]}\n    nanosec: ${t[1]}00000000\n`;
    if (type === 'sensor_msgs/msg/LaserScan') {
      const ranges = Array.from({ length: 6 }, (_, i) => (1.2 + Math.abs(Math.sin(seq * 0.7 + i)) * 2.4).toFixed(3));
      return `${header}  frame_id: lidar_link\nangle_min: -3.1416\nangle_max: 3.1416\nangle_increment: 0.0175\nrange_min: 0.12\nrange_max: 12.0\nranges: [${ranges.join(', ')}, '...']\n---`;
    }
    if (type === 'nav_msgs/msg/Odometry') {
      const x = (seq * 0.021).toFixed(3), w = (0.05 * Math.sin(seq / 3)).toFixed(3);
      return `${header}  frame_id: odom\nchild_frame_id: base_footprint\npose:\n  pose:\n    position: {x: ${x}, y: 0.000, z: 0.0}\ntwist:\n  twist:\n    linear: {x: 0.210, y: 0.0, z: 0.0}\n    angular: {x: 0.0, y: 0.0, z: ${w}}\n---`;
    }
    return null;
  }

  function rosCli(args) {
    stopEcho();
    const ros = activeRos();
    if (!ros) { print('ROS graph data still loading, try again in a moment.', 'cmd-error'); return; }
    const [verb, sub, arg] = args;
    const ws = `<span class="text-muted-term">(workspace: ${activeProject})</span>`;

    if (verb === 'node' && sub === 'list') {
      print(ros.nodes.slice().sort().join('\n'), 'cmd-out'); print(ws);
    } else if (verb === 'topic' && sub === 'list') {
      const withType = args.includes('-t');
      print(ros.topics.slice().sort((a, b) => a.name.localeCompare(b.name)).map(t => withType ? `${t.name} [${t.type}]` : t.name).join('\n'), 'cmd-out'); print(ws);
    } else if (verb === 'topic' && sub === 'info' && arg) {
      const t = ros.topics.find(x => x.name === arg);
      if (!t) { print(`Unknown topic '${arg}'. Try 'ros2 topic list'.`, 'cmd-error'); return; }
      print(`Type: ${t.type}\nPublisher count: ${t.from.length}\n  ${t.from.join('\n  ')}\nSubscription count: ${t.to.length}${t.to.length ? '\n  ' + t.to.join('\n  ') : ''}`, 'cmd-out');
    } else if (verb === 'topic' && sub === 'echo' && arg) {
      const t = ros.topics.find(x => x.name === arg);
      if (!t) { print(`Unknown topic '${arg}'. Try 'ros2 topic list'.`, 'cmd-error'); return; }
      if (!echoMessage(t.name, t.type, 0)) {
        print(`Echo is emulated for LaserScan and Odometry topics only. '${arg}' is ${t.type}.`, 'cmd-error'); return;
      }
      let seq = 0;
      print(echoMessage(t.name, t.type, seq++), 'cmd-out');
      echoTimer = setInterval(() => {
        print(echoMessage(t.name, t.type, seq++), 'cmd-out');
        if (seq >= 4) { stopEcho(); print('^C (emulated stream stopped after 4 messages)', 'text-muted-term'); }
      }, 700);
    } else if (verb === 'action' && sub === 'list') {
      print(ros.actions.length ? ros.actions.map(a => a.name).join('\n') : '(no action servers in this workspace)', 'cmd-out'); print(ws);
    } else if (verb === 'pkg' && sub === 'list') {
      print(rosProjects().flatMap(p => p.ros.pkgs).sort().join('\n'), 'cmd-out');
    } else if (verb === 'launch' && sub) {
      const p = rosProjects().find(x => x.ros.pkgs.includes(sub));
      if (!p) { print(`Package '${sub}' not found. Try 'ros2 pkg list'.`, 'cmd-error'); return; }
      activeProject = p.id;
      const lines = [`[INFO] [launch]: Default logging verbosity is set to INFO`,
        `<span class='text-muted-term'>$ ${p.ros.launch}</span>`]
        .concat(p.ros.nodes.map((n, i) => `[INFO] [${n.split('/').pop()}-${i + 1}]: process started with pid [${4120 + i * 7}]`))
        .concat([`<span class='text-green'>Active workspace -> ${p.id}. Try 'ros2 node list' or open the project's node graph.</span>`]);
      lines.forEach((l, i) => setTimeout(() => print(l), i * 90));
    } else {
      print("Supported: ros2 node list | topic list [-t] | topic info <t> | topic echo <t> | action list | pkg list | launch <pkg> [file]", 'cmd-error');
    }
  }

  function colconBuild() {
    stopEcho();
    const pkgs = rosProjects().flatMap(p => p.ros.pkgs).sort();
    if (!pkgs.length) { print('ROS graph data still loading, try again in a moment.', 'cmd-error'); return; }
    const out = [];
    pkgs.forEach((pkg, i) => {
      out.push(`Starting >>> ${pkg}`);
      out.push(`<span class='text-green'>Finished <<< ${pkg} [${(1.1 + (pkg.length % 7) * 0.6).toFixed(1)}s]</span>`);
    });
    out.push(`\nSummary: ${pkgs.length} packages finished`);
    out.forEach((l, i) => setTimeout(() => print(l), i * 60));
  }


  /* ---------- Basic shell: a small read-only home directory ---------- */
  function escHtml(str) {
    return String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  let cwd = '/home/amin';
  const HOME = '/home/amin';
  const startTime = Date.now();

  function projectFiles() {
    const d = window.PORTFOLIO_DATA;
    if (!d) return {};
    const files = {};
    Object.keys(d.PROJECTS).forEach(id => {
      const p = d.PROJECTS[id];
      files[id + '.md'] = () => [`# ${p.title}`, '', p.summary, '', `Problem: ${p.problem}`, '', p.repo ? `Repo: ${p.repo}` : '(no public repo)',
        `Tip: run 'open ${id}' to see the full breakdown.`].join('\n');
    });
    return files;
  }

  function wsPackages() {
    const d = window.PORTFOLIO_DATA;
    if (!d) return {};
    const pkgs = {};
    Object.keys(d.PROJECTS).forEach(id => {
      const ros = d.PROJECTS[id].ros;
      if (ros && ros.pkgs) ros.pkgs.forEach(pkg => { pkgs[pkg] = { 'package.xml': () => `<package format="3">\n  <name>${pkg}</name>\n  <maintainer email="aminahmedg2005@gmail.com">Amin Ahmed G</maintainer>\n  <!-- full source: ${d.PROJECTS[id].repo} -->\n</package>` }; });
    });
    return pkgs;
  }

  // Directory tree; functions are lazy so they read portfolio data at call time
  function fsTree() {
    return {
      home: { amin: {
        'about.txt': () => aboutText,
        'skills.txt': () => skillsText.replace(/^=== .* ===\n/, ''),
        'contact.txt': () => 'Email:    aminahmedg2005@gmail.com\nPhone:    +91 8122241705\nGitHub:   https://github.com/Amin-Ahmed-G\nLinkedIn: https://www.linkedin.com/in/amin-ahmed-g/\nLocation: Chennai, Tamil Nadu, India',
        'resume.pdf': 'binary',
        projects: projectFiles(),
        ros2_ws: { src: wsPackages() },
        '.bashrc': () => "source /opt/ros/jazzy/setup.bash\nsource ~/ros2_ws/install/setup.bash\nexport ROS_DOMAIN_ID=42\nalias cafe-launch='ros2 launch cafe_butler_bringup full_system.launch.py open_dashboard:=true'"
      } }
    };
  }

  function resolvePath(arg) {
    let path = !arg || arg === '~' ? HOME : arg.replace(/^~(?=\/|$)/, HOME);
    if (!path.startsWith('/')) path = cwd + '/' + path;
    const out = [];
    path.split('/').forEach(seg => {
      if (!seg || seg === '.') return;
      if (seg === '..') out.pop(); else out.push(seg);
    });
    return '/' + out.join('/');
  }

  function lookup(path) {
    let node = fsTree();
    for (const seg of path.split('/').filter(Boolean)) {
      if (!node || typeof node !== 'object' || !(seg in node)) return undefined;
      node = node[seg];
    }
    return node;
  }

  const isDir = n => n && typeof n === 'object';
  const promptPath = () => cwd === HOME ? '~' : cwd.startsWith(HOME + '/') ? '~' + cwd.slice(HOME.length) : cwd;

  function updatePrompt() {
    const label = `amin@roboshield:${promptPath()}$`;
    const el = document.querySelector('.terminal-input-line .prompt');
    if (el) el.textContent = label;
    const title = document.querySelector('.terminal-title');
    if (title) title.textContent = `amin@roboshield:${promptPath()}`;
  }

  function shellCommand(cmd, args) {
    switch (cmd) {
      case 'pwd':
        print(cwd, 'cmd-out');
        return true;
      case 'ls': {
        const showAll = args.some(a => /^-\w*a/.test(a));
        const target = args.find(a => !a.startsWith('-'));
        const path = resolvePath(target || '.');
        const node = lookup(path);
        if (node === undefined) { print(`ls: cannot access '${escHtml(target)}': No such file or directory`, 'cmd-error'); return true; }
        if (!isDir(node)) { print(escHtml(target), 'cmd-out'); return true; }
        const names = Object.keys(node).filter(n => showAll || !n.startsWith('.')).sort();
        print(names.map(n => isDir(node[n]) ? `<span class="term-dir">${escHtml(n)}/</span>` : escHtml(n)).join('  ') || '', 'cmd-out cmd-html');
        return true;
      }
      case 'cd': {
        const path = resolvePath(args[0]);
        const node = lookup(path);
        if (!isDir(node)) { print(`cd: ${escHtml(args[0])}: ${node === undefined ? 'No such file or directory' : 'Not a directory'}`, 'cmd-error'); return true; }
        cwd = path;
        updatePrompt();
        return true;
      }
      case 'cat': {
        if (!args.length) { print('usage: cat <file>', 'cmd-error'); return true; }
        args.forEach(a => {
          const node = lookup(resolvePath(a));
          if (node === undefined) print(`cat: ${escHtml(a)}: No such file or directory`, 'cmd-error');
          else if (isDir(node)) print(`cat: ${escHtml(a)}: Is a directory`, 'cmd-error');
          else if (node === 'binary') print(`cat: ${escHtml(a)}: binary file. Try 'open resume.pdf'.`, 'cmd-error');
          else print(node(), 'cmd-out');
        });
        return true;
      }
      case 'tree': {
        const start = resolvePath(args[0] || '.');
        const root = lookup(start);
        if (!isDir(root)) { print(`tree: ${escHtml(args[0] || '.')}: not a directory`, 'cmd-error'); return true; }
        const lines = [promptPath() === '~' && !args[0] ? '.' : escHtml(args[0] || '.')];
        (function walk(node, prefix) {
          const names = Object.keys(node).filter(n => !n.startsWith('.')).sort();
          names.forEach((n, i) => {
            const last = i === names.length - 1;
            lines.push(prefix + (last ? '└── ' : '├── ') + (isDir(node[n]) ? `<span class="term-dir">${escHtml(n)}</span>` : escHtml(n)));
            if (isDir(node[n])) walk(node[n], prefix + (last ? '    ' : '│   '));
          });
        })(root, '');
        print(lines.join('\n'), 'cmd-out cmd-html');
        return true;
      }
      case 'open': {
        const target = args[0] || '';
        const d = window.PORTFOLIO_DATA;
        const id = target.replace(/^.*\//, '').replace(/\.md$/, '');
        if (/resume\.pdf$/.test(target)) { window.open('resume.pdf', '_blank', 'noopener'); print('Opening resume.pdf ...', 'text-green'); }
        else if (d && d.PROJECTS[id]) { d.openPanel('project', id); print(`Opening ${id} ...`, 'text-green'); }
        else if (target === 'github') { window.open('https://github.com/Amin-Ahmed-G', '_blank', 'noopener'); print('Opening GitHub ...', 'text-green'); }
        else print("usage: open <resume.pdf | project-name | github>   (see 'ls projects')", 'cmd-error');
        return true;
      }
      case 'echo':
        print(args.join(' ').replace(/^["']|["']$/g, '').replace(/\$USER/g, 'amin').replace(/\$ROS_DISTRO/g, 'jazzy').replace(/\$ROS_DOMAIN_ID/g, '42'), 'cmd-out');
        return true;
      case 'date':
        print(new Date().toString(), 'cmd-out');
        return true;
      case 'uname':
        print(args.includes('-a') ? 'Linux roboshield 6.8.0-ros #42-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux' : 'Linux', 'cmd-out');
        return true;
      case 'hostname':
        print('roboshield', 'cmd-out');
        return true;
      case 'uptime': {
        const s = Math.floor((Date.now() - startTime) / 1000);
        print(`up ${Math.floor(s / 60)} min ${s % 60} s,  1 user,  load average: 0.42, 0.37, 0.31`, 'cmd-out');
        return true;
      }
      case 'history':
        print(history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'), 'cmd-out');
        return true;
      case 'neofetch':
        print([
          'amin@roboshield',
          '---------------',
          'OS:       Ubuntu 24.04 LTS x86_64',
          'WM:       Hyprland',
          'Shell:    bash 5.2',
          'ROS:      ROS 2 Jazzy Jalisco',
          'Sim:      Gazebo Harmonic',
          'Langs:    C++ · Python · Rust · C',
          'Focus:    Nav2 autonomy · DDS/ROS 2 security',
          'Work:     ROS 2 Developer @ Reddix Robotics (Sep 2026 - present)'
        ].join('\n'), 'cmd-out');
        return true;
      case 'mkdir': case 'touch': case 'rm': case 'mv': case 'cp': case 'nano': case 'vim': case 'vi':
        if (cmd === 'rm' && args.join(' ').includes('-rf')) print('rm: nice try. This filesystem is read-only, and the robot is in LOCKDOWN.', 'cmd-error');
        else print(`${cmd}: read-only file system (this is a portfolio, not a real shell)`, 'cmd-error');
        return true;
      case 'exit': case 'logout':
        print('logout... just kidding, you can\'t leave that easily. Try \'contact\' instead.', 'cmd-out');
        return true;
    }
    return false;
  }

  // Path completion for the Tab handler in enhancements.js
  window.TERMINAL_FS = {
    complete(partial) {
      const slash = partial.lastIndexOf('/');
      const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : '';
      const base = slash >= 0 ? partial.slice(slash + 1) : partial;
      const node = lookup(resolvePath(dirPart || '.'));
      if (!isDir(node)) return [];
      return Object.keys(node).filter(n => n.startsWith(base) && (base.startsWith('.') || !n.startsWith('.')))
        .map(n => dirPart + n + (isDir(node[n]) ? '/' : ''));
    }
  };

  // Parser command function
  function handleCommand(cmdStr) {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    history.push(trimmed);
    historyIndex = history.length;

    print(`<span class="cmd-prompt">amin@roboshield:${promptPath()}$</span> ${escHtml(trimmed)}`);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        print(helpText, 'cmd-out');
        break;
      case 'ros2':
        if (args.length) { rosCli(args); break; }
        print(ros2Text, 'cmd-out');
        break;
      case 'nodes':
      case 'topics':
        print(ros2Text, 'cmd-out');
        break;
      case 'colcon':
        if (args[0] === 'build') colconBuild();
        else print("usage: colcon build", 'cmd-error');
        break;
      case 'cafe':
      case 'cafe-launch':
      case 'launch':
        print(cafeText, 'cmd-out');
        break;
      case 'fsm':
        print(fsmText, 'cmd-out');
        break;
      case 'tf':
        print(tfText, 'cmd-out');
        break;
      case 'metrics':
        print(metricsText, 'cmd-out');
        break;
      case 'karthikesh':
      case 'kkr':
        print(karthikeshText, 'cmd-out');
        break;
      case 'about':
        print(aboutText, 'cmd-out');
        break;
      case 'whoami':
        if (window.TERMINAL_EXTRAS && window.TERMINAL_EXTRAS.whoami) {
          window.TERMINAL_EXTRAS.whoami();
        } else {
          print('Amin Ahmed G — Robotics & Automation Engineer, Anna University.', 'cmd-out');
        }
        break;
      case 'skills':
        print(skillsText, 'cmd-out');
        break;
      case 'projects':
        print(projectsText, 'cmd-out cmd-html');
        break;
      case 'contact':
      case 'phone':
      case 'call':
      case 'whatsapp':
      case 'tel':
        print(contactText, 'cmd-out cmd-html');
        break;
      case 'matrix':
      case 'sudo':
        print(`Executing: ${cmd}...`, 'text-green');
        setTimeout(() => {
          if (window.TERMINAL_EXTRAS && window.TERMINAL_EXTRAS.matrix) {
            window.TERMINAL_EXTRAS.matrix();
          }
        }, 400);
        break;
      case 'diagnostics':
        runBootSequence();
        break;
      case 'clear':
        terminalScreen.innerHTML = '';
        break;
      case 'pid':
        if (args.length >= 3) {
          const p = parseFloat(args[0]);
          const i = parseFloat(args[1]);
          const d = parseFloat(args[2]);
          if (!isNaN(p) && !isNaN(i) && !isNaN(d)) {
            if (window.PIDSIM && window.PIDSIM.setGains) {
              window.PIDSIM.setGains(p, i, d);
              print(`PID controller gains successfully tuned to: P=${p}, I=${i}, D=${d}.`, 'text-green');
              setTimeout(() => {
                const el = document.getElementById('pid-lab');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 1200);
            } else {
              print("PID Simulation engine loading...", "cmd-error");
            }
          } else {
            print("Usage: pid [Kp] [Ki] [Kd] e.g., pid 0.06 0.0002 0.4", "cmd-error");
          }
        } else {
          print("Usage: pid [Kp] [Ki] [Kd] e.g., pid 0.06 0.0002 0.4", "cmd-error");
        }
        break;
      default:
        if (shellCommand(cmd, args)) break;
        print(`command not found: ${escHtml(cmd)}. Try 'help'.`, 'cmd-error');
    }
  }

  // Listeners
  terminalInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      handleCommand(val);
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = history[historyIndex];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        terminalInput.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        terminalInput.value = '';
      }
      e.preventDefault();
    }
  });

  // Preset Buttons Click listener
  presetBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) handleCommand(cmd);
    });
  });

  // Start sequence
  runBootSequence();
})();
