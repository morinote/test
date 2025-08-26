
import { loadData } from './state.js';
import { initializeTables, renderParticipants, setupEventListeners, adjustAllInputWidths } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    initializeTables();
    loadData();
    renderParticipants();
    setupEventListeners();
    adjustAllInputWidths();
});
