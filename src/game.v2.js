
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const icon = name => `<svg class="icon"><use href="#i-${name}"></use></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const SIZES = {
    small:{name:'小罐', ml:180, scale:.84},
    medium:{name:'中罐', ml:300, scale:.95},
    large:{name:'大罐', ml:420, scale:1.05}
  };
  const SUGAR = {
    1:{name:'少糖', target:31, tol:8},
    2:{name:'标准糖', target:61, tol:9},
    3:{name:'多糖', target:87, tol:7}
  };
  const TEMPS = {ice:'冰镇', room:'常温', warm:'温热'};
  const JARS = {
    classic:{name:'经典罐', price:0, free:true, scale:1},
    narrow:{name:'窄口罐', price:80, scale:.84},
    wide:{name:'广口罐', price:100, scale:1.12}
  };
  const TOPPINGS = {
    none:{name:'不加', icon:'x'},
    mint:{name:'薄荷', icon:'leaf'},
    osmanthus:{name:'桂花', icon:'flower'},
    dates:{name:'红枣', icon:'peach'},
    goji:{name:'枸杞', icon:'flower'},
    rock:{name:'冰糖', icon:'drop'},
    honeysuckle:{name:'金银花', icon:'flower'}
  };
  const BASE_TOPPINGS = ['mint','osmanthus'];
  const EXPANSION = {
    topping:[
      {id:'dates', name:'红枣', price:45, desc:'甜香厚实的红枣，客人可能点 1–3 勺'},
      {id:'goji', name:'枸杞', price:55, desc:'养生系枸杞，订单里可能出现'},
      {id:'rock', name:'冰糖', price:65, desc:'清甜冰糖，配黄桃糖水正好'},
      {id:'honeysuckle', name:'金银花', price:75, desc:'清爽金银花，夏日限定加料'}
    ],
    jar:[
      {id:'narrow', name:'窄口罐', price:80, desc:'瓶口更窄，倒糖水时要更稳'},
      {id:'wide', name:'广口罐', price:100, desc:'大口装桃，摆盘更豪放'}
    ]
  };
  const GUESTS = [
    {name:'小黄', kind:'dog', tier:'normal', accessory:null, body:'#FFC91D', bodyDark:'#EDB114', belly:'#FFF0C8',
      greet:'第一次来！听说奶蛙的罐头超好吃～',
      happy:'这罐黄桃也太香了吧！冰冰凉凉，甜度刚刚好！',
      okay:'味道不错～下次我会再来买的。'},
    {name:'阿蓝', kind:'dog', tier:'normal', accessory:'cap', body:'#FFD447', bodyDark:'#E9B41D', belly:'#FFF3D4', cap:'#4E8CC9',
      greet:'老板，给我来一罐，拜托啦！',
      happy:'哇，就是这个味道！黄桃又大又甜，奶蛙好厉害！',
      okay:'还不错哦，下次记得快一点点～'},
    {name:'豆豆', kind:'dog', tier:'normal', accessory:'glasses', body:'#F5B72B', bodyDark:'#DEA11A', belly:'#FFE9B8',
      greet:'嘿嘿，今天想尝点不一样的～',
      happy:'太完美了！暖乎乎的糖水配黄桃，超级治愈！',
      okay:'味道可以，下次再给你一次机会吧～'},
    {name:'口水猫', kind:'cat', tier:'normal', patience:1.02, coin:1.05, tolDelta:0,
      greet:'吸溜……好香的黄桃味，我可以在窗边等吗？',
      happy:'吸溜！这罐也太好吃了吧，甜水我都想喝光！',
      okay:'还不错，就是我的口水快滴到柜台上了……'},
    {name:'夜莺师傅', kind:'bird', tier:'normal', patience:.95, coin:1.1, tolDelta:0,
      greet:'嗯……让我听听这罐黄桃的声音。',
      happy:'高音甜，中音准，低音沉——这罐黄桃，通透！',
      okay:'节奏还行，尾音差了点意思。'},
    {name:'海绵宝宝', kind:'sponge', tier:'normal', patience:1.1, coin:1.1, tolDelta:0,
      greet:'我准备好啦！我准备好啦！今天也要来一罐黄桃！',
      happy:'这罐黄桃比蟹黄堡还香！我要给它打一百分！',
      okay:'嗯……味道不错，不过还可以再快乐一点！'},
    {name:'飞机耳猫', kind:'plane', tier:'normal', patience:1.05, coin:1.05, tolDelta:0,
      greet:'（飞机耳）……可以，给我一罐吗？我、我会付钱的。',
      happy:'耳朵都竖起来了！这罐真的好好吃！',
      okay:'嗯……还行吧，我没有很失望。'}
  ];
  const ELITE_GUEST = {name:'寸头猪', kind:'pig', tier:'elite', badge:'精英', personality:'strict', patience:.8, coin:1.35, tolDelta:-2,
    greet:'我从沙漠一路溜达来的。给我做罐讲究点的，别糊弄。',
    happy:'行啊，这手艺在沙漠里能开分店。',
    okay:'凑合吧，下次糖水可别倒歪了。'};
  const BOSS_GUEST = {name:'认真狗', kind:'serious', tier:'boss', badge:'BOSS', personality:'strict', patience:.62, coin:2, tolDelta:-3,
    greet:'我只说一遍：罐型、块数、糖水比例，全部按单子来。',
    happy:'……合格。今天的检查，你通过了。',
    okay:'有几个细节不达标。下次我会带放大镜来。'};
  const PATRICK_GUEST = {name:'派大星', kind:'patrick', tier:'boss', badge:'BOSS', personality:'irritable', patience:.7, coin:1.9, tolDelta:-2,
    greet:'我是一颗星……听说这里有黄桃罐头？我要用全部零花钱买！',
    happy:'太——好——吃——啦！我要把它当枕头抱着睡！',
    okay:'我有点没吃明白……不过没关系，再来一罐！'};
  function bossGuestForDay(day){
    const week = Math.floor((day - 1) / WEEK_DAYS) + 1;
    return week % 2 === 0 ? PATRICK_GUEST : BOSS_GUEST;
  }
  const PERSONALITIES = {
    patient:{
      id:'patient', name:'有耐心', icon:'☕', color:'#4E9A7A',
      delta:[60000,120000],
      desc:'愿意多等一会儿的客人，通常也会点更复杂的东西。',
      effect:'等待时间 +1~2 分钟 · 订单更复杂'
    },
    generous:{
      id:'generous', name:'大方', icon:'💛', color:'#D7A11E',
      delta:[0,0],
      desc:'对不完美和小错误很包容，吃到好吃的就开心。',
      effect:'最终评分更宽松 · 小错误扣分更少'
    },
    strict:{
      id:'strict', name:'苛刻', icon:'📏', color:'#C15A4A',
      delta:[-60000,-20000],
      desc:'对细节要求很高，订单也更复杂，而且不太愿意等。',
      effect:'等待 −20~60 秒 · 订单更复杂 · 评分更严格'
    },
    impatient:{
      id:'impatient', name:'缺乏耐心', icon:'⏳', color:'#C77A3A',
      delta:[-60000,-30000],
      desc:'不想等太久，通常只点简单的东西。',
      effect:'等待 −30~60 秒 · 订单更简单'
    },
    irritable:{
      id:'irritable', name:'易怒', icon:'💢', color:'#B64C58',
      delta:[-10000,-10000],
      desc:'一点小错误就会让心情变差，评价掉得很快。',
      effect:'扣分被放大 · 小错误代价很高'
    }
  };
  const PERSONALITY_IDS = ['patient','generous','strict','impatient','irritable'];
  const SPECIAL_SLOT = {elite:1, boss:2};
  function specialForDay(day){
    const d = ((day - 1) % WEEK_DAYS) + 1;
    if(d === 7) return {type:'boss', slot:SPECIAL_SLOT.boss, guest:bossGuestForDay(day)};
    if(d === 5) return {type:'elite', slot:SPECIAL_SLOT.elite, guest:ELITE_GUEST};
    return null;
  }
  function personalityFor(guest){
    if(guest && guest.personality && PERSONALITIES[guest.personality]) return PERSONALITIES[guest.personality];
    return PERSONALITIES[PERSONALITY_IDS[randInt(0, PERSONALITY_IDS.length - 1)]];
  }
  function personalityTag(p){
    if(!p) return '';
    return `<span class="personality-tag" style="--pc:${p.color}">${p.icon} ${p.name}</span>`;
  }
  function personalityWaitText(p){
    if(!p) return '';
    if(p.delta[0] >= 60000) return `等待 +${Math.round(p.delta[0]/60000)}~${Math.round(p.delta[1]/60000)} 分钟`;
    if(p.delta[0] <= -20000) return `等待 ${Math.round(p.delta[0]/1000)}~${Math.round(p.delta[1]/1000)} 秒`;
    if(p.id === 'irritable') return '小错误扣分放大';
    return '评分更宽松';
  }
  function personalityPatience(p, guest){
    const base = PATIENCE_MS * (guest.patience || 1);
    const delta = p && p.delta ? randInt(p.delta[0], p.delta[1]) : 0;
    return clamp(Math.round(base + delta), 90000, 360000);
  }
  function markSeen(guest){
    if(!activeProfile || !guest || (guest.tier !== 'elite' && guest.tier !== 'boss')) return;
    const key = guest.tier;
    activeProfile.seen[key] = activeProfile.seen[key] || [];
    if(!activeProfile.seen[key].includes(guest.name)){
      activeProfile.seen[key].push(guest.name);
      saveProfiles();
    }
  }

  const MODES = {
    normal:{name:'普通模式', days:14, desc:'14 天周目 · 尽可能多赚钱'},
    endless:{name:'无尽模式', weekDays:7, desc:'每周完成业绩 · 不达标就关门'}
  };
  const NORMAL_DAYS = 14;
  const WEEK_DAYS = 7;
  const weekTargetFor = week => Math.min(900, 280 + (week - 1) * 55);
  const MUSIC = {
    title:'music/title.mp3',
    desk:'music/desk.mp3',
    work:'music/work.mp3',
    summary:'music/summary.mp3'
  };
  const PATIENCE_MS = 220000;
  const GUEST_COUNT = 3;
  const POUR_RATE = 0.032;
  const BOIL_MS = 14000;
  const BOIL_MIN = 55;
  const BOIL_MAX = 82;
  const CUT_STOCK = 14;
  const MAX_PIECES = 5;
  const SYRUPS = {
    classic:{name:'经典糖浆', short:'经典', color:'#F3BC45', grad:['#FFD76B','#F19A2D'], price:0, desc:'黄桃罐头的招牌糖水'},
    honey:{name:'蜂蜜', short:'蜂蜜', color:'#E7A12B', grad:['#FFD36A','#D98812'], price:120, desc:'更浓更甜，带一点花香'},
    maple:{name:'枫糖浆', short:'枫糖', color:'#A96532', grad:['#D79A5B','#8B4B23'], price:150, desc:'焦糖木香，和蜂蜜很搭'},
    honeysuckle:{name:'金银花糖浆', short:'金银花', color:'#B7C95A', grad:['#E6F0A6','#93AA39'], price:160, desc:'清爽草本香，和蜂蜜很搭'}
  };
  const SYRUP_IDS = ['classic','honey','maple','honeysuckle'];
  const ALARM_PRICE = 35;
  const SAVE_KEY = 'naiwa_v2_save';
  const POT_PRICES = {1:28, 2:48, 3:75};
  const KNIVES = {
    wood:{name:'木柄刀', price:0, color:'#8A5A32'},
    mint:{name:'薄荷刀', price:18, color:'#62B79A'},
    sakura:{name:'樱花刀', price:35, color:'#E39AAE'},
    gold:{name:'黄金刀', price:60, color:'#E8B53A'}
  };
  const SETTINGS_KEY = 'naiwa_settings_v1';
  const DEFAULT_SETTINGS = {master:80, music:70, alarm:80};
  let settings = {...DEFAULT_SETTINGS};
  try{
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    ['master','music','alarm'].forEach(k => {
      if(Number.isFinite(raw[k])) settings[k] = clamp(Math.round(raw[k]), 0, 100);
    });
  }catch(e){}
  function saveSettings(){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){}
  }
  function applyAudioVolumes(){
    if(masterGain) masterGain.gain.value = state.sound ? settings.master / 100 * .7 : 0;
    if(!bgmEl) bgmEl = els.bgm;
    if(bgmEl) bgmEl.volume = state.sound ? settings.master / 100 * settings.music / 100 * .6 : 0;
    if(alarmEl) alarmEl.volume = state.sound ? Math.min(.55, settings.master / 100 * settings.alarm / 100 * .38) : 0;
  }

  /* -------------------- 玩家小家数据 -------------------- */
  const PROFILE_KEY = 'naiwa_profiles_v1';
  const ACTIVE_KEY = 'naiwa_active_v1';
  const GIST_TOKEN_KEY = 'naiwa_gist_token';
  const GIST_ID_KEY = 'naiwa_gist_id';
  const GIST_FILE = 'naiwa-cloud-save.json';
  const SB_URL_KEY = 'naiwa_sb_url';
  const SB_KEY_KEY = 'naiwa_sb_key';
  const SB_DEFAULT_URL = 'https://ckwfbkqnczlsvvrhhaqb.supabase.co';
  const SB_DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd2Zia3FuY3psc3Z2cmhoYXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjMyMjEsImV4cCI6MjEwODg5OTIyMX0.N1M4YxM6gmztjkFdhXViIYc7TMyLz9W1LzhXNgaYrBA';
  const FURNITURE = {
    rug:{name:'黄桃地毯', price:60, icon:'🟨', desc:'软乎乎，踩上去像踩在黄桃上'},
    plant:{name:'薄荷盆栽', price:45, icon:'🌿', desc:'让小家闻起来清清凉凉'},
    lamp:{name:'暖黄落地灯', price:90, icon:'💡', desc:'打烊后的温柔灯光'},
    table:{name:'小木桌', price:80, icon:'🪵', desc:'放一罐刚封好的黄桃'},
    shelf:{name:'罐头陈列架', price:120, icon:'🫙', desc:'把招牌罐头摆给客人看'},
    pumpkin:{name:'南瓜灯', price:70, icon:'🎃', desc:'万圣节限定的小摆件'}
  };
  const FURN_POS = {
    rug:{x:38,y:91}, plant:{x:26,y:74}, lamp:{x:69,y:58},
    table:{x:32,y:78}, shelf:{x:66,y:33}, pumpkin:{x:58,y:73}
  };
  const CLOTHES = {
    head:[
      {id:'chef', name:'厨师帽', price:0, free:true, icon:'👨‍🍳'},
      {id:'witch', name:'万圣尖帽', price:55, icon:'🧙'},
      {id:'glasses', name:'圆框眼镜', price:35, icon:'👓'},
      {id:'shades', name:'墨镜', price:45, icon:'🕶️'},
      {id:'scholar', name:'校园鸭舌帽', price:50, icon:'🧢'}
    ],
    top:[
      {id:'apron', name:'奶蛙围裙', price:0, free:true, icon:'🥼'},
      {id:'hoodie', name:'黄桃卫衣', price:60, icon:'🧥'},
      {id:'uniform', name:'校园制服', price:70, icon:'🎽'},
      {id:'pumpkin', name:'南瓜毛衣', price:65, icon:'🎃'}
    ]
  };
  const SKIN_AREAS = {desk:'服务台', work:'工作台', kitchen:'厨房'};
  const SKINS = {
    desk:[
      {id:'classic', name:'原木小店', price:0, free:true},
      {id:'halloween', name:'万圣南瓜', price:80},
      {id:'campus', name:'校园值日', price:80}
    ],
    work:[
      {id:'classic', name:'原木工作台', price:0, free:true},
      {id:'halloween', name:'南瓜工坊', price:80},
      {id:'campus', name:'校园手工课', price:80}
    ],
    kitchen:[
      {id:'classic', name:'原木厨房', price:0, free:true},
      {id:'halloween', name:'女巫厨房', price:80},
      {id:'campus', name:'校园食堂', price:80}
    ]
  };
  function defaultProfile(name){
    return {
      name:name || '奶蛙店长', wallet:200, bestNormal:0, bestEndless:0, totalRuns:0,
      ownedFurniture:[], placedFurniture:[], furniturePositions:{},
      clothes:{head:['chef'], top:['apron']},
      equipped:{head:'chef', top:'apron'},
      skins:{desk:['classic'], work:['classic'], kitchen:['classic']},
      equippedSkins:{desk:'classic', work:'classic', kitchen:'classic'},
      unlocks:{toppings:[], jars:[]},
      upgrades:{pots:1, alarms:0, knife:'wood', knives:['wood']},
      syrups:{honey:false, maple:false, honeysuckle:false},
      seen:{elite:[], boss:[]},
      lastRun:null
    };
  }
  let profiles = {};
  let activeProfile = null;
  let cloudSuppress = false;
  let cloudTimer = null;

  let audioCtx = null, masterGain = null;
  let batchSeq = 0;

  function emptyCan(){
    return {size:null, jar:'classic', pieces:[], syrup:0, components:{classic:0,honey:0,maple:0,honeysuckle:0}, stirred:false, temp:null, toppings:[], toppingTouched:false, sealed:false, batchIds:[]};
  }
  function makePots(){
    return Array.from({length:4}, (_,i) => ({id:i, sugar:0, types:['classic'], progress:0, status:'idle', quality:null, startedAt:0, alarm:false, alarmFired:false}));
  }

  const state = {
    phase:'intro', stage:'desk', day:1, coins:0, best:0,
    mode:'normal', introMode:'normal', runEarned:0, week:1, weekEarned:0, weekTarget:weekTargetFor(1),
    summaryKind:'day', bestNormal:0, bestEndless:0,
    dayCoins:0, dayStars:0, guestIndex:0, guest:null, personality:null, order:null, todayGuests:[],
    can:emptyCan(), bowl:{large:0,small:0}, stock:Infinity,
    pots:makePots(), batches:[], selectedBatch:null,
    upgrade:{pots:1, alarms:0, knife:'wood', knives:['wood']},
    reviews:[], patience:1, patienceMs:PATIENCE_MS, deadline:0, pouring:false,
    sound:true, lastPourSfx:0, speechTimer:null, toastTimer:null, scoreResult:null,
    metaAwarded:false, homeTab:'room', skinPreview:{area:'desk', id:'classic'}, shopTab:'run'
  };
  let bgmEl = null, bgmKey = null, bgmToken = 0, musicWanted = false, alarmEl = null;

  /* -------------------- 音效 -------------------- */
  function ensureAudio(){
    try{
      if(!audioCtx){
        const AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return;
        audioCtx = new AC();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = state.sound ? settings.master / 100 * .7 : 0;
        masterGain.connect(audioCtx.destination);
      }
      if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    }catch(e){ audioCtx = null; }
  }
  function playAlarm(){
    if(!state.sound) return;
    try{
      if(!alarmEl){
        alarmEl = new Audio('music/alarm.mp3');
        alarmEl.preload = 'auto';
      }
      alarmEl.volume = state.sound ? Math.min(.55, settings.master / 100 * settings.alarm / 100 * .38) : 0;
      alarmEl.currentTime = 0;
      const p = alarmEl.play();
      if(p && p.catch) p.catch(()=>{});
    }catch(e){}
  }
  const SFX_BOOST = 1.55;
  function tone(freq, dur=.08, type='sine', vol=.05, delay=0, endFreq=null){
    if(!audioCtx || !state.sound) return;
    try{
      const t = audioCtx.currentTime + delay;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if(endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.min(.9, vol * SFX_BOOST), t + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(gain); gain.connect(masterGain);
      osc.start(t); osc.stop(t + dur + .03);
    }catch(e){}
  }
  const sfx = {
    tap(){ tone(520,.045,'triangle',.035); },
    add(){ tone(330,.07,'sine',.06,0,520); tone(680,.06,'sine',.03,.055); },
    remove(){ tone(320,.07,'sine',.035,0,220); },
    chop(){ tone(240,.035,'square',.025,0,160); tone(620,.05,'triangle',.035,.035); },
    pour(){ tone(210 + Math.random()*70,.055,'sine',.022); },
    ding(){ tone(880,.1,'sine',.045); tone(1174,.13,'sine',.035,.08); },
    alarm(){ playAlarm(); },
    error(){ tone(170,.12,'square',.025,0,140); },
    seal(){ tone(160,.1,'square',.025); tone(360,.1,'triangle',.045,.08); tone(740,.1,'sine',.028,.15); },
    serve(){ tone(523,.12,'triangle',.05); tone(659,.12,'triangle',.045,.1); tone(784,.18,'triangle',.04,.2); },
    star(){ tone(660,.08,'sine',.04); tone(880,.09,'sine',.04,.09); tone(1100,.14,'sine',.035,.18); },
    coin(){ tone(920,.07,'triangle',.04); tone(1240,.1,'triangle',.035,.07); },
    sad(){ tone(330,.16,'triangle',.035,0,247); tone(220,.22,'triangle',.03,.15,196); },
    guest(){ tone(660,.12,'sine',.035); tone(990,.16,'sine',.03,.13); }
  };
  function buzz(ms){ try{ if(navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); }catch(e){} }

  /* -------------------- 背景音乐 -------------------- */
  function musicKeyFor(){
    if(state.phase === 'intro') return 'title';
    if(state.phase === 'playing') return state.stage === 'desk' ? 'desk' : 'work';
    return 'summary';
  }
  function playBgm(key){
    if(!bgmEl) bgmEl = els.bgm;
    if(!bgmEl) return;
    if(!state.sound){ bgmEl.pause(); return; }
    if(bgmKey === key){
      if(bgmEl.paused){ const p = bgmEl.play(); if(p && p.catch) p.catch(()=>{}); }
      return;
    }
    bgmKey = key;
    const token = ++bgmToken;
    try{
      bgmEl.pause();
      bgmEl.src = MUSIC[key];
      applyAudioVolumes();
      const p = bgmEl.play();
      if(p && p.catch) p.catch(()=>{});
    }catch(e){}
  }
  function cueMusic(){
    playBgm(musicKeyFor());
  }

  /* -------------------- 存档 -------------------- */
  function loadSave(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return;
      const s = JSON.parse(raw);
      if(Number.isFinite(s.bestNormal)) state.bestNormal = Math.max(0, s.bestNormal);
      if(Number.isFinite(s.bestEndless)) state.bestEndless = Math.max(0, s.bestEndless);
      if(Number.isFinite(s.coins)) state.coins = Math.max(0, s.coins);
      if(Number.isFinite(s.best)) state.best = Math.max(0, s.best);
      if(s.upgrade){
        if(Number.isFinite(s.upgrade.pots)) state.upgrade.pots = clamp(s.upgrade.pots, 1, 4);
        if(typeof s.upgrade.alarm === 'boolean') state.upgrade.alarm = s.upgrade.alarm;
        if(s.upgrade.knife && KNIVES[s.upgrade.knife]) state.upgrade.knife = s.upgrade.knife;
        if(Array.isArray(s.upgrade.knives)){
          state.upgrade.knives = ['wood'].concat(s.upgrade.knives.filter(k => k !== 'wood' && KNIVES[k]));
        }
      }
    }catch(e){}
  }
  function saveGame(){
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        coins:state.coins, best:state.best, bestNormal:state.bestNormal, bestEndless:state.bestEndless,
        upgrade:state.upgrade
      }));
    }catch(e){}
  }

  /* -------------------- 玩家档 / 小家 / 排行榜 -------------------- */
  function normalizeProfile(p){
    const d = defaultProfile(p.name);
    p.wallet = Number.isFinite(p.wallet) ? Math.max(0, p.wallet) : d.wallet;
    p.bestNormal = Number.isFinite(p.bestNormal) ? Math.max(0, p.bestNormal) : 0;
    p.bestEndless = Number.isFinite(p.bestEndless) ? Math.max(0, p.bestEndless) : 0;
    p.totalRuns = Number.isFinite(p.totalRuns) ? p.totalRuns : 0;
    p.ownedFurniture = Array.isArray(p.ownedFurniture) ? p.ownedFurniture.filter(id => FURNITURE[id]) : [];
    p.placedFurniture = Array.isArray(p.placedFurniture) ? p.placedFurniture.filter(id => p.ownedFurniture.includes(id)).slice(0,4) : [];
    p.furniturePositions = p.furniturePositions && typeof p.furniturePositions === 'object' ? p.furniturePositions : {};
    const legacyPos = {rug:{x:50,y:86}, plant:{x:13,y:72}, lamp:{x:87,y:56}, table:{x:27,y:76}, shelf:{x:82,y:31}, pumpkin:{x:58,y:71}};
    p.placedFurniture.forEach((id,i) => {
      const pos = p.furniturePositions[id];
      if(!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) p.furniturePositions[id] = FURN_POS[id] || {x:22+i*18,y:70};
      else if(legacyPos[id] && Math.abs(pos.x-legacyPos[id].x) < 1 && Math.abs(pos.y-legacyPos[id].y) < 1) p.furniturePositions[id] = FURN_POS[id];
    });
    p.clothes = p.clothes && typeof p.clothes === 'object' ? p.clothes : {};
    p.clothes.head = Array.isArray(p.clothes.head) ? p.clothes.head.filter(id => CLOTHES.head.some(c => c.id === id)) : [];
    p.clothes.top = Array.isArray(p.clothes.top) ? p.clothes.top.filter(id => CLOTHES.top.some(c => c.id === id)) : [];
    ['chef'].forEach(id => { if(!p.clothes.head.includes(id)) p.clothes.head.push(id); });
    ['apron'].forEach(id => { if(!p.clothes.top.includes(id)) p.clothes.top.push(id); });
    p.equipped = p.equipped && typeof p.equipped === 'object' ? p.equipped : {};
    if(!p.clothes.head.includes(p.equipped.head)) p.equipped.head = 'chef';
    if(!p.clothes.top.includes(p.equipped.top)) p.equipped.top = 'apron';
    p.skins = p.skins && typeof p.skins === 'object' ? p.skins : {};
    p.equippedSkins = p.equippedSkins && typeof p.equippedSkins === 'object' ? p.equippedSkins : {};
    Object.keys(SKINS).forEach(area => {
      const owned = Array.isArray(p.skins[area]) ? p.skins[area] : [];
      p.skins[area] = Array.from(new Set(['classic'].concat(owned.filter(id => SKINS[area].some(s => s.id === id)))));
      if(!p.skins[area].includes(p.equippedSkins[area])) p.equippedSkins[area] = 'classic';
    });
    p.unlocks = p.unlocks && typeof p.unlocks === 'object' ? p.unlocks : {};
    p.unlocks.toppings = Array.isArray(p.unlocks.toppings)
      ? Array.from(new Set(p.unlocks.toppings.filter(id => EXPANSION.topping.some(x => x.id === id))))
      : [];
    p.unlocks.jars = Array.isArray(p.unlocks.jars)
      ? Array.from(new Set(p.unlocks.jars.filter(id => EXPANSION.jar.some(x => x.id === id))))
      : [];
    p.upgrades = p.upgrades && typeof p.upgrades === 'object' ? p.upgrades : {};
    p.upgrades.pots = clamp(Math.round(Number(p.upgrades.pots) || 1), 1, 4);
    p.upgrades.alarms = clamp(Math.round(Number(p.upgrades.alarms) || 0), 0, 4);
    p.upgrades.knives = Array.isArray(p.upgrades.knives)
      ? Array.from(new Set(['wood'].concat(p.upgrades.knives.filter(k => KNIVES[k] && k !== 'wood'))))
      : ['wood'];
    if(!KNIVES[p.upgrades.knife]) p.upgrades.knife = 'wood';
    p.syrups = p.syrups && typeof p.syrups === 'object' ? p.syrups : {};
    p.syrups.honey = !!p.syrups.honey;
    p.syrups.maple = !!p.syrups.maple;
    p.syrups.honeysuckle = !!p.syrups.honeysuckle;
    p.seen = p.seen && typeof p.seen === 'object' ? p.seen : {};
    p.seen.elite = Array.isArray(p.seen.elite) ? Array.from(new Set(p.seen.elite.filter(n => typeof n === 'string'))) : [];
    p.seen.boss = Array.isArray(p.seen.boss) ? Array.from(new Set(p.seen.boss.filter(n => typeof n === 'string'))) : [];
    return p;
  }
  function availableSyrups(){
    const owned = activeProfile && activeProfile.syrups ? activeProfile.syrups : {};
    return ['classic'].concat(['honey','maple','honeysuckle'].filter(id => owned[id]));
  }
  function unlockedToppings(){
    const extra = activeProfile && activeProfile.unlocks ? activeProfile.unlocks.toppings : [];
    return BASE_TOPPINGS.concat(extra);
  }
  function unlockedJars(){
    const extra = activeProfile && activeProfile.unlocks ? activeProfile.unlocks.jars : [];
    return ['classic'].concat(extra);
  }
  function loadProfiles(){
    try{
      const raw = localStorage.getItem(PROFILE_KEY);
      profiles = raw ? JSON.parse(raw) : {};
      if(!profiles || typeof profiles !== 'object') profiles = {};
    }catch(e){ profiles = {}; }
    let activeName = '';
    try{ activeName = localStorage.getItem(ACTIVE_KEY) || ''; }catch(e){}
    if(!profiles[activeName]){
      activeName = activeName || '奶蛙店长';
      profiles[activeName] = defaultProfile(activeName);
    }
    Object.keys(profiles).forEach(name => {
      profiles[name].name = name;
      normalizeProfile(profiles[name]);
    });
    activeProfile = profiles[activeName];
    syncProfile();
    saveProfiles();
  }
  function saveProfiles(){
    try{
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
      if(activeProfile) localStorage.setItem(ACTIVE_KEY, activeProfile.name);
    }catch(e){}
    if(!cloudSuppress) scheduleCloudSync();
  }
  function syncProfile(){
    if(!activeProfile) return;
    state.bestNormal = activeProfile.bestNormal || 0;
    state.bestEndless = activeProfile.bestEndless || 0;
    state.coins = activeProfile.wallet || 0;
    if(activeProfile.upgrades) state.upgrade = activeProfile.upgrades;
    if(els.coins) els.coins.textContent = state.coins;
    if(els.homeCoins) els.homeCoins.textContent = state.coins;
    if(els.shopCoins) els.shopCoins.textContent = state.coins;
    if(els.dressCoins) els.dressCoins.textContent = `${state.coins} 金币`;
  }
  function playerNameSafe(name){
    return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 10);
  }
  function switchProfile(name){
    name = playerNameSafe(name) || '奶蛙店长';
    if(!profiles[name]) profiles[name] = defaultProfile(name);
    activeProfile = normalizeProfile(profiles[name]);
    activeProfile.name = name;
    saveProfiles();
    syncProfile();
    renderPlayerBar();
    setIntroMode(state.introMode || 'normal');
    renderHome();
    return name;
  }
  function savePlayerName(){
    if(state.phase !== 'intro'){ toast('营业中不能换店长哦'); return; }
    const name = switchProfile(els.playerName.value);
    sfx.ding();
    toast(`已登录「${name}」· 数据保存在本机`);
  }
  function renderPlayerBar(){
    if(!els.playerName || !activeProfile) return;
    if(document.activeElement !== els.playerName) els.playerName.value = activeProfile.name;
    if(els.homeOwner) els.homeOwner.textContent = `店长：${activeProfile.name}`;
  }

  /* -------------------- 存档 / GitHub 云同步 -------------------- */
  function cloudPayload(){
    return {
      app: 'naiwa-peach-shop',
      version: 1,
      exportedAt: new Date().toISOString(),
      active: activeProfile ? activeProfile.name : '',
      profiles
    };
  }
  function encodeSaveCode(){
    const bytes = new TextEncoder().encode(JSON.stringify(cloudPayload()));
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return 'NAIWA1:' + btoa(bin);
  }
  function decodeSaveCode(code){
    code = String(code || '').trim();
    if(code.startsWith('NAIWA1:')) code = code.slice(7);
    const bin = atob(code.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if(!data || typeof data.profiles !== 'object' || !data.profiles) throw new Error('存档码格式不正确');
    return data;
  }
  function importCloudPayload(data){
    const names = Object.keys(data.profiles);
    if(!names.length) throw new Error('存档里没有店长数据');
    cloudSuppress = true;
    try{
      names.forEach(name => {
        const p = data.profiles[name];
        if(!p || typeof p !== 'object') return;
        p.name = name;
        profiles[name] = normalizeProfile(p);
      });
      const wanted = data.active && profiles[data.active] ? data.active : names[0];
      activeProfile = profiles[wanted];
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_KEY, activeProfile.name);
      syncProfile();
    } finally { cloudSuppress = false; }
    renderPlayerBar();
    setIntroMode(state.introMode || 'normal');
    renderHome();
    scheduleCloudSync();
    return names.length;
  }
  function gistToken(){
    try{ return localStorage.getItem(GIST_TOKEN_KEY) || ''; }catch(e){ return ''; }
  }
  function gistIds(){
    try{ return JSON.parse(localStorage.getItem(GIST_ID_KEY) || '{}') || {}; }catch(e){ return {}; }
  }
  function setGistId(name, id){
    const ids = gistIds();
    ids[name] = id;
    try{ localStorage.setItem(GIST_ID_KEY, JSON.stringify(ids)); }catch(e){}
  }
  async function gistApi(path, options = {}){
    const token = gistToken();
    if(!token) throw new Error('请先填写 GitHub Token');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let res;
    try{
      res = await fetch('https://api.github.com' + path, {
        ...options,
        signal: ctrl.signal,
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer ' + token,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(options.headers || {})
        }
      });
    }catch(err){
      clearTimeout(timer);
      throw new Error(err.name === 'AbortError' ? '连接 GitHub 超时，请检查网络' : '无法连接 GitHub，请检查网络');
    }
    clearTimeout(timer);
    if(!res.ok){
      let msg = '';
      try{ msg = (await res.json()).message || ''; }catch(e){}
      if(res.status === 401) throw new Error('Token 无效或已过期');
      if(res.status === 403) throw new Error('Token 权限不足，需要 gist 权限');
      if(res.status === 404) throw new Error('Token 没有 gist 权限（GitHub 404）');
      throw new Error('GitHub ' + res.status + (msg ? '：' + msg : ''));
    }
    if(res.status === 204) return null;
    return res.json();
  }
  async function findGist(name){
    const cached = gistIds()[name];
    if(cached){
      try{ return await gistApi('/gists/' + cached); }catch(e){ if(!/404/.test(e.message)) throw e; }
    }
    const list = await gistApi('/gists?per_page=100');
    const hit = (list || []).find(g => g.description === 'naiwa-save:' + name);
    if(hit) setGistId(name, hit.id);
    return hit || null;
  }
  async function syncGist(){
    if(!activeProfile) throw new Error('没有店长存档');
    const name = activeProfile.name;
    const existing = await findGist(name);
    const body = JSON.stringify({
      description: 'naiwa-save:' + name,
      public: false,
      files: { [GIST_FILE]: { content: JSON.stringify(cloudPayload()) } }
    });
    const gist = existing
      ? await gistApi('/gists/' + existing.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
      : await gistApi('/gists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    setGistId(name, gist.id);
    return gist;
  }
  async function restoreGist(){
    if(!activeProfile) throw new Error('没有店长存档');
    const gist = await findGist(activeProfile.name);
    if(!gist) throw new Error('云端没有找到「' + activeProfile.name + '」的存档');
    let content = gist.files && gist.files[GIST_FILE] && gist.files[GIST_FILE].content;
    if(!content && gist.files && gist.files[GIST_FILE] && gist.files[GIST_FILE].raw_url){
      const r = await fetch(gist.files[GIST_FILE].raw_url);
      content = await r.text();
    }
    if(!content) throw new Error('云存档文件为空');
    const data = JSON.parse(content);
    return importCloudPayload(data);
  }
  function scheduleCloudSync(){
    if(!gistToken() || !activeProfile) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => {
      syncGist().catch(err => {
        if(els.saveStatus) renderSaveStatus(err.message, 'err');
      });
    }, 2200);
  }
  function renderSaveStatus(text, kind = ''){
    if(!els.saveStatus) return;
    els.saveStatus.textContent = text;
    els.saveStatus.className = 'save-status' + (kind ? ' ' + kind : '');
  }
  function openSave(){
    if(!els.saveOverlay) return;
    if(els.saveExport) els.saveExport.value = encodeSaveCode();
    if(els.gistToken) els.gistToken.value = gistToken();
    if(els.saveImport) els.saveImport.value = '';
    const cfg = sbConfig();
    if(els.sbUrl) els.sbUrl.value = cfg.url;
    if(els.sbKey) els.sbKey.value = cfg.key;
    if(els.sbPin) els.sbPin.value = '';
    sbStatus(cfg.url && cfg.key ? '已配置 · 输入 PIN 后上传/读取' : '未配置 · 先填 Project URL 和 anon key', cfg.url && cfg.key ? 'ok' : '');
    renderSaveStatus(gistToken() ? '已填写 Token · 点“同步到 GitHub”验证并上传' : '未连接 · 存档只在本机浏览器', gistToken() ? 'ok' : '');
    els.saveOverlay.classList.add('show');
    els.saveOverlay.setAttribute('aria-hidden','false');
    sfx.tap();
  }
  function closeSave(){
    if(!els.saveOverlay) return;
    els.saveOverlay.classList.remove('show');
    els.saveOverlay.setAttribute('aria-hidden','true');
  }
  async function doGistSync(){
    const token = (els.gistToken.value || '').trim();
    if(!token){ renderSaveStatus('请先填写 GitHub Token', 'err'); return; }
    try{ localStorage.setItem(GIST_TOKEN_KEY, token); }catch(e){}
    renderSaveStatus('正在同步…');
    try{
      const gist = await syncGist();
      renderSaveStatus('已同步到私有 Gist · ' + new Date().toLocaleTimeString(), 'ok');
      toast('云存档已同步');
      if(gist && gist.html_url) console.log('gist', gist.html_url);
    }catch(err){ renderSaveStatus(err.message, 'err'); }
  }
  async function doGistRestore(){
    const token = (els.gistToken.value || '').trim();
    if(!token){ renderSaveStatus('请先填写 GitHub Token', 'err'); return; }
    try{ localStorage.setItem(GIST_TOKEN_KEY, token); }catch(e){}
    renderSaveStatus('正在读取云存档…');
    try{
      const n = await restoreGist();
      renderSaveStatus('已从云端恢复 ' + n + ' 个店长存档', 'ok');
      toast('云存档已恢复');
      if(els.saveExport) els.saveExport.value = encodeSaveCode();
    }catch(err){ renderSaveStatus(err.message, 'err'); }
  }
  function doGistClear(){
    try{ localStorage.removeItem(GIST_TOKEN_KEY); }catch(e){}
    if(els.gistToken) els.gistToken.value = '';
    renderSaveStatus('已断开 · 本机存档仍然保留');
  }
  function sbConfig(){
    try{
      return {
        url: (localStorage.getItem(SB_URL_KEY) || SB_DEFAULT_URL).trim(),
        key: (localStorage.getItem(SB_KEY_KEY) || SB_DEFAULT_KEY).trim()
      };
    }catch(e){ return { url:SB_DEFAULT_URL, key:SB_DEFAULT_KEY }; }
  }
  function sbStatus(text, kind = ''){
    if(!els.sbStatus) return;
    els.sbStatus.textContent = text;
    els.sbStatus.className = 'save-status' + (kind ? ' ' + kind : '');
  }
  async function sbRpc(fn, body){
    const cfg = sbConfig();
    if(!cfg.url || !cfg.key) throw new Error('请先填写 Supabase Project URL 和 anon key');
    const url = cfg.url.replace(/\/+$/, '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let res;
    try{
      res = await fetch(url + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'apikey': cfg.key,
          'Authorization': 'Bearer ' + cfg.key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }catch(err){
      clearTimeout(timer);
      throw new Error(err.name === 'AbortError' ? '连接 Supabase 超时' : '无法连接 Supabase，请检查 URL 和网络');
    }
    clearTimeout(timer);
    let data = null;
    try{ data = await res.json(); }catch(e){}
    if(!res.ok){
      const msg = (data && (data.message || data.hint || data.details)) || ('Supabase ' + res.status);
      if(/wrong pin|invalid pin/i.test(msg)) throw new Error('PIN 不正确');
      if(/not found|no save/i.test(msg)) throw new Error('云端没有找到这个店长的存档');
      if(/invalid name/i.test(msg)) throw new Error('店长名字不合法');
      if(/pin too short/i.test(msg)) throw new Error('PIN 至少 4 位');
      if(res.status === 404) throw new Error('Supabase 函数不存在，请先运行 schema.sql');
      throw new Error(msg);
    }
    return data;
  }
  function sbCheckPin(){
    const pin = (els.sbPin && els.sbPin.value || '').trim();
    if(!/^\d{4,8}$/.test(pin)) throw new Error('同步密码请填 4–8 位数字');
    return pin;
  }
  function sbSaveConfig(){
    const url = (els.sbUrl && els.sbUrl.value || '').trim();
    const key = (els.sbKey && els.sbKey.value || '').trim();
    if(!/^https:\/\/.+\.supabase\.co\/?$/.test(url)) throw new Error('Project URL 格式应为 https://xxx.supabase.co');
    if(key.length < 20) throw new Error('anon key 看起来不完整');
    try{
      localStorage.setItem(SB_URL_KEY, url);
      localStorage.setItem(SB_KEY_KEY, key);
    }catch(e){}
  }
  async function doSbSave(){
    let pin;
    try{
      if(!activeProfile) throw new Error('没有店长存档');
      sbSaveConfig();
      pin = sbCheckPin();
      sbStatus('正在上传到 Supabase…');
      const r = await sbRpc('save_player', {
        p_name: activeProfile.name,
        p_pin: pin,
        p_data: cloudPayload()
      });
      sbStatus('已上传 · ' + new Date().toLocaleTimeString() + (r && r.updated_at ? '' : ''), 'ok');
      toast('Supabase 云存档已上传');
      if(els.sbPin) els.sbPin.value = '';
    }catch(err){ sbStatus(err.message, 'err'); }
  }
  async function doSbLoad(){
    let pin;
    try{
      if(!activeProfile) throw new Error('没有店长存档');
      sbSaveConfig();
      pin = sbCheckPin();
      sbStatus('正在读取 Supabase…');
      const data = await sbRpc('load_player', { p_name: activeProfile.name, p_pin: pin });
      const payload = Array.isArray(data) ? data[0] : data;
      if(!payload || !payload.profiles) throw new Error('云端存档格式不正确');
      const n = importCloudPayload(payload);
      sbStatus('已恢复 ' + n + ' 个店长存档', 'ok');
      toast('Supabase 云存档已恢复');
      if(els.saveExport) els.saveExport.value = encodeSaveCode();
      if(els.sbPin) els.sbPin.value = '';
    }catch(err){ sbStatus(err.message, 'err'); }
  }
  function doExportCopy(){
    const code = encodeSaveCode();
    if(els.saveExport) els.saveExport.value = code;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(() => toast('存档码已复制')).catch(() => toast('复制失败，请手动选中'));
    }else{
      els.saveExport.select(); document.execCommand('copy'); toast('存档码已复制');
    }
  }
  function doExportDownload(){
    const blob = new Blob([JSON.stringify(cloudPayload(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'naiwa-save-' + (activeProfile ? activeProfile.name : 'player') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function doImportCode(){
    try{
      const n = importCloudPayload(decodeSaveCode(els.saveImport.value));
      renderSaveStatus('已导入 ' + n + ' 个店长存档', 'ok');
      toast('存档已导入');
      if(els.saveExport) els.saveExport.value = encodeSaveCode();
    }catch(err){ renderSaveStatus(err.message, 'err'); }
  }
  function addWallet(n){
    if(!activeProfile || !Number.isFinite(n) || n <= 0) return;
    activeProfile.wallet += n;
    state.coins = activeProfile.wallet;
    saveProfiles();
    if(els.coins) els.coins.textContent = state.coins;
    if(els.homeCoins) els.homeCoins.textContent = state.coins;
    if(els.shopCoins) els.shopCoins.textContent = state.coins;
    if(els.dressCoins) els.dressCoins.textContent = `${state.coins} 金币`;
  }
  function spendCoins(n){
    if(!activeProfile || !Number.isFinite(n) || activeProfile.wallet < n) return false;
    activeProfile.wallet -= n;
    state.coins = activeProfile.wallet;
    saveProfiles();
    if(els.coins) els.coins.textContent = state.coins;
    if(els.homeCoins) els.homeCoins.textContent = state.coins;
    if(els.shopCoins) els.shopCoins.textContent = state.coins;
    if(els.dressCoins) els.dressCoins.textContent = `${state.coins} 金币`;
    return true;
  }
  function awardProfile(kind){
    if(!activeProfile) return 0;
    if(kind === 'weekPass'){
      if(state.week > activeProfile.bestEndless) activeProfile.bestEndless = state.week;
      syncProfile(); saveProfiles(); return 0;
    }
    if(kind !== 'runEnd' && kind !== 'gameOver') return 0;
    if(state.metaAwarded) return 0;
    if(kind === 'runEnd'){
      activeProfile.bestNormal = Math.max(activeProfile.bestNormal, state.runEarned);
    }else{
      activeProfile.bestEndless = Math.max(activeProfile.bestEndless, state.week);
    }
    activeProfile.totalRuns += 1;
    activeProfile.lastRun = {
      mode:state.mode, day:state.day, week:state.week, earned:state.runEarned,
      kind, date:new Date().toISOString().slice(0,10)
    };
    state.metaAwarded = true;
    syncProfile();
    saveProfiles();
    return 0;
  }
  function leaderboardProfiles(){
    return Object.values(profiles)
      .filter(p => (p.bestEndless || 0) > 0 || (p.totalRuns || 0) > 0)
      .sort((a,b) => (b.bestEndless - a.bestEndless) || (b.bestNormal - a.bestNormal) || a.name.localeCompare(b.name));
  }
  function renderLeaderboard(){
    if(!els.leaderboardList) return;
    const rows = leaderboardProfiles();
    if(!rows.length){
      els.leaderboardList.innerHTML = '<div class="leaderboard-empty">还没有无尽模式记录。<br>去挑战一周，把名字留在榜上吧！</div>';
      return;
    }
    els.leaderboardList.innerHTML = rows.slice(0,10).map((p,i) => `
      <div class="leaderboard-row${activeProfile && p.name === activeProfile.name ? ' me' : ''}">
        <div class="leaderboard-rank">${i + 1}</div>
        <div class="leaderboard-name">${esc(p.name)}<small>${p.totalRuns || 0} 局 · 最佳周目 ${p.bestNormal || 0} 金币</small></div>
        <div class="leaderboard-score">第 ${p.bestEndless || 0} 周<small>无尽最远</small></div>
      </div>`).join('');
  }
  function openLeaderboard(){
    renderLeaderboard();
    els.leaderboardOverlay.classList.add('show');
    els.leaderboardOverlay.setAttribute('aria-hidden','false');
    sfx.tap();
  }
  function closeLeaderboard(){
    els.leaderboardOverlay.classList.remove('show');
    els.leaderboardOverlay.setAttribute('aria-hidden','true');
  }
  function askEarlyLeave(){
    if(state.phase === 'intro') return;
    els.confirmOverlay.classList.add('show');
    els.confirmOverlay.setAttribute('aria-hidden','false');
    sfx.tap();
  }
  function closeConfirm(){
    els.confirmOverlay.classList.remove('show');
    els.confirmOverlay.setAttribute('aria-hidden','true');
  }
  function doEarlyLeave(){
    closeConfirm();
    goHome();
    sfx.tap();
  }
  function hatHTML(id){
    if(!id || id === 'chef') return '';
    if(id === 'glasses') return '<div class="wear-hat glasses"><i></i><i></i></div>';
    return `<div class="wear-hat ${id}"></div>`;
  }
  function topHTML(id){
    if(!id || id === 'apron') return '';
    return `<div class="wear-top ${id}"></div>`;
  }
  function dollHTML(){
    const head = activeProfile.equipped.head;
    const top = activeProfile.equipped.top;
    return `<div class="room-doll${head !== 'chef' ? ' has-hat' : ''}${top !== 'apron' ? ' has-top' : ''}">
      <svg viewBox="0 0 140 160"><use href="#frog-chef"></use></svg>
      ${hatHTML(head)}
      ${topHTML(top)}
    </div>`;
  }
  function furnitureHTML(id){
    if(id === 'plant') return '<div class="furn furn-plant"><i class="leaf"></i><i class="leaf two"></i><i class="pot"></i></div>';
    if(id === 'lamp') return '<div class="furn furn-lamp"><i class="shade"></i><i class="pole"></i></div>';
    if(id === 'table') return '<div class="furn furn-table"><i class="top"></i><i class="leg l"></i><i class="leg r"></i></div>';
    if(id === 'shelf') return '<div class="furn furn-shelf"></div>';
    if(id === 'pumpkin') return '<div class="furn furn-pumpkin"></div>';
    if(id === 'rug') return '<div class="furn furn-rug"></div>';
    return '';
  }
  function furnitureItemHTML(id){
    const pos = activeProfile.furniturePositions[id] || FURN_POS[id] || {x:50,y:70};
    const z = id === 'rug' ? 2 : Math.round(pos.y);
    return `<div class="furn-item" data-furn="${id}" style="left:${pos.x}%;top:${pos.y}%;z-index:${z}" role="button" aria-label="拖动${FURNITURE[id].name}">
      ${furnitureHTML(id)}<span class="furn-grab">✥</span>
    </div>`;
  }
  function bindFurnitureDrag(){
    const canvas = els.homeRoom && els.homeRoom.querySelector('.room-canvas');
    if(!canvas) return;
    $$('.furn-item', canvas).forEach(el => {
      el.addEventListener('pointerdown', e => {
        if(!activeProfile || state.homeTab !== 'room') return;
        e.preventDefault();
        const id = el.dataset.furn;
        const rect = canvas.getBoundingClientRect();
        const start = {x:e.clientX, y:e.clientY};
        const pos = activeProfile.furniturePositions[id] || FURN_POS[id] || {x:50,y:70};
        const orig = {x:pos.x/100*rect.width, y:pos.y/100*rect.height};
        let moved = false;
        el.classList.add('dragging');
        try{ el.setPointerCapture(e.pointerId); }catch(err){}
        const move = ev => {
          const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
          if(Math.abs(dx)+Math.abs(dy) > 3) moved = true;
          const x = clamp(orig.x + dx, 24, rect.width - 8);
          const y = clamp(orig.y + dy, 34, rect.height - 4);
          activeProfile.furniturePositions[id] = {x:x/rect.width*100, y:y/rect.height*100};
          el.style.left = (x/rect.width*100) + '%';
          el.style.top = (y/rect.height*100) + '%';
          el.style.zIndex = id === 'rug' ? '2' : String(Math.round(y/rect.height*100));
        };
        const up = () => {
          el.classList.remove('dragging');
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          if(moved){ saveProfiles(); sfx.tap(); }
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });
    });
  }
  function renderRoom(){
    if(!els.homeRoom || !activeProfile) return;
    const scrollLeft = els.homeRoom.scrollLeft, scrollTop = els.homeRoom.scrollTop;
    const furn = activeProfile.placedFurniture.map(furnitureItemHTML).join('');
    els.homeRoom.innerHTML = `<div class="room-canvas">${furn}${dollHTML()}<div class="room-pan-tip">拖动家具摆放 · 滑动空白处看房间</div></div>`;
    bindFurnitureDrag();
    const count = activeProfile.placedFurniture.length;
    if(els.homeRoomTip) els.homeRoomTip.textContent = count
      ? `已经摆下 ${count} 件家具，按住家具可以拖动换位置。`
      : '房间还空空的，去家具店挑一件吧。';
    const canvas = els.homeRoom.querySelector('.room-canvas');
    requestAnimationFrame(() => {
      if(!canvas) return;
      els.homeRoom.scrollLeft = scrollLeft || Math.max(0,(canvas.offsetWidth - els.homeRoom.clientWidth) / 2);
      els.homeRoom.scrollTop = scrollTop || Math.max(0,(canvas.offsetHeight - els.homeRoom.clientHeight) / 2);
    });
  }
  function renderFurniture(){
    if(!els.furnitureGrid || !activeProfile) return;
    els.furnitureGrid.innerHTML = Object.entries(FURNITURE).map(([id,f]) => {
      const owned = activeProfile.ownedFurniture.includes(id);
      const placed = activeProfile.placedFurniture.includes(id);
      const afford = activeProfile.wallet >= f.price;
      return `<div class="home-item">
        <div class="item-ico">${f.icon}</div>
        <b>${f.name}</b><small>${f.desc}</small>
        <button class="item-buy${owned ? ' owned' : ''}" type="button" data-furniture="${id}" ${!owned && !afford ? 'disabled' : ''}>
          ${owned ? (placed ? '收起' : '摆放') : afford ? `买 ${f.price}` : `还差 ${f.price - activeProfile.wallet}`}
        </button>
      </div>`;
    }).join('');
  }
  function renderCloset(){
    if(!els.closetGrid || !activeProfile) return;
    const section = (kind,label) => {
      const items = CLOTHES[kind].map(item => {
        const owned = activeProfile.clothes[kind].includes(item.id);
        const equipped = activeProfile.equipped[kind] === item.id;
        const afford = activeProfile.wallet >= item.price;
        return `<div class="home-item">
          <div class="item-ico">${item.icon}</div>
          <b>${item.name}</b><small>${equipped ? '正在穿着' : owned ? '已拥有' : '衣橱新品'}</small>
          <button class="item-buy${equipped ? ' owned' : ''}" type="button" data-clothes="${kind}:${item.id}" ${equipped ? 'disabled' : !owned && !afford ? 'disabled' : ''}>
            ${equipped ? '穿着中' : owned ? '穿上' : afford ? `买 ${item.price}` : `还差 ${item.price - activeProfile.wallet}`}
          </button>
        </div>`;
      }).join('');
      return `<div class="closet-label">${label}</div>${items}`;
    };
    els.closetGrid.innerHTML = section('head','帽子 / 眼镜槽') + section('top','上衣槽');
  }
  function skinPreviewHTML(){
    const area = state.skinPreview.area || 'desk';
    const skin = SKINS[area].find(s => s.id === state.skinPreview.id) || SKINS[area][0];
    const owned = activeProfile.skins[area].includes(skin.id);
    const equipped = activeProfile.equippedSkins[area] === skin.id;
    const afford = activeProfile.wallet >= skin.price;
    const action = equipped ? '使用中' : owned ? '装备' : afford ? `买 ${skin.price}` : `还差 ${skin.price - activeProfile.wallet}`;
    const disabled = equipped || (!owned && !afford);
    return `<div class="skin-preview" data-theme="${skin.id}">
      <div class="sp-awning"></div>
      <div class="sp-scene">
        <div class="sp-window"></div>
        <div class="sp-ticket">ORDER<br><b>01 / 03</b></div>
        <div class="sp-frog"><svg viewBox="0 0 140 160"><use href="#frog-chef"></use></svg></div>
        <div class="sp-counter"><span>奶蛙的店 · 黄桃罐头</span></div>
      </div>
      <div class="skin-preview-bar">
        <div><b>${SKIN_AREAS[area]} · ${skin.name}</b><small>${owned ? '已拥有 · 预览中' : '预览效果 · 购买后永久拥有'}</small></div>
        <button class="mini-btn" type="button" data-skin-apply="${area}:${skin.id}" ${disabled ? 'disabled' : ''}>${action}</button>
      </div>
    </div>`;
  }
  function renderSkins(){
    if(!els.skinShop || !activeProfile) return;
    const groups = Object.keys(SKIN_AREAS).map(area => {
      const current = SKINS[area].find(s => s.id === activeProfile.equippedSkins[area]) || SKINS[area][0];
      const opts = SKINS[area].map(s => {
        const owned = activeProfile.skins[area].includes(s.id);
        const equipped = activeProfile.equippedSkins[area] === s.id;
        const selected = state.skinPreview.area === area && state.skinPreview.id === s.id;
        const afford = activeProfile.wallet >= s.price;
        return `<button class="skin-choice${selected ? ' active' : ''}${!owned && !afford ? ' locked' : ''}" type="button" data-skin-area="${area}" data-skin-id="${s.id}" data-skin-theme="${s.id}">
          <span class="swatch"></span>${s.name}<span class="tiny">${equipped ? '使用中' : owned ? '点击预览' : afford ? `${s.price} 金币` : '金币不足'}</span>
        </button>`;
      }).join('');
      return `<div class="skin-group">
        <div class="skin-group-head"><b>${SKIN_AREAS[area]}</b><span>当前：${current.name}</span></div>
        <div class="skin-options">${opts}</div>
      </div>`;
    }).join('');
    els.skinShop.innerHTML = skinPreviewHTML() + groups;
  }
  function renderHome(){
    if(!els.homeOverlay || !activeProfile) return;
    els.homeCoins.textContent = activeProfile.wallet;
    els.homeOwner.textContent = `店长：${activeProfile.name}`;
    els.homeTabs.forEach(t => t.classList.toggle('active', t.dataset.homeTab === state.homeTab));
    $$('.home-panel', els.homeOverlay).forEach(p => { p.hidden = p.dataset.homePanel !== state.homeTab; });
    renderRoom();
    renderFurniture();
    renderCloset();
    renderSkins();
  }
  function openHome(tab){
    if(!activeProfile) return;
    state.homeTab = tab || 'room';
    renderHome();
    els.homeOverlay.classList.add('show');
    els.homeOverlay.setAttribute('aria-hidden','false');
    sfx.tap();
  }
  function closeHome(){
    els.homeOverlay.classList.remove('show');
    els.homeOverlay.setAttribute('aria-hidden','true');
  }
  function setHomeTab(tab){
    if(!['room','furniture','closet','skins'].includes(tab)) return;
    state.homeTab = tab;
    renderHome();
    sfx.tap();
  }
  function handleFurniture(id){
    const f = FURNITURE[id];
    if(!f || !activeProfile) return;
    const owned = activeProfile.ownedFurniture.includes(id);
    if(!owned){
      if(!spendCoins(f.price)){ toast('金币不够，先去营业赚一点吧'); sfx.error(); return; }
      activeProfile.ownedFurniture.push(id);
      if(activeProfile.placedFurniture.length < 4){
        activeProfile.placedFurniture.push(id);
        activeProfile.furniturePositions[id] = activeProfile.furniturePositions[id] || FURN_POS[id] || {x:50,y:70};
      }
      sfx.coin();
    }else{
      const at = activeProfile.placedFurniture.indexOf(id);
      if(at >= 0) activeProfile.placedFurniture.splice(at,1);
      else{
        if(activeProfile.placedFurniture.length >= 4){ toast('最多同时摆放 4 件家具'); sfx.error(); return; }
        activeProfile.placedFurniture.push(id);
        activeProfile.furniturePositions[id] = activeProfile.furniturePositions[id] || FURN_POS[id] || {x:50,y:70};
      }
      sfx.tap();
    }
    saveProfiles();
    renderHome();
  }
  function handleClothes(spec){
    const [kind,id] = String(spec).split(':');
    if(!CLOTHES[kind] || !activeProfile) return;
    const item = CLOTHES[kind].find(c => c.id === id);
    if(!item) return;
    const owned = activeProfile.clothes[kind].includes(id);
    if(!owned){
      if(!spendCoins(item.price)){ toast('金币不够，先去营业赚一点吧'); sfx.error(); return; }
      activeProfile.clothes[kind].push(id);
      sfx.coin();
    }else sfx.tap();
    activeProfile.equipped[kind] = id;
    saveProfiles();
    renderHome();
    renderFrogWear();
    if(els.dressOverlay && els.dressOverlay.classList.contains('show')) renderDress();
    toast(`${item.name} 已换好`);
  }
  function renderFrogWear(){
    if(!els.frogWear || !activeProfile) return;
    const head = activeProfile.equipped.head;
    const top = activeProfile.equipped.top;
    const frog = els.frogWear.parentElement;
    if(frog){
      frog.classList.toggle('has-hat', head !== 'chef');
      frog.classList.toggle('has-top', top !== 'apron');
    }
    els.frogWear.innerHTML = hatHTML(head) + topHTML(top);
  }
  function renderDress(){
    if(!els.dressOverlay || !activeProfile) return;
    const head = activeProfile.equipped.head;
    const top = activeProfile.equipped.top;
    els.dressCoins.textContent = `${activeProfile.wallet} 金币`;
    els.dressDoll.classList.toggle('has-hat', head !== 'chef');
    els.dressDoll.classList.toggle('has-top', top !== 'apron');
    els.dressDoll.innerHTML = `<svg viewBox="0 0 140 160"><use href="#frog-chef"></use></svg>
      ${hatHTML(head)}${topHTML(top)}`;
    const group = (kind,title) => `<div class="dress-section"><h4><span>${title}</span><span>${kind === 'head' ? '帽子 / 眼镜' : '上衣'}</span></h4>
      <div class="dress-row">${CLOTHES[kind].map(item => {
        const owned = activeProfile.clothes[kind].includes(item.id);
        const active = activeProfile.equipped[kind] === item.id;
        return `<button class="dress-item${active ? ' active' : ''}${owned ? '' : ' locked'}" type="button" data-dress="${kind}:${item.id}">
          <span class="di">${item.icon}</span>${item.name}
          <small>${active ? '正在穿' : owned ? '点击换上' : item.price + ' 金币'}</small>
        </button>`;
      }).join('')}</div></div>`;
    els.dressSlots.innerHTML = group('head','帽子 / 眼镜槽') + group('top','上衣槽');
  }
  function openDress(){
    if(!activeProfile) return;
    renderDress();
    els.dressOverlay.classList.add('show');
    els.dressOverlay.setAttribute('aria-hidden','false');
    sfx.tap();
  }
  function closeDress(){
    els.dressOverlay.classList.remove('show');
    els.dressOverlay.setAttribute('aria-hidden','true');
  }
  function handleSkin(area,id){
    if(!SKINS[area] || !activeProfile) return;
    const skin = SKINS[area].find(s => s.id === id);
    if(!skin) return;
    const owned = activeProfile.skins[area].includes(id);
    if(!owned){
      if(!spendCoins(skin.price)){ toast('金币不够，先去营业赚一点吧'); sfx.error(); return; }
      activeProfile.skins[area].push(id);
      sfx.coin();
    }else sfx.tap();
    activeProfile.equippedSkins[area] = id;
    state.skinPreview = {area, id};
    saveProfiles();
    applySkins();
    renderHome();
  }
  function applySkins(){
    if(!activeProfile || !els.game) return;
    const area = ['desk','work','kitchen'].includes(state.stage) ? state.stage : 'desk';
    els.game.dataset.area = area;
    els.game.dataset.theme = activeProfile.equippedSkins[area] || 'classic';
  }

  /* -------------------- 元素 -------------------- */
  const els = {};
  function cacheEls(){
    const ids = ['game','daySub','coins','soundBtn','stageTabs','orderTicket','speech','guestWrap','canWrap',
      'deskView','workView','kitchenView','deskAvatar','deskGuestName','deskGuestMood','deskStatus',
      'hint','hintText','patience','patienceFill','patienceTime','canLarge','canSmall','bowlWorkLarge','bowlWorkSmall','syrupNote',
      'batchStrip','syrupTarget','syrupFill','syrupReadout','pourBtn','kitchenOrder','cutStage','cutStock',
      'bowlLarge','bowlSmall','potGrid','potNote','alarmNote','footer','resetBtn','sealBtn','serveBtn','toast',
      'introOverlay','startBtn','introNote','reviewOverlay','reviewStars','reviewTitle','reviewScore','reviewQuote',
      'scoreGrid','reviewCoins','perfectStamp','nextBtn','summaryOverlay','summaryTitle','summaryStars',
      'summaryCoins','summaryCoinsLabel','summaryPerfect','summaryAvg','summaryComment','summaryBest','summarySub','confetti',
      'summaryRibbon','homeBtn','weekBanner','weekLabel','weekFill','weekValue','weekLeft','bgm',
      'reviewSpecial','shopBtn','replayBtn','shopOverlay','shopCoins','shopEvent','shopGrid','shopStartBtn','shopBackBtn',
      'playerName','savePlayerBtn','homeEntryBtn','rankEntryBtn','summaryRankBtn','homeOverlay','homeCoins','homeOwner',
      'homeTabs','homeRoom','homeRoomTip','furnitureGrid','closetGrid','skinShop','homeClose','homePlayBtn','homeRankBtn',
      'leaderboardOverlay','leaderboardList','leaderboardClose',
      'earlyBtn','reviewEarlyBtn','summaryEarlyBtn','shopEarlyBtn','confirmOverlay','confirmCancel','confirmOk',
      'jarSwitchBtn','toppingChips','toppingQtyRow','toppingMinus','toppingQtyVal','toppingPlus',
      'shopTabs','shopWallet','shopExpandGrid','shopSyrupGrid','shopFurnGrid','itemShopEntryBtn','shopTitle','shopSub',
      'syrupComposition','stirBtn','alarmTray','alarmTrayItems',
      'dressEntryBtn','dressOverlay','dressCoins','dressDoll','dressSlots',
      'dressClose','dressDoneBtn','frogWear','orderRod',
      'saveEntryBtn','saveOverlay','saveClose','saveExport','saveImport','copySaveBtn','downloadSaveBtn',
      'importSaveBtn','gistToken','gistSyncBtn','gistRestoreBtn','gistClearBtn','saveStatus',
      'sbUrl','sbKey','sbPin','sbSaveBtn','sbLoadBtn','sbStatus',
      'modeGroup','modeToggle','modeToggleName','modePanel','shopGroup','shopToggle','shopPanel',
      'settingsEntryBtn','settingsBtn','settingsOverlay','settingsClose','settingsDone',
      'setMaster','setMusic','setAlarm','setMasterVal','setMusicVal','setAlarmVal',
      'reviewPersonality','codexEntryBtn','codexOverlay','codexClose','codexTabs','codexBody','codexFromSettings','batchStrip','batchScrollWrap','batchScroll'];
    ids.forEach(id => els[id] = document.getElementById(id));
    els.panel = $('#panel');
    els.footer = $('.footer');
    els.stageTabs = $$('.stage-tab');
    els.modeCards = $$('.mode-card');
    els.homeTabs = $$('.home-tab');
    els.sizeBtns = $$('.size-btn');
    els.tempChips = $$('[data-temp]');
  }

  function lockViewport(){
    const setH = () => {
      const h = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight);
      if(h > 200) document.documentElement.style.setProperty('--app-h', h + 'px');
    };
    setH();
    window.addEventListener('resize', setH, {passive:true});
    window.addEventListener('orientationchange', () => setTimeout(setH, 300), {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', setH, {passive:true});
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    const unlock = () => { ensureAudio(); cueMusic(); };
    document.addEventListener('touchstart', unlock, {once:true, passive:true});
    document.addEventListener('pointerdown', unlock, {once:true, passive:true});
    document.addEventListener('visibilitychange', () => {
      if(!bgmEl) bgmEl = els.bgm;
      if(!bgmEl) return;
      if(document.hidden) bgmEl.pause();
      else cueMusic();
    });
  }

  function updateSoundButton(){
    if(!els.soundBtn) return;
    els.soundBtn.innerHTML = icon(state.sound ? 'sound' : 'muted');
    applyAudioVolumes();
  }
  function syncSettingsUI(){
    [['Master','master'],['Music','music'],['Alarm','alarm']].forEach(([id,key]) => {
      const input = els['set' + id];
      const out = els['set' + id + 'Val'];
      if(input) input.value = settings[key];
      if(out) out.textContent = settings[key] + '%';
    });
  }
  function openSettings(){
    syncSettingsUI();
    if(!els.settingsOverlay) return;
    els.settingsOverlay.classList.add('show');
    els.settingsOverlay.setAttribute('aria-hidden', 'false');
    sfx.tap();
  }
  function closeSettings(){
    if(!els.settingsOverlay) return;
    els.settingsOverlay.classList.remove('show');
    els.settingsOverlay.setAttribute('aria-hidden', 'true');
  }
  function setSetting(key, value){
    if(!(key in settings)) return;
    settings[key] = clamp(Math.round(Number(value) || 0), 0, 100);
    saveSettings();
    syncSettingsUI();
    applyAudioVolumes();
  }

  let codexTab = 'personality';
  function openCodex(tab){
    codexTab = tab || codexTab || 'personality';
    renderCodex();
    if(!els.codexOverlay) return;
    els.codexOverlay.classList.add('show');
    els.codexOverlay.setAttribute('aria-hidden', 'false');
    sfx.tap();
  }
  function closeCodex(){
    if(!els.codexOverlay) return;
    els.codexOverlay.classList.remove('show');
    els.codexOverlay.setAttribute('aria-hidden', 'true');
  }
  function setCodexTab(tab){
    codexTab = tab;
    renderCodex();
    sfx.tap();
  }
  function codexItem(icon, name, desc, tag, locked){
    return `<div class="codex-item${locked ? ' locked' : ''}">
      <div class="ci-icon">${locked ? '？' : icon}</div>
      <div><b>${name}${tag ? `<span class="ci-tag">${tag}</span>` : ''}</b><small>${desc}</small></div>
    </div>`;
  }
  function renderCodex(){
    if(!els.codexBody) return;
    const profile = activeProfile || defaultProfile('奶蛙店长');
    const tabs = els.codexTabs ? [...els.codexTabs.querySelectorAll('[data-codex-tab]')] : [];
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.codexTab === codexTab));
    let html = '';
    if(codexTab === 'personality'){
      html = `<div class="codex-note">性格会影响客人的耐心、订单复杂度与评分修正。精英和 BOSS 有固定性格。</div>`;
      html += PERSONALITY_IDS.map(id => {
        const p = PERSONALITIES[id];
        return codexItem(p.icon, p.name, `${p.desc}<br>${p.effect}`, '', false);
      }).join('');
    } else if(codexTab === 'items'){
      html = `<div class="codex-note">食材和罐子买过一次就永久解锁，会出现在后续订单里。</div>`;
      const topIcons = {mint:'🌿',osmanthus:'🌼',dates:'🫘',goji:'🍒',rock:'🍬',honeysuckle:'🌾'};
      const jarDesc = {classic:'基础罐型，容量 180 / 300 / 420ml', narrow:'瓶口更窄，倒糖水要更稳', wide:'大口装桃，摆盘更豪放'};
      html += `<div class="codex-section-title">加料</div>`;
      html += Object.entries(TOPPINGS).filter(([id]) => id !== 'none').map(([id, t]) => {
        const unlocked = BASE_TOPPINGS.includes(id) || (profile.unlocks.toppings || []).includes(id);
        return codexItem(topIcons[id] || '✦', t.name, unlocked ? '已解锁 · 客人可能会点 1–3 勺' : '未解锁 · 在道具商店购买', unlocked ? '已解锁' : '未解锁', !unlocked);
      }).join('');
      html += `<div class="codex-section-title">罐子</div>`;
      html += Object.entries(JARS).map(([id, j]) => {
        const unlocked = id === 'classic' || (profile.unlocks.jars || []).includes(id);
        return codexItem('🥫', j.name, unlocked ? (j.desc || jarDesc[id] || '已解锁') : '未解锁 · 在道具商店购买', unlocked ? '已解锁' : '未解锁', !unlocked);
      }).join('');
      html += `<div class="codex-section-title">糖浆</div>`;
      html += SYRUP_IDS.map(id => {
        const s = SYRUPS[id];
        const unlocked = id === 'classic' || !!profile.syrups[id];
        return codexItem('🍯', s.name, unlocked ? s.desc : '未解锁 · 在道具商店购买', unlocked ? '已解锁' : '未解锁', !unlocked);
      }).join('');
    } else {
      const specials = [ELITE_GUEST, BOSS_GUEST, PATRICK_GUEST];
      html = `<div class="codex-note">只有在店里接待过，才会记录精英与 BOSS 的完整情报。</div>`;
      html += specials.map(g => {
        const seen = (g.tier === 'elite' ? profile.seen.elite : profile.seen.boss).includes(g.name);
        if(!seen){
          return codexItem('？', '？？？', `尚未遇见 · ${g.tier === 'elite' ? '精英客人' : '周末 BOSS'}`, '', true);
        }
        return codexItem(g.tier === 'elite' ? '🐷' : (g.kind === 'patrick' ? '⭐' : '🐶'), g.name, `${g.greet}<br>耐心 ${Math.round(PATIENCE_MS * g.patience / 1000)} 秒 · 奖励 ×${g.coin}`, g.tier === 'elite' ? '精英' : 'BOSS', false);
      }).join('');
    }
    els.codexBody.innerHTML = html;
  }
  function toast(text){
    if(!els.toast) return;
    els.toast.textContent = text;
    els.toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }
  function showSpeech(text, ms=3200){
    if(!text || !els.speech) return;
    els.speech.textContent = text;
    els.speech.classList.remove('show');
    void els.speech.offsetWidth;
    els.speech.classList.add('show');
    clearTimeout(state.speechTimer);
    state.speechTimer = setTimeout(() => els.speech.classList.remove('show'), ms);
  }
  function setGuestMood(mood){
    els.guestWrap.classList.toggle('sad', mood === 'sad');
    els.guestWrap.classList.toggle('happy', mood === 'happy');
  }

  /* -------------------- 订单 -------------------- */
  function randInt(a,b){ return a + Math.floor(Math.random() * (b - a + 1)); }
  let lastOrderSig = '';
  function makeOrder(index, guest){
    const hard = guest && (guest.tier === 'elite' || guest.tier === 'boss');
    const p = state.personality || personalityFor(guest);
    const complex = hard || p.id === 'patient' || p.id === 'strict';
    const simple = p.id === 'impatient';
    let order = null, sig = '';
    for(let tries=0; tries<16; tries++){
      const size = ['small','medium','large'][randInt(0,2)];
      const total = complex ? randInt(3,4) : simple ? 2 : state.day <= 2 ? randInt(2,3) : randInt(2,4);
      let large = randInt(0,total);
      if(total >= 2 && Math.random() < (complex ? .88 : simple ? .5 : .78)) large = clamp(large, 1, total-1);
      const sugar = complex ? randInt(2,3) : simple ? randInt(1,2) : randInt(1,3);
      const temp = ['ice','room','warm'][randInt(0,2)];
      const jars = unlockedJars();
      const jar = jars.length > 1 && Math.random() < .38 ? jars[randInt(1,jars.length-1)] : 'classic';
      const pool = unlockedToppings().slice();
      const tops = [];
      if(pool.length && Math.random() >= (simple ? .42 : .24)){
        const want = complex ? (Math.random() < .65 ? 2 : 1) : (Math.random() < .35 ? 2 : 1);
        for(let t=0; t<want && pool.length; t++){
          const pick = pool.splice(randInt(0,pool.length-1),1)[0];
          tops.push({id:pick, qty:randInt(1,3)});
        }
      }
      const tolBase = SUGAR[sugar].tol + (guest && guest.tolDelta || 0) + (p.id === 'strict' ? -1 : p.id === 'generous' ? 1 : 0);
      const tol = Math.max(3, tolBase);
      const poolS = availableSyrups();
      const twoSyrupChance = complex ? .62 : simple ? .18 : .46;
      const sCount = poolS.length > 1 && Math.random() < twoSyrupChance ? 2 : 1;
      const picked = poolS.slice().sort(() => Math.random() - .5).slice(0, sCount);
      let ratios = sCount === 2 ? [50,50] : [100];
      if(sCount === 2 && Math.random() < .5) ratios = Math.random() < .5 ? [60,40] : [40,60];
      const syrups = picked.map((id,i) => ({id, ratio:ratios[i]}));
      const stirChance = complex ? .5 : simple ? .25 : .38;
      const stirred = sCount === 2 && Math.random() < stirChance;
      const boilStyle = sCount === 2 ? (Math.random() < .5 ? 'together' : 'separate') : 'single';
      order = {size, jar, peaches:{large, small:total-large}, sugar, temp, toppings:tops, tol, syrups, stirred, boilStyle};
      sig = `${size}|${jar}|${large}|${total-large}|${sugar}|${temp}|${tops.map(t=>`${t.id}:${t.qty}`).join(',')}|${syrups.map(s=>`${s.id}${s.ratio}`).join('+')}|${stirred}`;
      if(sig !== lastOrderSig || tries >= 12) break;
    }
    lastOrderSig = sig;
    return order;
  }
  const peachTotal = p => (p.large||0) + (p.small||0);
  function peachText(p){
    const l = p.large||0, s = p.small||0;
    if(l && s) return `${l} 大 + ${s} 小`;
    if(l) return `${l} 块全是大块`;
    return `${s} 块全是小块`;
  }
  function toppingText(list){
    if(!list || !list.length) return '不加';
    return list.map(t => `${(TOPPINGS[t.id] || {name:t.id}).name}×${t.qty || 1}勺`).join(' + ');
  }
  function syrupText(o){
    if(!o.syrups || !o.syrups.length) return '经典糖浆';
    const names = o.syrups.map(s => `${SYRUPS[s.id].name}${s.ratio}%`).join(' + ');
    const style = o.syrups.length > 1 ? (o.boilStyle === 'together' ? ' · 一起熬' : ' · 分开熬') : '';
    return `${names}${o.stirred ? ' · 搅拌' : ' · 分层'}${style}`;
  }
  function countPieces(pieces){
    return pieces.reduce((a,s) => { a[s]++; return a; }, {large:0,small:0});
  }
  function findBatch(){
    if(state.selectedBatch == null) return null;
    return state.batches.find(b => b.id === state.selectedBatch && !b.used) || null;
  }

  /* -------------------- 渲染 -------------------- */
  function setStage(stage, silent=false){
    if(state.phase !== 'playing' && !silent) return;
    if(state.pouring) stopPour();
    state.stage = stage;
    els.game.dataset.stage = stage;
    els.stageTabs.forEach(t => t.classList.toggle('active', t.dataset.stage === stage));
    els.deskView.classList.toggle('active', stage === 'desk');
    els.workView.classList.toggle('active', stage === 'work');
    els.kitchenView.classList.toggle('active', stage === 'kitchen');
    if(els.orderRod) els.orderRod.hidden = stage !== 'desk';
    if(stage === 'desk') renderDesk();
    if(stage === 'work') renderWork();
    if(stage === 'kitchen') renderKitchen();
    renderAlarmTray();
    updateFooter();
    renderHint();
    updateHud();
    applySkins();
    if(!silent){ sfx.tap(); cueMusic(); }
  }

  function updateHud(){
    if(els.coins) els.coins.textContent = activeProfile ? activeProfile.wallet : state.coins;
    if(els.earlyBtn) els.earlyBtn.style.display = state.phase === 'intro' ? 'none' : '';
    if(els.daySub){
      const label = state.phase === 'intro' ? '准备营业' : state.stage === 'desk' ? '服务台' : state.stage === 'work' ? '工作台' : '厨房';
      const special = specialForDay(state.day);
      const mark = special ? (special.type === 'boss' ? ' · BOSS日' : ' · 精英日') : '';
      if(state.phase === 'intro') els.daySub.textContent = '选择模式 · 准备营业';
      else if(state.mode === 'endless'){
        const d = ((state.day - 1) % WEEK_DAYS) + 1;
        els.daySub.textContent = `无尽 W${state.week} · DAY ${d}/${WEEK_DAYS}${mark} · ${label}`;
      }else{
        els.daySub.textContent = `普通 · DAY ${state.day}/${NORMAL_DAYS}${mark} · ${label}`;
      }
    }
    updateWeekBanner();
  }

  function updateWeekBanner(){
    if(!els.weekBanner) return;
    const show = state.mode === 'endless' && state.phase !== 'intro';
    els.weekBanner.hidden = !show;
    if(!show) return;
    const pct = state.weekTarget ? clamp(state.weekEarned / state.weekTarget * 100, 0, 100) : 0;
    els.weekLabel.textContent = `第 ${state.week} 周业绩`;
    els.weekValue.textContent = `${state.weekEarned} / ${state.weekTarget}`;
    els.weekFill.style.width = pct + '%';
    els.weekFill.classList.toggle('met', state.weekEarned >= state.weekTarget);
    const left = WEEK_DAYS - ((state.day - 1) % WEEK_DAYS);
    els.weekLeft.textContent = state.weekEarned >= state.weekTarget ? '已达标' : `还剩 ${left} 天`;
  }

  function renderOrderTicket(){
    if(!state.guest || !state.order){
      els.orderTicket.innerHTML = `<div class="ticket-head"><span class="ticket-kicker">WAITING FOR ORDER</span><span class="ticket-name">奶蛙</span></div>
        <div class="ticket-rule"></div>
        <div class="ticket-empty" style="padding:22px 4px;text-align:center;font-size:9px;color:#A98556;font-weight:800;line-height:1.7">客人马上就到<br>先准备好黄桃吧～</div>`;
      return;
    }
    const o = state.order;
    els.orderTicket.innerHTML = `
      <div class="ticket-head"><span class="ticket-kicker">ORDER ${String(state.guestIndex+1).padStart(2,'0')}/03</span><span class="ticket-name">${state.guest.name}的订单${guestTag(state.guest)}</span></div>
      <div class="ticket-rule"></div>
      <div class="ticket-row size">${icon('can')}<span class="row-label">罐型</span><b>${SIZES[o.size].name} · ${JARS[o.jar || 'classic'].name}</b></div>
      <div class="ticket-row peach">${icon('peach')}<span class="row-label">黄桃</span><b>${peachText(o.peaches)}</b></div>
      <div class="ticket-row sweet">${icon('drop')}<span class="row-label">糖水</span><b>${SUGAR[o.sugar].name} · ${o.sugar} 勺</b></div>
      <div class="ticket-row syrup"><svg class="icon"><use href="#i-drop"></use></svg><span class="row-label">糖浆</span><b>${syrupText(o)}</b></div>
      <div class="ticket-row temp">${icon(o.temp === 'ice' ? 'snow' : o.temp === 'warm' ? 'heat' : 'thermo')}<span class="row-label">温度</span><b>${TEMPS[o.temp]}</b></div>
      <div class="ticket-row topping">${icon((o.toppings && o.toppings[0]) ? TOPPINGS[o.toppings[0].id].icon : TOPPINGS.none.icon)}<span class="row-label">加料</span><b>${toppingText(o.toppings)}</b></div>`;
    els.orderTicket.classList.remove('ticket-in');
    void els.orderTicket.offsetWidth;
    els.orderTicket.classList.add('ticket-in');
  }

  function renderGuest(){
    if(!state.guest){ els.guestWrap.innerHTML = ''; return; }
    els.guestWrap.innerHTML = `<div class="guest-name">${state.guest.name}${guestTag(state.guest)}${personalityTag(state.personality)}</div>${guestSVG(state.guest, state.guestIndex)}`;
    els.guestWrap.classList.remove('guest-enter');
    void els.guestWrap.offsetWidth;
    els.guestWrap.classList.add('guest-enter');
  }

  function guestSVG(guest, idx){
    if(guest.kind === 'cat') return catSVG(guest, idx);
    if(guest.kind === 'pig') return pigSVG(guest, idx);
    if(guest.kind === 'bird') return birdSVG(guest, idx);
    if(guest.kind === 'serious') return seriousDogSVG(guest, idx);
    if(guest.kind === 'sponge') return spongeSVG(guest, idx);
    if(guest.kind === 'patrick') return patrickSVG(guest, idx);
    if(guest.kind === 'plane') return planeCatSVG(guest, idx);
    return dogSVG(guest, idx);
  }

  function catSVG(guest, idx){
    const id = 'cat' + idx;
    return `
    <svg class="guest-svg cat-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs>
        <linearGradient id="${id}Fur" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#E3B277"/><stop offset=".62" stop-color="#C98B4E"/><stop offset="1" stop-color="#A96A34"/>
        </linearGradient>
        <linearGradient id="${id}Can" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#F4F7F5"/><stop offset=".5" stop-color="#C7D0CD"/><stop offset="1" stop-color="#9AA6A2"/>
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="192" rx="46" ry="6" fill="#3A2410" opacity=".12"/>
      <g class="dog-bob">
        <path d="M114 158c23 1 32-13 25-27-5-10-16-10-19-3-2 6 4 9 8 6 4 8-4 15-17 16z" fill="url(#${id}Fur)" stroke="#8D572A" stroke-width="1.3"/>
        <path d="M78 104c-25 2-38 25-33 50 4 24 17 38 34 38 18 0 32-15 34-39 2-25-11-47-35-49z" fill="url(#${id}Fur)" stroke="#8D572A" stroke-width="1.3"/>
        <ellipse cx="80" cy="160" rx="25" ry="27" fill="#FFF0D7" opacity=".95"/>
        <path d="M52 49 45 22c-1-5 4-8 8-4l18 18z" fill="url(#${id}Fur)" stroke="#8D572A" stroke-width="1.3"/>
        <path d="M108 49 116 23c2-5-3-9-7-5l-19 18z" fill="url(#${id}Fur)" stroke="#8D572A" stroke-width="1.3"/>
        <path d="M50 36l3-9 9 9zM110 36l-3-9-9 9z" fill="#F1A3A8"/>
        <ellipse cx="80" cy="67" rx="41" ry="37" fill="url(#${id}Fur)" stroke="#8D572A" stroke-width="1.4"/>
        <path d="M57 39c7 6 14 8 23 8M83 36c9 1 17 4 24 9" fill="none" stroke="#8C5528" stroke-width="4.5" stroke-linecap="round" opacity=".65"/>
        <path d="M65 96c4 5 9 7 15 7s11-2 15-7c-3 13-8 19-15 19s-12-6-15-19z" fill="#FFF5E4"/>
        <ellipse cx="80" cy="83" rx="21" ry="15" fill="#FFF3DD"/>
        <g>
          <ellipse cx="62" cy="66" rx="12.5" ry="13.5" fill="#2E2118"/>
          <ellipse cx="98" cy="66" rx="12.5" ry="13.5" fill="#2E2118"/>
          <circle cx="58" cy="62" r="4.2" fill="#FFFDF4"/><circle cx="94" cy="62" r="4.2" fill="#FFFDF4"/>
          <circle cx="68" cy="72" r="2.3" fill="#FFFDF4"/><circle cx="104" cy="72" r="2.3" fill="#FFFDF4"/>
        </g>
        <path d="M76 82h8l-4 5z" fill="#E58A9E" stroke="#C96F84" stroke-width="1"/>
        <path d="M80 87c0 5 3 8 7 8M80 87c0 5-3 8-7 8" fill="none" stroke="#7E4D2C" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M82 94c7-4 13 0 12 6-1 5-7 7-11 5-4-2-5-8-1-11z" fill="#F08FA5" stroke="#D56F88" stroke-width="1"/>
        <path d="M64 94c0 8 0 14 1 18" fill="none" stroke="#BFE7F2" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
        <circle cx="65" cy="114" r="2.4" fill="#BFE7F2" opacity=".95"/>
        <g stroke="#7A4B28" stroke-width="1" opacity=".8">
          <path d="M52 82l-17-3M53 88l-18 4M108 82l17-3M107 88l18 4"/>
        </g>
        <g transform="rotate(-5 80 137)">
          <rect x="66" y="122" width="28" height="48" rx="6" fill="url(#${id}Can)" stroke="#7C8985" stroke-width="1.2"/>
          <rect x="66" y="134" width="28" height="19" fill="#3F7F52"/>
          <path d="M74 141h12M74 146h8" stroke="#F7E5A9" stroke-width="2" stroke-linecap="round"/>
          <ellipse cx="69" cy="169" rx="9" ry="7" fill="#D69A55" stroke="#A66C31" stroke-width="1"/>
          <ellipse cx="92" cy="167" rx="9" ry="7" fill="#D69A55" stroke="#A66C31" stroke-width="1"/>
        </g>
      </g>
    </svg>`;
  }

  function pigSVG(guest, idx){
    const id = 'pig' + idx;
    return `
    <svg class="guest-svg pig-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs>
        <linearGradient id="${id}Skin" x1=".2" y1="0" x2=".8" y2="1">
          <stop offset="0" stop-color="#FBE7E1"/><stop offset=".55" stop-color="#F0C9C3"/><stop offset="1" stop-color="#DDA8A3"/>
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="193" rx="44" ry="6" fill="#3A2410" opacity=".12"/>
      <g class="dog-bob">
        <path d="M106 158c18-6 27 2 22 12-4 8-14 7-16 1 7-1 8-5 2-5z" fill="none" stroke="#C98D87" stroke-width="5" stroke-linecap="round"/>
        <path d="M64 140c-10 8-13 26-10 45 2 9 13 9 16 1l4-29zM96 140c10 8 13 26 10 45-2 9-13 9-16 1l-4-29z" fill="url(#${id}Skin)" stroke="#C98D87" stroke-width="1.3"/>
        <path d="M60 185c-6 1-8 6-4 8h17v-8zM100 185c6 1 8 6 4 8H87v-8z" fill="#D79B95"/>
        <path d="M78 88c-29 3-42 32-35 62 5 20 18 31 37 31s33-12 37-32c6-30-9-58-39-61z" fill="url(#${id}Skin)" stroke="#C98D87" stroke-width="1.4"/>
        <ellipse cx="80" cy="154" rx="29" ry="30" fill="#FFF1EA" opacity=".85"/>
        <path d="M54 108c-11 2-17 14-14 27 2 9 8 14 13 12l7-23zM106 108c11 2 17 14 14 27-2 9-8 14-13 12l-7-23z" fill="url(#${id}Skin)" stroke="#C98D87" stroke-width="1.3"/>
        <path d="M54 44c-7-9-19-10-22-3-3 6 4 19 14 24 6 3 11 0 12-5 1-5-1-10-4-16zM106 44c7-9 19-10 22-3 3 6-4 19-14 24-6 3-11 0-12-5-1-5 1-10 4-16z" fill="url(#${id}Skin)" stroke="#C98D87" stroke-width="1.3"/>
        <path d="M80 25c-25 0-44 17-44 39 0 21 18 37 44 37s44-16 44-37c0-22-19-39-44-39z" fill="url(#${id}Skin)" stroke="#C98D87" stroke-width="1.4"/>
        <path d="M47 52c3-20 16-33 33-33 18 0 31 12 35 32-22-5-46-5-68 1z" fill="#45413B"/>
        <g fill="#5C5750" opacity=".45">
          <circle cx="56" cy="37" r="1.3"/><circle cx="65" cy="30" r="1.2"/><circle cx="76" cy="27" r="1.4"/>
          <circle cx="88" cy="28" r="1.2"/><circle cx="99" cy="33" r="1.3"/><circle cx="108" cy="41" r="1.2"/>
        </g>
        <ellipse cx="62" cy="58" rx="5" ry="4.2" fill="#3E322C"/>
        <ellipse cx="98" cy="58" rx="5" ry="4.2" fill="#3E322C"/>
        <circle cx="63.5" cy="56.5" r="1.4" fill="#FFF7EE"/><circle cx="99.5" cy="56.5" r="1.4" fill="#FFF7EE"/>
        <path d="M50 50c4-3 9-4 13-2M110 50c-4-3-9-4-13-2" fill="none" stroke="#6C5E56" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="80" cy="77" rx="21" ry="16" fill="#F3BDB8" stroke="#D49A96" stroke-width="1.3"/>
        <ellipse cx="73" cy="77" rx="3.2" ry="4.2" fill="#B97573"/><ellipse cx="87" cy="77" rx="3.2" ry="4.2" fill="#B97573"/>
        <path d="M68 92c5 5 19 5 24 0" fill="none" stroke="#A35F5B" stroke-width="2" stroke-linecap="round"/>
        <path d="M46 80c-10 2-16 10-14 18 2 9 12 13 18 9" fill="none" stroke="#C98D87" stroke-width="2"/>
        <path d="M114 80c10 2 16 10 14 18-2 9-12 13-18 9" fill="none" stroke="#C98D87" stroke-width="2"/>
      </g>
    </svg>`;
  }

  function birdSVG(guest, idx){
    const id = 'bird' + idx;
    return `
    <svg class="guest-svg bird-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs>
        <linearGradient id="${id}Feather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E9EFF0"/><stop offset="1" stop-color="#C3CFD3"/>
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="193" rx="38" ry="5" fill="#3A2410" opacity=".12"/>
      <g class="dog-bob">
        <path d="M92 151v34M78 153v32" stroke="#8B7455" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M82 187l-9 4M92 187l9 4" stroke="#8B7455" stroke-width="3" stroke-linecap="round"/>
        <path d="M107 157c17-3 24-17 17-27-5-7-13-5-14 1-1 5 5 6 8 3 1 6-5 12-14 13z" fill="#BBC9CD" stroke="#8FA0A5" stroke-width="1.2"/>
        <ellipse cx="86" cy="126" rx="35" ry="46" fill="url(#${id}Feather)" stroke="#9CABB0" stroke-width="1.3"/>
        <ellipse cx="93" cy="135" rx="20" ry="28" fill="#F7FAFA" opacity=".9"/>
        <path d="M108 103c18 7 24 26 13 42-7 10-18 12-23 5-5-7 0-14 7-13 4 10 12 4 10-6-2-9-10-16-18-19z" fill="#C9D4D8" stroke="#8FA0A5" stroke-width="1.2"/>
        <path d="M112 74c-4-20-15-28-28-25-13 3-20 20-14 34 6 15 23 20 35 11 6-5 9-12 7-20z" fill="url(#${id}Feather)" stroke="#9CABB0" stroke-width="1.3"/>
        <path d="M72 59c8-17 29-20 40-6-9-2-17 0-23 6-6 6-12 8-17 0z" fill="#30383C"/>
        <path d="M72 73c9-3 16-1 22 4-8 1-14 5-19 11-4-5-5-10-3-15z" fill="#30383C"/>
        <path d="M67 79l-47 9c-4 1-4 6 1 6l48-5z" fill="#23282B" stroke="#15191B" stroke-width="1"/>
        <path d="M67 84l-29 13c-3 1-2 5 2 4l31-9z" fill="#3A4347"/>
        <circle cx="79" cy="72" r="6.4" fill="#F7F2E2" stroke="#283135" stroke-width="1.6"/>
        <circle cx="77.4" cy="72.4" r="3.3" fill="#23282B"/>
        <circle cx="76.2" cy="71" r="1.1" fill="#FFF"/>
        <path d="M72 64c4-3 9-3 13 0" fill="none" stroke="#30383C" stroke-width="2" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function seriousDogSVG(guest, idx){
    const id = 'serious' + idx;
    return `
    <svg class="guest-svg serious-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs>
        <linearGradient id="${id}Coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1E4D0"/>
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="192" rx="39" ry="6" fill="#3A2410" opacity=".14"/>
      <g class="dog-bob">
        <path d="M106 155c13-2 20 3 18 9-2 5-9 5-12 0 5-1 5-4 0-3z" fill="none" stroke="#B79C7E" stroke-width="4" stroke-linecap="round"/>
        <path d="M78 115c-23 4-34 27-28 52 4 18 14 27 30 27 17 0 27-10 31-28 5-25-8-47-33-51z" fill="url(#${id}Coat)" stroke="#3A3028" stroke-width="2"/>
        <ellipse cx="80" cy="158" rx="21" ry="22" fill="#FFF9EE"/>
        <path d="M56 160c-10 2-15 12-12 23 2 8 8 12 12 10l9-21zM104 160c10 2 15 12 12 23-2 8-8 12-12 10l-9-21z" fill="#F4E7D3" stroke="#3A3028" stroke-width="2"/>
        <path d="M69 163c7-6 15-6 22 0M69 170c7-6 15-6 22 0" fill="none" stroke="#3A3028" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M47 42c-8-8-17-8-19-2-2 5 3 17 12 22 5 3 10 1 11-4 1-5-1-10-4-16zM113 42c8-8 17-8 19-2 2 5-3 17-12 22-5 3-10 1-11-4-1-5 1-10 4-16z" fill="#E5B26A" stroke="#3A3028" stroke-width="2"/>
        <path d="M80 25c-27 0-46 18-46 40 0 23 19 39 46 39s46-16 46-39c0-22-19-40-46-40z" fill="#FFFCF4" stroke="#3A3028" stroke-width="2.2"/>
        <path d="M80 25c17 0 31 7 39 18-10-3-20-1-27 5-7 5-13 5-19-1-8-8-20-9-31-4 8-11 21-18 38-18z" fill="#E5B26A" opacity=".9"/>
        <path d="M55 42c8-5 16-5 23 1M105 42c-8-5-16-5-23 1" fill="none" stroke="#6D5B48" stroke-width="4" stroke-linecap="round"/>
        <g>
          <ellipse cx="59" cy="67" rx="15" ry="16" fill="#FFFDF7" stroke="#3A3028" stroke-width="2.2"/>
          <ellipse cx="101" cy="67" rx="15" ry="16" fill="#FFFDF7" stroke="#3A3028" stroke-width="2.2"/>
          <ellipse cx="62" cy="69" rx="6.6" ry="8.4" fill="#6E4A2A"/>
          <ellipse cx="98" cy="69" rx="6.6" ry="8.4" fill="#6E4A2A"/>
          <circle cx="64" cy="65.5" r="2.5" fill="#FFF"/><circle cx="100" cy="65.5" r="2.5" fill="#FFF"/>
          <path d="M40 54c9-8 19-9 27-3M120 54c-9-8-19-9-27-3" fill="none" stroke="#2F2923" stroke-width="4" stroke-linecap="round"/>
          <path d="M46 78c8 4 15 3 20-1M114 78c-8 4-15 3-20-1" fill="none" stroke="#3A3028" stroke-width="2" stroke-linecap="round" opacity=".75"/>
        </g>
        <path d="M75 88h10l-5 5z" fill="#3A3028"/>
        <path d="M80 93c0 4 4 6 8 5M80 93c0 4-4 6-8 5" fill="none" stroke="#3A3028" stroke-width="2" stroke-linecap="round"/>
        <path d="M66 101c9 4 19 4 28 0" fill="none" stroke="#3A3028" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M59 139c12 9 30 9 42 0M59 148c12 9 30 9 42 0" fill="none" stroke="#3A3028" stroke-width="2.3" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function guestTag(guest){
    if(!guest || !guest.badge) return '';
    return `<span class="guest-tag ${guest.tier}">${guest.badge}</span>`;
  }

  function spongeSVG(guest, idx){
    const id = 'sponge' + idx;
    return `
    <svg class="guest-svg sponge-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs><linearGradient id="${id}Body" x1="0" y1="0" x2=".7" y2="1">
        <stop offset="0" stop-color="#FFF05C"/><stop offset=".65" stop-color="#F4D92E"/><stop offset="1" stop-color="#D9B81A"/>
      </linearGradient></defs>
      <ellipse cx="80" cy="193" rx="43" ry="5" fill="#3A2410" opacity=".13"/>
      <g class="dog-bob">
        <path d="M38 154c-13 2-18 18-9 24 9 5 17-5 15-13" fill="none" stroke="#D9B81A" stroke-width="6" stroke-linecap="round"/>
        <path d="M122 154c13 2 18 18 9 24-9 5-17-5-15-13" fill="none" stroke="#D9B81A" stroke-width="6" stroke-linecap="round"/>
        <path d="M80 170v13M68 170v13" stroke="#F2D63A" stroke-width="3"/>
        <rect x="38" y="30" width="84" height="124" rx="15" fill="url(#${id}Body)" stroke="#B99A13" stroke-width="2"/>
        <g fill="#B9C93A" opacity=".85">
          <ellipse cx="51" cy="47" rx="5" ry="4" transform="rotate(-16 51 47)"/>
          <ellipse cx="116" cy="42" rx="4" ry="3.2"/>
          <ellipse cx="112" cy="63" rx="3.2" ry="2.8"/>
          <ellipse cx="47" cy="88" rx="3.4" ry="2.6"/>
          <ellipse cx="118" cy="92" rx="5.2" ry="3.8" transform="rotate(18 118 92)"/>
          <ellipse cx="52" cy="113" rx="3" ry="2.5"/>
        </g>
        <rect x="42" y="112" width="76" height="30" fill="#FFFDF3" stroke="#D8C9A7" stroke-width="1"/>
        <path d="M70 112l10 10 10-10" fill="#FFFDF3" stroke="#D8C9A7" stroke-width="1"/>
        <path d="M80 120l-7 9 7 19 7-19z" fill="#E4473E" stroke="#B22A24" stroke-width="1.2"/>
        <rect x="42" y="142" width="76" height="18" fill="#8A5A2F" stroke="#6B421F" stroke-width="1"/>
        <path d="M60 142v18M100 142v18" stroke="#6B421F" stroke-width="1.4"/>
        <g>
          <ellipse cx="62" cy="71" rx="18" ry="19" fill="#FFFDF5" stroke="#2F3B44" stroke-width="2"/>
          <ellipse cx="98" cy="71" rx="18" ry="19" fill="#FFFDF5" stroke="#2F3B44" stroke-width="2"/>
          <circle cx="66" cy="73" r="8.2" fill="#4DB7DF"/>
          <circle cx="94" cy="73" r="8.2" fill="#4DB7DF"/>
          <circle cx="67" cy="74" r="4.2" fill="#19242B"/><circle cx="93" cy="74" r="4.2" fill="#19242B"/>
          <circle cx="69" cy="70" r="2" fill="#FFF"/><circle cx="95" cy="70" r="2" fill="#FFF"/>
          <path d="M46 54l9-5M114 54l-9-5" stroke="#1F2A32" stroke-width="2" stroke-linecap="round"/>
        </g>
        <path d="M80 85c-3 6-7 9-7 13 0 4 3 6 7 6s7-2 7-6c0-4-4-7-7-13z" fill="#F3C84B" stroke="#C49A22" stroke-width="1.2"/>
        <path d="M50 100c9 18 51 18 60 0" fill="#FFF" stroke="#6A3A20" stroke-width="2.2"/>
        <path d="M50 100c9 18 51 18 60 0" fill="none" stroke="#4A2A18" stroke-width="2"/>
        <rect x="63" y="100" width="14" height="17" rx="2" fill="#FFF" stroke="#CBBFA8" stroke-width="1"/>
        <rect x="83" y="100" width="14" height="17" rx="2" fill="#FFF" stroke="#CBBFA8" stroke-width="1"/>
        <path d="M70 100v17M90 100v17" stroke="#CBBFA8" stroke-width="1"/>
        <circle cx="45" cy="74" r="3.2" fill="#EDD550" opacity=".8"/><circle cx="115" cy="74" r="3.2" fill="#EDD550" opacity=".8"/>
      </g>
    </svg>`;
  }

  function patrickSVG(guest, idx){
    const id = 'patrick' + idx;
    return `
    <svg class="guest-svg patrick-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs><linearGradient id="${id}Skin" x1=".2" y1="0" x2=".8" y2="1">
        <stop offset="0" stop-color="#F79AA0"/><stop offset=".58" stop-color="#E98089"/><stop offset="1" stop-color="#D76672"/>
      </linearGradient></defs>
      <ellipse cx="80" cy="193" rx="50" ry="6" fill="#3A2410" opacity=".13"/>
      <g class="dog-bob">
        <path d="M80 22l64 70-18 92-46-27-46 27-18-92z" fill="url(#${id}Skin)" stroke="#B95260" stroke-width="2"/>
        <g fill="#D46F7A" opacity=".55">
          <ellipse cx="54" cy="88" rx="3" ry="2.2"/><ellipse cx="108" cy="76" rx="2.6" ry="2"/>
          <ellipse cx="98" cy="118" rx="2.2" ry="1.8"/><ellipse cx="52" cy="127" rx="2.4" ry="1.8"/>
        </g>
        <g>
          <ellipse cx="65" cy="73" rx="13" ry="15" fill="#FFFDF8" stroke="#3F2B22" stroke-width="2"/>
          <ellipse cx="95" cy="73" rx="13" ry="15" fill="#FFFDF8" stroke="#3F2B22" stroke-width="2"/>
          <ellipse cx="67" cy="76" rx="5.6" ry="7" fill="#2A2320"/><ellipse cx="93" cy="76" rx="5.6" ry="7" fill="#2A2320"/>
          <circle cx="68.5" cy="72.5" r="1.8" fill="#FFF"/><circle cx="94.5" cy="72.5" r="1.8" fill="#FFF"/>
          <path d="M48 53c5-5 13-6 20-3M112 53c-5-5-13-6-20-3" fill="none" stroke="#3A2A22" stroke-width="4" stroke-linecap="round"/>
        </g>
        <path d="M69 94c4-4 18-4 22 0-1 13-5 19-11 19s-10-6-11-19z" fill="#7E3A3A" stroke="#5E2B2B" stroke-width="1.2"/>
        <path d="M62 96c7 5 29 5 36 0" fill="none" stroke="#5E2B2B" stroke-width="2" stroke-linecap="round"/>
        <path d="M57 121c15 4 31 4 46 0l-3 27c-13 5-27 5-40 0z" fill="#B6D957" stroke="#7D9C33" stroke-width="1.6"/>
        <g fill="#B18BD6" opacity=".9">
          <path d="M61 126c8 4 13 4 20 1l2 10c-7 3-14 3-20 0z"/>
          <path d="M94 132c5 1 9 0 12-1l-1 11c-4 2-8 2-12 0z"/>
        </g>
        <path d="M66 154v22M94 154v22" stroke="#E98089" stroke-width="14" stroke-linecap="round"/>
        <path d="M55 181c-8 0-10 9-2 10h17l1-10zM105 181c8 0 10 9 2 10H90l-1-10z" fill="#E98089" stroke="#B95260" stroke-width="1.2"/>
        <ellipse cx="80" cy="139" rx="3" ry="2" fill="#B95260"/>
      </g>
    </svg>`;
  }

  function planeCatSVG(guest, idx){
    const id = 'plane' + idx;
    return `
    <svg class="guest-svg plane-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs><linearGradient id="${id}Fur" x1="0" y1="0" x2=".5" y2="1">
        <stop offset="0" stop-color="#A9A6A4"/><stop offset=".55" stop-color="#8F8B88"/><stop offset="1" stop-color="#6F6B68"/>
      </linearGradient></defs>
      <ellipse cx="80" cy="193" rx="40" ry="5" fill="#3A2410" opacity=".12"/>
      <g class="dog-bob">
        <path d="M56 140c-17 0-24 20-14 32 6 7 15 5 18-2 3-8-4-12-9-9" fill="none" stroke="#777270" stroke-width="7" stroke-linecap="round"/>
        <path d="M60 112c-18 7-24 32-15 51 7 15 20 23 35 23s29-8 36-24c8-19 2-43-16-50-12-5-28-5-40 0z" fill="#F7F2EA" stroke="#8B8178" stroke-width="1.4"/>
        <path d="M39 70c-9-4-17-13-16-20 1-6 9-8 18-4l14 8-5 17zM121 70c9-4 17-13 16-20-1-6-9-8-18-4l-14 8 5 17z" fill="url(#${id}Fur)" stroke="#6F6B68" stroke-width="1.4"/>
        <path d="M41 57c-5-2-9-6-9-9 0-2 3-3 7-1l8 4zM119 57c5-2 9-6 9-9 0-2-3-3-7-1l-8 4z" fill="#E7A3A9"/>
        <path d="M80 26c-29 0-49 20-49 44 0 24 20 43 49 43s49-19 49-43c0-24-20-44-49-44z" fill="#FBF7F0" stroke="#8B8178" stroke-width="1.4"/>
        <path d="M80 26c-17 0-30 6-39 16 8-3 17-1 23 4 7 6 14 5 21-1 5-4 12-5 18-3 5 1 9 4 14 8-7-15-20-24-37-24z" fill="url(#${id}Fur)" opacity=".95"/>
        <path d="M49 66c10-9 24-11 34-6" fill="none" stroke="#7D7670" stroke-width="3" stroke-linecap="round" opacity=".7"/>
        <g>
          <ellipse cx="62" cy="79" rx="16" ry="18" fill="#FFFDF8" stroke="#5F5752" stroke-width="1.8"/>
          <ellipse cx="98" cy="79" rx="16" ry="18" fill="#FFFDF8" stroke="#5F5752" stroke-width="1.8"/>
          <ellipse cx="63" cy="81" rx="8" ry="10" fill="#3A2E28"/><ellipse cx="97" cy="81" rx="8" ry="10" fill="#3A2E28"/>
          <circle cx="66" cy="77" r="3" fill="#FFF"/><circle cx="100" cy="77" r="3" fill="#FFF"/>
          <circle cx="60" cy="86" r="2" fill="#FFF" opacity=".8"/><circle cx="94" cy="86" r="2" fill="#FFF" opacity=".8"/>
        </g>
        <path d="M76 94c3-2 5-2 8 0l-4 4z" fill="#D78B92"/>
        <path d="M80 98c0 4-3 6-6 5M80 98c0 4 3 6 6 5" fill="none" stroke="#6D5C54" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M58 40l-9-12M61 38l-5-14M102 40l9-12M99 38l5-14" stroke="#8B8178" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M55 157c8-7 17-7 25 0M80 157c8-7 17-7 25 0" fill="none" stroke="#C9BEB2" stroke-width="2" stroke-linecap="round"/>
        <path d="M50 113c-9 2-13 11-11 20M110 113c9 2 13 11 11 20" fill="none" stroke="#8B8178" stroke-width="1.4"/>
      </g>
    </svg>`;
  }

  function dogSVG(guest, idx){
    const id = 'dog' + idx;
    const acc = guest.accessory;
    const cap = acc === 'cap' ? `
      <g transform="rotate(-6 88 38)">
        <path d="M58 39c-2-13 10-24 27-24 16 0 27 9 28 20-19 4-37 6-55 4z" fill="${guest.cap || '#4E8CC9'}" stroke="#2F6096" stroke-width="1.5"/>
        <path d="M55 39c2-5 9-6 17-4l22 4c-3 6-11 8-20 7l-16-3z" fill="${guest.cap || '#4E8CC9'}" stroke="#2F6096" stroke-width="1.4"/>
        <path d="M84 20c5 2 8 7 8 13" fill="none" stroke="#7EB3E4" stroke-width="2" stroke-linecap="round" opacity=".7"/>
      </g>` : '';
    const glasses = acc === 'glasses' ? `
      <g fill="none" stroke="#5B3D24" stroke-width="1.8">
        <circle cx="62" cy="65" r="9.2" fill="rgba(255,255,255,.13)"/>
        <circle cx="84" cy="61" r="9.2" fill="rgba(255,255,255,.13)"/>
        <path d="M71 64l4-1M53 64l-7-2M93 60l6-2"/>
      </g>` : '';
    return `
    <svg class="guest-svg" viewBox="0 0 160 200" role="img" aria-label="客人 ${guest.name}">
      <defs>
        <radialGradient id="${id}Body" cx="38%" cy="28%" r="80%">
          <stop offset="0" stop-color="${guest.body}"/><stop offset=".68" stop-color="${guest.body}"/><stop offset="1" stop-color="${guest.bodyDark}"/>
        </radialGradient>
        <linearGradient id="${id}Belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${guest.belly}"/><stop offset="1" stop-color="#FFE3A5"/>
        </linearGradient>
      </defs>
      <ellipse cx="78" cy="192" rx="49" ry="6" fill="#3A2410" opacity=".12"/>
      <g class="dog-bob">
        <g class="dog-tail"><path d="M114 143c20-4 33-16 31-33-1-9-7-14-12-13-6 1-7 8-4 13 5 9-1 17-17 21z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.2"/></g>
        <path d="M78 96c-22 0-36 21-34 45 2 32 12 47 37 47s37-16 38-45c1-24-15-47-41-47z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.4"/>
        <ellipse cx="80" cy="158" rx="25" ry="24" fill="url(#${id}Belly)" opacity=".9"/>
        <path d="M57 175c-1 9 6 13 14 13M99 177c0 8-6 12-14 12" fill="none" stroke="${guest.bodyDark}" stroke-width="6" stroke-linecap="round"/>
        <path d="M56 181c-4 1-6 5-4 8 2 2 6 2 10 1l10-2-1-5-8-3z" fill="${guest.bodyDark}"/>
        <path d="M100 181c4 1 6 5 4 8-2 2-7 2-11 1l-9-2 1-5 8-3z" fill="${guest.bodyDark}"/>
        <path d="M84 94c-16 0-28 11-29 26-1 14 9 25 25 25 16 0 26-10 26-24 0-17-8-27-22-27z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.3"/>
        <path d="M62 42c-8-17-22-25-31-16-10 10 1 27 18 36 7 4 14 4 17 0 3-4 1-11-4-20z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.2"/>
        <path d="M105 40c7-17 21-25 31-16 11 9 1 27-16 37-7 4-14 4-18 0-3-4-2-11 3-21z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.2"/>
        <path d="M89 34c-20 0-37 15-38 36-1 20 15 35 37 35 20 0 37-15 37-34 0-21-16-37-36-37z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.4"/>
        <path d="M52 60c-14 0-25 8-27 20-2 13 9 22 24 22 11 0 20-6 24-14 2-5 1-10-2-14-5-7-11-14-19-14z" fill="url(#${id}Body)" stroke="${guest.bodyDark}" stroke-width="1.3"/>
        <ellipse cx="31" cy="79" rx="13" ry="10.5" fill="#B13A17" stroke="#8C2D11" stroke-width="1.2"/>
        <ellipse cx="27" cy="75" rx="4.1" ry="2.6" fill="#D96A42" opacity=".6" transform="rotate(-18 27 75)"/>
        <g><ellipse cx="64" cy="62" rx="6.7" ry="7.3" fill="#3B2413"/><ellipse cx="86" cy="58" rx="6.7" ry="7.3" fill="#3B2413"/>
          <circle cx="61.8" cy="59" r="2.1" fill="#FFF8E8"/><circle cx="83.8" cy="55" r="2.1" fill="#FFF8E8"/>
          <circle cx="66.5" cy="65" r="1" fill="#FFF8E8" opacity=".55"/><circle cx="88.5" cy="61" r="1" fill="#FFF8E8" opacity=".55"/></g>
        <g class="brow-sad" stroke="#5A3A22" stroke-width="1.6" stroke-linecap="round"><path d="M56 50l10 4M93 46l-10 4"/></g>
        <path class="mouth-happy" d="M34 94c5 5 12 5 17 0" fill="none" stroke="#5B3820" stroke-width="2" stroke-linecap="round"/>
        <path class="mouth-sad" d="M33 99c6-5 13-5 18 0" fill="none" stroke="#5B3820" stroke-width="2" stroke-linecap="round"/>
        <ellipse class="cheek" cx="52" cy="79" rx="7" ry="3.5" fill="#FF9B79" opacity=".3"/>
        <ellipse class="cheek" cx="95" cy="75" rx="7" ry="3.5" fill="#FF9B79" opacity=".3"/>
        <path d="M56 104c12 7 30 7 42-1" fill="none" stroke="#2E8B57" stroke-width="5" stroke-linecap="round" opacity=".95"/>
        <path d="M95 106c8 3 11 9 9 15" fill="none" stroke="#2E8B57" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
        ${cap}${glasses}
      </g>
    </svg>`;
  }

  function peachLayout(n){
    const out = [], per = 4;
    for(let i=0;i<n;i++){
      const row = Math.floor(i/per), col = i%per, count = Math.min(per, n-row*per);
      out.push([70 + (col-(count-1)/2)*19, 114 - row*14]);
    }
    return out;
  }
  function toppingDecor(){
    const list = state.can.toppings || [];
    if(!list.length) return '';
    return list.map((t,i) => {
      const q = Math.max(1, t.qty || 1);
      const shift = i ? ` transform="translate(${i*4} ${i*3})"` : '';
      let art = '';
      if(t.id === 'mint'){
        art = `<g transform="translate(70 44) rotate(-12)">
          <path d="M0 0c-12-2-18-11-15-20 10-1 18 7 15 20z" fill="#4F9C60" stroke="#347243" stroke-width=".9"/>
          <path d="M4 2c10-5 20-2 24 6-7 8-18 7-24-6z" fill="#64AF70" stroke="#347243" stroke-width=".9"/>
          <path d="M-8-14c3 5 5 9 7 14" fill="none" stroke="#A9D7A5" stroke-width="1.2" stroke-linecap="round"/></g>`;
      }else if(t.id === 'osmanthus'){
        art = `<g fill="#FFD45A" stroke="#E59C1A" stroke-width=".5">
          <circle cx="53" cy="48" r="2.1"/><circle cx="60" cy="42" r="1.7"/><circle cx="68" cy="49" r="1.9"/>
          <circle cx="77" cy="43" r="1.6"/><circle cx="85" cy="49" r="2"/><circle cx="72" cy="56" r="1.5"/></g>`;
      }else{
        const spots = [[54,48],[64,43],[75,48],[85,44],[59,56],[80,57]];
        if(t.id === 'dates'){
          art = `<g>${spots.slice(0,q+2).map((s,j)=>`<ellipse cx="${s[0]}" cy="${s[1]}" rx="5.8" ry="4" fill="#9C3B28" stroke="#6D2418" stroke-width=".7" transform="rotate(${j%2?12:-10} ${s[0]} ${s[1]})"/><path d="M${s[0]-3} ${s[1]-1}c2-1 4-1 5 0" stroke="#D88162" stroke-width=".8" fill="none"/>`).join('')}</g>`;
        }else if(t.id === 'goji'){
          art = `<g>${spots.slice(0,q+2).map((s,j)=>`<ellipse cx="${s[0]}" cy="${s[1]}" rx="3.1" ry="4.3" fill="#E24A2E" stroke="#A72816" stroke-width=".6" transform="rotate(${j%2?18:-14} ${s[0]} ${s[1]})"/><circle cx="${s[0]-1}" cy="${s[1]-1}" r=".8" fill="#FFBC9E"/>`).join('')}</g>`;
        }else if(t.id === 'rock'){
          art = `<g>${spots.slice(0,q+1).map((s,j)=>`<rect x="${s[0]-4}" y="${s[1]-4}" width="8" height="8" rx="1.6" fill="#F2FCFF" fill-opacity=".78" stroke="#BFE4EA" stroke-width=".7" transform="rotate(${j%2?15:-12} ${s[0]} ${s[1]})"/>`).join('')}</g>`;
        }else if(t.id === 'honeysuckle'){
          art = `<g>${spots.slice(0,q+1).map((s,j)=>`<g transform="translate(${s[0]} ${s[1]})"><circle r="2.6" fill="#FFF4C2" stroke="#E0C35A" stroke-width=".5"/><path d="M0-2.6l1.6-3M2.5-1l3-.8M2 1.7l2.2 2M-2 1.5l-2.4 2M-2.6-1l-3-.8" stroke="#FFF4C2" stroke-width="1.6" stroke-linecap="round"/></g>`).join('')}</g>`;
        }
      }
      return art ? `<g${shift}>${art}</g>` : '';
    }).join('');
  }
  function renderCan(){
    const c = state.can;
    const scaleClass = c.size ? `size-${c.size}` : '';
    const jarClass = c.size ? `jar-${c.jar || 'classic'}` : '';
    els.canWrap.className = 'can-wrap ' + scaleClass + ' ' + jarClass + (c.size ? '' : ' empty') + (c.sealed ? ' sealed' : '');
    const baseScale = c.size === 'small' ? .84 : c.size === 'large' ? 1.05 : .95;
    els.canWrap.style.setProperty('--canScale', baseScale * ((JARS[c.jar] || JARS.classic).scale || 1));
    if(!c.size){
      els.canWrap.innerHTML = `<div class="empty-can"><div class="outline"></div><div class="lid-line"></div><span>选个罐型<br>开始装罐</span></div>`;
      return;
    }
    const pieces = c.pieces;
    const positions = peachLayout(pieces.length).slice().sort((a,b) => b[1]-a[1]);
    const peachG = positions.map((p,i) => {
      const large = pieces[i] === 'large';
      const rx = large ? 17 : 11.5, ry = large ? 12 : 8.2;
      return `<g transform="translate(${p[0]} ${p[1]}) rotate(${i % 2 ? 5 : -6})">
        <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="url(#canPeachGrad)" stroke="#DA7422" stroke-width=".8"/>
        <path d="M-9-4c4-4 11-5 16-2" fill="none" stroke="#FFE2A1" stroke-width="${large?1.8:1.3}" stroke-linecap="round" opacity=".75"/>
        <path d="M-4 0c3 3 8 4 12 2" fill="none" stroke="#DD7B28" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>
      </g>`;
    }).join('');

    const syrupY = 93 - clamp(c.syrup,0,100) * 0.51;
    const syrupH = Math.max(0, 132 - syrupY);
    const hasSyrup = c.syrup > 0;
    const iceCubes = c.temp === 'ice' ? `<g class="ice-shine">
      <rect x="43" y="57" width="13" height="13" rx="3" transform="rotate(-12 49 63)" fill="#E6FAFF" stroke="#A9D8E5" stroke-width="1" opacity=".8"/>
      <rect x="76" y="51" width="11" height="11" rx="3" transform="rotate(14 81 56)" fill="#E6FAFF" stroke="#A9D8E5" stroke-width="1" opacity=".75"/>
      <rect x="62" y="44" width="9" height="9" rx="2.5" transform="rotate(-8 66 48)" fill="#F2FDFF" stroke="#A9D8E5" stroke-width=".9" opacity=".7"/></g>` : '';
    const steam = c.temp === 'warm' ? `<g fill="none" stroke="#FFF7E7" stroke-width="2.2" stroke-linecap="round" opacity=".7">
      <path class="steam" d="M53 35c-4-7 4-10 0-17"/><path class="steam s2" d="M83 34c4-7-4-10 0-17"/></g>` : '';
    const toppingArt = toppingDecor();
    const lid = c.sealed ? `<g class="lid-group">
      <ellipse cx="70" cy="36" rx="41.5" ry="12.5" fill="#DCD6C9" stroke="#8B8375" stroke-width="1.6"/>
      <ellipse cx="70" cy="34" rx="37" ry="9.6" fill="#F4F0E5" stroke="#AAA295" stroke-width="1.2"/>
      <ellipse cx="70" cy="34" rx="30" ry="6.4" fill="none" stroke="#D0C9BB" stroke-width="1"/>
      <path d="M84 33c7 0 12 2 12 3.5s-5 3-12 3" fill="none" stroke="#8B8375" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="80" cy="36" r="1.4" fill="#8F887B"/>
      <g transform="translate(99 139) rotate(8)"><circle cx="0" cy="0" r="11" fill="#FFF5D8" stroke="#D9B76F" stroke-width="1.2"/>
        <circle cx="0" cy="0" r="8.2" fill="#FFD23F" stroke="#D6A00E" stroke-width=".8"/>
        <circle cx="-3" cy="-2" r="1.5" fill="#5B3D1D"/><circle cx="3" cy="-2" r="1.5" fill="#5B3D1D"/>
        <path d="M-2 2c1.5 1.5 3.5 1.5 5 0" fill="none" stroke="#5B3D1D" stroke-width="1" stroke-linecap="round"/></g></g>` : '';

    els.canWrap.innerHTML = `
      <svg viewBox="0 0 140 185" role="img" aria-label="${SIZES[c.size].name}黄桃罐头">
        <defs>
          <linearGradient id="canMetalDyn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9B3A6"/><stop offset=".18" stop-color="#F5F1E6"/><stop offset=".5" stop-color="#D5CEC0"/><stop offset=".8" stop-color="#F4EFE4"/><stop offset="1" stop-color="#AFA99C"/></linearGradient>
          <linearGradient id="canLabelDyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3C8C5D"/><stop offset="1" stop-color="#226242"/></linearGradient>
          <radialGradient id="canPeachGrad" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#FFD56F"/><stop offset=".5" stop-color="#FFB245"/><stop offset="1" stop-color="#EE7C28"/></radialGradient>
          <linearGradient id="syrupGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD76B" stop-opacity=".82"/><stop offset="1" stop-color="#F19A2D" stop-opacity=".9"/></linearGradient>
          <clipPath id="canOpenClip"><path d="M29 37c0 6 18 10 41 10s41-4 41-10l-3 94c-9 6-23 9-38 9s-29-3-38-9z"/></clipPath>
        </defs>
        <ellipse cx="70" cy="178" rx="46" ry="6.5" fill="#3A2410" opacity=".13"/>
        <path d="M27 35l-3 124c0 10 20 17 46 17s46-7 46-17l-3-124z" fill="url(#canMetalDyn)" stroke="#8B8375" stroke-width="1.5"/>
        <ellipse cx="70" cy="35" rx="43" ry="13" fill="#EFEADD" stroke="#8B8375" stroke-width="1.4"/>
        <g clip-path="url(#canOpenClip)">
          <rect x="24" y="35" width="92" height="115" fill="#F8E5B3"/>
          <rect id="canSyrupRect" x="24" y="${syrupY}" width="92" height="${syrupH}" fill="url(#syrupGrad)"/>
          <g id="canSyrupLayers"></g>
          <ellipse id="canSyrupSurface" cx="70" cy="${syrupY}" rx="44" ry="9" fill="#FFE08A" opacity="${hasSyrup ? .75 : 0}"/>
          ${peachG}${iceCubes}${toppingArt}${steam}
        </g>
        <path d="M26 93h88v53c0 13-19 19-44 19s-44-6-44-19z" fill="url(#canLabelDyn)"/>
        <path d="M28 84h84v11H28z" fill="#F6DD78" opacity=".92"/>
        <path d="M35 97h70" stroke="rgba(255,255,255,.22)" stroke-width="1"/>
        <text x="70" y="116" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="12.5" font-weight="900" letter-spacing=".9" fill="#FFFFFF">YELLOW</text>
        <text x="70" y="130" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="12.5" font-weight="900" letter-spacing=".9" fill="#FFFFFF">PEACH</text>
        <text x="70" y="147" text-anchor="middle" font-family="'Microsoft YaHei',sans-serif" font-size="10" font-weight="900" letter-spacing="1.3" fill="#FFE672">黄桃罐头</text>
        <path d="M51 154c4 0 6 2 6 5s-3 5-7 5c-5 0-9-3-8-7 1-4 5-6 9-3z" fill="#F7D24B"/>
        <path d="M55 151c0-2 1-3 3-4 0 2-1 3-3 4z" fill="#B7D990"/>
        <ellipse cx="70" cy="35" rx="43" ry="13" fill="none" stroke="#FAF6EB" stroke-width="4"/>
        <ellipse cx="70" cy="35" rx="43" ry="13" fill="none" stroke="#8A8273" stroke-width="1.2"/>
        ${lid}
      </svg>`;
  }
  function mixSyrupColors(ids){
    let r=0,g=0,b=0,n=0;
    ids.forEach(id => {
      const hex = (SYRUPS[id] || SYRUPS.classic).color.replace('#','');
      if(hex.length === 6){ r += parseInt(hex.slice(0,2),16); g += parseInt(hex.slice(2,4),16); b += parseInt(hex.slice(4,6),16); n++; }
    });
    if(!n) return '#F3BC45';
    const to = v => Math.round(v/n).toString(16).padStart(2,'0');
    return '#' + to(r) + to(g) + to(b);
  }
  function updateSyrupVisual(){
    const c = state.can;
    const rect = document.getElementById('canSyrupRect');
    const surf = document.getElementById('canSyrupSurface');
    const layers = document.getElementById('canSyrupLayers');
    if(!rect || !surf || !layers) return;
    const y = 93 - clamp(c.syrup,0,100) * .51;
    const h = Math.max(0,132-y);
    rect.setAttribute('y', y); rect.setAttribute('height', h);
    surf.setAttribute('cy', y);
    surf.setAttribute('opacity', c.syrup > 0 ? .75 : 0);
    const parts = SYRUP_IDS.map(id => ({id, v:c.components[id] || 0})).filter(x => x.v > .05);
    const total = parts.reduce((s,x) => s+x.v, 0);
    if(c.syrup <= 0 || total <= 0){ layers.innerHTML = ''; return; }
    if(c.stirred){
      rect.setAttribute('fill', mixSyrupColors(parts.map(x => x.id)));
      rect.setAttribute('opacity', '1');
      layers.innerHTML = '';
      surf.setAttribute('fill', mixSyrupColors(parts.map(x => x.id)));
      return;
    }
    rect.setAttribute('fill', 'rgba(248,229,179,.55)');
    rect.setAttribute('opacity', '1');
    let offset = 0;
    const visibleH = Math.max(0, 93 - y);
    layers.innerHTML = parts.map(part => {
      const ph = visibleH * part.v / total;
      const py = 93 - offset - ph;
      offset += ph;
      return `<rect x="24" y="${py.toFixed(2)}" width="92" height="${Math.max(.5,ph).toFixed(2)}" fill="${SYRUPS[part.id].color}" opacity=".9"/>`;
    }).join('');
    surf.setAttribute('fill', SYRUPS[parts[0].id].color);
  }
  function bumpCan(){
    els.canWrap.classList.remove('bump');
    void els.canWrap.offsetWidth;
    els.canWrap.classList.add('bump');
  }

  function renderPatience(ratio){
    if(!els.patienceFill) return;
    const r = clamp(ratio == null ? state.patience : ratio, 0, 1);
    els.patienceFill.style.width = (r * 100).toFixed(1) + '%';
    els.patience.classList.toggle('low', r < .25);
    const remain = Math.max(0, state.deadline - performance.now());
    const sec = Math.ceil(remain / 1000);
    els.patienceTime.textContent = state.phase === 'intro' ? '1:40' : `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  }

  function renderDesk(){
    if(!state.guest) return;
    els.deskAvatar.innerHTML = guestSVG(state.guest, state.guestIndex);
    els.deskGuestName.innerHTML = `${state.guest.name}${guestTag(state.guest)}${personalityTag(state.personality)}`;
    const remain = Math.max(0, state.deadline - performance.now());
    els.deskGuestMood.textContent = state.guest.tier === 'boss'
      ? (state.can.sealed ? '检查中…这次能不能通过？' : '认真检查中 · 耐心很短')
      : state.guest.tier === 'elite'
        ? (state.can.sealed ? '精英客人正在验货' : '精英客人 · 要求更严')
        : state.can.sealed ? '看到罐头，眼睛都亮了' : remain < 25000 ? '有点着急了…' : '正在等你出餐';
    let text = '';
    if(state.can.sealed) text = `<b>罐头已经封好啦！</b>直接点下面的「交给客人」就行。`;
    else if(!state.can.size) text = `还没开始装罐。先去<b>厨房</b>切黄桃、熬糖水，再回<b>工作台</b>。`;
    else{
      const miss = [];
      if(!state.can.pieces.length) miss.push('黄桃');
      if(!state.can.syrup) miss.push('糖水');
      if(!state.can.temp) miss.push('温度');
      if(!state.can.toppingTouched) miss.push('加料');
      text = miss.length ? `还差：<b>${miss.join('、')}</b>。回工作台继续装罐吧。` : `都配齐了，去工作台点「封盖」，再回来出餐。`;
    }
    els.deskStatus.innerHTML = text;
  }

  function renderWork(){
    if(!state.order) return;
    const c = state.can;
    els.sizeBtns.forEach(b => {
      const on = c.size === b.dataset.size;
      b.classList.toggle('active', on);
      b.disabled = c.sealed;
    });
    const counts = countPieces(c.pieces);
    els.canLarge.textContent = counts.large;
    els.canSmall.textContent = counts.small;
    if(els.bowlWorkLarge) els.bowlWorkLarge.textContent = state.bowl.large;
    if(els.bowlWorkSmall) els.bowlWorkSmall.textContent = state.bowl.small;
    els.tempChips.forEach(b => { b.classList.toggle('active', c.temp === b.dataset.temp); b.disabled = c.sealed; });
    if(els.jarSwitchBtn){
      const jar = JARS[c.jar || 'classic'];
      const unlocked = unlockedJars().length;
      els.jarSwitchBtn.innerHTML = `${icon('can')}<span>${jar.name}</span><small>${unlocked > 1 ? '点此切换罐子' : '拓展店铺可解锁新罐'}</small>`;
      els.jarSwitchBtn.disabled = c.sealed;
    }
    const tops = c.toppings || [];
    let focus = state.toppingFocus;
    if(!focus || !tops.some(t => t.id === focus)) focus = tops.length ? tops[0].id : null;
    state.toppingFocus = focus;
    if(els.toppingChips){
      const noneActive = c.toppingTouched && !tops.length;
      els.toppingChips.innerHTML = `<button class="chip ${noneActive ? 'active' : ''}" type="button" data-topping="none" ${c.sealed ? 'disabled' : ''}>✕ 不加</button>` + unlockedToppings().map(id => {
        const tp = TOPPINGS[id];
        const item = tops.find(t => t.id === id);
        return `<button class="chip ${item ? 'active' : ''}" type="button" data-topping="${id}" ${c.sealed ? 'disabled' : ''}>${icon(tp.icon)}${tp.name}${item ? ` ×${item.qty}` : ''}</button>`;
      }).join('');
    }
    if(els.toppingQtyRow){
      const focusItem = tops.find(t => t.id === focus);
      const showQty = !!focusItem && !c.sealed;
      els.toppingQtyRow.hidden = !showQty;
      const label = els.toppingQtyRow.querySelector('span');
      if(label) label.textContent = focusItem ? `${TOPPINGS[focus].name}份量` : '份量';
      if(els.toppingQtyVal) els.toppingQtyVal.textContent = focusItem ? focusItem.qty : 1;
    }

    if(!state.batches.length){
      els.batchStrip.innerHTML = `<span class="batch-empty">还没有熬好的糖水，先去厨房熬一锅。</span>`;
    }else{
      els.batchStrip.innerHTML = state.batches.map(b => {
        const label = b.quality === 'thin' ? '偏生（也能用）' : b.quality === 'burnt' ? '焦苦（也能用）' : '火候完美';
        return `<button class="batch-chip ${state.selectedBatch === b.id ? 'active' : ''} ${b.quality || ''}" type="button" data-batch="${b.id}" ${c.sealed || b.used ? 'disabled' : ''}>
          ${(b.types || ['classic']).map(id => SYRUPS[id].name).join('+')} · ${b.sugar} 勺 · ${label}<small>糖水 #${b.id}${b.used ? ' · 已用' : b.sugar === state.order.sugar ? ' · 对味' : ''}</small>
        </button>`;
      }).join('');
    }
    const sb = SUGAR[state.order.sugar];
    const tol = state.order.tol || sb.tol;
    els.syrupTarget.style.left = (sb.target - tol) + '%';
    els.syrupTarget.style.width = (tol * 2) + '%';
    els.syrupFill.style.width = clamp(c.syrup,0,100) + '%';
    const inZone = Math.abs(c.syrup - sb.target) <= tol;
    els.syrupFill.classList.toggle('in-zone', inZone);
    els.syrupReadout.textContent = Math.round(c.syrup) + '%';
    const selBatch = findBatch();
    els.syrupNote.textContent = selBatch
      ? `已选：${(selBatch.types || ['classic']).map(id => SYRUPS[id].name).join('+')} · ${selBatch.sugar} 勺 · ${selBatch.quality === 'thin' ? '偏生' : selBatch.quality === 'burnt' ? '焦苦' : '火候完美'}`
      : '选一锅熬好的糖水';
    els.pourBtn.disabled = c.sealed || !findBatch() || c.syrup >= 100;
    els.pourBtn.classList.toggle('pouring', state.pouring);
    renderSyrupComposition();
    updateFooter();
    requestAnimationFrame(updateBatchScroll);
  }

  function updateBatchScroll(){
    if(!els.batchStrip || !els.batchScroll) return;
    const max = Math.max(0, els.batchStrip.scrollWidth - els.batchStrip.clientWidth);
    if(els.batchScrollWrap) els.batchScrollWrap.hidden = max < 2;
    els.batchScroll.max = max;
    els.batchScroll.value = els.batchStrip.scrollLeft;
  }

  function renderSyrupComposition(){
    if(!els.syrupComposition) return;
    const o = state.order, c = state.can;
    if(!o){ els.syrupComposition.innerHTML = ''; return; }
    const targetTotal = SUGAR[o.sugar].target;
    const expected = o.syrups || [{id:'classic',ratio:100}];
    els.syrupComposition.innerHTML = expected.map(s => {
      const comp = c.components[s.id] || 0;
      const target = targetTotal * s.ratio / 100;
      const pct = clamp(comp / 100 * 100, 0, 100);
      const tgt = clamp(target, 0, 100);
      const ok = Math.abs(comp - target) <= (o.tol || 8) * s.ratio / 100;
      return `<div class="comp-item">
        <div class="comp-top"><span>${SYRUPS[s.id].name}</span><b>${Math.round(comp)} / ${Math.round(target)}%${ok?' ✓':''}</b></div>
        <div class="comp-track"><div class="comp-fill" style="width:${pct}%;background:${SYRUPS[s.id].color}"></div><i class="comp-target" style="left:${tgt}%"></i></div>
      </div>`;
    }).join('');
    const two = expected.length > 1;
    if(els.stirBtn){
      els.stirBtn.hidden = !two;
      els.stirBtn.classList.toggle('on', !!c.stirred);
      els.stirBtn.textContent = c.stirred ? '已搅拌 · 点一下恢复分层' : '搅拌一下';
    }
  }

  function toggleStir(){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    if(!state.order || (state.order.syrups || []).length < 2) return;
    state.can.stirred = !state.can.stirred;
    updateSyrupVisual();
    renderWork();
    sfx.tap();
  }

  function renderKitchen(){
    if(!state.order) return;
    const o = state.order;
    els.kitchenOrder.innerHTML = `订单：<b>${SIZES[o.size].name} · ${JARS[o.jar || 'classic'].name}</b> · 黄桃 <b>${peachText(o.peaches)}</b> · ${SUGAR[o.sugar].name}（${o.sugar} 勺） · 糖浆 <b>${syrupText(o)}</b> · 加料 ${toppingText(o.toppings)}`;
    els.cutStock.textContent = '不限';
    els.bowlLarge.textContent = state.bowl.large;
    els.bowlSmall.textContent = state.bowl.small;
    els.cutStage.classList.remove('knife-mint','knife-sakura','knife-gold');
    if(state.upgrade.knife !== 'wood') els.cutStage.classList.add('knife-' + state.upgrade.knife);
    const alarms = state.upgrade.alarms || 0;
    const assigned = state.pots.filter(p => p.alarm).length;
    els.alarmNote.textContent = alarms > 0
      ? `闹钟 ${alarms} 个 · 已设置 ${assigned} 个：把闹钟拖到锅上，进入火候区前会响铃。`
      : '没有闹钟：盯着绿色火候区，自己数秒关火。';
    els.potNote.textContent = `绿色区 ${BOIL_MIN}%–${BOIL_MAX}% · 太早太晚都会失败`;
    renderPots();
    renderAlarmTray();
  }

  function renderAlarmTray(){
    if(!els.alarmTray || !els.alarmTrayItems) return;
    const total = state.upgrade.alarms || 0;
    const assigned = state.pots.filter(p => p.alarm).length;
    const free = Math.max(0, total - assigned);
    els.alarmTray.hidden = state.stage !== 'kitchen' || total <= 0;
    els.alarmTrayItems.innerHTML = Array.from({length: free}, (_,i) =>
      `<div class="alarm-token" draggable="true" data-alarm="${i}" title="拖到锅炉上设置闹钟">⏰</div>`).join('');
  }
  function assignAlarm(potId){
    const p = state.pots[potId];
    if(!p || p.alarm) return;
    const assigned = state.pots.filter(x => x.alarm).length;
    if(assigned >= (state.upgrade.alarms || 0)){ toast('没有空闲闹钟了，去道具商店再买一个'); return; }
    p.alarm = true;
    p.alarmFired = false;
    sfx.ding();
    toast(`闹钟已放到熬糖锅 ${potId+1}，到火候区会响`);
    renderPots();
    renderAlarmTray();
  }

  function removeAlarm(potId, quiet){
    const p = state.pots[potId];
    if(!p || !p.alarm) return;
    p.alarm = false;
    p.alarmFired = false;
    renderPots();
    renderAlarmTray();
    if(!quiet){
      sfx.tap();
      toast(`闹钟已从熬糖锅 ${potId+1} 收回，可以拖到其他锅或放回托盘`);
    }
  }
  function moveAlarm(fromId, toId){
    if(fromId === toId) return;
    const from = state.pots[fromId];
    const to = state.pots[toId];
    if(!from || !to || !from.alarm) return;
    if(to.alarm){ toast('那口锅已经有闹钟了'); return; }
    from.alarm = false;
    from.alarmFired = false;
    to.alarm = true;
    to.alarmFired = false;
    sfx.ding();
    toast(`闹钟已移到熬糖锅 ${toId+1}`);
    renderPots();
    renderAlarmTray();
  }

  function potStatusText(p){
    if(p.status === 'heating') return '熬制中';
    if(!p.sugar) return '先加糖';
    return `已加 ${p.sugar} 勺糖`;
  }
  function renderPots(){
    let html = '';
    for(let i=0;i<4;i++){
      if(i >= state.upgrade.pots){
        html += `<div class="pot-empty">锅位 ${i+1}<br>去金币商店解锁</div>`;
        continue;
      }
      const p = state.pots[i];
      const dots = [1,2,3].map(n => `<i class="sugar-dot ${p.sugar >= n ? 'on' : ''}"></i>`).join('');
      const types = availableSyrups().map(id =>
        `<button class="pot-type ${p.types.includes(id) ? 'on' : ''}" type="button" data-pot-type="${id}" data-pot="${i}" ${p.status !== 'idle' ? 'disabled' : ''}>${SYRUPS[id].name.replace('糖浆','')}</button>`).join('');
      let actions = '';
      if(p.status === 'heating'){
        actions = `<button class="primary" type="button" data-pot-stop="${i}">关火出锅</button>`;
      }else{
        actions = `<button type="button" data-pot-sugar="-1" data-pot="${i}" ${p.sugar<=0?'disabled':''}>−</button>
          <button type="button" data-pot-sugar="1" data-pot="${i}" ${p.sugar>=3?'disabled':''}>糖+</button>
          <button class="primary" type="button" data-pot-start="${i}" ${p.sugar<1?'disabled':''}>开火</button>`;
      }
      const alarm = p.alarm ? `<button class="pot-alarm" type="button" data-pot-alarm="${i}" title="点击收回闹钟，或拖到其他锅">⏰ 闹钟</button>` : '';
      html += `<div class="pot-card" data-status="${p.status}" data-pot-drop="${i}">
        <div class="pot-head"><b>熬糖锅 ${i+1}</b><span class="pot-sugar">${dots}${alarm}</span></div>
        <div class="pot-types">${types}</div>
        <div class="pot-gauge"><div class="pot-zone"></div><div class="pot-fill" id="potFill${i}" style="width:${p.progress}%"></div></div>
        <div class="pot-meta"><span>${potStatusText(p)}</span><b id="potPct${i}">${Math.round(p.progress)}%</b></div>
        <div class="pot-actions">${actions}</div>
      </div>`;
    }
    els.potGrid.innerHTML = html;
  }
  function updatePotVisuals(){
    state.pots.forEach(p => {
      if(p.status !== 'heating') return;
      const fill = document.getElementById('potFill'+p.id);
      const pct = document.getElementById('potPct'+p.id);
      if(fill) fill.style.width = clamp(p.progress,0,100) + '%';
      if(pct) pct.textContent = Math.round(p.progress) + '%';
    });
  }

  function renderHint(){
    if(state.phase === 'intro'){ els.hintText.textContent = '先看看今天的订单吧'; return; }
    if(state.phase !== 'playing') return;
    let text = '';
    if(state.stage === 'desk'){
      text = state.can.sealed ? '封好啦，点下面的「交给客人」' : '服务台：客人正在等，去工作台或厨房准备';
    }else if(state.stage === 'work'){
      const c = state.can, o = state.order;
      if(!c.size) text = '第 1 步：按订单挑一个罐型';
      else if(countPieces(c.pieces).large + countPieces(c.pieces).small === 0) text = '第 2 步：把切好的黄桃放进罐子';
      else if(!findBatch()) text = '第 3 步：去厨房熬一锅糖水';
      else if(c.syrup <= 0) text = '选一锅糖水，按住倒到绿色目标区';
      else if(!c.temp) text = '第 4 步：按订单选温度';
      else if(!c.toppingTouched) text = '第 5 步：按订单选加料（可多选）';
      else text = c.sealed ? '封盖完成，去服务台交给客人吧' : '都配好啦，点「封盖」，再回服务台';
    }else{
      const o = state.order;
      const need = peachTotal(o.peaches);
      const have = state.bowl.large + state.bowl.small;
      if(state.batches.length && have >= need) text = '糖水和黄桃都备好了，回工作台装罐吧';
      else if(have >= need) text = '黄桃够了，接下来加糖熬糖水';
      else text = `先切黄桃：订单要 ${peachText(o.peaches)}`;
    }
    els.hintText.textContent = text;
    els.hint.classList.toggle('pulse', state.stage === 'desk' && state.can.sealed);
  }

  function updateFooter(){
    const sealed = state.can.sealed;
    const show = (el,on) => { el.style.display = on ? '' : 'none'; };
    show(els.resetBtn, state.stage === 'work' && !sealed);
    show(els.sealBtn, state.stage === 'work' && !sealed);
    show(els.serveBtn, true);
    if(state.stage === 'desk'){
      els.footer.style.gridTemplateColumns = '1fr';
      els.serveBtn.innerHTML = `${icon('arrow')}${sealed ? '交给客人' : '还没做好'}`;
      els.serveBtn.disabled = !sealed;
    }else if(state.stage === 'work'){
      els.footer.style.gridTemplateColumns = sealed ? '1fr' : '0.8fr 1.2fr 1fr';
      els.resetBtn.innerHTML = `${icon('refresh')}重做`;
      els.sealBtn.innerHTML = `${icon('lid')}封盖`;
      els.sealBtn.disabled = false;
      els.serveBtn.innerHTML = `${icon('arrow')}${sealed ? '去服务台' : '出餐'}`;
      els.serveBtn.disabled = !sealed;
    }else{
      els.footer.style.gridTemplateColumns = '1fr';
      els.serveBtn.innerHTML = `${icon('arrow')}去工作台`;
      els.serveBtn.disabled = false;
    }
  }

  function updateTabBadges(){
    els.stageTabs.forEach(t => t.classList.remove('alert'));
    if(state.can.sealed) $('.stage-tab[data-stage="desk"]').classList.add('alert');
    if(state.batches.length && state.stage !== 'work') $('.stage-tab[data-stage="work"]').classList.add('alert');
  }

  function renderAll(){
    updateHud();
    renderOrderTicket();
    renderGuest();
    renderCan();
    renderPatience(state.patience);
    setStage(state.stage, true);
    updateTabBadges();
  }

  /* -------------------- 游戏流程 -------------------- */
  function pickGuest(index){
    const special = specialForDay(state.day);
    if(special && special.slot === index) return special.guest;
    const pool = GUESTS.filter(g => !state.todayGuests.includes(g.name));
    return pool.length ? pool[randInt(0, pool.length - 1)] : GUESTS[randInt(0, GUESTS.length - 1)];
  }

  function newCustomer(index){
    if(index === 0) state.todayGuests = [];
    state.guestIndex = index;
    state.guest = pickGuest(index);
    state.todayGuests.push(state.guest.name);
    state.personality = personalityFor(state.guest);
    markSeen(state.guest);
    state.patienceMs = personalityPatience(state.personality, state.guest);
    state.order = makeOrder(index, state.guest);
    state.can = emptyCan();
    state.selectedBatch = null;
    state.pouring = false;
    state.patience = 1;
    state.deadline = performance.now() + state.patienceMs;
    state.phase = 'playing';
    state.stage = 'desk';
    els.game.dataset.stage = 'desk';
    setGuestMood('idle');
    renderAll();
    resetOrderTicket();
    renderFrogWear();
    renderDesk();
    renderWork();
    renderKitchen();
    updateFooter();
    renderHint();
    updateTabBadges();
    showSpeech(state.guest.greet);
    sfx.guest();
    const special = specialForDay(state.day);
    if(special && special.slot === index){
      setTimeout(() => toast(special.type === 'boss'
        ? `周末 BOSS「${state.guest.name}」到店：耐心 ${Math.round(state.patienceMs/1000)} 秒，奖励 ×${state.guest.coin}！`
        : `精英客人「${state.guest.name}」到店：订单更复杂，奖励 ×${state.guest.coin}！`), 420);
    }else if(index === 0 && !state.orderTipShown){
      state.orderTipShown = true;
      setTimeout(() => toast('小提示：订单可以拖到右上角的棍子上收纳'), 1800);
    }
    cueMusic();
  }

  function setMenuGroup(toggle, panel, open){
    if(!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
    const group = toggle.closest('.menu-group');
    if(group) group.classList.toggle('open', open);
  }
  function toggleMenuGroup(toggle, panel){
    const open = toggle.getAttribute('aria-expanded') === 'true';
    setMenuGroup(toggle, panel, !open);
    sfx.tap();
  }
  function setIntroMode(mode){
    if(!MODES[mode]) return;
    state.introMode = mode;
    els.modeCards.forEach(card => card.classList.toggle('active', card.dataset.mode === mode));
    if(els.modeToggleName) els.modeToggleName.textContent = MODES[mode].name;
    els.startBtn.innerHTML = `${mode === 'normal' ? '开始 14 天营业' : '开始无尽营业'}${icon('arrow')}`;
    const best = mode === 'normal' ? state.bestNormal : state.bestEndless;
    const bestText = mode === 'normal'
      ? (best ? ` · 最佳周目 ${best} 金币` : '')
      : (best ? ` · 最远第 ${best} 周` : '');
    els.introNote.textContent = (mode === 'normal'
      ? '普通模式 · 14 天后结算总营业额'
      : '无尽模式 · 每周业绩递增 · 不达标就关门') + bestText;
    setMenuGroup(els.modeToggle, els.modePanel, false);
    sfx.tap();
  }
  function startGame(){
    if(state.phase !== 'intro') return;
    beginRun(state.introMode || 'normal');
  }
  function beginRun(mode){
    ensureAudio();
    state.mode = MODES[mode] ? mode : 'normal';
    state.day = 1;
    state.coins = activeProfile ? activeProfile.wallet : 0;
    state.dayCoins = 0;
    state.dayStars = 0;
    state.runEarned = 0;
    state.week = 1;
    state.weekEarned = 0;
    state.weekTarget = weekTargetFor(1);
    state.summaryKind = 'day';
    state.metaAwarded = false;
    state.orderTipShown = false;
    state.reviews = [];
    state.guestIndex = 0;
    state.bowl = {large:0, small:0};
    state.batches = [];
    state.selectedBatch = null;
    state.pots = makePots();
    if(activeProfile && activeProfile.upgrades) state.upgrade = activeProfile.upgrades;
    state.stock = Infinity;
    batchSeq = 0;
    lastOrderSig = '';
    els.introOverlay.classList.remove('show');
    els.summaryOverlay.classList.remove('show');
    els.summaryOverlay.setAttribute('aria-hidden','true');
    els.shopOverlay.classList.remove('show');
    els.shopOverlay.setAttribute('aria-hidden','true');
    els.canWrap.classList.remove('serving');
    els.startBtn.blur();
    newCustomer(0);
    applySkins();
    saveGame();
  }
  function goHome(){
    state.phase = 'intro';
    state.stage = 'desk';
    state.guest = null;
    state.order = null;
    state.can = emptyCan();
    state.pouring = false;
    els.reviewOverlay.classList.remove('show');
    els.reviewOverlay.setAttribute('aria-hidden','true');
    els.summaryOverlay.classList.remove('show');
    els.summaryOverlay.setAttribute('aria-hidden','true');
    els.shopOverlay.classList.remove('show');
    els.shopOverlay.setAttribute('aria-hidden','true');
    els.introOverlay.classList.add('show');
    if(els.homeOverlay) els.homeOverlay.classList.remove('show');
    if(els.leaderboardOverlay) els.leaderboardOverlay.classList.remove('show');
    renderPlayerBar();
    els.game.dataset.stage = 'desk';
    updateHud();
    renderOrderTicket();
    renderGuest();
    renderCan();
    renderDesk();
    renderWork();
    renderKitchen();
    renderPatience(1);
    updateFooter();
    renderHint();
    cueMusic();
  }

  function selectSize(size){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    if(state.can.size === size) return;
    state.can.size = size;
    state.can.pieces = [];
    state.can.syrup = 0;
    state.selectedBatch = null;
    renderCan();
    bumpCan();
    renderWork();
    updateFooter();
    renderHint();
    updateTabBadges();
    sfx.tap();
  }

  function addPiece(size){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    if(!state.can.size){ toast('先挑一个罐型'); return; }
    if(state.can.pieces.length >= 24){ toast('罐子已经塞满啦，先出餐吧'); return; }
    if(!state.bowl[size]){ toast(`碗里没有${size === 'large' ? '大块' : '小块'}，先去厨房切`); return; }
    state.bowl[size]--;
    state.can.pieces.push(size);
    renderCan();
    updateSyrupVisual();
    bumpCan();
    renderWork();
    sfx.add();
    renderHint();
    updateTabBadges();
    updateFooter();
  }
  function removePiece(size){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    const idx = state.can.pieces.lastIndexOf(size);
    if(idx < 0) return;
    state.can.pieces.splice(idx,1);
    state.bowl[size]++;
    renderCan();
    updateSyrupVisual();
    bumpCan();
    renderWork();
    sfx.remove();
    renderHint();
    updateFooter();
  }
  function setTemp(temp){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    state.can.temp = state.can.temp === temp ? null : temp;
    renderCan();
    renderWork();
    renderHint();
    sfx.tap();
  }
  function setTopping(topping){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    state.can.toppingTouched = true;
    if(topping === 'none'){
      state.can.toppings = [];
      state.toppingFocus = null;
    }else{
      const item = state.can.toppings.find(t => t.id === topping);
      if(!item) state.can.toppings.push({id:topping, qty:1});
      state.toppingFocus = topping;
    }
    renderCan();
    renderWork();
    renderHint();
    sfx.add();
  }
  function changeToppingQty(delta){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    const list = state.can.toppings;
    if(!list.length){ toast('先选一种加料'); return; }
    let focus = state.toppingFocus;
    if(!focus || !list.some(t => t.id === focus)) focus = list[0].id;
    const item = list.find(t => t.id === focus);
    if(!item) return;
    const next = clamp(item.qty + delta, 0, 99);
    if(next <= 0){
      state.can.toppings = list.filter(t => t.id !== focus);
      state.toppingFocus = state.can.toppings.length ? state.can.toppings[0].id : null;
    }else{
      item.qty = next;
      state.toppingFocus = focus;
    }
    renderCan();
    renderWork();
    sfx.tap();
  }
  function cycleJar(){
    if(state.phase !== 'playing' || !state.can.size || state.can.sealed) return;
    const jars = unlockedJars();
    const idx = Math.max(0, jars.indexOf(state.can.jar || 'classic'));
    state.can.jar = jars[(idx + 1) % jars.length];
    renderCan();
    renderWork();
    toast(`换成了${JARS[state.can.jar].name}`);
    sfx.tap();
  }

  function cutPeach(size){
    if(state.phase !== 'playing' || state.stage !== 'kitchen') return;
    if(state.bowl.large + state.bowl.small >= 30){ toast('碗满了，先去做罐头吧'); return; }
    state.bowl[size]++;
    els.cutStage.classList.add('chop');
    setTimeout(() => els.cutStage.classList.remove('chop'), 160);
    sfx.chop();
    renderKitchen();
    renderHint();
  }

  function cyclePotType(potId, type){
    const p = state.pots[potId];
    if(!p || p.status !== 'idle') return;
    if(p.types.includes(type)){
      if(p.types.length === 1){ toast('至少保留一种糖浆'); return; }
      p.types = p.types.filter(t => t !== type);
    }else{
      if(p.types.length >= 2){ toast('一口锅最多两种糖浆'); return; }
      p.types.push(type);
    }
    sfx.tap();
    renderPots();
  }
  function addSugar(potId, delta){
    if(state.phase !== 'playing' || state.stage !== 'kitchen') return;
    const p = state.pots[potId];
    if(!p || p.status !== 'idle') return;
    p.sugar = clamp(p.sugar + delta, 0, 3);
    sfx.tap();
    renderPots();
  }
  function startBoil(potId){
    if(state.phase !== 'playing' || state.stage !== 'kitchen') return;
    const p = state.pots[potId];
    if(!p || p.status !== 'idle') return;
    if(p.sugar < 1){ toast('先加糖再开火'); return; }
    p.status = 'heating';
    p.progress = 0;
    p.startedAt = performance.now();
    p.alarmFired = false;
    renderPots();
    sfx.tap();
    updateTabBadges();
  }
  function stopBoil(potId){
    if(state.phase !== 'playing') return;
    const p = state.pots[potId];
    if(!p || p.status !== 'heating') return;
    const elapsed = performance.now() - p.startedAt;
    const pct = clamp(elapsed / BOIL_MS * 100, 0, 100);
    p.progress = pct;
    const quality = pct < BOIL_MIN ? 'thin' : pct > BOIL_MAX ? 'burnt' : 'perfect';
    bottlePot(p, quality);
  }
  function bottlePot(p, quality){
    const batch = {id:++batchSeq, sugar:p.sugar, quality, types:(p.types || ['classic']).slice()};
    state.batches.push(batch);
    state.selectedBatch = batch.id;
    p.status = 'idle'; p.sugar = 0; p.progress = 0; p.quality = null;
    if(quality === 'perfect'){ sfx.ding(); toast('火候完美！糖水已经放到工作台啦'); }
    else{ sfx.error(); buzz(50); toast(quality === 'thin' ? '偏生了点，不过也能用，已经装瓶' : '有点焦苦，不过也能用，已经装瓶'); }
    renderPots();
    renderWork();
    updateTabBadges();
    renderHint();
  }
  function dumpPot(potId){
    const p = state.pots[potId];
    if(!p) return;
    p.status = 'idle'; p.sugar = 0; p.progress = 0; p.quality = null;
    sfx.remove();
    renderPots();
  }
  function updateBoils(now){
    state.pots.forEach(p => {
      if(p.status !== 'heating') return;
      p.progress = clamp((now - p.startedAt) / BOIL_MS * 100, 0, 100);
      if(p.alarm && !p.alarmFired && p.progress >= 50){
        p.alarmFired = true;
        sfx.alarm(); buzz(35);
      }
      if(p.progress >= 100){
        bottlePot(p, 'burnt');
      }
    });
    updatePotVisuals();
  }

  function selectBatch(id){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    const batch = state.batches.find(b => b.id === id);
    if(!batch || batch.used) return;
    if(state.can.sealed){ toast('已经封盖了，先重做'); return; }
    state.selectedBatch = id;
    if(!state.can.batchId) state.can.batchId = id;
    renderWork();
    renderHint();
    sfx.tap();
  }

  function startPour(){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.pouring || state.can.sealed) return;
    if(!state.can.size){ toast('先挑一个罐型'); return; }
    if(!findBatch()){ toast('先去厨房熬一锅糖水，再回来倒'); return; }
    if(state.can.syrup >= 100) return;
    state.pouring = true;
    state.can.batchId = state.selectedBatch;
    ensureAudio();
    els.pourBtn.classList.add('pouring');
  }
  function stopPour(){
    if(!state.pouring) return;
    state.pouring = false;
    if(els.pourBtn) els.pourBtn.classList.remove('pouring');
    renderWork();
    renderHint();
  }
  function tickPour(now){
    if(!state.pouring) return;
    const c = state.can;
    const batch = findBatch();
    if(!batch){ stopPour(); return; }
    const types = (batch.types && batch.types.length) ? batch.types : ['classic'];
    const add = POUR_RATE * 16.7;
    const each = add / types.length;
    types.forEach(id => { c.components[id] = clamp((c.components[id] || 0) + each, 0, 100); });
    c.syrup = clamp(c.syrup + add, 0, 100);
    if(!c.batchIds.includes(batch.id)) c.batchIds.push(batch.id);
    updateSyrupVisual();
    els.syrupFill.style.width = c.syrup + '%';
    els.syrupReadout.textContent = Math.round(c.syrup) + '%';
    const sb = SUGAR[state.order.sugar];
    els.syrupFill.classList.toggle('in-zone', Math.abs(c.syrup - sb.target) <= (state.order.tol || sb.tol));
    if(now - state.lastPourSfx > 110){ state.lastPourSfx = now; sfx.pour(); }
    if(c.syrup >= 100){ stopPour(); toast('倒满啦，松手吧'); }
  }

  function resetCan(){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    state.can.pieces.forEach(s => state.bowl[s]++);
    state.can = emptyCan();
    state.selectedBatch = null;
    state.pouring = false;
    renderCan();
    renderWork();
    renderHint();
    updateFooter();
    updateTabBadges();
    sfx.remove();
  }

  function sealCan(){
    if(state.phase !== 'playing' || state.stage !== 'work' || state.can.sealed) return;
    const c = state.can;
    if(!c.size){ toast('还没挑罐型'); return; }
    if(!c.pieces.length){ toast('罐子里还没有黄桃'); return; }
    if(!findBatch() || c.syrup <= 0){ toast('还没倒糖水'); return; }
    if(!c.temp){ toast('还没选温度'); return; }
    if(!c.toppingTouched){ toast('还没选加料，点「不加」也可以'); return; }
    c.sealed = true;
    const batch = findBatch();
    if(batch){
      if(!state.can.batchId) state.can.batchId = batch.id;
      batch.used = true;
    }
    state.pouring = false;
    renderCan();
    els.canWrap.classList.remove('bump');
    els.canWrap.classList.add('sealing');
    setTimeout(() => els.canWrap.classList.remove('sealing'), 650);
    sfx.seal();
    toast('封盖完成！去服务台交给客人吧');
    renderWork();
    updateFooter();
    renderHint();
    updateTabBadges();
  }

  function serveOrder(){
    if(state.phase !== 'playing') return;
    if(state.stage !== 'desk'){
      if(state.can.sealed) setStage('desk');
      return;
    }
    if(!state.can.sealed){ toast('罐头还没封好，先去工作台'); setStage('work'); return; }
    state.phase = 'serving';
    state.pouring = false;
    stopAllHeating();
    setGuestMood('happy');
    sfx.serve();
    els.canWrap.classList.add('serving');
    setTimeout(() => finishOrder(false), 680);
  }
  function stopAllHeating(){
    state.pots.forEach(p => { if(p.status === 'heating'){ p.status = 'idle'; p.progress = 0; p.sugar = 0; p.alarmFired = false; } });
    if(state.stage === 'kitchen') renderPots();
  }
  function timeoutOrder(){
    if(state.phase !== 'playing') return;
    state.phase = 'serving';
    state.pouring = false;
    stopAllHeating();
    setGuestMood('sad');
    sfx.sad();
    setTimeout(() => finishOrder(true), 420);
  }

  function scoreOrder(timedOut){
    const c = state.can, o = state.order;
    const counts = countPieces(c.pieces);
    const total = c.pieces.length;
    const need = peachTotal(o.peaches);
    const sizeOk = c.size === o.size;
    const jarChoice = unlockedJars().length > 1;
    const jarOk = !jarChoice || (c.jar || 'classic') === (o.jar || 'classic');
    const countDiff = Math.abs(total - need);
    const sizeDiff = Math.abs(counts.large - o.peaches.large) + Math.abs(counts.small - o.peaches.small);
    const sizeScore = sizeOk ? 6 : 0;
    const jarScore = jarChoice ? (jarOk ? 2 : 0) : 2;
    const countScore = countDiff === 0 ? 8 : countDiff === 1 ? 4 : 0;
    const pieceSizeScore = sizeDiff === 0 ? 7 : Math.max(0, 7 - sizeDiff * 3.5);
    const peachScore = countScore + pieceSizeScore;

    const wantSyrups = o.syrups || [{id:'classic', ratio:100}];
    const wantIds = wantSyrups.map(s => s.id);
    const gotIds = SYRUP_IDS.filter(id => (c.components[id] || 0) > .5);
    const matched = wantIds.filter(id => gotIds.includes(id));
    const extra = gotIds.filter(id => !wantIds.includes(id)).length;
    const usedBatches = (c.batchIds || []).map(id => state.batches.find(b => b.id === id)).filter(Boolean);
    if(!usedBatches.length && c.batchId) usedBatches.push(state.batches.find(b => b.id === c.batchId));
    const batchTypes = usedBatches.map(b => b.types || ['classic']);
    const styleOk = wantIds.length <= 1
      ? batchTypes.every(t => t.length === 1)
      : o.boilStyle === 'together'
        ? batchTypes.some(t => t.length > 1)
        : batchTypes.every(t => t.length === 1);
    const kindScore = Math.max(0, 7 * matched.length / wantIds.length - extra * 3) + (styleOk ? 3 : 0);

    const target = SUGAR[o.sugar].target, tol = o.tol || SUGAR[o.sugar].tol;
    let maxRatioDiff = 0;
    wantSyrups.forEach(s => {
      const want = target * s.ratio / 100;
      maxRatioDiff = Math.max(maxRatioDiff, Math.abs((c.components[s.id] || 0) - want));
    });
    const ratioScore = maxRatioDiff <= tol ? 8 : Math.max(0, 8 - (maxRatioDiff - tol) * .7);

    const qualityPts = usedBatches.map(b => b.quality === 'perfect' ? 10 : b.quality === 'thin' ? 5 : 1);
    const batch = usedBatches[0] || null;
    const boilScore = qualityPts.length ? qualityPts.reduce((a,b) => a+b, 0) / qualityPts.length : 0;

    const pourDiff = Math.abs(c.syrup - target);
    const pourScore = c.syrup <= 0 ? 0 : pourDiff <= tol ? 12 : Math.max(0, 12 - (pourDiff - tol) * .8);

    const stirScore = wantIds.length > 1 ? (!!c.stirred === !!o.stirred ? 7 : 0) : 7;

    const tempScore = c.temp === o.temp ? 10 : 0;
    const wantTops = o.toppings || [], gotTops = c.toppings || [];
    let toppingKindScore = 0, toppingQtyScore = 0;
    if(!wantTops.length){
      toppingKindScore = gotTops.length ? 0 : 6;
      toppingQtyScore = gotTops.length ? 0 : 4;
    }else{
      const topMatched = wantTops.filter(w => gotTops.some(g => g.id === w.id));
      const exact = wantTops.filter(w => gotTops.some(g => g.id === w.id && g.qty === w.qty));
      const topExtra = gotTops.filter(g => !wantTops.some(w => w.id === g.id)).length;
      toppingKindScore = Math.max(0, 6 * topMatched.length / wantTops.length - topExtra * 1.5);
      toppingQtyScore = 4 * exact.length / wantTops.length;
    }
    const toppingScore = toppingKindScore + toppingQtyScore;
    const remain = Math.max(0, state.deadline - performance.now());
    const speedScore = remain >= state.patienceMs * .5 ? 10 : remain >= state.patienceMs * .25 ? 7 : remain > 0 ? 4 : 0;
    const baseScore = timedOut ? 0 : Math.round(sizeScore + jarScore + peachScore + kindScore + ratioScore + boilScore + pourScore + stirScore + tempScore + toppingScore + speedScore);
    const p = state.personality || (state.guest && personalityFor(state.guest));
    let score = baseScore;
    if(!timedOut && p){
      if(p.id === 'generous') score = Math.min(100, Math.round(baseScore + 5 + (100 - baseScore) * .12));
      else if(p.id === 'strict') score = Math.max(0, Math.round(baseScore - (baseScore < 100 ? 4 : 0)));
      else if(p.id === 'irritable') score = Math.max(0, Math.round(100 - (100 - baseScore) * 1.75));
    }
    const pDelta = score - baseScore;
    const perfect = !timedOut && score >= 100;
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 45 ? 1 : 0;
    const baseCoins = timedOut ? 0 : 8 + Math.round(score * .12) + (perfect ? 5 : 0);
    const coins = Math.round(baseCoins * ((state.guest && state.guest.coin) || 1));
    const details = [];
    details.push({ok:sizeScore===6, label:'罐型', text: sizeOk ? `${SIZES[c.size].name} ✓` : `要${SIZES[o.size].name}${c.size ? ` · 用了${SIZES[c.size].name}` : ''}`});
    if(jarChoice) details.push({ok:jarOk, label:'罐子', text: jarOk ? `${JARS[c.jar || 'classic'].name} ✓` : `要${JARS[o.jar || 'classic'].name}`});
    details.push({ok:peachScore===15, label:'黄桃', text: `${counts.large}大${counts.small}小 · 共${total}块${peachScore===15 ? ' ✓' : ` / 要${peachText(o.peaches)}`}`});
    details.push({ok:kindScore>=9.5, label:'糖浆种类', text: c.syrup > 0 ? `${gotIds.map(id => SYRUPS[id].name).join('+') || '空'}${kindScore>=9.5 ? ' ✓' : ` / 要${wantIds.map(id => SYRUPS[id].name).join('+')}${wantIds.length > 1 ? (o.boilStyle === 'together' ? '·一起熬' : '·分开熬') : ''}`}` : '还没倒糖浆'});
    const ratioText = wantSyrups.map(s => `${SYRUPS[s.id].name} ${Math.round(c.components[s.id] || 0)}/${Math.round(target * s.ratio / 100)}%`).join(' · ');
    details.push({ok:ratioScore>=7.5, label:'糖浆比例', text: ratioText});
    details.push({ok:boilScore>=9.5, label:'熬糖火候', text: usedBatches.length ? usedBatches.map(b => `${(b.types||['classic']).map(id=>SYRUPS[id].name).join('+')}：${b.quality === 'perfect' ? '完美' : b.quality === 'thin' ? '偏生' : '焦苦'}`).join(' / ') : '没有可用糖水'});
    details.push({ok:pourScore>=11.5, label:'倒糖量', text: `总 ${Math.round(c.syrup)}% / 目标 ${Math.round(target)}%`});
    details.push({ok:stirScore===7, label:'搅拌', text: wantIds.length > 1 ? (c.stirred ? '已搅拌 ✓' : '分层') + (o.stirred === !!c.stirred ? ' ✓' : o.stirred ? ' / 要搅拌' : ' / 要分层') : '单糖浆 ✓'});
    details.push({ok:tempScore===10, label:'温度', text: c.temp ? `${TEMPS[c.temp]}${tempScore===10 ? ' ✓' : ` / 要${TEMPS[o.temp]}`}` : '没选温度'});
    details.push({ok:toppingScore>=9.5, label:'加料', text: c.toppingTouched ? `${toppingText(gotTops)}${toppingScore>=9.5 ? ' ✓' : ` / 要${toppingText(wantTops)}`}` : '没选加料'});
    details.push({ok:speedScore===10, label:'出餐速度', text: timedOut ? '超时了…' : speedScore===10 ? '手速超快' : speedScore===7 ? '稍微有点慢' : '客人等急了'});
    return {score, baseScore, pDelta, personality:p, stars, perfect, coins, details, timedOut, guest:state.guest};
  }

  function commentFor(result){
    const p = result.personality;
    if(result.timedOut){
      if(p && p.id === 'patient') return '我已经很有耐心地等了……可罐头还是没来，下次要快一点点哦。';
      if(p && p.id === 'irritable') return '等这么久？我现在很不高兴。';
      return `等太久啦，我的黄桃罐头还没好吗？下次要快一点哦……`;
    }
    if(result.perfect) return result.guest.happy;
    if(p && p.id === 'generous' && result.score >= 65) return '已经很不错啦！这点小差别我不介意，好吃最重要～';
    if(p && p.id === 'irritable' && result.score < 80) return '就这一点小错，已经够让我生气了。';
    if(p && p.id === 'strict' && result.score < 90) return '细节还不够。我的订单上写得很清楚。';
    if(result.score >= 80) return '整体很不错！如果细节再准一点，就是满分罐头啦～';
    if(result.score >= 55) return '味道还行，不过有些地方和订单不太一样，下次注意哦。';
    return '这次的罐头和我想的不太一样……再仔细看看订单吧。';
  }

  function finishOrder(timedOut){
    if(state.phase === 'reviewing') return;
    state.phase = 'reviewing';
    state.pouring = false;
    stopAllHeating();
    const result = scoreOrder(timedOut);
    result.comment = commentFor(result);
    state.scoreResult = result;
    state.reviews.push(result);
    state.dayStars += result.stars;
    state.dayCoins += result.coins;
    addWallet(result.coins);
    state.runEarned += result.coins;
    state.weekEarned += result.coins;
    saveGame();
    renderReview(result);
    updateHud();
    updateTabBadges();
    cueMusic();
  }

  function renderReview(result){
    const starsHtml = [0,1,2].map(i => `<svg class="icon star ${i < result.stars ? 'on' : ''}" style="transition-delay:${i*.08}s"><use href="#i-star"></use></svg>`).join('');
    els.reviewStars.innerHTML = starsHtml;
    els.reviewTitle.textContent = result.timedOut ? '客人等不及了…' : result.perfect ? '完美出餐！' : result.stars === 3 ? '客人超满意！' : result.stars === 2 ? '还不错哦～' : result.stars === 1 ? '勉强过关…' : '客人有点失望…';
    els.reviewScore.textContent = result.score;
    if(els.reviewSpecial){
      const g = result.guest;
      els.reviewSpecial.hidden = !g.badge;
      if(g.badge){
        els.reviewSpecial.className = `review-special ${g.tier}`;
        els.reviewSpecial.textContent = g.tier === 'boss' ? '周末 BOSS 挑战 · 奖励 ×2' : '精英客人挑战 · 奖励 ×1.35';
      }
    }
    if(els.reviewPersonality){
      const p = result.personality;
      els.reviewPersonality.hidden = !p;
      if(p){
        els.reviewPersonality.style.setProperty('--pc', p.color);
        const delta = result.pDelta ? ` · 性格修正 ${result.pDelta > 0 ? '+' : ''}${result.pDelta}` : '';
        els.reviewPersonality.innerHTML = `<span class="personality-tag" style="--pc:${p.color}">${p.icon} ${p.name}</span><small>${personalityWaitText(p)}${delta}</small>`;
      }
    }
    els.reviewQuote.innerHTML = `<b>${result.guest.name}：</b>${result.comment}`;
    els.reviewCoins.textContent = result.coins;
    els.perfectStamp.style.display = result.perfect ? 'grid' : 'none';
    els.scoreGrid.innerHTML = result.details.map(d => `
      <div class="score-item ${d.ok ? 'ok' : 'bad'}">
        <span class="status">${icon(d.ok ? 'check' : 'x')}</span>
        <span class="copy"><b>${d.label}</b><small>${d.text}</small></span>
      </div>`).join('');
    els.nextBtn.innerHTML = state.guestIndex >= GUEST_COUNT - 1 ? `查看今日结算${icon('arrow')}` : `下一位客人${icon('arrow')}`;
    els.reviewOverlay.classList.add('show');
    els.reviewOverlay.setAttribute('aria-hidden','false');
    setTimeout(() => {
      Array.from(els.reviewStars.querySelectorAll('.star.on')).forEach((star,i) => {
        star.style.animationDelay = (i * .1) + 's';
        star.classList.add('pop');
      });
    }, 160);
    if(result.stars >= 2) sfx.star(); else sfx.sad();
  }

  function nextGuest(){
    if(state.phase !== 'reviewing') return;
    els.reviewOverlay.classList.remove('show');
    els.reviewOverlay.setAttribute('aria-hidden','true');
    sfx.tap();
    if(state.guestIndex >= GUEST_COUNT - 1){
      setTimeout(showSummary, 300);
    }else{
      newCustomer(state.guestIndex + 1);
    }
  }

  function summaryKindForDay(){
    if(state.mode === 'normal' && state.day >= NORMAL_DAYS) return 'runEnd';
    if(state.mode === 'endless' && state.day % WEEK_DAYS === 0){
      return state.weekEarned >= state.weekTarget ? 'weekPass' : 'gameOver';
    }
    return 'day';
  }

  function showSummary(){
    state.phase = 'summary';
    state.pouring = false;
    const kind = summaryKindForDay();
    state.summaryKind = kind;
    const total = state.reviews.length;
    const stars = state.reviews.reduce((s,r) => s + r.stars, 0);
    const perfect = state.reviews.filter(r => r.perfect).length;
    const avg = total ? Math.round(state.reviews.reduce((s,r) => s + r.score, 0) / total) : 0;
    const isEnd = kind === 'runEnd' || kind === 'gameOver';
    awardProfile(kind);
    let ribbon = '今日营业结束';
    let title = `第 ${state.day} 天 · 打烊啦`;
    let sub = '';
    let comment = '';

    if(kind === 'runEnd'){
      ribbon = '14 天周目完成';
      title = '周目结束 · 打烊啦';
      sub = `14 天总营业额 <b>${state.runEarned}</b> 金币 · 当前余额 ${state.coins}`;
      comment = `<b>14 天周目完成！</b>本轮一共赚到 ${state.runEarned} 金币。普通模式的乐趣就是不断刷新自己的最高营业额，再开一局试试能不能更上一层楼！`;
      if(state.runEarned > state.bestNormal){ state.bestNormal = state.runEarned; saveGame(); }
    }else if(kind === 'weekPass'){
      ribbon = `第 ${state.week} 周达标`;
      title = `第 ${state.week} 周 · 继续营业！`;
      sub = `本周业绩 <b>${state.weekEarned}</b> / ${state.weekTarget} 金币 · 下周目标 ${weekTargetFor(state.week+1)}`;
      comment = `<b>第 ${state.week} 周业绩达标！</b>本周赚到 ${state.weekEarned} 金币，奶蛙的小店暂时保住了。下周目标会更高，记得先囤好糖水和升级厨房。`;
      if(state.week > state.bestEndless){ state.bestEndless = state.week; saveGame(); }
    }else if(kind === 'gameOver'){
      ribbon = '本周业绩未达标';
      title = `第 ${state.week} 周 · 营业失败`;
      sub = `本周只赚到 <b>${state.weekEarned}</b> / ${state.weekTarget} 金币`;
      comment = `<b>业绩没达标，奶蛙的店被房东收走了……</b>本周目标 ${state.weekTarget} 金币，只完成了 ${state.weekEarned}。再试一次，优先保证每单的糖水和火候，别让客人等太久。`;
    }else{
      sub = state.mode === 'normal'
        ? `第 ${state.day} / ${NORMAL_DAYS} 天 · 本轮累计 <b>${state.runEarned}</b> 金币`
        : `第 ${state.week} 周 · 本周业绩 <b>${state.weekEarned}</b> / ${state.weekTarget}`;
      if(stars >= 9) comment = '<b>奶蛙今天大成功！</b>三位客人都给出了满星评价，黄桃罐头店的招牌越来越亮啦！';
      else if(stars >= 7) comment = `<b>奶蛙辛苦啦！</b>今天拿到了 ${stars} 颗星，客人们都很喜欢你的黄桃罐头。`;
      else if(stars >= 4) comment = `<b>还不错哦～</b>再仔细看看订单，把糖水和加料都配对，客人会更开心。`;
      else comment = `<b>明天继续加油！</b>先看清订单再动手，奶蛙一定能做出完美的黄桃罐头。`;
    }


    els.summaryRibbon.textContent = ribbon;
    els.summaryTitle.textContent = title;
    els.summarySub.innerHTML = sub;
    els.summaryStars.textContent = stars;
    els.summaryCoins.textContent = kind === 'runEnd' ? state.runEarned : (kind === 'weekPass' || kind === 'gameOver') ? state.weekEarned : state.dayCoins;
    els.summaryCoinsLabel.textContent = kind === 'runEnd' ? '本轮营业额' : (kind === 'weekPass' || kind === 'gameOver') ? '本周收入' : '今日收入';
    els.summaryPerfect.textContent = perfect;
    els.summaryAvg.textContent = avg;
    els.summaryComment.innerHTML = comment;
    els.summaryBest.textContent = state.mode === 'normal'
      ? `最佳周目：${state.bestNormal || 0} 金币`
      : `最远纪录：第 ${state.bestEndless || 0} 周`;
    els.shopBtn.hidden = isEnd;
    els.shopBtn.style.display = isEnd ? 'none' : '';
    els.homeBtn.style.display = isEnd ? '' : 'none';
    if(els.summaryRankBtn){
      els.summaryRankBtn.style.display = kind === 'gameOver' ? '' : 'none';
      if(kind === 'gameOver') renderLeaderboard();
    }
    els.replayBtn.className = isEnd ? 'primary-btn' : 'ghost-btn';
    els.replayBtn.innerHTML = kind === 'runEnd' ? `再开一局普通模式${icon('arrow')}`
      : kind === 'gameOver' ? `重新挑战无尽模式${icon('arrow')}`
      : kind === 'weekPass' ? `开始第 ${state.week + 1} 周${icon('arrow')}`
      : `直接开始下一天`;
    els.summaryOverlay.classList.add('show');
    els.summaryOverlay.setAttribute('aria-hidden','false');
    spawnConfetti(kind === 'gameOver' ? 8 : stars >= 7 ? 28 : 14);
    if(kind === 'gameOver') sfx.sad(); else if(stars >= 7 || kind !== 'day') sfx.star(); else sfx.coin();
    cueMusic();
  }
  function spawnConfetti(count){
    const colors = ['#FFD23F','#EF6758','#4C9D69','#FFF0C0','#FF9B42','#7EB3E4'];
    els.confetti.innerHTML = '';
    for(let i=0;i<count;i++){
      const s = document.createElement('i');
      s.style.cssText = `position:absolute;left:${Math.random()*100}%;top:-16px;width:${5+Math.random()*5}px;height:${8+Math.random()*8}px;background:${colors[i%colors.length]};transform:rotate(${Math.random()*360}deg);opacity:${.55+Math.random()*.4};animation:confettiFall ${2.4+Math.random()*2}s ${Math.random()*.8}s linear forwards;border-radius:2px;`;
      els.confetti.appendChild(s);
    }
  }

  function startNextDay(){
    state.day += 1;
    state.dayCoins = 0;
    state.dayStars = 0;
    state.reviews = [];
    state.guestIndex = 0;
    state.bowl = {large:0, small:0};
    state.stock = Infinity;
    state.batches = [];
    state.selectedBatch = null;
    state.pots = makePots();
    batchSeq = 0;
    if(state.mode === 'endless' && (state.day - 1) % WEEK_DAYS === 0){
      state.week = Math.ceil(state.day / WEEK_DAYS);
      state.weekEarned = 0;
      state.weekTarget = weekTargetFor(state.week);
    }
    els.summaryOverlay.classList.remove('show');
    els.summaryOverlay.setAttribute('aria-hidden','true');
    els.shopOverlay.classList.remove('show');
    els.shopOverlay.setAttribute('aria-hidden','true');
    els.canWrap.classList.remove('serving');
    newCustomer(0);
    saveGame();
  }
  function onReplay(){
    if(state.summaryKind === 'runEnd' || state.summaryKind === 'gameOver') beginRun(state.mode);
    else startNextDay();
  }

  /* -------------------- 商店 -------------------- */
  function potPrice(){ return POT_PRICES[state.upgrade.pots] || 999; }
  function shopItems(){
    const items = [];
    const u = activeProfile ? activeProfile.upgrades : state.upgrade;
    items.push({id:'pot', name:'备用熬糖锅', desc:`当前 ${u.pots} 口 · 最多 4 口，可以同时熬多锅`, price:potPrice(),
      owned:u.pots >= 4, label:u.pots >= 4 ? '已满 4 口' : `买 ${potPrice()}`,
      icon:`<svg class="icon" style="width:28px;height:28px;color:#B67F1A"><use href="#i-heat"></use></svg>`});
    items.push({id:'alarm', name:'熬糖锅闹钟', desc:`买了拖到锅上 · 已有 ${u.alarms}/4 个，每口锅要单独设`, price:ALARM_PRICE,
      owned:u.alarms >= 4, label:u.alarms >= 4 ? '已满 4 个' : `买 ${ALARM_PRICE}`,
      icon:`<svg class="icon" style="width:28px;height:28px;color:#8A6842"><use href="#i-clock"></use></svg>`});
    Object.keys(KNIVES).forEach(id => {
      if(id === 'wood') return;
      const k = KNIVES[id];
      const owned = u.knives.includes(id);
      const equipped = u.knife === id;
      items.push({id:'knife:'+id, name:k.name, desc: equipped ? '正在使用 · 切桃时换一种手感' : '刀具皮肤 · 切桃时显示',
        price:k.price, owned:equipped, label:equipped ? '使用中' : owned ? '装备' : `买 ${k.price}`,
        icon:`<i class="knife-swatch" style="--sw:${k.color}"></i>`});
    });
    return items;
  }
  function syrupItems(){
    return ['honey','maple','honeysuckle'].map(id => {
      const s = SYRUPS[id], owned = !!(activeProfile && activeProfile.syrups[id]);
      return {id, name:s.name, desc:s.desc, price:s.price, owned,
        icon:`<span style="display:block;width:26px;height:26px;border-radius:50%;background:${s.color};border:2px solid #C58B3A"></span>`,
        label: owned ? '已解锁' : `解锁 ${s.price}`};
    });
  }
  function renderShopFurniture(){
    if(!els.shopFurnGrid || !activeProfile) return;
    els.shopFurnGrid.innerHTML = Object.entries(FURNITURE).map(([id,f]) => {
      const owned = activeProfile.ownedFurniture.includes(id);
      const placed = activeProfile.placedFurniture.includes(id);
      return `<div class="shop-item">
        <div class="shop-icon">${f.icon}</div>
        <div class="shop-copy"><b>${f.name}</b><small>${f.desc}</small></div>
        <button class="buy-btn ${owned ? 'equipped' : ''}" type="button" data-furniture="${id}" ${!owned && activeProfile.wallet < f.price ? 'disabled' : ''}>
          ${owned ? (placed ? '收起' : '摆放') : activeProfile.wallet >= f.price ? `买 ${f.price}` : `还差 ${f.price-activeProfile.wallet}`}
        </button>
      </div>`;
    }).join('');
  }
  function expansionItems(){
    const items = [];
    const u = activeProfile ? activeProfile.unlocks : {toppings:[],jars:[]};
    EXPANSION.topping.forEach(x => items.push({
      id:'topping:'+x.id, kind:'topping', name:x.name, desc:x.desc, price:x.price,
      owned:u.toppings.includes(x.id), icon:icon(TOPPINGS[x.id].icon)
    }));
    EXPANSION.jar.forEach(x => items.push({
      id:'jar:'+x.id, kind:'jar', name:JARS[x.id].name, desc:x.desc, price:x.price,
      owned:u.jars.includes(x.id), icon:icon('can')
    }));
    return items;
  }
  function setShopTab(tab){
    const valid = ['run','syrup','furniture','expand'];
    state.shopTab = valid.includes(tab) ? tab : 'run';
    if(els.shopTabs) els.shopTabs.querySelectorAll('[data-shoptab]').forEach(b => b.classList.toggle('active', b.dataset.shoptab === state.shopTab));
    [['shopGrid','run'],['shopSyrupGrid','syrup'],['shopFurnGrid','furniture'],['shopExpandGrid','expand']].forEach(([key,id]) => {
      if(els[key]){ els[key].hidden = state.shopTab !== id; els[key].style.display = state.shopTab === id ? 'grid' : 'none'; }
    });
    if(els.shopWallet){ els.shopWallet.hidden = false; els.shopWallet.style.display = 'flex'; }
  }
  function renderShop(){
    if(!activeProfile) return;
    const wallet = activeProfile.wallet;
    const main = !!state.shopMain;
    els.shopCoins.textContent = wallet;
    if(els.shopWallet) els.shopWallet.innerHTML = `<svg class="icon"><use href="#i-coin"></use></svg>金币 <b>${wallet}</b><small>全局购买，永久生效</small>`;
    if(els.shopTitle) els.shopTitle.textContent = main ? '道具商店' : '打烊后的金币商店';
    if(els.shopSub) els.shopSub.textContent = main ? '家具、升级、糖浆，买了就永久生效' : '买口锅、换把刀，让明天更快一点';
    if(els.shopStartBtn) els.shopStartBtn.style.display = main ? 'none' : '';
    if(els.shopEarlyBtn) els.shopEarlyBtn.style.display = main ? 'none' : '';
    if(els.shopBackBtn) els.shopBackBtn.textContent = main ? '关闭' : '回到今日结算';
    if(els.shopEvent) els.shopEvent.hidden = true;
    setShopTab(state.shopTab || 'run');
    if(els.shopExpandGrid){
      els.shopExpandGrid.innerHTML = expansionItems().map(item => {
        const disabled = item.owned || wallet < item.price;
        return `<div class="shop-item">
          <div class="shop-icon">${item.icon}</div>
          <div class="shop-copy"><b>${item.name}</b><small>${item.desc}</small></div>
          <button class="buy-btn ${item.owned ? 'equipped' : ''}" type="button" data-expand="${item.id}" ${disabled ? 'disabled' : ''}>${item.owned ? '已解锁' : wallet < item.price ? `还差 ${item.price - wallet}` : `解锁 ${item.price}`}</button>
        </div>`;
      }).join('');
    }
    if(els.shopSyrupGrid){
      els.shopSyrupGrid.innerHTML = syrupItems().map(item => {
        const disabled = item.owned || wallet < item.price;
        return `<div class="shop-item">
          <div class="shop-icon">${item.icon}</div>
          <div class="shop-copy"><b>${item.name}</b><small>${item.desc}</small></div>
          <button class="buy-btn ${item.owned ? 'equipped' : ''}" type="button" data-syrup="${item.id}" ${disabled ? 'disabled' : ''}>${item.owned ? '已解锁' : wallet < item.price ? `还差 ${item.price - wallet}` : item.label}</button>
        </div>`;
      }).join('');
    }
    renderShopFurniture();
    if(!main){
      els.shopStartBtn.innerHTML = state.summaryKind === 'weekPass'
        ? `开始第 ${state.week + 1} 周${icon('arrow')}`
        : `开始第 ${state.day + 1} 天${icon('arrow')}`;
      const nextDay = state.day + 1;
      const nextSpecial = specialForDay(nextDay);
      const nextValid = state.mode !== 'normal' || nextDay <= NORMAL_DAYS;
      if(els.shopEvent){
        els.shopEvent.hidden = !(nextValid && nextSpecial);
        if(nextValid && nextSpecial){
          els.shopEvent.className = `shop-event ${nextSpecial.type}`;
          const sg = nextSpecial.guest;
          const secs = Math.round(PATIENCE_MS * (sg.patience || 1) / 1000);
          els.shopEvent.innerHTML = nextSpecial.type === 'boss'
            ? `<b>明日 BOSS · ${sg.name}</b><span>第 ${nextDay} 天周末检查：耐心只有 ${secs} 秒，容错更小，奖励 ×${sg.coin}。先把糖水熬稳！</span>`
            : `<b>明日精英 · ${sg.name}</b><span>第 ${nextDay} 天精英上门：订单更复杂，耐心 ${secs} 秒，奖励 ×${sg.coin}。</span>`;
        }
      }
    }
    const u = activeProfile.upgrades;
    els.shopGrid.innerHTML = shopItems().map(item => {
      const isKnife = item.id.startsWith('knife:');
      const knifeId = isKnife ? item.id.split(':')[1] : '';
      const disabled = item.owned || wallet < item.price || (isKnife && u.knives.includes(knifeId) && wallet < 0);
      return `<div class="shop-item">
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-copy"><b>${item.name}</b><small>${item.desc}</small></div>
        <button class="buy-btn ${item.owned ? 'equipped' : ''}" type="button" data-buy="${item.id}" ${disabled ? 'disabled' : ''}>${item.label}</button>
      </div>`;
    }).join('');
  }
  function buyItem(itemId){
    ensureAudio();
    if(!activeProfile) return;
    const u = activeProfile.upgrades;
    if(itemId === 'pot'){
      if(u.pots >= 4) return;
      const price = potPrice();
      if(!spendCoins(price)){ toast('金币不够，再卖几罐吧'); return; }
      u.pots++;
      sfx.coin(); toast('新锅到手！厨房里多了一口熬糖锅');
    }else if(itemId === 'alarm'){
      if(u.alarms >= 4) return;
      if(!spendCoins(ALARM_PRICE)){ toast('金币不够'); return; }
      u.alarms++;
      sfx.coin(); toast('闹钟到手！在柜台旁边，拖到锅上就能设置');
    }else if(itemId.startsWith('knife:')){
      const id = itemId.split(':')[1];
      const k = KNIVES[id];
      if(!k) return;
      if(u.knives.includes(id)){
        u.knife = id;
        sfx.tap(); toast(`换上了${k.name}`);
      }else{
        if(!spendCoins(k.price)){ toast('金币不够'); return; }
        u.knives.push(id);
        u.knife = id;
        sfx.coin(); toast(`买下并装备了${k.name}`);
      }
    }
    syncProfile();
    saveProfiles();
    renderShop();
    updateHud();
    if(state.stage === 'kitchen') renderKitchen();
  }
  function buySyrup(id){
    if(!activeProfile || activeProfile.syrups[id]) return;
    const s = SYRUPS[id];
    if(!s) return;
    if(!spendCoins(s.price)){ toast('金币不够'); return; }
    activeProfile.syrups[id] = true;
    sfx.coin(); toast(`${s.name}已解锁，熬糖时可以选择`);
    syncProfile(); saveProfiles(); renderShop(); updateHud();
  }
  function buyExpansion(expandId){
    ensureAudio();
    if(!activeProfile) return;
    const [kind, id] = expandId.split(':');
    const item = expansionItems().find(x => x.id === expandId);
    if(!item || item.owned) return;
    if(!spendCoins(item.price)){ toast('金币不够，先营业赚一点吧'); return; }
    if(kind === 'topping') activeProfile.unlocks.toppings.push(id);
    else activeProfile.unlocks.jars.push(id);
    saveProfiles();
    sfx.coin();
    toast(`${item.name} 永久解锁！客人订单里可能会出现`);
    renderShop();
    renderPlayerBar();
  }
  function openShop(main=false){
    sfx.tap();
    main = main === true;
    if(main && !activeProfile) return;
    state.shopMain = main;
    renderShop();
    els.shopOverlay.classList.add('show');
    els.shopOverlay.setAttribute('aria-hidden','false');
  }
  function closeShop(){
    els.shopOverlay.classList.remove('show');
    els.shopOverlay.setAttribute('aria-hidden','true');
    state.shopMain = false;
    sfx.tap();
  }

  /* -------------------- 主循环 -------------------- */
  let lastFrame = 0;
  function tick(now){
    requestAnimationFrame(tick);
    const dt = Math.min(now - lastFrame, 120);
    lastFrame = now;
    if(state.phase === 'playing'){
      const remain = Math.max(0, state.deadline - now);
      state.patience = remain / state.patienceMs;
      renderPatience(state.patience);
      if(remain <= 0){ timeoutOrder(); return; }
      if(state.pouring) tickPour(now);
      updateBoils(now);
    }
  }

  /* -------------------- 事件 -------------------- */
  function resetOrderTicket(){
    state.orderStored = false;
    if(!els.orderTicket) return;
    els.orderTicket.classList.remove('stored','dragging');
    els.orderTicket.style.transform = '';
    if(els.orderRod){ els.orderRod.classList.remove('has-order'); const lab = els.orderRod.querySelector('b'); if(lab) lab.textContent = '订单'; }
  }
  function storeOrder(){
    if(!els.orderTicket || !els.orderRod || state.orderStored) return;
    els.orderTicket.style.transform = '';
    void els.orderTicket.offsetWidth;
    const dx = (els.orderRod.offsetLeft + els.orderRod.offsetWidth / 2) - (els.orderTicket.offsetLeft + els.orderTicket.offsetWidth / 2);
    const dy = (els.orderRod.offsetTop + els.orderRod.offsetHeight / 2) - (els.orderTicket.offsetTop + els.orderTicket.offsetHeight / 2);
    els.orderTicket.classList.remove('dragging');
    els.orderTicket.classList.add('stored');
    els.orderTicket.style.transform = `translate(${dx}px,${dy}px) scale(.18)`;
    els.orderRod.classList.add('has-order');
    const lab = els.orderRod.querySelector('b');
    if(lab) lab.textContent = '展开';
    state.orderStored = true;
    sfx.tap();
    toast('订单收到右上角，点一下棍子可以展开');
  }
  function expandOrder(){
    if(!els.orderTicket || !state.orderStored) return;
    els.orderTicket.classList.remove('stored','dragging');
    els.orderTicket.style.transform = '';
    if(els.orderRod){ els.orderRod.classList.remove('has-order'); const lab = els.orderRod.querySelector('b'); if(lab) lab.textContent = '订单'; }
    state.orderStored = false;
    sfx.tap();
  }
  function bindOrderDrag(){
    if(!els.orderTicket || !els.orderRod) return;
    const ticket = els.orderTicket;
    let drag = null;
    ticket.addEventListener('pointerdown', e => {
      if(state.phase !== 'playing' || state.stage !== 'desk') return;
      if(state.orderStored){ e.preventDefault(); expandOrder(); return; }
      e.preventDefault();
      drag = {x:e.clientX, y:e.clientY, dx:0, dy:0, moved:false};
      ticket.classList.add('dragging');
      try{ ticket.setPointerCapture(e.pointerId); }catch(err){}
    });
    ticket.addEventListener('pointermove', e => {
      if(!drag) return;
      drag.dx = e.clientX - drag.x;
      drag.dy = e.clientY - drag.y;
      if(Math.abs(drag.dx) + Math.abs(drag.dy) > 4) drag.moved = true;
      if(drag.moved) ticket.style.transform = `translate(${drag.dx}px,${drag.dy}px)`;
    });
    const finish = () => {
      if(!drag) return;
      const moved = drag.moved;
      drag = null;
      ticket.classList.remove('dragging');
      if(!moved) return;
      const tr = ticket.getBoundingClientRect();
      const rr = els.orderRod.getBoundingClientRect();
      const dist = Math.hypot(tr.left + tr.width / 2 - (rr.left + rr.width / 2), tr.top + tr.height / 2 - (rr.top + rr.height / 2));
      ticket.style.transform = '';
      if(dist < 110) storeOrder();
    };
    ticket.addEventListener('pointerup', finish);
    ticket.addEventListener('pointercancel', finish);
    els.orderRod.addEventListener('click', () => {
      if(state.orderStored) expandOrder();
      else if(state.phase === 'playing' && state.stage === 'desk') storeOrder();
    });
  }

  function bindEvents(){
    els.startBtn.addEventListener('click', startGame);
    els.modeCards.forEach(card => card.addEventListener('click', () => setIntroMode(card.dataset.mode)));
    if(els.modeToggle) els.modeToggle.addEventListener('click', () => toggleMenuGroup(els.modeToggle, els.modePanel));
    if(els.shopToggle) els.shopToggle.addEventListener('click', () => toggleMenuGroup(els.shopToggle, els.shopPanel));
    [els.settingsBtn, els.settingsEntryBtn].forEach(btn => {
      if(btn) btn.addEventListener('click', openSettings);
    });
    [els.settingsClose, els.settingsDone].forEach(btn => {
      if(btn) btn.addEventListener('click', closeSettings);
    });
    if(els.settingsOverlay) els.settingsOverlay.addEventListener('click', e => {
      if(e.target === els.settingsOverlay) closeSettings();
    });
    [['Master','master'],['Music','music'],['Alarm','alarm']].forEach(([id,key]) => {
      const input = els['set' + id];
      if(input) input.addEventListener('input', () => setSetting(key, input.value));
    });
    if(els.codexEntryBtn) els.codexEntryBtn.addEventListener('click', () => openCodex('personality'));
    if(els.codexFromSettings) els.codexFromSettings.addEventListener('click', () => { closeSettings(); openCodex('personality'); });
    if(els.codexClose) els.codexClose.addEventListener('click', closeCodex);
    if(els.codexOverlay) els.codexOverlay.addEventListener('click', e => { if(e.target === els.codexOverlay) closeCodex(); });
    if(els.codexTabs) els.codexTabs.addEventListener('click', e => {
      const tab = e.target.closest('[data-codex-tab]');
      if(tab) setCodexTab(tab.dataset.codexTab);
    });
    if(els.batchStrip){
      els.batchStrip.addEventListener('scroll', () => {
        if(els.batchScroll) els.batchScroll.value = els.batchStrip.scrollLeft;
      });
      if(els.batchScroll) els.batchScroll.addEventListener('input', () => {
        els.batchStrip.scrollLeft = Number(els.batchScroll.value) || 0;
      });
      els.batchStrip.addEventListener('wheel', e => {
        if(els.batchStrip.scrollWidth <= els.batchStrip.clientWidth) return;
        if(Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        els.batchStrip.scrollLeft += e.deltaY;
      }, {passive:false});
      let dragStartX = 0, dragStartLeft = 0, dragMoved = false, dragPointer = null;
      els.batchStrip.addEventListener('pointerdown', e => {
        if(e.pointerType === 'mouse' && e.button !== 0) return;
        dragPointer = e.pointerId; dragStartX = e.clientX; dragStartLeft = els.batchStrip.scrollLeft; dragMoved = false;
      });
      els.batchStrip.addEventListener('pointermove', e => {
        if(dragPointer !== e.pointerId) return;
        const dx = e.clientX - dragStartX;
        if(Math.abs(dx) > 5){ dragMoved = true; els.batchStrip.classList.add('dragging'); els.batchStrip.scrollLeft = dragStartLeft - dx; }
      });
      const endDrag = e => {
        if(dragPointer !== e.pointerId) return;
        dragPointer = null; els.batchStrip.classList.remove('dragging');
        if(dragMoved){ e.preventDefault(); e.stopPropagation(); }
      };
      els.batchStrip.addEventListener('pointerup', endDrag);
      els.batchStrip.addEventListener('pointercancel', endDrag);
    }
    els.soundBtn.addEventListener('click', () => {
      ensureAudio();
      state.sound = !state.sound;
      try{ localStorage.setItem('naiwa_sound', state.sound ? '1' : '0'); }catch(e){}
      updateSoundButton();
      if(!bgmEl) bgmEl = els.bgm;
      if(!state.sound && bgmEl) bgmEl.pause();
      if(state.sound) cueMusic();
      sfx.tap();
    });
    els.stageTabs.forEach(t => t.addEventListener('click', () => setStage(t.dataset.stage)));
    $$('[data-go]').forEach(b => b.addEventListener('click', () => setStage(b.dataset.go)));
    els.sizeBtns.forEach(b => b.addEventListener('click', () => selectSize(b.dataset.size)));
    $$('[data-piece-plus]').forEach(b => b.addEventListener('click', () => addPiece(b.dataset.piecePlus)));
    $$('[data-piece-minus]').forEach(b => b.addEventListener('click', () => removePiece(b.dataset.pieceMinus)));
    els.tempChips.forEach(b => b.addEventListener('click', () => setTemp(b.dataset.temp)));
    if(els.toppingChips) els.toppingChips.addEventListener('click', e => {
      const b = e.target.closest('[data-topping]');
      if(b) setTopping(b.dataset.topping);
    });
    if(els.jarSwitchBtn) els.jarSwitchBtn.addEventListener('click', cycleJar);
    if(els.toppingMinus) els.toppingMinus.addEventListener('click', () => changeToppingQty(-1));
    if(els.toppingPlus) els.toppingPlus.addEventListener('click', () => changeToppingQty(1));
    $$('[data-cut]').forEach(b => b.addEventListener('click', () => cutPeach(b.dataset.cut)));
    els.batchStrip.addEventListener('click', e => {
      const b = e.target.closest('[data-batch]');
      if(b) selectBatch(Number(b.dataset.batch));
    });
    els.potGrid.addEventListener('click', e => {
      const type = e.target.closest('[data-pot-type]');
      if(type){ cyclePotType(Number(type.dataset.pot), type.dataset.potType); return; }
      const sugar = e.target.closest('[data-pot-sugar]');
      if(sugar){ addSugar(Number(sugar.dataset.pot), Number(sugar.dataset.potSugar)); return; }
      const start = e.target.closest('[data-pot-start]');
      if(start){ startBoil(Number(start.dataset.potStart)); return; }
      const stop = e.target.closest('[data-pot-stop]');
      if(stop){ stopBoil(Number(stop.dataset.potStop)); return; }
      const dump = e.target.closest('[data-pot-dump]');
      if(dump){ dumpPot(Number(dump.dataset.potDump)); return; }
    });
    if(els.alarmTrayItems){
      let alarmDrag = null;
      const clearAlarmHl = () => {
        document.querySelectorAll('.pot-card.alarm-drop, .alarm-tray.alarm-drop')
          .forEach(x => x.classList.remove('alarm-drop'));
      };
      const startAlarmDrag = (e, source, el) => {
        e.preventDefault();
        alarmDrag = { source, el, x: e.clientX, y: e.clientY, moved:false };
        el.classList.add('dragging');
        toast(source === 'tray'
          ? '将闹钟拖拽到锅炉上以设置闹钟'
          : '拖到其他锅可移动 · 拖回托盘或点一下可收回');
      };
      els.alarmTrayItems.addEventListener('pointerdown', e => {
        const t = e.target.closest('.alarm-token');
        if(t) startAlarmDrag(e, 'tray', t);
      });
      els.potGrid.addEventListener('pointerdown', e => {
        const b = e.target.closest('[data-pot-alarm]');
        if(b) startAlarmDrag(e, Number(b.dataset.potAlarm), b);
      });
      document.addEventListener('pointermove', e => {
        if(!alarmDrag) return;
        if(Math.abs(e.clientX-alarmDrag.x) + Math.abs(e.clientY-alarmDrag.y) > 6) alarmDrag.moved = true;
        clearAlarmHl();
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const card = under?.closest('[data-pot-drop]');
        if(card) card.classList.add('alarm-drop');
        const tray = under?.closest('#alarmTray');
        if(tray) tray.classList.add('alarm-drop');
      });
      document.addEventListener('pointerup', e => {
        if(!alarmDrag) return;
        const { source, el, moved } = alarmDrag;
        alarmDrag = null;
        el.classList.remove('dragging');
        clearAlarmHl();
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const card = under?.closest('[data-pot-drop]');
        const onTray = under?.closest('#alarmTray');
        if(source === 'tray'){
          if(card) assignAlarm(Number(card.dataset.potDrop));
          return;
        }
        if(onTray){ removeAlarm(source); return; }
        if(card && Number(card.dataset.potDrop) !== source){
          moveAlarm(source, Number(card.dataset.potDrop));
          return;
        }
        if(!moved) removeAlarm(source);
      });
      els.alarmTrayItems.addEventListener('dragstart', e => {
        const t = e.target.closest('.alarm-token');
        if(t) { e.dataTransfer.setData('text/plain', 'alarm'); e.dataTransfer.effectAllowed = 'copy'; }
      });
      els.potGrid.addEventListener('dragover', e => {
        if(e.target.closest('[data-pot-drop]')) e.preventDefault();
      });
      els.potGrid.addEventListener('drop', e => {
        const card = e.target.closest('[data-pot-drop]');
        if(!card) return;
        e.preventDefault();
        assignAlarm(Number(card.dataset.potDrop));
      });
    }
    if(els.stirBtn) els.stirBtn.addEventListener('click', toggleStir);
    els.resetBtn.addEventListener('click', resetCan);
    els.sealBtn.addEventListener('click', sealCan);
    els.serveBtn.addEventListener('click', () => {
      if(state.stage === 'kitchen'){ setStage('work'); return; }
      if(state.stage === 'work'){ if(state.can.sealed) setStage('desk'); else toast('先封盖，再去服务台'); return; }
      serveOrder();
    });
    els.nextBtn.addEventListener('click', nextGuest);
    els.shopBtn.addEventListener('click', openShop);
    els.replayBtn.addEventListener('click', onReplay);
    els.homeBtn.addEventListener('click', goHome);
    els.shopBackBtn.addEventListener('click', closeShop);
    els.shopStartBtn.addEventListener('click', startNextDay);
    els.shopGrid.addEventListener('click', e => {
      const b = e.target.closest('[data-buy]');
      if(b && !b.disabled) buyItem(b.dataset.buy);
    });
    if(els.shopTabs) els.shopTabs.addEventListener('click', e => {
      const b = e.target.closest('[data-shoptab]');
      if(b) setShopTab(b.dataset.shoptab);
    });
    if(els.shopExpandGrid) els.shopExpandGrid.addEventListener('click', e => {
      const b = e.target.closest('[data-expand]');
      if(b && !b.disabled) buyExpansion(b.dataset.expand);
    });
    if(els.shopSyrupGrid) els.shopSyrupGrid.addEventListener('click', e => {
      const b = e.target.closest('[data-syrup]');
      if(b && !b.disabled) buySyrup(b.dataset.syrup);
    });
    if(els.shopFurnGrid) els.shopFurnGrid.addEventListener('click', e => {
      const b = e.target.closest('[data-furniture]');
      if(b && !b.disabled){ handleFurniture(b.dataset.furniture); renderShop(); }
    });
    if(els.itemShopEntryBtn) els.itemShopEntryBtn.addEventListener('click', () => openShop(true));

    if(els.savePlayerBtn) els.savePlayerBtn.addEventListener('click', savePlayerName);
    if(els.playerName) els.playerName.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); savePlayerName(); els.playerName.blur(); }
    });
    if(els.saveEntryBtn) els.saveEntryBtn.addEventListener('click', openSave);
    if(els.saveClose) els.saveClose.addEventListener('click', closeSave);
    if(els.saveOverlay) els.saveOverlay.addEventListener('click', e => { if(e.target === els.saveOverlay) closeSave(); });
    if(els.copySaveBtn) els.copySaveBtn.addEventListener('click', doExportCopy);
    if(els.downloadSaveBtn) els.downloadSaveBtn.addEventListener('click', doExportDownload);
    if(els.importSaveBtn) els.importSaveBtn.addEventListener('click', doImportCode);
    if(els.sbSaveBtn) els.sbSaveBtn.addEventListener('click', doSbSave);
    if(els.sbLoadBtn) els.sbLoadBtn.addEventListener('click', doSbLoad);
    if(els.gistSyncBtn) els.gistSyncBtn.addEventListener('click', doGistSync);
    if(els.gistRestoreBtn) els.gistRestoreBtn.addEventListener('click', doGistRestore);
    if(els.gistClearBtn) els.gistClearBtn.addEventListener('click', doGistClear);
    if(els.homeEntryBtn) els.homeEntryBtn.addEventListener('click', () => openHome('room'));
    if(els.dressEntryBtn) els.dressEntryBtn.addEventListener('click', openDress);
    if(els.dressClose) els.dressClose.addEventListener('click', closeDress);
    if(els.dressDoneBtn) els.dressDoneBtn.addEventListener('click', closeDress);
    if(els.dressOverlay) els.dressOverlay.addEventListener('click', e => { if(e.target === els.dressOverlay) closeDress(); });
    if(els.dressSlots) els.dressSlots.addEventListener('click', e => {
      const b = e.target.closest('[data-dress]');
      if(b) handleClothes(b.dataset.dress);
    });
    if(els.rankEntryBtn) els.rankEntryBtn.addEventListener('click', openLeaderboard);
    if(els.summaryRankBtn){
      els.summaryRankBtn.addEventListener('click', () => {
        els.summaryOverlay.classList.remove('show');
        els.summaryOverlay.setAttribute('aria-hidden','true');
        openLeaderboard();
      });
    }
    if(els.homeClose) els.homeClose.addEventListener('click', closeHome);
    if(els.homePlayBtn) els.homePlayBtn.addEventListener('click', () => { closeHome(); startGame(); });
    if(els.homeRankBtn) els.homeRankBtn.addEventListener('click', () => { closeHome(); openLeaderboard(); });
    if(els.leaderboardClose) els.leaderboardClose.addEventListener('click', closeLeaderboard);
    [els.earlyBtn, els.reviewEarlyBtn, els.summaryEarlyBtn, els.shopEarlyBtn].forEach(btn => {
      if(btn) btn.addEventListener('click', askEarlyLeave);
    });
    if(els.confirmCancel) els.confirmCancel.addEventListener('click', closeConfirm);
    if(els.confirmOk) els.confirmOk.addEventListener('click', doEarlyLeave);
    if(els.homeOverlay) els.homeOverlay.addEventListener('click', e => { if(e.target === els.homeOverlay) closeHome(); });
    if(els.leaderboardOverlay) els.leaderboardOverlay.addEventListener('click', e => { if(e.target === els.leaderboardOverlay) closeLeaderboard(); });
    els.homeTabs.forEach(t => t.addEventListener('click', () => setHomeTab(t.dataset.homeTab)));
    if(els.furnitureGrid) els.furnitureGrid.addEventListener('click', e => {
      const b = e.target.closest('[data-furniture]');
      if(b && !b.disabled) handleFurniture(b.dataset.furniture);
    });
    if(els.closetGrid) els.closetGrid.addEventListener('click', e => {
      const b = e.target.closest('[data-clothes]');
      if(b && !b.disabled) handleClothes(b.dataset.clothes);
    });
    if(els.skinShop) els.skinShop.addEventListener('click', e => {
      const apply = e.target.closest('[data-skin-apply]');
      if(apply && !apply.disabled){
        const [area,id] = apply.dataset.skinApply.split(':');
        handleSkin(area,id);
        return;
      }
      const b = e.target.closest('[data-skin-area]');
      if(b){
        state.skinPreview = {area:b.dataset.skinArea, id:b.dataset.skinId};
        renderSkins();
        sfx.tap();
      }
    });

    if(window.PointerEvent){
      els.pourBtn.addEventListener('pointerdown', e => { e.preventDefault(); startPour(); });
      window.addEventListener('pointerup', stopPour);
      window.addEventListener('pointercancel', stopPour);
    }else{
      els.pourBtn.addEventListener('touchstart', e => { e.preventDefault(); startPour(); }, {passive:false});
      window.addEventListener('touchend', stopPour);
      window.addEventListener('touchcancel', stopPour);
    }
  }

  function init(){
    cacheEls();
    lockViewport();
    loadSave();
    loadProfiles();
    try{
      const savedSound = localStorage.getItem('naiwa_sound');
      if(savedSound === '0') state.sound = false;
    }catch(e){}
    state.pots = makePots();
    state.introMode = 'normal';
    els.game.dataset.stage = 'desk';
    bgmEl = els.bgm;
    updateSoundButton();
    syncSettingsUI();
    renderPlayerBar();
    renderFrogWear();
    applySkins();
    setIntroMode('normal');
    updateHud();
    renderPatience(1);
    renderOrderTicket();
    renderDesk();
    renderWork();
    renderKitchen();
    updateFooter();
    renderHint();
    bindEvents();
    bindOrderDrag();
    requestAnimationFrame(tick);
    if(location.search.includes('debug=1')){
      window.__naiwa = { state, beginRun, setStage, renderWork, renderCan, openShop, getProfile:()=>activeProfile, getProfiles:()=>profiles, addPiece, cutPeach, startBoil, stopBoil, selectSize, sealCan, serveOrder, scoreOrder, storeOrder, expandOrder, openDress, renderFrogWear, removeAlarm, moveAlarm, assignAlarm, newCustomer, openCodex, closeCodex, setCodexTab, renderCodex };
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

