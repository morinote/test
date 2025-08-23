document.addEventListener("DOMContentLoaded", () => {
  const participants = [
    "おおたけ",
    "なぎさ",
    "ひとし",
    "たけだ",
    "おさない",
    "だいすけ",
    "かず",
    "まえさき",
    "のぞみ",
    "みかこ",
    "たつや",
    "はると",
    "キム",
    "めい",
    "しずか",
    "しょうま",
    "みう",
    "けんせい",
    "よっしー",
    "きょうか",
  ];

  let participantInputValues = {};
  let ticketPrices = {};

  function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function updateParticipantCount(section, count) {
    const countElement = document.querySelector(
      `.participant-count[data-section='${section}']`
    );
    if (countElement) {
      countElement.textContent = count;
    }
  }

  function createPricingTableHTML() {
    return `
        <table id="pricing-table">
            <thead>
                <tr>
                    <th>チケット名</th>
                    <th>金額</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>通し券</td>
                    <td><input type="number" class="ticket-price" data-ticket-type="通し券"></td>
                </tr>
                <tr>
                    <td>テント券</td>
                    <td><input type="number" class="ticket-price" data-ticket-type="テント券"></td>
                </tr>
                <tr>
                    <td>駐車券</td>
                    <td><input type="number" class="ticket-price" data-ticket-type="駐車券"></td>
                </tr>
            </tbody>
        </table>
        `;
  }

  function createCalculationTableHTML() {
    return `
        <table id="calculation-table">
            <thead>
                <tr>
                    <th>参加者</th>
                    <th>テント券</th>
                    <th>駐車券</th>
                    <th>手数料</th>
                    <th>支払合計</th>
                    <th>一人当たり</th>
                    <th>払う/貰う</th>
                </tr>
            </thead>
            <tbody>
                <!-- Participant payment status will be loaded here by JavaScript -->
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="1">合計</td>
                    <td id="total-tent-tickets">0</td>
                    <td id="total-parking-tickets">0</td>
                    <td colspan="4"></td>
                </tr>
            </tfoot>
        </table>
        `;
  }

  function createBeerServerTableHTML() {
    return `
        <table id="beer-server-calculation-table">
            <thead>
                <tr>
                    <th>参加者</th>
                    <th>ビアサーバー料金</th>
                    <th>支払合計</th>
                    <th>一人当たり</th>
                    <th>払う/貰う</th>
                </tr>
            </thead>
            <tbody>
                <!-- Beer server payments will be loaded here by JavaScript -->
            </tbody>
        </table>
        `;
  }

  function createFoodTableHTML() {
    return `
        <table id="food-calculation-table">
            <thead>
                <tr>
                    <th>参加者</th>
                    <th>食材料金</th>
                    <th>支払合計</th>
                    <th>一人当たり</th>
                    <th>払う/貰う</th>
                </tr>
            </thead>
            <tbody>
                <!-- Food payments will be loaded here by JavaScript -->
            </tbody>
        </table>
        `;
  }

  function initializeTables() {
    document.getElementById("pricing-table-container").innerHTML =
      createPricingTableHTML();
    document.getElementById("calculation-table-container").innerHTML =
      createCalculationTableHTML();
    document.getElementById("beer-server-table-container").innerHTML =
      createBeerServerTableHTML();
    document.getElementById("food-table-container").innerHTML =
      createFoodTableHTML();
  }

  function saveData() {
    localStorage.setItem(
      "participantInputValues",
      JSON.stringify(participantInputValues)
    );
    const currentTicketPrices = {};
    document
      .querySelectorAll("#pricing-table .ticket-price")
      .forEach((input) => {
        currentTicketPrices[input.dataset.ticketType] =
          parseInt(input.value) || 0;
      });
    localStorage.setItem("ticketPrices", JSON.stringify(currentTicketPrices));

    
  }

  function loadData() {
    const savedParticipantInputValues = localStorage.getItem(
      "participantInputValues"
    );
    if (savedParticipantInputValues) {
      participantInputValues = JSON.parse(savedParticipantInputValues);
      participants.forEach((participant) => {
        if (participantInputValues[participant]) {
          if (
            participantInputValues[participant]["mainチェック"] === undefined
          ) {
            participantInputValues[participant]["mainチェック"] = true;
          }
          if (
            participantInputValues[participant]["ビアサーバーチェック"] ===
            undefined
          ) {
            participantInputValues[participant]["ビアサーバーチェック"] = true;
          }
          if (
            participantInputValues[participant]["食材チェック"] === undefined
          ) {
            participantInputValues[participant]["食材チェック"] = true;
          }
        }
      });
    } else {
      participants.forEach((participant) => {
        participantInputValues[participant] = {
          テント券: 0,
          駐車券: 0,
          手数料: 0,
          ビアサーバー: 0,
          ビアサーバーチェック: true,
          食材: 0,
          食材チェック: true,
          mainチェック: true,
        };
      });
    }

    const savedTicketPrices = localStorage.getItem("ticketPrices");
    if (savedTicketPrices) {
      ticketPrices = JSON.parse(savedTicketPrices);
      document
        .querySelectorAll("#pricing-table .ticket-price")
        .forEach((input) => {
          if (ticketPrices[input.dataset.ticketType] !== undefined) {
            input.value = ticketPrices[input.dataset.ticketType];
          }
        });
    }

    
  }

  function renderParticipants() {
    const participantsList = document.getElementById("participants-list");
    const beerServerParticipantsList = document.getElementById(
      "beer-server-participants-list"
    );
    const foodParticipantsList = document.getElementById(
      "food-participants-list"
    );
    participantsList.innerHTML = "";
    beerServerParticipantsList.innerHTML = "";
    foodParticipantsList.innerHTML = "";

    participants.forEach((participant) => {
      if (!participantInputValues[participant]) {
        participantInputValues[participant] = {
          テント券: 0,
          駐車券: 0,
          手数料: 0,
          ビアサーバー: 0,
          ビアサーバーチェック: true,
          食材: 0,
          食材チェック: true,
          mainチェック: true,
        };
      }

      const label = document.createElement("label");
      const isChecked =
        participantInputValues[participant] &&
        participantInputValues[participant]["mainチェック"] !== false
          ? "checked"
          : "";
      label.innerHTML = `<input type="checkbox" value="${participant}" ${isChecked}> <span>${participant}</span>`;
      participantsList.appendChild(label);

      const beerLabel = document.createElement("label");
      const isBeerChecked =
        participantInputValues[participant] &&
        participantInputValues[participant]["ビアサーバーチェック"] !== false
          ? "checked"
          : "";
      beerLabel.innerHTML = `<input type="checkbox" value="${participant}" class="beer-server-participant-checkbox" ${isBeerChecked}> <span>${participant}</span>`;
      beerServerParticipantsList.appendChild(beerLabel);

      const foodLabel = document.createElement("label");
      const isFoodChecked =
        participantInputValues[participant] &&
        participantInputValues[participant]["食材チェック"] !== false
          ? "checked"
          : "";
      foodLabel.innerHTML = `<input type="checkbox" value="${participant}" class="food-participant-checkbox" ${isFoodChecked}> <span>${participant}</span>`;
      foodParticipantsList.appendChild(foodLabel);
    });

    document.querySelectorAll('[id^="dynamic-section-"]').forEach((section) => {
      const dynamicParticipantsList = section.querySelector(
        ".participant-checklist"
      );
      if (dynamicParticipantsList) {
        const tableBody = section.querySelector(".dynamic-table tbody");
        const existingParticipants = new Set(
          Array.from(dynamicParticipantsList.querySelectorAll("input")).map(
            (input) => input.value
          )
        );

        participants.forEach((participant) => {
          if (!existingParticipants.has(participant)) {
            const label = document.createElement("label");
            label.innerHTML = `<input type="checkbox" value="${participant}" class="dynamic-table-participant-checkbox" checked> <span>${participant}</span>`;
            dynamicParticipantsList.appendChild(label);

            const newRow = tableBody.insertRow();
            newRow.dataset.participant = participant;
            newRow.innerHTML = `
                            <td>${participant}</td>
                            <td><input type="number" class="item-cost-input"></td>
                            <td class="total-payment">0</td>
                            <td class="per-person-payment">0</td>
                            <td class="balance">0</td>
                        `;
          }
        });
      }
    });

    updateTables();
  }

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-participant-global-btn")) {
      const newParticipant = prompt("新しい参加者の名前を入力してください:");
      if (newParticipant && !participants.includes(newParticipant)) {
        participants.push(newParticipant);
        participantInputValues[newParticipant] = {
          テント券: 0,
          駐車券: 0,
          手数料: 0,
          ビアサーバー: 0,
          ビアサーバーチェック: true,
          食材: 0,
          食材チェック: true,
          mainチェック: true,
        };
        renderParticipants();
        saveData();
      } else if (newParticipant) {
        alert("その名前はすでに存在します。");
      }
    }
  });

  function setupEventListeners() {
    document
      .getElementById("participants-list")
      .addEventListener("change", updateTables);
    document.getElementById("pricing-table").addEventListener("input", () => {
      updateTables();
      saveData();
    });
    document
      .getElementById("beer-server-participants-list")
      .addEventListener("change", updateTables);
    document
      .getElementById("food-participants-list")
      .addEventListener("change", updateTables);
    
  }

  function updateTables() {
    const selectedParticipants = Array.from(
      document.querySelectorAll(
        '#participants-list input[type="checkbox"]:checked'
      )
    ).map((checkbox) => checkbox.value);

    participants.forEach((p) => {
      if (participantInputValues[p]) {
        participantInputValues[p]["mainチェック"] =
          selectedParticipants.includes(p);
      }
    });

    updateParticipantCount("ticket", selectedParticipants.length);

    const selectedBeerServerParticipants = Array.from(
      document.querySelectorAll(
        '#beer-server-participants-list input[type="checkbox"]:checked'
      )
    ).map((checkbox) => checkbox.value);
    updateParticipantCount(
      "beer-server",
      selectedBeerServerParticipants.length
    );

    participants.forEach((p) => {
      if (participantInputValues[p]) {
        participantInputValues[p]["ビアサーバーチェック"] =
          selectedBeerServerParticipants.includes(p);
      }
    });

    const selectedFoodParticipants = Array.from(
      document.querySelectorAll(
        '#food-participants-list input[type="checkbox"]:checked'
      )
    ).map((checkbox) => checkbox.value);
    updateParticipantCount("food", selectedFoodParticipants.length);

    participants.forEach((p) => {
      if (participantInputValues[p]) {
        participantInputValues[p]["食材チェック"] =
          selectedFoodParticipants.includes(p);
      }
    });

    const paymentStatusTableBody = document.querySelector(
      "#calculation-table tbody"
    );
    const beerServerTableBody = document.querySelector(
      "#beer-server-calculation-table tbody"
    );
    const foodTableBody = document.querySelector(
      "#food-calculation-table tbody"
    );

    Array.from(paymentStatusTableBody.rows).forEach((row) => {
      if (!selectedParticipants.includes(row.cells[0].textContent))
        row.remove();
    });
    Array.from(beerServerTableBody.rows).forEach((row) => {
      if (!selectedBeerServerParticipants.includes(row.cells[0].textContent))
        row.remove();
    });
    Array.from(foodTableBody.rows).forEach((row) => {
      if (!selectedFoodParticipants.includes(row.cells[0].textContent))
        row.remove();
    });

    selectedParticipants.forEach((participant) => {
      let paymentRow = Array.from(paymentStatusTableBody.rows).find(
        (r) => r.cells[0].textContent === participant
      );
      if (!paymentRow) {
        paymentRow = paymentStatusTableBody.insertRow();
        paymentRow.innerHTML = `
                    <td>${participant}</td>
                    <td><input type="number" class="ticket-quantity-input" data-participant="${participant}" data-ticket-type="テント券"></td>
                    <td><input type="number" class="ticket-quantity-input" data-participant="${participant}" data-ticket-type="駐車券"></td>
                    <td><input type="number" class="fee-input" data-participant="${participant}"></td>
                    <td class="total-payment">0</td>
                    <td class="per-person-payment">0</td>
                    <td class="balance">0</td>
                `;
      }
      paymentRow.querySelector(
        '.ticket-quantity-input[data-ticket-type="テント券"]'
      ).value = participantInputValues[participant]["テント券"];
      paymentRow.querySelector(
        '.ticket-quantity-input[data-ticket-type="駐車券"]'
      ).value = participantInputValues[participant]["駐車券"];
      paymentRow.querySelector(".fee-input").value =
        participantInputValues[participant]["手数料"];
    });

    selectedBeerServerParticipants.forEach((participant) => {
      let beerServerRow = Array.from(beerServerTableBody.rows).find(
        (r) => r.cells[0].textContent === participant
      );
      if (!beerServerRow) {
        beerServerRow = beerServerTableBody.insertRow();
        beerServerRow.innerHTML = `
                    <td>${participant}</td>
                    <td><input type="number" class="beer-server-input" data-participant="${participant}"></td>
                    <td class="total-payment">0</td>
                    <td class="per-person-payment">0</td>
                    <td class="balance">0</td>
                `;
      }
      beerServerRow.querySelector(".beer-server-input").value =
        participantInputValues[participant]["ビアサーバー"];
    });

    selectedFoodParticipants.forEach((participant) => {
      let foodRow = Array.from(foodTableBody.rows).find(
        (r) => r.cells[0].textContent === participant
      );
      if (!foodRow) {
        foodRow = foodTableBody.insertRow();
        foodRow.innerHTML = `
                    <td>${participant}</td>
                    <td><input type="number" class="food-input" data-participant="${participant}"></td>
                    <td class="total-payment">0</td>
                    <td class="per-person-payment">0</td>
                    <td class="balance">0</td>
                `;
      }
      foodRow.querySelector(".food-input").value =
        participantInputValues[participant]["食材"];
    });

    document
      .querySelectorAll(
        ".ticket-quantity-input, .fee-input, .beer-server-input, .food-input"
      )
      .forEach((input) => {
        input.addEventListener("input", (event) => {
          const participant = event.target.dataset.participant;
          const type =
            event.target.dataset.ticketType ||
            (event.target.classList.contains("fee-input")
              ? "手数料"
              : event.target.classList.contains("beer-server-input")
              ? "ビアサーバー"
              : "食材");
          participantInputValues[participant][type] =
            parseInt(event.target.value) || 0;
          calculateAndRender();
          saveData();
        });
      });

    calculateAndRender();
    saveData();
  }

  function getInputs() {
    const selectedParticipants = Array.from(
      document.querySelectorAll(
        '#participants-list input[type="checkbox"]:checked'
      )
    ).map((checkbox) => checkbox.value);
    const selectedBeerServerParticipants = Array.from(
      document.querySelectorAll(
        '#beer-server-participants-list input[type="checkbox"]:checked'
      )
    ).map((checkbox) => checkbox.value);
    const selectedFoodParticipants = Array.from(
      document.querySelectorAll(
        '#food-participants-list input[type="checkbox"]:checked'
      )
    ).map((checkbox) => checkbox.value);

    const currentTicketPrices = {};
    document
      .querySelectorAll("#pricing-table .ticket-price")
      .forEach((input) => {
        currentTicketPrices[input.dataset.ticketType] =
          parseInt(input.value) || 0;
      });

    

    const participantData = {};
    const allActiveParticipants = new Set([
      ...selectedParticipants,
      ...selectedBeerServerParticipants,
      ...selectedFoodParticipants,
    ]);
    allActiveParticipants.forEach((p) => {
      participantData[p] = {
        テント券: 0,
        駐車券: 0,
        手数料: 0,
        ビアサーバー: 0,
        食材: 0,
      };
    });

    document.querySelectorAll("#calculation-table tbody tr").forEach((row) => {
      const participant = row.cells[0].textContent;
      if (participantData[participant]) {
        participantData[participant]["テント券"] =
          parseInt(
            row.querySelector(
              '.ticket-quantity-input[data-ticket-type="テント券"]'
            ).value
          ) || 0;
        participantData[participant]["駐車券"] =
          parseInt(
            row.querySelector(
              '.ticket-quantity-input[data-ticket-type="駐車券"]'
            ).value
          ) || 0;
        participantData[participant]["手数料"] =
          parseInt(row.querySelector(".fee-input").value) || 0;
      }
    });

    document
      .querySelectorAll("#beer-server-calculation-table tbody tr")
      .forEach((row) => {
        const participant = row.cells[0].textContent;
        if (
          selectedBeerServerParticipants.includes(participant) &&
          participantData[participant]
        ) {
          participantData[participant]["ビアサーバー"] =
            parseInt(row.querySelector(".beer-server-input").value) || 0;
        }
      });

    document
      .querySelectorAll("#food-calculation-table tbody tr")
      .forEach((row) => {
        const participant = row.cells[0].textContent;
        if (
          selectedFoodParticipants.includes(participant) &&
          participantData[participant]
        ) {
          participantData[participant]["食材"] =
            parseInt(row.querySelector(".food-input").value) || 0;
        }
      });

    return {
      selectedParticipants,
      selectedBeerServerParticipants,
      selectedFoodParticipants,
      currentTicketPrices,
      participantData,
    };
  }

  function performCalculations(inputs) {
    const {
      selectedParticipants,
      selectedBeerServerParticipants,
      selectedFoodParticipants,
      currentTicketPrices,
      participantData,
    } = inputs;
    let totalTentTickets = 0,
      totalParkingTickets = 0,
      totalCommission = 0,
      totalExpense = 0,
      totalBeerServerExpense = 0,
      totalFoodExpense = 0;
    const calculationResults = {};

    selectedParticipants.forEach((p) => {
      calculationResults[p] = {};
      const tentVal = participantData[p]["テント券"],
        parkingVal = participantData[p]["駐車券"],
        fee = participantData[p]["手数料"];
      totalTentTickets += tentVal;
      totalParkingTickets += parkingVal;
      totalCommission += fee;
      const totalPayment =
        tentVal * currentTicketPrices["テント券"] +
        parkingVal * currentTicketPrices["駐車券"] +
        fee;
      calculationResults[p].totalPayment = totalPayment;
      totalExpense += totalPayment;
    });

    selectedBeerServerParticipants.forEach((p) => {
      if (!calculationResults[p]) calculationResults[p] = {};
      const beerServerCost = participantData[p]["ビアサーバー"];
      calculationResults[p].beerServerPayment = beerServerCost;
      totalBeerServerExpense += beerServerCost;
    });

    selectedFoodParticipants.forEach((p) => {
      if (!calculationResults[p]) calculationResults[p] = {};
      const foodCost = participantData[p]["食材"];
      calculationResults[p].foodPayment = foodCost;
      totalFoodExpense += foodCost;
    });

    const perPersonExpense =
      selectedParticipants.length > 0
        ? totalExpense / selectedParticipants.length
        : 0;
    const perPersonBeerServerExpense =
      selectedBeerServerParticipants.length > 0
        ? totalBeerServerExpense / selectedBeerServerParticipants.length
        : 0;
    const perPersonFoodExpense =
      selectedFoodParticipants.length > 0
        ? totalFoodExpense / selectedFoodParticipants.length
        : 0;

    selectedParticipants.forEach((p) => {
      calculationResults[p].balance =
        calculationResults[p].totalPayment - perPersonExpense;
    });
    selectedBeerServerParticipants.forEach((p) => {
      calculationResults[p].beerBalance =
        calculationResults[p].beerServerPayment - perPersonBeerServerExpense;
    });
    selectedFoodParticipants.forEach((p) => {
      calculationResults[p].foodBalance =
        calculationResults[p].foodPayment - perPersonFoodExpense;
    });

    return {
      calculationResults,
      perPersonExpense,
      perPersonBeerServerExpense,
      perPersonFoodExpense,
      totalTentTickets: totalTentTickets,
      totalParkingTickets: totalParkingTickets,
    };
  }

  function updateUIWithResults(results) {
    const {
      calculationResults,
      perPersonExpense,
      perPersonBeerServerExpense,
      perPersonFoodExpense,
      totalTentTickets,
      totalParkingTickets,
    } = results;

    document.querySelectorAll("#calculation-table tbody tr").forEach((row) => {
      const p = row.cells[0].textContent;
      if (calculationResults[p]) {
        const res = calculationResults[p];
        row.querySelector(".total-payment").textContent =
          formatNumberWithCommas(res.totalPayment);
        row.querySelector(".per-person-payment").textContent =
          formatNumberWithCommas(Math.round(perPersonExpense));
        const balanceCell = row.querySelector(".balance"),
          balanceValue = Math.round(res.balance);
        balanceCell.removeAttribute("data-sign");
        if (balanceValue > 0) {
          balanceCell.textContent = `貰う: ${formatNumberWithCommas(
            balanceValue
          )}`;
          balanceCell.dataset.sign = "+";
        } else if (balanceValue < 0) {
          balanceCell.textContent = `払う: ${formatNumberWithCommas(
            Math.abs(balanceValue)
          )}`;
        } else {
          balanceCell.textContent = "0";
        }
      }
    });

    document
      .querySelectorAll("#beer-server-calculation-table tbody tr")
      .forEach((row) => {
        const p = row.cells[0].textContent;
        if (
          calculationResults[p] &&
          calculationResults[p].beerBalance !== undefined
        ) {
          const res = calculationResults[p];
          row.querySelector(".total-payment").textContent =
            formatNumberWithCommas(res.beerServerPayment);
          row.querySelector(".per-person-payment").textContent =
            formatNumberWithCommas(Math.round(perPersonBeerServerExpense));
          const balanceCell = row.querySelector(".balance"),
            balanceValue = Math.round(res.beerBalance);
          balanceCell.removeAttribute("data-sign");
          if (balanceValue > 0) {
            balanceCell.textContent = `貰う: ${formatNumberWithCommas(
              balanceValue
            )}`;
            balanceCell.dataset.sign = "+";
          } else if (balanceValue < 0) {
            balanceCell.textContent = `払う: ${formatNumberWithCommas(
              Math.abs(balanceValue)
            )}`;
          } else {
            balanceCell.textContent = "0";
          }
        }
      });

    document
      .querySelectorAll("#food-calculation-table tbody tr")
      .forEach((row) => {
        const p = row.cells[0].textContent;
        if (
          calculationResults[p] &&
          calculationResults[p].foodBalance !== undefined
        ) {
          const res = calculationResults[p];
          row.querySelector(".total-payment").textContent =
            formatNumberWithCommas(res.foodPayment);
          row.querySelector(".per-person-payment").textContent =
            formatNumberWithCommas(Math.round(perPersonFoodExpense));
          const balanceCell = row.querySelector(".balance"),
            balanceValue = Math.round(res.foodBalance);
          balanceCell.removeAttribute("data-sign");
          if (balanceValue > 0) {
            balanceCell.textContent = `貰う: ${formatNumberWithCommas(
              balanceValue
            )}`;
            balanceCell.dataset.sign = "+";
          } else if (balanceValue < 0) {
            balanceCell.textContent = `払う: ${formatNumberWithCommas(
              Math.abs(balanceValue)
            )}`;
          } else {
            balanceCell.textContent = "0";
          }
        }
      });

    document.getElementById("total-tent-tickets").textContent =
      totalTentTickets;
    document.getElementById("total-parking-tickets").textContent =
      totalParkingTickets;
  }

  function calculateAndRender() {
    const inputs = getInputs();
    const results = performCalculations(inputs);
    updateUIWithResults(results);
    updateSummaryTable();
  }

  function calculateDynamicTable(table) {
    const tableBody = table.querySelector("tbody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));
    let totalCost = 0;

    rows.forEach((row) => {
      const cost = parseInt(row.querySelector(".item-cost-input").value) || 0;
      totalCost += cost;
      row.querySelector(".total-payment").textContent =
        formatNumberWithCommas(cost);
    });

    const perPersonCost = rows.length > 0 ? totalCost / rows.length : 0;

    rows.forEach((row) => {
      const cost = parseInt(row.querySelector(".item-cost-input").value) || 0;
      row.querySelector(".per-person-payment").textContent =
        formatNumberWithCommas(Math.round(perPersonCost));
      const balanceCell = row.querySelector(".balance"),
        balanceValue = Math.round(cost - perPersonCost);
      balanceCell.removeAttribute("data-sign");
      if (balanceValue > 0) {
        balanceCell.textContent = `貰う: ${formatNumberWithCommas(
          balanceValue
        )}`;
        balanceCell.dataset.sign = "+";
      } else if (balanceValue < 0) {
        balanceCell.textContent = `払う: ${formatNumberWithCommas(
          Math.abs(balanceValue)
        )}`;
      } else {
        balanceCell.textContent = "0";
      }
    });
    updateSummaryTable();
  }

  function updateSummaryTable() {
    const summaryTable = document.getElementById("summary-table");
    const summaryThead = summaryTable.querySelector("thead");
    const summaryTbody = summaryTable.querySelector("tbody");
    const calculationSectionTitle = document.querySelector(
      "#calculation-section h2"
    ).textContent;
    const calculationHeader = calculationSectionTitle + "料金";
    const headers = ["参加者", calculationSectionTitle, "ビアサーバー", "食材"];
    document.querySelectorAll(".dynamic-table").forEach((table) => {
      headers.push(table.closest("section").querySelector("h2").textContent);
    });
    headers.push("最終収支");
    summaryThead.innerHTML = `<tr>${headers
      .map((h) => `<th>${h}</th>`)
      .join("")}</tr>`;

    const summary = {};
    participants.forEach((p) => {
      summary[p] = {};
      headers.forEach((h) => {
        if (h !== "参加者" && h !== "最終収支") summary[p][h] = 0;
      });
    });

    const parseBalance = (text) => {
      if (!text) return 0;
      const value = parseInt(text.replace(/[^0-9]/g, ""));
      if (isNaN(value)) return 0;
      if (text.includes("払う")) return -value;
      if (text.includes("貰う")) return value;
      return 0;
    };

    document.querySelectorAll("#calculation-table tbody tr").forEach((row) => {
      const p = row.cells[0].textContent;
      if (summary[p])
        summary[p][calculationSectionTitle] = parseBalance(
          row.querySelector(".balance").textContent
        );
    });
    document
      .querySelectorAll("#beer-server-calculation-table tbody tr")
      .forEach((row) => {
        const p = row.cells[0].textContent;
        if (summary[p])
          summary[p]["ビアサーバー"] = parseBalance(
            row.querySelector(".balance").textContent
          );
      });
    document
      .querySelectorAll("#food-calculation-table tbody tr")
      .forEach((row) => {
        const p = row.cells[0].textContent;
        if (summary[p])
          summary[p]["食材"] = parseBalance(
            row.querySelector(".balance").textContent
          );
      });
    document.querySelectorAll(".dynamic-table").forEach((table) => {
      const title = table.closest("section").querySelector("h2").textContent;
      table.querySelectorAll("tbody tr").forEach((row) => {
        const p = row.cells[0].textContent;
        if (summary[p])
          summary[p][title] = parseBalance(
            row.querySelector(".balance").textContent
          );
      });
    });

    const activeParticipants = new Set();
    document
      .querySelectorAll(
        "#calculation-table tbody tr, #beer-server-calculation-table tbody tr, #food-calculation-table tbody tr, .dynamic-table tbody tr"
      )
      .forEach((row) => {
        activeParticipants.add(row.cells[0].textContent);
      });

    summaryTbody.innerHTML = "";
    activeParticipants.forEach((participant) => {
      const row = summaryTbody.insertRow();
      let finalBalance = 0;
      let cellHtml = `<td>${participant}</td>`;
      headers.forEach((header) => {
        if (header !== "参加者" && header !== "最終収支") {
          const balance = summary[participant][header] || 0;
          finalBalance += balance;
          const balanceText =
            balance > 0
              ? `貰う: ${formatNumberWithCommas(balance)}`
              : balance < 0
              ? `払う: ${formatNumberWithCommas(Math.abs(balance))}`
              : "0";
          cellHtml += `<td class="balance"${
            balance > 0 ? ' data-sign="+"' : ""
          }>${balanceText}</td>`;
        }
      });
      const roundedFinalBalance =
        Math.sign(finalBalance) * Math.ceil(Math.abs(finalBalance) / 100) * 100;
      const finalBalanceText =
        roundedFinalBalance > 0
          ? `貰う: ${formatNumberWithCommas(roundedFinalBalance)}`
          : roundedFinalBalance < 0
          ? `払う: ${formatNumberWithCommas(Math.abs(roundedFinalBalance))}`
          : "0";
      cellHtml += `<td class="balance"${
        roundedFinalBalance > 0 ? ' data-sign="+"' : ""
      }>${finalBalanceText}</td>`;
      row.innerHTML = cellHtml;
    });
  }

  function createDynamicSectionHTML(title) {
    return `
            <h2>${title}</h2>
            <div class="participant-checklist"></div>
            <button class="add-participant-global-btn">参加者を追加</button>
            <p>合計人数: <span class="participant-count" data-section="dynamic-${title}">0</span></p>
            <div class="table-container">
                <table class="dynamic-table">
                    <thead>
                        <tr>
                            <th>参加者</th>
                            <th>${title}料金</th>
                            <th>支払合計</th>
                            <th>一人当たり</th>
                            <th>払う/貰う</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
  }

  let dynamicSectionCounter = 0;
  document
    .getElementById("add-new-table-section-btn")
    .addEventListener("click", () => {
      dynamicSectionCounter++;
      const newSection = document.createElement("section");
      const dynamicSectionId = `dynamic-section-${dynamicSectionCounter}`;
      newSection.id = dynamicSectionId;
      newSection.innerHTML = `<h2><input type="text" class="section-title" placeholder="セクションのタイトル"></h2><button class="add-table-btn">テーブルを追加</button>`;
      document
        .getElementById("dynamic-sections-container")
        .appendChild(newSection);

      newSection
        .querySelector(".add-table-btn")
        .addEventListener("click", () => {
          const title =
            newSection.querySelector(".section-title").value ||
            "新しいセクション";
          newSection.innerHTML = createDynamicSectionHTML(title);

          const participantsList = newSection.querySelector(
            ".participant-checklist"
          );
          const tableBody = newSection.querySelector(".dynamic-table tbody");
          const table = newSection.querySelector(".dynamic-table");

          participants.forEach((participant) => {
            const label = document.createElement("label");
            label.innerHTML = `<input type="checkbox" value="${participant}" class="dynamic-table-participant-checkbox" checked> <span>${participant}</span>`;
            participantsList.appendChild(label);
            const newRow = tableBody.insertRow();
            newRow.dataset.participant = participant;
            newRow.innerHTML = `
                    <td>${participant}</td>
                    <td><input type="number" class="item-cost-input"></td>
                    <td class="total-payment">0</td>
                    <td class="per-person-payment">0</td>
                    <td class="balance">0</td>
                `;
          });

          updateParticipantCount(
            `dynamic-${title}`,
            participantsList.querySelectorAll('input[type="checkbox"]:checked')
              .length
          );

          participantsList.addEventListener("change", (event) => {
            const participant = event.target.value,
              isChecked = event.target.checked;
            if (isChecked) {
              const newRow = tableBody.insertRow();
              newRow.dataset.participant = participant;
              newRow.innerHTML = `
                        <td>${participant}</td>
                        <td><input type="number" class="item-cost-input"></td>
                        <td class="total-payment">0</td>
                        <td class="per-person-payment">0</td>
                        <td class="balance">0</td>
                    `;
            } else {
              const rowToRemove = tableBody.querySelector(
                `tr[data-participant="${participant}"]`
              );
              if (rowToRemove) rowToRemove.remove();
            }
            updateParticipantCount(
              `dynamic-${title}`,
              participantsList.querySelectorAll(
                'input[type="checkbox"]:checked'
              ).length
            );
            calculateDynamicTable(table);
          });

          table.addEventListener("input", (event) => {
            if (event.target.classList.contains("item-cost-input"))
              calculateDynamicTable(table);
          });
        });
    });

  // Initialize the application
  initializeTables();
  loadData();
  renderParticipants();
  setupEventListeners();
});
