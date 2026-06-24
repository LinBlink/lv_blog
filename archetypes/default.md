+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
categories = ["未分类"]
tags = [""]
[cover]
  image = "https://loremflickr.com/500/200/{{ .File.ContentBaseName }}"
+++
