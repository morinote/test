import { participants } from './config.js';
import { participantInputValues, saveData, loadData } from './state.js';
import { getInputs, performCalculations } from './calculation.js';

// --- Helper Functions ---

function adjustInputWidth(inputElement) {
    if (!inputElement) return;
    const value = inputElement.value || inputElement.placeholder || "";
    const newWidth = `calc(${value.length}ch + 4ch)`;
    inputElement.style.width = newWidth;
}

export function adjustAllInputWidths() {
    document.querySelectorAll('.form-input--numeric, .dynamic-section__header input').forEach(adjustInputWidth);
}

function formatNumberWithCommas(number) {
    if (number === undefined || number === null || isNaN(number)) {
        return "0";
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateParticipantCount(section, count) {
    const countElement = document.querySelector(`.participant-count[data-section='${section}']`);
    if (countElement) {
        countElement.textContent = count;
    }
}

// --- Table Creation ---

function createPricingTableHTML() {
    return `
        <table id="pricing-table" class="data-table">
            <thead>
                <tr><th>チケット名</th><th>金額</th></tr>
            </thead>
            <tbody>
                <tr><td>通し券</td><td><input type="number" class="form-input form-input--numeric ticket-price" data-ticket-type="通し券" value="0"></td></tr>
                <tr><td>テント券</td><td><input type="number" class="form-input form-input--numeric ticket-price" data-ticket-type="テント券" value="0"></td></tr>
                <tr><td>駐車券</td><td><input type="number" class="form-input form-input--numeric ticket-price" data-ticket-type="駐車券" value="0"></td></tr>
            </tbody>
        </table>
    `;
}

function createGenericTableHTML(id, headers) {
    return `
        <table id="${id}" class="data-table">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody></tbody>
        </table>
    `;
}

export function initializeTables() {
    document.getElementById("pricing-table-container").innerHTML = createPricingTableHTML();
    document.getElementById("calculation-table-container").innerHTML = createGenericTableHTML('calculation-table', []);
    document.getElementById("beer-server-table-container").innerHTML = createGenericTableHTML('beer-server-calculation-table', ['参加者', 'ビアサーバー料金', '支払合計', '一人当たり', '払う/貰う']);
    document.getElementById("food-table-container").innerHTML = createGenericTableHTML('food-calculation-table', ['参加者', '食材料金', '支払合計', '一人当たり', '払う/貰う']);
}

// --- Rendering Logic ---

export function renderParticipants() {
    const lists = {
        main: { container: document.getElementById("participants-list"), key: 'mainチェック' },
        beer: { container: document.getElementById("beer-server-participants-list"), key: 'ビアサーバーチェック' },
        food: { container: document.getElementById("food-participants-list"), key: '食材チェック' },
    };
    const template = document.getElementById('participant-template')?.content;

    if (!template) {
        console.error("Participant template not found!");
        return;
    }

    Object.values(lists).forEach(list => { if(list.container) list.container.innerHTML = ''; });

    participants.forEach(participant => {
        if (!participantInputValues[participant]) {
            participantInputValues[participant] = { テント券: 0, 駐車券: 0, 手数料: 0, ビアサーバー: 0, ビアサーバーチェック: true, 食材: 0, 食材チェック: true, mainチェック: true };
        }

        for (const type in lists) {
            const { container, key } = lists[type];
            if (!container) continue;

            const clone = document.importNode(template, true);
            const label = clone.querySelector('.participant-checklist__label');
            const checkbox = clone.querySelector('.participant-checklist__checkbox');
            const name = clone.querySelector('.participant-checklist__name');

            name.textContent = participant;
            checkbox.value = participant;
            checkbox.checked = participantInputValues[participant][key] !== false;
            if (checkbox.checked) {
                label.classList.add('participant-checklist__label--checked');
            }

            checkbox.addEventListener('change', () => {
                label.classList.toggle('participant-checklist__label--checked');
            });

            container.appendChild(clone);
        }
    });

    updateTables();
}

function updateTables() {
    const selectedParticipants = Array.from(document.querySelectorAll('#participants-list input:checked')).map(cb => cb.value);
    const selectedBeerServerParticipants = Array.from(document.querySelectorAll('#beer-server-participants-list input:checked')).map(cb => cb.value);
    const selectedFoodParticipants = Array.from(document.querySelectorAll('#food-participants-list input:checked')).map(cb => cb.value);

    participants.forEach(p => {
        if (participantInputValues[p]) {
            participantInputValues[p]['mainチェック'] = selectedParticipants.includes(p);
            participantInputValues[p]['ビアサーバーチェック'] = selectedBeerServerParticipants.includes(p);
            participantInputValues[p]['食材チェック'] = selectedFoodParticipants.includes(p);
        }
    });

    updateParticipantCount("ticket", selectedParticipants.length);
    updateParticipantCount("beer-server", selectedBeerServerParticipants.length);
    updateParticipantCount("food", selectedFoodParticipants.length);

    const calculationTbody = document.querySelector("#calculation-table tbody");
    updateParticipantRows(calculationTbody, selectedParticipants, 'calculation-row-template', (clone, p) => {
        // Ensure all rows in the template clone have the participant dataset
        clone.querySelectorAll('tr').forEach(row => row.dataset.participant = p);

        clone.querySelector('.calculation-table__header-row th').textContent = p;
        clone.querySelector('.ticket-quantity-input[data-ticket-type="テント券"]').value = participantInputValues[p]['テント券'];
        clone.querySelector('.ticket-quantity-input[data-ticket-type="駐車券"]').value = participantInputValues[p]['駐車券'];
        clone.querySelector('.fee-input').value = participantInputValues[p]['手数料'];
    });

    const beerServerTbody = document.querySelector("#beer-server-calculation-table tbody");
    updateParticipantRows(beerServerTbody, selectedBeerServerParticipants, 'standard-row-template', (clone, p) => {
        const row = clone.querySelector('tr');
        row.dataset.participant = p;
        row.querySelector('td:first-child').textContent = p;
        const input = row.querySelector('input');
        input.classList.add('beer-server-input');
        input.value = participantInputValues[p]['ビアサーバー'];
    });

    const foodTbody = document.querySelector("#food-calculation-table tbody");
    updateParticipantRows(foodTbody, selectedFoodParticipants, 'standard-row-template', (clone, p) => {
        const row = clone.querySelector('tr');
        row.dataset.participant = p;
        row.querySelector('td:first-child').textContent = p;
        const input = row.querySelector('input');
        input.classList.add('food-input');
        input.value = participantInputValues[p]['食材'];
    });

    calculateAndRender();
    saveData();
}

function updateParticipantRows(tbody, selectedParticipants, templateId, configureClone) {
    if (!tbody) return;
    const template = document.getElementById(templateId)?.content;
    if (!template) return;

    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();
    selectedParticipants.forEach(p => {
        const clone = document.importNode(template, true);
        configureClone(clone, p);
        fragment.appendChild(clone);
    });
    tbody.appendChild(fragment);
}

function calculateAndRender() {
    const inputs = getInputs();
    const results = performCalculations(inputs);
    updateUIWithResults(results);
    updateSummaryTable(results);
    adjustAllInputWidths();
}

function updateSummaryTable(results) {
    const { calculationResults, dynamicSections } = results;
    const summaryTbody = document.querySelector("#summary-table tbody");
    const summaryThead = document.querySelector("#summary-table thead");

    if (!summaryTbody || !summaryThead) return;

    // ヘッダーの動的生成
    const headers = ['参加者', 'チケット', 'ビアサーバー', '食材'];
    if (dynamicSections) {
        dynamicSections.forEach(sec => headers.push(sec.name.replace(/料金$/, '')));
    }
    headers.push('最終収支');
    summaryThead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    summaryTbody.innerHTML = "";

    if (!calculationResults) return;

    const fragment = document.createDocumentFragment();
    for (const participant in calculationResults) {
        if (Object.hasOwnProperty.call(calculationResults, participant)) {
            const result = calculationResults[participant];
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = participant;
            row.appendChild(nameCell);

            // 静的セクションの収支
            const ticketBalanceCell = document.createElement('td');
            updateBalanceCell(ticketBalanceCell, result.balance);
            row.appendChild(ticketBalanceCell);

            const beerBalanceCell = document.createElement('td');
            updateBalanceCell(beerBalanceCell, result.beerBalance);
            row.appendChild(beerBalanceCell);

            const foodBalanceCell = document.createElement('td');
            updateBalanceCell(foodBalanceCell, result.foodBalance);
            row.appendChild(foodBalanceCell);

            // 動的セクションの収支
            if (dynamicSections) {
                dynamicSections.forEach(sec => {
                    const dynamicBalanceCell = document.createElement('td');
                    updateBalanceCell(dynamicBalanceCell, result[`${sec.name}_balance`]);
                    row.appendChild(dynamicBalanceCell);
                });
            }

            // 最終収支
            const totalBalanceCell = document.createElement('td');
            updateBalanceCell(totalBalanceCell, result.totalBalance);
            row.appendChild(totalBalanceCell);

            fragment.appendChild(row);
        }
    }
    summaryTbody.appendChild(fragment);
}

function updateUIWithResults(results) {
    const { calculationResults, perPersonExpense, perPersonBeerServerExpense, perPersonFoodExpense, dynamicSectionTotals } = results;

    document.querySelectorAll("#calculation-table .calculation-table__header-row").forEach(headerRow => {
        const p = headerRow.dataset.participant;
        if (calculationResults[p]) {
            const valueRow = headerRow.nextElementSibling.nextElementSibling.nextElementSibling;
            if (valueRow) {
                valueRow.querySelector(".total-payment").textContent = formatNumberWithCommas(calculationResults[p].totalPayment);
                valueRow.querySelector(".per-person-payment").textContent = formatNumberWithCommas(Math.round(perPersonExpense));
                updateBalanceCell(valueRow.querySelector(".balance"), calculationResults[p].balance);
            }
        }
    });

    updateStandardTableUI('#beer-server-calculation-table', calculationResults, perPersonBeerServerExpense, 'beerBalance', 'beerServerPayment');
    updateStandardTableUI('#food-calculation-table', calculationResults, perPersonFoodExpense, 'foodBalance', 'foodPayment');

    // 動的セクションのUIを更新
    if (dynamicSectionTotals) {
        for (const sectionName in dynamicSectionTotals) {
            const section = document.querySelector(`.content-section[data-section-name="${sectionName}"]`);
            if (section) {
                const table = section.querySelector('table');
                const perPerson = dynamicSectionTotals[sectionName].perPerson;
                updateStandardTableUI(`#${table.id}`, calculationResults, perPerson, `${sectionName}_balance`, `${sectionName}_payment`);
            }
        }
    }
}

function updateStandardTableUI(tableSelector, results, perPerson, balanceKey, paymentKey) {
    document.querySelectorAll(`${tableSelector} tbody tr`).forEach(row => {
        const p = row.dataset.participant;
        if (results[p] && results[p][balanceKey] !== undefined) {
            row.querySelector(".total-payment").textContent = formatNumberWithCommas(results[p][paymentKey]);
            row.querySelector(".per-person-payment").textContent = formatNumberWithCommas(Math.round(perPerson));
            updateBalanceCell(row.querySelector(".balance"), results[p][balanceKey]);
        }
    });
}

function updateBalanceCell(cell, balanceValue) {
    if (!cell) return;
    const roundedBalance = Math.round(balanceValue);
    cell.className = 'balance';
    if (roundedBalance > 0) {
        cell.textContent = `貰う: ${formatNumberWithCommas(roundedBalance)}`;
        cell.classList.add('balance--positive');
    } else if (roundedBalance < 0) {
        cell.textContent = `払う: ${formatNumberWithCommas(Math.abs(roundedBalance))}`;
        cell.classList.add('balance--negative');
    } else {
        cell.textContent = "0";
    }
}

// --- New Section Creation -- -

function createNewSection() {
    const sectionId = `dynamic-section-${Date.now()}`;
    const rawSectionName = prompt("新しいテーブルの名前を入力してください:", "例：ガソリン代");
    if (!rawSectionName) return;
    const sectionNameForData = rawSectionName.endsWith('料金') ? rawSectionName : rawSectionName + "料金";

    const dynamicSectionsContainer = document.getElementById('dynamic-sections-container');
    const newSection = document.createElement('section');
    newSection.id = sectionId;
    newSection.className = 'content-section';
    newSection.innerHTML = `
        <h2 class="content-section__title dynamic-section__header">
            <input type="text" value="${rawSectionName}" onchange="this.parentNode.parentNode.dataset.sectionName = this.value + '料金'">
            <button class="btn btn--delete-section">削除</button>
        </h2>
        <div id="${sectionId}-participants-list" class="participant-checklist"></div>
        <button class="btn add-participant-global-btn">参加者を追加</button>
        <p class="section-summary">合計人数: <span class="participant-count" data-section="${sectionId}">0</span></p>
        <div class="table-container" id="${sectionId}-table-container"></div>
    `;
    newSection.dataset.sectionName = sectionNameForData;
    dynamicSectionsContainer.appendChild(newSection);

    // 新しいセクションのテーブルと参加者リストを初期化
    document.getElementById(`${sectionId}-table-container`).innerHTML = createGenericTableHTML(`${sectionId}-calculation-table`, ['参加者', sectionNameForData, '支払合計', '一人当たり', '払う/貰う']);
    renderParticipantsForSection(sectionId);
    setupDynamicSectionEventListeners(newSection);
}

function renderParticipantsForSection(sectionId) {
    const container = document.getElementById(`${sectionId}-participants-list`);
    if (!container) return;

    const template = document.getElementById('participant-template')?.content;
    if (!template) return;

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    participants.forEach(participant => {
        const clone = document.importNode(template, true);
        const label = clone.querySelector('.participant-checklist__label');
        const checkbox = clone.querySelector('.participant-checklist__checkbox');
        const name = clone.querySelector('.participant-checklist__name');

        name.textContent = participant;
        checkbox.value = participant;
        checkbox.checked = true; // デフォルトでチェック
        label.classList.add('participant-checklist__label--checked');

        checkbox.addEventListener('change', () => {
            label.classList.toggle('participant-checklist__label--checked');
            updateDynamicSectionTable(container.closest('.content-section'));
        });
        fragment.appendChild(clone);
    });
    container.appendChild(fragment);
    updateDynamicSectionTable(container.closest('.content-section'));
}

function updateDynamicSectionTable(section) {
    if (!section) return;
    const sectionId = section.id;
    const selectedParticipants = Array.from(section.querySelectorAll(`#${sectionId}-participants-list input:checked`)).map(cb => cb.value);
    
    updateParticipantCount(sectionId, selectedParticipants.length);

    const tbody = section.querySelector(`#${sectionId}-calculation-table tbody`);
    updateParticipantRows(tbody, selectedParticipants, 'standard-row-template', (clone, p) => {
        const row = clone.querySelector('tr');
        row.dataset.participant = p;
        row.querySelector('td:first-child').textContent = p;
        const input = row.querySelector('input');
        input.classList.add('dynamic-section-input');
        input.dataset.sectionId = sectionId;
        // You might want to load/save this value from/to a state object
        if (!participantInputValues[p]) participantInputValues[p] = {};
        if (!participantInputValues[p][section.dataset.sectionName]) participantInputValues[p][section.dataset.sectionName] = 0;
        input.value = participantInputValues[p][section.dataset.sectionName];
    });
    calculateAndRender();
}


function setupDynamicSectionEventListeners(section) {
    section.querySelector('.btn--delete-section').addEventListener('click', () => {
        if (confirm(`'${section.dataset.sectionName}'を削除しますか？`)) {
            section.remove();
            calculateAndRender(); // Re-calculate after deletion
        }
    });
     section.addEventListener('input', (event) => {
        if (event.target.classList.contains('dynamic-section-input')) {
            const participant = event.target.closest('tr').dataset.participant;
            const value = parseInt(event.target.value, 10) || 0;
            const sectionName = section.dataset.sectionName;
            if (participant && sectionName && participantInputValues[participant]) {
                 if (!participantInputValues[participant][sectionName]) {
                    participantInputValues[participant][sectionName] = {};
                }
                participantInputValues[participant][sectionName] = value;
                calculateAndRender();
                saveData();
            }
        }
    });
}


// --- Event Listeners ---

function handleTableInput(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.classList.contains('form-input')) return;

    const participant = target.closest('[data-participant]')?.dataset.participant;
    let type;

    if (target.classList.contains('ticket-quantity-input')) type = target.dataset.ticketType;
    else if (target.classList.contains('fee-input')) type = '手数料';
    else if (target.classList.contains('beer-server-input')) type = 'ビアサーバー';
    else if (target.classList.contains('food-input')) type = '食材';

    if (participant && type && participantInputValues[participant]) {
        participantInputValues[participant][type] = parseInt(target.value) || 0;
        calculateAndRender();
        saveData();
    }
}

export function setupEventListeners() {
    // Participant checklist changes
    document.getElementById("participants-list").addEventListener("change", updateTables);
    document.getElementById("beer-server-participants-list").addEventListener("change", updateTables);
    document.getElementById("food-participants-list").addEventListener("change", updateTables);

    // Pricing table changes
    document.getElementById("pricing-table-container").addEventListener("input", (event) => {
        if(event.target.classList.contains('ticket-price')) {
            updateTables();
            saveData();
        }
    });

    // Event delegation for all other inputs in tables
    document.querySelector('.main-content').addEventListener('input', handleTableInput);

    // Add new participant button
    document.addEventListener("click", (event) => {
        if (event.target.classList.contains("add-participant-global-btn")) {
            const newParticipant = prompt("新しい参加者の名前を入力してください:");
            if (newParticipant && !participants.includes(newParticipant)) {
                participants.push(newParticipant);
                renderParticipants();
                saveData();
            } else if (newParticipant) {
                alert("その名前はすでに存在します。");
            }
        }
    });

    // Add new table section button
    document.getElementById('add-new-table-section-btn').addEventListener('click', createNewSection);

    // Auto-fill 0 on blur
    document.addEventListener('blur', (event) => {
        // Check if the target is an Element and has the matches method
        if (event.target instanceof Element && event.target.matches('input[type="number"].form-input')) {
            if (event.target.value === "") {
                event.target.value = "0";
                event.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }, true);
}