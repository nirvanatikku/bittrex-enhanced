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
        data['bittrex-enhanced-'+prop] = evt.target.getAttribute('data-enabled') === 'true' ? false : true;
        chrome.storage.sync.set(data);
        evt.target.setAttribute('data-enabled', data['bittrex-enhanced-'+prop]);
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
