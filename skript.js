// Globale Variable zur Speicherung aller Spieler
let allPlayers = [];
const groupLetters = ['A', 'B', 'C', 'D'];
let currentResultCell = null; // Speichert die Zelle, die das Modal geöffnet hat
let isKnockoutModal = false; // Flag, um zu unterscheiden, ob K.O.-Modal offen ist

// Speichert die Match-Ergebnisse der Gruppenphase separat
// Format: { groupA: [{player1: 'Name1', player2: 'Name2', result: '3:1'}, ...], ... }
let groupMatchResults = {};

// Speichert alle K.O.-Match-IDs und ihre zugehörigen Spieler-Felder
const knockoutMatches = {
    'vf1': { player1: 'vf1_player1', player2: 'vf1_player2', nextPlayer: 'hf1_player1' },
    'vf2': { player1: 'vf2_player1', player2: 'vf2_player2', nextPlayer: 'hf1_player2' },
    'vf3': { player1: 'vf3_player1', player2: 'vf3_player2', nextPlayer: 'hf2_player1' },
    'vf4': { player1: 'vf4_player1', player2: 'vf4_player2', nextPlayer: 'hf2_player2' },
    'hf1': { player1: 'hf1_player1', player2: 'hf1_player2', nextPlayer: 'final_player1' },
    'hf2': { player1: 'hf2_player1', player2: 'hf2_player2', nextPlayer: 'final_player2' },
    'final': { player1: 'final_player1', player2: 'final_player2', nextPlayer: 'tournament_champion' }
};

/**
 * Funktion zum Umschalten der Sichtbarkeit von Sektionen.
 * @param {string} sectionId - Die ID des zu schaltenden Abschnitts (z.B. 'playerSetupSection').
 */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section.style.display === 'block' || section.style.display === '') {
        section.style.display = 'none';
    } else {
        section.style.display = 'block';
    }
    // Optional: Füge oder entferne eine Klasse für CSS-Transitionen
    // section.classList.toggle('open');
}


// Funktion zum Parsen eines Ergebnis-Strings (z.B. "3:1")
function parseResult(resultString) {
    if (!resultString || typeof resultString !== 'string' || !resultString.includes(':')) {
        return { won: 0, lost: 0, isValid: false };
    }
    const parts = resultString.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { won: parts[0], lost: parts[1], isValid: true };
    }
    return { won: 0, lost: 0, isValid: false };
}

/**
 * Generiert einen optimierten Spielplan für eine Gruppe (Round Robin).
 * Priorisiert, dass Spieler nicht direkt aufeinanderfolgende Matches haben.
 * Dies ist eine Heuristik für 4 Spieler (6 Matches).
 * @param {Array<Object>} players - Die 4 Spielerobjekte einer Gruppe.
 * @returns {Array<Object>} Eine geordnete Liste von Match-Objekten.
 */
function getOptimizedGroupSchedule(players) {
    const p = players.map(player => player.name); // Nur Namen für die Paarungen

    // Für 4 Spieler (P1, P2, P3, P4), eine mögliche Reihenfolge,
    // um aufeinanderfolgende Spiele desselben Spielers zu vermeiden.
    // Dies ist ein Standard-Round-Robin-Zeitplan ("Circle Method").
    const schedule = [
        { player1: p[0], player2: p[3] }, // P1 vs P4
        { player1: p[1], player2: p[2] }, // P2 vs P3
        { player1: p[3], player2: p[1] }, // P4 vs P2
        { player1: p[0], player2: p[2] }, // P1 vs P3
        { player1: p[2], player2: p[3] }, // P3 vs P4
        { player1: p[0], player2: p[1] }  // P1 vs P2
    ];
    return schedule;
}

/**
 * Richtet Spieler ein und weist sie Gruppen zu.
 * Wird beim Klicken auf "Spieler einrichten" aufgerufen.
 */
