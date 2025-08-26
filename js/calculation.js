// calculation.js

export function getInputs() {
    const selectedParticipants = Array.from(document.querySelectorAll('#participants-list input:checked')).map(cb => cb.value);
    const selectedBeerServerParticipants = Array.from(document.querySelectorAll('#beer-server-participants-list input:checked')).map(cb => cb.value);
    const selectedFoodParticipants = Array.from(document.querySelectorAll('#food-participants-list input:checked')).map(cb => cb.value);

    const currentTicketPrices = {};
    document.querySelectorAll(".ticket-price").forEach(input => {
        currentTicketPrices[input.dataset.ticketType] = parseInt(input.value) || 0;
    });

    const participantData = {};
    const dynamicSections = [];
    const allActiveParticipants = new Set([...selectedParticipants, ...selectedBeerServerParticipants, ...selectedFoodParticipants]);

    // 動的セクションの情報を収集
    document.querySelectorAll('.content-section[data-section-name]').forEach(section => {
        const sectionId = section.id;
        const sectionName = section.dataset.sectionName;
        const selected = Array.from(section.querySelectorAll(`#${sectionId}-participants-list input:checked`)).map(cb => cb.value);
        dynamicSections.push({ id: sectionId, name: sectionName, participants: selected });
        selected.forEach(p => allActiveParticipants.add(p));
    });

    allActiveParticipants.forEach(p => {
        participantData[p] = { テント券: 0, 駐車券: 0, 手数料: 0, ビアサーバー: 0, 食材: 0 };
        dynamicSections.forEach(sec => {
            participantData[p][sec.name] = 0;
        });
    });

    // 静的セクションのデータ取得
    document.querySelectorAll("#calculation-table .calculation-table__header-row").forEach(headerRow => {
        const participant = headerRow.dataset.participant;
        if (participantData[participant]) {
            const inputRow = headerRow.nextElementSibling;
            if (inputRow) {
                participantData[participant]["テント券"] = parseInt(inputRow.querySelector('.ticket-quantity-input[data-ticket-type="テント券"]').value) || 0;
                participantData[participant]["駐車券"] = parseInt(inputRow.querySelector('.ticket-quantity-input[data-ticket-type="駐車券"]').value) || 0;
                participantData[participant]["手数料"] = parseInt(inputRow.querySelector(".fee-input").value) || 0;
            }
        }
    });

    document.querySelectorAll("#beer-server-calculation-table tbody tr").forEach(row => {
        const participant = row.dataset.participant;
        if (selectedBeerServerParticipants.includes(participant) && participantData[participant]) {
            participantData[participant]["ビアサーバー"] = parseInt(row.querySelector(".beer-server-input").value) || 0;
        }
    });

    document.querySelectorAll("#food-calculation-table tbody tr").forEach(row => {
        const participant = row.dataset.participant;
        if (selectedFoodParticipants.includes(participant) && participantData[participant]) {
            participantData[participant]["食材"] = parseInt(row.querySelector(".food-input").value) || 0;
        }
    });

    // 動的セクションのデータ取得
    dynamicSections.forEach(sec => {
        document.querySelectorAll(`#${sec.id}-calculation-table tbody tr`).forEach(row => {
            const participant = row.dataset.participant;
            if (sec.participants.includes(participant) && participantData[participant]) {
                participantData[participant][sec.name] = parseInt(row.querySelector(".dynamic-section-input").value) || 0;
            }
        });
    });

    return { selectedParticipants, selectedBeerServerParticipants, selectedFoodParticipants, dynamicSections, currentTicketPrices, participantData };
}

