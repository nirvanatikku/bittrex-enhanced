const CONSTANTS = {
  color: '#0072ed',
  colMinWidth: '100px',
  tvTrexPrefix: 'BITTREX',
  tvChartURL: '//s3.tradingview.com/tv.js',
  btcEthTrexApiURL: 'https://bittrex.com/api/v1.1/public/getticker?market=BTC-ETH',
  btcPriceDomExpr: '[data-bind="text:navigation.displayBitcoinUsd"]',
  buyOrdersTableDomID: 'buyOrdersTable',
  sellOrdersTableDomID: 'sellOrdersTable',
  marketHistoryTableDomID: 'marketHistoryTable2',
  balanceTableDomID: 'balanceTable',
  tickerQueryParamName: 'MarketName',
  classes: {
    estPrice: 'est-price',
    estUsdPrice: 'est-usd-price',
    estBtcPrice: 'est-btc-price',
    estUsdValue: 'est-usd-value',
    mktHistoryBidAskUsdVal: 'mkt-history-bid-usd-val',
    mktHistoryTotalUsdVal: 'mkt-history-total-usd-val',
    mktHistoryUsdPrice: 'mkt-hist-usd-price',
    mktHistoryUsdTotal: 'mkt-hist-usd-total'
  }
};

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

function getPriceFromNode(marketType, col){
  let nodePrice = parseFloat(col.innerText); 
  let isUsdtMarket = marketType === 'usdt';
  let currencySymbol = isUsdtMarket ? 'Ƀ' : '$';
  let formatDp = isUsdtMarket ? 8 : 2;
  let curPrice = Enhancer.getCurrentPrice(marketType);
  let price = isUsdtMarket ? nodePrice/curPrice : curPrice*nodePrice;
  return currencySymbol + price.format(formatDp);
}

function getChildNodeWithClass(node, clz){
  let ret;
  for(var i=0; i<node.childNodes.length; i++) {
    if(node.childNodes[i].className === clz) {
      ret = node.childNodes[i];
      break;
    }        
  }
  return ret;
}

function updateHeader(headerId, row, colIdx, text){
  if(document.getElementById(headerId)){
    return;
  }
  let headers = row.getElementsByTagName('th');
  let headerCol = headers[colIdx];
  let nodeToInsertBefore = colIdx+1 > headers.length ? -1 : headers[colIdx+1];
  text = text || ' (' + (Enhancer.getMarketType() === 'usdt' ? 'Est. BTC' : 'Est. USD') + ')';
  const enhancedHeader = document.createElement('th');
  enhancedHeader.id = headerId;
  enhancedHeader.style.color = CONSTANTS.color;
  enhancedHeader.innerText = text;
  if(nodeToInsertBefore === -1){
    row.appendChild(enhancedHeader);
  } else {
    row.insertBefore(enhancedHeader, headerCol);
  }
}

