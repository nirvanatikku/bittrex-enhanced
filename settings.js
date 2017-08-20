function getConfigNodes(){ // buttons
    let configShowUsdVal = document.getElementById('configShowUsdVal');
    let configShowTradingViewChart = document.getElementById('configShowTradingViewChart');
    return {
        usdVal: configShowUsdVal,
        tvChart: configShowTradingViewChart
    }
}
function updateConfig(prop){
    return function(evt){
        let data = {};
        let tgt = evt.target;
        if(tgt.nodeName.toLowerCase() === 'span'){
            tgt = tgt.parentElement;
        }
        let val = tgt.getAttribute('data-enabled') === 'true' ? true : false;
        data['bittrex-enhanced-'+prop] = !val;
        evt.target.setAttribute('data-enabled', !val);
        chrome.storage.sync.set(data);
    };
}
function initConfig(){
    let configNodes = getConfigNodes();
    chrome.storage.sync.get('bittrex-enhanced-usdVal', function(data) {
        configNodes.usdVal.setAttribute('data-enabled', 
            data ? Boolean(data['bittrex-enhanced-usdVal']) : true);
    });
    chrome.storage.sync.get('bittrex-enhanced-tvChart', function(data) {
        configNodes.tvChart.setAttribute('data-enabled', 
            data ? Boolean(data['bittrex-enhanced-tvChart']) : true);
    });
}
function initForm(){
    let configNodes = getConfigNodes();
    configNodes.usdVal.onclick = updateConfig('usdVal');
    configNodes.tvChart.onclick = updateConfig('tvChart');
}

initConfig();
initForm();
