/**
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */

///import baidu.ui.toolbar._itemBehavior;

///import baidu.object.extend;
///import baidu.string.format;
///import baidu.dom.getStyle;
///import baidu.dom.setStyle;
///import baidu.dom._styleFilter.px;
///import baidu.dom.insertHTML;
///import baidu.dom.g;
///import baidu.array.each;
///import baidu.ui.createUI;
///import baidu.object.merge;

/**
 * @class   toolBar基类，建立toolBar实例
 * @param   {Object}    options config参数.
 * @config  {String}    [title=""]  toolbar的title参数，默认为空.
 * @config  {String}    [name="ToolBar_item_xxx"]   name参数，每个toolbar对象都有一个name参数.
 * @config  {String}    [direction="horizontal"]    有效值:"vertical","horizontal" toolbar只能在横向和纵向之间进行选择，默认为横向，及"horizontal".
 * @config  {String}    [position="left" | "top"]   当direction为horizontal时，默认值为left;当direction为vertical时,默认值为top.
 *                                                  align有效值:'left', 'right', 'center', 'justify', 'inherit'
                                                    valign有效值:'top', 'middle', 'bottom', 'baseline'
 * @config  {String|Number} [width]     宽度.
 * @config  {String|Number} [height]    高度.
 * @config  {String|HTMLElement}    [container=document.body]   实例容器.
 * @config  {Array}     [items] Object数组，创建ui的JSON.
 * @config  {String}    [type="button"] ui控件类型
 * @config  {Object}    [config]    创建ui控件所需要的config参数.
 * @author  lixiaopeng
 */