function setupPlayersAndGroups() {
    const playerNamesInput = document.getElementById('playerNamesInput').value;
    const names = playerNamesInput.split('\n').map(name => name.trim()).filter(name => name !== '');

    if (names.length !== 16) {
        alert('Bitte gib genau 16 Spielernamen ein, jeden in einer neuen Zeile.');
        return;
    }

    // Bestätigungsabfrage, wenn bereits Spieler vorhanden sind
    if (allPlayers.length > 0) {
        const confirmReset = confirm('Es sind bereits Spieler und Ergebnisse vorhanden. Möchtest du wirklich alle alten Daten löschen und neue Spieler einrichten?');
        if (!confirmReset) {
            return; // Abbruch, wenn der Benutzer nicht bestätigen will
        }
    }

    // Daten zurücksetzen
    allPlayers = [];
    groupMatchResults = {}; // Alte Ergebnisse löschen
    
    // UI leeren
    const assignedPlayerListBody = document.getElementById('assignedPlayerList').querySelector('tbody');
    assignedPlayerListBody.innerHTML = ''; 

    groupLetters.forEach(groupLetter => {
        const matchesListDiv = document.getElementById(`group${groupLetter}_matches_list`);
        matchesListDiv.innerHTML = '<h3>Spiele Gruppe ' + groupLetter + '</h3>';
        const rankingTableBody = document.getElementById(`group${groupLetter}_ranking`).querySelector('tbody');
        rankingTableBody.innerHTML = '';
    });

    Object.keys(knockoutMatches).forEach(matchId => {
        const matchInfo = knockoutMatches[matchId];
        document.getElementById(matchInfo.player1).textContent = '';
        document.getElementById(matchInfo.player2).textContent = '';
        const winnerCell = document.querySelector(`.winner.result-cell[data-match-id="${matchId}"]`);
        if (winnerCell) {
            winnerCell.textContent = '';
            winnerCell.classList.remove('played');
        }
    });
    document.getElementById('tournament_champion').textContent = '';

    // Spieler den Gruppen zuweisen (wie zuvor)
    for (let i = 0; i < names.length; i++) {
        const player = {
            id: i + 1,
            name: names[i],
            group: groupLetters[Math.floor(i / 4)] // A, B, C, D
        };
        allPlayers.push(player);

        // Spieler zur zugewiesenen Spielerliste hinzufügen
        const row = assignedPlayerListBody.insertRow();
        row.innerHTML = `<td>${player.id}</td><td>${player.name}</td><td>${player.group}</td>`;
    }

    // Gruppentabellen und Matchlisten füllen
    groupLetters.forEach(groupLetter => {
        const groupPlayers = allPlayers.filter(p => p.group === groupLetter);
        if (groupPlayers.length === 4) {
            groupMatchResults[groupLetter] = getOptimizedGroupSchedule(groupPlayers).map(match => ({
                player1: match.player1,
                player2: match.player2,
                result: '' // Initial kein Ergebnis
            }));

            renderGroupMatches(groupLetter); // Matches in die Anzeige rendern

            // Ranking-Tabelle Initialisieren
            const rankingTableBody = document.getElementById(`group${groupLetter}_ranking`).querySelector('tbody');
            groupPlayers.forEach(player => {
                const row = rankingTableBody.insertRow();
                row.setAttribute('data-player-name', player.name);
                row.innerHTML = `
                    <td>${player.name}</td>
                    <td class="games-played">0</td>
                    <td class="wins">0</td>
                    <td class="losses">0</td>
                    <td class="frames-plus">0</td>
                    <td class="frames-minus">0</td>
                    <td class="frames-diff">0</td>
                    <td class="points">0</td>
                    <td class="rank"></td>
                `;
            });
            updateGroupResults(groupLetter); // Initialberechnung
        }
    });

    // Initialisiere K.O.-Felder mit Event-Listenern (falls noch nicht geschehen oder neu initialisiert werden muss)
    Object.keys(knockoutMatches).forEach(matchId => {
        const winnerCell = document.querySelector(`.winner.result-cell[data-match-id="${matchId}"]`);
        if (winnerCell) {
            winnerCell.onclick = () => openResultModal(winnerCell, true); // true für K.O.-Phase
        }
    });
    
    updateOverallNextGamesDisplay(); // Erste Anzeige der Gesamtübersicht der nächsten Spiele
    console.log('Spieler eingerichtet und Gruppen zugewiesen.');
    alert('Spieler erfolgreich eingerichtet und alte Daten gelöscht (falls vorhanden).');
    toggleSection('playerSetupSection'); // Spieler-Einrichten-Sektion wieder schließen
}

/**
 * Rendert die Matches für eine spezifische Gruppe in der Liste.
 * Markiert auch das nächste anstehende Spiel pro Gruppe.
 * @param {string} groupId - Die ID der Gruppe (z.B. 'A').
 */
