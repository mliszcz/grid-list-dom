(function (window) {
'use strict'

const Z_IDX = {
  CELL_FRONT: 30,
  ITEM: 20,
  CELL_BACK: 10
}

const CSS_CLASS = {
  CELL: 'gld--grid-cell',
  CELL_OVER: 'gld--grid-cell-over',
  ITEM_DRAGGING: 'gld--grid-item-dragging',
}

const DIRECTION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
}

const targetCellPos = Symbol()
const currentDrag = Symbol()

/**
 * Creates event handlers, bound to the given instance of GridListDOM.
 * @param {GridListDOM} gridListDOM
 * @return {Object}
 */
function createBoundEventHandlers (gridListDOM) {
  return {

    /**
     * Handles drag-start on element.
     * The target is the drag handle, not the element being dragged.
     * @param {DragEvent} event
     */
    onElementDragStart: function (event) {

      this.classList.add(CSS_CLASS.ITEM_DRAGGING)

      event.dataTransfer.setDragImage(this, 0, 0)
      event.dataTransfer.setData('text/html', '') // any payload is required
      event.dataTransfer.effectAllowed = 'move'

      // store item for reference when drag enters target cell
      gridListDOM[currentDrag] = gridListDOM.gridList.items.find(e => {
        return e.element === this
      })

      // pull target cells to front (for drag-enter consumption)
      // NOTE: timeout is required by Chrome
      // FIXME: find better way
      setTimeout(() => cellLayerToFront(gridListDOM.dom.cells), 0)
    },

    /**
     * Handles drag-end on element.
     * @param {DragEvent} event
     */
    onElementDragEnd: function (event) {
      this.classList.remove(CSS_CLASS.ITEM_DRAGGING)
      cellLayerToBack(gridListDOM.dom.cells)
      gridListDOM.reconstructTargetCells()
    },

    /**
     * Handle drag-enter on target cell.
     * Element is moved physically to current target cell.
     * @param {DragEvent} event
     */
    onTargetCellDragEnter: function (event) {

      const targetCell = event.target

      targetCell.classList.add(CSS_CLASS.CELL_OVER)

      const { col, row } = targetCell[targetCellPos]
      const item = gridListDOM[currentDrag] // gridList entry node being dragged

      if (!item) {
        return
      }

      gridListDOM.gridList.moveItemToPosition(item, [col, row])
      gridListDOM.cssRelayoutItems()
    },

    /**
     * Handle drag-leave on target cell.
     * @param {DragEvent} event
     */
    onTargetCellDragLeave: function (event) {
      event.target.classList.remove(CSS_CLASS.CELL_OVER)
    },

    /**
     * Handle drag-over on target cell.
     * Just consumes event and prevents default.
     * @param {DragEvent} event
     */
    onTargetCellDragOver: function (event) {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault() // prevents feedback-image returning to the origin
    },

    /**
     * Handle resize of grid container. Lanes are recalculated dynamically,
     * assuming that cell size should not change.
     * This handler is not used. Instead it is exposed to the user as a public
     * property.
     * @param {Event} event
     */
    onGridContainerResize: function (event) {

      const node = gridListDOM.dom.root
      const style = window.getComputedStyle(node)

      const isVertical = gridListDOM.options.isVertical

      const cellSize = (isVertical ? [
        style['grid-auto-columns'],
        style['grid-column-gap']
      ] : [
        style['grid-auto-rows'],
        style['grid-row-gap']
      ]).map(parseFloat).reduce((x,y) => x + y)

      const totalSize = isVertical ? node.clientWidth : node.clientHeight
      const lanes = parseInt(totalSize / cellSize, 10)

      gridListDOM.resizeGrid(lanes)
    }
  }
}

/**
 * Places element on the grid by modifying CSS.
 * @param {HTMLElement} element
 * @param {{x: number, y: number, w: number, h: number, z: number}} position
 */
function cssPlaceElement (element, position) {
  Object.assign(element.style, {
    gridColumn: `${position.x+1} / span ${position.w}`,
    gridRow: `${position.y+1} / span ${position.h}`,
    zIndex: position.z
  })
}

/**
 * Creates new target cell.
 * @param {Object} events
 * @return {HTMLElement}
 */
function createTargetCell (events) {
  const cell = window.document.createElement('div')
  cell.addEventListener('dragenter', events.onTargetCellDragEnter)
  cell.addEventListener('dragleave', events.onTargetCellDragLeave)
  cell.addEventListener('dragover', events.onTargetCellDragOver)
  cell.classList.add(CSS_CLASS.CELL)
  return cell
}

/**
 * Updates position of target cell.
 * @param {HTMLElement} cell
 * @param {number} col
 * @param {number} col
 */
function positionTargetCell (cell, col, row) {
  cell[targetCellPos] = { col, row }
  cssPlaceElement(cell, { x: col, y: row, w: 1, h: 1, z: Z_IDX.CELL_BACK })
}

/**
 * @param {Array<HTMLElement>} cells
 */
function cellLayerToFront (cells) {
  cellLayerSetZIndex(cells, Z_IDX.CELL_FRONT)
}

/**
 * @param {Array<HTMLElement>} cells
 */
function cellLayerToBack (cells) {
  cellLayerSetZIndex(cells, Z_IDX.CELL_BACK)
}

/**
 * @param {Array<HTMLElement>} cells
 * @param {number} zIndex
 */
function cellLayerSetZIndex (cells, zIndex) {
  cells.forEach(cell => cell.style.zIndex = zIndex)
}

class GridListDOM {

  /**
   * @param {HTMLElement} rootElement
   * @param {Object} options
   */
  constructor (rootElement, options) {

    Object.defineProperty(options, 'isVertical', {
      get: function () { return this.direction === DIRECTION.VERTICAL }
    })

    /** @private */
    this.dom = {
      root: rootElement,
      cells: []
    }

    /** @private */
    this.options = options

    /** @private */
    this.gridList = new GridList([], options)

    /** @private */
    this.events = createBoundEventHandlers(this)

    /** @public */
    this.onGridContainerResize = this.events.onGridContainerResize

    this.resizeGrid()
  }

  /**
   * Updates position of each element according to the grid setup.
   * @private
   */
  cssRelayoutItems () {
    this.gridList.items.forEach(({ element, x, y, w, h }) => {
      cssPlaceElement(element, { x, y, w, h, z: Z_IDX.ITEM })
    })
  }

  /**
   * Reconfigures grid with new options.
   * @param {Object} newOptions
   * @public
   */
  reinitializeGrid (newOptions = {}) {
    Object.assign(this.options, newOptions)
    this.gridList = new GridList(this.gridList.items, this.options)
    this.resizeGrid()
  }

  /**
   * Adds node to the grid.
   * @param {HTMLElement} node
   * @param {{x: number, y: number, w: number, h: number}} position
   * @public
   */
  appendGridElement(node, position) {

    const item = Object.assign({}, position, { element: node })
    this.gridList.items.push(item)

    node.addEventListener('dragstart', this.events.onElementDragStart, true)
    node.addEventListener('dragend', this.events.onElementDragEnd)
    this.dom.root.appendChild(node)

    this.resizeGrid()
  }

  /**
   * Removes node from the grid.
   * @param {HTMLElement} node
   * @public
   */
  removeGridElement (node) {

    const index = this.gridList.items.findIndex(e => e.element === node)

    if (index > -1) {
      this.gridList.items.splice(index, 1)
      this.dom.root.removeChild(node)
      this.resizeGrid()
    }
  }

  /**
   * Resizes the node.
   * @param {HTMLElement} node
   * @param {{w: number, h: number}} size
   * @public
   */
  resizeGridElement (node, size) {

    const item = this.gridList.items.find(e => e.element === node)

    if (item) {
      this.gridList.resizeItem(item, size)
      this.resizeGrid()
    }
  }

  /**
   * Resizes the grid. Called whenever element is added.
   * If called without arguments, size remains the same
   * and items are repositioned and collisions are resolved.
   * @param {number} lanes
   * @public
   */
  resizeGrid (lanes) {

    this.options.lanes = lanes || this.options.lanes
    this.gridList.resizeGrid(this.options.lanes)

    this.cssRelayoutItems()
    this.reconstructTargetCells()
  }

  /**
   * Recreates and lays-out target cells.
   * @private
   */
  reconstructTargetCells () {

    this.dom.cells.forEach(cell => this.dom.root.removeChild(cell))
    this.dom.cells = []

    const lanes = this.options.lanes
    const perp = this.gridList.grid.length + 1
    const [cols, rows] = this.options.isVertical ? [lanes, perp] : [perp, lanes]

    for (let col = 0; col < cols; ++col) {
      for (let row = 0; row < rows; ++row) {
        const cell = createTargetCell(this.events)
        positionTargetCell(cell, col, row)
        this.dom.root.appendChild(cell)
        this.dom.cells.push(cell)
      }
    }
  }
}

window.GridListDOM = GridListDOM

})(window)
