import Labyrinth from "./labyrint.mjs";
import ANSI  from "./utils/ANSI.mjs";


const outputGraphics = `
 ██▓    ▄▄▄       ▄▄▄▄ ▓██   ██▓ ██▀███   ██▓ ███▄    █ ▄▄▄█████▓ ██░ ██
▓██▒   ▒████▄    ▓█████▄▒██  ██▒▓██ ▒ ██▒▓██▒ ██ ▀█   █ ▓  ██▒ ▓▒▓██░ ██▒
▒██░   ▒██  ▀█▄  ▒██▒ ▄██▒██ ██░▓██ ░▄█ ▒▒██▒▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▀▀██░
▒██░   ░██▄▄▄▄██ ▒██░█▀  ░ ▐██▓░▒██▀▀█▄  ░██░▓██▒  ▐▌██▒░ ▓██▓ ░ ░▓█ ░██
░██████▒▓█   ▓██▒░▓█  ▀█▓░ ██▒▓░░██▓ ▒██▒░██░▒██░   ▓██░  ▒██▒ ░ ░▓█▒░██▓
░ ▒░▓  ░▒▒   ▓▒█░░▒▓███▀▒ ██▒▒▒ ░ ▒▓ ░▒▓░░▓  ░ ▒░   ▒ ▒   ▒ ░░    ▒ ░░▒░▒
░ ░ ▒  ░ ▒   ▒▒ ░▒░▒   ░▓██ ░▒░   ░▒ ░ ▒░ ▒ ░░ ░░   ░ ▒░    ░     ▒ ░▒░ ░
  ░ ░    ░   ▒    ░    ░▒ ▒ ░░    ░░   ░  ▒ ░   ░   ░ ░   ░       ░  ░░ ░
    ░  ░     ░  ░ ░     ░ ░        ░      ░           ░           ░  ░  ░
                       ░░ ░                                              
                                                                         
`;

const testGraphics = "░▒▓█▄▀";

let tempGraphics = outputGraphics.split('\n');
let tGraphics = [];
for (let i = 0; i < tempGraphics.length; i++){
    tGraphics.push(tempGraphics[i].split(''));
}
let printGraphics = [];

let timer = 0;
let refresh = 30;

let isDirty = true;

class SplashScreen {

    constructor() {

    }

    update() {
        timer += 1;
        if (timer >= 3){
        for (let i = tGraphics.length-1; i > 0; i--){
            for (let j = 0; j < tGraphics[i].length; j++){
                if (tGraphics [i][j] == '░' || tGraphics[i][j] == '▒' || tGraphics[i][j] == ' '){
                if (tGraphics[i-1][j]  == '░' || tGraphics[i-1][j] == '▒'|| tGraphics[i-1][j] == ' '){
                    tGraphics[i][j] = tGraphics[i-1][j];
                }}
            }
        }

        for (let i = 0; i < tGraphics.length; i++){
            printGraphics.push(tGraphics[i].join(''))
        }
        isDirty = true;
        timer = 0;
        }
    }

    draw() {
        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        for (let i = 0; i < printGraphics.length; i++){
            rendering += printGraphics[i];
            rendering += "\n";
        }

        console.log(ANSI.COLOR.RED + rendering + ANSI.COLOR_RESET);
        console.log(ANSI.HIDE_CURSOR);
        printGraphics = [];
    }


}

export default SplashScreen;