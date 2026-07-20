/* ==========================================================================
   Mock Interactive Terminal - User Experience & Branding
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
    // Interpret newlines
    if (className === 'cmd-out') {
      div.textContent = text;
    } else {
      div.innerHTML = text; // allow markup for colors
    }
    terminalScreen.appendChild(div);
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
  }

  // Diagnostics Boot up sequence
  const bootSequence = [
    { text: "=== AMIN.ROBOTICS SYSTEM V2.6 ===", delay: 50 },
    { text: "Booting Hyprland custom kernel modules...", delay: 200 },
    { text: "Mounting workspace: <span class='text-green'>/home/amin/ros2_ws</span> ... [OK]", delay: 150 },
    { text: "Detecting hardware architectures:", delay: 50 },
    { text: "  - Host workstation: CPU x86_64 Core-i7, OS: Ubuntu 24.04 LTS", delay: 50 },
    { text: "  - Target: STM32F4 ARM Cortex-M4, ESP32-WROOM-3D", delay: 50 },
    { text: "Initializing ROS2 Jazzy core...", delay: 300 },
    { text: "Checking active ROS2 topic subscriptions & interfaces:", delay: 80 },
    { text: "  * <span class='text-green'>[MSG] /cmd_vel</span> [geometry_msgs/msg/Twist]", delay: 30 },
    { text: "  * <span class='text-green'>[MSG] /scan</span> [sensor_msgs/msg/LaserScan]", delay: 30 },
    { text: "  * <span class='text-green'>[MSG] /odom</span> [nav_msgs/msg/Odometry]", delay: 30 },
    { text: "  * <span class='text-green'>[SRV] /square_number</span> [square_interfaces/srv/Square]", delay: 30 },
    { text: "  * <span class='text-green'>[ACT] /navigate_to_pose</span> [nav2_msgs/action/NavigateToPose]", delay: 30 },
    { text: "Loading PID Controller settings... [READY]", delay: 100 },
    { text: "System diagnostics: <span class='text-green'>0 ERRORS</span>, all systems nominal.", delay: 100 },
    { text: "----------------------------------------", delay: 50 },
    { text: "Type <span class='text-green'>'interfaces'</span> or <span class='text-green'>'help'</span> to view ROS 2 architecture details.", delay: 50 }
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

  // Help command text
  const helpText = `Available commands:
  help        - Show this menu
  about       - Brief introduction of myself
  skills      - List my engineering stack
  interfaces  - Display ROS 2 Msg, Srv, and Action definitions
  projects    - Show key engineering achievements
  contact     - Print my communication details
  diagnostics - Run system diagnostics checks
  pid [p] [i] [d] - Tune simulation PID gains directly
  clear       - Clear the screen`;

  const aboutText = `Amin Ahmed G is a B.E. Robotics & Automation student at Anna University, Expected 2027.
Specializes in building firmware and algorithms for robotic navigation and controls.
Passionate about low-latency Linux workspaces, ROS 2 middleware, and embedded system firmware.`;

  const skillsText = `=== TECHNICAL SKILLS ===
* Frameworks: ROS 2 (Jazzy/Humble), Gazebo Harmonic, Nav2, SLAM, MoveIt
* Languages:  C, C++, Python, Rust, Bash Scripting
* Hardware:   STM32 (ARM), ESP32, Raspberry Pi, LiDAR, UART/I2C/SPI
* CAD/Design: SolidWorks, Fusion 360, EasyEDA, KiCad
* Systems:    Linux (Ubuntu/Hyprland), Docker, Git, CODESYS soft PLC`;

  const interfacesText = `=== ROS 2 INTERFACES, SERVICES & ACTIONS ===
* MESSAGES (msg):
  - geometry_msgs/msg/Twist     [/cmd_vel]             -> Velocity commands
  - sensor_msgs/msg/LaserScan   [/scan]                -> 2D LiDAR scan data
  - nav_msgs/msg/Odometry       [/odom]                -> Position & velocity feedback
  - sensor_msgs/msg/JointState  [/joint_states]        -> Robot joint kinematics
  - sensor_msgs/msg/Image       [/camera/image_raw]    -> Monocular vision feed
  - tf2_msgs/msg/TFMessage      [/tf, /tf_static]      -> Coordinate transformations

* SERVICES (srv):
  - square_interfaces/srv/Square [/square_number]      -> Custom C++ squaring service
  - nav2_msgs/srv/GetCostmap    [/global_costmap]      -> Costmap query service
  - std_srvs/srv/Empty          [/reset_simulation]    -> Reset environment state

* ACTIONS (action):
  - nav2_msgs/action/NavigateToPose [/navigate_to_pose] -> Goal-based autonomous navigation
  - nav2_msgs/action/FollowWaypoints [/follow_waypoints] -> Multi-point path planning`;

  const projectsText = `=== KEY PROJECTS ===
1. Mecanum Bot Simulation - ROS 2 Jazzy, Gazebo Harmonic, LiDAR, SLAM, Nav2 Actions
2. Custom ROS 2 Service   - square_interfaces (Square.srv request/response pattern)
3. Line Follower Robot    - Physical STM32 robot running < 1ms loop control
4. Temp Sensor PCB        - Custom 2-layer PCB for ESP32 designed in EasyEDA
5. Motor Control PLC      - CODESYS Ladder logic industrial logic simulation`;

  const contactText = `=== CONTACT DETAILS ===
* Email:   aminahmedg2005@gmail.com
* Phone:   +91 8122241705
* Github:  github.com/Amin-Ahmed-G
* Location: Chennai, India`;

  // Parser command function
  function handleCommand(cmdStr) {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Save to history
    history.push(trimmed);
    historyIndex = history.length;

    // Print command entered
    print(`<span class="cmd-prompt">amin@roboshield:~$</span> ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        print(helpText, 'cmd-out');
        break;
      case 'about':
        print(aboutText, 'cmd-out');
        break;
      case 'skills':
        print(skillsText, 'cmd-out');
        break;
      case 'interfaces':
      case 'ros2':
      case 'srv':
      case 'msg':
      case 'action':
        print(interfacesText, 'cmd-out');
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
              // Scroll to PID section so the user can watch the result
              setTimeout(() => {
                document.getElementById('pid-lab').scrollIntoView({ behavior: 'smooth' });
              }, 1200);
            } else {
              print("Simulation engine not fully loaded.", "cmd-error");
            }
          } else {
            print("Usage error. Gains must be numeric values: pid [Kp] [Ki] [Kd]", "cmd-error");
          }
        } else {
          print("Argument count error. Usage: pid [Kp] [Ki] [Kd] e.g., pid 0.06 0.0002 0.4", "cmd-error");
        }
        break;
      default:
        print(`Command not found: '${cmd}'. Type 'help' for available command instructions.`, 'cmd-error');
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
      handleCommand(cmd);
    });
  });

  // Start sequence
  runBootSequence();
})();
