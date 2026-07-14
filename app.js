/* ==========================================================================
   General Page Interactions & LiDAR Point Cloud Background Canvas
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
  
  /* ==========================================================================
     1. Navigation Menu Toggle & Highlight
     ========================================================================== */
  const navToggle = document.getElementById('nav-toggle-btn');
  const navMenu = document.getElementById('nav-menu-list');
  const navLinks = document.querySelectorAll('.nav-link');
  const navbar = document.getElementById('main-nav');

  navToggle.addEventListener('click', function() {
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  // Close mobile nav when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Track active section on scroll
  const sections = document.querySelectorAll('section');
  const navObserverOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // trigger when section occupies center of screen
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${activeId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, navObserverOptions);

  sections.forEach(section => {
    navObserver.observe(section);
  });

  /* ==========================================================================
     2. Scroll Reveal Animations (IntersectionObserver Fallback)
     ========================================================================== */
  // Feature detect native CSS Scroll-driven animations
  const supportsScrollDrivenAnimations = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  
  if (!supportsScrollDrivenAnimations) {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    // Set initial hidden state
    revealElements.forEach(el => el.classList.add('reveal-hidden'));
    
    const revealObserverOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.15
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-hidden');
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target); // trigger animation only once
        }
      });
    }, revealObserverOptions);
    
    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  }

  /* ==========================================================================
     3. LiDAR Point Cloud Interactive Background Canvas
     ========================================================================== */
  const canvas = document.getElementById('lidar-bg-canvas');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', function() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const points = [];
  const maxPoints = 80;
  const connectionDistance = 110;
  
  // Create random point positions (Lidar returns)
  for (let i = 0; i < maxPoints; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 1,
      glow: 0,
      glowTarget: 0
    });
  }

  // LiDAR Scan Sweep Line Angle
  let sweepAngle = 0;
  const sweepCenter = { x: width * 0.7, y: height * 0.4 };
  const sweepRadius = Math.max(width, height) * 0.6;
  
  // Mouse position
  let mouse = { x: null, y: null, active: false };
  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', function() {
    mouse.active = false;
  });

  function animateLidar() {
    ctx.clearRect(0, 0, width, height);

    // Update sweep angle
    sweepAngle += 0.003;
    if (sweepAngle > Math.PI * 2) sweepAngle = 0;

    // Center point of LiDAR
    sweepCenter.x = width * 0.75;
    sweepCenter.y = height * 0.35;

    // Draw LiDAR sweeping beam (faint green-cyan cone)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sweepCenter.x, sweepCenter.y);
    ctx.arc(sweepCenter.x, sweepCenter.y, sweepRadius, sweepAngle - 0.15, sweepAngle);
    ctx.lineTo(sweepCenter.x, sweepCenter.y);
    
    const grad = ctx.createRadialGradient(sweepCenter.x, sweepCenter.y, 0, sweepCenter.x, sweepCenter.y, sweepRadius);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.08)');
    grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Draw scan concentric circles
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.02)';
    ctx.lineWidth = 1;
    for (let r = 150; r < sweepRadius; r += 150) {
      ctx.beginPath();
      ctx.arc(sweepCenter.x, sweepCenter.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Process and draw points
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      
      // Update physics
      p.x += p.vx;
      p.y += p.vy;

      // Wall collision bounds
      if (p.x < 0 || p.x > width) p.vx = -p.vx;
      if (p.y < 0 || p.y > height) p.vy = -p.vy;

      // Sweep intersection logic: Calculate angle between sweepCenter and point
      const angleToPoint = Math.atan2(p.y - sweepCenter.y, p.x - sweepCenter.x);
      // Normalize angle to 0 - 2PI
      const normalizedAngle = angleToPoint < 0 ? angleToPoint + Math.PI * 2 : angleToPoint;
      
      // Calculate angular distance
      let angularDiff = Math.abs(normalizedAngle - sweepAngle);
      if (angularDiff > Math.PI) angularDiff = Math.PI * 2 - angularDiff;

      // Glow if sweep overlaps
      if (angularDiff < 0.1) {
        p.glowTarget = 1.0;
      }

      // Decaying glow
      p.glow += (p.glowTarget - p.glow) * 0.08;
      p.glowTarget *= 0.95; // decay trigger

      // Draw point
      ctx.beginPath();
      if (p.glow > 0.1) {
        ctx.fillStyle = `rgba(0, 242, 254, ${0.15 + p.glow * 0.8})`;
        ctx.shadowBlur = p.glow * 8;
        ctx.shadowColor = '#00f2fe';
        ctx.arc(p.x, p.y, p.radius + p.glow * 1.5, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.12)';
        ctx.shadowBlur = 0;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Mouse influence (interactively scans around mouse)
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 255, 135, ${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          
          p.glowTarget = Math.max(p.glowTarget, 1 - dist / 100);
        }
      }

      // Draw connection lines to nearby points
      for (let j = i + 1; j < points.length; j++) {
        const p2 = points[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const avgGlow = (p.glow + p2.glow) / 2;
          ctx.beginPath();
          ctx.lineWidth = 0.5;
          if (avgGlow > 0.1) {
            ctx.strokeStyle = `rgba(0, 242, 254, ${0.04 + avgGlow * 0.15 * (1 - dist / connectionDistance)})`;
          } else {
            ctx.strokeStyle = `rgba(100, 116, 139, ${0.015 * (1 - dist / connectionDistance)})`;
          }
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animateLidar);
  }

  animateLidar();

  /* ==========================================================================
     4. Contact Form Handler (Web3Forms API Integration)
     ========================================================================== */
  const contactForm = document.getElementById('contact-form');
  const responseMsg = document.getElementById('form-response-msg');
  const submitBtn = document.getElementById('btn-submit-contact');

  // Replace with your Web3Forms Access Key (get a free one from https://web3forms.com/)
  const WEB3FORMS_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE";

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Disable inputs and show loading state on button
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending node... <i class="fa-solid fa-spinner fa-spin"></i>';
    responseMsg.className = 'form-response';
    responseMsg.style.display = 'none';

    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const subject = document.getElementById('form-subject').value;
    const message = document.getElementById('form-message').value;

    const formData = {
      access_key: WEB3FORMS_ACCESS_KEY,
      name: name,
      email: email,
      subject: subject,
      message: message
    };

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(async (response) => {
      let json = await response.json();
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
      
      if (response.status == 200) {
        responseMsg.className = 'form-response success';
        responseMsg.innerHTML = `<i class="fa-solid fa-square-check"></i> Command successful. Message logged to ROS2 topic inbox. Thank you, <strong>${name}</strong>! I will get back to you at <strong>${email}</strong>.`;
        responseMsg.style.display = 'block';
        contactForm.reset();
      } else {
        responseMsg.className = 'form-response error';
        responseMsg.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Submission failed: ${json.message || 'Please check your access key.'}`;
        responseMsg.style.display = 'block';
      }
    })
    .catch(error => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
      responseMsg.className = 'form-response error';
      responseMsg.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Network error. Please check your internet connection and try again.`;
      responseMsg.style.display = 'block';
    });
  });
});
