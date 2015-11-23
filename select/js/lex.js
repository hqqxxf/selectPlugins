/**
 * 乐享通用js
 * Created by dongyq on 9/4/15.
 * qq:1013501639
 */
(function(w, c){
    /*${}类型的字符替换*/
    String.prototype.customReplace = function(from, to, type){
        from = from.toString();
        var reg = (type && (type=="g" || type=="i" || type =="m"))?new RegExp("\\${"+from+"}",type):new RegExp("\\${"+from+"}");
        var str = this.toString().replace(reg, to);
        return str;
    };
    /*填充页面内容时屏蔽代码注入*/
    String.prototype.xssEncode = function(){
        return this.replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };
    if(!String.prototype.trim){
        String.prototype.trim = function(){
            return this.replace(/(^\s*)|(\s*$)/g, "");
        }
    }
    function getHrefData(){
        var searchParam = decodeURIComponent(location.search).replace(/\?/, '').split('&'),
            hrefdata = {};
        for(var i = 0; i < searchParam.length; i++){
            hrefdata[searchParam[i].split('=')[0].toLowerCase()] = searchParam[i].split('=')[1];
        }
        return hrefdata;
    }
    var config = {
        storageType: 1,//0:不缓存，1:临时缓存，2:永久存储
        baseUrl: ''
    };
    /*合并配置信息*/
    (function(){
        if(c){
            for(var attr in config){
                config[attr] = (c[attr] != null && c[attr] != undefined) ? c[attr] : config[attr];
            }
        }
    })();
    var lex = w.lex = {
        oneDateTime: 24 * 60 * 60 * 1000,
        httpUrl: "https://api.zhugeio.com",
        lang: {
            /*获取指定范围的随机数*/
            getRandom: function(min, max){
                return Math.round(Math.random()*(max-min))+min;
            },
            power: function(num, y){
                var sum = 1;
                while(y--){
                    sum *= num;
                }
                return sum;
            },
            toDecimal: function(num, len){
                var f = parseFloat(num);
                if (isNaN(f)){
                    return false;
                }
                var str = (Math.round(f * this.power(10, len)) / this.power(10, len)).toString();
                var l = str.indexOf('.');
                if(l < 0){
                    l = str.length;
                    str += '.';
                }
                while(str.length <= l + len){
                    str += '0';
                }
                return str;
            },
            /*判断对象是否为数组类型*/
            isArray: function(obj){
                return Object.prototype.toString.call(obj) === '[object Array]';
            },
            isString: function(obj){
                return Object.prototype.toString.call(obj) === '[object String]';
            },
            isObject: function(obj){
                return Object.prototype.toString.call(obj) === '[object Object]';
            },
            /*判断对象是否为空对象*/
            isEmptyObject: function(obj){
                var attr = null;
                for(attr in obj){}
                return attr ? false : true;
            },
            /*判断两个对象是否相等*/
            isEqual: function(a, b){
                return JSON.stringify(a) == JSON.stringify(b);
            },
            isConstructorOf: function(obj, name){
                try{
                    return obj.constructor.name === name;
                }catch(error){
                    return false;
                }
            },
            inArray: function(arr, a){
                for(var i=0; i<arr.length; i++){
                    if((typeof(arr[i]) == "number" || typeof(a) == "number") && arr[i] == a){
                        return 1;
                    }
                    if(this.isEqual(a,arr[i])){
                        return 1;
                    }
                }
                return 0;
            },
            toThousands: function(num) {
                var num = (num || 0).toString(), result = '';
                while (num.length > 3) {
                    result = ',' + num.slice(-3) + result;
                    num = num.slice(0, num.length - 3);
                }
                if (num) { result = num + result; }
                return result;
            },
            /*对象克隆*/
            clone: function(obj){
                if(lex.lang.isArray(obj)){
                    var arr = [];
                    for(var i = 0; i < obj.length; i++){
                        arr.push(lex.lang.clone(obj[i]));
                    }
                    return arr;
                }
                if(!this.isObject(obj)) return obj;
                if(obj == null) return obj;
                var myNewObj = new Object();
                for(var i in obj){
                    myNewObj[i] = lex.lang.clone(obj[i]);
                }
                return myNewObj;
            },
            /*对象合并*/
            mergeObject: function(a, b){
                for(var prop in a){
                    if(this.isObject(a[prop])){
                        b[prop] = b[prop] ? b[prop] : {};
                        this.mergeObject(a[prop], b[prop]);
                    }else if(this.isArray(a[prop])){
                        b[prop] = this.isArray(b[prop]) ? b[prop] : a[prop];
                    }else{
                        b[prop] = (b[prop] === null || b[prop] === undefined) ? a[prop] : b[prop];
                    }
                }
                return this.clone(b);
            },
            dateFormat: function(date, f){
                var format = f ? f : 'yyyy-mm-dd',
                    m = date.getMonth() + 1,
                    d = date.getDate();
                format = format.toLowerCase();
                return format.replace("yyyy", date.getFullYear())
                    .replace("mm", m >= 10 ? m : ("0" + m.toString()))
                    .replace("dd", d >= 10 ? d : ("0" + d.toString()));
            },
            getDate: function(str){
                var date = new Date();
                date.setFullYear(str.substr(0, 4));
                date.setMonth(str.substr(4, 2) - 1);
                date.setDate(str.substr(6, 2));
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
                date.setMilliseconds(0);
                return date;
            },
            /*区分中英文截取字符串长度*/
            splitString: function(str, olength){
                var resString = '',
                    len = 0,
                    reg = new RegExp(/[^\x00-\xff]/);
                for(var i = 0; i < str.length; i++){
                    var char = str.charAt(i);
                    len += (reg.test(char) ? 2 : 1);
                    if(len <= olength){
                        resString += char;
                    }
                }
                return {
                    str: resString,
                    len: len
                };
            },
            toHref: function(url, data){
                url += '?';
                var param = [];
                for(var prop in data){
                    param.push(prop + '=' + data[prop]);
                }
                url += param.join('&');
                return url;
            },
            /*通过筛选条件获取文本描述*/
            getConditionTxt: function(condition){
                if(!condition)return null;
                var resultTxt = '',
                    propTxt = '属性筛选条件：',
                    propArr = [],
                    eventTxt = '事件筛选条件：',
                    eventArr = [];
                for(var i = 0; i < condition.userCondition.userSingleConditions.length; i++){
                    var txt = '';
                    if(i > 0){
                        txt = condition.userCondition.operator;
                    }
                    txt += condition.userCondition.userSingleConditions[i].extra;
                    propArr.push(txt);
                }
                propTxt += propArr.length ? propArr.join('; ') : '无';
                for(var i = 0; i < condition.eventCondition.eventSingleConditions.length; i++){
                    var txt = '';
                    if(i > 0){
                        txt = condition.eventCondition.operator;
                    }
                    txt += condition.eventCondition.eventSingleConditions[i].extra;
                    eventArr.push(txt);
                }
                eventTxt += eventArr.length ? eventArr.join('; ') : '无';
                resultTxt = propTxt + '。' + eventTxt;
                return resultTxt ? resultTxt : null;
            }
        },
        log: function(){
            if(w.console && window.openLog){
                var array = [],
                    item = null;
                for(item in arguments){
                    array.push(arguments[item]);
                }
                console.info.apply(console, array);
            }
        },
        error: function(){
            if(w.console){
                var array = [],
                    item = null;
                for(item in arguments){
                    array.push(arguments[item]);
                }
                console.error.apply(console, array);
            }
        },
        keyCodeMap: {
            enter: 13,
            up: 38,
            down: 40,
            left: 37,
            right: 39,
            del:8,
            tab: 9,
            shift: 16,
            esc: 27
        },
        //客户端存储
        storage: {
            setItem: function(){
                return getStorage().setItem.apply(getStorage(), Array.prototype.slice.call(arguments));
            },
            getItem: function(){
                return getStorage().getItem.apply(getStorage(), Array.prototype.slice.call(arguments));
            },
            clear: function(){
                return getStorage().clear.apply(getStorage(), Array.prototype.slice.call(arguments));
            },
            removeItem: function(){
                return getStorage().removeItem.apply(getStorage(), Array.prototype.slice.call(arguments));
            }
        },
        /*cookie工具*/
        cookieUtil: {
            get: function(name){
                var cookieName = encodeURIComponent(name) + "=",
                    cookieStart = document.cookie.indexOf(cookieName),
                    cookieValue = null;
                if(cookieStart > -1){
                    var cookieEnd = document.cookie.indexOf(";", cookieStart);
                    if(cookieEnd == -1){
                        cookieEnd = document.cookie.length;
                    }
                    cookieValue = decodeURIComponent(document.cookie.substring(cookieStart + cookieName.length, cookieEnd));
                }
                return cookieValue;
            },
            /*
             * 名、值、失效日期、路径、域
             * */
            set: function(name, value, expires, path, domain, secure){
                var cookieText = encodeURIComponent(name) + "=" + encodeURIComponent(value);

                if(expires instanceof Date){
                    cookieText += "; expires=" + expires.toGMTString();
                }
                if(path){
                    cookieText += "; path=" + path;
                }
                if(domain){
                    cookieText += "; domain=" + domain;
                }
                if(secure){
                    cookieText += "; secure";
                }
                document.cookie = cookieText;
            },

            unset: function(name, path, domain, secure){
                this.set(name, "", new Date(0), path, domain, secure);
            }
        },
        /*事件工具*/
        eventUtil: {
            /*滚轮事件*/
            getWheelEventName: function(){
                return "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
                    document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                        "DOMMouseScroll";// let's assume that remaining browsers are older Firefox
            },
            /*事件绑定*/
            bind: function(element, type, handler){
                var util = $.myUtil;
                if(element.addEventListener){
                    element.addEventListener(type, handler, false);
                }else if(element.attachEvent){
                    element.attachEvent("on"+type, handler);
                }else{
                    element["on" + type] = handler;
                }
            },
            /*解绑事件*/
            unbind: function(element, type, handler){
                if(element.removeEventListener){
                    element.removeEventListener(type, handler, false);
                }else if(element.detachEvent){
                    element.detachEvent("on" + type, handler);
                }else{
                    element["on" + type] = null;
                }
            },
            preventDefault:function(event){
                if(event.preventDefault)event.preventDefault();
                if(event.stopPropagation)event.stopPropagation();
                if(event.returnValue)event.returnValue = false;
                if(event.cancelBubble) event.cancelBubble = true;
            }
        },
        /*echart相关工具方法*/
        echartsUtil: {
            fieldName: {
                uv: '活跃用户数',
                add: '',
                pv: getHrefData().plat == 3 ? '访问次数' : '启动次数',
                ev: '触发次数',
                eu: '触发人数'
            },
            line:{
                getOption: function(origData, fieldOfShow, queryParam, compareData){
                    var that = this;
                    var charOption = {
                        tooltip : {
                            trigger : 'axis',
                            formatter : function(params, ticket, callback) {
                                var index = params[0].dataIndex,
                                    xAxis = lex.echartsUtil.line.getXAxis(origData, queryParam),
                                    compareXAxis = lex.echartsUtil.line.getXAxis(compareData ? compareData : origData, queryParam),
                                    tip = '<a style="color:#fff;">'+xAxis[index]+'</a>' + '<br/>',
                                    compareTip = '<a style="color:#fff;">'+compareXAxis[index]+'</a>' + '<br/>';
                                for(var i = 0; i < origData.items.length; i++){
                                    var item = origData.items[i];
                                    tip += lex.echartsUtil.splitName(lex.echartsUtil.getName(item, queryParam))
                                        + " : "
                                        + '<a style="color:#66ccff;">'+item.items[index][fieldOfShow]+'</a>' + '<br/>';
                                }
                                for(var i = 0; compareData && i < compareData.items.length; i++){
                                    var item = compareData.items[i];
                                    compareTip += lex.echartsUtil.splitName(lex.echartsUtil.getName(item, queryParam).replace(/\(\d{2}-\d{2}~\d{2}-\d{2}\)/, ''))
                                        + " : "
                                        + '<a style="color:#66ccff;">' + item.items[index][fieldOfShow] + '</a><br/>';
                                }
                                return tip + (compareData ? compareTip : '');
                            }
                        },
                        legend : {
                            y : "bottom",
                            data : that.getLegend(origData, fieldOfShow, queryParam, compareData),
                            formatter : function(str) {
                                var suffix = (false && compareData.exist && (str.indexOf("| 对比") > -1)) ? ("(" + compareData.begin + "~" + compareData.end + ")") : "";
                                str = str.replace("| 对比", "");
                                return (str.length > 20 ? (str.substr(0, 20) + '...') : str) + suffix;
                            }
                        },
                        calculable : false,// 是否启用拖拽
                        grid : {
                            width : "90%",
                            x : "5%",
                            y : "5%"
                        },
                        xAxis : [ {
                            splitLine : {
                                show : false
                            },
                            axisLine : {
                                show : true
                            },
                            type : 'category',
                            boundaryGap : false,
                            data : that.getXAxis(origData, queryParam)
                        } ],
                        yAxis : [ {
                            splitLine : {
                                show : true
                            },
                            axisLine : {
                                show : false
                            },
                            type : 'value',
                            axisLabel : {
                                formatter : function(value) {
                                    if (value > 999 & value < 10000) {
                                        return (value / 1000).toFixed(1).toString() + "k";
                                    } else if (value >= 10000) {
                                        return (value / 10000).toFixed(1).toString() + "w";
                                    }
                                    return value;
                                }
                            }
                        } ],
                        series : this.getSeries(origData, fieldOfShow, queryParam, compareData)
                    };
                    return charOption;
                },
                getXAxis: function(origData, queryParam){
                    var axisArr = [];
                    for(var i = 0; origData.items[0] && origData.items[0].items && i < origData.items[0].items.length; i++){
                        var item = origData.items[0].items[i],
                            axis = '';
                        switch(parseInt(queryParam.tid)){
                            case 101://时
                                var dateArr = item.xstring.match(/(\d{4})(\d{2})(\d{2})/),
                                    timeArr = item.xstring.match(/(\d{4})(\d{2})(\d{2})(\d{2})/);
                                dateArr.splice(0, 2);
                                timeArr.splice(0, 4);
                                axis = dateArr.join('-').replace() + ' ' + timeArr[0] + ':00';
                                break;
                            case 102://天
                                var dateArr = item.xstring.match(/(\d{4})(\d{2})(\d{2})/);
                                dateArr.splice(0, 2);
                                axis = dateArr.join('-');
                                break;
                            case 103://周
                            case 104://月
                                var date1 = item.xstring.split('|')[0].match(/(\d{4})(\d{2})(\d{2})/),
                                    date2 = item.xstring.split('|')[1].match(/(\d{4})(\d{2})(\d{2})/);
                                date1.splice(0, 2);
                                date2.splice(0, 2);
                                axis = date1.join('-') + '~' + date2.join('-');
                                break;
                        }
                        axisArr.push(axis);
                    }
                    return axisArr;
                },
                getSeries: function(origData, fieldOfShow, queryParam, compareData){
                    var series = [];
                    for(var i = 0; i < origData.items.length; i++){
                        var item = origData.items[i],
                            serie = new Serie(lex.echartsUtil.getName(item, queryParam), 'line');
                        for(var j = 0; j < item.items.length; j++){
                            serie.data.push(item.items[j][fieldOfShow]);
                        }
                        series.push(serie);
                    }

                    for(var i = 0; compareData && i < compareData.items.length; i++){
                        var item = compareData.items[i],
                            serie = new Serie(lex.echartsUtil.getName(item, queryParam), 'line');
                        for(var j = 0; j < item.items.length; j++){
                            serie.data.push(item.items[j][fieldOfShow]);
                        }
                        series.push(serie);
                    }
                    return series;
                },
                getLegend: function(origData, fieldOfShow, queryParam, compareData){
                    var legends = [];
                    for(var i = 0; i < origData.items.length; i++){
                        var item = origData.items[i];
                        legends.push(lex.echartsUtil.getName(item, queryParam));
                    }
                    for(i = 0; compareData && i < compareData.items.length; i++){
                        var item = compareData.items[i];
                        legends.push(lex.echartsUtil.getName(item, queryParam))
                    }
                    return legends;
                }
            },
            bar: {
                getOption: function(origData, queryParam, showFields){
                    var charOption = {
                        tooltip : {
                            trigger : 'axis'
                        },
                        legend : {
                            y : "bottom",
                            data : this.getLegend(showFields)
                        },
                        calculable : false,// 是否启用拖拽
                        grid : {
                            width : "90%",
                            x : "5%",
                            y : "5%"
                        },
                        xAxis : [ {
                            splitLine : {
                                show : false
                            },
                            axisLine : {
                                show : true
                            },
                            type : 'category',
                            boundaryGap : true,
                            data : this.getXaxis(origData)
                        } ],
                        yAxis : [ {
                            splitLine : {
                                show : true
                            },
                            axisLine : {
                                show : false
                            },
                            type : 'value'
                        } ],
                        series : this.getSeries(origData, showFields)
                    };
                    return charOption;
                },
                getSeries: function(origData, showFields){
                    var seriesArr = [];
                    for(var i = 0; i < showFields.length; i++){
                        var series = new Serie(lex.echartsUtil.fieldName[showFields[i]], 'bar');
                        for(var j = 0; j < origData.length; j++){
                            series.data.push(origData[j][showFields[i]]);
                        }
                        seriesArr.push(series);
                    }
                    return seriesArr;
                },
                getXaxis: function(origData){
                    var axis = [];
                    for(var i = 0; i < origData.length; i++){
                        axis.push(origData[i].xstring);
                    }
                    return axis;
                },
                getLegend: function(showFields){
                    var legends = [];
                    for(var i = 0; i < showFields.length; i++){
                        legends.push(lex.echartsUtil.fieldName[showFields[i]]);
                    }
                    return legends;
                }
            },
            pie: {
                getOption: function(originData, showFiled){
                    var option = {
                        tooltip : {
                            trigger : 'item',
                            formatter : function(data){//"{a} <br/>{b} : {c} ({d}%)"
                                var str = '<a style="color:#fff">'+data[0]+'</a>' + '<br/>';
                                str += lex.echartsUtil.splitName(data[1]) + ' : <a style="color:#66ccff">' + data[2] + '('+ data[3] +'%)</a>';
                                return str;
                            }
                        },
                        legend : {
                            orient : 'vertical',
                            x : 'left',
                            data : this.getLegend(originData),
                            show : false
                        },
                        calculable : false,
                        series : [ {
                            name : lex.echartsUtil.fieldName[showFiled],
                            type : 'pie',
                            radius : '55%',
                            center : [ '50%', '60%' ],
                            data : this.getSeriesDatas(originData, showFiled)
                        } ]
                    };
                    return option;
                },
                getLegend: function(originData){
                    var legends = [];
                    for(var i = 0; i < originData.length; i++){
                        legends.push(originData[i].data.xstring);
                    }
                    return legends;
                },
                getSeriesDatas: function(originData, showField){
                    var datas = [];
                    for(var i = 0; i < originData.length; i++){
                        datas.push({
                            value: originData[i].data[showField],
                            name: originData[i].data.xstring
                        });
                    }
                    return datas;
                }
            },
            splitName: function(str){
                var strArr = str.match(/[\S\s]{30}/g),
                    result = '';
                for(var i = 0; strArr && i < strArr.length; i++){
                    result += strArr[i] + '<br/>';
                }
                result = result ? result.replace(/(<br\/>\B)/, '') : str;
                return '<a style="color: #ddd;">'+ result +'</a>';
            },
            getName: function(group, queryParam){
                var value = group.groupValue,
                    suffix = '';
                if(group.compare){
                    suffix = '(' +
                        lex.lang.dateFormat(lex.lang.getDate(group.items[0].xstring), 'mm-dd') +//开始日期
                        '~' +
                        lex.lang.dateFormat(lex.lang.getDate(group.items[group.items.length - 1].xstring), 'mm-dd') +//结束日期
                        ')';
                }
                if(!value){
                    switch(queryParam.did){
                        case 152:
                        case 151:
                            value = '直接访问';
                            break;
                        default:
                            value = '未知';
                            break;
                    }
                }
                return value + suffix;
            }
        },
        canvasUtil: {
            /*获取鼠标在画布上点击的坐标*/
            getPoint:function(canvas, event){
                var position = $(canvas).position();
                return {
                    x: (event.clientX ? event.clientX : event.changedTouches && event.changedTouches[0] && event.changedTouches[0].pageX) - position.left,
                    y: (event.clientY ? event.clientY : event.changedTouches && event.changedTouches[0] && event.changedTouches[0].pageY) - position.top
                }
            },
            /*绘制辅助线（带坐标）*/
            assistLine:function(toCanvas, context){
                toCanvas.mousemove(function(event){
                    lex.eventUtil.preventDefault(event);
                    context.save();
                    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
                    var point = lex.canvasUtil.getPoint(context.canvas, event),
                        txt = 'x:'+point.x+',y:'+point.y;

                    context.beginPath();
                    context.moveTo(0, point.y);
                    context.lineTo(context.canvas.width, point.y);
                    context.stroke();
                    context.beginPath();
                    context.moveTo(point.x, 0);
                    context.lineTo(point.x, context.canvas.height);
                    context.stroke();

                    context.beginPath();
                    context.fillStyle = 'red';
                    context.lineWidth = 1;
                    context.textAlign = "start";
                    context.textBaseline = "top";
                    context.fillText(txt, (context.canvas.width - context.measureText(txt).width), 0);

                    context.restore();
                });
            }
        },
        /*加载html或者其它文本模板方法，并且提供客户端缓存功能*/
        loadTemplate: function(url, callback, data){
            url = version + '/' + url;
            var htm = lex.storage.getItem(url),
                random = Math.random().toString().split(".")[1];
            if(htm){
                callback.call(this, lex.templateHandle(htm, data).customReplace("basePath", config.baseUrl, 'g'));
            }else{
                jQuery.ajax({
                    url: url + '?v=' + random,
                    type: "GET",
                    dataType: 'text',
                    success: function(html){
                        callback.call(this, lex.templateHandle(html, data).customReplace("basePath", config.baseUrl, 'g'));
                        lex.storage.setItem(url, html);
                    },
                    error: function(error){
                        lex.error(url + "目标模板加载失败: ", error);
                    }
                })
            }
        },
        /*模板内容通用处理*/
        templateHandle: function(htm, data){
            var result = htm;
            for(var param in data){
                result = result.customReplace(param, data[param], 'g');
            }
            return result;
        }
    };

    function getStorage(){
        if(typeof Storage !== "undefined"){
            switch(config.storageType){
                case 0:
                    return {
                        setItem: function(){},
                        getItem: function(){},
                        clear: function(){},
                        removeItem: function(){}
                    };
                case 1:
                    return sessionStorage;
                case 2:
                    return localStorage;
            }
        }
        return {
            setItem: function(){},
            getItem: function(){},
            clear: function(){},
            removeItem: function(){}
        };
    }
    /*获取echarts格式的series*/
    function Serie(name, type){
        this.name = name;
        this.type = type;
        this.data = [];
    }
    lex.getSeries = function(datas, type, showType, did){
        var named = {};
        var series = [],
            legend = [],
            legendSelected = {};

        var hrefData = pageTopJs.gethrefdata();

        if(showType){
            for(var i = 0; i < datas.length; i++){
                var item = datas[i];
                var serie = {
                    name: (item.groupValue ? item.groupValue : (did == 151 || did == 152) ? "直接访问" : '未知') + (item.compare ? " | 对比" : ""),
                    type: type,
                    data: []
                };
                legend.push(serie.name);
                for(var j = 0; j < item.items.length; j++){
                    var itemj = item.items[j];
                    serie.data.push(itemj[showType]);
                }
                series.push(serie);
            }
            return {
                series:series,
                legend: legend
            };
        }
        for(var i = 0; i < datas.length; i++){
            var item = datas[i];
            if(item.compare){
                for(var attr in item){
                    if(!named[attr+"new"]){
                        switch(attr+"new"){
                            case 'eid'+"new":
                            case 'attrid'+"new":
                                break;
                            case 'uv'+"new":
                                named["uv"+"new"] = new Serie("活跃用户数 | 对比", type);
                                named["uv"+"new"].data.push(item["uv"]);
                                break;
                            case 'add'+"new":
                                named["add"+"new"] = new Serie("新增用户数 | 对比", type);
                                named["add"+"new"].data.push(item["add"]);
                                break;
                            case 'pv'+"new":
                                named["pv"+"new"] = new Serie((hrefData.plat == 3 ? '访问次数' : '启动次数') + " | 对比", type);
                                named["pv"+"new"].data.push(item.pv);
                                break;
                            case 'ev'+"new":
                                //named["ev"+"new"] = new Serie("目标事件触发次数 | 对比", type);
                                //named["ev"+"new"].data.push(item.ev);
                                break;
                            case 'eu'+"new":
                                //named.eu = new Serie("事件访问人数", type);
                                //named.eu.data.push(item.eu);
                                break;
                            case 'per'+"new":
                                //named.per = new Serie("新增用户数增长率", type);
                                //named.per.data.push(item.per);
                                break;
                            case 'xstring'+"new":
                                break;
                        }
                    }else{
                        named[attr + "new"].data.push(item[attr]);
                    }
                }
            }else{
                for(var attr in item){
                    if(!named[attr]){
                        switch(attr){
                            case 'eid':
                            case 'attrid':
                                break;
                            case 'uv':
                                named["uv"] = new Serie(item.compare ? "活跃用户数 | 对比" : "活跃用户数", type);
                                named["uv"].data.push(item["uv"]);
                                break;
                            case 'add':
                                if(did == 401)continue;
                                named["add"] = new Serie(item.compare ? "新增用户数 | 对比" : "新增用户数", type);
                                named["add"].data.push(item["add"]);
                                break;
                            case 'pv':
                                named["pv"] = new Serie(item.compare ? (hrefData.plat == 3 ? '访问次数' : '启动次数')+" | 对比" : (hrefData.plat == 3 ? '访问次数' : '启动次数'), type);
                                named["pv"].data.push(item.pv);
                                break;
                            case 'ev':
                                if(did == 401)continue;
                                //named.ev = new Serie(item.compare ? "目标事件触发次数 | 对比" : "目标事件触发次数", type);
                                //named.ev.data.push(item.ev);
                                break;
                            case 'eu':
                                //named.eu = new Serie("事件访问人数", type);
                                //named.eu.data.push(item.eu);
                                break;
                            case 'per':
                                if(did == 401 || did == 101)continue;
                                named.per = new Serie("新增用户增长率", type);
                                named.per.data.push(item.per);
                                break;
                            case 'userRetention':
                                if(did == 401)continue;
                                named.userRetention = new Serie("新增用户次日留存", type);
                                named.userRetention.data.push(item.userRetention);
                                break;
                            case 'xstring':
                                break;
                        }
                    }else{
                        if(did == 401 && (attr == "add" || attr == "ev")){
                            continue;
                        }
                        named[attr].data.push(item[attr]);
                    }
                }
            }

        }
        for(var attr in named){
            series.push(named[attr]);
            legend.push(named[attr].name);
            legendSelected[named[attr].name] = (did == 101 && attr=="add") ? true : (did != 101 ? true : false);
        }
        if(did == 101){
            legend = ["新增用户数","活跃用户数",(hrefData.plat == 3 ? '访问次数' : '启动次数')/*,"目标事件触发次数"*/];
        }
        return {
            series:series,
            legend: legend,
            legendSelected: legendSelected
        };
    };

    /*判断有没有加载jquery，没有的话提示错误*/
    if(!w.jQuery){
        lex.error("未加载jquery库");
        return;
    }
    $("body").mousedown(function(event){
        if($("#ui-datepicker-div").has(event.target).length){
            lex.eventUtil.preventDefault(event);
            return false;
        }
    });
})(window, typeof lexConfig === 'undefined' ? {} : lexConfig);