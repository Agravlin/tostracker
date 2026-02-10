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

let deletedRowState = null;
const undoBtn = document.querySelector('.btn-undo');

function findFreeRow(roleName) {
  const rows = [...document.querySelectorAll(`.role-table tbody tr[data-role="${roleName}"]`)];
  return rows.find(r => !r.querySelector(".slot-num")?.textContent.trim());
}

function clearAssignment(playerNum) {
  document.querySelectorAll(".role-table .slot-num").forEach(td => {
    if (td.textContent.trim() === String(playerNum)) {
      const tr = td.closest("tr");
      tr.querySelector(".slot-num").textContent = "";
      tr.querySelector(".slot-claim").textContent = "";
    }
  });
  
  const notFittingList = document.querySelector('.not-fitting-list');
  if (notFittingList) {
    const items = notFittingList.querySelectorAll('.not-fitting-item');
    items.forEach(item => {
      if (item.dataset.playerNum === String(playerNum)) {
        item.remove();
      }
    });
    
    if (notFittingList.children.length === 0) {
      document.querySelector('.not-fitting-section').style.display = 'none';
    }
  }
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
    if (!claim) { clearAssignment(num); return; }

    clearAssignment(num);

    const matchedRole = Object.keys(primarySlot).find(
      role => role.toLowerCase() === claim.toLowerCase()
    );
    
    if (matchedRole) {
      claim = matchedRole;
      claimInput.value = matchedRole;
    }

    const main = primarySlot[claim];
    if (!main) return;

    const isDead = deadCheckbox.checked;
    let target = findFreeRow(main);

    if (isDead && !target) {
      const occupiedRows = [...document.querySelectorAll(`.role-table tbody tr[data-role="${main}"]`)];
      const occupiedByAlive = occupiedRows.find(r => {
        const slotNum = r.querySelector(".slot-num")?.textContent.trim();
        if (!slotNum) return false;
        const allTosRows = document.querySelectorAll('.tos-table tbody tr');
        for (let tosRow of allTosRows) {
          const rowNum = tosRow.querySelector('.num').textContent.trim();
          const isDeadRow = tosRow.querySelector('.dead-checkbox').checked;
          if (rowNum === slotNum && !isDeadRow) {
            return true;
          }
        }
        return false;
      });
      
      if (occupiedByAlive) {
        const occupiedSlotNum = occupiedByAlive.querySelector(".slot-num").textContent.trim();
        const occupiedClaim = occupiedByAlive.querySelector(".slot-claim").textContent.trim();
        
        occupiedByAlive.querySelector(".slot-num").textContent = "";
        occupiedByAlive.querySelector(".slot-claim").textContent = "";
        
        const fb = fallbackSlot[main];
        if (fb) {
          const fallbackTarget = findFreeRow(fb);
          if (fallbackTarget) {
            fallbackTarget.querySelector(".slot-num").textContent = occupiedSlotNum;
            fallbackTarget.querySelector(".slot-claim").textContent = occupiedClaim;
          } else {
            addToNotFitting(occupiedSlotNum, occupiedClaim);
          }
        } else {
          addToNotFitting(occupiedSlotNum, occupiedClaim);
        }
        
        target = occupiedByAlive;
      }
    }

    if (!target) {
      const fb = fallbackSlot[main];
      if (fb) target = findFreeRow(fb);
    }

    if (!target) {
      addToNotFitting(num, claim);
      return;
    }

    target.querySelector(".slot-num").textContent = num;
    target.querySelector(".slot-claim").textContent = claim;
    
    if (isDead) {
      target.classList.add('dead-slot');
    } else {
      target.classList.remove('dead-slot');
    }
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
  
  const aliveRows = rows.filter(row => !row.classList.contains('dead') && !row.classList.contains('deleted'));
  const deadRows = rows.filter(row => row.classList.contains('dead') && !row.classList.contains('deleted'));
  const deletedRows = rows.filter(row => row.classList.contains('deleted'));
  
  [...aliveRows, ...deadRows, ...deletedRows].forEach(row => {
    tbody.appendChild(row);
  });
}

document.querySelector(".btn.btn-ghost").addEventListener("click", () => {
  document.querySelectorAll(".tos-table tbody tr").forEach(row => {
    row.querySelectorAll("input.cell-input").forEach(i => {
      i.value = "";
      i.disabled = false;
    });

    const cb = row.querySelector(".dead-checkbox");
    cb.checked = false;

    row.classList.remove("dead");
    row.classList.remove("deleted");
  });

  document.querySelectorAll(".role-table .slot-num, .role-table .slot-claim")
    .forEach(td => td.textContent = "");
  
  const notFittingList = document.querySelector('.not-fitting-list');
  if (notFittingList) {
    notFittingList.innerHTML = '';
    document.querySelector('.not-fitting-section').style.display = 'none';
  }
  
  deletedRowState = null;
  undoBtn.disabled = true;
});

document.querySelectorAll(".delete-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const rowNum = btn.getAttribute("data-row");
    const row = btn.closest("tr");
    
    const inputs = row.querySelectorAll("input.cell-input, textarea.cell-input");
    const deadCheckbox = row.querySelector(".dead-checkbox");
    
    deletedRowState = {
      rowNum: rowNum,
      row: row,
      values: Array.from(inputs).map(input => input.value),
      deadChecked: deadCheckbox.checked,
      isDead: row.classList.contains("dead")
    };
    
    clearAssignment(rowNum);
    
    row.classList.add("deleted");
    
    undoBtn.disabled = false;
  });
});

undoBtn.addEventListener("click", () => {
  if (!deletedRowState) return;
  
  const { row, values, deadChecked, isDead, rowNum } = deletedRowState;
  
  row.classList.remove("deleted");
  
  const inputs = row.querySelectorAll("input.cell-input, textarea.cell-input");
  inputs.forEach((input, idx) => {
    input.value = values[idx];
  });
  
  const deadCheckbox = row.querySelector(".dead-checkbox");
  deadCheckbox.checked = deadChecked;
  if (isDead) {
    row.classList.add("dead");
    inputs.forEach(i => i.disabled = true);
  }
  
  const claimInput = row.querySelector('input[list="role-list"]');
  claimInput.dispatchEvent(new Event('input'));
  
  deletedRowState = null;
  undoBtn.disabled = true;
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
