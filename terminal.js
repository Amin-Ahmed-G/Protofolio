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
    { text: "  * <span class='text-green'>/dwb_controller</span> [DWB Local Planner @ 20Hz]", delay: 30 },
    { text: "  * <span class='text-green'>/rosbridge_websocket</span> [WebSocket Server Port 9090]", delay: 30 },
    { text: "  * <span class='text-green'>/metrics_logger</span> [CSV Delivery Analytics]", delay: 30 },
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
  ros2              - List active ROS 2 topics, nodes & services
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
  clear             - Clear terminal screen`;

  const ros2Text = `=== ROS 2 JAZZY CORE TELEMETRY ===

ACTIVE NODES:
  • /cafe_butler_fsm             (Python FSM Controller)
  • /amcl                        (Localization Particle Filter)
  • /planner_server              (NavFn Planner @ 20Hz)
  • /controller_server           (DWB Local Planner)
  • /rosbridge_websocket         (Port 9090)
  • /robot_state_publisher       (URDF TF Broadcaster)
  • /metrics_logger              (CSV Telemetry Logger)

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
Completed an intensive 20-day robotics training program. Built the Café Butler Autonomous Delivery Robot from scratch using ROS 2 Jazzy & Gazebo Harmonic. 
Special thanks to mentor Sundar sir for providing the base simulation environment reference.`;

  const skillsText = `=== TECHNICAL SKILLS MATRIX ===
* Robotics Middleware: ROS 2 (Jazzy/Humble), Nav2, MoveIt 2, SLAM Cartographer, AMCL
* Simulation Tools:    Gazebo Harmonic, RViz2, URDF/Xacro, SDF, ros2_control
* Languages:           Python 3.12, C++17, C, Bash Scripting
* Embedded Systems:    STM32 (ARM Cortex-M), ESP32, PID Motor Control, UART/I2C/SPI
* Network & Security:  rosbridge WebSocket, RTPS/DDS Intrusion Detection (RoboShield)
* CAD & Hardware:      SolidWorks, EasyEDA PCB Design, EasyEDA, KiCad`;

  const projectsText = `=== FEATURED GITHUB PROJECTS ===
1. AMR Leader-Follower    (ROS 2 Jazzy, Gazebo Harmonic, EKF, Nav2, Web Dashboard)
2. Café Butler Robot      (Autonomous Delivery Robot, Python FSM, WebSocket Dashboard)
3. Mecanum Bot Simulator  (4-Wheel Omnidirectional Drive, Cartographer SLAM, Nav2)
4. Two-Wheel Differential (ROS 2 Waypoint Navigation, LiDAR, DiffDrive)
5. RoboShield NIDS        (Real-time RTPS Intrusion Detection & NFQUEUE Firewall)`;

  const contactText = `=== CONTACT INFORMATION ===
* Email:    aminahmedg2005@gmail.com
* Phone:    +91 8122241705
* GitHub:   https://github.com/Amin-Ahmed-G
* Location: Chennai, India`;

  const aboutText = `Amin Ahmed G is a B.E. Robotics & Automation Student at Anna University.
Focuses on building control layers, autonomous navigation stacks, and real-time firmware for mobile robotics.`;

  // Parser command function
  function handleCommand(cmdStr) {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    history.push(trimmed);
    historyIndex = history.length;

    print(`<span class="cmd-prompt">amin@roboshield:~$</span> ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        print(helpText, 'cmd-out');
        break;
      case 'ros2':
      case 'nodes':
      case 'topics':
        print(ros2Text, 'cmd-out');
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
      case 'skills':
        print(skillsText, 'cmd-out');
        break;
      case 'projects':
        print(projectsText, 'cmd-out');
        break;
      case 'contact':
        print(contactText, 'cmd-out');
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
        print(`Command not found: '${cmd}'. Type 'help' for ROS 2 commands.`, 'cmd-error');
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
