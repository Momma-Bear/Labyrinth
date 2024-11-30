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
const ENEMY_HORIZONTAL = "X";
const ENEMY_VERTICAL = "Z";
const HP_POTION = "A";

let items = [];

const THINGS = [LOOT, EMPTY, PORTAL, HP_POTION];

let eventText = [];
let textDuration = 8;
let textTimer = textDuration;
let teleported = false;
let potion = false;
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
let npcDirection = 1;
let patrolTimer = 0;
let patrolDuration = 8;

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
}

class Labyrinth {

    update() {

        if (playerPos.row == null) {
            newLevel = false;
            locateHero();
        } else if (playerPos != null && newLevel == true) {
            removeObjects();
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
            disableDoor();
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
            disableDoor();
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
            disableDoor();
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
            disableDoor();
        }

        let tRow = playerPos.row + (1 * drow);
        let tCol = playerPos.col + (1 * dcol);

        if (THINGS.includes(level[tRow][tCol])) {

            let currentItem = level[tRow][tCol];
            checkForObject(currentItem, tRow, tCol);

        }

        identifyEnemies(ENEMY_HORIZONTAL, enemyPositionsH);
        identifyEnemies(ENEMY_VERTICAL, enemyPositionsV);

        patrolTimer += 1;
        if (patrolTimer >= patrolDuration){
            patrolTimer = 0;
            enemyPatrol += 1;
            moveEnemies(enemyPositionsH, "horizontal");
            moveEnemies(enemyPositionsV, "vertical")
        }
        
        

        if (doorDisable == false && playerPos.row == startingPoint.row && playerPos.col == startingPoint.col){
            levelChange("backtracking");
        }
        if (doorDisable == false && (playerPos.row == 0 || playerPos. row == level.length - 1 || playerPos.col == 0 || playerPos.col == level[playerPos.row].length -1)){
            levelChange("forward");
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

        rendering += renderMap();

        printEverything(rendering);
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

function checkForObject(Item, Row, Col){
    if (Item == LOOT) {
        let loot = Math.round(Math.random() * 7) + 3;
        playerStats.cash += loot;
        for(let i = 0; i < levelNr; i++){
            if (lootedItems[levelNr-1] == undefined){
                lootedItems[levelNr-1] = [];
            }
        }
        lootedItems[levelNr-1].push([Row, Col]);
        eventText.push([`Player gained $${loot}`]);
        moveHero(Row, Col); 
    } else if (Item == PORTAL){
        let portal = [Row, Col];
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
    } else if (Item == HP_POTION){
        if (playerStats.cash > 14){
            playerStats.cash -= 15;
            playerStats.hp += 4;

            for(let i = 0; i < levelNr; i++){
                if (lootedItems[levelNr-1] == undefined){
                    lootedItems[levelNr-1] = [];
                }
            }
            lootedItems[levelNr-1].push([Row, Col]);
            eventText.push([`Player gained 4 hp`]);
            moveHero(Row, Col);
        } else {
            moveHero(Row, Col);
            potion = true;
        }
    } else {
        moveHero(Row, Col);
    }
}

function moveHero(tRow, tCol){
    if (teleported == true){
        level[playerPos.row][playerPos.col] = PORTAL;
        teleported = false;
    } else if (potion == true){
        level[playerPos.row][playerPos.col] = HP_POTION;
        potion = false;
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

function levelChange(progression){
    if (progression == "backtracking"){
        levelNr -= 1;
        playerPos.row = backtracking["map" + levelNr + "Row"];
        playerPos.col = backtracking["map" + levelNr + "Col"];
    } else if (progression == "forward"){
        backtracking["map" + levelNr + "Row"] = playerPos.row;
        backtracking["map" + levelNr + "Col"] = playerPos.col;
        levelNr += 1;
        playerPos.row = null;
    }
    levelData = readMapFile(levels[levelNr]);
    level = levelData;
    doorDisable = true;
    newLevel = true;
    enemyPositionsH = [];
    enemyPositionsV = [];
    enemyPatrol = 2;
}

function disableDoor(){
    doorDisable = false;
    isDirty = true;
}

function moveEnemies(list, direction){
    if (direction == "horizontal"){
        for (let i = 0; i < list.length; i++){
            let tNpcRow = list[i][0];
            let tNpcCol = list[i][1] + (1 * npcDirection);
            

            if (enemyPatrol >= 4){
                npcDirection *= -1;
                enemyPatrol = 0;
            }

            if (level[tNpcRow][tNpcCol] == EMPTY){
            level[list[i][0]][list[i][1]] = EMPTY;
            level[tNpcRow][tNpcCol] = ENEMY_HORIZONTAL;

            list[i][1] = tNpcCol;
            isDirty = true;
            }
        }
    } else if (direction == "vertical"){
        for (let i = 0; i < list.length; i++){
            let tNpcRow = list[i][0] + (1 * npcDirection);
            let tNpcCol = list[i][1];
            

            if (enemyPatrol >= 4){
                npcDirection *= -1;
                enemyPatrol = 0;
            }

            if (level[tNpcRow][tNpcCol] == EMPTY){
            level[list[i][0]][list[i][1]] = EMPTY;
            level[tNpcRow][tNpcCol] = ENEMY_VERTICAL;

            list[i][1] = tNpcCol;
            isDirty = true;
            }
        }
    }
}

function renderMap(){
    let rendering = "";
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
    return rendering;
}

function printEverything(rendering){
    console.log(rendering);

    if (eventText[0] != undefined) {
        for (let i = 0; i < eventText.length; i++){
        console.log(eventText[i]);
    }
        textTimer -= 1;
        if(textTimer < 1){
            eventText.shift();
            textTimer = textDuration;
        }
        
    }

    console.log(ANSI.HIDE_CURSOR);
}

function locateHero(){
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
}

function removeObjects(){
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++){
            if (level[row][col] == HERO && (row != playerPos.row || col != playerPos.col)){
                level[row][col] = EMPTY;
                isDirty = true;
            }
            for (let i = 0; i < lootedItems[levelNr-1].length; i++){
                if (lootedItems[levelNr-1][i][0] == row && lootedItems[levelNr-1][i][1] == col){
                    level[row][col] = EMPTY;
                }
            }
        }
    
    }
}

export default Labyrinth;