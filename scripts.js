document.addEventListener('DOMContentLoaded', () => {
    console.log('Live Coder script loaded');
    const codeArea = document.getElementById('code');
    codeArea.value = localStorage.getItem('codeContent') || '';

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
    showDropdown(newPos);
}

function showDropdown(cursorPos) {
    removeDropdown(); // Ensure any existing dropdown is removed

    const codeArea = document.getElementById('code');
    const dropdown = document.createElement('select');
    dropdown.id = 'functionDropdown';
    allFunctions.forEach(func => {
        const option = document.createElement('option');
        option.value = func;
        option.text = func;
        dropdown.appendChild(option);
    });

    const rect = codeArea.getBoundingClientRect();
    let lineHeight = window.getComputedStyle(codeArea).lineHeight;

    if (lineHeight === 'normal') {
        const tempSpan = document.createElement('span');
        tempSpan.style.font = window.getComputedStyle(codeArea).font;
        tempSpan.style.visibility = 'hidden';
        tempSpan.innerText = 'A';
        document.body.appendChild(tempSpan);
        lineHeight = tempSpan.offsetHeight;
        document.body.removeChild(tempSpan);
    } else {
        lineHeight = parseInt(lineHeight);
    }

    const textBeforeCursor = codeArea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    const top = rect.top + window.scrollY + (lines.length - 1) * lineHeight;
    const left = rect.left + window.scrollX + currentLine.length * 8; // Approximate character width

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

const allFunctions = ['noise()', 'voronoi()', 'osc()', 'shape()', 'gradient()', 'src()', 'solid()', 'prev()',
    'rotate()', 'scale()', 'pixelate()', 'repeat()', 'repeatX()', 'repeatY()', 'kaleid()', 'scroll()', 'scrollX()', 'scrollY()',
    'posterize()', 'shift()', 'invert()', 'contrast()', 'brightness()', 'luma()', 'thresh()', 'color()', 'saturate()', 'hue()', 'colorama()', 'sum()', 'r()', 'g()', 'b()', 'a()',
    'add()', 'sub()', 'layer()', 'blend()', 'mult()', 'diff()', 'mask()',
    'modulateRepeat()', 'modulateRepeatX()', 'modulateRepeatY()', 'modulateKaleid()', 'modulateScrollX()', 'modulateScrollY()', 'modulate()', 'modulateScale()', 'modulatePixelate()', 'modulateRotate()', 'modulateHue()',
    'initCam()', 'initImage()', 'initVideo()', 'init()', 'initStream()', 'initScreen()',
    'render()', 'update()', 'setResolution()', 'hush()', 'setFunction()', 'speed()', 'bpm()', 'width()', 'height()', 'time()', 'mouse()',
    'fast()', 'smooth()', 'ease()', 'offset()', 'fit()', 'fft()',
    'setSmooth()', 'setCutoff()', 'setBins()', 'setScale()', 'hide()', 'show()'];