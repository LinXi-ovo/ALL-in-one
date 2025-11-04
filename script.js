// 页面导航功能
document.addEventListener('DOMContentLoaded', function() {
    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // 移除所有活动状态
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

            // 添加当前活动状态
            this.classList.add('active');
            const pageId = this.getAttribute('data-page') + '-page';
            document.getElementById(pageId).classList.add('active');

            // 加载对应的通知
            loadNotifications(this.getAttribute('data-page'));
        });
    });

    // 模态框控制
    const modal = document.getElementById('notification-modal');
    const closeBtn = document.querySelector('.close');
    const notificationForm = document.getElementById('notification-form');

    // 添加比赛通知按钮
    document.getElementById('add-competition-btn').addEventListener('click', function() {
        openModal('competition');
    });

    // 添加活动通知按钮
    document.getElementById('add-activity-btn').addEventListener('click', function() {
        openModal('activity');
    });

    // 添加证书通知按钮
    document.getElementById('add-certificate-btn').addEventListener('click', function() {
        openModal('certificate');
    });

    // 添加作业通知按钮
    document.getElementById('add-assignment-btn').addEventListener('click', function() {
        openModal('assignment');
    });

    // 关闭模态框
    closeBtn.addEventListener('click', function() {
        closeModal();
    });

    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 关闭模态框的通用函数
    function closeModal() {
        modal.style.display = 'none';
        notificationForm.reset();
        notificationForm.removeAttribute('data-mode');
        notificationForm.removeAttribute('data-id');
        imagePreview.innerHTML = '';
    }

    // 图片上传预览
    const imageInput = document.getElementById('notification-image');
    const imagePreview = document.getElementById('image-preview');

    imageInput.addEventListener('change', function() {
        // 清空预览区
        imagePreview.innerHTML = '';

        // 检查是否有文件被选择
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                // 创建图片元素
                const img = document.createElement('img');
                img.src = e.target.result;

                // 添加到预览区
                imagePreview.appendChild(img);
            };

            // 读取文件为DataURL
            reader.readAsDataURL(this.files[0]);
        }
    });

    // 表单提交
    notificationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const type = this.getAttribute('data-type');
        const mode = this.getAttribute('data-mode') || 'add';
        const title = document.getElementById('notification-title').value;
        const content = document.getElementById('notification-content').value;
        const deadline = document.getElementById('notification-deadline').value;
        const link = document.getElementById('notification-link').value;

        // 获取图片数据
        let imageData = null;
        const previewImg = imagePreview.querySelector('img');
        if (previewImg) {
            imageData = previewImg.src;
        }

        // 根据模式执行不同操作
        if (mode === 'edit') {
            const id = parseInt(this.getAttribute('data-id'));
            updateNotification(type, id, {
                title,
                content,
                deadline,
                link,
                image: imageData
            });
        } else {
            // 保存新通知到本地存储
            saveNotification(type, {
                id: Date.now(),
                title,
                content,
                deadline,
                link,
                image: imageData,
                created: new Date().toISOString()
            });
        }

        // 关闭模态框并重置表单
        modal.style.display = 'none';
        this.reset();
        this.removeAttribute('data-mode');
        this.removeAttribute('data-id');
        imagePreview.innerHTML = '';

        // 重新加载通知
        loadNotifications(type);
    });

    // 导入导出按钮事件
    document.getElementById('import-export-btn').addEventListener('click', function() {
        document.getElementById('import-export-modal').style.display = 'block';
    });

    // 关闭导入导出模态框
    document.querySelector('.close-import-export').addEventListener('click', function() {
        document.getElementById('import-export-modal').style.display = 'none';
    });

    // 点击导入导出模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('import-export-modal')) {
            document.getElementById('import-export-modal').style.display = 'none';
        }
    });

    // 导出所有通知
    document.getElementById('export-all-btn').addEventListener('click', function() {
        exportAllNotifications();
    });

    // 导入所有通知
    document.getElementById('import-all-btn').addEventListener('click', function() {
        const fileInput = document.getElementById('import-file');
        if (fileInput.files.length > 0) {
            importAllNotifications(fileInput.files[0]);
        } else {
            alert('请选择要导入的文件');
        }
    });

    // 初始加载首页
    loadNotifications('home');
});

