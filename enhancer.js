const CONSTANTS = {
  color: '#0072ed',
  tvTrexPrefix: 'BITTREX',
  tvChartURL: '//s3.tradingview.com/tv.js',
  btcEthTrexApiURL: 'https://bittrex.com/api/v1.1/public/getticker?market=BTC-ETH',
  btcPriceDomExpr: '[data-bind="text:navigation.displayBitcoinUsd"]',
  buyOrdersTableDomID: 'buyOrdersTable',
  sellOrdersTableDomID: 'sellOrdersTable',
  marketHistoryTableDomID: 'marketHistoryTable2',
  balanceTableDomID: 'balanceTable',
  tickerQueryParamName: 'MarketName'
};

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

function updateHeader(headerId, col, text){
  if(document.getElementById(headerId)){
    return;
  }
  if(!text){
    text = ' (USD)';
  }
  const enhancedHeader = document.createElement('span');
  enhancedHeader.id = headerId;
  enhancedHeader.style.color = CONSTANTS.color;
  enhancedHeader.innerText = text;
  col.appendChild(enhancedHeader);
}

function getPriceFromNode(marketType, col){
  let ret = parseFloat(col.childNodes.length > 0 ? col.childNodes[0].textContent : col.innerText);
  return '$' + (Enhancer.getCurrentPrice(marketType) * ret).format(2);
}

