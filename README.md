# WZTI 王者荣耀人格测试

[开始测试](https://lyqien.github.io/wzti/)

手机优先的28题娱乐人格测试，匹配129位英雄。选择后自动进入下一题，支持返回上一题修改；答完显示英雄、台词、完整性格描述、动态八维百分比和最佳匹配英雄。再测一次返回首页并清空答案。

## 文件

- `config.json`：交接包原始28题、129位英雄规则及文案。
- `match.js`：交接包原始计算程序，未更改匹配逻辑。
- `Images/Outputs_Images/`：129张英雄原图及品牌Logo，保留中文文件名及透明通道。
- `fonts/`：源泉圆体的网页子集及开源许可。增加文案时需更新字体子集。
- `index.html`、`app.js`、`style.css`：当前确认的米白与金色界面。

GitHub Actions 自动部署到 GitHub Pages。可本地使用任意静态服务器预览，请勿直接双击HTML（需要读取JSON）。

旧版保留在 Git 提交历史和 `archive/before-2026-11-02` 分支中。
