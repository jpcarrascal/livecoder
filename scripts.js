//const midi = new MIDI();

//setTimeout(() => {
//    midi.setInputHandler(3, midiHandler);
//}, 3000);

WebMidi
.enable()
.then(onEnabled)
.catch(err => alert(err));

function onEnabled() {
    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
      document.body.innerHTML+= "No device detected.";
    } else {
      WebMidi.inputs.forEach((device, index) => {
        if(device.name.includes("Transparent")) {
            device.addListener('noteon', noteOnHandler);
            device.addListener('controlchange', controllerHandler);
        }
      });
    }
}

const dropdown = document.getElementById('functionDropdown');
const codeArea = document.getElementById('code');
const paramsView = document.getElementById('params');

var globalObj = {
    set cursorState(value) {
        cursorState = value;
        console.log("Cursor State -----> " + value);
    },
    get cursorState() {
        return cursorState;
    },
    set currentParameters(value) {
        currentParameters = value;
        paramsView.innerText = JSON.stringify(value);
    },
    get currentParameters() {
        return currentParameters;
    },
    set insert(value) {
        insert = value;
    },
    get insert() {
        return insert;
    }
};

globalObj.cursorState = "codeEdit"; // possible states: codeEdit, functionSelect
globalObj.currentParameters = [];
globalObj.insert = "";

document.addEventListener('DOMContentLoaded', () => {
    console.log('Live Coder script loaded');
    codeArea.value = localStorage.getItem('codeContent') || '';
    
    // Focus the textarea and set the cursor position to the beginning
    codeArea.focus();
    codeArea.setSelectionRange(0, 0);

    codeArea.addEventListener('input', () => {
        localStorage.setItem('codeContent', codeArea.value);
    });

    codeArea.addEventListener('keydown', (event) => {
        if (event.metaKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault();
            moveCursor(event.key === 'ArrowLeft' ? 'left' : 'right');
        } else {
            hideDropdown();
        }
    });

    codeArea.addEventListener('click', () => {
        globalObj.cursorState == "codeEdit";
        globalObj.currentParameters = [];
        hideDropdown();
    });

    dropdown.addEventListener('change', () => {
        codeArea.focus();
        globalObj.insert = dropdown.options[dropdown.selectedIndex].text;
        globalObj.currentParameters = hydraFunctions[dropdown.selectedIndex].params;
        const cursorPos = codeArea.selectionStart;
        const textBeforeCursor = codeArea.value.substring(0, cursorPos);
        const textAfterCursor = codeArea.value.substring(cursorPos);
        const newText = textBeforeCursor + "." + globalObj.insert + textAfterCursor;
    
        // Enable undo by using execCommand
        const start = codeArea.selectionStart;
        const end = codeArea.selectionEnd;
        const lastChar = codeArea.value[end - 1];
        let separator = ".";
        if (lastChar === "(") separator = "";
        document.execCommand('insertText', false, separator + globalObj.insert);
        codeArea.setSelectionRange(start + globalObj.insert.length + 1, end + globalObj.insert.length);
        hideDropdown();
    });
});

function noteOnHandler (e) {
    const data = e.data;
    if(data[1] == 98 && data[2] == 127) {
        if(globalObj.cursorState == "codeEdit") {
            showDropdown();
            dropdown.focus();
            globalObj.cursorState = "functionList";
        } else if(globalObj.cursorState == "functionList") {
            globalObj.cursorState = "parameterEdit";
            const event = new Event('change');
            dropdown.dispatchEvent(event);
            hideDropdown();
            codeArea.focus();
        } else if(globalObj.cursorState == "parameterEdit") {
            let vals = []
            for(let i = 0; i < globalObj.currentParameters.length; i++) {
                vals.push(globalObj.currentParameters[i].value);
            }
            const valString = vals.join(", ");
            insertTextAtCursor(codeArea, valString);
            globalObj.cursorState = "codeEdit";
        }
    }
}

function controllerHandler (e) {
    const data = e.data;
    if(globalObj.cursorState == "codeEdit") {
        if(data[1] == 8)
            moveCursor("left");
        else if(data[1] == 9)
            moveCursor("right");
    } else if(globalObj.cursorState == "functionList") {
        if(data[1] == 8) {
            dropdown.selectedIndex = dropdown.selectedIndex - 1;
        } else if(data[1] == 9) {
            dropdown.selectedIndex = dropdown.selectedIndex + 1;
        }
    } else if(globalObj.cursorState == "parameterEdit") {
        // pot CCs: 4, 3, 5, 6
        const pots = [4, 3, 5, 6, 666];
        for(let i = 0; i < pots.length; i++) {
            if(data[1] == pots[i]) {
                if(globalObj.currentParameters[i] !== undefined && globalObj.currentParameters[i].type != "string") {
                    globalObj.currentParameters[i].value = map2cc(data[2], globalObj.currentParameters[i].min, globalObj.currentParameters[i].max);
                    globalObj.currentParameters = [...globalObj.currentParameters]; // Trigger setter
                }
            }
        }
    }
}


function moveCursor(direction) {
    const text = codeArea.value;
    const cursorPos = codeArea.selectionStart;
    const specialChars = [')', '('];
    let newPos = cursorPos;

    if (direction === 'left') {
        for (let i = cursorPos - 2; i >= 0; i--) {
            if (specialChars.includes(text[i])) {
                newPos = i + 1;
                break;
            }
        }
    } else if (direction === 'right') {
        for (let i = cursorPos; i < text.length; i++) {
            if (specialChars.includes(text[i])) {
                newPos = i + 1;
                break;
            }
        }
    }
    codeArea.setSelectionRange(newPos, newPos);
}

function showDropdown() {
    dropdown.innerHTML = ''; // Clear existing options

    for (let i = 0; i < hydraFunctions.length; i++) {
        const func = hydraFunctions[i];
        const option = document.createElement('option');
        option.value = i;
        option.text = func.name + "()";
        dropdown.appendChild(option);
    }

    const rect = codeArea.getBoundingClientRect();
    const top = rect.bottom + window.scrollY; // Position below the textarea
    const left = rect.left + window.scrollX;

    dropdown.style.position = 'absolute';
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;
    dropdown.style.display = 'block'; // Show the dropdown
}

function hideDropdown() {
    if (dropdown) {
        dropdown.style.display = 'none'; // Hide the dropdown
    }
}

function removeDropdown() {
    const existingDropdown = document.getElementById('functionDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
}

// maps a value from range 0-127 to a new range:
// https://stackoverflow.com/questions/5731863/mapping-a-numeric-range-onto-another
function map2cc(value, low, high) {
    const result = low + (high - low) * (value) / 127;
    return Math.round((result + Number.EPSILON) * 100) / 100
}

function insertTextAtCursor(textArea, text) {
    const startPos = textArea.selectionStart;
    //const endPos = textArea.selectionEnd;
    //const textBeforeCursor = textArea.value.substring(0, startPos);
    //const textAfterCursor = textArea.value.substring(endPos);

    // Enable undo by using execCommand
    textArea.focus();
    document.execCommand('insertText', false, text);

    // Update cursor position
    const newCursorPos = startPos + text.length;
    textArea.setSelectionRange(newCursorPos, newCursorPos);
}
