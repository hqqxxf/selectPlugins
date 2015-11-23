/**
 * Created by Administrator on 2015/11/19.
 */
define([
    'lex'
], function(){
    var opts = {},ajax = null;
    function init(options){
        var defaults = {
            selector: null,
            title: "标题",
            style: "width:300px",
            search: true,
            searchUrl: "",
            data: null,
            dataConstructor: null,
            eventCallBack: null,
            listCallBack: null,
            searchCallBack: null
            };
        opts = $.extend({},defaults, options);
        render();
    }

    function render(){
        var template = '<div class="zhuge_select" style="${style}">' +
                        '<div class="customer">${title}</div>' +
                        '<ul class="zhuge_dropdownlist" style="display: none;">' +
                        '<li class="search">' +
                        '<input name="search" value="" class="zhuge_search"/>' +
                        '</li>' +
                        '<li class="add_new">' +
                        '<a href="#">+新建用户群</a>' +
                        '</li>' +
                        '</ul>' +
                        '</div>';
        opts.selector.append(template.customReplace('title', opts.title)
            .customReplace('style', opts.style));
        eventBind(opts.eventCallBack);
        appendToList(null,opts.listCallBack);
        opts.search ? searchList(opts.searchCallBack) : null;
    }

    /**
     * 将数据放到ul中显示
     * @param callback
     */
    function appendToList(dataArray, callback){
        /**
         * 需要特殊处理部分
         */
        callback ? callback() : null;

        var li = '<li data-name="group">${name}<span>${platform}</span></li>',
            arr = [],
            dataArr = dataArray ? dataArray : opts.data;
        for(var i=0; i<dataArr.length; i++){
            arr.push(li.replace(/\${(\w*)}/g, function(){
                return dataArr[i][arguments[1]];
            }));
        }
        opts.selector.find('ul.zhuge_dropdownlist li[data-name="group"]').remove();
        opts.selector.find('ul.zhuge_dropdownlist').append(arr);
    }

    /**
     * 事件绑定
     * @param callback
     */
    function eventBind(callback){
        opts.selector.delegate('.zhuge_dropdownlist li[data-name="group"]', 'click', function(e){
            var target = e.target;
                //cha = opts.selector.find('.zhuge_dropdownlist li').length - opts.selector.find('.zhuge_dropdownlist li[data-name="group"]').length,
                //index = $(this).index() - cha;
            opts.selector.find('.zhuge_dropdownlist li[data-name="group"]').removeClass('active');
            $(this).addClass('active');
            opts.selector.find('ul.zhuge_dropdownlist').hide();
            opts.selector.find('.customer').html($(target).text());
        });
        opts.selector.delegate('.customer', 'click', function(e){
            var target = e.target;
            $(this).next('ul').toggle();
        });
        if(callback){
            callback();
        }
    }

    function searchList(callback){
        opts.selector.find('li.search>input').keyup(function(e){
            var searchText = $(this)[0].value;
            if(searchText){
                searchServerData(searchText);
            }
            if(e.keyCode == 13){
                searchText = $(this)[0].value;
                searchServerData(searchText);
            }
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
    function searchLocalData(){
        var arr = [];
        for(var i=0; i<opts.data.length; i++){
            if(inString(text, opts.data[i].name)){
                arr.push(opts.data[i]);
            }
        }
        appendToList(arr);
    }
    function searchServerData(text){
        var searchParam = {
            "search": text
        }, storageItem = lex.storage.getItem(JSON.stringify(searchParam));
        if(storageItem){
            appendToList(JSON.parse(storageItem));
        }
        if(ajax){
            ajax.abort();
        }
        ajax = $.ajax({
            url: opts.searchUrl,
            //type: 'post',
            type: 'get',
            dataType: 'json',
            data: searchParam,
            success: function(res){
                var resData = opts.dataConstructor ? res[opts.dataConstructor] : res;
                lex.storage.setItem(JSON.stringify(searchParam), JSON.stringify(resData));
                appendToList(resData);
            },
            error: function(error){

            }
        });
    }

    return {
        init: function(options){
            init(options);
        }
    }
});