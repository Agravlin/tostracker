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
}

function showError(msg) {
  alert(msg);
}

document.querySelectorAll('.tos-table tbody tr').forEach(row => {
  const num = row.querySelector('.num').textContent.trim();
  const claimInput = row.querySelector('input[list="role-list"]');

  claimInput.addEventListener('input', () => {
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

    let target = findFreeRow(main);

    if (!target) {
      const fb = fallbackSlot[main];
      if (fb) target = findFreeRow(fb);
    }

    if (!target) {
      showError("One of the claims is not true (no free slot for this claim).");
      return;
    }

    target.querySelector(".slot-num").textContent = num;
    target.querySelector(".slot-claim").textContent = claim;
  });
});

document.querySelectorAll(".tos-table tbody tr").forEach(row => {
  const checkbox = row.querySelector(".dead-checkbox");
  const inputs = row.querySelectorAll("input.cell-input");

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      row.classList.add("dead");
      inputs.forEach(i => i.disabled = true);
    } else {
      row.classList.remove("dead");
      inputs.forEach(i => i.disabled = false);
    }
  });
});

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