export function performCalculations(inputs) {
    const { selectedParticipants, selectedBeerServerParticipants, selectedFoodParticipants, dynamicSections, currentTicketPrices, participantData } = inputs;
    let totalTentTickets = 0, totalParkingTickets = 0, totalCommission = 0, totalExpense = 0, totalBeerServerExpense = 0, totalFoodExpense = 0;
    const calculationResults = {};
    const dynamicSectionTotals = {};

    const allParticipantsInTables = new Set([...selectedParticipants, ...selectedBeerServerParticipants, ...selectedFoodParticipants]);
    dynamicSections.forEach(sec => {
        sec.participants.forEach(p => allParticipantsInTables.add(p));
        dynamicSectionTotals[sec.name] = { total: 0, perPerson: 0 };
    });


    allParticipantsInTables.forEach(p => {
        calculationResults[p] = { totalPayment: 0, beerServerPayment: 0, foodPayment: 0, balance: 0, beerBalance: 0, foodBalance: 0 };
        dynamicSections.forEach(sec => {
            calculationResults[p][`${sec.name}_payment`] = 0;
            calculationResults[p][`${sec.name}_balance`] = 0;
        });
    });

    // 静的セクションの計算
    selectedParticipants.forEach(p => {
        const tentVal = participantData[p]["テント券"], parkingVal = participantData[p]["駐車券"], fee = participantData[p]["手数料"];
        totalTentTickets += tentVal;
        totalParkingTickets += parkingVal;
        totalCommission += fee;
        const totalPayment = (tentVal * currentTicketPrices["テント券"]) + (parkingVal * currentTicketPrices["駐車券"]) + fee;
        calculationResults[p].totalPayment = totalPayment;
        totalExpense += totalPayment;
    });

    selectedBeerServerParticipants.forEach(p => {
        const beerServerCost = participantData[p]["ビアサーバー"];
        calculationResults[p].beerServerPayment = beerServerCost;
        totalBeerServerExpense += beerServerCost;
    });

    selectedFoodParticipants.forEach(p => {
        const foodCost = participantData[p]["食材"];
        calculationResults[p].foodPayment = foodCost;
        totalFoodExpense += foodCost;
    });
    
    // 動的セクションの計算
    dynamicSections.forEach(sec => {
        sec.participants.forEach(p => {
            const cost = participantData[p][sec.name];
            calculationResults[p][`${sec.name}_payment`] = cost;
            dynamicSectionTotals[sec.name].total += cost;
        });
    });


    const perPersonExpense = selectedParticipants.length > 0 ? totalExpense / selectedParticipants.length : 0;
    const perPersonBeerServerExpense = selectedBeerServerParticipants.length > 0 ? totalBeerServerExpense / selectedBeerServerParticipants.length : 0;
    const perPersonFoodExpense = selectedFoodParticipants.length > 0 ? totalFoodExpense / selectedFoodParticipants.length : 0;
    
    dynamicSections.forEach(sec => {
        dynamicSectionTotals[sec.name].perPerson = sec.participants.length > 0 ? dynamicSectionTotals[sec.name].total / sec.participants.length : 0;
    });

    // バランス計算
    allParticipantsInTables.forEach(p => {
        let totalBalance = 0;
        if (selectedParticipants.includes(p)) {
            const balance = calculationResults[p].totalPayment - perPersonExpense;
            calculationResults[p].balance = balance;
            totalBalance += balance;
        }
        if (selectedBeerServerParticipants.includes(p)) {
            const beerBalance = calculationResults[p].beerServerPayment - perPersonBeerServerExpense;
            calculationResults[p].beerBalance = beerBalance;
            totalBalance += beerBalance;
        }
        if (selectedFoodParticipants.includes(p)) {
            const foodBalance = calculationResults[p].foodPayment - perPersonFoodExpense;
            calculationResults[p].foodBalance = foodBalance;
            totalBalance += foodBalance;
        }
        dynamicSections.forEach(sec => {
            if (sec.participants.includes(p)) {
                const dynamicBalance = calculationResults[p][`${sec.name}_payment`] - dynamicSectionTotals[sec.name].perPerson;
                calculationResults[p][`${sec.name}_balance`] = dynamicBalance;
                totalBalance += dynamicBalance;
            }
        });
        calculationResults[p].totalBalance = totalBalance;
    });


    return { calculationResults, perPersonExpense, perPersonBeerServerExpense, perPersonFoodExpense, dynamicSectionTotals, totalTentTickets, totalParkingTickets, dynamicSections };
}