function renderGroupMatches(groupId) {
    const matchesListDiv = document.getElementById(`group${groupId}_matches_list`);
    // Lösche alle alten Match-Items außer dem H3-Header
    Array.from(matchesListDiv.children).forEach(child => {
        if (child.tagName !== 'H3') {
            child.remove();
        }
    });

    const matches = groupMatchResults[groupId];
    let foundNextMatch = false; // Flag, um das erste ungespielte Match zu finden

    matches.forEach((match, index) => {
        const matchItem = document.createElement('div');
        matchItem.classList.add('group-match-item');
        if (match.result !== '') {
            matchItem.classList.add('played');
        } else if (!foundNextMatch) {
            // Markiere das erste ungespielte Match als "next-up"
            matchItem.classList.add('next-up');
            foundNextMatch = true;
        }

        matchItem.innerHTML = `
            <span class="players">${match.player1} vs. ${match.player2}</span>
            <span class="result-display" data-group="${groupId}" data-match-index="${index}">${match.result}</span>
        `;
        // Füge Event Listener direkt zum result-display Span hinzu
        matchItem.querySelector('.result-display').onclick = (event) => {
            const targetCell = event.currentTarget;
            openResultModal(targetCell, false);
        };
        matchesListDiv.appendChild(matchItem);
    });
}


/**
 * Öffnet das Modal zur Ergebniseingabe.
 * @param {HTMLElement} cell - Die angeklickte Ergebnis-Zelle oder das Ergebnis-Display-Span.
 * @param {boolean} isKo - True, wenn es sich um ein K.O.-Match handelt, sonst false.
 */
function openResultModal(cell, isKoMatch) {
    currentResultCell = cell; // Die aktuelle Zelle speichern
    isKnockoutModal = isKoMatch;

    let player1Name, player2Name;

    if (isKoMatch) {
        const matchId = cell.dataset.matchId;
        const matchInfo = knockoutMatches[matchId];
        player1Name = document.getElementById(matchInfo.player1).textContent.trim();
        player2Name = document.getElementById(matchInfo.player2).textContent.trim();

        // Wenn Spieler nicht gesetzt sind, Modal nicht öffnen
        if (!player1Name || !player2Name) {
            alert('Bitte trage zuerst die Spieler in dieses K.O.-Match ein.');
            currentResultCell = null; // Zurücksetzen, da Modal nicht geöffnet wird
            return;
        }
        document.getElementById('modalResultInput').placeholder = "Gewinnername"; // Angepasster Placeholder
    } else { // Gruppenphase
        // Hier greifen wir auf die Daten des `groupMatchResults`-Arrays zu
        const groupId = cell.dataset.group;
        const matchIndex = parseInt(cell.dataset.matchIndex);
        const match = groupMatchResults[groupId][matchIndex];
        player1Name = match.player1;
        player2Name = match.player2;
        document.getElementById('modalResultInput').placeholder = "z.B. 3:1"; // Standard Placeholder
    }
    
    document.getElementById('modalPlayer1').textContent = player1Name;
    document.getElementById('modalPlayer2').textContent = player2Name;
    
    // Vorhandenes Ergebnis vorab ausfüllen
    document.getElementById('modalResultInput').value = cell.textContent || '';

    document.getElementById('resultModal').style.display = 'flex'; // Modal anzeigen
    document.getElementById('modalResultInput').focus(); // Fokus auf Inputfeld setzen
}

/**
 * Schließt das Modal zur Ergebniseingabe.
 */
function closeModal() {
    document.getElementById('resultModal').style.display = 'none';
    currentResultCell = null;
    isKnockoutModal = false; // Flag zurücksetzen
}

/**
 * Speichert das Ergebnis aus dem Modal in der Zelle und aktualisiert die Tabelle.
 */