// 打开模态框
function openModal(type) {
    const modal = document.getElementById('notification-modal');
    const modalTitle = document.getElementById('modal-title');
    const notificationForm = document.getElementById('notification-form');

    // 设置模态框标题和表单类型
    if (type === 'competition') {
        modalTitle.textContent = '添加比赛通知';
    } else if (type === 'activity') {
        modalTitle.textContent = '添加活动通知';
    } else if (type === 'certificate') {
        modalTitle.textContent = '添加证书通知';
    } else if (type === 'assignment') {
        modalTitle.textContent = '添加作业通知';
    }

    notificationForm.setAttribute('data-type', type);
    modal.style.display = 'block';
}

// 保存通知到本地存储
function saveNotification(type, notification) {
    // 获取现有通知
    let notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');

    // 添加新通知
    notifications.push(notification);

    // 保存回本地存储
    localStorage.setItem(type + 'Notifications', JSON.stringify(notifications));
}

// 更新通知
function updateNotification(type, id, updatedData) {
    // 获取现有通知
    let notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');

    // 找到要更新的通知索引
    const index = notifications.findIndex(n => n.id === id);

    if (index !== -1) {
        // 更新通知数据，保留原有的created时间
        notifications[index] = {
            ...notifications[index],
            ...updatedData,
            updated: new Date().toISOString()
        };

        // 保存回本地存储
        localStorage.setItem(type + 'Notifications', JSON.stringify(notifications));
    }
}

// 加载并显示通知
function loadNotifications(type) {
    // 如果是首页，不加载任何通知
    if (type === 'home') return;

    // 获取通知列表容器
    const listContainer = document.getElementById(type + '-list');
    if (!listContainer) return;

    // 清空现有内容
    listContainer.innerHTML = '';

    // 从本地存储获取通知
    const notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');

    // 按截止时间排序，未过期的在前
    const now = new Date();
    const activeNotifications = notifications.filter(n => new Date(n.deadline) > now);
    const expiredNotifications = notifications.filter(n => new Date(n.deadline) <= now);

    const sortedNotifications = [...activeNotifications, ...expiredNotifications];

    // 创建通知元素
    sortedNotifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification, type);
        listContainer.appendChild(notificationElement);
    });
}

// 创建通知元素
function createNotificationElement(notification, type) {
    const now = new Date();
    const deadline = new Date(notification.deadline);
    const isExpired = deadline <= now;

    // 创建通知项容器
    const item = document.createElement('div');
    item.className = 'notification-item';
    if (isExpired) item.classList.add('expired');

    // 创建通知头部
    const header = document.createElement('div');
    header.className = 'notification-header';

    // 创建标题
    const title = document.createElement('div');
    title.className = 'notification-title';
    title.textContent = notification.title;

    // 创建截止时间
    const deadlineDiv = document.createElement('div');
    deadlineDiv.className = 'notification-deadline';
    deadlineDiv.textContent = '截止时间: ' + formatDate(deadline);

    // 创建操作按钮
    const actions = document.createElement('div');
    actions.className = 'notification-actions';

    // 编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 防止触发展开/折叠
        editNotification(type, notification);
    });
    actions.appendChild(editBtn);

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 防止触发展开/折叠
        deleteNotification(type, notification.id);
    });

    actions.appendChild(deleteBtn);

    // 组装头部
    header.appendChild(title);
    header.appendChild(deadlineDiv);
    header.appendChild(actions);

    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'notification-content';

    // 创建内容文本
    const contentText = document.createElement('p');
    contentText.textContent = notification.content;
    content.appendChild(contentText);

    // 如果有图片，显示图片
    if (notification.image) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'notification-image';

        const img = document.createElement('img');
        img.src = notification.image;
        img.alt = '通知图片';

        imageDiv.appendChild(img);
        content.appendChild(imageDiv);
    }

    // 如果有链接，创建链接区域
    if (notification.link) {
        const linkDiv = document.createElement('div');
        linkDiv.className = 'notification-link';

        // 创建链接按钮
        const linkButton = document.createElement('a');
        linkButton.className = 'link-button';
        linkButton.href = notification.link;
        linkButton.target = '_blank';
        linkButton.textContent = '打开链接';
        linkDiv.appendChild(linkButton);

        // 创建iframe切换按钮
        const iframeToggle = document.createElement('button');
        iframeToggle.className = 'iframe-toggle';
        iframeToggle.textContent = '嵌入显示';
        iframeToggle.addEventListener('click', function() {
            toggleIframe(item);
        });
        linkDiv.appendChild(iframeToggle);

        // 创建iframe容器
        const iframe = document.createElement('iframe');
        iframe.className = 'notification-iframe';
        iframe.src = notification.link;
        content.appendChild(linkDiv);
        content.appendChild(iframe);
    }

    // 组装通知项
    item.appendChild(header);
    item.appendChild(content);

    // 添加点击展开/收起功能
    header.addEventListener('click', function(e) {
        // 如果点击的是按钮，不触发展开/收起
        if (e.target.tagName === 'BUTTON') return;

        item.classList.toggle('expanded');
    });

    return item;
}

