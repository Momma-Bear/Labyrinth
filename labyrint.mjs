import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import oscillate from "./utils/oscilate.mjs";


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
const ENEMY_HORIZONTAL = "X";
const ENEMY_VERTICAL = "Z";

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, PORTAL];

let eventText = "";
let textDuration = 4;
let textTimer = textDuration;
let teleported = false;
let doorDisable = true;
let startingPoint = {
    row: null,
    col: null,
};
let backtracking = {};
let lootedItems = [];
let newLevel = false;
let enemyPositionsH = [];
let enemyPositionsV = [];
let enemyPatrol = 2;
//let enemyPatrolV = 2;
let npcDirection = 1;

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
}

class Labyrinth {

    update() {

        if (playerPos.row == null) {
            newLevel = false;
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        if (levelNr > 1){
                            startingPoint.row = row;
                            startingPoint.col = col;
                        }
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        } else if (playerPos != null && newLevel == true) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++){
                    if (level[row][col] == HERO && (row != playerPos.row || col != playerPos.col)){
                        level[row][col] = EMPTY;
                        isDirty = true;
                    }
                    if (lootedItems[levelNr-1].includes(level[row][col])){
                        level[row][col] = EMPTY;
                        isDirty = true;
                    }
                }
            
            }
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
            doorDisable = false;
            isDirty = true;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
            doorDisable = false;
            isDirty = true;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
            doorDisable = false;
            isDirty = true;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
            doorDisable = false;
            isDirty = true;
        }

        let tRow = playerPos.row + (1 * drow);
        let tCol = playerPos.col + (1 * dcol);

        if (THINGS.includes(level[tRow][tCol])) { // Is there anything where Hero is moving to

            let currentItem = level[tRow][tCol];
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                for(let i = 0; i < levelNr; i++){
                    if (lootedItems[levelNr-1] == undefined){
                        lootedItems.push([]);
                    }
                }
                lootedItems[levelNr-1].push(currentItem);
                eventText = `Player gained $${loot}`;
                moveHero(tRow, tCol); 
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
                moveHero(tRow, tCol);
            }

            // Make the draw function draw.
        } else {
            direction *= -1;
        }

        identifyEnemies(ENEMY_HORIZONTAL, enemyPositionsH);
        identifyEnemies(ENEMY_VERTICAL, enemyPositionsV);

        enemyPatrol += 1;
        for (let i = 0; i < enemyPositionsH.length; i++){
            let tNpcRow = enemyPositionsH[i][0];
            let tNpcCol = enemyPositionsH[i][1] + (1 * npcDirection);
            

            if (enemyPatrol >= 4){
                npcDirection *= -1;
                enemyPatrol = 0;
            }

            if (level[tNpcRow][tNpcCol] == EMPTY){
            level[enemyPositionsH[i][0]][enemyPositionsH[i][1]] = EMPTY;
            level[tNpcRow][tNpcCol] = ENEMY_HORIZONTAL;

            enemyPositionsH[i][1] = tNpcCol;
            isDirty = true;
            }/*else {
                if (level[tNpcRow][tNpcCol - (2 * npcDirection)] == EMPTY){
                    level[enemyPositionsV[i][0]][enemyPositionsV[i][1]] = EMPTY;
                    level[tNpcRow][tNpcCol - (2 * npcDirection)] = ENEMY_VERTICAL;

                    enemyPositionsV[i][1] = tNpcCol - (2 * npcDirection);
                    isDirty = true;
                }
            }*/
        }
        
        for (let i = 0; i < enemyPositionsV.length; i++){
            let tNpcRow = enemyPositionsV[i][0] + (1 * npcDirection);
            let tNpcCol = enemyPositionsV[i][1];
            

            if (enemyPatrol >= 4){
                npcDirection *= -1;
                enemyPatrol = 0;
            }

            if (level[tNpcRow][tNpcCol] == EMPTY){
            level[enemyPositionsV[i][0]][enemyPositionsV[i][1]] = EMPTY;
            level[tNpcRow][tNpcCol] = ENEMY_VERTICAL;

            enemyPositionsV[i][1] = tNpcCol;
            isDirty = true;
            } /*else {
                if (level[tNpcRow - (2 * npcDirection)][tNpcCol] == EMPTY){
                    level[enemyPositionsV[i][0]][enemyPositionsV[i][1]] = EMPTY;
                    level[tNpcRow - (2 * npcDirection)][tNpcCol] = ENEMY_VERTICAL;

                    enemyPositionsV[i][1] = tNpcCol - (2 * npcDirection);
                    isDirty = true;
                }
            }*/
        }
        
        

        if (doorDisable == false && playerPos.row == startingPoint.row && playerPos.col == startingPoint.col){
            levelNr -= 1;
            levelData = readMapFile(levels[levelNr]);
            level = levelData;
            playerPos.row = backtracking["map" + levelNr + "Row"];
            playerPos.col = backtracking["map" + levelNr + "Col"];
            doorDisable = true;
            newLevel = true;
            enemyPositionsH = [];
            enemyPositionsV = [];
            enemyPatrol = 2;
        }
        if (doorDisable == false && (playerPos.row == 0 || playerPos. row == level.length - 1 || playerPos.col == 0 || playerPos.col == level[playerPos.row].length -1)){
            backtracking["map" + levelNr + "Row"] = playerPos.row;
            backtracking["map" + levelNr + "Col"] = playerPos.col;
            levelNr += 1;
            levelData = readMapFile(levels[levelNr]);
            level = levelData;
            playerPos.row = null;
            doorDisable = true;
            newLevel = true;
            enemyPositionsH = [];
            enemyPositionsV = [];
            enemyPatrol = 2;
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
            textTimer -= 1;
            if(textTimer < 1){
                eventText = "";
                textTimer = textDuration;
            }
            
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

function moveHero(tRow, tCol){
    if (teleported == true){
        level[playerPos.row][playerPos.col] = PORTAL;
        teleported = false;
    } else {
        level[playerPos.row][playerPos.col] = EMPTY;
    }
    level[tRow][tCol] = HERO;

    playerPos.row = tRow;
    playerPos.col = tCol;
}

function identifyEnemies(enemy, list){
    let enemyNr = 0;
    for (let row = 0; row < level.length; row++){
        for (let col = 0; col < level[row].length; col++){
            if (level[row][col] == enemy){
                list[enemyNr] = [row, col];
                enemyNr++;
            }
        }
    }
}


export default Labyrinth;