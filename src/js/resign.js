// let old_console = console;
// var console = {
//     log(obj) {
//         old_console.log(obj);
//         let outputArea = document.querySelector(".outputArea");
//         let tempStr = "";
//         if (typeof obj == "object") {
//             for (let key in obj) {
//                 tempStr += `<p>${key}:${obj[key]}</p>`;
//             }
//         } else {
//             tempStr = `<p style="color:blue">${obj}</p>`;
//         }
//         outputArea.innerHTML = tempStr + outputArea.innerHTML;
//     },
//     error(string) {
//         let outputArea = document.querySelector(".outputArea");
//         outputArea.innerHTML = `<p style="color:red">${string}</p>` + outputArea.innerHTML;
//     }
// }