baidu.ui.toolbar.Toolbar = baidu.ui.createUI(function(options) {
    var me = this,
        positionCheck = false,
        positionPrefix = 'align="',
        position = 'left';

    me._itemObject = {};
    me.items = me.items || {};
   
    if(me.direction != 'horizontal'){
        me.direction = 'vertical';
        position = 'top';
    }
    me.position = me.position || position;
    me._positionStr = positionPrefix + me.position + '"';

}).extend({

    /*
     * @lends baidu.ui.toolbar.Toolbar.prototype
     */

    /**
     * item容器,默认为document.body
     */
    container: document.body,

    /**
     * title
     */
    title: '',

    /**
     * direction
     */
    direction: 'horizontal',

    /**
     * position
     */
    position: 'left',

    /**
     * tplMain
     * @private
     */
    tplMain: '<div id="#{bodyId}" class="#{bodyClass}" onmousedown="javascript:return false;">' +
            '#{title}' +
            '<div id="#{bodyInner}" class="#{bodyInnerClass}">' +
                '<table cellpadding="0" cellspacing="0" style="width:100%; height:100%" id="#{tableId}">' +
                    '<tr><td style="width:100%; height:100%; font-size:0pt;" #{position}>' +
                        '<table cellpadding="0" cellspacing="0" id="#{tableInnerId}">#{content}</table>' +
                    '</td></tr>' +
                '</table>' +
            '</div>' +
            '</div>',

    /**
     * tplTitle
     * @private
     */
    tplTitle: '<div id="#{titleId}" class="#{titleClass}"><div id="#{titleInnerId}" class="#{titleInnerClass}">#{title}</div></div>',

    /**
     * tplHorizontalCell
     * @private
     */
    tplHorizontalCell: '<td id="#{id}" valign="middle" style="font-size:0pt;"></td>',
    
    /**
     * tplVerticalCell
     * @private
     */
    tplVerticalCell: '<tr><td id="#{id}" valign="middle" style="font-size:0pt;"></td></tr>',

    /**
     * uiType
     * @private
     */
    uiType: 'toolbar-toolbar',

    /**
     * 返回toolbar的html字符串
     * @private
     * @return {String} HTMLString.
     */
    getString: function() {
        var me = this;

        return baidu.format(me.tplMain, {
            bodyId : me.getId(),
            bodyClass : me.getClass(),
            bodyInner : me.getId('bodyInner'),
            bodyInnerClass : me.getClass('body-inner'),
            title : me.title === '' ? '' : baidu.format(me.tplTitle, {
                                                    titleId : me.getId('title'),
                                                    titleClass : me.getClass('title'),
                                                    titleInnerId : me.getId('titleInner'),
                                                    titleInnerClass : me.getClass('title-inner'),
                                                    title : me.title
                                                }),
            tableId : me.getId('table'),
            position : me._positionStr,
            tableInnerId : me.getId('tableInner'),
            content : me.direction == 'horizontal' 
                            ? '<tr>' + me._createCell(me.items.length, 'str') + '</tr>' 
                            : me._createCell(me.items.length, 'str')
        });
    },

    /**
     * 绘制toolbar
     * @param {String|HTMLElement}  [container=this.container] toolBar容器.
     * @return void
     */
    render: function(container) {
        var me = this, body;
        me.container = container = baidu.g(container || me.container);

        baidu.insertHTML(me.renderMain(container), 'beforeEnd', me.getString());

        body = baidu.g(me.getId());
        me.width && baidu.setStyle(body, 'width', me.width);
        me.height && baidu.setStyle(body, 'height', me.height);

        //创建item
        me._createItems();
    },

    /**
     * 创建item
     * @private
     * @return void
     */
    _createItems: function() {
        var me = this,
            container = baidu.g(me.getId('tableInner')),
            tdCollection = [];

        baidu.each(container.rows, function(tr,tr_index) {
            baidu.each(tr.cells, function(td,td_index) {
                tdCollection.push(td);
            });
        });

        baidu.each(me.items, function(item,i) {
            me.add(item, tdCollection[i]);
        });
    },

    /**
     * 使用传入config的方式添加ui组件到toolBar
     * @param   {Object}    options ui控件的config参数，格式参照构造函数options.items.
     * @param   {HTMLElement}   [container] ui控件的container,若没有container参数，则会自动根据当前toolbar的显示规则在最后创建container.
     * @return  {baidu.ui} uiInstance 创建好的ui对象.
     */
    add: function(options,container) {
        var me = this,
            uiInstance = null,
            defaultOptions = {
                type: 'button',
                config: {}
            },
            uiNS = null, ns;

        if (!options)
            return;

        /*检查默认参数*/
        options = baidu.extend(defaultOptions, options);
        delete(options.config.statable);
        options.type = options.type.toLowerCase();

        /*
         * 用来查找对应的namespace并创建ui实例
         * TODO:等baidu.ui.create修改完毕后替换掉
         */
        ns = options.type.split('-');
        if (ns.length == 1) {
            ns = ns.shift();
            uiNS = baidu.ui[ns][ns.charAt(0).toUpperCase() + ns.slice(1)];
        }else {
            uiNS = baidu.ui[ns.shift()];
            baidu.each(ns, function(item) {
                ns.length == 1 && (item = item.charAt(0).toUpperCase() + item.slice(1));
                uiNS = uiNS[item];
            });
        }
        if(uiNS){
            baidu.object.merge(uiNS,{statable:true},{overwrite:true,whiteList:["statable"]});
            uiInstance = baidu.ui.create(uiNS,options.config);
        }
        //uiNS && (uiInstance = baidu.ui.create(uiNS, options.config));
        me.addRaw(uiInstance, container);

        return uiInstance;
    },

    /**
     * 直接向toolbar中添加已经创建好的uiInstance
     * @param {Object} uiInstance
     * @param {HTMLElement} container
     * @return void.
     */
    addRaw: function(uiInstance,container) {
        var me = this;

        if (!uiInstance)
            return;

        baidu.extend(uiInstance, baidu.ui.toolbar._itemBehavior);
        uiInstance.setName(uiInstance.name);

        if (!container) {
            container = me._createCell(1, 'html')[0];
        }

        uiInstance.render(container);
        me._itemObject[uiInstance.getName()] = uiInstance;
    },

    /**
     * 根据当前toolbar规则，创建tableCell
     * @private
     * @param {Number} num 创建cell的数量.
     * @param {String} [type="str"] str|html.
     * @return {String|HTMLElement} uiInstance的容器.
     */
    _createCell: function(num,type) {
        var me = this,
            td,
            cells = [],
            container,
            i;
        type == 'str' || (type = 'html');

        if (type == 'str') {
            if (me.direction == 'horizontal') {
                for (i = 0; i < num; i++) {
                    cells.push(baidu.format(me.tplHorizontalCell,{id:me.getId('cell-' + i)}));
                }
            }else {
                for (i = 0; i < num; i++) {
                    cells.push(baidu.format(me.tplVerticalCell,{id:me.getId('cell-' + i)}));
                }
            }
            cells = cells.join('');
        }else {
            container = baidu.g(me.getId('tableInner'));
            containerTR = container.row[0];
            if (me.direction == 'horizontal') {
                for (i = 0; i < num; i++) {
                    td = container.insertCell(containerTR.cells.length);
                    td.id = me.getId('cell-' + i);
                    td.valign = 'middle';
                    cells.push(td);
                }
            }else {
                for (i = 0; i < num; i++) {
                    td = container.insertRow(container.rows.length);
                    td = td.insertCell(0);
                    td.id = me.getId('cell-' + i);
                    td.valign = 'middle';
                }
            }
        }

        return cells;
    },

    /**
     * 删除toolbar item
     * @param   {String} name 需要删除的控件的标识符.
     * @return void.
     */
    remove: function(name) {
        var me = this, item;
        if (!name) return;
        if (item = me._itemObject[name]) {
            item.dispose();
        }
    },

    /**
     * 删除所有ui控件
     * @return void.
     */
    removeAll: function() {
        var me = this;
        baidu.object.each(me._itemObject, function(item,key) {
           item.dispose();
        });
    },

    /**
     * enable ui组件，当不传入name时，enable所有ui组件到
     * @private
     * @param {String} [name] ui组件唯一标识符.
     */
    _enable: function(name) {
        var me = this, item;

        if (!name) {
            me.enableAll();
        }else if (item = me._itemObject[name]) {
            item.enable();
        }
    },

    /**
     * disable ui组件，当不传入name时，disable所有ui组建
     * @private
     * @param {String} [name] ui组件唯一标识符.
     */
    _disable: function(name) {
        var me = this, item;

        if (!name) {
            me.disableAll();
        }else if (item = me._itemObject[name]) {
            item.disable();
        }
    },

    /**
     * 激活toolbar中所有的item
     * @return void.
     */
    enableAll: function() {
        var me = this;
        baidu.object.each(me._itemObject, function(item,key) {
            item.enable();
        });
    },

    /**
     * 禁用toolbar中所有的item
     * @return void.
     */
    disableAll: function() {
        var me = this;
        baidu.object.each(me._itemObject, function(item,key) {
            item.disable();
        });
    },

    /**
     * 通过name获取ui组件
     * @param {String} name ui组件唯一标识符.
     * @return {baidu.ui.Instance} 返回查找到的item.
     */
    getItemByName: function(name) {
        var me = this, item = me._itemObject[name];
        if (!item) {
            baidu.object.each(me._itemObject, function(i,k) {
                i.getItemByName && (item = i.getItemByName(name));
                if (item) {
                    return false;
                }
            });
        }

        return item;
    }
});
