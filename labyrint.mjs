import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";


const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let levelData = readMapFile(levels[startingLevel]);
let level = levelData;
let levelNr = 1;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
}


let isDirty = true;

let playerPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const PORTAL = "O";

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, PORTAL];

let eventText = "";
let teleported = false;

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
}

class Labyrinth {

    update() {

        if (playerPos.row == null) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
        }

        let tRow = playerPos.row + (1 * drow);
        let tCol = playerPos.col + (1 * dcol);

        if (THINGS.includes(level[tRow][tCol])) { // Is there anything where Hero is moving to

            let currentItem = level[tRow][tCol];
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventText = `Player gained $${loot}`;

                // Move the HERO
                if (teleported == true){
                    level[playerPos.row][playerPos.col] = PORTAL;
                    teleported = false;
                } else {
                    level[playerPos.row][playerPos.col] = EMPTY;
                }
                level[tRow][tCol] = HERO;

                // Update the HERO
                playerPos.row = tRow;
                playerPos.col = tCol; 
            } else if (currentItem == PORTAL){
                let portal = [tRow, tCol];
                level[portal[0]][portal[1]] = EMPTY;
                level[playerPos.row][playerPos.col] = EMPTY;
 
                for (let row = 0; row < level.length; row++) {
                    for (let col = 0; col < level[row].length; col++) {
                        if (level[row][col] == PORTAL) {
                            playerPos.row = row;
                            playerPos.col = col;
                            break;
                        }
                    }
                }
                level[portal[0]][portal[1]] = PORTAL;
                level[playerPos.row][playerPos.col] = HERO;
                teleported = true;
            } else {
                // Move the HERO
                if (teleported == true){
                    level[playerPos.row][playerPos.col] = PORTAL;
                    teleported = false;
                } else {
                    level[playerPos.row][playerPos.col] = EMPTY;
                }
                level[tRow][tCol] = HERO;

                // Update the HERO
                playerPos.row = tRow;
                playerPos.col = tCol; 
            }

            // Make the draw function draw.
            isDirty = true;
        } else {
            direction *= -1;
        }

        if (playerPos.row == 0 || playerPos. row == level.length - 1 || playerPos.col == 0 || playerPos.col == level[playerPos.row].length -1){
            levelNr += 1;
            levelData = readMapFile(levels[levelNr]);
            level = levelData;
            playerPos.row = null;
        }
    }

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        rendering += renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendering += rowRendering;
        }

        console.log(rendering);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.cash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}


export default Labyrinth;