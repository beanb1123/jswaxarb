async function mine(tokens) {

  const arb = await basic.get_best_arb_opportunity(tokens);
  const sts = arb.length;

  if (sts > 2) {
    //    check(arb.back().out_asset.quantity > tokens.quantity, "NO PROFIT FOR: " + tokens.quantity.to_string() + " - CLOSEST: (" + arb[0].in_asset.quantity.to_string() + " | " + arb[0].dex.to_string() + " => " + arb[1].in_asset.quantity.to_string() + " | " + arb[1].dex.to_string() + " => " + arb[2].in_asset.quantity.to_string() + " | " + arb[2].dex.to_string() + " => " + arb[2].out_asset.quantity.to_string() + ")");
  } else {
    //    check(arb.back().out_asset.quantity > tokens.quantity, "NO PROFIT FOR: " + tokens.quantity.to_string() + " - CLOSEST: (" + arb[0].in_asset.quantity.to_string() + " | " + arb[0].dex.to_string() + " => " + arb[1].in_asset.quantity.to_string() + " | " + arb[1].dex.to_string() + " => " + arb[1].out_asset.quantity.to_string() + ")");
  }

  if (sts > 2) {
    await basic.trade(arb[0].dex.to_string(), arb[0].in_asset.quantity, arb[0].out_asset.quantity.symbol);
    await basic.trade(arb[1].dex.to_string(), arb[1].in_asset.quantity, arb[1].out_asset.quantity.symbol);
    await basic.trade(arb[2].dex.to_string(), arb[2].in_asset.quantity, arb[2].out_asset.quantity.symbol);
    console.log("PROFITABLE ARB: (" + arb[0].in_asset.quantity.to_string() + " | " + arb[0].dex.to_string() + " => " + arb[1].in_asset.quantity.to_string() + " | " + arb[1].dex.to_string() + " => " + arb[2].in_asset.quantity.to_string() + " | " + arb[2].dex.to_string() + " => " + arb[2].out_asset.quantity.to_string() + ")");
  } else {
    await basic.trade(arb[0].dex.to_string(), arb[0].in_asset.quantity, arb[0].out_asset.quantity.symbol);
    await basic.trade(arb[1].dex.to_string(), arb[1].in_asset.quantity, arb[1].out_asset.quantity.symbol);
    console.log("PROFITABLE ARB: (" + arb[0].in_asset.quantity.to_string() + " | " + arb[0].dex.to_string() + " => " + arb[1].in_asset.quantity.to_string() + " | " + arb[1].dex.to_string() + " => " + arb[1].out_asset.quantity.to_string() + ")");
  }
}

async function trade(dex, tokens, to) {
  eosio.check(tokens.amount > 0, "Invalid tokens amount");

  const [ex, out, tcontract, qcontract, memo] = await basic.get_trade_data(dex, tokens, to);

  const transfer = new token.transfer_action(tcontract, { get_self(), "active"_n });
  await transfer.send(get_self(), eosio.name(dex), tokens, memo);
}

function get_trade_data(exchange, tokens, to) {
  if (exchange == "swap.box")
    return get_defi_trade_data(tokens, to);

  if (exchange == "swap.alcor")
    return get_alcorswap_trade_data(tokens, to);

  if (exchange == "swap.taco")
    return get_taco_trade_data(tokens, to);

  if (exchange == "alcordexmain")
    return get_alcor_trade_data(tokens, to);

  eosio.check(false, exchange + " exchange is not supported");
  return {}; //dummy
}

function get_defi_trade_data(tokens, to) {
  const _table = new basic.pairs_table("hookbuilders"_n, "swap.box"_n.value);

  let pair_id;
  let tcontract;
  let qcontract;

  const rowit = _table.get(tokens.symbol.code().raw(), "SYMBOL NOT FOUND");
  tcontract = rowit.base.get_contract();
  for (const p of rowit.quotes) {
    if (p.first.get_symbol() == to) {
      qcontract = p.first.get_contract();
      pair_id = p.second;
      break;
    }
  }

  if (pair_id == "") return {};

  const [reserve_in, reserve_out] = defi.get_reserves(stoi(pair_id), tokens.symbol);

  const out = uniswap.get_amount_out(tokens, reserve_in, reserve_out);

  return { "swap.box"_n, out, tcontract, qcontract, "swap," + std::to_string(out.amount) + "," + pair_id };
}

