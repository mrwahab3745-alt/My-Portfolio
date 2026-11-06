(function () {
  'use strict';

  /* ===== SET YOUR EMAIL HERE ===== */
  let EMAIL = 'mrwahab3745@gmail.com';

  /* OPTIONAL: URL of your own serverless function that calls a real AI model.
     It must accept POST {message, history} and return JSON {reply}.
     Never put an API key in this file. Leave empty to use the built-in assistant. */
  let ASSISTANT_ENDPOINT = '';
  /* =============================== */

  let reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('mailLink').href = 'mailto:' + EMAIL;

  /* marquee */
  let items = ['Frontend', 'HTML', 'CSS', 'JavaScript', 'Bootstrap', 'Responsive', 'Accessibility', 'React (learning)', 'Tailwind (learning)', 'AI-assisted'];
  let html = '';
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < items.length; i++) html += '<span>' + items[i] + ' </span>';
  }
  document.getElementById('track').innerHTML = html;

  /* scroll reveals */
  let revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    let io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* visibility helper: only animate what's on screen */
  function watch(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (en) { cb(en[0].isIntersecting); }, { threshold: 0 }).observe(el);
  }

  /* ===== GLOBE 1: wireframe globe on canvas (Fixed size, no drag, smooth hover) ===== */
  (function () {
    let c = document.getElementById('globe');
    let ctx = c.getContext('2d');
    let w = 0, h = 0, visible = true;
    let lines = [], nodes = [];
    let D = Math.PI / 180;

    function sph(lat, lon) {
      let la = lat * D, lo = lon * D;
      return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
    }
    let lat, lon, pts;
    for (lat = -60; lat <= 60; lat += 30) {
      pts = [];
      for (lon = 0; lon <= 360; lon += 10) pts.push(sph(lat, lon));
      lines.push(pts);
    }
    for (lon = 0; lon < 360; lon += 30) {
      pts = [];
      for (lat = -90; lat <= 90; lat += 10) pts.push(sph(lat, lon));
      lines.push(pts);
    }
    for (lat = -60; lat <= 60; lat += 30) {
      for (lon = 0; lon < 360; lon += 30) nodes.push({ p: sph(lat, lon), hot: (lat + lon) % 90 === 0 });
    }

    function rot(p, ay, ax) {
      let x = p[0] * Math.cos(ay) + p[2] * Math.sin(ay);
      let z = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay);
      let y = p[1] * Math.cos(ax) - z * Math.sin(ax);
      let z2 = p[1] * Math.sin(ax) + z * Math.cos(ax);
      return [x, y, z2];
    }

    function size() {
      let r = c.getBoundingClientRect();
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let ang = 0, ax = 0.4, t = 0, spin = 0.35;
    let hover = false, hoverTilt = 0;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      
      /* Radius calculation with proper padding so the outer ring doesn't get cut */
      let cx = w / 2, cy = h / 2, R = Math.min((w / 2 - 10) / 1.42, h * 0.55);
      let tilt = ax;

      /* orbit ring (back half) */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.38);
      ctx.strokeStyle = 'rgba(212,208,255,.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.38, R * 0.46, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      /* soft glow */
      let g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.1);
      g.addColorStop(0, 'rgba(120,100,255,.28)');
      g.addColorStop(1, 'rgba(120,100,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2); ctx.fill();

      /* lines */
      ctx.lineWidth = 1;
      for (let i = 0; i < lines.length; i++) {
        let L = lines[i], prev = rot(L[0], ang, tilt);
        for (let j = 1; j < L.length; j++) {
          let cur = rot(L[j], ang, tilt);
          let z = (prev[2] + cur[2]) / 2;
          ctx.strokeStyle = 'rgba(205,200,255,' + (0.1 + 0.45 * (z + 1) / 2).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(cx + prev[0] * R, cy - prev[1] * R);
          ctx.lineTo(cx + cur[0] * R, cy - cur[1] * R);
          ctx.stroke();
          prev = cur;
        }
      }

      /* nodes */
      for (let k = 0; k < nodes.length; k++) {
        let n = rot(nodes[k].p, ang, tilt);
        if (n[2] < -0.15) continue;
        let a = 0.35 + 0.65 * (n[2] + 1) / 2;
        ctx.fillStyle = nodes[k].hot ? 'rgba(253,183,54,' + a + ')' : 'rgba(255,255,255,' + a + ')';
        ctx.beginPath();
        ctx.arc(cx + n[0] * R, cy - n[1] * R, nodes[k].hot ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }

      /* orbit ring (front half) + satellite */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.38);
      ctx.strokeStyle = 'rgba(253,183,54,.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.38, R * 0.46, 0, 0, Math.PI);
      ctx.stroke();
      let sx = Math.cos(t * 0.9) * R * 1.38, sy = Math.sin(t * 0.9) * R * 0.46;
      ctx.fillStyle = '#fdb736';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    let BASE = 0.35, FAST = 1.2, last = 0;
    function loop(ts) {
      requestAnimationFrame(loop);
      if (!visible) return;
      let dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      
      let target = hover ? FAST : BASE;
      spin += (target - spin) * Math.min(1, dt * (hover ? 3 : 1.2));
      ang += spin * dt;
      let axT = 0.4 + (hover ? hoverTilt : 0);
      ax += (axT - ax) * Math.min(1, dt * 3);
      
      t += dt;
      draw();
    }

    /* Hover interactions only (dragging completely removed) */
    c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    c.addEventListener('pointerleave', function () { hover = false; hoverTilt = 0; });
    c.addEventListener('pointermove', function (e) {
      let r = c.getBoundingClientRect();
      hoverTilt = ((e.clientY - r.top) / r.height - 0.5) * 0.7;
    });

    size();
    window.addEventListener('resize', function () { size(); draw(); });
    watch(c, function (v) { visible = v; });
    draw();
    if (!reduce) requestAnimationFrame(loop);
  })();

  /* ===== GLOBE 2: draggable 3D tag sphere ===== */
  (function () {
    let box = document.getElementById('cloud');
    let words = [
      ['HTML5', 1], ['CSS3', 1], ['JavaScript', 1], ['Bootstrap', 0], ['React', 0], ['Tailwind', 0],['Hooks', 0], ['Components', 0], ['State', 0], ['Props', 0], ['Events', 0], ['JSX', 0], ['API', 0], ['Fetch', 0],
      ['Responsive', 0], ['Accessibility', 1], ['Flexbox', 0], ['Grid', 0], ['DOM', 0], ['Semantic HTML', 0],
      ['Mobile-first', 0], ['AI workflows', 1], ['Forms', 0], ['Events', 0], ['Animations', 0], ['Layouts', 0]
    ];
    let N = words.length, tags = [], pts = [];
    for (let i = 0; i < N; i++) {
      let y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), phi = i * Math.PI * (3 - Math.sqrt(5));
      pts.push([Math.cos(phi) * rr, y, Math.sin(phi) * rr]);
      let s = document.createElement('span');
      s.className = 'tag' + (words[i][1] ? ' hot' : '');
      s.textContent = words[i][0];
      box.appendChild(s);
      tags.push(s);
    }
    let ay = 0, ax = 0.25, vy = 0.004, vx = 0, drag = false, lx = 0, ly = 0, visible = true;

    function render() {
      let R = box.clientWidth * 0.38, cx = box.clientWidth / 2, cy = box.clientHeight / 2;
      for (let i = 0; i < N; i++) {
        let p = pts[i];
        let x = p[0] * Math.cos(ay) + p[2] * Math.sin(ay);
        let z = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay);
        let y = p[1] * Math.cos(ax) - z * Math.sin(ax);
        let z2 = p[1] * Math.sin(ax) + z * Math.cos(ax);
        let d = (z2 + 1) / 2;
        tags[i].style.transform = 'translate3d(' + (cx + x * R).toFixed(1) + 'px,' + (cy + y * R).toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (0.65 + 0.55 * d).toFixed(3) + ')';
        tags[i].style.opacity = (0.3 + 0.7 * d).toFixed(2);
        tags[i].style.zIndex = Math.round(d * 100);
      }
    }
    function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      if (!drag) {
        ay += vy; ax += vx;
        vx *= 0.95;
        vy += (0.004 - vy) * 0.03;
      }
      render();
    }
    box.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      let dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      ay += dx * 0.01; ax += dy * 0.01; vy = dx * 0.01; vx = dy * 0.01;
    });
    function up() { drag = false; }
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    watch(box, function (v) { visible = v; });
    render();
    if (!reduce) requestAnimationFrame(loop);
  })();

  /* contact form */
  let form = document.getElementById('form'), note = document.getElementById('note');

  if (form && note) {
    let submitButton = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      note.textContent = 'Sending message...';
      if (submitButton) submitButton.disabled = true;

      let payload = {};
      new FormData(form).forEach(function (value, key) {
        if (typeof value === 'string') payload[key] = value;
      });

      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(EMAIL), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.text().then(function (body) {
            let data;
            try {
              data = body ? JSON.parse(body) : null;
            } catch (error) {
              data = null;
            }

            if (!response.ok) {
              throw new Error(
                (data && data.message) ||
                'FormSubmit returned HTTP ' + response.status + '.'
              );
            }
            return data;
          });
        })
        .then(function (data) {
          if (!data || (data.success !== true && data.success !== 'true')) {
            throw new Error(
              (data && data.message) ||
              'FormSubmit did not confirm the submission. Check that the recipient email has been activated.'
            );
          }
          note.textContent = 'Message sent successfully! Thanks for reaching out.';
          form.reset();
        })
        .catch(function (error) {
          console.error('Contact form submission failed:', error);
          let reason = error instanceof TypeError
            ? 'Could not reach FormSubmit. Check your connection, browser extensions, and the browser console.'
            : error.message;
          note.textContent = 'Message not sent: ' + reason + ' You can also email ' + EMAIL + '.';
        })
        .then(function () {
          if (submitButton) submitButton.disabled = false;
        });
    });
  }

  /* mobile menu auto-close */
  let menuToggle = document.getElementById('menu-toggle');
  document.querySelectorAll('.nav-links a').forEach(function(link) {
    link.addEventListener('click', function() {
      if (menuToggle) menuToggle.checked = false;
    });
  });

  /* ===== Assistant chat ===== */
  (function () {
    let btn = document.getElementById('chatBtn'), panel = document.getElementById('chatPanel');
    let log = document.getElementById('chatLog'), cform = document.getElementById('chatForm');
    let input = document.getElementById('chatInput'), closeBtn = document.getElementById('chatClose');
    let chips = document.getElementById('chatChips');
    let history = [], started = false, lang = 'en';

    function T(en, rur, ur) { return { en: en, rur: rur, ur: ur }; }

    let LINKS = {
      stack: { href: '#stack', t: T('See the stack', 'Stack dekhein', 'اسٹیک دیکھیں') },
      work: { href: '#work', t: T('Open selected work', 'Selected work dekhein', 'منتخب کام دیکھیں') },
      contact: { href: '#contact', t: T('Go to contact form', 'Contact form kholein', 'رابطہ فارم کھولیں') }
    };
    let CHIPS = {
      en: ['Skills', 'Projects', 'Availability', 'Contact'],
      rur: ['Skills', 'Projects', 'Availability', 'Rabta'],
      ur: ['مہارتیں', 'پراجیکٹس', 'دستیابی', 'رابطہ']
    };
    let EMAIL_LABEL = T('Email: ', 'Email: ', 'ای میل: ');
    let WELCOME = "Hi! I'm Wahab's portfolio assistant. Ask me about his skills, projects, availability or how to contact him.\nAap Urdu ya Roman Urdu mein bhi pooch sakte hain.";
    let FALLBACK = T(
      "I'm not sure about that one. I can help with Wahab's skills, projects, availability and contact details. For anything else, please use the contact form.",
      "Mujhe iska jawab nahi pata. Main Wahab ki skills, projects, availability aur contact details mein madad kar sakta hoon. Baqi kisi cheez ke liye contact form istemal karein.",
      'مجھے اس کا جواب معلوم نہیں۔ میں وہاب کی مہارتوں، پراجیکٹس، دستیابی اور رابطے کی تفصیلات میں مدد کر سکتا ہوں۔ باقی کسی بات کے لیے رابطہ فارم استعمال کریں۔'
    );

    let INTENTS = [
      {
        id: 'greet',
        re: [/\b(hi|hello|hey|hola)\b/i, /good (morning|evening|afternoon)/i, /\b(salam|salaam|assalam\w*|aoa|slm)\b/i, /(سلام|ہیلو|ہائے)/],
        a: T("Hi! I'm Wahab's portfolio assistant. Ask me about his skills, projects, availability or how to contact him.",
          "Assalam o Alaikum! Main Wahab ka portfolio assistant hoon. Aap mujh se unki skills, projects, availability ya rabta karne ke baare mein pooch sakte hain.",
          'السلام علیکم! میں وہاب کا پورٹ فولیو اسسٹنٹ ہوں۔ آپ مجھ سے ان کی مہارتوں، پراجیکٹس، دستیابی یا رابطے کے بارے میں پوچھ سکتے ہیں۔')
      },
      {
        id: 'howareyou',
        re: [/how are you|how'?s it going|what'?s up|how do you do/i, /(kaise|kese|kaisay) (ho|hain|hai)|kaisa hai|(kya|kia) haal|haal chaal|sab theek/i, /(کیسے ہو|کیسے ہیں|کیا حال|حال چال)/],
        a: T("I'm doing great, thanks for asking! How can I help you with Wahab's portfolio?",
          'Main bilkul theek hoon, shukriya! Wahab ke portfolio ke baare mein main aap ki kya madad kar sakta hoon?',
          'میں بالکل ٹھیک ہوں، شکریہ! وہاب کے پورٹ فولیو کے بارے میں میں آپ کی کیا مدد کر سکتا ہوں؟')
      },
      {
        id: 'thanks',
        re: [/thank|thx|appreciate/i, /shukriya|shukria|meherbani|jazak/i, /(شکریہ|مہربانی|جزاک)/],
        a: T("You're welcome! Anything else you'd like to know?",
          'Koi baat nahi! Kya aap kuch aur janna chahte hain?',
          'کوئی بات نہیں! کیا آپ کچھ اور جاننا چاہتے ہیں؟')
      },
      {
        id: 'bye',
        re: [/\b(bye|goodbye|see you|take care|cya)\b/i, /khuda hafiz|allah hafiz|alvida|phir milte|chalo phir/i, /(خدا حافظ|اللہ حافظ|الوداع)/],
        a: T('Goodbye! Feel free to come back any time, or send Wahab a message through the contact form.',
          'Allah hafiz! Jab dil chahe wapas aayein, ya Wahab ko contact form se message bhej dein.',
          'اللہ حافظ! جب چاہیں واپس آئیں، یا وہاب کو رابطہ فارم کے ذریعے پیغام بھیج دیں۔'),
        link: 'contact'
      },
      {
        id: 'identity',
        re: [/your name|who are you|what are you|are you (a |an )?(bot|ai|human|real|robot|person)/i, /(tumhara|apka|aapka|ap ka|aap ka) naam|(aap|ap|tum|tm) (kaun|kon)|(kaun|kon) ho|bot ho|insan ho|ai ho/i, /(آپ کا نام|تمہارا نام|آپ کون|تم کون|کون ہو|کون ہیں)/],
        a: T("I'm Wahab's portfolio assistant, a simple built-in chatbot. I'm not a person, and I only know what's on this site: his skills, projects, availability and contact details.",
          'Main Wahab ka portfolio assistant hoon, ek simple built-in chatbot. Main insaan nahi hoon, aur sirf wohi jaanta hoon jo is site par hai: unki skills, projects, availability aur contact details.',
          'میں وہاب کا پورٹ فولیو اسسٹنٹ ہوں، ایک سادہ بلٹ اِن چیٹ بوٹ۔ میں انسان نہیں ہوں، اور صرف وہی جانتا ہوں جو اس سائٹ پر ہے: ان کی مہارتیں، پراجیکٹس، دستیابی اور رابطے کی تفصیلات۔')
      },
      {
        id: 'price',
        re: [/\b(rates?|price|pricing|cost|charge|budget|how much|fees?|salary|quote)\b/i, /price|rate\b|kitne paise|kitna paisa|kitna (lo|charge)|kitne ka|qeemat|kimat|fees?\b|budget|charges/i, /(قیمت|ریٹ|فیس|کتنے پیسے|کتنا چارج|بجٹ)/],
        a: T("Pricing depends on the project's size and timeline, so I can't quote a number here. Share your idea through the contact form and Wahab will get back to you.",
          'Qeemat project ke size aur muddat par depend karti hai, is liye main yahan koi raqam nahi bata sakta. Apna idea contact form se bhej dein, Wahab aap se rabta karenge.',
          'قیمت پراجیکٹ کے سائز اور مدت پر منحصر ہے، اس لیے میں یہاں کوئی رقم نہیں بتا سکتا۔ اپنا خیال رابطہ فارم کے ذریعے بھیج دیں، وہاب آپ سے رابطہ کریں گے۔'),
        link: 'contact'
      },
      {
        id: 'react',
        re: [/react|tailwind|learning/i, /seekh|sikh/i, /(سیکھ|ری ایکٹ)/],
        a: T("React and Tailwind CSS are what Wahab is learning right now. He lists them as 'learning', not mastered, and is working toward his first self-authored React project.",
          "Wahab abhi React aur Tailwind CSS seekh rahe hain. Wo inhein sirf 'learning' likhte hain, mahir nahi. Unka agla qadam apna pehla React project khud banana hai.",
          "وہاب اس وقت React اور Tailwind CSS سیکھ رہے ہیں۔ وہ انہیں صرف 'سیکھ رہا ہوں' کے طور پر لکھتے ہیں، ماہر کے طور پر نہیں۔ ان کا اگلا قدم اپنا پہلا React پراجیکٹ خود بنانا ہے۔")
      },
      {
        id: 'skills',
        re: [/skill|stack|tech|language|tools?\b|what (do|can) you know|html|css|javascript|\bjs\b|bootstrap/i, /skills?|maharat|mahaarat|kya aata|kya seekha|kya jante|kya janta|konsi technology|kon si technology/i, /(مہارت|ہنر|ٹیکنالوجی|کیا آتا|کیا جانتے)/],
        a: T('Solid: HTML5, CSS3, JavaScript and Bootstrap.\nLearning: React and Tailwind CSS.\nHe also uses AI-assisted workflows, then reviews and tests everything that ships.',
          'Mazboot: HTML5, CSS3, JavaScript aur Bootstrap.\nSeekh rahe hain: React aur Tailwind CSS.\nWo AI-assisted workflow bhi use karte hain, lekin jo kuch deliver hota hai use khud parhte aur test karte hain.',
          'مضبوط: HTML5، CSS3، JavaScript اور Bootstrap۔\nسیکھ رہے ہیں: React اور Tailwind CSS۔\nوہ AI کی مدد سے بھی کام کرتے ہیں، لیکن جو کچھ بھی دیتے ہیں اسے خود پڑھتے اور ٹیسٹ کرتے ہیں۔'),
        link: 'stack'
      },
      {
        id: 'projects',
        re: [/project|portfolio|built|\bwork\b|aqua|clock|case stud|example/i, /project|kaam dikha|kya banaya|kya bana|banaya hai|banai hai|(apka|aapka|ap ka|aap ka) kaam|konsa kaam/i, /(پراجیکٹ|کام|بنایا|ویب سائٹ)/],
        a: T('1. Aqua Pure Technology: a parts-catalogue website for an RO plant spare parts business in Pakistan.\n2. Convertible Clock: a JavaScript clock built during the NAVTTC WEBCIT course.',
          '1. Aqua Pure Technology: Pakistan mein RO plant spare parts ke karobar ki parts-catalogue website.\n2. Convertible Clock: NAVTTC WEBCIT course mein banayi gayi JavaScript clock.',
          '1. Aqua Pure Technology: پاکستان میں RO پلانٹ کے اسپیئر پارٹس کے کاروبار کی پارٹس کیٹلاگ ویب سائٹ۔\n2. Convertible Clock: NAVTTC WEBCIT کورس میں بنائی گئی JavaScript گھڑی۔'),
        link: 'work'
      },
      {
        id: 'availability',
        re: [/hire|hiring|availab|freelanc|\bjobs?\b|\broles?\b|open to|opportunit|work with|internship|vacanc|recruit/i, /hire|available|freelanc|\bjob\b|naukri|kaam (karwana|karana|kara|karoge|karoge|karna)|intern\b|dastiyab|free (hain|ho)/i, /(دستیاب|نوکری|ملازمت|فری لانس|کام کریں|کام کرو|ہائر|انٹرن)/],
        a: T('Yes, Wahab is open to frontend roles and freelance work, especially small, well-scoped websites. Share your project and timeline through the contact form.',
          'Ji haan, Wahab frontend roles aur freelance kaam ke liye available hain, khaas tor par chhoti aur wazeh scope wali websites ke liye. Apna idea aur timeline contact form se bhej dein.',
          'جی ہاں، وہاب فرنٹ اینڈ ملازمت اور فری لانس کام کے لیے دستیاب ہیں، خاص طور پر چھوٹی اور واضح ضرورت والی ویب سائٹس کے لیے۔ اپنا خیال اور مدت رابطہ فارم کے ذریعے بھیج دیں۔'),
        link: 'contact'
      },
      {
        id: 'contact',
        re: [/contact|e-?mail|reach|message|\btalk|whatsapp|phone|number|\bcall\b|linkedin|github|get in touch/i, /rabta|raabta|contact|e-?mail|mail\b|number|baat (karna|kar)|milna|kaise mil/i, /(رابطہ|ای میل|ایمیل|نمبر|بات کرنا|ملنا)/],
        a: T('The quickest way is the contact form at the bottom of the page.',
          'Sab se tez tareeqa page ke neeche diya gaya contact form hai.',
          'سب سے تیز طریقہ صفحے کے آخر میں دیا گیا رابطہ فارم ہے۔'),
        link: 'contact', email: true
      },
      {
        id: 'education',
        re: [/educat|study|studying|student|universit|degree|course|webcit|navttc|\bvu\b|qualif/i, /parh|parhai|parhta|parhte|taleem|degree|university|course|qualification|student/i, /(پڑھ|تعلیم|یونیورسٹی|ڈگری|کورس)/],
        a: T("Wahab is studying BS Computer Science at the Virtual University of Pakistan and learning web development through NAVTTC's WEBCIT course.",
          'Wahab Virtual University of Pakistan mein BS Computer Science parh rahe hain aur NAVTTC ke WEBCIT course se web development seekh rahe hain.',
          'وہاب ورچوئل یونیورسٹی آف پاکستان میں BS کمپیوٹر سائنس پڑھ رہے ہیں اور NAVTTC کے WEBCIT کورس سے ویب ڈویلپمنٹ سیکھ رہے ہیں۔')
      },
      {
        id: 'experience',
        re: [/experience|how long|how many years|senior|junior|fresher/i, /tajurba|tajruba|experience|kitne saal|kitna purana|kab se/i, /(تجربہ|کتنے سال|کب سے)/],
        a: T("Wahab is early in his career: a student who has built two projects (Aqua Pure Technology and the Convertible Clock) and is learning React. He's upfront that he isn't a seasoned professional yet.",
          'Wahab abhi apne career ki shuruaat mein hain: ek student jinhon ne do projects (Aqua Pure Technology aur Convertible Clock) banaye hain aur ab React seekh rahe hain. Wo saaf bata dete hain ke abhi wo tajurbekar professional nahi hain.',
          'وہاب ابھی اپنے کیریئر کی شروعات میں ہیں: ایک طالب علم جنہوں نے دو پراجیکٹس (Aqua Pure Technology اور Convertible Clock) بنائے ہیں اور اب React سیکھ رہے ہیں۔ وہ صاف بتا دیتے ہیں کہ ابھی وہ تجربہ کار پروفیشنل نہیں ہیں۔')
      },
      {
        id: 'whyhire',
        re: [/why (should|do).*(hire|choose|pick)|strengths?|what makes him|special/i, /(kyun|kyu|kyon|kiu) hire|khoobi|khasiyat|kya khaas|kyun chunen/i, /(کیوں ہائر|خوبی|خاصیت|کیوں چنیں)/],
        a: T("Wahab is honest about his skill level, owns what he ships (AI helps him draft, he reviews and tests), and cares about responsive, accessible pages. He's still growing, so he's keen to learn on real work.",
          'Wahab apni skills ke baare mein saaf goi se baat karte hain, jo deliver karte hain uski zimmedari lete hain (AI draft mein madad karta hai, wo khud review aur test karte hain), aur responsive, accessible pages ka khayal rakhte hain. Abhi wo seekh rahe hain, is liye asli kaam par seekhne ka shauq rakhte hain.',
          'وہاب اپنی مہارتوں کے بارے میں صاف گو ہیں، جو کچھ دیتے ہیں اس کی ذمہ داری لیتے ہیں (AI ڈرافٹ میں مدد کرتا ہے، وہ خود جانچتے اور ٹیسٹ کرتے ہیں)، اور ریسپانسیو، قابلِ رسائی صفحات کا خیال رکھتے ہیں۔ وہ ابھی سیکھ رہے ہیں، اس لیے حقیقی کام پر سیکھنے کا شوق رکھتے ہیں۔'),
        link: 'contact'
      },
      {
        id: 'resume',
        re: [/resume|\bcv\b|curriculum/i, /resume|\bcv\b|biodata|bio data/i, /(ریزیومے|ریزیوم|سی وی|بائیو ڈیٹا)/],
        a: T("A downloadable CV isn't on the site yet. Please ask through the contact form and Wahab can share it.",
          'Abhi site par download karne wali CV mojood nahi. Contact form se pooch lein, Wahab share kar denge.',
          'ابھی سائٹ پر ڈاؤن لوڈ کے لیے سی وی موجود نہیں۔ رابطہ فارم کے ذریعے پوچھ لیں، وہاب شیئر کر دیں گے۔'),
        link: 'contact'
      },
      {
        id: 'location',
        re: [/\bwhere\b|location|based|country|\bcity\b|\blive\b|pakistan|time ?zone/i, /kahan|kahaan|kidhar|location|shehar|mulk|pakistan|rehte|rehta/i, /(کہاں|شہر|ملک|پاکستان|رہتے)/],
        a: T('Wahab is based in Pakistan (PKT, UTC+5).',
          'Wahab Pakistan mein rehte hain (PKT, UTC+5).',
          'وہاب پاکستان میں رہتے ہیں (PKT، UTC+5)۔')
      },
      {
        id: 'ai',
        re: [/\bai\b|chatgpt|claude|copilot/i, /\bai\b|chatgpt|claude/i, /(اے آئی|مصنوعی ذہانت)/],
        a: T('Wahab uses AI tools to draft and debug faster, then reads, tests and owns everything that ships.',
          'Wahab AI tools se draft aur debugging tez karte hain, phir jo bhi ship hota hai use khud parhte, test karte aur uski zimmedari lete hain.',
          'وہاب AI ٹولز سے ڈرافٹ اور ڈیبگنگ تیز کرتے ہیں، پھر جو کچھ بھی دیتے ہیں اسے خود پڑھتے، ٹیسٹ کرتے اور اس کی ذمہ داری لیتے ہیں۔')
      },
      {
        id: 'about',
        re: [/who is wahab|about wahab|tell me about|introduce|about him|background|^\W*wahab\W*$/i, /wahab (kaun|kon)|wahab ke baare|introduction|\bintro\b|unke baare|bare mein batao|baare mein batao/i, /(وہاب کون|وہاب کے بارے|تعارف)/],
        a: T('Wahab Ahmad (MR.Developer) is a frontend developer in the making. He builds fast, accessible, responsive websites with HTML, CSS and JavaScript, and studies BS Computer Science at the Virtual University of Pakistan.',
          'Wahab Ahmad (MR.Developer) ek frontend developer hain jo abhi seekh rahe hain aur aage badh rahe hain. Wo HTML, CSS aur JavaScript se tez, accessible aur responsive websites banate hain, aur Virtual University of Pakistan mein BS Computer Science parh rahe hain.',
          'وہاب احمد (MR.Developer) ایک فرنٹ اینڈ ڈویلپر ہیں جو اپنی مہارتیں بڑھا رہے ہیں۔ وہ HTML، CSS اور JavaScript سے تیز، قابلِ رسائی اور ریسپانسیو ویب سائٹس بناتے ہیں، اور ورچوئل یونیورسٹی آف پاکستان میں BS کمپیوٹر سائنس پڑھ رہے ہیں۔')
      },
      {
        id: 'help',
        re: [/\bhelp\b|what can you do|what do you do|options|menu/i, /madad|\bhelp\b|kya kar sakte|kya kar sakta|kya kya|kia kia/i, /(مدد|کیا کر سکتے|کیا کر سکتا)/],
        a: T("I can tell you about Wahab's skills, projects, education, availability and how to contact him. You can ask in English, Roman Urdu or Urdu.",
          'Main Wahab ki skills, projects, taleem, availability aur rabta karne ka tareeqa bata sakta hoon. Aap English, Roman Urdu ya Urdu mein pooch sakte hain.',
          'میں وہاب کی مہارتوں، پراجیکٹس، تعلیم، دستیابی اور رابطے کا طریقہ بتا سکتا ہوں۔ آپ انگریزی، رومن اردو یا اردو میں پوچھ سکتے ہیں۔')
      },
      {
        id: 'ack',
        re: [/^\W*(ok|okay|cool|nice|great|good|awesome|alright|got it)\W*$/i, /^\W*(acha|accha|theek hai|thik hai|ok|chalo|badiya|shabash|zabardast|samajh gaya)\W*$/i, /^\W*(اچھا|ٹھیک ہے|ٹھیک|بہت خوب|سمجھ گیا)\W*$/],
        a: T('Glad to hear it! Is there anything else you would like to know about Wahab?',
          'Khushi hui! Kya aap Wahab ke baare mein kuch aur poochna chahte hain?',
          'خوشی ہوئی! کیا آپ وہاب کے بارے میں کچھ اور پوچھنا چاہتے ہیں؟')
      }
    ];

    let RU = /\b(kya|kia|kiya|hai|hain|hoon|aap|apka|aapka|apki|aapki|tum|tumhara|kaise|kese|kaisay|kaisi|mujhe|mujhy|mjhe|batao|batain|bataye|bataiye|btao|btayen|nahi|nahin|haan|shukriya|shukria|theek|thik|kahan|kahaan|kaun|kon|konsi|kitna|kitne|chahiye|chahie|sakte|sakta|sakty|skte|skta|karte|karta|kaam|rehte|rehta|mein|bhi|abhi|acha|accha|bhai|yaar|yar|salam|assalam|aoa|rabta|parh|taleem|tajurba|kidhar|madad|khuda|allah|seekh|hafiz|mera|meri|apna|apni)\b/i;

    function norm(s) {
      return s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ه/g, 'ہ')
        .replace(/[ً-ٰٟ]/g, '').trim();
    }
    function detect(q) {
      if (/[؀-ۿ]/.test(q)) return 'ur';
      return RU.test(q) ? 'rur' : null;
    }
    function match(q) {
      let best = null, bestScore = 0;
      for (let i = 0; i < INTENTS.length; i++) {
        let s = 0;
        for (let j = 0; j < INTENTS[i].re.length; j++) if (INTENTS[i].re[j].test(q)) s++;
        if (s > bestScore) { best = INTENTS[i]; bestScore = s; }
      }
      return best;
    }

    function reply(rawQ) {
      let q = norm(rawQ);
      let d = detect(q);
      if (d) lang = d;
      else if (q.split(/\s+/).length > 2) lang = 'en';
      let it = match(q);
      let r = it ? { text: it.a[lang], link: it.link, email: it.email } : { text: FALLBACK[lang], link: 'contact' };
      r.lang = lang;
      return r;
    }

    function setChips() {
      let labels = CHIPS[lang], bs = chips.querySelectorAll('button');
      for (let i = 0; i < bs.length; i++) bs[i].textContent = labels[i];
      cform.querySelector('button').textContent = lang === 'ur' ? 'بھیجیں' : 'Send';
      input.placeholder = lang === 'ur' ? 'اپنا سوال لکھیں...' : (lang === 'rur' ? 'Skills, projects ke baare mein poochein...' : 'Ask about skills, projects...');
    }

    function add(who, text, extra) {
      let d = document.createElement('div');
      d.className = 'msg ' + who;
      let rtl = who === 'bot' ? (extra && extra.lang === 'ur') : /[؀-ۿ]/.test(text);
      if (rtl) d.setAttribute('dir', 'rtl');
      d.appendChild(document.createTextNode(text));
      if (extra && extra.email) {
        d.appendChild(document.createTextNode('\n' + EMAIL_LABEL[extra.lang || 'en']));
        let m = document.createElement('a'); m.href = 'mailto:' + EMAIL; m.textContent = EMAIL; m.setAttribute('dir', 'ltr'); d.appendChild(m);
      }
      if (extra && extra.link) {
        let L = LINKS[extra.link];
        d.appendChild(document.createTextNode('\n'));
        let a = document.createElement('a'); a.href = L.href;
        a.textContent = L.t[extra.lang || 'en'] + (extra.lang === 'ur' ? ' ←' : ' →');
        a.addEventListener('click', function () { setOpen(false); });
        d.appendChild(a);
      }
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      return d;
    }

    function answer(q) {
      add('me', q);
      history.push({ role: 'user', text: q });
      let r = reply(q);
      setChips();
      let typing = document.createElement('div');
      typing.className = 'msg bot typing'; typing.setAttribute('aria-label', 'Assistant is typing');
      typing.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(typing); log.scrollTop = log.scrollHeight;

      function show(res) {
        setTimeout(function () {
          typing.remove();
          add('bot', res.text, res);
          history.push({ role: 'assistant', text: res.text });
        }, ASSISTANT_ENDPOINT ? 0 : 450);
      }
      if (ASSISTANT_ENDPOINT) {
        fetch(ASSISTANT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, language: lang, history: history.slice(-8) }) })
          .then(function (x) { return x.json(); })
          .then(function (d) { show(d && d.reply ? { text: String(d.reply), lang: lang } : r); })
          .catch(function () { show(r); });
      } else {
        show(r);
      }
    }

    function setOpen(open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close chat assistant' : 'Open chat assistant');
      if (open) {
        if (!started) { started = true; add('bot', WELCOME, { lang: 'en' }); }
        input.focus();
      }
    }
    btn.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    closeBtn.addEventListener('click', function () { setOpen(false); btn.focus(); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); btn.focus(); } });
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      let q = input.value.trim();
      if (!q) return;
      input.value = '';
      answer(q);
      input.focus();
    });
    chips.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON') answer(e.target.textContent);
    });
  })();
})();