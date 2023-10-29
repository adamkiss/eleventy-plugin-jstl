//---
title: Page with async data
//---

return html`
    <h1>${ title }</h1>
    <p>${ await AsyncData() }</p>
`