function saveResultFromModal() {
    if (!currentResultCell) return;

    const resultInput = document.getElementById('modalResultInput');
    const resultValue = resultInput.value.trim();
    const player1Name = document.getElementById('modalPlayer1').textContent;
    const player2Name = document.getElementById('modalPlayer2').textContent;

    if (isKnockoutModal) {
        // K.O.-Phase: Hier wird der Gewinnername direkt eingegeben
        if (resultValue === player1Name || resultValue === player2Name) {
            currentResultCell.textContent = resultValue;
            currentResultCell.classList.add('played'); // Markierung für gespieltes KO-Match
            updateKnockoutWinner(currentResultCell.dataset.matchId); // Gewinner in nächste Runde schieben
            closeModal();
        } else if (resultValue === '') {
            currentResultCell.textContent = '';
            currentResultCell.classList.remove('played');
            clearNextRoundPlayer(currentResultCell.dataset.matchId); // Gewinner aus nächster Runde entfernen
            closeModal();
        } else {
            alert('Bitte gib den genauen Namen des Gewinners ein (entweder ' + player1Name + ' oder ' + player2Name + ').');
            return; // Nicht schließen, wenn ungültig
        }
    } else {
        // Gruppenphase: Hier wird das Ergebnis (z.B. "3:1") eingegeben
        const groupId = currentResultCell.dataset.group;
        const matchIndex = parseInt(currentResultCell.dataset.matchIndex);

        if (resultValue === '') {
            groupMatchResults[groupId][matchIndex].result = '';
        } else {
            const parsedResult = parseResult(resultValue);
            if (parsedResult.isValid) {
                groupMatchResults[groupId][matchIndex].result = resultValue;
            } else {
                alert('Ungültiges Ergebnisformat. Bitte verwende "GewonneneFrames:VerloreneFrames" (z.B. 3:1).');
                return; // Nicht schließen, wenn ungültig
            }
        }
        renderGroupMatches(groupId); // Die Liste neu rendern, um Klassen zu aktualisieren (inkl. next-up)
        updateGroupResults(groupId); // Rangliste aktualisieren
        closeModal();
    }
}


/**
 * Aktualisiert die Rangliste für eine bestimmte Gruppe basierend auf den Ergebnissen.
 * @param {string} groupId - Die ID der Gruppe (z.B. 'A', 'B', 'C', 'D').
 */
function updateGroupResults(groupId) {
    console.log(`Updating results for Group ${groupId}`);
    const rankingTableBody = document.getElementById(`group${groupId}_ranking`).querySelector('tbody');
    
    // Alle Spieler dieser Gruppe holen
    const groupPlayers = allPlayers.filter(p => p.group === groupId);
    const playerNamesInGroup = groupPlayers.map(p => p.name);

    // Initialisiere Spielerdaten für diese Gruppe
    let playerData = playerNamesInGroup.map(name => ({
        name: name,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        framesPlus: 0,
        framesMinus: 0,
        framesDiff: 0,
        points: 0
    }));

    // Ergebnisse auslesen und verarbeiten aus `groupMatchResults`
    const matches = groupMatchResults[groupId];
    matches.forEach(match => {
        const result = parseResult(match.result);

        if (result.isValid) {
            const player1Index = playerData.findIndex(p => p.name === match.player1);
            const player2Index = playerData.findIndex(p => p.name === match.player2);

            if (player1Index !== -1 && player2Index !== -1) {
                playerData[player1Index].gamesPlayed++;
                playerData[player2Index].gamesPlayed++;

                playerData[player1Index].framesPlus += result.won;
                playerData[player1Index].framesMinus += result.lost;
                playerData[player2Index].framesPlus += result.lost;
                playerData[player2Index].framesMinus += result.won;

                if (result.won > result.lost) {
                    playerData[player1Index].wins++;
                    playerData[player1Index].points += 2;
                    playerData[player2Index].losses++;
                } else if (result.won < result.lost) {
                    playerData[player1Index].losses++;
                    playerData[player2Index].wins++;
                    playerData[player2Index].points += 2;
                }
            }
        }
    });

    // Frame-Differenz berechnen (gamesPlayed muss hier nicht durch 2 geteilt werden, da jedes Match nur einmal in `groupMatchResults` existiert)
    playerData.forEach(player => {
        player.framesDiff = player.framesPlus - player.framesMinus;
    });

    // Spieler nach Punkten, dann Frame-Differenz, dann Frames+ sortieren
    playerData.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        if (b.framesDiff !== a.framesDiff) {
            return b.framesDiff - a.framesDiff;
        }
        return b.framesPlus - a.framesPlus;
    });

    // Rangliste im HTML aktualisieren
    rankingTableBody.innerHTML = ''; // Leere alte Einträge
    playerData.forEach((player, index) => {
        const row = rankingTableBody.insertRow();
        row.setAttribute('data-player-name', player.name);
        row.innerHTML = `
            <td>${player.name}</td>
            <td class="games-played">${player.gamesPlayed}</td>
            <td class="wins">${player.wins}</td>
            <td class="losses">${player.losses}</td>
            <td class="frames-plus">${player.framesPlus}</td>
            <td class="frames-minus">${player.framesMinus}</td>
            <td class="frames-diff">${player.framesDiff}</td>
            <td class="points">${player.points}</td>
            <td class="rank">${index + 1}</td>
        `;
    });
    updateOverallNextGamesDisplay(); // Gesamtübersicht der nächsten Spiele nach jeder Ergebniseingabe aktualisieren
}


