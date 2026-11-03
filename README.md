# WZTI 王者荣耀人格测试

[开始测试](https://lyqien.github.io/wzti/)

已接入v9内容升级。手机优先的28题娱乐人格测试，匹配129位英雄。选择后自动进入下一题，支持返回上一题修改。新版显示实际答题匹配原因、接近英雄、作答倾向分、互补英雄搭档三段文案，并支持进度恢复、结果链接和分享图片。再测一次返回首页并清空本项目答案。

## 文件

- `config.json`：交接包原始28题、129位英雄规则及文案。
- `match.js`：交接包原始计算程序，未更改匹配逻辑。
- `Images/Outputs_Images/`：129张英雄原图及品牌Logo，保留中文文件名及透明通道。
- `session.js`：带版本校验的进度恢复和完整答案结果链接。
- `share.js`、`share-qr.png`：原生Canvas分享卡，含原图、Logo、关键词及真实入口二维码。
- 字体使用系统圆体／无衬线字体，不依赖网络字体加载。
- `index.html`、`app.js`、`style.css`：当前确认的米白与金色界面。

修改源码后运行 `python scripts/build_page.py` 生成内嵌配置与脚本的 `index.html`，通过HTTP静态服务器预览。提交main会触发GitHub Actions部署。

旧版保留在 Git 提交历史和 `archive/before-2026-11-02` 分支中。

## 图片分发与缓存

`cdn.json` 固定到 `web-release` 分支的具体发布提交，通过 jsDelivr 分发压缩清晰图。图片请求同时尝试CDN和原站，先成功的线路生效；浏览器支持时，将成功图片保存到版本化地址对应的Cache Storage。图片失败不阻塞结果页。更新英雄图片时应同时更新资源发布和CDN提交版本，避免使用旧缓存。
