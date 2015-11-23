/**
 * Created by Administrator on 2015/11/21.
 */
define([
    'lex'
],{
    handler: {
        opts: {},
        searchSelect: "",
        searchSelectText: "",
        zhugeSelect: "",
        ul: "",
        li: "",
        bindCommenEvents: null,
        firstActive: function(){
            this.ul.find('li["data-custom"]:first').addClass('active');
        },
        removeAllActive: function(){
            this.ul.find('li["data-custom"]').removeClass('active');
        },
        removeAllList: function(){
            this.ul.find("li[data-custom='true']").remove();
        },
        firstChoose: function(){
            this.ul.find('li["data-custom"]:first').click();
        },
        noMatch: function(){
            this.ul.append($(this.li.customReplace('name', '暂无匹配项', 'g')
                .customReplace('class', 'class="active"'))
                .data('optData', null));
        },
        showList: function(){
            this.zhugeSelect.find('div.search').show();
            this.ul.show();
        },
        hideList: function(){
            this.zhugeSelect.find('div.search').hide();
            this.ul.hide();
        }
    },
    //查询本地数据
    searchLocalData: function(){
    //清除选中记录
        var opts = this.handler.opts,
            ul = this.handler.ul;
        this.handler.searchSelect.removeData('chooseData');
        var param = this.handler.searchSelectText.val().trim();
        this.handler.removeAllList();
        this.handler.showList();
        var arr = [];
        if(param){//如果输入有参数，则进行参数匹配
            arr = [];
            for(var i = 0; i < opts.datas.length; i++){
                var item = opts.datas[i];
                //if(inString(param, item[opts.fieldName])){
                    if(item[opts.fieldName] !== null
                        && item[opts.fieldName] !== undefined
                        && item[opts.fieldName].indexOf(param) > -1){
                    arr.push($(this.handler.li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(item) : item[opts.fieldName].xssEncode(), 'g')
                        .customReplace('class', arr.length < 1 ? 'class="active" ' : ''))
                        .data('optData', item));
                }
            }
            ul.append(arr);
        }else{//如果输入参数为空，则列出所有选项
            arr = [];
            for(var i = 0; i < opts.datas.length; i++){
                arr.push($(this.handler.li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(opts.datas[i]) : opts.datas[i][opts.fieldName].xssEncode(), 'g')
                    .customReplace('class', i == 0 ? 'class="active" ' : ''))
                    .data('optData', opts.datas[i]));
            }
            ul.append(arr);
        }
        if(!arr.length){
            this.handler.noMatch();
        }
        this.handler.bindCommenEvents();
    },
    //异步查询数据处理
    searchServerData: function(){
        var opts = this.handler.opts,
            ul = this.handler.ul,
            ajax = this.handler.ajax,
            that = this;
        //清除选中记录
        this.handler.searchSelect.removeData('chooseData');
        //显示loading
        this.handler.removeAllList();
        this.handler.showList();
        //ul.append('<li><img src="'+version+'/images/elements/loaders/1.gif" width=27 height=27></li>');
        ul.append('<li data-custom="true"><img src="../images/sprites/1.gif" width=27 height=27></li>');
        var searchParam = {},
            resList = null;
        if(opts.searchParam && typeof opts.searchParam != 'string'){//参数对象存在，并且不是字符串
            searchParam[opts.searchField] = JSON.stringify(opts.searchParam);
            searchParam[opts.searchField][opts.searchParamField] = this.handler.searchSelectText.val().trim();
        }else{
            searchParam[opts.searchField] = this.handler.searchSelectText.val().trim();
        }
        if(lex.storage.getItem(JSON.stringify(searchParam))){
            resList = JSON.parse(lex.storage.getItem(JSON.stringify(searchParam)));
            this.afterSyncSearch(resList);
        }else{
            if(ajax){
                ajax.abort();
            }
            this.handler.ajax = $.ajax({
                url: opts.searchUrl,
                type: 'post',
                dataType: 'json',
                data: searchParam,
                success: function(res){
                    lex.storage.setItem(JSON.stringify(searchParam), JSON.stringify(res));
                    resList = res;
                    that.afterSyncSearch(resList);
                },
                error: function(error){
                    if(error.status !== 0){
                        lex.error(opts.searchUrl + '匹配查询失败', error);
                    }
                }
            });
        }
    },
    afterSyncSearch: function(resList){
        var opts = this.handler.opts,
            ul = this.handler.ul;
        this.handler.showList();
        this.handler.removeAllList();
        if(opts.loopDataFormat){
            for(var j = 0; j < opts.loopDataFormat.split(".").length; j++){
                resList = resList[opts.loopDataFormat.split(".")[j]];
            }
        }
        var arr = [];
        for(var i = 0; i < resList.length; i++){
            arr.push($(this.handler.li.customReplace('name', opts.optionFormat ? opts.optionFormat.call(resList[i]) : resList[i][opts.fieldName].xssEncode(), 'g')
                .customReplace('class', i == 0 ? 'class="active" ' : ''))
                .data('optData', resList[i]));
        }
        ul.append(arr);
        if(!arr.length){
            this.handler.noMatch();
        }
        this.handler.bindCommenEvents();
    },
    bindEditEvents: function(){
        var opts = this.handler.opts,
            ul = this.handler.ul,
            searchSelectText = this.handler.searchSelectText,
            isLocalDatas = opts.searchUrl ? false : true,
            arr = [],
            that = this;
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
                        that.handler.showList();
                    }
                    break;
                case lex.keyCodeMap.esc:
                case lex.keyCodeMap.tab:
                    that.handler.hideList();
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
                that.searchLocalData();
            }
        }).bind('contextmenu', function(event){//用于补充监测鼠标粘贴操作
            if(isLocalDatas){
                that.searchLocalData();
            }else{
                that.searchServerData();
            }
        }).bind('propertychange', function(event){
            // for IE
            if(isLocalDatas){
                that.searchLocalData();
            }else{
                that.searchServerData();
            }
        }).bind('input', function(event){
            // for browser of besides IE
            if(isLocalDatas){
                that.searchLocalData();
            }else{
                that.searchServerData();
            }
        });

        that.handler.bindCommenEvents();
    },
    showOnTop: function(){
        var opts = this.handler.opts,
            ul = this.handler.ul;
        if(opts.showOnInputTop){
            ul.css({
                top: - ul.height() - 10,
                display: 'block'
            });
        }else{
            ul.show();
        }
    },
    bodyClick: function(){
        $('body').mousedown(function(event){
            var target = $(event.target);
            if(target.is('.zhuge_select')){//点击在选项框上

            }else if(target.is('.zhuge_search')){//点击在搜索框上

            }else if(target.parents('.zhuge_select').length){//点击在选项上

            }else{
                $("ul.zhuge_dropdownlist").hide();
                $(".zhuge_search").hide();
            }
        });
    }
});