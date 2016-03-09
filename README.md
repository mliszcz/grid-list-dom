# grid-list-dom

A DOM layer for [GridList](https://github.com/hootsuite/grid). Like
jQuery plugin (`$.fn.gridList`), but better:
* no jQuery madness
* based on [CSS Grid Layout](https://www.w3.org/TR/css-grid-1/)
* uses native HTML Drag and Drop API
* available as a Web Component

# Demo

Requires ES2015-compatible browser and support for Grid Layout.

* Firefox: enable `layout.css.grid.enabled`
* Chrome: enable `experimental web platform features`

[Demo link](https://rawgit.com/mliszcz/grid-list-dom/master/index.html)

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

```html
<script type="text/javascript" src="node_modules/grid-list/src/gridList.js"></script>
<script type="text/javascript" src="node_modules/grid-list-dom/dist/grid-list-dom.js"></script>
```

# Configuration

GridListDOM constructor takes two arguments:
* `rootElement: HTMLElement` - the element which will host the grid;
* `options: Object` - options passed directly to the `GridList`.

Two important options are:
* `direction`: `'vertical'` or `horizontal` - indicates direction in which
  the grid grows;
* `lanes`: fixed number of rows / columns (depends on direction).

You are responsible for:
* styling the grid host with Grid Layout properties, e.g.:

  ```css
  .grid {
    display: grid;
    grid-auto-columns: 200px;
    grid-auto-rows: 200px;
    grid-gap: 20px;
  }
  ```
  **Implicit grid is required for `onGridContainerResize` callback to work**;

* styling grid's parents, so it may grow in selected direction (see the Demo
  source for an example);

* adding `draggable` attribute to each element (or it's child) that is added
  to the grid. Draggable elements will become *handles*. If you want to disable
  dragging, remove this attribute.

GridListDOM exposes a single property, `onGridContainerResize`. It is a
callback that you may attach to the window's `resize` event, in order to
resize the grid dynamically. Grid will then fill maximum available space
(lanes will be adjusted).

For list of available methods, see the [API section](#api).

# HTMLGridListElement

`HTMLGridListElement` is a self-contained Web Component that hosts the grid.
Drop it onto your page and configure via attributes (only `direction` and
`lanes` can be controlled).

It is registered under the `x-grid-list` name.

Underlying `GridListDOM` API is exposed directly on the `HTMLGridListElement`
prototype.

Example:

```html
<x-grid-list direction="horizontal" lanes="5"></x-grid-list>
```

```javascript
const grid = document.querySelector('x-grid-list')
grid.setAttribute('lanes', '7')
grid.appendGridElement(...)
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

## `reinitializeGrid`

```javascript
/**
 * Reconfigures grid with new options.
 * @param {Object} newOptions
 * @public
 */
reinitializeGrid (newOptions = {})
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