// 编辑通知
function editNotification(type, notification) {
    const modal = document.getElementById('notification-modal');
    const modalTitle = document.getElementById('modal-title');
    const notificationForm = document.getElementById('notification-form');
    const imagePreview = document.getElementById('image-preview');

    // 设置模态框标题
    if (type === 'competition') {
        modalTitle.textContent = '编辑比赛通知';
    } else if (type === 'activity') {
        modalTitle.textContent = '编辑活动通知';
    } else if (type === 'certificate') {
        modalTitle.textContent = '编辑证书通知';
    } else if (type === 'assignment') {
        modalTitle.textContent = '编辑作业通知';
    }

    // 设置表单类型和编辑模式
    notificationForm.setAttribute('data-type', type);
    notificationForm.setAttribute('data-mode', 'edit');
    notificationForm.setAttribute('data-id', notification.id);

    // 填充表单数据
    document.getElementById('notification-title').value = notification.title;
    document.getElementById('notification-content').value = notification.content || '';
    document.getElementById('notification-deadline').value = notification.deadline;
    document.getElementById('notification-link').value = notification.link || '';

    // 显示已有图片
    imagePreview.innerHTML = '';
    if (notification.image) {
        const img = document.createElement('img');
        img.src = notification.image;
        imagePreview.appendChild(img);
    }

    // 显示模态框
    modal.style.display = 'block';
}

// 删除通知
function deleteNotification(type, id) {
    if (!confirm('确定要删除这个通知吗？')) return;

    // 获取现有通知
    let notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');

    // 过滤掉要删除的通知
    notifications = notifications.filter(n => n.id !== id);

    // 保存回本地存储
    localStorage.setItem(type + 'Notifications', JSON.stringify(notifications));

    // 重新加载通知
    loadNotifications(type);
}

