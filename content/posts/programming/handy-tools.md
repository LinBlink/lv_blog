+++
date = '2026-06-24T22:51:14+08:00'
draft = true
title = '程序员快速参考小手册'
categories = ["编程"]
tags = ["快速参考"]
[cover]
  image = "https://loremflickr.com/500/200/dictionary"
+++

## 反向代理（Nginx）

### Nginx 一键部署（Linux）

```bash
#!/bin/bash
# ================================================
# Nginx 一键安装脚本
# 支持: Ubuntu/Debian / CentOS/RHEL/Rocky/Alma
# 作者: LOCRIAN_V
# ================================================

set -e

# -------- 颜色输出 --------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

# -------- 检查 root --------
if [[ $EUID -ne 0 ]]; then
  error "请使用 root 或 sudo 运行此脚本"
fi

# -------- 检测发行版 --------
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
  else
    error "无法识别操作系统，请手动安装 Nginx"
  fi
}

# -------- 安装函数 --------
install_nginx_debian() {
  info "检测到 Debian/Ubuntu 系统 (${OS} ${OS_VERSION})"
  info "更新软件包列表..."
  apt-get update -y

  info "安装依赖..."
  apt-get install -y curl gnupg2 ca-certificates lsb-release debian-archive-keyring

  info "添加 Nginx 官方仓库..."
  curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    -o /usr/share/keyrings/nginx-archive-keyring.gpg

  # 根据发行版选择仓库
  if [[ "$OS" == "ubuntu" ]]; then
    CODENAME=$(lsb_release -cs)
    REPO_TYPE="ubuntu"
  else
    CODENAME=$(lsb_release -cs)
    REPO_TYPE="debian"
  fi

  echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
https://nginx.org/packages/${REPO_TYPE} ${CODENAME} nginx" \
    > /etc/apt/sources.list.d/nginx.list

  # 仓库优先级
  echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900" \
    > /etc/apt/preferences.d/99nginx

  apt-get update -y
  apt-get install -y nginx
}

install_nginx_rhel() {
  info "检测到 RHEL/CentOS/Rocky/Alma 系统 (${OS} ${OS_VERSION})"
  MAJOR_VER=$(echo "$OS_VERSION" | cut -d. -f1)

  info "添加 Nginx 官方仓库..."
  cat > /etc/yum.repos.d/nginx.repo <<EOF
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/${MAJOR_VER}/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
EOF

  info "安装 Nginx..."
  if command -v dnf &>/dev/null; then
    dnf install -y nginx
  else
    yum install -y nginx
  fi
}

# -------- 配置防火墙 --------
configure_firewall() {
  info "配置防火墙放行 80/443..."

  if command -v ufw &>/dev/null; then
    ufw allow 'Nginx Full' 2>/dev/null || ufw allow 80/tcp && ufw allow 443/tcp
    success "UFW 已放行 80/443"
  elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    success "firewalld 已放行 80/443"
  else
    warn "未检测到 ufw/firewalld，请手动放行 80/443 端口"
  fi
}

# -------- 启动并设置开机自启 --------
enable_nginx() {
  info "启动 Nginx 并设置开机自启..."
  systemctl enable nginx
  systemctl start nginx
  success "Nginx 已启动"
}

# -------- 打印结果 --------
print_result() {
  NGINX_VERSION=$(nginx -v 2>&1 | awk -F'/' '{print $2}')
  IP=$(hostname -I | awk '{print $1}')

  echo ""
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}  Nginx 安装成功！${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo -e "  版本:        ${CYAN}${NGINX_VERSION}${NC}"
  echo -e "  访问地址:    ${CYAN}http://${IP}${NC}"
  echo -e "  配置文件:    ${CYAN}/etc/nginx/nginx.conf${NC}"
  echo -e "  站点目录:    ${CYAN}/etc/nginx/conf.d/${NC}"
  echo -e "  默认网站根:  ${CYAN}/usr/share/nginx/html${NC}"
  echo -e "  日志目录:    ${CYAN}/var/log/nginx/${NC}"
  echo ""
  echo -e "  常用命令:"
  echo -e "  ${YELLOW}systemctl start|stop|restart|status nginx${NC}"
  echo -e "  ${YELLOW}nginx -t${NC}   # 检查配置语法"
  echo -e "  ${YELLOW}nginx -s reload${NC}   # 热重载配置"
  echo -e "${GREEN}================================================${NC}"
}

# -------- 主流程 --------
main() {
  echo ""
  echo -e "${CYAN}========================================${NC}"
  echo -e "${CYAN}     Nginx 一键安装脚本 by LOCRIAN_V   ${NC}"
  echo -e "${CYAN}========================================${NC}"
  echo ""

  detect_os

  # 检查是否已安装
  if command -v nginx &>/dev/null; then
    warn "Nginx 已安装: $(nginx -v 2>&1)"
    read -p "是否重新安装？(y/N): " REINSTALL
    [[ "$REINSTALL" =~ ^[Yy]$ ]] || { info "跳过安装"; print_result; exit 0; }
  fi

  case "$OS" in
    ubuntu|debian)
      install_nginx_debian
      ;;
    centos|rhel|rocky|almalinux|ol)
      install_nginx_rhel
      ;;
    *)
      error "不支持的发行版: $OS，支持 Ubuntu/Debian/CentOS/RHEL/Rocky/Alma"
      ;;
  esac

  configure_firewall
  enable_nginx
  print_result
}

main "$@"
```

## 容器化与运维 (Docker)

### Docker 安装 (Linux)

```bash
# 下载官方安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh

# 运行脚本安装 Docker
sudo sh ./get-docker.sh

```

### 常用容器部署

#### MySQL

* **持久化数据卷创建：**
```bash
docker volume create mysql-data

```


* **常用启动参数提示：** `-d` (后台运行容器)

#### n8n (自动化工作流引擎)

* **持久化数据卷创建：**
```bash
docker volume create n8n_data

```


* **容器启动命令：**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e GENERIC_TIMEZONE="Asia/Shanghai" \
  -e TZ="Asia/Shanghai" \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -e N8N_RUNNERS_ENABLED=true \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

```



> 💡 **提示：** 生产环境建议将 `-it --rm`（交互式运行且退出后删除）替换为 `-d --restart always` 以保障后台常驻运行。

---

## 开发环境与语言 (Development Environment)

### Node.js (Linux 环境安装)

推荐使用 **NVM (Node Version Manager)** 进行版本管理，安装与验证步骤如下：

```bash
# 1. 下载并安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash

# 2. 刷新环境变量 (免重启 Shell)
\. "$HOME/.nvm/nvm.sh"

# 3. 安装指定版本的 Node.js (以 v24 为例)
nvm install 24

# 4. 验证安装结果
node -v  # 应输出 "v24.x.x"
npm -v   # 应输出对应的 npm 版本

```

---

## 其它常用命令 (Miscellaneous)

* `export`：用于在 Linux 中设置或导出环境变量。