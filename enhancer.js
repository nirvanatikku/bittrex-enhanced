const CONSTANTS = {
  color: '#0072ed'
};
Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

function updateHeader(headerId, col){
  if(document.getElementById(headerId)){
    return;
  }
  const enhancedHeader = document.createElement('span');
  enhancedHeader.id = headerId;
  enhancedHeader.style.color = CONSTANTS.color;
  enhancedHeader.innerHTML = ' (USD)';
  col.appendChild(enhancedHeader);
}

function updateColumn(colId, col){
  let rowId = 'enhanced-val-'+colId.replace(/\./g, '-');
  let existingNodes = document.querySelectorAll('.'+rowId);
  const btcVal = parseFloat(col.childNodes.length > 0 ? col.childNodes[0].textContent : col.innerText);
  let price = '$' + (Enhancer.getCurrentPrice() * btcVal).format(2);
  if(existingNodes.length === 0){
    const newNode = document.createElement('span');
    newNode.style.color = CONSTANTS.color;
    newNode.style.marginLeft = '10px';
    newNode.className = rowId;
    newNode.innerHTML = price;
    col.appendChild(newNode);
  } else {
    for(var i=0; i<existingNodes.length; i++){
      existingNodes[i].innerHTML = price;
    }
  }
}

function whenReady(callback) {
  if (document.readyState === 'complete') callback();
  else { document.onreadystatechange = callback; }
};

//
// 
const Enhancer = {};
Enhancer.interval = null;
Enhancer.getCurrentPrice = function getCurrentPrice(){
  const node = document.querySelectorAll('[data-bind="text:navigation.displayBitcoinUsd"]')[0];
  return parseFloat(node.innerText.split('=')[1].replace('$', ''));
}
Enhancer.load = function load(){
  setTimeout(function(){
    Enhancer.go(window, document);
  }, 500);
}
Enhancer.notifyBackground = function notifyBackground(){
  chrome.runtime.sendMessage({processing:true});
}
Enhancer.getMarketsTable = function getMarketsTable(){
  const marketsTable = document.getElementsByTagName('table')[2]; 
  return marketsTable;
}
Enhancer.getOrderTables = function getOrderTables(){
  const buyOrdersTable = document.getElementById('buyOrdersTable');
  const sellOrdersTable = document.getElementById('sellOrdersTable');
  const historyTable = document.getElementById('marketHistoryTable2');
  return {
    buy: buyOrdersTable,
    sell: sellOrdersTable,
    history: historyTable
  };
}
Enhancer.getBalanceTable = function getBalanceTable(){
  const balanceTable = document.getElementById('balanceTable');
  return balanceTable;
}
Enhancer.enhanceMarketsTable = function enhanceMarketsTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(var i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0){
        const columns = row.getElementsByTagName('th');
        updateHeader('enhanced-header-markets', columns[4]);
        continue;
      }
      // Volume -> USD
      const columns = row.getElementsByTagName('td');
      updateColumn(columns[0].innerText+'-last-price', columns[4]);
    }
  }
}
Enhancer.enhanceBalanceTable = function balanceTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(var i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0) {
        const columns = row.getElementsByTagName('th');
        updateHeader('enhanced-header-balance', columns[7]);
        continue;
      }
      // BTC Value + USD
      const columns = row.getElementsByTagName('td');
      updateColumn(columns[2].innerText, columns[7]);
    }
  }
}
Enhancer.enhanceOrderTable = function enhanceOrderTable(type, table){
  let colIdx = type === 'buy' ? 4 : 1;
  const marginProp = 'marginLeft';
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(var i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0) {
        const headerId = type+'-enhanced-header';
        let columns = row.getElementsByTagName('th');
        if(columns.length === 4){
          colIdx -= 1;
        }
        const existingHeader = document.getElementById(headerId);
        if(!existingHeader) {
          const headerCol = columns[colIdx];
          const enhancedHeader = document.createElement('span');
          enhancedHeader.id = headerId;
          enhancedHeader.style.color = CONSTANTS.color;
          enhancedHeader.innerHTML = '(USD)';
          headerCol.appendChild(enhancedHeader);
        }
        continue;
      }
      let columns = row.getElementsByTagName('td');
      const btcPrice = parseFloat(columns[colIdx].innerText);
      let p = Enhancer.getCurrentPrice() * btcPrice;
      if(isNaN(p)){
        continue;
      }
      const curPrice = '$' + p.format(2);
      let id = type+'-row-'+btcPrice;
      const existingNode = document.getElementById(id);
      if(existingNode){
        existingNode.innertHTML = curPrice;
      } else {
        var price = document.createElement('span');
        price.id = id;
        price.style.color = CONSTANTS.color;
        price.style[marginProp] = '10px'; 
        price.innerHTML = curPrice;
        let n = columns[colIdx].childNodes[0];
        n.appendChild(price);
      }
    };
  }
}
Enhancer.enhanceMarketHistoryTable = function enhanceMarketHistoryTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(var i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0) {
        let columns = row.getElementsByTagName('th');
        updateHeader('market-history-bid-enhanced-header', columns[2]);
        updateHeader('market-history-total-enhanced-header', columns[4]);
        continue;
      }
      let columns = row.getElementsByTagName('td');
      const btcPrice = parseFloat(columns[4].innerText);
      let id = 'history-row-'+btcPrice;
      updateColumn(id+'-bid', columns[2]);
      updateColumn(id+'-total', columns[4]);
    };
  }
}
Enhancer.getDataProcessors = function getDataProcessors(proc){
  switch(proc){
    case 'market':
      return function(doc){
        Enhancer.interval = setInterval(function(){ 
          const curPrice = Enhancer.getCurrentPrice();
          const orderTables = Enhancer.getOrderTables();
          Enhancer.enhanceOrderTable('buy', orderTables.buy); 
          Enhancer.enhanceOrderTable('sell', orderTables.sell);
          Enhancer.enhanceMarketHistoryTable(orderTables.history);
        }, 200);
      };
    case 'balance':
      return function (doc){
        Enhancer.interval = setInterval(function(){
          const balanceTable = Enhancer.getBalanceTable();
          Enhancer.enhanceBalanceTable(balanceTable);
        }, 200);
      }
    case 'markets':
      return function (doc){
        Enhancer.interval = setInterval(function(){
          const btcMarketsTable = Enhancer.getMarketsTable();
          Enhancer.enhanceMarketsTable(btcMarketsTable);
        }, 200);
      }
    default:
      return function(doc){}
  } 
};
Enhancer.go = function go(win, doc){
  const url = win.location.href.toLowerCase();
  let type = null;
  if(url.indexOf('/market/') > -1){
    type = 'market';
  } else if (url.indexOf('/balance') > -1){
    type = 'balance';
  } else if (url.indexOf('/home/markets') > -1){
    type = 'markets';
  }
  return Enhancer.getDataProcessors(type)(doc);
}
window.Enhancer = Enhancer;

whenReady(function(){
  Enhancer.load();
  Enhancer.notifyBackground();
});