function updateColumn(colClass, row, priceColIdx, marketType, priceVal){
  let cols = row.getElementsByTagName('td');
  let priceNode = cols[priceColIdx];
  marketType = marketType || Enhancer.getMarketType();
  const price = typeof(priceVal) !== 'undefined' ? priceVal : getPriceFromNode(marketType, priceNode);
  let existingNode = getChildNodeWithClass(row, colClass);
  if(!existingNode){
    const newNode = document.createElement('td');
    newNode.style.color = CONSTANTS.color;
    newNode.style.minWidth = CONSTANTS.colMinWidth;
    newNode.style.marginLeft = '10px';
    newNode.className = colClass;
    newNode.innerText = price;
    let nodeToInsertBefore = priceColIdx + 1 > cols.length ? -1 : cols[priceColIdx+1];
    if(nodeToInsertBefore === -1){
      row.appendChild(newNode);
    } else {
      row.insertBefore(newNode, priceNode);
    }
  } else {
    existingNode.innerText = price;
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
                               (mkt === 'eth' ? 'eth' : 
                               (mkt === 'usdt' ? 'usdt' : '')));
}
Enhancer.getCurrentPrice = function getCurrentPrice(marketType){
  let mkt = marketType || Enhancer.getMarketType();
  switch(mkt){
    case 'btc':
    case 'usdt':
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
  if(rows && rows.length > 1){
    for(let i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0){
        let columns = row.getElementsByTagName('th');
        let mktType = rows[1].getElementsByTagName('td')[0].innerText.split('-')[0];
        updateHeader("est-price-"+mktType, row, 4, "Est. USD");
        continue;
      }
      // Volume -> USD
      let columns = row.getElementsByTagName('td');
      let alreadyInserted = getChildNodeWithClass(row, CONSTANTS.classes.estUsdPrice);
      updateColumn(CONSTANTS.classes.estUsdPrice, row, alreadyInserted ? 5 : 4, Enhancer.getMarketType(columns[0].innerText));
    }
  }
}
Enhancer.enhanceBalanceTable = function balanceTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length > 1){
    for(let i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0) {
        updateHeader(CONSTANTS.classes.estUsdPrice, row, 3, 'Est. USD');
        updateHeader(CONSTANTS.classes.estBtcPrice, row, 4, 'Est. BTC');
        updateHeader(CONSTANTS.classes.estUsdValue, row, 10, 'Est. USD Value');
        continue;
      }
      // BTC Value + USD
      let alreadyInserted = getChildNodeWithClass(row, CONSTANTS.classes.estUsdValue);
      let priceIdx = 7;
      if(alreadyInserted){
        priceIdx += 2;
      }
      let totalIdx = priceIdx-1;
      const columns = row.getElementsByTagName('td');

      const estBtcPrice = parseFloat(columns[priceIdx].innerText) / parseFloat(columns[totalIdx].innerText);
      const estUsdPrice = estBtcPrice * Enhancer.prices.btcUsd;
      let tkn = columns[1].innerText.replace(/\s+/g, '').toLowerCase();
      if(tkn !== 'bitcoin'){
        updateColumn(CONSTANTS.classes.estUsdPrice, row, 3, 'fiat', '$' + estUsdPrice.format(2));
        updateColumn(CONSTANTS.classes.estBtcPrice, row, 4, 'btc', 'Ƀ' + estBtcPrice.format(8));
      } else {
        updateColumn(CONSTANTS.classes.estUsdPrice, row, 3, 'fiat', "-");
        updateColumn(CONSTANTS.classes.estBtcPrice, row, 4, 'btc', "-");
      }

      const estUsdValue = parseFloat(columns[priceIdx].innerText) * Enhancer.prices.btcUsd;
      updateColumn(CONSTANTS.classes.estUsdValue, row, 10, 'fiat', '$'+estUsdValue.format(2));
    }
  }
}
Enhancer.enhanceOrderTable = function enhanceOrderTable(type, table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length > 1){
    let priceColIdx = type === 'buy' ? 4 : 1;
    let title = type === 'buy' ? 'BID' : 'ASK';
    let isUsdtMarket = Enhancer.getMarketType() === 'usdt';
    // TODO: adjust if signed in or not
    for(let i=0; i<rows.length; i++){
      let row = rows[i];
      if(i===0) {
        updateHeader('est-price-' + type, row, priceColIdx, title + ' (Est. ' + (isUsdtMarket?'BTC':'USD') + ')');
        continue;
      }
      let alreadyInserted = getChildNodeWithClass(row, CONSTANTS.classes.estPrice);
      let priceIdx = priceColIdx;
      if(alreadyInserted){
        priceIdx += type === 'buy' ? 1 : 1;
      }
      updateColumn(CONSTANTS.classes.estPrice, row, priceIdx);
    };
  }
}
Enhancer.enhanceMarketHistoryTable = function enhanceMarketHistoryTable(table){
  const rows = table.getElementsByTagName('tr');
  if(rows && rows.length > 1){
    for(let i=0; i<rows.length; i++){
      let row = rows[i];
      let isUsdtMarket = Enhancer.getMarketType() === 'usdt';
      if(i===0) {
        updateHeader(CONSTANTS.classes.mktHistoryBidAskUsdVal, row, 2, 'BID/ASK (Est. ' + (isUsdtMarket?'BTC':'USD') + ')');
        updateHeader(CONSTANTS.classes.mktHistoryTotalUsdVal, row, 5, 'TOTAL COST (Est. ' + (isUsdtMarket?'BTC':'USD') + ')');
        continue;
      }
      let alreadyInserted = getChildNodeWithClass(row, "mkt-hist-usd-price");
      let priceIdx = 2;
      let totalIdx = 5;
      if(alreadyInserted){
        priceIdx += 1;
        totalIdx += 1;
      }
      updateColumn(CONSTANTS.classes.mktHistoryUsdPrice, row, priceIdx);
      updateColumn(CONSTANTS.classes.nktHistoryUsdTotal, row, totalIdx);
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
          const marketQp = Enhancer.getTickerQP();
          Enhancer.updatePrices();
          Enhancer.interval = setInterval(function(){ 
            const orderTables = Enhancer.getOrderTables();
            Enhancer.enhanceOrderTable('buy', orderTables.buy); 
            Enhancer.enhanceOrderTable('sell', orderTables.sell);
            if(marketQp.toLowerCase() !== 'usdt-btc'){
              Enhancer.enhanceMarketHistoryTable(orderTables.history);
            }
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
