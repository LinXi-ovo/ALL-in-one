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
        const status = document.getElementById('notification-status').value;
        const waitingDescription = document.getElementById('waiting-description').value;

        // 获取所有链接
        const links = [];
        document.querySelectorAll('.link-item').forEach(item => {
            const url = item.querySelector('.notification-link').value;
            const title = item.querySelector('.link-title').value;
            if (url) {
                links.push({
                    url,
                    title: title || url
                });
            }
        });

        // 获取所有文件
        const files = [];
        const filePromises = [];

        document.querySelectorAll('.file-item').forEach((item, index) => {
            const fileInput = item.querySelector('.notification-file');
            const privacyCheckbox = item.querySelector('.file-privacy');
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                filePromises.push(
                    new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            resolve({
                                name: file.name,
                                type: file.type,
                                data: e.target.result,
                                isPrivate: privacyCheckbox ? privacyCheckbox.checked : false
                            });
                        };
                        reader.readAsDataURL(file);
                    })
                );
            }
        });

        // 获取图片数据
        let imageData = null;
        const previewImg = imagePreview.querySelector('img');
        if (previewImg) {
            imageData = previewImg.src;
        }

        // 等待所有文件读取完成
        Promise.all(filePromises).then(fileData => {
            // 根据模式执行不同操作
            if (mode === 'edit') {
                const id = parseInt(this.getAttribute('data-id'));
                updateNotification(type, id, {
                    title,
                    content,
                    deadline,
                    status,
                    waitingDescription: status === 'waiting' ? waitingDescription : '',
                    links,
                    files: fileData,
                    image: imageData
                });
            } else {
                // 保存新通知到本地存储
                saveNotification(type, {
                    id: Date.now(),
                    title,
                    content,
                    deadline,
                    status,
                    waitingDescription: status === 'waiting' ? waitingDescription : '',
                    links,
                    files: fileData,
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
        exportAllNotificationsWithPrivacy();
    });

    // 支持隐私选项的导出函数
    function exportAllNotificationsWithPrivacy() {
        // 获取用户选择的通知类型
        const selectedTypes = [];
        if (document.getElementById('export-competition').checked) selectedTypes.push('competition');
        if (document.getElementById('export-activity').checked) selectedTypes.push('activity');
        if (document.getElementById('export-certificate').checked) selectedTypes.push('certificate');
        if (document.getElementById('export-assignment').checked) selectedTypes.push('assignment');

        // 检查是否至少选择了一种类型
        if (selectedTypes.length === 0) {
            alert('请至少选择一种要导出的通知类型');
            return;
        }

        // 检查是否导出为公共通知
        const isPublic = document.getElementById('export-as-public').checked;

        const allNotifications = {};
        const imageFiles = {};

        // 收集所选类型的通知
        selectedTypes.forEach(type => {
            const notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');
            if (notifications.length > 0) {
                // 处理通知中的图片
                const processedNotifications = notifications.map(notification => {
                    const processedNotification = {...notification};

                    // 如果是公共导出，移除私人信息
                    if (isPublic) {
                        // 保留基本通知信息，但移除私人状态和描述
                        delete processedNotification.waitingDescription;

                        // 过滤掉隐私文件
                        if (processedNotification.files && processedNotification.files.length > 0) {
                            processedNotification.files = processedNotification.files.filter(file => !file.isPrivate);
                        }
                    }

                    if (processedNotification.image && processedNotification.image.startsWith('data:image')) {
                        // 生成唯一文件名
                        const fileName = `img_${processedNotification.id}_${Date.now()}.jpg`;

                        // 保存图片数据
                        imageFiles[fileName] = processedNotification.image;

                        // 替换图片数据为文件名
                        processedNotification.image = fileName;
                    }

                    return processedNotification;
                });

                allNotifications[type] = processedNotifications;
            }
        });

        // 添加导出信息
        allNotifications.exportDate = new Date().toISOString();
        allNotifications.exportType = isPublic ? 'public' : 'private';

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

    // 导入所有通知
    document.getElementById('import-all-btn').addEventListener('click', function() {
        const fileInput = document.getElementById('import-file');
        if (fileInput.files.length > 0) {
            importAllNotifications(fileInput.files[0]);
        } else {
            alert('请选择要导入的文件');
        }
    });

    // 添加链接按钮事件
    document.getElementById('add-link-btn').addEventListener('click', function() {
        const linksContainer = document.getElementById('links-container');
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <input type="url" class="notification-link" placeholder="https://example.com">
            <input type="text" class="link-title" placeholder="链接标题（可选）">
            <button type="button" class="remove-link-btn">删除</button>
        `;
        linksContainer.appendChild(linkItem);

        // 添加删除按钮事件
        linkItem.querySelector('.remove-link-btn').addEventListener('click', function() {
            linkItem.remove();
        });
    });

    // 添加文件按钮事件
    document.getElementById('add-file-btn').addEventListener('click', function() {
        const filesContainer = document.getElementById('files-container');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <input type="file" class="notification-file">
            <label class="file-privacy-label">
                <input type="checkbox" class="file-privacy">
                隐私文件
            </label>
            <button type="button" class="remove-file-btn">删除</button>
        `;
        filesContainer.appendChild(fileItem);

        // 添加删除按钮事件
        fileItem.querySelector('.remove-file-btn').addEventListener('click', function() {
            fileItem.remove();
        });
    });

    // 初始链接和文件删除按钮事件
    document.querySelectorAll('.remove-link-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });

    document.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });

    // 状态选择变化事件
    document.getElementById('notification-status').addEventListener('change', function() {
        const waitingGroup = document.getElementById('waiting-description-group');
        if (this.value === 'waiting') {
            waitingGroup.style.display = 'block';
        } else {
            waitingGroup.style.display = 'none';
        }
    });

    // 查看紧急提醒按钮事件
    document.getElementById('view-urgent-notifications').addEventListener('click', function(e) {
        e.preventDefault();
        showUrgentNotifications();
    });

    // 关闭紧急提醒模态框
    document.querySelector('.close-urgent').addEventListener('click', function() {
        document.getElementById('urgent-modal').style.display = 'none';
    });

    // 点击紧急提醒模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('urgent-modal')) {
            document.getElementById('urgent-modal').style.display = 'none';
        }
    });

    // 显示紧急提醒
    function showUrgentNotifications() {
        const todayContainer = document.getElementById('today-notifications');
        const tomorrowContainer = document.getElementById('tomorrow-notifications');

        // 清空现有内容
        todayContainer.innerHTML = '';
        tomorrowContainer.innerHTML = '';

        // 获取今天和明天的日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // 获取所有类型的通知
        const notificationTypes = ['competition', 'activity', 'certificate', 'assignment'];

        notificationTypes.forEach(type => {
            const notifications = JSON.parse(localStorage.getItem(type + 'Notifications') || '[]');

            notifications.forEach(notification => {
                if (notification.deadline) {
                    const deadline = new Date(notification.deadline);
                    deadline.setHours(0, 0, 0, 0);

                    // 检查是否是今天或明天的截止日期
                    if (deadline.getTime() === today.getTime()) {
                        // 创建今天期限的通知项
                        const todayItem = createUrgentNotificationItem(notification, type, '今天');
                        todayContainer.appendChild(todayItem);
                    } else if (deadline.getTime() === tomorrow.getTime()) {
                        // 创建明天期限的通知项
                        const tomorrowItem = createUrgentNotificationItem(notification, type, '明天');
                        tomorrowContainer.appendChild(tomorrowItem);
                    }
                }
            });
        });

        // 显示模态框
        document.getElementById('urgent-modal').style.display = 'block';
    }

    // 创建紧急提醒通知项
    function createUrgentNotificationItem(notification, type, timeText) {
        const item = document.createElement('div');
        item.className = 'urgent-item';

        // 创建标题
        const title = document.createElement('div');
        title.className = 'urgent-title';
        title.textContent = notification.title;
        item.appendChild(title);

        // 创建类型标签
        const typeLabel = document.createElement('div');
        typeLabel.className = 'urgent-type';
        typeLabel.style.fontSize = '12px';
        typeLabel.style.color = '#666';
        typeLabel.style.marginBottom = '5px';

        let typeText = '';
        switch(type) {
            case 'competition': typeText = '比赛通知'; break;
            case 'activity': typeText = '二课活动通知'; break;
            case 'certificate': typeText = '证书通知'; break;
            case 'assignment': typeText = '作业通知'; break;
        }
        typeLabel.textContent = typeText;
        item.appendChild(typeLabel);

        // 创建截止时间
        const deadline = document.createElement('div');
        deadline.className = 'urgent-deadline';
        deadline.textContent = `${timeText}截止: ${formatDate(new Date(notification.deadline))}`;
        item.appendChild(deadline);

        return item;
    }

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
    let isExpired = false;

    // 只有在有截止时间的情况下才检查是否逾期
    if (notification.deadline) {
        const deadline = new Date(notification.deadline);
        isExpired = deadline <= now;
    }

    // 创建通知项容器
    const item = document.createElement('div');
    item.className = 'notification-item';
    if (isExpired) item.classList.add('expired');

    // 创建通知头部
    const header = document.createElement('div');
    header.className = 'notification-header';

    // 创建标题容器
    const titleContainer = document.createElement('div');
    titleContainer.className = 'notification-title-container';

    // 创建标题
    const title = document.createElement('div');
    title.className = 'notification-title';
    title.textContent = notification.title;
    titleContainer.appendChild(title);

    // 创建日期标签（如果有截止时间）
    if (notification.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const deadlineDate = new Date(notification.deadline);
        deadlineDate.setHours(0, 0, 0, 0);

        if (deadlineDate.getTime() === today.getTime()) {
            const dateTag = document.createElement('span');
            dateTag.className = 'date-tag date-today';
            dateTag.textContent = '今天期限';
            titleContainer.appendChild(dateTag);
        } else if (deadlineDate.getTime() === tomorrow.getTime()) {
            const dateTag = document.createElement('span');
            dateTag.className = 'date-tag date-tomorrow';
            dateTag.textContent = '明天期限';
            titleContainer.appendChild(dateTag);
        }
    }

    // 创建截止时间（如果有）
    const deadlineDiv = document.createElement('div');
    deadlineDiv.className = 'notification-deadline';
    if (notification.deadline) {
        deadlineDiv.textContent = '截止时间: ' + formatDate(new Date(notification.deadline));
    } else {
        deadlineDiv.textContent = '无截止时间';
    }

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
    header.appendChild(titleContainer);
    header.appendChild(deadlineDiv);
    header.appendChild(actions);

    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'notification-content';

    // 创建状态显示
    if (notification.status) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `notification-status status-${notification.status}`;

        let statusText = '';
        switch(notification.status) {
            case 'ongoing': statusText = '进行中'; break;
            case 'completed': statusText = '完成'; break;
            case 'overdue': statusText = '逾期'; break;
            case 'abandoned': statusText = '放弃'; break;
            case 'waiting': statusText = '等待'; break;
            default: statusText = notification.status;
        }

        statusDiv.textContent = statusText;
        content.appendChild(statusDiv);

        // 如果是等待状态，显示等待描述
        if (notification.status === 'waiting' && notification.waitingDescription) {
            const waitingDesc = document.createElement('div');
            waitingDesc.className = 'waiting-description';
            waitingDesc.textContent = notification.waitingDescription;
            content.appendChild(waitingDesc);
        }
    }

    // 创建内容文本（如果有）
    if (notification.content) {
        const contentText = document.createElement('p');
        // 保留换行符，使用whiteSpace: pre-line样式
        contentText.style.whiteSpace = 'pre-line';
        contentText.textContent = notification.content;
        content.appendChild(contentText);
    }

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
    if (notification.links && notification.links.length > 0) {
        const linksDiv = document.createElement('div');
        linksDiv.className = 'notification-links';

        notification.links.forEach((link, index) => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item-display';

            // 创建链接按钮
            const linkButton = document.createElement('a');
            linkButton.className = 'link-button';
            linkButton.href = link.url;
            linkButton.target = '_blank';
            linkButton.textContent = `链接${index + 1}`;
            linkButton.title = link.url; // 添加悬浮提示显示URL
            linkItem.appendChild(linkButton);

            // 创建嵌入显示按钮
            const embedToggle = document.createElement('button');
            embedToggle.className = 'embed-toggle';
            embedToggle.textContent = '嵌入显示';
            embedToggle.addEventListener('click', function() {
                showEmbedWindow(link.url, link.title || `链接${index + 1}`);
            });
            linkItem.appendChild(embedToggle);

            linksDiv.appendChild(linkItem);
        });

        content.appendChild(linksDiv);
    }

    // 如果有文件，创建文件区域
    if (notification.files && notification.files.length > 0) {
        const filesDiv = document.createElement('div');
        filesDiv.className = 'notification-files';

        notification.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item-display';

            // 创建文件下载链接
            const fileLink = document.createElement('a');
            fileLink.className = 'file-link';
            fileLink.href = file.data;
            fileLink.download = file.name;
            fileLink.textContent = file.name;
            fileItem.appendChild(fileLink);

            filesDiv.appendChild(fileItem);
        });

        content.appendChild(filesDiv);
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
    const linksContainer = document.getElementById('links-container');
    const filesContainer = document.getElementById('files-container');

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
    document.getElementById('notification-deadline').value = notification.deadline || '';

    // 设置状态
    const statusSelect = document.getElementById('notification-status');
    statusSelect.value = notification.status || 'ongoing';

    // 设置等待描述
    const waitingDescription = document.getElementById('waiting-description');
    const waitingDescriptionGroup = document.getElementById('waiting-description-group');
    waitingDescription.value = notification.waitingDescription || '';

    if (notification.status === 'waiting') {
        waitingDescriptionGroup.style.display = 'block';
    } else {
        waitingDescriptionGroup.style.display = 'none';
    }

    // 清空并填充链接
    linksContainer.innerHTML = '';

    if (notification.links && notification.links.length > 0) {
        notification.links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            linkItem.innerHTML = `
                <input type="url" class="notification-link" value="${link.url}" placeholder="https://example.com">
                <input type="text" class="link-title" value="${link.title || ''}" placeholder="链接标题（可选）">
                <button type="button" class="remove-link-btn">删除</button>
            `;
            linksContainer.appendChild(linkItem);

            // 添加删除按钮事件
            linkItem.querySelector('.remove-link-btn').addEventListener('click', function() {
                linkItem.remove();
            });
        });
    } else {
        // 如果没有链接，添加一个空链接项
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <input type="url" class="notification-link" placeholder="https://example.com">
            <input type="text" class="link-title" placeholder="链接标题（可选）">
            <button type="button" class="remove-link-btn">删除</button>
        `;
        linksContainer.appendChild(linkItem);

        // 添加删除按钮事件
        linkItem.querySelector('.remove-link-btn').addEventListener('click', function() {
            linkItem.remove();
        });
    }

    // 清空并填充文件
    filesContainer.innerHTML = '';

    if (notification.files && notification.files.length > 0) {
        notification.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div>当前文件: ${file.name}${file.isPrivate ? ' (隐私)' : ''}</div>
                <input type="file" class="notification-file">
                <label class="file-privacy-label">
                    <input type="checkbox" class="file-privacy" ${file.isPrivate ? 'checked' : ''}>
                    隐私文件
                </label>
                <button type="button" class="remove-file-btn">删除</button>
            `;
            filesContainer.appendChild(fileItem);

            // 添加删除按钮事件
            fileItem.querySelector('.remove-file-btn').addEventListener('click', function() {
                fileItem.remove();
            });
        });
    } else {
        // 如果没有文件，添加一个空文件项
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <input type="file" class="notification-file">
            <button type="button" class="remove-file-btn">删除</button>
        `;
        filesContainer.appendChild(fileItem);

        // 添加删除按钮事件
        fileItem.querySelector('.remove-file-btn').addEventListener('click', function() {
            fileItem.remove();
        });
    }

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

// 切换iframe显示（保留兼容性）
function toggleIframe(notificationItem, linkIndex) {
    // 如果指定了链接索引，只切换对应的iframe
    if (linkIndex !== undefined) {
        const iframes = notificationItem.querySelectorAll('.notification-iframe');
        if (iframes[linkIndex]) {
            iframes[linkIndex].style.display = iframes[linkIndex].style.display === 'block' ? 'none' : 'block';
        }
    } else {
        // 兼容旧版本，切换第一个iframe
        const iframe = notificationItem.querySelector('.notification-iframe');
        if (iframe) {
            iframe.style.display = iframe.style.display === 'block' ? 'none' : 'block';
        }
    }
}

// 显示嵌入窗口
function showEmbedWindow(url, title) {
    // 创建模态框
    const embedModal = document.createElement('div');
    embedModal.className = 'embed-modal';
    embedModal.style.position = 'fixed';
    embedModal.style.top = '0';
    embedModal.style.left = '0';
    embedModal.style.width = '100%';
    embedModal.style.height = '100%';
    embedModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    embedModal.style.zIndex = '1000';
    embedModal.style.display = 'flex';
    embedModal.style.justifyContent = 'center';
    embedModal.style.alignItems = 'center';

    // 创建内容容器
    const embedContainer = document.createElement('div');
    embedContainer.className = 'embed-container';
    embedContainer.style.width = '80%';
    embedContainer.style.height = '80%';
    embedContainer.style.backgroundColor = 'white';
    embedContainer.style.borderRadius = '8px';
    embedContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    embedContainer.style.position = 'relative';
    embedContainer.style.display = 'flex';
    embedContainer.style.flexDirection = 'column';

    // 创建标题栏
    const headerBar = document.createElement('div');
    headerBar.className = 'embed-header';
    headerBar.style.padding = '15px';
    headerBar.style.backgroundColor = '#4a6cf7';
    headerBar.style.color = 'white';
    headerBar.style.display = 'flex';
    headerBar.style.justifyContent = 'space-between';
    headerBar.style.alignItems = 'center';
    headerBar.style.borderRadius = '8px 8px 0 0';

    // 创建标题
    const headerTitle = document.createElement('div');
    headerTitle.textContent = title;
    headerTitle.style.fontWeight = 'bold';
    headerBar.appendChild(headerTitle);

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', function() {
        document.body.removeChild(embedModal);
    });
    headerBar.appendChild(closeButton);

    // 创建iframe容器
    const iframeContainer = document.createElement('div');
    iframeContainer.style.flex = '1';
    iframeContainer.style.padding = '15px';
    iframeContainer.style.overflow = 'auto';
    iframeContainer.style.minHeight = '0'; /* 确保flex子元素可以缩小 */

    // 创建iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.minHeight = '100%'; /* 使用min-height而不是height */
    iframe.style.border = 'none';
    iframe.style.borderRadius = '4px';
    iframeContainer.appendChild(iframe);

    // 组装模态框
    embedContainer.appendChild(headerBar);
    embedContainer.appendChild(iframeContainer);
    embedModal.appendChild(embedContainer);

    // 添加到页面
    document.body.appendChild(embedModal);

    // 点击模态框外部关闭
    embedModal.addEventListener('click', function(e) {
        if (e.target === embedModal) {
            document.body.removeChild(embedModal);
        }
    });
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