// 切换iframe显示
function toggleIframe(notificationItem) {
    notificationItem.classList.toggle('iframe-visible');
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 导出所有通知
function exportAllNotifications() {
    const notificationTypes = ['competition', 'activity', 'certificate', 'assignment'];
    const allNotifications = {};
    const imageFiles = {};

    // 收集所有类型的通知
    notificationTypes.forEach(type => {
        const notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');
        if (notifications.length > 0) {
            // 处理通知中的图片
            notifications.forEach(notification => {
                if (notification.image && notification.image.startsWith('data:image')) {
                    // 生成唯一文件名
                    const fileName = `img_${notification.id}_${Date.now()}.jpg`;
                    
                    // 保存图片数据
                    imageFiles[fileName] = notification.image;
                    
                    // 替换图片数据为文件名
                    notification.image = fileName;
                }
            });
            
            allNotifications[type] = notifications;
        }
    });

    // 添加导出时间戳
    allNotifications.exportDate = new Date().toISOString();
    
    // 如果有图片，添加图片信息
    if (Object.keys(imageFiles).length > 0) {
        allNotifications.hasImages = true;
    }

    // 转换为JSON字符串
    const dataStr = JSON.stringify(allNotifications, null, 2);

    // 创建ZIP文件（如果需要包含图片）
    if (Object.keys(imageFiles).length > 0) {
        // 创建一个包含JSON和图片的ZIP文件
        createZipFile(dataStr, imageFiles);
    } else {
        // 没有图片，直接导出JSON
        // 创建Blob对象
        const blob = new Blob([dataStr], {type: 'application/json'});
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 设置文件名（包含日期）
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        link.download = `notifications_${dateStr}.json`;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        URL.revokeObjectURL(url);
    }

    // 显示成功消息
    alert('通知已成功导出！');
}

// 创建包含JSON和图片的ZIP文件
function createZipFile(jsonData, imageFiles) {
    // 使用JSZip库创建ZIP文件
    // 注意：这需要在HTML中引入JSZip库
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    
    // 如果JSZip不可用，回退到仅导出JSON
    if (typeof JSZip === 'undefined') {
        console.warn('JSZip库未加载，将仅导出JSON数据，不包含图片');
        
        // 创建Blob对象
        const blob = new Blob([jsonData], {type: 'application/json'});
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 设置文件名（包含日期）
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        link.download = `notifications_${dateStr}.json`;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        URL.revokeObjectURL(url);
        return;
    }
    
    // 创建新的ZIP文件
    const zip = new JSZip();
    
    // 添加JSON文件
    zip.file("notifications.json", jsonData);
    
    // 创建images文件夹并添加图片
    const imgFolder = zip.folder("images");
    
    // 将每个Base64图片转换为文件
    Object.keys(imageFiles).forEach(fileName => {
        // 从Base64字符串中提取实际数据
        const base64Data = imageFiles[fileName].split(',')[1];
        imgFolder.file(fileName, base64Data, {base64: true});
    });
    
    // 生成ZIP文件
    zip.generateAsync({type: "blob"}).then(function(content) {
        // 创建下载链接
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        
        // 设置文件名（包含日期）
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        link.download = `notifications_${dateStr}.zip`;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        URL.revokeObjectURL(url);
    });
}

// 导入所有通知
function importAllNotifications(file) {
    // 检查文件类型
    const fileName = file.name.toLowerCase();
    
    // 如果是ZIP文件，使用特殊处理
    if (fileName.endsWith('.zip')) {
        importFromZip(file);
        return;
    }
    
    // 否则按JSON处理
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // 验证数据格式
            if (!data || typeof data !== 'object') {
                throw new Error('无效的文件格式');
            }
            
            // 检查是否有图片引用但缺少图片数据
            if (data.hasImages) {
                if (!confirm('此导入文件包含图片引用，但您上传的是JSON文件而非ZIP文件。图片将无法显示。是否继续？')) {
                    return;
                }
            }

            // 确认导入操作
            if (!confirm('导入将覆盖现有的所有通知数据，确定要继续吗？')) {
                return;
            }

            // 导入各类型通知
            const notificationTypes = ['competition', 'activity', 'certificate', 'assignment'];
            notificationTypes.forEach(type => {
                if (data[type] && Array.isArray(data[type])) {
                    localStorage.setItem(type + 'Notifications', JSON.stringify(data[type]));
                }
            });

            // 关闭导入导出模态框
            document.getElementById('import-export-modal').style.display = 'none';
            document.getElementById('import-file').value = '';

            // 重新加载当前页面
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageType = activePage.id.replace('-page', '');
                if (pageType !== 'home') {
                    loadNotifications(pageType);
                }
            }

            // 显示成功消息
            alert('通知已成功导入！');

        } catch (error) {
            alert('导入失败：' + error.message);
        }
    };

    // 读取文件
    reader.readAsText(file);
}

