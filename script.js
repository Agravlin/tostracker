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
    const claim = claimInput.value.trim();
    if (!claim) { clearAssignment(num); return; }

    clearAssignment(num);

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
  });

  document.querySelectorAll(".role-table .slot-num, .role-table .slot-claim")
    .forEach(td => td.textContent = "");
});
