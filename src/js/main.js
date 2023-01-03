var codeString = ""
var isRunningCode = false;
var p5Object = null;

let apiString = "";

var chordList = [];
var orderedChordList;
var rootNote;
var deltasList;
var shortName;
var fullName;

var midiReceived = (rObject) => {

}

var midiReleased = (rObject) => {

}


window.addEventListener("load", () => {
    {
        var codeInputDom = document.querySelector("#codeInput");
        var codeInputSizeDom = document.querySelector(".inputArea");
        var editor = CodeMirror.fromTextArea(codeInputDom, {
            mode: "text/javascript",
            lineNumbers: true,
            theme: "juejin",
            scrollbarStyle: "null",
            matchBrackets: true,
            autoCloseBrackets: true,
            tabSize: 4,
            indentUnit: 4,
        });
        editor.setSize(codeInputSizeDom.offsetWidth + "px", codeInputSizeDom.offsetHeight + "px");
        editor.on("cursorActivity", () => {
            codeString = editor.getValue();
        });
    }
    {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "./../src/js/api.js");
        xhr.send();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    apiString = xhr.response;
                } else {
                    console.error(xhr.status);
                }
            }
        };
    }
    {
        drawMidi();
    }
    {
        function clearAll() {
            if (p5Object != null)
                p5Object.remove();
            p5Object = null;
            document.querySelector("main").innerHTML = "";
            document.querySelector(".outputArea").innerHTML = "";
        }

        let playBtnDom = document.querySelector(".playBtn");
        playBtnDom.addEventListener("click", () => {
            isRunningCode = !isRunningCode;
            if (isRunningCode) {
                playBtnDom.style.color = "red";
                playBtnDom.classList = "fa fa-stop playBtn";
                try {
                    console.log("<p style='color:green'>启动运行(￣y▽,￣)╭</p>")
                    codeString = `
                    let s = p => {
                        ${apiString}
                        ${codeString}
                    };
                    p5Object = new p5(s);
                    `
                    eval(codeString);
                } catch (e) {
                    console.error(e);
                }
            } else {
                clearAll();
                playBtnDom.style.color = "black";
                playBtnDom.classList = "fa fa-play playBtn";
            }
        })
    }
    {
        document.querySelector("#fileInput").addEventListener("change", function () {
            let fileObj = this.files;
            if (fileObj.length === 0) {
                alert('请选择文件！');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                console.log("<p style='color:green'>文件导入成功</p>")
                editor.setValue(reader.result);
            };
            reader.readAsText(this.files[0]);
        });
    }
    {
        WebMidi
            .enable()
            .then(() => {
                console.log("webmidi 启动成功");
                onEnabled();
            })
            .catch(err => console.log(err));

        function onEnabled() {
            const PlugMidiInput = WebMidi.getInputByName(WebMidi.inputs[0].name);
            if (!PlugMidiInput) {
                alert("未找到Midi设备");
            } else {
                console.log("midi设备 : " + WebMidi.inputs[0].name + "已接入");
            }
            PlugMidiInput.addListener("noteon", e => {
                let noteAccidental = e.note._accidental;
                let noteHeight = e.note._octave * 12 + "C1D1EF1G1A1B".indexOf(e.note._name);
                if (noteAccidental) {
                    if ("CDFGA".indexOf(e.note._name) != -1) {
                        noteHeight += 1;
                    }
                }
                noteHeight -= 9;

                let noteDom = document.querySelector(`#key${noteHeight} .sig`);
                noteDom.classList.add("orange");

                let noteValueDom = document.querySelector(`#key${noteHeight} .value`);
                noteValueDom.style.width = `${e.note._attack * 100}%`;

                let noteName = e.note._name;
                if (noteAccidental) {
                    noteName = "#" + noteName;
                }

                let noteWarped = {
                    note: noteName,
                    octave: e.note._octave,
                    accidental: e.note._accidental,
                    height: noteHeight,
                    accidental: noteAccidental,
                    startTg: e.note._attack,
                    endTg: e.note._release
                };

                chordList.push(noteWarped);

                // 分析和弦
                function bubbleSort(arr) {
                    var max = arr.length - 1;
                    for (var j = 0; j < max; j++) {
                        var done = true;
                        for (var i = 0; i < max - j; i++) {
                            if (arr[i].height > arr[i + 1].height) {
                                var temp = arr[i];
                                arr[i] = arr[i + 1];
                                arr[i + 1] = temp;
                                done = false;
                            }
                        }
                        if (done) {
                            break;
                        }
                    }
                    return arr;
                }
                orderedChordList = bubbleSort(chordList);

                let chorString = "";
                for (let i = 0; i < orderedChordList.length; i++) {
                    chorString += `
                    <p><span>height:</span>${orderedChordList[i].height},<span>note:</span>${orderedChordList[i].note}</p>
                    `;
                }

                // 分析音数
                chorString += "<p>音数分析:";
                deltasList = [];
                for (let i = 0; i < orderedChordList.length - 1; i++) {
                    deltasList.push(orderedChordList[i + 1].height - orderedChordList[i].height);
                }
                for (let i = 0; i < deltasList.length; i++) {
                    chorString += `
                    <span>${deltasList[i]}</span>
                    `;
                }
                chorString += "</p>";

                // 分析度数
                chorString += "<p>类型分析:";

                for (let i = 0; i < deltasList.length; i++) {
                    chorString += `
                    <span>${deltaToString.get(deltasList[i]) ? deltaToString.get(deltasList[i]) : "?"}</span>
                    `;
                }
                chorString += "</p>";

                // 分析根音
                rootNote = orderedChordList[0].note;
                chorString += "<p>根音:";
                chorString += `<span>${rootNote}</span>`;
                chorString += "</p>";

                // 分析类型
                chorString += "<p>类型:";
                chorString += `<span>${deltasToChnString.get(deltasList.toString()) ? deltasToChnString.get(deltasList.toString()) : "?"}</span>`;
                chorString += "</p>";

                // 命名
                chorString += "<p>命名:"
                shortName = orderedChordList[0].note + deltasToEgnShortString.get(deltasList.toString());
                chorString += `${deltasToEgnShortString.get(deltasList.toString()) ? shortName : "?"}`;
                chorString + "</p>";

                // 全名
                chorString += "<p>全名:"
                fullName = orderedChordList[0].note + deltasToEgnLongString.get(deltasList.toString());
                chorString += `${deltasToEgnLongString.get(deltasList.toString()) ? fullName : "?"}`;
                chorString + "</p>";

                // 情感
                chorString += "<p>听感:"
                chorString += `${deltasToFeelingString.get(deltasList.toString()) ? deltasToFeelingString.get(deltasList.toString()) : "?"}`;
                chorString + "</p>";

                document.querySelector(".dataOutArea").innerHTML = `
                <p>琴键按下</p>
                <p>索引<span>g.height</span>:${noteHeight}</p>
                <p>音符<span>e.note._name</span>:${e.note._name}</p>
                <p>八度<span>e.note._octave</span>:${e.note._octave}</p>
                <p>力度<span>g.startTg</span>:${e.note._attack}</p>
                <p>和弦分析器<p>
                ${chorString}
                <p>
                `;

                midiReceived(noteWarped);
            });

            PlugMidiInput.addListener("noteoff", e => {
                let noteAccidental = e.note._accidental;
                let noteHeight = e.note._octave * 12 + "C1D1EF1G1A1B".indexOf(e.note._name);
                if (noteAccidental) {
                    if ("CDFGA".indexOf(e.note._name) != -1) {
                        noteHeight += 1;
                    }
                }
                noteHeight -= 9;

                let noteDom = document.querySelector(`#key${noteHeight} .sig`);
                noteDom.classList.remove("orange");

                let noteValueDom = document.querySelector(`#key${noteHeight} .value`);
                noteValueDom.style.width = "0%";

                let noteName = e.note._name;
                if (noteAccidental) {
                    noteName = noteName + "#";
                }

                let noteWarped = {
                    note: noteName,
                    octave: e.note._octave,
                    accidental: e.note._accidental,
                    height: noteHeight,
                    accidental: noteAccidental,
                    startTg: e.note._attack,
                    endTg: e.note._release
                };

                for (let i = 0; i < chordList.length; i++) {
                    if (chordList[i].height == noteWarped.height) {
                        chordList.splice(i, 1);
                        break;
                    }
                }

                midiReleased(noteWarped);
            });
        }
    }
});