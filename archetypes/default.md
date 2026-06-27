+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
categories = ["未分类"]
tags = [""]
[cover]
  image = "https://devtool.tech/api/placeholder/600/199?text={{ replace .File.ContentBaseName "-" " " | title }}&color=black&fontSize=30&fontFamily=%E5%BE%AE%E8%BD%AF%E9%9B%85%E9%BB%91"
+++