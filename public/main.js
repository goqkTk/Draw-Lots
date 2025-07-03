const setupForm = document.getElementById('setup-form');
const modeSelect = document.getElementById('mode');
const countInput = document.getElementById('count');
const customContentsDiv = document.getElementById('custom-contents');
const contentsInput = document.getElementById('contents');
const papersContainer = document.getElementById('papers-container');

const FRIENDLY_COLORS = [
  {name: '빨강', value: '#ffb3b3'},
  {name: '주황', value: '#ffd6a0'},
  {name: '노랑', value: '#fff7a0'},
  {name: '초록', value: '#b2f2bb'},
  {name: '민트', value: '#a0f0ed'},
  {name: '하늘', value: '#b3e0ff'},
  {name: '파랑', value: '#b3c6ff'},
  {name: '보라', value: '#e0b3ff'},
  {name: '연보라', value: '#e6d6ff'},
  {name: '분홍', value: '#ffb3e6'}
];

function getFriendlyColor(idx) {
  return FRIENDLY_COLORS[idx % FRIENDLY_COLORS.length].value;
}

modeSelect.addEventListener('change', () => {
  if (modeSelect.value === 'custom') {
    customContentsDiv.style.display = 'block';
  } else {
    customContentsDiv.style.display = 'none';
  }
});

setupForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const mode = modeSelect.value;
  const count = parseInt(countInput.value, 10);
  let paperContents = [];

  if (mode === 'winner') {
    // 1개만 당첨, 나머지 꽝
    paperContents = Array(count).fill('꽝');
    const winnerIdx = Math.floor(Math.random() * count);
    paperContents[winnerIdx] = '당첨';
  } else if (mode === 'loser') {
    // 1개만 꽝, 나머지 당첨
    paperContents = Array(count).fill('당첨');
    const loserIdx = Math.floor(Math.random() * count);
    paperContents[loserIdx] = '꽝';
  } else if (mode === 'order') {
    // 1등, 2등, ... 랜덤 배치
    paperContents = Array.from({length: count}, (_, i) => `${i+1}등`);
    shuffleArray(paperContents);
  } else if (mode === 'custom') {
    // 사용자 지정 내용
    const raw = contentsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    if (raw.length !== count) {
      alert('종이 개수와 내용 개수가 일치해야 합니다.');
      return;
    }
    paperContents = [...raw];
    shuffleArray(paperContents);
  }
  renderPapers(paperContents);
});

function renderPapers(contents) {
  papersContainer.innerHTML = '';
  const paperW = 80, paperH = 110;
  const margin = 10;
  const areaW = papersContainer.offsetWidth || 800;
  const areaH = papersContainer.offsetHeight || 400;

  contents.forEach((content, idx) => {
    const paper = document.createElement('div');
    paper.className = 'paper';
    // 앞/뒷면 구조
    paper.innerHTML = `
      <div class="front">?</div>
      <div class="back">${content}</div>
    `;

    let x = Math.random() * (areaW - paperW - margin*2) + margin;
    let y = Math.random() * (areaH - paperH - margin*2) + margin;
    let rotate = Math.floor(Math.random() * 60) - 30;
    paper.style.left = `${x}px`;
    paper.style.top = `${y}px`;
    paper.style.transform = `rotate(${rotate}deg)`;

    // 앞/뒷면 색상 동일하게 적용
    const color = getFriendlyColor(idx);
    const front = paper.querySelector('.front');
    const back = paper.querySelector('.back');
    if (front) front.style.backgroundColor = color;
    if (back) back.style.backgroundColor = color;

    // 드래그 기능
    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    let startX = 0, startY = 0;
    let originalZ = 1;
    let dragMoved = false;

    paper.addEventListener('mousedown', function(e) {
      isDragging = true;
      dragMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      dragOffsetX = startX - paper.offsetLeft;
      dragOffsetY = startY - paper.offsetTop;
      originalZ = paper.style.zIndex;
      paper.style.zIndex = 10;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        let newX = e.clientX - dragOffsetX;
        let newY = e.clientY - dragOffsetY;
        newX = Math.max(margin, Math.min(areaW - paperW - margin, newX));
        newY = Math.max(margin, Math.min(areaH - paperH - margin, newY));
        paper.style.left = `${newX}px`;
        paper.style.top = `${newY}px`;
        dragMoved = true;
      }
    });
    document.addEventListener('mouseup', function(e) {
      if (isDragging) {
        isDragging = false;
        paper.style.zIndex = originalZ;
        document.body.style.userSelect = '';
      }
    });

    // 클릭(펼치기) 기능
    paper.addEventListener('click', function(e) {
      if (isDragging || dragMoved) return;
      if (!paper.classList.contains('opened')) {
        paper.classList.add('opened');
      }
    });
    papersContainer.appendChild(paper);
  });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
} 