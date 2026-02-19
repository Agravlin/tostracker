const primarySlot = {
  Jailor: "Jailor",

  Spy: "Town Investigative",
  Investigator: "Town Investigative",
  Sheriff: "Town Investigative",
  Lookout: "Town Investigative",

  Doctor: "Town Protective",
  Bodyguard: "Town Protective",

  Mayor: "Random Town",
  Medium: "Random Town",
  Retributionist: "Random Town",
  Transporter: "Random Town",
  Veteran: "Random Town",
  Vigilante: "Random Town",
  "Tavern Keeper": "Random Town",
};

const fallbackSlot = {
  "Town Investigative": "Random Town",
  "Town Protective": "Random Town",
};

function findFreeRow(roleName) {
  const rows = [...document.querySelectorAll(`.role-table tbody tr[data-role="${roleName}"]`)];
  return rows.find(r => !r.querySelector(".slot-num")?.textContent.trim());
}

function reassignAllPlayers() {
  document.querySelectorAll(".role-table .slot-num, .role-table .slot-claim")
    .forEach(td => td.textContent = "");
  document.querySelectorAll(".role-table tr.dead-slot")
    .forEach(tr => tr.classList.remove("dead-slot"));
  const notFittingList = document.querySelector('.not-fitting-list');
  if (notFittingList) {
    notFittingList.innerHTML = '';
    document.querySelector('.not-fitting-section').style.display = 'none';
  }

  const players = [];
  document.querySelectorAll('.tos-table tbody tr').forEach(row => {
    const num = row.querySelector('.num').textContent.trim();
    const claimInput = row.querySelector('input[list="role-list"]');
    const claim = claimInput.value.trim();
    const isDead = row.querySelector('.dead-checkbox').checked;
    
    if (claim) {
      const matchedRole = Object.keys(primarySlot).find(
        role => role.toLowerCase() === claim.toLowerCase()
      );
      const finalClaim = matchedRole || claim;
      const main = primarySlot[finalClaim];
      
      if (main) {
        players.push({ num, claim: finalClaim, isDead, main });
      }
    }
  });

  players.sort((a, b) => {
    if (a.isDead && !b.isDead) return -1;
    if (!a.isDead && b.isDead) return 1;
    return parseInt(a.num) - parseInt(b.num);
  });

  players.forEach(player => {
    let target = findFreeRow(player.main);
    
    if (!target) {
      const fb = fallbackSlot[player.main];
      if (fb) target = findFreeRow(fb);
    }

    if (target) {
      target.querySelector(".slot-num").textContent = player.num;
      target.querySelector(".slot-claim").textContent = player.claim;
      if (player.isDead) {
        target.classList.add('dead-slot');
      }
    } else {
      addToNotFitting(player.num, player.claim);
    }
  });
}

function addToNotFitting(playerNum, claim) {
  const notFittingSection = document.querySelector('.not-fitting-section');
  const notFittingList = document.querySelector('.not-fitting-list');
  
  notFittingSection.style.display = 'block';
  
  const existing = notFittingList.querySelector(`[data-player-num="${playerNum}"]`);
  if (existing) {
    existing.querySelector('.claim-text').textContent = claim;
  } else {
    const item = document.createElement('div');
    item.className = 'not-fitting-item';
    item.dataset.playerNum = playerNum;
    item.innerHTML = `<strong>#${playerNum}</strong>: <span class="claim-text">${claim}</span>`;
    notFittingList.appendChild(item);
  }
}

document.querySelectorAll('.tos-table tbody tr').forEach(row => {
  const num = row.querySelector('.num').textContent.trim();
  const claimInput = row.querySelector('input[list="role-list"]');
  const deadCheckbox = row.querySelector('.dead-checkbox');

  const updateAssignment = () => {
    let claim = claimInput.value.trim();
    
    const matchedRole = Object.keys(primarySlot).find(
      role => role.toLowerCase() === claim.toLowerCase()
    );
    
    if (matchedRole) {
      claim = matchedRole;
      claimInput.value = matchedRole;
    }

    reassignAllPlayers();
  };

  claimInput.addEventListener('input', updateAssignment);
  deadCheckbox.addEventListener('change', updateAssignment);
});

