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

# Installation

Install via npm:

```
npm install --save grid-list-dom
```

And include in your project:

```
<script type="text/javascript" src="node_modules/grid-list/src/gridList.js"></script>
<script type="text/javascript" src="node_modules/grid-list-dom/dist/grid-list-dom.js"></script>
```

# API

## `GridListDOM`

```javascript
/**
 * @param {HTMLElement} rootElement
 * @param {Object} options
 */
constructor (rootElement, options)
```

## `appendGridElement`

```javascript
/**
 * Adds node to the grid.
 * @param {HTMLElement} node
 * @param {{x: number, y: number, w: number, h: number}} position
 * @public
 */
appendGridElement(node, position)
```

## `removeGridElement`

```javascript
/**
 * Removes node from the grid.
 * @param {HTMLElement} node
 * @public
 */
removeGridElement (node)
```

## `resizeGridElement`

```javascript
/**
 * Resizes the node.
 * @param {HTMLElement} node
 * @param {{w: number, h: number}} size
 * @public
 */
resizeGridElement (node, size)
```

## `resizeGrid`

```javascript
/**
 * Resizes the grid. Called whenever element is added.
 * If called without arguments, size remains the same
 * and items are repositioned and collisions are resolved.
 * @param {number} lanes
 * @public
 */
resizeGrid (lanes)
```
