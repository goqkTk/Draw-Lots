const setupForm = document.getElementById('setup-form');
const modeSelect = document.getElementById('mode');
const countInput = document.getElementById('count');
const customContentsDiv = document.getElementById('custom-contents');
const contentsInput = document.getElementById('contents');
const papersContainer = document.getElementById('papers-container');

const COLORS = [
  {name: '연한 빨강', value: '#ffb3b3'},
  {name: '진한 빨강', value: '#ff4d4d'},
  {name: '연한 주황', value: '#ffd6a0'},
  {name: '진한 주황', value: '#ff9900'},
  {name: '연한 노랑', value: '#fff7a0'},
  {name: '진한 노랑', value: '#ffe600'},
  {name: '연한 초록', value: '#b2f2bb'},
  {name: '진한 초록', value: '#2ecc40'},
  {name: '연한 민트', value: '#a0f0ed'},
  {name: '진한 민트', value: '#00bfae'},
  {name: '연한 하늘', value: '#b3e0ff'},
  {name: '진한 하늘', value: '#3399ff'},
  {name: '연한 파랑', value: '#b3c6ff'},
  {name: '진한 파랑', value: '#0052cc'},
  {name: '연한 보라', value: '#e0b3ff'},
  {name: '진한 보라', value: '#8e44ad'},
  {name: '연한 연보라', value: '#e6d6ff'},
  {name: '진한 연보라', value: '#b39ddb'},
  {name: '연한 분홍', value: '#ffb3e6'},
  {name: '진한 분홍', value: '#ff4da6'}
];

function getColor(idx) {
  return COLORS[idx % COLORS.length].value;
}

modeSelect.addEventListener('change', () => {
  if (modeSelect.value === 'custom') {
    customContentsDiv.style.display = 'block';
  } else {
    customContentsDiv.style.display = 'none';
  }
});

let currentSessionId = null;

async function getDrawSession(mode, count, contents) {
  const body = { mode, count };
  if (mode === 'custom') body.contents = contents;
  const res = await fetch('/api/draw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '서버 오류');
  }
  const data = await res.json();
  return data;
}

async function getPaperContent(sessionId, paperId) {
  const res = await fetch(`/api/paper/${sessionId}/${paperId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '서버 오류');
  }
  const data = await res.json();
  return data.content;
}

setupForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const mode = modeSelect.value;
  let count = parseInt(countInput.value, 10);
  if (count > 20) count = 20;
  countInput.value = count;

  if (mode === 'custom') {
    const raw = contentsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    if (raw.length !== count) {
      alert('종이 개수와 내용 개수가 일치해야 합니다.');
      return;
    }
    if (raw.some(s => s.length > 30)) {
      alert('각 내용은 30자 이내로 입력해주세요.');
      return;
    }
    try {
      const { sessionId, paperIds } = await getDrawSession(mode, count, raw);
      currentSessionId = sessionId;
      renderPapers(paperIds);
    } catch (err) {
      alert(err.message);
      return;
    }
  } else {
    try {
      const { sessionId, paperIds } = await getDrawSession(mode, count);
      currentSessionId = sessionId;
      renderPapers(paperIds);
    } catch (err) {
      alert(err.message);
      return;
    }
  }
});

function renderPapers(paperIds) {
  papersContainer.innerHTML = '';
  const paperW = 80, paperH = 110;
  const margin = 10;
  const areaW = papersContainer.offsetWidth || 800;
  const areaH = papersContainer.offsetHeight || 400;

  paperIds.forEach((paperId, idx) => {
    const paper = document.createElement('div');
    paper.className = 'paper';
    paper.innerHTML = `
      <div class="front">?</div>
      <div class="back"></div>
    `;

    let x = Math.random() * (areaW - paperW - margin*2) + margin;
    let y = Math.random() * (areaH - paperH - margin*2) + margin;
    let rotate = Math.floor(Math.random() * 60) - 30;
    paper.style.left = `${x}px`;
    paper.style.top = `${y}px`;
    paper.style.transform = `rotate(${rotate}deg)`;

    const color = getColor(idx);
    const front = paper.querySelector('.front');
    const back = paper.querySelector('.back');
    if (front) front.style.backgroundColor = color;
    if (back) back.style.backgroundColor = color;

    // 드래그 기능 (마우스)
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

    // 드래그 기능 (터치)
    let isTouchDragging = false;
    let touchOffsetX = 0, touchOffsetY = 0;
    let touchStartX = 0, touchStartY = 0;
    let touchEndX = 0, touchEndY = 0;
    let touchDragMoved = false;

    paper.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      isTouchDragging = true;
      touchDragMoved = false;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchOffsetX = touchStartX - paper.offsetLeft;
      touchOffsetY = touchStartY - paper.offsetTop;
      originalZ = paper.style.zIndex;
      paper.style.zIndex = 10;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function(e) {
      if (isTouchDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        let newX = touch.clientX - touchOffsetX;
        let newY = touch.clientY - touchOffsetY;
        newX = Math.max(margin, Math.min(areaW - paperW - margin, newX));
        newY = Math.max(margin, Math.min(areaH - paperH - margin, newY));
        paper.style.left = `${newX}px`;
        paper.style.top = `${newY}px`;
        touchDragMoved = true;
        touchEndX = touch.clientX;
        touchEndY = touch.clientY;
        e.preventDefault();
      }
    }, { passive: false });
    document.addEventListener('touchend', function(e) {
      if (isTouchDragging) {
        isTouchDragging = false;
        paper.style.zIndex = originalZ;
        document.body.style.userSelect = '';
      }
    });

    // 클릭(펼치기) 기능 (마우스)
    paper.addEventListener('click', async function(e) {
      if (isDragging || dragMoved || isTouchDragging || touchDragMoved) return;
      if (!paper.classList.contains('opened')) {
        try {
          const content = await getPaperContent(currentSessionId, paperId);
          back.textContent = content.slice(0, 30);
          paper.classList.add('opened');
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // 클릭(펼치기) 기능 (터치)
    paper.addEventListener('touchend', async function(e) {
      // 터치 이동량이 10px 이하이면 클릭으로 간주
      const endTouch = e.changedTouches && e.changedTouches[0];
      const endX = endTouch ? endTouch.clientX : touchStartX;
      const endY = endTouch ? endTouch.clientY : touchStartY;
      const dx = Math.abs(endX - touchStartX);
      const dy = Math.abs(endY - touchStartY);
      if (dx > 10 || dy > 10) {
        // 드래그로 간주
        isTouchDragging = false;
        touchDragMoved = false;
        return;
      }
      if (!paper.classList.contains('opened')) {
        try {
          const content = await getPaperContent(currentSessionId, paperId);
          back.textContent = content.slice(0, 30);
          paper.classList.add('opened');
        } catch (err) {
          alert(err.message);
        }
      }
    });

    papersContainer.appendChild(paper);
  });
} 