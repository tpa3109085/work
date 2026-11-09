# MessageControl

GitHub Pages 静态待办界面。当前后台配置尚未完成，登录和同步暂不可用。

只发布网页程序；原始聊天、SQLite 数据、账号密码和私密密钥不在此仓库。

连接后台需要在 config.js 设置 Supabase publishable key，并部署独立的用户权限表和接口。禁止使用 secret 或 service_role key。

期限默认采用分析结果，可以手动覆盖或恢复分析期限。
