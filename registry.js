let table = [{base:"start",quotes:[{key: "start2", value: 1111}]}];

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
            [q]: { key: q, value: pair_id }
        }
    });
// if not modified - modify
} else {
    table.forEach((row) => {
        if (row.base === b) {
            let itr2 = row.quotes.find(n2 => n2.key === "start2");
                if (itr2 === undefined) {
                   row.quotes.push({
                       key: q,
                       value: pair_id
                });
                // if not modified - modify
                } else {
                    row.quotes.forEach((row2) => {
                        if (row2.key === q) {        
                            row2.value = pair_id
                        }
                    });                   
                }
        }
    });
}


console.log(JSON.stringify(table));

    
