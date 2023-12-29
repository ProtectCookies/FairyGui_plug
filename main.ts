/*
 * @Date: 2023-12-25 12:21:14
 * @LastEditors: yc
 * @Description: 
 * @LastEditTime: 2023-12-27 09:24:02
 * @FilePath: \PxCook_RectNative转换器\main.ts
 */
import csharp_1, {FairyGUI, FairyEditor, UnityEngine, System, IEnumerable$1} from 'csharp';
import {$generic} from "puerts";
const App = FairyEditor.App;
App.pluginManager.LoadUIPackage(App.pluginManager.basePath + "/" + eval("__dirname") + '/CSSAttributer');
class DemoInspector extends FairyEditor.View.PluginInspector {
    private textinput: FairyGUI.GLabel;
    private btn_clear: FairyGUI.GButton;
    private btn_apply: FairyGUI.GButton;
    constructor() {
        super();
        this.panel = FairyGUI.UIPackage.CreateObject("CSSAttributer", "Main").asCom;
        this.textinput = this.panel.GetChild("textarea").asLabel;
        this.btn_clear = this.panel.GetChild("btn_clear").asButton;
        this.btn_apply = this.panel.GetChild("btn_apply").asButton;
        this.btn_clear.onClick.Add(() => {
            this.textinput.title = "";
        });
        this.btn_apply.onClick.Add(() => {
            let obj = App.activeDoc.inspectingTarget;
            let attributes = this.textinput.title;
            if (!attributes.startsWith('const')) {
                console.warn('输入的字符串不是ReactNative属性,请检查PxCook左上角是否设置成iOS,且右下角属性窗口是否是ReactNative');
                return;
            }
            let index = attributes.indexOf('{') + 1;
            if (obj.objectType == 'text') {
                obj.docElement.SetProperty('autoSize', 'shrink'); // 默认就设置成自动收缩
                obj.docElement.SetProperty('align', 'center');
                obj.docElement.SetProperty('verticalAlign', 'middle'); // 默认就设置居中
            }
            if (index !== -1) {
                // 处理下字符串前面的无用字符
                attributes = attributes.substring(index);
            }
            attributes = attributes.slice(0, -3); // 去除掉最后的数据 }；
            let attributesArr = this.parseProperties(attributes);
            attributesArr.forEach(attribute => {
                if (attribute !== "") {
                    let pro_sx;
                    if (attribute.trim().startsWith('shadowOffset')) {
                        pro_sx = attribute.split("{");
                    } else {
                        pro_sx = attribute.split(":");
                    }
                    let [key, value] = pro_sx;
                    this.updateAttribute(key, value, obj);
                }
            });
        });
        this.updateAction = () => {
            return this.updateUI();
        };
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
                newValue = +value;
                break;
            case "width":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "width";
                newValue = +value;
                break;
            case "color":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "color";
                if (obj.objectType == 'text') {
                    // 不是文本类型就不处理color
                    newValue = FairyEditor.ColorUtil.FromHexString(value);
                }
                break;
            case "fontSize":
                // border:5px solid red; lineSize[default:1] - lineColor[default:#000000]
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "fontSize";
                if (obj.objectType == 'text') {
                    // 不是文本类型就不处理fontSize
                    newValue = +value;
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
                newValue = +value;
                break;
            case "borderColor":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                key = "strokeColor";
                newValue = FairyEditor.ColorUtil.FromHexString(value);
                break;
            case "shadowColor":
                value = value.replace("px", "").replace(/\s/g, "").replace(/\r\n/g, "").replace(/"/g, '');
                obj.docElement.SetProperty('shadow', true);
                key = "shadowColor";
                newValue = FairyEditor.ColorUtil.FromHexString(value);
                break;
            case "shadowOffset:":
                // 使用正则表达式提取数字
                var matches = value.match(/(\d+)/g);
                // 将提取的数字转换为整数并赋值给变量
                var [width, height] = matches.map(Number);
                obj.docElement.SetProperty('shadowX', width);
                obj.docElement.SetProperty('shadowY', height);
                break;
            default:
                break;
        }
        if (newValue) {
            obj.docElement.SetProperty(key, newValue);
        } else {
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
let preActive = App.isActive;
let onUpdate = function () {
    var active = App.isActive;
    if (preActive == active) {
        return;
    }
    preActive = active;
    if (active) {
        // 从后台返回
        console.log("检测到从后台返回, 刷新fgui工程;");
        App.RefreshProject();
    } else {
        // 切到后台
        // console.log("检测切到后台")
    }
};
// let menu = App.menu.GetSubMenu("tool")
App.add_onUpdate(onUpdate);
exports.onDestroy = function () {
    App.remove_onUpdate(onUpdate);
}
// console.log(menu);
// menu.AddItem("display name", "name", (name) => {
//     console.log("call menuitem.");
// });

let getAllText = function (target, path) {
    if (!target.children || target.children.Count == 0) {
        return;
    }
    for (var i = 0; i < target.children.Count; i++) {

    }
    target.children.ForEach((item) => {
        if (item.objectType == 'text') {
            path = path + item.name + '/';
            console.log('找到了文本组件', item.name);
            return;
        }
        else{
            path = path + item.name + '/';
            getAllText(item, path);
        }
    });
}
let packs = App.project.allPackages;
packs.ForEach((a) => {
    a.items.ForEach((item) => {
        if (item.exported && item.type != 'font') { // 获取所有导出的组件等
            let fobj = FairyEditor.FObjectFactory.CreateObject(item) as FairyEditor.FComponent;
            let list_tmp:[] = []
            System.IO.File.WriteAllLines('aa',list_tmp)
        }

    });
});
let Enume = $generic(System.Collections.Generic.IEnumerable$1, csharp_1.System.String); //$generic调用性能不会太好，同样泛型参数建议整个工程，至少一个文件内只做一次
let List = $generic(csharp_1.System.Collections.Generic.List$1, string); //$generic调用性能不会太好，同样泛型参数建议整个工程，至少一个文件内只做一次
let a:System.Collections.Generic.List$1<string> = new System.Collections.Generic.List$1<string>();
a.Add('a')
a.Add('1')
const myList = new System.Collections.Generic.List$1<System.String>();
FairyEditor.App
