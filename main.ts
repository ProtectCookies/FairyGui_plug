/*
 * @Date: 2023-12-25 12:21:14
 * @LastEditors: yc
 * @Description:
 * @LastEditTime: 2023-12-29 09:53:35
 * @FilePath: \PxCook_RectNative转换器\main.js
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csharp_1 = require("csharp");
const { FairyEditor, System, Array$1, UnityEngine } = require("csharp");
const { $generic } = require("puerts");
const App = csharp_1.FairyEditor.App;
App.pluginManager.LoadUIPackage(App.pluginManager.basePath + "/" + eval("__dirname") + '/CSSAttributer');
class DemoInspector extends csharp_1.FairyEditor.View.PluginInspector {
    textinput;
    btn_clear;
    btn_apply;
    constructor() {
        super();
        this.panel = csharp_1.FairyGUI.UIPackage.CreateObject("CSSAttributer", "Main").asCom;
        this.textinput = this.panel.GetChild("textarea").asLabel;
        this.btn_clear = this.panel.GetChild("btn_clear").asButton;
        this.btn_apply = this.panel.GetChild("btn_apply").asButton;
        this.btn_clear.onClick.Add(() => {
            this.textinput.title = "";
        });
        this.btn_apply.onClick.Add(() => {
            let obj = App.activeDoc.inspectingTarget; //obj.objectType类型
            let attributes = this.textinput.title; // "width: 213px;height: 24px;""
            if (!attributes.startsWith('const')) {
                console.warn('输入的字符串不是ReactNative属性,请检查PxCook左上角是否设置成iOS,且右下角属性窗口是否是ReactNative');
                return;
            }
            let index = attributes.indexOf('{') + 1;
            if (obj.objectType == 'text') {
                obj.docElement.SetProperty('autoSize', 'shrink'); // 默认就设置成自动收缩
            }
            if (index !== -1) { // 处理下字符串前面的无用字符
                attributes = attributes.substring(index);
            }
            attributes = attributes.slice(0, -3); // 去除掉最后的数据 }；
            let attributesArr = this.parseProperties(attributes);
            attributesArr.forEach(attribute => {
                if (attribute !== "") {
                    let pro_sx;
                    if (attribute.trim().startsWith('shadowOffset')) {
                        pro_sx = attribute.split("{");
                    }
                    else {
                        pro_sx = attribute.split(":");
                    }
                    let [key, value] = pro_sx;
                    this.updateAttribute(key, value, obj);
                }
            });
        });
        this.updateAction = () => { return this.updateUI(); };
    }
    // 解析字符串并分割属性
    parseProperties(s) {
        let properties = [];
        let braceLevel = 0;
        let currentProperty = '';

        for (let char of s) {
            if (char === '{') {
                braceLevel++;
            } else if (char === '}') {
                braceLevel--;
            }

            if (char === ',' && braceLevel === 0) {
                properties.push(currentProperty.trim());
                currentProperty = '';
            } else {
                currentProperty += char;
            }
        }

        if (currentProperty.trim() !== '') {
            properties.push(currentProperty.trim());
        }

        return properties;
    }

    updateAttribute(key, value, obj) {
        key = key.replace(/\s/g, "").replace(/\r\n/g, "");
        let newValue;
        let attrObj = null;
        switch (key) {
            // 宽高
            case "height":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "height";
                newValue = (+value) * 2;
                break;
            case "width":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "width";
                newValue = (+value) * 2;
                break;
            case "color":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "color";
                if (obj.objectType == 'text') { // 不是文本类型就不处理color
                    newValue = csharp_1.FairyEditor.ColorUtil.FromHexString(value);
                }
                break;
            case "fontSize": // border:5px solid red; lineSize[default:1] - lineColor[default:#000000]
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "fontSize";
                if (obj.objectType == 'text') { // 不是文本类型就不处理fontSize
                    newValue = (+value) * 2;
                }
                break;
            case "fontWeight":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "bold";
                newValue = value ? true : false;
                break;
            case "fontStyle":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "italic";
                newValue = value ? true : false;
                break;
            case "textDecorationLine":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "underline";
                newValue = value ? true : false;
                break;
            case "borderStyle":
                obj.docElement.SetProperty('stroke', true);
                break;
            case "borderWidth":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "strokeSize";
                newValue = (+value) * 2;
                break;
            case "borderColor":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "strokeColor";
                newValue = csharp_1.FairyEditor.ColorUtil.FromHexString(value);
                break;
            case "shadowColor":
                App.font
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                obj.docElement.SetProperty('shadow', true);
                key = "shadowColor";
                newValue = csharp_1.FairyEditor.ColorUtil.FromHexString(value);
                break;
            case "shadowOffset:":
                // 使用正则表达式提取数字
                var matches = value.match(/(\d+)/g);
                // 将提取的数字转换为整数并赋值给变量
                var [width, height] = matches.map(Number);
                obj.docElement.SetProperty('shadowX', width * 2);
                obj.docElement.SetProperty('shadowY', height * 2);
                break;
            default:
                break;
        }
        if (newValue) {
            obj.docElement.SetProperty(key, newValue);
        }
        else {
            for (let item in attrObj) {
                obj.docElement.SetProperty(item, attrObj[item]);
            }
        }
    }
    updateUI() {
        return true; //if everything is ok, return false to hide the inspector
    }
}
//Register a inspector
App.inspectorView.AddInspector(() => new DemoInspector(), "PxCook样式", "PxCook样式");
//Condition to show it
App.docFactory.ConnectInspector("PxCook样式", "mixed", false, false);

var preActive = App.isActive;
var onUpdate = function () {
    var active = App.isActive;
    if (preActive == active) {
        return;
    }
    preActive = active;
    if (active) {
        // 从后台返回
        console.log("检测到从后台返回, 刷新fgui工程;");
        App.RefreshProject();
    }
    else {
        // 切到后台
        // console.log("检测切到后台")
    }
};
// let menu = App.menu.GetSubMenu("tool")
App.add_onUpdate(onUpdate);
exports.onDestroy = function () {
    App.remove_onUpdate(onUpdate);
    App.libView.contextMenu.RemoveItem("name");
    App.menu.GetSubMenu("tool").RemoveItem("imageCopper");

};
// console.log(menu);
// menu.AddItem("display name", "name", (name) => {
//     console.log("call menuitem.");
// });
let pop_path = FairyEditor.App.project.basePath + '../' + App.project.allPackages.get_Item(0).publishSettings.path + '/i18nKV.json';
let save_path = FairyEditor.App.project.assetsPath + '/i18nKV.json';
let all_path = 'map<string, string>kv_tran; // 翻译\n';
let map_path = {};
let arr_path = [];
let getAllText = function (target) {
    if (target.numChildren == 0) {
        return;
    }
    if (target.objectType == 'list') {
        return;
    }
    else {
        for (var i = 0; i < target.numChildren; i++) {
            var item = target.children.get_Item(i);
            if (item.objectType == 'text') {
                let tmp_item = item;
                let path = item.name;
                for (let j = 0; j < 100; j++) { // 最多遍历100层，避免
                    if (tmp_item._parent && tmp_item._parent.name) {
                        tmp_item = tmp_item._parent;
                        let tp_name = tmp_item.name;
                        path = tp_name + '/' + path;
                    }
                    else {
                        break;
                    }
                }
                arr_path.push(path);
                let now_select = App.libView.GetSelectedResource().name;
                if (map_path[now_select] && map_path[now_select][path]) {
                    all_path += `kv_tran[\"` + path + `\"] = \"${map_path[now_select][path]}\";\n`;
                }
                else {
                    all_path += `kv_tran[\"` + path + `\"] = \"\";\n`;
                }
            }
            else {
                getAllText(item);
            }
        }
    }
}
App.pluginManager.LoadUIPackage(App.pluginManager.basePath + "/" + eval("__dirname") + '/ImageCropper');
let dialog = csharp_1.FairyGUI.UIPackage.CreateObject('ImageCropper', "Main").asCom;
let imageCropperWindow = new csharp_1.FairyGUI.Window();
let list_kv = dialog.GetChild("customProps").asList;
imageCropperWindow.contentPane = dialog;
imageCropperWindow.Center();
imageCropperWindow.Hide();

App.libView.contextMenu.AddItem('导出label到剪贴板(C++Map)', 'name', (name) => {
    let item = App.libView.GetSelectedResource();
    if (item.type != 'font') { // 获取所有导出的组件等
        all_path = 'map<string, string>kv_tran; // 翻译\n'
        let fobj = csharp_1.FairyEditor.FObjectFactory.CreateObject(item);
        getAllText(fobj);
        FairyEditor.Clipboard.SetText(all_path);
        // for (let i = 0; i < ; i++) {
        //     let cp_data = cp.elements[i]
        // }
        all_path = 'map<string, string>kv_tran; // 翻译\n'
        // console.log(fobj.numChildren)
        // const path = 'E:\\pdragon\\spx\\UIProject\\Proj_qpx_main\\plugins\\PxCook_RectNative转换器\\test.txt';
        // csharp_1.System.IO.File.WriteAllText(path, all_path)
    }
    else {
        console.error('选择的是字体文件');
    }
});
let read_allLabel = function () { // 读取所有Label
    if (Object.keys(map_path).length == 0) { // 没读取信息
        if (System.IO.File.Exists(save_path)) {
            // 存在的话就读
            let res = System.IO.File.ReadAllText(save_path);
            let arrayOfArray = JSON.parse(res);
            for (let key in arrayOfArray) {
                map_path[key] = arrayOfArray[key];
            }
        }
    }
    let packs = App.project.allPackages;
    packs.ForEach((a) => {
        a.items.ForEach((item) => {
            if (item.exported && item.type != 'font') { // 获取所有导出的组件等
                let fobj = csharp_1.FairyEditor.FObjectFactory.CreateObject(item);
                getAllText(fobj);
                let tmp_map = {};
                for (const it of arr_path) {
                    if (!map_path[item.name] || !map_path[item.name][it]) {
                        tmp_map[it] = '';
                    }
                    else {
                        tmp_map[it] = map_path[item.name][it];
                    }
                }
                arr_path = [];
                map_path[item.name] = tmp_map;
            }
        });
    });


    saveToFile(save_path);

}
let saveToFile = function (path) {
    let str_res = ''
    if (path == pop_path) {
        str_res = JSON.stringify(map_path);
    }
    else {
        str_res = JSON.stringify(map_path, false, '\t');
    }
    try {
        csharp_1.System.IO.File.WriteAllText(path, str_res)
    } catch (ex) {
        console.error("发生错误: ", ex);
    }
}


dialog.GetChild("close").onClick.Add(() => {
    imageCropperWindow.Hide();
});
dialog.GetChild("pulish").onClick.Add(() => {
    saveToFile(pop_path);
    console.log(`多语言文件发布成功`)
});
// 初始化的时候读取一遍
if (App.libView.GetSelectedResource()) {
    read_allLabel();
    list_kv.RemoveChildren();
    for (const key1 in map_path) {
        if (Object.hasOwnProperty.call(map_path, key1)) {
            const tmp_map = map_path[key1];
            for (const key in tmp_map) {
                const val = tmp_map[key];
                let item = csharp_1.FairyGUI.UIPackage.CreateObject('ImageCropper', "ProjectProps_item").asButton;
                if (key && item) {
                    let key_input = item.GetChild('text').asLabel.GetChild('input').asTextInput;
                    key_input.text = '[' + key1 + ']: ' + key;
                    item.GetChild('text').touchable = false;
                    item.GetChild('text').asLabel.GetChild('title').asTextField.text = '[' + key1 + ']: ' + key;
                    let val_input = item.GetChild('value').asLabel.GetChild('input').asTextInput;
                    val_input.text = val;
                    item.GetChild('value').asLabel.GetChild('title').asTextField.text = val;
                    list_kv.AddChild(item);
                    val_input.onFocusOut.Add(() => {
                        map_path[key1][key] = val_input.text;
                        item.GetChild('value').asLabel.GetChild('title').asTextField.text = val_input.text;
                        saveToFile(save_path);
                    });
                }
            }
        }
    }
}

dialog.GetChild("crop").onClick.Add(() => {
    read_allLabel();
    list_kv.RemoveChildren();
    for (const key1 in map_path) {
        if (Object.hasOwnProperty.call(map_path, key1)) {
            const tmp_map = map_path[key1];
            for (const key in tmp_map) {
                const val = tmp_map[key];
                let item = csharp_1.FairyGUI.UIPackage.CreateObject('ImageCropper', "ProjectProps_item").asButton;
                if (key && item) {
                    let key_input = item.GetChild('text').asLabel.GetChild('input').asTextInput;
                    key_input.text = '[' + key1 + ']: ' + key;
                    item.GetChild('text').touchable = false;
                    item.GetChild('text').asLabel.GetChild('title').asTextField.text = '[' + key1 + ']: ' + key;
                    let val_input = item.GetChild('value').asLabel.GetChild('input').asTextInput;
                    val_input.text = val;
                    item.GetChild('value').asLabel.GetChild('title').asTextField.text = val;
                    list_kv.AddChild(item);
                    val_input.onFocusOut.Add(() => {
                        map_path[key1][key] = val_input.text;
                        item.GetChild('value').asLabel.GetChild('title').asTextField.text = val_input.text;
                        saveToFile(save_path);
                    });
                }
            }
        }
    }
});

let toolMenu = App.menu.GetSubMenu("tool");
toolMenu.AddItem("多语言设置", "imageCopper", () => {
    imageCropperWindow.Show();
});

// System.IO.File.WriteAllLines('E:\\pdragon\\spx\\UIProject\\Proj_qpx_main\\plugins\\PxCook_RectNative转换器\\test.txt', all_path);

