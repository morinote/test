
import { participants } from './config.js';

export let participantInputValues = {};
export let ticketPrices = {};

export function saveData() {
    localStorage.setItem("participantInputValues", JSON.stringify(participantInputValues));
    const currentTicketPrices = {};
    document.querySelectorAll("#pricing-table .ticket-price").forEach(input => {
        currentTicketPrices[input.dataset.ticketType] = parseInt(input.value) || 0;
    });
    localStorage.setItem("ticketPrices", JSON.stringify(currentTicketPrices));
}

export function loadData() {
    const savedParticipantInputValues = localStorage.getItem("participantInputValues");
    if (savedParticipantInputValues) {
        participantInputValues = JSON.parse(savedParticipantInputValues);
        participants.forEach(participant => {
            if (participantInputValues[participant]) {
                if (participantInputValues[participant]['mainチェック'] === undefined) {
                    participantInputValues[participant]['mainチェック'] = true;
                }
                if (participantInputValues[participant]['ビアサーバーチェック'] === undefined) {
                    participantInputValues[participant]['ビアサーバーチェック'] = true;
                }
                if (participantInputValues[participant]['食材チェック'] === undefined) {
                    participantInputValues[participant]['食材チェック'] = true;
                }
            }
        });
    } else {
        participants.forEach(participant => {
            participantInputValues[participant] = {
                テント券: 0, 駐車券: 0, 手数料: 0, ビアサーバー: 0, ビアサーバーチェック: true, 食材: 0, 食材チェック: true, mainチェック: true
            };
        });
    }

    const savedTicketPrices = localStorage.getItem("ticketPrices");
    if (savedTicketPrices) {
        ticketPrices = JSON.parse(savedTicketPrices);
        document.querySelectorAll("#pricing-table .ticket-price").forEach(input => {
            if (ticketPrices[input.dataset.ticketType] !== undefined) {
                input.value = ticketPrices[input.dataset.ticketType];
            }
        });
    }
}