/**
 * Zeigt alle ungespielten Matches (Gruppen- und K.O.-Phase) in der Gesamtübersicht an.
 */
function updateOverallNextGamesDisplay() {
    const nextGamesSection = document.getElementById('nextGamesSection');
    nextGamesSection.innerHTML = '<h3>Ungespielte Matches (Gesamtübersicht):</h3>';
    let hasUpcomingGames = false;

    // Zuerst Gruppenphasen-Matches durchgehen
    groupLetters.forEach(groupLetter => {
        const matches = groupMatchResults[groupLetter];
        if (matches) {
            matches.forEach(match => {
                if (match.result.trim() === '') { // Wenn das Ergebnis leer ist
                    const gameItem = document.createElement('div');
                    gameItem.classList.add('next-game-item');
                    gameItem.innerHTML = `Gruppe ${groupLetter}: <span class="next-game-player">${match.player1}</span> vs. <span class="next-game-player">${match.player2}</span>`;
                    nextGamesSection.appendChild(gameItem);
                    hasUpcomingGames = true;
                }
            });
        }
    });

    // Dann K.O.-Matches prüfen
    for (const matchId in knockoutMatches) {
        const matchInfo = knockoutMatches[matchId];
        const player1Element = document.getElementById(matchInfo.player1);
        const player2Element = document.getElementById(matchInfo.player2);
        const winnerCell = document.querySelector(`.winner.result-cell[data-match-id="${matchId}"]`);

        // Prüfen, ob Spieler da sind und ob ein Gewinner eingetragen ist
        if (player1Element && player2Element && player1Element.textContent.trim() !== '' && player2Element.textContent.trim() !== '' && winnerCell.textContent.trim() === '') {
            const player1Name = player1Element.textContent.trim();
            const player2Name = player2Element.textContent.trim();

            const gameItem = document.createElement('div');
            gameItem.classList.add('next-game-item');
            const matchRound = matchId.startsWith('vf') ? 'Viertelfinale' : (matchId.startsWith('hf') ? 'Halbfinale' : 'Finale');
            gameItem.innerHTML = `${matchRound}: <span class="next-game-player">${player1Name}</span> vs. <span class="next-game-player">${player2Name}</span>`;
            nextGamesSection.appendChild(gameItem);
            hasUpcomingGames = true;
        }
    }


    if (!hasUpcomingGames) {
        const p = document.createElement('p');
        p.textContent = 'Alle Matches abgeschlossen!';
        nextGamesSection.innerHTML = ''; // Leere vorherigen Inhalt
        nextGamesSection.appendChild(p);
    }
}


/**
 * Überträgt den Gewinner eines K.O.-Matches in die nächste Runde.
 * @param {string} matchId - Die ID des Matches (z.B. 'vf1', 'hf1', 'final').
 */
function updateKnockoutWinner(matchId) {
    const winnerElement = document.querySelector(`.winner.result-cell[data-match-id="${matchId}"]`);
    const winnerName = winnerElement.textContent.trim();
    const matchInfo = knockoutMatches[matchId];

    if (!matchInfo || !matchInfo.nextPlayer) {
        console.warn(`Keine Informationen für das nächste Spiel für MatchId: ${matchId}`);
        return;
    }
    
    const nextPlayerElement = document.getElementById(matchInfo.nextPlayer);

    if (nextPlayerElement) {
        nextPlayerElement.textContent = winnerName;
        console.log(`Winner "${winnerName}" from ${matchId} advanced to ${matchInfo.nextPlayer}.`);
    } else {
        console.warn(`Ziel-Element ${matchInfo.nextPlayer} nicht gefunden.`);
    }
    updateOverallNextGamesDisplay(); // Nächste Spiele aktualisieren
}

/**
 * Löscht Spieler aus der nächsten K.O.-Runde, wenn der Gewinner entfernt wurde.
 * @param {string} matchId - Die ID des Matches.
 */
