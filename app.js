const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const sessions = {};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// 추첨 세션 생성 및 종이 ID 목록 반환
app.post('/api/draw', (req, res) => {
  const { mode, count, contents } = req.body;
  let paperContents = [];
  const safeCount = Math.max(2, Math.min(20, parseInt(count, 10)));

  if (mode === 'winner') {
    paperContents = Array(safeCount).fill('꽝');
    const winnerIdx = Math.floor(Math.random() * safeCount);
    paperContents[winnerIdx] = '당첨';
  } else if (mode === 'loser') {
    paperContents = Array(safeCount).fill('당첨');
    const loserIdx = Math.floor(Math.random() * safeCount);
    paperContents[loserIdx] = '꽝';
  } else if (mode === 'order') {
    paperContents = Array.from({length: safeCount}, (_, i) => `${i+1}등`);
    shuffleArray(paperContents);
  } else if (mode === 'custom') {
    if (!Array.isArray(contents) || contents.length !== safeCount) {
      return res.status(400).json({ error: '종이 개수와 내용 개수가 일치해야 합니다.' });
    }
    if (contents.some(s => typeof s !== 'string' || s.length > 30)) {
      return res.status(400).json({ error: '각 내용은 30자 이내로 입력해주세요.' });
    }
    paperContents = [...contents];
    shuffleArray(paperContents);
  } else {
    return res.status(400).json({ error: '잘못된 모드입니다.' });
  }

  // 종이별 고유 ID 부여
  const paperIds = paperContents.map(() => uuidv4());
  const sessionId = uuidv4();
  // 세션에 종이ID-내용 매핑 저장
  sessions[sessionId] = {};
  paperIds.forEach((pid, i) => {
    sessions[sessionId][pid] = paperContents[i];
  });
  res.json({ sessionId, paperIds });
});

// 종이 내용 요청
app.get('/api/paper/:sessionId/:paperId', (req, res) => {
  const { sessionId, paperId } = req.params;
  if (!sessions[sessionId] || !sessions[sessionId][paperId]) {
    return res.status(404).json({ error: '존재하지 않는 종이입니다.' });
  }
  res.json({ content: sessions[sessionId][paperId] });
});

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));