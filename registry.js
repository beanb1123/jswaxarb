let data = require('./defi.json');
data = data.rows;

let table = [];

for(d = 0; d < data.length; d++) {

let base = data[d].

let itr = table.find(n => n.base === "start");

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
            let itr2 = row.quotes.find(n2 => n2.key === "start3");
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
}

    