function get_alcorswap_trade_data(tokens, to) {
  const _table = new basic.pairs_table("hookbuilders"_n, "swap.alcor"_n.value);
  const alcorswap = new alcorswap.alcorswap_table("swap.alcor"_n, "swap.alcor"_n.value);

  let pair_id;
  let qcontract;
  let tcontract;

  const rowit = _table.get(tokens.symbol.code().raw(), "SYMBOL NOT FOUND");
  tcontract = rowit.base.get_contract();
  for (const p of rowit.quotes) {
    if (p.first.get_symbol() == to) {
      qcontract = p.first.get_contract();
      pair_id = p.second;
      break;
    }
  }

  if (pair_id == "") return {};
  const delimiter = ".";

  const [reserve0, reserve1] = alcorswap.get_reserves(stoi(pair_id), to);

  const itr = alcorswap.get(stoi(pair_id), "ALCORSWAP PAIR ID NOT FOUND");
  const r0 = uniswap.asset_to_double(reserve0);
  const r1 = uniswap.asset_to_double(reserve1);
  const price1 = r1 / r0;

  const t1 = uniswap.asset_to_double(tokens);

  const amt = t1 * price1;

  const sqrtprice = itr.currSlot.sqrtPriceX64;
  const sps = uint128ToString(sqrtprice);
  const sps2 = sps + ",f";
  const sqrtp = basic.stringtodouble(sps2);

  const price2 = Math.pow(sqrtp, 2) / Math.pow(2, 128) * Math.pow(10, tokens.symbol.precision() - to.precision());

  const o1 = price2 * t1;

  const out2 = uniswap.get_amount_out(tokens, reserve0, reserve1);

  const ou2 = uniswap.asset_to_double(out2);
  const sl = amt - ou2;

  const tmp3 = sl / amt * 100;

  const tmp5 = tmp3 * o1 / 100;

  const out3 = o1 - tmp5;
  let out31 = std::to_string(out3);
  const out32 = out31.substr(0, out31.find(delimiter));
  let out33;
  if (out32 != "0") {
    out33 = out32.length() + to.precision();
  } else {
    out33 = to.precision();
  }
  out31.resize(out33);
  const out34 = basic.stringtodouble(out31);

  const out = uniswap.double_to_asset(out34, to);

  return { "swap.alcor"_n, out, tcontract, qcontract, "swapexactin#" + pair_id + "#hookbuilders#" + out.to_string() + "@" + qcontract.to_string() + "#0" };
}

function get_taco_trade_data(tokens, to) {
  const _table = new basic.pairs_table("hookbuilders"_n, "swap.taco"_n.value);

  let pair_id;
  let qcontract;
  let tcontract;

  const rowit = _table.get(tokens.symbol.code().raw(), "SYMBOL NOT FOUND");
  tcontract = rowit.base.get_contract();
  for (const p of rowit.quotes) {
    if (p.first.get_symbol() == to) {
      qcontract = p.first.get_contract();
      pair_id = p.second;
      break;
    }
  }

  if (pair_id == "") return {};

  const [reserve_in, reserve_out] = taco.get_reserves(symbol_code(pair_id), tokens.symbol);

  const out = uniswap.get_amount_out(tokens, reserve_in, reserve_out);

  return { "swap.taco"_n, out, tcontract, qcontract, out.to_string() + "@" + qcontract.to_string() };
}

function get_alcor_trade_data(tokens, to) {
  const _table = new basic.pairs_table("hookbuilders"_n, "alcordexmain"_n.value);

  let pair_id;
  let qcontract;
  let tcontract;

  const rowit = _table.get(tokens.symbol.code().raw(), "SYMBOL NOT FOUND");
  tcontract = rowit.base.get_contract();
  for (const p of rowit.quotes) {
    if (p.first.get_symbol() == to) {
      qcontract = p.first.get_contract();
      pair_id = p.second;
      break;
    }
  }

  if (pair_id == "") return {};

  const [out, memo] = alcor.get_amount_out(stoi(pair_id), tokens, to);

  return { "alcordexmain"_n, out, tcontract, qcontract, memo };
}

function get_pairs(table, sym) {
  const res = [];

  for (const rowit of table) {
    if (rowit.base == sym) {
      for (const p of rowit.quotes) {
        res.push(p.first);
      }
    }
  }

  return res;
}

