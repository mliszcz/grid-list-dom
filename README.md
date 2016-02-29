# grid-list-dom

A DOM layer for [GridList](https://github.com/hootsuite/grid). Like
jQuery plugin (`$.fn.gridList`), but better:
* no jQuery madness
* based on [CSS Grid Layout](https://www.w3.org/TR/css-grid-1/)
* uses native HTML Drag and Drop API

# Examples

```html
<div class="grid" id="grid"></div>
```

```javascript
const gridRoot = document.getElementById('grid')

const grid = new window.GridListDOM(gridRoot, {
  direction: 'vertical',
  lanes: 6
})

const item1 = document.createElement('div')
grid.appendGridElement(item1, {w: 2, h: 3, x: 1, y: 0})
```

# API

```javascript
/**
 * @param {HTMLElement} rootElement
 * @param {Object} options
 */
constructor (rootElement, options)
```

```javascript
/**
 * Adds node to the grid.
 * @public
 * @param {HTMLElement} node
 * @param {{x: number, y: number, w: number, h: number}} position
 */
appendGridElement(node, position)
```

```javascript
/**
 * Removes node from the grid.
 * @public
 * @param {HTMLElement} node
 */
removeGridElement (node)
```

```javascript
/**
 * Resizes the node.
 * @public
 * @param {HTMLElement} node
 * @param {{w: number, h: number}} size
 */
resizeGridElement (node, size)
```
