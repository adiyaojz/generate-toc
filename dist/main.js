"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const DEFAULT_SETTINGS = {
    headNoadTocTip: "-------",
    tailNoadTocTip: "-----",
    enableCodeBlock: true,
    codeBlockTitle: "ad-toc",
    enableTitleContent: true,
    titleContent: "目录",
    enableColorContent: true,
    colorContent: "#6496FF",
    enableCollapseContent: true,
    collapseContent: "open",
    tocLevel: 3,
};
const texts = {
    en: {
        //enableCodeBlock: "Enable Code Block", # Use sentence case in UI
        enableCodeBlock: "Enable code block",
        codeBlockDesc: "Enable or disable the code block. It is recommended to enable this option. If disabled, future TOC updates might cause incorrect document deletions or failure to remove previous TOCs. Before disabling, please back up your document and set appropriate start and end markers.",
        titleContent: "Title Content",
        customTitleContent: "Custom title content",
        none: "None",
        customTitle: "Custom Title",
        colorContent: "Color Content",
        customColor: "Custom color",
        collapseSetting: "Collapse Setting",
        collapseDesc: "Whether to open or close the collapse",
        open: "Open",
        close: "Close",
        headNoadTocTip: "Head No-ad-toc Tip",
        tailNoadTocTip: "Tail No-ad-toc Tip",
        customHeadTip: "Custom head no-ad-toc tip, preferably unique or use the default",
        customTailTip: "Custom tail no-ad-toc tip, preferably unique or use the default",
        codeBlockTip: "Code Block Title",
        codeBlockDescTip: "Customize the title of the code block",
    },
    zh: {
        enableCodeBlock: "启用代码块",
        codeBlockDesc: "是否启用代码块。建议启用，如果禁用代码块，后续可能会更新目录错误导致的误删文档或者漏删之前的目录，禁用代码使用前请进行备份和设置好两头标识。",
        titleContent: "标题内容",
        customTitleContent: "自定义 title 的内容",
        none: "无",
        customTitle: "自定义标题",
        colorContent: "颜色内容",
        customColor: "自定义颜色",
        collapseSetting: "折叠设置",
        collapseDesc: "是否打开折叠",
        open: "开",
        close: "关",
        headNoadTocTip: "无代码块头部标识",
        tailNoadTocTip: "无代码块尾部标识",
        customHeadTip: "尽量设置不一样的标识，或者使用默认即可，主要检索标识进行删除",
        customTailTip: "尽量设置不一样的标识，或者使用默认即可",
        codeBlockTip: "代码块标题",
        codeBlockDescTip: "自定义代码块的标题",
    },
};
class UpdateAdTocPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Loading UpdateAdTocPlugin");
            // Load settings
            yield this.loadSettings();
            // Add command to update ad-toc blocks
            this.addCommand({
                id: "generate-toc",
                //name: "Generate TOC(一键生成目录)", # This should also be part of the translations.
                name: "Generate TOC",
                callback: () => this.updateAdTocBlocks(),
            });
            // Add settings tab
            this.addSettingTab(new AdTocSettingTab(this.app, this));
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    updateAdTocBlocks() {
        const activeLeaf = this.app.workspace.activeEditor;
        //const activeLeaf = this.app.workspace.activeLeaf;
        if (!activeLeaf || !activeLeaf.editor) {
            console.error("No active editor found");
            return;
        }
        //const editor = activeLeaf.view.editor;
        const editor = activeLeaf.editor;
        //let content = editor.getValue();
        let content = editor.getValue();
        // Remove existing ad-toc block if it exists
        const adTocBlockPattern = new RegExp(`\`\`\`${this.settings.codeBlockTitle}\n[\\s\\S]*?\n\`\`\`\n`, "g");
        content = content.replace(adTocBlockPattern, "");
        const noadTocBlockPattern = new RegExp(`${this.settings.headNoadTocTip}\n[\\s\\S]*?\n${this.settings.tailNoadTocTip}\n`, "g");
        content = content.replace(noadTocBlockPattern, "");
        // Parse the headings from the document
        const headings = this.parseHeadings(content);
        // Generate new ad-toc block content
        let newAdTocContent = "";
        if (this.settings.enableCodeBlock) {
            newAdTocContent += `\`\`\`${this.settings.codeBlockTitle}\n`;
            if (this.settings.enableTitleContent &&
                this.settings.titleContent !== "none") {
                newAdTocContent += `title: ${this.settings.titleContent}\n`;
            }
            if (this.settings.enableColorContent &&
                this.settings.colorContent !== "none") {
                newAdTocContent += `color: ${this.settings.colorContent}\n`;
            }
            if (this.settings.enableCollapseContent &&
                this.settings.collapseContent !== "none") {
                newAdTocContent += `collapse: ${this.settings.collapseContent}\n`;
            }
            newAdTocContent += `${heading(headings, this.settings.tocLevel)}\n`;
            newAdTocContent += `\`\`\`\n`;
        }
        else {
            newAdTocContent += `${this.settings.headNoadTocTip}\n`;
            newAdTocContent += `${heading(headings, this.settings.tocLevel)}\n`;
            newAdTocContent += `${this.settings.tailNoadTocTip}\n`;
        }
        // Find the position to insert the new ad-toc block
        const yamlFrontMatterPattern = /^---\n[\s\S]*?\n---\n/;
        const yamlMatch = content.match(yamlFrontMatterPattern);
        const insertPosition = yamlMatch ? yamlMatch[0].length : 0;
        // Insert the new ad-toc block after the YAML front matter block
        const beforeContent = content.slice(0, insertPosition);
        const afterContent = content.slice(insertPosition);
        editor.setValue(beforeContent + newAdTocContent + afterContent);
    }
    parseHeadings(content) {
        const headingPattern = /^(#+)\s+(.*)/gm;
        const headings = [];
        let match;
        while ((match = headingPattern.exec(content)) !== null) {
            headings.push({
                level: match[1].length,
                heading: match[2],
            });
        }
        return headings;
    }
    onunload() {
        console.log("Unloading UpdateAdTocPlugin");
    }
}
function heading(arr, l = 3) {
    const generateSpaces = (level) => " ".repeat((level - 1) * 4);
    return arr
        .filter((item) => item.level <= l)
        .map((item) => {
        let heading = item.heading;
        heading = heading.replace(/\[\[|\]\]/g, "");
        heading = generateSpaces(item.level) + `- [ ] [[# ${heading.trim()}]]`;
        return heading;
    })
        .join("\n");
}
class AdTocSettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        const lang = "zh"; // Set language to Chinese for demonstration
        containerEl.empty();
        //containerEl.createEl("h2", { text: "一键生成目录插件设置" });
        new obsidian_1.Setting(containerEl)
            .setName(texts[lang].enableCodeBlock)
            .setDesc(texts[lang].codeBlockDesc)
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableCodeBlock)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.enableCodeBlock = value;
            yield this.plugin.saveSettings();
            this.display(); // 重新渲染设置
        })));
        const codeBlockSettings = containerEl.createDiv();
        codeBlockSettings.style.display = this.plugin.settings.enableCodeBlock
            ? "block"
            : "none";
        new obsidian_1.Setting(codeBlockSettings)
            .setName(texts[lang].codeBlockTip)
            .setDesc(texts[lang].codeBlockDescTip)
            .addText((text) => text
            .setValue(this.plugin.settings.codeBlockTitle)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.codeBlockTitle = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian_1.Setting(containerEl)
            .setName(texts[lang].headNoadTocTip)
            .setDesc(texts[lang].customHeadTip)
            .addText((text) => text
            .setValue(this.plugin.settings.headNoadTocTip)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.headNoadTocTip = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian_1.Setting(containerEl)
            .setName(texts[lang].tailNoadTocTip)
            .setDesc(texts[lang].customTailTip)
            .addText((text) => text
            .setValue(this.plugin.settings.tailNoadTocTip)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.tailNoadTocTip = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian_1.Setting(containerEl)
            .setName(texts[lang].titleContent)
            .setDesc(texts[lang].customTitleContent)
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableTitleContent)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.enableTitleContent = value;
            yield this.plugin.saveSettings();
            this.display(); // 重新渲染设置
        })));
        const titleSettings = containerEl.createDiv();
        titleSettings.style.display = this.plugin.settings.enableTitleContent
            ? "block"
            : "none";
        new obsidian_1.Setting(titleSettings)
            .setName(texts[lang].titleContent)
            .setDesc(texts[lang].customTitleContent)
            .addText((text) => text
            .setValue(this.plugin.settings.titleContent !== "none"
            ? this.plugin.settings.titleContent
            : "")
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            if (value.trim() === "") {
                this.plugin.settings.titleContent = "none";
            }
            else {
                this.plugin.settings.titleContent = value;
            }
            yield this.plugin.saveSettings();
        })));
        new obsidian_1.Setting(containerEl)
            .setName(texts[lang].colorContent)
            .setDesc(texts[lang].customColor)
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableColorContent)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.enableColorContent = value;
            yield this.plugin.saveSettings();
            this.display(); // 重新渲染设置
        })));
        const colorSettings = containerEl.createDiv();
        colorSettings.style.display = this.plugin.settings.enableColorContent
            ? "block"
            : "none";
        new obsidian_1.Setting(colorSettings)
            .setName(texts[lang].colorContent)
            .setDesc(texts[lang].customColor)
            .addColorPicker((color) => color
            .setValue(this.plugin.settings.colorContent !== "none"
            ? this.plugin.settings.colorContent
            : "#000000")
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.colorContent = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian_1.Setting(containerEl)
            .setName(texts[lang].collapseSetting)
            .setDesc(texts[lang].collapseDesc)
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableCollapseContent)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.enableCollapseContent = value;
            yield this.plugin.saveSettings();
            this.display(); // 重新渲染设置
        })));
        const collapseSettings = containerEl.createDiv();
        collapseSettings.style.display = this.plugin.settings.enableCollapseContent
            ? "block"
            : "none";
        new obsidian_1.Setting(collapseSettings)
            .setName(texts[lang].collapseSetting)
            .setDesc(texts[lang].collapseDesc)
            .addDropdown((dropdown) => dropdown
            .addOption("none", texts[lang].none)
            .addOption("open", texts[lang].open)
            .addOption("close", texts[lang].close)
            .setValue(this.plugin.settings.collapseContent)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.collapseContent = value;
            yield this.plugin.saveSettings();
        })));
    }
}
exports.default = UpdateAdTocPlugin;