function clearNextRoundPlayer(matchId) {
    const matchInfo = knockoutMatches[matchId];
    if (matchInfo && matchInfo.nextPlayer) {
        const nextPlayerElement = document.getElementById(matchInfo.nextPlayer);
        if (nextPlayerElement) {
            nextPlayerElement.textContent = '';
        }
    }
    // Rekursiv weitere abhängige Felder leeren (z.B. HF löschen leert auch Finale)
    for (const key in knockoutMatches) {
        // Prüfen, ob das "player1" oder "player2" Feld des nächsten Matches dem geleerten Feld entspricht
        if ((matchInfo.nextPlayer && knockoutMatches[key].player1 === matchInfo.nextPlayer) || 
            (matchInfo.nextPlayer && knockoutMatches[key].player2 === matchInfo.nextPlayer)) {
            
            const dependentWinnerCell = document.querySelector(`.winner.result-cell[data-match-id="${key}"]`);
            if (dependentWinnerCell) {
                dependentWinnerCell.textContent = '';
                dependentWinnerCell.classList.remove('played');
                clearNextRoundPlayer(key); // Rekursiver Aufruf
            }
        }
    }
    updateOverallNextGamesDisplay(); // Nächste Spiele aktualisieren
}


/**
 * (Manuell aufrufen per Button) Überträgt die Top 2 Spieler jeder Gruppe in die Viertelfinalfelder.
 * Diese Funktion sollte aufgerufen werden, NACHDEM alle Gruppenphasen abgeschlossen sind.
 */
function qualifyGroupWinners() {
    const qualifiedPlayers = {};

    groupLetters.forEach(groupId => {
        const rankingTableBody = document.getElementById(`group${groupId}_ranking`).querySelector('tbody');
        const rows = Array.from(rankingTableBody.querySelectorAll('tr'));
        
        if (rows.length >= 2) {
            qualifiedPlayers[groupId] = [
                rows[0].querySelector('td:first-child').textContent.trim(), // Name des Erstplatzierten
                rows[1].querySelector('td:first-child').textContent.trim()  // Name des Zweitplatzierten
            ];
        } else {
            console.warn(`Nicht genug Spieler in Gruppe ${groupId}, um 2 zu qualifizieren.`);
            qualifiedPlayers[groupId] = [];
        }
    });

    // Trage die qualifizierten Spieler in die Viertelfinalfelder ein
    if (qualifiedPlayers.A && qualifiedPlayers.B && qualifiedPlayers.C && qualifiedPlayers.D &&
        qualifiedPlayers.A.length === 2 && qualifiedPlayers.B.length === 2 && 
        qualifiedPlayers.C.length === 2 && qualifiedPlayers.D.length === 2) {

        document.getElementById('vf1_player1').textContent = qualifiedPlayers.A[0] || ''; // Erster Gruppe A
        document.getElementById('vf1_player2').textContent = qualifiedPlayers.B[1] || ''; // Zweiter Gruppe B

        document.getElementById('vf2_player1').textContent = qualifiedPlayers.C[0] || ''; // Erster Gruppe C
        document.getElementById('vf2_player2').textContent = qualifiedPlayers.D[1] || ''; // Zweiter Gruppe D

        document.getElementById('vf3_player1').textContent = qualifiedPlayers.B[0] || ''; // Erster Gruppe B
        document.getElementById('vf3_player2').textContent = qualifiedPlayers.A[1] || ''; // Zweiter Gruppe A

        document.getElementById('vf4_player1').textContent = qualifiedPlayers.D[0] || ''; // Erster Gruppe D
        document.getElementById('vf4_player2').textContent = qualifiedPlayers.C[1] || ''; // Zweiter Gruppe C
        
        console.log("Qualifizierte Spieler wurden in das K.O.-Bracket übertragen.");
    } else {
        alert("Konnte nicht alle Spieler qualifizieren. Stelle sicher, dass alle Gruppenspiele eingegeben sind und jede Gruppe mindestens 2 qualifizierte Spieler hat.");
        console.error("Qualifizierung fehlgeschlagen: Nicht alle Gruppen hatten Top-2-Spieler.");
    }
    updateOverallNextGamesDisplay(); // Nächste Spiele aktualisieren
}


// Service Worker Registrierung
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registriert mit Scope: ', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker Registrierung fehlgeschlagen: ', error);
            });
    });
}

// Initialer Aufruf beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    // Event-Listener für das Modal, um es bei Klick außerhalb des Inhalts zu schließen
    const modal = document.getElementById('resultModal');
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Event-Listener, um Ergebnis bei Enter im Modal zu speichern
    document.getElementById('modalResultInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            saveResultFromModal();
        }
    });

    updateOverallNextGamesDisplay();
});
