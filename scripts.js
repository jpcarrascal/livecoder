const midi = new MIDI();
//midi.selectInput(1);
setTimeout(() => {
    midi.setInputHandler(3, midiHandler);
}, 3000);

var cursorState = "codeEdit"; // possible states: codeEdit, functionSelect
var parameters = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Live Coder script loaded');
    const codeArea = document.getElementById('code');
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
            removeDropdown();
        }
    });
});

function midiHandler (midiMessage) {
    const data = midiMessage.data;
    const type = midiMessageType(data[0]);
    const dropdown = document.getElementById('functionDropdown');
    const codeArea = document.getElementById('code');
    if(type == 'NOTE_ON') {
        if(data[1] == 98 && data[2] == 127) {
            if(cursorState == "codeEdit") {
                dropdown.focus();
                cursorState = "functionList";
            } else if(cursorState == "functionList") {
                const event = new Event('change');
                dropdown.dispatchEvent(event);
                cursorState = "codeEdit";
                codeArea.focus();
            }
        }
    } else if(type == 'CC_CHANGE') {
        if(cursorState == "codeEdit") {
            if(data[1] == 8)
                moveCursor("left");
            else if(data[1] == 9)
                moveCursor("right");
        } else if(cursorState == "functionList") {
            if(data[1] == 8) {
                dropdown.selectedIndex = dropdown.selectedIndex - 1;
            } else if(data[1] == 9) {
                dropdown.selectedIndex = dropdown.selectedIndex + 1;
            }
        }
        // pot CCs: 4, 3, 5, 6
        if(data[1] == 4) {
        } else if(data[1] == 3) {
        } else if(data[1] == 5) {
        } else if(data[1] == 6) {
        }
    }
}


function moveCursor(direction) {
    const codeArea = document.getElementById('code');
    const value = codeArea.value;
    const cursorPos = codeArea.selectionStart;
    const specialChars = [')', '('];
    let newPos = cursorPos;

    if (direction === 'left') {
        for (let i = cursorPos - 2; i >= 0; i--) {
            if (specialChars.includes(value[i])) {
                newPos = i + 1;
                break;
            }
        }
    } else if (direction === 'right') {
        for (let i = cursorPos + 1; i < value.length; i++) {
            if (specialChars.includes(value[i])) {
                newPos = i + 1;
                break;
            }
        }
    }

    codeArea.setSelectionRange(newPos, newPos);
    showDropdown();
}

function showDropdown() {
    removeDropdown(); // Ensure any existing dropdown is removed

    const codeArea = document.getElementById('code');
    const dropdown = document.createElement('select');
    dropdown.id = 'functionDropdown';
    dropdown.size = 5;

    for (let i = 0; i < hydraFunctions.length; i++) {
        const func = hydraFunctions[i];
        const option = document.createElement('option');
        option.value = i;
        option.text = func.name + "()";
        dropdown.appendChild(option);
    }

    dropdown.addEventListener('change', () => {
        codeArea.focus();
        const selectedFunction = dropdown.options[dropdown.selectedIndex].text;
        parameters = hydraFunctions[dropdown.selectedIndex].params;
        console.log(paramParser(parameters));
        const cursorPos = codeArea.selectionStart;
        const textBeforeCursor = codeArea.value.substring(0, cursorPos);
        const textAfterCursor = codeArea.value.substring(cursorPos);
        const newText = textBeforeCursor + "." + selectedFunction + textAfterCursor;

        // Enable undo by using execCommand
        const start = codeArea.selectionStart;
        const end = codeArea.selectionEnd;
        const lastChar = codeArea.value[end - 1];
        let separator = ".";
        if (lastChar === "(") separator = "";
        document.execCommand('insertText', false, separator + selectedFunction);
        codeArea.setSelectionRange(start + selectedFunction.length + 1, end + selectedFunction.length);

        //removeDropdown();
    });

    const rect = codeArea.getBoundingClientRect();
    const top = rect.bottom + window.scrollY; // Position below the textarea
    const left = rect.left + window.scrollX;

    dropdown.style.position = 'absolute';
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;

    document.body.appendChild(dropdown);
}

function removeDropdown() {
    const existingDropdown = document.getElementById('functionDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
}

function paramParser(params) {
    let paramString = "";
    for (let key in params) {
        paramString += params[key] + ", ";
        console.log(key, params[key], typeof params[key]);
    }
    return paramString;
}