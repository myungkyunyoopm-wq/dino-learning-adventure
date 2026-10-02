(() => {
  const $ = (id) => document.getElementById(id);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const stateKey = 'liams-adventure-progress-v1';
  const defaultState = { stars: 0, rounds: 0, letterStage: 0, numberStage: 0, codePlayed: false };
  let state = loadState();
  let voiceOn = true;
  try { voiceOn = localStorage.getItem('liam-adventure-voice-v1') !== 'off'; } catch {}
  let game = null;

  const numberWords = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
  function speak(text) {
    if (!voiceOn || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    window.speechSynthesis.cancel();
    const line = new SpeechSynthesisUtterance(text);
    line.lang = 'en-US'; line.rate = 0.86; line.pitch = 1.12; line.volume = 1;
    window.speechSynthesis.speak(line);
  }
  function targetWords(value) { return /^\d+$/.test(value) ? numberWords[Number(value)] || value : value.split('').join(', '); }
  function roundPrompt() {
    if (game.type === 'letters') return `Find the letter ${game.target}.`;
    if (game.type === 'numbers') { const number = numberWords[Number(game.target)] || game.target; return `The T-Rex needs ${number}. Tap ${number}.`; }
    if (game.type === 'name') return `Spell Liam. ${game.sequence.slice(0,game.round).join('. ')}. ${game.round ? 'Next' : 'First'} letter: ${game.target}.`;
    return `Remember the code: ${game.sequence.join(', ')}. Find ${targetWords(game.target)}.`;
  }
  function updateVoiceButton() {
    const button = $('voiceToggle');
    button.innerHTML = `${voiceOn ? '🔊' : '🔇'} <span>${voiceOn ? 'SOUND ON' : 'SOUND OFF'}</span>`;
    button.setAttribute('aria-label', `Turn English voice ${voiceOn ? 'off' : 'on'}`);
    button.setAttribute('aria-pressed', String(voiceOn));
    button.title = `English voice ${voiceOn ? 'on' : 'off'}`;
  }

  function loadState() {
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem(stateKey) || '{}') }; }
    catch { return { ...defaultState }; }
  }
  function save() { try { localStorage.setItem(stateKey, JSON.stringify(state)); } catch {} updateProgress(); }
  function updateProgress() {
    const letterEnd = Math.min(5 + state.letterStage * 5, 26);
    const numberEnd = Math.min(5 + state.numberStage * 5, 20);
    const level = 1 + Math.floor((state.letterStage + state.numberStage) / 2);
    const next = state.letterStage === 0 ? 'Letters A–E' : state.numberStage === 0 ? 'Numbers 1–5' : state.letterStage < 5 ? `Letters ${alphabet[state.letterStage * 5]}–${alphabet[Math.min(state.letterStage * 5 + 4, 25)]}` : `Numbers ${numberEnd + 1}–${Math.min(numberEnd + 5, 20)}`;
    $('starCount').textContent = state.stars;
    $('levelLabel').textContent = `Level ${level}`;
    $('journeyStars').textContent = `${state.stars} ${state.stars === 1 ? 'star' : 'stars'}`;
    $('nextStop').textContent = next;
    $('letterProgress').textContent = `A–${alphabet[letterEnd - 1]}`;
    $('numberProgress').textContent = `1–${numberEnd}`;
    $('codeStatus').textContent = state.codePlayed ? 'Played!' : 'Ready to try';
    $('parentStars').textContent = state.stars;
    $('parentRounds').textContent = state.rounds;
    $('parentLevel').textContent = level;
    $('parentNext').textContent = next;
    $('progressFill').style.width = `${Math.min(100, Math.round((state.letterStage + state.numberStage) / 8 * 100))}%`;
    $('modalStars').textContent = state.stars;
    updateVoiceButton();
  }
  const shuffle = (items) => [...items].sort(() => Math.random() - .5);
  const sampleChoices = (target, candidates) => shuffle([target, ...shuffle([...new Set(candidates.filter(item => item !== target))]).slice(0, 4)]);
  const numChoices = (target, max) => sampleChoices(target, Array.from({ length: max }, (_, i) => String(i + 1)));
  const letterChoices = (target, pool) => sampleChoices(target, pool);

  function startGame(type) {
    const configs = {
      letters: { title:'Find a letter', icon:'🦕', eyebrow:'LETTER GAME', char:'🦖', label:'TAP THE SAME LETTER!', speech:'Tap the same letter!', rounds:5 },
      numbers: { title:'Feed T-Rex', icon:'🦖', eyebrow:'NUMBER GAME', char:'🦖', label:'T-REX IS HUNGRY FOR…', speech:'Tap the number I ask for!', rounds:5 },
      name: { title:'Spell LIAM', icon:'🥚', eyebrow:'NAME GAME', char:'🐣', label:'SPELL LIAM!', speech:'Tap the next letter!', rounds:4 },
      code: { title:'Find a fossil', icon:'🦴', eyebrow:'BONUS GAME', char:'🦕', label:'FIND THE SECRET CODE!', speech:'Tap the next symbol!', rounds:3 }
    };
    const cfg = configs[type];
    game = { type, cfg, round: 0, score: 0, sequence: type === 'name' ? 'LIAM'.split('') : type === 'code' ? Array.from({length:3}, () => Math.random() < .5 ? String(Math.ceil(Math.random()*5)) : alphabet[Math.floor(Math.random()*5)]) : [] };
    $('gameTitle').textContent = cfg.title; $('gameEyebrow').textContent = cfg.eyebrow; $('modalIcon').textContent = cfg.icon; $('gameCharacter').textContent = cfg.char;
    $('gameModal').classList.remove('hidden'); $('feedback').textContent = ''; makeRound();
    speak(`${cfg.title}! ${roundPrompt()}`);
  }
  function makeRound() {
    const {type,cfg,round,sequence}=game;
    $('promptLabel').textContent=cfg.label; $('promptSpeech').textContent=type==='name' ? `Tap the ${['first','next','next','last'][round]} letter!` : type==='code' ? `Code: ${sequence.join(' · ')} — tap ${targetWords(sequence[round])}` : cfg.speech; $('feedback').textContent='';
    let target, choices;
    if(type==='letters') { const end=Math.min(5+state.letterStage*5,26); const pool=alphabet.slice(0,end); target=pool[Math.floor(Math.random()*pool.length)]; choices=letterChoices(target,pool); }
    else if(type==='numbers') { const max=Math.min(5+state.numberStage*5,20); target=String(Math.ceil(Math.random()*max)); choices=numChoices(target,max); }
    else if(type==='name') { target=sequence[round]; choices=sampleChoices(target,[...'LIAM',...alphabet.slice(0,5)]); }
    else { target=sequence[round]; choices=sampleChoices(target,[...sequence,...(target.match(/[A-Z]/)?alphabet.slice(0,5):['1','2','3','4','5'])]); }
    game.target=target; $('targetText').textContent=target; $('roundTrack').innerHTML=Array.from({length:cfg.rounds},(_,i)=>`<span class="round-dot ${i<round?'done':i===round?'active':''}"></span>`).join('');
    if (round > 0) speak(roundPrompt());
    const grid=$('answerGrid'); grid.innerHTML='';
    choices.forEach(choice=>{ const button=document.createElement('button'); button.className='answer-button'; button.textContent=choice; button.setAttribute('aria-label',`Choose ${choice}`); button.addEventListener('click',()=>answer(button,choice)); grid.appendChild(button); });
  }
  function answer(button, choice) {
    if(button.disabled) return;
    if(choice!==game.target) { button.classList.add('wrong'); button.disabled=true; $('feedback').textContent='Almost! Have another look 👀'; speak(`That's ${targetWords(choice)}. Try again!`); setTimeout(()=>{button.classList.remove('wrong');},400); return; }
    button.classList.add('correct'); [...$('answerGrid').children].forEach(b=>b.disabled=true); game.score++; $('feedback').textContent=game.type==='numbers'?'Yum! Great counting! 😋':'You found it! Amazing! ✨';
    const praise = game.type === 'numbers' ? `Yum! ${numberWords[Number(choice)] || choice}! Great counting!` : game.type === 'name' ? `${choice}! Great job spelling Liam!` : `${targetWords(choice)}! Great job!`;
    speak(praise);
    setTimeout(()=>{ game.round++; if(game.round>=game.cfg.rounds) finishGame(); else makeRound(); },1100);
  }
  function finishGame() {
    const type=game.type; state.stars+=game.score; state.rounds++;
    if(type==='letters') state.letterStage=Math.min(5,state.letterStage+1);
    if(type==='numbers') state.numberStage=Math.min(3,state.numberStage+1);
    if(type==='code') state.codePlayed=true;
    save(); $('gameModal').classList.add('hidden');
    const titles={letters:'Dino letter explorer!',numbers:'T-Rex snack master!',name:'You hatched LIAM!',code:'Fossil code cracked!'};
    $('rewardTitle').textContent=titles[type]; $('rewardMessage').textContent=`You earned ${game.score} shiny ${game.score===1?'star':'stars'}! Keep up the great exploring.`;
    $('rewardStars').textContent='⭐'.repeat(Math.min(game.score,5)); $('rewardModal').classList.remove('hidden');
    speak(`${titles[type]} You earned ${game.score} stars!`);
  }
  function closeModal(id){$(id).classList.add('hidden');}
  document.querySelectorAll('.game-card').forEach(card=>card.addEventListener('click',()=>startGame(card.dataset.game)));
  $('startButton').addEventListener('click',()=>startGame('letters'));
  $('gameCharacter').addEventListener('click',()=>speak(roundPrompt()));
  $('voiceToggle').addEventListener('click',()=>{voiceOn=!voiceOn;try{localStorage.setItem('liam-adventure-voice-v1',voiceOn?'on':'off')}catch{}updateVoiceButton();if(voiceOn)speak('English voice is on!');else if('speechSynthesis'in window)window.speechSynthesis.cancel();});
  $('closeGame').addEventListener('click',()=>closeModal('gameModal'));
  $('rewardContinue').addEventListener('click',()=>closeModal('rewardModal'));
  $('parentButton').addEventListener('click',()=>{updateProgress();$('parentModal').classList.remove('hidden');});
  $('closeParent').addEventListener('click',()=>closeModal('parentModal'));
  $('resetProgress').addEventListener('click',()=>{if(confirm('Start Liam’s adventure again from the beginning?')){state={...defaultState};save();closeModal('parentModal');}});
  document.querySelectorAll('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeModal(backdrop.id);}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.modal-backdrop').forEach(m=>m.classList.add('hidden'));});
  updateProgress();
})();
