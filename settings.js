function getConfigNodes(){ // buttons
    let configShowUsdVal = document.getElementById('configShowUsdVal');
    let configShowTradingViewChart = document.getElementById('configShowTradingViewChart');
    let configTradingViewOptsElmIds = [
        'tvConfWidth',
        'tvConfHeight',
        'tvConfInterval',
        'tvConfTimezone',
        'tvConfTheme',
        'tvConfLocale',
        'tvConfStudies',
        'tvConfStyle',
        'tvConfHide_side_toolbar'
    ];
    let configTradingViewOpts = {};
    configTradingViewOptsElmIds.forEach(function(elmId){
        configTradingViewOpts[elmId] = document.getElementById(elmId);
    });
    return {
        usdVal: configShowUsdVal,
        tvChart: configShowTradingViewChart,
        tvChartOpts: configTradingViewOpts
    }
}
function updateConfigBool(prop){
    return function(evt){
        let data = {};
        let tgt = evt.target;
        if(tgt.nodeName.toLowerCase() === 'span'){
            tgt = tgt.parentElement;
        }
        let val = tgt.getAttribute('data-enabled') === 'true' ? true : false;
        data['bittrex-enhanced-'+prop] = !val;
        tgt.setAttribute('data-enabled', String(!val));
        chrome.storage.sync.set(data);
    };
}
function updateConfigTvObj(prop){
    return function(evt){
        let data = {};
        let tgt = evt.target;
        let isSelect = tgt.nodeName === 'SELECT';
        let isCheckbox = tgt.nodeName === 'INPUT' && tgt.type === 'checkbox';
        let val = isSelect ? Array.prototype.slice.call(tgt.options).map(function(opt){
                                                  if(opt.selected) return opt.value;
                                              }) : tgt.value;
        if(isSelect){
            val = val.filter(function(n){ return n != undefined });
            if(tgt.getAttribute('multiple') !== 'multiple'){
                if(val.length > 0){
                    val = val[0];
                }
            }
        }
        chrome.storage.sync.get('bittrex-enhanced-tvChartOpts', function(data){
            let opts = data['bittrex-enhanced-tvChartOpts']; 
            if(isCheckbox){
                val = tgt.checked;
                if(tgt.id === 'tvConfHide_side_toolbar'){
                    val = !val; // inverse UX
                    // ensure that height > 550 if enabled..
                    if(val && opts.height < 550){
                        opts.height = 550;
                        let node = getConfigNodes().tvChartOpts.tvConfHeight;
                        node.value = opts.height;
                    }
                }
            }
            opts[prop] = val;
            chrome.storage.sync.set({
                'bittrex-enhanced-tvChartOpts': opts
            });
        });
    };
}
function initConfigDropdown(prop, node, val){
    // assigns the value in a dropdown and attaches event listener
    let opts = node.options;
    Array.prototype.slice.call(opts).forEach(function(opt){
        if(opt.value === String(val)){
            opt.selected = true;
        }
    });
    node.onchange = updateConfigTvObj(prop);
}
function initConfigMultiselect(prop, node, values){
    // assigns the values in a multiselect and attaches event listener 
    // (e.g. [{option: 'x', selected: true|false}, ..])
    let opts = node.options;
    Array.prototype.slice.call(opts).forEach(function(opt){
        if(values.indexOf(opt.value) > -1){
            opt.selected = true;
        }
    });
    node.onchange = updateConfigTvObj(prop);
}
function initConfigText(prop, node, val){
    node.value = val;
    node.onblur = updateConfigTvObj(prop);
}
function initConfigBoolean(prop, node, val){
    node.checked = val == true; // purposefully ==
    node.onclick = updateConfigTvObj(prop);
}
function initConfig(configNodes){
    chrome.storage.sync.get([
        'bittrex-enhanced-usdVal',
        'bittrex-enhanced-tvChart'
    ], function(data) {
        configNodes.usdVal.setAttribute('data-enabled', 
            data ? Boolean(data['bittrex-enhanced-usdVal']) : true);
        configNodes.tvChart.setAttribute('data-enabled', 
            data ? Boolean(data['bittrex-enhanced-tvChart']) : true);
    });
}
function initConfigTradingViewOpts(nodes){
    chrome.storage.sync.get('bittrex-enhanced-tvChartOpts', function(data){
        data = data['bittrex-enhanced-tvChartOpts'];
        initConfigText('width', nodes.tvConfWidth, data.width);
        initConfigText('height', nodes.tvConfHeight, data.height);
        initConfigDropdown('interval', nodes.tvConfInterval, data.interval);
        initConfigDropdown('timezone', nodes.tvConfTimezone, data.timezone);
        initConfigDropdown('theme', nodes.tvConfTheme, data.theme);
        initConfigDropdown('style', nodes.tvConfStyle, data.style);
        initConfigDropdown('locale', nodes.tvConfLocale, data.locale);
        initConfigMultiselect('studies', nodes.tvConfStudies, data.studies);
        initConfigBoolean('hide_side_toolbar', nodes.tvConfHide_side_toolbar, !data.hide_side_toolbar);
    });
}
function initForm(){
    let configNodes = getConfigNodes();
    initConfig(configNodes);
    initConfigTradingViewOpts(configNodes.tvChartOpts);
    configNodes.usdVal.onclick = updateConfigBool('usdVal');
    configNodes.tvChart.onclick = updateConfigBool('tvChart');
}

initForm();
