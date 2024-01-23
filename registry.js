let reg = [{ base: "start", quote: [ { key: "start", value: 0000 } ] }]

let b = "start2";
let q = { key: "start2", value: 1111 };

for(let i = 1; i < 10; i++) {
    reg[i]["base"] = b;
    for(let x = 1; x < 5; x++) {
        reg[i]["quote"][x] = q;
    }
}

console.log(JSON.stringify(reg));