function updateColumn(colId, col, marketType, value){
  let rowId = 'enhanced-val-'+colId.replace(/\./g, '-');
  let existingNodes = document.querySelectorAll('.'+rowId);
  const price = typeof(value) === 'undefined' ? getPriceFromNode(marketType, col) 
                                              : value;
  if(existingNodes.length === 0){
    const newNode = document.createElement('span');
    newNode.style.color = CONSTANTS.color;
    newNode.style.marginLeft = '10px';
    newNode.className = rowId;
    newNode.innerText = price;
    col.appendChild(newNode);
  } else {
    for(var i=0; i<existingNodes.length; i++){
      existingNodes[i].innerText = price;
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
Enhancer.marketType = null;
Enhancer.opts = {
  tvChart: false,
  tradingViewOpts: {},
  usdVal: false
};
Enhancer.prices = {
  interval: null,
  btcUsd: 0.0,
  ethBtc: 0.0
};
Enhancer.interval = null;
Enhancer.initBtcPrice = function initBtcPrice(){
  const node = document.querySelectorAll(CONSTANTS.btcPriceDomExpr)[0];
  const btcUsdPrice = parseFloat(node.innerText.split('=')[1].replace('$', ''));
  return btcUsdPrice;
}
Enhancer.initEthPrice = function initEthPrice(){
  const ethTickerURL = CONSTANTS.btcEthTrexApiURL;
  let xhr = new XMLHttpRequest();
  xhr.open('GET', ethTickerURL, false);
  xhr.send(null);
  return JSON.parse(xhr.responseText).result.Last;
}
Enhancer.updatePrices = function updatePrices(){
  Enhancer.prices.ethBtc = Enhancer.initEthPrice();
  Enhancer.prices.btcUsd = Enhancer.initBtcPrice();
}
Enhancer.getMarketType = function getMarketType(mktType){
  if(!mktType && Enhancer.marketType) {
    return Enhancer.marketType;
  }
  if(!mktType){
    mktType = Enhancer.getTickerQP();
  }
  let mkt = null;
  if(mktType.indexOf('-') > -1){
    mkt = mktType.split('-')[0].toLowerCase();
  }
  return Enhancer.marketType = (mkt === 'btc' ? 'btc' : 
                               (mkt === 'eth' ? 'eth' : ''));
}
Enhancer.getCurrentPrice = function getCurrentPrice(marketType){
  let mkt = marketType || Enhancer.getMarketType();
  switch(mkt){
    case 'btc':
      return Enhancer.prices.btcUsd;
    case 'eth':
      let ethBtc = Enhancer.prices.ethBtc;
      return ethBtc * Enhancer.prices.btcUsd;
    default:
      return 0.0;
  }
}
Enhancer.unload = function unload(){
  if(Enhancer.interval){
    clearInterval(Enhancer.interval);
  }
  if(Enhancer.prices.interval){
    clearInterval(Enhancer.prices.interval);
  }
}
Enhancer.getMarketsTables = function getMarketsTables(){
  return document.getElementsByTagName('table');
}
Enhancer.getOrderTables = function getOrderTables(){
  const buyOrdersTable = document.getElementById(CONSTANTS.buyOrdersTableDomID);
  const sellOrdersTable = document.getElementById(CONSTANTS.sellOrdersTableDomID);
  const historyTable = document.getElementById(CONSTANTS.marketHistoryTableDomID);
  return {
    buy: buyOrdersTable,
    sell: sellOrdersTable,
    history: historyTable
  };
}
Enhancer.getBalanceTable = function getBalanceTable(){
  const balanceTable = document.getElementById(CONSTANTS.balanceTableDomID);
  return balanceTable;
}
Enhancer.enhanceMarketsTable = function enhanceMarketsTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(let i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0){
        const columns = row.getElementsByTagName('th');
        let mktType = Enhancer.getMarketType(columns[0].innerText);
        updateHeader('enhanced-header-markets-'+mktType, columns[4]);
        continue;
      }
      // Volume -> USD
      const columns = row.getElementsByTagName('td');
      updateColumn(columns[0].innerText+'-last-price', 
                   columns[4], 
                   Enhancer.getMarketType(columns[0].innerText));
    }
  }
}
Enhancer.enhanceBalanceTable = function balanceTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(let i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0) {
        const columns = row.getElementsByTagName('th');
        updateHeader('enhanced-header-balance-est-price', columns[2], ' (Est. BTC)')
        updateHeader('enhanced-header-balance-btc-price', columns[7]);
        continue;
      }
      // BTC Value + USD
      const columns = row.getElementsByTagName('td');
      const estBtcPrice = parseFloat(columns[7].innerText) / parseFloat(columns[3].innerText);
      let tkn = columns[1].innerText.replace(/\s+/g, '').toLowerCase();
      if(tkn !== 'bitcoin'){
        updateColumn(tkn+'-est-price',
                    columns[2],
                    'btc',
                    estBtcPrice.format(8));
      }
      updateColumn(columns[2].innerText+'-btc-price', 
                   columns[7], 
                   'btc');
    }
  }
}
Enhancer.enhanceOrderTable = function enhanceOrderTable(type, table){
  let colIdx = type === 'buy' ? 4 : 1;
  const marginProp = 'marginLeft';
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(let i=0; i<rows.length; i++){
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
        price.innerText = curPrice;
        let n = columns[colIdx].childNodes[0];
        n.appendChild(price);
      }
    };
  }
}
Enhancer.enhanceMarketHistoryTable = function enhanceMarketHistoryTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length){
    for(let i=0; i<rows.length; i++){
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
Enhancer.initTradingViewWidget = function initTradingViewWidget(ticker, tradingViewOpts){
  const script = document.createElement('script');
  script.src = CONSTANTS.tvChartURL;
  script.async = true;
  script.addEventListener('load', function(){
    let opts = {};
    Object.assign(opts, 
      tradingViewOpts, {
        symbol: ticker,
        container_id: 'tv-chart-'+Enhancer.getTickerQP()
      });
    console.log(opts);
    let insertTradingViewChartCode = 'new TradingView.widget('+JSON.stringify(opts)+');';
    const chartScript = document.createElement('script');
    chartScript.type = 'text/javascript';
    chartScript.innerText = insertTradingViewChartCode;
    document.body.appendChild(chartScript);
  });
  document.head.appendChild(script);
}
Enhancer.getTickerQP = function getTickerQP(){
  let qps = document.location.search.substring(1);
  return qps.indexOf(CONSTANTS.tickerQueryParamName) > -1 ? qps.split('&')[0].split('=')[1] : '';
}
Enhancer.swapCharts = function swapCharts(tradingViewOpts){
  const charts = document.querySelectorAll('.chart-wrapper');
  if(charts.length === 2){ // timeline, orderbook
    // Clean
    let node = charts[0];
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    let ticker = Enhancer.getTickerQP();
    let t = ticker.split('-');
    let tradingViewTicker = CONSTANTS.tvTrexPrefix + ':' + t[1] + t[0]; // e.g. BTC-NEO => BITTREX:NEOBTC
    const newChartParent = document.createElement('div');
    newChartParent.id = "tv-chart-"+ticker;
    node.appendChild(newChartParent);
    // Load TV
    Enhancer.initTradingViewWidget(tradingViewTicker, tradingViewOpts);
  }
}
Enhancer.getDataProcessors = function getDataProcessors(proc, opts){
  let marketType = Enhancer.getMarketType();
  switch(proc){
    case 'market':
      return function(doc){
        if(opts.tvChart){
          setTimeout(function(){ 
            Enhancer.swapCharts(opts.tradingViewOpts); 
          }, 1200);
        }
        if(opts.usdVal){
          Enhancer.updatePrices();
          Enhancer.interval = setInterval(function(){ 
            const orderTables = Enhancer.getOrderTables();
            Enhancer.enhanceOrderTable('buy', orderTables.buy); 
            Enhancer.enhanceOrderTable('sell', orderTables.sell);
            Enhancer.enhanceMarketHistoryTable(orderTables.history);
          }, 200);
          Enhancer.prices.interval = setInterval(Enhancer.updatePrices, 5000);
        }
      };
    case 'balance':
      return function (doc){
        if(opts.usdVal){
          Enhancer.updatePrices();
          Enhancer.interval = setInterval(function(){
            const balanceTable = Enhancer.getBalanceTable();
            Enhancer.enhanceBalanceTable(balanceTable);
          }, 200);
          Enhancer.prices.interval = setInterval(Enhancer.updatePrices, 5000);
        }
      }
    case 'markets':
      return function (doc){
        if(opts.usdVal){
          Enhancer.updatePrices();
          Enhancer.interval = setInterval(function(){
            let tables = Enhancer.getMarketsTables();
            Enhancer.enhanceMarketsTable(tables[2]);
            Enhancer.enhanceMarketsTable(tables[3]);
          }, 200);
          Enhancer.prices.interval = setInterval(Enhancer.updatePrices, 5000);
        }
      }
    default:
      return function(doc){}
  } 
};
Enhancer.go = function go(){
  const path = window.location.pathname.toLowerCase();
  let type = null;
  switch(path){
    case '/market/index':
      type = 'market';
      break;
    case '/balance':
      type = 'balance';
      break;
    case '/':
    case '/home/markets':
      type = 'markets';
      break;
  }
  return Enhancer.getDataProcessors(type, Enhancer.opts)(document);
}
Enhancer.notifyBackground = function notifyBackground(){
  chrome.runtime.sendMessage({
    processing:true
  }, function(settings){
    if(settings.tvChart) {
      Enhancer.opts.tvChart = settings.tvChart;
    }
    if(settings.usdVal) {
      Enhancer.opts.usdVal = settings.usdVal;
    }
    if(settings.tradingViewOpts) {
      Enhancer.opts.tradingViewOpts = settings.tradingViewOpts;
    }
    Enhancer.go();
  });
}

whenReady(function(){
  Enhancer.notifyBackground();
});