document.querySelectorAll(".tos-table tbody tr").forEach(row => {
  const checkbox = row.querySelector(".dead-checkbox");
  const inputs = row.querySelectorAll("input.cell-input");

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      const tbody = document.querySelector('.tos-table tbody');
      const allRows = Array.from(tbody.querySelectorAll('tr'));
      row.dataset.originalPosition = allRows.indexOf(row);
      
      row.classList.add("dead");
      inputs.forEach(i => i.disabled = true);
      
      reorderRows();
      
      const claimInput = row.querySelector('input[list="role-list"]');
      if (claimInput.value.trim()) {
        claimInput.dispatchEvent(new Event('input'));
      }
    } else {
      row.classList.remove("dead");
      inputs.forEach(i => i.disabled = false);
      
      restoreOriginalPosition(row);
      
      const claimInput = row.querySelector('input[list="role-list"]');
      if (claimInput.value.trim()) {
        claimInput.dispatchEvent(new Event('input'));
      }
    }
  });
});

function restoreOriginalPosition(row) {
  const tbody = document.querySelector('.tos-table tbody');
  const originalPosition = parseInt(row.dataset.originalPosition);
  
  if (isNaN(originalPosition)) {
    reorderRows();
    return;
  }
  
  tbody.removeChild(row);
  
  const allRows = Array.from(tbody.querySelectorAll('tr'));
  
  const targetIndex = Math.min(originalPosition, allRows.length);
  
  if (targetIndex >= allRows.length) {
    tbody.appendChild(row);
  } else {
    tbody.insertBefore(row, allRows[targetIndex]);
  }
  
  delete row.dataset.originalPosition;
}

function reorderRows() {
  const tbody = document.querySelector('.tos-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  const aliveRows = rows.filter(row => !row.classList.contains('dead'));
  const deadRows = rows.filter(row => row.classList.contains('dead'));
  
  [...aliveRows, ...deadRows].forEach(row => {
    tbody.appendChild(row);
  });
}

document.querySelector(".btn.btn-ghost").addEventListener("click", () => {
  document.querySelectorAll(".tos-table tbody tr").forEach(row => {
    row.querySelectorAll("input.cell-input, textarea.cell-input").forEach(input => {
      input.value = "";
      input.disabled = false;
    });

    const cb = row.querySelector(".dead-checkbox");
    cb.checked = false;

    row.classList.remove("dead");
    delete row.dataset.originalPosition;
  });

  document.querySelectorAll(".role-table .slot-num, .role-table .slot-claim")
    .forEach(td => td.textContent = "");

  document.querySelectorAll(".role-table tr.dead-slot")
    .forEach(tr => tr.classList.remove("dead-slot"));
  
  const notFittingList = document.querySelector('.not-fitting-list');
  if (notFittingList) {
    notFittingList.innerHTML = '';
    document.querySelector('.not-fitting-section').style.display = 'none';
  }
  
  const tbody = document.querySelector('.tos-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const numA = parseInt(a.querySelector('.num').textContent.trim());
    const numB = parseInt(b.querySelector('.num').textContent.trim());
    return numA - numB;
  });
  rows.forEach(row => tbody.appendChild(row));
});

document.querySelectorAll('.tos-table tbody tr').forEach(row => {
  const textareas = row.querySelectorAll('textarea.cell-input');
  textareas.forEach(textarea => {
    textarea.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const colonIndex = pastedText.indexOf(':');
      
      const cleanedText = colonIndex !== -1 ? pastedText.substring(colonIndex + 1).trim() : pastedText;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      textarea.value = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
      
      const newPosition = start + cleanedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      
      autoGrowTextarea(textarea);
    });
    
    textarea.addEventListener('input', () => {
      autoGrowTextarea(textarea);
    });
    
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setTimeout(() => {
          autoGrowTextarea(textarea);
        }, 0);
      }
    });
  });
});

