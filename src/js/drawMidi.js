function drawMidi() {
    let midiDom = document.querySelector(".midiOutArea");
    let noteList = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B"
    ];
    let tempStr = "";
    for (let i = 96; i >= 9; i--) {
        let currentNote = noteList[i % noteList.length];
        if (currentNote.length == 1) {
            tempStr += `
            <div class="key" id="key${i - 9}">
                <div class="sig white"></div>
                <div class="value"></div>
            </div>
            `;
        } else {
            tempStr += `
            <div class="key" id="key${i - 9}">
                <div class="sig black"></div>
                <div class="value"></div>
            </div>
            `;
        }
    }
    midiDom.innerHTML = tempStr;
}