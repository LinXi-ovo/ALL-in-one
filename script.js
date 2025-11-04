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