function autoGrowTextarea(textarea) {
  textarea.style.height = '1.8em';
  const scrollHeight = textarea.scrollHeight;
  if (scrollHeight > textarea.clientHeight) {
    textarea.style.height = scrollHeight + 'px';
  }
}

const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialBtn = document.querySelector('.info-icon');
const tutorialClose = document.querySelector('.tutorial-close');
const tutorialBackdrop = document.querySelector('.tutorial-backdrop');

function showTutorial() {
  if (tutorialOverlay) {
    tutorialOverlay.style.display = 'block';
  }
}

function hideTutorial() {
  if (tutorialOverlay) {
    tutorialOverlay.style.display = 'none';
  }
}

if (tutorialBtn) {
  tutorialBtn.addEventListener('click', showTutorial);
}

if (tutorialClose) {
  tutorialClose.addEventListener('click', hideTutorial);
}

if (tutorialBackdrop) {
  tutorialBackdrop.addEventListener('click', hideTutorial);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tutorialOverlay && tutorialOverlay.style.display !== 'none') {
    hideTutorial();
  }
});

function saveState() {
  const state = [];
  document.querySelectorAll('.tos-table tbody tr').forEach(row => {
    const claimInput = row.querySelector('input[list="role-list"]');
    const textareas = row.querySelectorAll('textarea.cell-input');
    const checkbox = row.querySelector('.dead-checkbox');
    state.push({
      num: row.querySelector('.num').textContent.trim(),
      claim: claimInput ? claimInput.value : '',
      will: textareas[0] ? textareas[0].value : '',
      info: textareas[1] ? textareas[1].value : '',
      isDead: checkbox ? checkbox.checked : false,
    });
  });
  try {
    localStorage.setItem('tos-tracker-state', JSON.stringify(state));
  } catch (e) {
    // ignore storage errors (e.g. private browsing quota)
  }
}

function loadState() {
  let saved;
  try {
    saved = localStorage.getItem('tos-tracker-state');
  } catch (e) {
    return;
  }
  if (!saved) return;
  let state;
  try {
    state = JSON.parse(saved);
  } catch (e) {
    return;
  }
  if (!Array.isArray(state)) return;

  const rowMap = {};
  document.querySelectorAll('.tos-table tbody tr').forEach(row => {
    const num = row.querySelector('.num').textContent.trim();
    rowMap[num] = row;
  });

  state.forEach(entry => {
    const row = rowMap[entry.num];
    if (!row) return;
    const claimInput = row.querySelector('input[list="role-list"]');
    const textareas = row.querySelectorAll('textarea.cell-input');
    const checkbox = row.querySelector('.dead-checkbox');
    if (claimInput) claimInput.value = entry.claim || '';
    if (textareas[0]) {
      textareas[0].value = entry.will || '';
      autoGrowTextarea(textareas[0]);
    }
    if (textareas[1]) {
      textareas[1].value = entry.info || '';
      autoGrowTextarea(textareas[1]);
    }
    if (checkbox && entry.isDead && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }
  });
  reassignAllPlayers();
}

document.querySelectorAll('.tos-table tbody tr').forEach(row => {
  row.querySelectorAll('input.cell-input, textarea.cell-input').forEach(input => {
    input.addEventListener('input', saveState);
  });
  const checkbox = row.querySelector('.dead-checkbox');
  if (checkbox) checkbox.addEventListener('change', saveState);
});

document.querySelector('.btn.btn-ghost').addEventListener('click', () => {
  try { localStorage.removeItem('tos-tracker-state'); } catch (e) {}
});

loadState();
