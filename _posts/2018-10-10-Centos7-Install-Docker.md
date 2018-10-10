---
layout: post
title:  "[系统运维]Centos7安装Docker"
date:   2018-10-10 10:46
categories: jekyll
permalink: /archivers/Centos7-Install-Docker
---

 1.使用 root 权限登录 Centos。确保 yum 包更新到最新。
 
 <code>  $ sudo yum update</code> 

 2.卸载旧版本(如果安装过旧版本的话)
 
 <code> $ sudo yum remove docker  docker-common docker-selinux docker-engine </code> 

 3.安装需要的软件包， yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的
 
 <code>  $ sudo yum install -y yum-utils device-mapper-persistent-data lvm2 </code> 
 
 4.设置yum源
 
 <code>  $ sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo </code> 


 5.可以查看所有仓库中所有docker版本，并选择特定版本安装
 
 <code>  $ sudo yum list docker-ce --showduplicates | sort -r </code> 

 6.安装docker
 
 <code>  $ sudo yum install <FQPN>  #例如：sudo yum install docker-ce-18.06.1.ce-3.el7
 
 <code>  $ sudo yum install docker-ce  #由于repo中默认只开启stable仓库，故这里安装的是最新稳定版18.06.1.ce-3.el7</code> 

 7.启动并加入开机启动
 
 <code>  $ sudo systemctl start docker </code> 
 
 <code>  $ sudo systemctl enable docker </code> 

8.验证安装是否成功(有client和service两部分表示docker安装启动都成功了)

<code>  $ docker version </code> 
