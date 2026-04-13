const board = document.getElementById("board");
const statusText = document.getElementById("status");

let game = [];
let selected = null;
let turn = "red";
let redScore = 0;
let blackScore = 0;

function init() {
  redScore = 0;
  blackScore = 0;
  updateScore();
  game = [];
  board.innerHTML = "";
  selected = null;
  turn = "red";

  for (let r = 0; r < 8; r++) {
    game[r] = [];
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      sq.className = "square " + ((r + c) % 2 ? "dark" : "light");
      sq.dataset.r = r;
      sq.dataset.c = c;
      sq.onclick = onClick;
      board.appendChild(sq);

      if ((r + c) % 2) {
        if (r < 3) game[r][c] = { color: "black", king: false };
        else if (r > 4) game[r][c] = { color: "red", king: false };
        else game[r][c] = null;
      } else game[r][c] = null;
    }
  }

  render();
}

function updateScore() {
  document.getElementById("user-score").innerText = redScore;
  document.getElementById("ai-score").innerText = blackScore;
}

function render() {
  document.querySelectorAll(".square").forEach((sq) => {
    sq.innerHTML = "";
    const r = sq.dataset.r;
    const c = sq.dataset.c;
    const p = game[r][c];

    if (p) {
      const el = document.createElement("div");
      el.className = `piece ${p.color}`;
      if (p.king) el.classList.add("king");
      sq.appendChild(el);
    }
  });

  updateStatus();
}

// function updateStatus() {
//   let red = 0,
//     black = 0;

//   const skipBtn = document.getElementById("skipBtn");

//   if (turn === "red") {
//   skipBtn.disabled = false;
// } else {
//   skipBtn.disabled = true;
// }

//   game.flat().forEach((p) => {
//     if (!p) return;
//     if (p.color === "red") red++;
//     if (p.color === "black") black++;
//   });

//   if (red === 0) {
//     statusText.innerText = "💀 You Lost!";
//     turn = "none";

//     showPopup(
//       "Don't Worry 😢",
//       `Try Again!\nScore: You ${redScore} - ${blackScore} Computer`
//     );

//   } else if (black === 0) {
//     statusText.innerText = "🎉 You Win!";
//     turn = "none";

//     showPopup(
//       "🎉 Congratulations!",
//       `Your Score: ${redScore}\nComputer: ${blackScore}`
//     );

//   } else {
//     statusText.innerText =
//       turn === "red" ? "Computer Thinking..." : "Your Turn";
//   }

// }

function updateStatus() {
  let red = 0,
    black = 0;

  game.flat().forEach((p) => {
    if (!p) return;
    if (p.color === "red") red++;
    if (p.color === "black") black++;
  });

  const skipBtn = document.getElementById("skipBtn");

  if (red === 0) {
    statusText.innerText = "💀 You Lost!";
    turn = "none";
    skipBtn.disabled = true;

    showPopup(
      "Don't Worry",
      `Try Again!\nScore: You ${redScore} - ${blackScore} Black`
    );

  } else if (black === 0) {
    statusText.innerText = "🎉 You Win!";
    turn = "none";
    skipBtn.disabled = true;

    showPopup(
      "Congratulations!",
      `Your Score: ${redScore}\nBlack: ${blackScore}`
    );

  } else {
    if (turn === "red") {
      statusText.innerText = "Your Turn";
      skipBtn.disabled = false;
    } else {
      statusText.innerText = "Computer Thinking...";
      skipBtn.disabled = true;
    }
  }
}

function onClick(e) {
  if (turn !== "red") return;

  const r = +e.currentTarget.dataset.r;
  const c = +e.currentTarget.dataset.c;
  const piece = game[r][c];

  if (selected) {
    if (move(selected.r, selected.c, r, c)) {
      selected = null;
      render();
      turn = "black";
      setTimeout(aiMove, 400);
    } else {
      selected = null;
    }
  } else {
    if (piece && piece.color === "red") {
      selected = { r, c };
    }
  }
}

function getDirections(piece) {
  if (piece.king)
    return [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
  return piece.color === "red"
    ? [
        [-1, 1],
        [-1, -1],
      ]
    : [
        [1, 1],
        [1, -1],
      ];
}

function getMoves(r, c) {
  const piece = game[r][c];
  if (!piece) return [];

  const dirs = getDirections(piece);
  let moves = [];

  dirs.forEach(([dr, dc]) => {
    const r1 = r + dr;
    const c1 = c + dc;

    if (inBounds(r1, c1) && !game[r1][c1]) {
      moves.push({ r: r1, c: c1, capture: false });
    }

    const r2 = r + dr * 2;
    const c2 = c + dc * 2;

    if (inBounds(r2, c2) && !game[r2][c2]) {
      const mid = game[r1][c1];
      if (mid && mid.color !== piece.color) {
        moves.push({ r: r2, c: c2, capture: true });
      }
    }
  });

  return moves;
}

function move(r1, c1, r2, c2) {
  const piece = game[r1][c1];
  if (!piece || game[r2][c2]) return false;

  const moves = getMoves(r1, c1);
  const valid = moves.find((m) => m.r === r2 && m.c === c2);
  if (!valid) return false;

  // 🔥 capture is OPTIONAL now (bug fixed)

  game[r2][c2] = piece;
  game[r1][c1] = null;

  if (valid.capture) {
    const mr = (r1 + r2) / 2;
    const mc = (c1 + c2) / 2;

    const captured = game[mr][mc];

    if (captured) {
      if (captured.color === "black") redScore++;
      if (captured.color === "red") blackScore++;
    }

    game[mr][mc] = null;
    updateScore();
  }

  crown(r2, c2);
  return true;
}

function crown(r, c) {
  const piece = game[r][c];
  if (!piece) return;

  if (piece.color === "red" && r === 0) piece.king = true;
  if (piece.color === "black" && r === 7) piece.king = true;
}

function aiMove() {
  // if (turn !== "black") return;

  let allMoves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (game[r][c]?.color === "black") {
        getMoves(r, c).forEach((m) => {
          allMoves.push({
            from: [r, c],
            to: [m.r, m.c],
            capture: m.capture,
          });
        });
      }
    }
  }

  if (allMoves.length === 0) return;

  const captures = allMoves.filter((m) => m.capture);
  const moves = captures.length ? captures : allMoves;

  const choice = moves[Math.floor(Math.random() * moves.length)];

  move(choice.from[0], choice.from[1], choice.to[0], choice.to[1]);


  turn = "red";
  render();
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function showPopup(title, message) {
  document.getElementById("popupTitle").innerText = title;
  document.getElementById("popupScore").innerText = message;
  document.getElementById("popup").classList.remove("hidden");
}

function restartGame() {
  document.getElementById("popup").classList.add("hidden");
  init();
}

function skipTurn() {
  if (turn !== "red") return;

  selected = null;
  turn = "black";

  render();

  // 🔥 force AI move directly
  setTimeout(() => {
    aiMove();
  }, 300);
}

init();
