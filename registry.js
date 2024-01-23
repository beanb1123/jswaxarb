let table = [{ base: "start", quotes: [ {key: "start", value: 0000 } ] }]

let b = "start";
let q = "start2";
let pair_id = 1111;


let itr = table.find(n => n.base === "start");

console.log(itr);

// does not exist - create
if (itr === undefined) {
    table.push({
        base: b,
        quotes: {
            [q]: pair_id
        }
    });
// if not modified - modify
} else {
    table.forEach((row) => {
        if (row.base === b) {
            row.quotes[q] = pair_id;
        }
    });
}


console.log(JSON.stringify(table));

    
