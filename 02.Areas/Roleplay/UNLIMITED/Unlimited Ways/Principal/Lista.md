---
date: 2025-01-28T18:17:30.977Z
tags: 
- card 

link: https://trello.com/c/yB9G9nB8/305-lista 

progress: '`$= const tasks = dv.page("Lista").file.tasks; dv.span(tasks.filter(t => t.completed).length + "/" + tasks.length);`'
---
# Lista
```dataview
LIST without ID
	"<progress value='" + (length(filter(this.file.tasks.completed, (t) => t = true)) / length(this.file.tasks)) * 100 + "' max='100'></progress>" + "<br>" + round((length(filter(this.file.tasks.completed, (t) => t = true)) / length(this.file.tasks)) * 100) + "% completed"
FROM "trello2obsidian"
LIMIT 1
```



## Por hacer