function get_last_pair(table, from, to) {
  const res = [];

  for (const rowit of table) {
    if (rowit.base == from) {
      for (const p of rowit.quotes) {
        if (p.first == to) {
          res.push(p.first);
        }
      }
    }
  }
  return res;
}

function get_all_pairs(sym) {
  const res = {};

  const defi_table = new basic.pairs_table("hookbuilders"_n, "swap.box"_n.value);
  res["swap.box"] = get_pairs(defi_table, sym);

  const alcorswap_table = new basic.pairs_table("hookbuilders"_n, "swap.alcor"_n.value);
  res["swap.alcor"] = get_pairs(alcorswap_table, sym);

  const taco_table = new basic.pairs_table("hookbuilders"_n, "swap.taco"_n.value);
  res["swap.taco"] = get_pairs(taco_table, sym);

  const alcor_table = new basic.pairs_table("hookbuilders"_n, "alcordexmain"_n.value);
  res["alcordexmain"] = get_pairs(alcor_table, sym);

  return res;
}

function get_quotes(pairs, tokens) {
  const prices = {};
  const blacklist = ["usdt.eos", "txtprtltoken", "issue.newdex", "tokens.wal"];

  for (const p of pairs) {
    const ext_sym = p.first;

    const highest_return = p.second[p.second.length - 1];
    const lowest_return = p.second[0];

    const [ex0, out0, tcontract0, qcontract0, memo0] = get_trade_data(lowest_return.second, highest_return.first.quantity, ext_sym.get_symbol());

    const var_11 = { ext_tokens, highest_return.first, eosio.name(highest_return.second) };
    const var_12 = { highest_return.first, extended_asset(out0, qcontract0), ex0 };

    const steps = [];
    steps.push(var_11);
    steps.push(var_12);

    arbs[out0] = steps;

    const pairs2 = get_all_pairs(ext_sym);
    const quotes2 = get_quotes(pairs2, highest_return.first.quantity);

    if (quotes2.length == 0) continue;

    for (const p2 of quotes2) {
      const ext_sym2 = p2.first;

      const highest_return2 = p2.second[p2.second.length - 1];
      const lowest_return2 = p2.second[0];

      const pairs3 = {};

      const defi_table = new basic.pairs_table("hookbuilders"_n, "swap.box"_n.value);
      pairs3["swap.box"] = get_last_pair(defi_table, ext_sym3, ext_sym);

      const alcorswap_table = new basic.pairs_table("hookbuilders"_n, "swap.alcor"_n.value);
      pairs3["swap.alcor"] = get_last_pair(alcorswap_table, ext_sym3, ext_sym);

      const taco_table = new basic.pairs_table("hookbuilders"_n, "swap.taco"_n.value);
      pairs3["swap.taco"] = get_last_pair(taco_table, ext_sym3, ext_sym);

      const alcor_table = new basic.pairs_table("hookbuilders"_n, "alcordexmain"_n.value);
      pairs3["alcordexmain"] = get_last_pair(alcor_table, ext_sym3, ext_sym);

      const quotes3 = get_quotes(pairs3, highest_return2.first.quantity);

      if (quotes3.length == 0) continue;

      for (const p3 of quotes3) {
        const highest_return3 = p3.second[p3.second.length - 1];
        const lowest_return3 = p3.second[0];

        const [ex, out, tcontract, qcontract, memo] = get_trade_data(highest_return.second, highest_return.first.quantity, highest_return2.first.quantity.symbol);
        const [ex2, out2, tcontract2, qcontract2, memo2] = get_trade_data(highest_return2.second, highest_return2.first.quantity, highest_return3.first.quantity.symbol);

        const var_21 = { highest_return.first, highest_return2.first, eosio.name(highest_return2.second) };
        const var_22 = { highest_return2.first, highest_return3.first, eosio.name(highest_return3.second) };

        const steps = [];
        steps.push(var_11);
        steps.push(var_21);
        steps.push(var_22);
        arbs[out2] = steps;
      }
    }
  }

  const arbs_vec = Object.entries(arbs).sort((a, b) => a[0] - b[0]);

  arbs = {};
  for (const [key, value] of arbs_vec) {
    arbs[key] = value;
  }

  const arb = Object.entries(arbs).reverse();
  steps = arb[1];

  return steps;
}
