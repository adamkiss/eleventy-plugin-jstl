console.log('complex2', props, children)
return html`
<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
</head>
<body>
	<h2>${props.title}</h2>
	<main>${children}</main>
</body>
</html>
`