// 从ZIP文件导入
function importFromZip(zipFile) {
    // 检查JSZip是否可用
    if (typeof JSZip === 'undefined') {
        alert('导入失败：需要JSZip库来处理ZIP文件。请上传JSON文件或确保JSZip库已加载。');
        return;
    }
    
    // 使用JSZip读取ZIP文件
    JSZip.loadAsync(zipFile).then(function(zip) {
        // 检查是否包含notifications.json
        if (!zip.file("notifications.json")) {
            throw new Error('ZIP文件中未找到notifications.json');
        }
        
        // 读取JSON数据
        zip.file("notifications.json").async("string").then(function(jsonData) {
            try {
                const data = JSON.parse(jsonData);
                
                // 验证数据格式
                if (!data || typeof data !== 'object') {
                    throw new Error('无效的文件格式');
                }
                
                // 确认导入操作
                if (!confirm('导入将覆盖现有的所有通知数据，确定要继续吗？')) {
                    return;
                }
                
                // 处理图片
                if (data.hasImages && zip.folder("images")) {
                    // 获取images文件夹中的所有文件
                    const imagePromises = [];
                    const imageMap = {};
                    
                    zip.folder("images").forEach(function(relativePath, file) {
                        if (!file.dir) {
                            const promise = file.async("base64").then(function(base64Data) {
                                // 构建完整的data URL
                                const mimeType = getMimeTypeFromFileName(relativePath);
                                imageMap[relativePath] = `data:${mimeType};base64,${base64Data}`;
                            });
                            imagePromises.push(promise);
                        }
                    });
                    
                    // 等待所有图片加载完成
                    Promise.all(imagePromises).then(function() {
                        // 将图片数据替换回通知中
                        notificationTypes = ['competition', 'activity', 'certificate', 'assignment'];
                        notificationTypes.forEach(type => {
                            if (data[type] && Array.isArray(data[type])) {
                                data[type].forEach(notification => {
                                    if (notification.image && imageMap[notification.image]) {
                                        notification.image = imageMap[notification.image];
                                    }
                                });
                                
                                // 保存到本地存储
                                localStorage.setItem(type + 'Notifications', JSON.stringify(data[type]));
                            }
                        });
                        
                        // 关闭导入导出模态框
                        document.getElementById('import-export-modal').style.display = 'none';
                        document.getElementById('import-file').value = '';
                        
                        // 重新加载当前页面
                        const activePage = document.querySelector('.page.active');
                        if (activePage) {
                            const pageType = activePage.id.replace('-page', '');
                            if (pageType !== 'home') {
                                loadNotifications(pageType);
                            }
                        }
                        
                        // 显示成功消息
                        alert('通知已成功导入！');
                    }).catch(function(error) {
                        alert('导入失败：处理图片时出错 - ' + error.message);
                    });
                } else {
                    // 没有图片，直接导入
                    // 导入各类型通知
                    const notificationTypes = ['competition', 'activity', 'certificate', 'assignment'];
                    notificationTypes.forEach(type => {
                        if (data[type] && Array.isArray(data[type])) {
                            localStorage.setItem(type + 'Notifications', JSON.stringify(data[type]));
                        }
                    });
                    
                    // 关闭导入导出模态框
                    document.getElementById('import-export-modal').style.display = 'none';
                    document.getElementById('import-file').value = '';
                    
                    // 重新加载当前页面
                    const activePage = document.querySelector('.page.active');
                    if (activePage) {
                        const pageType = activePage.id.replace('-page', '');
                        if (pageType !== 'home') {
                            loadNotifications(pageType);
                        }
                    }
                    
                    // 显示成功消息
                    alert('通知已成功导入！');
                }
            } catch (error) {
                alert('导入失败：' + error.message);
            }
        }).catch(function(error) {
            alert('导入失败：读取JSON数据时出错 - ' + error.message);
        });
    }).catch(function(error) {
        alert('导入失败：处理ZIP文件时出错 - ' + error.message);
    });
}

// 根据文件名获取MIME类型
function getMimeTypeFromFileName(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        default:
            return 'image/jpeg'; // 默认返回jpeg
    }
}
