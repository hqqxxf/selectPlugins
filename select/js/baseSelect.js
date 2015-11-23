/**
 * Created by Administrator on 2015/11/21.
 */
define([
    'base'
], function(base){
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
    (function($){
        $.fn.searchSelect = function(options){
            var defaults = {
                    editable: false,//是否可编辑输入
                    showArrow: true,//是否显示箭头
                    showOnInputTop: false,//下拉框显示在输入框上方
                    enable: true,//下拉是否可用
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
                    ulHeight: 320,
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

            var htmTemplate = '<div id="searchSelect_${id}" class="zhuge_select ${class}" style="width: ${width}px;">' +
                                    '<input id="searchSelectText_${id}" type="text" value="" ${editable} class="zhuge_select" style="${showArrow}" placeholder="${placeHolder}">' +
                                    '<ul id="ulContent_${id}" class="zhuge_dropdownlist" style="display: none;height:${ulHeight}px">' +
                                    '</ul>'+
                                '</div>';
            $(this).empty().append(htmTemplate.customReplace("id", randomId, 'g')
                .customReplace('editable', opts.editable ? '' : 'readonly')
                .customReplace('class', opts.classes)
                .customReplace("showArrow", opts.showArrow ? '' : 'background:none')//是否显示箭头
                .customReplace('width', opts.width, 'g')
                .customReplace('placeHolder', opts.placeHolder)
                .customReplace('ulHeight', opts.ulHeight));

            var searchSelect = $("#searchSelect_" + randomId),
                searchSelectText = $("#searchSelectText_" + randomId),
                zhugeSelect = $('#zhugeSelect_' + randomId),
                ul = $("#ulContent_" + randomId),
                li = '<li data-custom="true" ${class} title="${name}">${name}</li>';


            base.handler.opts = opts;
            base.handler.zhugeSelect = zhugeSelect;
            base.handler.searchSelect = searchSelect;
            base.handler.searchSelectText = searchSelectText;
            base.handler.ul = ul;
            base.handler.li = li;
            base.handler.ajax = ajax;
            /**\
             * 输入框事件绑定处理
             */
            base.handler.bindCommenEvents = function(){
                if(!searchSelectText.data('alreadyBind')){
                    searchSelectText.click(function(event){
                        if(!opts.enable)return;
                        if(ul.is(":visible") && !opts.alwayShow){
                            ul.hide();
                        }else{
                            base.showOnTop();
                            if(opts.searchUrl) base.searchServerData();
                        }
                        lex.eventUtil.preventDefault(event);
                        return false;
                    }).data('alreadyBind', true);
                }
                /*选项点击事件*/
                ul.find("li").click(onChooseOpt);
            };
            if(opts.chooseFirstOption){
                handler.firstChoose();
            }
            if(opts.editable){//如果是可编辑模式
                base.bindEditEvents();
            }else{//如果是不可编辑模式x
                for(var i = 0; i < opts.datas.length; i++){
                    var readonly = (opts.datas[i].type && opts.datas[i].type == 'cont-title') ? true : false;
                    ul.append($(li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(opts.datas[i]) : opts.datas[i][opts.fieldName].xssEncode(), 'g')
                        .customReplace('class', readonly ? 'class="active readyonly"' : (i == 0 ? 'class="active" ' : '')))
                        .data('optData', opts.datas[i]));
                }
                base.handler.bindCommenEvents();
            }
            /**
             * 当选择选项时的事件处理
             */
            function onChooseOpt(event){
                var optData = $(this).data('optData');
                if(!optData)return;
                if($(this).is(".readyonly"))return;
                $(this).addClass("active").siblings().removeClass("active");
                $(this).siblings('.readyonly').addClass('active');
                ul.hide();
                searchSelectText.val(optData[opts.fieldName]).data('chooseData', $(this).data('optData'));
                searchSelectText.focus();
                if(opts.onChoose) opts.onChoose.call(this, event, optData);
                lex.eventUtil.preventDefault(event);
                return false;
            }

            return {
                getChooseData: function(){
                    return $("#searchSelectText_" + randomId).data("chooseData");
                },
                getRandomId: function(){
                    return randomId
                },
                opts: opts
            }
        };
        base.bodyClick();
    })(jQuery);

});