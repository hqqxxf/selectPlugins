/**
 * Created by Administrator on 2015/11/21.
 */
/**
 * Created by yqdong on 15/5/21.
 * 自动完成下拉框
 可输入匹配：
 1、不存在下拉箭头，默认列出前10项
 2、支持本地数据类型
 1）一次获取所有数据
 2）本地进行输入检索匹配
 3、支持异步请求数据
 1）异步请求增加客户端session缓存
 4、监测keydown、keyup、focus、focus out 、click、change事件
 禁止输入匹配：
 1、输入框不可编辑
 2、输入框带有下拉箭头
 3、点击输入框列出全部选项
 通用功能：
 1、支持键盘上下、左右键操作
 2、支持回车键自动键入
 3、获取焦点后显示默认选项
 4、失去焦点后隐藏选项

 */
define([
    'base'
], function(base){
    (function($){
        $.fn.searchSelect = function(options){
            var defaults = {
                    editable: false,//是否可编辑输入
                    showArrow: true,//是否显示箭头
                    showOnInputTop: false,//下拉框显示在输入框上方
                    classes: '',//附加样式类名称
                    datas: [],//数据源（如果是异步请求方式，则为空）
                    searchUrl: '',//异步请求URL（如果是本地数据类型，则为空）
                    searchParam: null,//请求参数对象，当该参数为空时，认为查询参数值为字符串类型，直接获取输入框文本；
                    // 当为对象类型时，searchParamField参数有效，将输入框文本付给该对象的searchParamField参数
                    alwayShow: false,//选项一直显示，与输入框为一体
                    searchParamField: '',
                    searchField: '',//查询参数名称。当searchUrl存在时，该参数不能为空
                    fieldName: '',//需要进行显示的数据源属性名称
                    loopDataFormat: '',//查询结果的遍历格式xxx.xxx.xxx,目标指到要遍历的数组
                    optionFormat: null,//选项格式化显示方式

                    placeHolder: '请选择',//输入框默认显示文本
                    width: 170,//选择框整体宽度

                    onChoose: null,
                    chooseFirstOption: false,//默认自动选择第一项
                    autoComplete: true//用户触发离开动作时，并且没有完成选择时，是否自动选择第一项（仅当输入框可编辑情况下有效）
                },
                opts = $.extend(defaults, options),
                randomId = Math.random().toString().split('.')[1],
                ajax = null;
            if(!opts.fieldName){
                lex.error("显示字段名称(fieldName)不能为空");
                return false;
            }
            if(!opts.searchUrl && !opts.datas){
                lex.error("异步请求模式请设置请求地址(searchUrl), 本地数据模式,则请设置数据源(datas)");
                return false;
            }
            if(opts.searchUrl && !opts.searchField){
                lex.error("查询参数名称(searchField)不能为空");
                return false;
            }

            var handler = {
                firstActive: function(){
                    ul.find('li["data-custom"]:first').addClass('active');
                },
                removeAllActive: function(){
                    ul.find('li["data-custom"]').removeClass('active');
                },
                removeAllList: function(){
                    ul.find("li[data-custom='true']").remove();
                },
                firstChoose: function(){
                    ul.find('li["data-custom"]:first').click();
                },
                noMatch: function(){
                    ul.append($(li.customReplace('name', '暂无匹配项', 'g')
                        .customReplace('class', 'class="active"'))
                        .data('optData', null));
                },
                showList: function(){
                    zhugeSelect.find('div.search').show();
                    ul.show();
                },
                hideList: function(){
                    zhugeSelect.find('div.search').hide();
                    ul.hide();
                }
            };

            var htmTemplate = '<div id="zhugeSelect_${id}" class="zhuge_select ${class}" style="width: ${width}px;">' +
                '<input id="searchSelect_${id}" class="zhuge_select" readonly placeholder="${placeHolder}">' +
                '<div class="search" style="display: none;">' +
                '<input id="searchSelectText_${id}" type="text" value="" class="zhuge_search"/>' +
                '</div>' +
                '<ul id="ulContent_${id}" class="zhuge_dropdownlist" style="display: none;">' +
                '</ul>' +
                '</div>';
            $(this).empty().append(htmTemplate.customReplace("id", randomId, 'g')
                .customReplace('class', opts.classes)
                .customReplace('width', opts.width, 'g')
                .customReplace('placeHolder', opts.placeHolder));

            var searchSelect = $("#searchSelect_" + randomId),
                searchSelectText = $("#searchSelectText_" + randomId),
                zhugeSelect = $('#zhugeSelect_' + randomId),
                ul = $("#ulContent_" + randomId),
                li = '<li data-custom="true" ${class} title="${name}">${name}</li>';
            if(opts.chooseFirstOption){
                handler.firstChoose();
            }
            bindEditEvents();
            //编辑查询相关事件处理
            function bindEditEvents(){
                var isLocalDatas = opts.searchUrl ? false : true,
                    arr = [];
                if(isLocalDatas){//加载全部数据
                    for(var i = 0; i < opts.datas.length; i++){
                        arr.push($(li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(opts.datas[i]) : opts.datas[i][opts.fieldName].xssEncode(), 'g')
                            .customReplace('class', i == 0 ? 'class="active" ' : ''))
                            .data('optData', opts.datas[i]));
                    }
                    ul.append(arr);
                }

                searchSelectText.keydown(function(event){
                    switch(event.keyCode){
                        case lex.keyCodeMap.right:
                        case lex.keyCodeMap.down:
                            var next = ul.find(".active").next('li[data-custom="true"]').length ? ul.find(".active").next('li[data-custom="true"]') : ul.find('li[data-custom="true"]:first');
                            ul.find("li[data-custom='true']").removeClass("active");
                            next.addClass("active");
                            ul.scrollTop(next.get(0).offsetTop);
                            break;
                        case lex.keyCodeMap.left:
                        case lex.keyCodeMap.up:
                            var pre = ul.find(".active").prev('li[data-custom="true"]').length ? ul.find('.active').prev('li[data-custom="true"]') : ul.find("li[data-custom='true']:last");
                            ul.find("li[data-custom='true']").removeClass("active");
                            pre.addClass("active");
                            ul.scrollTop(pre.get(0).offsetTop);
                            break;
                        case lex.keyCodeMap.enter:
                            ul.find(".active").click();
                            break;
                        case lex.keyCodeMap.del:
                            if(searchSelectText.val().length <= 1){
                                handler.showList();
                            }
                            break;
                        case lex.keyCodeMap.esc:
                        case lex.keyCodeMap.tab:
                            handler.hideList();
                            break;
                        default :
                            break;
                    }
                }).keyup(function(event){
                    if(event.keyCode == lex.keyCodeMap.left
                        || event.keyCode == lex.keyCodeMap.right
                        || event.keyCode == lex.keyCodeMap.up
                        || event.keyCode == lex.keyCodeMap.down
                        || event.keyCode == lex.keyCodeMap.enter
                        || event.keyCode == lex.keyCodeMap.esc
                        || event.keyCode == lex.keyCodeMap.tab){
                        return;
                    }
                    if(isLocalDatas){
                        searchLocalData();
                    }else{
//                    searchServerData();
                    }
                }).change(function(event){
                    if(isLocalDatas){
                        //searchLocalData();
                    }else{
                        //searchServerData();
                    }
                }).focus(function(event){
                    //if(isLocalDatas){
                    //    searchLocalData();
                    //}else{
                    //    searchServerData();
                    //}
                }).bind('contextmenu', function(event){//用于补充监测鼠标粘贴操作
                    if(isLocalDatas){
                        searchLocalData();
                    }else{
                        searchServerData();
                    }
                }).bind('propertychange', function(event){
                    // for IE
                    if(isLocalDatas){
                        searchLocalData();
                    }else{
                        searchServerData();
                    }
                }).bind('input', function(event){
                    // for browser of besides IE
                    if(isLocalDatas){
                        searchLocalData();
                    }else{
                        searchServerData();
                    }
                });

                bindCommenEvents();
            }
            //查询本地数据
            function searchLocalData(){
                //清除选中记录
                searchSelect.removeData('chooseData');
                var param = searchSelectText.val().trim();
                handler.removeAllList();
                handler.showList();
                var arr = [];
                if(param){//如果输入有参数，则进行参数匹配
                    arr = [];
                    for(var i = 0; i < opts.datas.length; i++){
                        var item = opts.datas[i];
                        if(inString(param, item[opts.fieldName])){
                            //if(item[opts.fieldName] !== null
                            //    && item[opts.fieldName] !== undefined
                            //    && item[opts.fieldName].indexOf(param) > -1){
                            arr.push($(li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(item) : item[opts.fieldName].xssEncode(), 'g')
                                .customReplace('class', arr.length < 1 ? 'class="active" ' : ''))
                                .data('optData', item));
                        }
                    }
                    ul.append(arr);
                }else{//如果输入参数为空，则列出所有选项
                    arr = [];
                    for(var i = 0; i < opts.datas.length; i++){
                        arr.push($(li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(opts.datas[i]) : opts.datas[i][opts.fieldName].xssEncode(), 'g')
                            .customReplace('class', i == 0 ? 'class="active" ' : ''))
                            .data('optData', opts.datas[i]));
                    }
                    ul.append(arr);
                }
                if(!arr.length){
                    handler.noMatch();
                }
                bindCommenEvents();
            }
            //异步查询数据处理
            function searchServerData(){
                //清除选中记录
                searchSelect.removeData('chooseData');
                //显示loading
                handler.removeAllList();
                handler.showList();

                //ul.append('<li><img src="'+version+'/images/elements/loaders/1.gif" width=27 height=27></li>');
                ul.append('<li data-custom="true"><img src="../images/sprites/1.gif" width=27 height=27></li>');
                var searchParam = {},
                    resList = null;
                if(opts.searchParam && typeof opts.searchParam != 'string'){//参数对象存在，并且不是字符串
                    searchParam[opts.searchField] = JSON.stringify(opts.searchParam);
                    searchParam[opts.searchField][opts.searchParamField] = searchSelectText.val().trim();
                }else{
                    searchParam[opts.searchField] = searchSelectText.val().trim();
                }
                if(lex.storage.getItem(JSON.stringify(searchParam))){
                    resList = JSON.parse(lex.storage.getItem(JSON.stringify(searchParam)));
                    afterSyncSearch(resList);
                }else{
                    if(ajax){
                        ajax.abort();
                    }
                    ajax = $.ajax({
                        url: opts.searchUrl,
                        type: 'post',
                        dataType: 'json',
                        data: searchParam,
                        success: function(res){
                            lex.storage.setItem(JSON.stringify(searchParam), JSON.stringify(res));
                            resList = res;
                            afterSyncSearch(resList);
                        },
                        error: function(error){
                            if(error.status !== 0){
                                lex.error(opts.searchUrl + '匹配查询失败', error);
                            }
                        }
                    });
                }
            }
            function afterSyncSearch(resList){
                handler.showList();
                handler.removeAllList();
                if(opts.loopDataFormat){
                    for(var j = 0; j < opts.loopDataFormat.split(".").length; j++){
                        resList = resList[opts.loopDataFormat.split(".")[j]];
                    }
                }
                var arr = [];
                for(var i = 0; i < resList.length; i++){
                    arr.push($(li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(resList[i]) : resList[i][opts.fieldName].xssEncode(), 'g')
                        .customReplace('class', i == 0 ? 'class="active" ' : ''))
                        .data('optData', resList[i]));
                }
                ul.append(arr);
                if(!arr.length){
                    handler.noMatch();
                }
                bindCommenEvents();
            }

            //事件绑定处理
            function bindCommenEvents(){
                //输入框点击事件处理
                if(!searchSelect.data('alreadyBind')){
                    searchSelect.click(function(event){
                        if(ul.is(":visible") && !opts.alwayShow){
                            handler.hideList();
                        }else{
                            if(opts.showOnInputTop){
                                ul.css({
                                    top: - ul.height() - 10,
                                    display: 'block'
                                });
                            }else{
                                handler.showList();
                                searchSelectText.focus();
                                if(opts.searchUrl) searchServerData();
                            }
                        }
                        lex.eventUtil.preventDefault(event);
                        return false;
                    }).data('alreadyBind', true);
                }
                /*选项点击事件*/
                ul.delegate("li", 'click', onChooseOpt);
            }
            //当选择选项时的事件处理
            function onChooseOpt(event){
                var optData = $(this).data('optData');
                if($(this).attr('data-custom')){
                    if(!optData)return;
                    if($(this).is(".readyonly"))return;
                    ul.find("li[data-custom='true']").removeClass("active");
                    $(this).addClass("active");
                    handler.hideList();
                    searchSelect.text(optData[opts.fieldName]).data('chooseData', $(this).data('optData'));
                }
                if(opts.onChoose) opts.onChoose.call(this, event, optData);
                lex.eventUtil.preventDefault(event);
                return false;
            }

            function inString(s, str){
                for(var i=0; i<str.length; i++){
                    for(var j=0; j<s.length; j++){
                        if(str[i] == s[j])
                            return true;
                    }
                }
                return false;
            }
            return {
                getChooseData: function(){
                    return searchSelect.data("chooseData");
                },
                getRandomId: function(){
                    return randomId
                },
                opts: opts
            }
        };
        /*点击空白处，下拉框消失*/
        base.bodyClick();

    })(jQuery);

});
