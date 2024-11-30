import Labyrinth from "./labyrint.mjs"
import ANSI from "./utils/ANSI.mjs";
import SplashScreen from "./splashScreen.mjs";

const REFRESH_RATE = 250;
let splashDuration = 5000;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;

function init() {
    //All levels available to the game. 
    state = new SplashScreen();
    intervalID = setInterval(update, REFRESH_RATE);
    setTimeout(changeState, splashDuration);
}

function update() {

    if (isBlocked) { return; }
    isBlocked = true;
    //#region core game loop
    state.update();
    state.draw();
    //#endregion
    isBlocked = false;
}

init();

function changeState(){
    state = new Labyrinth();
}