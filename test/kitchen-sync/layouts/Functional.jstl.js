---
layout: 'prepend-php'
php: |
    include __DIR __ . 'hello-world.php';
    $multiline = 'not-broken';
---

return html`
    <title>${title}</title>
    <body ...${props}>${children}</body>
`
